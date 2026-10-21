import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fetch from "node-fetch";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import {
  hashPassword,
  verifyPassword,
  createToken,
  getSession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  requireAdmin,
  rateLimit
} from "./auth.js";

// =============================================
// 🗄️ MODELOS
// =============================================
const usuarioSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  nombre: { type: String, default: "" },
  passwordHash: { type: String, required: true },
  rol: { type: String, enum: ["admin", "user"], default: "user" },
  activo: { type: Boolean, default: true },
  fecha: { type: Date, default: Date.now }
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

const productoSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  nombre: String,
  dropiId: String,
  material: String,
  landing: String,
  creativos: String,
  pais: String,
  origen: String,
  estado: String,
  desarrollo: {
    avatar: Boolean,
    angulos: Boolean,
    creativos: Boolean,
    landing: Boolean
  },
  fecha: Date
});

const Producto = mongoose.model("Producto", productoSchema);

// Solo estos campos se pueden guardar/editar desde el navegador
const CAMPOS_PRODUCTO = [
  "nombre", "dropiId", "material", "landing", "creativos",
  "pais", "origen", "estado", "desarrollo", "fecha"
];

function limpiarProducto(body = {}) {
  const out = {};
  for (const k of CAMPOS_PRODUCTO) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

const idValido = (id) => mongoose.Types.ObjectId.isValid(id);

// =============================================
// 🔌 CONEXIÓN A MONGO + ADMIN INICIAL
// =============================================
async function crearAdminInicial() {
  const total = await Usuario.countDocuments();
  if (total > 0) return;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "⚠️  No hay usuarios. Configura ADMIN_EMAIL y ADMIN_PASSWORD en las variables de entorno " +
      "y reinicia para crear el administrador."
    );
    return;
  }

  const admin = await Usuario.create({
    email,
    nombre: "Administrador",
    passwordHash: hashPassword(password),
    rol: "admin"
  });

  // Los productos que ya existían (sin dueño) pasan al administrador
  const r = await Producto.updateMany(
    { owner: { $exists: false } },
    { $set: { owner: admin._id } }
  );

  console.log(`✅ Admin creado: ${email}. Productos asignados: ${r.modifiedCount}`);
}

console.log("Conectando a Mongo...");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Mongo conectado");
    await crearAdminInicial();
  })
  .catch(err => console.error("❌ Error Mongo:", err.message));

// =============================================
// 🚀 APP
// =============================================
const app = express();
const API_KEY = process.env.API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Render (y la mayoría de hostings) van detrás de un proxy
app.set("trust proxy", 1);
app.disable("x-powered-by");

// 🌐 CORS: solo orígenes permitidos (el frontend se sirve desde el mismo dominio,
// así que normalmente no hace falta ninguno). Ej: ALLOWED_ORIGINS=https://codropx.com
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Vary", "Origin");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Cabeceras básicas de seguridad
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json({ limit: "10mb" }));

// =============================================
// 📄 PÁGINAS: login es pública, la app requiere sesión
// =============================================
app.get(["/", "/index.html"], (req, res) => {
  if (!getSession(req)) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login.html", (req, res) => {
  if (getSession(req)) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.use(express.static(path.join(__dirname, "public"), { index: false }));

// =============================================
// 🔐 AUTH
// =============================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  key: req => `login:${req.ip}`,
  message: "Demasiados intentos de inicio de sesión. Espera 15 minutos."
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Escribe tu correo y contraseña." });
    }

    const user = await Usuario.findOne({ email });

    if (!user || !user.activo || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    setSessionCookie(res, createToken(user));
    res.json({ ok: true, user: { email: user.email, nombre: user.nombre, rol: user.rol } });
  } catch (err) {
    console.error("Error login:", err);
    res.status(500).json({ error: "Error iniciando sesión" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await Usuario.findById(req.user.uid).select("email nombre rol activo");
  if (!user || !user.activo) {
    clearSessionCookie(res);
    return res.status(401).json({ error: "Sesión inválida" });
  }
  res.json({ email: user.email, nombre: user.nombre, rol: user.rol });
});

app.put("/api/auth/password", requireAuth, async (req, res) => {
  try {
    const { actual, nueva } = req.body || {};
    if (!nueva || String(nueva).length < 8) {
      return res.status(400).json({ error: "La nueva contraseña debe tener mínimo 8 caracteres." });
    }
    const user = await Usuario.findById(req.user.uid);
    if (!user || !verifyPassword(String(actual || ""), user.passwordHash)) {
      return res.status(401).json({ error: "La contraseña actual no es correcta." });
    }
    user.passwordHash = hashPassword(String(nueva));
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("Error cambiando contraseña:", err);
    res.status(500).json({ error: "No se pudo cambiar la contraseña" });
  }
});

// Crear usuarios (solo admin) — para cuando abras la herramienta a tu equipo o a tu comunidad
app.post("/api/usuarios", requireAuth, requireAdmin, async (req, res) => {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();
    const password = String(req.body?.password || "");
    const nombre = String(req.body?.nombre || "");
    const rol = req.body?.rol === "admin" ? "admin" : "user";

    if (!email || password.length < 8) {
      return res.status(400).json({ error: "Correo y contraseña (mínimo 8 caracteres) son obligatorios." });
    }
    if (await Usuario.exists({ email })) {
      return res.status(409).json({ error: "Ese correo ya está registrado." });
    }

    const u = await Usuario.create({ email, nombre, rol, passwordHash: hashPassword(password) });
    res.json({ ok: true, usuario: { id: u._id, email: u.email, nombre: u.nombre, rol: u.rol } });
  } catch (err) {
    console.error("Error creando usuario:", err);
    res.status(500).json({ error: "No se pudo crear el usuario" });
  }
});

app.get("/api/usuarios", requireAuth, requireAdmin, async (req, res) => {
  const usuarios = await Usuario.find().select("email nombre rol activo fecha").sort({ fecha: 1 });
  res.json(usuarios);
});

// =============================================
// 🛡️ TODO LO DEMÁS DE /api REQUIERE SESIÓN
// =============================================
app.get("/api/test", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", requireAuth);

const iaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.IA_MAX_POR_MINUTO || 20),
  key: req => `ia:${req.user?.uid || req.ip}`,
  message: "Llegaste al límite de consultas de IA por minuto. Espera un momento."
});

// =============================================
// 🤖 IA (xAI)
// =============================================
app.post("/api/trends", iaLimiter, async (req, res) => {
  const { keyword, pais = "ALL" } = req.body || {};

  if (!keyword) {
    return res.status(400).json({ error: "Falta keyword" });
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning",
        messages: [
          {
            role: "system",
            content: "Responde SOLO JSON valido. Eres un analista senior de tendencias ecommerce."
          },
          {
            role: "user",
            content: `
Tema: "${keyword}"
Pais: "${pais}"

Devuelve EXACTAMENTE este JSON:
{
  "trend_data": [
    { "label": "Ene", "value": 20 },
    { "label": "Feb", "value": 25 },
    { "label": "Mar", "value": 30 },
    { "label": "Abr", "value": 28 },
    { "label": "May", "value": 35 },
    { "label": "Jun", "value": 40 },
    { "label": "Jul", "value": 32 },
    { "label": "Ago", "value": 30 },
    { "label": "Sep", "value": 31 },
    { "label": "Oct", "value": 33 },
    { "label": "Nov", "value": 36 },
    { "label": "Dic", "value": 42 }
  ]
}
`
          }
        ]
      })
    });

    const raw = await response.text();

    let parsedApi;
    try {
      parsedApi = JSON.parse(raw);
    } catch (e) {
      console.error("xAI devolvio no-JSON:", raw);
      return res.status(500).json({ error: "xAI devolvio respuesta invalida" });
    }

    if (!response.ok) {
      console.error("Error HTTP xAI:", parsedApi);
      return res.status(response.status).json({ error: "Error HTTP en xAI" });
    }

    const reply = parsedApi?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: "xAI no devolvio contenido" });
    }

    const jsonStart = reply.indexOf("{");
    const jsonEnd = reply.lastIndexOf("}");
    const clean = jsonStart !== -1 && jsonEnd !== -1
      ? reply.substring(jsonStart, jsonEnd + 1)
      : reply;

    let finalJson;
    try {
      finalJson = JSON.parse(clean);
    } catch (e) {
      console.error("No se pudo parsear JSON final:", clean);
      return res.status(500).json({ error: "JSON final invalido" });
    }

    return res.json(finalJson);

  } catch (err) {
    console.error("Error /api/trends:", err);
    return res.status(500).json({ error: "Error interno trends" });
  }
});

app.post("/api/ia", iaLimiter, async (req, res) => {
  const { prompt, image } = req.body || {};

  if (!prompt && !image) {
    return res.status(400).json({ error: "Falta el prompt" });
  }

  try {
    const userContent = [];

    if (prompt) {
      userContent.push({ type: "text", text: String(prompt) });
    }

    if (image) {
      userContent.push({ type: "image_url", image_url: { url: image } });
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning",
        messages: [
          {
            role: "system",
            content: "Eres un experto en marketing, análisis de producto y ecommerce."
          },
          {
            role: "user",
            content: userContent
          }
        ]
      })
    });

    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("xAI devolvió algo inválido:", raw);
      return res.status(500).json({ error: "Respuesta inválida de IA" });
    }

    if (!response.ok) {
      console.error("Error HTTP IA:", data);
      return res.status(response.status).json({ error: "Error HTTP en IA" });
    }

    res.json({
      reply: data?.choices?.[0]?.message?.content || "Sin respuesta"
    });

  } catch (error) {
    console.error("ERROR SERVER:", error);
    res.status(500).json({ error: "Error IA" });
  }
});

// =============================================
// 📦 PRODUCTOS (cada usuario ve solo los suyos)
// =============================================
app.post("/api/productos", async (req, res) => {
  try {
    const datos = limpiarProducto(req.body);
    if (!datos.fecha) datos.fecha = new Date();

    const nuevoProducto = await Producto.create({ ...datos, owner: req.user.uid });
    res.json({ ok: true, producto: nuevoProducto });
  } catch (err) {
    console.error("Error guardando producto:", err);
    res.status(500).json({ error: "No se pudo guardar el producto" });
  }
});

app.get("/api/productos", async (req, res) => {
  try {
    const filtro = { owner: req.user.uid };

    if (req.query.pais) {
      filtro.pais = String(req.query.pais);
    }

    const productos = await Producto.find(filtro).sort({ fecha: -1 });
    res.json(productos);
  } catch (err) {
    console.error("Error leyendo productos:", err);
    res.status(500).json({ error: "No se pudieron cargar los productos" });
  }
});

app.put("/api/productos/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: "ID inválido" });

    const productoActualizado = await Producto.findOneAndUpdate(
      { _id: id, owner: req.user.uid },
      { estado: String(req.body?.estado || "") },
      { new: true }
    );

    if (!productoActualizado) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ ok: true, producto: productoActualizado });
  } catch (err) {
    console.error("Error actualizando estado:", err);
    res.status(500).json({ error: "No se pudo actualizar el estado" });
  }
});

app.put("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: "ID inválido" });

    const productoActualizado = await Producto.findOneAndUpdate(
      { _id: id, owner: req.user.uid },
      limpiarProducto(req.body),
      { new: true }
    );

    if (!productoActualizado) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ ok: true, producto: productoActualizado });
  } catch (err) {
    console.error("Error editando producto:", err);
    res.status(500).json({ error: "No se pudo editar el producto" });
  }
});

app.delete("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: "ID inválido" });

    const r = await Producto.findOneAndDelete({ _id: id, owner: req.user.uid });
    if (!r) return res.status(404).json({ error: "Producto no encontrado" });

    res.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando producto:", err);
    res.status(500).json({ error: "No se pudo eliminar el producto" });
  }
});

// Cualquier otra ruta de /api que no exista
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ⚠️ ESTA RUTA SIEMPRE DEBE IR AL FINAL
app.use((req, res) => {
  if (!getSession(req)) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 PUERTO
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});
