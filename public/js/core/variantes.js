// =============================================
// VARIANTES (colores y tallas): lista ordenada de la Ficha.
// Los nombres van tal cual a las imágenes; los colores se reparten entre las secciones
// para que a lo largo de la landing se vean todos.
// =============================================

const HEX = /^#[0-9a-f]{6}$/i;
const FOTO = /^data:image\/(jpeg|png|webp);base64,/;

export function variantesDe(ficha = {}) {
  const lista = (Array.isArray(ficha.variantesLista) ? ficha.variantesLista : []).map(v => ({
    tipo: v?.tipo === "talla" ? "talla" : "color",
    nombre: String(v?.nombre || "").replace(/[<>"]/g, "").trim().slice(0, 30),
    hex: HEX.test(v?.hex || "") && v.hex.toLowerCase() !== "#888888" ? v.hex : "",   // #888888 = gris por defecto (no eligió muestra)
    foto: FOTO.test(v?.foto || "") ? v.foto : "",
    medidas: String(v?.medidas || "").replace(/[<>"]/g, "").trim().slice(0, 80)
  })).filter(v => v.nombre).slice(0, 12);
  return { colores: lista.filter(v => v.tipo === "color"), tallas: lista.filter(v => v.tipo === "talla") };
}

// Texto para el contexto de los prompts (si no hay lista, el texto libre de antes)
export function variantesTexto(ficha = {}) {
  const { colores, tallas } = variantesDe(ficha);
  if (!colores.length && !tallas.length) return String(ficha.variantes || "").trim();
  return [colores.length ? `Colores: ${colores.map(c => c.nombre).join(", ")}` : "", tallas.length ? `Tallas: ${tallas.map(t => t.medidas ? `${t.nombre} (${t.medidas})` : t.nombre).join(", ")}` : ""].filter(Boolean).join(" · ");
}

// Secciones donde el producto no es el protagonista (reseñas, números, preguntas): no cuentan para repartir colores
const SIN_PRODUCTO = new Set(["resenas", "resumen_resenas", "numeros_reales", "preguntas", "moda_chats", "pagas_al_recibir", "confianza"]);
export const PORTADAS_V = new Set(["oferta", "moda_portada"]);
export const SECCION_VARIANTES = new Set(["tamano_variantes", "moda_precio_tallas"]);

// Qué color le toca a esta sección (rota en el orden de la landing). null si no hay colores.
export function colorDeSeccion(ficha, secciones = [], seccion = {}) {
  const { colores } = variantesDe(ficha);
  if (!colores.length || SIN_PRODUCTO.has(seccion.tipo)) return null;
  if (PORTADAS_V.has(seccion.tipo)) return colores[0];
  // La portada ya muestra el primero: las demás secciones arrancan en el segundo color y van rotando
  const elegibles = (secciones || []).filter(s => !SIN_PRODUCTO.has(s.tipo) && !PORTADAS_V.has(s.tipo) && !SECCION_VARIANTES.has(s.tipo));
  const i = elegibles.findIndex(s => s.id === seccion.id);
  return colores[((i < 0 ? 0 : i) + 1) % colores.length];
}

export const avisosVariantes = (ficha) => variantesDe(ficha).colores.filter(c => !c.foto).map(c => `Sin foto del color ${c.nombre}, la IA puede inventar el tono. Sube una foto o se usará la muestra de color.`);
