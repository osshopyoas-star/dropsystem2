// =============================================
// 🪧 COTIZADOR DE LETREROS (acrílico, neón LED, MDF…): precios y opciones
// Sin DOM: lo usan la página pública /cotiza/:clave, la pantalla de CoDropX y el servidor.
// Todos los precios en pesos colombianos (o la moneda que escribas) y el tamaño en centímetros.
// =============================================

export const CONFIG_DEFECTO = {
  activo: true,
  marca: "Cegumon",
  cabecera: "nada",                          // arriba de la página: "nada" · "nombre" · "logo"
  logo: "/marcas/cegumon-logo.png",          // el logo (si cabecera = "logo")
  icono: "/marcas/cegumon-icono-192.png",    // el iconito de la pestaña del navegador
  titulo: "Tu logo convertido en letrero",
  subtitulo: "Súbelo y míralo en tu pared en menos de un minuto. Precio al instante.",
  moneda: "COP",
  whatsapp: "",
  anticipoPct: 50,
  // Gancho de envío gratis en el resumen (el flete ya va dentro del precio)
  envioGratis: true,
  envioTexto: "ENVÍO GRATIS a toda Colombia",
  // ===== Costos como en el Excel de fabricación =====
  // Láminas: precio de la lámina completa y sus m² → CoDropX saca el precio del cm²
  laminas: [
    { id: "espejo", nombre: "Acrílico espejo plata 2 mm", precio: 240000, m2: 2.16 },
    { id: "transparente", nombre: "Acrílico transparente y blanco 3 mm", precio: 205000, m2: 2.16 },
    { id: "triplex", nombre: "Triplex 3 mm", precio: 48000, m2: 2.88 }
  ],
  // Tipos de letrero que elige el cliente: qué láminas lleva (cada una del tamaño del letrero) y si lleva luz
  materiales: [
    { id: "espejo_luz", nombre: "Acrílico espejo con luz", desc: "Acrílico espejo plata cortado con láser, sobre base de triplex, con luz LED.", capas: ["espejo", "triplex"], conLuz: true,
      aspecto: "PANEL DE ACRÍLICO ESPEJO plata, rectangular con las esquinas redondeadas y un borde pulido brillante, colgado pegado a la pared. GRABADO RELLENO, NO CONTORNO: TODO el logo del cliente va grabado con láser en el espejo, con sus áreas RELLENAS completas (cada letra, figura y forma grabada entera, como una superficie esmerilada mate), no solo la línea del borde. La luz LED sale por TODA la parte grabada: el logo completo se ve como una figura SÓLIDA llena de luz cálida amarilla dorada, pareja y brillante. Los detalles internos del logo (huecos, separaciones, líneas oscuras del dibujo original) quedan como espejo sin grabar, para que el dibujo se lea igual que el original. NO lo hagas estilo neón de manguera ni de líneas finas: es un relleno iluminado. Se respetan la forma, las letras y todos los detalles del logo, exactos. El resto del panel (lo que no es logo) es ESPEJO que refleja el lugar con reflejos suaves. IMPORTANTE: NO hay luz detrás del panel, NO hay halo ni resplandor en la pared, el borde del panel NO se ilumina; la única luz es la del logo grabado. FOTO: de frente, pared oscura lisa, poca luz ambiente para que el logo encendido resalte." },
    { id: "acrilico_luz", nombre: "Acrílico con luz LED", desc: "Acrílico transparente o blanco cortado con láser, sobre base, iluminado.", capas: ["transparente", "triplex"], conLuz: true, neon: true,
      aspecto: "LETRERO REAL DE NEÓN FLEX hecho a mano: manguera LED de silicona de 8 mm, del mismo grosor en todo el recorrido, pegada sobre una lámina de ACRÍLICO TRANSPARENTE. EL LOGO DEL CLIENTE ES LA MANGUERA: las partes gruesas del logo se hacen huecas con el tubo recorriendo su borde (como letras de contorno), las líneas delgadas con un solo tubo por el centro, y los detalles diminutos se omiten. Se ven los detalles de un letrero real: pequeños cortes oscuros entre tramos de tubo, cables delgados transparentes que unen los tramos por detrás del acrílico, y el borde del acrílico brillando un poco. COLOR: cada parte en el color que tiene en el logo; si el logo es negro o de un solo color, en un solo color de neón vivo. ENCENDIDO: el tubo brilla intenso, saturado, y su color se refleja en el piso o la superficie de abajo. FOTO: tomada con celular en un cuarto oscuro o de noche, de frente, realista, nada de render 3D perfecto: que se vea que es un letrero físico de neón flex." },
    { id: "espejo", nombre: "Acrílico espejo sin luz", desc: "Acrílico espejo plata cortado con láser, sobre base de triplex.", capas: ["espejo", "triplex"], conLuz: false,
      aspecto: "Letrero de ACRÍLICO POR CAPAS, sin luz, hecho con corte láser. BASE: una lámina de acrílico brillante cortada con láser con la forma del contorno del logo del cliente (si el logo no tiene una forma de fondo, una forma limpia que lo encierre, con un borde de unos 3 cm alrededor). El color de la base es el color de fondo del logo; si el logo es de un solo color, la base es de acrílico espejo dorado o plateado, el que contraste mejor. PIEZAS ENCIMA: cada parte del logo (letras, figuras, íconos) va cortada por separado en acrílico de su MISMO color del logo y pegada encima de la base, en relieve de 3 mm: se ve el grosor del acrílico en los bordes, una sombra suave debajo de cada pieza y reflejos de brillo en la superficie. Las letras van EXACTAS como en el logo, mismo tipo de letra, mismas palabras, sin cambiar ni inventar nada." },
    { id: "madera", nombre: "Triplex / madera", desc: "Corte láser en triplex, pintado o natural.", capas: ["triplex"], conLuz: false,
      aspecto: "UNA SOLA PIEZA DE MADERA TRIPLEX de 3 mm, color madera clara natural, cortada con láser con el CONTORNO EXTERIOR del logo (o con la forma de panel que eligió el cliente). NO es calada ni hueca: la pieza es sólida, sin huecos ni partes recortadas por dentro. TODO el dibujo del logo (ojos, líneas, letras, detalles, rellenos oscuros) va GRABADO con láser sobre la superficie de la madera: quemado café oscuro, un poco hundido, con textura de madera quemada y bordes tostados, como un pirograbado; las partes claras del logo quedan en el color natural de la madera. El borde de la pieza se ve tostado por el corte láser. Se respetan la forma, las letras y todos los detalles del logo, exactos. SIN LUZ: no tiene LED, no brilla, no hay resplandor detrás ni halo en la pared. FOTO: pieza colgada en una pared, de día con buena luz natural, de frente y nítida, que se note la textura de la madera y del grabado." },
    { id: "impresion_neon", nombre: "Acrílico con impresión y luz neonflex", desc: "Tu logo impreso a todo color en acrílico, con neón flex del mismo color en los bordes.", capas: ["transparente"], conLuz: true, neon: false, extras: ["impresion"],
      aspecto: "ACRÍLICO IMPRESO A TODO COLOR + NEÓN FLEX DEL MISMO COLOR, como los letreros de bares, talleres y tiendas. BASE: lámina de acrílico de 5 mm cortada con láser siguiendo la silueta del logo con un borde de 2 a 3 cm (en el borde se ve el acrílico, transparente o negro), sostenida de la pared con tornillos separadores metálicos pequeños. IMPRESIÓN: el logo del cliente va IMPRESO completo sobre el acrílico (impresión UV), EXACTO al original: mismos colores, degradados, personajes, letras y detalles, nítido y saturado. NEÓN FLEX: tubo de neón flex de 8 mm que recorre el CONTORNO de las partes principales del logo (la silueta exterior, cada letra grande, cada figura importante) y algunas líneas internas que marcan el dibujo. CADA TUBO VA DEL MISMO COLOR DE LA PARTE IMPRESA QUE BORDEA: si una llama es roja, su neón es rojo; si las letras son amarillas, su neón es amarillo; si una parte es blanca o gris, su neón es blanco. Así el letrero tiene neón de varios colores, uno por cada parte del logo. ENCENDIDO: el neón brilla intenso y saturado, ilumina un poco la impresión y deja un resplandor suave de esos colores en la pared. Las letras y palabras van exactas, sin cambiar ni inventar nada. FOTO: real, de frente, en un local (bar, taller o tienda) con poca luz, que se note que es un letrero físico de acrílico impreso con tubos de neón flex." }
  ],
  // Láser: minutos × precio del minuto. Minutos = preparación + minutos por cada metro de contorno del letrero
  // (la máquina recorre el borde: un letrero el doble de grande tiene el doble de contorno). Con 30 × 30 (1,2 m): 10 + 1,2 × 25 = 40 min = $40.000, como el Excel
  laser: { precioMinuto: 1000, minFijos: 10, minPorMetro: 25 },
  // Otros costos por letrero, con su valor para uno de 30 × 30. "fijo" = igual siempre · "area" = sube con el tamaño · "contorno" = sube con el borde
  costos: [
    { id: "pin", nombre: "Pin para pared", valor: 5000, modo: "fijo", soloLuz: false },
    { id: "pegante", nombre: "Pegante y pintura", valor: 5000, modo: "fijo", soloLuz: false },
    { id: "luz", nombre: "Luz LED", valor: 15000, modo: "contorno", soloLuz: true },
    { id: "controlador", nombre: "Controlador", valor: 5000, modo: "fijo", soloLuz: true },
    { id: "fuente", nombre: "Fuente de poder", valor: 5000, modo: "fijo", soloLuz: true },
    // "opcional": solo lo llevan los tipos de letrero que lo tengan marcado (columna en Tipos de letrero)
    { id: "impresion", nombre: "Impresión", valor: 15000, modo: "area", soloLuz: false, opcional: true }
  ],
  manoObraPct: 25,          // % sobre materiales (incluye láser)
  gananciaProductoPct: 25,  // % sobre materiales + mano de obra → da el valor de fabricación
  // Pauta y flete según el precio final (el último tramo sin tope: hasta = 0)
  tramos: [
    { hasta: 200000, pauta: 25000, pautaPct: 0, flete: 18000 },
    { hasta: 350000, pauta: 30000, pautaPct: 0, flete: 25000 },
    { hasta: 0, pauta: 0, pautaPct: 20, flete: 35000 }
  ],
  gananciaPct: 40,          // tu ganancia final: % sobre fabricación + pauta + flete
  // Tipo de luz (solo materiales con luz): recargo en % sobre la fabricación
  luces: [
    { id: "fija", nombre: "Un solo color", desc: "Blanco, cálido o el color que elijas.", pct: 0, pideColor: true },
    { id: "rgb", nombre: "RGB con control", desc: "Cambia de color con control remoto.", pct: 30 }
  ],
  ubicaciones: [
    { id: "interior", nombre: "Interior", desc: "Local, oficina, cuarto, evento.", pct: 0 },
    { id: "exterior", nombre: "Exterior", desc: "Fachada o lugar donde le da lluvia.", pct: 30 }
  ],
  // Forma del panel: rectangular o siguiendo el contorno del logo (recargo en % sobre la fabricación)
  formas: [
    { id: "rectangulo", nombre: "Rectangular", desc: "Panel con las esquinas redondeadas.", pct: 0 },
    { id: "silueta", nombre: "Con la forma de tu logo", desc: "Cortado con láser siguiendo el contorno de tu diseño.", pct: 10 }
  ],
  montajes: [
    { id: "pared", nombre: "Para colgar en pared", desc: "Con tornillos y chazos.", precio: 0 },
    { id: "base", nombre: "Con base para mesa", desc: "Base en acrílico para poner sobre un mueble.", precio: 35000 }
  ],
  anchoMin: 20, anchoMax: 200, anchoDefecto: 60,
  redondeo: 1000,
  // Mientras se hace la maqueta: SOLO cosas que de verdad ofreces
  beneficios: ["Hecho a mano en Colombia", "Te mostramos el diseño antes de fabricar", "Envíos a todo el país"],
  limites: { maquetasPorDia: 3, usdMes: 5 },
  // Cinta que se mueve debajo del carrusel
  cinta: ["Cotización al instante", "Maqueta antes de fabricar", "Corte láser a la medida", "Hecho a mano en Colombia"],
  // "De tu logo a letrero en 3 pasos"
  pasos: [
    { titulo: "Sube tu logo", desc: "Foto, captura o archivo PNG, JPG o WEBP." },
    { titulo: "Mira tu maqueta", desc: "Lo convertimos en letrero y te damos el precio al instante." },
    { titulo: "Lo fabricamos", desc: "Lo cortamos con láser y lo armamos a mano para enviártelo." }
  ],
  // "De la maqueta a la realidad" (con la foto del taller que subas)
  taller: {
    titulo: "De la maqueta a la realidad",
    texto: "No imprimimos letreros: los fabricamos. Cortamos con láser y armamos cada pieza a mano a partir de tu diseño.",
    puntoTitulo: "Hecho por nosotros",
    puntoDesc: "Cada letrero se corta, se lija y se arma en nuestro taller."
  }
};

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const texto = (v, max, d = "") => String(v ?? d).replace(/[<>]/g, "").slice(0, max).trim();
const idOk = (v, i) => (String(v || "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30) || `op${i}`);

// Solo rutas de imágenes de CoDropX (no links de afuera); "" = sin imagen
const rutaImagen = (v, d) => (v === undefined || v === null ? d : /^\/(marcas\/[\w.-]+|api\/cotiza\/img\/[a-f0-9]{24})$/.test(String(v)) ? String(v) : "");

// Deja la configuración segura y completa (lo que venga de la pantalla o de la base de datos)
export function limpiarConfig(c = {}) {
  const d = CONFIG_DEFECTO;
  const lista = (arr, def, campos) => {
    const xs = Array.isArray(arr) && arr.length ? arr : def;
    return xs.slice(0, 12).map((x, i) => {
      const o = { id: idOk(x?.id || x?.nombre, i), nombre: texto(x?.nombre, 60, "Opción") || "Opción", desc: texto(x?.desc, 160) };
      for (const [k, tipo] of Object.entries(campos)) o[k] = tipo === "bool" ? !!x?.[k] : Math.max(0, num(x?.[k]));
      return o;
    }).filter((x, i, a) => a.findIndex(y => y.id === x.id) === i);
  };
  const anchoMin = Math.min(500, Math.max(5, num(c.anchoMin, d.anchoMin)));
  const anchoMax = Math.min(1000, Math.max(anchoMin + 5, num(c.anchoMax, d.anchoMax)));
  return {
    activo: c.activo === undefined ? d.activo : !!c.activo,
    marca: texto(c.marca, 60, d.marca) || d.marca,
    cabecera: ["nada", "nombre", "logo"].includes(c.cabecera) ? c.cabecera : d.cabecera,
    logo: rutaImagen(c.logo, d.logo),
    icono: rutaImagen(c.icono, d.icono),
    titulo: texto(c.titulo, 90, d.titulo) || d.titulo,
    subtitulo: texto(c.subtitulo, 200, d.subtitulo),
    moneda: ["COP", "USD"].includes(c.moneda) ? c.moneda : d.moneda,
    whatsapp: String(c.whatsapp ?? "").replace(/\D/g, "").slice(0, 15),
    // Cierre: "whatsapp" (te llega el pedido) o "shopify" (paga el total en el checkout de tu tienda)
    cierre: ["whatsapp", "shopify"].includes(c.cierre) ? c.cierre : "whatsapp",
    tiendaPago: /^[a-f0-9]{24}$/.test(String(c.tiendaPago || "")) ? String(c.tiendaPago) : "",
    anticipoPct: Math.min(100, Math.max(0, num(c.anticipoPct, d.anticipoPct))),
    envioGratis: c.envioGratis === undefined ? d.envioGratis : !!c.envioGratis,
    envioTexto: texto(c.envioTexto, 60, d.envioTexto) || d.envioTexto,
    ...costosLimpios(c, lista),
    // "pideColor": al elegir esa luz, el cliente escribe el color (configs viejas: la luz "fija" lo pide)
    luces: lista(c.luces, d.luces, { pct: "n", pideColor: "bool" }).map((l, i) => ((Array.isArray(c.luces) ? c.luces[i] : null)?.pideColor === undefined && l.id === "fija" ? { ...l, pideColor: true } : l)),
    ubicaciones: lista(c.ubicaciones, d.ubicaciones, { pct: "n" }),
    montajes: lista(c.montajes, d.montajes, { precio: "n" }),
    formas: lista(c.formas, d.formas, { pct: "n" }),
    anchoMin, anchoMax,
    anchoDefecto: Math.min(anchoMax, Math.max(anchoMin, num(c.anchoDefecto, d.anchoDefecto))),
    redondeo: [1, 100, 500, 1000, 5000, 10000].includes(num(c.redondeo)) ? num(c.redondeo) : d.redondeo,
    beneficios: (Array.isArray(c.beneficios) ? c.beneficios : d.beneficios).map(b => texto(b, 80)).filter(Boolean).slice(0, 8),
    cinta: (Array.isArray(c.cinta) ? c.cinta : d.cinta).map(b => texto(b, 60)).filter(Boolean).slice(0, 10),
    pasos: [0, 1, 2].map(i => ({ titulo: texto(c.pasos?.[i]?.titulo, 50, d.pasos[i].titulo), desc: texto(c.pasos?.[i]?.desc, 160, d.pasos[i].desc) })),
    taller: Object.fromEntries(Object.entries(d.taller).map(([k, v]) => [k, texto(c.taller?.[k] ?? v, k === "texto" ? 400 : 120)])),
    limites: {
      maquetasPorDia: Math.min(500, Math.max(0, Math.round(num(c.limites?.maquetasPorDia, d.limites.maquetasPorDia)))),
      usdMes: Math.min(500, Math.max(0, num(c.limites?.usdMes, d.limites.usdMes)))
    }
  };
}

// Láminas, tipos de letrero, láser, costos, porcentajes y tramos (si la config es vieja, sin láminas, arranca con los del Excel)
function costosLimpios(c, lista) {
  const d = CONFIG_DEFECTO;
  const nueva = Array.isArray(c.laminas) && c.laminas.length;
  const laminas = lista(nueva ? c.laminas : d.laminas, d.laminas, { precio: "n", m2: "n" }).map(l => ({ ...l, m2: l.m2 > 0 ? l.m2 : 1 }));
  const ids = laminas.map(l => l.id);
  let costosIn = Array.isArray(c.costos) ? [...c.costos] : [...d.costos];
  // Configs guardadas antes de que existiera "Impresión": se le agrega (si después la quitas, no vuelve)
  if (!c.extrasV && !costosIn.some(x => x?.id === "impresion")) costosIn.push(d.costos.find(x => x.id === "impresion"));
  const costos = costosIn.slice(0, 20).map((x, i) => ({
    id: idOk(x?.id || x?.nombre, i), nombre: texto(x?.nombre, 60, "Costo") || "Costo", valor: Math.max(0, num(x?.valor)),
    modo: ["fijo", "area", "contorno"].includes(x?.modo) ? x.modo : "fijo", soloLuz: !!x?.soloLuz, opcional: !!x?.opcional
  }));
  const opcionales = costos.filter(x => x.opcional).map(x => x.id);
  // Configs guardadas antes de que existiera "Acrílico con impresión y luz neonflex": se le agrega una vez
  let matsIn = nueva ? [...(c.materiales || [])] : d.materiales;
  if (nueva && (c.extrasV || 0) < 2 && !matsIn.some(x => x?.id === "impresion_neon")) matsIn.push(d.materiales.find(x => x.id === "impresion_neon"));
  const materiales = lista(matsIn, d.materiales, { conLuz: "bool", neon: "bool", pideColores: "bool" }).map((m, i) => {
    const orig = matsIn?.[i] || {};
    const capas = (Array.isArray(orig.capas) ? orig.capas : []).map(String).filter(x => ids.includes(x));
    if (orig.neon === undefined) m.neon = !!d.materiales.find(x => x.id === m.id)?.neon;
    // "pideColores": el cliente elige el color del fondo y del logo (configs viejas: el acrílico sin luz lo pide)
    if (orig.pideColores === undefined) m.pideColores = m.id === "espejo";
    const extras = (Array.isArray(orig.extras) ? orig.extras : d.materiales.find(x => x.id === m.id)?.extras || []).map(String).filter(x => opcionales.includes(x));
    return { ...m, capas: capas.length ? [...new Set(capas)] : [ids[0]], extras: [...new Set(extras)], aspecto: texto(orig.aspecto ?? d.materiales.find(x => x.id === m.id)?.aspecto ?? "", 2500) };
  });
  const L = c.laser || {};
  const laser = Object.fromEntries(Object.entries(d.laser).map(([k, v]) => [k, Math.max(0, num(L[k], v))]));
  const tramos = (Array.isArray(c.tramos) && c.tramos.length ? c.tramos : d.tramos).slice(0, 8).map(t => ({
    hasta: Math.max(0, num(t?.hasta)), pauta: Math.max(0, num(t?.pauta)), pautaPct: Math.min(80, Math.max(0, num(t?.pautaPct))), flete: Math.max(0, num(t?.flete))
  })).sort((a, b) => (a.hasta || Infinity) - (b.hasta || Infinity));
  const pct = (k) => Math.min(300, Math.max(0, num(c[k], d[k])));
  return { extrasV: 2, laminas, materiales, laser, costos, tramos, manoObraPct: pct("manoObraPct"), gananciaProductoPct: pct("gananciaProductoPct"), gananciaPct: Math.min(80, pct("gananciaPct")) };
}

// Precio del cm² de una lámina
export const precioCm2 = (l) => (l && l.m2 > 0 ? l.precio / (l.m2 * 10000) : 0);
const AREA_BASE = 900, CONTORNO_BASE = 120;   // el letrero de 30 × 30 del Excel

const buscar = (arr, id) => (arr || []).find(x => x.id === id) || (arr || [])[0] || null;

// Alto a partir del ancho y la proporción del logo (alto ÷ ancho)
export const altoDe = (ancho, proporcion = 1) => Math.round(num(ancho) * Math.min(4, Math.max(0.15, num(proporcion, 1))) * 10) / 10;

/**
 * Precio de un letrero, con la misma cuenta del Excel de fabricación:
 *   materiales (láminas × área + láser + costos) → + mano de obra % → + ganancia del producto % = FABRICACIÓN
 *   + recargos (luz, exterior) y montaje → × cantidad → + pauta y flete (según el tramo) → + tu ganancia % = PRECIO
 * eleccion: { material, luz, ubicacion, forma, montaje, ancho, alto, cantidad, colorLuz }
 */
export function cotizar(cfg, eleccion = {}) {
  const c = cfg?.laminas ? cfg : limpiarConfig(cfg);
  const mat = buscar(c.materiales, eleccion.material);
  if (!mat) return null;
  const luz = mat.conLuz ? buscar(c.luces, eleccion.luz) : null;
  const ubi = buscar(c.ubicaciones, eleccion.ubicacion);
  const mon = buscar(c.montajes, eleccion.montaje);
  const forma = buscar(c.formas, eleccion.forma);
  const ancho = Math.min(c.anchoMax, Math.max(c.anchoMin, num(eleccion.ancho, c.anchoDefecto)));
  const alto = Math.max(1, num(eleccion.alto, ancho));
  const cantidad = Math.min(50, Math.max(1, Math.round(num(eleccion.cantidad, 1))));
  const area = ancho * alto, contorno = 2 * (ancho + alto);

  // 1. Materiales
  const laminas = mat.capas.map(id => c.laminas.find(l => l.id === id)).filter(Boolean)
    .map(l => ({ nombre: l.nombre, valor: area * precioCm2(l) }));
  const minutos = c.laser.minFijos + contorno / 100 * c.laser.minPorMetro;
  const laser = { nombre: `Láser (${Math.round(minutos)} min)`, valor: minutos * c.laser.precioMinuto, minutos };
  const factor = { fijo: 1, area: area / AREA_BASE, contorno: contorno / CONTORNO_BASE };
  const otros = c.costos.filter(x => (!x.soloLuz || mat.conLuz) && (!x.opcional || (mat.extras || []).includes(x.id))).map(x => ({ nombre: x.nombre, valor: x.valor * factor[x.modo] }));
  const materiales = [...laminas, laser, ...otros].reduce((t, x) => t + x.valor, 0);
  const manoObra = materiales * c.manoObraPct / 100;
  const gananciaProducto = (materiales + manoObra) * c.gananciaProductoPct / 100;
  const fabricacion = materiales + manoObra + gananciaProducto;

  // 2. Opciones del cliente
  const recargoLuz = luz ? fabricacion * luz.pct / 100 : 0;
  const recargoUbicacion = ubi ? fabricacion * ubi.pct / 100 : 0;
  const recargoForma = forma ? fabricacion * forma.pct / 100 : 0;
  const precioMontaje = mon ? mon.precio : 0;
  const unidad = fabricacion + recargoLuz + recargoUbicacion + recargoForma + precioMontaje;
  const costoPedido = unidad * cantidad;

  // 3. Pauta, flete y ganancia: dependen del precio final, así que se busca el tramo hasta que cuadre
  const g = c.gananciaPct / 100;
  const tramoDe = (precio) => c.tramos.find(t => !t.hasta || precio <= t.hasta) || c.tramos[c.tramos.length - 1] || { pauta: 0, pautaPct: 0, flete: 0 };
  let precio = costoPedido * (1 + g), tramo = tramoDe(precio), pauta = 0, flete = 0;
  for (let i = 0; i < 8; i++) {
    tramo = tramoDe(precio);
    flete = tramo.flete;
    pauta = Math.max(tramo.pauta, precio * tramo.pautaPct / 100);
    const nuevo = (costoPedido + pauta + flete) * (1 + g);
    if (Math.abs(nuevo - precio) < 1) { precio = nuevo; break; }
    precio = nuevo;
  }
  const ganancia = precio - costoPedido - pauta - flete;
  const r = c.redondeo || 1;
  const total = Math.ceil(precio / r) * r;
  const anticipo = Math.ceil(total * c.anticipoPct / 100 / r) * r;
  const red = Math.round;
  return {
    material: mat, luz, ubicacion: ubi, montaje: mon, ancho, alto, cantidad, area,
    colorLuz: luz?.pideColor ? String(eleccion.colorLuz || "").replace(/[<>]/g, "").slice(0, 40).trim() : "",
    colorFondo: mat.pideColores ? String(eleccion.colorFondo || "").replace(/[<>]/g, "").slice(0, 40).trim() : "",
    colorLogo: mat.pideColores ? String(eleccion.colorLogo || "").replace(/[<>]/g, "").slice(0, 40).trim() : "",
    detalle: { laminas: laminas.map(x => ({ ...x, valor: red(x.valor) })), laser: { ...laser, valor: red(laser.valor) }, otros: otros.map(x => ({ ...x, valor: red(x.valor) })) },
    materiales: red(materiales), manoObra: red(manoObra), gananciaProducto: red(gananciaProducto), fabricacion: red(fabricacion),
    recargoLuz: red(recargoLuz), recargoUbicacion: red(recargoUbicacion), recargoForma: red(recargoForma), precioMontaje: red(precioMontaje), forma,
    unidad: red(unidad), costoPedido: red(costoPedido), pauta: red(pauta), flete: red(flete), ganancia: red(ganancia),
    total, anticipo, saldo: total - anticipo
  };
}


export function formatoPlata(v, moneda = "COP") {
  const n = Math.round(num(v));
  return moneda === "USD" ? `US$${n.toLocaleString("en-US")}` : `$${n.toLocaleString("es-CO")}`;
}

// Mensaje de WhatsApp con el pedido armado
export function mensajeWhatsapp(cfg, q, { maquetaUrl = "", notas = "" } = {}) {
  if (!q) return "";
  const f = (v) => formatoPlata(v, cfg.moneda);
  return [
    `Hola ${cfg.marca} 👋 Quiero este letrero:`,
    `• Material: ${q.material.nombre}`,
    q.luz ? `• Luz: ${q.luz.nombre}${q.colorLuz ? ` — color ${q.colorLuz}` : ""}` : "",
    q.colorFondo ? `• Color del fondo: ${q.colorFondo}` : "",
    q.colorLogo ? `• Color del logo/letras: ${q.colorLogo}` : "",
    q.ubicacion ? `• Va en: ${q.ubicacion.nombre}` : "",
    `• Tamaño: ${q.ancho} × ${q.alto} cm`,
    q.forma ? `• Forma: ${q.forma.nombre}` : "",
    q.montaje ? `• Montaje: ${q.montaje.nombre}` : "",
    `• Cantidad: ${q.cantidad}`,
    cfg.envioGratis ? "• Envío: GRATIS" : "",
    `• Precio cotizado: ${f(q.total)}${cfg.anticipoPct > 0 && cfg.anticipoPct < 100 ? ` (anticipo ${cfg.anticipoPct}%: ${f(q.anticipo)})` : ""}`,
    notas ? `• Notas: ${String(notas).slice(0, 400)}` : "",
    maquetaUrl ? `Mi maqueta: ${maquetaUrl}` : ""
  ].filter(Boolean).join("\n");
}

// Lo que se le pide a la IA para la maqueta: el diseño del cliente IDÉNTICO, hecho en el material elegido, en una pared
export function promptMaqueta(cfg, q, { conEjemplo = false } = {}) {
  if (!q) return "";
  const m = q.material;
  const conLuz = !!m.conLuz;
  // Con luz: de noche para que brille. Sin luz: de día y bien iluminado para que se vean el brillo y el relieve del acrílico
  const escena = q.ubicacion?.id === "exterior"
    ? (conLuz ? "en la pared EXTERIOR de un local (fachada), de noche, foto tomada de cerca y de frente: el letrero ocupa la mayor parte de la foto y alrededor se ve un poco de la fachada" : "en la pared EXTERIOR de un local (fachada), de día, foto tomada de cerca y de frente: el letrero ocupa la mayor parte de la foto y alrededor se ve un poco de la fachada")
    : conLuz
      ? "en una pared de un local u oficina bonita, de noche con luz ambiente tenue, con algunos muebles y plantas desenfocados alrededor"
      : "en una pared de un local u oficina bonita y bien iluminada de día, foto de frente y nítida donde se note que es acrílico brillante y que las piezas están en relieve";
  const luz = !conLuz ? "Sin luz propia: iluminado solo por la luz del lugar."
    : q.colorLuz ? `Encendido con luz LED de UN SOLO COLOR: ${q.colorLuz}. Toda la luz del letrero es de ese color (esto manda sobre cualquier otro color de luz que diga el material).`
    : q.luz?.id === "rgb" ? "Encendido con luz LED de colores (RGB), brillo suave y realista que se refleja un poco en la pared."
    : "Encendido con luz LED en el color o los colores que indica el MATERIAL (si no dice, en el color del logo), brillo realista.";
  const silueta = q.forma?.id === "silueta";
  const formaTxt = !q.forma ? ""
    : silueta ? "FORMA (OBLIGATORIO, manda sobre cualquier otra indicación): el letrero NO es rectangular ni cuadrado. TODA la pieza (la base de acrílico, madera o espejo) va cortada con láser siguiendo el CONTORNO EXTERIOR del logo del cliente, con un borde parejo de unos 2 cm alrededor del dibujo, como una silueta recortada. NO hay ninguna lámina rectangular, cuadrada ni marco detrás o alrededor del logo; los tornillos o soportes van DENTRO de la silueta. Alrededor de la silueta se ve directamente la pared."
    : q.forma.id === "rectangulo" ? "FORMA (OBLIGATORIO): el letrero es un panel rectangular con las esquinas redondeadas y el borde pulido; el logo va centrado dentro del panel."
    : `FORMA (OBLIGATORIO): ${q.forma.nombre}. ${q.forma.desc || ""}`;
  return [
    "FOTOGRAFÍA REAL (no dibujo, no 3D de juguete). Maqueta de un letrero hecho a mano.",
    formaTxt,
    m.neon
      ? `DISEÑO DEL CLIENTE: es ${conEjemplo ? "la PRIMERA imagen (<IMAGE_0>)" : "la imagen de referencia"}. EL LOGO DEL CLIENTE SE CONVIERTE EN LA MANGUERA DE NEÓN FLEX: el tubo de luz dibuja el logo. Reglas para pasarlo a tubo: (1) las partes GRUESAS del logo (letras gruesas, formas grandes, manchas) se hacen HUECAS: el tubo recorre solo su BORDE, como letras de contorno; (2) las líneas DELGADAS (letras finas, trazos, detalles de línea) se hacen con UN solo tubo por el centro del trazo; (3) los detalles muy pequeños que el tubo no alcanza a hacer (pelitos, rayitas cortas, texturas, puntos) se OMITEN. Todo el letrero con tubo de 8 mm del MISMO grosor, curvas suaves, puntas redondeadas, y pequeños cortes oscuros donde termina un tramo de tubo y empieza otro. Nada de áreas rellenas de luz. La forma general, la distribución y las palabras del logo se respetan exactas: debe reconocerse el mismo logo, hecho de tubo.${conEjemplo ? "\nACABADO: la SEGUNDA imagen (<IMAGE_1>) es un letrero que ya fabricamos. Copia SOLO cómo se ve: el tubo, la base, los cables, la luz y el tipo de foto. NO copies su dibujo." : ""}`

      : conEjemplo
      ? "DISEÑO DEL CLIENTE: es la PRIMERA imagen (<IMAGE_0>). Cópialo IDÉNTICO: misma forma, mismas letras escritas igual, mismas proporciones y todos sus detalles. No agregues textos, no cambies palabras, no inventes partes, no le pongas marcas.\nACABADO: la SEGUNDA imagen (<IMAGE_1>) es un letrero que ya fabricamos. Copia SOLO cómo se ve: el material, el grabado, cómo brilla la luz, el borde, la separación de la pared y el tipo de foto. NO copies su dibujo: el dibujo es el del cliente."
      : "DISEÑO DEL CLIENTE: es el de la imagen de referencia. Cópialo IDÉNTICO: misma forma, mismas letras escritas igual, mismos colores y proporciones. No agregues textos, no cambies palabras, no inventes partes, no le pongas marcas.",
    `MATERIAL: ${m.nombre}. ${m.aspecto || m.desc || ""}`,
    (m.extras || []).includes("impresion") ? "IMPRESIÓN: los colores, degradados e imágenes del logo van IMPRESOS a todo color directamente sobre el material (impresión UV), nítidos y con los colores exactos del logo." : "",
    (q.colorFondo || q.colorLogo) ? `COLORES QUE ELIGIÓ EL CLIENTE (esto manda sobre los colores del logo y del material): ${q.colorFondo ? `la base/fondo es de acrílico color ${q.colorFondo}` : ""}${q.colorFondo && q.colorLogo ? "; " : ""}${q.colorLogo ? `el logo y las letras van en acrílico color ${q.colorLogo}` : ""}. Se respetan la forma y los detalles del logo; solo cambian los colores.` : "",
    `LUZ: ${luz}`,
    `DÓNDE: montado ${escena}.`,
    `TAMAÑO REAL: ${q.ancho} cm de ancho por ${q.alto} cm de alto; que se note la escala con lo que hay alrededor.`,
    "El letrero ocupa buena parte de la imagen, centrado y de frente. Nada de personas. Sin textos extra en la imagen.",
    conEjemplo ? "RECUERDA: el dibujo del letrero es SIEMPRE el logo del cliente (<IMAGE_0>). La otra imagen es solo para copiar el acabado (no su forma de panel): nunca devuelvas esa foto ni su dibujo." : "",
    silueta ? "RECUERDA LA FORMA: recortado con la silueta del logo, SIN lámina rectangular ni cuadrada detrás." : ""
  ].join("\n");
}
