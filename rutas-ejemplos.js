// =============================================
// 🖼️ MI PLANTILLA: ejemplos reales por sección y "Mis landings que venden" (referencias de diseño)
// - Ejemplo: CoDropX escribe el prompt de esa receta y ese diseño con un producto cualquiera y genera la imagen.
//   Se guarda como miniatura del diseño (uno por diseño). No toca ningún proyecto; gasta del límite del mes
//   pero se cuenta aparte como "ejemplos".
// - Referencias: imágenes de una landing del dueño que sí vende, etiquetadas por receta. Al escribir prompts y al
//   generar imágenes de esa sección se adjuntan como guía de composición, densidad y acabado (nunca de producto,
//   textos, logos ni colores).
// =============================================
import mongoose from "mongoose";
import { SECCIONES, tiposDe, claveDe, varianteDe, CLAVES } from "./public/js/core/plantilla.js";
import { descripcionObjeto, promptSeccion, cierreSeccion, construirBloqueEstilo, SISTEMA_LANDING, resenasReales, SIN_PROMPT } from "./prompts-landing.js";
import { obtenerPlantilla } from "./rutas-plantilla.js";
import { pedirImagen, armarPrompt, GastoIA, estadoGasto, PRECIO_IMAGEN, PRECIO_REFERENCIA, aspectoDe, mesActual } from "./rutas-ia-imagenes.js";
import { tipoDeBytes } from "./modelo-imagenes.js";
import { ReferenciaLanding, referenciaDe, AVISO_REFERENCIA, MAX_REFERENCIAS_LANDING } from "./modelo-referencias.js";

const ejemploSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  clave: { type: String, required: true },     // ban · normal · moda_ban · moda_normal
  tipo: { type: String, required: true },      // tipo de sección (receta)
  variante: { type: String, default: "" },     // diseño A/B/C…
  producto: { type: String, default: "" },
  prompt: { type: String, default: "" },
  mime: String,
  datos: Buffer,
  creado: { type: Date, default: Date.now }
});
ejemploSchema.index({ owner: 1, clave: 1, tipo: 1, variante: 1 }, { unique: true });
export const EjemploPlantilla = mongoose.model("EjemploPlantilla", ejemploSchema);

const leerDataUrl = (v) => {
  const m = String(v || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const datos = Buffer.from(m[2], "base64");
  if (datos.length > 4 * 1024 * 1024 || !tipoDeBytes(datos)) return null;
  return { mime: tipoDeBytes(datos), datos };
};
const comoDataUrl = (d) => `data:${d.mime || "image/jpeg"};base64,${Buffer.from(d.datos.buffer || d.datos).toString("base64")}`;
const meta = (x) => ({ _id: String(x._id), clave: x.clave, tipo: x.tipo, variante: x.variante, producto: x.producto, activa: x.activa, creado: x.creado });

export function registrarRutasEjemplos(app, { llamarIA, limiter, Proyecto }) {
  const mw = limiter ? [limiter] : [];

  // ---------- Ejemplos ----------
  app.get("/api/plantilla/ejemplos", async (req, res) => {
    try {
      const filtro = { owner: req.user.uid };
      if (CLAVES.includes(req.query.clave)) filtro.clave = req.query.clave;
      const lista = await EjemploPlantilla.find(filtro).select("-datos -prompt").sort({ creado: -1 }).lean();
      res.json(lista.map(meta));
    } catch (e) { console.error("Ejemplos:", e); res.status(500).json({ error: "No se pudieron cargar los ejemplos" }); }
  });

  app.get("/api/plantilla/ejemplos/:id/img", async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).end();
      const x = await EjemploPlantilla.findOne({ _id: req.params.id, owner: req.user.uid }).lean();
      if (!x?.datos) return res.status(404).end();
      res.set("Content-Type", x.mime || "image/jpeg").set("Cache-Control", "private, max-age=86400").send(Buffer.from(x.datos.buffer || x.datos));
    } catch { res.status(500).end(); }
  });

  app.delete("/api/plantilla/ejemplos/:id", async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "ID inválido" });
      await EjemploPlantilla.deleteOne({ _id: req.params.id, owner: req.user.uid });
      res.json({ ok: true });
    } catch { res.status(500).json({ error: "No se pudo borrar" }); }
  });

  // Crear (o rehacer) el ejemplo de una sección y un diseño
  app.post("/api/plantilla/ejemplos", ...mw, async (req, res) => {
    try {
      const b = req.body || {};
      const clave = CLAVES.includes(b.clave) ? b.clave : "ban";
      const tipo = String(b.tipo || "");
      if (!tiposDe(clave).includes(tipo)) return res.status(400).json({ error: "Sección no válida" });
      const variante = varianteDe(tipo, b.variante)?.id || SECCIONES[tipo].variantes[0]?.id || "";
      const formato = clave.endsWith("normal") ? "normal" : "ban";
      const tipoProd = clave.startsWith("moda_") ? "moda" : "producto";
      const foto = b.foto ? leerDataUrl(b.foto) : null;
      if (b.foto && !foto) return res.status(400).json({ error: "La foto no es válida (JPG, PNG o WEBP de máximo 4 MB)" });

      // Producto: uno de tus proyectos (con su Ficha, fotos y avatar) o solo el nombre que escribiste
      let base = null;
      if (b.proyecto && mongoose.isValidObjectId(b.proyecto) && Proyecto) {
        const p = await Proyecto.findOne({ _id: b.proyecto, owner: req.user.uid }).lean();
        if (!p) return res.status(404).json({ error: "Proyecto no encontrado" });
        const r = p.ramas?.A || {};
        base = { ...p, ...r, formato, tipo: tipoProd, avatares: (p.avatares || []).slice(0, 1), numAvatares: 1 };
      }
      const nombre = String(b.producto || base?.nombre || "").trim().slice(0, 120);
      if (!nombre) return res.status(400).json({ error: "Escribe con qué producto hacer el ejemplo" });
      const plantilla = await obtenerPlantilla(req.user.uid, formato, tipoProd);
      const c = plantilla.colores || {};
      const p = base || {
        nombre, pais: "CO", formato, tipo: tipoProd, numAvatares: 1, avatares: [],
        ficha: { descripcion: nombre, precio: 99900, precioAntes: 149900, promesas: { envioGratis: true } },
        revision: {}, fotos: []
      };
      if (!p.estilo) p.estilo = { nombre: "Ejemplo", fondo: `fondo ${c.fondo || "#111111"}`, color1: `color principal ${c.color1 || "#ffffff"}`, color2: `color secundario ${c.color2 || "#22d3ee"}`, acento: `acento ${c.acento || "#22d3ee"}` };
      const delProyecto = (p.fotos || []).filter(f => /^data:image\//.test(f));
      const limpias = delProyecto.filter((f, i) => (p.ficha?.usoFotos || [])[i] !== "referencia");
      const fotos = [...(foto ? [comoDataUrl(foto)] : []), ...(limpias.length ? limpias : delProyecto)].slice(0, 3);
      const fotosConTexto = !foto && (!limpias.length || (p.revision?.textosEnFotos || []).length > 0) && fotos.length > 0;

      // Foto real: no se genera; el ejemplo es tu foto
      if (SIN_PROMPT.has(tipo)) {
        if (!fotos.length) return res.status(400).json({ error: "La foto real no se genera con IA: sube una foto del producto para el ejemplo." });
        const d = leerDataUrl(fotos[0]);
        const x = await EjemploPlantilla.findOneAndUpdate({ owner: req.user.uid, clave, tipo, variante },
          { $set: { producto: nombre, prompt: "", mime: d.mime, datos: d.datos, creado: new Date() } }, { upsert: true, new: true });
        return res.json({ ejemplo: meta(x), gasto: await estadoGasto(req.user.uid) });
      }
      if (["resenas", "moda_chats", "resumen_resenas"].includes(tipo) && resenasReales(p).length < 2)
        return res.status(400).json({ error: "Esta sección lleva reseñas REALES: elige un proyecto que tenga al menos 2 en la Ficha." });

      const ref = await referenciaDe(req.user.uid, tipo);
      const estimado = PRECIO_IMAGEN + PRECIO_REFERENCIA * (fotos.length + (ref ? 1 : 0));
      const g = await estadoGasto(req.user.uid);
      if (g.usd + estimado > g.limite + 1e-9) return res.status(400).json({ error: `Llegaste al límite del mes ($${g.limite} USD). Súbelo en el paso Landing si quieres seguir.` });

      const seccion = { id: "ejemplo", tipo, titulo: SECCIONES[tipo].titulo, formato: formato === "normal" ? "1:1" : "9:16", variante };
      const vista = { ...p, secciones: [seccion], plantilla };
      const bloque = p.bloqueEstilo || construirBloqueEstilo(vista);
      vista.bloqueEstilo = bloque;
      const texto = promptSeccion(vista, seccion, (p.avatares || [])[0] || null, []) + (ref ? `\n\nIMAGEN ADJUNTA: una landing del dueño que SÍ vende, de esta misma sección. ${AVISO_REFERENCIA}` : "");
      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: texto, ...(ref ? { image: ref } : {}) });
      const crudo = String(reply || "").replace(/^```[a-z]*\n?|```$/gim, "").trim();
      if (!crudo) return res.status(502).json({ error: "La IA no devolvió el prompt" });
      const promptFinal = cierreSeccion(crudo, vista, seccion);
      const r = await pedirImagen({
        prompt: armarPrompt({ bloqueEstilo: bloque, prompt: promptFinal, referencias: fotos.length, fotosConTexto, descripcion: descripcionObjeto(p).slice(0, 600) }) + (ref ? `\n\nREFERENCIA DE DISEÑO: <IMAGE_${fotos.length}> es una landing que sí vende. ${AVISO_REFERENCIA}` : ""),
        fotos, extra: ref ? [ref] : [], aspecto: aspectoDe(seccion.formato)
      });
      await GastoIA.findOneAndUpdate(
        { owner: req.user.uid, mes: mesActual() },
        { $inc: { usd: r.rehechaPorForma ? estimado * 2 + PRECIO_REFERENCIA : estimado, imagenes: 1, ticks: r.ticks, ejemplos: 1, usdEjemplos: estimado }, $set: { actualizado: new Date() }, $setOnInsert: { owner: req.user.uid, mes: mesActual() } },
        { upsert: true }
      );
      const x = await EjemploPlantilla.findOneAndUpdate({ owner: req.user.uid, clave, tipo, variante },
        { $set: { producto: nombre, prompt: promptFinal.slice(0, 20000), mime: r.tipo, datos: r.datos, creado: new Date() } }, { upsert: true, new: true });
      res.json({ ejemplo: meta(x), gasto: await estadoGasto(req.user.uid) });
    } catch (err) {
      console.error("Error creando ejemplo:", err);
      res.status(err.status || 500).json({ error: err.message || "No se pudo crear el ejemplo" });
    }
  });

  // ---------- Mis landings que venden (referencias) ----------
  app.get("/api/plantilla/referencias", async (req, res) => {
    try {
      const lista = await ReferenciaLanding.find({ owner: req.user.uid }).select("-datos").sort({ creado: -1 }).lean();
      res.json(lista.map(meta));
    } catch { res.status(500).json({ error: "No se pudieron cargar tus referencias" }); }
  });
  app.get("/api/plantilla/referencias/:id/img", async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).end();
      const x = await ReferenciaLanding.findOne({ _id: req.params.id, owner: req.user.uid }).lean();
      if (!x?.datos) return res.status(404).end();
      res.set("Content-Type", x.mime || "image/jpeg").set("Cache-Control", "private, max-age=86400").send(Buffer.from(x.datos.buffer || x.datos));
    } catch { res.status(500).end(); }
  });
  app.post("/api/plantilla/referencias", async (req, res) => {
    try {
      const tipo = String(req.body?.tipo || "");
      if (!SECCIONES[tipo]) return res.status(400).json({ error: "Elige a qué sección corresponde" });
      const d = leerDataUrl(req.body?.dataUrl);
      if (!d) return res.status(400).json({ error: "La imagen no es válida (JPG, PNG o WEBP de máximo 4 MB)" });
      if (await ReferenciaLanding.countDocuments({ owner: req.user.uid }) >= MAX_REFERENCIAS_LANDING) return res.status(400).json({ error: `Máximo ${MAX_REFERENCIAS_LANDING} referencias. Borra alguna.` });
      const x = await ReferenciaLanding.create({ owner: req.user.uid, tipo, mime: d.mime, datos: d.datos });
      res.json(meta(x));
    } catch (e) { console.error("Referencia:", e); res.status(500).json({ error: "No se pudo guardar la referencia" }); }
  });
  app.put("/api/plantilla/referencias/:id", async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "ID inválido" });
      const set = {};
      if (typeof req.body?.activa === "boolean") set.activa = req.body.activa;
      if (SECCIONES[req.body?.tipo]) set.tipo = req.body.tipo;
      const x = await ReferenciaLanding.findOneAndUpdate({ _id: req.params.id, owner: req.user.uid }, { $set: set }, { new: true }).select("-datos").lean();
      if (!x) return res.status(404).json({ error: "No existe" });
      res.json(meta(x));
    } catch { res.status(500).json({ error: "No se pudo cambiar" }); }
  });
  app.delete("/api/plantilla/referencias/:id", async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "ID inválido" });
      await ReferenciaLanding.deleteOne({ _id: req.params.id, owner: req.user.uid });
      res.json({ ok: true });
    } catch { res.status(500).json({ error: "No se pudo borrar" }); }
  });
}
