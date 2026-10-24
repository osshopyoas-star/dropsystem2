// =============================================
// 🚀 IMÁGENES DE LA LANDING + PUBLICAR EN SHOPIFY
//   · Subes la imagen que sacaste de Gemini a cada sección
//   · Vista previa en el celular (en el navegador, con landing-html.js)
//   · Publicar: sube las imágenes a Archivos de Shopify y crea el producto como BORRADOR
//     (tú lo revisas, le pones botones/GIF y lo activas)
// =============================================
import mongoose from "mongoose";
import { ImagenLanding, leerDataUrl, leerDataUrlCapa, metaImagen, MAX_POR_SECCION, MAX_CAPAS } from "./modelo-imagenes.js";
import { construirLanding, numerarCapas } from "./public/js/core/landing-html.js";
import { tiendaDe, subirImagen, guardarProducto, ErrorShopify } from "./rutas-shopify.js";

const MONEDA_PAIS = { CO: "COP", EC: "USD" };

// "TEXTO PARA SHOPIFY / Título: "..." / Texto: "..."" que viene al final del prompt de cada sección (landing normal)
export function textoShopify(prompt) {
  const s = String(prompt || "");
  const i = s.search(/TEXTO PARA SHOPIFY/i);
  if (i === -1) return { titulo: "", texto: "" };
  const parte = s.slice(i);
  const saca = (re) => ((parte.match(re) || [])[1] || "").trim().replace(/^["“]|["”]$/g, "").trim();
  return { titulo: saca(/T[íi]tulo:\s*(.+)/i).slice(0, 120), texto: saca(/Texto:\s*([\s\S]+?)(?:\n\s*\n|$)/i).slice(0, 600) };
}
// ---------- Capas: GIF y botones encima de las imágenes (por producto) ----------
const TIPOS_CAPA = ["gif", "boton", "formulario"];
const num = (v, min, max, def) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
export function limpiarCapa(c = {}, previa = {}) {
  const tipo = TIPOS_CAPA.includes(c.tipo) ? c.tipo : (previa.tipo || "gif");
  return {
    id: previa.id || String(c.id || Math.random().toString(36).slice(2, 10)).slice(0, 20),
    tipo,
    imagenId: previa.imagenId ?? (c.imagenId ? String(c.imagenId) : null),
    seccion: String(c.seccion ?? previa.seccion ?? "").slice(0, 40),
    imagenN: Math.round(num(c.imagenN ?? previa.imagenN, 1, 6, 1)),
    x: num(c.x ?? previa.x, 0, 100, 0),
    y: num(c.y ?? previa.y, 0, 100, tipo === "boton" ? 82 : 50),
    ancho: num(c.ancho ?? previa.ancho, 5, 100, tipo === "gif" ? 40 : 80),
    centrar: c.centrar !== undefined ? !!c.centrar : (previa.centrar ?? true),
    redondeo: Math.round(num(c.redondeo ?? previa.redondeo, 0, 50, 0))
  };
}

const subidaDe = (v) => (v && typeof v === "object" && v.id && v.url ? v : null);   // las viejas solo tenían la URL
const publicando = new Set();

export function registrarRutasPublicar(app, { cargar, cargarRama, guardarRama, actualizarRama, limiter }) {
  const mw = limiter ? [limiter] : [];
  const idOk = (id) => mongoose.Types.ObjectId.isValid(id);

  // Lista de imágenes del proyecto (solo datos, sin la imagen)
  app.get("/api/proyectos/:id/imagenes", async (req, res) => {
    try {
      const p = await cargar(req, res); if (!p) return;
      const lista = await ImagenLanding.find({ owner: req.user.uid, proyecto: p._id })
        .select("rama seccion ancho alto bytes origen creado").sort({ creado: 1 }).lean();
      res.json(lista.map(metaImagen));
    } catch (err) {
      console.error("Error listando imágenes:", err);
      res.status(500).json({ error: "No se pudieron cargar las imágenes" });
    }
  });

  // La imagen en sí (solo para su dueño)
  app.get("/api/imagenes/:id", async (req, res) => {
    try {
      if (!idOk(req.params.id)) return res.status(400).end();
      const x = await ImagenLanding.findOne({ _id: req.params.id, owner: req.user.uid }).select("tipo datos").lean();
      if (!x?.datos) return res.status(404).end();
      const buf = Buffer.isBuffer(x.datos) ? x.datos : Buffer.from(x.datos.buffer || x.datos);
      res.set({ "Content-Type": x.tipo, "Cache-Control": "private, max-age=604800, immutable", "X-Content-Type-Options": "nosniff" });
      res.send(buf);
    } catch (err) {
      console.error("Error leyendo imagen:", err);
      res.status(500).end();
    }
  });

  // Subir una imagen a una sección (marca la sección como hecha)
  app.post("/api/proyectos/:id/rama/:av/imagenes", async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const seccion = String(req.body?.seccion || "");
      const idx = (x.r.secciones || []).findIndex(s => s.id === seccion);
      if (idx === -1) return res.status(404).json({ error: "Sección no encontrada" });
      const img = leerDataUrl(req.body?.dataUrl);
      if (!img) return res.status(400).json({ error: "La imagen no es válida (JPG, PNG o WEBP de máximo 3 MB)" });
      const ya = await ImagenLanding.countDocuments({ owner: req.user.uid, proyecto: x.p._id, rama: x.av, seccion });
      if (ya >= MAX_POR_SECCION) return res.status(400).json({ error: `Máximo ${MAX_POR_SECCION} imágenes por sección` });
      const medida = (v) => { const n = Math.round(Number(v)); return n > 0 && n < 20000 ? n : null; };
      const nueva = await ImagenLanding.create({
        owner: req.user.uid, proyecto: x.p._id, rama: x.av, seccion,
        tipo: img.tipo, datos: img.datos, bytes: img.datos.length,
        ancho: medida(req.body?.ancho), alto: medida(req.body?.alto)
      });
      const rama = (await actualizarRama(x.p, x.av, (actual) => ({
        ...actual, secciones: (actual.secciones || []).map(s => s.id === seccion ? { ...s, hecha: true } : s)
      }))) || x.r;
      res.json({ imagen: metaImagen(nueva), rama });
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      res.status(500).json({ error: "No se pudo guardar la imagen" });
    }
  });

  app.delete("/api/imagenes/:id", async (req, res) => {
    try {
      if (!idOk(req.params.id)) return res.status(400).json({ error: "ID inválido" });
      const r = await ImagenLanding.deleteOne({ _id: req.params.id, owner: req.user.uid });
      res.json({ ok: (r.deletedCount ?? 1) > 0 });
    } catch (err) {
      console.error("Error borrando imagen:", err);
      res.status(500).json({ error: "No se pudo quitar la imagen" });
    }
  });

  // Agregar una capa (GIF o botón con su imagen, o el formulario de Releasit sin imagen)
  app.post("/api/proyectos/:id/rama/:av/capas", async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const tipo = TIPOS_CAPA.includes(req.body?.tipo) ? req.body.tipo : "gif";
      if ((x.r.capas || []).length >= MAX_CAPAS) return res.status(400).json({ error: `Máximo ${MAX_CAPAS} GIF o botones por landing` });
      const secciones = x.r.secciones || [];
      const seccion = secciones.some(s => s.id === req.body?.seccion) ? req.body.seccion : (secciones[0]?.id || "");
      let imagen = null;
      if (tipo !== "formulario") {
        const img = leerDataUrlCapa(req.body?.dataUrl);
        if (!img) return res.status(400).json({ error: "Sube un GIF, PNG, JPG o WEBP de máximo 6 MB" });
        const medida = (v) => { const n = Math.round(Number(v)); return n > 0 && n < 20000 ? n : null; };
        imagen = await ImagenLanding.create({
          owner: req.user.uid, proyecto: x.p._id, rama: x.av, seccion: "", capa: true,
          tipo: img.tipo, datos: img.datos, bytes: img.datos.length, ancho: medida(req.body?.ancho), alto: medida(req.body?.alto)
        });
      }
      const capa = limpiarCapa({ tipo, seccion, imagenId: imagen ? String(imagen._id) : null, ...(req.body?.pos || {}) });
      const rama = (await actualizarRama(x.p, x.av, (a) => ({ ...a, capas: [...(a.capas || []), capa] }))) || x.r;
      res.json({ capa, imagen: imagen ? metaImagen(imagen) : null, rama });
    } catch (err) {
      console.error("Error agregando capa:", err);
      res.status(500).json({ error: "No se pudo guardar" });
    }
  });

  // Mover / cambiar una capa (posición, tamaño, en qué imagen va)
  app.put("/api/proyectos/:id/rama/:av/capas/:capaId", async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      let encontrada = null;
      const rama = await actualizarRama(x.p, x.av, (a) => {
        const capas = (a.capas || []).map(c => {
          if (c.id !== req.params.capaId) return c;
          const cambios = { ...req.body };
          if (c.tipo === "formulario" || cambios.tipo === "formulario") delete cambios.tipo;   // el formulario no tiene imagen
          encontrada = limpiarCapa(cambios, c);
          return encontrada;
        });
        return { ...a, capas };
      });
      if (!encontrada) return res.status(404).json({ error: "No encontramos ese GIF o botón" });
      res.json({ capa: encontrada, rama });
    } catch (err) {
      console.error("Error moviendo capa:", err);
      res.status(500).json({ error: "No se pudo guardar" });
    }
  });

  app.delete("/api/proyectos/:id/rama/:av/capas/:capaId", async (req, res) => {
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const capa = (x.r.capas || []).find(c => c.id === req.params.capaId);
      if (!capa) return res.status(404).json({ error: "No encontramos ese GIF o botón" });
      if (capa.imagenId && idOk(capa.imagenId)) await ImagenLanding.deleteOne({ _id: capa.imagenId, owner: req.user.uid });
      const rama = await actualizarRama(x.p, x.av, (a) => ({ ...a, capas: (a.capas || []).filter(c => c.id !== req.params.capaId) }));
      res.json({ ok: true, rama });
    } catch (err) {
      console.error("Error quitando capa:", err);
      res.status(500).json({ error: "No se pudo quitar" });
    }
  });

  // Publicar la landing de este avatar en una tienda (crea o actualiza el BORRADOR)
  app.post("/api/proyectos/:id/rama/:av/publicar", ...mw, async (req, res) => {
    let llave = null;
    try {
      const x = await cargarRama(req, res); if (!x) return;
      const t = await tiendaDe(req.user.uid, req.body?.tiendaId);
      if (!t) return res.status(404).json({ error: "Elige una tienda conectada" });
      if (!t.token) return res.status(400).json({ error: "Esa tienda no está conectada. Revísala en Integraciones." });

      const esperada = MONEDA_PAIS[x.p.pais];
      if (t.moneda && esperada && t.moneda !== esperada) {
        return res.status(400).json({ error: `La tienda "${t.nombre || t.shop}" cobra en ${t.moneda} y este proyecto es de ${x.p.pais === "EC" ? "Ecuador (USD)" : "Colombia (COP)"}. Elige otra tienda o cambia el país del proyecto.` });
      }

      const clave = `${x.p._id}:${x.av}`;
      if (publicando.has(clave)) return res.status(409).json({ error: "Ya se está publicando esta landing, espera un momento" });
      publicando.add(clave);
      llave = clave;

      const secciones = x.r.secciones || [];
      const ids = new Set(secciones.map(s => s.id));
      const todas = await ImagenLanding.find({ owner: req.user.uid, proyecto: x.p._id, rama: x.av }).sort({ creado: 1 });
      const imgs = todas.filter(i => !i.capa && ids.has(i.seccion));
      const capasRama = x.r.capas || [];
      const idsCapas = new Set(capasRama.map(c => c.imagenId).filter(Boolean));
      const imgsCapas = todas.filter(i => i.capa && idsCapas.has(String(i._id)));
      if (!imgs.length) return res.status(400).json({ error: "Sube al menos una imagen en el paso Landing" });

      const titulo = String(req.body?.titulo || x.r.textos?.titulo || x.p.nombre || "Producto").trim().slice(0, 255);
      const tid = String(t._id);

      // Subir a Shopify las que no se han subido a esta tienda (de a 3)
      const urls = new Map();
      const pendientes = [];
      for (const i of [...imgs, ...imgsCapas]) {
        if (subidaDe(i.subidas?.[tid])) urls.set(String(i._id), subidaDe(i.subidas[tid]));
        else pendientes.push(i);
      }
      let k = 0;
      const trabajador = async () => {
        while (k < pendientes.length) {
          const i = pendientes[k++];
          const s = secciones.find(z => z.id === i.seccion);
          const subida = await subirImagen(t, { datos: i.datos, tipo: i.tipo, nombre: `${titulo} ${i.capa ? "GIF" : (s?.titulo || "")}` });
          urls.set(String(i._id), subida);
          await ImagenLanding.updateOne({ _id: i._id }, { $set: { [`subidas.${tid}`]: subida } });
        }
      };
      await Promise.all([trabajador(), trabajador(), trabajador()]);

      const formato = x.p.formato === "normal" ? "normal" : "ban";
      // destino: "tema" = imágenes en la sección "CoDropX landing" de tu plantilla (metacampos) · "descripcion" = dentro de la descripción
      const destino = req.body?.destino === "descripcion" ? "descripcion" : "tema";
      const plantilla = req.body?.plantilla === undefined ? undefined : String(req.body.plantilla || "");
      if (plantilla && !/^[a-z0-9][a-z0-9_-]{0,59}$/i.test(plantilla)) return res.status(400).json({ error: "Nombre de plantilla inválido" });

      const imagenes = {};
      for (const i of imgs) (imagenes[i.seccion] ||= []).push(urls.get(String(i._id)).url);
      const completa = construirLanding({ formato, secciones, imagenes, textos: x.r.textos, nombre: titulo });

      let html = completa.html;
      let media = completa.galeria;
      let metacampos;
      if (destino === "tema") {
        // Orden de la landing (sin la galería en landing normal: esas van como fotos del producto)
        const lista = [];
        const textos = [];
        for (const sec of secciones) {
          if (formato === "normal" && sec.tipo === "galeria") continue;
          const deSeccion = imgs.filter(i => i.seccion === sec.id);
          deSeccion.forEach((i, n) => {
            lista.push(urls.get(String(i._id)).id);
            textos.push(formato === "normal" && n === 0 ? textoShopify(sec.prompt) : { titulo: "", texto: "" });
          });
        }
        // GIF y botones de este producto, con el número de imagen donde van
        const porSeccion = {};
        for (const i of imgs) (porSeccion[i.seccion] ||= []).push(i);
        const capas = numerarCapas(capasRama, secciones, porSeccion, formato)
          .map(c => ({ n: c.n, tipo: c.tipo, url: c.imagenId ? urls.get(c.imagenId)?.url || "" : "", x: c.x, y: c.y, ancho: c.ancho, centrar: c.centrar, redondeo: c.redondeo }))
          .filter(c => c.tipo === "formulario" || c.url);
        metacampos = { imagenes: lista, secciones: textos, formato, capas };
        // Descripción: en ban page vacía (todo va en el tema); en landing normal solo los textos para Shopify
        html = formato === "normal" ? construirLanding({ formato, secciones: [], imagenes: {}, textos: x.r.textos, nombre: titulo }).html : "";
      }

      const anterior = x.r.publicaciones?.[tid];
      const r = await guardarProducto(t, {
        productoId: anterior?.productoId, titulo, html, media,
        precio: Number(x.p.ficha?.precio) || null, precioAntes: Number(x.p.ficha?.precioAntes) || null,
        plantilla, metacampos
      });
      const landing = completa;
      if (plantilla !== undefined) {
        t.plantillas = { ...(t.plantillas || {}), [formato]: plantilla };
        t.markModified?.("plantillas");
        await t.save().catch(() => {});
      }

      const publicacion = {
        tiendaId: tid, tienda: t.nombre || t.shop, dominio: t.dominio || "", productoId: r.productoId,
        handle: r.handle, adminUrl: r.adminUrl, estado: r.estado, fecha: new Date().toISOString(),
        imagenes: imgs.length, faltan: landing.faltan, destino, plantilla: plantilla ?? anterior?.plantilla ?? ""
      };
      const rama = await actualizarRama(x.p, x.av, (actual) => ({
        ...actual, publicaciones: { ...(actual.publicaciones || {}), [tid]: publicacion }
      }));

      // El producto de la Base queda "Listo para testear" en Mis testeos (si aún no estaba en testeo)
      let listo = false;
      if (x.p.productoId) {
        try {
          const Producto = mongoose.model("Producto");
          const u = await Producto.updateOne(
            { _id: x.p.productoId, owner: req.user.uid, $or: [{ resultado: "" }, { resultado: null }, { resultado: { $exists: false } }] },
            { $set: { resultado: "listo", "testeo.inicio": null, "testeo.fin": null } }
          );
          listo = (u.modifiedCount ?? u.nModified ?? 0) > 0;
        } catch (e) { console.error("No se pudo marcar listo para testear:", e.message); }
      }
      res.json({ publicacion, nuevo: r.nuevo, subidas: pendientes.length, rama, listo });
    } catch (err) {
      if (err instanceof ErrorShopify) return res.status(err.status).json({ error: err.message });
      console.error("Error publicando:", err);
      res.status(500).json({ error: "No se pudo publicar en Shopify" });
    } finally {
      if (llave) publicando.delete(llave);
    }
  });
}
