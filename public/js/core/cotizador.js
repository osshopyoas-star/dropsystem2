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
  // Materiales: precio por cm² del frente del letrero, con un mínimo por letrero
  materiales: [
    { id: "acrilico_led", nombre: "Acrílico con luz LED", desc: "Corte láser en acrílico, iluminado por detrás. El más pedido.", precioCm2: 110, minimo: 150000, conLuz: true },
    { id: "neon", nombre: "Neón LED", desc: "Manguera de neón LED sobre base de acrílico transparente.", precioCm2: 140, minimo: 180000, conLuz: true },
    { id: "acrilico", nombre: "Acrílico sin luz", desc: "Corte láser en acrílico de color o espejo.", precioCm2: 55, minimo: 70000, conLuz: false },
    { id: "mdf", nombre: "MDF / madera", desc: "Corte láser en MDF, pintado o natural.", precioCm2: 30, minimo: 45000, conLuz: false }
  ],
  // Tipo de luz (solo materiales con luz): recargo en % sobre el precio del letrero
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
    materiales: lista(c.materiales, d.materiales, { precioCm2: "n", minimo: "n", conLuz: "bool" }),
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

const buscar = (arr, id) => (arr || []).find(x => x.id === id) || (arr || [])[0] || null;

// Alto a partir del ancho y la proporción del logo (alto ÷ ancho)
export const altoDe = (ancho, proporcion = 1) => Math.round(num(ancho) * Math.min(4, Math.max(0.15, num(proporcion, 1))) * 10) / 10;

/**
 * Precio de un letrero.
 * eleccion: { material, luz, ubicacion, montaje, ancho, alto, cantidad }
 * Devuelve el desglose y el total (redondeado), más el anticipo.
 */
export function cotizar(cfg, eleccion = {}) {
  const c = cfg?.materiales ? cfg : limpiarConfig(cfg);
  const mat = buscar(c.materiales, eleccion.material);
  if (!mat) return null;
  const luz = mat.conLuz ? buscar(c.luces, eleccion.luz) : null;
  const ubi = buscar(c.ubicaciones, eleccion.ubicacion);
  const mon = buscar(c.montajes, eleccion.montaje);
  const ancho = Math.min(c.anchoMax, Math.max(c.anchoMin, num(eleccion.ancho, c.anchoDefecto)));
  const alto = Math.max(1, num(eleccion.alto, ancho));
  const cantidad = Math.min(50, Math.max(1, Math.round(num(eleccion.cantidad, 1))));
  const area = ancho * alto;
  const base = Math.max(mat.minimo, area * mat.precioCm2);
  const recargoLuz = luz ? base * luz.pct / 100 : 0;
  const recargoUbi = ubi ? (base + recargoLuz) * ubi.pct / 100 : 0;
  const montaje = mon ? mon.precio : 0;
  const unidad = base + recargoLuz + recargoUbi + montaje;
  const r = c.redondeo || 1;
  const total = Math.ceil(unidad * cantidad / r) * r;
  const anticipo = Math.ceil(total * c.anticipoPct / 100 / r) * r;
  return {
    material: mat, luz, ubicacion: ubi, montaje: mon, ancho, alto, cantidad, area,
    base: Math.round(base), recargoLuz: Math.round(recargoLuz), recargoUbicacion: Math.round(recargoUbi), precioMontaje: Math.round(montaje),
    unidad: Math.round(unidad), total, anticipo, saldo: total - anticipo, minimoAplicado: area * mat.precioCm2 < mat.minimo
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
    q.luz ? `• Luz: ${q.luz.nombre}` : "",
    q.ubicacion ? `• Va en: ${q.ubicacion.nombre}` : "",
    `• Tamaño: ${q.ancho} × ${q.alto} cm`,
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
