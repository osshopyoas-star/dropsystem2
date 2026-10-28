// =============================================
// 💰 MOTOR DE FINANZAS (Dropi + pauta)
// Funciones puras: convierten el Excel de Dropi en pedidos
// y calculan Control Diario, Reporte Financiero y Logística.
// Las usa el navegador; se prueban en Node sin navegador.
// =============================================

const num = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const txt = (v) => (v === null || v === undefined ? "" : String(v).trim());
const sinTildes = (s) => txt(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

// "30-09-2026" o "30/09/2026 16:51" → "2026-09-30" (y la hora aparte)
export function fechaISO(v) {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") {   // fecha guardada como número de Excel
    const d = new Date(Math.round((v - 25569) * 864e5));
    return d.toISOString().slice(0, 10);
  }
  const m = txt(v).match(/(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);
  if (!m) return "";
  const [a, b, c] = [m[1], m[2], m[3]];
  const [y, mo, d] = a.length === 4 ? [a, b, c] : [c, b, a];
  return `${y.padStart(4, "20")}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}
const horaDe = (v) => txt(v).match(/(\d{1,2}):(\d{2})/)?.[0]?.padStart(5, "0") || "";

// ---------- Columnas del Excel de Dropi ----------
const COLUMNAS = {
  ordenId: ["ID"],
  fecha: ["FECHA"],
  hora: ["HORA"],
  guia: ["NUMERO GUIA"],
  estatus: ["ESTATUS"],
  tipoEnvio: ["TIPO DE ENVIO"],
  departamento: ["DEPARTAMENTO DESTINO"],
  ciudad: ["CIUDAD DESTINO"],
  transportadora: ["TRANSPORTADORA"],
  total: ["TOTAL DE LA ORDEN", "VALOR DE COMPRA EN PRODUCTOS"],
  ganancia: ["GANANCIA"],
  flete: ["PRECIO FLETE"],
  costoDevolucion: ["COSTO DEVOLUCION FLETE"],
  comision: ["COMISION"],
  proveedor: ["PRECIO PROVEEDOR X CANTIDAD", "TOTAL EN PRECIOS DE PROVEEDOR"],
  productoId: ["PRODUCTO ID"],
  sku: ["SKU"],
  variacionId: ["VARIACION ID"],
  producto: ["PRODUCTO"],
  variacion: ["VARIACION"],
  cantidad: ["CANTIDAD"],
  categoria: ["CATEGORIAS"],
  novedad: ["NOVEDAD"],
  novedadSolucionada: ["FUE SOLUCIONADA LA NOVEDAD"],
  fechaNovedad: ["FECHA DE NOVEDAD"],
  horaNovedad: ["HORA DE NOVEDAD"],
  fechaSolucion: ["FECHA DE SOLUCION"],
  horaSolucion: ["HORA DE SOLUCION"],
  ultimoMovimiento: ["ULTIMO MOVIMIENTO"],
  conceptoMovimiento: ["CONCEPTO ULTIMO MOVIMIENTO"],
  fechaUltMov: ["FECHA DE ULTIMO MOVIMIENTO"],
  horaUltMov: ["HORA DE ULTIMO MOVIMIENTO"],
  tags: ["TAGS"],
  fechaGuia: ["FECHA GUIA GENERADA", "FECHA GENERACION DE GUIA"],
  fechaCancelacion: ["FECHA DE CANCELACION"]
};
// Columnas con datos del cliente: NUNCA se leen ni se guardan
// (nombre, teléfono, email, identificación, dirección, notas, facturación)

/** Convierte las filas del Excel en pedidos (una línea por producto). */
export function leerReporteDropi(filas) {
  if (!Array.isArray(filas) || filas.length < 2) throw new Error("El Excel está vacío");
  const enc = filas[0].map(sinTildes);
  const idx = {};
  for (const [campo, nombres] of Object.entries(COLUMNAS)) {
    idx[campo] = nombres.map(n => enc.indexOf(sinTildes(n))).find(i => i >= 0) ?? -1;
  }
  if (idx.ordenId < 0 || idx.estatus < 0 || idx.fecha < 0) {
    throw new Error("Este Excel no parece un reporte de órdenes de Dropi (faltan ID, FECHA o ESTATUS)");
  }
  const conProductos = idx.producto >= 0;
  const leer = (f, campo) => (idx[campo] >= 0 ? f[idx[campo]] : null);

  const lineas = [];
  for (const f of filas.slice(1)) {
    const ordenId = txt(leer(f, "ordenId"));
    if (!ordenId) continue;
    const fecha = fechaISO(leer(f, "fecha"));
    if (!fecha) continue;
    lineas.push({
      ordenId,
      fecha,
      hora: horaDe(leer(f, "hora")),
      guia: txt(leer(f, "guia")).slice(0, 60),
      estatus: txt(leer(f, "estatus")).toUpperCase().slice(0, 60),
      tipoEnvio: txt(leer(f, "tipoEnvio")).toUpperCase(),
      departamento: txt(leer(f, "departamento")).toUpperCase().slice(0, 60),
      ciudad: txt(leer(f, "ciudad")).toUpperCase().slice(0, 80),
      transportadora: txt(leer(f, "transportadora")).toUpperCase().slice(0, 60),
      total: num(leer(f, "total")),
      ganancia: leer(f, "ganancia") === null || leer(f, "ganancia") === "" ? null : num(leer(f, "ganancia")),
      flete: num(leer(f, "flete")),
      costoDevolucion: num(leer(f, "costoDevolucion")),
      comision: num(leer(f, "comision")),
      proveedor: num(leer(f, "proveedor")),
      productoId: txt(leer(f, "productoId")) || (conProductos ? "" : "sin-producto"),
      sku: txt(leer(f, "sku")).slice(0, 60),
      variacionId: txt(leer(f, "variacionId")),
      producto: (txt(leer(f, "producto")) || (conProductos ? "Sin nombre" : "Pedido (Excel sin productos)")).slice(0, 200),
      variacion: txt(leer(f, "variacion")).slice(0, 100),
      cantidad: Math.max(1, num(leer(f, "cantidad")) || 1),
      categoria: txt(leer(f, "categoria")).slice(0, 80),
      novedad: txt(leer(f, "novedad")).slice(0, 200),
      novedadSolucionada: sinTildes(leer(f, "novedadSolucionada")) === "SI",
      fechaNovedad: fechaISO(leer(f, "fechaNovedad")),
      horaNovedad: horaDe(leer(f, "horaNovedad")),
      fechaSolucion: fechaISO(leer(f, "fechaSolucion")),
      horaSolucion: horaDe(leer(f, "horaSolucion")),
      ultimoMovimiento: txt(leer(f, "ultimoMovimiento") || leer(f, "conceptoMovimiento")).slice(0, 120),
      fechaUltMov: fechaISO(leer(f, "fechaUltMov")),
      horaUltMov: horaDe(leer(f, "horaUltMov")),
      tags: txt(leer(f, "tags")).replace(/^,/, "").slice(0, 120),
      fechaGuia: fechaISO(leer(f, "fechaGuia")),
      fechaCancelacion: fechaISO(leer(f, "fechaCancelacion"))
    });
  }
  return { lineas, conProductos, ordenes: new Set(lineas.map(l => l.ordenId)).size };
}

// ---------- Estados ----------
// entregado · devolucion · cancelado · novedad · transito · pendiente · (reemplazada: no cuenta)
export function grupoEstado(linea) {
  const s = sinTildes(linea.estatus);
  if (s.includes("REEMPLAZ")) return "reemplazada";
  if (s.includes("CANCELAD")) return "cancelado";
  if (s.includes("ENTREGAD")) return "entregado";
  if (s.includes("DEVOLUCI") || s.includes("DEVUELT") || s.includes("RECHAZAD")) return "devolucion";
  if (s.includes("PENDIENTE")) return "pendiente";
  if (s.includes("NOVEDAD") && !s.includes("SOLUCIONADA")) return "novedad";
  if (s.includes("GUIA_GENERADA") || s.includes("GUIA GENERADA") || s.includes("PREPARADO")) return "transito";
  return "transito";
}
const novedadActiva = (l, g = grupoEstado(l)) => g === "novedad" || (g === "transito" && !!l.novedad && !l.novedadSolucionada);

export const NOMBRE_GRUPO = {
  entregado: "Entregados", devolucion: "Devoluciones", cancelado: "Cancelados",
  novedad: "Novedades", transito: "En tránsito", pendiente: "Pendiente confirmación"
};

// Agrupa las líneas por pedido (una orden puede traer varios productos)
export function porOrden(lineas) {
  const m = new Map();
  for (const l of lineas) {
    if (grupoEstado(l) === "reemplazada") continue;
    let o = m.get(l.ordenId);
    if (!o) {
      o = { ...l, lineas: [], total: 0, ganancia: 0, gananciaNula: true, flete: 0, costoDevolucion: 0, proveedor: 0, cantidad: 0 };
      m.set(l.ordenId, o);
    }
    o.lineas.push(l);
    o.total += l.total; o.flete += l.flete; o.costoDevolucion += l.costoDevolucion; o.proveedor += l.proveedor; o.cantidad += l.cantidad;
    if (l.ganancia !== null) { o.ganancia += l.ganancia; o.gananciaNula = false; }
  }
  return [...m.values()].map(o => ({ ...o, grupo: grupoEstado(o) }));
}

// ---------- Productos y grupos ----------
// grupos: [{ id, nombre, ids: [productoId...] }] → los productos del grupo cuentan juntos
export function claveProducto(productoId, grupos = []) {
  const g = grupos.find(x => (x.ids || []).map(String).includes(String(productoId)));
  return g ? `g:${g.id}` : `p:${productoId}`;
}

export function nombresProductos(lineas, grupos = []) {
  const m = new Map();
  for (const l of lineas) {
    const k = claveProducto(l.productoId, grupos);
    if (!m.has(k)) {
      const g = grupos.find(x => `g:${x.id}` === k);
      m.set(k, { clave: k, nombre: g ? g.nombre : l.producto, productoIds: new Set(), pedidos: 0 });
    }
    m.get(k).productoIds.add(String(l.productoId));
  }
  return m;
}

const prom = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// =============================================
// CONTROL DIARIO (como la hoja de Master Escala)
// efectivas = (pedidos − cancelados) × (1 − %dev)
// flete c/dev = flete ÷ (1 − %dev)
// CPA de equilibrio = precio − proveedor − flete c/dev
// CPA = gasto ÷ efectivas · util x prod = equilibrio − CPA · utilidad = util x prod × efectivas
// =============================================
export function filaControl({ pedidos, cancelados, devPct, precio, proveedor, fleteBase, meta = 0, tiktok = 0 }) {
  const dev = Math.min(95, Math.max(0, Number(devPct) || 0)) / 100;
  const efectivas = Math.max(0, (pedidos - cancelados) * (1 - dev));
  const fleteDev = fleteBase / (1 - dev);
  const equilibrio = precio - proveedor - fleteDev;
  const gasto = (Number(meta) || 0) + (Number(tiktok) || 0);
  const cpa = efectivas > 0 ? gasto / efectivas : null;
  const utilProd = cpa === null ? equilibrio : equilibrio - cpa;
  const utilidad = efectivas > 0 ? utilProd * efectivas : -gasto;
  return {
    efectivas, fleteDev, equilibrio, gasto, cpa, utilProd, utilidad,
    roi: gasto > 0 ? utilidad / gasto : null,
    pctCanc: pedidos > 0 ? cancelados / pedidos * 100 : 0
  };
}

/**
 * lineas: pedidos de Dropi · pauta: { "AAAA-MM-DD|clave": { meta, tiktok, devPct, tipo } }
 * Devuelve filas por día y producto.
 */
export function controlDiario(lineas, { desde, hasta, grupos = [], pauta = {}, devPct = 25 } = {}) {
  const filas = new Map();
  const nombres = nombresProductos(lineas, grupos);
  for (const l of lineas) {
    const g = grupoEstado(l);
    if (g === "reemplazada") continue;
    if ((desde && l.fecha < desde) || (hasta && l.fecha > hasta)) continue;
    const clave = claveProducto(l.productoId, grupos);
    const k = `${l.fecha}|${clave}`;
    if (!filas.has(k)) filas.set(k, { fecha: l.fecha, clave, nombre: nombres.get(clave)?.nombre || l.producto, ordenes: new Set(), canceladas: new Set(), sinConfirmar: new Set(), uds: 0, precios: [], proveedores: [], fletes: [] });
    const f = filas.get(k);
    f.ordenes.add(l.ordenId);
    f.uds += l.cantidad;
    if (g === "cancelado") f.canceladas.add(l.ordenId);
    if (g === "pendiente") f.sinConfirmar.add(l.ordenId);
    if (l.total > 0) f.precios.push(l.total);
    if (l.proveedor > 0) f.proveedores.push(l.proveedor);
    if (l.flete > 0) f.fletes.push(l.flete);
  }
  // Días con pauta pero sin pedidos (testeo fallido)
  for (const [k, p] of Object.entries(pauta)) {
    const [fecha, clave] = k.split("|");
    if ((desde && fecha < desde) || (hasta && fecha > hasta) || filas.has(k)) continue;
    if (!(Number(p.meta) > 0 || Number(p.tiktok) > 0 || p.fallido)) continue;
    filas.set(k, { fecha, clave, nombre: p.nombre || nombres.get(clave)?.nombre || "Producto", ordenes: new Set(), canceladas: new Set(), sinConfirmar: new Set(), uds: 0, precios: [], proveedores: [], fletes: [], fallido: true });
  }

  return [...filas.values()].map(f => {
    const p = pauta[`${f.fecha}|${f.clave}`] || {};
    const d = p.devPct !== undefined && p.devPct !== null && p.devPct !== "" ? Number(p.devPct) : devPct;
    const base = {
      pedidos: f.ordenes.size, cancelados: f.canceladas.size, devPct: d,
      precio: prom(f.precios), proveedor: prom(f.proveedores), fleteBase: prom(f.fletes),
      meta: Number(p.meta) || 0, tiktok: Number(p.tiktok) || 0
    };
    return {
      fecha: f.fecha, clave: f.clave, nombre: f.nombre, tipo: p.tipo || "testeo", fallido: !!f.fallido,
      sinConfirmar: f.sinConfirmar.size, uds: f.uds, ...base, ...filaControl(base)
    };
  }).sort((a, b) => a.fecha.localeCompare(b.fecha) || b.pedidos - a.pedidos || a.nombre.localeCompare(b.nombre));
}

export function totalesControl(filas) {
  const t = { pedidos: 0, uds: 0, cancelados: 0, efectivas: 0, meta: 0, tiktok: 0, gasto: 0, utilidad: 0 };
  for (const f of filas) for (const k of Object.keys(t)) t[k] += Number(f[k]) || 0;
  t.roi = t.gasto > 0 ? t.utilidad / t.gasto : null;
  t.cpa = t.efectivas > 0 ? t.gasto / t.efectivas : null;
  t.pctCanc = t.pedidos ? t.cancelados / t.pedidos * 100 : 0;
  return t;
}

// =============================================
// REPORTE FINANCIERO (lo que entra a la wallet)
// =============================================
// =============================================
// COSTOS OPERATIVOS (Shopify, Releasit, IA, edición, salarios...) por mes
// costos: [{ mes: "2026-09", desc, valor, moneda }]. Cada mes se reparte por días:
// si miras solo una parte del mes, cuenta la parte de esos días (completos = meses enteros).
// convertir(valor, moneda) pasa cada valor a la moneda del país.
// =============================================
const diasDelMes = (mes) => new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5, 7), 0)).getUTCDate();
export function mesesEntre(desde, hasta) {
  if (!desde || !hasta || desde > hasta) return [];
  const out = [];
  let [y, m] = [+desde.slice(0, 4), +desde.slice(5, 7)];
  const fin = hasta.slice(0, 7);
  while (out.length < 36) {
    const mes = `${y}-${String(m).padStart(2, "0")}`;
    out.push(mes);
    if (mes >= fin) break;
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}
export function costosPeriodo(costos = [], { desde, hasta, completos = false, convertir = (v) => v } = {}) {
  const meses = mesesEntre(desde, hasta).map(mes => {
    const dm = diasDelMes(mes);
    const ini = desde > `${mes}-01` ? +desde.slice(8, 10) : 1;
    const fin = hasta < `${mes}-${dm}` ? +hasta.slice(8, 10) : dm;
    const dias = completos ? dm : Math.max(0, fin - ini + 1);
    const delMes = costos.filter(c => c.mes === mes).reduce((a, c) => a + (Number(convertir(Number(c.valor) || 0, c.moneda)) || 0), 0);
    return { mes, dias, diasMes: dm, delMes, cuenta: delMes * dias / dm };
  });
  return { total: meses.reduce((a, x) => a + x.cuenta, 0), meses };
}

export function reporteFinanciero(lineas, { desde, hasta, clave = "", grupos = [], gastoMeta = 0, gastoTiktok = 0, costosOperativos = 0, referenciaEntrega = 70 } = {}) {
  const sel = lineas.filter(l => (!desde || l.fecha >= desde) && (!hasta || l.fecha <= hasta) && (!clave || claveProducto(l.productoId, grupos) === clave));
  const ordenes = porOrden(sel);
  const cuenta = (g) => ordenes.filter(o => o.grupo === g);
  const entregados = cuenta("entregado"), devoluciones = cuenta("devolucion"), cancelados = cuenta("cancelado"),
    pendientes = cuenta("pendiente"), novedades = ordenes.filter(o => novedadActiva(o, o.grupo)),
    transito = ordenes.filter(o => (o.grupo === "transito" || o.grupo === "novedad") && !novedadActiva(o, o.grupo));
  const despachados = ordenes.filter(o => !["cancelado", "pendiente"].includes(o.grupo));
  const suma = (arr, k) => arr.reduce((a, o) => a + (Number(o[k]) || 0), 0);

  const ingreso = suma(entregados, "total");
  const costoProductos = suma(entregados, "proveedor");
  const fletesEntregados = suma(entregados, "flete");
  const costoDevoluciones = suma(devoluciones, "costoDevolucion");
  const valorEntregado = entregados.reduce((a, o) => a + (o.gananciaNula ? o.total - o.proveedor - o.flete - o.comision : o.ganancia), 0);
  const gananciaBruta = valorEntregado - costoDevoluciones;
  const publicidad = (Number(gastoMeta) || 0) + (Number(gastoTiktok) || 0);
  const operativos = Math.max(0, Number(costosOperativos) || 0);
  const gananciaNeta = gananciaBruta - publicidad - operativos;

  // Proyección: si de los que siguen rodando se entrega el X%
  const rodando = [...transito, ...novedades];
  const p = Math.min(100, Math.max(0, Number(referenciaEntrega) || 0)) / 100;
  // Lo que deja cada pedido rodando si se entrega, y lo que cuesta si se devuelve
  // (el costo real de devolución que ya te cobró Dropi en el periodo; si aún no hay, el flete de ida)
  const devPromReal = prom(devoluciones.map(o => o.costoDevolucion).filter(x => x > 0));
  const G = rodando.reduce((a, o) => a + (o.total - o.proveedor - o.flete), 0);
  const F = rodando.reduce((a, o) => a + (devPromReal || o.flete), 0);
  const ventaRodando = rodando.reduce((a, o) => a + o.total, 0);
  const ganaRodando = G * p;
  const pierdeRodando = F * (1 - p);
  const cerrados = entregados.length + devoluciones.length;
  const tasaCerrada = cerrados ? entregados.length / cerrados * 100 : null;
  const escenario = (pp) => {
    const gana = G * pp, pierde = F * (1 - pp), neta = gananciaNetaBase(pp);
    const venta = ingreso + ventaRodando * pp;
    return { pct: Math.round(pp * 1000) / 10, seEntregan: Math.round(rodando.length * pp), seDevuelven: rodando.length - Math.round(rodando.length * pp), gana, pierde, neta, margen: venta > 0 ? neta / venta * 100 : 0 };
  };

  function gananciaNetaBase(pp) { return gananciaNeta + G * pp - F * (1 - pp); }
  const pActual = (tasaCerrada ?? (Number(referenciaEntrega) || 0)) / 100;
  // Lo que se lleva cada peso que entra por lo entregado
  const otros = Math.max(0, ingreso - costoProductos - fletesEntregados - valorEntregado);   // comisiones y descuentos de Dropi

  const fletes = despachados.map(o => o.flete).filter(x => x > 0).sort((a, b) => a - b);
  const porDia = {};
  for (const o of ordenes) porDia[o.fecha] = (porDia[o.fecha] || 0) + 1;

  const cobro = (recaudo) => {
    const os = ordenes.filter(o => (o.tipoEnvio || "CON RECAUDO").includes("SIN") !== recaudo);
    const g = (x) => os.filter(o => o.grupo === x).length;
    const ent = os.filter(o => o.grupo === "entregado");
    return {
      pedidos: os.length, entregados: g("entregado"), devoluciones: g("devolucion"), cancelados: g("cancelado"),
      transito: os.filter(o => (o.grupo === "transito" || o.grupo === "novedad") && !novedadActiva(o, o.grupo)).length, novedades: os.filter(o => novedadActiva(o, o.grupo)).length,
      facturado: suma(os.filter(o => !["cancelado", "pendiente"].includes(o.grupo)), "total"),
      ganancia: ent.reduce((a, o) => a + (o.gananciaNula ? o.total - o.proveedor - o.flete : o.ganancia), 0)
    };
  };

  return {
    pedidos: ordenes.length, despachados: despachados.length,
    entregados: entregados.length, devoluciones: devoluciones.length, cancelados: cancelados.length,
    pendientes: pendientes.length, transito: transito.length, novedades: novedades.length,
    tasaEntrega: despachados.length ? entregados.length / despachados.length * 100 : 0,
    facturado: suma(despachados, "total"),
    ingreso, costoProductos, fletesEntregados, costoDevoluciones, valorEntregado, gananciaBruta,
    gastoMeta: Number(gastoMeta) || 0, gastoTiktok: Number(gastoTiktok) || 0, publicidad, operativos, gananciaNeta,
    margenNeto: ingreso > 0 ? gananciaNeta / ingreso * 100 : 0,
    margenBruto: ingreso > 0 ? gananciaBruta / ingreso * 100 : 0,
    proyeccion: {
      rodando: rodando.length, referencia: p * 100,
      seEntregan: Math.round(rodando.length * p), seDevuelven: rodando.length - Math.round(rodando.length * p),
      gana: ganaRodando, pierde: pierdeRodando, netaFinal: gananciaNeta + ganaRodando - pierdeRodando
    },
    // Tres escenarios de lo que sigue rodando: se entrega todo · tu tasa real (entregados ÷ cerrados) · se devuelve todo
    escenarios: rodando.length ? {
      tasaCerrada, rodando: rodando.length, ventaRodando,
      optimista: escenario(1), actual: escenario(pActual), pesimista: escenario(0)
    } : null,
    desglose: { ingreso, producto: costoProductos, flete: fletesEntregados, otros, devoluciones: costoDevoluciones, publicidad, operativos, neta: gananciaNeta },
    fletes: {
      envios: fletes.length, promedio: prom(fletes), min: fletes[0] || 0, max: fletes[fletes.length - 1] || 0,
      mediana: fletes.length ? fletes[Math.floor(fletes.length / 2)] : 0,
      devolucionPromedio: prom(devoluciones.map(o => o.costoDevolucion).filter(x => x > 0))
    },
    porDia: Object.entries(porDia).sort(([a], [b]) => a.localeCompare(b)),
    cobro: { contraEntrega: cobro(true), prepagado: cobro(false) }
  };
}

// =============================================
// RENTABILIDAD POR PRODUCTO: venta, costos, pauta, utilidad, margen, ticket, CPA y ROAS
// pauta: lista de { fecha, clave, meta, tiktok } (lo del Control Diario)
// =============================================
export function rentabilidadProductos(lineas, { desde, hasta, grupos = [], pauta = [] } = {}) {
  const sel = lineas.filter(l => (!desde || l.fecha >= desde) && (!hasta || l.fecha <= hasta));
  const nombres = nombresProductos(sel, grupos);
  const m = new Map();
  const fila = (k, nombre) => {
    if (!m.has(k)) m.set(k, { clave: k, nombre, ordenes: new Set(), ent: new Set(), dev: new Set(), can: new Set(), rod: new Set(), venta: 0, producto: 0, flete: 0, otros: 0, devoluciones: 0, bruta: 0, pauta: 0 });
    return m.get(k);
  };
  for (const l of sel) {
    const g = grupoEstado(l);
    if (g === "reemplazada") continue;
    const k = claveProducto(l.productoId, grupos);
    const f = fila(k, nombres.get(k)?.nombre || l.producto);
    f.ordenes.add(l.ordenId);
    if (g === "entregado") {
      f.ent.add(l.ordenId);
      const gan = l.ganancia ?? (l.total - l.proveedor - l.flete);
      f.venta += l.total; f.producto += l.proveedor; f.flete += l.flete;
      f.otros += Math.max(0, l.total - l.proveedor - l.flete - gan);
      f.bruta += gan;
    } else if (g === "devolucion") { f.dev.add(l.ordenId); f.devoluciones += l.costoDevolucion; f.bruta -= l.costoDevolucion; }
    else if (g === "cancelado") f.can.add(l.ordenId);
    else if (g !== "pendiente") f.rod.add(l.ordenId);
  }
  for (const x of pauta || []) {
    if ((desde && x.fecha < desde) || (hasta && x.fecha > hasta) || !x.clave) continue;
    const g = (Number(x.meta) || 0) + (Number(x.tiktok) || 0);
    if (!g) continue;
    const f = m.get(x.clave) || fila(x.clave, nombres.get(x.clave)?.nombre || "Producto");
    f.pauta += g;
  }
  const calc = (f) => {
    const pedidos = f.ordenes.size, entregados = f.ent.size, neta = f.bruta - f.pauta;
    return {
      clave: f.clave, nombre: f.nombre, pedidos, entregados, devueltos: f.dev.size, cancelados: f.can.size, rodando: f.rod.size,
      venta: f.venta, producto: f.producto, flete: f.flete, otros: f.otros, devoluciones: f.devoluciones, pauta: f.pauta,
      bruta: f.bruta, neta,
      margen: f.venta > 0 ? neta / f.venta * 100 : null,
      ticket: entregados ? f.venta / entregados : null,
      cpa: f.pauta && pedidos ? f.pauta / pedidos : null,                 // lo que te cuesta cada pedido en pauta
      cpaReal: f.pauta && entregados ? f.pauta / entregados : null,       // lo que te cuesta cada pedido ENTREGADO
      roas: f.pauta ? f.venta / f.pauta : null                            // ventas entregadas por cada peso de pauta
    };
  };
  const filas = [...m.values()].map(calc).filter(r => r.pedidos || r.pauta).sort((a, b) => b.neta - a.neta);
  const t = filas.reduce((a, r) => {
    for (const k of ["pedidos", "entregados", "devueltos", "cancelados", "rodando", "venta", "producto", "flete", "otros", "devoluciones", "pauta", "bruta", "neta"]) a[k] = (a[k] || 0) + r[k];
    return a;
  }, {});
  const total = {
    ...t, nombre: "Total",
    margen: t.venta > 0 ? t.neta / t.venta * 100 : null, ticket: t.entregados ? t.venta / t.entregados : null,
    cpa: t.pauta && t.pedidos ? t.pauta / t.pedidos : null, cpaReal: t.pauta && t.entregados ? t.pauta / t.entregados : null,
    roas: t.pauta ? t.venta / t.pauta : null
  };
  return { filas, total };
}

// =============================================
// EDITAR UN REPORTE GUARDADO: cambiar la publicidad por producto y los costos operativos
// sin volver a leer los pedidos. datos = { r, op, rent, costos, pautaProd }.
// pautaProd: { clave: { meta, tiktok } } · otros: { meta, tiktok } (pauta que no es de un producto)
// costos: los del periodo; cada mes cuenta los mismos días que cuando se guardó (op.meses).
// =============================================
const rentDerivados = (f) => ({
  ...f, neta: f.bruta - f.pauta,
  margen: f.venta > 0 ? (f.bruta - f.pauta) / f.venta * 100 : null,
  ticket: f.entregados ? f.venta / f.entregados : null,
  cpa: f.pauta && f.pedidos ? f.pauta / f.pedidos : null,
  cpaReal: f.pauta && f.entregados ? f.pauta / f.entregados : null,
  roas: f.pauta ? f.venta / f.pauta : null
});
export function editarReporte(datos, { pautaProd = {}, otros = { meta: 0, tiktok: 0 }, costos = [], convertir = (v) => v } = {}) {
  const r = { ...datos.r };
  const n = (v) => Math.max(0, Number(v) || 0);
  // Publicidad
  let meta = n(otros.meta), tiktok = n(otros.tiktok);
  for (const v of Object.values(pautaProd)) { meta += n(v?.meta); tiktok += n(v?.tiktok); }
  // Costos operativos con los mismos días por mes del reporte
  const meses = (datos.op?.meses || []).map(m => {
    const delMes = costos.filter(c => c.mes === m.mes).reduce((a, c) => a + (Number(convertir(n(c.valor), c.moneda)) || 0), 0);
    return { ...m, delMes, cuenta: m.diasMes ? delMes * m.dias / m.diasMes : 0 };
  });
  const operativos = meses.reduce((a, m) => a + m.cuenta, 0);
  const delta = (meta + tiktok + operativos) - ((Number(r.publicidad) || 0) + (Number(r.operativos) || 0));

  Object.assign(r, { gastoMeta: meta, gastoTiktok: tiktok, publicidad: meta + tiktok, operativos, gananciaNeta: r.gananciaNeta - delta });
  r.margenNeto = r.ingreso > 0 ? r.gananciaNeta / r.ingreso * 100 : 0;
  if (r.desglose) r.desglose = { ...r.desglose, publicidad: meta + tiktok, operativos, neta: r.gananciaNeta };
  if (r.proyeccion) r.proyeccion = { ...r.proyeccion, netaFinal: r.proyeccion.netaFinal - delta };
  if (r.escenarios) {
    const e = { ...r.escenarios };
    for (const k of ["optimista", "actual", "pesimista"]) {
      const neta = e[k].neta - delta, venta = r.ingreso + e.ventaRodando * e[k].pct / 100;
      e[k] = { ...e[k], neta, margen: venta > 0 ? neta / venta * 100 : 0 };
    }
    r.escenarios = e;
  }
  // Rentabilidad por producto
  let rent = datos.rent || null;
  if (rent?.filas) {
    const filas = rent.filas.map(f => (pautaProd[f.clave] ? rentDerivados({ ...f, pauta: n(pautaProd[f.clave].meta) + n(pautaProd[f.clave].tiktok) }) : f)).sort((a, b) => b.neta - a.neta);
    const t = {};
    for (const f of filas) for (const k of ["pedidos", "entregados", "devueltos", "cancelados", "rodando", "venta", "producto", "flete", "otros", "devoluciones", "pauta", "bruta"]) t[k] = (t[k] || 0) + (Number(f[k]) || 0);
    rent = { filas, total: rentDerivados({ ...t, nombre: "Total" }) };
  }
  return { ...datos, r, rent, costos, pautaProd, otros: { meta: n(otros.meta), tiktok: n(otros.tiktok) }, op: { total: operativos, meses } };
}

// =============================================
// LOGÍSTICA
// =============================================
export function logistica(lineas, { desde, hasta, grupos = [], ahora = new Date(), metaEntrega = 70 } = {}) {
  const sel = lineas.filter(l => (!desde || l.fecha >= desde) && (!hasta || l.fecha <= hasta));
  const ordenes = porOrden(sel);
  const despachados = ordenes.filter(o => !["cancelado", "pendiente"].includes(o.grupo));
  const activos = ordenes.filter(o => o.grupo === "transito" || o.grupo === "novedad");
  const horas = (o) => {
    if (!o.fechaUltMov) return null;
    const t = new Date(`${o.fechaUltMov}T${o.horaUltMov || "00:00"}:00-05:00`);
    return (ahora - t) / 36e5;
  };
  const sinMovimiento = activos.filter(o => (horas(o) ?? 0) > 24);
  const novedadesActivas = ordenes.filter(o => novedadActiva(o, o.grupo));
  const cuentaPor = (arr, k) => Object.entries(arr.reduce((a, o) => { const v = o[k] || "Sin dato"; a[v] = (a[v] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);

  const estados = {};
  for (const g of Object.keys(NOMBRE_GRUPO)) estados[g] = 0;
  for (const o of ordenes) {
    if (novedadActiva(o, o.grupo)) estados.novedad++;
    else if (o.grupo === "novedad") estados.transito++;
    else estados[o.grupo] = (estados[o.grupo] || 0) + 1;
  }

  // Novedades registradas (todas las que tuvieron una, aunque ya cerraron)
  const conNovedad = ordenes.filter(o => o.novedad);
  const solucionadas = conNovedad.filter(o => o.novedadSolucionada);
  const dias = solucionadas.map(o => o.fechaNovedad && o.fechaSolucion ? (new Date(o.fechaSolucion) - new Date(o.fechaNovedad)) / 864e5 : null).filter(x => x !== null && x >= 0);

  const tabla = (k, filtro = null) => {
    const m = new Map();
    for (const o of despachados.concat(ordenes.filter(x => x.grupo === "cancelado"))) {
      if (filtro && !filtro(o)) continue;
      const v = o[k] || "Sin dato";
      if (!m.has(v)) m.set(v, { nombre: v, total: 0, despachados: 0, entregados: 0, transito: 0, novedades: 0, cancelados: 0, devoluciones: 0 });
      const r = m.get(v);
      r.total++;
      if (o.grupo === "cancelado") { r.cancelados++; continue; }
      r.despachados++;
      if (o.grupo === "entregado") r.entregados++;
      else if (o.grupo === "devolucion") r.devoluciones++;
      else if (novedadActiva(o, o.grupo)) r.novedades++;
      else r.transito++;
    }
    return [...m.values()].map(r => ({ ...r, tasa: r.despachados ? r.entregados / r.despachados * 100 : 0 })).sort((a, b) => b.total - a.total);
  };

  // Productos (con su ganancia)
  const nombres = nombresProductos(sel, grupos);
  const prods = new Map();
  for (const l of sel) {
    const g = grupoEstado(l);
    if (g === "reemplazada") continue;
    const k = claveProducto(l.productoId, grupos);
    if (!prods.has(k)) prods.set(k, { clave: k, nombre: nombres.get(k)?.nombre || l.producto, ordenes: new Set(), ent: new Set(), tra: new Set(), nov: new Set(), can: new Set(), dev: new Set(), conGuia: new Set(), bruta: 0 });
    const p = prods.get(k);
    p.ordenes.add(l.ordenId);
    if (g !== "cancelado" && g !== "pendiente") p.conGuia.add(l.ordenId);
    if (g === "entregado") { p.ent.add(l.ordenId); p.bruta += l.ganancia ?? (l.total - l.proveedor - l.flete); }
    else if (g === "devolucion") { p.dev.add(l.ordenId); p.bruta -= l.costoDevolucion; }
    else if (g === "cancelado") p.can.add(l.ordenId);
    else if (novedadActiva(l, g)) p.nov.add(l.ordenId);
    else if (g !== "pendiente") p.tra.add(l.ordenId);
  }
  const pct = (a, b) => (b ? a / b * 100 : 0);
  const productos = [...prods.values()].map(p => ({
    clave: p.clave, nombre: p.nombre, pedidos: p.ordenes.size,
    entrega: pct(p.ent.size, p.conGuia.size), transito: pct(p.tra.size, p.conGuia.size), novedad: pct(p.nov.size, p.conGuia.size),
    cancelado: pct(p.can.size, p.ordenes.size), devolucion: pct(p.dev.size, p.conGuia.size), gananciaBruta: p.bruta
  })).sort((a, b) => b.gananciaBruta - a.gananciaBruta);

  return {
    pedidos: ordenes.length, despachados: despachados.length, estados,
    tasaEntrega: pct(estados.entregado, despachados.length), metaEntrega,
    sinMovimiento: { total: sinMovimiento.length, porTransportadora: cuentaPor(sinMovimiento, "transportadora") },
    pendientes: estados.pendiente,
    novedadesActivas: { total: novedadesActivas.length, porTipo: cuentaPor(novedadesActivas, "novedad") },
    devolucionesPorTransportadora: tabla("transportadora").map(r => ({ nombre: r.nombre, pct: pct(r.devoluciones, r.despachados), devoluciones: r.devoluciones, despachados: r.despachados })).sort((a, b) => b.pct - a.pct),
    novedades: {
      total: conNovedad.length, solucionadas: solucionadas.length, noSolucionadas: conNovedad.length - solucionadas.length,
      diasResolucion: prom(dias),
      resultado: {
        entregadas: conNovedad.filter(o => o.grupo === "entregado").length,
        devueltas: conNovedad.filter(o => o.grupo === "devolucion").length,
        otras: conNovedad.filter(o => !["entregado", "devolucion"].includes(o.grupo)).length
      }
    },
    transportadoras: tabla("transportadora"),
    ciudades: tabla("ciudad"),
    // Ciudades de cada transportadora (para ver dónde entrega bien cada una)
    ciudadesPorTransportadora: Object.fromEntries(tabla("transportadora").map(t => [t.nombre, tabla("ciudad", o => (o.transportadora || "Sin dato") === t.nombre)])),
    // Mes a mes: tasa de entrega de cada transportadora (sobre pedidos ya cerrados: entregados ÷ entregados + devueltos)
    transportadorasMes: (() => {
      const meses = [...new Set(despachados.map(o => o.fecha.slice(0, 7)))].sort();
      const filas = tabla("transportadora").map(t => ({
        nombre: t.nombre,
        meses: meses.map(mes => {
          const os = despachados.filter(o => (o.transportadora || "Sin dato") === t.nombre && o.fecha.startsWith(mes));
          const ent = os.filter(o => o.grupo === "entregado").length, dev = os.filter(o => o.grupo === "devolucion").length;
          return { mes, despachados: os.length, entregados: ent, devueltos: dev, tasa: ent + dev ? ent / (ent + dev) * 100 : null };
        })
      }));
      return { meses, filas };
    })(),
    productos,
    seguimiento: activos.concat(ordenes.filter(o => o.grupo === "pendiente")).map(o => ({
      ordenId: o.ordenId, fecha: o.fecha, producto: o.lineas.map(l => l.producto).join(" + "), ciudad: o.ciudad,
      estatus: o.estatus, novedad: novedadActiva(o, o.grupo) ? o.novedad : "", guia: o.guia, transportadora: o.transportadora,
      ultimoMovimiento: o.ultimoMovimiento, fechaUltMov: o.fechaUltMov, horasSinMovimiento: horas(o),
      grupo: novedadActiva(o, o.grupo) ? "novedad" : o.grupo
    })).sort((a, b) => (b.horasSinMovimiento ?? 0) - (a.horasSinMovimiento ?? 0))
  };
}

// =============================================
// TESTEOS: cómo le va a un producto en un rango (pedidos de Dropi + pauta)
// =============================================
const normal = (s) => sinTildes(s).replace(/[^A-Z0-9]+/g, " ").trim();

/** Busca la clave (p:ID o g:grupo) de un producto de la Base en los pedidos de Dropi */
export function claveDeProducto(prod, lineas, grupos = []) {
  if (!prod) return null;
  const id = txt(prod.dropiId);
  if (id && lineas.some(l => String(l.productoId) === id)) return claveProducto(id, grupos);
  const n = normal(prod.nombre);
  if (n.length < 4) return id ? claveProducto(id, grupos) : null;
  const l = lineas.find(x => normal(x.producto) === n) || lineas.find(x => { const m = normal(x.producto); return m.includes(n) || n.includes(m); });
  return l ? claveProducto(l.productoId, grupos) : (id ? claveProducto(id, grupos) : null);
}

/** Métricas de un producto entre dos fechas */
export function metricasProducto(lineas, { clave, desde, hasta, pauta = {}, grupos = [], devPct = 25 }) {
  if (!clave) return null;
  const filas = controlDiario(lineas, { desde, hasta, grupos, pauta, devPct }).filter(f => f.clave === clave);
  const t = totalesControl(filas);
  const eq = t.efectivas > 0 ? filas.reduce((s, f) => s + f.equilibrio * f.efectivas, 0) / t.efectivas
    : (filas.filter(f => f.pedidos).length ? prom(filas.filter(f => f.pedidos).map(f => f.equilibrio)) : null);
  const sel = lineas.filter(l => claveProducto(l.productoId, grupos) === clave && (!desde || l.fecha >= desde) && (!hasta || l.fecha <= hasta));
  const ords = porOrden(sel);
  const desp = ords.filter(o => !["cancelado", "pendiente"].includes(o.grupo));
  const ent = ords.filter(o => o.grupo === "entregado").length;
  const dev = ords.filter(o => o.grupo === "devolucion").length;
  return {
    dias: new Set(filas.map(f => f.fecha)).size,
    pedidos: t.pedidos, efectivas: t.efectivas, gasto: t.gasto, cpa: t.cpa, equilibrio: eq, utilidad: t.utilidad, roi: t.roi,
    entregados: ent, devoluciones: dev, despachados: desp.length, tasaEntrega: desp.length ? ent / desp.length * 100 : null,
    cerrados: ent + dev
  };
}

/**
 * Sugerencia de resultado (no decide sola: tú confirmas)
 * equilibrioRef: CPA de equilibrio del costeo si no hay pedidos todavía
 */
export function sugerirResultado(m, equilibrioRef = null) {
  if (!m) return { resultado: null, motivo: "No encontramos pedidos de este producto en tus Excel de Dropi." };
  const eq = m.equilibrio || equilibrioRef;
  if (!m.gasto && !m.pedidos) return { resultado: null, motivo: "Sin pedidos ni pauta registrada todavía." };
  if (!m.gasto) return { resultado: null, motivo: "Tiene pedidos pero falta registrar la pauta en el Control Diario." };
  if (m.efectivas >= 3 && m.utilidad > 0) {
    return { resultado: "winner", motivo: `Gana: CPA ${m.cpa ? Math.round(m.cpa).toLocaleString("es-CO") : "—"} por debajo del equilibrio${eq ? ` (${Math.round(eq).toLocaleString("es-CO")})` : ""} con ${m.pedidos} pedidos.` };
  }
  if (eq && m.gasto >= 2 * eq && m.utilidad < 0) {
    return { resultado: "perdedor", motivo: `Gastó ${(m.gasto / eq).toFixed(1)} veces el CPA de equilibrio y va perdiendo.` };
  }
  if (eq) {
    const falta = Math.max(0, 2 * eq - m.gasto);
    return { resultado: "testeando", motivo: m.utilidad >= 0 ? `Va bien, pero aún son pocos pedidos para decidir.` : `Aún no hay suficiente gasto para decidir${falta ? `: dale hasta ${Math.round(falta).toLocaleString("es-CO")} más` : ""}.` };
  }
  return { resultado: "inconcluso", motivo: "Sin costeo ni pedidos para saber su CPA de equilibrio. Cuéstalo en la calculadora." };
}

// =============================================
// DECISIÓN DEL TESTEO: ESCALAR · AGUANTAR · APAGAR
// Compara lo que te cuesta cada pedido entregado (CPA real = pauta ÷ entregas estimadas)
// con lo máximo que puedes pagar sin perder (CPA máximo):
//   · con pedidos: el equilibrio real de Dropi (precio − proveedor − flete con devoluciones)
//   · sin pedidos todavía: el del costeo, sumando lo que dejan los complementos
// Reglas (no decide sola: tú confirmas con "Aplicar"):
//   APAGAR  → gastó 1 CPA máximo sin una venta, o 2 CPA máximos y va perdiendo
//   ESCALAR → 3+ entregas estimadas y CPA ≤ 70% del máximo (y los últimos 3 días no se dañaron)
//   AGUANTAR→ todo lo demás: te dice cuánto más gastar antes de decidir y qué probar
// =============================================
export const ACCIONES_TESTEO = {
  escalar: { nombre: "ESCALAR", resultado: "winner" },
  aguantar: { nombre: "AGUANTAR", resultado: "testeando" },
  apagar: { nombre: "APAGAR", resultado: "perdedor" },
  falta: { nombre: "FALTAN DATOS", resultado: null }
};

export function decidirTesteo(m, { cpaMaximoRef = null, ultimos = null, fmt = (v) => Math.round(v).toLocaleString("es-CO") } = {}) {
  const r = (accion, motivo, pasos = [], extra = {}) => ({ accion, resultado: ACCIONES_TESTEO[accion].resultado, nombre: ACCIONES_TESTEO[accion].nombre, motivo, pasos, ...extra });
  if (!m || (!m.gasto && !m.pedidos)) return r("falta", "Sin pedidos ni pauta todavía.", ["Revisa la pauta de Meta en el Control Diario («Actualizar Pauta») o escríbela a mano."]);
  if (!m.gasto) return r("falta", "Tiene pedidos pero no tiene pauta registrada.", ["Abre el Control Diario y pulsa «Actualizar Pauta» para traer el gasto de Meta."]);

  const max = m.efectivas > 0 && m.equilibrio ? m.equilibrio : (cpaMaximoRef || m.equilibrio || null);
  if (!max || max <= 0) return r("falta", "No sé tu CPA máximo: cuesta el producto en la Calculadora.", ["Abre la Calculadora, pon el costo del proveedor y guarda el costeo."]);

  const veces = m.gasto / max;
  const cpa = m.cpa;
  const ratio = cpa !== null && cpa !== undefined ? cpa / max : null;
  const entregaMala = m.cerrados >= 10 && m.tasaEntrega !== null && m.tasaEntrega < 60;
  const ultimosMal = ultimos && ultimos.gasto > 0 && (ultimos.cpa === null ? ultimos.gasto >= max : ultimos.cpa > max);
  const datos = { cpaMaximo: max, veces, ratio, entregaMala, ultimosMal };
  const avisoEntrega = entregaMala ? `Ojo: solo se entrega el ${Math.round(m.tasaEntrega)}% de lo despachado; confirma mejor los pedidos y revisa transportadora y ciudades.` : null;

  // APAGAR
  if (!m.pedidos && veces >= 1) return r("apagar", `Gastó ${fmt(m.gasto)} (${veces.toFixed(1)} veces tu CPA máximo de ${fmt(max)}) y no tiene ni un pedido.`,
    ["Apaga las campañas de este producto.", "Si crees en el producto, prueba UN cambio grande antes de volver: otro ángulo (la causa real), otro avatar u otro precio."], datos);
  if (veces >= 2 && m.utilidad < 0) return r("apagar", `Gastó ${veces.toFixed(1)} veces su CPA máximo y va perdiendo ${fmt(-m.utilidad)}. Cada pedido entregado te cuesta ${cpa ? fmt(cpa) : "—"} y lo máximo es ${fmt(max)}.`,
    ["Apaga las campañas.", "Antes de descartarlo: ¿la landing repite las palabras del anuncio? ¿Probaste la oferta con complementos? Si no, eso es lo único que vale la pena probar.", avisoEntrega].filter(Boolean), datos);

  // ESCALAR
  if (m.efectivas >= 3 && ratio !== null && ratio <= 0.7 && m.utilidad > 0) {
    if (ultimosMal) return r("aguantar", `Venía muy bien (CPA ${fmt(cpa)}, máximo ${fmt(max)}), pero los últimos 3 días se dañó (CPA ${ultimos.cpa ? fmt(ultimos.cpa) : "sin entregas"}).`,
      ["No escales todavía: mantén el presupuesto 2 o 3 días.", "Mira si se cansó el creativo (frecuencia alta) y sube uno nuevo con otro gancho.", avisoEntrega].filter(Boolean), datos);
    return r("escalar", `Gana: cada pedido entregado te cuesta ${fmt(cpa)} y puedes pagar hasta ${fmt(max)} (usa el ${Math.round(ratio * 100)}% de tu máximo). Lleva ${m.pedidos} pedidos y ${fmt(m.utilidad)} de utilidad.`,
      ["Sube el presupuesto de 20% a 30% cada 2 o 3 días mientras el CPA se mantenga por debajo de " + fmt(max * 0.8) + ".", "Duplica el conjunto o campaña que mejor va y prueba el otro avatar.", "Activa los complementos y la oferta post-compra para subir lo que te deja cada cliente.", avisoEntrega].filter(Boolean), datos);
  }

  // AGUANTAR
  const tope = m.pedidos ? 2 : 1;   // sin ventas se decide con 1 CPA máximo; con ventas, con 2
  const falta = Math.max(0, tope * max - m.gasto);
  if (ratio !== null && ratio <= 1 && m.utilidad >= 0) return r("aguantar", `Rentable pero justo: CPA ${fmt(cpa)} de un máximo de ${fmt(max)} (${Math.round(ratio * 100)}%).${m.efectivas < 3 ? " Aún son pocas entregas para escalar." : ""}`,
    ["Mantén el presupuesto, no lo subas todavía.", "Prueba 2 creativos nuevos con el gancho de la causa real para bajar el CPA.", "Sube el ticket con complementos: así tu CPA máximo crece.", avisoEntrega].filter(Boolean), datos);
  return r("aguantar", `Todavía no hay datos suficientes: gastó ${fmt(m.gasto)} (${veces.toFixed(1)} de ${tope} CPA máximo${tope > 1 ? "s" : ""}${m.pedidos ? "" : " sin ventas"})${cpa ? ` y cada entrega le cuesta ${fmt(cpa)} (máximo ${fmt(max)})` : ""}.`,
    [falta > 0 ? `Dale hasta ${fmt(falta)} más de pauta antes de decidir.` : "Decide hoy con lo que ves.", "Si mañana sigue por encima del máximo, cambia el creativo o el avatar antes de seguir gastando.", avisoEntrega].filter(Boolean), { ...datos, falta });
}

// =============================================
// META → PRODUCTO: qué producto es cada campaña, por su nombre
// "TRAPEADOR CO 23/10" → el producto de Dropi "TRAPEADOR PULVERIZADOR SPRAY 360"
// Cuenta las palabras del producto (de 4+ letras, sin las de relleno) que aparecen en la campaña.
// Si dos productos empatan arriba, no adivina (la eliges tú).
// =============================================
const RELLENO = new Set(("para con los las del una uno unos unas por que sin mas muy tipo kit set pack combo unidad unidades und uds " +
  "color colores negro blanco azul rojo rosado gris verde mujer hombre nino nina ninos unisex premium original nuevo nueva " +
  "producto productos promo oferta gratis envio talla tallas grande pequeno mediano mini super pro max plus").split(" "));
export const normalizarNombre = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const palabrasClave = (s) => [...new Set(normalizarNombre(s).split(" ").filter(w => w.length >= 4 && !RELLENO.has(w) && !/^\d+$/.test(w)))];

export function emparejarCampana(nombreCampana, productos) {
  const enCampana = normalizarNombre(nombreCampana).split(" ").filter(Boolean);
  const tiene = (w) => enCampana.some(c => c === w || (w.length >= 5 && c.length >= 5 && (c.startsWith(w.slice(0, 5)) && w.startsWith(c.slice(0, 5)))));
  let mejor = null, empate = false;
  for (const p of productos || []) {
    const claves = palabrasClave(p.nombre);
    if (!claves.length) continue;
    const aciertos = claves.filter(tiene).length;
    if (!aciertos) continue;
    const puntos = aciertos * 10 + (aciertos === claves.length ? 5 : 0);   // más palabras gana; empate = no adivina
    if (!mejor || puntos > mejor.puntos) { mejor = { clave: p.clave, puntos }; empate = false; }
    else if (puntos === mejor.puntos && p.clave !== mejor.clave) empate = true;
  }
  return mejor && !empate ? mejor.clave : null;
}
