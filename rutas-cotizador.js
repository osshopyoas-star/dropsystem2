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
import { rateLimit, getSession } from "./auth.js";
import { leerDataUrl } from "./modelo-imagenes.js";
import { pedirImagen, PRECIO_IMAGEN, PRECIO_REFERENCIA } from "./rutas-ia-imagenes.js";
import { tiendaDe, crearPedidoBorrador } from "./rutas-shopify.js";
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
  pidio: { type: Boolean, default: false },
  pago: { type: String, default: "" },           // id del pedido borrador de Shopify (si fue a pagar)
  error: { type: String, default: "" },          // por qué no salió la maqueta (si falló)        // le dio "Pedir por WhatsApp"
  creado: { type: Date, default: Date.now, index: true }
});
const Cotizacion = mongoose.model("Cotizacion", cotizacionSchema);

// Reseña real que escribe el dueño (lo que le dijo el cliente): todo opcional
const datosResena = (b = {}) => ({
  nombre: String(b.nombre || "").replace(/[<>]/g, "").slice(0, 40).trim(),
  ciudad: String(b.ciudad || "").replace(/[<>]/g, "").slice(0, 40).trim(),
  texto: String(b.texto || "").replace(/[<>]/g, "").slice(0, 300).trim(),
  estrellas: Math.min(5, Math.max(0, Math.round(Number(b.estrellas) || 0)))
});
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
      res.json({ ...publica, conMaqueta: limites.usdMes > g.usd + PRECIO_IMAGEN && limites.maquetasPorDia > 0, galeria: (c.galeria || []).map(x => ({ url: `/api/cotiza/img/${x.id}`, ...(x.idAntes ? { urlAntes: `/api/cotiza/img/${x.idAntes}`, real: x.real !== false } : {}), ...(x.tipo === "resena" ? { nombre: x.nombre || "", ciudad: x.ciudad || "", texto: x.texto || "", estrellas: x.estrellas || 0 } : {}), ...(x.tipo === "ejemplo" ? { material: x.material, grupo: x.grupo || "materiales" } : {}), tipo: x.tipo, titulo: x.titulo || "" })) });
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
  // Quien tiene la sesión abierta en CoDropX (tú probando tu página) no tiene el límite de maquetas seguidas
  const limiteSalvoDueno = (req, res, next) => (getSession(req) ? next() : limiteMaqueta(req, res, next));
  app.post("/api/cotiza/:clave/maqueta", limiteSalvoDueno, async (req, res) => {
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
      const cot = await Cotizacion.create({ owner: c.owner, logo: logoDoc._id, eleccion: { material: q.material.id, luz: q.luz?.id || "", ubicacion: q.ubicacion?.id || "", montaje: q.montaje?.id || "", forma: q.forma?.id || "", colorLuz: q.colorLuz || "", ancho: q.ancho, alto: q.alto, cantidad: q.cantidad, complejidad: q.complejidad }, total: q.total, anticipo: q.anticipo, moneda: cfg.moneda });

      // ¿Puede hacer maqueta? Tope por persona al día y tope de gasto del mes
      const k = `${req.ip}|${hoy()}`;
      const usadas = porPersona.get(k) || 0;
      const g = gastoDelMes(c);
      const costo = PRECIO_IMAGEN + PRECIO_REFERENCIA;
      // El dueño (sesión abierta en CoDropX) no tiene tope por día; el tope del mes sí cuenta para todos
      const esDueno = getSession(req)?.uid === String(c.owner);
      let aviso = "", motivo = "";
      if (!esDueno && usadas >= cfg.limites.maquetasPorDia) { aviso = "Ya hiciste las maquetas de hoy. Te mostramos tu logo en la pared y el precio igual."; motivo = `esa persona ya usó sus ${cfg.limites.maquetasPorDia} maquetas de hoy`; }
      else if (g.usd + costo > cfg.limites.usdMes) { aviso = "Las maquetas con IA están en pausa. Te mostramos tu logo en la pared y el precio igual."; motivo = `se llegó al tope de US$${cfg.limites.usdMes} del mes (súbelo en Frenos de gasto)`; }
      if (aviso) {
        await Cotizacion.updateOne({ _id: cot._id }, { $set: { error: motivo } }).catch(() => {});
        return res.json({ cotizacion: String(cot._id), maqueta: null, aviso, total: q.total, anticipo: q.anticipo });
      }

      porPersona.set(k, usadas + 1);
      const dataLogo = `data:${logo.tipo};base64,${logo.datos.toString("base64")}`;
      let r;
      try {
        // Foto de ejemplo de este tipo de letrero (si la subiste): la IA copia el acabado, no el dibujo
        const fotos = [dataLogo];
        const ej = (c.galeria || []).find(x => x.tipo === "ejemplo" && (x.grupo || "materiales") === "materiales" && x.material === q.material.id);
        if (ej && idValido(ej.id)) {
          const im = await CotizadorImagen.findById(ej.id).select("mime datos").lean();
          if (im?.datos) fotos.push(`data:${im.mime || "image/jpeg"};base64,${(Buffer.isBuffer(im.datos) ? im.datos : Buffer.from(im.datos.buffer || im.datos)).toString("base64")}`);
        }
        try {
          r = await pedirImagen({ prompt: promptMaqueta(cfg, q, { conEjemplo: fotos.length > 1 }), fotos, aspecto: "4:3", resolucion: "1k" });
        } catch (e1) {
          // Segundo intento solo con el logo (sin la foto de ejemplo), si el error no es de saldo o de clave
          if (fotos.length < 2 || [401, 403, 429].includes(e1.status)) throw e1;
          console.warn("Cotizador: falló con la foto de ejemplo, reintento solo con el logo:", e1.message);
          r = await pedirImagen({ prompt: promptMaqueta(cfg, q, { conEjemplo: false }), fotos: [dataLogo], aspecto: "4:3", resolucion: "1k" });
        }
      } catch (e) {
        porPersona.set(k, usadas);   // no cuenta si falló
        console.error("Cotizador: no se pudo hacer la maqueta:", e.message);
        await Cotizacion.updateOne({ _id: cot._id }, { $set: { error: String(e.message || "Error").slice(0, 200) } }).catch(() => {});
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

  // El cliente le da "Pagar ahora": se recalcula el precio aquí y se crea el pedido en Shopify con ese valor exacto
  app.post("/api/cotiza/:clave/pagar", limiteGeneral, async (req, res) => {
    try {
      const c = await CotizadorConfig.findOne({ clave: String(req.params.clave).slice(0, 20) }).lean();
      if (!c) return res.status(404).json({ error: "Este cotizador no existe" });
      const cfg = limpiarConfig(c.config);
      if (cfg.cierre !== "shopify" || !cfg.tiendaPago) return res.status(400).json({ error: "El pago en línea no está activo. Escríbenos por WhatsApp." });
      const t = await tiendaDe(c.owner, cfg.tiendaPago);
      if (!t) return res.status(400).json({ error: "La tienda para cobrar no está conectada. Escríbenos por WhatsApp." });
      const q = cotizar(cfg, req.body?.eleccion || {});
      if (!q) return res.status(400).json({ error: "Elige el material" });
      const notas = String(req.body?.notas || "").replace(/[<>]/g, "").slice(0, 500);
      const origen = `${req.protocol}://${req.get("host")}`;
      let cot = null;
      if (idValido(req.body?.cotizacion)) cot = await Cotizacion.findOne({ _id: req.body.cotizacion, owner: c.owner }).lean();
      const unidad = Math.ceil(q.total / q.cantidad);
      const atributos = [
        { key: "Material", value: q.material.nombre },
        { key: "Tamaño", value: `${q.ancho} × ${q.alto} cm` },
        { key: "Luz", value: q.luz ? `${q.luz.nombre}${q.colorLuz ? ` · ${q.colorLuz}` : ""}` : "" },
        { key: "Va en", value: q.ubicacion?.nombre || "" },
        { key: "Forma", value: q.forma?.nombre || "" },
        { key: "Montaje", value: q.montaje?.nombre || "" },
        { key: "Notas del cliente", value: notas },
        { key: "Logo", value: cot?.logo ? `${origen}/api/cotiza/img/${cot.logo}` : "" },
        { key: "Maqueta", value: cot?.maqueta ? `${origen}/api/cotiza/img/${cot.maqueta}` : "" }
      ];
      const r = await crearPedidoBorrador(t, {
        titulo: `Letrero personalizado · ${q.material.nombre} ${q.ancho}×${q.alto} cm`, precio: unidad, cantidad: q.cantidad, atributos,
        nota: `Cotizador CoDropX${notas ? ` · Notas: ${notas}` : ""}`, etiquetas: ["cotizador", "letrero"]
      });
      if (cot) await Cotizacion.updateOne({ _id: cot._id }, { $set: { pidio: true, pago: r.id, notas, total: q.total, anticipo: q.anticipo } });
      res.json({ url: r.url, total: q.total });
    } catch (err) {
      console.error("Cotizador pagar:", err);
      res.status(err.status && err.status < 500 ? 400 : 500).json({ error: "No pudimos abrir el pago en este momento. Escríbenos por WhatsApp y te ayudamos." });
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
          { $set: { pidio: true, notas, total: q.total, anticipo: q.anticipo, eleccion: { material: q.material.id, luz: q.luz?.id || "", ubicacion: q.ubicacion?.id || "", montaje: q.montaje?.id || "", forma: q.forma?.id || "", colorLuz: q.colorLuz || "", ancho: q.ancho, alto: q.alto, cantidad: q.cantidad, complejidad: q.complejidad } } }, { new: true }).lean();
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
      await configDe(req.user.uid);
      const c = await CotizadorConfig.findOneAndUpdate({ owner: req.user.uid }, { $set: { config: limpiarConfig(req.body?.config || {}), actualizado: new Date() } }, { new: true });
      res.json(vista(c));
    } catch (err) {
      console.error("Cotizador guardar:", err);
      // Esta ruta es solo del dueño: se muestra el motivo para poder arreglarlo
      res.status(500).json({ error: `No se pudo guardar: ${String(err?.message || err).slice(0, 200)}` });
    }
  });

  app.post("/api/cotizador/galeria", async (req, res) => {
    try {
      const c = await configDe(req.user.uid);
      // trabajo · resena · par (logo del cliente + cómo quedó) · taller (fotos fabricando) · ejemplo (cómo se ve un tipo de letrero)
      const tipo = ["resena", "par", "taller", "ejemplo", "marca"].includes(req.body?.tipo) ? req.body.tipo : "trabajo";
      // Foto de ejemplo de una opción: grupo = materiales | ubicaciones | formas | luces | montajes
      const materialId = String(req.body?.material || req.body?.opcion || "").slice(0, 40);
      const grupoEj = ["materiales", "ubicaciones", "formas", "luces", "montajes"].includes(req.body?.grupo) ? req.body.grupo : "materiales";
      if (tipo === "ejemplo") {
        if (!materialId) return res.status(400).json({ error: "Falta la opción" });
        const viejo = (c.galeria || []).find(x => x.tipo === "ejemplo" && (x.grupo || "materiales") === grupoEj && x.material === materialId);
        if (viejo) { c.galeria = c.galeria.filter(x => x !== viejo); if (idValido(viejo.id)) await CotizadorImagen.deleteOne({ _id: viejo.id, owner: req.user.uid }); }
      }
      // Fotos de ejemplo: una por opción (se reemplaza), así que su tope es alto
      const max = tipo === "taller" ? 4 : tipo === "ejemplo" ? 80 : MAX_GALERIA;
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
      c.galeria = [...(c.galeria || []), { id: String(doc._id), ...(docAntes ? { idAntes: String(docAntes._id), real: req.body?.real !== false } : {}), ...(tipo === "resena" ? datosResena(req.body) : {}), ...(tipo === "ejemplo" ? { material: materialId, grupo: grupoEj } : {}), tipo, titulo: String(req.body?.titulo || "").replace(/[<>]/g, "").slice(0, 80) }];
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

  // ---------- Espacio en la base de datos (el plan gratis de MongoDB trae 512 MB) ----------
  // Cuánto ocupa cada cosa de este usuario. Usa $bsonSize: el tamaño real de cada documento guardado.
  app.get("/api/espacio", async (req, res) => {
    try {
      const owner = new mongoose.Types.ObjectId(String(req.user.uid));
      const medir = async (modelo, filtro = {}, agrupar = null) => {
        try {
          const M = mongoose.model(modelo);
          const r = await M.aggregate([{ $match: { owner, ...filtro } }, { $group: { _id: agrupar ? `$${agrupar}` : null, n: { $sum: 1 }, bytes: { $sum: { $bsonSize: "$$ROOT" } } } }]);
          return r;
        } catch (e) { return []; }
      };
      const mb = (b) => Math.round((b || 0) / 1048576 * 10) / 10;
      const filas = [];
      for (const x of await medir("CotizadorImagen", {}, "tipo")) filas.push({ que: { logo: "Cotizador: logos que subieron los clientes", maqueta: "Cotizador: maquetas hechas con IA" }[x._id] || `Cotizador: fotos (${x._id})`, n: x.n, mb: mb(x.bytes) });
      for (const [modelo, que] of [["ImagenLanding", "Desarrollo: imágenes de las landings"], ["Proyecto", "Desarrollo: proyectos (con sus fotos)"], ["DropiLinea", "Finanzas: pedidos de Dropi"], ["Producto", "Base de productos"], ["Cotizacion", "Cotizador: cotizaciones (sin imágenes)"]]) {
        const r = await medir(modelo);
        if (r[0]) filas.push({ que, n: r[0].n, mb: mb(r[0].bytes) });
      }
      filas.sort((a, b) => b.mb - a.mb);
      const prueba = await Cotizacion.countDocuments({ owner: req.user.uid, pidio: false });
      res.json({ filas, total: Math.round(filas.reduce((t, x) => t + x.mb, 0) * 10) / 10, cotizacionesPrueba: prueba });
    } catch (err) { console.error("Espacio:", err); res.status(500).json({ error: "No se pudo medir el espacio" }); }
  });

  // Borra las cotizaciones en las que el cliente NO pidió por WhatsApp (pruebas o solo miraron), con su logo y su maqueta
  app.post("/api/cotizador/limpiar", async (req, res) => {
    try {
      const dias = Math.max(0, Math.min(365, Number(req.body?.dias) || 0));
      const filtro = { owner: req.user.uid, pidio: false, ...(dias ? { creado: { $lt: new Date(Date.now() - dias * 864e5) } } : {}) };
      const lista = await Cotizacion.find(filtro).select("logo maqueta").lean();
      const ids = lista.flatMap(x => [x.logo, x.maqueta]).filter(Boolean);
      let imagenes = 0;
      for (let i = 0; i < ids.length; i += 500) imagenes += (await CotizadorImagen.deleteMany({ _id: { $in: ids.slice(i, i + 500) }, owner: req.user.uid })).deletedCount || 0;
      const cot = await Cotizacion.deleteMany({ _id: { $in: lista.map(x => x._id) } });
      res.json({ cotizaciones: cot.deletedCount || 0, imagenes });
    } catch (err) { console.error("Limpiar cotizaciones:", err); res.status(500).json({ error: `No se pudo borrar: ${String(err?.message || err).slice(0, 200)}` }); }
  });

  app.get("/api/cotizador/cotizaciones", async (req, res) => {
    try {
      const lista = await Cotizacion.find({ owner: req.user.uid }).sort({ creado: -1 }).limit(60).lean();
      res.json(lista.map(x => ({ id: String(x._id), creado: x.creado, eleccion: x.eleccion, total: x.total, anticipo: x.anticipo, moneda: x.moneda, notas: x.notas, pidio: !!x.pidio, error: x.error || "",
        logo: x.logo ? `/api/cotiza/img/${x.logo}` : "", maqueta: x.maqueta ? `/api/cotiza/img/${x.maqueta}` : "" })));
    } catch (err) { console.error("Cotizaciones:", err); res.status(500).json({ error: "No se pudieron leer las cotizaciones" }); }
  });
}
