// =============================================
// 🎨 GENERAR IMÁGENES CON IA (xAI · Grok Imagine) — con límite de gasto mensual
// Usa la misma API_KEY de xAI que ya usa CoDropX para los textos.
// Toma el estilo + el prompt de la sección + las fotos reales del producto (como referencia)
// y guarda el resultado en la sección, igual que si la hubieras subido a mano.
// El gasto es un ESTIMADO con los precios publicados; el cobro real lo ves en console.x.ai.
// =============================================
import mongoose from "mongoose";
import { limpiarFuentes } from "./public/js/core/fuentes.js";
import { ImagenLanding, metaImagen, MAX_POR_SECCION, tipoDeBytes } from "./modelo-imagenes.js";

const MODELO = () => process.env.XAI_IMAGE_MODEL || "grok-imagine-image-2.0";
const RESOLUCION = () => (["1k", "1.5k", "2k"].includes(process.env.XAI_IMAGE_RES) ? process.env.XAI_IMAGE_RES : "2k");
// Precio publicado: ~$0,04 por imagen generada; las fotos de referencia también se cobran (se estima $0,01 c/u)
export const PRECIO_IMAGEN = 0.04;
export const PRECIO_REFERENCIA = 0.01;
export const LIMITE_DEFECTO = 5;
const MAX_REFERENCIAS = 3;
const MAX_PROMPT = 7000;
const TIEMPO_MS = 150000;
const ASPECTOS = ["1:1", "3:4", "4:3", "9:16", "16:9", "2:3", "3:2", "9:19.5", "9:20", "1:2"];

const gastoSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  mes: { type: String, required: true },          // "2026-10"
  usd: { type: Number, default: 0 },
  imagenes: { type: Number, default: 0 },
  ticks: { type: Number, default: 0 },            // lo que reporta xAI (para comparar con el estimado)
  actualizado: { type: Date, default: Date.now }
});
gastoSchema.index({ owner: 1, mes: 1 }, { unique: true });
export const GastoIA = mongoose.model("GastoIA", gastoSchema);

const configSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true, unique: true },
  limiteUsd: { type: Number, default: LIMITE_DEFECTO }
});
export const ConfigIA = mongoose.model("ConfigIA", configSchema);

let http = (...a) => fetch(...a);
export function usarFetchIA(fn) { http = fn; }

const mesActual = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" }).slice(0, 7);
const redondear = (n) => Math.round(n * 1000) / 1000;

async function estadoGasto(owner) {
  const [g, c] = await Promise.all([
    GastoIA.findOne({ owner, mes: mesActual() }).lean(),
    ConfigIA.findOne({ owner }).lean()
  ]);
  const limite = c?.limiteUsd ?? LIMITE_DEFECTO;
  const usd = redondear(g?.usd || 0);
  return { mes: mesActual(), usd, imagenes: g?.imagenes || 0, limite, queda: redondear(Math.max(0, limite - usd)), precioImagen: PRECIO_IMAGEN, precioReferencia: PRECIO_REFERENCIA };
}

export const aspectoDe = (formato) => {
  const f = String(formato || "").trim();
  if (ASPECTOS.includes(f)) return f;
  if (f === "4:5") return "3:4";
  return "9:16";
};

// El producto va primero y al final: la IA tiende a obedecer lo que más se repite
export function armarPrompt({ bloqueEstilo, prompt, referencias, descripcion = "", noTiene = "" }) {
  const etiquetas = referencias > 1 ? Array.from({ length: referencias }, (_, i) => `<IMAGE_${i}>`).join(", ") : "la foto de referencia";
  const cabeza = referencias
    ? `PRODUCTO REAL QUE SE VENDE: es el que aparece en ${etiquetas}. Cópialo IDÉNTICO: misma forma, tamaño relativo, colores, materiales, botones, piezas, logos y proporciones. NO inventes otro producto parecido, NO lo rediseñes, NO le agregues ni quites partes, NO dupliques piezas (si se está usando, lleva un solo accesorio puesto). Solo cambia la escena, las personas, la luz y los textos alrededor.${descripcion ? `\nCómo es el producto: ${descripcion}` : ""}${noTiene ? `\nEl producto NO tiene: ${noTiene}` : ""}\n\n`
    : "";
  const cola = "\n\nTEXTOS: escribe SOLO los textos que están entre comillas, letra por letra y bien escritos. Si un texto pequeño no te queda legible, NO lo pongas: nunca letras inventadas ni palabras sin sentido. Los precios y porcentajes van EXACTOS como están escritos."
    + (referencias ? `\n\nRECUERDA: el producto de la imagen debe verse exactamente igual al de ${etiquetas}.` : "");
  const cuerpo = `${String(bloqueEstilo || "").trim()}\n\n${String(prompt || "").trim()}`.trim();
  const espacio = MAX_PROMPT - cabeza.length - cola.length;
  return limpiarFuentes(cabeza + cuerpo.slice(0, Math.max(500, espacio)) + cola);
}

async function pedirImagen({ prompt, fotos, aspecto }) {
  const refs = fotos.slice(0, MAX_REFERENCIAS);
  const base = { model: MODELO(), prompt, n: 1, response_format: "b64_json", aspect_ratio: aspecto, resolution: RESOLUCION() };
  const body = refs.length === 0 ? base
    : refs.length === 1 ? { ...base, image: { url: refs[0] } }
    : { ...base, images: refs.map(url => ({ url })) };
  const url = refs.length ? "https://api.x.ai/v1/images/edits" : "https://api.x.ai/v1/images/generations";

  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_MS);
  let res;
  try {
    res = await http(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: control.signal
    });
  } catch (err) {
    throw Object.assign(new Error(err?.name === "AbortError" ? "La IA tardó demasiado. Intenta de nuevo." : "No se pudo conectar con la IA"), { status: 504 });
  } finally { clearTimeout(reloj); }

  const txt = await res.text();
  let j = {};
  try { j = JSON.parse(txt); } catch {}
  if (!res.ok) {
    const msg = String(j?.error?.message || j?.error || j?.message || txt || "").slice(0, 300);
    console.error("Error xAI imagen:", res.status, msg);
    if (res.status === 401 || res.status === 403) throw Object.assign(new Error("La clave de xAI no permite generar imágenes o no tiene saldo. Revisa console.x.ai."), { status: 502 });
    if (res.status === 429) throw Object.assign(new Error("La IA está ocupada o llegaste al límite de xAI. Espera un minuto."), { status: 429 });
    if (/moderat|safety|policy|content/i.test(msg)) throw Object.assign(new Error("La IA rechazó el prompt por sus reglas de contenido. Ajusta el texto de la sección."), { status: 400 });
    throw Object.assign(new Error(`La IA no pudo crear la imagen (${res.status})`), { status: 502 });
  }
  const b64 = j?.data?.[0]?.b64_json;
  if (!b64) throw Object.assign(new Error("La IA no devolvió la imagen"), { status: 502 });
  const datos = Buffer.from(b64, "base64");
  const tipo = tipoDeBytes(datos);
  if (!tipo) throw Object.assign(new Error("La IA devolvió un archivo que no es imagen"), { status: 502 });
  return { datos, tipo, ticks: Number(j?.usage?.cost_in_usd_ticks) || 0, referencias: refs.length };
}

const enProceso = new Set();

export function registrarRutasIAImagenes(app, { cargarRama, guardarRama, actualizarRama, limiter }) {
  const mw = limiter ? [limiter] : [];

  app.get("/api/ia/gasto", async (req, res) => {
    try { res.json(await estadoGasto(req.user.uid)); }
    catch (err) { console.error("Error gasto IA:", err); res.status(500).json({ error: "No se pudo leer el gasto" }); }
  });

  app.put("/api/ia/gasto", async (req, res) => {
    try {
      const n = Number(req.body?.limite);
      if (!Number.isFinite(n) || n < 0 || n > 200) return res.status(400).json({ error: "El límite debe estar entre $0 y $200 USD" });
      await ConfigIA.findOneAndUpdate({ owner: req.user.uid }, { $set: { limiteUsd: Math.round(n * 100) / 100 }, $setOnInsert: { owner: req.user.uid } }, { upsert: true, new: true });
      res.json(await estadoGasto(req.user.uid));
    } catch (err) { console.error("Error guardando límite IA:", err); res.status(500).json({ error: "No se pudo guardar el límite" }); }
  });

  // Generar la imagen de una sección
  app.post("/api/proyectos/:id/rama/:av/ia/imagen/:seccion", ...mw, async (req, res) => {
    let llave = null;
    try {
      if (!process.env.API_KEY) return res.status(500).json({ error: "Falta la API_KEY de xAI en Render" });
      const x = await cargarRama(req, res); if (!x) return;
      const idx = (x.r.secciones || []).findIndex(s => s.id === req.params.seccion);
      if (idx === -1) return res.status(404).json({ error: "Sección no encontrada" });
      const sec = x.r.secciones[idx];
      if (!sec.prompt) return res.status(400).json({ error: "Primero genera el prompt de esta sección" });

      const ya = await ImagenLanding.countDocuments({ owner: req.user.uid, proyecto: x.p._id, rama: x.av, seccion: sec.id });
      if (ya >= MAX_POR_SECCION) return res.status(400).json({ error: `Máximo ${MAX_POR_SECCION} imágenes por sección. Quita alguna.` });

      const todas = (x.p.fotos || []).filter(f => /^data:image\/(jpeg|png|webp);base64,/.test(f));
      if (!todas.length) return res.status(400).json({ error: "Sube fotos reales del producto en la Ficha (paso 1). Sin fotos la IA inventa otro producto." });
      const pedidas = Array.isArray(req.body?.refs) ? [...new Set(req.body.refs.map(Number))].filter(i => Number.isInteger(i) && i >= 0 && i < todas.length) : [];
      const fotos = (pedidas.length ? pedidas.map(i => todas[i]) : todas).slice(0, MAX_REFERENCIAS);
      const estimado = PRECIO_IMAGEN + PRECIO_REFERENCIA * fotos.length;
      const g = await estadoGasto(req.user.uid);
      if (g.usd + estimado > g.limite + 1e-9) {
        return res.status(400).json({ error: `Llegaste al límite de gasto de este mes ($${g.usd.toFixed(2)} de $${g.limite.toFixed(2)} USD). Súbelo si quieres seguir.`, gasto: g });
      }

      const clave = `${x.p._id}:${x.av}:${sec.id}`;
      if (enProceso.has(clave)) return res.status(409).json({ error: "Ya se está generando esta sección" });
      enProceso.add(clave); llave = clave;

      const bloque = x.r.bloqueEstilo || "";
      const r = await pedirImagen({ prompt: armarPrompt({
        bloqueEstilo: bloque, prompt: sec.prompt, referencias: fotos.length,
        descripcion: String(x.p.revision?.descripcionFisica || "").slice(0, 600) + (x.p.ficha?.medidas ? ` Medidas: ${String(x.p.ficha.medidas).slice(0, 120)}.` : ""),
        noTiene: [...(Array.isArray(x.p.revision?.noTiene) ? x.p.revision.noTiene : []), x.p.ficha?.noTiene].filter(Boolean).join("; ").slice(0, 300)
      }), fotos, aspecto: aspectoDe(sec.formato) });

      await GastoIA.findOneAndUpdate(
        { owner: req.user.uid, mes: mesActual() },
        { $inc: { usd: estimado, imagenes: 1, ticks: r.ticks }, $set: { actualizado: new Date() }, $setOnInsert: { owner: req.user.uid, mes: mesActual() } },
        { upsert: true, new: true }
      );

      const nueva = await ImagenLanding.create({
        owner: req.user.uid, proyecto: x.p._id, rama: x.av, seccion: sec.id,
        tipo: r.tipo, datos: r.datos, bytes: r.datos.length, origen: "ia"
      });
      const rama = (await actualizarRama(x.p, x.av, (actual) => ({
        ...actual, secciones: (actual.secciones || []).map(s => s.id === sec.id ? { ...s, hecha: true } : s)
      }))) || x.r;
      res.json({ imagen: metaImagen(nueva), rama, gasto: await estadoGasto(req.user.uid) });
    } catch (err) {
      console.error("Error generando imagen IA:", err.message);
      res.status(err.status || 500).json({ error: err.message || "No se pudo generar la imagen" });
    } finally {
      if (llave) enProceso.delete(llave);
    }
  });
}
