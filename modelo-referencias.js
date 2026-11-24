// "Mis landings que venden": imágenes de referencia de diseño por receta (las usan Mi plantilla y la generación)
import mongoose from "mongoose";

const referenciaSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  tipo: { type: String, required: true },      // receta a la que corresponde
  activa: { type: Boolean, default: true },
  mime: String,
  datos: Buffer,
  creado: { type: Date, default: Date.now }
});
export const ReferenciaLanding = mongoose.model("ReferenciaLanding", referenciaSchema);

export const MAX_REFERENCIAS_LANDING = 30;
export const AVISO_REFERENCIA = "Imita la composición, la densidad y el acabado de esta referencia, pero NO copies su producto, sus textos, sus logos ni sus colores.";
// Secciones equivalentes (la referencia de "portada" sirve para la de moda y al revés)
const EQUIVALENTES = { oferta: ["oferta", "moda_portada"], moda_portada: ["moda_portada", "oferta"], detalles: ["detalles", "moda_material"], moda_material: ["moda_material", "detalles"], por_que_aqui: ["por_que_aqui", "moda_por_que"], moda_por_que: ["moda_por_que", "por_que_aqui"] };

// La referencia activa más reciente de esa receta (como data URL), o null
export async function referenciaDe(owner, tipo) {
  try {
    const r = await ReferenciaLanding.findOne({ owner, tipo: { $in: EQUIVALENTES[tipo] || [tipo] }, activa: true }).sort({ creado: -1 }).lean();
    return r?.datos ? `data:${r.mime || "image/jpeg"};base64,${Buffer.from(r.datos.buffer || r.datos).toString("base64")}` : null;
  } catch { return null; }
}

