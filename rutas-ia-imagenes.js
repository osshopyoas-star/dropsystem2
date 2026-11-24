// =============================================
// 🎨 GENERAR IMÁGENES CON IA (xAI · Grok Imagine) — con límite de gasto mensual
// Usa la misma API_KEY de xAI que ya usa CoDropX para los textos.
// Toma el estilo + el prompt de la sección + las fotos reales del producto (como referencia)
// y guarda el resultado en la sección, igual que si la hubieras subido a mano.
// El gasto es un ESTIMADO con los precios publicados; el cobro real lo ves en console.x.ai.
// =============================================
import mongoose from "mongoose";
import { limpiarFuentes } from "./public/js/core/fuentes.js";
import { ImagenLanding, metaImagen, MAX_POR_SECCION, tipoDeBytes, medidasDeBytes } from "./modelo-imagenes.js";
import zlib from "zlib";
import { cierreSeccion, textosPermitidos, promptRevisarImagen, problemasDeTextos } from "./prompts-landing.js";
import { ofertaDe } from "./public/js/core/oferta.js";
import { variantesDe, colorDeSeccion, PORTADAS_V } from "./public/js/core/variantes.js";

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
  limiteUsd: { type: Number, default: LIMITE_DEFECTO },
  autoRegenerar: { type: Boolean, default: false }   // si la revisión automática encuentra un error, rehace la imagen 1 vez
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
  return { mes: mesActual(), usd, imagenes: g?.imagenes || 0, limite, queda: redondear(Math.max(0, limite - usd)), precioImagen: PRECIO_IMAGEN, precioReferencia: PRECIO_REFERENCIA, autoRegenerar: !!c?.autoRegenerar };
}

export const aspectoDe = (formato) => {
  const f = String(formato || "").trim();
  if (ASPECTOS.includes(f)) return f;
  if (f === "4:5") return "3:4";
  return "9:16";
};

// El producto va primero y al final: la IA tiende a obedecer lo que más se repite
export function armarPrompt({ bloqueEstilo, prompt, referencias, descripcion = "", noTiene = "", clientes = 0, regalos = 0, nombresRegalos = [], unidades = 1, colorNombres = [] }) {
  bloqueEstilo = String(bloqueEstilo || "").replace("(salvo las tarjetas lisas de la sección de reseñas o chats).", "Las tarjetas de reseñas y chats van blancas y LLENAS con el texto de cada cliente.");
  // Las últimas "clientes" referencias son fotos reales de clientes (sección de reseñas), no del producto
  const total = referencias;
  referencias = Math.max(0, referencias - clientes - regalos);
  const etiquetas = total > 1 ? Array.from({ length: referencias }, (_, i) => `<IMAGE_${i}>`).join(", ") : "la foto de referencia";
  const fotosColor = colorNombres.length ? `\nCOLORES: ${colorNombres.map((c, i) => `<IMAGE_${i}> muestra el producto en color ${c.toUpperCase()}`).join("; ")}. Copia ese color exacto donde la sección lo pide; las demás fotos son del mismo producto.` : "";
  const fotosRegalos = regalos > 0 ? `\nREGALOS: ${Array.from({ length: regalos }, (_, i) => `<IMAGE_${referencias + i}> es el regalo "${nombresRegalos[i] || `regalo ${i + 1}`}"`).join("; ")}. Cópialos idénticos dentro de sus círculos, más pequeños que el producto.` : "";
  const fotosClientes = clientes > 0 ? `\nFOTOS REALES DE CLIENTES: ${Array.from({ length: clientes }, (_, i) => `<IMAGE_${referencias + i}>`).join(", ")} son las fotos que mandaron los clientes, en el orden de las reseñas. Úsalas tal cual dentro de sus tarjetas (solo recórtalas): no cambies a las personas ni los lugares.` : "";
  const cabeza = referencias
    ? `PRODUCTO REAL QUE SE VENDE: es el que aparece en ${etiquetas}. Cópialo IDÉNTICO: misma forma, tamaño relativo, colores, materiales, botones, piezas, logos y proporciones. NO inventes otro producto parecido, NO lo rediseñes, NO le agregues ni quites partes, ${unidades > 1 ? `Esta imagen es de una PROMO: muestra ${unidades} unidades del producto, cada una idéntica a la foto (puede cambiar solo el color si hay variantes); no dupliques piezas dentro de una misma unidad.` : "NO dupliques piezas (si se está usando, lleva un solo accesorio puesto)."} Solo cambia la escena, las personas, la luz y los textos alrededor.${descripcion ? `\nCómo es el producto: ${descripcion}` : ""}${noTiene ? `\nEl producto NO tiene: ${noTiene}` : ""}${fotosColor}${fotosClientes}${fotosRegalos}\n\n`
    : "";
  const cola = "\n\nTEXTOS: escribe SOLO los textos que están entre comillas, letra por letra y bien escritos. Si un texto pequeño no te queda legible, NO lo pongas: nunca letras inventadas ni palabras sin sentido. Los precios y porcentajes van EXACTOS como están escritos. De las fotos de referencia copia SOLO el producto: nunca sus textos, precios, referencias, códigos, logos del proveedor ni etiquetas."
    + (referencias ? `\n\nRECUERDA: el producto de la imagen debe verse exactamente igual al de ${etiquetas}.` : "");
  // Los bloques fijos del final (precio, textos prohibidos, margen) nunca se recortan
  const txt = String(prompt || "").trim();
  const corte = txt.search(/\n\n(PRECIO \(cópialo EXACTO|PROHIBIDO EN ESTA IMAGEN)/);
  const fijos = corte >= 0 ? "\n\n" + txt.slice(corte).trim() : "";
  const cuerpo = `${String(bloqueEstilo || "").trim()}\n\n${corte >= 0 ? txt.slice(0, corte).trim() : txt}`.trim();
  const espacio = MAX_PROMPT - cabeza.length - cola.length - fijos.length;
  return limpiarFuentes(cabeza + cuerpo.slice(0, Math.max(500, espacio)) + fijos + cola);
}

// Lienzo liso del tamaño pedido (PNG hecho a mano): si la IA devuelve otra forma, va de primera foto
// y la imagen sale con su forma (xAI toma la forma de la primera foto)
export function lienzoPNG(aspecto) {
  const [a, b] = String(aspecto || "9:16").split(":").map(Number);
  const ancho = 270, alto = Math.max(1, Math.round(ancho * (b || 16) / (a || 9)));
  const crc = (buf) => { let c = ~0; for (const x of buf) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return (~c) >>> 0; };
  const trozo = (tipo, datos) => { const t = Buffer.from(tipo, "ascii"); const l = Buffer.alloc(4); l.writeUInt32BE(datos.length); const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, datos]))); return Buffer.concat([l, t, datos, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4); ihdr[8] = 8; ihdr[9] = 2;
  const fila = Buffer.concat([Buffer.from([0]), Buffer.alloc(ancho * 3, 0xee)]);
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), trozo("IHDR", ihdr), trozo("IDAT", zlib.deflateSync(Buffer.concat(Array(alto).fill(fila)))), trozo("IEND", Buffer.alloc(0))]);
  return `data:image/png;base64,${png.toString("base64")}`;
}
const formaOk = (m, aspecto) => {
  if (!m?.ancho || !m?.alto || !aspecto || !aspecto.includes(":")) return true;
  const [a, b] = aspecto.split(":").map(Number);
  return Math.abs(m.ancho / m.alto - a / b) / (a / b) < 0.06;
};

export async function pedirImagen({ prompt, fotos, aspecto, resolucion = null, _conLienzo = false }) {
  const refs = fotos.slice(0, MAX_REFERENCIAS);
  // Segundo intento con el lienzo de primera foto: las demás fotos corren un puesto (<IMAGE_0> → <IMAGE_1>)
  if (_conLienzo) {
    refs.unshift(lienzoPNG(aspecto));
    prompt = `<IMAGE_0> es solo un lienzo liso que marca el tamaño de la imagen (${aspecto}, vertical): NO copies nada de él.\n\n` + String(prompt).replace(/<IMAGE_(\d+)>/g, (_, n) => `<IMAGE_${Number(n) + 1}>`).replace(/la foto de referencia/g, "<IMAGE_1>");
  }
  const base = { model: MODELO(), prompt, n: 1, response_format: "b64_json", aspect_ratio: aspecto, resolution: ["1k", "1.5k", "2k"].includes(resolucion) ? resolucion : RESOLUCION() };
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
  const medidas = medidasDeBytes(datos);
  // Salió con otra forma (ej. cuadrada en vez de 9:16): se rehace una vez con el lienzo de primera foto
  if (!_conLienzo && !formaOk(medidas, aspecto)) {
    console.warn(`xAI devolvió ${medidas.ancho}x${medidas.alto} y se pidió ${aspecto}: se rehace con lienzo`);
    try {
      const otra = await pedirImagen({ prompt, fotos, aspecto, resolucion, _conLienzo: true });
      return { ...otra, ticks: otra.ticks + (Number(j?.usage?.cost_in_usd_ticks) || 0), rehechaPorForma: true };
    } catch (e) { console.warn("No se pudo rehacer con lienzo:", e.message); }
  }
  return { datos, tipo, ticks: Number(j?.usage?.cost_in_usd_ticks) || 0, referencias: refs.length, ...(medidas || {}) };
}

const enProceso = new Set();

// Revisión automática: la IA lee los textos de la imagen; el código revisa precios y prohibidos, y la IA marca palabras raras
async function revisarImagen(llamarIA, { datos, tipo }, vista, sec, prompt) {
  if (!llamarIA) return null;
  try {
    const permitidos = textosPermitidos(prompt);
    const reply = await llamarIA({ system: "Lees textos de imágenes con mucho cuidado y respondes solo JSON.", prompt: promptRevisarImagen(permitidos), image: `data:${tipo || "image/jpeg"};base64,${Buffer.from(datos).toString("base64")}` });
    const limpio = String(reply || "").replace(/^```[a-z]*\n?|```$/gim, "").trim();
    const j = JSON.parse(limpio.slice(limpio.indexOf("{"), limpio.lastIndexOf("}") + 1));
    const textos = (Array.isArray(j.textos) ? j.textos : []).map(t => String(t).slice(0, 160)).slice(0, 40);
    const raros = (Array.isArray(j.raros) ? j.raros : []).map(t => String(t).slice(0, 160)).slice(0, 10);
    const problemas = [...problemasDeTextos(textos, vista, sec), ...raros.map(t => ({ tipo: "raro", texto: `Texto raro: "${t}"` }))];
    return { ok: !problemas.length, problemas: problemas.slice(0, 12), textos, fecha: new Date() };
  } catch (e) { console.warn("No se pudo revisar la imagen:", e.message); return null; }
}

export function registrarRutasIAImagenes(app, { cargarRama, guardarRama, actualizarRama, limiter, llamarIA }) {
  const mw = limiter ? [limiter] : [];

  app.get("/api/ia/gasto", async (req, res) => {
    try { res.json(await estadoGasto(req.user.uid)); }
    catch (err) { console.error("Error gasto IA:", err); res.status(500).json({ error: "No se pudo leer el gasto" }); }
  });

  app.put("/api/ia/gasto", async (req, res) => {
    try {
      const cambios = {};
      if (req.body?.limite !== undefined) {
        const n = Number(req.body.limite);
        if (!Number.isFinite(n) || n < 0 || n > 200) return res.status(400).json({ error: "El límite debe estar entre $0 y $200 USD" });
        cambios.limiteUsd = Math.round(n * 100) / 100;
      }
      if (req.body?.autoRegenerar !== undefined) cambios.autoRegenerar = !!req.body.autoRegenerar;
      await ConfigIA.findOneAndUpdate({ owner: req.user.uid }, { $set: cambios, $setOnInsert: { owner: req.user.uid } }, { upsert: true, new: true });
      res.json(await estadoGasto(req.user.uid));
    } catch (err) { console.error("Error guardando límite IA:", err); res.status(500).json({ error: "No se pudo guardar el límite" }); }
  });

  // Revisar los textos de una imagen ya hecha (también las subidas de Gemini)
  app.post("/api/proyectos/:id/rama/:av/imagenes/:img/revisar", ...mw, async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      if (!mongoose.isValidObjectId(req.params.img)) return res.status(400).json({ error: "Imagen inválida" });
      const im = await ImagenLanding.findOne({ _id: req.params.img, owner: req.user.uid, proyecto: x.p._id });
      if (!im) return res.status(404).json({ error: "Imagen no encontrada" });
      const sec = (x.r.secciones || []).find(s => s.id === im.seccion);
      if (!sec?.prompt) return res.status(400).json({ error: "Esa sección no tiene prompt para comparar" });
      const revision = await revisarImagen(llamarIA, im, x.vista, sec, cierreSeccion(sec.prompt, x.vista, sec));
      if (!revision) return res.status(502).json({ error: "No se pudo revisar la imagen. Intenta de nuevo." });
      im.revision = revision; im.markModified("revision"); await im.save();
      res.json({ imagen: metaImagen(im) });
    } catch (err) { console.error("Error revisando imagen:", err.message); res.status(500).json({ error: "No se pudo revisar la imagen" }); }
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
      // Solo se mandan las fotos marcadas "Producto solo": las de referencia (flyers, catálogos con precios) la IA las copia
      const uso = Array.isArray(x.p.ficha?.usoFotos) ? x.p.ficha.usoFotos : [];
      const sirven = todas.map((_, i) => i).filter(i => uso[i] !== "referencia");
      if (!sirven.length) return res.status(400).json({ error: "Todas tus fotos están marcadas como 'Referencia'. Marca al menos una como 'Producto solo' en la Ficha." });
      // Si la revisión vio textos del proveedor en TODAS las fotos que van y el dueño no las ha tocado: no se genera (la IA copia el flyer)
      const revFotos = Array.isArray(x.p.revision?.fotos) ? x.p.revision.fotos : [];
      const conTexto = (i) => uso[i] === undefined && revFotos.some(f => Number(f.n) === i + 1 && f.tipo === "referencia");
      if (sirven.every(conTexto)) return res.status(400).json({ error: "Tu foto tiene textos del proveedor; la IA los va a copiar. Recórtala o sube una foto limpia (en la Ficha). Si estás seguro de que sirve, márcala como 'Producto solo'." });
      const pedidas = Array.isArray(req.body?.refs) ? [...new Set(req.body.refs.map(Number))].filter(i => sirven.includes(i)) : [];
      let fotos = (pedidas.length ? pedidas : sirven).map(i => todas[i]).slice(0, MAX_REFERENCIAS);
      // Reseñas: 1 foto del producto + las fotos reales que mandaron los clientes (en el orden de las reseñas)
      let clientes = 0;
      if (sec.tipo === "resenas") {
        const deClientes = (x.p.ficha?.resenas || []).filter(r => (r?.texto || r?.foto)).slice(0, 6).filter(r => /^data:image\/(jpeg|png|webp);base64,/.test(r.foto || "")).map(r => r.foto);
        if (deClientes.length) { fotos = [fotos[0], ...deClientes].slice(0, MAX_REFERENCIAS + 1); clientes = fotos.length - 1; }
      }
      // Regalo con la compra: en la portada, paquetes y cierre van las fotos reales de los regalos
      const oferta = ofertaDe(x.p.ficha || {}, x.p.pais === "EC" ? "EC" : "CO");
      if (oferta.conflicto) return res.status(400).json({ error: `${oferta.conflicto} Resuélvelo en la Ficha.` });
      // Variantes: la foto del color que le toca a esta sección va primero (en la portada, los colores de la promo)
      const { colores } = variantesDe(x.p.ficha || {});
      let colorNombres = [];
      if (colores.length > 1 && sec.tipo !== "resenas") {
        const n = PORTADAS_V.has(sec.tipo) ? (["2x1", "xy"].includes(oferta.tipo) ? Math.min(oferta.unidades, 2) : 1) : 1;
        const toca = PORTADAS_V.has(sec.tipo) ? colores.slice(0, n) : [colorDeSeccion(x.p.ficha || {}, x.r.secciones, sec)].filter(Boolean);
        const conFoto = toca.filter(c => c.foto);
        if (conFoto.length) { fotos = [...conFoto.map(c => c.foto), ...fotos].slice(0, MAX_REFERENCIAS); colorNombres = conFoto.map(c => c.nombre); }
      }
      let regalos = 0;
      if (oferta.tipo === "regalo" && ["oferta", "moda_portada", "paquetes", "oferta_cierre"].includes(sec.tipo)) {
        const fr = oferta.regalos.filter(g => g.foto).map(g => g.foto).slice(0, MAX_REFERENCIAS - 1);
        if (fr.length) { fotos = [fotos[0], ...fr].slice(0, MAX_REFERENCIAS); regalos = fotos.length - 1; colorNombres = colorNombres.slice(0, 1); }
      }
      const estimado = PRECIO_IMAGEN + PRECIO_REFERENCIA * fotos.length;
      const g = await estadoGasto(req.user.uid);
      if (g.usd + estimado > g.limite + 1e-9) {
        return res.status(400).json({ error: `Llegaste al límite de gasto de este mes ($${g.usd.toFixed(2)} de $${g.limite.toFixed(2)} USD). Súbelo si quieres seguir.`, gasto: g });
      }

      const clave = `${x.p._id}:${x.av}:${sec.id}`;
      if (enProceso.has(clave)) return res.status(409).json({ error: "Ya se está generando esta sección" });
      enProceso.add(clave); llave = clave;

      const bloque = x.r.bloqueEstilo || "";
      const promptFinal = cierreSeccion(sec.prompt, x.vista, sec);
      const intentos = g.autoRegenerar ? 2 : 1;
      let nueva = null, revision = null, rehecha = false;
      for (let intento = 0; intento < intentos; intento++) {
      try {
      if (intento > 0) {
        const g2 = await estadoGasto(req.user.uid);
        if (g2.usd + estimado > g2.limite + 1e-9) break;   // sin saldo para rehacerla: se queda la que hay
      }
      const r = await pedirImagen({ prompt: armarPrompt({
        bloqueEstilo: bloque, prompt: promptFinal, referencias: fotos.length, clientes, regalos,
        nombresRegalos: oferta.regalos.filter(g => g.foto).map(g => g.nombre), colorNombres,
        unidades: ["2x1", "xy"].includes(oferta.tipo) && ["oferta", "moda_portada", "paquetes", "oferta_cierre", "moda_precio_tallas"].includes(sec.tipo) ? oferta.unidades : 1,
        descripcion: String(x.p.revision?.descripcionFisica || "").slice(0, 600) + (x.p.ficha?.medidas ? ` Medidas: ${String(x.p.ficha.medidas).slice(0, 120)}.` : ""),
        noTiene: [...(Array.isArray(x.p.revision?.noTiene) ? x.p.revision.noTiene : []), x.p.ficha?.noTiene].filter(Boolean).join("; ").slice(0, 300)
      }), fotos, aspecto: aspectoDe(sec.formato) });

      await GastoIA.findOneAndUpdate(
        { owner: req.user.uid, mes: mesActual() },
        { $inc: { usd: r.rehechaPorForma ? estimado * 2 + PRECIO_REFERENCIA : estimado, imagenes: r.rehechaPorForma ? 2 : 1, ticks: r.ticks }, $set: { actualizado: new Date() }, $setOnInsert: { owner: req.user.uid, mes: mesActual() } },
        { upsert: true, new: true }
      );

      const rev = await revisarImagen(llamarIA, r, x.vista, sec, promptFinal);
      if (nueva) await ImagenLanding.deleteOne({ _id: nueva._id, owner: req.user.uid });   // la primera falló la revisión: se cambia por la nueva
      nueva = await ImagenLanding.create({
        owner: req.user.uid, proyecto: x.p._id, rama: x.av, seccion: sec.id,
        tipo: r.tipo, datos: r.datos, bytes: r.datos.length, origen: "ia", revision: rev, ancho: r.ancho || null, alto: r.alto || null
      });
      revision = rev; rehecha = intento > 0;
      if (!rev || rev.ok) break;
      } catch (e) {
        if (!nueva) throw e;   // si falla el segundo intento, se queda la primera imagen
        console.warn("Landing IA: no se pudo rehacer la imagen:", e.message);
        break;
      }
      }
      const rama = (await actualizarRama(x.p, x.av, (actual) => ({
        ...actual, secciones: (actual.secciones || []).map(s => s.id === sec.id ? { ...s, hecha: true } : s)
      }))) || x.r;
      res.json({ imagen: metaImagen(nueva), rama, gasto: await estadoGasto(req.user.uid), revision, rehecha });
    } catch (err) {
      console.error("Error generando imagen IA:", err.message);
      res.status(err.status || 500).json({ error: err.message || "No se pudo generar la imagen" });
    } finally {
      if (llave) enProceso.delete(llave);
    }
  });
}
