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
export function reporteFinanciero(lineas, { desde, hasta, clave = "", grupos = [], gastoMeta = 0, gastoTiktok = 0, referenciaEntrega = 70 } = {}) {
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
  const gananciaNeta = gananciaBruta - publicidad;

  // Proyección: si de los que siguen rodando se entrega el X%
  const rodando = [...transito, ...novedades];
  const p = Math.min(100, Math.max(0, Number(referenciaEntrega) || 0)) / 100;
  const ganaRodando = rodando.reduce((a, o) => a + (o.total - o.proveedor - o.flete), 0) * p;
  const pierdeRodando = rodando.reduce((a, o) => a + o.flete, 0) * (1 - p);

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
    gastoMeta: Number(gastoMeta) || 0, gastoTiktok: Number(gastoTiktok) || 0, publicidad, gananciaNeta,
    margenNeto: ingreso > 0 ? gananciaNeta / ingreso * 100 : 0,
    proyeccion: {
      rodando: rodando.length, referencia: p * 100,
      seEntregan: Math.round(rodando.length * p), seDevuelven: rodando.length - Math.round(rodando.length * p),
      gana: ganaRodando, pierde: pierdeRodando, netaFinal: gananciaNeta + ganaRodando - pierdeRodando
    },
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

  const tabla = (k) => {
    const m = new Map();
    for (const o of despachados.concat(ordenes.filter(x => x.grupo === "cancelado"))) {
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
    productos,
    seguimiento: activos.concat(ordenes.filter(o => o.grupo === "pendiente")).map(o => ({
      ordenId: o.ordenId, fecha: o.fecha, producto: o.lineas.map(l => l.producto).join(" + "), ciudad: o.ciudad,
      estatus: o.estatus, novedad: novedadActiva(o, o.grupo) ? o.novedad : "", guia: o.guia, transportadora: o.transportadora,
      ultimoMovimiento: o.ultimoMovimiento, fechaUltMov: o.fechaUltMov, horasSinMovimiento: horas(o),
      grupo: novedadActiva(o, o.grupo) ? "novedad" : o.grupo
    })).sort((a, b) => (b.horasSinMovimiento ?? 0) - (a.horasSinMovimiento ?? 0))
  };
}
