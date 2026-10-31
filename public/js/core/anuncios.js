// =============================================
// 📣 ANUNCIOS — estructuras de ads estáticos y formatos
// Lo usan el servidor (prompts) y el navegador (paso Anuncios).
// Dibujos con el mismo lenguaje que Mi plantilla (lienzo 60 x 90).
// =============================================
const T = (y, w = 36, x = (60 - w) / 2, tono = "d") => ["t", x, y, w, tono];

export const FORMATOS_AD = {
  "1:1": { nombre: "1:1", uso: "Feed", tamano: "1080x1080" },
  "4:5": { nombre: "4:5", uso: "Feed vertical", tamano: "1080x1350" },
  "9:16": { nombre: "9:16", uso: "Story / Reel", tamano: "1080x1920" }
};

export const MAX_ADS = 12;

export const ESTRUCTURAS_AD = {
  informativo: {
    nombre: "Informativo con datos",
    desc: "Pregunta gancho arriba, producto grande y 3 o 4 datos clave en tarjetas o íconos; precio y llamado a la acción abajo.",
    dibujo: [T(6, 44), T(12, 30, 15, "a"), ["r", 14, 18, 32, 34, "g", 4], ["r", 4, 56, 16, 12, "w", 2], ["r", 22, 56, 16, 12, "w", 2], ["r", 40, 56, 16, 12, "w", 2], ["r", 8, 72, 30, 10, "a", 3], ["c", 48, 77, 6, "d"]]
  },
  antes_despues_columnas: {
    nombre: "Antes y después · columnas",
    desc: "Imagen partida en dos columnas: a la izquierda la situación sin el producto (tonos apagados) y a la derecha con el producto (tonos vivos), con rótulos ANTES / DESPUÉS.",
    dibujo: [T(6), ["r", 4, 12, 25, 56, "m", 3], ["r", 31, 12, 25, 56, "g", 3], ["r", 8, 14, 12, 5, "d", 2], ["r", 35, 14, 12, 5, "a", 2], ["r", 10, 72, 40, 10, "a", 3]]
  },
  antes_despues_franjas: {
    nombre: "Antes y después · franjas",
    desc: "ANTES arriba y DESPUÉS abajo en dos franjas horizontales, con una flecha o círculo al medio y el producto entre las dos.",
    dibujo: [T(6), ["r", 0, 12, 60, 30, "m"], ["c", 30, 44, 5, "a"], ["r", 0, 48, 60, 30, "g"], ["r", 14, 80, 32, 7, "a", 3]]
  },
  hero_premium: {
    nombre: "Hero premium",
    desc: "El producto como protagonista sobre fondo limpio y elegante, luz de estudio, titular corto de 2 líneas y sello de precio. Poco texto.",
    dibujo: [["r", 0, 0, 60, 90, "d"], T(10, 40, 10, "w"), T(16, 28, 16, "a"), ["r", 16, 24, 28, 44, "g", 6], ["c", 46, 72, 8, "a"]]
  },
  caracteristicas: {
    nombre: "Características clave",
    desc: "Producto al centro con 4 características señaladas con líneas finas a la parte que explican, cada una con su ícono.",
    dibujo: [T(6), ["r", 20, 16, 20, 52, "g", 4], ["o", 9, 22, 5, "a"], ["o", 9, 50, 5, "a"], ["o", 51, 34, 5, "a"], ["o", 51, 62, 5, "a"], ["x", 14, 22, 22, 26, "m"], ["x", 14, 50, 22, 50, "m"], ["x", 46, 34, 38, 36, "m"], ["x", 46, 62, 38, 60, "m"], ["r", 14, 76, 32, 8, "a", 3]]
  },
  triple_producto: {
    nombre: "Triple producto / pack",
    desc: "Tres unidades del producto juntas (o el pack completo) con el precio por unidad y cuánto ahorra; ideal para ofertas de cantidad.",
    dibujo: [T(6), ["r", 4, 20, 16, 34, "g", 3], ["r", 22, 16, 16, 38, "m", 3], ["r", 40, 20, 16, 34, "g", 3], ["r", 22, 10, 16, 5, "d", 2], ["r", 8, 60, 44, 12, "a", 3], T(78, 30)]
  },
  antes_vs_con: {
    nombre: "Sin vs. con (split)",
    desc: "Imagen partida en diagonal o vertical: 'Sin [producto]' vs 'Con [producto]', la misma escena con el problema y con la solución.",
    dibujo: [T(6), ["r", 4, 12, 52, 58, "g", 3], ["x", 4, 70, 56, 12, "d"], ["r", 6, 14, 14, 5, "d", 2], ["r", 40, 62, 14, 5, "a", 2], ["r", 14, 76, 32, 8, "a", 3]]
  },
  causa_real: {
    nombre: "La verdadera causa",
    desc: "Educa en una imagen: arriba un gancho con las palabras del cliente; al medio 2 o 3 cosas que la gente cree o ya probó, tachadas en rojo ('No es X', 'No es Y'), y resaltada la causa real; abajo el producto como la solución a esa causa y el llamado a la acción. Gráfico simple, nada médico.",
    dibujo: [T(6, 44), ["r", 8, 14, 26, 6, "w", 3], ["x", 8, 17, 34, 17, "a"], ["r", 8, 23, 26, 6, "w", 3], ["x", 8, 26, 34, 26, "a"], ["r", 6, 33, 30, 9, "a", 3], ["r", 38, 14, 18, 40, "g", 4], ["r", 10, 64, 40, 10, "a", 3], T(80, 30)]
  },
  problemas_solucion: {
    nombre: "Tus problemas / nuestra solución",
    desc: "A la izquierda una lista de 3 o 4 problemas con ✗ en rojo; a la derecha el producto con 'Nuestra solución' y el precio.",
    dibujo: [["t", 4, 8, 22, "d"], ["t", 34, 8, 22, "a"], ["c", 8, 22, 2.5, "a"], T(22, 16, 12), ["c", 8, 32, 2.5, "a"], T(32, 16, 12), ["c", 8, 42, 2.5, "a"], T(42, 16, 12), ["r", 32, 16, 24, 50, "g", 4], ["r", 32, 72, 24, 9, "a", 3]]
  },
  anotado: {
    nombre: "Anotado a mano",
    desc: "Foto real del producto con anotaciones tipo marcador: flechas, círculos y frases cortas escritas a mano señalando lo que lo hace especial.",
    dibujo: [["r", 0, 0, 60, 90, "g"], ["r", 14, 20, 32, 46, "m", 4], ["o", 20, 26, 8, "a"], ["x", 28, 26, 44, 14, "a"], ["t", 40, 12, 16, "a"], ["x", 40, 56, 52, 70, "a"], ["t", 36, 74, 20, "a"], T(84, 30)]
  },
  chat_preguntas: {
    nombre: "Chat de preguntas (WhatsApp)",
    desc: "Pantalla tipo chat donde un cliente hace las dudas típicas (¿pago al recibir?, ¿cuánto tarda?) y la tienda responde. Sin elogios ni reseñas inventadas: solo preguntas y respuestas reales del negocio.",
    dibujo: [["r", 0, 0, 60, 90, "g"], ["r", 0, 0, 60, 8, "d"], ["r", 4, 14, 32, 9, "w", 4], ["r", 24, 26, 32, 9, "a", 4], ["r", 4, 38, 32, 9, "w", 4], ["r", 24, 50, 32, 9, "a", 4], ["r", 14, 68, 32, 14, "w", 4]]
  }
};

export const ENFOQUES_COPY = {
  aida: "AIDA",
  pas: "PAS · problema, agitación, solución",
  beneficio: "Beneficio directo",
  prueba_social: "Prueba social / regalo",
  // copys viejos
  problema: "Problema → causa real → solución",
  curiosidad: "Curiosidad / gancho"
};

// Largo como lo cuenta TikTok: cada emoji ocupa 2 caracteres
const esEmoji = (g) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(g);
export function largoTiktok(texto = "") {
  const t = String(texto);
  const partes = typeof Intl !== "undefined" && Intl.Segmenter ? [...new Intl.Segmenter("es", { granularity: "grapheme" }).segment(t)].map(x => x.segment) : [...t];
  return partes.reduce((a, g) => a + (esEmoji(g) ? 2 : 1), 0);
}
// Datos sin confirmar que la IA dejó entre [corchetes] para que los revises
export const corchetes = (texto = "") => String(texto).match(/\[[^\]\n]{1,120}\]/g) || [];

// =============================================
// AVATAR A vs B: los anuncios de Meta se reparten por avatar según la landing a la que llevan
// avatares: [{ id: "A", handles: ["cepillo-a"] }] · anuncios: los de metricasAnuncios (rutas-meta.js)
// convertir(valor, moneda) → a la moneda del país. Las compras son las que reporta el píxel de Meta, no las entregas.
// =============================================
const handleDe = (url = "") => {
  try { return decodeURIComponent((String(url).match(/\/products\/([^/?#]+)/i) || [])[1] || "").toLowerCase(); } catch { return ""; }
};
export function compararAvatares(anuncios = [], avatares = [], convertir = (v) => v) {
  const por = new Map(avatares.map(a => [a.id, { id: a.id, gasto: 0, impresiones: 0, clics: 0, compras: 0, anuncios: [] }]));
  const dueno = new Map();
  for (const a of avatares) for (const h of a.handles || []) if (h) dueno.set(String(h).toLowerCase(), a.id);
  for (const x of anuncios) {
    const av = dueno.get(handleDe(x.url));
    if (!av) continue;
    const gasto = Number(convertir(Number(x.gasto) || 0, x.moneda)) || 0;
    const t = por.get(av);
    t.gasto += gasto; t.impresiones += Number(x.impresiones) || 0; t.clics += Number(x.clics) || 0; t.compras += Number(x.compras) || 0;
    t.anuncios.push({ anuncio: x.anuncio, campana: x.campana, gasto, clics: Number(x.clics) || 0, compras: Number(x.compras) || 0 });
  }
  const filas = [...por.values()].map(t => ({
    ...t,
    ctr: t.impresiones ? t.clics / t.impresiones * 100 : null,
    cpc: t.clics ? t.gasto / t.clics : null,
    cpa: t.compras ? t.gasto / t.compras : null,
    anuncios: t.anuncios.sort((a, b) => b.gasto - a.gasto)
  }));
  return { filas, veredicto: veredictoAvatares(filas) };
}
// Quién va ganando: por CPA si los dos tienen 3+ compras; si no, por CTR (señal temprana) con 1.000+ impresiones cada uno
export function veredictoAvatares(filas) {
  const con = filas.filter(f => f.gasto > 0);
  if (con.length < 2) return { tipo: "falta", texto: con.length ? `Solo el avatar ${con[0].id} tiene anuncios con gasto. Para comparar, pon a correr los dos.` : "Todavía no hay anuncios con gasto que lleven a las landings de este producto." };
  const [a, b] = con;
  const dif = (x, y) => Math.round(Math.abs(x - y) / Math.max(x, y) * 100);
  if (a.compras >= 3 && b.compras >= 3) {
    const g = a.cpa <= b.cpa ? a : b, p = g === a ? b : a;
    return { tipo: "cpa", ganador: g.id, texto: `El avatar ${g.id} va ganando: cada compra le cuesta ${dif(g.cpa, p.cpa)}% menos que al ${p.id}. Pásale más presupuesto al ${g.id}.` };
  }
  if (a.impresiones >= 1000 && b.impresiones >= 1000 && a.ctr !== null && b.ctr !== null) {
    if (dif(a.ctr, b.ctr) < 15) return { tipo: "empate", texto: "Van parejos en clics. Espera a tener al menos 3 compras en cada uno para decidir." };
    const g = a.ctr >= b.ctr ? a : b, p = g === a ? b : a;
    return { tipo: "ctr", ganador: g.id, texto: `Señal temprana: el anuncio del avatar ${g.id} atrae ${dif(g.ctr, p.ctr)}% más clics que el ${p.id}. Todavía faltan compras para estar seguros (mínimo 3 en cada uno).` };
  }
  return { tipo: "falta", texto: "Aún hay pocos datos: espera a que cada avatar tenga al menos 1.000 impresiones." };
}

// =============================================
// FATIGA DE ANUNCIOS: compara la última semana con la anterior, anuncio por anuncio
// ahora / antes: anuncios de metricasAnuncios (rutas-meta.js) de cada semana, con el gasto ya en tu moneda
// Fatigado si (con gasto suficiente esta semana): la gente ya lo vio 3+ veces, el CTR cayó 25%+ o la compra subió 40%+
// =============================================
export function fatigaAnuncios(ahora = [], antes = [], { gastoMinimo = 0 } = {}) {
  const previo = new Map(antes.map(a => [a.adId, a]));
  const ctr = (a) => (a?.impresiones ? a.clics / a.impresiones * 100 : null);
  const cpa = (a) => (a?.compras ? a.gasto / a.compras : null);
  const out = [];
  for (const a of ahora) {
    if (!(a.gasto > 0) || a.gasto < gastoMinimo) continue;
    const b = previo.get(a.adId);
    const razones = [];
    if (a.frecuencia >= 3) razones.push(`cada persona ya lo vio ${a.frecuencia.toFixed(1)} veces esta semana`);
    const c1 = ctr(a), c0 = ctr(b);
    if (c1 !== null && c0 && b.impresiones >= 1000 && a.impresiones >= 1000 && c1 <= c0 * 0.75) razones.push(`el CTR bajó de ${c0.toFixed(2)}% a ${c1.toFixed(2)}%`);
    const p1 = cpa(a), p0 = cpa(b);
    if (p1 !== null && p0 !== null && a.compras >= 2 && b.compras >= 2 && p1 >= p0 * 1.4) razones.push(`cada compra subió ${Math.round((p1 / p0 - 1) * 100)}%`);
    if (razones.length) out.push({ ...a, ctr: c1, ctrAntes: c0, cpa: p1, cpaAntes: p0, razones, gravedad: razones.length + (a.frecuencia >= 4 ? 1 : 0) });
  }
  return out.sort((x, y) => y.gravedad - x.gravedad || y.gasto - x.gasto);
}
