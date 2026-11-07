// =============================================
// 🪧 COTIZADOR DE LETREROS — página pública /cotiza/:clave (se pone dentro de una página de Shopify)
// El cliente sube su logo → elige material, luz, dónde va y tamaño → la IA (Grok Imagine) le hace la maqueta
// → ve el precio al instante → pide por WhatsApp. Los precios los manejas en CoDropX → Cotizador.
// Frenos para que nadie gaste tu saldo: maquetas por persona al día y tope de dólares al mes (aparte del de Desarrollo).
// No se guardan datos personales del cliente: solo su logo, la maqueta y lo que eligió.
// =============================================
import crypto from "crypto";
import path from "path";
import mongoose from "mongoose";
import { rateLimit } from "./auth.js";
import { leerDataUrl } from "./modelo-imagenes.js";
import { pedirImagen, PRECIO_IMAGEN, PRECIO_REFERENCIA } from "./rutas-ia-imagenes.js";
import { limpiarConfig, cotizar, promptMaqueta, mensajeWhatsapp } from "./public/js/core/cotizador.js";

const MAX_GALERIA = 12;

const configSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true, unique: true },
  clave: { type: String, index: true, unique: true },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  galeria: { type: [mongoose.Schema.Types.Mixed], default: [] },     // { id (imagen), tipo: "trabajo" | "resena", titulo }
  gasto: { type: mongoose.Schema.Types.Mixed, default: {} },          // { mes: "2026-11", usd, maquetas }
  actualizado: { type: Date, default: Date.now }
});
export const CotizadorConfig = mongoose.model("CotizadorConfig", configSchema);

const imagenSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  tipo: { type: String, default: "logo" },        // logo · maqueta · trabajo · resena
  mime: String,
  datos: Buffer,
  creado: { type: Date, default: Date.now }
});
const CotizadorImagen = mongoose.model("CotizadorImagen", imagenSchema);

const cotizacionSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  logo: { type: mongoose.Schema.Types.ObjectId },
  maqueta: { type: mongoose.Schema.Types.ObjectId, default: null },
  eleccion: { type: mongoose.Schema.Types.Mixed, default: {} },
  total: Number, anticipo: Number, moneda: String,
  notas: { type: String, default: "" },
  pidio: { type: Boolean, default: false },        // le dio "Pedir por WhatsApp"
  creado: { type: Date, default: Date.now, index: true }
});
const Cotizacion = mongoose.model("Cotizacion", cotizacionSchema);

const mesActual = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" }).slice(0, 7);
const hoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
const nuevaClave = () => crypto.randomBytes(6).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || crypto.randomBytes(4).toString("hex");
const idValido = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

// Maquetas por persona (IP) en el día, en memoria
const porPersona = new Map();
setInterval(() => { const h = hoy(); for (const k of porPersona.keys()) if (!k.endsWith(h)) porPersona.delete(k); }, 36e5).unref();

async function configDe(owner) {
  let c = await CotizadorConfig.findOne({ owner });
  if (!c) {
    for (let i = 0; i < 5 && !c; i++) {
      try { c = await CotizadorConfig.create({ owner, clave: nuevaClave(), config: limpiarConfig({}) }); }
      catch (e) { if (e?.code !== 11000) throw e; c = await CotizadorConfig.findOne({ owner }); }
    }
  }
  return c;
}
const gastoDelMes = (c) => (c?.gasto?.mes === mesActual() ? { usd: Number(c.gasto.usd) || 0, maquetas: Number(c.gasto.maquetas) || 0 } : { usd: 0, maquetas: 0 });

export function registrarPaginaCotizador(app, { dirname }) {
  // La página: se puede mostrar dentro de Shopify (iframe), por eso se quita el bloqueo de marcos solo aquí
  app.get("/cotiza/:clave", (req, res) => {
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    res.sendFile(path.join(dirname, "public", "cotiza.html"));
  });
}

// Rutas públicas (sin sesión): van ANTES del login en server.js
export function registrarRutasCotizadorPublico(app) {
  const limiteMaqueta = rateLimit({ windowMs: 10 * 6e4, max: 8, message: "Muchas maquetas seguidas. Espera unos minutos." });
  const limiteGeneral = rateLimit({ windowMs: 6e4, max: 60 });

  app.get("/api/cotiza/:clave/config", limiteGeneral, async (req, res) => {
    try {
      const c = await CotizadorConfig.findOne({ clave: String(req.params.clave).slice(0, 20) }).lean();
      if (!c) return res.status(404).json({ error: "Este cotizador no existe" });
      const cfg = limpiarConfig(c.config);
      if (!cfg.activo) return res.status(404).json({ error: "El cotizador está apagado por ahora" });
      const { limites, ...publica } = cfg;
      const g = gastoDelMes(c);
      res.json({ ...publica, conMaqueta: limites.usdMes > g.usd + PRECIO_IMAGEN && limites.maquetasPorDia > 0, galeria: (c.galeria || []).map(x => ({ url: `/api/cotiza/img/${x.id}`, ...(x.idAntes ? { urlAntes: `/api/cotiza/img/${x.idAntes}`, real: x.real !== false } : {}), tipo: x.tipo, titulo: x.titulo || "" })) });
    } catch (err) { console.error("Cotizador config:", err); res.status(500).json({ error: "No se pudo abrir el cotizador" }); }
  });

  app.get("/api/cotiza/img/:id", limiteGeneral, async (req, res) => {
    try {
      if (!idValido(req.params.id)) return res.sendStatus(404);
      const im = await CotizadorImagen.findById(req.params.id).select("mime datos").lean();
      if (!im) return res.sendStatus(404);
      res.setHeader("Content-Type", im.mime || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.send(Buffer.isBuffer(im.datos) ? im.datos : Buffer.from(im.datos.buffer || im.datos));
    } catch { res.sendStatus(404); }
  });

  // Sube el logo, guarda la cotización y (si alcanza el tope) hace la maqueta con IA
  app.post("/api/cotiza/:clave/maqueta", limiteMaqueta, async (req, res) => {
    try {
      const c = await CotizadorConfig.findOne({ clave: String(req.params.clave).slice(0, 20) });
      if (!c) return res.status(404).json({ error: "Este cotizador no existe" });
      const cfg = limpiarConfig(c.config);
      if (!cfg.activo) return res.status(404).json({ error: "El cotizador está apagado por ahora" });
      const logo = leerDataUrl(req.body?.logo);
      if (!logo) return res.status(400).json({ error: "Sube tu logo en JPG, PNG o WEBP (máximo 3 MB)" });
      const q = cotizar(cfg, req.body?.eleccion || {});
      if (!q) return res.status(400).json({ error: "Elige el material" });

      const logoDoc = await CotizadorImagen.create({ owner: c.owner, tipo: "logo", mime: logo.tipo, datos: logo.datos });
      const cot = await Cotizacion.create({ owner: c.owner, logo: logoDoc._id, eleccion: { material: q.material.id, luz: q.luz?.id || "", ubicacion: q.ubicacion?.id || "", montaje: q.montaje?.id || "", ancho: q.ancho, alto: q.alto, cantidad: q.cantidad, complejidad: q.complejidad }, total: q.total, anticipo: q.anticipo, moneda: cfg.moneda });

      // ¿Puede hacer maqueta? Tope por persona al día y tope de gasto del mes
      const k = `${req.ip}|${hoy()}`;
      const usadas = porPersona.get(k) || 0;
      const g = gastoDelMes(c);
      const costo = PRECIO_IMAGEN + PRECIO_REFERENCIA;
      let aviso = "";
      if (usadas >= cfg.limites.maquetasPorDia) aviso = "Ya hiciste las maquetas de hoy. Te mostramos tu logo en la pared y el precio igual.";
      else if (g.usd + costo > cfg.limites.usdMes) aviso = "Las maquetas con IA están en pausa. Te mostramos tu logo en la pared y el precio igual.";
      if (aviso) return res.json({ cotizacion: String(cot._id), maqueta: null, aviso, total: q.total, anticipo: q.anticipo });

      porPersona.set(k, usadas + 1);
      const dataLogo = `data:${logo.tipo};base64,${logo.datos.toString("base64")}`;
      let r;
      try {
        r = await pedirImagen({ prompt: promptMaqueta(cfg, q), fotos: [dataLogo], aspecto: "4:3" });
      } catch (e) {
        porPersona.set(k, usadas);   // no cuenta si falló
        console.error("Cotizador: no se pudo hacer la maqueta:", e.message);
        return res.json({ cotizacion: String(cot._id), maqueta: null, aviso: "No pudimos hacer la maqueta en este momento. Te mostramos tu logo en la pared y el precio igual.", total: q.total, anticipo: q.anticipo });
      }
      const maq = await CotizadorImagen.create({ owner: c.owner, tipo: "maqueta", mime: r.tipo, datos: r.datos });
      await Cotizacion.updateOne({ _id: cot._id }, { $set: { maqueta: maq._id } });
      const gastado = PRECIO_IMAGEN + PRECIO_REFERENCIA * (r.referencias || 1);
      await CotizadorConfig.updateOne({ _id: c._id }, { $set: { gasto: { mes: mesActual(), usd: Math.round((g.usd + gastado) * 1000) / 1000, maquetas: g.maquetas + 1 } } });
      res.json({ cotizacion: String(cot._id), maqueta: `/api/cotiza/img/${maq._id}`, total: q.total, anticipo: q.anticipo });
    } catch (err) {
      console.error("Cotizador maqueta:", err);
      res.status(500).json({ error: "No se pudo procesar tu logo. Intenta de nuevo." });
    }
  });

  // El cliente le da "Pedir": se recalcula el precio aquí (no se confía en el del navegador) y se arma el WhatsApp
  app.post("/api/cotiza/:clave/pedido", limiteGeneral, async (req, res) => {
    try {
      const c = await CotizadorConfig.findOne({ clave: String(req.params.clave).slice(0, 20) }).lean();
      if (!c) return res.status(404).json({ error: "Este cotizador no existe" });
      const cfg = limpiarConfig(c.config);
      const q = cotizar(cfg, req.body?.eleccion || {});
      if (!q) return res.status(400).json({ error: "Elige el material" });
      const notas = String(req.body?.notas || "").replace(/[<>]/g, "").slice(0, 500);
      let maquetaUrl = "";
      if (idValido(req.body?.cotizacion)) {
        const cot = await Cotizacion.findOneAndUpdate({ _id: req.body.cotizacion, owner: c.owner },
          { $set: { pidio: true, notas, total: q.total, anticipo: q.anticipo, eleccion: { material: q.material.id, luz: q.luz?.id || "", ubicacion: q.ubicacion?.id || "", montaje: q.montaje?.id || "", ancho: q.ancho, alto: q.alto, cantidad: q.cantidad, complejidad: q.complejidad } } }, { new: true }).lean();
        const origen = `${req.protocol}://${req.get("host")}`;
        if (cot?.maqueta) maquetaUrl = `${origen}/api/cotiza/img/${cot.maqueta}`;
        else if (cot?.logo) maquetaUrl = `${origen}/api/cotiza/img/${cot.logo}`;
      }
      const texto = mensajeWhatsapp(cfg, q, { maquetaUrl, notas });
      res.json({ total: q.total, anticipo: q.anticipo, whatsapp: cfg.whatsapp ? `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(texto)}` : "", texto });
    } catch (err) {
      console.error("Cotizador pedido:", err);
      res.status(500).json({ error: "No se pudo armar tu pedido. Intenta de nuevo." });
    }
  });
}

// Rutas de CoDropX (con sesión): configurar precios, galería y ver las cotizaciones
export function registrarRutasCotizador(app) {
  const vista = (c) => ({ clave: c.clave, config: limpiarConfig(c.config), galeria: (c.galeria || []).map(x => ({ ...x, url: `/api/cotiza/img/${x.id}`, ...(x.idAntes ? { urlAntes: `/api/cotiza/img/${x.idAntes}` } : {}) })), gasto: { mes: mesActual(), ...gastoDelMes(c) } });

  app.get("/api/cotizador", async (req, res) => {
    try { res.json(vista(await configDe(req.user.uid))); }
    catch (err) { console.error("Cotizador:", err); res.status(500).json({ error: "No se pudo abrir el cotizador" }); }
  });

  app.put("/api/cotizador", async (req, res) => {
    try {
      const c = await configDe(req.user.uid);
      c.config = limpiarConfig(req.body?.config || {});
      c.actualizado = new Date();
      c.markModified("config");
      await c.save();
      res.json(vista(c));
    } catch (err) { console.error("Cotizador guardar:", err); res.status(500).json({ error: "No se pudo guardar" }); }
  });

  app.post("/api/cotizador/galeria", async (req, res) => {
    try {
      const c = await configDe(req.user.uid);
      // trabajo · resena · par (logo del cliente + cómo quedó) · taller (fotos fabricando)
      const tipo = ["resena", "par", "taller"].includes(req.body?.tipo) ? req.body.tipo : "trabajo";
      const max = tipo === "taller" ? 4 : MAX_GALERIA;
      if ((c.galeria || []).filter(x => x.tipo === tipo).length >= max) return res.status(400).json({ error: `Máximo ${max} fotos aquí` });
      const im = leerDataUrl(req.body?.dataUrl);
      if (!im) return res.status(400).json({ error: "Sube una foto JPG, PNG o WEBP (máximo 3 MB)" });
      let antes = null;
      if (tipo === "par") {
        antes = leerDataUrl(req.body?.dataUrlAntes);
        if (!antes) return res.status(400).json({ error: "Falta la foto del logo (el antes)" });
      }
      const doc = await CotizadorImagen.create({ owner: req.user.uid, tipo, mime: im.tipo, datos: im.datos });
      const docAntes = antes ? await CotizadorImagen.create({ owner: req.user.uid, tipo: "par-antes", mime: antes.tipo, datos: antes.datos }) : null;
      c.galeria = [...(c.galeria || []), { id: String(doc._id), ...(docAntes ? { idAntes: String(docAntes._id), real: req.body?.real !== false } : {}), tipo, titulo: String(req.body?.titulo || "").replace(/[<>]/g, "").slice(0, 80) }];
      c.markModified("galeria");
      await c.save();
      res.json(vista(c));
    } catch (err) { console.error("Cotizador galería:", err); res.status(500).json({ error: "No se pudo subir la foto" }); }
  });

  app.delete("/api/cotizador/galeria/:id", async (req, res) => {
    try {
      const c = await configDe(req.user.uid);
      const id = String(req.params.id);
      const quitada = (c.galeria || []).find(x => x.id === id);
      c.galeria = (c.galeria || []).filter(x => x.id !== id);
      c.markModified("galeria");
      await c.save();
      const ids = [id, quitada?.idAntes].filter(idValido);
      if (ids.length) await CotizadorImagen.deleteMany({ _id: { $in: ids }, owner: req.user.uid });
      res.json(vista(c));
    } catch (err) { console.error("Cotizador galería borrar:", err); res.status(500).json({ error: "No se pudo borrar" }); }
  });

  app.get("/api/cotizador/cotizaciones", async (req, res) => {
    try {
      const lista = await Cotizacion.find({ owner: req.user.uid }).sort({ creado: -1 }).limit(60).lean();
      res.json(lista.map(x => ({ id: String(x._id), creado: x.creado, eleccion: x.eleccion, total: x.total, anticipo: x.anticipo, moneda: x.moneda, notas: x.notas, pidio: !!x.pidio,
        logo: x.logo ? `/api/cotiza/img/${x.logo}` : "", maqueta: x.maqueta ? `/api/cotiza/img/${x.maqueta}` : "" })));
    } catch (err) { console.error("Cotizaciones:", err); res.status(500).json({ error: "No se pudieron leer las cotizaciones" }); }
  });
}
