// =============================================
// 🧪 ESTUDIO DE LANDING (Desarrollo por pasos)
// Un "proyecto" por producto: ficha → avatares → estilo → landing → notas
// =============================================
import mongoose from "mongoose";
import {
  SISTEMA_LANDING,
  CATALOGO_SECCIONES,
  promptRevisarFicha,
  promptAvatares,
  promptEstilos,
  construirBloqueEstilo,
  promptPropuestaSecciones,
  promptSeccion,
  promptNotas,
  promptGuion
} from "./prompts-landing.js";

const Mixed = mongoose.Schema.Types.Mixed;

const proyectoSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", index: true },
  origen: { type: String, default: "" },        // dropi / importacion / laboratorio (copiado del producto)
  dropiId: { type: String, default: "" },
  nombre: { type: String, default: "" },
  pais: { type: String, enum: ["CO", "EC"], default: "CO" },
  numAvatares: { type: Number, default: 2 },
  paso: { type: Number, default: 1 },
  ficha: { type: Mixed, default: {} },          // descripcion, precio, precioAntes, regalo, paquetes, variantes, medidas, noTiene, promesas, estiloPreferido, notas
  fotos: { type: [String], default: [] },       // fotos reales comprimidas (data URL)
  revision: { type: Mixed, default: {} },       // descripcionFisica, noTiene[], tamano, coincide, dudas[], marcas[]
  avatares: { type: [Mixed], default: [] },
  estilosPropuestos: { type: [Mixed], default: [] },
  estilo: { type: Mixed, default: null },
  bloqueEstilo: { type: String, default: "" },
  secciones: { type: [Mixed], default: [] },    // { id, tipo, titulo, grupo, formato, composicion, proposito, prompt, hecha }
  guiones: { type: [Mixed], default: [] },     // { id, avatar, referencia, link, nota, guion, ganchos[], historiaReal, verificar[] }
  notas: { type: Mixed, default: null },
  vendio: { type: Boolean, default: false },
  creado: { type: Date, default: Date.now },
  actualizado: { type: Date, default: Date.now }
});

export const Proyecto = mongoose.model("Proyecto", proyectoSchema);

const CAMPOS_EDITABLES = [
  "nombre", "pais", "numAvatares", "paso", "ficha", "fotos", "revision", "avatares",
  "estilosPropuestos", "estilo", "bloqueEstilo", "secciones", "guiones", "notas", "vendio"
];

const MAX_FOTOS = 4;
const MAX_FOTO_BYTES = 1_500_000; // ~1.5 MB por foto ya comprimida

const fotoValida = (f) =>
  typeof f === "string" && /^data:image\/(png|jpe?g|webp);base64,/.test(f) && f.length <= MAX_FOTO_BYTES;

const nuevoId = () => Math.random().toString(36).slice(2, 10);

// Saca el JSON de una respuesta de IA aunque venga con texto alrededor
export function parsearJSON(texto = "") {
  const t = String(texto);
  const ini = t.indexOf("{");
  const fin = t.lastIndexOf("}");
  if (ini === -1 || fin === -1) throw new Error("La IA no devolvió JSON");
  return JSON.parse(t.slice(ini, fin + 1));
}

function limpiarCambios(body = {}) {
  const out = {};
  for (const k of CAMPOS_EDITABLES) if (body[k] !== undefined) out[k] = body[k];

  if (out.pais && !["CO", "EC"].includes(out.pais)) delete out.pais;
  if (out.numAvatares !== undefined) out.numAvatares = Number(out.numAvatares) === 1 ? 1 : 2;
  if (out.fotos !== undefined) {
    if (!Array.isArray(out.fotos)) delete out.fotos;
    else out.fotos = out.fotos.filter(fotoValida).slice(0, MAX_FOTOS);
  }
  if (out.secciones !== undefined && !Array.isArray(out.secciones)) delete out.secciones;
  if (out.avatares !== undefined && !Array.isArray(out.avatares)) delete out.avatares;
  if (out.guiones !== undefined) {
    if (!Array.isArray(out.guiones)) delete out.guiones;
    else out.guiones = out.guiones.slice(0, 12).map(g => ({
      id: String(g.id || nuevoId()), avatar: g.avatar === "B" ? "B" : "A",
      referencia: String(g.referencia || "").slice(0, 8000), link: String(g.link || "").slice(0, 500),
      nota: String(g.nota || "").slice(0, 500), guion: String(g.guion || "").slice(0, 3000),
      ganchos: Array.isArray(g.ganchos) ? g.ganchos.map(String).slice(0, 5) : [],
      historiaReal: !!g.historiaReal, verificar: Array.isArray(g.verificar) ? g.verificar.map(String).slice(0, 10) : []
    }));
  }
  return out;
}

export function registrarRutasProyectos(app, { llamarIA, iaLimiter, idValido, Producto }) {

  const cargar = async (req, res) => {
    if (!idValido(req.params.id)) { res.status(400).json({ error: "ID inválido" }); return null; }
    const p = await Proyecto.findOne({ _id: req.params.id, owner: req.user.uid });
    if (!p) { res.status(404).json({ error: "Proyecto no encontrado" }); return null; }
    return p;
  };

  const errorIA = (res, err, que) => {
    console.error(`Error IA (${que}):`, err);
    res.status(err.status || 500).json({ error: err.message || `No se pudo generar ${que}` });
  };

  // ---------- CRUD ----------
  app.get("/api/proyectos", async (req, res) => {
    try {
      const filtro = { owner: req.user.uid };
      if (req.query.productoId && idValido(req.query.productoId)) filtro.productoId = req.query.productoId;
      const lista = await Proyecto.find(filtro)
        .select("nombre pais paso productoId origen dropiId vendio estilo.nombre actualizado creado")
        .sort({ actualizado: -1 })
        .limit(100);
      res.json(lista);
    } catch (err) {
      console.error("Error listando proyectos:", err);
      res.status(500).json({ error: "No se pudieron cargar los proyectos" });
    }
  });

  // Estados de la Base de Productos que pasan solos a "desarrollo" al abrir un proyecto
  const ESTADOS_PREVIOS = ["", "idea", "validando"];

  app.post("/api/proyectos", async (req, res) => {
    try {
      const { productoId = null, pais = null } = req.body || {};
      let nombre = String(req.body?.nombre || "").slice(0, 200).trim();
      const ficha = {};
      let prod = null;

      if (productoId && idValido(productoId)) {
        prod = await Producto.findOne({ _id: productoId, owner: req.user.uid });
        if (!prod) return res.status(404).json({ error: "Producto no encontrado" });
      }

      if (prod) {
        // Al entrar a desarrollo, el producto pasa a estado "desarrollo"
        if (ESTADOS_PREVIOS.includes(String(prod.estado || "").toLowerCase())) {
          await Producto.findOneAndUpdate({ _id: prod._id, owner: req.user.uid }, { estado: "desarrollo" });
        }
        // Un solo proyecto por producto: si ya existe, se abre ese
        const existente = await Proyecto.findOne({ owner: req.user.uid, productoId: prod._id });
        if (existente) return res.json({ ...existente.toObject(), existente: true });

        nombre = nombre || prod.nombre || "";
        if (prod.material) ficha.notas = prod.material;
      }
      if (!nombre) return res.status(400).json({ error: "Escribe el nombre del producto" });

      const paisFinal = (pais || prod?.pais) === "EC" ? "EC" : "CO";
      const p = await Proyecto.create({
        owner: req.user.uid,
        productoId: prod?._id || null,
        origen: prod?.origen || "",
        dropiId: prod?.dropiId || "",
        nombre,
        pais: paisFinal,
        ficha
      });
      res.json(p);
    } catch (err) {
      console.error("Error creando proyecto:", err);
      res.status(500).json({ error: "No se pudo crear el proyecto" });
    }
  });

  app.get("/api/proyectos/:id", async (req, res) => {
    const p = await cargar(req, res); if (!p) return;
    res.json(p);
  });

  app.put("/api/proyectos/:id", async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      const cambios = limpiarCambios(req.body);
      Object.assign(p, cambios, { actualizado: new Date() });
      await p.save();
      res.json(p);
    } catch (err) {
      console.error("Error guardando proyecto:", err);
      res.status(500).json({ error: "No se pudo guardar" });
    }
  });

  app.delete("/api/proyectos/:id", async (req, res) => {
    if (!idValido(req.params.id)) return res.status(400).json({ error: "ID inválido" });
    const r = await Proyecto.findOneAndDelete({ _id: req.params.id, owner: req.user.uid });
    if (!r) return res.status(404).json({ error: "Proyecto no encontrado" });
    res.json({ ok: true });
  });

  // ---------- IA: 1. revisar fotos vs descripción ----------
  app.post("/api/proyectos/:id/ia/revisar", iaLimiter, async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      if (!p.fotos.length && !p.ficha?.descripcion) {
        return res.status(400).json({ error: "Sube al menos una foto o pega la descripción del proveedor" });
      }
      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptRevisarFicha(p), images: p.fotos });
      const j = parsearJSON(reply);
      p.revision = {
        descripcionFisica: String(j.descripcion_fisica || ""),
        noTiene: Array.isArray(j.no_tiene) ? j.no_tiene.map(String) : [],
        tamano: String(j.tamano || ""),
        coincide: j.coincide !== false,
        dudas: Array.isArray(j.dudas) ? j.dudas.map(String) : [],
        marcas: Array.isArray(j.marcas) ? j.marcas.map(String) : []
      };
      p.markModified("revision");
      p.actualizado = new Date();
      await p.save();
      res.json({ revision: p.revision });
    } catch (err) { errorIA(res, err, "la revisión"); }
  });

  // ---------- IA: 2. avatares ----------
  app.post("/api/proyectos/:id/ia/avatares", iaLimiter, async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptAvatares(p), images: p.fotos.slice(0, 1) });
      const j = parsearJSON(reply);
      const ids = p.numAvatares === 1 ? ["A"] : ["A", "B"];
      p.avatares = (j.avatares || []).slice(0, ids.length).map((a, i) => ({
        id: ids[i],
        quien: String(a.quien || ""), problema: String(a.problema || ""), probado: String(a.probado || ""),
        frase: String(a.frase || ""), angulo: String(a.angulo || ""), titular: String(a.titular || ""),
        escena: String(a.escena || ""), tono: String(a.tono || "")
      }));
      if (p.paso < 2) p.paso = 2;
      p.actualizado = new Date();
      await p.save();
      res.json({ avatares: p.avatares });
    } catch (err) { errorIA(res, err, "los avatares"); }
  });

  // ---------- IA: 3. estilos ----------
  app.post("/api/proyectos/:id/ia/estilos", iaLimiter, async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      // estilos ya usados en tus otros proyectos
      const otros = await Proyecto.find({ owner: req.user.uid, _id: { $ne: p._id } }).select("nombre estilo");
      const usados = otros.filter(o => o.estilo?.nombre).map(o => `${o.nombre}: ${o.estilo.nombre} (${o.estilo.fondo || ""} ${o.estilo.color2 || ""})`);

      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptEstilos(p, usados) });
      const j = parsearJSON(reply);
      p.estilosPropuestos = (j.estilos || []).slice(0, 3);
      if (p.paso < 3) p.paso = 3;
      p.actualizado = new Date();
      await p.save();
      res.json({ estilosPropuestos: p.estilosPropuestos });
    } catch (err) { errorIA(res, err, "los estilos"); }
  });

  // Elegir estilo → arma el bloque de estilo con la plantilla de la guía
  app.post("/api/proyectos/:id/estilo", async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      const e = req.body?.estilo;
      if (!e || typeof e !== "object") return res.status(400).json({ error: "Falta el estilo" });
      p.estilo = e;
      p.bloqueEstilo = construirBloqueEstilo(p);
      if (p.paso < 4) p.paso = 4;
      p.actualizado = new Date();
      await p.save();
      res.json({ estilo: p.estilo, bloqueEstilo: p.bloqueEstilo });
    } catch (err) {
      console.error("Error eligiendo estilo:", err);
      res.status(500).json({ error: "No se pudo guardar el estilo" });
    }
  });

  // ---------- IA: 4. proponer secciones ----------
  app.post("/api/proyectos/:id/ia/secciones", iaLimiter, async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      if (!p.estilo) return res.status(400).json({ error: "Primero elige un estilo" });

      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptPropuestaSecciones(p) });
      const j = parsearJSON(reply);
      const dos = p.numAvatares !== 1;
      const secciones = [];

      for (const s of (j.secciones || []).slice(0, 12)) {
        const tipo = CATALOGO_SECCIONES[s.tipo] ? s.tipo : "funcion_estrella";
        const base = {
          tipo,
          titulo: String(s.titulo || CATALOGO_SECCIONES[tipo].titulo),
          formato: ["9:16", "1:1", "16:9"].includes(s.formato) ? s.formato : "9:16",
          composicion: String(s.composicion || ""),
          proposito: String(s.proposito || ""),
          prompt: "",
          hecha: false
        };
        const porAvatar = dos && /A\s*\/\s*B|^A$|^B$/i.test(String(s.grupo || ""));
        if (porAvatar) {
          secciones.push({ ...base, id: nuevoId(), grupo: "A" });
          secciones.push({ ...base, id: nuevoId(), grupo: "B" });
        } else {
          secciones.push({ ...base, id: nuevoId(), grupo: "compartida" });
        }
      }

      p.secciones = secciones;
      p.actualizado = new Date();
      await p.save();
      res.json({ secciones: p.secciones });
    } catch (err) { errorIA(res, err, "las secciones"); }
  });

  // ---------- IA: 4b. prompt de una sección ----------
  app.post("/api/proyectos/:id/ia/seccion/:secId", iaLimiter, async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      const idx = p.secciones.findIndex(s => s.id === req.params.secId);
      if (idx === -1) return res.status(404).json({ error: "Sección no encontrada" });
      if (!p.bloqueEstilo) p.bloqueEstilo = construirBloqueEstilo(p);

      const sec = p.secciones[idx];
      const avatar = sec.grupo === "compartida" ? null : p.avatares.find(a => a.id === sec.grupo) || null;
      const otras = p.secciones.filter(s => s.id !== sec.id && (s.grupo === "compartida" || s.grupo === sec.grupo));

      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptSeccion(p, sec, avatar, otras) });
      const texto = String(reply || "").replace(/^```[a-z]*\n?|```$/gim, "").trim();
      if (!texto) return res.status(502).json({ error: "La IA no devolvió el prompt" });

      p.secciones[idx] = { ...sec, prompt: texto, hecha: false };
      p.markModified("secciones");
      p.actualizado = new Date();
      await p.save();
      res.json({ seccion: p.secciones[idx] });
    } catch (err) { errorIA(res, err, "el prompt"); }
  });

  // ---------- IA: 5. guion de voz en off ----------
  app.post("/api/proyectos/:id/ia/guion/:gid", iaLimiter, async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      const idx = (p.guiones || []).findIndex(g => g.id === req.params.gid);
      if (idx === -1) return res.status(404).json({ error: "Guion no encontrado" });
      const g = p.guiones[idx];
      const avatar = (p.avatares || []).find(a => a.id === g.avatar) || p.avatares?.[0] || null;

      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptGuion(p, g, avatar) });
      const j = parsearJSON(reply);
      if (!j.guion) return res.status(502).json({ error: "La IA no devolvió el guion" });

      p.guiones[idx] = {
        ...g,
        guion: String(j.guion),
        ganchos: Array.isArray(j.ganchos_alternativos) ? j.ganchos_alternativos.map(String).slice(0, 3) : [],
        historiaReal: !!j.historia_real,
        verificar: Array.isArray(j.verificar) ? j.verificar.map(String) : []
      };
      p.markModified("guiones");
      if (p.paso < 5) p.paso = 5;
      p.actualizado = new Date();
      await p.save();
      res.json({ guion: p.guiones[idx] });
    } catch (err) { errorIA(res, err, "el guion"); }
  });

  // ---------- IA: 6. notas antes de publicar ----------
  app.post("/api/proyectos/:id/ia/notas", iaLimiter, async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptNotas(p) });
      const j = parsearJSON(reply);
      const arr = (x) => Array.isArray(x) ? x.map(String) : [];
      p.notas = { dudas: arr(j.dudas), riesgos: arr(j.riesgos), por_confirmar: arr(j.por_confirmar), revisar_en_imagenes: arr(j.revisar_en_imagenes) };
      if (p.paso < 6) p.paso = 6;
      p.actualizado = new Date();
      await p.save();
      res.json({ notas: p.notas });
    } catch (err) { errorIA(res, err, "las notas"); }
  });
}
