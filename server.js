import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fetch from "node-fetch";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";





// 🔥 CONEXIÓN CORRECTA
console.log("Conectando a Mongo...");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo conectado"))
  .catch(err => console.error("❌ Error Mongo:", err));

// 🔥 MODELO
const productoSchema = new mongoose.Schema({
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

const app = express();

const API_KEY = process.env.API_KEY;

// 🔧 necesario para __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🌐 CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/trends", async (req, res) => {
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
      return res.status(500).json({
        error: "xAI devolvio respuesta invalida",
        raw
      });
    }

    if (!response.ok) {
      console.error("Error HTTP xAI:", parsedApi);
      return res.status(response.status).json({
        error: "Error HTTP en xAI",
        raw: parsedApi
      });
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
      return res.status(500).json({
        error: "JSON final invalido",
        raw: clean
      });
    }

    return res.json(finalJson);

  } catch (err) {
    console.error("Error /api/trends:", err);
    return res.status(500).json({
      error: "Error interno trends",
      detail: err.message
    });
  }
});



app.get("/api/test", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/ia", async (req, res) => {
  const { prompt, image } = req.body;

  try {
    const userContent = [];

    if (prompt) {
      userContent.push({
        type: "text",
        text: prompt
      });
    }

    if (image) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: image
        }
      });
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-4-vision-latest",
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

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Error HTTP en IA",
        raw: data
      });
    }

    res.json({
      reply: data?.choices?.[0]?.message?.content || "Sin respuesta"
    });

  } catch (error) {
    console.error("ERROR SERVER:", error);
    res.status(500).json({ error: "Error IA" });
  }
});

app.post("/api/productos", async (req, res) => {
  try {
    console.log("Recibido:", req.body);

    const nuevoProducto = await Producto.create(req.body);

    console.log("Guardado en Mongo:", nuevoProducto);

    res.json({ ok: true, producto: nuevoProducto });
  } catch (err) {
    console.error("Error guardando producto:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/productos", async (req, res) => {
  try {
    const filtro = {};

    if (req.query.pais) {
      filtro.pais = req.query.pais;
    }

    const productos = await Producto.find(filtro).sort({ fecha: -1 });
    res.json(productos);
  } catch (err) {
    console.error("Error leyendo productos:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/productos/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    );

    res.json({ ok: true, producto: productoActualizado });
  } catch (err) {
    console.error("Error actualizando estado:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({ ok: true, producto: productoActualizado });
  } catch (err) {
    console.error("Error editando producto:", err);
    res.status(500).json({ error: err.message });
  }
});

// ❌ ELIMINAR PRODUCTO
app.delete("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Producto.findByIdAndDelete(id);

    res.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando producto:", err);
    res.status(500).json({ error: err.message });
  }
});

// ⚠️ ESTA RUTA SIEMPRE DEBE IR AL FINAL
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 PUERTO
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});