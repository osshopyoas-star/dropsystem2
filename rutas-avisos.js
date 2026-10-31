// =============================================
// 🔔 AVISOS EN EL CELULAR (notificaciones push)
// Cada mañana (7:30 a. m. hora Colombia/Ecuador) se manda "Lo que toca hoy" a quien activó los avisos:
// novedades, pedidos sin movimiento, testeos para escalar o apagar y temporadas que hay que empezar a testear.
// Las claves VAPID se crean solas la primera vez y se guardan cifradas (o se toman de VAPID_PUBLICA / VAPID_PRIVADA).
// Un cron externo puede llamar POST /api/avisos/enviar-hoy con la cabecera X-Cron-Secret = CRON_SECRET.
// =============================================
import mongoose from "mongoose";
import webpush from "web-push";
import { cifrar, descifrar } from "./rutas-meta.js";
import { DropiLinea, PautaDia, FinanzasConfig } from "./rutas-finanzas.js";
import { Costeo } from "./rutas-costeos.js";
import { logistica, claveDeProducto, metricasProducto, decidirTesteo } from "./public/js/core/finanzas.js";
import { proximasTemporadas } from "./public/js/core/temporadas.js";

const suscripcionSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  pais: { type: String, enum: ["CO", "EC"], default: "CO" },
  endpoint: { type: String, unique: true },
  keys: { p256dh: String, auth: String },
  agente: { type: String, default: "" },
  creado: { type: Date, default: Date.now },
  ultimoEnvio: { type: String, default: "" }      // "2026-10-31": el día (hora Colombia) en que se mandó el resumen
});
export const PushSuscripcion = mongoose.model("PushSuscripcion", suscripcionSchema);

const ajusteSchema = new mongoose.Schema({ clave: { type: String, unique: true }, valor: mongoose.Schema.Types.Mixed });
const AvisosAjuste = mongoose.model("AvisosAjuste", ajusteSchema);

// ---------- Claves VAPID ----------
let claves = null;
async function clavesVapid() {
  if (claves) return claves;
  if (process.env.VAPID_PUBLICA && process.env.VAPID_PRIVADA) claves = { publica: process.env.VAPID_PUBLICA, privada: process.env.VAPID_PRIVADA };
  else {
    let doc = await AvisosAjuste.findOne({ clave: "vapid" }).lean();
    if (!doc) {
      const k = webpush.generateVAPIDKeys();
      doc = await AvisosAjuste.findOneAndUpdate({ clave: "vapid" }, { $setOnInsert: { clave: "vapid", valor: { publica: k.publicKey, privada: cifrar(k.privateKey) } } }, { upsert: true, new: true }).lean();
    }
    claves = { publica: doc.valor.publica, privada: descifrar(doc.valor.privada) };
  }
  webpush.setVapidDetails(process.env.VAPID_CONTACTO || "mailto:avisos@codropx.com", claves.publica, claves.privada);
  return claves;
}

// ---------- Lo que toca hoy (lo mismo que el Inicio, armado en el servidor) ----------
const hoyCO = () => new Date(Date.now() - 5 * 36e5).toISOString().slice(0, 10);
const restar = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const cpaMaximo = (c) => {
  const r = c?.resumen || {};
  if (!(Number(r.bep) > 0)) return null;
  const extra = Number(r.gananciaCliente) > 0 && Number.isFinite(Number(r.utilidad)) ? Math.max(0, Number(r.gananciaCliente) - Number(r.utilidad)) : 0;
  return Number(r.bep) + extra;
};
export async function loQueTocaHoy(owner, pais, { Producto } = {}) {
  const hoy = hoyCO();
  const items = [];
  const [lineas, cfg] = await Promise.all([
    DropiLinea.find({ owner, pais, fecha: { $gte: restar(hoy, 90) } }).select("-_id -owner -__v -importado").lean(),
    FinanzasConfig.findOne({ owner, pais }).lean()
  ]);
  const grupos = cfg?.grupos || [];
  if (lineas.length) {
    const lg = logistica(lineas, { desde: restar(hoy, 45), hasta: hoy, grupos, ahora: new Date(cfg?.ultimaImportacion || Date.now()) });
    if (lg.novedadesActivas.total) items.push(`${lg.novedadesActivas.total} novedad${lg.novedadesActivas.total === 1 ? "" : "es"} por gestionar`);
    if (lg.sinMovimiento.total) items.push(`${lg.sinMovimiento.total} pedido${lg.sinMovimiento.total === 1 ? "" : "s"} sin movimiento`);
    // Testeos: escalar o apagar
    if (Producto) {
      const testeos = await Producto.find({ owner, pais, resultado: "testeando" }).select("nombre dropiId testeo").lean();
      if (testeos.length) {
        const pautaLista = await PautaDia.find({ owner, pais, fecha: { $gte: restar(hoy, 120) } }).select("fecha clave meta tiktok -_id").lean();
        const pauta = Object.fromEntries(pautaLista.map(x => [`${x.fecha}|${x.clave}`, x]));
        const costeos = new Map((await Costeo.find({ owner, productoId: { $in: testeos.map(t => t._id) } }).lean()).map(c => [String(c.productoId), c]));
        for (const p of testeos) {
          const clave = claveDeProducto(p, lineas, grupos);
          if (!clave) continue;
          const desde = p.testeo?.inicio ? new Date(p.testeo.inicio).toISOString().slice(0, 10) : null;
          const args = { clave, pauta, grupos, devPct: cfg?.devPct ?? 25 };
          const m = metricasProducto(lineas, { ...args, desde, hasta: hoy });
          const m3 = metricasProducto(lineas, { ...args, desde: [restar(hoy, 2), desde].filter(Boolean).sort().pop(), hasta: hoy });
          const d = decidirTesteo(m && (m.pedidos || m.gasto) ? m : null, { cpaMaximoRef: cpaMaximo(costeos.get(String(p._id))), ultimos: m3 });
          if (d?.accion === "escalar") items.push(`escalar ${p.nombre}`);
          else if (d?.accion === "apagar") items.push(`apagar ${p.nombre}`);
        }
      }
    }
  }
  // Temporadas: ya toca empezar a testear (o en los próximos 3 días)
  for (const t of proximasTemporadas(pais, hoy, 6)) {
    const enDias = Math.round((new Date(t.testearDesde + "T12:00:00Z") - new Date(hoy + "T12:00:00Z")) / 864e5);
    if (t.faltan > 3 && enDias <= 3 && enDias >= -2) items.push(enDias > 0 ? `en ${enDias} día${enDias === 1 ? "" : "s"} empieza a testear para ${t.nombre}` : `ya toca testear para ${t.nombre}`);
  }
  const dias = cfg?.ultimaImportacion ? Math.floor((Date.now() - new Date(cfg.ultimaImportacion)) / 864e5) : null;
  if (dias !== null && dias >= 2) items.push(`sube el Excel de Dropi (el último es de hace ${dias} días)`);
  return {
    titulo: `☀️ Lo que toca hoy · ${pais === "EC" ? "Ecuador" : "Colombia"}`,
    cuerpo: items.length ? items.map(x => x[0].toUpperCase() + x.slice(1)).join(" · ") : "Todo al día: sin novedades ni testeos por decidir. 🙌",
    items
  };
}

// ---------- Mandar ----------
async function mandar(sub, datos) {
  await clavesVapid();
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(datos), { TTL: 6 * 3600 });
    return true;
  } catch (e) {
    // 404/410: el celular ya no tiene esa suscripción (desinstaló o quitó el permiso)
    if (e.statusCode === 404 || e.statusCode === 410) await PushSuscripcion.deleteOne({ _id: sub._id });
    else console.warn("No se pudo mandar el aviso:", e.statusCode || "", e.message);
    return false;
  }
}

// Manda el resumen del día a todas las suscripciones que aún no lo recibieron hoy (una vez por persona y país)
export async function enviarResumenesDeHoy({ Producto } = {}) {
  const hoy = hoyCO();
  const pendientes = await PushSuscripcion.find({ ultimoEnvio: { $ne: hoy } }).lean();
  const porDueno = new Map();
  for (const s of pendientes) {
    const k = `${s.owner}|${s.pais}`;
    if (!porDueno.has(k)) porDueno.set(k, []);
    porDueno.get(k).push(s);
  }
  let enviados = 0;
  for (const [k, subs] of porDueno) {
    const [owner, pais] = k.split("|");
    try {
      const r = await loQueTocaHoy(owner, pais, { Producto });
      for (const s of subs) if (await mandar(s, { titulo: r.titulo, cuerpo: r.cuerpo, url: "/" })) enviados++;
      await PushSuscripcion.updateMany({ _id: { $in: subs.map(s => s._id) } }, { $set: { ultimoEnvio: hoy } });
    } catch (e) { console.warn("No se pudo armar el resumen de avisos:", e.message); }
  }
  return enviados;
}

export function registrarRutasAvisos(app, { Producto } = {}) {
  app.get("/api/avisos/clave", async (req, res) => {
    try { res.json({ clave: (await clavesVapid()).publica }); }
    catch (err) { console.error("Error con las claves de avisos:", err); res.status(500).json({ error: "Los avisos no están disponibles" }); }
  });

  app.get("/api/avisos/estado", async (req, res) => {
    const subs = await PushSuscripcion.find({ owner: req.user.uid }).select("pais endpoint creado ultimoEnvio -_id").lean();
    res.json({ suscripciones: subs.map(s => ({ pais: s.pais, endpoint: s.endpoint, creado: s.creado, ultimoEnvio: s.ultimoEnvio })) });
  });

  app.post("/api/avisos/suscribir", async (req, res) => {
    try {
      const s = req.body?.suscripcion || {};
      const endpoint = String(s.endpoint || "");
      if (!/^https:\/\//.test(endpoint) || !s.keys?.p256dh || !s.keys?.auth) return res.status(400).json({ error: "Suscripción inválida" });
      const pais = req.body?.pais === "EC" ? "EC" : "CO";
      await PushSuscripcion.findOneAndUpdate(
        { endpoint },
        { $set: { owner: req.user.uid, pais, keys: { p256dh: String(s.keys.p256dh).slice(0, 200), auth: String(s.keys.auth).slice(0, 100) }, agente: String(req.headers["user-agent"] || "").slice(0, 200) }, $setOnInsert: { creado: new Date(), ultimoEnvio: "" } },
        { upsert: true }
      );
      res.json({ ok: true });
    } catch (err) {
      console.error("Error guardando la suscripción:", err);
      res.status(500).json({ error: "No se pudieron activar los avisos" });
    }
  });

  app.delete("/api/avisos/suscribir", async (req, res) => {
    await PushSuscripcion.deleteOne({ owner: req.user.uid, endpoint: String(req.body?.endpoint || "") });
    res.json({ ok: true });
  });

  // Manda ya el resumen de hoy a los celulares de esta persona (para probar)
  app.post("/api/avisos/probar", async (req, res) => {
    try {
      const subs = await PushSuscripcion.find({ owner: req.user.uid }).lean();
      if (!subs.length) return res.status(400).json({ error: "Primero activa los avisos en este celular" });
      let ok = 0;
      for (const pais of [...new Set(subs.map(s => s.pais))]) {
        const r = await loQueTocaHoy(req.user.uid, pais, { Producto });
        for (const s of subs.filter(x => x.pais === pais)) if (await mandar(s, { titulo: r.titulo, cuerpo: r.cuerpo, url: "/" })) ok++;
      }
      res.json({ ok: true, enviados: ok });
    } catch (err) {
      console.error("Error probando avisos:", err);
      res.status(500).json({ error: "No se pudo mandar el aviso de prueba" });
    }
  });
}

// Cron externo (Render Cron Job u otro): POST /api/avisos/enviar-hoy con X-Cron-Secret. Va ANTES del login.
export function registrarCronAvisos(app, { Producto } = {}) {
  app.post("/api/avisos/enviar-hoy", async (req, res) => {
    if (!process.env.CRON_SECRET || req.headers["x-cron-secret"] !== process.env.CRON_SECRET) return res.status(401).json({ error: "No autorizado" });
    res.json({ ok: true, enviados: await enviarResumenesDeHoy({ Producto }) });
  });
}

// Revisa cada 10 minutos: desde las 7:30 a. m. (hora Colombia/Ecuador) manda el resumen de hoy a quien no lo tenga
export function iniciarAvisosDiarios({ Producto } = {}) {
  const revisar = async () => {
    const ahora = new Date(Date.now() - 5 * 36e5);
    if (ahora.getUTCHours() * 60 + ahora.getUTCMinutes() < 7 * 60 + 30) return;
    try { await enviarResumenesDeHoy({ Producto }); } catch (e) { console.warn("Avisos diarios:", e.message); }
  };
  setTimeout(revisar, 60 * 1000);
  return setInterval(revisar, 10 * 60 * 1000);
}
