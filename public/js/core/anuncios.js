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

// ---------- 18 estructuras sacadas de 51 anuncios ganadores (docs/referencias/anuncios/E1…E18) ----------
// persona: si | no | opcional | parcial | mixta · precio: si | no | opcional | pequeno | protagonista
// familia "dolor" = dolor o comparación · tono: elegante | comercial | foto
const E = (o) => o;
export const RECETAS_AD = {
  e1: E({ cod: "E1", carpeta: "E1-producto-solo-en-ambiente", nombre: "Producto solo en ambiente", persona: "no", precio: "no", tono: "elegante",
    desc: "El producto (o 2 colores) protagonista en una escena bonita del nicho, con titular emocional y máximo 2 sellos.",
    bloques: ["Titular emocional de 3 a 7 palabras arriba.", "El producto (o 2 de sus colores) grande y protagonista, en una escena bonita y real del nicho (mesa, repisa, cama, cocina), con buena luz.", "1 línea corta de apoyo.", "Máximo 2 sellos pequeños (ej. 'Envío a todo el país')."],
    dibujo: [T(8, 40), T(14, 24, 18, "a"), ["r", 12, 24, 36, 40, "g", 4], ["r", 14, 70, 32, 5, "m", 2], ["c", 48, 80, 4, "a"]] }),
  e2: E({ cod: "E2", carpeta: "E2-editorial-tipo-revista", nombre: "Editorial tipo revista", persona: "no", precio: "opcional", tono: "elegante",
    desc: "Mucho espacio vacío, una palabra gigante en letra con serifa, el producto recortado al centro y un dato pequeño a un lado.",
    bloques: ["Fondo liso claro o de un solo color, con MUCHO espacio vacío.", "Una palabra gigante arriba en letra elegante con serifa (de estilo, no el nombre del producto).", "El producto recortado al centro, de estudio, sin persona.", "Un dato pequeño a un lado (el regalo o la oferta solo si este anuncio lleva precio).", "Los colores disponibles escritos en texto pequeño."],
    dibujo: [["r", 0, 0, 60, 90, "w"], T(10, 50, 5, "d"), ["r", 18, 26, 24, 38, "g", 3], ["t", 44, 46, 12, "a"], T(80, 30)] }),
  e3: E({ cod: "E3", carpeta: "E3-persona-mas-3-beneficios", nombre: "Persona + 3 beneficios", persona: "si", precio: "no", tono: "foto",
    desc: "Persona usando el producto a un lado; al otro, titular y 3 íconos con texto corto.",
    bloques: ["A un lado (mitad de la imagen): la persona usando el producto (de perfil, de frente o sosteniéndolo a cámara).", "Al otro lado arriba: titular de 2 o 3 líneas.", "Debajo del titular: 3 íconos circulares, cada uno con un beneficio de 2 a 4 palabras."],
    dibujo: [["r", 30, 6, 28, 78, "g", 3], T(12, 24, 4), T(18, 20, 4, "a"), ["c", 8, 34, 3, "a"], T(34, 14, 13), ["c", 8, 46, 3, "a"], T(46, 14, 13), ["c", 8, 58, 3, "a"], T(58, 14, 13)] }),
  e4: E({ cod: "E4", carpeta: "E4-collage-completo", nombre: "Collage completo", persona: "si", precio: "opcional", tono: "comercial",
    desc: "Persona al centro, lista de íconos a un lado, columna de 4 zooms con leyenda al otro y barra de confianza abajo.",
    bloques: ["Titular de 2 líneas arriba a la izquierda.", "Al centro, la persona usando el producto (medio plano).", "A la izquierda, una lista de 3 o 4 íconos redondos con texto corto.", "A la derecha, una columna de 4 recuadros con zoom a detalles reales del producto, cada uno con su leyenda.", "Abajo, una barra de confianza con 3 o 4 íconos."],
    dibujo: [T(6, 26, 3), ["r", 18, 12, 24, 58, "g", 3], ["c", 7, 24, 3, "a"], ["c", 7, 36, 3, "a"], ["c", 7, 48, 3, "a"], ["r", 46, 12, 12, 12, "m", 2], ["r", 46, 26, 12, 12, "m", 2], ["r", 46, 40, 12, 12, "m", 2], ["r", 46, 54, 12, 12, "m", 2], ["r", 0, 76, 60, 10, "d"]] }),
  e5: E({ cod: "E5", carpeta: "E5-callouts-con-flechas", nombre: "Callouts con flechas", persona: "no", precio: "opcional", tono: "comercial",
    desc: "Producto grande en uso real, con 4 a 6 etiquetas con ícono unidas por flechas curvas a cada parte.",
    bloques: ["Titular arriba (puede ser una pregunta del cliente).", "El producto grande en su uso real (sin persona, o solo manos).", "De 4 a 6 etiquetas redondeadas con ícono, alrededor del producto, cada una unida con una FLECHA CURVA a la parte real que explica.", "Abajo, el precio solo si este anuncio lleva precio."],
    dibujo: [T(6, 44), ["r", 16, 20, 28, 42, "g", 4], ["r", 2, 22, 12, 7, "w", 3], ["x", 14, 25, 20, 30, "a"], ["r", 46, 26, 12, 7, "w", 3], ["x", 46, 30, 40, 34, "a"], ["r", 2, 50, 12, 7, "w", 3], ["x", 14, 53, 20, 52, "a"], ["r", 46, 56, 12, 7, "w", 3], ["x", 46, 59, 40, 56, "a"]] }),
  e6: E({ cod: "E6", carpeta: "E6-cuadricula-de-fotos", nombre: "Cuadrícula de fotos", persona: "mixta", precio: "opcional", tono: "foto",
    desc: "3 o 4 fotos en cuadrícula (uso, producto solo, 2 detalles) y una banda inferior con nombre y oferta.",
    bloques: ["Cuadrícula de 3 o 4 fotos separadas por líneas finas: 1) el producto en uso, 2) el producto solo, 3) y 4) dos detalles de cerca.", "Una banda de color de lado a lado (abajo o al medio) con el titular y, si lleva precio, la oferta."],
    dibujo: [["r", 2, 2, 27, 34, "g", 1], ["r", 31, 2, 27, 34, "m", 1], ["r", 2, 38, 27, 30, "m", 1], ["r", 31, 38, 27, 30, "g", 1], ["r", 0, 72, 60, 16, "a"]] }),
  e7: E({ cod: "E7", carpeta: "E7-antes-y-despues-problema-solucion", nombre: "Antes y después / problema → solución", persona: "si", precio: "no", tono: "foto", familia: "dolor",
    desc: "Pantalla dividida: el problema real sin el producto y la solución con el producto, la misma persona a los dos lados.",
    bloques: ["Titular arriba, de lado a lado.", "Imagen DIVIDIDA en DOS MITADES (izquierda/derecha o arriba/abajo) con una línea clara entre ellas.", "Mitad 1: el PROBLEMA real del día a día SIN el producto (tonos más apagados, cara de molestia).", "Mitad 2: la MISMA persona con la SOLUCIÓN usando el producto (tonos vivos, cara de alivio).", "1 frase de beneficio en una cinta en el centro, entre las dos mitades."],
    dibujo: [T(6), ["r", 2, 12, 27, 60, "m", 2], ["r", 31, 12, 27, 60, "g", 2], ["r", 12, 74, 36, 8, "a", 4]] }),
  e8: E({ cod: "E8", carpeta: "E8-nuestro-vs-generico", nombre: "Nuestro vs genérico", persona: "no", precio: "no", tono: "elegante", familia: "dolor",
    desc: "Dos mitades de fondo distinto: nuestro producto con su ventaja vs un producto genérico sin marca.",
    bloques: ["Titular arriba centrado tipo 'Compara…'.", "Imagen dividida en 2 mitades de FONDO DISTINTO (ej. madera y gris liso).", "Mitad 1: NUESTRO producto, con el rótulo \"El nuestro\" (nunca una marca) y su ventaja real en 1 línea.", "Mitad 2: un producto GENÉRICO parecido, liso, SIN marca ni logo, con 1 línea neutra (ej. 'Mira lo que trae')."],
    dibujo: [["r", 0, 0, 30, 90, "g"], ["r", 30, 0, 30, 90, "m"], T(14, 44), ["r", 6, 30, 18, 26, "d", 3], ["r", 38, 30, 14, 26, "w", 3], T(64, 20, 5), T(64, 20, 35)] }),
  e9: E({ cod: "E9", carpeta: "E9-oferta-tipografica-2x1", nombre: "Oferta tipográfica 2x1", persona: "opcional", precio: "si", tono: "comercial",
    desc: "'2X1' o 'PAGA 1 LLEVA 2' gigante, las 2 unidades bien visibles, 1 frase de beneficio y una barra corta abajo.",
    bloques: ["La oferta en letras GIGANTES (ocupa un tercio de la imagen).", "Las unidades de la promo bien visibles y juntas (de colores distintos si hay).", "1 frase corta de beneficio.", "Una barra corta abajo con 2 o 3 datos de confianza."],
    dibujo: [["t", 8, 18, 44, "a"], ["t", 8, 24, 44, "a"], ["r", 6, 34, 22, 30, "g", 3], ["r", 32, 34, 22, 30, "g", 3], T(70, 34), ["r", 4, 78, 52, 8, "d", 3]] }),
  e10: E({ cod: "E10", carpeta: "E10-tabla-de-packs", nombre: "Tabla de packs", persona: "no", precio: "si", tono: "comercial",
    desc: "Producto arriba y 2 o 3 tarjetas de cantidad con 'antes' tachado y precio; la del medio marcada 'Más elegido'.",
    bloques: ["Titular corto arriba.", "El producto arriba, grande, de estudio.", "Abajo, 2 o 3 tarjetas lado a lado (una por paquete), cada una con su cantidad, el 'antes' tachado y el precio.", "La tarjeta del medio resaltada con la cinta 'Más elegido'."],
    dibujo: [T(6), ["r", 16, 12, 28, 30, "g", 4], ["r", 3, 48, 17, 32, "w", 3], ["r", 21.5, 44, 17, 36, "a", 3], ["r", 40, 48, 17, 32, "w", 3]] }),
  e11: E({ cod: "E11", carpeta: "E11-volante-de-precio-agresivo", nombre: "Volante de precio agresivo", persona: "opcional", precio: "protagonista", tono: "comercial",
    desc: "Precio enorme en rojo y amarillo con efecto pincel, persona o producto, 3 íconos redondos y frase de cierre en cursiva.",
    bloques: ["El precio ENORME en una mancha de pincel roja con letras amarillas (es lo más grande de la imagen).", "La persona usando el producto o el producto grande al otro lado.", "3 íconos redondos con 2 o 3 palabras cada uno.", "Frase de cierre corta en letra cursiva abajo."],
    dibujo: [["r", 30, 8, 28, 22, "a", 2], ["t", 33, 19, 22, "w"], ["r", 2, 10, 26, 70, "g", 3], ["c", 8, 40, 4, "d"], ["c", 8, 52, 4, "d"], ["c", 8, 64, 4, "d"], T(82, 28, 30)] }),
  e12: E({ cod: "E12", carpeta: "E12-fecha-o-temporada", nombre: "Fecha o temporada", persona: "opcional", precio: "opcional", tono: "comercial", conFecha: true,
    desc: "La fecha o el evento como titular, escena decorada, el producto y una oferta o urgencia real.",
    bloques: ["La FECHA o EVENTO como titular grande (la que eligió el dueño).", "Escena decorada para esa fecha (luces, regalos, colores de la temporada) con el producto protagonista.", "La oferta solo si este anuncio lleva precio; si no, 1 frase de la temporada.", "Barra corta abajo con 2 o 3 datos de confianza."],
    dibujo: [["r", 0, 0, 60, 90, "d"], T(10, 44, 8, "w"), T(17, 30, 15, "a"), ["c", 8, 30, 2, "a"], ["c", 52, 26, 2, "a"], ["r", 14, 30, 32, 40, "g", 4], ["r", 6, 78, 48, 7, "a", 3]] }),
  e13: E({ cod: "E13", carpeta: "E13-frase-de-estilo-de-vida", nombre: "Frase de estilo de vida", persona: "parcial", precio: "no", tono: "foto",
    desc: "Foto real del producto en uso, plano cerrado o de cine, con UNA sola frase grande. Nada más.",
    bloques: ["Foto real del producto en uso, plano cerrado o encuadre de cine (solo manos, piernas o parte del cuerpo; sin cara).", "UNA sola frase grande en letra con serifa blanca, arriba.", "NADA más: sin íconos, sin barra, sin sellos, sin precio."],
    dibujo: [["r", 0, 0, 60, 90, "g"], T(10, 48, 6, "w"), T(16, 40, 10, "w"), ["r", 20, 48, 32, 30, "m", 3]] }),
  e14: E({ cod: "E14", carpeta: "E14-pregunta-o-situacion", nombre: "Pregunta o situación del cliente", persona: "no", precio: "no", tono: "elegante", familia: "dolor",
    desc: "Una pregunta o situación cotidiana como titular (con una palabra resaltada), el producto solo al centro y 1 frase de remate.",
    bloques: ["Titular con una pregunta o situación cotidiana del cliente, con UNA palabra o frase resaltada con un fondo de color.", "El producto solo al centro, de estudio, sin persona.", "Si ayuda, una flecha fina a la parte que resuelve la situación, con 2 a 4 palabras.", "1 frase de remate abajo, separada por una línea fina."],
    dibujo: [["r", 0, 0, 60, 90, "d"], T(10, 44, 6, "w"), ["r", 6, 16, 44, 6, "a", 3], ["r", 20, 30, 20, 30, "g", 4], ["x", 42, 40, 52, 40, "a"], ["x", 4, 70, 56, 70, "a"], T(78, 40, 6, "w")] }),
  e15: E({ cod: "E15", carpeta: "E15-escena-de-uso-precio-en-esquina", nombre: "Escena de uso + precio en esquina", persona: "opcional", precio: "pequeno", tono: "foto",
    desc: "El producto en su ambiente real con un uso concreto, titular de beneficio, etiqueta de precio pequeña en una esquina y barra fina abajo.",
    bloques: ["Titular de beneficio arriba (2 líneas).", "El producto en su ambiente real (cocina, cancha, baño…) en un uso concreto, foto real.", "Una etiqueta de precio PEQUEÑA en una esquina (solo si este anuncio lleva precio).", "Una barra fina abajo con 3 datos de confianza en una línea."],
    dibujo: [["r", 0, 0, 60, 90, "g"], T(8, 40, 16, "d"), T(14, 32, 24, "d"), ["r", 8, 30, 40, 36, "m", 3], ["r", 42, 52, 16, 9, "a", 2], ["r", 0, 82, 60, 6, "d"]] }),
  e16: E({ cod: "E16", carpeta: "E16-mitad-foto-mitad-panel", nombre: "Mitad foto / mitad panel", persona: "opcional", precio: "opcional", tono: "elegante",
    desc: "Mitad: persona o producto a todo alto. Otra mitad: panel liso con titular, colores en círculos con nombre, 2 checks y un botón.",
    bloques: ["Mitad izquierda: la persona usando el producto (o el producto) a TODO el alto de la imagen.", "Mitad derecha: un panel liso de un color claro.", "En el panel: titular grande en letra elegante.", "En el panel: los colores disponibles en círculos con su nombre debajo (si hay más de uno).", "En el panel: 2 líneas con check (✓) y un botón redondeado al final."],
    dibujo: [["r", 0, 0, 30, 90, "g"], ["r", 30, 0, 30, 90, "w"], T(10, 22, 34, "a"), T(16, 22, 34, "a"), ["c", 37, 34, 3, "a"], ["c", 45, 34, 3, "m"], ["c", 53, 34, 3, "g"], T(50, 20, 36), T(58, 20, 36), ["r", 34, 70, 22, 7, "a", 3]] }),
  e17: E({ cod: "E17", carpeta: "E17-persona-a-camara-con-producto", nombre: "Persona a cámara con el producto", persona: "si", precio: "no", tono: "foto",
    desc: "Persona mirando a cámara con el producto en las manos, cerca de la cara; titular de recomendación o identidad y 3 íconos.",
    bloques: ["A un lado: la persona mirando a la cámara, sosteniendo el producto con las dos manos cerca de la cara.", "Al otro lado: titular de recomendación o identidad (ej. de otro producto: 'Los tenis que no me quito').", "Debajo: 3 íconos circulares con texto corto.", "Un botón redondeado al final."],
    dibujo: [["r", 0, 0, 60, 90, "d"], ["r", 2, 8, 28, 76, "g", 3], T(14, 24, 33, "w"), T(21, 24, 33, "a"), ["c", 36, 40, 3, "a"], ["c", 36, 50, 3, "a"], ["c", 36, 60, 3, "a"], ["r", 34, 72, 22, 7, "w", 3]] }),
  e18: E({ cod: "E18", carpeta: "E18-escena-arriba-beneficios-abajo", nombre: "Escena arriba + beneficios abajo", persona: "opcional", precio: "no", tono: "comercial",
    desc: "Arriba la escena del resultado con 2 frases de beneficio a los lados; abajo el producto grande y 4 beneficios en píldoras.",
    bloques: ["Mitad de arriba: la escena del resultado de usar el producto, con 2 frases de beneficio grandes a los lados.", "Mitad de abajo, sobre un fondo de color con borde curvo: el producto grande a un lado.", "Al otro lado, una lista de 4 beneficios en píldoras redondeadas, cada una con su ícono."],
    dibujo: [["r", 0, 0, 60, 44, "g"], T(10, 16, 4, "w"), T(10, 16, 40, "w"), ["r", 0, 44, 60, 46, "a"], ["r", 4, 50, 26, 8, "w", 4], ["r", 4, 60, 26, 8, "w", 4], ["r", 4, 70, 26, 8, "w", 4], ["r", 4, 80, 26, 8, "w", 4], ["r", 36, 48, 18, 38, "g", 3]] })
};
export const TAGS_AD = (r) => [r.persona === "no" ? "sin persona" : r.persona === "si" ? "con persona" : "", ["si", "protagonista"].includes(r.precio) ? "con precio" : "", r.familia === "dolor" ? "dolor" : "", r.conFecha ? "fecha" : ""].filter(Boolean);
export const llevaPersonaAd = (r) => ["si", "mixta"].includes(r?.persona);
export const precioObligatorio = (r) => ["si", "protagonista"].includes(r?.precio);
export const precioPosible = (r) => r && r.precio !== "no";
export const FECHAS_AD = { "": "Ninguna", black_friday: "Black Friday", navidad: "Navidad", madres: "Día de la Madre", padres: "Día del Padre", amor_amistad: "Amor y Amistad", regreso_clases: "Regreso a clases" };

// ---------- Mezcla automática: N estructuras distintas cumpliendo las reglas ----------
// conPrecio: 0, 1, 2 o "mitad" (nunca más del 40%) · fecha: clave de FECHAS_AD · hayDolor: la Ficha/avatar tiene un dolor claro
export function maxConPrecio(n, conPrecio) {
  const tope = Math.floor(n * 0.4);
  const pedido = conPrecio === "mitad" ? Math.floor(n / 2) : Number(conPrecio) || 0;
  return Math.max(0, Math.min(tope, pedido));
}
// hayPaquetes: la tabla de packs (E10) solo sirve si la oferta es de paquetes 1, 2, 3
export function mezclarAds({ n = 5, conPrecio = 1, fecha = "", hayDolor = true, hayPaquetes = false, azar = Math.random } = {}) {
  const claves = Object.keys(RECETAS_AD).filter(k => (!RECETAS_AD[k].conFecha || fecha) && (k !== "e10" || hayPaquetes));
  const barajar = (arr) => arr.map(x => [azar(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  n = Math.max(1, Math.min(n, claves.length));
  const kPrecio = maxConPrecio(n, conPrecio);
  for (let intento = 0; intento < 400; intento++) {
    let elegidas = [];
    if (fecha) elegidas.push("e12");
    if (hayDolor) elegidas.push(barajar(["e7", "e8", "e14"])[0]);
    const conP = barajar(claves.filter(k => precioObligatorio(RECETAS_AD[k]) && !elegidas.includes(k)));
    const obligPrecio = elegidas.filter(k => precioObligatorio(RECETAS_AD[k])).length;
    elegidas.push(...conP.slice(0, Math.max(0, Math.min(kPrecio, 1) - obligPrecio)));
    for (const k of barajar(claves)) {
      if (elegidas.length >= n) break;
      if (elegidas.includes(k)) continue;
      if (precioObligatorio(RECETAS_AD[k]) && elegidas.filter(x => precioObligatorio(RECETAS_AD[x])).length >= kPrecio) continue;
      elegidas.push(k);
    }
    elegidas = elegidas.slice(0, n);
    const sinPersona = elegidas.filter(k => RECETAS_AD[k].persona === "no").length;
    const obligatorias = elegidas.filter(k => precioObligatorio(RECETAS_AD[k])).length;
    const tonos = new Set(elegidas.map(k => RECETAS_AD[k].tono));
    if (elegidas.length === n && sinPersona >= Math.ceil(n / 3) && obligatorias <= kPrecio && (n < 3 || tonos.size >= 2)) {
      return conPrecioAsignado(elegidas, kPrecio, azar);
    }
  }
  return conPrecioAsignado(claves.slice(0, n), kPrecio, azar);
}
// Qué anuncios llevan precio: primero los que lo exigen, luego los "opcional/pequeño" hasta el tope
export function conPrecioAsignado(claves, kPrecio, azar = Math.random) {
  const out = claves.map(k => ({ estructura: k, precio: precioObligatorio(RECETAS_AD[k]) }));
  let usados = out.filter(x => x.precio).length;
  for (const x of out.map(v => [azar(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1])) {
    if (usados >= kPrecio) break;
    if (!x.precio && precioPosible(RECETAS_AD[x.estructura])) { x.precio = true; usados++; }
  }
  return out;
}

// Las estructuras de antes siguen sirviendo para los anuncios que ya existen
const ESTRUCTURAS_VIEJAS = {
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

export const ESTRUCTURAS_AD = { ...RECETAS_AD, ...Object.fromEntries(Object.entries(ESTRUCTURAS_VIEJAS).map(([k, v]) => [k, { ...v, vieja: true, persona: "opcional", precio: "opcional", bloques: [v.desc] }])) };

export const ENFOQUES_COPY = {
  aida: "AIDA",
  pas: "PAS · problema, agitación, solución",
  beneficio: "Beneficio directo",
  prueba_social: "Prueba social / regalo",
  historia: "Mini historia",
  curiosidad: "Curiosidad / gancho",
  objecion: "Rompe la duda",
  momentos: "Momentos de uso",
  razones: "X razones",
  comparacion: "Antes y ahora del día a día",
  // copys viejos
  problema: "Problema → causa real → solución"
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
