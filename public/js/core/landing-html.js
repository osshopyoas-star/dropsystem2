// =============================================
// 🧱 LANDING HTML — arma la descripción del producto para Shopify
// La usan la vista previa (navegador, con las imágenes guardadas) y la publicación
// (servidor, con las imágenes ya subidas al CDN de Shopify): así lo que ves es lo que se publica.
//   · Ban page: solo las imágenes, una debajo de otra, sin espacios.
//   · Landing normal (híbrida): textos para Shopify + imágenes de las secciones intercaladas.
// =============================================

const esc = (v) => String(v ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const parrafos = (t) => String(t || "").split(/\n{2,}|\n/).map(x => x.trim()).filter(Boolean)
  .map(x => `<p style="margin:0 0 12px">${esc(x)}</p>`).join("");

const img = (src, alt) => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" style="display:block;width:100%;height:auto;margin:0;border:0">`;

// Número de imagen (1, 2, 3…) de cada capa (GIF/botón) dentro de la landing: el mismo en la vista previa y en Shopify
export function numerarCapas(capas = [], secciones = [], imagenesPorSeccion = {}, formato = "ban") {
  const inicio = {};
  let n = 0;
  for (const s of secciones) {
    if (formato === "normal" && s.tipo === "galeria") continue;
    const k = (imagenesPorSeccion[s.id] || []).length;
    inicio[s.id] = { desde: n, total: k };
    n += k;
  }
  return (capas || []).map(c => {
    const i = inicio[c.seccion];
    if (!i || c.imagenN > i.total) return null;
    return { ...c, n: i.desde + c.imagenN };
  }).filter(Boolean);
}

// Capa encima de una imagen (vista previa: el formulario de Releasit se muestra como un recuadro)
function capaHtml(c, sel) {
  const pos = `position:absolute;top:${c.y}%;${c.centrar ? "left:50%;transform:translateX(-50%)" : `left:${c.x}%`};width:${c.ancho}%;`;
  const marca = `data-capa="${esc(c.id || "")}" class="cdx-capa ${sel ? "sel" : ""}"`;
  if (c.tipo === "formulario") return `<div ${marca} style="${pos}line-height:1.3;border:2px dashed #1877f2;background:rgba(255,255,255,.85);border-radius:8px;padding:10px;font:600 11px sans-serif;color:#1d4ed8;text-align:center">Formulario de Releasit</div>`;
  return `<img ${marca} src="${esc(c.src)}" alt="" style="${pos}height:auto;border-radius:${Number(c.redondeo) || 0}px">`;
}

// secciones: [{ id, tipo, titulo }] en orden · imagenes: { [idSeccion]: [src, ...] }
// capas (opcional, solo ban page): [{ n, tipo, src, x, y, ancho, centrar, redondeo }] — ya numeradas
export function construirLanding({ formato = "ban", secciones = [], imagenes = {}, textos = null, nombre = "", capas = null, capaSel = null } = {}) {
  const normal = formato === "normal";
  const faltan = [];
  const bloques = [];      // { seccion, srcs }
  let galeria = [];

  for (const s of secciones) {
    const srcs = (imagenes[s.id] || []).filter(Boolean);
    if (!srcs.length) { faltan.push(s.titulo || s.tipo); continue; }
    if (normal && s.tipo === "galeria") { galeria = galeria.concat(srcs); continue; }
    bloques.push({ seccion: s, srcs });
  }

  const imagenesHtml = (b) => b.srcs.map((src, k) => img(src, `${nombre} - ${b.seccion.titulo || ""}${b.srcs.length > 1 ? ` ${k + 1}` : ""}`.trim())).join("");

  let html;
  if (!normal) {
    if (capas) {
      let n = 0;
      const conCapas = (b) => b.srcs.map((src, k) => {
        n++;
        const encima = capas.filter(c => c.n === n).map(c => capaHtml(c, c.id && c.id === capaSel)).join("");
        return `<div class="cdx-banner" data-n="${n}" style="position:relative;line-height:0">${img(src, `${nombre} - ${b.seccion.titulo || ""}${b.srcs.length > 1 ? ` ${k + 1}` : ""}`.trim())}${encima}</div>`;
      }).join("");
      html = `<div class="cdx-landing cdx-ban" style="max-width:600px;margin:0 auto;line-height:0">${bloques.map(conCapas).join("")}</div>`;
    } else {
      html = `<div class="cdx-landing cdx-ban" style="max-width:600px;margin:0 auto;line-height:0">${bloques.map(imagenesHtml).join("")}</div>`;
    }
    // La primera imagen sirve de foto principal del producto (catálogo, Meta, carrito)
    if (bloques[0]) galeria = [bloques[0].srcs[0]];
  } else {
    const t = textos || {};
    const partes = [];
    if (t.frase_oferta || (t.beneficios || []).length) {
      partes.push(`<div class="cdx-oferta" style="margin:0 0 16px">
${t.frase_oferta ? `<p style="margin:0 0 8px;font-weight:700">${esc(t.frase_oferta)}</p>` : ""}
${(t.beneficios || []).length ? `<ul style="margin:0;padding-left:20px">${t.beneficios.map(b => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
</div>`);
    }
    const textoDescripcion = t.descripcion ? `<div class="cdx-texto" style="margin:16px 0">${parrafos(t.descripcion)}</div>` : "";
    const textoSpecs = (t.especificaciones || []).length
      ? `<div class="cdx-specs" style="margin:16px 0"><p style="margin:0 0 8px;font-weight:700">Especificaciones</p><ul style="margin:0;padding-left:20px">${t.especificaciones.map(e => `<li>${esc(e)}</li>`).join("")}</ul></div>` : "";
    // Descripción después de la primera imagen; especificaciones antes de la última
    bloques.forEach((b, i) => {
      if (i === bloques.length - 1 && bloques.length > 1 && textoSpecs) partes.push(textoSpecs);
      partes.push(`<div class="cdx-img" style="margin:0 0 12px;line-height:0">${imagenesHtml(b)}</div>`);
      if (i === 0 && textoDescripcion) partes.push(textoDescripcion);
    });
    if (!bloques.length) partes.push(textoDescripcion);
    if (bloques.length <= 1 && textoSpecs) partes.push(textoSpecs);
    if (t.envio) partes.push(`<div class="cdx-envio" style="margin:16px 0"><p style="margin:0 0 8px;font-weight:700">Envío</p>${parrafos(t.envio)}</div>`);
    if ((t.preguntas || []).length) {
      partes.push(`<div class="cdx-faq" style="margin:16px 0"><p style="margin:0 0 8px;font-weight:700">Preguntas frecuentes</p>${t.preguntas.filter(q => q.pregunta).map(q => `<details style="margin:0 0 8px"><summary style="cursor:pointer;font-weight:600">${esc(q.pregunta)}</summary><div style="padding:6px 0 0">${parrafos(q.respuesta)}</div></details>`).join("")}</div>`);
    }
    html = `<div class="cdx-landing cdx-normal">${partes.join("\n")}</div>`;
  }

  return { html, galeria, faltan, totalImagenes: bloques.reduce((n, b) => n + b.srcs.length, 0) + (normal ? galeria.length : 0) };
}
