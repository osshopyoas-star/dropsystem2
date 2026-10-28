import { limpiarFuentes } from "./public/js/core/fuentes.js";
// =============================================
// 🖼️ PROMPTS DEL ESTUDIO DE LANDING (Desarrollo)
// Basados en la "Guía de trabajo: landings y creativos con IA".
// Aquí vive tu método: si aprendes una regla nueva, agrégala en REGLAS_APRENDIDAS
// y todas las landings nuevas la tendrán en cuenta.
// =============================================

import { SECCIONES, FORMATOS, varianteDe, tiposDe, claveDe, ACABADOS, ETAPAS_AIDA, etapaDe } from "./public/js/core/plantilla.js";
import { cifraPrueba } from "./public/js/core/finanzas.js";

const limpio = (v, max = 3000) => String(v ?? "").slice(0, max).trim();

export const PAISES = {
  CO: { nombre: "Colombia", moneda: "COP", envio: "Envío a toda Colombia" },
  EC: { nombre: "Ecuador", moneda: "USD", envio: "Envío a todo Ecuador" }
};

// ---------- Precios con el formato de cada país ----------
export function formatoPrecio(valor, pais = "CO") {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (pais === "EC") {
    return "$" + n.toFixed(2).replace(".", ",");
  }
  return "$" + Math.round(n).toLocaleString("es-CO").replace(/,/g, ".");
}

export function porcentajeDescuento(antes, ahora) {
  const a = Number(antes), b = Number(ahora);
  if (!(a > 0 && b > 0 && a > b)) return null;
  return Math.round(((a - b) / a) * 100);
}

// ---------- Lo que siempre se cumple ----------
export const REGLAS_APRENDIDAS = [
  "Siempre FOTOGRAFÍA REAL: dilo al inicio de cada prompt. Evita palabras como 'cuento', 'tierno', 'dibujado', 'mágico' o 'ilustración'.",
  "Escribe el tamaño real del producto y compáralo con el cuerpo de una persona (mano, torso, pared) para que no salga gigante ni diminuto.",
  "Di explícitamente lo que el producto NO tiene (por ejemplo: 'no tiene cámara', 'no tiene logo') para que la IA no lo invente.",
  "Describe la forma exacta del producto (partes, cómo están unidas, posición).",
  "Si es un pack o kit, muéstralo completo y en grande en la imagen de oferta, con el precio por unidad si aplica.",
  "El producto nunca queda tapado: titulares compactos, el producto es el protagonista y se ve grande.",
  "Estilo de VENTA DIRECTA que invita a comprar por impulso, no estilo editorial ni de revista.",
  "NUNCA pidas recuadros, marcos ni círculos vacíos para GIF, logo, botones o transportadoras: la IA los dibuja como cajas feas. Si el dueño va a pegar algo después, deja esa zona con el MISMO fondo de la imagen, lisa y sin bordes. Única excepción: las secciones de reseñas y de chats, que llevan tarjetas o burbujas blancas (sin borde doble ni líneas por dentro), SIEMPRE llenas con el texto de cada cliente.",
  "No pidas pegar ropa o piezas de otra foto: pide 'recolorea' o describe la prenda.",
  "Para lencería o productos sensibles: genera una modelo adulta nueva, sin poses sugestivas ni desnudez.",
  "Nombres de tipografías (Bebas Neue, Montserrat, etc.) y nombres de colores o códigos hex son instrucciones de diseño: NUNCA aparecen escritos en la imagen. En la imagen solo va el texto que está entre comillas.",
  "En comparaciones 'nosotros vs otros': la columna de los otros lleva SOLO desventajas con ✗; nunca repitas allí lo que incluye tu producto.",
  "Todos los textos entre comillas, con tildes y signos de español, sin errores. Nada de texto de plantilla visible (por ejemplo 'SECCIÓN 7').",
  "Mantén EXACTAMENTE el mismo modelo, color y diseño del producto en todas las imágenes.",
  "El producto EN USO lleva solo las piezas que van puestas a la vez (por ejemplo, UN solo cabezal en la punta). Los accesorios o repuestos sueltos aparecen solo en la sección de 'qué incluye'. Nunca dupliques piezas ni pongas una pieza en un lugar donde no va.",
  "Cada texto, tarjeta o ícono aparece UNA sola vez en la imagen: no repitas tarjetas.",
  "Español latino con TÚ: 'rocías', 'friegas', 'limpias', 'pídelo'. NUNCA voseo ('rociás', 'fregás', 'limpiás', 'pedilo').",
  "La pose de la persona tiene que cumplir la promesa del titular: si dice 'sin arrodillarte' o 'sin agacharte', la persona está DE PIE y derecha, nunca de rodillas ni agachada.",
  "Todo sello de descuento lleva su número completo (por ejemplo '-30%'); nunca un '%' solo.",
  "En imágenes del PROBLEMA o del 'antes', la persona sufre con el método viejo (cepillo común, a mano, de rodillas…): NUESTRO producto no aparece en sus manos. Si quieres mostrar la solución en esa misma imagen, va aparte (otra franja o un recuadro), nunca el producto dos veces en la escena.",
  "Listas de tallas o números: escríbelas completas y en orden, sin repetir."
];

export const LIMITES = [
  "Reseñas y testimonios: usa SOLO las reseñas reales que el dueño escribió en la Ficha, textuales (mismo nombre o iniciales, ciudad, estrellas y texto, sin mejorarlas). NUNCA inventes reseñas, rostros, nombres, ciudades, calificaciones promedio ('4.8/5'), cantidades de comentarios ni 'compra verificada'. Si la Ficha no tiene reseñas, el dueño se las pasa a Gemini al hacer la imagen (capturas de WhatsApp o texto pegado al final del prompt) y Gemini las pone tal cual; nunca se rellenan con reseñas inventadas.",
  "Cifras de prueba social (entregas, clientes, ciudades, calificación, % que recomienda): SOLO las que vienen en 'PRUEBA SOCIAL REAL', exactas, sin redondear hacia arriba ni agregar otras ('+10.000 mamás', 'miles ya compraron'). Si no hay, ninguna cifra.",
  "Sellos y logos de entidades: NUNCA pongas logos de la Superintendencia de Industria y Comercio, la Cámara de Comercio Electrónico, bancos, transportadoras u otras entidades, ni 'tienda verificada', 'compra verificada' o certificados. La confianza sale de lo que es verdad: pagas al recibir, envío a todo el país, tiempo de entrega, garantía si existe y tus números reales.",
  "Producto real: la imagen muestra exactamente lo que llega. No agregues detalles, piezas, logos ni empaques de marca que no existan.",
  "Promesas médicas: prohibido 'cura', 'elimina', 'reduce el dolor', 'indoloro' o porcentajes sin prueba. Usa 'soporte', 'molestias', 'calor leve', 'apoyo' y menciona para quién no es si aplica.",
  "Marcas ajenas: no escribas nombres de otras marcas (Nike, IKEA, etc.) ni digas que es el producto original u oficial de una marca, salvo que la ficha diga que es original o licenciado. Pide logos de terceros borrosos o sin logo.",
  "Personas reales: no uses ni recrees personas famosas, jugadores, ni animales o personas de noticias.",
  "Promesas comerciales: 'envío gratis', 'garantía', 'original', 'quedan pocas', 'solo por hoy', contadores regresivos SOLO si la ficha dice que son verdad.",
  "La causa real se explica en palabras simples y generales, que el cliente pueda comprobar en su vida diaria. Nada de diagnósticos, enfermedades, estudios, porcentajes ni 'científicamente probado' inventados. En salud y belleza habla de hábitos, uso o cuidado (no de curar), y nunca le digas a la persona que tiene una condición.",
];

// =============================================
// AIDA + "EL PROBLEMA": cómo se vende en CoDropX
// Atención (sus palabras) → Interés (la causa real que nadie le explicó) → Deseo (por qué esto sí) → Acción (sin miedo)
// "Cuando el cliente entiende su problema, no hay que gritarle cómpralo."
// =============================================
export const METODO_AIDA = `MÉTODO DE VENTA (AIDA + la causa real):
- ATENCIÓN: abre con las PALABRAS EXACTAS del cliente (cómo él describe su problema) o con la promesa principal. Nada genérico.
- INTERÉS: explícale la CAUSA REAL de su problema en simple, y por qué lo que ya probó no le sirvió ("No es X, no es Y: es Z"). Que piense "nadie me lo había explicado así".
- DESEO: muéstrale por qué ESTE producto ataca justo esa causa (el mecanismo) y cómo se ve su vida con el resultado. Solo lo que la ficha permite prometer.
- ACCIÓN: precio claro, pago contra entrega, garantía solo si existe, y una instrucción simple. Sin gritar ni urgencia falsa.`;

// Sin reseñas en la Ficha: el dueño se las pasa a Gemini al hacer la imagen (capturas o texto), y Gemini las pone tal cual
function resenasEnGemini(tipo) {
  const chat = tipo === "chats";
  return `
${chat ? "CHATS" : "RESEÑAS"}: la Ficha no tiene reseñas escritas. El dueño se las pasa a Gemini al hacer la imagen (${chat ? "capturas de WhatsApp" : "fotos reales que le mandaron sus clientes y/o capturas de WhatsApp"}), y CoDropX agrega al final del prompt cómo va cada dato en la tarjeta, las reglas de las fotos y las líneas para escribirlas. Tú NO escribas esa parte ni ningún texto de reseña.
- Diseña ${chat ? "las burbujas de chat (máximo 4)" : "las tarjetas"} según el diseño elegido (el número de tarjetas y cómo va cada dato lo pone CoDropX al final), todas LLENAS: NUNCA escribas "espacio para que el dueño pegue", "zona lisa para agregar" ni nada por el estilo; la imagen sale terminada.${chat ? "" : `
- Si el diseño es carrusel: 3 tarjetas en FILA HORIZONTAL, la del centro grande y completa y las de los lados más pequeñas, cortadas por el borde de la imagen; 3 puntos pequeños debajo.`}${chat ? "" : `
- Cada tarjeta lleva una foto grande arriba o a un lado, según el diseño. En la COMPOSICIÓN escribe solo "tarjeta 1: foto adjunta de cliente", "tarjeta 2: foto adjunta de cliente"…, SIN describir a ninguna persona ni lo que hay en esas fotos (Gemini usa las fotos adjuntas tal cual; si las describes, las inventa).`}
- En TEXTOS pon solo el titular genérico ("LO QUE DICEN NUESTROS CLIENTES" / "${chat ? "LO QUE NOS ESCRIBEN" : "CLIENTES REALES"}") y la barra inferior: los nombres, ciudades, estrellas y textos de los clientes van en el bloque final.
- Sin foto del cliente: junto al nombre un círculo de color con sus iniciales, nunca una cara inventada. Sin promedio ni "verificado".`;
}

// Bloque FIJO al final del prompt de reseñas y chats (lo pone CoDropX, no la IA): Gemini usa tus fotos tal cual y no inventa nada
export const TIPOS_CON_RESENAS = ["resenas", "moda_chats", "resumen_resenas"];
const FINAL_RESENAS = /\n+(CÓMO ES CADA (TARJETA|BURBUJA)|FOTOS Y RESEÑAS|FOTOS \(lo más|RESEÑAS DE MIS CLIENTES|RESEÑAS \(una|MENSAJES \(una|CHATS DE MIS CLIENTES|FRASES DE MIS CLIENTES)[\s\S]*$/;
// Cuántas tarjetas caben en cada diseño de reseñas (y cuántas salen si no sabemos cuántas reseñas hay)
const TARJETAS_DISENO = { carrusel: [3, 3], dos_columnas: [4, 6], columna: [3, 4], destacada: [4, 4] };
const COMO_TARJETA = {
  carrusel: "Arriba, una foto grande con esquinas redondeadas. Debajo, a la izquierda, el NOMBRE en negrita negra grande y justo debajo la CIUDAD en gris pequeño; a la derecha del nombre, las ESTRELLAS. Debajo, el texto de la reseña entre comillas, en negro, letra legible.",
  dos_columnas: "Arriba, una foto grande con esquinas redondeadas. Debajo, el NOMBRE en negrita y la CIUDAD en gris pequeño; al lado, las ESTRELLAS. Debajo, el texto de la reseña entre comillas, en negro, letra legible.",
  columna: "A la izquierda, una foto en círculo; a la derecha, el NOMBRE en negrita, la CIUDAD en gris pequeño y las ESTRELLAS; debajo, el texto de la reseña entre comillas, en negro, letra legible.",
  destacada: "La primera tarjeta es grande, con la foto grande arriba, el NOMBRE en negrita, la CIUDAD en gris pequeño, las ESTRELLAS y el texto entre comillas. Las demás son compactas: foto pequeña a la izquierda y a la derecha el nombre, las estrellas y una frase."
};
export function cierreResenas(p, tipo, variante = "") {
  if (!TIPOS_CON_RESENAS.includes(tipo)) return "";
  const chat = tipo === "moda_chats";
  const [base, max] = chat ? [4, 4] : tipo === "resumen_resenas" ? [4, 4] : TARJETAS_DISENO[variante] || [3, 6];
  const rs = resenasReales(p).slice(0, max);
  const n = rs.length ? Math.min(rs.length, max) : base;
  const fotosFicha = rs.filter(r => r.foto).length;
  const linea = (r) => chat
    ? `${limpio(r.nombre, 40) || "___"} | "${limpio(r.texto, 260) || "___"}"`
    : `${limpio(r.nombre, 40) || "___"} | ${limpio(r.ciudad, 40) || "___"} | ${Number(r.estrellas) || "___"} | ${limpio(r.texto, 260) ? `"${limpio(r.texto, 260)}"` : "___"}`;
  const vacia = chat ? `___ | "___"` : `___ | ___ | ___ | "___"`;
  const lineas = (rs.length ? rs.map(linea) : Array.from({ length: n }, () => vacia)).map((l, i) => `${i + 1}. ${l}`).join("\n");
  if (chat) return `

CÓMO ES CADA BURBUJA: una burbuja blanca de chat tipo WhatsApp por mensaje, con el NOMBRE pequeño en negrita arriba, el mensaje en letra grande y legible, y una hora pequeña abajo a la derecha (ej. 10:42). NUNCA escribas las palabras "Nombre" ni "Mensaje" en la imagen. UN solo mensaje por burbuja.
Si alguna imagen adjunta es una captura de WhatsApp, lee su texto y úsalo tal cual como un mensaje más.

MENSAJES (una burbuja por línea). Cada línea es: nombre | "mensaje". Copia el mensaje tal cual (solo corrige tildes). Lo que quedó con ___ no va. No inventes nada que no esté aquí:
${lineas}`;
  return `

CÓMO ES CADA TARJETA (${n} tarjetas, todas iguales${variante === "destacada" ? " salvo la primera" : ""}):
- ${COMO_TARJETA[variante] || COMO_TARJETA.dos_columnas}
- Las ESTRELLAS van dibujadas como 5 íconos de estrella dorados (rellena tantas como diga la reseña; el resto en gris claro). NUNCA se escriben con números ni con la palabra "Estrellas". Si una reseña no trae estrellas, esa tarjeta va sin estrellas.
- NUNCA escribas las palabras "Nombre", "Ciudad", "Estrellas" ni "Texto" en la imagen.
- UNA sola reseña por tarjeta. Nunca pongas dos reseñas en la misma tarjeta.
- Si una reseña no tiene nombre, junto a las estrellas no va nombre; si no tiene texto, la tarjeta lleva solo la foto, las estrellas que tenga y la etiqueta "Foto real de cliente".

FOTOS (lo más importante):
- La PRIMERA imagen adjunta es el producto: úsala solo como referencia, no va en las tarjetas.
- TODAS las demás imágenes adjuntas son fotos REALES que me mandaron mis clientes${fotosFicha ? ` (son ${fotosFicha})` : ""}. Usa ${n === 1 ? "una" : `${n}`} de ellas, una en cada tarjeta, TAL CUAL: solo recórtalas para que encajen. NO las cambies, NO las mejores, NO crees personas ni fotos nuevas.
- Si adjunté menos fotos de clientes que tarjetas, las que faltan llevan la foto del producto en uso (manos o el lugar, sin cara).
- Si alguna imagen adjunta es una captura de WhatsApp o de un comentario, no la pongas como foto: lee su texto y úsalo como reseña, tal cual.

RESEÑAS (una por tarjeta, en este orden${variante === "carrusel" ? ": la 1 va en la tarjeta del centro" : variante === "destacada" ? ": la 1 va en la tarjeta grande" : ""}). Cada línea es: nombre | ciudad | estrellas (1 a 5) | "texto". Copia el texto tal cual (solo corrige tildes). Lo que quedó con ___ no va. No inventes nada que no esté aquí:
${lineas}${rs.length ? "" : `
Si no escribí ninguna reseña, cada tarjeta lleva solo su foto con la etiqueta "Foto real de cliente" (sin nombre, sin estrellas, sin frase) y el titular dice "ASÍ LES LLEGÓ A NUESTROS CLIENTES".`}`;
}
// La IA a veces escribe su propio bloque final: se quita y se pone el fijo
export const conCierreResenas = (texto, p, tipo, variante = "") => (TIPOS_CON_RESENAS.includes(tipo) ? String(texto).replace(FINAL_RESENAS, "").trimEnd() + cierreResenas(p, tipo, variante) : texto);

// Chats de clientes: los mismos mensajes reales de la Ficha, como burbujas de WhatsApp
function bloqueChats(p) {
  const rs = resenasReales(p).filter(r => String(r.texto || "").trim()).slice(0, 4);
  if (!rs.length) return resenasEnGemini("chats");
  return `
CHATS REALES (son ${rs.length}: diseña una burbuja por mensaje; los textos los agrega CoDropX al final, tú no los escribas en TEXTOS). Cada burbuja: nombre o iniciales pequeño arriba, el mensaje y una hora pequeña abajo a la derecha (ej. 10:42). Letra grande y legible:
${rs.map((r, i) => `${i + 1}. "${limpio(r.nombre, 40) || "Cliente"}": "${limpio(r.texto, 200)}"`).join("\n")}`;
}

// Quién USA el producto (Ficha → "¿Para quién es?"). Los avatares son siempre los adultos que lo COMPRAN.
export const PARA_QUIEN = {
  adultos: { usa: "adultos", personas: null },
  bebes: { usa: "bebés de 0 a 2 años", personas: "un bebé (0 a 2 años) con su mamá o papá" },
  ninos: { usa: "niños de 3 a 12 años", personas: "un niño o niña de la edad indicada con su mamá, papá o abuelos" },
  adolescentes: { usa: "adolescentes de 13 a 17 años", personas: "un adolescente de 13 a 17 años en su vida diaria, y su mamá o papá cuando la escena es de compra o regalo" },
  familia: { usa: "toda la familia", personas: "una familia: adultos y niños juntos" },
  mascotas: { usa: "mascotas (perros, gatos)", personas: "la mascota con su dueño o dueña" },
  hogar: { usa: "el hogar, el carro u objetos (no una persona)", personas: null }
};
const paraQuienDe = (p) => PARA_QUIEN[p?.ficha?.paraQuien] ? p.ficha.paraQuien : "adultos";
const esMenor = (p) => ["bebes", "ninos", "adolescentes"].includes(paraQuienDe(p));
function bloqueParaQuien(p) {
  const k = paraQuienDe(p);
  if (k === "adultos") return "";
  const x = PARA_QUIEN[k];
  if (esMenor(p)) return `QUIÉN LO USA: ${x.usa}. QUIÉN LO COMPRA: un adulto (mamá, papá, abuelos, tíos, padrinos o quien lo regala). Los avatares, el ángulo y los textos le hablan SIEMPRE al adulto que compra (su preocupación como mamá/papá, la edad de su hijo, el regalo).
REGLAS CON MENORES EN LAS FOTOS: el menor aparece con ropa normal y completa, en escenas cotidianas y familiares (casa, parque, colegio, cumpleaños), con aspecto y edad reales de ${x.usa}, natural y contento; si la escena lo pide, con un adulto cerca. Nada de poses de modelo adulto, maquillaje, ropa reveladora, bikini ni nada sugestivo. En los primeros planos, mejor el producto en las manos o junto al menor que la cara.`;
  if (k === "mascotas") return `QUIÉN LO USA: ${x.usa}. QUIÉN LO COMPRA: su dueño o dueña. Los avatares son los dueños; en las fotos sale la mascota usando el producto, con su dueño cuando ayude.`;
  if (k === "hogar") return `QUIÉN LO USA: ${x.usa}. Los avatares son los adultos que lo compran para su casa o carro; las fotos muestran el producto en ese lugar, con personas solo si ayudan a la escena.`;
  return `QUIÉN LO USA: ${x.usa}. Los avatares son los adultos que lo compran para su familia; en las fotos salen adultos y niños juntos, en escenas cotidianas, con ropa normal y completa.`;
}

// Tamaño real con una referencia de la vida diaria (la IA entiende mejor "como un antebrazo" que "32,5 cm")
export function referenciaTamano(medidas) {
  const t = String(medidas || "").toLowerCase().replace(/,/g, ".");
  let max = 0;
  // "32.5 cm", "18 x 11 cm", "20×10×5 cm", "1.92 m"
  for (const m of t.matchAll(/((?:\d+(?:\.\d+)?\s*[x×]\s*)*\d+(?:\.\d+)?)\s*(mm|cm|m)\b/g)) {
    const f = m[2] === "mm" ? 0.1 : m[2] === "m" ? 100 : 1;
    for (const n of m[1].split(/[x×]/)) { const v = Number(n.trim()) * f; if (v > max) max = v; }
  }
  if (!max || max > 400) return "";
  const refs = [
    [4, "una moneda"], [9, "una tarjeta de crédito"], [16, "un celular"], [24, "una mano abierta de adulto"],
    [36, "un antebrazo de adulto (del codo a la mano)"], [50, "un brazo de niño o una hoja tamaño oficio"],
    [80, "las rodillas de un adulto (desde el piso)"], [120, "la cintura de un adulto (desde el piso)"],
    [170, "el hombro de un adulto (desde el piso)"], [400, "la altura de una persona o más"]
  ];
  const r = refs.find(([lim]) => max <= lim)?.[1];
  return r ? `La medida más larga es de unos ${Math.round(max)} cm: más o menos ${r}.` : "";
}

// Reseñas reales de la Ficha → texto para el prompt de la sección de reseñas
export function resenasReales(p) {
  return (p?.ficha?.resenas || []).filter(r => r && (String(r.texto || "").trim() || r.foto)).slice(0, 6);
}
function bloqueResenas(p) {
  const rs = resenasReales(p);
  if (!rs.length) return resenasEnGemini("resenas");
  let foto = 1;
  const lineas = rs.map((r, i) => {
    const conFoto = !!r.foto;
    const ref = conFoto ? `foto del cliente: la imagen adjunta #${++foto}` : "sin foto del cliente: usa el producto en una escena real, sin personas, y junto al nombre un círculo de color con sus iniciales (nunca una cara inventada)";
    const estrellas = Number(r.estrellas) >= 1 && Number(r.estrellas) <= 5 ? `${Number(r.estrellas)} estrellas` : "sin estrellas";
    const nombre = limpio(r.nombre, 40) ? `Nombre: "${limpio(r.nombre, 40)}"` : "SIN nombre (no escribas ningún nombre)";
    const texto = limpio(r.texto, 260) ? `Texto: "${limpio(r.texto, 260)}"` : "SIN texto: tarjeta solo con la foto (no escribas ninguna cita ni frase del cliente)";
    return `${i + 1}. ${nombre}${r.ciudad ? ` · Ciudad: "${limpio(r.ciudad, 40)}"` : ""} · ${estrellas} · ${texto} · ${ref}`;
  });
  return `
RESEÑAS REALES (son ${rs.length}: diseña una tarjeta por cada una, LLENAS con lo que se indica: foto, nombre, ciudad, estrellas y texto cuando existan; no cambies ni una palabra, no agregues otras, no pongas promedio ni "verificado"). Las tarjetas NUNCA van vacías.
El titular de la sección es genérico (ej. "LO QUE DICEN" / "NUESTROS CLIENTES" o "FOTOS REALES DE CLIENTES"); nunca una cita inventada de un cliente.
${lineas.join("\n")}
CADA tarjeta lleva foto como en el diseño elegido: la del cliente o, si no tiene, el producto en uso (manos o el lugar, sin cara). En la COMPOSICIÓN, para las que tienen foto del cliente escribe solo "tarjeta N: foto adjunta de cliente", SIN describir a la persona ni la escena (Gemini usa la foto adjunta tal cual). Los textos de las reseñas NO los escribas en TEXTOS: CoDropX los agrega al final con cómo va cada dato en la tarjeta. La imagen sale TERMINADA: nada de zona libre ni espacios para pegar.`;
}

// ---------- Prueba social con números reales (Ficha → pruebaSocial, traídos de Dropi y de tu app de reseñas) ----------
const miles = (n) => Math.round(n).toLocaleString("es-CO").replace(/,/g, ".");
export function numerosPrueba(p) {
  const ps = p?.ficha?.pruebaSocial;
  if (!ps || ps.mostrar === "no") return null;
  const n = ps.mostrar === "producto" ? ps.producto : ps.tienda;
  if (!(n?.entregados > 0)) return null;
  const pais = PAISES[p.pais] || PAISES.CO;
  return {
    entregas: `+${miles(cifraPrueba(n.entregados))}`,
    ciudades: n.ciudades >= 5 ? `+${miles(cifraPrueba(n.ciudades))}` : "",
    de: ps.mostrar === "producto" ? "de este producto" : "de la tienda",
    pais: p.pais === "EC" ? "TODO ECUADOR" : "TODA COLOMBIA"   // "en toda Colombia" · "en todo Ecuador"
  };
}
// Calificación real: la de tu app de reseñas o, si no, la de las reseñas de la Ficha
export function calificacionReal(p) {
  const a = p?.ficha?.pruebaSocial?.app || {};
  if (a.total > 0 && (a.promedio > 0 || a.recomiendan > 0)) {
    return { fuente: "tu app de reseñas", total: a.total, promedio: a.promedio || null, recomiendan: a.recomiendan || null };
  }
  const con = (p?.ficha?.resenas || []).map(r => Number(r?.estrellas)).filter(e => e >= 1 && e <= 5);
  if (con.length < 3) return null;
  return { fuente: "las reseñas de la Ficha", total: con.length, promedio: Math.round(con.reduce((x, y) => x + y, 0) / con.length * 10) / 10, cincoEstrellas: con.filter(e => e === 5).length };
}
function textoPruebaSocial(p) {
  const n = numerosPrueba(p), c = calificacionReal(p);
  const partes = [];
  if (n) partes.push(`Entregas reales (Dropi, ${n.de}): "${n.entregas} ENTREGAS EXITOSAS EN ${n.pais}"${n.ciudades ? ` · "${n.ciudades} ciudades"` : ""}`);
  if (c) partes.push(`Calificación real (${c.fuente}): ${c.promedio ? `promedio "${String(c.promedio).replace(".", ",")}" de 5` : ""}${c.recomiendan ? ` · "el ${c.recomiendan}% nos recomienda"` : ""}${c.cincoEstrellas !== undefined ? ` · "${c.cincoEstrellas} de ${c.total} clientes nos dieron 5 estrellas"` : ` · de ${miles(c.total)} reseñas`}`);
  return partes.length ? partes.join("\n") : "No hay cifras reales de ventas, clientes ni calificación: no pongas NINGUNA cifra de esas.";
}
function bloqueNumeros(p) {
  const n = numerosPrueba(p);
  if (!n) return `
NÚMEROS: la Ficha no tiene números reales de Dropi. NO escribas ninguna cifra de entregas, clientes, ventas ni ciudades. La sección dice solo "PAGAS AL RECIBIR" y "${(PAISES[p.pais] || PAISES.CO).envio}", con el producto en uso.`;
  return `
NÚMEROS REALES (de los pedidos entregados en Dropi, ${n.de}). Úsalos EXACTAMENTE así, sin cambiarlos, sin subirlos y sin agregar otros:
- Cifra principal: "${n.entregas}" con "ENTREGAS EXITOSAS" y "EN ${n.pais}"
${n.ciudades ? `- Ciudades: "${n.ciudades} ciudades" (por ejemplo "Hemos entregado en ${n.ciudades} ciudades")
` : ""}- Siempre junto a: "PAGAS AL RECIBIR TU PEDIDO"
La cifra es lo más grande de la imagen. Nada de "clientes felices", "miles" ni otros números.`;
}
function bloqueCalificacion(p) {
  const c = calificacionReal(p);
  const frases = resenasReales(p).filter(r => String(r.texto || "").trim()).slice(0, 4);
  const cabeza = c
    ? `CALIFICACIÓN REAL (${c.fuente}), escríbela EXACTAMENTE así:
${c.promedio ? `- Nota: "${String(c.promedio).replace(".", ",")}" con 5 estrellas (rellena solo las que correspondan a esa nota)
` : ""}${c.recomiendan ? `- "El ${c.recomiendan}% de nuestros clientes nos recomienda"
` : ""}${c.cincoEstrellas !== undefined ? `- "${c.cincoEstrellas} de ${c.total} clientes nos dieron 5 estrellas"` : `- "de ${miles(c.total)} reseñas"`}`
    : `CALIFICACIÓN: no hay datos reales. NO pongas nota, porcentaje, número de reseñas ni estrellas promedio. El titular es genérico ("LO QUE DICEN NUESTROS CLIENTES").`;
  const citas = frases.length
    ? `FRASES REALES DE CLIENTES (textuales; puedes acortarlas quitando palabras del final, nunca cambiarlas ni agregar):
${frases.map((r, i) => `${i + 1}. "${limpio(r.texto, 160)}" — ${limpio(r.nombre, 40) || "sin nombre (no escribas ninguno)"}${r.ciudad ? `, ${limpio(r.ciudad, 40)}` : ""}${Number(r.estrellas) ? ` · ${Number(r.estrellas)} estrellas` : ""}`).join("\n")}`
    : `FRASES: la Ficha no tiene textos de clientes. El dueño se los pasa a Gemini al hacer la imagen, y CoDropX las agrega al final: tú no escribas frases de clientes; diseña de 2 a 4 burbujas LLENAS.`;
  return `
${cabeza}
${citas}
Las fotos son del producto en uso (manos, pies o el lugar, sin caras reconocibles) y NO se presentan como fotos de clientes. Junto a cada nombre, un círculo de color con sus iniciales, nunca una cara inventada.`;
}
function bloquePagasAlRecibir(p) {
  const pr = p?.ficha?.promesas || {};
  const pais = PAISES[p.pais] || PAISES.CO;
  const n = numerosPrueba(p);
  return `
LO QUE ES VERDAD Y VA EN ESTA IMAGEN (nada más):
- "PAGAS AL RECIBIR": primero recibe el producto en su casa y luego paga
- "${pr.envioGratis ? pais.envio.replace("Envío", "Envío gratis") : pais.envio}"
${pr.entrega ? `- Tiempo de entrega: "${limpio(pr.entrega, 60)}"
` : "- Sin tiempo de entrega en la Ficha: no escribas días\n"}${pr.garantia ? `- Garantía: "${limpio(pr.garantia, 60)}"
` : "- NO hay garantía: no la menciones\n"}${n ? `- Entregas reales: "${n.entregas} entregas exitosas en ${n.pais.toLowerCase().replace(/\b(colombia|ecuador)\b/, (x) => x[0].toUpperCase() + x.slice(1))}"
` : ""}Sin logos de entidades, sellos de 'tienda verificada', 'compra 100% garantizada' ni urgencia ('solo por hoy').`;
}

// El avatar en un bloque (para todos los prompts)
export function bloqueAvatar(a, titulo = "AVATAR") {
  if (!a) return `${titulo}: (sin avatar)`;
  return `${titulo} ${a.id || "A"}:
Quién es: ${a.quien || ""}
Problema/deseo: ${a.problema || ""}
Qué ha probado y por qué no le sirvió: ${a.probado || ""}
Sus palabras (cómo lo dice él): ${a.palabras || a.frase || ""}
La causa real (lo que nadie le ha explicado): ${a.causa || "(no definida: dedúcela del problema, en simple y sin diagnósticos)"}
Por qué este producto sí (mecanismo): ${a.mecanismo || "(no definido: sale de la ficha, sin inventar)"}
Ángulo: ${a.angulo || ""}
Tono: ${a.tono || ""}`;
}

// Estilos ya usados (de la guía). Los de proyectos nuevos se suman automáticamente.
export const ESTILOS_BASE_USADOS = [
  "Letrero neón y camiseta James (Nacional): negro con verde neón, letra de brocha, tono de hincha ('parce')",
  "Tenis La Titular: negro con dorado y tricolor colombiano",
  "Letreros neón para negocios: negro con dorado neón, paquetes de 1, 2 y 3 unidades",
  "Depiladora IPL: negro premium con oro rosa",
  "Trípode F01: creador de contenido, negro con neón azul y morado",
  "Lencería babydoll: pasión de venta directa, negro y rojo con dorado",
  "Bolso portacelular: pop pastel lila y fucsia, doble toma (bolso puesto y mano usando el celular)",
  "Peluche orangután (Punch): crema, verde salvia y caramelo, emocional, foto real",
  "Cinta de kinesiología x10: gym, negro con cian eléctrico"
];

// Catálogo de tipos de sección (vive en public/js/core/plantilla.js, compartido con la pantalla Mi plantilla)
export const CATALOGO_SECCIONES = Object.fromEntries(
  Object.entries(SECCIONES).map(([k, v]) => [k, { titulo: v.titulo, def: v.def, formatos: v.formatos }])
);

const esNormal = (p) => p?.formato === "normal";

// Cómo es la página según el formato del proyecto
function textoFormato(p) {
  return esNormal(p)
    ? `LANDING NORMAL de Shopify: arriba va el bloque nativo de Shopify (galería de fotos cuadradas, título, precio con 'antes' tachado, beneficios con ✔ y botón de compra); abajo, secciones de "Imagen con texto" (una imagen cuadrada 1:1 y al lado un título y un párrafo que se escriben en Shopify). El precio lo muestra Shopify: las imágenes llevan POCO texto y no repiten el precio, salvo paquetes y oferta de cierre.`
    : `BAN PAGE: toda la página son imágenes verticales 9:16 (1080x1920) una debajo de otra. El precio y los textos van dentro de las imágenes. Los botones de compra, los GIF y las reseñas reales los agrega el dueño en Shopify.`;
}

const lista = (arr) => arr.map(x => `- ${x}`).join("\n");

// ---------- Contexto del producto (se usa en todos los pasos) ----------
export function contextoProducto(p) {
  const f = p.ficha || {};
  const pais = PAISES[p.pais] || PAISES.CO;
  const precio = formatoPrecio(f.precio, p.pais);
  const antes = formatoPrecio(f.precioAntes, p.pais);
  const desc = porcentajeDescuento(f.precioAntes, f.precio);
  const r = p.revision || {};
  const pr = f.promesas || {};

  const verdades = [
    pr.envioGratis ? `Envío GRATIS: "${pais.envio.replace("Envío", "Envío gratis")}"` : `"${pais.envio}" (NO es gratis: no digas 'envío gratis')`,
    "Pago contra entrega",
    pr.garantia ? `Garantía: ${limpio(pr.garantia, 60)}` : "NO hay garantía: no la menciones",
    pr.original ? "El producto es original/licenciado (se puede decir)" : "NO digas 'original' ni 'oficial'",
    pr.entrega ? `Tiempo de entrega: ${limpio(pr.entrega, 60)}` : null
  ].filter(Boolean);

  return `
PRODUCTO: ${limpio(p.nombre, 200)}
PAÍS: ${pais.nombre} (moneda ${pais.moneda})
DESCRIPCIÓN DEL PROVEEDOR:
${limpio(f.descripcion, 4000) || "(sin descripción)"}

DESCRIPCIÓN FÍSICA VERIFICADA: ${limpio(r.descripcionFisica, 2000) || "(aún no verificada)"}
TAMAÑO REAL: ${limpio(f.medidas || r.tamano, 300) || "(sin medidas: pídelas en las notas)"}
LO QUE NO TIENE NI TRAE: ${limpio(listaNoTiene(f.noTiene, r.noTiene).join("; "), 800) || "(no indicado)"}
VARIANTES / TALLAS / COLORES: ${limpio(f.variantes, 300) || "(una sola versión)"}
PRECIO: ${precio || "(sin precio)"}${antes ? ` · ANTES: ${antes}` : ""}${desc ? ` · DESCUENTO: ${desc}%` : ""}
PAQUETES: ${limpio(f.paquetes, 500) || "(no hay paquetes)"}
REGALO: ${limpio(f.regalo, 200) || "(no hay regalo)"}
PROMESAS QUE SÍ SON VERDAD (no inventes otras):
${lista(verdades)}
PRUEBA SOCIAL REAL (solo estas cifras, exactas; se pueden usar en la barra de confianza):
${textoPruebaSocial(p)}
FORMATO DE LA LANDING: ${textoFormato(p)}
${bloqueParaQuien(p) ? bloqueParaQuien(p) + "\n" : ""}${p.tipo === "moda" ? `TIPO DE PRODUCTO: MODA (ropa, calzado o accesorio). Las fotos muestran la pieza PUESTA en ${esMenor(p) ? `${({ bebes: "un bebé de 0 a 2 años", ninos: "un niño o niña de 3 a 12 años", adolescentes: "un adolescente de 13 a 17 años" })[paraQuienDe(p)]} real, natural y contento, en una escena cotidiana` : "una persona adulta real, natural, sin poses sugestivas"}; la talla, el color y el corte deben ser EXACTAMENTE los de la foto adjunta. Lista de tallas y colores siempre completa y en orden. No inventes medidas.
` : ""}PREFERENCIA DE ESTILO DEL DUEÑO: ${limpio(f.estiloPreferido, 300) || "(ninguna)"}
NOTAS DEL DUEÑO: ${limpio(f.notas, 1000) || "(ninguna)"}
`.trim();
}

const SISTEMA = `Eres el director creativo de una tienda de dropshipping con pago contra entrega en Colombia (pesos) y Ecuador (dólares).
No generas imágenes: escribes los prompts que el dueño pega en Gemini (un chat nuevo por imagen, adjuntando la foto real del producto y pegando primero el bloque de estilo y debajo el prompt), y los textos de venta.
Las landings se publican en Shopify en uno de dos formatos (cada producto dice cuál):
- BAN PAGE: toda la página son imágenes verticales 9:16 (1080x1920); el precio va dentro de las imágenes.
- LANDING NORMAL: página de producto de Shopify con galería, título, precio, beneficios y botón nativos, y abajo secciones de imagen cuadrada 1:1 con texto al lado.
Los botones de compra, los GIF y las reseñas reales los agrega el dueño después en Shopify.
Escribes en español neutro latino, natural para el país indicado, directo y vendedor.

REGLAS APRENDIDAS (cada una viene de un error que ya pasó):
${lista(REGLAS_APRENDIDAS)}

LÍMITES (protegen las ventas y las cuentas de anuncios):
${lista(LIMITES)}`;

export const SISTEMA_LANDING = SISTEMA;

// ---------- Paso 1: revisar fotos vs descripción ----------
export function promptRevisarFicha(p) {
  return `${contextoProducto(p)}

TAREA: Revisa las fotos adjuntas (son las fotos reales que entregó el proveedor) contra la descripción.
1. Escribe una DESCRIPCIÓN FÍSICA muy detallada del producto tal como se ve en las fotos: forma, partes, cómo están unidas, materiales, colores exactos, acabados, textos o logos que tenga. Esta descripción se usará para que Gemini no invente nada.
2. Lista lo que el producto NO tiene y que una IA podría inventarle (por ejemplo: "no tiene cámara", "no tiene pantalla", "no trae caja de marca").
3. Estima el tamaño real comparado con una persona, si las medidas no están.
4. Marca DUDAS: si las fotos no coinciden con la descripción, si parecen de otra marca o modelo, si faltan datos (medidas, colores, qué incluye), o si algo es confuso.
5. Lista MARCAS O LOGOS DE TERCEROS que aparezcan en el producto o las fotos (riesgo para anuncios).

Responde SOLO este JSON válido:
{
  "descripcion_fisica": "",
  "no_tiene": [],
  "tamano": "",
  "coincide": true,
  "dudas": [],
  "marcas": []
}`;
}

// ---------- Paso 2: avatares ----------
export function promptAvatares(p) {
  const n = p.numAvatares === 1 ? 1 : 2;
  return `${contextoProducto(p)}

TAREA: Propón ${n === 2 ? "2 avatares MUY distintos entre sí (A y B) para testear con dos landings" : "1 avatar principal (A)"}, a partir de la foto, la descripción y el mercado de ${PAISES[p.pais]?.nombre || "Colombia"}.
Deben ser personas reales que compran este producto por impulso en pago contra entrega. Cada avatar necesita su propio ángulo de venta.${esMenor(p) ? `
Este producto lo USAN ${PARA_QUIEN[paraQuienDe(p)].usa}, pero lo COMPRA un adulto: cada avatar es el ADULTO que compra (mamá, papá, abuela, tía, padrino o quien regala), y en "quien" di también la edad del niño (ej. "mamá de 31 años, trabaja, con un hijo de 4 años"). El problema, las palabras y la causa son las de ese adulto. En "escena": el niño de esa edad usando el producto en una escena familiar, con ropa normal y completa.` : paraQuienDe(p) === "mascotas" ? `
Este producto es para mascotas: cada avatar es el dueño o dueña (di qué mascota tiene), y en "escena" sale la mascota usando el producto.` : ""}

Para cada avatar llena:
- quien: edad, sexo, ocupación y situación de vida
- problema: su problema o deseo principal
- probado: qué ha probado y por qué no le sirvió
- frase: una frase que diría con sus propias palabras (natural del país)
- palabras: 3 o 4 frases CORTAS y TEXTUALES con las que esta persona describe su problema o deseo cuando se queja con una amiga (como se dice en ${PAISES[p.pais]?.nombre || "Colombia"}), separadas por " / ". Ej. para caída del cabello: "se me cae a puñados / se me ve el cuero / el cepillo queda lleno"
- causa: la CAUSA REAL de su problema explicada en 1 o 2 frases simples, y por qué lo que ya probó no le sirvió ("No es X ni Y: es Z"). Debe ser cierta y fácil de comprobar en su día a día; sin diagnósticos, sin cifras ni estudios inventados. Si el producto no resuelve un problema (regalo, decoración, gusto), la causa es por qué hoy no tiene eso que desea o por qué las opciones que conoce no le convencen.
- mecanismo: en 1 o 2 frases, por qué ESTE producto ataca justo esa causa, solo con lo que dice la ficha
- angulo: el ángulo de venta para este avatar (debe salir de la causa real)
- titular: el titular de la imagen 1 (oferta) en 2 líneas cortas, separadas por " / "
- escena: escena y modelo de las fotos (edad, aspecto, ropa, lugar)
- tono: tono del texto para este avatar

Responde SOLO este JSON válido:
{ "avatares": [ { "id": "A", "quien": "", "problema": "", "probado": "", "frase": "", "palabras": "", "causa": "", "mecanismo": "", "angulo": "", "titular": "", "escena": "", "tono": "" }${n === 2 ? `, { "id": "B", "quien": "", "problema": "", "probado": "", "frase": "", "palabras": "", "causa": "", "mecanismo": "", "angulo": "", "titular": "", "escena": "", "tono": "" }` : ""} ] }`;
}

const resumenAvatares = (p) => (p.avatares || []).map(a =>
  `AVATAR ${a.id}: ${a.quien || ""} | Problema: ${a.problema || ""} | Sus palabras: ${a.palabras || a.frase || ""} | Causa real: ${a.causa || ""} | Por qué esto sí: ${a.mecanismo || ""} | Ángulo: ${a.angulo || ""} | Escena: ${a.escena || ""} | Tono: ${a.tono || ""} | Titular imagen 1: ${a.titular || ""}`
).join("\n") || "(sin avatares)";

// Colores de marca fijos (Mi plantilla)
const acabadoDe = (p) => ACABADOS[p?.plantilla?.acabado] ? p.plantilla.acabado : "impacto";
const acabadoTexto = (p) => ACABADOS[acabadoDe(p)].prompt;

const coloresFijos = (p) => (p?.plantilla?.colores?.modo === "fijos" ? p.plantilla.colores : null);
function coloresFijosTexto(p) {
  const c = coloresFijos(p);
  if (!c) return "";
  return `
COLORES FIJOS DE LA MARCA (obligatorios en los 3 estilos): fondo ${c.fondo}, titular línea 1 ${c.color1}, titular línea 2 ${c.color2}, acento ${c.acento}. Los 3 estilos usan esos colores; cambia solo la tipografía, las tarjetas, el tipo de foto y el tono.`;
}

// ---------- Paso 3: estilos ----------
export function promptEstilos(p, usados = []) {
  return `${contextoProducto(p)}

AVATARES:
${resumenAvatares(p)}

ESTILOS YA USADOS (NO los repitas ni hagas uno parecido):
${lista([...ESTILOS_BASE_USADOS, ...usados])}

TAREA: Propón 3 estilos visuales DISTINTOS entre sí para la landing de este producto, pensados para su cliente.
Cada estilo es una identidad completa de CAMPAÑA: el mundo donde pasan las fotos (lugar, ambiente y luz, como una campaña de marca grande), colores con código hex, tipografía, recursos gráficos que la hacen reconocible, tipo de tarjetas, personas y tono.
Ejemplo del nivel que quiero (otro producto, no lo copies): mundo = "campaña de marca de gimnasio: deportistas reales con piel con textura y un poco de sudor, luz dramática de gimnasio o de estadio de noche"; recursos = "líneas diagonales de velocidad en cian, titulares ligeramente inclinados, leve brillo cian en los acentos".
Lo que siempre se mantiene en cualquier estilo: titular de dos líneas con dos colores y barra de confianza abajo; en las imágenes que llevan precio (portada, paquetes y cierre), precio protagonista con el "antes" tachado y sello de descuento.
Recuerda: venta directa (empuja a comprar), no editorial. El rojo vende si encaja con el producto.
Acabado que pide el dueño (los 3 estilos lo respetan): ${acabadoTexto(p)}${coloresFijosTexto(p)}

Responde SOLO este JSON válido:
{ "estilos": [ {
  "nombre": "",
  "idea": "",
  "fondo": "",
  "color1": "",
  "color2": "",
  "acento": "",
  "tipografia": "(descríbela por cómo se ve, SIN nombres de fuentes: ej. 'condensada alta en mayúsculas, estilo póster')",
  "mundo": "(el lugar, ambiente y luz de la campaña: concreto y con emoción)",
  "recursos": "(2 o 3 recursos gráficos que se repiten en todas las imágenes)",
  "producto_en_uso": "(cómo se ve el producto puesto o usándose: en qué parte del cuerpo o del lugar, en qué posición, y su tamaño comparado con algo de la escena usando las medidas reales; y qué colores/variantes existen)",
  "tarjetas": "",
  "precio_caja": "",
  "tipo_foto": "producto / estilo de vida / deportiva",
  "personas": "",
  "tono": "",
  "por_que": ""
} ] }`;
}

// ---------- Bloque de estilo (se arma sin IA, con la plantilla de la guía) ----------
// Quita una palabra repetida al inicio ("Tarjetas blancas" → "blancas")
function sinPrefijo(valor, palabra) {
  const v = String(valor || "").trim();
  return v.replace(new RegExp(`^${palabra}\\s+`, "i"), "");
}

// Une "lo que no tiene" de la ficha y de la revisión, sin repetir
export function listaNoTiene(texto, lista = []) {
  const items = [
    ...String(texto || "").split(/[;\n]|,(?![^(]*\))/),
    ...(Array.isArray(lista) ? lista : [])
  ]
    .map(x => String(x).trim().replace(/^no\s+(tiene|trae|incluye)\s+/i, "").replace(/\.$/, ""))
    .filter(Boolean);
  const vistos = new Set();
  return items.filter(x => { const k = x.toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true; });
}
export function construirBloqueEstilo(p) {
  const e = p.estilo || {};
  const f = p.ficha || {};
  const r = p.revision || {};
  const pais = PAISES[p.pais] || PAISES.CO;
  const noTiene = listaNoTiene(f.noTiene, r.noTiene).join("; ");
  const tarjetas = sinPrefijo(e.tarjetas, "tarjetas");
  const caja = sinPrefijo(e.precio_caja, "caja");
  const cf = coloresFijos(p);
  const fondo = cf ? cf.fondo : e.fondo;
  const color1 = cf ? cf.color1 : e.color1;
  const color2 = cf ? cf.color2 : e.color2;
  const acento = cf ? cf.acento : (e.acento || e.color2);
  const normal = esNormal(p);

  return limpiarFuentes(`${normal
    ? `Crea una imagen cuadrada 1:1 (1080x1080) para la página de producto de una tienda Shopify en ${pais.nombre}, en español. Poco texto dentro de la imagen: titular corto y etiquetas; el texto largo va al lado, en Shopify.`
    : `Crea una imagen vertical 9:16 (1080x1920) para una landing page de ecommerce en ${pais.nombre}, en español.`}
TIPO DE IMAGEN: FOTOGRAFÍA REAL ${e.mundo ? `como de ${limpio(e.mundo, 400)}` : `de ${e.tipo_foto || "producto y estilo de vida"}, como de campaña publicitaria de una marca grande`}: personas reales, piel con textura real, luz con intención (no plana). PROHIBIDO: dibujo, ilustración, caricatura, animación o 3D.
DISEÑO GRÁFICO (encima de la foto): fondo ${fondo || "oscuro"}; titulares en ${limpiarFuentes(e.tipografia) || "letra sans extra gruesa"}, una línea en ${color1 || "blanco"} y otra en ${color2 || "color de acento"}; tarjetas ${tarjetas || "con bordes redondeados"}; íconos de línea en ${acento || "color de acento"}; ${normal ? `cuando la imagen lleve precio, va dentro de una caja ${caja || "de color de acento"}` : `cuando la imagen lleve precio (solo portada, paquetes y cierre), va grande dentro de una caja ${caja || "de color de acento"} con sello de descuento circular`}${e.recursos ? `; recursos que se repiten en todas las imágenes: ${limpio(e.recursos, 300)}` : ""}.
${acabadoTexto(p)}
REGLA: el producto es el protagonista y se ve nítido y completo, pero SIEMPRE a su tamaño real junto a las personas y los objetos: nunca lo agrandes. Si quieres que se vea más, acerca la cámara o ponlo en primer plano. Ningún texto lo tapa. Estilo de venta directa, no editorial.
PRODUCTO: usa EXACTAMENTE el producto de la foto adjunta: ${r.descripcionFisica || f.descripcion || p.nombre}.${e.producto_en_uso ? ` En uso: ${limpio(e.producto_en_uso, 500)}.` : ""}${f.variantes ? ` Variantes que existen: ${limpio(f.variantes, 200)}.` : ""}${noTiene ? ` NO tiene ni trae: ${noTiene}.` : ""} No agregues piezas, logos ni marcas. Cuando se está usando, lleva solo las piezas que van puestas (un solo accesorio a la vez); los repuestos sueltos van solo en la imagen de "qué incluye".
TAMAÑO REAL: ${f.medidas || r.tamano || "(indicar medidas)"}. ${referenciaTamano(f.medidas || r.tamano)} Respeta esa escala exacta junto a manos, personas y muebles.
PERSONAS: ${e.personas || (PARA_QUIEN[paraQuienDe(p)].personas ? `${PARA_QUIEN[paraQuienDe(p)].personas}, de ${pais.nombre}, aspecto latino natural` : `adultos de ${pais.nombre}, aspecto latino natural`)}.${esMenor(p) ? " Los menores siempre con ropa normal y completa, en escenas cotidianas y familiares; nada sugestivo." : ""}
TEXTO: escribe los textos exactamente como te los doy, con tildes y signos de español, sin errores ni texto extra, y cada uno UNA sola vez. Los nombres de letras, colores y estas instrucciones NO se escriben en la imagen.
NADA VACÍO: no dibujes recuadros, círculos ni marcos vacíos. Las tarjetas de reseñas y chats van blancas y LLENAS con el texto de cada cliente.`);
}

// ---------- Paso 4: proponer secciones ----------
// plantilla: Mi plantilla del formato (orden fijo si usarOrden)
export function seccionesFijas(p, plantilla) {
  if (!plantilla?.usarOrden) return null;
  const tienePaquetes = !!String(p.ficha?.paquetes || "").trim();
  return plantilla.orden
    .filter(x => x.visible && (x.tipo !== "paquetes" || tienePaquetes))
    .map(x => x.tipo);
}

export function promptPropuestaSecciones(p, plantilla = null) {
  const n = p.numAvatares === 1 ? 1 : 2;
  const normal = esNormal(p);
  const validos = tiposDe(claveDe(normal ? "normal" : "ban", p.tipo));
  const moda = p.tipo === "moda";
  const catalogo = validos.map(k => `- ${k} [${ETAPAS_AIDA[etapaDe(k)].nombre}]: ${SECCIONES[k].titulo}. ${SECCIONES[k].def}`).join("\n");
  const fijas = seccionesFijas(p, plantilla);

  const estructura = fijas
    ? `TAREA: La estructura YA ESTÁ DEFINIDA por el dueño (Mi plantilla). Devuelve EXACTAMENTE estas ${fijas.length} secciones, en este orden, sin agregar ni quitar: ${fijas.join(", ")}.
Para cada una escribe un título propio para este producto, su propósito y una composición.`
    : normal
      ? `TAREA: Arma la estructura de la LANDING NORMAL de 6 a 8 secciones para este producto, eligiendo del catálogo.
- La primera SIEMPRE es "galeria" (las fotos cuadradas de la galería de Shopify).
- Orden base recomendado: ${moda ? "galeria, moda_vistas, moda_material, moda_fuera_estudio, resenas, moda_guia_tallas, moda_por_que, moda_cambio_talla, numeros_reales, como_funciona" : "galeria, dolor, causa, funcion_estrella, resenas, antes_despues, como_se_usa, detalles, para_quien, numeros_reales, como_funciona, por_que_aqui"}. Ajústalo al producto.
- Las preguntas frecuentes van como texto en Shopify: no las pongas como imagen salvo que aporten mucho.`
      : `TAREA: Arma la estructura de la landing de 8 a 9 secciones para este producto, eligiendo del catálogo.
${moda ? `Es MODA. La primera SIEMPRE es "moda_portada". Orden base recomendado: moda_portada, moda_precio_tallas, moda_vistas, moda_material, moda_fuera_estudio, resenas, moda_guia_tallas, moda_por_que, moda_cambio_talla, numeros_reales, preguntas.` : `Orden base recomendado: oferta, dolor, causa (la verdadera causa), función estrella, reseñas, detalles o qué incluye, tamaño/variantes, cómo se usa, para quién es, números reales (entregas), por qué comprar aquí, preguntas frecuentes.`} Ajústalo al producto:
- La última o penúltima es "preguntas".`;

  return `${contextoProducto(p)}

AVATARES:
${resumenAvatares(p)}

ESTILO ELEGIDO: ${p.estilo?.nombre || ""} — ${p.estilo?.idea || ""}

CATÁLOGO DE TIPOS DE SECCIÓN:
${catalogo}

${estructura}
${fijas ? "" : `- Sigue el orden AIDA (cada tipo del catálogo dice su etapa): primero ATENCIÓN, luego INTERÉS (el problema con sus palabras y "causa": la causa real), luego DESEO (por qué esto sí lo resuelve) y al final ACCIÓN (precio, cómo llega, garantía, dudas). ${moda ? "" : `Incluye "causa" justo después de "dolor" salvo que el producto no resuelva ningún problema (regalo, decoración).`}
`}- PRUEBA SOCIAL: la gente compra cuando ve que otros ya compraron. Incluye "resenas" temprano (justo después de la función estrella o del antes y después), y "numeros_reales" antes de paquetes o del cierre. "resumen_resenas" solo si hay calificación real o al menos 3 reseñas con estrellas.
- "paquetes" solo si hay paquetes; "tamano_variantes" solo si hay tallas, colores o el tamaño importa; "que_incluye" si llegan varias piezas o hay regalo.
${n === 2 ? `- Hay 2 landings (A y B) que SOLO cambian en lo que le habla al avatar. Marca grupo "A/B" en: ${normal ? "galeria" : (moda ? "moda_portada" : "oferta")}, dolor (o identificación) y para_quien. Todo lo demás es grupo "compartida".` : `- Hay una sola landing: todas las secciones son grupo "compartida".`}
- Asigna a cada sección una COMPOSICIÓN distinta para que no se vea plana ni repetida (diagonal, franjas, collage, cuadrícula, zigzag, primer plano, partida en dos, producto central con círculos, tarjetas apiladas...). No repitas composición en secciones seguidas.
- formato: ${normal ? `"1:1" siempre (imágenes cuadradas de Shopify)` : `"9:16" casi siempre; "1:1" o "16:9" solo si la sección lo necesita (por ejemplo un antes/después cuadrado)`}.

Responde SOLO este JSON válido:
{ "secciones": [ { "tipo": "", "titulo": "", "grupo": "${n === 2 ? "A/B o compartida" : "compartida"}", "formato": "${normal ? "1:1" : "9:16"}", "composicion": "", "proposito": "" } ] }`;
}

// ---------- Paso 4b: prompt de UNA sección ----------
const NOMBRE_FORMATO = { "9:16": "vertical 9:16 (1080x1920)", "1:1": "cuadrada 1:1 (1080x1080)", "4:5": "vertical 4:5 (1080x1350)", "16:9": "horizontal 16:9 (1920x1080)" };

// Secciones que llevan precio. En el resto el precio no va: repetido en cada imagen le quita espacio al mensaje.
export const SECCIONES_CON_PRECIO = new Set(["oferta", "moda_portada", "moda_precio_tallas", "paquetes", "oferta_cierre"]);
export const llevaPrecio = (tipo, normal = false) => normal ? ["paquetes", "oferta_cierre", "moda_precio_tallas"].includes(tipo) : SECCIONES_CON_PRECIO.has(tipo);

export function promptSeccion(p, seccion, avatar, otras = []) {
  const tipo = CATALOGO_SECCIONES[seccion.tipo];
  const normal = esNormal(p);
  const formatoBase = normal ? "1:1" : "9:16";
  const formato = seccion.formato && seccion.formato !== formatoBase && NOMBRE_FORMATO[seccion.formato]
    ? `\nIMPORTANTE: esta imagen NO es ${formatoBase}, es ${NOMBRE_FORMATO[seccion.formato]}. Escríbelo al inicio del prompt.`
    : "";
  const variante = varianteDe(seccion.tipo, seccion.variante);
  const diseno = variante ? `\nDISEÑO OBLIGATORIO DE ESTA SECCIÓN (Mi plantilla: "${variante.nombre}"): ${variante.desc}` : "";
  const galeria = normal && seccion.tipo === "galeria";
  const deslizador = normal && seccion.tipo === "antes_despues";
  const conPrecio = llevaPrecio(seccion.tipo, normal);
  return `${contextoProducto(p)}

${avatar ? `${bloqueAvatar(avatar, "ESTA IMAGEN LE HABLA AL AVATAR")}
Titular sugerido imagen 1: ${avatar.titular || ""}
Escena y modelo: ${avatar.escena || ""}` : `ESTA IMAGEN ES IGUAL PARA TODAS LAS LANDINGS: no la enfoques en un solo avatar.${(p.avatares || [])[0]?.causa ? `
Causa real del problema (para mantener el mismo mensaje en toda la landing): ${p.avatares[0].causa}
Por qué este producto sí: ${p.avatares[0].mecanismo || ""}` : ""}`}

ETAPA AIDA DE ESTA SECCIÓN: ${ETAPAS_AIDA[etapaDe(seccion.tipo)].nombre.toUpperCase()}: ${ETAPAS_AIDA[etapaDe(seccion.tipo)].meta}.
Usa las MISMAS palabras del cliente y el mismo mensaje de la causa real que el resto de la landing y los anuncios (la página repite lo que dijo el anuncio).

BLOQUE DE ESTILO (el dueño lo pega antes de tu prompt; NO lo repitas):
${p.bloqueEstilo || construirBloqueEstilo(p)}

OTRAS SECCIONES DE ESTA LANDING (no repitas sus titulares ni su composición):
${otras.map(o => `- ${o.titulo} (${o.composicion || "sin composición"})`).join("\n") || "(ninguna)"}

${EJEMPLO_NIVEL}

SECCIÓN A ESCRIBIR: ${seccion.titulo} [tipo: ${seccion.tipo}]
Qué debe tener: ${tipo?.def || seccion.proposito || ""}
Propósito: ${seccion.proposito || ""}
Composición asignada: ${seccion.composicion || "elige una que no se repita"}${diseno}${formato}${seccion.tipo === "resenas" ? bloqueResenas(p) : ""}${seccion.tipo === "moda_chats" ? bloqueChats(p) : ""}${seccion.tipo === "numeros_reales" ? bloqueNumeros(p) : ""}${seccion.tipo === "resumen_resenas" ? bloqueCalificacion(p) : ""}${seccion.tipo === "pagas_al_recibir" ? bloquePagasAlRecibir(p) : ""}${seccion.tipo === "causa" ? `
CÓMO HACER "LA VERDADERA CAUSA": foto real de la escena con un gráfico MUY simple encima (líneas tipo tiza, flecha, lupa o etiquetas tachadas). Titular tipo "No es X, es Y" o "El problema no es lo que crees". Máximo 3 textos cortos además del titular. Cierra con la frase puente al producto. Nada de anatomía detallada, nada médico.` : ""}${diseno ? `
(El diseño de Mi plantilla define DÓNDE van los bloques; la imagen sigue siendo una escena de foto real con vida, no un catálogo plano.)` : ""}

${galeria ? `TAREA: Esta sección son las 4 FOTOS CUADRADAS 1:1 DE LA GALERÍA de Shopify (las primeras que ve el cliente). Escribe 4 prompts, uno por foto, cada uno con EXACTAMENTE este formato (texto plano, sin markdown, sin explicaciones):

FOTO 1 — [qué muestra]
FOTOGRAFÍA REAL (no dibujo, no animación). Imagen cuadrada 1:1.
COMPOSICIÓN: [...]
TEXTOS: [muy pocos textos, cada uno entre comillas y con su color; sin precio]

(igual para FOTO 2, FOTO 3 y FOTO 4: 1) producto con sus beneficios, 2) en uso, 3) detalle de calidad, 4) qué incluye o paquetes)` : deslizador ? `TAREA: Esta sección va en el DESLIZADOR ANTES/DESPUÉS de Shopify: son DOS imágenes cuadradas 1:1 con EXACTAMENTE el mismo encuadre, la misma persona y el mismo lugar. Escribe los 2 prompts con este formato (texto plano, sin markdown):

IMAGEN ANTES
FOTOGRAFÍA REAL (no dibujo, no animación). Imagen cuadrada 1:1.
COMPOSICIÓN: [...]
TEXTOS: [una etiqueta "ANTES" y como máximo una frase corta]

IMAGEN DESPUÉS
FOTOGRAFÍA REAL (no dibujo, no animación). Imagen cuadrada 1:1, mismo encuadre que la anterior.
COMPOSICIÓN: [...]
TEXTOS: [una etiqueta "DESPUÉS" y como máximo una frase corta]` : `TAREA: Escribe el prompt de ESTA imagen con EXACTAMENTE este formato (texto plano, sin markdown, sin explicaciones antes ni después):

IDEA: [una frase: el momento o la historia que cuenta esta imagen]
FOTOGRAFÍA REAL (no dibujo, no animación).
COMPOSICIÓN: [una ESCENA concreta: quién (edad, aspecto, ropa), haciendo qué acción exacta, en qué lugar, desde qué ángulo de cámara, con qué luz y qué emoción. El producto PUESTO o EN USO, bien visible y a su TAMAÑO REAL comparado con las personas (para que se vea más, acerca la cámara; nunca lo agrandes ni lo compares con algo más grande que él), y di de qué color/variante es en esta imagen. Luego los elementos gráficos y dónde va cada uno (arriba, a la izquierda, abajo…)]
TEXTOS:
- Titular: "[línea 1]" (color, tamaño) / "[línea 2]" (color, tamaño: di cuál es lo más grande de la imagen)
- [subtítulo, tarjetas o chips con ícono, etiquetas${conPrecio ? ", precio (con 'antes' tachado y, si es pack, el precio por unidad), sello de descuento" : ""}${normal ? "" : ", barra inferior"}: cada texto entre comillas, con su color, tamaño y posición]
ZONA LIBRE: [si el dueño debe pegar algo después (GIF, logo, reseñas, transportadoras), di DÓNDE queda una zona lisa del mismo fondo, SIN dibujar recuadros, círculos ni marcos; si no aplica escribe "ninguna"]`}
${normal && !galeria ? `
Al final agrega el texto que va AL LADO de la imagen en Shopify (sección "Imagen con texto"), con este formato:
TEXTO PARA SHOPIFY
Título: "[máximo 8 palabras]"
Texto: "[2 o 3 frases cortas, vendedoras, sin repetir lo que ya dice la imagen]"` : ""}

Reglas para esta imagen:
- Titulares cortos (máximo 4 o 5 palabras por línea). Poco texto. El producto sin tapar y a su tamaño real.${conPrecio ? `
- Esta imagen SÍ lleva el precio, protagonista.` : `
- Esta imagen NO lleva precio: nada de precio, "antes" tachado, sello de descuento ni porcentaje (aunque el bloque de estilo hable de la caja del precio). El precio solo va en ${normal ? "Paquetes y Oferta de cierre" : "la portada, Paquetes y Oferta de cierre"}. La barra de confianza${normal ? "" : " abajo"} sí puede ir.`}
${conPrecio ? `- Usa los precios exactamente así: ${formatoPrecio(p.ficha?.precio, p.pais) || "(sin precio)"}${p.ficha?.precioAntes ? ` y antes ${formatoPrecio(p.ficha.precioAntes, p.pais)}` : ""}${porcentajeDescuento(p.ficha?.precioAntes, p.ficha?.precio) ? ` (${porcentajeDescuento(p.ficha.precioAntes, p.ficha.precio)}% de descuento)` : ""}. No inventes otros.` : `- Ningún número de precio en esta imagen.`}
- Solo promesas que sean verdad según la ficha.
- Recuerda decir lo que el producto NO tiene si hay riesgo de que la IA lo invente en esta escena.`;
}

// Ejemplo real de un prompt que funcionó (cinta de kinesiología). Le muestra a la IA el NIVEL de detalle.
const EJEMPLO_NIVEL = `EJEMPLO DEL NIVEL QUE QUIERO (es de OTRO producto: copia el nivel de detalle y de escena, NO su contenido, colores ni textos):
IDEA: un corredor en pleno salto, visto desde abajo, con la cinta en la rodilla bien visible.
FOTOGRAFÍA REAL (no dibujo, no animación).
COMPOSICIÓN: un deportista latino corriendo en una pista de atletismo de noche bajo reflectores, captado en pleno salto desde un ángulo bajo, con la pierna adelantada flexionada. En su rodilla lleva el parche en T color AZUL, grande y bien visible en el centro de la imagen. Sudor y luz dramática. Líneas diagonales cian de velocidad detrás de él. A la izquierda, tres chips negros con borde cian e ícono. Abajo a la izquierda, el precio; junto al precio, un abanico de 10 parches reales en sus 4 colores con un círculo cian que diga "x10".
TEXTOS:
- Titular inclinado en tres líneas: "PACK" (blanco, pequeño) / "10 PARCHES" (cian, muy grande, lo más grande de la imagen) / "PARA TU RODILLA" (blanco)
- Subtítulo: "Cinta de kinesiología precortada para rodilla. Lista para pegar."
- Chips: "Soporte y estabilidad" · "Resiste sudor y agua" · "Sin tijeras"
- Precio: "ANTES $152.990" (gris tachado con línea roja) / "LOS 10 POR SOLO" (blanco pequeño) / "$99.990" (muy grande, negro dentro de caja cian) / "Sale a $9.999 cada parche" (blanco)
- Sello circular blanco: "-35%"
- Barra inferior negra: "Envío a toda Colombia · Pago contra entrega · Compra segura"`;

// ---------- Landing normal: textos del bloque de compra de Shopify ----------
export function promptTextosShopify(p, avatar) {
  return `${contextoProducto(p)}

${bloqueAvatar(avatar, "AVATAR AL QUE LE HABLA ESTA LANDING")}

${METODO_AIDA}

TAREA: Escribe los TEXTOS de la página de producto de Shopify (landing normal) para este avatar:
- titulo: título del producto, gancho corto con 1 emoji al inicio (máximo 12 palabras). Si hay regalo, agrégalo ("+ ¡... GRATIS! 🎁").
- frase_oferta: frase corta en mayúsculas sobre el precio (por ejemplo "RECIBE UN DESCUENTO EXCLUSIVO 👇"). Nada de urgencia falsa.
- beneficios: 4 o 5 beneficios cortos en MAYÚSCULAS (máximo 5 palabras cada uno), que irán con un ✔ verde.
- descripcion: 3 párrafos cortos en orden AIDA: 1) atención: su problema con SUS palabras; 2) interés: la causa real y por qué lo que probó no le sirvió; 3) deseo y acción: por qué este producto sí y cómo pedirlo (pago contra entrega).
- especificaciones: lista de datos reales del producto (medidas, material, qué incluye). Solo datos de la ficha.
- envio: texto corto para la pestaña "Envío y devoluciones" con el pago contra entrega y SOLO las promesas verdaderas.
- preguntas: 5 preguntas frecuentes con respuesta corta; la última SIEMPRE sobre el pago contra entrega.

Solo promesas que sean verdad según la ficha. Sin promesas médicas. Sin inventar reseñas ni cifras de ventas.

Responde SOLO este JSON válido:
{ "titulo": "", "frase_oferta": "", "beneficios": [], "descripcion": "", "especificaciones": [], "envio": "", "preguntas": [ { "pregunta": "", "respuesta": "" } ] }`;
}

// ---------- Anuncios: copys para Meta y TikTok ----------
// Método de media buyer: análisis (UVP, dolores, ángulos, alertas de políticas) → 4 copys con marcos distintos → TikTok
export const REGLAS_META = [
  "Sin atributos personales: nada de '¿Sufres de…?', '¿Estás cansado de…?', 'tu sobrepeso', 'tu edad', '¿eres soltera?'. El problema se plantea en general o en tercera persona ('Hay días que…', 'Mucha gente…', 'Ese cajón lleno de…').",
  "Sin promesas que no se puedan comprobar: nada de 'garantizado 100%', 'antirrobo', 'quita el dolor', 'cura', 'resultados en X días' ni resultados milagrosos.",
  "Cero palabras gatillo de rechazo: 'ganar dinero rápido', 'bajar de peso ya', 'sexy', 'seducir', 'provocativa', 'milagro'.",
  "Salud y cuerpo (la categoría más delicada): usa 'soporte', 'acompaña tu movimiento', 'estabilidad', 'cuidado'; nunca 'elimina molestias', 'recuperación', 'tratamiento'. Sin antes/después del cuerpo.",
  "Propiedad intelectual: 'inspirado en…', nunca 'oficial', 'original' ni 'el mismo del video' si la ficha no dice que es original. No nombres marcas ajenas.",
  "Productos sexuales o para adultos (juguetes, lubricantes, retardantes): Meta y TikTok NO permiten anunciarlos. Dilo en las alertas. Lencería sí, sin lenguaje ni poses sugestivas.",
  "Meta también revisa la landing: si el título del producto en Shopify promete un resultado de salud o algo que no se puede comprobar, el anuncio puede ser rechazado aunque el copy esté bien. Avísalo en las alertas si aplica."
];
export const REGLAS_TIKTOK = [
  "Texto del anuncio: máximo 100 caracteres (más que eso se corta con 'ver más'). Cada emoji cuenta como 2 caracteres: máximo 2 emojis. Sin llaves { } y sin hashtags en el texto del anuncio.",
  "Caption para Spark Ads (cuando se pauta un video orgánico): máximo 150 caracteres, puede llevar emojis y 2 o 3 hashtags al final.",
  "Prohibido el antes/después (peso, piel, cabello, cuerpo) y cualquier mensaje que haga sentir a la persona fea, insegura o 'menos' sin el producto.",
  "Sin atributos personales ('¿tienes acné?', '¿estás gorda?') ni preguntas que señalen a la persona.",
  "Sin afirmaciones absolutas o exageradas ('el mejor', 'número 1', 'garantizado', 'resultados inmediatos') ni clickbait ('no vas a creer lo que pasó').",
  "Sin urgencia falsa ni contadores; sin testimonios inventados ni personas creadas con IA recomendando el producto.",
  "Lo que dice el anuncio (precio, oferta, regalo, envío) tiene que ser igual a lo que dice la landing.",
  "Productos sexuales: prohibidos. Bajar de peso: muy restringido (solo +18 y sin resultados irreales). Lencería: sin desnudez ni poses sexuales.",
  "Tono TikTok: natural, como lo diría una persona en un video, no como aviso de televisión. El gancho de los primeros 3 segundos decide todo."
];
export const ENFOQUES_META = {
  aida: "AIDA: gancho que detiene el scroll → interés (la causa real o el deseo) → deseo (beneficios con emojis) → acción.",
  pas: "PAS: Problema (la situación del día a día, sin señalar a la persona) → Agitación (lo que molesta, lo que ya probó y no sirvió) → Solución (el producto, por qué sí, beneficios) → acción.",
  beneficio: "BENEFICIO DIRECTO: arranca con el resultado o la función estrella en la primera línea, lista de beneficios con ✅ o emojis, y para qué momentos sirve.",
  prueba_social: "PRUEBA SOCIAL / REGALO: arranca con lo que viven otros o con el regalo; usa SOLO la prueba social real que se te da (reseñas textuales, entregas reales, calificación real); 'Lo que recibes:' con emojis; cierra con acción."
};

export function promptCopys(p, avatar, opciones = {}) {
  const pais = PAISES[p.pais] || PAISES.CO;
  const precio = formatoPrecio(p.ficha?.precio, p.pais);
  const mencionar = [
    opciones.envio && p.ficha?.promesas?.envioGratis ? "envío gratis" : `"${pais.envio}"`,
    opciones.contraEntrega !== false ? "pago contra entrega" : null,
    opciones.precio && precio ? `el precio (${precio})` : null
  ].filter(Boolean);
  const reales = resenasReales(p).filter(r => String(r.texto || "").trim()).slice(0, 3);
  return `${contextoProducto(p)}

${bloqueAvatar(avatar, "AVATAR AL QUE LE HABLA")}

${METODO_AIDA}

ROL: actúa como un Media Buyer / Trafficker Digital de nivel élite especializado en Meta Ads (Facebook e Instagram) y TikTok Ads, y en copywriting de respuesta directa para pago contra entrega en ${pais.nombre}.

PASO 1 · ANÁLISIS (con la ficha y el avatar, no inventes nada):
- uvp: la propuesta única de valor en 1 o 2 frases.
- dolores: 3 o 4 dolores o deseos del cliente, planteados en general (sin señalar a la persona).
- angulos: 3 ángulos de venta posibles.
- alertas: riesgos de políticas de Meta y TikTok para ESTE producto y cómo evitarlos (palabras a evitar, cómo debe ser el creativo, si el título de la landing puede causar rechazo). Si es un producto que Meta o TikTok no permiten anunciar, dilo claro aquí.

PASO 2 · 4 COPYS PARA META, uno por marco de persuasión:
${Object.entries(ENFOQUES_META).map(([k, v]) => `- "${k}": ${v}`).join("\n")}
Cada copy:
- texto_principal: 8 a 14 líneas cortas con saltos de línea, ESTRUCTURADO CON EMOJIS relevantes al producto (✨ 💫 🎁 📦 💳 👉 ✅ ✔️ 🔹 1️⃣ 2️⃣ 3️⃣ y los del producto): un emoji en el gancho, uno al inicio de cada línea de beneficio y 👉 en la llamada a la acción. La PRIMERA línea es un gancho que detiene el scroll. Incluye una lista de 3 o 4 beneficios o "Lo que recibes:". Cierra con la acción ("👉 Elige tu color y pide el tuyo hoy.") y una línea de confianza con ${mencionar.join(" · ")}${opciones.precio && precio ? "" : " (NO pongas el precio)"}.
- titulo: claro, llamativo y orientado a la acción, máximo 40 caracteres (puede llevar 1 emoji).
- descripcion: refuerza la oferta, el regalo o la confianza, máximo 30 caracteres.
Español de ${pais.nombre} con TÚ, natural, como habla la gente; nada de voseo.

PRUEBA SOCIAL REAL PARA LOS COPYS (úsala tal cual; si no hay, no inventes ninguna):
${reales.length ? `Reseñas textuales (cítalas EXACTAS, con ⭐ según sus estrellas y el nombre o iniciales que trae; si no trae nombre, sin nombre):\n${reales.map(r => `- "${limpio(r.texto, 200)}"${limpio(r.nombre, 40) ? ` – ${limpio(r.nombre, 40)}` : ""}${r.ciudad ? `, ${limpio(r.ciudad, 40)}` : ""}${Number(r.estrellas) ? ` (${Number(r.estrellas)} estrellas)` : ""}`).join("\n")}` : "Reseñas: no hay. NO escribas testimonios, ni de ejemplo ni entre corchetes."}
${textoPruebaSocial(p)}

DATOS SIN CONFIRMAR: si un dato ayudaría al copy pero NO está en la ficha (material, tiempo de entrega, colores, si resiste el agua…), escríbelo entre [corchetes] para que el dueño lo confirme o lo borre antes de publicar. Lo que la ficha dice que NO es verdad no se escribe ni entre corchetes. Testimonios y cifras nunca van entre corchetes: o son reales o no van.

REGLAS DE META (estricto cumplimiento):
${lista(REGLAS_META)}

PASO 3 · TIKTOK:
- texto: el texto del anuncio, máximo 100 caracteres contando cada emoji como 2, con 0 a 2 emojis y sin hashtags.
- caption: caption para Spark Ads, máximo 150 caracteres, con emojis y 2 o 3 hashtags al final (en español, del producto o del nicho; nada de #fyp ni hashtags de marcas ajenas).
- ganchos: 3 ganchos hablados para los primeros 3 segundos del video (máximo 10 palabras cada uno), distintos entre sí.
- pantalla: 3 textos cortos para poner encima del video (máximo 6 palabras cada uno).
REGLAS DE TIKTOK (estricto cumplimiento):
${lista(REGLAS_TIKTOK)}

PASO 4 · TESTEO: en 2 o 3 frases, cómo testear estos copys (cuáles juntos en el mismo conjunto de anuncios, cuál escala con qué público, qué creativo usar en los primeros 3 segundos).

Responde SOLO este JSON válido:
{ "analisis": { "uvp": "", "dolores": [], "angulos": [], "alertas": [] },
  "meta": [ ${Object.keys(ENFOQUES_META).map(k => `{ "enfoque": "${k}", "texto_principal": "", "titulo": "", "descripcion": "" }`).join(", ")} ],
  "tiktok": { "texto": "", "caption": "", "ganchos": [], "pantalla": [] },
  "testeo": "" }`;
}

// ---------- Anuncios: prompt de un ad estático ----------
export function promptAd(p, ad, avatar, estructura, formatoInfo) {
  const precio = formatoPrecio(p.ficha?.precio, p.pais);
  const antes = formatoPrecio(p.ficha?.precioAntes, p.pais);
  const desc = porcentajeDescuento(p.ficha?.precioAntes, p.ficha?.precio);
  return `${contextoProducto(p)}

${bloqueAvatar(avatar, "ESTE ANUNCIO LE HABLA AL AVATAR")}
Escena y modelo: ${avatar?.escena || ""}

El gancho de la imagen usa SUS palabras o la causa real (Atención + Interés): que quien lo vea piense "eso me pasa a mí".

ESTILO DE LA MARCA (usa los mismos colores y tipografía; NO repitas este bloque):
${p.bloqueEstilo || construirBloqueEstilo(p)}

ANUNCIO A CREAR: imagen estática para Meta Ads / TikTok.
- Estructura: "${estructura.nombre}": ${estructura.desc}
- Formato: ${formatoInfo.nombre} (${formatoInfo.tamano}, ${formatoInfo.uso}). Escríbelo al inicio del prompt.
- ${ad.precio && precio ? `Muestra el precio exactamente así: ${precio}${antes ? ` (antes ${antes} tachado)` : ""}${desc ? ` y un sello de -${desc}%` : ""}.` : "NO muestres el precio."}
${ad.nota ? `- Nota del dueño: ${limpio(ad.nota, 300)}` : ""}

TAREA: Escribe el prompt para Gemini con EXACTAMENTE este formato (texto plano, sin markdown, sin explicaciones):

FOTOGRAFÍA REAL (no dibujo, no animación). Imagen ${formatoInfo.nombre} (${formatoInfo.tamano}) para un anuncio de redes sociales.
COMPOSICIÓN: [escena, posición y tamaño del producto, personas con edad/aspecto/ropa, luz, elementos gráficos y dónde va cada uno]
TEXTOS:
- Gancho: "[máximo 6 palabras]" (color)
- [resto de textos, cada uno entre comillas y con su color; máximo 20 palabras en total en la imagen]
ESPACIO SEGURO: [en 9:16 deja libre el 14% de arriba y el 20% de abajo para los botones de la app; en 1:1 y 4:5 deja márgenes de 5%]

Reglas:
- El producto grande, protagonista y sin tapar. Poco texto: Meta muestra menos los anuncios con mucho texto.
- Sin cifras inventadas (clientes, estrellas, reseñas, "+15.000 vendidos"), sin urgencia falsa, sin antes/después corporales exagerados, sin marcas ajenas.
- No le hables a la persona de una condición personal ("¿tienes…?"); habla de la situación.`;
}

// ---------- Paso 5: notas antes de publicar ----------
export function promptNotas(p) {
  const secciones = (p.secciones || []).map(s => `- ${s.titulo} [${s.grupo}]\n${(s.prompt || "").slice(0, 600)}`).join("\n");
  return `${contextoProducto(p)}

AVATARES:
${resumenAvatares(p)}

PROMPTS ESCRITOS:
${secciones || "(ninguno)"}

TAREA: Escribe las NOTAS ANTES DE PUBLICAR para el dueño:
- dudas: cosas que no están claras del producto o de las fotos
- riesgos: marcas de terceros, promesas delicadas, posibles devoluciones, cosas que Meta podría rechazar
- por_confirmar: datos que el dueño debe confirmar antes de publicar (medidas, tiempos, garantía, stock, colores)
- revisar_en_imagenes: errores típicos a revisar cuando salgan las imágenes de Gemini en ESTE producto

Responde SOLO este JSON válido:
{ "dudas": [], "riesgos": [], "por_confirmar": [], "revisar_en_imagenes": [] }`;
}

// ---------- Paso 5: guiones de voz en off ----------
export function promptGuion(p, guion, avatar) {
  const pais = PAISES[p.pais] || PAISES.CO;
  const precio = formatoPrecio(p.ficha?.precio, p.pais);
  const ref = limpio(guion.referencia, 5000);
  return `${contextoProducto(p)}

${bloqueAvatar(avatar, "AVATAR AL QUE LE HABLA ESTE ANUNCIO")}

${METODO_AIDA}

${ref ? `VIDEO DE REFERENCIA (transcripción; puede estar en inglés, chino u otro idioma):
"""
${ref}
"""
${guion.nota ? `NOTA DEL DUEÑO SOBRE EL VIDEO: ${limpio(guion.nota, 500)}` : ""}

TAREA: Reescribe este video como un guion de voz en off en español para el avatar. NO lo traduzcas literal: conserva la estructura y lo que lo hace funcionar (el gancho, el ritmo, las escenas), pero con palabras naturales de ${pais.nombre} y hablándole directo al avatar.`
: `TAREA: No hay video de referencia. Escribe un guion de voz en off original para el avatar, basado en su ángulo de venta y pensado para un video UGC sencillo de grabar.`}

FORMATO OBLIGATORIO DEL GUION (orden AIDA):
- Duración 25 a 30 segundos: entre 60 y 75 palabras de voz (sin contar lo que va entre corchetes).
- 0-3 s ATENCIÓN: gancho con SUS palabras ("¿Se te cae a puñados?") o la promesa.
- 3-15 s INTERÉS: la causa real en simple y por qué lo que probó no sirvió ("No es X, ni Y: es Z"). Es la parte más importante: que entienda su problema.
- 15-24 s DESEO: por qué este producto ataca esa causa y cómo se ve el resultado.
- 24-30 s ACCIÓN: precio, pago contra entrega y qué hacer.
- Entre corchetes va lo que se VE en el video, que no se lee. Ejemplo: [Primer plano de la mochila abriéndose].
- Cierre con el precio, el pago contra entrega y un llamado a la acción. El precio escríbelo como se dice en voz alta (por ejemplo "ciento nueve mil novecientos noventa pesos" o "treinta y cinco dólares con noventa y nueve"); el precio es ${precio || "(sin precio)"}.
- Español natural de ${pais.nombre}, frases cortas, fácil de leer en voz alta (sirve para voz de CapCut o para grabar).
- Si el video cuenta una historia real (una persona, un animal, una noticia), pasa del relato al producto con una frase puente (por ejemplo "Pero la historia no terminó ahí") y lista los datos de la historia que el dueño debe verificar.

REGLAS DE ANUNCIOS:
- Sin promesas médicas ni resultados exagerados; sin "original" u "oficial" si la ficha no lo dice; sin inventar testimonios ni cifras de ventas.
- No le digas a la persona que tiene una condición personal sensible (salud, peso, edad, problemas personales): habla de la situación, no de sus atributos. Meta rechaza esos anuncios.
- Solo promesas que sean verdad según la ficha (envío gratis, garantía...).

Responde SOLO este JSON válido:
{
  "guion": "",
  "ganchos_alternativos": ["", "", ""],
  "historia_real": false,
  "verificar": []
}`;
}
