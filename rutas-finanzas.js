// =============================================
// 💰 FINANZAS — pedidos de Dropi, pauta diaria y ajustes
// Los pedidos llegan del Excel de Dropi (leído en el navegador).
// Nunca se guardan datos del cliente (nombre, teléfono, dirección, documento).
// Cuando Dropi dé el token "CoDropX", estas mismas tablas se llenarán solas.
// =============================================
import mongoose from "mongoose";
import fetch from "node-fetch";
import { gastoCampanas } from "./rutas-meta.js";
import { claveProducto, emparejarCampana, numerosReales, tasasReales } from "./public/js/core/finanzas.js";

const PAISES = ["CO", "EC"];
const MAX_LINEAS = 20000;

const lineaSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  pais: { type: String, enum: PAISES, default: "CO" },
  cuenta: { type: String, default: "" },
  ordenId: String, productoId: String, variacionId: String,
  fecha: { type: String, index: true }, hora: String,
  guia: String, estatus: String, tipoEnvio: String, departamento: String, ciudad: String, transportadora: String,
  total: Number, ganancia: { type: Number, default: null }, flete: Number, costoDevolucion: Number, comision: Number, proveedor: Number,
  sku: String, producto: String, variacion: String, cantidad: Number, categoria: String,
  novedad: String, novedadSolucionada: Boolean, fechaNovedad: String, horaNovedad: String, fechaSolucion: String, horaSolucion: String,
  ultimoMovimiento: String, fechaUltMov: String, horaUltMov: String, tags: String, fechaGuia: String, fechaCancelacion: String,
  importado: { type: Date, default: Date.now }
});
lineaSchema.index({ owner: 1, pais: 1, ordenId: 1, productoId: 1, variacionId: 1 }, { unique: true });
export const DropiLinea = mongoose.model("DropiLinea", lineaSchema);

const pautaSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  pais: { type: String, enum: PAISES, default: "CO" },
  fecha: String, clave: String, nombre: String,
  meta: { type: Number, default: 0 }, tiktok: { type: Number, default: 0 },
  devPct: { type: Number, default: null }, tipo: { type: String, default: "testeo" }, fallido: { type: Boolean, default: false },
  metaAuto: { type: Boolean, default: false },     // el valor de Meta lo trajo CoDropX desde Meta Ads
  metaManual: { type: Boolean, default: false },   // lo escribiste tú: la sincronización no lo pisa
  actualizado: { type: Date, default: Date.now }
});
pautaSchema.index({ owner: 1, pais: 1, fecha: 1, clave: 1 }, { unique: true });
export const PautaDia = mongoose.model("PautaDia", pautaSchema);

// Notas de seguimiento por pedido (Logística → Seguimiento de pedidos): lo que hablaste con el cliente o la transportadora
const notaPedidoSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  pais: { type: String, enum: PAISES, default: "CO" },
  ordenId: String,
  notas: { type: [mongoose.Schema.Types.Mixed], default: [] },     // { id, texto, fecha, editada }
  actualizado: { type: Date, default: Date.now }
});
notaPedidoSchema.index({ owner: 1, pais: 1, ordenId: 1 }, { unique: true });
export const NotaPedido = mongoose.model("NotaPedido", notaPedidoSchema);
export const MAX_NOTAS_PEDIDO = 30;
export function limpiarNotasPedido(lista) {
  if (!Array.isArray(lista)) return [];
  const fecha = (v) => { const d = new Date(v); return isNaN(d) ? new Date().toISOString() : d.toISOString(); };
  return lista.slice(-MAX_NOTAS_PEDIDO).map(n => ({
    id: String(n?.id || Math.random().toString(36).slice(2, 10)).replace(/[^a-z0-9]/gi, "").slice(0, 16) || Math.random().toString(36).slice(2, 10),
    texto: String(n?.texto ?? "").replace(/[\u0000-\u0008\u000b-\u001f]+/g, " ").trim().slice(0, 500),
    fecha: fecha(n?.fecha),
    editada: n?.editada ? fecha(n.editada) : null
  })).filter(n => n.texto);
}

const configSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  pais: { type: String, enum: PAISES, default: "CO" },
  cuenta: { type: String, default: "" },
  devPct: { type: Number, default: 25 },
  metaEntrega: { type: Number, default: 70 },
  grupos: { type: [mongoose.Schema.Types.Mixed], default: [] },   // { id, nombre, ids: [productoId] }
  metaCuentas: { type: [String], default: [] },                    // cuentas publicitarias cuyo gasto se suma
  metaCampanas: { type: mongoose.Schema.Types.Mixed, default: {} }, // { campanaId: clave | "x" (no es de ningún producto) }
  trm: { type: Number, default: null },                           // 1 USD en COP que tú fijaste (si no, la TRM del día)
  trmManual: { type: Boolean, default: false },
  costosOperativos: { type: [mongoose.Schema.Types.Mixed], default: [] },   // { id, mes: "2026-09", desc, valor, moneda }
  metasMes: { type: mongoose.Schema.Types.Mixed, default: {} },              // { "2026-11": 10000000 } utilidad que quieres ese mes
  ultimaImportacion: { type: Date, default: null },
  actualizado: { type: Date, default: Date.now }
});
configSchema.index({ owner: 1, pais: 1 }, { unique: true });
export const FinanzasConfig = mongoose.model("FinanzasConfig", configSchema);

// Reportes guardados: una foto del Reporte Financiero de un periodo (los números no cambian aunque subas otro Excel)
const reporteGuardadoSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  pais: { type: String, enum: PAISES, default: "CO" },
  nombre: String, desde: String, hasta: String, clave: { type: String, default: "" }, producto: { type: String, default: "" },
  resumen: { type: mongoose.Schema.Types.Mixed, default: {} },   // { pedidos, entregados, tasaEntrega, gananciaNeta, margenNeto }
  datos: { type: mongoose.Schema.Types.Mixed, default: {} },     // lo que se ve en pantalla (cifras ya calculadas, sin datos de clientes)
  creado: { type: Date, default: Date.now },
  editado: { type: Date, default: null }
});
reporteGuardadoSchema.index({ owner: 1, pais: 1, creado: -1 });
export const ReporteGuardado = mongoose.model("ReporteGuardado", reporteGuardadoSchema);
export const MAX_REPORTES = 100;
const MAX_DATOS_REPORTE = 400000;   // caracteres del JSON
const limpiarNombreReporte = (v) => String(v || "").replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, 80);
function resumenReporte(r = {}) {
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return { pedidos: n(r.pedidos), entregados: n(r.entregados), tasaEntrega: n(r.tasaEntrega), gananciaNeta: n(r.gananciaNeta), margenNeto: n(r.margenNeto) };
}
const datosInvalidos = (d) => (!d || typeof d !== "object" || !d.r ? "El reporte está vacío" : JSON.stringify(d).length > MAX_DATOS_REPORTE ? "El reporte es muy grande para guardarlo" : "");

// ---------- Limpieza de lo que llega del navegador ----------
const CAMPOS_TEXTO = {
  ordenId: 40, productoId: 40, variacionId: 40, fecha: 10, hora: 5, guia: 60, estatus: 60, tipoEnvio: 30,
  departamento: 60, ciudad: 80, transportadora: 60, sku: 60, producto: 200, variacion: 100, categoria: 80,
  novedad: 200, fechaNovedad: 10, horaNovedad: 5, fechaSolucion: 10, horaSolucion: 5,
  ultimoMovimiento: 120, fechaUltMov: 10, horaUltMov: 5, tags: 120, fechaGuia: 10, fechaCancelacion: 10
};
const CAMPOS_NUMERO = ["total", "flete", "costoDevolucion", "comision", "proveedor", "cantidad"];
const esFecha = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export function limpiarLinea(l = {}) {
  if (!l || typeof l !== "object") return null;
  const out = {};
  for (const [k, max] of Object.entries(CAMPOS_TEXTO)) out[k] = String(l[k] ?? "").slice(0, max);
  for (const k of CAMPOS_NUMERO) { const n = Number(l[k]); out[k] = Number.isFinite(n) ? n : 0; }
  const g = l.ganancia === null || l.ganancia === undefined || l.ganancia === "" ? null : Number(l.ganancia);
  out.ganancia = Number.isFinite(g) ? g : null;
  out.novedadSolucionada = !!l.novedadSolucionada;
  out.cantidad = Math.max(1, out.cantidad || 1);
  if (!out.ordenId || !esFecha(out.fecha)) return null;
  for (const k of ["fechaNovedad", "fechaSolucion", "fechaUltMov", "fechaGuia", "fechaCancelacion"]) if (out[k] && !esFecha(out[k])) out[k] = "";
  return out;
}

// Costos operativos del mes (Shopify, Releasit, IA, salarios...): solo lo que tú escribes
export const MAX_COSTOS_OP = 300;
export function limpiarCostosOperativos(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.slice(0, MAX_COSTOS_OP).map(c => ({
    id: String(c?.id || "").replace(/[^a-z0-9]/gi, "").slice(0, 16) || Math.random().toString(36).slice(2, 10),
    mes: /^\d{4}-(0[1-9]|1[0-2])$/.test(String(c?.mes)) ? String(c.mes) : "",
    desc: String(c?.desc ?? "").replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, 80),
    valor: Math.min(1e12, Math.max(0, Number(c?.valor) || 0)),
    moneda: c?.moneda === "USD" ? "USD" : "COP"
  })).filter(c => c.mes && (c.desc || c.valor > 0));
}

const publicaPauta = (d) => ({ fecha: d.fecha, clave: d.clave, nombre: d.nombre, meta: d.meta, tiktok: d.tiktok, devPct: d.devPct, tipo: d.tipo, fallido: d.fallido, metaAuto: !!d.metaAuto, metaManual: !!d.metaManual });
const MONEDA = { CO: "COP", EC: "USD" };
const cacheMeta = new Map();

// TRM oficial del día (Superfinanciera, datos.gov.co), guardada 6 horas
let trmCache = { t: 0, valor: null, fecha: "" };
export async function trmHoy() {
  if (trmCache.valor && Date.now() - trmCache.t < 6 * 36e5) return trmCache;
  try {
    const r = await fetch("https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde%20DESC", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(4000) });
    const d = await r.json();
    const valor = Number(d?.[0]?.valor);
    if (valor > 1000 && valor < 20000) trmCache = { t: Date.now(), valor, fecha: String(d[0].vigenciadesde || "").slice(0, 10) };
  } catch (e) { console.warn("No se pudo leer la TRM:", e.message); }
  return trmCache;
}
export const _trmPrueba = (v) => { trmCache = v ? { t: Date.now(), valor: v, fecha: "2026-10-23" } : { t: 0, valor: null, fecha: "" }; };   // owner|cuentas|desde|hasta → { t, datos } (5 min: no gastar el límite de Meta)

const pais = (v) => (PAISES.includes(String(v)) ? String(v) : "CO");
const fechaQ = (v) => (esFecha(String(v || "")) ? String(v) : null);

export function registrarRutasFinanzas(app, { llamarIA, iaLimiter } = {}) {
  // Análisis con IA de las cifras que se ven en el Reporte Financiero
  app.post("/api/finanzas/analisis", ...(iaLimiter ? [iaLimiter] : []), async (req, res) => {
    try {
      if (!llamarIA) return res.status(503).json({ error: "La IA no está disponible" });
      const b = req.body || {};
      const cifras = JSON.stringify(b.cifras || {}).slice(0, 6000);
      const moneda = pais(b.pais) === "EC" ? "dólares (USD)" : "pesos colombianos (COP)";
      const prompt = `Eres el analista financiero de un dropshipper con pago contra entrega en ${pais(b.pais) === "EC" ? "Ecuador" : "Colombia"} que vende por Dropi y pauta en Meta.
Producto: ${String(b.producto || "Todos").slice(0, 200)} · Periodo: ${String(b.desde || "")} a ${String(b.hasta || "")} · Valores en ${moneda}.
CIFRAS (JSON): ${cifras}

Escribe un análisis corto y práctico en español, para leer en 1 minuto:
1. **Diagnóstico** (2-3 frases): ¿gana o pierde de verdad y por qué? Menciona si el periodo sigue abierto (pedidos en tránsito o novedad) y cuánto puede cambiar.
2. **Lo que más le está costando**: devoluciones, fletes, publicidad, una transportadora o ciudades con baja entrega. Usa los números.
3. **3 acciones concretas** para esta semana (por ejemplo: gestionar novedades, cambiar transportadora en ciudades malas, ajustar precio o CPA máximo, pausar o escalar).
Sin rodeos, sin inventar datos que no estén en las cifras. Si la publicidad está en 0, avisa que falta registrar la pauta para ver la ganancia neta real.`;
      const analisis = await llamarIA({ prompt, system: "Eres un analista financiero de ecommerce directo y práctico. Respondes en español latino, en texto plano con **negritas** para los títulos." });
      res.json({ analisis: String(analisis || "").slice(0, 6000) });
    } catch (err) {
      console.error("Error IA finanzas:", err);
      res.status(err.status || 500).json({ error: err.message || "No se pudo analizar" });
    }
  });

  // Subir el Excel ya leído (solo columnas de pedidos)
  app.post("/api/finanzas/importar", async (req, res) => {
    try {
      const p = pais(req.body?.pais);
      const cuenta = String(req.body?.cuenta || "").slice(0, 80);
      const crudas = Array.isArray(req.body?.lineas) ? req.body.lineas : [];
      if (!crudas.length) return res.status(400).json({ error: "El Excel no trae pedidos" });
      if (crudas.length > MAX_LINEAS) return res.status(400).json({ error: `Máximo ${MAX_LINEAS} líneas por archivo. Descarga un rango de fechas más corto.` });
      const lineas = crudas.map(limpiarLinea).filter(Boolean);
      if (!lineas.length) return res.status(400).json({ error: "No encontramos pedidos válidos en el Excel" });

      const ahora = new Date();
      const ops = lineas.map(l => ({
        updateOne: {
          filter: { owner: req.user.uid, pais: p, ordenId: l.ordenId, productoId: l.productoId, variacionId: l.variacionId },
          update: { $set: { ...l, cuenta, importado: ahora }, $setOnInsert: { owner: req.user.uid, pais: p } },
          upsert: true
        }
      }));
      let nuevas = 0, actualizadas = 0;
      for (let i = 0; i < ops.length; i += 1000) {
        const r = await DropiLinea.bulkWrite(ops.slice(i, i + 1000), { ordered: false });
        nuevas += r.upsertedCount || 0;
        actualizadas += r.modifiedCount || 0;
      }
      await FinanzasConfig.findOneAndUpdate(
        { owner: req.user.uid, pais: p },
        { $set: { ultimaImportacion: ahora, ...(cuenta ? { cuenta } : {}) }, $setOnInsert: { owner: req.user.uid, pais: p } },
        { upsert: true, new: true }
      );
      const fechas = lineas.map(l => l.fecha).sort();
      res.json({
        ok: true, lineas: lineas.length, ordenes: new Set(lineas.map(l => l.ordenId)).size,
        nuevas, actualizadas, desde: fechas[0], hasta: fechas[fechas.length - 1]
      });
    } catch (err) {
      console.error("Error importando Dropi:", err);
      res.status(500).json({ error: "No se pudo guardar el Excel" });
    }
  });

  // Pedidos de un país en un rango de fechas
  app.get("/api/finanzas/lineas", async (req, res) => {
    try {
      const filtro = { owner: req.user.uid, pais: pais(req.query.pais) };
      const desde = fechaQ(req.query.desde), hasta = fechaQ(req.query.hasta);
      if (desde || hasta) filtro.fecha = { ...(desde ? { $gte: desde } : {}), ...(hasta ? { $lte: hasta } : {}) };
      const lineas = await DropiLinea.find(filtro).select("-_id -owner -__v -importado").sort({ fecha: 1 }).limit(60000).lean();
      res.json(lineas);
    } catch (err) {
      console.error("Error leyendo pedidos:", err);
      res.status(500).json({ error: "No se pudieron cargar los pedidos" });
    }
  });

  // Ajustes + qué días tienen datos
  app.get("/api/finanzas/config", async (req, res) => {
    try {
      const p = pais(req.query.pais);
      const cfg = await FinanzasConfig.findOne({ owner: req.user.uid, pais: p }).lean();
      const fechas = await DropiLinea.find({ owner: req.user.uid, pais: p }).select("fecha -_id").lean();
      const dias = [...new Set(fechas.map(f => f.fecha))].sort();
      const oficial = await trmHoy();
      res.json({
        pais: p, cuenta: cfg?.cuenta || "", devPct: cfg?.devPct ?? 25, metaEntrega: cfg?.metaEntrega ?? 70,
        grupos: cfg?.grupos || [], ultimaImportacion: cfg?.ultimaImportacion || null,
        metaCuentas: cfg?.metaCuentas || [], trm: cfg?.trmManual ? cfg.trm : null,
        trmDia: oficial.valor || null, costosOperativos: cfg?.costosOperativos || [], metasMes: cfg?.metasMes || {},
        dias, desde: dias[0] || null, hasta: dias[dias.length - 1] || null
      });
    } catch (err) {
      console.error("Error leyendo ajustes de finanzas:", err);
      res.status(500).json({ error: "No se pudieron cargar los ajustes" });
    }
  });

  app.put("/api/finanzas/config", async (req, res) => {
    try {
      const p = pais(req.body?.pais);
      const set = { actualizado: new Date() };
      if (req.body?.devPct !== undefined) set.devPct = Math.min(95, Math.max(0, Number(req.body.devPct) || 0));
      if (req.body?.metaEntrega !== undefined) set.metaEntrega = Math.min(100, Math.max(1, Number(req.body.metaEntrega) || 70));
      if (req.body?.cuenta !== undefined) set.cuenta = String(req.body.cuenta || "").slice(0, 80);
      if (Array.isArray(req.body?.metaCuentas)) set.metaCuentas = [...new Set(req.body.metaCuentas.map(x => String(x).replace(/^act_/, "")).filter(x => /^\d{3,25}$/.test(x)))].slice(0, 25);
      if (req.body?.trm !== undefined) {
        const v = Number(req.body.trm);
        if (req.body.trm === null || req.body.trm === "" || !(v > 0)) { set.trm = null; set.trmManual = false; }
        else { set.trm = Math.min(20000, Math.max(100, v)); set.trmManual = true; }
      }
      if (Array.isArray(req.body?.costosOperativos)) set.costosOperativos = limpiarCostosOperativos(req.body.costosOperativos);
      // Meta de utilidad de un mes: { mes: "2026-11", valor } (0 o vacío la borra)
      const mm = req.body?.metaMes;
      if (mm && /^\d{4}-(0[1-9]|1[0-2])$/.test(String(mm.mes))) {
        const v = Math.min(1e12, Math.max(0, Number(mm.valor) || 0));
        if (v) set[`metasMes.${mm.mes}`] = v;
        else { set.actualizado = new Date(); (set.$unset ||= {})[`metasMes.${mm.mes}`] = ""; }
      }
      if (Array.isArray(req.body?.grupos)) {
        set.grupos = req.body.grupos.slice(0, 100).map(g => ({
          id: String(g?.id || Math.random().toString(36).slice(2, 10)).slice(0, 20),
          nombre: String(g?.nombre || "Grupo").slice(0, 120),
          ids: [...new Set((Array.isArray(g?.ids) ? g.ids : []).map(x => String(x).slice(0, 40)))].slice(0, 50)
        })).filter(g => g.ids.length >= 2);
      }
      const { $unset, ...soloSet } = set;
      const cfg = await FinanzasConfig.findOneAndUpdate(
        { owner: req.user.uid, pais: p }, { $set: soloSet, ...($unset ? { $unset } : {}), $setOnInsert: { owner: req.user.uid, pais: p } }, { upsert: true, new: true }
      ).lean();
      res.json({ ok: true, metasMes: cfg.metasMes || {}, devPct: cfg.devPct, metaEntrega: cfg.metaEntrega, grupos: cfg.grupos || [], cuenta: cfg.cuenta || "", metaCuentas: cfg.metaCuentas || [], trm: cfg.trmManual ? cfg.trm : null, costosOperativos: cfg.costosOperativos || [] });
    } catch (err) {
      console.error("Error guardando ajustes de finanzas:", err);
      res.status(500).json({ error: "No se pudo guardar" });
    }
  });

  // Números reales para la prueba social de la landing: entregas y ciudades (de toda la tienda y del producto)
  app.get("/api/finanzas/prueba-social", async (req, res) => {
    try {
      const p = pais(req.query.pais);
      const [lineas, cfg] = await Promise.all([
        DropiLinea.find({ owner: req.user.uid, pais: p }).select("ordenId productoId fecha estatus ciudad departamento -_id").limit(60000).lean(),
        FinanzasConfig.findOne({ owner: req.user.uid, pais: p }).select("grupos ultimaImportacion").lean()
      ]);
      const n = numerosReales(lineas, { dropiId: String(req.query.dropiId || "").slice(0, 40), grupos: cfg?.grupos || [] });
      res.json({ pais: p, ...n, ultimaImportacion: cfg?.ultimaImportacion || null });
    } catch (err) {
      console.error("Error leyendo números de prueba social:", err);
      res.status(500).json({ error: "No se pudieron leer tus números de Dropi" });
    }
  });

  // Tus % reales de cancelados y devoluciones, y el flete promedio (para la Calculadora)
  app.get("/api/finanzas/tasas", async (req, res) => {
    try {
      const p = pais(req.query.pais);
      const [lineas, cfg] = await Promise.all([
        DropiLinea.find({ owner: req.user.uid, pais: p }).select("ordenId productoId fecha estatus flete total proveedor costoDevolucion comision cantidad ganancia -_id").limit(60000).lean(),
        FinanzasConfig.findOne({ owner: req.user.uid, pais: p }).select("grupos ultimaImportacion").lean()
      ]);
      // CPA real de los últimos 30 días con datos: pauta (Meta + TikTok) ÷ pedidos
      const fechas = lineas.map(l => l.fecha).filter(Boolean).sort();
      let cpa30 = null;
      if (fechas.length) {
        const hasta = fechas[fechas.length - 1];
        const d = new Date(hasta + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - 29);
        const desde = d.toISOString().slice(0, 10);
        const pauta = await PautaDia.find({ owner: req.user.uid, pais: p, fecha: { $gte: desde, $lte: hasta } }).select("meta tiktok -_id").lean();
        const gasto = pauta.reduce((a, x) => a + (Number(x.meta) || 0) + (Number(x.tiktok) || 0), 0);
        const pedidos = new Set(lineas.filter(l => l.fecha >= desde && l.fecha <= hasta).map(l => l.ordenId)).size;
        if (gasto > 0 && pedidos) cpa30 = { cpa: gasto / pedidos, gasto, pedidos, desde, hasta };
      }
      res.json({ pais: p, ...tasasReales(lineas, { dropiId: String(req.query.dropiId || "").slice(0, 40), grupos: cfg?.grupos || [] }), cpa30, ultimaImportacion: cfg?.ultimaImportacion || null });
    } catch (err) {
      console.error("Error leyendo tasas reales:", err);
      res.status(500).json({ error: "No se pudieron leer tus números de Dropi" });
    }
  });

  // ---------- Reportes guardados ----------
  app.get("/api/finanzas/reportes", async (req, res) => {
    try {
      const lista = await ReporteGuardado.find({ owner: req.user.uid, pais: pais(req.query.pais) })
        .select("nombre desde hasta clave producto resumen creado editado").sort({ creado: -1 }).limit(MAX_REPORTES).lean();
      res.json(lista.map(({ _id, ...x }) => ({ id: String(_id), ...x })));
    } catch (err) {
      console.error("Error leyendo reportes guardados:", err);
      res.status(500).json({ error: "No se pudieron cargar tus reportes guardados" });
    }
  });

  app.get("/api/finanzas/reportes/:id", async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Ese reporte no existe" });
      const x = await ReporteGuardado.findOne({ _id: req.params.id, owner: req.user.uid }).select("-owner -__v").lean();
      if (!x) return res.status(404).json({ error: "Ese reporte no existe" });
      const { _id, ...resto } = x;
      res.json({ id: String(_id), ...resto });
    } catch (err) {
      console.error("Error leyendo reporte guardado:", err);
      res.status(500).json({ error: "No se pudo abrir el reporte" });
    }
  });

  app.post("/api/finanzas/reportes", async (req, res) => {
    try {
      const b = req.body || {};
      const p = pais(b.pais);
      const desde = fechaQ(b.desde), hasta = fechaQ(b.hasta);
      if (!desde || !hasta) return res.status(400).json({ error: "El reporte no tiene fechas" });
      const malo = datosInvalidos(b.datos);
      if (malo) return res.status(400).json({ error: malo });
      if (await ReporteGuardado.countDocuments({ owner: req.user.uid, pais: p }) >= MAX_REPORTES) return res.status(400).json({ error: `Ya tienes ${MAX_REPORTES} reportes guardados. Borra alguno viejo.` });
      const x = await ReporteGuardado.create({
        owner: req.user.uid, pais: p, desde, hasta,
        nombre: limpiarNombreReporte(b.nombre) || `${desde} a ${hasta}`,
        clave: String(b.clave || "").slice(0, 60), producto: String(b.producto || "").slice(0, 200),
        resumen: resumenReporte(b.datos.r), datos: b.datos
      });
      res.json({ ok: true, id: String(x._id), creado: x.creado });
    } catch (err) {
      console.error("Error guardando reporte:", err);
      res.status(500).json({ error: "No se pudo guardar el reporte" });
    }
  });

  // Editar un reporte guardado: nombre, publicidad, costos operativos o los estados de hoy
  app.put("/api/finanzas/reportes/:id", async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Ese reporte no existe" });
      const b = req.body || {};
      const set = { editado: new Date() };
      if (b.nombre !== undefined) {
        const nombre = limpiarNombreReporte(b.nombre);
        if (!nombre) return res.status(400).json({ error: "Ponle un nombre al reporte" });
        set.nombre = nombre;
      }
      if (b.datos !== undefined) {
        const malo = datosInvalidos(b.datos);
        if (malo) return res.status(400).json({ error: malo });
        set.datos = b.datos; set.resumen = resumenReporte(b.datos.r);
      }
      const x = await ReporteGuardado.findOneAndUpdate({ _id: req.params.id, owner: req.user.uid }, { $set: set }, { new: true }).select("-owner -__v").lean();
      if (!x) return res.status(404).json({ error: "Ese reporte no existe" });
      const { _id, ...resto } = x;
      res.json({ id: String(_id), ...resto });
    } catch (err) {
      console.error("Error editando reporte guardado:", err);
      res.status(500).json({ error: "No se pudo guardar el cambio" });
    }
  });

  app.delete("/api/finanzas/reportes/:id", async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Ese reporte no existe" });
      const r = await ReporteGuardado.deleteOne({ _id: req.params.id, owner: req.user.uid });
      res.json({ ok: true, borrados: r.deletedCount || 0 });
    } catch (err) {
      console.error("Error borrando reporte guardado:", err);
      res.status(500).json({ error: "No se pudo borrar el reporte" });
    }
  });

  // Borrar los pedidos importados de un país (para volver a empezar)
  app.delete("/api/finanzas/lineas", async (req, res) => {
    try {
      const r = await DropiLinea.deleteMany({ owner: req.user.uid, pais: pais(req.query.pais) });
      res.json({ ok: true, borradas: r.deletedCount || 0 });
    } catch (err) {
      console.error("Error borrando pedidos:", err);
      res.status(500).json({ error: "No se pudo borrar" });
    }
  });

  // ---------- Pauta por día y producto ----------
  app.get("/api/finanzas/pauta", async (req, res) => {
    try {
      const filtro = { owner: req.user.uid, pais: pais(req.query.pais) };
      const desde = fechaQ(req.query.desde), hasta = fechaQ(req.query.hasta);
      if (desde || hasta) filtro.fecha = { ...(desde ? { $gte: desde } : {}), ...(hasta ? { $lte: hasta } : {}) };
      const lista = await PautaDia.find(filtro).select("-_id -owner -__v -actualizado").lean();
      res.json(lista);
    } catch (err) {
      console.error("Error leyendo pauta:", err);
      res.status(500).json({ error: "No se pudo cargar la pauta" });
    }
  });

  app.put("/api/finanzas/pauta", async (req, res) => {
    try {
      const b = req.body || {};
      const p = pais(b.pais);
      const fecha = fechaQ(b.fecha);
      const clave = String(b.clave || "").slice(0, 60);
      if (!fecha || !/^[pg]:/.test(clave)) return res.status(400).json({ error: "Falta el día o el producto" });
      const set = { actualizado: new Date() };
      for (const k of ["meta", "tiktok"]) if (b[k] !== undefined) set[k] = Math.max(0, Number(b[k]) || 0);
      if (b.meta !== undefined) { set.metaManual = true; set.metaAuto = false; }
      if (b.metaAuto === true) { set.metaManual = false; set.meta = 0; }   // "volver a lo de Meta": la próxima sincronización lo llena
      if (b.devPct !== undefined) set.devPct = b.devPct === null || b.devPct === "" ? null : Math.min(95, Math.max(0, Number(b.devPct) || 0));
      if (b.tipo !== undefined) set.tipo = ["testeo", "escala"].includes(b.tipo) ? b.tipo : "testeo";
      if (b.fallido !== undefined) set.fallido = !!b.fallido;
      if (b.nombre !== undefined) set.nombre = String(b.nombre || "").slice(0, 200);
      const doc = await PautaDia.findOneAndUpdate(
        { owner: req.user.uid, pais: p, fecha, clave },
        { $set: set, $setOnInsert: { owner: req.user.uid, pais: p, fecha, clave } },
        { upsert: true, new: true }
      ).lean();
      res.json({ ok: true, pauta: publicaPauta(doc) });
    } catch (err) {
      console.error("Error guardando pauta:", err);
      res.status(500).json({ error: "No se pudo guardar la pauta" });
    }
  });

  app.delete("/api/finanzas/pauta", async (req, res) => {
    try {
      const fecha = fechaQ(req.query.fecha);
      const clave = String(req.query.clave || "");
      if (!fecha || !clave) return res.status(400).json({ error: "Falta el día o el producto" });
      await PautaDia.findOneAndDelete({ owner: req.user.uid, pais: pais(req.query.pais), fecha, clave });
      res.json({ ok: true });
    } catch (err) {
      console.error("Error borrando pauta:", err);
      res.status(500).json({ error: "No se pudo borrar" });
    }
  });

  // ---------- Notas de seguimiento por pedido ----------
  app.get("/api/finanzas/notas", async (req, res) => {
    try {
      const lista = await NotaPedido.find({ owner: req.user.uid, pais: pais(req.query.pais) }).select("ordenId notas").lean();
      res.json(Object.fromEntries(lista.filter(x => x.notas?.length).map(x => [x.ordenId, x.notas])));
    } catch (err) {
      console.error("Error leyendo notas:", err);
      res.status(500).json({ error: "No se pudieron cargar las notas" });
    }
  });

  // Guarda la lista completa de notas de un pedido (agregar, editar o borrar). Lista vacía = se borra.
  app.put("/api/finanzas/notas", async (req, res) => {
    try {
      const b = req.body || {};
      const p = pais(b.pais);
      const ordenId = String(b.ordenId || "").trim().slice(0, 60);
      if (!ordenId) return res.status(400).json({ error: "Falta el pedido" });
      const notas = limpiarNotasPedido(b.notas);
      if (!notas.length) {
        await NotaPedido.deleteOne({ owner: req.user.uid, pais: p, ordenId });
        return res.json({ ok: true, notas: [] });
      }
      await NotaPedido.findOneAndUpdate(
        { owner: req.user.uid, pais: p, ordenId },
        { $set: { notas, actualizado: new Date() }, $setOnInsert: { owner: req.user.uid, pais: p, ordenId } },
        { upsert: true, new: true }
      );
      res.json({ ok: true, notas });
    } catch (err) {
      console.error("Error guardando notas:", err);
      res.status(500).json({ error: "No se pudieron guardar las notas" });
    }
  });

  // ---------- Meta Ads → pauta del Control Diario ----------
  // Trae el gasto por campaña y día de las cuentas elegidas, lo reparte por producto
  // (por el nombre de la campaña o como tú la asignaste) y llena la columna Meta.
  app.post("/api/finanzas/meta/sincronizar", async (req, res) => {
    try {
      const p = pais(req.body?.pais);
      const hoy = new Date(Date.now() - 5 * 36e5).toISOString().slice(0, 10);
      let hasta = fechaQ(req.body?.hasta) || hoy, desde = fechaQ(req.body?.desde) || hasta;
      if (hasta > hoy) hasta = hoy;
      if (desde > hasta) desde = hasta;
      const tope = new Date(new Date(hasta + "T12:00:00Z").getTime() - 92 * 864e5).toISOString().slice(0, 10);
      if (desde < tope) desde = tope;   // máximo ~3 meses por consulta

      const cfg = await FinanzasConfig.findOne({ owner: req.user.uid, pais: p }).lean();
      const cuentasIds = cfg?.metaCuentas || [];
      if (!cuentasIds.length) return res.json({ sinCuentas: true, campanas: [], pauta: [] });

      // Productos de Dropi de este país (clave → nombre), respetando los grupos
      const grupos = cfg?.grupos || [];
      const vistos = new Map();
      for (const l of await DropiLinea.find({ owner: req.user.uid, pais: p }).select("productoId producto -_id").lean()) {
        const clave = claveProducto(l.productoId, grupos);
        if (!vistos.has(clave)) vistos.set(clave, grupos.find(g => `g:${g.id}` === clave)?.nombre || l.producto || "Producto");
      }
      const productos = [...vistos].map(([clave, nombre]) => ({ clave, nombre }));

      const llaveCache = `${req.user.uid}|${cuentasIds.join(",")}|${desde}|${hasta}`;
      let datos = cacheMeta.get(llaveCache);
      if (!datos || req.body?.forzar || Date.now() - datos.t > 5 * 60e3) {
        datos = { t: Date.now(), ...(await gastoCampanas(req.user.uid, cuentasIds, desde, hasta)) };
        cacheMeta.set(llaveCache, datos);
        if (cacheMeta.size > 200) cacheMeta.delete(cacheMeta.keys().next().value);
      }

      const moneda = MONEDA[p];
      const oficial = await trmHoy();
      const trm = cfg?.trmManual && cfg?.trm ? cfg.trm : oficial.valor || 4000;
      const trmFuente = cfg?.trmManual && cfg?.trm ? "tuya" : oficial.valor ? `oficial ${oficial.fecha}` : "aproximada";
      const links = datos.links || {};
      const convertir = (v, m) => (m === moneda ? v : m === "USD" && moneda === "COP" ? v * trm : m === "COP" && moneda === "USD" ? v / trm : null);
      const asignadas = cfg?.metaCampanas || {};
      const campanas = new Map();
      const sumas = new Map();
      const otraMoneda = new Set();
      for (const f of datos.filas) {
        const gasto = convertir(f.gasto, f.moneda);
        if (gasto === null) { otraMoneda.add(f.moneda); continue; }
        let c = campanas.get(f.campanaId);
        if (!c) {
          const elegida = asignadas[f.campanaId];
          const link = links[f.campanaId] || "";
          const handle = (link.match(/\/products\/([^/?#]+)/i) || [])[1] || "";
          const auto = elegida ? null : (emparejarCampana(`${f.campana} ${decodeURIComponent(handle).replace(/[-_]+/g, " ")}`, productos) || null);
          const clave = elegida === "x" ? null : (elegida && vistos.has(elegida) ? elegida : auto);
          c = { id: f.campanaId, nombre: f.campana, account_id: f.account_id, moneda: f.moneda, gasto: 0, compras: 0, dias: {}, diasOriginal: {}, clave,
            link, linkProducto: link ? !!handle : null,
            origen: elegida === "x" ? "ignorada" : elegida && vistos.has(elegida) ? "manual" : auto ? "auto" : null };
          campanas.set(f.campanaId, c);
        }
        c.gasto += gasto; c.compras += f.compras;
        c.dias[f.fecha] = (c.dias[f.fecha] || 0) + gasto;
        c.diasOriginal[f.fecha] = (c.diasOriginal[f.fecha] || 0) + f.gasto;
        // A tus números solo entra lo que ya confirmaste (guardaste) — las sugerencias no
        if (c.clave && c.origen === "manual") { const k = `${f.fecha}|${c.clave}`; sumas.set(k, (sumas.get(k) || 0) + gasto); }
      }

      // Escribir en la pauta lo confirmado (sin pisar lo que escribiste o editaste a mano)
      const redondo = (v) => Math.round(v * 100) / 100;
      const existentes = await PautaDia.find({ owner: req.user.uid, pais: p, fecha: { $gte: desde, $lte: hasta } }).lean();
      const porLlave = new Map(existentes.map(d => [`${d.fecha}|${d.clave}`, d]));
      const ahora = new Date();
      let cambios = 0;
      for (const [k, gasto] of sumas) {
        const d = porLlave.get(k);
        if (d?.metaManual) continue;
        if (d && d.metaAuto && Math.abs((d.meta || 0) - redondo(gasto)) < 0.005) continue;
        const [fecha, clave] = k.split("|");
        await PautaDia.findOneAndUpdate(
          { owner: req.user.uid, pais: p, fecha, clave },
          { $set: { meta: redondo(gasto), metaAuto: true, actualizado: ahora, ...(d?.nombre ? {} : { nombre: vistos.get(clave) || "" }) }, $setOnInsert: { owner: req.user.uid, pais: p, fecha, clave } },
          { upsert: true, new: true }
        );
        cambios++;
      }
      for (const d of existentes) {
        const k = `${d.fecha}|${d.clave}`;
        if (d.metaAuto && !d.metaManual && !sumas.has(k)) {
          await PautaDia.updateOne({ _id: d._id }, { $set: { meta: 0, metaAuto: false, actualizado: ahora } });
          cambios++;
        }
      }

      const lista = [...campanas.values()].map(c => ({ ...c, gasto: redondo(c.gasto), nombreProducto: c.clave ? vistos.get(c.clave) || "" : "" }))
        .sort((a, b) => b.gasto - a.gasto);
      const pauta = await PautaDia.find({ owner: req.user.uid, pais: p, fecha: { $gte: desde, $lte: hasta } }).lean();
      res.json({
        desde, hasta, moneda, trm, trmFuente, cambios,
        cuentas: datos.cuentas, otraMoneda: [...otraMoneda],
        campanas: lista,
        sinAsignar: redondo(lista.filter(c => !c.clave && c.origen !== "ignorada").reduce((a, c) => a + c.gasto, 0)),
        productos,
        pauta: pauta.map(publicaPauta),
        actualizado: new Date(datos.t).toISOString()
      });
    } catch (err) {
      console.error("Error sincronizando Meta:", err);
      res.status(err.status || 500).json({ error: err.message || "No se pudo traer el gasto de Meta" });
    }
  });

  // Guardar la pauta de UN día desde la ventana "Revisa el gasto de Meta"
  // asignaciones: [{ campanaId, clave: "p:..|g:.." | "x" (otras) | "" (sin asignar), gasto, editado }]
  app.post("/api/finanzas/meta/guardar", async (req, res) => {
    try {
      const p = pais(req.body?.pais);
      const fecha = fechaQ(req.body?.fecha);
      if (!fecha) return res.status(400).json({ error: "Falta el día" });
      const lista = (Array.isArray(req.body?.asignaciones) ? req.body.asignaciones : []).slice(0, 500);
      const cfg = await FinanzasConfig.findOne({ owner: req.user.uid, pais: p }).lean();
      const mapa = { ...(cfg?.metaCampanas || {}) };
      const nombres = new Map(Object.entries(req.body?.nombres || {}).slice(0, 500).map(([k, v]) => [String(k).slice(0, 60), String(v || "").slice(0, 200)]));
      const sumas = new Map();
      for (const a of lista) {
        const id = String(a?.campanaId || "");
        const clave = String(a?.clave ?? "");
        if (!/^\d{3,30}$/.test(id)) continue;
        if (clave && clave !== "x" && !/^[pg]:[\w-]{1,58}$/.test(clave)) continue;
        if (clave) mapa[id] = clave; else delete mapa[id];
        if (!clave || clave === "x") continue;
        const gasto = Math.max(0, Number(a?.gasto) || 0);
        const s = sumas.get(clave) || { gasto: 0, editado: false };
        s.gasto += gasto; s.editado = s.editado || !!a?.editado;
        sumas.set(clave, s);
      }
      const llaves = Object.keys(mapa);
      for (let i = 0; i < llaves.length - 2000; i++) delete mapa[llaves[i]];
      await FinanzasConfig.findOneAndUpdate(
        { owner: req.user.uid, pais: p }, { $set: { metaCampanas: mapa, actualizado: new Date() }, $setOnInsert: { owner: req.user.uid, pais: p } }, { upsert: true, new: true }
      );
      const redondo = (v) => Math.round(v * 100) / 100;
      const ahora = new Date();
      const existentes = await PautaDia.find({ owner: req.user.uid, pais: p, fecha }).lean();
      for (const [clave, s] of sumas) {
        const d = existentes.find(x => x.clave === clave);
        await PautaDia.findOneAndUpdate(
          { owner: req.user.uid, pais: p, fecha, clave },
          { $set: { meta: redondo(s.gasto), metaAuto: !s.editado, metaManual: s.editado, actualizado: ahora, ...(d?.nombre ? {} : { nombre: nombres.get(clave) || "" }) },
            $setOnInsert: { owner: req.user.uid, pais: p, fecha, clave } },
          { upsert: true, new: true }
        );
      }
      // Lo que venía de Meta ese día y ya no tiene campañas queda en 0
      for (const d of existentes) {
        if (!sumas.has(d.clave) && (d.metaAuto || d.metaManual) && Number(d.meta) > 0) {
          await PautaDia.updateOne({ _id: d._id }, { $set: { meta: 0, metaAuto: false, metaManual: false, actualizado: ahora } });
        }
      }
      const pauta = await PautaDia.find({ owner: req.user.uid, pais: p, fecha }).lean();
      res.json({ ok: true, fecha, pauta: pauta.map(publicaPauta), asignadas: [...sumas.values()].reduce((a, s) => a + s.gasto, 0) });
    } catch (err) {
      console.error("Error guardando pauta de Meta:", err);
      res.status(500).json({ error: "No se pudo guardar la pauta" });
    }
  });

  // Decir de qué producto es una campaña ("" = que CoDropX la empareje solo · "x" = no es de ningún producto)
  app.put("/api/finanzas/meta/campana", async (req, res) => {
    try {
      const p = pais(req.body?.pais);
      const id = String(req.body?.campanaId || "");
      const clave = String(req.body?.clave ?? "");
      if (!/^\d{3,30}$/.test(id)) return res.status(400).json({ error: "Campaña inválida" });
      if (clave && clave !== "x" && !/^[pg]:[\w-]{1,58}$/.test(clave)) return res.status(400).json({ error: "Producto inválido" });
      const cfg = await FinanzasConfig.findOne({ owner: req.user.uid, pais: p }).lean();
      const mapa = { ...(cfg?.metaCampanas || {}) };
      if (clave) mapa[id] = clave; else delete mapa[id];
      const llaves = Object.keys(mapa);
      if (llaves.length > 2000) delete mapa[llaves[0]];
      await FinanzasConfig.findOneAndUpdate(
        { owner: req.user.uid, pais: p }, { $set: { metaCampanas: mapa, actualizado: new Date() }, $setOnInsert: { owner: req.user.uid, pais: p } }, { upsert: true, new: true }
      );
      res.json({ ok: true });
    } catch (err) {
      console.error("Error asignando campaña:", err);
      res.status(500).json({ error: "No se pudo guardar" });
    }
  });
}
