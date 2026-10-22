// =============================================
// 🔌 INTEGRACIÓN META ADS (solo lectura)
// Conexión oficial con "Inicio de sesión con Facebook para empresas":
//   1. /api/meta/conectar  → te manda a facebook.com a dar el permiso ads_read
//   2. /api/meta/callback  → Facebook vuelve con un código; lo cambiamos por un token
//   3. El token se guarda CIFRADO en Mongo y nunca sale del servidor
// Variables en Render: META_APP_ID, META_APP_SECRET, META_CONFIG_ID
// (opcionales: META_REDIRECT_URI, META_API_VERSION)
// =============================================
import crypto from "crypto";
import mongoose from "mongoose";
import fetch from "node-fetch";

const Mixed = mongoose.Schema.Types.Mixed;

const metaSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true, unique: true },
  token: { type: String, default: "" },          // cifrado (AES-256-GCM)
  expira: { type: Date, default: null },
  fbUserId: { type: String, default: "" },
  fbNombre: { type: String, default: "" },
  cuentas: { type: [Mixed], default: [] },       // { id, account_id, name, currency, status, business }
  elegidas: { type: [String], default: [] },     // account_id que usas en CoDropX
  conectado: { type: Date, default: Date.now },
  actualizado: { type: Date, default: Date.now }
});

export const MetaConexion = mongoose.model("MetaConexion", metaSchema);

const config = () => ({
  appId: process.env.META_APP_ID || "",
  secret: process.env.META_APP_SECRET || "",
  configId: process.env.META_CONFIG_ID || "",
  version: process.env.META_API_VERSION || "v23.0",
  redirect: process.env.META_REDIRECT_URI || "https://codropx.com/api/meta/callback"
});
const configurado = () => { const c = config(); return !!(c.appId && c.secret && c.configId); };

// ---------- Cifrado del token ----------
const llave = () => crypto.createHash("sha256").update(`codropx-meta:${process.env.JWT_SECRET || ""}`).digest();

export function cifrar(texto) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", llave(), iv);
  const datos = Buffer.concat([c.update(String(texto), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), datos].map(b => b.toString("base64")).join(".");
}

export function descifrar(guardado) {
  const [iv, tag, datos] = String(guardado || "").split(".").map(x => Buffer.from(x, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", llave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(datos), d.final()]).toString("utf8");
}

// ---------- "state": protege contra que otro sitio conecte su cuenta en la tuya ----------
const firmar = (v) => crypto.createHmac("sha256", llave()).update(v).digest("base64url");

function crearState(uid) {
  const nonce = crypto.randomBytes(16).toString("base64url");
  const base = `${uid}.${Date.now()}.${nonce}`;
  return { state: `${base}.${firmar(base)}`, nonce };
}

function validarState(state, uid, nonceCookie) {
  const partes = String(state || "").split(".");
  if (partes.length !== 4) return false;
  const [u, ts, nonce, firma] = partes;
  const base = `${u}.${ts}.${nonce}`;
  const esperada = firmar(base);
  if (firma.length !== esperada.length || !crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return false;
  if (u !== String(uid) || nonce !== nonceCookie) return false;
  return Date.now() - Number(ts) < 15 * 60 * 1000;   // 15 minutos para dar el permiso
}

const leerCookie = (req, nombre) => {
  const m = String(req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${nombre}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
};

// ---------- Llamadas a la API de Meta ----------
class ErrorMeta extends Error {
  constructor(mensaje, codigo, status = 502) { super(mensaje); this.codigo = codigo; this.status = status; }
}

async function graph(ruta, params = {}) {
  const c = config();
  const url = new URL(ruta.startsWith("http") ? ruta : `https://graph.facebook.com/${c.version}/${ruta.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error || {};
    const vencido = e.code === 190;
    throw new ErrorMeta(
      vencido ? "La conexión con Meta venció o fue retirada. Vuelve a conectar." :
      e.code === 17 || e.code === 4 || e.code === 80004 ? "Meta pidió esperar un momento (límite de consultas). Intenta en unos minutos." :
      `Meta respondió: ${e.message || res.status}`,
      e.code, vencido ? 401 : 502
    );
  }
  return data;
}

// Trae todas las páginas (máximo 'tope' elementos)
async function todas(ruta, params, tope = 300) {
  const out = [];
  let data = await graph(ruta, params);
  while (true) {
    out.push(...(data.data || []));
    if (out.length >= tope || !data.paging?.next) break;
    data = await graph(data.paging.next);
  }
  return out.slice(0, tope);
}

const ESTADOS_CUENTA = { 1: "Activa", 2: "Deshabilitada", 3: "Pago pendiente", 7: "En revisión", 8: "Pago pendiente", 9: "En periodo de gracia", 100: "Cerrada", 101: "Cerrada" };

async function traerCuentas(token) {
  const pedir = (fields) => todas("me/adaccounts", { access_token: token, fields, limit: 100 });
  let lista;
  try {
    lista = await pedir("name,account_id,currency,account_status,business{name}");
  } catch (e) {
    if (e.codigo === 190) throw e;
    // Solo con ads_read, Meta a veces no deja ver el negocio: se pide sin ese dato
    lista = await pedir("name,account_id,currency,account_status");
  }
  return lista.map(a => ({
    id: String(a.id || ""),
    account_id: String(a.account_id || ""),
    name: String(a.name || ""),
    currency: String(a.currency || ""),
    status: ESTADOS_CUENTA[a.account_status] || `Estado ${a.account_status}`,
    activa: a.account_status === 1,
    business: String(a.business?.name || "")
  }));
}

const publico = (doc) => doc ? {
  conectado: true,
  nombre: doc.fbNombre,
  conectadoEl: doc.conectado,
  expira: doc.expira,
  cuentas: doc.cuentas || [],
  elegidas: doc.elegidas || []
} : { conectado: false };

export function registrarRutasMeta(app) {
  // Estado de la conexión (nunca devuelve el token)
  app.get("/api/meta/estado", async (req, res) => {
    try {
      const doc = await MetaConexion.findOne({ owner: req.user.uid }).lean();
      res.json({ configurado: configurado(), ...publico(doc) });
    } catch (err) {
      console.error("Error estado Meta:", err);
      res.status(500).json({ error: "No se pudo leer la conexión con Meta" });
    }
  });

  // 1. Ir a Facebook a dar el permiso
  app.get("/api/meta/conectar", (req, res) => {
    if (!configurado()) return res.redirect("/?meta=sin-configurar");
    const c = config();
    const { state, nonce } = crearState(req.user.uid);
    const seguro = req.secure ? "; Secure" : "";
    res.setHeader("Set-Cookie", `codropx_meta_state=${nonce}; Path=/api/meta; HttpOnly; SameSite=Lax; Max-Age=900${seguro}`);
    const url = new URL(`https://www.facebook.com/${c.version}/dialog/oauth`);
    url.searchParams.set("client_id", c.appId);
    url.searchParams.set("redirect_uri", c.redirect);
    url.searchParams.set("config_id", c.configId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    res.redirect(url.toString());
  });

  // 2. Facebook vuelve aquí
  app.get("/api/meta/callback", async (req, res) => {
    const volver = (estado) => res.redirect(`/?meta=${estado}`);
    try {
      const { code, state, error } = req.query || {};
      res.setHeader("Set-Cookie", "codropx_meta_state=; Path=/api/meta; HttpOnly; SameSite=Lax; Max-Age=0");
      if (error) return volver("cancelado");
      if (!code || !validarState(state, req.user.uid, leerCookie(req, "codropx_meta_state"))) return volver("invalido");

      const c = config();
      const corto = await graph("oauth/access_token", {
        client_id: c.appId, client_secret: c.secret, redirect_uri: c.redirect, code
      });
      // Token de larga duración (~60 días)
      let token = corto.access_token, segundos = corto.expires_in;
      try {
        const largo = await graph("oauth/access_token", {
          grant_type: "fb_exchange_token", client_id: c.appId, client_secret: c.secret, fb_exchange_token: token
        });
        if (largo.access_token) { token = largo.access_token; segundos = largo.expires_in || segundos; }
      } catch (e) { console.warn("No se pudo alargar el token de Meta:", e.message); }

      const yo = await graph("me", { access_token: token, fields: "id,name" });
      const cuentas = await traerCuentas(token);
      const anterior = await MetaConexion.findOne({ owner: req.user.uid }).lean();
      const ids = new Set(cuentas.map(x => x.account_id));
      const elegidas = (anterior?.elegidas || []).filter(id => ids.has(id));

      await MetaConexion.findOneAndUpdate(
        { owner: req.user.uid },
        {
          $set: {
            token: cifrar(token),
            expira: segundos ? new Date(Date.now() + Number(segundos) * 1000) : null,
            fbUserId: String(yo.id || ""), fbNombre: String(yo.name || ""),
            cuentas, elegidas: elegidas.length ? elegidas : cuentas.filter(x => x.activa).map(x => x.account_id),
            conectado: new Date(), actualizado: new Date()
          },
          $setOnInsert: { owner: req.user.uid }
        },
        { upsert: true, new: true }
      );
      volver("ok");
    } catch (err) {
      console.error("Error conectando Meta:", err);
      volver("error");
    }
  });

  // Elegir qué cuentas usar
  app.put("/api/meta/cuentas", async (req, res) => {
    try {
      const doc = await MetaConexion.findOne({ owner: req.user.uid }).lean();
      if (!doc) return res.status(404).json({ error: "Meta no está conectado" });
      const ids = new Set((doc.cuentas || []).map(x => x.account_id));
      const elegidas = (Array.isArray(req.body?.elegidas) ? req.body.elegidas : []).map(String).filter(id => ids.has(id));
      const nuevo = await MetaConexion.findOneAndUpdate(
        { owner: req.user.uid }, { $set: { elegidas: [...new Set(elegidas)], actualizado: new Date() } }, { new: true }
      ).lean();
      res.json(publico(nuevo));
    } catch (err) {
      console.error("Error guardando cuentas Meta:", err);
      res.status(500).json({ error: "No se pudo guardar" });
    }
  });

  // Volver a leer la lista de cuentas
  app.post("/api/meta/actualizar", async (req, res) => {
    try {
      const doc = await MetaConexion.findOne({ owner: req.user.uid }).lean();
      if (!doc) return res.status(404).json({ error: "Meta no está conectado" });
      const cuentas = await traerCuentas(descifrar(doc.token));
      const ids = new Set(cuentas.map(x => x.account_id));
      const nuevo = await MetaConexion.findOneAndUpdate(
        { owner: req.user.uid },
        { $set: { cuentas, elegidas: (doc.elegidas || []).filter(id => ids.has(id)), actualizado: new Date() } },
        { new: true }
      ).lean();
      res.json(publico(nuevo));
    } catch (err) {
      console.error("Error actualizando cuentas Meta:", err);
      res.status(err.status || 500).json({ error: err.message || "No se pudo actualizar" });
    }
  });

  // Gasto por día de las cuentas elegidas (prueba de que la conexión funciona)
  app.get("/api/meta/gasto", async (req, res) => {
    try {
      const doc = await MetaConexion.findOne({ owner: req.user.uid }).lean();
      if (!doc) return res.status(404).json({ error: "Meta no está conectado" });
      const dias = Math.min(30, Math.max(1, Number(req.query.dias) || 7));
      const token = descifrar(doc.token);
      const cuentas = (doc.cuentas || []).filter(x => (doc.elegidas || []).includes(x.account_id)).slice(0, 25);
      const filas = [];
      for (const cta of cuentas) {
        try {
          const datos = await todas(`act_${cta.account_id}/insights`, {
            access_token: token,
            fields: "spend,impressions,clicks,actions",
            date_preset: dias === 7 ? "last_7d" : dias === 30 ? "last_30d" : undefined,
            time_range: [7, 30].includes(dias) ? undefined : JSON.stringify({
              since: new Date(Date.now() - (dias - 1) * 864e5).toISOString().slice(0, 10),
              until: new Date().toISOString().slice(0, 10)
            }),
            time_increment: 1,
            limit: 100
          }, 60);
          const compras = (acts = []) => Number((acts.find(a => ["purchase", "offsite_conversion.fb_pixel_purchase", "omni_purchase"].includes(a.action_type)) || {}).value || 0);
          filas.push({
            cuenta: cta.name, account_id: cta.account_id, moneda: cta.currency,
            dias: datos.map(d => ({ fecha: d.date_start, gasto: Number(d.spend || 0), compras: compras(d.actions), clics: Number(d.clicks || 0) }))
          });
        } catch (e) {
          if (e.codigo === 190) throw e;
          filas.push({ cuenta: cta.name, account_id: cta.account_id, moneda: cta.currency, error: e.message, dias: [] });
        }
      }
      res.json({ dias, cuentas: filas });
    } catch (err) {
      console.error("Error leyendo gasto Meta:", err);
      res.status(err.status || 500).json({ error: err.message || "No se pudo leer el gasto" });
    }
  });

  // Desconectar: retira el permiso en Facebook y borra el token
  app.delete("/api/meta", async (req, res) => {
    try {
      const doc = await MetaConexion.findOne({ owner: req.user.uid }).lean();
      if (doc?.token) {
        try {
          const c = config();
          await fetch(`https://graph.facebook.com/${c.version}/me/permissions?access_token=${encodeURIComponent(descifrar(doc.token))}`, { method: "DELETE" });
        } catch (e) { console.warn("No se pudo retirar el permiso en Meta:", e.message); }
      }
      await MetaConexion.findOneAndDelete({ owner: req.user.uid });
      res.json({ ok: true });
    } catch (err) {
      console.error("Error desconectando Meta:", err);
      res.status(500).json({ error: "No se pudo desconectar" });
    }
  });
}
