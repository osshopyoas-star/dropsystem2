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
  revision: { type: mongoose.Schema.Types.Mixed, default: null }, // { ok, problemas: [{ tipo, texto }], textos, fecha } revisión automática de los textos
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

// Ancho y alto leyendo la cabecera del archivo (PNG, JPEG o WebP), sin librerías
export function medidasDeBytes(buf) {
  try {
    if (!buf || buf.length < 30) return null;
    if (buf[0] === 0x89 && buf.slice(1, 4).toString("ascii") === "PNG") return { ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20) };
    if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") {
      const f = buf.slice(12, 16).toString("ascii");
      if (f === "VP8X") return { ancho: 1 + buf.readUIntLE(24, 3), alto: 1 + buf.readUIntLE(27, 3) };
      if (f === "VP8 ") return { ancho: buf.readUInt16LE(26) & 0x3fff, alto: buf.readUInt16LE(28) & 0x3fff };
      if (f === "VP8L") { const b = buf.readUInt32LE(21); return { ancho: (b & 0x3fff) + 1, alto: ((b >> 14) & 0x3fff) + 1 }; }
      return null;
    }
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { alto: buf.readUInt16BE(i + 5), ancho: buf.readUInt16BE(i + 7) };
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch {}
  return null;
}

export const metaImagen = (x) => ({
  _id: String(x._id), rama: x.rama, seccion: x.seccion, origen: x.origen || "subida", capa: !!x.capa, media: !!x.media, revision: x.revision || null, tipo: x.tipo || "", ancho: x.ancho || null, alto: x.alto || null, bytes: x.bytes || 0, creado: x.creado
});
