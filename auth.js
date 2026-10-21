// =============================================
// 🔐 AUTENTICACIÓN CoDropX
// Sin dependencias externas: usa solo "crypto" de Node.
// - Contraseñas: scrypt con sal aleatoria
// - Sesión: token firmado (HMAC-SHA256) en cookie httpOnly
// =============================================
import crypto from "crypto";

const COOKIE_NAME = "codropx_session";
const SESSION_DAYS = 7;

let SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  SECRET = crypto.randomBytes(48).toString("hex");
  console.warn(
    "⚠️  JWT_SECRET no está configurado (o es muy corto). " +
    "Se generó uno temporal: las sesiones se cerrarán cada vez que reinicie el servidor."
  );
}

// ---------- Contraseñas ----------
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored = "") {
  const [algo, salt, hash] = String(stored).split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const real = Buffer.from(hash, "hex");
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

// ---------- Tokens de sesión ----------
const b64url = (buf) => Buffer.from(buf).toString("base64url");

function sign(data) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createToken(user) {
  const payload = {
    uid: String(user._id),
    rol: user.rol || "user",
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifyToken(token = "") {
  const [body, sig] = String(token).split(".");
  if (!body || !sig) return null;

  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- Cookies ----------
function parseCookies(header = "") {
  const out = {};
  header.split(";").forEach(part => {
    const i = part.indexOf("=");
    if (i === -1) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

export function getSession(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return verifyToken(cookies[COOKIE_NAME]);
}

export function setSessionCookie(res, token) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(res) {
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

// ---------- Middlewares ----------
export function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: "No autorizado. Inicia sesión." });
  }
  req.user = session;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.rol !== "admin") {
    return res.status(403).json({ error: "Solo el administrador puede hacer esto." });
  }
  next();
}

// ---------- Límite de peticiones (en memoria) ----------
// Ej: rateLimit({ windowMs: 15*60*1000, max: 10, key: req => req.ip })
export function rateLimit({ windowMs, max, key, message }) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const k = key ? key(req) : req.ip;
    const now = Date.now();
    let entry = hits.get(k);

    if (!entry || entry.reset < now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(k, entry);
    }

    entry.count++;

    if (entry.count > max) {
      const retry = Math.ceil((entry.reset - now) / 1000);
      res.setHeader("Retry-After", retry);
      return res.status(429).json({
        error: message || `Demasiadas peticiones. Intenta en ${retry} segundos.`
      });
    }
    next();
  };
}
