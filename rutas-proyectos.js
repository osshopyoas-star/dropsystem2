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
  promptCopys,
  promptAd,
  seccionesFijas
} from "./prompts-landing.js";
import { obtenerPlantilla } from "./rutas-plantilla.js";
import { ESTRUCTURAS_AD, FORMATOS_AD, MAX_ADS } from "./public/js/core/anuncios.js";
import { ImagenLanding } from "./modelo-imagenes.js";
import { tiposDe, elegirVariante, formatoImagen, varianteDe, claveDe } from "./public/js/core/plantilla.js";

const Mixed = mongoose.Schema.Types.Mixed;

const proyectoSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", index: true },
  origen: { type: String, default: "" },        // dropi / importacion / laboratorio (copiado del producto)
  dropiId: { type: String, default: "" },
  nombre: { type: String, default: "" },
  pais: { type: String, enum: ["CO", "EC"], default: "CO" },
  formato: { type: String, enum: ["ban", "normal"], default: "ban" },
  tipo: { type: String, enum: ["producto", "moda"], default: "producto" },    // moda: ropa, calzado, accesorios   // ban page (todo imágenes) o landing normal de Shopify
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
  listo: { type: Date, default: null },         // cuándo le diste "Pasar a testeo"
  creado: { type: Date, default: Date.now },
  actualizado: { type: Date, default: Date.now }
});

export const Proyecto = mongoose.model("Proyecto", proyectoSchema);

const CAMPOS_EDITABLES = ["nombre", "pais", "formato", "tipo", "numAvatares", "paso", "ficha", "fotos", "revision", "avatares"];
const CAMPOS_RAMA = ["paso", "estilosPropuestos", "estilo", "bloqueEstilo", "secciones", "guiones", "notas", "vendio", "textos", "copys", "ads"];
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
  if (out.tipo !== undefined) out.tipo = out.tipo === "moda" ? "moda" : "producto";
  if (out.numAvatares !== undefined) out.numAvatares = Number(out.numAvatares) === 1 ? 1 : 2;
  if (out.fotos !== undefined) {
    if (!Array.isArray(out.fotos)) delete out.fotos;
    else out.fotos = out.fotos.filter(fotoValida).slice(0, MAX_FOTOS);
  }
  if (out.avatares !== undefined && !Array.isArray(out.avatares)) delete out.avatares;
  if (out.ficha && typeof out.ficha === "object" && out.ficha.resenas !== undefined) out.ficha = { ...out.ficha, resenas: limpiarResenas(out.ficha.resenas) };
  return out;
}

// Reseñas reales que el dueño pega en la Ficha (se usan textuales en la sección de reseñas)
const MAX_FOTO_RESENA = 400_000;
export function limpiarResenas(lista) {
  if (!Array.isArray(lista)) return [];
  const txt = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, n);
  return lista.slice(0, 6).map(r => {
    const e = Math.round(Number(r?.estrellas));
    const foto = typeof r?.foto === "string" && /^data:image\/(png|jpe?g|webp);base64,/.test(r.foto) && r.foto.length <= MAX_FOTO_RESENA ? r.foto : "";
    return { nombre: txt(r?.nombre, 40), ciudad: txt(r?.ciudad, 40), texto: txt(r?.texto, 300), estrellas: e >= 1 && e <= 5 ? e : 0, foto };
  }).filter(r => r.texto || r.foto);     // una reseña puede ser solo la foto que mandó el cliente
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

// Copys de anuncios
function limpiarCopys(c) {
  if (!c || typeof c !== "object") return null;
  const txt = (v, n) => String(v || "").slice(0, n);
  const enfoques = ["problema", "beneficio", "curiosidad"];
  return {
    meta: (Array.isArray(c.meta) ? c.meta : []).slice(0, 3).map((v, i) => ({
      enfoque: enfoques.includes(v?.enfoque) ? v.enfoque : enfoques[i] || "problema",
      texto_principal: txt(v?.texto_principal, 1500),
      titulo: txt(v?.titulo, 80),
      descripcion: txt(v?.descripcion, 60)
    })),
    tiktok: txt(c.tiktok, 200).replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu, "").replace(/#\S+/g, "").replace(/\s{2,}/g, " ").trim(),
    opciones: {
      envio: !!c.opciones?.envio, contraEntrega: c.opciones?.contraEntrega !== false, precio: !!c.opciones?.precio
    }
  };
}

// Ads estáticos: { id, estructura, formato, precio, nota, prompt, hecha }
function limpiarAds(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.slice(0, MAX_ADS).filter(a => a && ESTRUCTURAS_AD[a.estructura]).map(a => ({
    id: String(a.id || nuevoId()).slice(0, 20),
    estructura: a.estructura,
    formato: FORMATOS_AD[a.formato] ? a.formato : "4:5",
    precio: a.precio !== false,
    nota: String(a.nota || "").slice(0, 300),
    prompt: String(a.prompt || "").slice(0, 6000),
    hecha: !!a.hecha
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
  if (out.copys !== undefined) out.copys = limpiarCopys(out.copys);
  if (out.ads !== undefined) out.ads = limpiarAds(out.ads);
  return out;
}

const ramaVacia = () => ({ paso: 3, estilosPropuestos: [], estilo: null, bloqueEstilo: "", secciones: [], guiones: [], notas: null, vendio: false, textos: null, copys: null, ads: [] });

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
    const plantilla = await obtenerPlantilla(req.user.uid, p.formato, p.tipo);
    // "vista": lo que ven los prompts = proyecto + trabajo de este avatar, como una sola landing
    const vista = { ...plano(p), ...r, numAvatares: 1, avatares: [avatar], plantilla };
    return { p, av, avatar, r, vista, plantilla };
  };

  // Guarda SOLO el trabajo de este avatar (no pisa al otro avatar si se está trabajando en los dos a la vez)
  const guardarRama = async (p, av, r) => {
    const ahora = new Date();
    await Proyecto.updateOne({ _id: p._id }, { $set: { [`ramas.${av}`]: r, [`pasosRamas.${av}`]: r.paso, actualizado: ahora } });
    p.ramas = { ...(p.ramas || {}), [av]: r };
    p.pasosRamas = { ...(p.pasosRamas || {}), [av]: r.paso };
    p.actualizado = ahora;
    // "Vendió" del proyecto (para la Base de Productos) con lo que hay guardado ahora
    const fresco = await Proyecto.findOne({ _id: p._id }).select("ramas vendio").lean();
    const vendio = Object.values(fresco?.ramas || {}).some(x => x?.vendio);
    if (fresco && !!fresco.vendio !== vendio) await Proyecto.updateOne({ _id: p._id }, { $set: { vendio } });
    p.vendio = vendio;
  };

  // Vuelve a leer este avatar justo antes de guardar y aplica solo el cambio (la IA tarda y mientras tanto pudo cambiar)
  const actualizarRama = async (p, av, cambio) => {
    const fresco = await Proyecto.findOne({ _id: p._id }).select("ramas").lean();
    const actual = { ...ramaVacia(), ...((fresco?.ramas || {})[av] || {}) };
    const r = cambio(actual);
    if (!r) return null;
    await guardarRama(p, av, r);
    return r;
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
        .select("nombre pais formato tipo paso pasosRamas productoId origen dropiId vendio listo estilo.nombre actualizado creado")
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
      const tipo = req.body?.tipo === "moda" ? "moda" : "producto";
      const p = await Proyecto.create({
        owner: req.user.uid,
        productoId: prod?._id || null,
        origen: prod?.origen || "",
        dropiId: prod?.dropiId || "",
        nombre,
        pais: paisFinal,
        formato,
        tipo,
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

  // ---------- Terminado → "Listo para testear" ----------
  // Resumen para montar la campaña: por avatar, dónde quedó publicado, cuántas imágenes y creativos, y los copys de Meta
  const kitDe = (p) => {
    const o = plano(p);
    const ramas = Object.entries(o.ramas || {}).filter(([av]) => AVATARES_VALIDOS.includes(av)).sort(([a], [b]) => a.localeCompare(b));
    return {
      _id: o._id, nombre: o.nombre, pais: o.pais || "CO", formato: o.formato || "ban", tipo: o.tipo || "producto",
      precio: Number(o.ficha?.precio) || null, precioAntes: Number(o.ficha?.precioAntes) || null,
      avatares: ramas.map(([av, r]) => {
        const a = (o.avatares || []).find(x => x.id === av) || {};
        return {
          id: av, quien: String(a.quien || "").slice(0, 200), angulo: String(a.angulo || "").slice(0, 200),
          publicaciones: Object.values(r.publicaciones || {}).map(x => ({
            tienda: x.tienda, dominio: x.dominio || "", handle: x.handle || "", adminUrl: x.adminUrl || "",
            estado: x.estado || "", imagenes: Number(x.imagenes) || 0, fecha: x.fecha || null
          })),
          secciones: (r.secciones || []).length,
          ads: (r.ads || []).length, adsHechos: (r.ads || []).filter(x => x.hecha).length,
          guiones: (r.guiones || []).length,
          copys: r.copys?.meta?.length ? r.copys.meta : [],
          tiktok: r.copys?.tiktok || ""
        };
      })
    };
  };

  app.get("/api/proyectos/:id/kit", async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      res.json(kitDe(p));
    } catch (err) {
      console.error("Error leyendo el kit:", err);
      res.status(500).json({ error: "No se pudo cargar" });
    }
  });

  // Botón "Pasar a testeo": el producto queda LISTO en Mis testeos con la fecha de hoy.
  // Si el proyecto no viene de la Base, se crea el producto en la Base para que aparezca en Mis testeos.
  app.post("/api/proyectos/:id/listo", async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      const Producto = mongoose.model("Producto");
      let prod = p.productoId ? await Producto.findOne({ _id: p.productoId, owner: req.user.uid }) : null;
      if (!prod) {
        prod = await Producto.create({ owner: req.user.uid, nombre: p.nombre, pais: p.pais || "CO", dropiId: p.dropiId || "", origen: p.origen || "desarrollo", estado: "desarrollo", fecha: new Date() });
        p.productoId = prod._id;
      }
      p.listo = new Date();
      await p.save();
      const yaEnPauta = ["testeando", "winner", "perdedor", "inconcluso"].includes(prod.resultado);
      if (!yaEnPauta) {
        const t = { ...(prod.toObject().testeo || {}), inicio: null, fin: null, listo: new Date() };
        prod = await Producto.findOneAndUpdate({ _id: prod._id, owner: req.user.uid }, { $set: { resultado: "listo", testeo: t } }, { new: true });
      }
      res.json({ ok: true, producto: prod, yaEnPauta, kit: kitDe(p) });
    } catch (err) {
      console.error("Error pasando a testeo:", err);
      res.status(500).json({ error: "No se pudo pasar a testeo" });
    }
  });

  app.put("/api/proyectos/:id", async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      const cambios = limpiarCambios(req.body);
      Object.assign(p, cambios, { actualizado: new Date() });
      if (cambios.revision || cambios.ficha || cambios.formato || cambios.tipo) {
        const plantilla = await obtenerPlantilla(req.user.uid, p.formato, p.tipo);
        // Solo se actualiza el bloque de estilo de cada avatar (sin pisar lo demás de la rama)
        const bloques = {};
        for (const [av, r] of Object.entries(p.ramas || {})) {
          const avatar = (p.avatares || []).find(a => a.id === av);
          if (r?.estilo && avatar) bloques[`ramas.${av}.bloqueEstilo`] = construirBloqueEstilo({ ...plano(p), ...r, avatares: [avatar], plantilla });
        }
        await p.save();
        if (Object.keys(bloques).length) {
          await Proyecto.updateOne({ _id: p._id }, { $set: bloques });
          for (const [k, v] of Object.entries(bloques)) { const av = k.split(".")[1]; p.ramas = { ...p.ramas, [av]: { ...p.ramas[av], bloqueEstilo: v } }; }
        }
      } else {
        await p.save();
      }
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
    await ImagenLanding.deleteMany({ owner: req.user.uid, proyecto: r._id }).catch(err => console.error("Error borrando imágenes:", err));
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
        frase: String(a.frase || ""), palabras: String(a.palabras || "").slice(0, 400),
        causa: String(a.causa || "").slice(0, 600), mecanismo: String(a.mecanismo || "").slice(0, 600),
        angulo: String(a.angulo || ""), titular: String(a.titular || ""),
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
      const validos = tiposDe(claveDe(formato, x.p.tipo));
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
        const primera = formato === "normal" ? "galeria" : (x.p.tipo === "moda" ? "moda_portada" : "oferta");
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

      let lista = null;
      const r = await actualizarRama(x.p, x.av, (actual) => {
        const i = (actual.secciones || []).findIndex(sx => sx.id === sec.id);
        if (i === -1) return null;   // la quitaron mientras se escribía
        lista = [...actual.secciones];
        lista[i] = { ...lista[i], prompt: texto, hecha: false };
        return { ...actual, bloqueEstilo: actual.bloqueEstilo || bloque, secciones: lista };
      });
      if (!r) return res.status(409).json({ error: "Esa sección ya no existe (cambiaron las secciones mientras se escribía)" });
      res.json({ seccion: lista.find(sx => sx.id === sec.id) });
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

  // ---------- IA: anuncios · copys para Meta y TikTok ----------
  app.post("/api/proyectos/:id/rama/:av/ia/copys", iaLimiter, async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const b = req.body || {};
      const opciones = { envio: !!b.envio, contraEntrega: b.contraEntrega !== false, precio: !!b.precio };
      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptCopys(x.vista, x.avatar, opciones) });
      const copys = limpiarCopys({ ...parsearJSON(reply), opciones });
      if (!copys.meta.length) return res.status(502).json({ error: "La IA no devolvió los textos" });
      const r = { ...x.r, copys };
      await guardarRama(x.p, x.av, r);
      res.json({ rama: r });
    } catch (err) { errorIA(res, err, "los copys"); }
  });

  // ---------- IA: anuncios · prompt de un ad estático ----------
  app.post("/api/proyectos/:id/rama/:av/ia/ad/:adId", iaLimiter, async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const ads = x.r.ads || [];
      const idx = ads.findIndex(a => a.id === req.params.adId);
      if (idx === -1) return res.status(404).json({ error: "Anuncio no encontrado" });
      const ad = ads[idx];
      const bloque = x.r.bloqueEstilo || (x.r.estilo ? construirBloqueEstilo(x.vista) : "");
      const reply = await llamarIA({
        system: SISTEMA_LANDING,
        prompt: promptAd({ ...x.vista, bloqueEstilo: bloque }, ad, x.avatar, ESTRUCTURAS_AD[ad.estructura], FORMATOS_AD[ad.formato])
      });
      const texto = String(reply || "").replace(/^```[a-z]*\n?|```$/gim, "").trim();
      if (!texto) return res.status(502).json({ error: "La IA no devolvió el prompt" });
      const nuevos = [...ads];
      nuevos[idx] = { ...ad, prompt: texto.slice(0, 6000), hecha: false };
      const r = { ...x.r, ads: nuevos };
      await guardarRama(x.p, x.av, r);
      res.json({ ad: nuevos[idx] });
    } catch (err) { errorIA(res, err, "el anuncio"); }
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

  return { cargar, cargarRama, guardarRama, actualizarRama };
}
