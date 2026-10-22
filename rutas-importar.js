// =============================================
// 🔗 IMPORTAR FICHA DESDE UN LINK (tienda Shopify, proveedor o cualquier página de producto)
// El servidor visita el link, saca nombre, descripción, precio, variantes y hasta 6 fotos.
// Protección SSRF: solo http/https, puertos normales, nunca IPs privadas/locales
// (se revisa en cada conexión, también en redirecciones), tiempo y tamaño máximos.
// =============================================
import fetch from "node-fetch";
import dns from "dns";
import net from "net";
import http from "http";
import https from "https";

const TIEMPO_MS = 10000;
const MAX_HTML = 3 * 1024 * 1024;
const MAX_IMAGEN = 4 * 1024 * 1024;
const MAX_IMAGENES = 6;
const MAX_REDIRECCIONES = 3;
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];

// ---------- IPs que nunca se visitan ----------
function ipv4Privada(ip) {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||          // CGNAT
    (a === 169 && b === 254) ||                    // link-local / metadatos de la nube
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && p[2] === 0) ||
    (a === 198 && (b === 18 || b === 19));
}

export function esIpPrivada(ip) {
  const s = String(ip || "").toLowerCase().replace(/^\[|\]$/g, "");
  const v = net.isIP(s);
  if (v === 4) return ipv4Privada(s);
  if (v === 6) {
    const m = s.match(/^(?:0*:)*(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);      // ::ffff:1.2.3.4 y ::1.2.3.4
    if (m) return ipv4Privada(m[1]);
    if (s === "::" || s === "::1") return true;
    if (/^f[cd]/.test(s)) return true;                                   // fc00::/7
    if (/^fe[89ab]/.test(s)) return true;                                // fe80::/10
    if (/^ff/.test(s)) return true;                                      // multicast
    if (/^64:ff9b:/.test(s)) return true;                                // NAT64
    if (/^2001:db8:/.test(s)) return true;
    return false;
  }
  return true;   // no es una IP
}

// Revisa la IP en el momento exacto de conectar (evita el truco de cambiar el DNS entre la revisión y la visita)
function lookupSeguro(hostname, opciones, cb) {
  if (typeof opciones === "function") { cb = opciones; opciones = {}; }
  dns.lookup(hostname, { ...opciones, all: true }, (err, direcciones) => {
    if (err) return cb(err);
    const lista = Array.isArray(direcciones) ? direcciones : [{ address: direcciones, family: net.isIP(direcciones) }];
    if (!lista.length || lista.some(d => esIpPrivada(d.address))) {
      const e = new Error("Dirección no permitida"); e.code = "IP_PRIVADA"; return cb(e);
    }
    if (opciones?.all) return cb(null, lista);
    cb(null, lista[0].address, lista[0].family);
  });
}
const agenteHttp = new http.Agent({ lookup: lookupSeguro });
const agenteHttps = new https.Agent({ lookup: lookupSeguro });
const agente = (u) => (u.protocol === "http:" ? agenteHttp : agenteHttps);

export class ErrorImportar extends Error {
  constructor(mensaje, status = 400) { super(mensaje); this.status = status; }
}

// Link limpio y permitido (sin usuario/clave, solo puertos 80/443, sin IPs privadas escritas a mano)
export function validarUrl(texto) {
  let s = String(texto || "").trim();
  if (!s) throw new ErrorImportar("Pega el link del producto");
  if (s.length > 2000) throw new ErrorImportar("El link es demasiado largo");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  let u;
  try { u = new URL(s); } catch { throw new ErrorImportar("Ese link no es válido"); }
  if (!["http:", "https:"].includes(u.protocol)) throw new ErrorImportar("Solo se aceptan links http o https");
  if (u.username || u.password) throw new ErrorImportar("Ese link no es válido");
  if (u.port && !["80", "443"].includes(u.port)) throw new ErrorImportar("Ese link no es válido");
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (net.isIP(host)) { if (esIpPrivada(host)) throw new ErrorImportar("Ese link no es válido"); }
  else if (!host.includes(".") || /\.(local|localhost|internal|lan|home|corp)$/.test(host) || host === "localhost") {
    throw new ErrorImportar("Ese link no es válido");
  }
  if (/(^|\.)dropi\.(co|com|ec|mx|cl|pe|com\.co)$/.test(host)) {
    throw new ErrorImportar("Los productos de Dropi piden iniciar sesión, así que no se pueden leer desde el link. Copia la descripción y sube las fotos a mano (o usa el link de tu tienda o de la página del proveedor).");
  }
  u.hash = "";
  return u;
}

// Descarga con tiempo y tamaño máximos; sigue redirecciones revisando cada una
async function descargar(url, { fetchFn = fetch, max, acepta = "*/*" } = {}) {
  let actual = url;
  for (let i = 0; i <= MAX_REDIRECCIONES; i++) {
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), TIEMPO_MS);
    let res;
    try {
      res = await fetchFn(actual.href, {
        redirect: "manual",
        signal: control.signal,
        agent: agente,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CoDropX/1.0; +https://codropx.com)", Accept: acepta, "Accept-Language": "es-CO,es;q=0.9" }
      });
    } catch (err) {
      clearTimeout(reloj);
      if (err?.code === "IP_PRIVADA" || err?.cause?.code === "IP_PRIVADA") throw new ErrorImportar("Ese link no es válido");
      if (err?.name === "AbortError") throw new ErrorImportar("La página tardó demasiado en responder", 504);
      throw new ErrorImportar("No se pudo abrir la página. Revisa el link.", 502);
    }
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      clearTimeout(reloj);
      const destino = res.headers.get("location");
      if (!destino) throw new ErrorImportar("La página redirige a un lugar inválido", 502);
      actual = validarUrl(new URL(destino, actual).href);
      continue;
    }
    try {
      if (!res.ok) throw new ErrorImportar(res.status === 404 ? "Esa página no existe (404)" : res.status === 401 || res.status === 403 ? "La página no deja leer el producto (pide sesión o bloquea visitas)" : `La página respondió con error ${res.status}`, 502);
      const largo = Number(res.headers.get("content-length") || 0);
      if (largo > max) throw new ErrorImportar("La página es demasiado grande", 413);
      const partes = [];
      let total = 0;
      for await (const parte of res.body) {
        total += parte.length;
        if (total > max) { control.abort(); throw new ErrorImportar("La página es demasiado grande", 413); }
        partes.push(Buffer.from(parte));
      }
      return { url: actual, tipo: String(res.headers.get("content-type") || "").toLowerCase(), cuerpo: Buffer.concat(partes) };
    } finally { clearTimeout(reloj); }
  }
  throw new ErrorImportar("La página redirige demasiadas veces", 502);
}

// ---------- Lectura de la página (funciones puras, se prueban sin internet) ----------
const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", uuml: "ü", iexcl: "¡", iquest: "¿", deg: "°", hellip: "…", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", bull: "•", times: "×" };
export function decodificar(s) {
  return String(s || "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : "";
    }
    return ENTIDADES[e] ?? m;
  });
}

export function htmlATexto(html) {
  return decodificar(String(html || "")
    .replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr|ul|ol|section)\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const numero = (v) => {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : null;
  let s = String(v).replace(/[^\d.,]/g, "");
  if (!s) return null;
  // "89.900" / "89,900" (miles) · "89900.00" / "19,99" (decimales)
  const ult = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
  if (ult >= 0) {
    const dec = s.length - ult - 1;
    s = dec === 3 ? s.replace(/[.,]/g, "") : s.slice(0, ult).replace(/[.,]/g, "") + "." + s.slice(ult + 1);
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
};

function absoluta(src, base) {
  if (!src) return null;
  try {
    const u = new URL(String(src).trim(), base);
    return ["http:", "https:"].includes(u.protocol) ? u.href : null;
  } catch { return null; }
}

function metas(html) {
  const out = {};
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const clave = (tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i) || [])[1];
    const valor = (tag.match(/\bcontent\s*=\s*"([^"]*)"/i) || tag.match(/\bcontent\s*=\s*'([^']*)'/i) || [])[1];
    if (clave && valor != null) (out[clave.toLowerCase()] ||= []).push(decodificar(valor));
  }
  return out;
}

function productosJsonLd(html) {
  const lista = [];
  const visitar = (n) => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach(visitar);
    const t = n["@type"];
    if (t === "Product" || (Array.isArray(t) && t.includes("Product")) || t === "ProductGroup") lista.push(n);
    if (n["@graph"]) visitar(n["@graph"]);
  };
  for (const m of html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visitar(JSON.parse(m[1].trim())); } catch { /* JSON roto: se ignora */ }
  }
  return lista;
}

const unicos = (arr) => [...new Set(arr.filter(Boolean))];

// Ficha a partir del HTML de una página de producto
export function extraerFicha(html, url) {
  html = String(html || "");
  const base = String(url);
  const m = metas(html);
  const ld = productosJsonLd(html)[0] || {};
  const oferta = [].concat(ld.offers || []).flatMap(o => o?.offers ? [].concat(o.offers) : [o])[0] || {};
  const imgsLd = [].concat(ld.image || []).map(x => (typeof x === "string" ? x : x?.url || x?.contentUrl));
  const titulo = decodificar(ld.name || m["og:title"]?.[0] || (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
  const descripcion = htmlATexto(ld.description || m["og:description"]?.[0] || m["description"]?.[0] || "");
  const precio = numero(oferta.price ?? oferta.lowPrice ?? m["product:price:amount"]?.[0] ?? m["og:price:amount"]?.[0]);
  const variantes = unicos([].concat(ld.hasVariant || []).map(v => decodificar(v?.name || "").replace(titulo, "").replace(/^[\s\-–|/]+/, "").trim())).slice(0, 20);
  const imagenes = unicos([...imgsLd, ...(m["og:image"] || []), ...(m["og:image:secure_url"] || [])].map(x => absoluta(x, base)));
  return {
    nombre: titulo.slice(0, 200),
    descripcion: descripcion.slice(0, 4000),
    precio, precioAntes: null,
    moneda: String(oferta.priceCurrency || m["product:price:currency"]?.[0] || "").toUpperCase().slice(0, 3),
    variantes: variantes.join(", ").slice(0, 500),
    imagenes: imagenes.slice(0, 12)
  };
}

// Ficha a partir de /products/<handle>.json de Shopify
export function fichaDeShopify(json, url) {
  const p = json?.product;
  if (!p || !p.title) return null;
  const vs = Array.isArray(p.variants) ? p.variants : [];
  const precios = vs.map(v => numero(v.price)).filter(Boolean);
  const precio = precios.length ? Math.min(...precios) : null;
  const v0 = vs.find(v => numero(v.price) === precio) || vs[0] || {};
  const antes = numero(v0.compare_at_price);
  const opciones = (p.options || [])
    .filter(o => o?.name && !/^title$/i.test(o.name) && Array.isArray(o.values) && !(o.values.length === 1 && /^default title$/i.test(o.values[0])))
    .map(o => `${o.name}: ${o.values.join(", ")}`);
  return {
    nombre: String(p.title).slice(0, 200),
    descripcion: htmlATexto(p.body_html).slice(0, 4000),
    precio, precioAntes: antes && precio && antes > precio ? antes : null,
    moneda: "",
    variantes: opciones.join("; ").slice(0, 500),
    imagenes: unicos((p.images || []).map(i => absoluta(i?.src, url))).slice(0, 12)
  };
}

const handleShopify = (u) => (u.pathname.match(/\/products\/([^/?#.]+)/) || [])[1] || null;

// Todo el proceso (fetchFn se cambia en las pruebas)
export async function importarDesdeUrl(texto, { fetchFn = fetch, conImagenes = true } = {}) {
  const url = validarUrl(texto);
  let ficha = null;
  let origen = "pagina";

  const handle = handleShopify(url);
  if (handle) {
    try {
      const r = await descargar(new URL(`/products/${handle}.json`, url), { fetchFn, max: MAX_HTML, acepta: "application/json" });
      ficha = fichaDeShopify(JSON.parse(r.cuerpo.toString("utf8")), r.url);
      if (ficha) origen = "shopify";
    } catch { /* no es Shopify o no deja leer el .json: se lee la página */ }
  }
  if (!ficha) {
    const r = await descargar(url, { fetchFn, max: MAX_HTML, acepta: "text/html,application/xhtml+xml" });
    if (r.tipo && !/html|xml|text\/plain/.test(r.tipo)) throw new ErrorImportar("Ese link no es una página de producto");
    ficha = extraerFicha(r.cuerpo.toString("utf8"), r.url);
  }
  if (!ficha.nombre && !ficha.descripcion && !ficha.imagenes.length) {
    throw new ErrorImportar("No encontré datos del producto en esa página. Prueba con el link directo del producto.", 422);
  }

  const fotos = [];
  if (conImagenes) {
    for (const src of ficha.imagenes) {
      if (fotos.length >= MAX_IMAGENES) break;
      try {
        const u = validarUrl(src);
        const r = await descargar(u, { fetchFn, max: MAX_IMAGEN, acepta: "image/jpeg,image/png,image/webp" });
        const tipo = r.tipo.split(";")[0].trim();
        if (!TIPOS_IMAGEN.includes(tipo) || r.cuerpo.length < 200) continue;
        fotos.push(`data:${tipo};base64,${r.cuerpo.toString("base64")}`);
      } catch { /* una foto que falla no detiene la importación */ }
    }
  }
  const { imagenes, ...resto } = ficha;
  return { ...resto, origen, url: url.href, fotos, fotosEncontradas: imagenes.length };
}

export function registrarRutasImportar(app, { limiter } = {}) {
  const mw = limiter ? [limiter] : [];
  app.post("/api/importar-url", ...mw, async (req, res) => {
    try {
      const datos = await importarDesdeUrl(req.body?.url);
      res.json(datos);
    } catch (err) {
      if (err instanceof ErrorImportar) return res.status(err.status).json({ error: err.message });
      console.error("Error importando link:", err);
      res.status(500).json({ error: "No se pudo leer ese link" });
    }
  });
}
