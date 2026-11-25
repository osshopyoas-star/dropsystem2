// =============================================
// 📣 ANUNCIOS RÁPIDOS — anuncios de imagen sin crear proyecto (no se guarda nada)
// El navegador manda el producto (nombre, descripción, fotos y datos opcionales) en cada pedido;
// el servidor arma el prompt con la misma receta de Ads estáticos, crea la imagen y la devuelve.
// Solo queda registrado el gasto de IA del mes.
// =============================================
import { promptAd, cierreAd, promptTitularesAds, limpiarTitular, usaNombreProducto, SISTEMA_LANDING } from "./prompts-landing.js";
import { ESTRUCTURAS_AD, FORMATOS_AD, RECETAS_AD } from "./public/js/core/anuncios.js";
import { pedirImagen, armarPrompt, estadoGasto, GastoIA, mesActual, PRECIO_IMAGEN, PRECIO_REFERENCIA, aspectoDe, revisarImagen } from "./rutas-ia-imagenes.js";
import { refAd, AVISO_REF_AD } from "./referencias-anuncios.js";
import { parsearJSON } from "./rutas-proyectos.js";

const FOTO_OK = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const txt = (v, n) => String(v || "").replace(/[<>]/g, "").trim().slice(0, n);

// Producto que manda el navegador → la misma "vista" que usan los prompts de Desarrollo
function vistaDe(b = {}) {
  const fotos = (Array.isArray(b.fotos) ? b.fotos : []).filter(f => typeof f === "string" && f.length < 4500000 && FOTO_OK.test(f)).slice(0, 3);
  const precio = Number(b.precio) || 0, antes = Number(b.precioAntes) || 0;
  const colores = String(b.colores || "").split(",").map(x => txt(x, 30)).filter(Boolean).slice(0, 12);
  const descripcion = txt(b.descripcion, 3000);
  const p = {
    nombre: txt(b.nombre, 120), pais: b.pais === "EC" ? "EC" : "CO", tipo: b.tipo === "moda" ? "moda" : "producto", formato: "ban", plantilla: {},
    ficha: {
      descripcion, precio: precio || null, precioAntes: antes > precio ? antes : null,
      oferta: { tipo: b.oferta === "2x1" ? "2x1" : "descuento" },
      variantesLista: colores.map(nombre => ({ tipo: "color", nombre, hex: "#888888", foto: "" })),
      promesas: { envioGratis: !!b.envioGratis }
    },
    revision: { descripcionFisica: descripcion },
    avatares: [{ id: "A", quien: txt(b.quien, 200) || "personas que compran este tipo de producto en el país", problema: txt(b.problema, 250), palabras: txt(b.problema, 250) }],
    estilo: null, secciones: []
  };
  return { p, fotos };
}
const adDe = (a = {}) => ({
  id: txt(a.id, 20) || "ad", estructura: RECETAS_AD[a.estructura] ? a.estructura : "e1", formato: FORMATOS_AD[a.formato] ? a.formato : "4:5",
  precio: !!a.precio, fecha: /^[a-z_]{0,20}$/.test(String(a.fecha || "")) ? String(a.fecha || "") : "",
  titular: limpiarTitular(a.titular), paleta: Number.isInteger(a.paleta) ? a.paleta : 0, nota: txt(a.nota, 300), prompt: ""
});

export function registrarRutasAnunciosRapidos(app, { llamarIA, limiter }) {
  const mw = limiter ? [limiter] : [];

  // 3 titulares por anuncio, distintos en la tanda
  app.post("/api/anuncios-rapidos/titulares", ...mw, async (req, res) => {
    try {
      const { p } = vistaDe(req.body?.producto);
      if (!p.nombre) return res.status(400).json({ error: "Escribe el nombre del producto" });
      const ads = (Array.isArray(req.body?.ads) ? req.body.ads : []).slice(0, 10).map(adDe);
      if (!ads.length) return res.json({ titulares: {} });
      const j = parsearJSON(await llamarIA({ system: SISTEMA_LANDING, prompt: promptTitularesAds(p, ads) })) || {};
      const vistos = new Set(), out = {};
      for (const it of Array.isArray(j.anuncios) ? j.anuncios : []) {
        const ad = ads.find(a => a.id === String(it?.id)); if (!ad) continue;
        out[ad.id] = (Array.isArray(it.titulares) ? it.titulares : []).map(limpiarTitular).filter(Boolean)
          .filter(t => !usaNombreProducto(t, p.nombre) && !vistos.has(`${t.l1}|${t.l2}`)).slice(0, 3);
        out[ad.id].forEach(t => vistos.add(`${t.l1}|${t.l2}`));
      }
      res.json({ titulares: out });
    } catch (err) {
      console.error("Anuncios rápidos · titulares:", err);
      res.status(err.status || 500).json({ error: err.message || "No se pudieron crear los titulares" });
    }
  });

  // La imagen de un anuncio (no se guarda: vuelve como data URL para descargar)
  app.post("/api/anuncios-rapidos/imagen", ...mw, async (req, res) => {
    try {
      if (!process.env.API_KEY) return res.status(500).json({ error: "Falta la API_KEY de xAI en Render" });
      const { p, fotos } = vistaDe(req.body?.producto);
      if (!p.nombre) return res.status(400).json({ error: "Escribe el nombre del producto" });
      if (!fotos.length) return res.status(400).json({ error: "Sube al menos una foto del producto" });
      const tanda = (Array.isArray(req.body?.ads) ? req.body.ads : []).slice(0, 10).map(adDe);
      const ad = adDe(req.body?.ad);
      if (ad.precio && !p.ficha.precio) ad.precio = false;
      const version = Math.max(0, Number(req.body?.version) || 0);
      ad.paleta = Math.max(0, tanda.findIndex(a => a.id === ad.id)) + version * 5;
      const ref = refAd(ad.estructura, version);
      const estimado = PRECIO_IMAGEN + PRECIO_REFERENCIA * (fotos.length + (ref ? 1 : 0));
      const g = await estadoGasto(req.user.uid);
      if (g.usd + estimado > g.limite + 1e-9) return res.status(400).json({ error: `Llegaste al límite de gasto de este mes ($${g.usd.toFixed(2)} de $${g.limite.toFixed(2)} USD). Súbelo en Desarrollo → Landing si quieres seguir.`, gasto: g });

      const reply = await llamarIA({ system: SISTEMA_LANDING, prompt: promptAd(p, ad, p.avatares[0], ESTRUCTURAS_AD[ad.estructura], FORMATOS_AD[ad.formato], tanda) + (ref ? `\n\nIMAGEN ADJUNTA: un anuncio ganador de otra tienda con esta misma estructura. ${AVISO_REF_AD}` : ""), ...(ref ? { image: ref.dataUrl } : {}) });
      const crudo = String(reply || "").replace(/^```[a-z]*\n?|```$/gim, "").trim();
      if (!crudo) return res.status(502).json({ error: "La IA no devolvió el prompt del anuncio" });
      const prompt = cierreAd(crudo, p, ad, tanda).slice(0, 9000);
      const r = await pedirImagen({
        prompt: armarPrompt({ bloqueEstilo: "", prompt, referencias: fotos.length, fotosConTexto: true, fotosConPersona: true, unidades: p.ficha.oferta.tipo === "2x1" && ad.precio ? 2 : 1, descripcion: p.ficha.descripcion.slice(0, 600) })
          + (ref ? `\n\nREFERENCIA DE DISEÑO: <IMAGE_${fotos.length}> es un anuncio ganador de otra tienda. ${AVISO_REF_AD}` : ""),
        fotos, extra: ref ? [ref.dataUrl] : [], aspecto: aspectoDe(ad.formato)
      });
      await GastoIA.findOneAndUpdate(
        { owner: req.user.uid, mes: mesActual() },
        { $inc: { usd: r.rehechaPorForma ? estimado * 2 + PRECIO_REFERENCIA : estimado, imagenes: 1, ticks: r.ticks }, $set: { actualizado: new Date() }, $setOnInsert: { owner: req.user.uid, mes: mesActual() } },
        { upsert: true }
      );
      const est = ESTRUCTURAS_AD[ad.estructura];
      const revision = await revisarImagen(llamarIA, r, p, { id: `ad-${ad.id}`, tipo: ad.precio ? (p.tipo === "moda" ? "moda_portada" : "oferta") : "ad_sin_precio", titular: ad.titular, sinPrecio: !ad.precio }, prompt, { nombre: `${est.cod} ${est.nombre}`, bloques: est.bloques });
      res.json({ imagen: `data:${r.tipo};base64,${Buffer.from(r.datos).toString("base64")}`, tipo: r.tipo, revision, prompt, gasto: await estadoGasto(req.user.uid) });
    } catch (err) {
      console.error("Anuncios rápidos · imagen:", err);
      res.status(err.status || 500).json({ error: err.message || "No se pudo crear el anuncio" });
    }
  });
}
