// =============================================
// 🖼️ PROMPTS DEL ESTUDIO DE LANDING (Desarrollo)
// Basados en la "Guía de trabajo: landings y creativos con IA".
// Aquí vive tu método: si aprendes una regla nueva, agrégala en REGLAS_APRENDIDAS
// y todas las landings nuevas la tendrán en cuenta.
// =============================================

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
  "Para un GIF, pide un círculo vacío 'negro y liso por dentro', con un pequeño rótulo arriba.",
  "No pidas pegar ropa o piezas de otra foto: pide 'recolorea' o describe la prenda.",
  "Para lencería o productos sensibles: genera una modelo adulta nueva, sin poses sugestivas ni desnudez.",
  "Logos de transportadoras, logo de la tienda y reseñas: deja recuadros vacíos para pegarlos después en Canva.",
  "Todos los textos entre comillas, con tildes y signos de español, sin errores. Nada de texto de plantilla visible (por ejemplo 'SECCIÓN 7').",
  "Mantén EXACTAMENTE el mismo modelo, color y diseño del producto en todas las imágenes.",
  "Listas de tallas o números: escríbelas completas y en orden, sin repetir."
];

export const LIMITES = [
  "Reseñas y testimonios: NUNCA inventes rostros, nombres, ciudades, calificaciones ('4.8/5'), cantidades de comentarios ni 'compra verificada'. Si hay sección de reseñas, deja tarjetas vacías para pegar reseñas reales (capturas de WhatsApp o fotos de clientes).",
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

// Catálogo de tipos de sección que puede tener una landing
export const CATALOGO_SECCIONES = {
  oferta:            { titulo: "Oferta (hero)", def: "Producto en uso, titular corto de 2 líneas en 2 colores, 3 beneficios, precio 'antes' tachado, precio actual grande en caja, sello de descuento, regalo si hay (con círculo para GIF), barra de confianza abajo." },
  dolor:             { titulo: "Dolor o identificación", def: "El problema del cliente con sus palabras; puede ser antes/después o una escena del problema. Cierra con una frase puente hacia la solución." },
  identificacion:    { titulo: "¿Es para ti?", def: "Lista 1-2-3 de situaciones en las que el cliente se reconoce, con íconos." },
  funcion_estrella:  { titulo: "La función estrella", def: "Lo que más vende del producto, mostrado en uso real, con 3 o 4 beneficios en íconos." },
  detalles:          { titulo: "Detalles y calidad", def: "Producto al centro con 4 círculos o tarjetas de zoom en materiales y acabados." },
  que_incluye:       { titulo: "¿Qué incluye?", def: "El producto con círculos numerados señalando cada pieza que llega, y círculo vacío para GIF." },
  tamano_variantes:  { titulo: "Tamaño, colores o variantes", def: "Medidas reales con referencia humana, tallas o colores disponibles completos y en orden." },
  como_se_usa:       { titulo: "Cómo se usa", def: "3 o 4 pasos numerados, cada uno con su foto real del producto en uso." },
  para_quien:        { titulo: "Para quién es / dónde se usa", def: "Collage de 3 o 4 escenas con personas del avatar usando el producto en distintos lugares." },
  antes_despues:     { titulo: "Antes y después", def: "Imagen partida en dos con flecha al centro: la situación sin el producto vs con el producto, con 4 beneficios abajo." },
  paquetes:          { titulo: "Paquetes", def: "Tarjetas de 1, 2 y 3 unidades con precio, 'antes' tachado, % de descuento y la del medio marcada 'MÁS VENDIDO'." },
  como_funciona:     { titulo: "Cómo funciona tu pedido", def: "3 pasos del contra entrega: haces tu pedido, confirmamos contigo, recibes y pagas. Quita el miedo a comprar." },
  por_que_aqui:      { titulo: "¿Por qué comprar aquí?", def: "Tabla comparativa 'Nuestra tienda' (✓) vs 'Otras opciones' (✗) con 5 filas y un recuadro vacío para el logo de la tienda." },
  resenas:           { titulo: "Reseñas reales (plantilla)", def: "Marco con 3 o 4 tarjetas VACÍAS para pegar capturas de reseñas reales. Sin nombres, caras ni estrellas inventadas." },
  preguntas:         { titulo: "Preguntas frecuentes", def: "5 preguntas con respuesta corta; la última SIEMPRE sobre pago contra entrega." },
  confianza:         { titulo: "Confianza y aliados", def: "Medallas de confianza y 'Nuestros aliados logísticos' con banderines vacíos para pegar logos de transportadoras." },
  oferta_cierre:     { titulo: "Oferta de cierre", def: "Repite precio, regalo y beneficios clave con una frase de cierre para quien llegó al final." }
};

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
PREFERENCIA DE ESTILO DEL DUEÑO: ${limpio(f.estiloPreferido, 300) || "(ninguna)"}
NOTAS DEL DUEÑO: ${limpio(f.notas, 1000) || "(ninguna)"}
`.trim();
}

const SISTEMA = `Eres el director creativo de una tienda de dropshipping con pago contra entrega en Colombia (pesos) y Ecuador (dólares).
No generas imágenes: escribes los prompts que el dueño pega en Gemini (un chat nuevo por imagen, adjuntando la foto real del producto y pegando primero el bloque de estilo y debajo el prompt), y los textos de venta.
La landing está hecha casi toda con imágenes verticales 9:16 (1080x1920). Los botones de compra, los GIF y las reseñas reales los agrega el dueño después en Shopify.
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

Responde SOLO este JSON válido:
{ "estilos": [ {
  "nombre": "",
  "idea": "",
  "fondo": "",
  "color1": "",
  "color2": "",
  "acento": "",
  "tipografia": "",
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

  return `Crea una imagen vertical 9:16 (1080x1920) para una landing page de ecommerce en ${pais.nombre}, en español.
TIPO DE IMAGEN: FOTOGRAFÍA REAL de ${e.tipo_foto || "producto y estilo de vida"}, personas reales, luz natural. PROHIBIDO: dibujo, ilustración, caricatura, animación o 3D.
DISEÑO GRÁFICO (encima de la foto): fondo ${e.fondo || "oscuro"}; titulares en ${e.tipografia || "sans extra bold"}, una línea en ${e.color1 || "blanco"} y otra en ${e.color2 || "color de acento"}; tarjetas ${tarjetas || "con bordes redondeados"}; íconos de línea en ${e.acento || e.color2 || "color de acento"}; precio grande dentro de una caja ${caja || "de color de acento"}; sello de descuento circular.
REGLA: el producto es el protagonista, grande y bien visible. Ningún texto lo tapa. Estilo de venta directa, no editorial.
PRODUCTO: usa EXACTAMENTE el producto de la foto adjunta: ${r.descripcionFisica || f.descripcion || p.nombre}.${noTiene ? ` NO tiene ni trae: ${noTiene}.` : ""} No agregues piezas, logos ni marcas.
TAMAÑO REAL: ${f.medidas || r.tamano || "(indicar medidas)"}. Respeta esa proporción junto a una persona.
PERSONAS: ${e.personas || `adultos de ${pais.nombre}, aspecto latino natural`}.
TEXTO: escribe los textos exactamente como te los doy, con tildes y signos de español, sin errores ni texto extra.`;
}

// ---------- Paso 4: proponer secciones ----------
export function promptPropuestaSecciones(p) {
  const n = p.numAvatares === 1 ? 1 : 2;
  const catalogo = Object.entries(CATALOGO_SECCIONES).map(([k, v]) => `- ${k}: ${v.titulo}. ${v.def}`).join("\n");
  return `${contextoProducto(p)}

AVATARES:
${resumenAvatares(p)}

ESTILO ELEGIDO: ${p.estilo?.nombre || ""} — ${p.estilo?.idea || ""}

CATÁLOGO DE TIPOS DE SECCIÓN:
${catalogo}

TAREA: Arma la estructura de la landing de 8 a 9 secciones para este producto, eligiendo del catálogo.
Orden base recomendado: oferta, dolor/identificación, función estrella, detalles o qué incluye, tamaño/variantes, cómo se usa, para quién es, por qué comprar aquí, preguntas frecuentes. Ajústalo al producto:
- "paquetes" solo si hay paquetes; "tamano_variantes" solo si hay tallas, colores o el tamaño importa; "que_incluye" si llegan varias piezas o hay regalo.
- La última o penúltima es "preguntas".
${n === 2 ? `- Hay 2 landings (A y B) que SOLO cambian en lo que le habla al avatar. Marca grupo "A/B" en: oferta, dolor (o identificación) y para_quien. Todo lo demás es grupo "compartida".` : `- Hay una sola landing: todas las secciones son grupo "compartida".`}
- Asigna a cada sección una COMPOSICIÓN distinta para que no se vea plana ni repetida (diagonal, franjas, collage, cuadrícula, zigzag, primer plano, partida en dos, producto central con círculos, tarjetas apiladas...). No repitas composición en secciones seguidas.
- formato: "9:16" casi siempre; "1:1" o "16:9" solo si la sección lo necesita (por ejemplo un antes/después cuadrado).

Responde SOLO este JSON válido:
{ "secciones": [ { "tipo": "", "titulo": "", "grupo": "${n === 2 ? "A/B o compartida" : "compartida"}", "formato": "9:16", "composicion": "", "proposito": "" } ] }`;
}

// ---------- Paso 4b: prompt de UNA sección ----------
export function promptSeccion(p, seccion, avatar, otras = []) {
  const tipo = CATALOGO_SECCIONES[seccion.tipo];
  const formato = seccion.formato && seccion.formato !== "9:16"
    ? `\nIMPORTANTE: esta imagen NO es 9:16, es ${seccion.formato === "1:1" ? "cuadrada 1:1 (1080x1080)" : "horizontal 16:9 (1920x1080)"}. Escríbelo al inicio del prompt.`
    : "";
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
Composición asignada: ${seccion.composicion || "elige una que no se repita"}${formato}

TAREA: Escribe el prompt de ESTA imagen con EXACTAMENTE este formato (texto plano, sin markdown, sin explicaciones antes ni después):

FOTOGRAFÍA REAL (no dibujo, no animación).
COMPOSICIÓN: [escena concreta, posición y tamaño del producto, encuadre, luz, personas con edad/aspecto/ropa, elementos gráficos y dónde va cada uno]
TEXTOS:
- Titular: "[línea 1]" (color) / "[línea 2]" (color)
- [subtítulo, tarjetas, íconos con su texto, etiquetas, precio, sello, barra inferior: cada texto entre comillas y con su color]
ESPACIOS VACÍOS: [círculo para GIF, recuadro para logo, tarjetas para reseñas reales o banderines para transportadoras, si aplica; si no aplica escribe "ninguno"]

Reglas para esta imagen:
- Titulares cortos (máximo 4 o 5 palabras por línea). Poco texto. El producto grande y sin tapar.
- Usa los precios exactamente así: ${formatoPrecio(p.ficha?.precio, p.pais) || "(sin precio)"}${p.ficha?.precioAntes ? ` y antes ${formatoPrecio(p.ficha.precioAntes, p.pais)}` : ""}${porcentajeDescuento(p.ficha?.precioAntes, p.ficha?.precio) ? ` (${porcentajeDescuento(p.ficha.precioAntes, p.ficha.precio)}% de descuento)` : ""}. No inventes otros.
- Solo promesas que sean verdad según la ficha.
- Recuerda decir lo que el producto NO tiene si hay riesgo de que la IA lo invente en esta escena.`;
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
