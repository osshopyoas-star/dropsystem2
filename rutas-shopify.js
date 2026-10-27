// =============================================
// 🛍️ SHOPIFY — conexión con tus tiendas (app propia creada en el Dev Dashboard de Shopify)
// Desde 2026 Shopify ya no deja crear "apps personalizadas" con token fijo. Ahora:
//   1. Creas una app en el Dev Dashboard (desde tu tienda) con los permisos de productos y archivos
//   2. La instalas en tu tienda
//   3. Pegas aquí el Client ID y el Client secret
// CoDropX pide un token de 24 h con esos datos (client credentials) y lo renueva solo.
// El secreto y el token se guardan cifrados; nunca se devuelven al navegador.
// =============================================
import mongoose from "mongoose";
import { cifrar, descifrar } from "./rutas-meta.js";
import { VERSION_SECCION, versionDeSeccion } from "./public/js/core/seccion-shopify.js";

export const API_VERSION = () => process.env.SHOPIFY_API_VERSION || "2026-01";
export const PERMISOS = ["write_products", "write_files"];
export const PERMISOS_OPCIONALES = ["read_themes", "write_publications"];     // listar plantillas del tema · poner el producto en el canal Tienda online
const MAX_TIENDAS = 5;

const tiendaSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  shop: { type: String, required: true },          // subdominio: "mitienda" de mitienda.myshopify.com
  nombre: { type: String, default: "" },
  dominio: { type: String, default: "" },          // dominio público (tupaqueteco.com)
  moneda: { type: String, default: "" },
  pais: { type: String, default: "" },             // CO / EC: para sugerirla al publicar
  clientId: { type: String, default: "" },
  secreto: { type: String, default: "" },          // cifrado
  token: { type: String, default: "" },            // cifrado
  expira: { type: Date, default: null },
  permisos: { type: [String], default: [] },
  error: { type: String, default: "" },
  definiciones: { type: mongoose.Schema.Types.Mixed, default: false },  // cuántos metacampos de CoDropX ya se crearon
  plantillas: { type: mongoose.Schema.Types.Mixed, default: {} },   // última plantilla usada: { ban: "cdx-ban", normal: "" }
  creado: { type: Date, default: Date.now },
  actualizado: { type: Date, default: Date.now }
});
tiendaSchema.index({ owner: 1, shop: 1 }, { unique: true });

export const ShopifyTienda = mongoose.model("ShopifyTienda", tiendaSchema);

// ---------- fetch (se cambia en las pruebas) ----------
let http = (...a) => fetch(...a);
export function usarFetch(fn) { http = fn; }

export class ErrorShopify extends Error {
  constructor(mensaje, status = 400) { super(mensaje); this.status = status; }
}

// "https://Mi-Tienda.myshopify.com/admin" → "mi-tienda". Solo dominios myshopify (evita visitar otras direcciones).
export function limpiarShop(texto) {
  let s = String(texto || "").trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const admin = String(texto || "").match(/admin\.shopify\.com\/store\/([a-z0-9][a-z0-9-]*)/i);
  if (admin) s = admin[1].toLowerCase();
  s = s.replace(/\.myshopify\.com$/, "");
  return /^[a-z0-9][a-z0-9-]{0,59}$/.test(s) ? s : null;
}

const vistaTienda = (t) => ({
  _id: String(t._id), shop: t.shop, nombre: t.nombre, dominio: t.dominio, moneda: t.moneda, pais: t.pais || "",
  permisos: t.permisos || [], error: t.error || "", conectada: !!t.token && !t.error,
  faltanPermisos: PERMISOS.filter(p => !(t.permisos || []).includes(p)),
  puedeLeerTema: (t.permisos || []).includes("read_themes") || (t.permisos || []).includes("write_themes"),
  plantillas: t.plantillas || {}
});

// ---------- token (client credentials, 24 h) ----------
async function pedirToken(shop, clientId, secreto) {
  let res;
  try {
    res = await http(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: secreto }).toString()
    });
  } catch {
    throw new ErrorShopify("No se pudo conectar con Shopify. Revisa el nombre de la tienda.", 502);
  }
  const txt = await res.text();
  let j = {};
  try { j = JSON.parse(txt); } catch {}
  if (!res.ok || !j.access_token) {
    if (res.status === 404) throw new ErrorShopify("No existe esa tienda. Usa el nombre de tu-tienda.myshopify.com", 400);
    const e = String(j.error || j.errors || "").toLowerCase();
    if (/invalid_client|unauthorized|client/.test(e) || res.status === 401) throw new ErrorShopify("Shopify rechazó el Client ID o el Client secret. Cópialos de nuevo desde Settings de tu app en el Dev Dashboard.", 400);
    if (/not.*install|shop_not_permitted|organization/.test(e) || res.status === 400 || res.status === 403) {
      throw new ErrorShopify("La app no está instalada en esta tienda o la tienda no es de la misma organización. En el Dev Dashboard: Release de la versión → Install app en tu tienda.", 400);
    }
    throw new ErrorShopify(`Shopify respondió con error ${res.status}`, 502);
  }
  return { token: j.access_token, permisos: String(j.scope || "").split(",").map(x => x.trim()).filter(Boolean), segundos: Number(j.expires_in) || 86399 };
}

async function tokenDe(t, forzar = false) {
  if (!forzar && t.token && t.expira && new Date(t.expira).getTime() > Date.now() + 5 * 60 * 1000) return descifrar(t.token);
  const r = await pedirToken(t.shop, t.clientId, descifrar(t.secreto));
  t.token = cifrar(r.token);
  t.expira = new Date(Date.now() + (r.segundos - 60) * 1000);
  t.permisos = r.permisos;
  t.error = "";
  t.actualizado = new Date();
  if (typeof t.save === "function") await t.save();
  return r.token;
}

// ---------- GraphQL Admin API ----------
export async function gql(t, query, variables = {}, intento = 0) {
  const token = await tokenDe(t, intento > 0);
  let res;
  try {
    res = await http(`https://${t.shop}.myshopify.com/admin/api/${API_VERSION()}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token, Accept: "application/json" },
      body: JSON.stringify({ query, variables })
    });
  } catch {
    throw new ErrorShopify("No se pudo conectar con Shopify", 502);
  }
  if (res.status === 401 && intento === 0) return gql(t, query, variables, 1);     // token vencido: pedir otro
  if (res.status === 429 && intento < 3) { await new Promise(r => setTimeout(r, 1500 * (intento + 1))); return gql(t, query, variables, intento + 1); }
  const txt = await res.text();
  let j = {};
  try { j = JSON.parse(txt); } catch {}
  if (res.status === 403) throw new ErrorShopify(`A la app le faltan permisos. En el Dev Dashboard agrega ${PERMISOS.join(" y ")}, publica una nueva versión y apruébala en la tienda.`, 400);
  if (!res.ok) throw new ErrorShopify(`Shopify respondió con error ${res.status}`, 502);
  if (j.errors?.length) {
    const msg = j.errors.map(e => e.message).join("; ");
    if (/throttled/i.test(msg) && intento < 3) { await new Promise(r => setTimeout(r, 2000)); return gql(t, query, variables, intento + 1); }
    if (/access denied|scope/i.test(msg)) throw new ErrorShopify(`A la app le faltan permisos (${PERMISOS.join(", ")}). Agrégalos en el Dev Dashboard, publica una versión nueva y apruébala.`, 400);
    throw new ErrorShopify(`Shopify: ${msg.slice(0, 300)}`, 502);
  }
  return j.data;
}

const erroresUsuario = (r) => {
  const e = r?.userErrors || [];
  if (e.length) throw new ErrorShopify(`Shopify: ${e.map(x => x.message).join("; ").slice(0, 300)}`, 400);
};

// ---------- Subir una imagen a Archivos de Shopify y devolver su URL del CDN ----------
export async function subirImagen(t, { datos, tipo, nombre }) {
  const ext = tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg";
  const filename = `${String(nombre || "codropx").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "codropx"}.${ext}`;
  const d1 = await gql(t, `mutation($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } }
  }`, { input: [{ filename, mimeType: tipo, httpMethod: "POST", resource: "IMAGE", fileSize: String(datos.length) }] });
  erroresUsuario(d1.stagedUploadsCreate);
  const destino = d1.stagedUploadsCreate.stagedTargets?.[0];
  if (!destino?.url || !/^https:\/\//.test(destino.url)) throw new ErrorShopify("Shopify no dio dónde subir la imagen", 502);

  const form = new FormData();
  for (const p of destino.parameters || []) form.append(p.name, p.value);
  form.append("file", new Blob([datos], { type: tipo }), filename);
  const subida = await http(destino.url, { method: "POST", body: form });
  if (!subida.ok && subida.status !== 201 && subida.status !== 204) throw new ErrorShopify(`No se pudo subir la imagen (${subida.status})`, 502);

  const d2 = await gql(t, `mutation($files: [FileCreateInput!]!) {
    fileCreate(files: $files) { files { id fileStatus ... on MediaImage { image { url } } } userErrors { field message } }
  }`, { files: [{ originalSource: destino.resourceUrl, contentType: "IMAGE", alt: String(nombre || "").slice(0, 120) }] });
  erroresUsuario(d2.fileCreate);
  const archivo = d2.fileCreate.files?.[0];
  if (archivo?.image?.url) return { url: archivo.image.url, id: archivo.id };

  // Shopify procesa la imagen unos segundos antes de dar la URL
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, esperaProceso));
    const d3 = await gql(t, `query($id: ID!) { node(id: $id) { ... on MediaImage { fileStatus image { url } } } }`, { id: archivo.id });
    if (d3.node?.image?.url) return { url: d3.node.image.url, id: archivo.id };
    if (d3.node?.fileStatus === "FAILED") throw new ErrorShopify("Shopify no pudo procesar una imagen", 502);
  }
  throw new ErrorShopify("Shopify tardó demasiado procesando las imágenes. Intenta de nuevo en un minuto.", 504);
}
let esperaProceso = 1500;
export function _esperaProceso(ms) { esperaProceso = ms; }

// ---------- Crear o actualizar el producto (siempre como BORRADOR) ----------
const numeroGid = (gid) => String(gid || "").split("/").pop();

// Metacampos donde viven las imágenes de la landing (los lee la sección "CoDropX landing" del tema)
export const METACAMPOS = [
  { key: "landing", name: "CoDropX · imágenes de la landing", type: "list.file_reference", validations: [{ name: "file_type_options", value: JSON.stringify(["Image"]) }] },
  { key: "secciones", name: "CoDropX · textos de las secciones", type: "json" },
  { key: "formato", name: "CoDropX · formato (ban o normal)", type: "single_line_text_field" },
  { key: "capas", name: "CoDropX · GIF y botones encima", type: "json" }
];

async function asegurarDefiniciones(t) {
  if (Number(t.definiciones) >= METACAMPOS.length || (t.definiciones === true && METACAMPOS.length <= 3)) return;   // los nuevos se crean solos
  for (const m of METACAMPOS) {
    const d = await gql(t, `mutation($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) { createdDefinition { id } userErrors { field message code } }
    }`, { definition: { name: m.name, namespace: "codropx", key: m.key, type: m.type, ownerType: "PRODUCT", ...(m.validations ? { validations: m.validations } : {}) } });
    const errs = (d.metafieldDefinitionCreate?.userErrors || []).filter(e => e.code !== "TAKEN" && !/taken|already|en uso|ya existe/i.test(e.message));
    if (errs.length) throw new ErrorShopify(`Shopify: ${errs.map(e => e.message).join("; ").slice(0, 300)}`, 400);
  }
  t.definiciones = METACAMPOS.length;
  t.markModified?.("definiciones");
  if (typeof t.save === "function") await t.save();
}

// Plantillas de producto del tema publicado (necesita read_themes) y si ya tiene la sección de CoDropX
export async function plantillasTema(t) {
  // Los temas pueden tener cientos de plantillas: se leen todas, de a 250 (antes solo salían las primeras 100)
  const filtro = `filenames: ["templates/product*.json", "templates/product*.liquid", "sections/codropx-landing.liquid"]`;
  const d = await gql(t, `{ themes(first: 1, roles: [MAIN]) { nodes { id name files(${filtro}, first: 250) { nodes { filename } pageInfo { hasNextPage endCursor } } } } }`);
  const tema = d.themes?.nodes?.[0];
  if (!tema) return { tema: null, plantillas: [], seccion: false };
  const archivos = (tema.files?.nodes || []).map(f => f.filename);
  let pagina = tema.files?.pageInfo;
  for (let n = 0; pagina?.hasNextPage && pagina.endCursor && n < 20; n++) {
    const m = await gql(t, `query($id: ID!, $after: String) { theme(id: $id) { files(${filtro}, first: 250, after: $after) { nodes { filename } pageInfo { hasNextPage endCursor } } } }`, { id: tema.id, after: pagina.endCursor });
    archivos.push(...(m.theme?.files?.nodes || []).map(f => f.filename));
    pagina = m.theme?.files?.pageInfo;
  }
  // Versión de la sección instalada (para avisar si hay que pegar la nueva)
  let seccionVersion = null;
  if (archivos.includes("sections/codropx-landing.liquid")) {
    try {
      const v = await gql(t, `query($id: ID!) { theme(id: $id) { files(filenames: ["sections/codropx-landing.liquid"], first: 1) { nodes { body { ... on OnlineStoreThemeFileBodyText { content } } } } } }`, { id: tema.id });
      seccionVersion = versionDeSeccion(v.theme?.files?.nodes?.[0]?.body?.content || "") || 1;
    } catch (e) { console.warn("No se pudo leer la sección del tema:", e.message); }
  }
  const plantillas = archivos
    .map(f => (f.match(/^templates\/product(?:\.([^/]+))?\.(json|liquid)$/) || []))
    .filter(m => m.length)
    .map(m => m[1] || "")
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b)));
  return {
    tema: tema.name, plantillas, seccion: archivos.includes("sections/codropx-landing.liquid"),
    seccionVersion, versionActual: VERSION_SECCION,
    // Editor del tema abierto en las plantillas de producto (para crear una nueva)
    editorUrl: `https://admin.shopify.com/store/${t.shop}/themes/${String(tema.id).split("/").pop()}/editor?template=product`
  };
}

// Pone el producto en el canal "Tienda online". Los productos creados por la API no quedan en ningún canal
// (los que creas a mano en Shopify sí), y sin canal el carrito y el formulario contra entrega (Releasit) fallan.
async function publicarEnTienda(t, productoId) {
  try {
    const d = await gql(t, `query { publications(first: 25) { nodes { id name } } }`);
    const pubs = d.publications?.nodes || [];
    const tienda = pubs.find(p => /online store|tienda online|boutique en ligne|loja online/i.test(p.name || ""));
    if (!tienda) return { ok: false, motivo: "canal" };
    const r = await gql(t, `mutation($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) { userErrors { field message } }
    }`, { id: productoId, input: [{ publicationId: tienda.id }] });
    erroresUsuario(r.publishablePublish);
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: /permis|access|scope|403/i.test(e.message || "") ? "permiso" : "error", error: e.message };
  }
}

export async function guardarProducto(t, { productoId, titulo, html, media, precio, precioAntes, plantilla, metacampos, reemplazarMedia = false, activo = true }) {
  let producto = null;
  if (productoId) {
    const d = await gql(t, `query($id: ID!) { product(id: $id) { id handle status variants(first: 1) { nodes { id } } } }`, { id: productoId });
    producto = d.product || null;
  }
  const nuevo = !producto;
  if (producto) {
    const d = await gql(t, `mutation($product: ProductUpdateInput!) {
      productUpdate(product: $product) { product { id handle status variants(first: 1) { nodes { id } } } userErrors { field message } }
    }`, { product: { id: producto.id, title: titulo, descriptionHtml: html, ...(activo && producto.status !== "ACTIVE" ? { status: "ACTIVE" } : {}), ...(plantilla !== undefined ? { templateSuffix: plantilla || null } : {}) } });
    erroresUsuario(d.productUpdate);
    producto = d.productUpdate.product;
    // Cambiaste las fotos de "Multimedia": se quitan las de antes y se ponen las nuevas
    if (reemplazarMedia && media?.length) {
      const q = await gql(t, `query($id: ID!) { product(id: $id) { media(first: 50) { nodes { id } } } }`, { id: producto.id });
      const viejas = (q.product?.media?.nodes || []).map(m => m.id);
      if (viejas.length) {
        const f = await gql(t, `mutation($files: [FileUpdateInput!]!) { fileUpdate(files: $files) { userErrors { field message } } }`,
          { files: viejas.map(id => ({ id, referencesToRemove: [producto.id] })) });
        erroresUsuario(f.fileUpdate);
      }
      const m = await gql(t, `mutation($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {
        productUpdate(product: $product, media: $media) { product { id } userErrors { field message } }
      }`, { product: { id: producto.id }, media: media.map(src => ({ originalSource: src, mediaContentType: "IMAGE", alt: titulo.slice(0, 120) })) });
      erroresUsuario(m.productUpdate);
    }
  } else {
    const d = await gql(t, `mutation($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) { product { id handle status variants(first: 1) { nodes { id } } } userErrors { field message } }
    }`, {
      product: { title: titulo, descriptionHtml: html, status: activo ? "ACTIVE" : "DRAFT", ...(plantilla ? { templateSuffix: plantilla } : {}) },
      media: media.map(src => ({ originalSource: src, mediaContentType: "IMAGE", alt: titulo.slice(0, 120) }))
    });
    erroresUsuario(d.productCreate);
    producto = d.productCreate.product;
  }
  const variante = producto?.variants?.nodes?.[0]?.id;
  if (variante) {
    // "Cobrar impuestos sobre este producto" siempre desmarcado (contra entrega, precio final)
    // "Seguir vendiendo sin stock": en dropshipping no hay inventario en Shopify; sin esto el carrito dice que no hay unidades
    const v = { id: variante, taxable: false, inventoryPolicy: "CONTINUE", ...(precio ? { price: String(precio), compareAtPrice: precioAntes && precioAntes > precio ? String(precioAntes) : null } : {}) };
    const d = await gql(t, `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { field message } }
    }`, { productId: producto.id, variants: [v] });
    erroresUsuario(d.productVariantsBulkUpdate);
  }
  if (metacampos) {
    await asegurarDefiniciones(t);
    const d = await gql(t, `mutation($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) { metafields { key } userErrors { field message } }
    }`, { metafields: [
      { ownerId: producto.id, namespace: "codropx", key: "landing", type: "list.file_reference", value: JSON.stringify(metacampos.imagenes) },
      { ownerId: producto.id, namespace: "codropx", key: "secciones", type: "json", value: JSON.stringify(metacampos.secciones) },
      { ownerId: producto.id, namespace: "codropx", key: "formato", type: "single_line_text_field", value: metacampos.formato },
      { ownerId: producto.id, namespace: "codropx", key: "capas", type: "json", value: JSON.stringify(metacampos.capas || []) }
    ] });
    erroresUsuario(d.metafieldsSet);
  }
  // Activo → también en el canal Tienda online (si no, Releasit da "Error en el carrito")
  const canal = activo ? await publicarEnTienda(t, producto.id) : { ok: false, motivo: "borrador" };
  return {
    productoId: producto.id,
    handle: producto.handle,
    estado: producto.status,
    canal,
    adminUrl: `https://admin.shopify.com/store/${t.shop}/products/${numeroGid(producto.id)}`,
    nuevo
  };
}

export async function tiendaDe(owner, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return ShopifyTienda.findOne({ _id: id, owner });
}

// ---------- Rutas ----------
export function registrarRutasShopify(app) {
  const fallo = (res, err, que) => {
    if (err instanceof ErrorShopify) return res.status(err.status).json({ error: err.message });
    console.error(`Error Shopify (${que}):`, err);
    res.status(500).json({ error: `No se pudo ${que}` });
  };

  app.get("/api/shopify/tiendas", async (req, res) => {
    try {
      const lista = await ShopifyTienda.find({ owner: req.user.uid }).sort({ creado: 1 }).lean();
      res.json({ tiendas: lista.map(vistaTienda), permisos: PERMISOS, version: API_VERSION() });
    } catch (err) { fallo(res, err, "cargar las tiendas"); }
  });

  // Conectar (o reconectar con datos nuevos) una tienda
  app.post("/api/shopify/tiendas", async (req, res) => {
    try {
      const b = req.body || {};
      const shop = limpiarShop(b.shop);
      const clientId = String(b.clientId || "").trim();
      const secreto = String(b.clientSecret || "").trim();
      if (!shop) return res.status(400).json({ error: "Escribe el nombre de la tienda (lo que va antes de .myshopify.com)" });
      if (!/^[A-Za-z0-9_-]{8,200}$/.test(clientId)) return res.status(400).json({ error: "Client ID inválido" });
      if (secreto.length < 8 || secreto.length > 300 || /\s/.test(secreto)) return res.status(400).json({ error: "Client secret inválido" });

      let t = await ShopifyTienda.findOne({ owner: req.user.uid, shop });
      if (!t) {
        const total = await ShopifyTienda.countDocuments({ owner: req.user.uid });
        if (total >= MAX_TIENDAS) return res.status(400).json({ error: `Máximo ${MAX_TIENDAS} tiendas` });
      }
      const r = await pedirToken(shop, clientId, secreto);      // si falla, no se guarda nada
      const datos = {
        owner: req.user.uid, shop, clientId, secreto: cifrar(secreto), token: cifrar(r.token),
        expira: new Date(Date.now() + (r.segundos - 60) * 1000), permisos: r.permisos, error: "",
        pais: ["CO", "EC"].includes(b.pais) ? b.pais : (t?.pais || ""), actualizado: new Date()
      };
      t = t ? Object.assign(t, datos) : new ShopifyTienda(datos);
      await t.save();

      const d = await gql(t, `{ shop { name currencyCode primaryDomain { host } } }`);
      t.nombre = String(d.shop?.name || shop).slice(0, 120);
      t.moneda = String(d.shop?.currencyCode || "");
      t.dominio = String(d.shop?.primaryDomain?.host || "");
      if (!t.pais) t.pais = t.moneda === "COP" ? "CO" : t.moneda === "USD" ? "EC" : "";
      await t.save();
      res.json({ tienda: vistaTienda(t) });
    } catch (err) { fallo(res, err, "conectar la tienda"); }
  });

  app.put("/api/shopify/tiendas/:id", async (req, res) => {
    try {
      const t = await tiendaDe(req.user.uid, req.params.id);
      if (!t) return res.status(404).json({ error: "Tienda no encontrada" });
      if (req.body?.pais !== undefined) t.pais = ["CO", "EC"].includes(req.body.pais) ? req.body.pais : "";
      await t.save();
      res.json({ tienda: vistaTienda(t) });
    } catch (err) { fallo(res, err, "guardar la tienda"); }
  });

  // Probar la conexión (renueva el token)
  app.post("/api/shopify/tiendas/:id/probar", async (req, res) => {
    const t = await tiendaDe(req.user.uid, req.params.id).catch(() => null);
    if (!t) return res.status(404).json({ error: "Tienda no encontrada" });
    try {
      await tokenDe(t, true);
      const d = await gql(t, `{ shop { name currencyCode primaryDomain { host } } }`);
      t.nombre = String(d.shop?.name || t.nombre); t.moneda = String(d.shop?.currencyCode || t.moneda); t.dominio = String(d.shop?.primaryDomain?.host || t.dominio);
      await t.save();
      res.json({ tienda: vistaTienda(t) });
    } catch (err) {
      if (err instanceof ErrorShopify) { t.error = err.message; await t.save().catch(() => {}); }
      fallo(res, err, "probar la tienda");
    }
  });

  // Plantillas de producto del tema y si la sección de CoDropX ya está instalada
  app.get("/api/shopify/tiendas/:id/plantillas", async (req, res) => {
    try {
      const t = await tiendaDe(req.user.uid, req.params.id);
      if (!t) return res.status(404).json({ error: "Tienda no encontrada" });
      if (!(t.permisos || []).some(p => p === "read_themes" || p === "write_themes")) {
        return res.json({ sinPermiso: true, plantillas: [], seccion: null, tema: null, elegida: t.plantillas || {} });
      }
      const r = await plantillasTema(t);
      res.json({ ...r, elegida: t.plantillas || {} });
    } catch (err) { fallo(res, err, "leer las plantillas del tema"); }
  });

  app.delete("/api/shopify/tiendas/:id", async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "ID inválido" });
      const r = await ShopifyTienda.deleteOne({ _id: req.params.id, owner: req.user.uid });
      res.json({ ok: (r.deletedCount ?? 1) > 0 });
    } catch (err) { fallo(res, err, "quitar la tienda"); }
  });
}
