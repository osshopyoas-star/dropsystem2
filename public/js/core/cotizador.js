// =============================================
// 🪧 COTIZADOR DE LETREROS (acrílico, neón LED, MDF…): precios y opciones
// Sin DOM: lo usan la página pública /cotiza/:clave, la pantalla de CoDropX y el servidor.
// Todos los precios en pesos colombianos (o la moneda que escribas) y el tamaño en centímetros.
// =============================================

export const CONFIG_DEFECTO = {
  activo: true,
  marca: "Tu marca",
  titulo: "Tu logo convertido en letrero",
  subtitulo: "Súbelo y míralo en tu pared en menos de un minuto. Precio al instante.",
  moneda: "COP",
  whatsapp: "",
  anticipoPct: 50,
  // ===== Costos como en el Excel de fabricación =====
  // Láminas: precio de la lámina completa y sus m² → CoDropX saca el precio del cm²
  laminas: [
    { id: "espejo", nombre: "Acrílico espejo plata 2 mm", precio: 240000, m2: 2.16 },
    { id: "transparente", nombre: "Acrílico transparente y blanco 3 mm", precio: 205000, m2: 2.16 },
    { id: "triplex", nombre: "Triplex 3 mm", precio: 48000, m2: 2.88 }
  ],
  // Tipos de letrero que elige el cliente: qué láminas lleva (cada una del tamaño del letrero) y si lleva luz
  materiales: [
    { id: "espejo_luz", nombre: "Acrílico espejo con luz", desc: "Acrílico espejo plata cortado con láser, sobre base de triplex, con luz LED.", capas: ["espejo", "triplex"], conLuz: true },
    { id: "acrilico_luz", nombre: "Acrílico con luz LED", desc: "Acrílico transparente o blanco cortado con láser, sobre base, iluminado.", capas: ["transparente", "triplex"], conLuz: true },
    { id: "espejo", nombre: "Acrílico espejo sin luz", desc: "Acrílico espejo plata cortado con láser, sobre base de triplex.", capas: ["espejo", "triplex"], conLuz: false },
    { id: "madera", nombre: "Triplex / madera", desc: "Corte láser en triplex, pintado o natural.", capas: ["triplex"], conLuz: false }
  ],
  // Láser: minutos × precio del minuto. Minutos = preparación + por cada 100 cm², × la complejidad del diseño
  // (con 30 × 30 y diseño medio da 40 minutos = $40.000, como en el Excel)
  laser: { precioMinuto: 1000, minFijos: 10, minPor100: 3.3333, sencillo: 0.75, medio: 1, complejo: 1.5 },
  // Otros costos por letrero, con su valor para uno de 30 × 30. "fijo" = igual siempre · "area" = sube con el tamaño · "contorno" = sube con el borde
  costos: [
    { id: "pin", nombre: "Pin para pared", valor: 5000, modo: "fijo", soloLuz: false },
    { id: "pegante", nombre: "Pegante y pintura", valor: 5000, modo: "fijo", soloLuz: false },
    { id: "luz", nombre: "Luz LED", valor: 15000, modo: "contorno", soloLuz: true },
    { id: "controlador", nombre: "Controlador", valor: 5000, modo: "fijo", soloLuz: true },
    { id: "fuente", nombre: "Fuente de poder", valor: 5000, modo: "fijo", soloLuz: true }
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
    { id: "fija", nombre: "Un solo color", desc: "Blanco, cálido o el color que elijas.", pct: 0 },
    { id: "rgb", nombre: "RGB con control", desc: "Cambia de color con control remoto.", pct: 30 }
  ],
  ubicaciones: [
    { id: "interior", nombre: "Interior", desc: "Local, oficina, cuarto, evento.", pct: 0 },
    { id: "exterior", nombre: "Exterior", desc: "Fachada o lugar donde le da lluvia.", pct: 30 }
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
    titulo: texto(c.titulo, 90, d.titulo) || d.titulo,
    subtitulo: texto(c.subtitulo, 200, d.subtitulo),
    moneda: ["COP", "USD"].includes(c.moneda) ? c.moneda : d.moneda,
    whatsapp: String(c.whatsapp ?? "").replace(/\D/g, "").slice(0, 15),
    anticipoPct: Math.min(100, Math.max(0, num(c.anticipoPct, d.anticipoPct))),
    ...costosLimpios(c, lista),
    luces: lista(c.luces, d.luces, { pct: "n" }),
    ubicaciones: lista(c.ubicaciones, d.ubicaciones, { pct: "n" }),
    montajes: lista(c.montajes, d.montajes, { precio: "n" }),
    anchoMin, anchoMax,
    anchoDefecto: Math.min(anchoMax, Math.max(anchoMin, num(c.anchoDefecto, d.anchoDefecto))),
    redondeo: [1, 100, 500, 1000, 5000, 10000].includes(num(c.redondeo)) ? num(c.redondeo) : d.redondeo,
    beneficios: (Array.isArray(c.beneficios) ? c.beneficios : d.beneficios).map(b => texto(b, 80)).filter(Boolean).slice(0, 8),
    cinta: (Array.isArray(c.cinta) ? c.cinta : d.cinta).map(b => texto(b, 60)).filter(Boolean).slice(0, 10),
    pasos: [0, 1, 2].map(i => ({ titulo: texto(c.pasos?.[i]?.titulo, 50, d.pasos[i].titulo), desc: texto(c.pasos?.[i]?.desc, 160, d.pasos[i].desc) })),
    taller: Object.fromEntries(Object.entries(d.taller).map(([k, v]) => [k, texto(c.taller?.[k] ?? v, k === "texto" ? 400 : 120)])),
    limites: {
      maquetasPorDia: Math.min(20, Math.max(0, Math.round(num(c.limites?.maquetasPorDia, d.limites.maquetasPorDia)))),
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
  const materiales = lista(nueva ? c.materiales : d.materiales, d.materiales, { conLuz: "bool" }).map((m, i) => {
    const orig = (nueva ? c.materiales : d.materiales)?.[i] || {};
    const capas = (Array.isArray(orig.capas) ? orig.capas : []).map(String).filter(x => ids.includes(x));
    return { ...m, capas: capas.length ? [...new Set(capas)] : [ids[0]] };
  });
  const L = c.laser || {};
  const laser = Object.fromEntries(Object.entries(d.laser).map(([k, v]) => [k, Math.max(0, num(L[k], v))]));
  const costos = (Array.isArray(c.costos) ? c.costos : d.costos).slice(0, 20).map((x, i) => ({
    id: idOk(x?.id || x?.nombre, i), nombre: texto(x?.nombre, 60, "Costo") || "Costo", valor: Math.max(0, num(x?.valor)),
    modo: ["fijo", "area", "contorno"].includes(x?.modo) ? x.modo : "fijo", soloLuz: !!x?.soloLuz
  }));
  const tramos = (Array.isArray(c.tramos) && c.tramos.length ? c.tramos : d.tramos).slice(0, 8).map(t => ({
    hasta: Math.max(0, num(t?.hasta)), pauta: Math.max(0, num(t?.pauta)), pautaPct: Math.min(80, Math.max(0, num(t?.pautaPct))), flete: Math.max(0, num(t?.flete))
  })).sort((a, b) => (a.hasta || Infinity) - (b.hasta || Infinity));
  const pct = (k) => Math.min(300, Math.max(0, num(c[k], d[k])));
  return { laminas, materiales, laser, costos, tramos, manoObraPct: pct("manoObraPct"), gananciaProductoPct: pct("gananciaProductoPct"), gananciaPct: Math.min(80, pct("gananciaPct")) };
}

// Precio del cm² de una lámina
export const precioCm2 = (l) => (l && l.m2 > 0 ? l.precio / (l.m2 * 10000) : 0);
export const COMPLEJIDADES = { sencillo: "Sencillo", medio: "Medio", complejo: "Complejo" };
const AREA_BASE = 900, CONTORNO_BASE = 120;   // el letrero de 30 × 30 del Excel

const buscar = (arr, id) => (arr || []).find(x => x.id === id) || (arr || [])[0] || null;

// Alto a partir del ancho y la proporción del logo (alto ÷ ancho)
export const altoDe = (ancho, proporcion = 1) => Math.round(num(ancho) * Math.min(4, Math.max(0.15, num(proporcion, 1))) * 10) / 10;

/**
 * Precio de un letrero, con la misma cuenta del Excel de fabricación:
 *   materiales (láminas × área + láser + costos) → + mano de obra % → + ganancia del producto % = FABRICACIÓN
 *   + recargos (luz, exterior) y montaje → × cantidad → + pauta y flete (según el tramo) → + tu ganancia % = PRECIO
 * eleccion: { material, luz, ubicacion, montaje, ancho, alto, cantidad, complejidad }
 */
export function cotizar(cfg, eleccion = {}) {
  const c = cfg?.laminas ? cfg : limpiarConfig(cfg);
  const mat = buscar(c.materiales, eleccion.material);
  if (!mat) return null;
  const luz = mat.conLuz ? buscar(c.luces, eleccion.luz) : null;
  const ubi = buscar(c.ubicaciones, eleccion.ubicacion);
  const mon = buscar(c.montajes, eleccion.montaje);
  const ancho = Math.min(c.anchoMax, Math.max(c.anchoMin, num(eleccion.ancho, c.anchoDefecto)));
  const alto = Math.max(1, num(eleccion.alto, ancho));
  const cantidad = Math.min(50, Math.max(1, Math.round(num(eleccion.cantidad, 1))));
  const complejidad = COMPLEJIDADES[eleccion.complejidad] ? eleccion.complejidad : "medio";
  const area = ancho * alto, contorno = 2 * (ancho + alto);

  // 1. Materiales
  const laminas = mat.capas.map(id => c.laminas.find(l => l.id === id)).filter(Boolean)
    .map(l => ({ nombre: l.nombre, valor: area * precioCm2(l) }));
  const minutos = (c.laser.minFijos + area / 100 * c.laser.minPor100) * (c.laser[complejidad] || 1);
  const laser = { nombre: `Láser (${Math.round(minutos)} min)`, valor: minutos * c.laser.precioMinuto, minutos };
  const factor = { fijo: 1, area: area / AREA_BASE, contorno: contorno / CONTORNO_BASE };
  const otros = c.costos.filter(x => !x.soloLuz || mat.conLuz).map(x => ({ nombre: x.nombre, valor: x.valor * factor[x.modo] }));
  const materiales = [...laminas, laser, ...otros].reduce((t, x) => t + x.valor, 0);
  const manoObra = materiales * c.manoObraPct / 100;
  const gananciaProducto = (materiales + manoObra) * c.gananciaProductoPct / 100;
  const fabricacion = materiales + manoObra + gananciaProducto;

  // 2. Opciones del cliente
  const recargoLuz = luz ? fabricacion * luz.pct / 100 : 0;
  const recargoUbicacion = ubi ? fabricacion * ubi.pct / 100 : 0;
  const precioMontaje = mon ? mon.precio : 0;
  const unidad = fabricacion + recargoLuz + recargoUbicacion + precioMontaje;
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
    material: mat, luz, ubicacion: ubi, montaje: mon, ancho, alto, cantidad, area, complejidad,
    detalle: { laminas: laminas.map(x => ({ ...x, valor: red(x.valor) })), laser: { ...laser, valor: red(laser.valor) }, otros: otros.map(x => ({ ...x, valor: red(x.valor) })) },
    materiales: red(materiales), manoObra: red(manoObra), gananciaProducto: red(gananciaProducto), fabricacion: red(fabricacion),
    recargoLuz: red(recargoLuz), recargoUbicacion: red(recargoUbicacion), precioMontaje: red(precioMontaje),
    unidad: red(unidad), costoPedido: red(costoPedido), pauta: red(pauta), flete: red(flete), ganancia: red(ganancia),
    total, anticipo, saldo: total - anticipo
  };
}

// Qué tan complejo es un diseño, medido en el navegador: cuánto borde tiene comparado con su tamaño.
// Un círculo lleno da ~3,5; letras y logos con detalle dan mucho más. Devuelve "sencillo", "medio" o "complejo".
export function complejidadDe({ bordes = 0, relleno = 0 } = {}) {
  if (!relleno) return "medio";
  const indice = bordes / Math.sqrt(relleno);
  return indice < 9 ? "sencillo" : indice < 22 ? "medio" : "complejo";
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
    q.luz ? `• Luz: ${q.luz.nombre}` : "",
    q.ubicacion ? `• Va en: ${q.ubicacion.nombre}` : "",
    `• Tamaño: ${q.ancho} × ${q.alto} cm`,
    `• Diseño: ${COMPLEJIDADES[q.complejidad] || "Medio"}`,
    q.montaje ? `• Montaje: ${q.montaje.nombre}` : "",
    `• Cantidad: ${q.cantidad}`,
    `• Precio cotizado: ${f(q.total)}${cfg.anticipoPct > 0 && cfg.anticipoPct < 100 ? ` (anticipo ${cfg.anticipoPct}%: ${f(q.anticipo)})` : ""}`,
    notas ? `• Notas: ${String(notas).slice(0, 400)}` : "",
    maquetaUrl ? `Mi maqueta: ${maquetaUrl}` : ""
  ].filter(Boolean).join("\n");
}

// Lo que se le pide a la IA para la maqueta: el diseño del cliente IDÉNTICO, hecho en el material elegido, en una pared
export function promptMaqueta(cfg, q) {
  if (!q) return "";
  const m = q.material;
  const conLuz = !!m.conLuz;
  const escena = q.ubicacion?.id === "exterior"
    ? "en la fachada de un local comercial de noche, vista de frente desde la calle"
    : "en una pared de un local u oficina bonita, de noche con luz ambiente tenue, con algunos muebles y plantas desenfocados alrededor";
  const luz = !conLuz ? "Sin luz propia: iluminado solo por la luz del lugar."
    : q.luz?.id === "rgb" ? "Encendido con luz LED de colores (RGB), brillo suave y realista que se refleja un poco en la pared."
    : "Encendido con luz LED de un solo color, brillo suave y realista que se refleja un poco en la pared.";
  return [
    "FOTOGRAFÍA REAL (no dibujo, no 3D de juguete). Maqueta de un letrero hecho a mano.",
    "DISEÑO DEL CLIENTE: es el de la imagen de referencia. Cópialo IDÉNTICO: misma forma, mismas letras escritas igual, mismos colores y proporciones. No agregues textos, no cambies palabras, no inventes partes, no le pongas marcas.",
    `MATERIAL: ${m.nombre}. ${m.desc || ""}`,
    `LUZ: ${luz}`,
    `DÓNDE: montado ${escena}.`,
    `TAMAÑO REAL: ${q.ancho} cm de ancho por ${q.alto} cm de alto; que se note la escala con lo que hay alrededor.`,
    "El letrero ocupa buena parte de la imagen, centrado y de frente. Nada de personas. Sin textos extra en la imagen."
  ].join("\n");
}
