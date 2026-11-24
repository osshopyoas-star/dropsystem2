import { limpiarFuentes } from "./public/js/core/fuentes.js";
// =============================================
// 🖼️ PROMPTS DEL ESTUDIO DE LANDING (Desarrollo)
// Basados en la "Guía de trabajo: landings y creativos con IA".
// Aquí vive tu método: si aprendes una regla nueva, agrégala en REGLAS_APRENDIDAS
// y todas las landings nuevas la tendrán en cuenta.
// =============================================

import { SECCIONES, FORMATOS, varianteDe, tiposDe, claveDe, ACABADOS, ETAPAS_AIDA, etapaDe, ORDEN_BASE, llevaBarra } from "./public/js/core/plantilla.js";
import { cifraPrueba } from "./public/js/core/finanzas.js";
import { ofertaDe } from "./public/js/core/oferta.js";
import { variantesDe, variantesTexto, colorDeSeccion, PORTADAS_V, SECCION_VARIANTES } from "./public/js/core/variantes.js";

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
  "Sellos y logos de entidades: NUNCA pongas logos de la Superintendencia de Industria y Comercio, la Cámara de Comercio Electrónico, el INVIMA, bancos u otras entidades, ni 'tienda verificada', 'compra verificada' o certificados. Transportadoras: solo las que la ficha dice, como 'Enviamos con…' (nunca 'aliadas', 'oficial' ni convenios). La confianza sale de lo que es verdad: pagas al recibir, envío a todo el país, tiempo de entrega, garantía si existe y tus números reales.",
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
` : "- Sin tiempo de entrega en la Ficha: no escribas días\n"}${pr.transportadoras ? `- "Enviamos con ${limpio(normalizarTransportadoras(pr.transportadoras), 120)}" (sus nombres en círculos o chips; nunca "aliadas" ni "oficial")\n` : ""}${pr.garantia ? `- Garantía: "${limpio(pr.garantia, 60)}"
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

// Transportadoras: siempre bien escritas (Interrreapidisimo → Interrapidísimo)
const TRANSPORTADORAS = [[/inter\s*-?\s*r+[a-z]{0,3}?p+i+d+[ií]s+i+m+o/i, "Interrapidísimo"], [/servi\s*-?\s*entr?ega/i, "Servientrega"], [/^env[ií]a$/i, "Envía"], [/coordi?nadora/i, "Coordinadora"], [/^t\.?c\.?c\.?$/i, "TCC"], [/depris+a/i, "Deprisa"]];
export function normalizarTransportadoras(txt) {
  return String(txt || "").split(/\s*(?:,|;|\/|\by\b|\be\b)\s*/i).map(x => x.trim()).filter(Boolean)
    .map(x => (TRANSPORTADORAS.find(([re]) => re.test(x.normalize("NFC")))?.[1]) || x)
    .filter((x, i, a) => a.indexOf(x) === i).join(", ");
}
const corregirTransportadoras = (l) => l.replace(/inter\s*-?\s*r+[a-záéíóú]{0,3}?p+i+d+[ií]s+i+m+o/gi, "Interrapidísimo").replace(/servi\s*-?\s*entr?ega/gi, "Servientrega");
// Medidas de la Ficha (una sola medida tipo "26 x 20 cm"): la IA no las redondea
const RE_MEDIDA = /\d+(?:[.,]\d+)?\s*[x×X]\s*\d+(?:[.,]\d+)?(?:\s*[x×X]\s*\d+(?:[.,]\d+)?)?\s*cm/g;
const medidaFicha = (p) => { const m = String(p?.ficha?.medidas || "").match(RE_MEDIDA); return m && m.length === 1 ? m[0].replace(/\s*[xX×]\s*/g, " × ") : ""; };

// ---------- 2.5 Cero promesas inventadas: solo si la Ficha lo dice ----------
const textoFicha = (p) => { const f = p?.ficha || {}, pr = f.promesas || {}, r = p?.revision || {};
  return [f.descripcion, f.notas, f.medidas, r.descripcionFisica, pr.garantia, pr.entrega].map(x => String(x || "")).join(" ").toLowerCase(); };
export const PROMESAS_RIESGO = [
  { nombre: "impermeable", re: /impermeable|a prueba de agua|resistente al agua|waterproof/i, ok: (t) => /impermeable|prueba de agua|resistente al agua/.test(t) },
  { nombre: "lavable o fácil planchado", re: /lavable|se puede lavar|f[aá]cil (?:de )?(?:lavar|planchar|planchado)|lav(?:a|ar) en lavadora|planchado|no necesita plancha|no se arruga/i, ok: (t) => /lavable|lavar|lavadora|planch|arrug/.test(t) },
  { nombre: "no se oxida / inoxidable", re: /no se oxida|inoxidable|anti\s?[óo]xido|antioxid/i, ok: (t) => /inoxidable|oxid/.test(t) },
  { nombre: "no se gasta / irrompible / de por vida", re: /no se (?:gasta|desgasta|desti[ñn]e|rompe|deforma|rasga)|irrompible|indestructible|de por vida|para siempre|dura a[ñn]os/i, ok: () => false },
  { nombre: "cambio o devolución gratis", re: /(?:cambio|cambia|devoluci[oó]n|devuelve)[a-z ]{0,20}gratis|te devolvemos (?:tu|el) dinero|cambio de talla sin costo/i, ok: (t) => /cambio|devoluci|devolvemos/.test(t) },
  { nombre: "garantía", re: /garant[ií]a/i, ok: (_, p) => !!p?.ficha?.promesas?.garantia },
  { nombre: "entrega hoy o el mismo día", re: /(?:entrega|rec[ií]belo|recibe tu pedido|llega|te llega)[a-z ]{0,12}(?:hoy|el mismo d[ií]a|en 24 ?h)|mismo d[ií]a|entrega inmediata/i, ok: (_, p) => /hoy|mismo d[ií]a|24 ?h/i.test(String(p?.ficha?.promesas?.entrega || "")) },
  { nombre: "número de clientes o vendidos", re: /\+?\s?\d[\d.]*\s*(?:mil\s*)?(?:clientes|vendid|compradores|pedidos|personas felices|hinchas|usuarios)/i, ok: (_, p) => !!numerosPrueba(p) },
  { nombre: "calificación inventada", re: /\b[34][.,]\d\s*(?:\/\s*5|estrellas|★|de 5)|calificaci[oó]n/i, ok: (_, p) => resenasReales(p).length >= 2 }
];
export function promesasFalsas(p) {
  const t = textoFicha(p);
  return PROMESAS_RIESGO.filter(x => !x.ok(t, p));
}
const TIPOS_TALLAS = new Set(["moda_guia_tallas", "tamano_variantes", "moda_precio_tallas"]);
const cuidadoEnFicha = (p) => /lav|planch|secad|cuidado/.test(textoFicha(p));

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
    pr.entrega ? `Tiempo de entrega: ${limpio(pr.entrega, 60)}` : null,
    pr.transportadoras ? `Enviamos con: ${limpio(normalizarTransportadoras(pr.transportadoras), 120)} (escríbelo "Enviamos con …" o sus nombres en círculos; nunca "aliadas", "oficial" ni convenio)` : null
  ].filter(Boolean);

  return `
PRODUCTO: ${limpio(p.nombre, 200)}
PAÍS: ${pais.nombre} (moneda ${pais.moneda})
DESCRIPCIÓN DEL PROVEEDOR:
${limpio(f.descripcion, 4000) || "(sin descripción)"}

DESCRIPCIÓN FÍSICA VERIFICADA: ${limpio(r.descripcionFisica, 2000) || "(aún no verificada)"}
TAMAÑO REAL: ${limpio(f.medidas || r.tamano, 300) || "(sin medidas: pídelas en las notas)"}${f.medidas ? " (si las escribes en la imagen, cópialas EXACTAS: no las redondees)" : ""}
LO QUE NO TIENE NI TRAE: ${limpio(listaNoTiene(f.noTiene, r.noTiene).join("; "), 800) || "(no indicado)"}
VARIANTES / TALLAS / COLORES${variantesDe(f).colores.length || variantesDe(f).tallas.length ? " (nombres EXACTOS, escríbelos tal cual)" : ""}: ${limpio(variantesTexto(f), 400) || "(una sola versión)"}
PRECIO: ${precio || "(sin precio)"}${antes ? ` · ANTES: ${antes}` : ""}${desc ? ` · DESCUENTO: ${desc}%` : ""}${f.precioEn === "releasit" ? " · DÓNDE VA: NO en la portada (va en el formulario de Releasit, paquetes y oferta de cierre)" : f.precioEn === "solo_releasit" ? " · DÓNDE VA: en NINGUNA imagen (solo en el formulario de Releasit)" : ""}
${(() => {
  const o = ofertaDe(f, p.pais === "EC" ? "EC" : "CO");
  if (o.tipo === "descuento") return `PAQUETES: ${limpio(f.paquetes, 500) || "(no hay paquetes)"}
REGALO: ${limpio(f.regalo, 200) || "(no hay regalo)"}`;
  return `OFERTA (la arma CoDropX; respétala tal cual en todos los textos, también en los de Shopify y Releasit): ${o.resumen}${o.textos.promo ? ` Texto de la promo: "${o.textos.promo}".` : ""}${["2x1", "xy"].includes(o.tipo) && variantesTexto(f) ? ` Hay variantes: el cliente puede escoger colores o tallas distintos en su promo (en preguntas frecuentes incluye "¿Puedo escoger colores diferentes?").` : ""}`;
})()}
PROMESAS QUE SÍ SON VERDAD (no inventes otras):
${lista(verdades)}
PRUEBA SOCIAL REAL (solo estas cifras, exactas; se pueden usar en la barra de confianza):
${textoPruebaSocial(p)}
FORMATO DE LA LANDING: ${textoFormato(p)}
${bloqueParaQuien(p) ? bloqueParaQuien(p) + "\n" : ""}${p.tipo === "moda" ? `TIPO DE PRODUCTO: MODA (ropa, calzado o accesorio). Las fotos muestran la pieza PUESTA en ${esMenor(p) ? `${({ bebes: "un bebé de 0 a 2 años", ninos: "un niño o niña de 3 a 12 años", adolescentes: "un adolescente de 13 a 17 años" })[paraQuienDe(p)]} real, natural y contento, en una escena cotidiana` : "una persona adulta real, natural, sin poses sugestivas"}; la talla, el color y el corte deben ser EXACTAMENTE los de la foto adjunta. Lista de tallas y colores siempre completa y en orden. No inventes medidas.
` : ""}PREFERENCIA DE ESTILO DEL DUEÑO: ${limpio(f.estiloPreferido, 300) || "(ninguna)"}
NOTAS DEL DUEÑO (contexto para ti: NUNCA copies a los textos de la imagen referencias, códigos, cantidades por caja ni precios de mayorista que aparezcan aquí): ${limpio(f.notas, 1000) || "(ninguna)"}
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
6. Revisa CADA foto (en el orden en que vienen, la primera es la 1) y di si es "producto" (solo el producto, sin textos encima) o "referencia" (tiene precios, referencias, códigos, logos del proveedor, varios productos o es un flyer/catálogo). Si tiene algo que la IA de imágenes podría copiar, dilo en "problema".
7. Lista los TEXTOS QUE SE VEN EN LAS FOTOS y que NO son parte del producto (precios, "Ref: …", códigos, "Caja x 100", nombre del proveedor, marcas de agua), escritos tal cual.

Responde SOLO este JSON válido:
{
  "descripcion_fisica": "",
  "no_tiene": [],
  "tamano": "",
  "coincide": true,
  "dudas": [],
  "marcas": [],
  "fotos": [{ "n": 1, "tipo": "producto", "problema": "" }],
  "textos_en_fotos": []
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
Lo que siempre se mantiene en cualquier estilo: titular de dos líneas con dos colores; barra de confianza SOLO en portada, cómo funciona, por qué comprar aquí, entrega y cierre; en las imágenes que llevan precio (portada, paquetes y cierre), precio protagonista con el "antes" tachado y sello de descuento.
ESTILO SEGÚN EL NICHO: antes de proponer, piensa en el nicho del producto y en la emoción del cliente al usarlo. Al menos 2 de los 3 estilos salen directo de ese nicho. Ejemplos: fútbol e hinchas → estadio de noche, fondo oscuro con neón del color del equipo; bares y negocios → negro y dorado; Halloween → negro y naranja; moda femenina → claro o rosado elegante; hogar y cocina → cálido y luminoso; gimnasio → oscuro con un color eléctrico.
Los 3 estilos: ALTO CONTRASTE, titulares gruesos con efecto (brillo, borde o textura) y UNA sola paleta que se repite en toda la landing.
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
// ---------- Bloque de estilo: SOLO lo que se repite en todas las imágenes, por etiquetas y en orden fijo ----------
// (la escena, la persona y la pose de cada imagen van en el prompt de esa imagen)
export const ETIQUETAS_ESTILO = [
  ["tipo", "TIPO DE IMAGEN"], ["diseno", "DISEÑO GRÁFICO"], ["precio", "PRECIO"], ["regla", "REGLA"],
  ["producto", "PRODUCTO"], ["tamano", "TAMAÑO REAL"], ["noAgregues", "NO agregues"], ["personas", "PERSONAS"], ["texto", "TEXTO"]
];
// Se llenan solos desde la Ficha (si la corriges, se actualizan aquí)
export const ESTILO_AUTO = new Set(["producto", "tamano", "noAgregues"]);
const prefijoEtiqueta = (k, t) => (k === "noAgregues" ? "NO agregues " : k === "diseno" ? "DISEÑO GRÁFICO (encima de la foto): " : `${t}: `);

// Bloques de antes (texto corrido con etiquetas): se separan por etiqueta para no perder lo corregido a mano
export function camposDeTexto(texto) {
  const out = {};
  for (const linea of String(texto || "").split("\n")) {
    for (const [k, t] of ETIQUETAS_ESTILO) {
      const pre = prefijoEtiqueta(k, t);
      const alt = k === "diseno" ? "DISEÑO GRÁFICO: " : null;
      if (linea.startsWith(pre)) out[k] = linea.slice(pre.length).trim();
      else if (alt && linea.startsWith(alt)) out[k] = linea.slice(alt.length).trim();
    }
  }
  return out;
}

export function camposEstilo(p) {
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
  const prohibidos = textosProhibidos(p);
  const base = {
    tipo: `FOTOGRAFÍA REAL de ${e.tipo_foto || (p.tipo === "moda" ? "moda" : "producto y estilo de vida")}, como de campaña publicitaria de una marca grande: personas reales, piel con textura real, luz con intención (no plana). PROHIBIDO: dibujo, ilustración, caricatura, animación o 3D.`,
    diseno: `estilo ${limpio(e.nombre, 60) || "propio"}, de COMPRA POR IMPULSO: mucho contraste, todo se lee en 2 segundos. Fondos en ${fondo || "un color oscuro"}; titulares en ${limpiarFuentes(e.tipografia) || "letra sans extra gruesa"}, una línea en ${color1 || "blanco"} y otra en ${color2 || "el color de acento"}; tarjetas ${tarjetas || "con bordes redondeados"}; íconos de línea en ${acento || "el color de acento"}${e.recursos ? `; recursos que se repiten en todas las imágenes: ${limpio(e.recursos, 300)}` : ""}. ${acabadoTexto(p)}`,
    precio: `NO pongas precio, descuento ni sello de oferta, A MENOS QUE el prompt lo pida explícitamente${caja ? `; cuando lo pida, va grande dentro de una caja ${caja}` : ""}. NO dejes círculos vacíos ni espacios en blanco.`,
    regla: "el producto es el protagonista, grande y bien visible, pero SIEMPRE a su tamaño real junto a las personas y los objetos: nunca lo agrandes (si quieres que se vea más, acerca la cámara). Ningún texto lo tapa. Estilo de venta directa, no editorial.",
    producto: `usa EXACTAMENTE el producto de las fotos adjuntas: ${r.descripcionFisica || f.descripcion || "(sin descripción)"}.${e.producto_en_uso ? ` En uso: ${limpio(e.producto_en_uso, 500)}.` : ""}${variantesTexto(f) ? ` Variantes que existen: ${limpio(variantesTexto(f), 300)}.` : ""}${noTiene ? ` NO tiene: ${noTiene}.` : ""} Cuando se está usando, lleva solo las piezas que van puestas (un solo accesorio a la vez).`,
    tamano: `${f.medidas || r.tamano || "(indicar medidas)"}. ${referenciaTamano(f.medidas || r.tamano)} Respeta esa escala exacta junto a manos, personas y muebles.`,
    noAgregues: `letras, marcas, referencias ni logos que no estén en la foto.${prohibidos.length ? ` Textos prohibidos: ${prohibidos.map(x => `"${x}"`).join(", ")}.` : ""}`,
    personas: `${e.personas || (PARA_QUIEN[paraQuienDe(p)].personas ? `${PARA_QUIEN[paraQuienDe(p)].personas}, de ${pais.nombre}, aspecto latino natural` : `adultos de ${pais.nombre}, aspecto latino natural`)}.${esMenor(p) ? " Los menores siempre con ropa normal y completa, en escenas cotidianas y familiares; nada sugestivo." : ""}`,
    texto: "escribe los textos exactamente como te los doy, con tildes y signos de español, sin errores ni texto extra, y cada uno UNA sola vez. Los nombres de letras, colores y estas instrucciones NO se escriben en la imagen. Las tarjetas de reseñas y chats van blancas y LLENAS con el texto de cada cliente."
  };
  // Lo que corregiste a mano (salvo lo que sale de la Ficha)
  const propios = p.estiloCampos && typeof p.estiloCampos === "object" ? p.estiloCampos : {};
  for (const [k] of ETIQUETAS_ESTILO) if (!ESTILO_AUTO.has(k) && typeof propios[k] === "string" && propios[k].trim()) base[k] = limpio(propios[k], 2000);
  return base;
}

export function cabeceraEstilo(p) {
  const pais = PAISES[p.pais] || PAISES.CO;
  return esNormal(p)
    ? `Crea una imagen cuadrada 1:1 (1080x1080) para la página de producto de una tienda Shopify en ${pais.nombre}, en español. Poco texto dentro de la imagen: titular corto y etiquetas; el texto largo va al lado, en Shopify.`
    : `Crea una imagen vertical 9:16 (1080x1920) para una landing page de ecommerce en ${pais.nombre}, en español.`;
}

export function construirBloqueEstilo(p) {
  const c = camposEstilo(p);
  // limpiarFuentes cambia los #hex por el nombre del color: "negro #111111" quedaría "negro negro"
  return limpiarFuentes([cabeceraEstilo(p), ...ETIQUETAS_ESTILO.map(([k, t]) => prefijoEtiqueta(k, t) + c[k])].join("\n")).replace(/\b([\p{L}]+) \1\b/giu, "$1");
}

// ---------- Paso 4: proponer secciones ----------
// plantilla: Mi plantilla del formato (orden fijo si usarOrden)
// Cuándo se salta una receta: sin reseñas reales, sin foto real, sin paquetes, sin paquete ni regalo
export const SIN_PROMPT = new Set(["foto_real"]);
export function fotosProducto(p) {
  const uso = Array.isArray(p?.ficha?.usoFotos) ? p.ficha.usoFotos : [];
  return (p?.fotos || []).map((f, i) => i).filter(i => uso[i] !== "referencia");
}
export function hayPaquetes(p) {
  const o = ofertaDe(p?.ficha || {}, p?.pais === "EC" ? "EC" : "CO");
  return (o.tipo === "paquetes" && o.paquetes.length > 0) || (o.tipo === "descuento" && montosPaquetes(p?.ficha?.paquetes, p?.pais === "EC" ? "EC" : "CO").length > 0);
}
export function saltaSeccion(p, tipo) {
  const o = ofertaDe(p?.ficha || {}, p?.pais === "EC" ? "EC" : "CO");
  if (["resenas", "moda_chats", "resumen_resenas"].includes(tipo)) return resenasReales(p).length < 2;
  if (tipo === "foto_real") return !fotosProducto(p).length;
  if (tipo === "paquetes") return !hayPaquetes(p);
  if (tipo === "que_incluye") return o.tipo === "descuento" && !String(p?.ficha?.regalo || "").trim() && !hayPaquetes(p);
  return false;
}
// Ban page: siempre el orden de Mi plantilla (o el de las recetas, si no lo has cambiado). Landing normal: la IA elige si no usas tu orden
export function seccionesFijas(p, plantilla) {
  const normal = esNormal(p);
  if (!plantilla?.usarOrden && normal) return null;
  const orden = plantilla?.usarOrden && Array.isArray(plantilla.orden) ? plantilla.orden
    : (ORDEN_BASE[claveDe(normal ? "normal" : "ban", p.tipo)] || []).map(([tipo, v]) => ({ tipo, visible: !!v }));
  const tipos = orden.filter(x => x.visible && !saltaSeccion(p, x.tipo)).map(x => x.tipo);
  return conSeccionVariantes(p, tipos);
}
// Con 2 o más variantes, la sección de colores/tallas va aunque esté apagada (justo después de la portada)
export function conSeccionVariantes(p, tipos) {
  const { colores, tallas } = variantesDe(p.ficha || {});
  if (colores.length + tallas.length < 2 || tipos.includes("que_incluye")) return tipos;
  const validos = tiposDe(claveDe(esNormal(p) ? "normal" : "ban", p.tipo));
  const vt = [...SECCION_VARIANTES].find(t => validos.includes(t) && (p.tipo === "moda") === t.startsWith("moda_")) || [...SECCION_VARIANTES].find(t => validos.includes(t));
  if (!vt || tipos.includes(vt)) return tipos;
  const i = tipos.findIndex(t => PORTADAS_V.has(t) || t === "galeria");
  const out = [...tipos]; out.splice(i >= 0 ? i + 1 : 0, 0, vt);
  return out;
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
${moda ? `Es MODA. La primera SIEMPRE es "moda_portada". Orden base recomendado: moda_portada, dolor, moda_material, resenas, foto_real, como_funciona, que_incluye, paquetes, por_que_aqui, entrega.` : `Orden base recomendado: oferta, dolor, detalles (calidad que se nota), resenas, foto_real, como_funciona, que_incluye, paquetes, por_que_aqui, entrega.`} Ajústalo al producto:
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
- formato: ${normal ? `"1:1" siempre (imágenes cuadradas de Shopify)` : `"9:16" siempre (todas las imágenes verticales)`}.

Responde SOLO este JSON válido:
{ "secciones": [ { "tipo": "", "titulo": "", "grupo": "${n === 2 ? "A/B o compartida" : "compartida"}", "formato": "${normal ? "1:1" : "9:16"}", "composicion": "", "proposito": "" } ] }`;
}

// ---------- Paso 4b: prompt de UNA sección ----------
const NOMBRE_FORMATO = { "9:16": "vertical 9:16 (1080x1920)", "1:1": "cuadrada 1:1 (1080x1080)", "4:5": "vertical 4:5 (1080x1350)", "16:9": "horizontal 16:9 (1920x1080)" };

// Secciones que llevan precio. En el resto el precio no va: repetido en cada imagen le quita espacio al mensaje.
export const SECCIONES_CON_PRECIO = new Set(["oferta", "moda_portada", "moda_precio_tallas", "paquetes", "oferta_cierre"]);
// precioEn (Ficha): "portada" (como siempre) · "releasit" (no en la portada) · "solo_releasit" (en ninguna imagen)
const PORTADAS = new Set(["oferta", "moda_portada", "galeria"]);
export const llevaPrecio = (tipo, normal = false, precioEn = "portada") => {
  if (precioEn === "solo_releasit") return false;
  if (precioEn === "releasit" && PORTADAS.has(tipo)) return false;
  return normal ? ["paquetes", "oferta_cierre", "moda_precio_tallas"].includes(tipo) : SECCIONES_CON_PRECIO.has(tipo);
};
const dondeVaPrecio = (normal, precioEn) => precioEn === "solo_releasit" ? "el formulario de Releasit (ninguna imagen lo lleva)"
  : precioEn === "releasit" ? "Paquetes, Oferta de cierre y el formulario de Releasit (la portada no)"
  : normal ? "Paquetes y Oferta de cierre" : "la portada, Paquetes y Oferta de cierre";

// ---------- Lo que CoDropX pega al final de cada prompt de sección (no lo escribe la IA, así siempre se cumple) ----------
export function margenAbajo(p, formato = "9:16", barra = true) {
  const m = Number(p?.plantilla?.margenAbajo) || 0;
  if (!m) return "";
  const alto = formato === "1:1" ? 1080 : formato === "16:9" ? 1080 : formato === "4:5" ? 1350 : 1920;
  return `\n\nMARGEN ABAJO (el botón de compra de la tienda tapa esa parte): el ${m}% de abajo de la imagen (unos ${Math.round(alto * m / 100)} px de ${alto}) va SOLO con el fondo de la escena, continuo y sin nada encima: sin textos, íconos, barra de confianza, precio, botones ni producto.${barra ? " La barra de confianza va justo ENCIMA de ese margen, nunca pegada al borde de abajo." : ""}`;
}
// ---------- Precios y textos prohibidos: los arma el código (la IA nunca escribe ni cambia un número) ----------
const soloDigitos = (s) => String(s || "").replace(/\D/g, "");
// Montos que aparecen en el texto libre de paquetes ("2 unidades $199.900", "3 x 259900", "35,99")
export function montosPaquetes(texto, pais = "CO") {
  const out = [];
  for (const m of String(texto || "").matchAll(/\$?\s?(\d{1,3}(?:[.,]\d{3})+|\d{4,7}|\d{1,3},\d{2})(?![\d%])/g)) {
    const crudo = m[1];
    const n = pais === "EC" && /^\d{1,3},\d{2}$/.test(crudo) ? Number(crudo.replace(",", ".")) : Number(crudo.replace(/[.,]/g, ""));
    if (pais === "EC" ? n > 0 && n < 10000 : n >= 1000) out.push(formatoPrecio(n, pais));
  }
  return [...new Set(out)].filter(Boolean);
}
// Textos que NO deben salir: los que escribiste en la Ficha (uno por línea)
export const textosProhibidos = (p) => {
  const propios = String(p?.ficha?.textosProhibidos || "").split("\n").map(x => x.trim().replace(/[<>]/g, "")).filter(x => x.length >= 2);
  // Textos que la revisión vio en las fotos del proveedor (frases del flyer); los cortos o de colores no, para no borrar textos buenos
  const colores = new Set(variantesDe(p?.ficha || {}).colores.map(c => c.nombre.toLowerCase()));
  const deFotos = (Array.isArray(p?.revision?.textosEnFotos) ? p.revision.textosEnFotos : []).map(x => String(x).trim().replace(/[<>"“”]/g, ""))
    .filter(x => x.length >= 6 && /\s/.test(x) && !colores.has(x.toLowerCase()));
  return [...new Set([...propios, ...deFotos])].slice(0, 30);
};

// La oferta de esta sección: qué precios y sellos puede llevar (nada más)
export function ofertaSeccion(p, seccion = {}) {
  const f = p?.ficha || {};
  const pais = p?.pais === "EC" ? "EC" : "CO";
  const normal = esNormal(p);
  const conPrecio = llevaPrecio(seccion.tipo, normal, f.precioEn || "portada");
  const of = ofertaDe(f, pais);
  const precio = formatoPrecio(f.precio, pais), antes = formatoPrecio(f.precioAntes, pais);
  const desc = porcentajeDescuento(f.precioAntes, f.precio);
  const sello = of.tipo === "descuento" || of.tipo === "regalo" || of.tipo === "paquetes" ? (desc ? `-${desc}%` : "") : "";
  const paquetes = conPrecio && of.tipo === "descuento" && ["paquetes", "oferta_cierre", "moda_precio_tallas"].includes(seccion.tipo) ? montosPaquetes(f.paquetes, pais) : [];
  // Portada sin precio (la Ficha lo pide): solo puede llevar el sello de descuento
  const selloSinPrecio = !conPrecio && PORTADAS.has(seccion.tipo) && sello ? sello : "";
  return { conPrecio, precio, antes, sello, paquetes, selloSinPrecio, oferta: of,
    montos: conPrecio ? [...new Set([...of.montos, ...paquetes])].filter(Boolean) : [],
    sellos: conPrecio ? [sello].filter(Boolean) : [selloSinPrecio].filter(Boolean) };
}
export function bloquePrecio(p, seccion = {}) {
  const o = ofertaSeccion(p, seccion);
  const of = o.oferta, t = of.textos;
  if (o.conPrecio && o.precio) {
    const lineas = ["2x1", "xy"].includes(of.tipo)
      ? [["Promo", t.promo], ["Precio", t.precio], ["Cada uno", t.cadaUno], ["Antes (tachado)", t.antes], ["Sello", t.sello]]
      : of.tipo === "paquetes" && ["paquetes", "oferta_cierre", "moda_precio_tallas"].includes(seccion.tipo) && of.paquetes.length
        ? of.paquetes.map((x, i) => [`Paquete ${i + 1}`, x.texto])
        : [["Precio", o.precio], ["Antes (tachado)", o.antes], ["Sello", o.sello], ...(of.tipo === "regalo" && t.promo ? [["Regalo", t.promo]] : [])];
    return `PRECIO (cópialo EXACTO, carácter por carácter; no lo cambies ni lo redondees):
${lineas.filter(([, v]) => v).map(([k, v]) => `- ${k}: "${v}"`).join("\n")}${o.paquetes.length ? `\n- Precios de los paquetes (solo estos): ${o.paquetes.map(x => `"${x}"`).join(", ")}` : ""}
NO escribas ningún otro valor de dinero, porcentaje ni número de precio en la imagen.`;
  }
  if (o.conPrecio) return `PROHIBIDO EN ESTA IMAGEN: la Ficha aún no tiene precio, así que no escribas precios, signos de dinero ($), porcentajes ni sellos de oferta.`;
  return `PROHIBIDO EN ESTA IMAGEN: precios, signos de dinero ($), "antes" tachado, cajas de precio${o.selloSinPrecio ? `. El único porcentaje permitido es el sello "${o.selloSinPrecio}"` : ", porcentajes, descuentos ni sellos de oferta"}.`;
}
export function bloqueOferta(p, seccion = {}) {
  const f = p?.ficha || {};
  const o = ofertaDe(f, p?.pais === "EC" ? "EC" : "CO"), t = o.textos;
  if (o.tipo === "descuento") return "";
  const tipo = seccion.tipo, portada = PORTADAS.has(tipo) && tipo !== "galeria";
  const promo = ["2x1", "xy"].includes(o.tipo);
  const variantes = variantesTexto(f);
  let txt = "";
  if (promo) {
    const gratis = o.unidades - (o.tipo === "2x1" ? 1 : Number(String(t.sello).split("x")[1]) || 1);
    if (portada) txt = `muestra ${o.unidades} unidades del producto juntas${variantes ? " (de colores o variantes distintas)" : ""} y un sticker grande "${t.sello}" con "${t.promo}".`;
    else if (tipo === "paquetes") txt = `esta sección se convierte en "Así funciona tu ${t.sello}": ${o.unidades} unidades en fila; la${gratis > 1 ? `s últimas ${gratis}` : " última"} con una cinta "¡GRATIS!". Texto principal: "${t.promo}".`;
    else if (tipo === "oferta_cierre" || tipo === "moda_precio_tallas") txt = `repite la promo con las ${o.unidades} unidades a la vista: "${t.promo}".`;
    else if (tipo === "preguntas" && variantes) txt = `incluye la pregunta "¿Puedo escoger colores diferentes?" con respuesta "Sí, escoge los que quieras en tu pedido".`;
  } else if (o.tipo === "regalo" && o.regalos.length) {
    const nombres = o.regalos.map(x => `"${x.nombre}"`).join(", ");
    if (portada) txt = `una cinta "${t.promo}" con una flecha hacia una fila de círculos, uno por regalo, con la foto real de cada regalo (adjunta) y su nombre debajo: ${nombres}. Los círculos no tapan el producto.`;
    else if (tipo === "paquetes" || tipo === "oferta_cierre") txt = `muestra el producto junto a sus regalos (${nombres}) con la cinta "${t.promo}".`;
  } else if (o.tipo === "paquetes" && o.paquetes.length && tipo === "paquetes") {
    txt = `una tarjeta por paquete, en este orden y con estos textos exactos: ${o.paquetes.map(x => `"${x.texto}"`).join("; ")}. Cada tarjeta muestra esa cantidad de unidades del producto.${o.paquetes.some(x => x.masVendido) ? ` Resalta la del "MÁS VENDIDO".` : ""}`;
  }
  return txt ? `OFERTA EN ESTA SECCIÓN (la arma CoDropX): ${txt}` : "";
}
// Muestra de colores: la de la Ficha del proyecto manda; si no, la de Mi plantilla
export const muestraColoresDe = (p) => {
  const v = p?.ficha?.muestraColores || p?.plantilla?.muestraColores;
  return ["circulos", "casillas", "ninguna"].includes(v) ? v : "circulos";
};
export function bloqueVariantes(p, seccion = {}) {
  const f = p?.ficha || {};
  const { colores, tallas } = variantesDe(f);
  if (!colores.length && !tallas.length) return "";
  const tipo = seccion.tipo;
  const muestra = (c) => `"${c.nombre}" (${c.foto ? "foto adjunta de ese color" : c.hex ? `muestra de color ${c.hex}` : "muestra de ese color"})`;
  const lineas = [];
  const modo = muestraColoresDe(p);
  if ((PORTADAS_V.has(tipo) || (tipo === "oferta_cierre" && modo !== "ninguna")) && colores.length > 1) {
    const o = ofertaDe(f, p?.pais === "EC" ? "EC" : "CO");
    const n = ["2x1", "xy"].includes(o.tipo) ? o.unidades : 1;
    if (PORTADAS_V.has(tipo)) lineas.push(`${n > 1 ? `Las ${n} unidades de la promo van de colores distintos: ${colores.slice(0, n).map(c => c.nombre.toUpperCase()).join(", ")}` : `Producto en color ${colores[0].nombre.toUpperCase()}`}${colores[0].foto ? " (usa la foto adjunta de ese color)" : ""}.`);
    const titulo = n > 1 ? `Elige tus ${n} colores` : "Colores";
    if (modo === "circulos") lineas.push(`Fila "${n > 1 ? `ELIGE TUS ${n} COLORES` : "ELIGE TU COLOR"}" con un círculo por variante y su nombre debajo: ${colores.map(muestra).join(", ")}. La fila no tapa el producto.`);
    else if (modo === "casillas") lineas.push(`MUESTRA DE COLORES: en la esquina inferior derecha (encima del margen de abajo), un recuadro blanco redondeado con borde fino del color de acento y el título "${titulo}"; adentro, una casilla pequeña por color con su nombre al lado: ${colores.map(muestra).join(", ")}. Máximo 25% del ancho de la imagen. NO tapa el producto.`);
  } else if (SECCION_VARIANTES.has(tipo)) {
    if (colores.length) lineas.push(`Muestra TODOS los colores, cada uno con su nombre exacto: ${colores.map(muestra).join(", ")}.`);
    if (tallas.length) lineas.push(`Tallas (solo estas, en este orden): ${tallas.map(t => `"${t.nombre}"${t.medidas ? ` (${t.medidas})` : ""}`).join(", ")}.`);
  } else if (tipo === "moda_guia_tallas" && tallas.length) {
    lineas.push(`Usa SOLO estas tallas y medidas, nunca inventes otras: ${tallas.map(t => `"${t.nombre}"${t.medidas ? `: ${t.medidas}` : ""}`).join("; ")}.`);
  } else {
    const c = colorDeSeccion(f, p?.secciones, seccion);
    if (c && colores.length > 1) lineas.push(`Producto en color ${c.nombre.toUpperCase()}${c.foto ? " (usa la foto adjunta de ese color)" : c.hex ? ` (tono ${c.hex})` : ""}.`);
  }
  return lineas.length ? `VARIANTES EN ESTA SECCIÓN (las arma CoDropX): ${lineas.join(" ")}` : "";
}
// Textos legibles: tope de palabras por imagen (reseñas, chats, preguntas y números llevan su propio texto)
export const MAX_PALABRAS = 25;
export const MAX_PALABRAS_RECETA = 55, MAX_TEXTOS_RECETA = 14;
export const conReceta = (p, tipo) => !esNormal(p) && !!SECCIONES[tipo]?.receta;
export const topePalabras = (p, tipo) => (conReceta(p, tipo) ? { palabras: MAX_PALABRAS_RECETA, textos: MAX_TEXTOS_RECETA } : { palabras: MAX_PALABRAS, textos: 6 });
export const TEXTO_LIBRE = new Set(["resenas", "moda_chats", "resumen_resenas", "preguntas", "numeros_reales", "galeria", "antes_despues"]);
export function palabrasDeTextos(prompt) {
  const bloque = String(prompt || "").split(/\nTEXTOS(?: \(exactos\))?:/)[1]?.split(/\n(ZONA LIBRE|TEXTO PARA SHOPIFY|VARIANTES EN|OFERTA EN|PRECIO \(|PROHIBIDO|TEXTOS QUE NO|MARGEN ABAJO)/)[0] || "";
  const citas = [...bloque.matchAll(/[“"]([^“"”]+)[”"]/g)].map(m => m[1]);
  return { textos: citas.length, palabras: citas.join(" ").split(/\s+/).filter(w => /[A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/.test(w)).length };
}
// ---------- Revisión automática de una imagen: qué textos puede tener y qué está mal ----------
// Textos permitidos = los que van entre comillas en el prompt (sin la lista de prohibidos)
export function textosPermitidos(prompt) {
  const sinProhibidos = String(prompt || "").replace(/\n+TEXTOS QUE NO DEBEN SALIR[\s\S]*?(?=\n\n|$)/g, "");
  return [...new Set([...sinProhibidos.matchAll(/[“"]([^“"”\n]{1,120})[”"]/g)].map(m => m[1].trim()).filter(Boolean))].slice(0, 80);
}
export function promptRevisarImagen(permitidos) {
  return `Mira esta imagen de una landing de ventas en español.
1. Lee TODOS los textos que aparecen en la imagen, exactamente como están escritos (aunque estén mal escritos o no tengan sentido), uno por elemento.
2. Compáralos con los TEXTOS PERMITIDOS de abajo. Marca como "raro" cualquier texto con palabras que no existen en español, letras sin sentido (ej. "Cazal na ari"), errores de ortografía, o que no se parezca a ninguno de los permitidos. Los nombres de marcas de transportadoras, los íconos y los números de la barra de confianza no son raros.

TEXTOS PERMITIDOS:
${permitidos.map(t => `- "${t}"`).join("\n") || "(ninguno)"}

Responde SOLO este JSON válido:
{ "textos": [], "raros": [] }`;
}
// Lo que se puede comprobar sin IA: precios, porcentajes y textos prohibidos
export function problemasDeTextos(textos, p, seccion = {}) {
  const o = ofertaSeccion(p, seccion);
  const okMontos = new Set(o.montos.map(soloDigitos)), okSellos = new Set(o.sellos.map(soloDigitos));
  const prohibidos = textosProhibidos(p).map(x => x.toLowerCase());
  const out = [];
  for (const t of textos || []) {
    const txt = String(t || "");
    for (const m of txt.match(/\$\s?\d[\d.,]*\d|\$\s?\d/g) || []) {
      if (!o.conPrecio) out.push({ tipo: "precio", texto: `Sale el precio ${m} en una sección que no lleva precio` });
      else if (!okMontos.has(soloDigitos(m))) out.push({ tipo: "precio", texto: `Sale ${m}, que no es un precio de la Ficha` });
    }
    for (const m of txt.match(/[-–]?\s?\d{1,2}\s?%/g) || []) {
      if (/^\s*\d{1,2}\s?%/.test(m) && !/(off|dcto|descuento)/i.test(txt) && !/^[-–]/.test(m)) continue;   // "100% algodón" no es descuento
      if (!okSellos.has(soloDigitos(m))) out.push({ tipo: "precio", texto: `Sale el porcentaje ${m.trim()}, que no es de la Ficha` });
    }
    for (const x of prohibidos) if (x && txt.toLowerCase().includes(x)) out.push({ tipo: "prohibido", texto: `Sale "${x}", que está en "Textos que NO deben salir"` });
    for (const x of promesasFalsas(p)) if (x.re.test(txt)) out.push({ tipo: "promesa", texto: `Promete "${(txt.match(x.re) || [""])[0]}", que la Ficha no dice` });
  }
  const tit = limpiarTitular(seccion.titular) || (() => { const m = String(seccion.prompt || "").match(/Titular[^:\n]{0,40}:\s*[“"]([^“"”]+)[”"]/i); return m ? { l1: m[1] } : null; })();
  if (tit && !sinTitular(seccion.tipo) && (textos || []).length) {
    const palabras = normalizarTxt(tit.l1).split(" ").filter(w => w.length > 2);
    const todo = normalizarTxt((textos || []).join(" "));
    const vistas = palabras.filter(w => todo.includes(w)).length;
    if (palabras.length && vistas / palabras.length < 0.6) out.push({ tipo: "titular", texto: `El titular de la imagen no es "${tit.l1}"` });
  }
  return out;
}
// ---------- Titulares: la IA propone, el dueño elige; el elegido entra TAL CUAL al prompt ----------
export const sinTitular = (tipo) => ["galeria", "antes_despues", "foto_real"].includes(tipo);
export const cuantosTitulares = (tipo) => (PORTADAS.has(tipo) ? 5 : 3);
const normalizarTxt = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9ñ ]+/g, " ").replace(/\s+/g, " ").trim();
// El nombre interno del producto ("morral casual 1") nunca va de titular
export function usaNombreProducto(titular, nombre) {
  const n = normalizarTxt(String(nombre || "").replace(/\d+/g, ""));
  if (!n) return false;
  return normalizarTxt(`${titular?.l1 || ""} ${titular?.l2 || ""}`).includes(n);
}
// Los titulares nunca llevan precios ni montos de ahorro ("AHORRA $149.900", "LLEVA 2 POR $139.900")
const sinPrecioTitular = (v) => String(v || "").replace(/(?:\b(?:ahorra|ahorras|lleva|llevas|paga|pagas|solo|desde|a|por)\s+)*(?:\d+\s+(?:por|x)\s+)?\$\s?\d[\d.,]*/gi, " ").replace(/[-–]?\d{1,2}\s?%\s?(?:off|dcto)?/gi, " ").replace(/\b(?:lleva|llevas|ahorra)\s+\d+\s+(?:por|x)\s*$/i, "").replace(/\s+(?:por|a|x|de)\s*$/i, "");
export function limpiarTitular(t) {
  const linea = (v) => sinPrecioTitular(v).replace(/[<>"“”]/g, "").replace(/\s+/g, " ").trim().toUpperCase().slice(0, 40);
  const l1 = linea(Array.isArray(t) ? t[0] : t?.l1), l2 = linea(Array.isArray(t) ? t[1] : t?.l2);
  return l1 ? { l1, l2 } : null;
}
export function promptTitulares(p, secciones, evitar = {}) {
  const pais = PAISES[p.pais] || PAISES.CO;
  const avatar = (p.avatares || [])[0];
  return `${contextoProducto(p)}

${avatar ? bloqueAvatar(avatar, "AVATAR AL QUE LE HABLAN LOS TITULARES") : ""}

TAREA: Propón TITULARES para estas secciones de la landing (cada titular en 2 líneas: la línea 1 va en el color oscuro del estilo y la línea 2 en el color de acento; máximo 4 palabras por línea, en MAYÚSCULAS):
${secciones.map(s => `- id "${s.id}" · ${SECCIONES[s.tipo]?.titulo || s.tipo}: ${s.proposito || SECCIONES[s.tipo]?.def || ""} → ${cuantosTitulares(s.tipo)} titulares${(evitar[s.id] || []).length ? `. NO repitas ni hagas parecidos a estos: ${evitar[s.id].map(t => `"${t.l1} / ${t.l2}"`).join(", ")}` : ""}`).join("\n")}

REGLAS:
- Hablan de lo que GANA el cliente (comodidad, estilo, tiempo, ahorro, tranquilidad, resultado), no del producto ni de su categoría.
- NUNCA uses el nombre del producto ("${limpio(String(p.nombre || "").replace(/\d+/g, "").trim(), 80)}") ni la descripción del proveedor como titular.
- Los ${cuantosTitulares("oferta")} de la portada usan ángulos DISTINTOS (comodidad, estilo, precio u oferta, uso diario, sorpresa), no la misma frase con otras palabras.
- NUNCA precios, montos de ahorro ni porcentajes en el titular (el precio va aparte, en su caja).
- Sin promesas de salud ni de resultados que no se puedan cumplir. Sin preguntas sobre atributos personales ("¿Sufres de…?", "¿Eres…?"). Sin marcas de terceros.
- Español de ${pais.nombre}, con tildes. Que se lea en 2 segundos.
- Ejemplo del nivel (de OTRO producto, no lo copies): "ELEGANTE COMO CARTERA" / "CÓMODO COMO MORRAL"; "MANOS LIBRES" / "ESTILO TODO EL DÍA".

Responde SOLO este JSON válido:
{ "secciones": [ { "id": "", "titulares": [ ["LÍNEA 1", "LÍNEA 2"] ] } ] }`;
}
// El titular elegido reemplaza (o agrega) la línea "Titular:" de TEXTOS (exactos)
export function conTitular(texto, seccion = {}) {
  const t = limpiarTitular(seccion.titular);
  if (!t || sinTitular(seccion.tipo)) return texto;
  const lineas = String(texto || "").split("\n");
  const i = lineas.findIndex(l => /^\s*-?\s*Titular[^:]{0,40}:/i.test(l));
  const colores = i >= 0 ? [...lineas[i].matchAll(/[”"]\s*\(([^)]{1,60})\)/g)].map(m => m[1]) : [];
  const nueva = `Titular: "${t.l1}" (${colores[0] || "color oscuro del estilo"})${t.l2 ? ` / "${t.l2}" (${colores[1] || "color de acento"})` : ""}`;
  if (i >= 0) lineas[i] = nueva;
  else {
    const j = lineas.findIndex(l => /^TEXTOS( \(exactos\))?:/.test(l.trim()));
    if (j < 0) return texto;
    lineas.splice(j + 1, 0, nueva);
  }
  return lineas.join("\n");
}
export function bloqueProhibidos(p) {
  const t = textosProhibidos(p);
  const falsas = promesasFalsas(p).map(x => x.nombre);
  return `TEXTOS QUE NO DEBEN SALIR (aunque aparezcan en las fotos de referencia): ${t.length ? t.map(x => `"${x}"`).join(", ") + ". " : ""}Tampoco copies referencias, códigos, cantidades por caja, precios de mayorista ni el nombre del proveedor que se vean en las fotos. No escribas ningún otro texto aparte de los que están entre comillas.${falsas.length ? ` NO afirmes nada que la Ficha no dice: ${falsas.join(", ")}.` : ""}${cuidadoEnFicha(p) ? "" : " Sin íconos de cuidado (lavadora, plancha, secadora)."}`;
}
// Quita del texto que escribió la IA los montos y porcentajes que no son de la Ficha, y los textos prohibidos
export function limpiarMontos(texto, p, seccion = {}) {
  const o = ofertaSeccion(p, seccion);
  const okMontos = new Set(o.montos.map(soloDigitos));
  const okSellos = new Set(o.sellos.map(soloDigitos));
  const prohibidos = textosProhibidos(p).map(x => new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"));
  // Línea por línea: si a un texto entre comillas se le quitó todo, se quita ese texto (o la línea entera si no le queda nada)
  const falsas = promesasFalsas(p);
  const medida = TIPOS_TALLAS.has(seccion.tipo) ? "" : medidaFicha(p);
  const titularLinea = (l) => /^\s*-?\s*Titular[^:]{0,40}:/i.test(l);
  return String(texto || "").split("\n").map((linea0) => {
    let linea = corregirTransportadoras(linea0);
    if (medida) linea = linea.replace(RE_MEDIDA, medida);
    // Promesas que la Ficha no respalda: fuera el texto entre comillas que la dice (o la línea, si no es un texto)
    if (!cuidadoEnFicha(p) && !/[“"]/.test(linea) && /[íi]conos? de cuidado|instrucciones de (?:cuidado|lavado)/i.test(linea)) return null;
    if (falsas.some(x => x.re.test(linea))) {
      if (!/[“"]/.test(linea)) {
        for (const x of falsas) linea = linea.replace(new RegExp(x.re.source, "gi"), "");
        linea = linea.replace(/\s*([,·/]|\by\b)\s*(?=([,·/.:]|\by\b|$))/g, "").replace(/:\s*[,·/]\s*/g, ": ").replace(/\s{2,}/g, " ").trimEnd();
        return linea.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "").length < 4 ? null : linea;
      }
      linea = linea.replace(/[“"]([^“"”]*)[”"](\s*\([^)]{0,60}\))?/g, (m, t) => (falsas.some(x => x.re.test(t)) ? "" : m)).replace(/:\s*(?:[·/,]\s*)+/g, ": ").replace(/\s*(·|\/|,)\s*(?=(·|\/|,|$))/g, "").trimEnd();
      if (!/[“"][^“"”]*[A-Za-zÁÉÍÓÚÑáéíóúñ0-9][^“"”]*[”"]/.test(linea)) return null;
    }
    let quito = false;
    const fuera = (ok) => (m) => (ok(m) ? m : ((quito = true), ""));
    let l = linea
      // El precio va UNA sola vez: en el bloque PRECIO que arma el código. Ningún "$" en lo que escribió la IA
      .replace(/(?:\b(?:ahorra|ahorras|lleva|llevas|paga|pagas|por solo|solo|desde|a solo|antes|ahora)\s+)?(?:\d+\s+(?:por|x)\s+)?\$\s?\d[\d.,]*\d|\$\s?\d/gi, fuera(() => false))
      .replace(/[-–]\s?\d{1,2}\s?%/g, fuera((m) => okSellos.has(soloDigitos(m))))
      .replace(/\d{1,2}\s?%\s?(OFF|DCTO|de descuento|descuento)/gi, fuera((m) => okSellos.has(soloDigitos(m))));
    for (const re of prohibidos) l = l.replace(re, () => ((quito = true), ""));
    if (!quito) return linea;
    l = l.replace(/[“"]\s*[”"]/g, "").replace(/[“"][^“"”]*:\s*[”"]/g, "").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trimEnd();
    if (titularLinea(linea)) l = l.replace(/[“"]([^“"”]*)[”"]/g, (m, t) => `"${sinPrecioTitular(t).replace(/\s+/g, " ").trim()}"`).replace(/[“"]\s*[”"]\s*(\([^)]*\))?\s*\/?\s*/g, "").replace(/\/\s*$/, "").trimEnd();
    if (/[“"]/.test(linea) && !/[“"][^“"”]*[A-Za-zÁÉÍÓÚÑáéíóúñ0-9][^“"”]*[”"]/.test(l)) return /^\s*\d+\)/.test(l) ? l.replace(/\s+(y|con|,)\s*\.?$/i, ".") : null;   // texto de la lista que quedó vacío (en la composición queda la línea)
    return l;
  }).filter(l => l !== null).join("\n");
}

// ---------- 2.3 Reparto de la landing: personas que rotan y un plano distinto por sección ----------
const SIN_PERSONAS = new Set(["detalles", "moda_material", "moda_ficha", "por_que_aqui", "moda_por_que", "que_incluye", "foto_real", "resenas", "moda_chats", "resumen_resenas", "numeros_reales", "preguntas", "confianza", "tamano_variantes", "moda_guia_tallas", "galeria"]);
const PLANOS = ["cuerpo entero en acción", "medio plano con emoción", "primer plano de las manos usando el producto", "plano general del lugar con la persona pequeña al fondo", "plano 3/4 de lado, caminando"];
export function repartoDe(p, seccion = {}) {
  if (SIN_PERSONAS.has(seccion.tipo)) return "";
  const secs = (Array.isArray(p?.secciones) ? p.secciones : []).filter(s => !SIN_PERSONAS.has(s.tipo));
  const k = Math.max(0, secs.findIndex(s => s.id === seccion.id));
  const o = ofertaDe(p?.ficha || {}, p?.pais === "EC" ? "EC" : "CO");
  const portada = PORTADAS.has(seccion.tipo);
  const quien = portada ? (["2x1", "xy"].includes(o.tipo) ? "la PERSONA 1 y la PERSONA 2 juntas" : "la PERSONA 1") : k % 2 ? "la PERSONA 2" : "la PERSONA 1";
  const extra = seccion.tipo === "entrega" ? `un domiciliario (ropa lisa, sin logos) y ${quien} recibiendo`
    : seccion.tipo === "como_funciona" ? `${quien} en los pasos 1 y 2, y en el paso 3 un domiciliario entregándole la caja` : quien;
  const receta = conReceta(p, seccion.tipo) ? SECCIONES[seccion.tipo].receta : null;
  const plano = receta?.escena || PLANOS[k % PLANOS.length];
  return `
PERSONAS DE ESTA LANDING (reparto fijo): PERSONA 1 = el avatar. PERSONA 2 = otra persona del mismo público pero DISTINTA (otra cara, otro peinado, otra ropa; puede ser su amigo, amiga o pareja). De apoyo: domiciliario y cliente recibiendo.
EN ESTA IMAGEN: ${extra}. Plano: ${plano}. Nunca la misma pose de otra sección y NUNCA "de espaldas mirando por encima del hombro".`;
}

// ---------- 2.2 Barra de confianza solo donde toca (Mi plantilla decide por sección) ----------
const conBarra = (p, tipo) => esNormal(p) ? true : llevaBarra(tipo, p?.plantilla);
const RE_CONFIANZA = /pago contra entrega|pagas? al recibir|paga al recibir|env[ií]o gratis|pago seguro|compra segura|env[ií]o (?:a todo el pa[ií]s|r[aá]pido)/i;
export function bloqueSinBarra(p, seccion = {}) {
  if (conBarra(p, seccion.tipo) || ["galeria", "foto_real", "antes_despues"].includes(seccion.tipo)) return "";
  return `SIN BARRA DE CONFIANZA EN ESTA IMAGEN: PROHIBIDO barra de confianza, íconos de envío o pago, "pago contra entrega", "envío gratis" y "pago seguro" (eso ya lo dice el botón de la tienda debajo de cada imagen).`;
}
function sinConfianza(texto, p, seccion) {
  if (conBarra(p, seccion.tipo)) return texto;
  return String(texto || "").split("\n").map(l => {
    if (!/[“"]/.test(l)) return /barra de confianza/i.test(l) ? null : l;
    if (!RE_CONFIANZA.test(l) && !/barra de confianza|^\s*barra\s*:/i.test(l)) return l;
    if (/barra de confianza|^\s*-?\s*barra\s*[:(]/i.test(l)) return null;
    const out = l.replace(/[“"]([^“"”]*)[”"](\s*\([^)]{0,60}\))?/g, (m, t) => (RE_CONFIANZA.test(t) ? "" : m)).replace(/:\s*(?:[·/,]\s*)+/g, ": ").replace(/\s*[·/,]\s*$/, "").trimEnd();
    return /[“"][^“"”]*[A-Za-zÁÉÍÓÚÑáéíóúñ0-9][^“"”]*[”"]/.test(out) ? out : null;
  }).filter(l => l !== null).join("\n");
}

// TEXTOS (exactos) va al FINAL del prompt, y al inicio una línea que dice que son los únicos textos
export const LINEA_SOLO_TEXTOS = "Los únicos textos de esta imagen son los de la lista TEXTOS (al final). Ignora cualquier texto que veas en las fotos adjuntas.";
function textosAlFinal(texto) {
  const lineas = String(texto || "").split("\n").filter(l => l.trim() !== LINEA_SOLO_TEXTOS);
  const ini = lineas.map((l, i) => (/^TEXTOS( \(exactos\))?:/.test(l.trim()) ? i : -1)).filter(i => i >= 0);
  if (ini.length !== 1) return lineas.join("\n");
  let fin = ini[0] + 1;
  while (fin < lineas.length && lineas[fin].trim() !== "" && !/^(ZONA LIBRE|TEXTO PARA SHOPIFY)/.test(lineas[fin].trim())) fin++;
  const bloque = lineas.splice(ini[0], fin - ini[0]);
  return { cuerpo: lineas.join("\n").replace(/\n{3,}/g, "\n\n").trim(), bloque: bloque.join("\n").trim() };
}
export function cierreSeccion(texto, p, seccion = {}) {
  // El precio y los prohibidos los pega el código al final (se rehacen cada vez: si cambias el precio en la Ficha, quedan al día)
  const sinBloques = String(texto || "").replace(/\n+(VARIANTES EN ESTA SECCIÓN|OFERTA EN ESTA SECCIÓN|PRECIO \(cópialo EXACTO|PROHIBIDO EN ESTA IMAGEN|SIN BARRA DE CONFIANZA|TEXTOS QUE NO DEBEN SALIR)[\s\S]*?(?=\n\n|$)/g, "").replace(/\n+MARGEN ABAJO[^\n]*/g, "");
  const base = conCierreResenas(conTitular(sinConfianza(limpiarMontos(sinBloques, p, seccion), p, seccion), seccion), p, seccion.tipo, seccion.variante);
  const galeria = p?.formato === "normal" && seccion.tipo === "galeria";
  const oferta = bloqueOferta(p, seccion), variantes = bloqueVariantes(p, seccion);
  const sinMargen = String(base).replace(/\n+MARGEN ABAJO[\s\S]*?(?=\n\n|$)/, "").trimEnd();
  const t = textosAlFinal(sinMargen);
  const cuerpo = typeof t === "string" ? t : `${LINEA_SOLO_TEXTOS}\n${t.cuerpo}`;
  const sinBarra = bloqueSinBarra(p, seccion);
  const conBloques = cuerpo + `${variantes ? `\n\n${variantes}` : ""}${oferta ? `\n\n${oferta}` : ""}\n\n${bloquePrecio(p, seccion)}${sinBarra ? `\n\n${sinBarra}` : ""}\n\n${bloqueProhibidos(p)}`;
  const final = galeria ? conBloques : conBloques + margenAbajo(p, seccion.formato || (p?.formato === "normal" ? "1:1" : "9:16"), conBarra(p, seccion.tipo));
  return typeof t === "string" ? final : `${final}\n\n${t.bloque}`;
}

export function promptSeccion(p, seccion, avatar, otras = []) {
  const tipo = CATALOGO_SECCIONES[seccion.tipo];
  const normal = esNormal(p);
  const formatoBase = normal ? "1:1" : "9:16";
  const formato = seccion.formato && seccion.formato !== formatoBase && NOMBRE_FORMATO[seccion.formato]
    ? `\nIMPORTANTE: esta imagen NO es ${formatoBase}, es ${NOMBRE_FORMATO[seccion.formato]}. Escríbelo al inicio del prompt.`
    : "";
  const precioEn = p.ficha?.precioEn || "portada";
  const conPrecio = llevaPrecio(seccion.tipo, normal, precioEn);
  // Portada sin precio (la Ficha lo pide): si el diseño elegido es de los que llevan precio, se usa el F
  const variante = seccion.tipo === "oferta" && !conPrecio ? varianteDe("oferta", "sin_precio") : varianteDe(seccion.tipo, seccion.variante);
  const receta = conReceta(p, seccion.tipo) ? SECCIONES[seccion.tipo].receta : null;
  const diseno = variante ? (receta
    ? `\nVARIACIÓN VISUAL (Mi plantilla: "${variante.nombre}"): ${variante.desc} Úsala solo para la FORMA (dónde va cada cosa); los bloques son los de la RECETA.`
    : `\nDISEÑO OBLIGATORIO DE ESTA SECCIÓN (Mi plantilla: "${variante.nombre}"): ${variante.desc}`) : "";
  const local = p.pais === "EC" ? "en Ecuador: 'chévere', 'pana', 'full'" : "en Colombia: 'parce', 'bacano', 'una pinta', 'de una'";
  const bloqueReceta = receta ? `
RECETA OBLIGATORIA DE ESTA SECCIÓN (así son las landings que sí venden): respeta el orden y TODOS los bloques, un número de COMPOSICIÓN por bloque:
${receta.bloques.map((b, k) => `${k + 1}) ${b}`).join("\n")}
ESCENA PROPIA DE ESTA SECCIÓN (ninguna otra sección usa la misma foto ni la misma pose): ${receta.escena}.
IMAGEN DENSA PERO ORDENADA, tipo infografía: titular grande (máximo 8 palabras en 2 o 3 líneas), 1 elemento visual principal y de 3 a 6 bloques pequeños; cada texto de bloque de 2 a 8 palabras. Se lee en segundos.
LENGUAJE: como habla la gente ${local}, sin exagerar. Titulares de identidad, emoción o momento, nunca el nombre del producto.` : "";
  const galeria = normal && seccion.tipo === "galeria";
  const deslizador = normal && seccion.tipo === "antes_despues";
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
${p.estilo?.mundo ? `
ESCENA SUGERIDA POR EL ESTILO (solo una idea de ambiente: CAMBIA el lugar, la hora y el ángulo en cada imagen para que no se repitan): ${limpio(p.estilo.mundo, 300)}` : ""}

OTRAS SECCIONES DE ESTA LANDING (no repitas sus titulares ni su composición):
${otras.map(o => `- ${o.titulo} (${o.composicion || "sin composición"})`).join("\n") || "(ninguna)"}

${EJEMPLO_NIVEL}

SECCIÓN A ESCRIBIR: ${seccion.titulo} [tipo: ${seccion.tipo}]${limpiarTitular(seccion.titular) && !sinTitular(seccion.tipo) ? `
TITULAR YA ELEGIDO POR EL DUEÑO (úsalo EXACTO en TEXTOS, línea 1 en el color oscuro y línea 2 en el de acento): "${limpiarTitular(seccion.titular).l1}" / "${limpiarTitular(seccion.titular).l2}"` : `
El titular NUNCA es el nombre del producto: es un beneficio corto para el cliente.`}
Qué debe tener: ${tipo?.def || seccion.proposito || ""}
Propósito: ${seccion.proposito || ""}
Composición asignada: ${receta ? "la de la RECETA" : seccion.composicion || "elige una que no se repita"}${bloqueReceta}${normal ? "" : repartoDe(p, seccion)}${diseno}${formato}${seccion.tipo === "resenas" ? bloqueResenas(p) : ""}${seccion.tipo === "moda_chats" ? bloqueChats(p) : ""}${seccion.tipo === "numeros_reales" ? bloqueNumeros(p) : ""}${seccion.tipo === "resumen_resenas" ? bloqueCalificacion(p) : ""}${seccion.tipo === "pagas_al_recibir" ? bloquePagasAlRecibir(p) : ""}${seccion.tipo === "causa" ? `
CÓMO HACER "LA VERDADERA CAUSA": foto real de la escena con un gráfico MUY simple encima (líneas tipo tiza, flecha, lupa o etiquetas tachadas). Titular tipo "No es X, es Y" o "El problema no es lo que crees". Máximo 3 textos cortos además del titular. Cierra con la frase puente al producto. Nada de anatomía detallada, nada médico.` : ""}${diseno && !receta ? `
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

FOTOGRAFÍA REAL (no dibujo, no animación).
COMPOSICIÓN, de arriba hacia abajo:${receta ? `
[Un número por cada bloque de la RECETA, en su orden, concreto para este producto: qué se ve, dónde va y de qué tamaño. En el bloque de la foto o escena: quién (edad, aspecto, ropa), pose o acción, lugar, ángulo, luz y emoción; el producto GRANDE y nítido pero a su TAMAÑO REAL.]
TEXTOS (exactos):
Titular: "[LÍNEA 1]" ([color]) / "[LÍNEA 2]" ([color])
[Cada texto de los bloques en su propia línea, entre comillas, con dónde va y su color]
No escribas ningún otro texto aparte de estos.
Ningún texto tapa el producto.
ZONA LIBRE: [zona lisa del mismo fondo si el dueño debe pegar algo después; si no aplica escribe "ninguna"]` : `
1) TITULAR arriba.
2) FOTO ([qué % de la imagen ocupa]): [ESCENA concreta y distinta a las otras secciones: quién (edad, aspecto, ropa), pose o acción exacta, lugar, ángulo de cámara, luz y emoción]. El producto [PUESTO o EN USO, de qué color/variante es en esta imagen], GRANDE y nítido pero a su TAMAÑO REAL junto a las personas (para que se vea más, acerca la cámara; nunca lo agrandes).
3) [Elemento gráfico de esta sección: tarjetas, chips con ícono, círculos de zoom, flechas…], sin tapar el producto.
4) [${conPrecio ? "Banda de precio" : normal || !conBarra(p, seccion.tipo) ? "Cierre visual de la imagen" : "Barra de confianza"}], encima del margen inferior.
(Un elemento por número; agrega 5), 6)… si hace falta.)
TEXTOS (exactos):
Titular: "[LÍNEA 1]" ([color]) / "[LÍNEA 2]" ([color])
[Cada texto en su propia línea, entre comillas, con dónde va y su color: subtítulo, etiquetas${conPrecio ? ", precio" : ""}${normal || !conBarra(p, seccion.tipo) ? "" : ", barra de confianza"}]
No escribas ningún otro texto aparte de estos.
Ningún texto tapa el producto.
ZONA LIBRE: [si el dueño debe pegar algo después (GIF, logo, reseñas, transportadoras), di DÓNDE queda una zona lisa del mismo fondo, SIN dibujar recuadros, círculos ni marcos; si no aplica escribe "ninguna"]`}`}
${normal && !galeria ? `
Al final agrega el texto que va AL LADO de la imagen en Shopify (sección "Imagen con texto"), con este formato:
TEXTO PARA SHOPIFY
Título: "[máximo 8 palabras]"
Texto: "[2 o 3 frases cortas, vendedoras, sin repetir lo que ya dice la imagen]"` : ""}

Reglas para esta imagen:
- Titulares cortos (máximo 4 o 5 palabras por línea). Poco texto. El producto sin tapar y a su tamaño real.${TEXTO_LIBRE.has(seccion.tipo) ? "" : `
${conReceta(p, seccion.tipo) ? `- MÁXIMO ${MAX_PALABRAS_RECETA} PALABRAS en total y máximo ${MAX_TEXTOS_RECETA} textos: los que pide la receta, cortos (de 2 a 8 palabras cada uno). Cuenta las palabras antes de responder y recorta si te pasas.` : `- MÁXIMO ${MAX_PALABRAS} PALABRAS en total entre todos los textos de la imagen y máximo 6 textos: titular, subtítulo, hasta 3 etiquetas (de 1 a 4 palabras cada una) y la barra de confianza. Cuenta las palabras antes de responder y recorta si te pasas.`} Todos los textos van entre comillas en TEXTOS: no habrá ningún otro texto en la imagen.`}${conPrecio ? `
- Esta imagen SÍ lleva el precio, protagonista.` : `
- Esta imagen NO lleva precio: nada de precio ni "antes" tachado (aunque el bloque de estilo hable de la caja del precio)${PORTADAS.has(seccion.tipo) && porcentajeDescuento(p.ficha?.precioAntes, p.ficha?.precio) ? `; SÍ puede llevar el sello "-${porcentajeDescuento(p.ficha.precioAntes, p.ficha.precio)}%"` : "; tampoco sello de descuento ni porcentaje"}. El precio solo va en ${dondeVaPrecio(normal, precioEn)}. La barra de confianza sí puede ir.${PORTADAS.has(seccion.tipo) ? `
- VENTA POR IMPULSO SIN PRECIO: que dé ganas de pedirlo ya: beneficio enorme, producto en uso, "PAGAS AL RECIBIR" bien visible y una flecha hacia abajo con "PÍDELO AQUÍ ABAJO" (ahí está el formulario). Sin urgencia falsa.` : ""}`}
${conPrecio ? `- Usa los precios exactamente así: ${formatoPrecio(p.ficha?.precio, p.pais) || "(sin precio)"}${p.ficha?.precioAntes ? ` y antes ${formatoPrecio(p.ficha.precioAntes, p.pais)}` : ""}${porcentajeDescuento(p.ficha?.precioAntes, p.ficha?.precio) ? ` (${porcentajeDescuento(p.ficha.precioAntes, p.ficha.precio)}% de descuento)` : ""}. No inventes otros.` : `- Ningún número de precio en esta imagen.`}
- Solo promesas que sean verdad según la ficha.
- Recuerda decir lo que el producto NO tiene si hay riesgo de que la IA lo invente en esta escena.`;
}

// Ejemplo real de un prompt que funcionó (cinta de kinesiología). Le muestra a la IA el NIVEL de detalle.
const EJEMPLO_NIVEL = `EJEMPLO DEL NIVEL QUE QUIERO (es de OTRO producto: copia el nivel de detalle y de escena, NO su contenido, colores ni textos):
FOTOGRAFÍA REAL (no dibujo, no animación).
COMPOSICIÓN, de arriba hacia abajo:
1) TITULAR arriba, inclinado.
2) FOTO (60% de la imagen): un deportista latino de 28 años corriendo en una pista de atletismo de noche bajo reflectores, en pleno salto, visto desde un ángulo bajo, con sudor y luz dramática. En su rodilla lleva el parche en T color AZUL, GRANDE y nítido en el centro, a su tamaño real. Líneas diagonales cian de velocidad detrás de él.
3) A la izquierda, tres chips negros con borde cian e ícono de línea, sin tapar la rodilla.
4) Banda de precio abajo a la izquierda, con un abanico de 10 parches reales en sus 4 colores y un círculo cian, encima del margen inferior.
5) Barra de confianza negra encima del margen inferior.
TEXTOS (exactos):
Titular: "10 PARCHES" (cian, lo más grande de la imagen) / "PARA TU RODILLA" (blanco)
Chip 1: "Soporte y estabilidad" (blanco)
Chip 2: "Resiste sudor y agua" (blanco)
Chip 3: "Sin tijeras" (blanco)
Precio: "$99.990" (negro, muy grande, dentro de la caja cian)
Antes: "$152.990" (gris, tachado en rojo)
Círculo: "x10" (negro)
Barra: "Pago contra entrega · Envío a toda Colombia" (blanco)
No escribas ningún otro texto aparte de estos.
Ningún texto tapa el producto.`;

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
  aida: "AIDA: gancho que detiene el scroll → interés (la causa real o el deseo) → deseo (beneficios) → acción.",
  pas: "PAS: Problema (la situación del día a día, sin señalar a la persona) → Agitación (lo que molesta, lo que ya probó y no sirvió) → Solución (el producto, por qué sí) → acción.",
  beneficio: "BENEFICIO DIRECTO: arranca con el resultado o la función estrella en la primera línea, luego los beneficios y para qué momentos sirve.",
  prueba_social: "PRUEBA SOCIAL / REGALO: arranca con lo que viven otros o con el regalo; usa SOLO la prueba social real que se te da; 'Lo que recibes:'; cierra con acción.",
  historia: "MINI HISTORIA: arranca con una escena corta de alguien (en tercera persona) usando el producto en su día a día, y de ahí salen los beneficios.",
  curiosidad: "CURIOSIDAD: arranca con un detalle, un dato del producto o una pregunta que dé ganas de seguir leyendo, y lo explica.",
  objecion: "ROMPER LA DUDA: arranca respondiendo la duda más común antes de comprar este producto (¿sirve de verdad?, ¿es difícil de usar?, ¿qué tamaño tiene?, ¿y si no me llega?) y de ahí vende.",
  momentos: "MOMENTOS DE USO: arranca con los momentos o lugares donde el producto te salva (en la casa, en el carro, de viaje, en la oficina…), uno por línea.",
  razones: "X RAZONES: 'N razones por las que…' con razones numeradas y concretas del producto.",
  comparacion: "ANTES Y AHORA DEL DÍA A DÍA (no del cuerpo): cómo era la tarea o la situación sin el producto y cómo es con él. Sin marcas ajenas."
};

// Para que los copys no salgan todos iguales: cada vez se sortea otra mezcla de marcos, listas, títulos y descripciones
const ESTILOS_LISTA = [
  "beneficios con ✅ al inicio de cada línea",
  "beneficios numerados con 1️⃣ 2️⃣ 3️⃣",
  "beneficios con un emoji DISTINTO en cada línea que dibuje ese beneficio (nada de repetir el mismo emoji)",
  "beneficios con flechas ➜ o ▸",
  "sin lista: párrafos cortos de 1 o 2 líneas, como si se lo contaras a un amigo",
  "mini preguntas y respuestas (❓ pregunta corta / respuesta corta)",
  "beneficios con guion largo — y solo 2 o 3 emojis en todo el texto"
];
const TIPOS_TITULO = [
  "un BENEFICIO concreto del producto",
  "un GANCHO de curiosidad",
  "una PREGUNTA corta del día a día",
  "el RESULTADO o el momento en que se usa",
  "la OFERTA o el regalo (solo si la ficha trae oferta o regalo; si no, un beneficio)",
  "lo NUEVO o diferente del producto",
  "una frase corta en lenguaje de la calle, como lo diría el cliente"
];
const TIPOS_DESCRIPCION = [
  "un beneficio clave", "para quién o para qué momento es", "la oferta o el regalo (si la ficha lo trae)",
  "un dato del producto (material, tamaño, cómo se usa)", "el envío", "la confianza al comprar (pagas cuando te llega)"
];
const EMOJIS_GASTADOS = ["✨", "💫", "🎁", "📦", "💳", "👉", "🔥", "✔️", "🚚"];

function barajar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Elige 4 marcos distintos: casi siempre uno de los clásicos (aida/pas) y uno de los nuevos; prueba social solo si hay datos reales
export function sortearEnfoques(hayPruebaSocial = false) {
  const clasicos = barajar(["aida", "pas", "beneficio"]);
  const nuevos = barajar(["historia", "curiosidad", "objecion", "momentos", "razones", "comparacion", ...(hayPruebaSocial ? ["prueba_social", "prueba_social"] : [])]);
  const elegidos = [clasicos[0], nuevos[0]];
  for (const k of barajar([...clasicos.slice(1), ...nuevos.slice(1)])) if (elegidos.length < 4 && !elegidos.includes(k)) elegidos.push(k);
  return barajar(elegidos);
}
// Los emojis que más usaste en los copys de tus otros productos (para no repetirlos)
export function emojisRepetidos(textos = [], max = 10) {
  const cuenta = new Map();
  for (const t of textos) for (const m of String(t || "").matchAll(/\p{Extended_Pictographic}️?/gu)) cuenta.set(m[0], (cuenta.get(m[0]) || 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([e]) => e);
}

export function promptCopys(p, avatar, opciones = {}) {
  const pais = PAISES[p.pais] || PAISES.CO;
  const precio = formatoPrecio(p.ficha?.precio, p.pais);
  const mencionar = [
    opciones.envio && p.ficha?.promesas?.envioGratis ? "envío gratis" : `"${pais.envio}"`,
    opciones.contraEntrega !== false ? "pago contra entrega" : null,
    opciones.precio && precio ? `el precio (${precio})` : null
  ].filter(Boolean);
  const reales = resenasReales(p).filter(r => String(r.texto || "").trim()).slice(0, 3);
  // Mezcla sorteada: cada vez que pides copys sale otra combinación
  const enfoques = sortearEnfoques(reales.length > 0 || !!numerosPrueba(p) || !!calificacionReal(p));
  const listas = barajar(ESTILOS_LISTA), titulos = barajar(TIPOS_TITULO);
  const descs = barajar(TIPOS_DESCRIPCION.slice(0, 5));
  if (opciones.contraEntrega !== false && Math.random() < 0.5) descs[Math.floor(Math.random() * 4)] = TIPOS_DESCRIPCION[5];
  const plan = enfoques.map((enfoque, n) => ({ enfoque, lista: listas[n], titulo: titulos[n], descripcion: descs[n] }));
  const cuantosCE = Math.random() < 0.5 ? 1 : 2;
  const evitar = (opciones.emojisEvitar || []).slice(0, 10);
  const recientes = (opciones.recientes || []).slice(0, 16);
  return `${contextoProducto(p)}

${bloqueAvatar(avatar, "AVATAR AL QUE LE HABLA")}

VENDE CON LA CAUSA REAL: usa las palabras del cliente y lo que de verdad le resuelve el producto. Cada copy sigue SU marco (abajo), no todos AIDA.

ROL: actúa como un Media Buyer / Trafficker Digital de nivel élite especializado en Meta Ads (Facebook e Instagram) y TikTok Ads, y en copywriting de respuesta directa para pago contra entrega en ${pais.nombre}.

PASO 1 · ANÁLISIS (con la ficha y el avatar, no inventes nada):
- uvp: la propuesta única de valor en 1 o 2 frases.
- dolores: 3 o 4 dolores o deseos del cliente, planteados en general (sin señalar a la persona).
- angulos: 3 ángulos de venta posibles.
- alertas: riesgos de políticas de Meta y TikTok para ESTE producto y cómo evitarlos (palabras a evitar, cómo debe ser el creativo, si el título de la landing puede causar rechazo). Si es un producto que Meta o TikTok no permiten anunciar, dilo claro aquí.

PASO 2 · 4 COPYS PARA META, cada uno con SU marco, SU estilo de lista, SU tipo de título y SU tipo de descripción (todo distinto entre los 4):
${plan.map((x, n) => `Copy ${n + 1} · enfoque "${x.enfoque}": ${ENFOQUES_META[x.enfoque]}
   - Lista/estructura: ${x.lista}.
   - Título: ${x.titulo}.
   - Descripción: ${x.descripcion}.`).join("\n")}
Cada copy:
- texto_principal: 7 a 14 líneas cortas con saltos de línea. La PRIMERA línea es un gancho que detiene el scroll y los 4 ganchos arrancan de forma distinta (ni la misma palabra ni el mismo emoji). Cierra con una llamada a la acción con palabras distintas en cada copy (nada de repetir "pide el tuyo hoy" en los 4).
- titulo: máximo 40 caracteres (puede llevar 1 emoji), del tipo que le tocó arriba.
- descripcion: máximo 30 caracteres, del tipo que le tocó arriba.

VARIEDAD (muy importante, el dueño se queja de que todos los copys salen iguales):
- EMOJIS: escoge emojis del mundo de ESTE producto (lo que es, para qué sirve, dónde se usa) y cambia de emojis entre un copy y otro. ${evitar.length ? `NO uses estos, ya están gastados en sus otros anuncios: ${evitar.join(" ")}.` : ""} Máximo 1 emoji genérico (${EMOJIS_GASTADOS.join(" ")}) por copy.
- ${opciones.contraEntrega !== false ? `PAGO CONTRA ENTREGA: menciónalo SOLO en ${cuantosCE} de los 4 textos (en el cierre, cada vez con palabras distintas: "pagas cuando lo tienes en tus manos", "lo recibes y ahí pagas"…), en máximo 1 título y en máximo 1 descripción. Los demás títulos y descripciones hablan del PRODUCTO: beneficios, usos, ganchos.` : "NO menciones el pago contra entrega."}
- Otros datos de confianza que puedes usar en los cierres (no todos en todos): ${mencionar.join(" · ")}${opciones.precio && precio ? "" : " (NO pongas el precio)"}.
Español de ${pais.nombre} con TÚ, natural, como habla la gente; nada de voseo.

PRUEBA SOCIAL REAL PARA LOS COPYS (úsala tal cual; si no hay, no inventes ninguna):
${reales.length ? `Reseñas textuales (cítalas EXACTAS, con ⭐ según sus estrellas y el nombre o iniciales que trae; si no trae nombre, sin nombre):\n${reales.map(r => `- "${limpio(r.texto, 200)}"${limpio(r.nombre, 40) ? ` – ${limpio(r.nombre, 40)}` : ""}${r.ciudad ? `, ${limpio(r.ciudad, 40)}` : ""}${Number(r.estrellas) ? ` (${Number(r.estrellas)} estrellas)` : ""}`).join("\n")}` : "Reseñas: no hay. NO escribas testimonios, ni de ejemplo ni entre corchetes."}
${textoPruebaSocial(p)}

${(opciones.referencias || []).length ? `COPYS DE TUS PRODUCTOS GANADORES (vendieron de verdad): úsalos SOLO como referencia de tono y de lo cerca que le hablan al cliente. NO copies sus frases, su estructura, sus emojis, sus títulos ni sus datos:
${opciones.referencias.map((r, i) => `--- Ganador ${i + 1}${r.producto ? ` (${limpio(r.producto, 80)})` : ""}${r.enfoque ? ` · ${r.enfoque}` : ""}:\n${limpio(r.texto, 900)}`).join("\n")}
` : ""}
${recientes.length ? `TÍTULOS Y GANCHOS QUE YA USÓ EN OTROS PRODUCTOS (NO los repitas ni hagas unos parecidos):
${recientes.map(r => `- ${limpio(r, 140)}`).join("\n")}
` : ""}DATOS SIN CONFIRMAR: si un dato ayudaría al copy pero NO está en la ficha (material, tiempo de entrega, colores, si resiste el agua…), escríbelo entre [corchetes] para que el dueño lo confirme o lo borre antes de publicar. Lo que la ficha dice que NO es verdad no se escribe ni entre corchetes. Testimonios y cifras nunca van entre corchetes: o son reales o no van.

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
  "meta": [ ${plan.map(x => `{ "enfoque": "${x.enfoque}", "texto_principal": "", "titulo": "", "descripcion": "" }`).join(", ")} ],
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

// ---------- Kit de temporada (Black Friday, Navidad, Día de la Madre…) ----------
// oferta: { nombre, texto, unidades, precio, antes, ahorro } calculada con tus costos · fin: hasta cuándo va de verdad la oferta
export function promptKitTemporada(p, avatar, { temporada, oferta, fin = "" } = {}) {
  const pais = PAISES[p.pais] || PAISES.CO;
  const f = (v) => formatoPrecio(v, p.pais);
  return `${contextoProducto(p)}

${bloqueAvatar(avatar, "AVATAR AL QUE LE HABLA")}

TEMPORADA: ${limpio(temporada?.nombre, 80)} (${limpio(temporada?.fecha, 20)}) en ${pais.nombre}.
OFERTA DE TEMPORADA (exacta, no la cambies ni inventes otra): ${limpio(oferta?.texto, 120)} · ${oferta?.unidades || 1} unidad(es) por ${f(oferta?.precio)}${oferta?.antes > oferta?.precio ? ` (antes ${f(oferta.antes)}, ahorras ${f(oferta.ahorro)})` : ""}.
${fin ? `La oferta va de verdad hasta el ${limpio(fin, 30)}: puedes decirlo ("hasta el ${limpio(fin, 30)}").` : "No hay fecha de fin: NO digas 'solo hoy', 'últimas horas' ni pongas contadores."}

TAREA: arma el KIT DE TEMPORADA de este producto, todo con la misma oferta y el mismo mensaje:
1. copys: 2 copys para Meta Ads con el tono de la temporada (uno de regalo/ocasión, uno de oferta), de 8 a 12 líneas con emojis de la temporada, gancho en la primera línea, lista de 3 beneficios con emojis, la oferta exacta y una línea de confianza con pago contra entrega. Cada uno con titulo (máx. 40 caracteres) y descripcion (máx. 30).
2. tiktok: texto (máx. 100 caracteres, emojis cuentan 2, máx. 2 emojis, sin hashtags), caption (máx. 150, con 2 o 3 hashtags de la temporada) y 3 ganchos hablados para los primeros 3 segundos.
3. banner: los textos de la imagen principal de temporada: titular (2 líneas cortas separadas por " / "), subtitulo (máx. 8 palabras), sello (máx. 3 palabras, ej. "BLACK FRIDAY"), oferta (la oferta exacta en pocas palabras) y cta (máx. 3 palabras).
4. prompt_banner: el prompt para Gemini de UNA imagen vertical 9:16 (1080x1920) de portada de temporada, con este formato (texto plano):
IDEA: [...]
FOTOGRAFÍA REAL (no dibujo, no animación).
COMPOSICIÓN: [escena real con ambiente de ${limpio(temporada?.nombre, 60)} sin exagerar (luces, colores y objetos de la temporada), el producto EN USO a su tamaño real, quién lo usa y dónde; el 12% de abajo solo con fondo para el botón de compra]
TEXTOS: [los del banner de arriba, cada uno entre comillas con color, tamaño y posición; el precio ${f(oferta?.precio)}${oferta?.antes > oferta?.precio ? ` con el "antes" ${f(oferta.antes)} tachado` : ""}]
5. ganchos_video: 3 ideas de los primeros 3 segundos de un video de temporada (qué se ve y qué se dice).

REGLAS: las mismas de Meta y TikTok de siempre (sin atributos personales, sin promesas que no se puedan comprobar, sin 'el mejor' ni 'garantizado', sin testimonios ni cifras inventadas, sin logos de marcas ajenas, sin "Black Friday oficial"). Español de ${pais.nombre} con TÚ. El precio y la oferta deben ser IGUALES en todo el kit y en la landing.

Responde SOLO este JSON válido:
{ "copys": [ { "enfoque": "regalo", "texto_principal": "", "titulo": "", "descripcion": "" }, { "enfoque": "oferta", "texto_principal": "", "titulo": "", "descripcion": "" } ],
  "tiktok": { "texto": "", "caption": "", "ganchos": [] },
  "banner": { "titular": "", "subtitulo": "", "sello": "", "oferta": "", "cta": "" },
  "prompt_banner": "",
  "ganchos_video": [] }`;
}

// ---------- Reciclar un anuncio ganador: 5 variaciones nuevas manteniendo lo que lo hizo vender ----------
export function promptVariaciones({ texto = "", titulo = "", producto = "" } = {}, p = null) {
  const pais = PAISES[p?.pais] || PAISES.CO;
  return `${p ? contextoProducto(p) + "\n\n" : `PRODUCTO: ${limpio(producto, 200) || "(el del anuncio)"}\n\n`}ANUNCIO GANADOR (vendió de verdad en Meta; se está gastando porque la gente ya lo vio mucho):
Título: ${limpio(titulo, 200) || "(sin título)"}
Texto:
${limpio(texto, 2500)}

ROL: Media Buyer élite y copywriter de respuesta directa para pago contra entrega en ${pais.nombre}.

TAREA:
1. que_funciona: en 2 o 3 frases, qué hace que este anuncio venda (el gancho, el ángulo, la oferta, la estructura).
2. variaciones: 5 versiones NUEVAS del anuncio que mantengan lo que funciona pero se sientan frescas, cada una con un gancho distinto:
   - "pregunta": arranca con una situación del día a día en forma de pregunta general (sin señalar a la persona).
   - "historia": arranca con una mini historia de alguien usando el producto.
   - "beneficio": arranca con el resultado más fuerte.
   - "curiosidad": arranca con un dato o detalle que despierte curiosidad.
   - "objecion": arranca respondiendo la duda más común (por ejemplo pagar al recibir).
   Cada una con: gancho (la primera línea), texto_principal (8 a 12 líneas, misma oferta y mismos datos del original), titulo (máx. 40 caracteres) y descripcion (máx. 30).
   VARIEDAD: cada versión con otro estilo de lista (✅, números, flechas, párrafos cortos, preguntas y respuestas) y otros emojis del mundo del producto. Los títulos y descripciones hablan de beneficios, usos y ganchos: "pago contra entrega" o "paga al recibir" va en máximo 1 título y máximo 1 descripción de las 5.
REGLAS: NO inventes datos, precios, promesas, testimonios ni cifras que no estén en el anuncio original o en la ficha. Mismo precio y misma oferta. Reglas de Meta:
${lista(REGLAS_META)}
Español de ${pais.nombre} con TÚ.

Responde SOLO este JSON válido:
{ "que_funciona": "", "variaciones": [ { "tipo": "pregunta", "gancho": "", "texto_principal": "", "titulo": "", "descripcion": "" } ] }`;
}
