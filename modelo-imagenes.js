// =============================================
// 🖼️ IMÁGENES DE LA LANDING — las que sacas de Gemini, una o varias por sección
// Se guardan aparte del proyecto (cada una pesa cientos de KB).
// =============================================
import mongoose from "mongoose";

const imagenSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  proyecto: { type: mongoose.Schema.Types.ObjectId, ref: "Proyecto", index: true },
  rama: { type: String, default: "A" },
  seccion: { type: String, default: "" },        // id de la sección
  tipo: { type: String, default: "image/jpeg" },
  datos: Buffer,
  bytes: Number,
  ancho: Number,
  alto: Number,
  origen: { type: String, default: "subida" },    // subida (Gemini, a mano) | ia (generada en CoDropX)
  capa: { type: Boolean, default: false },         // GIF o botón que va ENCIMA de una imagen (no es una imagen de la landing)
  media: { type: Boolean, default: false },        // foto del producto para "Multimedia" de Shopify (no va en la landing)
  subidas: { type: mongoose.Schema.Types.Mixed, default: {} },   // { [tiendaId]: url en el CDN de Shopify }
  creado: { type: Date, default: Date.now }
});

export const ImagenLanding = mongoose.model("ImagenLanding", imagenSchema);

export const MAX_IMAGEN_BYTES = 3 * 1024 * 1024;
export const MAX_POR_SECCION = 6;
export const MAX_CAPA_BYTES = 6 * 1024 * 1024;   // GIF animados: no se comprimen (se perdería la animación)
export const MAX_CAPAS = 12;

// Revisa que de verdad sea una imagen (por los primeros bytes, no por lo que diga el texto)
export function leerDataUrl(dataUrl) {
  const m = String(dataUrl || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (buf.length < 100 || buf.length > MAX_IMAGEN_BYTES) return null;
  const tipo = tipoDeBytes(buf);
  if (!tipo) return null;
  return { tipo, datos: buf };
}

// GIF o PNG con transparencia, tal cual (sin comprimir)
export function leerDataUrlCapa(dataUrl) {
  const m = String(dataUrl || "").match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (buf.length < 30 || buf.length > MAX_CAPA_BYTES) return null;
  const tipo = tipoDeBytes(buf, true);
  if (!tipo) return null;
  return { tipo, datos: buf };
}

export function tipoDeBytes(buf, conGif = false) {
  if (conGif && buf && buf.length >= 6 && /^GIF8[79]a$/.test(buf.slice(0, 6).toString("ascii"))) return "image/gif";
  if (!buf || buf.length < 100) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export const metaImagen = (x) => ({
  _id: String(x._id), rama: x.rama, seccion: x.seccion, origen: x.origen || "subida", capa: !!x.capa, media: !!x.media, tipo: x.tipo || "", ancho: x.ancho || null, alto: x.alto || null, bytes: x.bytes || 0, creado: x.creado
});
