import { limpiarFuentes } from "./public/js/core/fuentes.js";
// =============================================
// 🖼️ PROMPTS DEL ESTUDIO DE LANDING (Desarrollo)
// Basados en la "Guía de trabajo: landings y creativos con IA".
// Aquí vive tu método: si aprendes una regla nueva, agrégala en REGLAS_APRENDIDAS
// y todas las landings nuevas la tendrán en cuenta.
// =============================================

import { SECCIONES, FORMATOS, varianteDe, tiposDe, claveDe, ACABADOS } from "./public/js/core/plantilla.js";

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
  "NUNCA pidas recuadros, marcos ni círculos vacíos para GIF, logo, botones o transportadoras: la IA los dibuja como cajas feas. Si el dueño va a pegar algo después, deja esa zona con el MISMO fondo de la imagen, lisa y sin bordes. Única excepción: las secciones de reseñas y de chats, que llevan tarjetas o burbujas blancas lisas (sin borde doble ni líneas por dentro).",
  "No pidas pegar ropa o piezas de otra foto: pide 'recolorea' o describe la prenda.",
  "Para lencería o productos sensibles: genera una modelo adulta nueva, sin poses sugestivas ni desnudez.",
  "Nombres de tipografías (Bebas Neue, Montserrat, etc.) y nombres de colores o códigos hex son instrucciones de diseño: NUNCA aparecen escritos en la imagen. En la imagen solo va el texto que está entre comillas.",
  "En comparaciones 'nosotros vs otros': la columna de los otros lleva SOLO desventajas con ✗; nunca repitas allí lo que incluye tu producto.",
  "Todos los textos entre comillas, con tildes y signos de español, sin errores. Nada de texto de plantilla visible (por ejemplo 'SECCIÓN 7').",
  "Mantén EXACTAMENTE el mismo modelo, color y diseño del producto en todas las imágenes.",
  "Listas de tallas o números: escríbelas completas y en orden, sin repetir."
];

export const LIMITES = [
  "Reseñas y testimonios: NUNCA inventes rostros, nombres, ciudades, calificaciones ('4.8/5'), cantidades de comentarios ni 'compra verificada'. Si hay sección de reseñas, solo el título y una zona de fondo liso (sin tarjetas ni marcos) donde el dueño pega capturas reales.",
  "Producto real: la imagen muestra exactamente lo que llega. No agregues detalles, piezas, logos ni empaques de marca que no existan.",
  "Promesas médicas: prohibido 'cura', 'elimina', 'reduce el dolor', 'indoloro' o porcentajes sin prueba. Usa 'soporte', 'molestias', 'calor leve', 'apoyo' y menciona para quién no es si aplica.",
  "Marcas ajenas: no escribas nombres de otras marcas (Nike, IKEA, etc.) ni digas que es el producto original u oficial de una marca, salvo que la ficha diga que es original o licenciado. Pide logos de terceros borrosos o sin logo.",
  "Personas reales: no uses ni recrees personas famosas, jugadores, ni animales o personas de noticias.",
  "Promesas comerciales: 'envío gratis', 'garantía', 'original', 'quedan pocas' SOLO si la ficha dice que son verdad.",
];

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
FORMATO DE LA LANDING: ${textoFormato(p)}
${p.tipo === "moda" ? `TIPO DE PRODUCTO: MODA (ropa, calzado o accesorio). Las fotos muestran la pieza PUESTA en una persona adulta real, natural, sin poses sugestivas; la talla, el color y el corte deben ser EXACTAMENTE los de la foto adjunta. Lista de tallas y colores siempre completa y en orden. No inventes medidas.
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
Deben ser personas reales que compran este producto por impulso en pago contra entrega. Cada avatar necesita su propio ángulo de venta.

Para cada avatar llena:
- quien: edad, sexo, ocupación y situación de vida
- problema: su problema o deseo principal
- probado: qué ha probado y por qué no le sirvió
- frase: una frase que diría con sus propias palabras (natural del país)
- angulo: el ángulo de venta para este avatar
- titular: el titular de la imagen 1 (oferta) en 2 líneas cortas, separadas por " / "
- escena: escena y modelo de las fotos (edad, aspecto, ropa, lugar)
- tono: tono del texto para este avatar

Responde SOLO este JSON válido:
{ "avatares": [ { "id": "A", "quien": "", "problema": "", "probado": "", "frase": "", "angulo": "", "titular": "", "escena": "", "tono": "" }${n === 2 ? `, { "id": "B", "quien": "", "problema": "", "probado": "", "frase": "", "angulo": "", "titular": "", "escena": "", "tono": "" }` : ""} ] }`;
}

const resumenAvatares = (p) => (p.avatares || []).map(a =>
  `AVATAR ${a.id}: ${a.quien || ""} | Problema: ${a.problema || ""} | Ángulo: ${a.angulo || ""} | Escena: ${a.escena || ""} | Tono: ${a.tono || ""} | Titular imagen 1: ${a.titular || ""}`
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
Cada estilo es una identidad completa: colores con código hex, tipografía, tipo de tarjetas, tipo de foto y tono.
Lo que siempre se mantiene en cualquier estilo: titular de dos líneas con dos colores, precio protagonista con el "antes" tachado, sello de descuento y barra de confianza abajo.
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

  return `${normal
    ? `Crea una imagen cuadrada 1:1 (1080x1080) para la página de producto de una tienda Shopify en ${pais.nombre}, en español. Poco texto dentro de la imagen: titular corto y etiquetas; el texto largo va al lado, en Shopify.`
    : `Crea una imagen vertical 9:16 (1080x1920) para una landing page de ecommerce en ${pais.nombre}, en español.`}
TIPO DE IMAGEN: FOTOGRAFÍA REAL de ${e.tipo_foto || "producto y estilo de vida"}, personas reales, luz natural. PROHIBIDO: dibujo, ilustración, caricatura, animación o 3D.
DISEÑO GRÁFICO (encima de la foto): fondo ${fondo || "oscuro"}; titulares en ${limpiarFuentes(e.tipografia) || "letra sans extra gruesa"}, una línea en ${color1 || "blanco"} y otra en ${color2 || "color de acento"}; tarjetas ${tarjetas || "con bordes redondeados"}; íconos de línea en ${acento || "color de acento"}; ${normal ? `cuando la imagen lleve precio, va dentro de una caja ${caja || "de color de acento"}` : `precio grande dentro de una caja ${caja || "de color de acento"}; sello de descuento circular`}.
${acabadoTexto(p)}
REGLA: el producto es el protagonista, grande y bien visible. Ningún texto lo tapa. Estilo de venta directa, no editorial.
PRODUCTO: usa EXACTAMENTE el producto de la foto adjunta: ${r.descripcionFisica || f.descripcion || p.nombre}.${noTiene ? ` NO tiene ni trae: ${noTiene}.` : ""} No agregues piezas, logos ni marcas.
TAMAÑO REAL: ${f.medidas || r.tamano || "(indicar medidas)"}. Respeta esa proporción junto a una persona.
PERSONAS: ${e.personas || `adultos de ${pais.nombre}, aspecto latino natural`}.
TEXTO: escribe los textos exactamente como te los doy, con tildes y signos de español, sin errores ni texto extra. Los nombres de letras, colores y estas instrucciones NO se escriben en la imagen.
NADA VACÍO: no dibujes recuadros, círculos ni marcos vacíos (salvo las tarjetas lisas de la sección de reseñas o chats).`;
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
  const catalogo = validos.map(k => `- ${k}: ${SECCIONES[k].titulo}. ${SECCIONES[k].def}`).join("\n");
  const fijas = seccionesFijas(p, plantilla);

  const estructura = fijas
    ? `TAREA: La estructura YA ESTÁ DEFINIDA por el dueño (Mi plantilla). Devuelve EXACTAMENTE estas ${fijas.length} secciones, en este orden, sin agregar ni quitar: ${fijas.join(", ")}.
Para cada una escribe un título propio para este producto, su propósito y una composición.`
    : normal
      ? `TAREA: Arma la estructura de la LANDING NORMAL de 6 a 8 secciones para este producto, eligiendo del catálogo.
- La primera SIEMPRE es "galeria" (las fotos cuadradas de la galería de Shopify).
- Orden base recomendado: ${moda ? "galeria, moda_vistas, moda_material, moda_fuera_estudio, moda_guia_tallas, moda_por_que, moda_cambio_talla, como_funciona" : "galeria, dolor, funcion_estrella, antes_despues, como_se_usa, detalles, para_quien, como_funciona, por_que_aqui"}. Ajústalo al producto.
- Las preguntas frecuentes van como texto en Shopify: no las pongas como imagen salvo que aporten mucho.`
      : `TAREA: Arma la estructura de la landing de 8 a 9 secciones para este producto, eligiendo del catálogo.
${moda ? `Es MODA. La primera SIEMPRE es "moda_portada". Orden base recomendado: moda_portada, moda_precio_tallas, moda_vistas, moda_material, moda_fuera_estudio, moda_guia_tallas, moda_por_que, moda_cambio_talla, preguntas.` : `Orden base recomendado: oferta, dolor/identificación, función estrella, detalles o qué incluye, tamaño/variantes, cómo se usa, para quién es, por qué comprar aquí, preguntas frecuentes.`} Ajústalo al producto:
- La última o penúltima es "preguntas".`;

  return `${contextoProducto(p)}

AVATARES:
${resumenAvatares(p)}

ESTILO ELEGIDO: ${p.estilo?.nombre || ""} — ${p.estilo?.idea || ""}

CATÁLOGO DE TIPOS DE SECCIÓN:
${catalogo}

${estructura}
- "paquetes" solo si hay paquetes; "tamano_variantes" solo si hay tallas, colores o el tamaño importa; "que_incluye" si llegan varias piezas o hay regalo.
${n === 2 ? `- Hay 2 landings (A y B) que SOLO cambian en lo que le habla al avatar. Marca grupo "A/B" en: ${normal ? "galeria" : (moda ? "moda_portada" : "oferta")}, dolor (o identificación) y para_quien. Todo lo demás es grupo "compartida".` : `- Hay una sola landing: todas las secciones son grupo "compartida".`}
- Asigna a cada sección una COMPOSICIÓN distinta para que no se vea plana ni repetida (diagonal, franjas, collage, cuadrícula, zigzag, primer plano, partida en dos, producto central con círculos, tarjetas apiladas...). No repitas composición en secciones seguidas.
- formato: ${normal ? `"1:1" siempre (imágenes cuadradas de Shopify)` : `"9:16" casi siempre; "1:1" o "16:9" solo si la sección lo necesita (por ejemplo un antes/después cuadrado)`}.

Responde SOLO este JSON válido:
{ "secciones": [ { "tipo": "", "titulo": "", "grupo": "${n === 2 ? "A/B o compartida" : "compartida"}", "formato": "${normal ? "1:1" : "9:16"}", "composicion": "", "proposito": "" } ] }`;
}

// ---------- Paso 4b: prompt de UNA sección ----------
const NOMBRE_FORMATO = { "9:16": "vertical 9:16 (1080x1920)", "1:1": "cuadrada 1:1 (1080x1080)", "4:5": "vertical 4:5 (1080x1350)", "16:9": "horizontal 16:9 (1920x1080)" };

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
  return `${contextoProducto(p)}

${avatar ? `ESTA IMAGEN LE HABLA AL AVATAR ${avatar.id}:
Quién es: ${avatar.quien || ""}
Problema/deseo: ${avatar.problema || ""}
Frase: ${avatar.frase || ""}
Ángulo: ${avatar.angulo || ""}
Titular sugerido imagen 1: ${avatar.titular || ""}
Escena y modelo: ${avatar.escena || ""}
Tono: ${avatar.tono || ""}` : `ESTA IMAGEN ES IGUAL PARA TODAS LAS LANDINGS: no la enfoques en un solo avatar.`}

BLOQUE DE ESTILO (el dueño lo pega antes de tu prompt; NO lo repitas):
${p.bloqueEstilo || construirBloqueEstilo(p)}

OTRAS SECCIONES DE ESTA LANDING (no repitas sus titulares ni su composición):
${otras.map(o => `- ${o.titulo} (${o.composicion || "sin composición"})`).join("\n") || "(ninguna)"}

SECCIÓN A ESCRIBIR: ${seccion.titulo} [tipo: ${seccion.tipo}]
Qué debe tener: ${tipo?.def || seccion.proposito || ""}
Propósito: ${seccion.proposito || ""}
Composición asignada: ${seccion.composicion || "elige una que no se repita"}${diseno}${formato}

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
COMPOSICIÓN: [escena concreta, posición y tamaño del producto, encuadre, luz, personas con edad/aspecto/ropa, elementos gráficos y dónde va cada uno]
TEXTOS:
- Titular: "[línea 1]" (color) / "[línea 2]" (color)
- [subtítulo, tarjetas, íconos con su texto, etiquetas${normal ? "" : ", precio, sello, barra inferior"}: cada texto entre comillas y con su color]
ZONA LIBRE: [si el dueño debe pegar algo después (GIF, logo, reseñas, transportadoras), di DÓNDE queda una zona lisa del mismo fondo, SIN dibujar recuadros, círculos ni marcos; si no aplica escribe "ninguna"]`}
${normal && !galeria ? `
Al final agrega el texto que va AL LADO de la imagen en Shopify (sección "Imagen con texto"), con este formato:
TEXTO PARA SHOPIFY
Título: "[máximo 8 palabras]"
Texto: "[2 o 3 frases cortas, vendedoras, sin repetir lo que ya dice la imagen]"` : ""}

Reglas para esta imagen:
- Titulares cortos (máximo 4 o 5 palabras por línea). Poco texto. El producto grande y sin tapar.${normal ? `
- Landing normal: NO pongas el precio en la imagen, salvo en "paquetes" y "oferta_cierre".` : ""}
- Si llevas precios, úsalos exactamente así: ${formatoPrecio(p.ficha?.precio, p.pais) || "(sin precio)"}${p.ficha?.precioAntes ? ` y antes ${formatoPrecio(p.ficha.precioAntes, p.pais)}` : ""}${porcentajeDescuento(p.ficha?.precioAntes, p.ficha?.precio) ? ` (${porcentajeDescuento(p.ficha.precioAntes, p.ficha.precio)}% de descuento)` : ""}. No inventes otros.
- Solo promesas que sean verdad según la ficha.
- Recuerda decir lo que el producto NO tiene si hay riesgo de que la IA lo invente en esta escena.`;
}

// ---------- Landing normal: textos del bloque de compra de Shopify ----------
export function promptTextosShopify(p, avatar) {
  return `${contextoProducto(p)}

AVATAR AL QUE LE HABLA ESTA LANDING (${avatar?.id || "A"}):
Quién es: ${avatar?.quien || ""}
Problema/deseo: ${avatar?.problema || ""}
Ángulo: ${avatar?.angulo || ""}
Tono: ${avatar?.tono || ""}

TAREA: Escribe los TEXTOS de la página de producto de Shopify (landing normal) para este avatar:
- titulo: título del producto, gancho corto con 1 emoji al inicio (máximo 12 palabras). Si hay regalo, agrégalo ("+ ¡... GRATIS! 🎁").
- frase_oferta: frase corta en mayúsculas sobre el precio (por ejemplo "RECIBE UN DESCUENTO EXCLUSIVO 👇"). Nada de urgencia falsa.
- beneficios: 4 o 5 beneficios cortos en MAYÚSCULAS (máximo 5 palabras cada uno), que irán con un ✔ verde.
- descripcion: 2 o 3 párrafos cortos para la descripción del producto (qué es, para quién, por qué ahora).
- especificaciones: lista de datos reales del producto (medidas, material, qué incluye). Solo datos de la ficha.
- envio: texto corto para la pestaña "Envío y devoluciones" con el pago contra entrega y SOLO las promesas verdaderas.
- preguntas: 5 preguntas frecuentes con respuesta corta; la última SIEMPRE sobre el pago contra entrega.

Solo promesas que sean verdad según la ficha. Sin promesas médicas. Sin inventar reseñas ni cifras de ventas.

Responde SOLO este JSON válido:
{ "titulo": "", "frase_oferta": "", "beneficios": [], "descripcion": "", "especificaciones": [], "envio": "", "preguntas": [ { "pregunta": "", "respuesta": "" } ] }`;
}

// ---------- Anuncios: copys para Meta y TikTok ----------
export function promptCopys(p, avatar, opciones = {}) {
  const pais = PAISES[p.pais] || PAISES.CO;
  const precio = formatoPrecio(p.ficha?.precio, p.pais);
  const mencionar = [
    opciones.envio && p.ficha?.promesas?.envioGratis ? "envío gratis" : null,
    opciones.contraEntrega !== false ? "pago contra entrega" : null,
    opciones.precio && precio ? `el precio (${precio})` : null
  ].filter(Boolean);
  return `${contextoProducto(p)}

AVATAR AL QUE LE HABLA (${avatar?.id || "A"}):
Quién es: ${avatar?.quien || ""}
Problema/deseo: ${avatar?.problema || ""}
Frase: ${avatar?.frase || ""}
Ángulo: ${avatar?.angulo || ""}
Tono: ${avatar?.tono || ""}

TAREA: Escribe los textos de anuncio para Meta Ads (Facebook e Instagram) y TikTok para este avatar en ${pais.nombre}.
- 3 variantes para Meta, una por enfoque: "problema" (problema → solución), "beneficio" (beneficio principal) y "curiosidad" (gancho de curiosidad).
  Cada una con:
  - texto_principal: 3 a 6 líneas cortas, fácil de escanear, CON emojis (3 a 6, bien puestos: al inicio de las líneas de beneficios y en el gancho) y saltos de línea. La primera línea es el gancho.
  - titulo: máximo 40 caracteres (va debajo de la imagen).
  - descripcion: máximo 30 caracteres.
- tiktok: 1 frase corta (máximo 100 caracteres) para el texto del anuncio en TikTok, SIN emojis y sin hashtags (solo texto).
- Menciona: ${mencionar.join(", ") || "nada extra"}.${!opciones.precio ? " NO pongas el precio." : ""}

REGLAS DE META (para que no rechacen el anuncio ni bloqueen la cuenta):
- No le digas a la persona que tiene una condición o atributo personal ("¿sufres de…?", "tu sobrepeso", "tu edad"). Habla de la situación, no de la persona.
- Sin promesas médicas ni resultados garantizados, sin antes/después exagerados, sin "original" u "oficial" si la ficha no lo dice.
- Sin urgencia falsa ("últimas unidades", "solo hoy") ni cifras inventadas (clientes, reseñas, ventas).
- Solo promesas verdaderas según la ficha.

Responde SOLO este JSON válido:
{ "meta": [ { "enfoque": "problema", "texto_principal": "", "titulo": "", "descripcion": "" }, { "enfoque": "beneficio", "texto_principal": "", "titulo": "", "descripcion": "" }, { "enfoque": "curiosidad", "texto_principal": "", "titulo": "", "descripcion": "" } ], "tiktok": "" }`;
}

// ---------- Anuncios: prompt de un ad estático ----------
export function promptAd(p, ad, avatar, estructura, formatoInfo) {
  const precio = formatoPrecio(p.ficha?.precio, p.pais);
  const antes = formatoPrecio(p.ficha?.precioAntes, p.pais);
  const desc = porcentajeDescuento(p.ficha?.precioAntes, p.ficha?.precio);
  return `${contextoProducto(p)}

ESTE ANUNCIO LE HABLA AL AVATAR ${avatar?.id || "A"}:
Quién es: ${avatar?.quien || ""}
Problema/deseo: ${avatar?.problema || ""}
Ángulo: ${avatar?.angulo || ""}
Escena y modelo: ${avatar?.escena || ""}
Tono: ${avatar?.tono || ""}

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

AVATAR AL QUE LE HABLA ESTE ANUNCIO (${avatar?.id || "A"}):
Quién es: ${avatar?.quien || ""}
Problema/deseo: ${avatar?.problema || ""}
Qué ha probado: ${avatar?.probado || ""}
Frase: ${avatar?.frase || ""}
Ángulo: ${avatar?.angulo || ""}
Tono: ${avatar?.tono || ""}

${ref ? `VIDEO DE REFERENCIA (transcripción; puede estar en inglés, chino u otro idioma):
"""
${ref}
"""
${guion.nota ? `NOTA DEL DUEÑO SOBRE EL VIDEO: ${limpio(guion.nota, 500)}` : ""}

TAREA: Reescribe este video como un guion de voz en off en español para el avatar. NO lo traduzcas literal: conserva la estructura y lo que lo hace funcionar (el gancho, el ritmo, las escenas), pero con palabras naturales de ${pais.nombre} y hablándole directo al avatar.`
: `TAREA: No hay video de referencia. Escribe un guion de voz en off original para el avatar, basado en su ángulo de venta y pensado para un video UGC sencillo de grabar.`}

FORMATO OBLIGATORIO DEL GUION:
- Duración 20 a 25 segundos: entre 50 y 65 palabras de voz (sin contar lo que va entre corchetes).
- Entre corchetes va lo que se VE en el video, que no se lee. Ejemplo: [Primer plano de la mochila abriéndose].
- Gancho fuerte en los primeros 3 segundos (primera frase).
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
