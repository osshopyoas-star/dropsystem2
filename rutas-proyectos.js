// =============================================
// 🧪 ESTUDIO DE LANDING (Desarrollo por pasos)
// Un "proyecto" por producto:
//   compartido: ficha → avatares
//   por avatar ("rama" A y B): estilo → landing → guiones → notas
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
  promptGuion,
  promptTextosShopify,
  seccionesFijas
} from "./prompts-landing.js";
import { obtenerPlantilla } from "./rutas-plantilla.js";
import { tiposDe, elegirVariante, formatoImagen, varianteDe } from "./public/js/core/plantilla.js";

const Mixed = mongoose.Schema.Types.Mixed;

const proyectoSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", index: true },
  origen: { type: String, default: "" },        // dropi / importacion / laboratorio (copiado del producto)
  dropiId: { type: String, default: "" },
  nombre: { type: String, default: "" },
  pais: { type: String, enum: ["CO", "EC"], default: "CO" },
  formato: { type: String, enum: ["ban", "normal"], default: "ban" },   // ban page (todo imágenes) o landing normal de Shopify
  numAvatares: { type: Number, default: 2 },
  paso: { type: Number, default: 1 },
  ficha: { type: Mixed, default: {} },          // descripcion, precio, precioAntes, regalo, paquetes, variantes, medidas, noTiene, promesas, estiloPreferido, notas
  fotos: { type: [String], default: [] },       // fotos reales comprimidas (data URL)
  revision: { type: Mixed, default: {} },       // descripcionFisica, noTiene[], tamano, coincide, dudas[], marcas[]
  avatares: { type: [Mixed], default: [] },
  // Trabajo de cada avatar por separado: { A: {paso, estilosPropuestos, estilo, bloqueEstilo, secciones, guiones, notas, vendio}, B: {...} }
  ramas: { type: Mixed, default: {} },
  pasosRamas: { type: Mixed, default: {} },     // resumen para la lista: { A: 5, B: 3 }
  // --- campos de la versión anterior (se migran a "ramas" al abrir el proyecto) ---
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

const CAMPOS_EDITABLES = ["nombre", "pais", "formato", "numAvatares", "paso", "ficha", "fotos", "revision", "avatares"];
const CAMPOS_RAMA = ["paso", "estilosPropuestos", "estilo", "bloqueEstilo", "secciones", "guiones", "notas", "vendio", "textos"];
const AVATARES_VALIDOS = ["A", "B"];

const MAX_FOTOS = 6;
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
  if (out.formato !== undefined) out.formato = out.formato === "normal" ? "normal" : "ban";
  if (out.numAvatares !== undefined) out.numAvatares = Number(out.numAvatares) === 1 ? 1 : 2;
  if (out.fotos !== undefined) {
    if (!Array.isArray(out.fotos)) delete out.fotos;
    else out.fotos = out.fotos.filter(fotoValida).slice(0, MAX_FOTOS);
  }
  if (out.avatares !== undefined && !Array.isArray(out.avatares)) delete out.avatares;
  return out;
}

function limpiarGuiones(lista, av) {
  return lista.slice(0, 6).map(g => ({
    id: String(g.id || nuevoId()), avatar: av,
    referencia: String(g.referencia || "").slice(0, 8000), link: String(g.link || "").slice(0, 500),
    nota: String(g.nota || "").slice(0, 500), guion: String(g.guion || "").slice(0, 3000),
    ganchos: Array.isArray(g.ganchos) ? g.ganchos.map(String).slice(0, 5) : [],
    historiaReal: !!g.historiaReal, verificar: Array.isArray(g.verificar) ? g.verificar.map(String).slice(0, 10) : []
  }));
}

// Textos de Shopify (landing normal)
function limpiarTextos(t) {
  if (!t || typeof t !== "object") return null;
  const txt = (v, n) => String(v || "").slice(0, n);
  const arr = (v, n, m) => (Array.isArray(v) ? v.slice(0, n).map(x => txt(x, m)) : []);
  return {
    titulo: txt(t.titulo, 200),
    frase_oferta: txt(t.frase_oferta, 200),
    beneficios: arr(t.beneficios, 6, 120),
    descripcion: txt(t.descripcion, 3000),
    especificaciones: arr(t.especificaciones, 12, 200),
    envio: txt(t.envio, 1500),
    preguntas: (Array.isArray(t.preguntas) ? t.preguntas : []).slice(0, 8)
      .map(q => ({ pregunta: txt(q?.pregunta, 300), respuesta: txt(q?.respuesta, 800) }))
  };
}

function limpiarRama(body = {}, av) {
  const out = {};
  for (const k of CAMPOS_RAMA) if (body[k] !== undefined) out[k] = body[k];
  if (out.paso !== undefined) out.paso = Math.min(6, Math.max(3, Number(out.paso) || 3));
  if (out.secciones !== undefined) {
    if (!Array.isArray(out.secciones)) delete out.secciones;
    else out.secciones = out.secciones.slice(0, 20).map(x => ({ ...x, grupo: av }));
  }
  if (out.guiones !== undefined) {
    if (!Array.isArray(out.guiones)) delete out.guiones;
    else out.guiones = limpiarGuiones(out.guiones, av);
  }
  if (out.estilosPropuestos !== undefined && !Array.isArray(out.estilosPropuestos)) delete out.estilosPropuestos;
  if (out.bloqueEstilo !== undefined) out.bloqueEstilo = String(out.bloqueEstilo).slice(0, 8000);
  if (out.vendio !== undefined) out.vendio = !!out.vendio;
  if (out.textos !== undefined) out.textos = limpiarTextos(out.textos);
  return out;
}

const ramaVacia = () => ({ paso: 3, estilosPropuestos: [], estilo: null, bloqueEstilo: "", secciones: [], guiones: [], notas: null, vendio: false, textos: null });

const plano = (p) => (typeof p.toObject === "function" ? p.toObject() : { ...p });

// Pasa los proyectos de la versión anterior (A y B mezclados) al nuevo orden por avatar
export function migrarProyecto(p) {
  const tieneRamas = p.ramas && Object.keys(p.ramas).length;
  const tieneViejo = p.estilo || (p.secciones || []).length || (p.guiones || []).length || p.notas;
  if (tieneRamas || !tieneViejo) return false;

  const ids = (p.avatares || []).map(a => a.id).filter(id => AVATARES_VALIDOS.includes(id));
  const ramas = {};
  for (const av of (ids.length ? ids : ["A"])) {
    ramas[av] = {
      paso: Math.min(6, Math.max(3, Number(p.paso) || 3)),
      estilosPropuestos: p.estilosPropuestos || [],
      estilo: p.estilo || null,
      bloqueEstilo: p.bloqueEstilo || "",
      secciones: (p.secciones || [])
        .filter(x => x.grupo === "compartida" || x.grupo === av || !x.grupo)
        .map(x => ({ ...x, id: (x.grupo === "compartida" && av !== "A") ? nuevoId() : x.id, grupo: av })),
      guiones: (p.guiones || []).filter(g => g.avatar === av),
      notas: av === "A" ? (p.notas || null) : null,
      vendio: !!p.vendio
    };
  }
  p.ramas = ramas;
  p.pasosRamas = Object.fromEntries(Object.entries(ramas).map(([k, r]) => [k, r.paso]));
  p.paso = Math.min(Number(p.paso) || 1, 2);
  p.estilosPropuestos = []; p.estilo = null; p.bloqueEstilo = ""; p.secciones = []; p.guiones = []; p.notas = null;
  return true;
}

export function registrarRutasProyectos(app, { llamarIA, iaLimiter, idValido, Producto }) {

  const cargar = async (req, res) => {
    if (!idValido(req.params.id)) { res.status(400).json({ error: "ID inválido" }); return null; }
    const p = await Proyecto.findOne({ _id: req.params.id, owner: req.user.uid });
    if (!p) { res.status(404).json({ error: "Proyecto no encontrado" }); return null; }
    if (migrarProyecto(p)) {
      p.markModified("ramas"); p.markModified("pasosRamas");
      await p.save();
    }
    return p;
  };

  // Rama (trabajo de un avatar). Exige que el avatar exista.
  const cargarRama = async (req, res) => {
    const p = await cargar(req, res); if (!p) return null;
    const av = String(req.params.av || "").toUpperCase();
    const avatar = (p.avatares || []).find(a => a.id === av);
    if (!AVATARES_VALIDOS.includes(av) || !avatar) {
      res.status(400).json({ error: "Primero genera y elige un avatar" });
      return null;
    }
    const ramas = p.ramas || {};
    const r = { ...ramaVacia(), ...(ramas[av] || {}) };
    const plantilla = await obtenerPlantilla(req.user.uid, p.formato);
    // "vista": lo que ven los prompts = proyecto + trabajo de este avatar, como una sola landing
    const vista = { ...plano(p), ...r, numAvatares: 1, avatares: [avatar], plantilla };
    return { p, av, avatar, r, vista, plantilla };
  };

  const guardarRama = async (p, av, r) => {
    p.ramas = { ...(p.ramas || {}), [av]: r };
    p.pasosRamas = { ...(p.pasosRamas || {}), [av]: r.paso };
    p.vendio = Object.values(p.ramas).some(x => x?.vendio);   // para mostrarlo en la Base de Productos
    p.markModified("ramas"); p.markModified("pasosRamas");
    p.actualizado = new Date();
    await p.save();
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
        .select("nombre pais formato paso pasosRamas productoId origen dropiId vendio estilo.nombre actualizado creado")
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
      const formato = req.body?.formato === "normal" ? "normal" : "ban";
      const p = await Proyecto.create({
        owner: req.user.uid,
        productoId: prod?._id || null,
        origen: prod?.origen || "",
        dropiId: prod?.dropiId || "",
        nombre,
        pais: paisFinal,
        formato,
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
      if (cambios.revision || cambios.ficha || cambios.formato) {
        const plantilla = await obtenerPlantilla(req.user.uid, p.formato);
        const ramas = { ...(p.ramas || {}) };
        for (const [av, r] of Object.entries(ramas)) {
          const avatar = (p.avatares || []).find(a => a.id === av);
          if (r?.estilo && avatar) {
            ramas[av] = { ...r, bloqueEstilo: construirBloqueEstilo({ ...plano(p), ...r, avatares: [avatar], plantilla }) };
          }
        }
        p.ramas = ramas; p.markModified("ramas");
      }
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

  // ---------- Guardar cambios del trabajo de un avatar ----------
  app.put("/api/proyectos/:id/rama/:av", async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const r = { ...x.r, ...limpiarRama(req.body, x.av) };
      await guardarRama(x.p, x.av, r);
      res.json({ rama: r });
    } catch (err) {
      console.error("Error guardando rama:", err);
      res.status(500).json({ error: "No se pudo guardar" });
    }
  });

  // ---------- IA: 3. estilos ----------
  app.post("/api/proyectos/:id/rama/:av/ia/estilos", iaLimiter, async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      // estilos ya usados: tus otros productos y el otro avatar de este producto
      const otros = await Proyecto.find({ owner: req.user.uid, _id: { $ne: x.p._id } }).select("nombre estilo ramas");
      const usados = [];
      for (const o of otros) {
        if (o.estilo?.nombre) usados.push(`${o.nombre}: ${o.estilo.nombre} (${o.estilo.fondo || ""} ${o.estilo.color2 || ""})`);
        for (const r of Object.values(o.ramas || {})) {
          if (r?.estilo?.nombre) usados.push(`${o.nombre}: ${r.estilo.nombre} (${r.estilo.fondo || ""} ${r.estilo.color2 || ""})`);
        }
      }
      for (const [av, r] of Object.entries(x.p.ramas || {})) {
        if (av !== x.av && r?.estilo?.nombre) usados.push(`Este mismo producto, avatar ${av}: ${r.estilo.nombre}`);
      }

      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptEstilos(x.vista, usados) });
      const j = parsearJSON(reply);
      const r = { ...x.r, estilosPropuestos: (j.estilos || []).slice(0, 3) };
      await guardarRama(x.p, x.av, r);
      res.json({ rama: r });
    } catch (err) { errorIA(res, err, "los estilos"); }
  });

  // Elegir estilo → arma el bloque de estilo con la plantilla de la guía
  app.post("/api/proyectos/:id/rama/:av/estilo", async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const e = req.body?.estilo;
      if (!e || typeof e !== "object") return res.status(400).json({ error: "Falta el estilo" });
      const r = { ...x.r, estilo: e };
      r.bloqueEstilo = construirBloqueEstilo({ ...x.vista, estilo: e });
      if (r.paso < 4) r.paso = 4;
      await guardarRama(x.p, x.av, r);
      res.json({ rama: r });
    } catch (err) {
      console.error("Error eligiendo estilo:", err);
      res.status(500).json({ error: "No se pudo guardar el estilo" });
    }
  });

  // ---------- IA: 4. proponer secciones ----------
  app.post("/api/proyectos/:id/rama/:av/ia/secciones", iaLimiter, async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      if (!x.r.estilo) return res.status(400).json({ error: "Primero elige un estilo" });

      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptPropuestaSecciones(x.vista, x.plantilla) });
      const j = parsearJSON(reply);
      const formato = x.p.formato === "normal" ? "normal" : "ban";
      const validos = tiposDe(formato);
      const propuestas = (Array.isArray(j.secciones) ? j.secciones : []).filter(sx => sx && typeof sx === "object");
      const fijas = seccionesFijas(x.vista, x.plantilla);

      // Con Mi plantilla: el orden es el del dueño; la IA solo pone títulos y composición
      let base;
      if (fijas) {
        const usadas = new Set();
        base = fijas.map(tipo => {
          const i = propuestas.findIndex((sx, k) => !usadas.has(k) && sx.tipo === tipo);
          if (i >= 0) usadas.add(i);
          return { ...(i >= 0 ? propuestas[i] : {}), tipo };
        });
      } else {
        // Tipos que no existen en este formato se descartan
        base = propuestas.filter(sx => validos.includes(sx.tipo)).slice(0, 12);
        const primera = formato === "normal" ? "galeria" : "oferta";
        if (!base.some(sx => sx.tipo === primera)) base.unshift({ tipo: primera });
      }

      const secciones = base.map(sx => {
        const tipo = sx.tipo;
        const variante = elegirVariante(tipo, x.plantilla);
        return {
          id: nuevoId(),
          tipo,
          titulo: String(sx.titulo || CATALOGO_SECCIONES[tipo].titulo),
          grupo: x.av,
          formato: formato === "normal"
            ? formatoImagen(tipo, formato)
            : (["9:16", "1:1", "16:9"].includes(sx.formato) ? sx.formato : "9:16"),
          variante,
          composicion: varianteDe(tipo, variante)?.nombre || String(sx.composicion || ""),
          proposito: String(sx.proposito || ""),
          prompt: "",
          hecha: false
        };
      });
      const r = { ...x.r, secciones };
      await guardarRama(x.p, x.av, r);
      res.json({ rama: r });
    } catch (err) { errorIA(res, err, "las secciones"); }
  });

  // ---------- IA: 4b. prompt de una sección ----------
  app.post("/api/proyectos/:id/rama/:av/ia/seccion/:secId", iaLimiter, async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const secs = x.r.secciones || [];
      const idx = secs.findIndex(sx => sx.id === req.params.secId);
      if (idx === -1) return res.status(404).json({ error: "Sección no encontrada" });
      const bloque = x.r.bloqueEstilo || construirBloqueEstilo(x.vista);

      const sec = secs[idx];
      const otras = secs.filter(sx => sx.id !== sec.id);
      const reply = await llamarIA({
        system: SISTEMA_LANDING,
        prompt: promptSeccion({ ...x.vista, bloqueEstilo: bloque }, sec, x.avatar, otras)
      });
      const texto = String(reply || "").replace(/^```[a-z]*\n?|```$/gim, "").trim();
      if (!texto) return res.status(502).json({ error: "La IA no devolvió el prompt" });

      const nuevas = [...secs];
      nuevas[idx] = { ...sec, prompt: texto, hecha: false };
      const r = { ...x.r, bloqueEstilo: bloque, secciones: nuevas };
      await guardarRama(x.p, x.av, r);
      res.json({ seccion: nuevas[idx] });
    } catch (err) { errorIA(res, err, "el prompt"); }
  });

  // ---------- IA: 5. guion de voz en off ----------
  app.post("/api/proyectos/:id/rama/:av/ia/guion/:gid", iaLimiter, async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const guiones = x.r.guiones || [];
      const idx = guiones.findIndex(g => g.id === req.params.gid);
      if (idx === -1) return res.status(404).json({ error: "Guion no encontrado" });

      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptGuion(x.vista, guiones[idx], x.avatar) });
      const j = parsearJSON(reply);
      if (!j.guion) return res.status(502).json({ error: "La IA no devolvió el guion" });

      const nuevos = [...guiones];
      nuevos[idx] = {
        ...guiones[idx],
        guion: String(j.guion),
        ganchos: Array.isArray(j.ganchos_alternativos) ? j.ganchos_alternativos.map(String).slice(0, 3) : [],
        historiaReal: !!j.historia_real,
        verificar: Array.isArray(j.verificar) ? j.verificar.map(String) : []
      };
      const r = { ...x.r, guiones: nuevos, paso: Math.max(x.r.paso || 3, 5) };
      await guardarRama(x.p, x.av, r);
      res.json({ guion: nuevos[idx] });
    } catch (err) { errorIA(res, err, "el guion"); }
  });

  // ---------- IA: textos de Shopify (landing normal) ----------
  app.post("/api/proyectos/:id/rama/:av/ia/textos", iaLimiter, async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptTextosShopify(x.vista, x.avatar) });
      const textos = limpiarTextos(parsearJSON(reply));
      if (!textos?.titulo) return res.status(502).json({ error: "La IA no devolvió los textos" });
      const r = { ...x.r, textos };
      await guardarRama(x.p, x.av, r);
      res.json({ rama: r });
    } catch (err) { errorIA(res, err, "los textos"); }
  });

  // ---------- IA: 6. notas antes de publicar ----------
  app.post("/api/proyectos/:id/rama/:av/ia/notas", iaLimiter, async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptNotas(x.vista) });
      const j = parsearJSON(reply);
      const arr = (v) => Array.isArray(v) ? v.map(String) : [];
      const r = {
        ...x.r,
        notas: { dudas: arr(j.dudas), riesgos: arr(j.riesgos), por_confirmar: arr(j.por_confirmar), revisar_en_imagenes: arr(j.revisar_en_imagenes) },
        paso: 6
      };
      await guardarRama(x.p, x.av, r);
      res.json({ rama: r });
    } catch (err) { errorIA(res, err, "las notas"); }
  });
}
