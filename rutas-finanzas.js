// =============================================
// 💰 FINANZAS — pedidos de Dropi, pauta diaria y ajustes
// Los pedidos llegan del Excel de Dropi (leído en el navegador).
// Nunca se guardan datos del cliente (nombre, teléfono, dirección, documento).
// Cuando Dropi dé el token "CoDropX", estas mismas tablas se llenarán solas.
// =============================================
import mongoose from "mongoose";

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
  actualizado: { type: Date, default: Date.now }
});
pautaSchema.index({ owner: 1, pais: 1, fecha: 1, clave: 1 }, { unique: true });
export const PautaDia = mongoose.model("PautaDia", pautaSchema);

const configSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  pais: { type: String, enum: PAISES, default: "CO" },
  cuenta: { type: String, default: "" },
  devPct: { type: Number, default: 25 },
  metaEntrega: { type: Number, default: 70 },
  grupos: { type: [mongoose.Schema.Types.Mixed], default: [] },   // { id, nombre, ids: [productoId] }
  ultimaImportacion: { type: Date, default: null },
  actualizado: { type: Date, default: Date.now }
});
configSchema.index({ owner: 1, pais: 1 }, { unique: true });
export const FinanzasConfig = mongoose.model("FinanzasConfig", configSchema);

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
      res.json({
        pais: p, cuenta: cfg?.cuenta || "", devPct: cfg?.devPct ?? 25, metaEntrega: cfg?.metaEntrega ?? 70,
        grupos: cfg?.grupos || [], ultimaImportacion: cfg?.ultimaImportacion || null,
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
      if (Array.isArray(req.body?.grupos)) {
        set.grupos = req.body.grupos.slice(0, 100).map(g => ({
          id: String(g?.id || Math.random().toString(36).slice(2, 10)).slice(0, 20),
          nombre: String(g?.nombre || "Grupo").slice(0, 120),
          ids: [...new Set((Array.isArray(g?.ids) ? g.ids : []).map(x => String(x).slice(0, 40)))].slice(0, 50)
        })).filter(g => g.ids.length >= 2);
      }
      const cfg = await FinanzasConfig.findOneAndUpdate(
        { owner: req.user.uid, pais: p }, { $set: set, $setOnInsert: { owner: req.user.uid, pais: p } }, { upsert: true, new: true }
      ).lean();
      res.json({ ok: true, devPct: cfg.devPct, metaEntrega: cfg.metaEntrega, grupos: cfg.grupos || [], cuenta: cfg.cuenta || "" });
    } catch (err) {
      console.error("Error guardando ajustes de finanzas:", err);
      res.status(500).json({ error: "No se pudo guardar" });
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
      const lista = await PautaDia.find(filtro).select("-_id -owner -__v").lean();
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
      if (b.devPct !== undefined) set.devPct = b.devPct === null || b.devPct === "" ? null : Math.min(95, Math.max(0, Number(b.devPct) || 0));
      if (b.tipo !== undefined) set.tipo = ["testeo", "escala"].includes(b.tipo) ? b.tipo : "testeo";
      if (b.fallido !== undefined) set.fallido = !!b.fallido;
      if (b.nombre !== undefined) set.nombre = String(b.nombre || "").slice(0, 200);
      const doc = await PautaDia.findOneAndUpdate(
        { owner: req.user.uid, pais: p, fecha, clave },
        { $set: set, $setOnInsert: { owner: req.user.uid, pais: p, fecha, clave } },
        { upsert: true, new: true }
      ).lean();
      res.json({ ok: true, pauta: { fecha: doc.fecha, clave: doc.clave, nombre: doc.nombre, meta: doc.meta, tiktok: doc.tiktok, devPct: doc.devPct, tipo: doc.tipo, fallido: doc.fallido } });
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
}
