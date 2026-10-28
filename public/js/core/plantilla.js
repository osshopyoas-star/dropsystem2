// =============================================
// 🧩 MI PLANTILLA — catálogo de secciones y estilos
// Lo usan el servidor (prompts) y el navegador (pantalla Mi plantilla).
// Sin dependencias: funciona en los dos lados.
// =============================================

// Dos formatos de landing en Shopify
export const FORMATOS = {
  ban: {
    nombre: "Ban page",
    corto: "Ban page",
    desc: "Toda la página son imágenes verticales 9:16, una debajo de otra. El precio va dentro de la imagen.",
    formatoImagen: "9:16"
  },
  normal: {
    nombre: "Landing normal",
    corto: "Landing normal",
    desc: "Página de producto de Shopify: fotos de galería, título, precio y botón de Shopify; abajo secciones de imagen con texto.",
    formatoImagen: "1:1"
  }
};

// Dibujos: lienzo 60 x 90. Tonos: d oscuro, g gris, m gris medio, a acento, w blanco
// ["r", x, y, w, h, tono, radio] rectángulo · ["c", cx, cy, r, tono] círculo · ["o", cx, cy, r, tono] aro
// ["t", x, y, ancho, tono] línea de texto · ["x", x1, y1, x2, y2, tono] línea
const T = (y, w = 36, x = (60 - w) / 2, tono = "d") => ["t", x, y, w, tono];

// ---------- Catálogo ----------
// formatos: en cuáles se puede usar · siempre: en qué formato no se puede apagar
export const SECCIONES = {
  oferta: {
    titulo: "Portada / oferta (hero)", formatos: ["ban"], tipos: ["producto"], siempre: ["ban"],
    def: "Producto en uso, titular corto de 2 líneas en 2 colores, 3 beneficios, precio 'antes' tachado, precio actual grande en caja, sello de descuento, regalo si hay (con zona lisa del fondo para pegar el GIF, sin círculo ni marco), barra de confianza abajo.",
    variantes: [
      { id: "caja", nombre: "Precio en caja", desc: "Titular arriba, foto grande del producto en uso al centro, y abajo una caja de color con el precio grande, el 'antes' tachado y un sello circular de descuento.",
        dibujo: [T(7), T(12, 26, 17, "a"), ["r", 6, 17, 48, 40, "g", 3], ["r", 8, 62, 34, 14, "a", 3], ["t", 11, 66, 18, "w"], ["t", 11, 71, 26, "w"], ["c", 48, 69, 7, "d"]] },
      { id: "franja", nombre: "Franja de color", desc: "Foto grande arriba ocupando casi toda la imagen y una franja de color abajo de borde a borde con el titular, el precio y el 'antes' tachado.",
        dibujo: [["r", 0, 0, 60, 56, "g"], ["r", 0, 56, 60, 34, "a"], ["t", 10, 62, 40, "w"], ["t", 16, 68, 28, "w"], ["r", 17, 74, 26, 9, "w", 3]] },
      { id: "senalado", nombre: "Producto con beneficios señalados", desc: "Producto grande a un lado y 3 o 4 beneficios con íconos circulares al otro lado, unidos al producto con líneas finas que señalan cada parte; precio en caja abajo.",
        dibujo: [T(6), ["o", 12, 20, 5, "a"], ["o", 12, 34, 5, "a"], ["o", 12, 48, 5, "a"], ["x", 17, 20, 30, 24, "m"], ["x", 17, 34, 30, 36, "m"], ["x", 17, 48, 30, 46, "m"], ["r", 30, 16, 26, 40, "g", 4], ["r", 10, 64, 40, 13, "a", 3], ["t", 16, 69, 28, "w"]] },
      { id: "titular", nombre: "Titular primero", desc: "Titular enorme de 2 líneas arriba ocupando el primer tercio, debajo el producto grande sobre fondo limpio y un sello de precio circular grande en una esquina.",
        dibujo: [["t", 6, 8, 48, "d"], ["t", 6, 14, 48, "a"], ["t", 12, 20, 36, "m"], ["r", 8, 26, 44, 48, "g", 4], ["c", 46, 70, 9, "a"], ["t", 41, 69, 10, "w"]] },
      { id: "polaroid", nombre: "Polaroid", desc: "La foto del producto dentro de un marco blanco tipo polaroid, un poco inclinado, con el titular escrito en la parte blanca de abajo del marco; precio en sello al lado.",
        dibujo: [["r", 9, 8, 42, 56, "w", 1], ["r", 12, 11, 36, 38, "g"], ["t", 15, 53, 30, "d"], ["t", 19, 58, 22, "m"], ["r", 14, 70, 32, 10, "a", 3]] }
    ]
  },
  galeria: {
    titulo: "Fotos de la galería", formatos: ["normal"], siempre: ["normal"],
    def: "4 fotos cuadradas 1:1 para la galería del producto en Shopify: 1) producto con sus beneficios señalados, 2) producto en uso, 3) detalle de calidad, 4) qué incluye o paquetes. Poco texto, nada de precio (el precio lo pone Shopify).",
    variantes: [
      { id: "senalado", nombre: "Beneficios señalados", desc: "La foto 1 es el producto grande con 3 o 4 beneficios en íconos circulares unidos con líneas finas; las demás son limpias.",
        dibujo: [["r", 6, 6, 48, 48, "d", 3], ["o", 14, 16, 4, "w"], ["o", 14, 30, 4, "w"], ["o", 14, 44, 4, "w"], ["r", 28, 14, 22, 34, "g", 3], ["r", 6, 58, 11, 11, "g", 2], ["r", 19, 58, 11, 11, "g", 2], ["r", 32, 58, 11, 11, "g", 2], ["r", 45, 58, 9, 11, "g", 2], T(76, 40)] },
      { id: "limpia", nombre: "Estudio limpio", desc: "Fotos de estudio con fondo de un color liso, producto centrado y grande, un sello pequeño de descuento en la foto 1.",
        dibujo: [["r", 6, 6, 48, 48, "g", 3], ["r", 18, 14, 24, 32, "w", 3], ["c", 47, 13, 5, "a"], ["r", 6, 58, 11, 11, "g", 2], ["r", 19, 58, 11, 11, "g", 2], ["r", 32, 58, 11, 11, "g", 2], ["r", 45, 58, 9, 11, "g", 2], T(76, 40)] },
      { id: "en_uso", nombre: "En uso con titular", desc: "La foto 1 es una persona usando el producto con un titular corto de 2 líneas arriba; las demás muestran detalles y uso.",
        dibujo: [["r", 6, 6, 48, 48, "g", 3], ["t", 12, 11, 36, "d"], ["t", 16, 16, 28, "a"], ["r", 18, 22, 24, 28, "m", 3], ["r", 6, 58, 11, 11, "g", 2], ["r", 19, 58, 11, 11, "g", 2], ["r", 32, 58, 11, 11, "g", 2], ["r", 45, 58, 9, 11, "g", 2], T(76, 40)] }
    ]
  },
  dolor: {
    titulo: "Dolor o identificación", formatos: ["ban", "normal"],
    def: "El problema del cliente con sus palabras; puede ser antes/después o una escena del problema. Cierra con una frase puente hacia la solución.",
    variantes: [
      { id: "partida", nombre: "Escena partida", desc: "Imagen partida en dos: arriba la persona frustrada con el problema (tonos apagados) y abajo la misma persona aliviada con el producto (tonos vivos), con una frase puente en el medio.",
        dibujo: [T(6), ["r", 6, 11, 48, 32, "m", 3], ["r", 14, 46, 32, 6, "a", 3], ["r", 6, 55, 48, 30, "g", 3]] },
      { id: "primer_plano", nombre: "Primer plano con frase", desc: "Primer plano emocional de la persona viviendo el problema, con una frase grande entre comillas como si la dijera ella, y abajo una frase puente.",
        dibujo: [["r", 0, 0, 60, 90, "g"], ["t", 8, 14, 44, "d"], ["t", 8, 20, 36, "d"], ["r", 12, 30, 36, 40, "m", 20], ["t", 12, 78, 36, "a"]] },
      { id: "lista", nombre: "Lista de frustraciones", desc: "Titular arriba, foto de la escena del problema y una lista de 3 o 4 frustraciones con una ✗ roja cada una, cerrando con una frase puente.",
        dibujo: [T(7), ["r", 6, 12, 48, 30, "g", 3], ["c", 10, 50, 2.5, "a"], T(50, 36, 15), ["c", 10, 58, 2.5, "a"], T(58, 36, 15), ["c", 10, 66, 2.5, "a"], T(66, 36, 15), ["t", 12, 78, 36, "a"]] }
    ]
  },
  causa: {
    titulo: "La verdadera causa (el problema)", formatos: ["ban", "normal"], tipos: ["producto"],
    def: "Le explica en simple POR QUÉ le pasa el problema y por qué lo que ya probó no le funcionó (lo descarta: 'No es X, no es Y'), y le muestra la causa real con un gráfico muy fácil de entender. Cierra con una frase puente: por eso este producto ataca justo esa causa. Educa, no grita 'cómpralo'. Sin diagnósticos ni promesas médicas.",
    variantes: [
      { id: "tablero", nombre: "Tablero explicativo", desc: "Titular arriba ('El problema no es lo que crees'), un tablero o pizarra con un dibujo de líneas simples tipo tiza que señala la causa real con una flecha, y una frase corta '¡así de fácil!'; abajo la frase puente hacia el producto.",
        dibujo: [T(7), ["r", 6, 14, 48, 40, "d", 2], ["x", 14, 34, 46, 34, "w"], ["x", 30, 20, 30, 46, "w"], ["o", 30, 46, 3, "w"], ["x", 40, 48, 33, 46, "a"], ["t", 34, 50, 16, "a"], ["r", 10, 62, 40, 10, "a", 3], T(78, 30)] },
      { id: "tachados", nombre: "Mitos tachados", desc: "Tres etiquetas con lo que la gente cree que es la causa (o lo que ya probó), tachadas con una línea roja; debajo, resaltada en grande, la causa real; abajo el producto y la frase puente.",
        dibujo: [T(7), ["r", 14, 14, 32, 7, "w", 4], ["x", 14, 17.5, 46, 17.5, "a"], ["r", 14, 24, 32, 7, "w", 4], ["x", 14, 27.5, 46, 27.5, "a"], ["r", 12, 35, 36, 10, "a", 4], ["r", 18, 50, 24, 26, "g", 4], T(82, 32)] },
      { id: "lupa", nombre: "Bajo la lupa", desc: "Una escena real con un círculo de acercamiento tipo lupa que muestra de cerca dónde está el problema (con líneas simples que lo señalan), un titular corto con la causa y la frase puente abajo.",
        dibujo: [T(7), ["r", 0, 14, 60, 50, "g"], ["o", 38, 34, 13, "w"], ["x", 29, 43, 20, 54, "w"], ["t", 6, 70, 40, "a"], T(78, 30)] }
    ]
  },
  identificacion: {
    titulo: "¿Es para ti?", formatos: ["ban", "normal"],
    def: "Situaciones en las que el cliente se reconoce, con íconos.",
    variantes: [
      { id: "lista123", nombre: "Lista 1-2-3", desc: "Titular '¿Es para ti?' y 3 situaciones numeradas grandes 1, 2, 3, cada una con un ícono y una foto pequeña.",
        dibujo: [T(7), ["c", 12, 22, 5, "a"], ["r", 20, 17, 34, 10, "g", 2], ["c", 12, 40, 5, "a"], ["r", 20, 35, 34, 10, "g", 2], ["c", 12, 58, 5, "a"], ["r", 20, 53, 34, 10, "g", 2], ["r", 14, 72, 32, 8, "d", 4]] },
      { id: "tarjetas", nombre: "Tarjetas con foto", desc: "Cuadrícula de 4 tarjetas, cada una con una foto de una situación real y una frase corta debajo.",
        dibujo: [T(7), ["r", 6, 14, 23, 30, "g", 3], ["r", 31, 14, 23, 30, "g", 3], ["r", 6, 47, 23, 30, "g", 3], ["r", 31, 47, 23, 30, "g", 3]] },
      { id: "chat", nombre: "Chat de WhatsApp", desc: "Burbujas de chat estilo WhatsApp con las preguntas o quejas típicas del cliente (sin nombres ni fotos de personas reales), y una burbuja final de la tienda con la solución.",
        dibujo: [["r", 0, 0, 60, 90, "g"], ["r", 6, 10, 34, 9, "w", 4], ["r", 6, 23, 30, 9, "w", 4], ["r", 20, 36, 34, 9, "a", 4], ["r", 6, 49, 36, 9, "w", 4], ["r", 18, 62, 36, 12, "a", 4]] }
    ]
  },
  funcion_estrella: {
    titulo: "La función estrella", formatos: ["ban", "normal"], tipos: ["producto"],
    def: "Lo que más vende del producto, mostrado en uso real, con 3 o 4 beneficios en íconos.",
    variantes: [
      { id: "senalado", nombre: "Beneficios señalados", desc: "Producto grande al centro y 3 o 4 beneficios con íconos circulares a los lados, unidos con líneas finas a la parte del producto que explican.",
        dibujo: [T(6), ["r", 20, 14, 22, 58, "g", 4], ["o", 10, 22, 5, "a"], ["o", 10, 44, 5, "a"], ["o", 50, 33, 5, "a"], ["o", 50, 56, 5, "a"], ["x", 15, 22, 22, 26, "m"], ["x", 15, 44, 22, 46, "m"], ["x", 45, 33, 40, 36, "m"], ["x", 45, 56, 40, 58, "m"], T(80, 30)] },
      { id: "tarjetas", nombre: "Foto y tarjetas", desc: "Foto grande en uso arriba y abajo una fila de 3 o 4 tarjetas con ícono y beneficio corto.",
        dibujo: [T(6), ["r", 6, 11, 48, 44, "g", 3], ["r", 6, 59, 14, 18, "w", 3], ["r", 23, 59, 14, 18, "w", 3], ["r", 40, 59, 14, 18, "w", 3], ["c", 13, 65, 3, "a"], ["c", 30, 65, 3, "a"], ["c", 47, 65, 3, "a"]] },
      { id: "iconos_fila", nombre: "Íconos en fila", desc: "Foto a sangre de borde a borde y encima, abajo, una fila de 4 íconos circulares grandes con su beneficio debajo.",
        dibujo: [["r", 0, 0, 60, 62, "g"], T(8, 34, 13, "w"), ["c", 10, 72, 5, "a"], ["c", 24, 72, 5, "a"], ["c", 38, 72, 5, "a"], ["c", 52, 72, 5, "a"], ["t", 5, 81, 50, "m"]] }
    ]
  },
  detalles: {
    titulo: "Detalles y calidad", formatos: ["ban", "normal"], tipos: ["producto"],
    def: "Primeros planos de materiales y acabados.",
    variantes: [
      { id: "circulos", nombre: "Círculos de zoom", desc: "Producto al centro y 4 círculos de zoom alrededor mostrando materiales y acabados, cada uno con su rótulo.",
        dibujo: [T(6), ["r", 18, 24, 24, 40, "g", 4], ["o", 10, 20, 7, "a"], ["o", 50, 20, 7, "a"], ["o", 10, 68, 7, "a"], ["o", 50, 68, 7, "a"]] },
      { id: "cuadricula", nombre: "Cuadrícula 2x2", desc: "Cuadrícula de 4 primeros planos del producto, cada uno con un rótulo corto en una etiqueta.",
        dibujo: [T(6), ["r", 6, 12, 23, 34, "g", 2], ["r", 31, 12, 23, 34, "g", 2], ["r", 6, 48, 23, 34, "g", 2], ["r", 31, 48, 23, 34, "g", 2], ["r", 8, 40, 14, 4, "a", 2], ["r", 33, 40, 14, 4, "a", 2]] },
      { id: "tarjetas", nombre: "Tarjetas apiladas", desc: "3 tarjetas horizontales apiladas, cada una con un primer plano a un lado y el detalle explicado al otro.",
        dibujo: [T(6), ["r", 6, 12, 48, 21, "w", 3], ["r", 6, 12, 20, 21, "g", 3], ["r", 6, 36, 48, 21, "w", 3], ["r", 34, 36, 20, 21, "g", 3], ["r", 6, 60, 48, 21, "w", 3], ["r", 6, 60, 20, 21, "g", 3]] }
    ]
  },
  que_incluye: {
    titulo: "¿Qué incluye?", formatos: ["ban", "normal"], tipos: ["producto"],
    def: "Todo lo que llega en el paquete, cada pieza señalada con su nombre.",
    variantes: [
      { id: "numerados", nombre: "Círculos numerados", desc: "El producto con círculos numerados señalando cada pieza que llega, y la lista numerada abajo.",
        dibujo: [T(6), ["r", 12, 14, 36, 40, "g", 4], ["c", 10, 20, 4, "a"], ["c", 50, 30, 4, "a"], ["c", 10, 46, 4, "a"], T(62, 40), T(68, 40), T(74, 40)] },
      { id: "flatlay", nombre: "Todo extendido (flat lay)", desc: "Vista desde arriba con todas las piezas ordenadas sobre una superficie, cada una con su nombre.",
        dibujo: [["r", 0, 0, 60, 90, "g"], T(8), ["r", 8, 18, 18, 18, "w", 2], ["r", 34, 18, 18, 24, "w", 2], ["r", 8, 42, 22, 14, "w", 2], ["r", 36, 48, 16, 16, "w", 2], ["r", 10, 64, 20, 14, "w", 2]] },
      { id: "caja", nombre: "Caja abierta", desc: "El paquete abierto con las piezas saliendo, y etiquetas con lo que trae.",
        dibujo: [T(6), ["r", 12, 40, 36, 32, "m", 2], ["r", 18, 20, 10, 22, "g", 2], ["r", 31, 16, 10, 26, "g", 2], ["r", 4, 26, 12, 5, "a", 2], ["r", 44, 22, 12, 5, "a", 2]] }
    ]
  },
  tamano_variantes: {
    titulo: "Tamaño, colores o variantes", formatos: ["ban", "normal"], tipos: ["producto"],
    def: "Medidas reales con referencia humana, tallas o colores disponibles completos y en orden.",
    variantes: [
      { id: "medidas", nombre: "Medidas con persona", desc: "El producto junto a una mano o una persona con líneas de medida y las medidas escritas.",
        dibujo: [T(6), ["r", 14, 16, 22, 50, "g", 3], ["x", 42, 16, 42, 66, "a"], ["x", 14, 72, 36, 72, "a"], ["r", 40, 30, 14, 34, "m", 6]] },
      { id: "muestrario", nombre: "Muestrario", desc: "Todos los colores o versiones en fila, cada uno con su nombre debajo, en orden.",
        dibujo: [T(6), ["r", 4, 20, 16, 30, "g", 3], ["r", 22, 20, 16, 30, "m", 3], ["r", 40, 20, 16, 30, "a", 3], ["t", 6, 54, 12, "d"], ["t", 24, 54, 12, "d"], ["t", 42, 54, 12, "d"], T(70, 40)] },
      { id: "tabla", nombre: "Tabla de tallas", desc: "Tabla clara de tallas o medidas con todas las filas completas y en orden, y una foto pequeña de cómo medir.",
        dibujo: [T(6), ["r", 6, 12, 48, 8, "a", 1], ["r", 6, 21, 48, 7, "g", 1], ["r", 6, 29, 48, 7, "w", 1], ["r", 6, 37, 48, 7, "g", 1], ["r", 6, 45, 48, 7, "w", 1], ["r", 16, 58, 28, 24, "g", 3]] }
    ]
  },
  como_se_usa: {
    titulo: "Cómo se usa", formatos: ["ban", "normal"], tipos: ["producto"],
    def: "3 o 4 pasos numerados, cada uno con su foto real del producto en uso.",
    variantes: [
      { id: "columna", nombre: "Pasos en columna", desc: "3 pasos uno debajo del otro, cada uno con número grande, foto a un lado y texto corto al otro.",
        dibujo: [T(6), ["c", 9, 20, 4, "a"], ["r", 16, 13, 18, 16, "g", 2], T(19, 16, 38), ["c", 9, 42, 4, "a"], ["r", 16, 35, 18, 16, "g", 2], T(41, 16, 38), ["c", 9, 64, 4, "a"], ["r", 16, 57, 18, 16, "g", 2], T(63, 16, 38)] },
      { id: "cuadricula", nombre: "Cuadrícula 2x2", desc: "4 fotos en cuadrícula 2x2, cada una con su número de paso en un círculo y una frase corta.",
        dibujo: [T(6), ["r", 6, 12, 23, 32, "g", 2], ["r", 31, 12, 23, 32, "g", 2], ["r", 6, 47, 23, 32, "g", 2], ["r", 31, 47, 23, 32, "g", 2], ["c", 10, 16, 3, "a"], ["c", 35, 16, 3, "a"], ["c", 10, 51, 3, "a"], ["c", 35, 51, 3, "a"]] },
      { id: "zigzag", nombre: "Zigzag", desc: "Pasos en zigzag: foto a la izquierda y texto a la derecha, luego al revés, unidos con una línea punteada.",
        dibujo: [T(6), ["r", 6, 12, 26, 20, "g", 3], T(20, 18, 36), ["r", 28, 36, 26, 20, "g", 3], T(44, 18, 6), ["r", 6, 60, 26, 20, "g", 3], T(68, 18, 36)] }
    ]
  },
  para_quien: {
    titulo: "Para quién es / dónde se usa", formatos: ["ban", "normal"],
    def: "3 o 4 escenas con personas del avatar usando el producto en distintos lugares.",
    variantes: [
      { id: "collage", nombre: "Collage", desc: "Collage de 3 o 4 fotos de distinto tamaño con personas usando el producto en distintos lugares, cada una con una etiqueta.",
        dibujo: [T(6), ["r", 6, 12, 30, 36, "g", 3], ["r", 38, 12, 16, 17, "m", 3], ["r", 38, 31, 16, 17, "g", 3], ["r", 6, 50, 48, 30, "m", 3]] },
      { id: "franjas", nombre: "Franjas", desc: "3 franjas horizontales a lo ancho, cada una con una escena distinta y su etiqueta.",
        dibujo: [T(6), ["r", 0, 12, 60, 23, "g"], ["r", 0, 37, 60, 23, "m"], ["r", 0, 62, 60, 23, "g"], ["r", 4, 15, 16, 5, "a", 2], ["r", 4, 40, 16, 5, "a", 2], ["r", 4, 65, 16, 5, "a", 2]] },
      { id: "circulos", nombre: "Persona y círculos", desc: "Una persona grande usando el producto y 3 círculos con los otros lugares donde sirve.",
        dibujo: [T(6), ["r", 6, 12, 32, 70, "g", 4], ["o", 48, 24, 7, "a"], ["o", 48, 46, 7, "a"], ["o", 48, 68, 7, "a"]] }
    ]
  },
  antes_despues: {
    titulo: "Antes y después (el cambio)", formatos: ["ban", "normal"], tipos: ["producto"],
    def: "La situación sin el producto vs con el producto.",
    variantes: [
      { id: "lado", nombre: "Lado a lado", desc: "Imagen partida en dos de izquierda a derecha: ANTES (tonos apagados) y DESPUÉS (tonos vivos), con una flecha o círculo al centro y 4 beneficios abajo.",
        dibujo: [T(6), ["r", 6, 12, 23, 50, "m", 3], ["r", 31, 12, 23, 50, "g", 3], ["c", 30, 37, 4, "d"], T(70, 40), T(76, 30)] },
      { id: "deslizador", nombre: "Deslizador", desc: "Dos fotos con el MISMO encuadre (antes y después) pensadas para el deslizador de Shopify, o en una sola imagen partida por una línea vertical con un botón al centro.",
        dibujo: [T(6), ["r", 6, 12, 48, 56, "g", 3], ["r", 6, 12, 24, 56, "m", 3], ["x", 30, 12, 30, 68, "w"], ["c", 30, 40, 4, "d"], ["r", 8, 72, 20, 5, "g", 2], ["r", 32, 72, 20, 5, "g", 2]] },
      { id: "vertical", nombre: "Una sobre otra", desc: "ANTES arriba y DESPUÉS abajo, con una flecha hacia abajo entre las dos y una frase de cambio.",
        dibujo: [T(6), ["r", 10, 12, 40, 28, "m", 3], ["c", 30, 44, 3, "d"], ["r", 10, 49, 40, 30, "a", 3]] }
    ]
  },
  paquetes: {
    titulo: "Paquetes (compra más, ahorra más)", formatos: ["ban", "normal"],
    def: "Ofertas de 1, 2 y 3 unidades con precio, 'antes' tachado, cuánto ahorra y la de 2 marcada 'MÁS VENDIDO'.",
    variantes: [
      { id: "lado_a_lado", nombre: "Tarjetas lado a lado", desc: "3 tarjetas verticales lado a lado (1, 2 y 3 unidades), la del medio más grande con la cinta 'MÁS VENDIDO'; cada una con precio, 'antes' tachado y 'Ahorras $...'.",
        dibujo: [T(6), ["r", 4, 22, 16, 34, "w", 3], ["r", 22, 18, 16, 42, "a", 3], ["r", 40, 22, 16, 34, "w", 3], ["r", 24, 14, 12, 5, "d", 2], ["r", 10, 66, 40, 9, "d", 4]] },
      { id: "lista", nombre: "Lista con círculo", desc: "3 filas horizontales una debajo de otra, cada una con un círculo de selección a la izquierda, la foto pequeña del pack, unidades y el precio a la derecha; la de 2 unidades con etiqueta 'MÁS VENDIDO'.",
        dibujo: [T(6), ["r", 6, 13, 48, 13, "w", 3], ["o", 11, 19.5, 2.5, "d"], ["r", 6, 29, 48, 13, "a", 3], ["c", 11, 35.5, 2.5, "w"], ["r", 6, 45, 48, 13, "w", 3], ["o", 11, 51.5, 2.5, "d"], ["r", 38, 26, 14, 4, "d", 2], ["r", 10, 66, 40, 9, "d", 4]] },
      { id: "resaltada", nombre: "La elegida resaltada", desc: "3 tarjetas, una de ellas rellena del color principal y más grande que las otras; las otras blancas con borde.",
        dibujo: [T(6), ["r", 4, 22, 16, 30, "a", 3], ["r", 22, 22, 16, 30, "w", 3], ["r", 40, 22, 16, 30, "w", 3], ["r", 24, 18, 12, 5, "d", 2], ["r", 10, 62, 40, 9, "d", 4]] },
      { id: "con_foto", nombre: "Con la foto del producto", desc: "3 filas, cada una con la foto del producto repetida 1, 2 o 3 veces según las unidades, y el precio grande al lado.",
        dibujo: [T(6), ["r", 6, 13, 48, 14, "w", 3], ["r", 8, 15, 8, 10, "g", 1], ["r", 6, 30, 48, 14, "a", 3], ["r", 8, 32, 8, 10, "g", 1], ["r", 12, 32, 8, 10, "g", 1], ["r", 6, 47, 48, 14, "w", 3], ["r", 8, 49, 8, 10, "g", 1], ["r", 12, 49, 8, 10, "g", 1], ["r", 16, 49, 8, 10, "g", 1], ["r", 10, 68, 40, 9, "d", 4]] }
    ]
  },
  como_funciona: {
    titulo: "Cómo funciona tu pedido (cuándo te llega)", formatos: ["ban", "normal"],
    def: "3 pasos del contra entrega: haces tu pedido, lo despachamos / confirmamos contigo, te llega y pagas en casa. Quita el miedo a comprar.",
    variantes: [
      { id: "linea", nombre: "Línea de tres pasos", desc: "3 círculos grandes con ícono (carrito, camión, caja) unidos por una línea, y debajo de cada uno: 'Haces tu pedido', 'Lo despachamos', 'Te llega y pagas'.",
        dibujo: [T(8), ["x", 12, 34, 48, 34, "m"], ["c", 12, 34, 7, "a"], ["c", 30, 34, 7, "a"], ["c", 48, 34, 7, "a"], ["t", 5, 47, 14, "d"], ["t", 23, 47, 14, "d"], ["t", 41, 47, 14, "d"], ["r", 8, 60, 44, 16, "g", 3]] },
      { id: "camion", nombre: "En camino", desc: "Una carretera o barra de progreso con un camión avanzando, y 3 puntos marcados con cada paso del pedido.",
        dibujo: [T(8), ["r", 8, 34, 44, 3, "g", 2], ["r", 8, 34, 16, 3, "a", 2], ["r", 18, 26, 10, 7, "a", 2], ["c", 10, 35.5, 3, "a"], ["o", 30, 35.5, 3, "m"], ["o", 50, 35.5, 3, "m"], ["t", 5, 46, 14, "d"], ["t", 23, 46, 14, "d"], ["t", 41, 46, 14, "d"], ["r", 8, 60, 44, 16, "g", 3]] },
      { id: "pastillas", nombre: "Fila de pastillas", desc: "3 tarjetas en fila tipo pastilla con ícono arriba y el paso abajo, la primera rellena del color principal y unidas por flechas pequeñas.",
        dibujo: [T(8), ["r", 4, 24, 16, 20, "a", 4], ["r", 22, 24, 16, 20, "w", 4], ["r", 40, 24, 16, 20, "w", 4], ["r", 8, 58, 44, 18, "g", 3]] },
      { id: "barra", nombre: "Barra de progreso", desc: "Una barra dividida en 3 tramos, el primero lleno del color principal, con el nombre de cada paso debajo.",
        dibujo: [T(8), ["r", 4, 30, 16, 4, "a", 2], ["r", 22, 30, 16, 4, "g", 2], ["r", 40, 30, 16, 4, "g", 2], ["t", 4, 40, 12, "d"], ["t", 22, 40, 12, "d"], ["t", 40, 40, 12, "d"], ["r", 8, 56, 44, 18, "g", 3]] }
    ]
  },
  por_que_aqui: {
    titulo: "Tu producto vs otros (¿por qué aquí?)", formatos: ["ban", "normal"], tipos: ["producto"],
    def: "Comparación 'Nuestra tienda' (✓ ventajas) vs 'Otras opciones' (✗ solo desventajas). Sin recuadros vacíos.",
    variantes: [
      { id: "tabla", nombre: "Tabla", desc: "Tabla de 5 filas con dos columnas: la nuestra resaltada con ✓ y la de otros con ✗.",
        dibujo: [T(6), ["r", 30, 12, 12, 64, "a", 3], ["t", 6, 18, 20, "d"], ["t", 6, 30, 20, "d"], ["t", 6, 42, 20, "d"], ["t", 6, 54, 20, "d"], ["t", 6, 66, 20, "d"], ["c", 36, 18, 2, "w"], ["c", 36, 30, 2, "w"], ["c", 36, 42, 2, "w"], ["o", 50, 18, 2, "m"], ["o", 50, 30, 2, "m"], ["o", 50, 42, 2, "m"]] },
      { id: "dos_tarjetas", nombre: "Dos tarjetas", desc: "Dos tarjetas lado a lado: la nuestra de color con la lista de ✓ y la de otros gris con la lista de ✗.",
        dibujo: [T(6), ["r", 4, 14, 25, 62, "a", 3], ["r", 31, 14, 25, 62, "g", 3], ["t", 8, 24, 16, "w"], ["t", 8, 32, 16, "w"], ["t", 8, 40, 16, "w"], ["t", 35, 24, 16, "m"], ["t", 35, 32, 16, "m"], ["t", 35, 40, 16, "m"]] },
      { id: "lista", nombre: "Lista de ventajas", desc: "4 o 5 filas tipo tarjeta, cada una con la ventaja nuestra a la izquierda y lo de otros a la derecha.",
        dibujo: [T(6), ["r", 6, 13, 48, 11, "w", 3], ["r", 6, 27, 48, 11, "w", 3], ["r", 6, 41, 48, 11, "w", 3], ["r", 6, 55, 48, 11, "w", 3], ["c", 11, 18.5, 2, "a"], ["c", 11, 32.5, 2, "a"], ["c", 11, 46.5, 2, "a"], ["c", 11, 60.5, 2, "a"]] },
      { id: "versus", nombre: "Versus", desc: "Arriba el producto nuestro contra 'otros' con un 'VS' grande al centro, y abajo la lista comparada.",
        dibujo: [["r", 6, 8, 20, 22, "a", 3], ["c", 30, 19, 5, "d"], ["r", 34, 8, 20, 22, "g", 3], T(40, 44), T(48, 44), T(56, 44), T(64, 44)] }
    ]
  },
  resenas: {
    titulo: "Reseñas de clientes", formatos: ["ban", "normal"],
    def: "Las reseñas REALES que el dueño escribió en la Ficha, textuales: foto que mandó el cliente (o el producto en uso si no hay; en vez de cara, un círculo con las iniciales), nombre o iniciales, ciudad, estrellas que dio y su texto. Si la Ficha no tiene reseñas: el prompt le pide a Gemini que ponga las que el dueño le pase al hacer la imagen (capturas de WhatsApp o texto). Nunca se inventa nada.",
    variantes: [
      { id: "dos_columnas", nombre: "Tarjetas en dos columnas", desc: "Cuadrícula de tarjetas en dos columnas; cada una con la foto del cliente arriba, su nombre y ciudad, las estrellas y el texto.",
        dibujo: [T(6), ["r", 6, 13, 23, 30, "w", 3], ["r", 31, 13, 23, 30, "w", 3], ["r", 6, 46, 23, 30, "w", 3], ["r", 31, 46, 23, 30, "w", 3]] },
      { id: "carrusel", nombre: "Carrusel", desc: "3 tarjetas en fila horizontal: una grande al centro (foto del cliente, nombre, ciudad, estrellas y texto) y las de los lados más pequeñas, asomando cortadas por el borde, como un carrusel con puntos abajo.",
        dibujo: [T(6), ["r", 0, 20, 8, 44, "w", 3], ["r", 11, 16, 38, 52, "w", 3], ["r", 52, 20, 8, 44, "w", 3], ["c", 26, 74, 1.5, "d"], ["c", 30, 74, 1.5, "m"], ["c", 34, 74, 1.5, "m"]] },
      { id: "columna", nombre: "Citas en columna", desc: "Tarjetas anchas una debajo de otra con una barra de color a la izquierda: foto pequeña del cliente en círculo, nombre, ciudad, estrellas y la cita entre comillas.",
        dibujo: [T(6), ["r", 6, 13, 48, 20, "w", 3], ["r", 6, 13, 2, 20, "a"], ["r", 6, 36, 48, 20, "w", 3], ["r", 6, 36, 2, 20, "a"], ["r", 6, 59, 48, 20, "w", 3], ["r", 6, 59, 2, 20, "a"]] },
      { id: "destacada", nombre: "Destacada y compactas", desc: "Una reseña grande arriba con la foto del cliente usando el producto, y debajo 2 o 3 reseñas compactas (nombre, ciudad, estrellas y una frase).",
        dibujo: [T(6), ["r", 6, 13, 48, 34, "w", 3], ["r", 6, 50, 48, 9, "w", 2], ["r", 6, 62, 48, 9, "w", 2], ["r", 6, 74, 48, 9, "w", 2]] }
    ]
  },
  resumen_resenas: {
    titulo: "Calificación de tus clientes", formatos: ["ban", "normal"],
    def: "Resumen REAL de lo que opinan tus clientes: el promedio, el total y el % que recomienda de TU app de reseñas (lo escribes en la Ficha) o, si no lo tienes, cuántas de las reseñas de la Ficha dieron 5 estrellas; con 2 a 4 frases cortas textuales de esas reseñas. Sin caras inventadas. Sin datos: no se pone ningún número.",
    variantes: [
      { id: "porcentaje", nombre: "Porcentaje y tarjetas", desc: "Titular arriba con la cifra real (ej. 'El 97% nos recomienda'), y debajo una cuadrícula de 4 tarjetas: foto del producto en uso y encima una burbuja blanca con las estrellas y la frase real del cliente con su nombre o iniciales.",
        dibujo: [T(6, 44), ["r", 4, 14, 25, 33, "g", 3], ["r", 7, 32, 19, 11, "w", 3], ["r", 31, 14, 25, 33, "g", 3], ["r", 34, 32, 19, 11, "w", 3], ["r", 4, 50, 25, 33, "g", 3], ["r", 7, 68, 19, 11, "w", 3], ["r", 31, 50, 25, 33, "g", 3], ["r", 34, 68, 19, 11, "w", 3]] },
      { id: "nota", nombre: "Nota grande", desc: "La nota promedio gigante (ej. '4,8') con 5 estrellas al lado, debajo 'de N reseñas' y 3 frases cortas de clientes en tarjetas anchas.",
        dibujo: [["t", 14, 10, 20, "a"], ["r", 18, 16, 24, 14, "a", 3], ["t", 16, 35, 28, "m"], ["r", 6, 42, 48, 11, "w", 3], ["r", 6, 56, 48, 11, "w", 3], ["r", 6, 70, 48, 11, "w", 3]] },
      { id: "historias", nombre: "Círculos tipo historias", desc: "Arriba las estrellas con la calificación real; al centro 3 círculos con borde de color tipo historias de Instagram con fotos del producto en uso y, debajo de cada uno, 2 o 3 palabras sacadas tal cual de una reseña real.",
        dibujo: [T(8), ["t", 18, 16, 24, "a"], ["o", 12, 40, 8, "a"], ["c", 12, 40, 6.5, "g"], ["o", 30, 40, 8, "a"], ["c", 30, 40, 6.5, "g"], ["o", 48, 40, 8, "a"], ["c", 48, 40, 6.5, "g"], ["t", 6, 53, 12, "m"], ["t", 24, 53, 12, "m"], ["t", 42, 53, 12, "m"]] }
    ]
  },
  numeros_reales: {
    titulo: "Tus números reales (entregas)", formatos: ["ban", "normal"],
    def: "Prueba social con los números REALES de tus pedidos de Dropi que trae CoDropX: '+N entregas en toda Colombia', a cuántas ciudades has entregado y 'Pagas al recibir'. Si la Ficha no tiene números: solo 'Pagas al recibir · Envío a todo el país'. Nunca se inventa ni se sube un número; sin logos de entidades ni sellos de 'tienda verificada'.",
    variantes: [
      { id: "franja", nombre: "Franja de entregas", desc: "Franja de color de borde a borde con la cifra grande ('+5.500 ENTREGAS EXITOSAS'), debajo 'EN TODA COLOMBIA' con la bandera, y otra franja 'PAGAS AL RECIBIR TU PEDIDO'; el producto en uso arriba.",
        dibujo: [["r", 6, 6, 48, 30, "g", 3], ["r", 0, 40, 60, 16, "a"], ["t", 10, 45, 40, "d"], ["t", 16, 51, 28, "d"], ["r", 0, 60, 60, 10, "d"], ["t", 12, 64, 36, "w"], ["c", 14, 80, 4, "g"], ["c", 30, 80, 4, "g"], ["c", 46, 80, 4, "g"]] },
      { id: "mapa", nombre: "Mapa de entregas", desc: "Silueta sencilla del mapa del país con puntos de luz en las ciudades, la cifra grande de entregas arriba y 'Hemos entregado en N ciudades' abajo.",
        dibujo: [["t", 10, 8, 40, "a"], T(15, 30), ["r", 16, 22, 28, 46, "g", 10], ["c", 26, 34, 1.5, "a"], ["c", 34, 42, 1.5, "a"], ["c", 24, 50, 1.5, "a"], ["c", 32, 58, 1.5, "a"], ["c", 22, 40, 1.5, "a"], T(76, 40)] },
      { id: "contador", nombre: "Contador gigante", desc: "Número gigante al centro como un marcador ('+5.500'), las palabras 'PEDIDOS ENTREGADOS' debajo y una fila de 3 íconos: pagas al recibir, envío a todo el país y días de entrega.",
        dibujo: [["r", 8, 18, 44, 22, "a", 4], T(46, 40), ["c", 14, 62, 6, "w"], ["c", 30, 62, 6, "w"], ["c", 46, 62, 6, "w"], ["t", 8, 72, 12, "m"], ["t", 24, 72, 12, "m"], ["t", 40, 72, 12, "m"]] },
      { id: "bodega", nombre: "Pedidos saliendo", desc: "Foto real de cajas listas para despachar en una bodega pequeña (sin guías, nombres ni direcciones legibles), con la cifra de entregas encima en grande y la frase 'Así salen tus pedidos'.",
        dibujo: [["r", 0, 0, 60, 90, "g"], ["r", 8, 46, 14, 12, "m", 1], ["r", 24, 50, 14, 12, "m", 1], ["r", 40, 46, 14, 12, "m", 1], ["r", 16, 36, 14, 12, "m", 1], ["r", 8, 10, 44, 16, "a", 3], T(30, 34), ["r", 0, 76, 60, 10, "d"]] }
    ]
  },
  pagas_al_recibir: {
    titulo: "Pagas al recibir (compra segura)", formatos: ["ban", "normal"],
    def: "Le quita el miedo de comprar contra entrega: primero recibe y luego paga, envío a todo el país, el tiempo de entrega real de la Ficha, la garantía solo si existe y, si la Ficha los tiene, las entregas reales de Dropi. Sin logos de entidades del gobierno ni de gremios, ni sellos de 'tienda verificada'.",
    variantes: [
      { id: "franja", nombre: "Franja con camión", desc: "Arriba 'PAGAS AL RECIBIR' en grande; al centro una franja de color de borde a borde con un camión de reparto y el tiempo de entrega ('ENTREGA DE 2 A 5 DÍAS HÁBILES'); abajo 3 íconos de confianza en fila.",
        dibujo: [T(10, 44), T(17, 30), ["r", 0, 30, 60, 22, "a"], ["r", 8, 36, 14, 10, "d", 2], ["t", 26, 38, 26, "d"], ["t", 26, 44, 20, "d"], ["c", 14, 66, 6, "w"], ["c", 30, 66, 6, "w"], ["c", 46, 66, 6, "w"]] },
      { id: "escena", nombre: "Recibe y paga", desc: "Foto real de una persona en la puerta de su casa recibiendo la caja del domiciliario y pagando en efectivo, con el titular 'Primero lo recibes, luego pagas' y 3 chips abajo (pago contra entrega, envío a todo el país, días de entrega).",
        dibujo: [["r", 0, 0, 60, 90, "g"], T(8, 44, 8, "w"), ["r", 10, 22, 18, 44, "m", 3], ["r", 32, 30, 16, 14, "d", 1], ["r", 6, 72, 15, 7, "w", 4], ["r", 23, 72, 15, 7, "w", 4], ["r", 40, 72, 15, 7, "w", 4]] },
      { id: "escudo", nombre: "Escudo y puntos", desc: "Un escudo grande de compra segura al centro y a su alrededor 4 puntos con ícono: pagas al recibir, envío a todo el país, días de entrega y garantía (solo si existe).",
        dibujo: [T(8), ["r", 22, 26, 16, 22, "a", 6], ["c", 10, 24, 5, "w"], ["c", 50, 24, 5, "w"], ["c", 10, 56, 5, "w"], ["c", 50, 56, 5, "w"], ["t", 4, 32, 12, "m"], ["t", 44, 32, 12, "m"], ["t", 4, 64, 12, "m"], ["t", 44, 64, 12, "m"]] }
    ]
  },
  preguntas: {
    titulo: "Preguntas frecuentes", formatos: ["ban", "normal"],
    def: "5 preguntas con respuesta corta; la última SIEMPRE sobre pago contra entrega.",
    variantes: [
      { id: "acordeon", nombre: "Lista tipo acordeón", desc: "5 filas con la pregunta en negrita, un ícono '+' a la derecha y la respuesta corta debajo.",
        dibujo: [T(6), ["r", 6, 13, 48, 11, "w", 2], ["r", 6, 27, 48, 11, "w", 2], ["r", 6, 41, 48, 11, "w", 2], ["r", 6, 55, 48, 11, "w", 2], ["r", 6, 69, 48, 11, "a", 2]] },
      { id: "tarjetas", nombre: "Tarjetas", desc: "Tarjetas en dos columnas, cada una con la pregunta arriba y la respuesta abajo.",
        dibujo: [T(6), ["r", 6, 13, 23, 22, "w", 3], ["r", 31, 13, 23, 22, "w", 3], ["r", 6, 38, 23, 22, "w", 3], ["r", 31, 38, 23, 22, "w", 3], ["r", 6, 63, 48, 16, "a", 3]] },
      { id: "chat", nombre: "Chat", desc: "Burbujas de chat: la pregunta del cliente a la izquierda y la respuesta de la tienda a la derecha.",
        dibujo: [["r", 0, 0, 60, 90, "g"], ["r", 6, 8, 32, 8, "w", 4], ["r", 22, 19, 32, 8, "a", 4], ["r", 6, 31, 32, 8, "w", 4], ["r", 22, 42, 32, 8, "a", 4], ["r", 6, 54, 32, 8, "w", 4], ["r", 22, 65, 32, 8, "a", 4]] }
    ]
  },
  confianza: {
    titulo: "Garantía y confianza", formatos: ["ban", "normal"],
    def: "Garantía (solo si existe), sellos de confianza y 'Envío con transportadoras nacionales' y una franja lisa donde el dueño pega los logos de las transportadoras (sin banderines ni recuadros vacíos).",
    variantes: [
      { id: "centrada", nombre: "Tarjeta centrada", desc: "Tarjeta centrada con un sello grande arriba, el título de la garantía y una lista corta de lo que cubre.",
        dibujo: [["r", 8, 10, 44, 66, "w", 4], ["c", 30, 22, 7, "a"], T(36, 30), ["t", 14, 44, 32, "m"], ["t", 14, 50, 32, "m"], ["t", 14, 56, 32, "m"]] },
      { id: "sello_lado", nombre: "Sello al lado", desc: "Sello circular grande a la izquierda y el texto de la garantía a la derecha; abajo íconos de confianza en fila.",
        dibujo: [["r", 6, 16, 48, 30, "w", 4], ["c", 17, 31, 8, "a"], ["t", 28, 26, 22, "d"], ["t", 28, 33, 22, "m"], ["c", 14, 60, 4, "g"], ["c", 30, 60, 4, "g"], ["c", 46, 60, 4, "g"]] },
      { id: "franja", nombre: "Franja de color", desc: "Bloque de color a lo ancho con el sello y el texto en blanco, y debajo los banderines para logos.",
        dibujo: [["r", 0, 14, 60, 40, "a"], ["c", 30, 26, 6, "w"], ["t", 14, 38, 32, "w"], ["t", 18, 44, 24, "w"], ["r", 6, 62, 14, 10, "g", 2], ["r", 23, 62, 14, 10, "g", 2], ["r", 40, 62, 14, 10, "g", 2]] },
      { id: "certificado", nombre: "Certificado", desc: "Diseño tipo certificado con borde fino, sello en una esquina y la garantía explicada.",
        dibujo: [["r", 6, 12, 48, 62, "w", 1], ["r", 9, 15, 42, 56, "g", 1], ["r", 10, 16, 40, 54, "w", 1], T(26, 30), T(34, 34), T(40, 34), ["c", 46, 18, 6, "a"]] }
    ]
  },
  oferta_cierre: {
    titulo: "Oferta de cierre", formatos: ["ban", "normal"],
    def: "Repite precio, regalo y beneficios clave con una frase de cierre para quien llegó al final.",
    variantes: [
      { id: "caja", nombre: "Precio en caja", desc: "Foto del producto, frase de cierre y el precio grande en caja de color con el 'antes' tachado.",
        dibujo: [T(7), ["r", 10, 12, 40, 36, "g", 4], ["r", 8, 54, 44, 16, "a", 3], ["t", 14, 59, 20, "w"], ["t", 14, 64, 30, "w"], ["r", 14, 76, 32, 7, "d", 4]] },
      { id: "resumen", nombre: "Resumen con checks", desc: "Lista de 4 beneficios con ✓, el regalo si hay, y el precio al final.",
        dibujo: [T(7), ["c", 10, 18, 2.5, "a"], T(18, 36, 15), ["c", 10, 26, 2.5, "a"], T(26, 36, 15), ["c", 10, 34, 2.5, "a"], T(34, 36, 15), ["c", 10, 42, 2.5, "a"], T(42, 36, 15), ["r", 8, 54, 44, 16, "a", 3], ["r", 14, 76, 32, 7, "d", 4]] },
      { id: "foto_franja", nombre: "Foto con franja", desc: "Foto a sangre del producto en uso con una franja inferior con el precio y la frase de cierre.",
        dibujo: [["r", 0, 0, 60, 60, "g"], ["r", 0, 60, 60, 30, "a"], ["t", 10, 66, 40, "w"], ["t", 14, 72, 32, "w"], ["r", 14, 78, 32, 7, "d", 4]] }
    ]
  },
  // ---------- Secciones de MODA (ropa, calzado, accesorios) ----------
  moda_portada: {
    titulo: "Portada — la pieza puesta", formatos: ["ban"], siempre: ["ban"], tipos: ["moda"],
    def: "Modelo adulta/o luciendo la pieza completa (cuerpo entero o de cintura hacia arriba según la prenda), titular corto de 2 líneas, precio con 'antes' tachado, sello de descuento y barra de confianza (cambio de talla, pago contra entrega).",
    variantes: [
      { id: "cuerpo", nombre: "Cuerpo entero", desc: "Foto vertical de cuerpo entero con la pieza puesta en un lugar real, titular arriba y precio en caja abajo.",
        dibujo: [T(7), T(12, 26, 17, "a"), ["r", 18, 16, 24, 50, "g", 12], ["r", 8, 68, 30, 12, "a", 3], ["c", 48, 74, 6, "d"]] },
      { id: "revista", nombre: "Revista", desc: "Estilo portada de revista: modelo grande, titular elegante superpuesto y precio discreto en una esquina.",
        dibujo: [["r", 0, 0, 60, 90, "g"], ["t", 6, 10, 48, "d"], ["t", 6, 16, 36, "a"], ["r", 14, 22, 32, 60, "m", 14], ["r", 38, 74, 18, 9, "a", 3]] },
      { id: "mosaico", nombre: "Mosaico", desc: "Foto principal grande y dos fotos pequeñas a un lado con detalles de la pieza; precio abajo.",
        dibujo: [T(6), ["r", 4, 12, 34, 56, "g", 3], ["r", 40, 12, 16, 27, "m", 3], ["r", 40, 41, 16, 27, "g", 3], ["r", 8, 72, 44, 11, "a", 3]] }
    ]
  },
  moda_precio_tallas: {
    titulo: "Precio, tallas y colores", formatos: ["ban", "normal"], tipos: ["moda"],
    def: "Todos los colores disponibles en fila, la lista COMPLETA de tallas en orden, el precio y el 'antes'. Sin inventar colores ni tallas que no existan.",
    variantes: [
      { id: "fila", nombre: "Colores en fila", desc: "Una foto por color en fila con su nombre, y debajo las tallas en círculos y el precio.",
        dibujo: [T(6), ["r", 4, 14, 16, 26, "g", 3], ["r", 22, 14, 16, 26, "m", 3], ["r", 40, 14, 16, 26, "a", 3], ["o", 12, 50, 4, "d"], ["o", 24, 50, 4, "d"], ["o", 36, 50, 4, "d"], ["o", 48, 50, 4, "d"], ["r", 10, 62, 40, 12, "a", 3]] },
      { id: "tarjeta", nombre: "Tarjeta de compra", desc: "Tarjeta clara con la foto de la pieza, los colores en puntos, las tallas en cajitas y el precio grande.",
        dibujo: [["r", 6, 8, 48, 74, "w", 4], ["r", 10, 12, 40, 30, "g", 3], ["c", 16, 48, 3, "d"], ["c", 24, 48, 3, "a"], ["c", 32, 48, 3, "m"], ["r", 10, 56, 8, 6, "g", 1], ["r", 20, 56, 8, 6, "g", 1], ["r", 30, 56, 8, 6, "g", 1], ["r", 40, 56, 8, 6, "g", 1], ["r", 10, 68, 40, 9, "a", 3]] }
    ]
  },
  moda_vistas: {
    titulo: "Vistas de la pieza", formatos: ["ban", "normal"], tipos: ["moda"],
    def: "La misma pieza en la misma modelo vista de frente, de espalda y de lado, para que el cliente vea cómo queda.",
    variantes: [
      { id: "tres", nombre: "Frente, espalda y lado", desc: "Tres fotos verticales lado a lado de la misma modelo: frente, espalda y perfil, con su rótulo.",
        dibujo: [T(6), ["r", 4, 14, 16, 56, "g", 6], ["r", 22, 14, 16, 56, "m", 6], ["r", 40, 14, 16, 56, "g", 6], ["t", 6, 76, 12, "d"], ["t", 24, 76, 12, "d"], ["t", 42, 76, 12, "d"]] },
      { id: "giro", nombre: "Giro con flechas", desc: "Una foto grande de frente y dos pequeñas (espalda y lado) unidas con flechas de giro.",
        dibujo: [T(6), ["r", 6, 12, 30, 66, "g", 8], ["r", 40, 14, 16, 30, "m", 6], ["r", 40, 48, 16, 30, "g", 6], ["x", 36, 30, 40, 28, "a"], ["x", 36, 60, 40, 62, "a"]] }
    ]
  },
  moda_material: {
    titulo: "El material de cerca", formatos: ["ban", "normal"], tipos: ["moda"],
    def: "Primeros planos de la tela o material: textura, costuras, elasticidad, forro, botones o cierres. Solo lo que la pieza tiene de verdad.",
    variantes: [
      { id: "lupas", nombre: "Círculos de zoom", desc: "La pieza al centro y 3 o 4 círculos de zoom a la tela, costuras y detalles, con su rótulo.",
        dibujo: [T(6), ["r", 18, 20, 24, 46, "g", 6], ["o", 9, 22, 7, "a"], ["o", 51, 30, 7, "a"], ["o", 9, 62, 7, "a"], ["o", 51, 70, 7, "a"]] },
      { id: "macro", nombre: "Macro a sangre", desc: "Foto macro de la tela a toda la imagen con 3 etiquetas encima explicando lo que se siente.",
        dibujo: [["r", 0, 0, 60, 90, "m"], ["r", 6, 14, 26, 7, "w", 3], ["r", 26, 40, 28, 7, "w", 3], ["r", 8, 66, 26, 7, "w", 3]] }
    ]
  },
  moda_ficha: {
    titulo: "Ficha del material", formatos: ["ban", "normal"], tipos: ["moda"],
    def: "Composición del material, cómo lavarlo y cuidarlo, y si estira o no, con íconos. Solo datos reales de la ficha.",
    variantes: [
      { id: "iconos", nombre: "Íconos de cuidado", desc: "Foto pequeña de la tela arriba y abajo una cuadrícula de íconos de cuidado (lavar, planchar, secar) con su texto.",
        dibujo: [T(6), ["r", 14, 12, 32, 22, "g", 3], ["c", 14, 46, 5, "a"], ["c", 30, 46, 5, "a"], ["c", 46, 46, 5, "a"], ["c", 14, 64, 5, "a"], ["c", 30, 64, 5, "a"], ["c", 46, 64, 5, "a"]] },
      { id: "tabla", nombre: "Tabla", desc: "Tabla limpia de 4 o 5 filas: composición, elasticidad, forro, cuidado, origen.",
        dibujo: [T(6), ["r", 6, 14, 48, 9, "a", 1], ["r", 6, 24, 48, 9, "g", 1], ["r", 6, 34, 48, 9, "w", 1], ["r", 6, 44, 48, 9, "g", 1], ["r", 6, 54, 48, 9, "w", 1]] }
    ]
  },
  moda_fuera_estudio: {
    titulo: "Puesta, fuera del estudio", formatos: ["ban", "normal"], tipos: ["moda"],
    def: "La pieza puesta en la vida real del avatar (calle, oficina, salida, casa), fotos naturales tipo estilo de vida.",
    variantes: [
      { id: "collage", nombre: "Collage de momentos", desc: "Collage de 3 o 4 fotos en distintos lugares con una etiqueta corta en cada una.",
        dibujo: [T(6), ["r", 4, 12, 30, 40, "g", 3], ["r", 36, 12, 20, 19, "m", 3], ["r", 36, 33, 20, 19, "g", 3], ["r", 4, 54, 52, 28, "m", 3]] },
      { id: "historia", nombre: "Historia vertical", desc: "Tres franjas horizontales a lo ancho, cada una un momento del día con la pieza puesta.",
        dibujo: [T(6), ["r", 0, 12, 60, 24, "g"], ["r", 0, 38, 60, 24, "m"], ["r", 0, 64, 60, 24, "g"]] }
    ]
  },
  moda_guia_tallas: {
    titulo: "Guía de tallas", formatos: ["ban", "normal"], tipos: ["moda"],
    def: "Tabla de tallas COMPLETA y en orden con sus medidas reales, y un dibujo de dónde medir. Si faltan medidas, no las inventes: pide los datos en las notas.",
    variantes: [
      { id: "tabla", nombre: "Tabla y silueta", desc: "Silueta con líneas de dónde medir a un lado y la tabla de tallas al otro.",
        dibujo: [T(6), ["r", 4, 14, 18, 56, "g", 8], ["x", 6, 30, 20, 30, "a"], ["x", 6, 46, 20, 46, "a"], ["r", 26, 14, 30, 7, "a", 1], ["r", 26, 22, 30, 7, "g", 1], ["r", 26, 30, 30, 7, "w", 1], ["r", 26, 38, 30, 7, "g", 1], ["r", 26, 46, 30, 7, "w", 1]] },
      { id: "como_medir", nombre: "Cómo medirte", desc: "Tres pasos numerados con foto de cómo tomarse cada medida y la tabla de tallas abajo.",
        dibujo: [T(6), ["c", 10, 18, 4, "a"], ["c", 30, 18, 4, "a"], ["c", 50, 18, 4, "a"], ["r", 4, 26, 16, 18, "g", 2], ["r", 22, 26, 16, 18, "g", 2], ["r", 40, 26, 16, 18, "g", 2], ["r", 6, 52, 48, 7, "a", 1], ["r", 6, 60, 48, 7, "g", 1], ["r", 6, 68, 48, 7, "w", 1]] }
    ]
  },
  moda_tres_formas: {
    titulo: "Tres formas de usarla", formatos: ["ban", "normal"], tipos: ["moda"],
    def: "La misma pieza combinada de 3 maneras distintas (casual, para salir, para trabajar), cada una con su rótulo.",
    variantes: [
      { id: "lado", nombre: "Tres looks lado a lado", desc: "Tres fotos verticales lado a lado con el nombre del look debajo.",
        dibujo: [T(6), ["r", 4, 14, 16, 56, "g", 6], ["r", 22, 14, 16, 56, "m", 6], ["r", 40, 14, 16, 56, "g", 6], ["r", 4, 74, 16, 6, "a", 3], ["r", 22, 74, 16, 6, "a", 3], ["r", 40, 74, 16, 6, "a", 3]] },
      { id: "numerados", nombre: "Looks numerados", desc: "Tres tarjetas apiladas, cada una con número grande, foto del look y una frase de cuándo usarlo.",
        dibujo: [T(6), ["r", 6, 12, 48, 22, "w", 3], ["c", 12, 23, 4, "a"], ["r", 30, 14, 22, 18, "g", 2], ["r", 6, 37, 48, 22, "w", 3], ["c", 12, 48, 4, "a"], ["r", 30, 39, 22, 18, "g", 2], ["r", 6, 62, 48, 22, "w", 3], ["c", 12, 73, 4, "a"], ["r", 30, 64, 22, 18, "g", 2]] }
    ]
  },
  moda_chats: {
    titulo: "Lo que nos escriben (chats)", formatos: ["ban", "normal"], tipos: ["producto", "moda"],
    def: "Burbujas de chat tipo WhatsApp con los mensajes REALES que el dueño escribió en la Ficha (reseñas), textuales: el mensaje del cliente, su nombre o iniciales y la hora. Si la Ficha no tiene reseñas: el prompt le pide a Gemini que ponga los chats que el dueño le pase al hacer la imagen (capturas o texto). Nunca se inventa nada.",
    variantes: [
      { id: "telefono", nombre: "Dentro de un celular", desc: "Un celular dibujado con un chat de 3 o 4 mensajes de clientes (burbujas con su texto) y el título 'Lo que nos escriben'.",
        dibujo: [T(6), ["r", 14, 12, 32, 70, "d", 6], ["r", 17, 18, 26, 62, "g", 3], ["r", 19, 22, 18, 7, "w", 3], ["r", 23, 33, 18, 7, "w", 3], ["r", 19, 44, 18, 7, "w", 3], ["r", 23, 55, 18, 7, "w", 3]] },
      { id: "burbujas", nombre: "Burbujas sueltas", desc: "Cuatro burbujas de chat grandes con el mensaje de cada cliente, alternando izquierda y derecha, sobre fondo suave con la prenda.",
        dibujo: [["r", 0, 0, 60, 90, "g"], T(8), ["r", 6, 16, 34, 12, "w", 5], ["r", 20, 32, 34, 12, "w", 5], ["r", 6, 48, 34, 12, "w", 5], ["r", 20, 64, 34, 12, "w", 5]] }
    ]
  },
  moda_por_que: {
    titulo: "Por qué esta y no otra", formatos: ["ban", "normal"], tipos: ["moda"],
    def: "Comparación honesta 'Esta pieza' (✓) vs 'Las que se consiguen por ahí' (✗): material, costuras, horma, cambio de talla, pago contra entrega. Sin nombrar marcas.",
    variantes: [
      { id: "tabla", nombre: "Tabla", desc: "Tabla de 5 filas con dos columnas, la nuestra resaltada con ✓.",
        dibujo: [T(6), ["r", 30, 12, 12, 64, "a", 3], ["t", 6, 18, 20, "d"], ["t", 6, 30, 20, "d"], ["t", 6, 42, 20, "d"], ["t", 6, 54, 20, "d"], ["t", 6, 66, 20, "d"]] },
      { id: "versus", nombre: "Versus", desc: "La pieza nuestra contra 'otras' con un VS al centro y la lista abajo.",
        dibujo: [["r", 6, 8, 20, 28, "a", 3], ["c", 30, 22, 5, "d"], ["r", 34, 8, 20, 28, "g", 3], T(44, 44), T(52, 44), T(60, 44), T(68, 44)] }
    ]
  },
  moda_cambio_talla: {
    titulo: "Cambio de talla y garantía", formatos: ["ban", "normal"], tipos: ["moda"],
    def: "Cómo funciona el cambio de talla y la garantía (SOLO si la ficha dice que existen), pago contra entrega y envío. Quita el miedo a pedir la talla equivocada.",
    variantes: [
      { id: "centrada", nombre: "Tarjeta centrada", desc: "Sello grande arriba, el título del cambio de talla y 3 pasos cortos de cómo pedirlo.",
        dibujo: [["r", 8, 10, 44, 66, "w", 4], ["c", 30, 22, 7, "a"], T(36, 30), ["t", 14, 46, 32, "m"], ["t", 14, 54, 32, "m"], ["t", 14, 62, 32, "m"]] },
      { id: "certificado", nombre: "Certificado", desc: "Diseño tipo certificado con borde, sello en una esquina y las condiciones explicadas.",
        dibujo: [["r", 6, 12, 48, 62, "w", 1], ["r", 9, 15, 42, 56, "g", 1], ["r", 10, 16, 40, 54, "w", 1], T(26, 30), T(34, 34), T(40, 34), ["c", 46, 18, 6, "a"]] }
    ]
  }
};

// =============================================
// AIDA: en qué etapa trabaja cada sección
//   A = Atención (que pare de deslizar) · I = Interés (entiende su problema y la causa real)
//   D = Deseo (ve que esto sí lo resuelve) · C = aCción (compra sin miedo)
// =============================================
export const ETAPAS_AIDA = {
  A: { nombre: "Atención", meta: "que pare de deslizar: gancho con SUS palabras y la promesa principal" },
  I: { nombre: "Interés", meta: "que se reconozca en el problema y entienda la causa real que nadie le había explicado" },
  D: { nombre: "Deseo", meta: "que vea que este producto ataca esa causa y se imagine con el resultado" },
  C: { nombre: "Acción", meta: "que compre sin miedo: precio, garantía, pago contra entrega y dudas resueltas" }
};
export const ETAPA_AIDA = {
  oferta: "A", galeria: "A", moda_portada: "A",
  dolor: "I", causa: "I", identificacion: "I", para_quien: "I",
  funcion_estrella: "D", antes_despues: "D", como_se_usa: "D", detalles: "D", que_incluye: "D", tamano_variantes: "D", resenas: "D", resumen_resenas: "D",
  moda_vistas: "D", moda_material: "D", moda_ficha: "D", moda_fuera_estudio: "D", moda_tres_formas: "D", moda_chats: "D", moda_por_que: "D", moda_guia_tallas: "D",
  paquetes: "C", numeros_reales: "C", pagas_al_recibir: "C", como_funciona: "C", por_que_aqui: "C", preguntas: "C", confianza: "C", oferta_cierre: "C", moda_precio_tallas: "C", moda_cambio_talla: "C"
};
export const etapaDe = (tipo) => ETAPA_AIDA[tipo] || "D";

// Orden de siempre (lo que se ve sin tocar nada) y qué va prendido de entrada
export const ORDEN_BASE = {
  ban: [
    ["oferta", 1], ["dolor", 1], ["causa", 1], ["identificacion", 0], ["funcion_estrella", 1], ["resenas", 1], ["detalles", 1], ["que_incluye", 1],
    ["tamano_variantes", 1], ["como_se_usa", 1], ["para_quien", 1], ["antes_despues", 0], ["moda_chats", 0], ["resumen_resenas", 0], ["numeros_reales", 1], ["paquetes", 1],
    ["como_funciona", 1], ["pagas_al_recibir", 0], ["por_que_aqui", 1], ["preguntas", 1], ["confianza", 0], ["oferta_cierre", 0]
  ],
  normal: [
    ["galeria", 1], ["dolor", 1], ["causa", 1], ["funcion_estrella", 1], ["resenas", 1], ["antes_despues", 1], ["como_se_usa", 1], ["detalles", 1],
    ["para_quien", 1], ["que_incluye", 0], ["tamano_variantes", 0], ["identificacion", 0], ["moda_chats", 0], ["resumen_resenas", 0], ["numeros_reales", 1], ["paquetes", 0],
    ["como_funciona", 1], ["pagas_al_recibir", 0], ["por_que_aqui", 1], ["confianza", 0], ["preguntas", 0], ["oferta_cierre", 0]
  ],
  moda_ban: [
    ["moda_portada", 1], ["moda_precio_tallas", 1], ["moda_vistas", 1], ["moda_material", 1], ["moda_ficha", 0],
    ["moda_fuera_estudio", 1], ["resenas", 1], ["moda_tres_formas", 0], ["moda_guia_tallas", 1], ["moda_chats", 0], ["moda_por_que", 1],
    ["moda_cambio_talla", 1], ["dolor", 0], ["identificacion", 0], ["para_quien", 0], ["resumen_resenas", 0], ["numeros_reales", 1], ["paquetes", 0], ["como_funciona", 1],
    ["pagas_al_recibir", 0], ["preguntas", 1], ["confianza", 0], ["oferta_cierre", 0]
  ],
  moda_normal: [
    ["galeria", 1], ["moda_vistas", 1], ["moda_material", 1], ["moda_fuera_estudio", 1], ["resenas", 1], ["moda_guia_tallas", 1],
    ["moda_precio_tallas", 0], ["moda_ficha", 0], ["moda_tres_formas", 0], ["moda_chats", 0], ["moda_por_que", 1],
    ["moda_cambio_talla", 1], ["dolor", 0], ["identificacion", 0], ["para_quien", 0], ["resumen_resenas", 0], ["numeros_reales", 1], ["paquetes", 0], ["como_funciona", 1],
    ["pagas_al_recibir", 0], ["preguntas", 0], ["confianza", 0], ["oferta_cierre", 0]
  ]
};

// Tipo de producto: general o moda (ropa, calzado, accesorios)
export const TIPOS_PRODUCTO = {
  producto: { nombre: "Producto", desc: "Gadgets, hogar, belleza, salud, mascotas… cualquier producto que no sea ropa." },
  moda: { nombre: "Moda", desc: "Ropa, calzado y accesorios: la pieza puesta, tallas, colores y material." }
};

// Clave de la plantilla: ban · normal · moda_ban · moda_normal
export const CLAVES = ["ban", "normal", "moda_ban", "moda_normal"];
export const claveDe = (formato, tipo) => `${tipo === "moda" ? "moda_" : ""}${formato === "normal" ? "normal" : "ban"}`;
const claveValida = (c) => (CLAVES.includes(c) ? c : c === "normal" ? "normal" : "ban");
const tipoDeClave = (c) => (String(c).startsWith("moda_") ? "moda" : "producto");

export const COLORES_BASE = { modo: "producto", fondo: "#111111", color1: "#ffffff", color2: "#22d3ee", acento: "#22d3ee" };

const formatoValido = (f) => (String(f).endsWith("normal") ? "normal" : "ban");
const hexValido = (v, def) => (/^#[0-9a-f]{6}$/i.test(String(v || "")) ? String(v).toLowerCase() : def);

// Secciones que se pueden usar en una clave (ban, normal, moda_ban, moda_normal)
export const tiposDe = (clave) => {
  const f = formatoValido(clave), t = tipoDeClave(clave);
  return Object.keys(SECCIONES).filter(k => SECCIONES[k].formatos.includes(f) && (SECCIONES[k].tipos || ["producto", "moda"]).includes(t));
};

export const esFija = (tipo, formato) => (SECCIONES[tipo]?.siempre || []).includes(formatoValido(formato));

// Acabado del diseño: cómo se "siente" la imagen (lo que la hace verse comprable)
export const ACABADOS = {
  impacto: {
    nombre: "Alto impacto",
    desc: "Como un anuncio premium: escena con atmósfera, luz de cine, titulares enormes con efecto 3D o brillo, precio gigante con resplandor.",
    prompt: "ACABADO PUBLICITARIO DE ALTO IMPACTO (un anuncio premium que da ganas de comprar ya, NO una foto de catálogo ni un diseño plano): fondo con atmósfera y profundidad (escena real con luz de ambiente, desenfoque y luces del color de acento), iluminación cinematográfica con contraste fuerte y un resplandor del color de acento detrás del producto; titulares ENORMES y gruesos con efecto 3D o metálico y sombra, con la palabra clave resaltada en el color de acento (trazo de brocha o brillo); precio GIGANTE con resplandor y el 'antes' tachado en rojo; íconos de línea dentro de tarjetas con borde fino luminoso; barra de confianza abajo con íconos; jerarquía clara: titular → producto → precio → beneficios. Todo nítido, rico en detalle y bien terminado."
  },
  limpio: {
    nombre: "Limpio",
    desc: "Fondo claro y sencillo, foto luminosa, letras gruesas sin efectos y mucho espacio. Bueno para moda o productos delicados.",
    prompt: "ACABADO LIMPIO: fondo claro y sencillo, foto luminosa, titulares gruesos sin efectos, tarjetas planas, mucho espacio y orden. Aun así de venta directa: producto grande y precio bien visible."
  }
};

export function plantillaPorDefecto(clave) {
  const f = claveValida(clave);
  return {
    usarOrden: false,
    orden: ORDEN_BASE[f].map(([tipo, visible]) => ({ tipo, visible: !!visible })),
    estilos: {},                  // tipo → id de variante (sin valor = "Al azar")
    colores: { ...COLORES_BASE },
    acabado: "impacto"            // impacto (anuncio premium, oscuro, brillo, 3D) | limpio (claro y sencillo)
  };
}

// Limpia lo que llega del navegador o de la base de datos
export function normalizarPlantilla(clave, raw = {}) {
  const f = claveValida(clave);
  const base = plantillaPorDefecto(f);
  const validos = tiposDe(f);
  const r = raw && typeof raw === "object" ? raw : {};

  const vistos = new Set();
  const orden = [];
  for (const it of Array.isArray(r.orden) ? r.orden : []) {
    const tipo = String(it?.tipo || "");
    if (!validos.includes(tipo) || vistos.has(tipo)) continue;
    vistos.add(tipo);
    orden.push({ tipo, visible: esFija(tipo, f) ? true : it.visible !== false });
  }
  // Tipos nuevos: justo después del que les sigue en el orden base (ej. "causa" después de "dolor")
  base.orden.forEach((it, k) => {
    if (vistos.has(it.tipo)) return;
    const previo = base.orden.slice(0, k).reverse().find(b => orden.some(o => o.tipo === b.tipo));
    const i = previo ? orden.findIndex(o => o.tipo === previo.tipo) + 1 : orden.length;
    orden.splice(i, 0, it);
    vistos.add(it.tipo);
  });

  const estilos = {};
  const e = r.estilos && typeof r.estilos === "object" ? r.estilos : {};
  for (const tipo of validos) {
    const id = String(e[tipo] || "");
    if (SECCIONES[tipo].variantes.some(v => v.id === id)) estilos[tipo] = id;
  }

  const c = r.colores && typeof r.colores === "object" ? r.colores : {};
  const colores = {
    modo: c.modo === "fijos" ? "fijos" : "producto",
    fondo: hexValido(c.fondo, COLORES_BASE.fondo),
    color1: hexValido(c.color1, COLORES_BASE.color1),
    color2: hexValido(c.color2, COLORES_BASE.color2),
    acento: hexValido(c.acento, COLORES_BASE.acento)
  };

  return { usarOrden: !!r.usarOrden, orden, estilos, colores, acabado: ACABADOS[r.acabado] ? r.acabado : "impacto" };
}

export const varianteDe = (tipo, id) => (SECCIONES[tipo]?.variantes || []).find(v => v.id === id) || null;

// Variante fija de la plantilla, o una al azar (distinta cada vez)
export function elegirVariante(tipo, plantilla, azar = Math.random) {
  const vs = SECCIONES[tipo]?.variantes || [];
  if (!vs.length) return "";
  const fija = plantilla?.estilos?.[tipo];
  if (fija && vs.some(v => v.id === fija)) return fija;
  return vs[Math.floor(azar() * vs.length) % vs.length].id;
}

// Formato de imagen sugerido para cada sección
export function formatoImagen(tipo, formato) {
  if (formatoValido(formato) === "ban") return "9:16";
  return "1:1";
}
