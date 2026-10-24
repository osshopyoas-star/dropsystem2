// =============================================
// 🧮 MOTOR DE COSTEO COD (contra entrega)
// Funciones puras: reciben los datos y devuelven el resultado.
// Las usa la Calculadora; se pueden probar sin navegador.
// =============================================

// Valores de arranque por país (los puedes cambiar en la calculadora)
export const PAISES_COSTEO = {
  CO: { nombre: "Colombia", moneda: "COP", flete: 23000, cancelados: 20, devoluciones: 20, admin: 5000, fulfillment: 0, cpa: 18000, utilidad: 20, descuento: 35 },
  EC: { nombre: "Ecuador", moneda: "USD", flete: 8, cancelados: 15, devoluciones: 15, admin: 1, fulfillment: 0, cpa: 5, utilidad: 20, descuento: 35 }
};

export const RECARGO_UNIDAD_EXTRA = 1.3;   // cada unidad extra del paquete suma 1,3 × costo del proveedor

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

// Colombia: al valor terminado en 9.900 más cercano (99.990 → 99.900; 119.490 → 119.900)
// Ecuador: hacia arriba a ,99 o 4,99 (48,99 → 49,99; 31,33 → 34,99)
export function redondear(valor, pais = "CO") {
  const v = num(valor);
  if (v <= 0) return 0;
  if (pais === "EC") {
    const paso = Math.ceil((v + 0.01) / 5) * 5;     // siguiente múltiplo de 5
    return Math.round((paso - 0.01) * 100) / 100;
  }
  const abajo = Math.floor((v + 100) / 10000) * 10000 - 100;
  const arriba = abajo + 10000;
  return (v - abajo) <= (arriba - v) ? Math.max(abajo, 9900) : arriba;
}

// Paquete: siempre hacia arriba, para no regalar margen
export function redondearArriba(valor, pais = "CO") {
  const v = num(valor);
  if (v <= 0) return 0;
  if (pais === "EC") return redondear(v, "EC");
  return Math.ceil((v + 100) / 10000) * 10000 - 100;
}

export function formatear(valor, pais = "CO") {
  const v = num(valor);
  if (pais === "EC") return "$" + v.toFixed(2);
  return "$" + Math.round(v).toLocaleString("es-CO").replace(/,/g, ".");
}

/**
 * datos: { pais, proveedor, flete, cancelados, devoluciones, admin, fulfillment, cpa, utilidad, descuento, precio }
 * precio: opcional. Si viene, se "valida tu precio"; si no, se sugiere uno con la utilidad deseada.
 */
export function calcularCosteo(datos = {}) {
  const pais = datos.pais === "EC" ? "EC" : "CO";
  const proveedor = num(datos.proveedor);
  const flete = num(datos.flete);
  const cancelados = Math.min(95, Math.max(0, num(datos.cancelados)));
  const devoluciones = Math.min(95, Math.max(0, num(datos.devoluciones)));
  const admin = num(datos.admin);
  const fulfillment = num(datos.fulfillment);
  const cpa = num(datos.cpa);
  const utilidadDeseada = Math.min(90, Math.max(0, num(datos.utilidad)));
  const descuento = Math.min(90, Math.max(0, num(datos.descuento)));
  const precioPropio = num(datos.precio) > 0 ? num(datos.precio) : null;

  // Efectividad: de cada pedido, cuántos se entregan y se pagan
  const entrega = Math.max(0.01, 1 - devoluciones / 100);                         // entrega sobre despachado
  const efectividad = Math.max(0.01, 1 - (cancelados + devoluciones) / 100);      // efectividad total

  const fleteConDevoluciones = flete / entrega;       // pagas fletes de los que vuelven
  const cpaCosteado = cpa / efectividad;              // pagas pauta de los que no se entregan
  const costosTotales = proveedor + fleteConDevoluciones + cpaCosteado + admin + fulfillment;

  const precioMinimoMeta = utilidadDeseada < 100 ? costosTotales / (1 - utilidadDeseada / 100) : costosTotales;
  const modo = precioPropio ? "validar" : "sugerido";
  const precio = precioPropio ?? precioMinimoMeta;
  // Sugerido: hacia arriba para no perder margen. Validando tu precio: al más cercano.
  const redondeado = modo === "sugerido" ? redondearArriba(precio, pais) : redondear(precio, pais);

  const utilidad = precio - costosTotales;
  const utilidadPct = precio > 0 ? (utilidad / precio) * 100 : 0;
  const bep = utilidad + cpa;                          // CPA máximo por venta antes de perder
  const precioAntes = descuento < 100 ? precio / (1 - descuento / 100) : precio;

  // Lo que te cuesta la inefectividad (comparado con 100% de entregas)
  const costoInefectividad = (fleteConDevoluciones - flete) + (cpaCosteado - cpa);

  // Paquetes de 2 y 3 unidades (un solo envío, una sola pauta)
  const base = redondeado || precio;
  const paquetes = [2, 3].map(n => {
    const precioPack = redondearArriba(base + (n - 1) * RECARGO_UNIDAD_EXTRA * proveedor, pais);
    const costoPack = n * proveedor + fleteConDevoluciones + cpaCosteado + admin + fulfillment;
    const unitario = precioPack / n;
    return {
      unidades: n,
      precio: precioPack,
      unitario,
      normal: base,
      ahorroPct: base > 0 ? Math.round((1 - unitario / base) * 100) : 0,
      utilidad: precioPack - costoPack,
      utilidadPct: precioPack > 0 ? ((precioPack - costoPack) / precioPack) * 100 : 0
    };
  });

  return {
    pais, modo,
    entregaPct: entrega * 100,
    efectividadPct: efectividad * 100,
    fleteConDevoluciones, cpaCosteado, costosTotales,
    precio, redondeado, precioAntes,
    utilidad, utilidadPct, utilidadDeseada,
    cumpleMeta: utilidadPct + 0.05 >= utilidadDeseada,
    precioMinimoMeta,
    bep,
    costoInefectividad,
    fleteExtra: fleteConDevoluciones - flete,
    cpaExtra: cpaCosteado - cpa,
    alertaEfectividad: efectividad < 0.5,
    paquetes
  };
}

// =============================================
// 🛒 COMPLEMENTOS: subir lo que te deja cada cliente
// En el checkout (Releasit): unidad extra, protección de envío, garantía, otro producto.
// Después de comprar: una oferta de 1 clic (ej. otra unidad con descuento).
// En contra entrega solo se cobran si el pedido se entrega, y viajan en el MISMO paquete
// (no pagas otro flete ni otra pauta): casi todo lo que cobras de más es ganancia.
// =============================================
export const TIPOS_COMPLEMENTO = {
  unidad: { nombre: "Unidad extra", donde: "checkout", toma: 20, ayuda: "Otra unidad del mismo producto con descuento, marcada con un clic en el formulario." },
  proteccion: { nombre: "Protección de envío", donde: "checkout", toma: 30, ayuda: "Si el paquete se pierde o llega dañado, lo reenvías sin costo. Cuesta poco y casi siempre es ganancia." },
  garantia: { nombre: "Garantía de satisfacción", donde: "checkout", toma: 15, ayuda: "Cambio o reposición si algo falla. Solo ofrécela si la vas a cumplir." },
  complemento: { nombre: "Producto complementario", donde: "checkout", toma: 10, ayuda: "Algo que combina con el producto (ej. champú con el spray). Busca el costo en Dropi." },
  postcompra: { nombre: "Oferta después de comprar", donde: "postcompra", toma: 12, ayuda: "Ventana de 1 clic al terminar el pedido: '¿Y solo 1 unidad extra? Antes X, ahora Y'." }
};

// Precio "bonito" para extras pequeños: Colombia en X.900 (9.900, 14.900, 59.900) · Ecuador en ,99
export function precioExtra(valor, pais = "CO") {
  const v = num(valor);
  if (v <= 0) return 0;
  if (pais === "EC") return Math.max(0.99, Math.round(v) - 0.01);
  return Math.max(900, Math.round((v + 100) / 1000) * 1000 - 100);
}

// Igual, pero nunca por debajo del valor (para mínimos de margen)
export function precioExtraArriba(valor, pais = "CO") {
  const v = num(valor);
  if (v <= 0) return 0;
  if (pais === "EC") return Math.max(0.99, Math.ceil(v + 0.01) - 0.01);
  return Math.max(900, Math.ceil((v + 100) / 1000) * 1000 - 100);
}

const PRECIOS_FIJOS = { CO: { proteccion: 9900, garantia: 14900 }, EC: { proteccion: 1.99, garantia: 2.99 } };

// Los de arranque, calculados con el precio y el costo del producto
export function complementosPorDefecto({ pais = "CO", precio = 0, proveedor = 0, flete = 0 } = {}) {
  const P = pais === "EC" ? "EC" : "CO";
  const pr = num(precio), prov = num(proveedor), fl = num(flete);
  const minimo = (factor) => prov * factor;   // que nunca quede por debajo del costo
  return [
    { id: "unidad", tipo: "unidad", activo: true, nombre: "Lleva 1 unidad más",
      precio: Math.max(precioExtra(pr * 0.65, P), precioExtraArriba(minimo(1.4), P)), costo: prov, toma: TIPOS_COMPLEMENTO.unidad.toma },
    { id: "proteccion", tipo: "proteccion", activo: true, nombre: "Protección de envío",
      precio: PRECIOS_FIJOS[P].proteccion, costo: Math.round((prov + fl) * 0.03 * 100) / 100, toma: TIPOS_COMPLEMENTO.proteccion.toma },
    { id: "garantia", tipo: "garantia", activo: false, nombre: "Garantía de satisfacción",
      precio: PRECIOS_FIJOS[P].garantia, costo: Math.round((prov + fl) * 0.05 * 100) / 100, toma: TIPOS_COMPLEMENTO.garantia.toma },
    { id: "postcompra", tipo: "postcompra", activo: true, nombre: "¿Y solo 1 unidad extra?",
      precio: Math.max(precioExtra(pr * 0.45, P), precioExtraArriba(minimo(1.25), P)), costo: prov, toma: TIPOS_COMPLEMENTO.postcompra.toma }
  ];
}

/**
 * base: resultado de calcularCosteo (usa precio redondeado, utilidad por venta entregada y BEP)
 * complementos: [{ tipo, nombre, activo, precio, costo, toma (% de clientes que lo toman) }]
 * → ganancia por cliente con y sin extras, ticket promedio y cuánto más puedes pagar de pauta
 */
export function calcularComplementos(base, complementos = []) {
  const precio = num(base?.redondeado) || num(base?.precio);
  const utilidadBase = num(base?.utilidad);
  const lista = (complementos || []).map(c => {
    const pr = Math.max(0, num(c.precio)), co = Math.max(0, num(c.costo));
    const toma = Math.min(100, Math.max(0, num(c.toma))) / 100;
    const margen = pr - co;
    return {
      ...c, precio: pr, costo: co, toma: toma * 100, margen,
      donde: TIPOS_COMPLEMENTO[c.tipo]?.donde || "checkout",
      aporte: c.activo === false ? 0 : margen * toma,          // lo que suma por cliente, en promedio
      ticket: c.activo === false ? 0 : pr * toma,
      perdida: margen < 0
    };
  });
  const activos = lista.filter(c => c.activo !== false);
  const suma = (arr, k) => arr.reduce((a, c) => a + c[k], 0);
  const checkout = activos.filter(c => c.donde === "checkout");
  const post = activos.filter(c => c.donde === "postcompra");
  const conCheckout = utilidadBase + suma(checkout, "aporte");
  const conTodo = conCheckout + suma(post, "aporte");
  const extra = conTodo - utilidadBase;
  return {
    complementos: lista,
    utilidadBase,
    conCheckout,
    conTodo,
    extra,
    multiplicador: utilidadBase > 0 ? conTodo / utilidadBase : null,
    ticketBase: precio,
    ticketPromedio: precio + suma(activos, "ticket"),
    ticketMaximo: precio + suma(activos, "precio"),
    bepBase: num(base?.bep),
    bepNuevo: num(base?.bep) + extra,        // ahora puedes pagar más por cada venta y seguir ganando
    hayPerdida: activos.some(c => c.perdida)
  };
}
