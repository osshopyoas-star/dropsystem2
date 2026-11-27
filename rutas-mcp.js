// =============================================
// 🔌 CONECTOR MCP DE CODROPX
// Claude (claude.ai, celular o Claude Code) se conecta a https://codropx.com/mcp/<clave>
// y usa estas herramientas para armar landings y creativos como en la app.
// - Claves personales: se crean en Integraciones (solo se guarda su huella, la clave se ve una vez).
// - Cada herramienta llama a la misma API de CoDropX con la clave (mismos límites de gasto de IA).
// =============================================
import crypto from "crypto";
import mongoose from "mongoose";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { RECETAS_AD, FORMATOS_AD, FECHAS_AD, mezclarAds } from "./public/js/core/anuncios.js";

// ---------- Claves ----------
const claveSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  rol: { type: String, default: "user" },
  nombre: { type: String, default: "Claude" },
  huella: { type: String, required: true, unique: true },   // sha256 de la clave
  final: { type: String, default: "" },                     // últimos 4 caracteres, para reconocerla
  creado: { type: Date, default: Date.now },
  ultimoUso: { type: Date, default: null }
});
export const ClaveMCP = mongoose.model("ClaveMCP", claveSchema);
const huellaDe = (clave) => crypto.createHash("sha256").update(String(clave)).digest("hex");

// Sesión a partir de una clave "cdx_…" (null si no sirve)
export async function sesionDeClave(clave) {
  if (!/^cdx_[a-f0-9]{48}$/.test(String(clave || ""))) return null;
  const k = await ClaveMCP.findOneAndUpdate({ huella: huellaDe(clave) }, { $set: { ultimoUso: new Date() } }, { new: true }).lean();
  return k ? { uid: String(k.owner), rol: k.rol || "user", mcp: true } : null;
}
// Middleware para /api: "Authorization: Bearer cdx_…" equivale a la sesión del dueño de la clave
export function authPorClave() {
  return async (req, res, next) => {
    const m = String(req.headers.authorization || "").match(/^Bearer\s+(cdx_[a-f0-9]{48})$/);
    if (!m) return next();
    try {
      const s = await sesionDeClave(m[1]);
      if (!s) return res.status(401).json({ error: "Clave de conexión no válida o borrada" });
      req.user = s;
      req.porClave = true;
    } catch (e) { return res.status(500).json({ error: "No se pudo validar la clave" }); }
    next();
  };
}

export function registrarRutasClavesMCP(app) {
  app.get("/api/mcp/claves", async (req, res) => {
    if (req.porClave) return res.status(403).json({ error: "Las claves se manejan desde CoDropX" });
    const lista = await ClaveMCP.find({ owner: req.user.uid }).sort({ creado: -1 }).lean();
    res.json(lista.map(k => ({ _id: String(k._id), nombre: k.nombre, final: k.final, creado: k.creado, ultimoUso: k.ultimoUso })));
  });
  app.post("/api/mcp/claves", async (req, res) => {
    if (req.porClave) return res.status(403).json({ error: "Las claves se manejan desde CoDropX" });
    if (await ClaveMCP.countDocuments({ owner: req.user.uid }) >= 5) return res.status(400).json({ error: "Máximo 5 claves: borra alguna" });
    const clave = `cdx_${crypto.randomBytes(24).toString("hex")}`;
    const k = await ClaveMCP.create({ owner: req.user.uid, rol: req.user.rol || "user", nombre: String(req.body?.nombre || "Claude").slice(0, 40), huella: huellaDe(clave), final: clave.slice(-4) });
    res.json({ _id: String(k._id), clave, nombre: k.nombre });
  });
  app.delete("/api/mcp/claves/:id", async (req, res) => {
    if (req.porClave) return res.status(403).json({ error: "Las claves se manejan desde CoDropX" });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "ID inválido" });
    await ClaveMCP.deleteOne({ _id: req.params.id, owner: req.user.uid });
    res.json({ ok: true });
  });
}

// ---------- Imágenes para descargar desde Claude (link temporal de 24 h, sin sesión; el id es aleatorio) ----------
const IMGS = new Map();
const guardarImg = (buf, mime) => {
  const id = crypto.randomBytes(16).toString("hex");
  IMGS.set(id, { buf, mime, exp: Date.now() + 24 * 3600 * 1000 });
  if (IMGS.size > 300) { const ahora = Date.now(); for (const [k, v] of IMGS) if (v.exp < ahora || IMGS.size > 300) IMGS.delete(k); }
  return id;
};
const MAX_INLINE = 3;   // imágenes que se muestran dentro del chat; las demás van por link

// ---------- Herramientas ----------
const texto = (t) => ({ content: [{ type: "text", text: typeof t === "string" ? t : JSON.stringify(t, null, 2) }] });
const error = (e) => ({ content: [{ type: "text", text: `Error: ${e.message || e}` }], isError: true });
const corto = (s, n = 400) => { const t = String(s || ""); return t.length > n ? `${t.slice(0, n)}…` : t; };

function servidorMCP(clave, base, publico) {
  // Llamada a la API de CoDropX con la misma clave
  const api = async (metodo, ruta, body) => {
    const r = await fetch(`${base}${ruta}`, { method: metodo, headers: { Authorization: `Bearer ${clave}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const tipo = r.headers.get("content-type") || "";
    if (tipo.startsWith("image/")) {
      if (!r.ok) throw new Error(`No se pudo leer la imagen (${r.status})`);
      return { imagen: Buffer.from(await r.arrayBuffer()).toString("base64"), mime: tipo.split(";")[0] };
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
    return j;
  };
  // Fotos por link → data URL (lo que guarda CoDropX)
  const fotoDeUrl = async (url) => {
    if (/^data:image\/(jpeg|png|webp);base64,/.test(url)) return url;
    if (!/^https?:\/\//i.test(url)) throw new Error(`Link de foto no válido: ${corto(url, 80)}`);
    const r = await fetch(url, { redirect: "follow" });
    const mime = (r.headers.get("content-type") || "").split(";")[0];
    if (!r.ok || !/^image\/(jpeg|png|webp)$/.test(mime)) throw new Error(`No se pudo bajar la foto (${r.status}, ${mime || "sin tipo"}): ${corto(url, 80)}`);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 4 * 1024 * 1024) throw new Error(`La foto pesa más de 4 MB: ${corto(url, 80)}`);
    return `data:${mime};base64,${buf.toString("base64")}`;
  };
  // Bloques para la respuesta: las primeras imágenes dentro del chat y un link de descarga para todas
  const bloquesImagenes = (lista) => {
    const links = lista.map((im, i) => `${i + 1}. ${im.nombre || "Imagen"}: ${publico}/mcp-img/${guardarImg(Buffer.from(im.data, "base64"), im.mime)}`);
    return [
      ...lista.slice(0, MAX_INLINE).map(im => ({ type: "image", data: im.data, mimeType: im.mime })),
      ...(links.length ? [{ type: "text", text: `Descarga (links válidos 24 horas):\n${links.join("\n")}` }] : [])
    ];
  };
  const imagenesInline = async (ids, max = 8, nombres = []) => {
    const lista = [];
    for (const [i, id] of ids.slice(0, max).entries()) {
      try { const im = await api("GET", `/api/imagenes/${id}`); lista.push({ data: im.imagen, mime: im.mime, nombre: nombres[i] }); } catch { /* sigue */ }
    }
    return bloquesImagenes(lista);
  };
  const resumenProyecto = (p) => ({
    id: p._id, nombre: p.nombre, pais: p.pais, formato: p.formato, tipo: p.tipo, fotos: (p.fotos || []).length,
    ficha: { precio: p.ficha?.precio, precioAntes: p.ficha?.precioAntes, oferta: p.ficha?.oferta?.tipo || "descuento", colores: (p.ficha?.variantesLista || []).filter(v => v.tipo !== "talla").map(v => v.nombre), descripcion: corto(p.ficha?.descripcion, 300) },
    revisada: !!p.revision?.descripcionFisica,
    avatares: (p.avatares || []).map(a => ({ id: a.id, quien: a.quien, problema: corto(a.problema, 160) })),
    ramas: Object.fromEntries(Object.entries(p.ramas || {}).map(([av, r]) => [av, {
      estilo: r.estilo?.nombre || null, estilosPropuestos: (r.estilosPropuestos || []).map((e, i) => `${i + 1}. ${e.nombre}: ${corto(e.idea, 120)}`),
      secciones: (r.secciones || []).map(s => ({ id: s.id, tipo: s.tipo, titulo: s.titulo, titular: s.titular ? `${s.titular.l1} / ${s.titular.l2 || ""}` : null, conPrompt: !!s.prompt, hecha: !!s.hecha })),
      textosShopify: r.textos ? { titulo: r.textos.titulo } : null,
      anuncios: (r.ads || []).map(a => ({ id: a.id, estructura: `${RECETAS_AD[a.estructura]?.cod || a.estructura} ${RECETAS_AD[a.estructura]?.nombre || ""}`.trim(), precio: a.precio, titular: a.titular ? `${a.titular.l1} / ${a.titular.l2 || ""}` : null, hecha: !!a.hecha }))
    }]))
  });
  const rama = (id, av) => `/api/proyectos/${id}/rama/${String(av || "A").toUpperCase()}`;
  const avatarArg = z.string().regex(/^[ABab]$/).default("A").describe("Avatar con el que se trabaja: A o B");
  const proyectoArg = z.string().regex(/^[a-f0-9]{24}$/).describe("ID del proyecto (de listar_proyectos o crear_proyecto)");

  const s = new McpServer({ name: "codropx", version: "1.0.0" }, {
    instructions: "CoDropX arma landings (ban page) y anuncios de imagen para dropshipping contra entrega en Colombia y Ecuador. Flujo de una landing: crear_proyecto → revisar_ficha → generar_avatares → proponer_estilos → elegir_estilo → armar_landing → generar_imagenes_landing → textos_shopify → publicar_shopify. Anuncios: crear_anuncios (de un proyecto) o anuncios_rapidos (sin proyecto). Generar imágenes gasta saldo de IA (unos $0,05 USD c/u): di cuántas vas a crear antes. Todo el texto va en español sencillo. Nunca inventes reseñas, precios ni promesas."
  });

  s.tool("listar_proyectos", "Lista los proyectos de Desarrollo (landings) del usuario.", {}, async () => {
    try { const l = await api("GET", "/api/proyectos"); return texto(l.slice(0, 50).map(p => ({ id: p._id, nombre: p.nombre, pais: p.pais, formato: p.formato, paso: p.paso, estilo: p.estilo?.nombre || null, actualizado: p.actualizado }))); } catch (e) { return error(e); }
  });
  s.tool("ver_proyecto", "Muestra el estado de un proyecto: ficha, avatares y, por avatar, estilo, secciones de la landing y anuncios.", { proyecto_id: proyectoArg }, async ({ proyecto_id }) => {
    try { return texto(resumenProyecto(await api("GET", `/api/proyectos/${proyecto_id}`))); } catch (e) { return error(e); }
  });
  s.tool("crear_proyecto", "Crea un proyecto de landing con su ficha y fotos (links públicos de imágenes JPG/PNG/WEBP, máximo 6).", {
    nombre: z.string().min(2).max(120), descripcion: z.string().max(4000).default(""),
    fotos_urls: z.array(z.string()).max(6).default([]).describe("Links públicos de las fotos del producto"),
    precio: z.number().positive().optional(), precio_antes: z.number().positive().optional(),
    oferta: z.enum(["descuento", "2x1"]).default("descuento"), colores: z.array(z.string()).max(12).default([]),
    medidas: z.string().max(120).optional(), envio_gratis: z.boolean().default(false),
    pais: z.enum(["CO", "EC"]).default("CO"), tipo: z.enum(["producto", "moda"]).default("producto"), formato: z.enum(["ban", "normal"]).default("ban")
  }, async (a) => {
    try {
      const fotos = []; for (const u of a.fotos_urls) fotos.push(await fotoDeUrl(u));
      const p = await api("POST", "/api/proyectos", { nombre: a.nombre, pais: a.pais, tipo: a.tipo, formato: a.formato });
      await api("PUT", `/api/proyectos/${p._id}`, { fotos, ficha: {
        descripcion: a.descripcion, precio: a.precio || null, precioAntes: a.precio_antes || null, medidas: a.medidas || "",
        oferta: { tipo: a.oferta }, variantesLista: a.colores.map(c => ({ tipo: "color", nombre: c, hex: "#888888", foto: "" })),
        promesas: { envioGratis: a.envio_gratis }
      } });
      return texto(`Proyecto creado: ${p._id} (${a.nombre}) con ${fotos.length} foto(s). Siguiente: revisar_ficha.`);
    } catch (e) { return error(e); }
  });
  s.tool("agregar_fotos", "Agrega fotos (links públicos) a la ficha de un proyecto.", { proyecto_id: proyectoArg, fotos_urls: z.array(z.string()).min(1).max(6) }, async ({ proyecto_id, fotos_urls }) => {
    try {
      const p = await api("GET", `/api/proyectos/${proyecto_id}`);
      const nuevas = []; for (const u of fotos_urls) nuevas.push(await fotoDeUrl(u));
      const fotos = [...(p.fotos || []), ...nuevas].slice(0, 6);
      await api("PUT", `/api/proyectos/${proyecto_id}`, { fotos });
      return texto(`Listo: el proyecto tiene ${fotos.length} foto(s).`);
    } catch (e) { return error(e); }
  });
  s.tool("revisar_ficha", "La IA mira las fotos y describe el producto (solo el objeto), lo que no tiene y los textos del proveedor que no se deben copiar.", { proyecto_id: proyectoArg }, async ({ proyecto_id }) => {
    try { const { revision } = await api("POST", `/api/proyectos/${proyecto_id}/ia/revisar`); return texto({ descripcion: revision.descripcionFisica, noTiene: revision.noTiene, dudas: revision.dudas, textosEnFotos: revision.textosEnFotos }); } catch (e) { return error(e); }
  });
  s.tool("generar_avatares", "Crea 1 o 2 avatares (quién compra, su problema y sus palabras).", { proyecto_id: proyectoArg, cuantos: z.union([z.literal(1), z.literal(2)]).default(1) }, async ({ proyecto_id, cuantos }) => {
    try { await api("PUT", `/api/proyectos/${proyecto_id}`, { numAvatares: cuantos, paso: 2 }); const { avatares } = await api("POST", `/api/proyectos/${proyecto_id}/ia/avatares`); return texto(avatares.map(a => ({ id: a.id, quien: a.quien, problema: a.problema, frase: a.frase, angulo: a.angulo }))); } catch (e) { return error(e); }
  });
  s.tool("proponer_estilos", "Propone 3 estilos visuales para la landing de un avatar.", { proyecto_id: proyectoArg, avatar: avatarArg }, async ({ proyecto_id, avatar }) => {
    try { const { rama: r } = await api("POST", `${rama(proyecto_id, avatar)}/ia/estilos`); return texto((r.estilosPropuestos || []).map((e, i) => ({ numero: i + 1, nombre: e.nombre, idea: e.idea, colores: [e.fondo, e.color1, e.color2, e.acento].filter(Boolean) }))); } catch (e) { return error(e); }
  });
  s.tool("elegir_estilo", "Elige uno de los estilos propuestos (número 1, 2 o 3).", { proyecto_id: proyectoArg, avatar: avatarArg, numero: z.number().int().min(1).max(6) }, async ({ proyecto_id, avatar, numero }) => {
    try {
      const p = await api("GET", `/api/proyectos/${proyecto_id}`);
      const e = (p.ramas?.[avatar.toUpperCase()]?.estilosPropuestos || [])[numero - 1];
      if (!e) throw new Error("Primero usa proponer_estilos");
      await api("POST", `${rama(proyecto_id, avatar)}/estilo`, { estilo: e });
      return texto(`Estilo elegido: ${e.nombre}. Siguiente: armar_landing.`);
    } catch (e) { return error(e); }
  });
  s.tool("armar_landing", "Propone las secciones de la landing (con Mi plantilla), los titulares y escribe el prompt de cada sección. No crea imágenes.", { proyecto_id: proyectoArg, avatar: avatarArg, rehacer_secciones: z.boolean().default(false) }, async ({ proyecto_id, avatar, rehacer_secciones }) => {
    try {
      let p = await api("GET", `/api/proyectos/${proyecto_id}`);
      let r = p.ramas?.[avatar.toUpperCase()] || {};
      if (!r.estilo) throw new Error("Primero elige un estilo (proponer_estilos y elegir_estilo)");
      if (!(r.secciones || []).length || rehacer_secciones) r = (await api("POST", `${rama(proyecto_id, avatar)}/ia/secciones`)).rama;
      r = (await api("POST", `${rama(proyecto_id, avatar)}/ia/titulares`)).rama;
      const hechas = [];
      for (const sx of r.secciones || []) {
        if (sx.prompt || sx.tipo === "foto_real") continue;
        try { await api("POST", `${rama(proyecto_id, avatar)}/ia/seccion/${sx.id}`); hechas.push(sx.titulo); } catch (e) { hechas.push(`${sx.titulo} (error: ${e.message})`); }
      }
      p = await api("GET", `/api/proyectos/${proyecto_id}`);
      return texto({ prompts_escritos: hechas, secciones: resumenProyecto(p).ramas[avatar.toUpperCase()]?.secciones });
    } catch (e) { return error(e); }
  });
  s.tool("cambiar_titular", "Cambia el titular de una sección de la landing (el prompt se actualiza solo).", { proyecto_id: proyectoArg, avatar: avatarArg, seccion_id: z.string(), linea1: z.string().max(40), linea2: z.string().max(40).default("") }, async ({ proyecto_id, avatar, seccion_id, linea1, linea2 }) => {
    try {
      const p = await api("GET", `/api/proyectos/${proyecto_id}`);
      const secs = (p.ramas?.[avatar.toUpperCase()]?.secciones || []).map(sx => (sx.id === seccion_id ? { ...sx, titular: { l1: linea1.toUpperCase(), l2: linea2.toUpperCase() } } : sx));
      await api("PUT", rama(proyecto_id, avatar), { secciones: secs });
      return texto("Titular cambiado.");
    } catch (e) { return error(e); }
  });
  s.tool("generar_imagenes_landing", "Crea con IA las imágenes de las secciones que aún no tienen (o las secciones indicadas). Gasta saldo de IA (~$0,05 USD c/u). Devuelve las imágenes.", {
    proyecto_id: proyectoArg, avatar: avatarArg, secciones_ids: z.array(z.string()).optional().describe("Solo estas secciones (para rehacer una)"), maximo: z.number().int().min(1).max(12).default(12)
  }, async ({ proyecto_id, avatar, secciones_ids, maximo }) => {
    try {
      const p = await api("GET", `/api/proyectos/${proyecto_id}`);
      const r = p.ramas?.[avatar.toUpperCase()] || {};
      const lista = (r.secciones || []).filter(sx => sx.prompt && sx.tipo !== "foto_real" && (secciones_ids ? secciones_ids.includes(sx.id) : !sx.hecha)).slice(0, maximo);
      if (!lista.length) return texto("No hay secciones con prompt pendientes de imagen. Usa armar_landing o indica secciones_ids para rehacer.");
      const ids = [], notas = [], nombres = [];
      for (const sx of lista) {
        try { const j = await api("POST", `${rama(proyecto_id, avatar)}/ia/imagen/${sx.id}`, {}); ids.push(j.imagen._id); nombres.push(sx.titulo); notas.push(`${sx.titulo}: ${j.revision && !j.revision.ok ? `⚠ ${(j.revision.problemas || []).map(x => x.texto).join("; ")}` : "OK"}`); }
        catch (e) { notas.push(`${sx.titulo}: error ${e.message}`); if (/límite/i.test(e.message)) break; }
      }
      return { content: [{ type: "text", text: notas.join("\n") }, ...(await imagenesInline(ids, 12, nombres))] };
    } catch (e) { return error(e); }
  });
  s.tool("ver_imagenes", "Muestra las imágenes ya creadas de un proyecto (de la landing o de un anuncio).", { proyecto_id: proyectoArg, avatar: avatarArg, seccion_o_anuncio_id: z.string().optional(), maximo: z.number().int().min(1).max(10).default(6) }, async ({ proyecto_id, avatar, seccion_o_anuncio_id, maximo }) => {
    try {
      const l = await api("GET", `/api/proyectos/${proyecto_id}/imagenes`);
      const ids = l.filter(i => i.rama === avatar.toUpperCase() && !i.capa && (!seccion_o_anuncio_id || i.seccion === seccion_o_anuncio_id || i.seccion === `ad-${seccion_o_anuncio_id}`)).reverse().map(i => i._id);
      if (!ids.length) return texto("No hay imágenes todavía.");
      return { content: [{ type: "text", text: `${ids.length} imagen(es); muestro ${Math.min(ids.length, maximo)}.` }, ...(await imagenesInline(ids, maximo))] };
    } catch (e) { return error(e); }
  });
  s.tool("textos_shopify", "Escribe el nombre del producto para Shopify, frase de oferta, beneficios, descripción, envío y preguntas frecuentes.", { proyecto_id: proyectoArg, avatar: avatarArg }, async ({ proyecto_id, avatar }) => {
    try { const { rama: r } = await api("POST", `${rama(proyecto_id, avatar)}/ia/textos`); return texto(r.textos); } catch (e) { return error(e); }
  });
  s.tool("crear_anuncios", "Crea anuncios de imagen para un proyecto con las 18 estructuras ganadoras (mezcla automática, titular por anuncio, colores distintos). Gasta ~$0,06 USD por anuncio. Devuelve las imágenes.", {
    proyecto_id: proyectoArg, avatar: avatarArg, cantidad: z.number().int().min(1).max(8).default(5),
    con_precio: z.enum(["0", "1", "2", "mitad"]).default("1"), fecha: z.enum(Object.keys(FECHAS_AD).filter(Boolean)).optional(),
    formato: z.enum(Object.keys(FORMATOS_AD)).default("4:5"),
    estructuras: z.array(z.string()).optional().describe("Opcional: códigos E1…E18 para elegirlas a mano")
  }, async (a) => {
    try {
      const p = await api("GET", `/api/proyectos/${proyecto_id(a)}`);
      const av = a.avatar.toUpperCase();
      const r = p.ramas?.[av] || {};
      const hayPaquetes = p.ficha?.oferta?.tipo === "paquetes";
      let plan;
      if (a.estructuras?.length) {
        const claves = a.estructuras.map(c => String(c).toLowerCase().replace(/^e?/, "e")).filter(k => RECETAS_AD[k]).slice(0, 8);
        plan = claves.map((k, i) => ({ estructura: k, precio: ["si", "protagonista"].includes(RECETAS_AD[k].precio) }));
      } else plan = mezclarAds({ n: a.cantidad, conPrecio: p.ficha?.precio ? a.con_precio : 0, fecha: a.fecha || "", hayDolor: !!p.avatares?.find(x => x.id === av)?.problema, hayPaquetes });
      const nuevos = plan.map(x => ({ id: crypto.randomBytes(4).toString("hex"), estructura: x.estructura, formato: a.formato, precio: x.precio && !!p.ficha?.precio, fecha: x.estructura === "e12" ? (a.fecha || "") : "", nota: "", prompt: "", hecha: false }));
      const todos = [...(r.ads || []), ...nuevos].slice(-12);
      await api("PUT", rama(proyecto_id(a), av), { ads: todos });
      await api("POST", `${rama(proyecto_id(a), av)}/ia/ads-titulares`, { ids: nuevos.map(x => x.id) }).catch(() => null);
      const ids = [], notas = [], nombres = [];
      for (const ad of nuevos) {
        const nombre = `${RECETAS_AD[ad.estructura].cod} ${RECETAS_AD[ad.estructura].nombre}${ad.precio ? " (con precio)" : ""}`;
        try { const j = await api("POST", `${rama(proyecto_id(a), av)}/ia/ad/${ad.id}/imagen`, {}); ids.push(j.imagen._id); nombres.push(nombre); notas.push(`${nombre}: ${j.revision && !j.revision.ok ? `⚠ ${(j.revision.problemas || []).map(x => x.texto).join("; ")}` : "OK"}`); }
        catch (e) { notas.push(`${nombre}: error ${e.message}`); if (/límite/i.test(e.message)) break; }
      }
      return { content: [{ type: "text", text: notas.join("\n") }, ...(await imagenesInline(ids, 8, nombres))] };
    } catch (e) { return error(e); }
  });
  s.tool("anuncios_rapidos", "Crea anuncios de imagen SIN crear proyecto (productos que salen directo a testear). No se guarda nada: las imágenes vuelven aquí. Gasta ~$0,06 USD por anuncio.", {
    nombre: z.string().min(2).max(120), descripcion: z.string().max(3000).default(""), fotos_urls: z.array(z.string()).min(1).max(3),
    precio: z.number().positive().optional(), precio_antes: z.number().positive().optional(), oferta: z.enum(["descuento", "2x1"]).default("descuento"),
    colores: z.array(z.string()).max(12).default([]), quien_compra: z.string().max(200).default(""), problema: z.string().max(250).default(""),
    envio_gratis: z.boolean().default(false), pais: z.enum(["CO", "EC"]).default("CO"),
    cantidad: z.number().int().min(1).max(6).default(4), con_precio: z.enum(["0", "1", "2", "mitad"]).default("1"),
    formato: z.enum(Object.keys(FORMATOS_AD)).default("4:5"), fecha: z.enum(Object.keys(FECHAS_AD).filter(Boolean)).optional()
  }, async (a) => {
    try {
      const fotos = []; for (const u of a.fotos_urls) fotos.push(await fotoDeUrl(u));
      const producto = { nombre: a.nombre, descripcion: a.descripcion, fotos, precio: a.precio, precioAntes: a.precio_antes, oferta: a.oferta, colores: a.colores.join(", "), quien: a.quien_compra, problema: a.problema, envioGratis: a.envio_gratis, pais: a.pais };
      const plan = mezclarAds({ n: a.cantidad, conPrecio: a.precio ? a.con_precio : 0, fecha: a.fecha || "", hayDolor: !!a.problema, hayPaquetes: false });
      const ads = plan.map(x => ({ id: crypto.randomBytes(4).toString("hex"), estructura: x.estructura, precio: x.precio && !!a.precio, fecha: x.estructura === "e12" ? (a.fecha || "") : "", formato: a.formato }));
      const { titulares } = await api("POST", "/api/anuncios-rapidos/titulares", { producto: { ...producto, fotos: [] }, ads }).catch(() => ({ titulares: {} }));
      const imgs = [], notas = [];
      for (const ad of ads) {
        const nombre = `${RECETAS_AD[ad.estructura].cod} ${RECETAS_AD[ad.estructura].nombre}${ad.precio ? " (con precio)" : ""}`;
        try {
          const j = await api("POST", "/api/anuncios-rapidos/imagen", { producto, ads, ad: { ...ad, titular: (titulares[ad.id] || [])[0] } });
          const m = String(j.imagen || "").match(/^data:([^;]+);base64,(.+)$/);
          if (m) imgs.push({ data: m[2], mime: m[1], nombre });
          notas.push(`${nombre}: ${j.revision && !j.revision.ok ? `⚠ ${(j.revision.problemas || []).map(x => x.texto).join("; ")}` : "OK"}`);
        } catch (e) { notas.push(`${nombre}: error ${e.message}`); if (/límite/i.test(e.message)) break; }
      }
      return { content: [{ type: "text", text: `${notas.join("\n")}\n(No se guardan en CoDropX: descárgalas de los links.)` }, ...bloquesImagenes(imgs)] };
    } catch (e) { return error(e); }
  });
  s.tool("listar_tiendas", "Lista las tiendas de Shopify conectadas en CoDropX.", {}, async () => {
    try { const l = await api("GET", "/api/shopify/tiendas"); return texto((Array.isArray(l) ? l : l.tiendas || []).map(t => ({ id: t._id, nombre: t.nombre || t.shop, moneda: t.moneda }))); } catch (e) { return error(e); }
  });
  s.tool("publicar_shopify", "Publica la landing de un avatar en una tienda de Shopify (por defecto como BORRADOR, para revisarla antes).", { proyecto_id: proyectoArg, avatar: avatarArg, tienda_id: z.string(), borrador: z.boolean().default(true) }, async ({ proyecto_id, avatar, tienda_id, borrador }) => {
    try { const j = await api("POST", `${rama(proyecto_id, avatar)}/publicar`, { tiendaId: tienda_id, estado: borrador ? "borrador" : "activo" }); return texto({ estado: borrador ? "borrador" : "activo", ...(j.publicacion || j) }); } catch (e) { return error(e); }
  });
  s.tool("gasto_ia", "Cuánto se ha gastado este mes en imágenes con IA y cuánto queda del límite.", {}, async () => {
    try { const g = await api("GET", "/api/ia/gasto"); return texto({ gastado_usd: g.usd, limite_usd: g.limite, queda_usd: g.queda, imagenes: g.imagenes }); } catch (e) { return error(e); }
  });
  return s;
}
const proyecto_id = (a) => a.proyecto_id;

// ---------- Endpoint MCP (Streamable HTTP, sin estado) ----------
export function registrarMCP(app, { puerto }) {
  const base = `http://127.0.0.1:${puerto}`;
  const manejar = async (req, res, clave) => {
    try {
      if (!(await sesionDeClave(clave))) return res.status(401).json({ jsonrpc: "2.0", error: { code: -32001, message: "Clave de CoDropX no válida. Crea una en Integraciones → Conector para Claude." }, id: null });
      const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
      const server = servidorMCP(clave, base, `${proto}://${req.get("host")}`);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on("close", () => { transport.close(); server.close(); });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("Error MCP:", err);
      if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Error interno" }, id: null });
    }
  };
  app.get("/mcp-img/:id", (req, res) => {
    const x = IMGS.get(String(req.params.id));
    if (!x || x.exp < Date.now()) return res.status(404).send("Este link ya venció. Pídele a Claude que te muestre la imagen otra vez.");
    res.set({ "Content-Type": x.mime, "Content-Disposition": `inline; filename="codropx-${req.params.id.slice(0, 6)}.${x.mime.split("/")[1] || "jpg"}"`, "Cache-Control": "private, max-age=86400" }).send(x.buf);
  });
  const claveDe = (req) => req.params.clave || String(req.headers.authorization || "").replace(/^Bearer\s+/, "");
  app.post(["/mcp", "/mcp/:clave"], (req, res) => manejar(req, res, claveDe(req)));
  app.get(["/mcp", "/mcp/:clave"], (req, res) => res.status(405).set("Allow", "POST").json({ jsonrpc: "2.0", error: { code: -32000, message: "Usa POST" }, id: null }));
  app.delete(["/mcp", "/mcp/:clave"], (req, res) => res.status(405).set("Allow", "POST").end());
}
