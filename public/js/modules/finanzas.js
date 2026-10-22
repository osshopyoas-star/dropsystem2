// =============================================
// 💰 FINANZAS — Control Diario, Reporte Financiero y Logística
// Datos: Excel de Dropi (luego API) + pauta por día (a mano; luego Meta)
// Cálculos en core/finanzas.js
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { formatear } from "../core/costeo.js";
import { leerExcel } from "../core/excel.js";
import {
  leerReporteDropi, controlDiario, totalesControl, reporteFinanciero, logistica,
  nombresProductos, claveProducto, NOMBRE_GRUPO
} from "../core/finanzas.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");
const iconos = () => { if (window.lucide) lucide.createIcons(); };
const PAIS_NOMBRE = { CO: "Colombia", EC: "Ecuador" };

// ---------- Estado ----------
const st = {
  pais: (() => { try { return localStorage.getItem("fz_pais") || "CO"; } catch { return "CO"; } })(),
  lineas: [], config: null, pauta: {}, cargadoPais: null,
  dia: null,
  rango: { modo: "7d", desde: "", hasta: "", clave: "", porProducto: false },
  rep: { periodo: "todo", desde: "", hasta: "", clave: "", referencia: 70 },
  log: { periodo: "todo", desde: "", hasta: "", filtro: "activos", buscar: "", pagina: 1, porPagina: 25, ciudadesN: 5, ciudadesPag: 1, ciudadOrden: "total", priorizar: true, prodBuscar: "" },
  pagina: null
};

async function api(metodo, url, body) {
  const res = await fetch(url, {
    method: metodo,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

function avisar(texto, tipo = "ok") {
  let el = $("estToast");
  if (!el) { el = document.createElement("div"); el.id = "estToast"; document.body.appendChild(el); }
  el.textContent = texto;
  el.className = `est-toast show ${tipo}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), tipo === "error" ? 5000 : 1600);
}

// ---------- Formatos ----------
const $$ = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? "—" : formatear(Number(v), st.pais));
const $$s = (v) => (Number(v) < 0 ? "-" + $$(-v) : $$(v));
const pct = (v, d = 1) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? "—" : `${Number(v).toFixed(d)}%`);
const n1 = (v) => (Number(v) || 0).toLocaleString("es-CO", { maximumFractionDigits: 1 });
const fechaCorta = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
const hoyISO = () => new Date(Date.now() - 5 * 36e5).toISOString().slice(0, 10);
const sumarDias = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const nombreDia = (iso) => {
  const hoy = hoyISO();
  if (iso === hoy) return "Hoy";
  if (iso === sumarDias(hoy, -1)) return "Ayer";
  return new Date(iso + "T12:00:00Z").toLocaleDateString("es-CO", { weekday: "long", timeZone: "UTC" }).replace(/^\w/, c => c.toUpperCase());
};
const hace = (fecha) => {
  if (!fecha) return "";
  const m = Math.round((Date.now() - new Date(fecha)) / 6e4);
  if (m < 1) return "hace un momento";
  if (m < 60) return `hace ${m} min`;
  if (m < 1440) return `hace ${Math.round(m / 60)} h`;
  return `hace ${Math.round(m / 1440)} días`;
};

// ---------- Carga de datos ----------
async function cargar(forzar = false) {
  if (!forzar && st.cargadoPais === st.pais && st.config) return;
  const [config, lineas, pauta] = await Promise.all([
    api("GET", `/api/finanzas/config?pais=${st.pais}`),
    api("GET", `/api/finanzas/lineas?pais=${st.pais}`),
    api("GET", `/api/finanzas/pauta?pais=${st.pais}`)
  ]);
  st.config = config;
  st.lineas = lineas;
  st.pauta = Object.fromEntries(pauta.map(p => [`${p.fecha}|${p.clave}`, p]));
  st.cargadoPais = st.pais;
  if (!st.dia || !config.dias.includes(st.dia)) {
    const ayer = sumarDias(hoyISO(), -1);
    st.dia = config.dias.includes(ayer) ? ayer : (config.hasta || ayer);
  }
}

const grupos = () => st.config?.grupos || [];
const productos = () => [...nombresProductos(st.lineas, grupos()).values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
const nombreDe = (clave) => productos().find(p => p.clave === clave)?.nombre || "Producto";

// Suma de pauta de un rango (y producto)
function gastoRango(desde, hasta, clave = "") {
  let meta = 0, tiktok = 0;
  for (const p of Object.values(st.pauta)) {
    if ((desde && p.fecha < desde) || (hasta && p.fecha > hasta)) continue;
    if (clave && p.clave !== clave) continue;
    meta += Number(p.meta) || 0; tiktok += Number(p.tiktok) || 0;
  }
  return { meta, tiktok };
}

// ---------- Cabecera común: país y Excel ----------
function cabecera(titulo, desc, icono) {
  const c = st.config || {};
  return `
  <header class="fz-head">
    <div>
      <h1><i data-lucide="${icono}"></i> ${titulo}</h1>
      <p>${desc}</p>
    </div>
  </header>
  <section class="fz-card fz-origen">
    <div class="fz-origen-fila">
      <label>País / cuenta Dropi
        <select onchange="fzPais(this.value)">
          <option value="CO" ${st.pais === "CO" ? "selected" : ""}>🇨🇴 Colombia${st.pais === "CO" && c.cuenta ? ` · ${esc(c.cuenta)}` : ""}</option>
          <option value="EC" ${st.pais === "EC" ? "selected" : ""}>🇪🇨 Ecuador${st.pais === "EC" && c.cuenta ? ` · ${esc(c.cuenta)}` : ""}</option>
        </select>
      </label>
      <div class="fz-origen-info">
        ${c.desde
          ? `<span class="fz-ok">● ${st.lineas.length ? new Set(st.lineas.map(l => l.ordenId)).size : 0} pedidos del ${fechaCorta(c.desde)} al ${fechaCorta(c.hasta)}</span><small>Última carga ${hace(c.ultimaImportacion)}</small>`
          : `<span class="fz-vacio-txt">Aún no hay pedidos de ${PAIS_NOMBRE[st.pais]}. Sube el Excel de Dropi.</span>`}
      </div>
      <label class="fz-btn ${c.desde ? "claro" : ""}">
        <i data-lucide="upload"></i> ${c.desde ? "Actualizar con Excel" : "Subir Excel de Dropi"}
        <input type="file" accept=".xlsx" hidden onchange="fzSubirExcel(this)">
      </label>
    </div>
    <details class="fz-ayuda">
      <summary>¿Qué Excel subo?</summary>
      <p>En Dropi → <b>Mis pedidos</b> → descarga el reporte <b>"órdenes con productos"</b> del rango que quieras (por ejemplo el mes). Puedes subirlo las veces que quieras: los pedidos se <b>actualizan</b> (cambian de estado), no se duplican.
      Los datos de tus clientes (nombre, teléfono, documento, dirección) <b>no se suben</b>: el Excel se lee aquí en tu navegador y solo se envían las columnas de pedidos.
      Cuando Dropi active la integración CoDropX, esto se llenará solo.</p>
    </details>
  </section>`;
}

window.fzPais = async (p) => {
  st.pais = p === "EC" ? "EC" : "CO";
  try { localStorage.setItem("fz_pais", st.pais); } catch {}
  st.dia = null;
  await refrescar(true);
};

window.fzSubirExcel = async (input) => {
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!/\.xlsx$/i.test(file.name)) return avisar("Sube el archivo .xlsx que descargas de Dropi", "error");
  avisar("Leyendo el Excel...");
  try {
    const filas = await leerExcel(await file.arrayBuffer());
    const { lineas, conProductos, ordenes } = leerReporteDropi(filas);
    if (!lineas.length) throw new Error("No encontramos pedidos en el Excel");
    if (!conProductos && !confirm("Este Excel no trae el nombre del producto. Para el Control Diario necesitas el reporte \"órdenes con productos\". ¿Subirlo igual?")) return;
    const r = await api("POST", "/api/finanzas/importar", { pais: st.pais, cuenta: st.config?.cuenta || `${PAIS_NOMBRE[st.pais]} Dropi`, lineas });
    avisar(`${ordenes} pedidos cargados (${r.nuevas} nuevos, ${r.actualizadas} actualizados) ✓`);
    st.dia = null;
    await refrescar(true);
  } catch (err) {
    avisar(err.message, "error");
  }
};

async function refrescar(forzar = false) {
  const view = $("view");
  if (!view || !st.pagina) return;
  try {
    await cargar(forzar);
    PAGINAS[st.pagina](view);
  } catch (err) {
    view.innerHTML = `<div class="fz-page"><p class="est-error">${esc(err.message)}</p></div>`;
  }
}

const vacio = () => `<section class="fz-card fz-vacio">
  <i data-lucide="file-spreadsheet"></i>
  <h3>Sube tu primer Excel de Dropi</h3>
  <p>Con el reporte de "órdenes con productos" armamos tu control diario, tu reporte financiero y tu logística.</p>
</section>`;

// =============================================
// CONTROL DIARIO
// =============================================
function filasDelDia() {
  return controlDiario(st.lineas, { desde: st.dia, hasta: st.dia, grupos: grupos(), pauta: st.pauta, devPct: st.config?.devPct ?? 25 });
}

function cancelacion30() {
  const hasta = st.config?.hasta; if (!hasta) return null;
  const desde = sumarDias(hasta, -29);
  const t = totalesControl(controlDiario(st.lineas, { desde, hasta, grupos: grupos(), devPct: 0 }));
  return t.pedidos ? t.pctCanc : null;
}

function renderControl(view) {
  const c = st.config;
  const filas = c?.desde ? filasDelDia() : [];
  const t = totalesControl(filas);
  const canc = cancelacion30();

  view.innerHTML = `
  <div class="fz-page">
    ${cabecera("Control Diario", "Tu <b>utilidad real diaria</b> por producto: cruza tus pedidos, cancelaciones y devoluciones de Dropi con lo que gastaste en pauta.", "calendar-check")}
    ${!c?.desde ? vacio() : `
    <section class="fz-card fz-dia">
      <small>ELIGE EL DÍA</small>
      <div class="fz-dia-nav">
        <button class="fz-flecha" onclick="fzDia(-1)" title="Día anterior con datos"><i data-lucide="chevron-left"></i></button>
        <label class="fz-dia-caja">
          <b>${nombreDia(st.dia)}</b><span>${fechaCorta(st.dia)}</span>
          <input type="date" value="${st.dia}" min="${c.desde}" max="${hoyISO()}" onchange="fzIrDia(this.value)">
        </label>
        <button class="fz-flecha" onclick="fzDia(1)" title="Día siguiente con datos"><i data-lucide="chevron-right"></i></button>
      </div>
      <p class="fz-mini">${c.dias.includes(st.dia) ? `Pedidos de este día traídos del Excel de Dropi.` : `Este día no tiene pedidos en tus Excel.`} La pauta la escribes en la lista (cuando Meta esté conectado, se trae sola).</p>
    </section>

    <div class="fz-acciones">
      <h2>${nombreDia(st.dia)} <span>${fechaCorta(st.dia)}</span></h2>
      <div>
        <button class="fz-btn claro" onclick="fzAbrirGrupos()"><i data-lucide="combine"></i> Agrupar productos ${grupos().length ? `<em>${grupos().length}</em>` : ""}</button>
        <button class="fz-btn claro" onclick="fzExportarDia()"><i data-lucide="download"></i> Exportar</button>
      </div>
    </div>

    <section class="fz-card fz-tienda">
      <b>TU TIENDA</b>
      <span>Cancelaciones <strong>${canc === null ? "—" : pct(canc)}</strong> <small>últimos 30 días</small></span>
      <span>Devoluciones <strong>${pct(c.devPct, 0)}</strong> <small>se usa en los productos sin % propio</small></span>
      <button class="fz-btn claro chico" onclick="fzEditarDev()"><i data-lucide="pencil"></i> Editar</button>
    </section>

    <section class="fz-card">
      <div class="fz-card-head"><h3><i data-lucide="shopping-bag"></i> Productos que vendiste el ${fechaCorta(st.dia)}</h3><small>edita aquí y la tabla de abajo se llena sola</small></div>
      <div class="fz-scroll">
        <table class="fz-tabla fz-edit">
          <thead><tr><th>Producto</th><th>Tipo</th><th class="n">Pedidos</th><th class="n">Uds</th><th class="n">% Dev</th><th class="n">Meta</th><th class="n">TikTok</th><th></th></tr></thead>
          <tbody>
            ${filas.map((f, i) => `
              <tr>
                <td><b>${esc(f.nombre)}</b>${f.fallido ? ` <span class="fz-tag rojo">sin ventas</span>` : ""}</td>
                <td><select class="fz-tipo ${f.tipo}" onchange="fzPauta(${i}, 'tipo', this.value)"><option value="testeo" ${f.tipo === "testeo" ? "selected" : ""}>TESTEO</option><option value="escala" ${f.tipo === "escala" ? "selected" : ""}>ESCALA</option></select></td>
                <td class="n">${f.pedidos}</td>
                <td class="n">${f.uds}</td>
                <td class="n"><span class="fz-input"><input type="number" min="0" max="95" step="0.5" value="${f.devPct}" onchange="fzPauta(${i}, 'devPct', this.value)">%</span></td>
                <td class="n"><span class="fz-input">$<input type="number" min="0" step="any" value="${f.meta || ""}" placeholder="0" onchange="fzPauta(${i}, 'meta', this.value)"></span></td>
                <td class="n"><span class="fz-input">$<input type="number" min="0" step="any" value="${f.tiktok || ""}" placeholder="0" onchange="fzPauta(${i}, 'tiktok', this.value)"></span></td>
                <td>${f.fallido ? `<button class="fz-icono peligro" title="Quitar" onclick="fzQuitarFallido(${i})"><i data-lucide="trash-2"></i></button>` : ""}</td>
              </tr>`).join("") || `<tr><td colspan="8" class="fz-sin">Sin pedidos este día.</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="fz-fallido">
        <select id="fzFallido"><option value="">+ Agregar testeo fallido (gastó pauta y no vendió)…</option>${productos().map(p => `<option value="${esc(p.clave)}">${esc(p.nombre)}</option>`).join("")}</select>
        <button class="fz-btn claro chico" onclick="fzAgregarFallido()">Agregar</button>
      </div>
    </section>

    ${filas.length ? `
    <section class="fz-utilidad ${t.utilidad < 0 ? "pierde" : ""}">
      <span><i data-lucide="wallet"></i> UTILIDAD DEL DÍA · ${nombreDia(st.dia).toUpperCase()} · ${fechaCorta(st.dia)}</span>
      <b>${$$s(t.utilidad)}</b>
    </section>
    <section class="fz-card sinpad">${tablaControl(filas, t, false)}</section>` : ""}

    ${rangoHTML()}
  `}
  </div>`;
  iconos();
}

function tablaControl(filas, t, conFecha) {
  return `<div class="fz-scroll"><table class="fz-tabla">
    <thead><tr>
      ${conFecha ? `<th>Fecha</th>` : ""}<th>Producto</th><th>Tipo</th><th class="n">Pedidos</th><th class="n">S/confirmar</th><th class="n">Uds</th><th class="n">Cancelados</th><th class="n">%Canc</th><th class="n">%Dev</th><th class="n">Efectivas</th>
      <th class="n">Precio</th><th class="n">Proveedor</th><th class="n">Flete base</th><th class="n">Flete c/dev</th><th class="n">Meta</th><th class="n">TikTok</th><th class="n">Gasto</th><th class="n">CPA</th>
      <th class="n" title="Lo máximo que puedes pagar de publicidad por pedido entregado sin perder">CPA equilibrio</th><th class="n">Util x prod</th><th class="n">Utilidad</th><th class="n">ROI</th>
    </tr></thead>
    <tbody>
      ${filas.map(f => `<tr>
        ${conFecha ? `<td>${/^\d{4}-/.test(f.fecha) ? fechaCorta(f.fecha) : esc(f.fecha)}</td>` : ""}<td><b>${esc(f.nombre)}</b></td><td><span class="fz-tag ${f.tipo}">${f.tipo.toUpperCase()}</span></td>
        <td class="n">${f.pedidos}</td><td class="n">${f.sinConfirmar || "—"}</td><td class="n">${f.uds}</td><td class="n">${f.cancelados}</td><td class="n">${pct(f.pctCanc)}</td><td class="n">${pct(f.devPct)}</td><td class="n">${n1(f.efectivas)}</td>
        <td class="n">${f.pedidos ? $$(f.precio) : "—"}</td><td class="n gris">${f.pedidos ? $$(f.proveedor) : "—"}</td><td class="n gris">${f.pedidos ? $$(f.fleteBase) : "—"}</td><td class="n">${f.pedidos ? $$(f.fleteDev) : "—"}</td>
        <td class="n">${$$(f.meta)}</td><td class="n">${$$(f.tiktok)}</td><td class="n">${$$(f.gasto)}</td><td class="n">${f.cpa === null ? "—" : $$(f.cpa)}</td>
        <td class="n"><b>${f.pedidos ? $$s(f.equilibrio) : "—"}</b></td><td class="n ${f.utilProd < 0 ? "rojo" : "verde"}">${f.pedidos ? $$s(f.utilProd) : "—"}</td>
        <td class="n"><span class="fz-pill ${f.utilidad < 0 ? "rojo" : "verde"}">${$$s(f.utilidad)}</span></td><td class="n">${f.roi === null ? "—" : pct(f.roi * 100, 0)}</td>
      </tr>`).join("")}
    </tbody>
    <tfoot><tr>
      ${conFecha ? `<td></td>` : ""}<td>TOTAL</td><td></td><td class="n">${t.pedidos}</td><td></td><td class="n">${t.uds}</td><td class="n">${t.cancelados}</td><td class="n">${pct(t.pctCanc)}</td><td></td><td class="n">${n1(t.efectivas)}</td>
      <td></td><td></td><td></td><td></td><td class="n">${$$(t.meta)}</td><td class="n">${$$(t.tiktok)}</td><td class="n">${$$(t.gasto)}</td><td class="n">${t.cpa === null ? "—" : $$(t.cpa)}</td><td></td><td></td>
      <td class="n"><span class="fz-pill ${t.utilidad < 0 ? "rojo" : "verde"}">${$$s(t.utilidad)}</span></td><td class="n">${t.roi === null ? "—" : pct(t.roi * 100, 0)}</td>
    </tr></tfoot>
  </table></div>`;
}

// ---------- Vista por rango ----------
function rangoFechas() {
  const r = st.rango, hasta = st.config?.hasta || hoyISO();
  const hoy = hoyISO();
  if (r.modo === "7d") return [sumarDias(hoy, -6), hoy];
  if (r.modo === "mes") return [hoy.slice(0, 8) + "01", hoy];
  if (r.modo === "mesPasado") { const ini = sumarDias(hoy.slice(0, 8) + "01", -1).slice(0, 8) + "01"; return [ini, sumarDias(hoy.slice(0, 8) + "01", -1)]; }
  return [r.desde || st.config?.desde || hasta, r.hasta || hasta];
}

function rangoHTML() {
  const r = st.rango;
  const [desde, hasta] = rangoFechas();
  let filas = controlDiario(st.lineas, { desde, hasta, grupos: grupos(), pauta: st.pauta, devPct: st.config?.devPct ?? 25 });
  if (r.clave) filas = filas.filter(f => f.clave === r.clave);
  const dias = new Set(filas.map(f => f.fecha)).size;
  if (r.porProducto) {
    const m = new Map();
    for (const f of filas) {
      if (!m.has(f.clave)) m.set(f.clave, { ...f, fecha: `${fechaCorta(desde)}–${fechaCorta(hasta)}`, _n: 0, pedidos: 0, cancelados: 0, uds: 0, sinConfirmar: 0, efectivas: 0, meta: 0, tiktok: 0, gasto: 0, utilidad: 0, _precio: 0, _prov: 0, _flete: 0, _fleteDev: 0, _eq: 0 });
      const a = m.get(f.clave);
      a.pedidos += f.pedidos; a.cancelados += f.cancelados; a.uds += f.uds; a.sinConfirmar += f.sinConfirmar; a.efectivas += f.efectivas;
      a.meta += f.meta; a.tiktok += f.tiktok; a.gasto += f.gasto; a.utilidad += f.utilidad;
      a._precio += f.precio * f.pedidos; a._prov += f.proveedor * f.pedidos; a._flete += f.fleteBase * f.pedidos; a._fleteDev += f.fleteDev * f.pedidos; a._eq += f.equilibrio * f.pedidos;
    }
    filas = [...m.values()].map(a => {
      const d = a.pedidos || 1;
      const cpa = a.efectivas > 0 ? a.gasto / a.efectivas : null;
      return { ...a, precio: a._precio / d, proveedor: a._prov / d, fleteBase: a._flete / d, fleteDev: a._fleteDev / d, equilibrio: a._eq / d, cpa,
        utilProd: a.efectivas > 0 ? a.utilidad / a.efectivas : a._eq / d, pctCanc: a.pedidos ? a.cancelados / a.pedidos * 100 : 0,
        devPct: a.pedidos ? (1 - a.efectivas / Math.max(1e-9, a.pedidos - a.cancelados)) * 100 : a.devPct, roi: a.gasto > 0 ? a.utilidad / a.gasto : null };
    }).sort((x, y) => y.utilidad - x.utilidad);
  }
  const t = totalesControl(filas);
  const ventas = filas.reduce((s, f) => s + f.efectivas * (f.precio || 0), 0);
  const costoProd = filas.reduce((s, f) => s + f.efectivas * (f.proveedor || 0), 0);
  const fletes = filas.reduce((s, f) => s + f.efectivas * (f.fleteDev || 0), 0);
  const eqProm = t.efectivas ? filas.reduce((s, f) => s + f.efectivas * (f.equilibrio || 0), 0) / t.efectivas : 0;

  return `
  <section class="fz-card">
    <div class="fz-card-head"><h3><i data-lucide="calendar-range"></i> Vista por rango</h3><small>varios días juntos, como la hoja del control diario · solo para mirar</small></div>
    <div class="fz-chips">
      ${[["7d", "Últimos 7 días"], ["mes", "Este mes"], ["mesPasado", "Mes pasado"], ["rango", "Rango"]].map(([k, tx]) => `<button class="fz-chip ${r.modo === k ? "activo" : ""}" onclick="fzRango('${k}')">${tx}</button>`).join("")}
      ${r.modo === "rango" ? `<input type="date" value="${desde}" onchange="fzRangoFecha('desde', this.value)"> a <input type="date" value="${hasta}" onchange="fzRangoFecha('hasta', this.value)">` : ""}
      <select onchange="fzRangoProducto(this.value)"><option value="">Todos los productos</option>${productos().map(p => `<option value="${esc(p.clave)}" ${r.clave === p.clave ? "selected" : ""}>${esc(p.nombre)}</option>`).join("")}</select>
      <label class="fz-check"><input type="checkbox" ${r.porProducto ? "checked" : ""} onchange="fzRangoTotal(this.checked)"> Total por producto</label>
      <button class="fz-btn claro chico" onclick="fzExportarRango()"><i data-lucide="download"></i> Exportar</button>
    </div>
    ${filas.length ? tablaControl(filas, t, true) : `<p class="fz-sin">No hay pedidos en ese rango (${fechaCorta(desde)} a ${fechaCorta(hasta)}).</p>`}
    ${filas.length ? `
    <div class="fz-resumen">
      <div><small>DÍAS</small><b>${dias}</b></div>
      <div><small>UNIDADES VENDIDAS</small><b>${t.uds}</b></div>
      <div><small>PEDIDOS</small><b>${t.pedidos}</b></div>
      <div><small>ENTREGADOS (estimados)</small><b>${n1(t.efectivas)}</b></div>
      <div><small>VENTAS (ENTREGADOS)</small><b>${$$(ventas)}</b></div>
      <div><small>COSTO DE PRODUCTO</small><b>${$$(costoProd)}</b></div>
      <div><small>FLETES</small><b>${$$(fletes)}</b></div>
      <div><small>PUBLICIDAD</small><b>${$$(t.gasto)}</b></div>
      <div><small>UTILIDAD</small><b class="${t.utilidad < 0 ? "rojo" : "verde"}">${$$s(t.utilidad)}</b></div>
      <div><small>ROI</small><b>${t.roi === null ? "—" : pct(t.roi * 100, 0)}</b></div>
    </div>
    <div class="fz-veredicto ${t.utilidad < 0 ? "pierde" : ""}">
      <b>${t.utilidad < 0 ? `Perdiste ${$$(-t.utilidad)}` : `Rentable: ganaste ${$$(t.utilidad)}`}.</b>
      Cada pedido entregado te costó ${t.cpa === null ? $$(0) : $$(t.cpa)} de publicidad; podías pagar hasta ${$$(eqProm)} sin perder.
    </div>` : ""}
  </section>`;
}

window.fzRango = (m) => { st.rango.modo = m; renderControl($("view")); };
window.fzRangoFecha = (k, v) => { st.rango[k] = v; renderControl($("view")); };
window.fzRangoProducto = (v) => { st.rango.clave = v; renderControl($("view")); };
window.fzRangoTotal = (v) => { st.rango.porProducto = v; renderControl($("view")); };

// ---------- Día ----------
window.fzIrDia = (v) => { if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { st.dia = v; renderControl($("view")); } };
window.fzDia = (dir) => {
  const dias = st.config?.dias || [];
  const sig = dir > 0 ? dias.find(d => d > st.dia) : [...dias].reverse().find(d => d < st.dia);
  st.dia = sig || sumarDias(st.dia, dir);
  renderControl($("view"));
};

// ---------- Pauta ----------
async function guardarPauta(fila, cambios) {
  const r = await api("PUT", "/api/finanzas/pauta", { pais: st.pais, fecha: st.dia, clave: fila.clave, nombre: fila.nombre, ...cambios });
  st.pauta[`${st.dia}|${fila.clave}`] = r.pauta;
}

window.fzPauta = async (i, campo, valor) => {
  const fila = filasDelDia()[i];
  if (!fila) return;
  try {
    await guardarPauta(fila, { [campo]: valor });
    const y = window.scrollY; renderControl($("view")); window.scrollTo(0, y);
  } catch (err) { avisar(err.message, "error"); }
};

window.fzAgregarFallido = async () => {
  const clave = $("fzFallido")?.value;
  if (!clave) return avisar("Elige el producto que gastó pauta sin vender", "error");
  try {
    await guardarPauta({ clave, nombre: nombreDe(clave) }, { fallido: true });
    renderControl($("view"));
  } catch (err) { avisar(err.message, "error"); }
};

window.fzQuitarFallido = async (i) => {
  const fila = filasDelDia()[i];
  if (!fila || !confirm(`¿Quitar "${fila.nombre}" de este día?`)) return;
  try {
    await api("DELETE", `/api/finanzas/pauta?pais=${st.pais}&fecha=${st.dia}&clave=${encodeURIComponent(fila.clave)}`);
    delete st.pauta[`${st.dia}|${fila.clave}`];
    renderControl($("view"));
  } catch (err) { avisar(err.message, "error"); }
};

window.fzEditarDev = async () => {
  const v = prompt("% de devoluciones de tu tienda (se usa para estimar los entregados de cada producto):", st.config?.devPct ?? 25);
  if (v === null) return;
  const n = Number(String(v).replace(",", "."));
  if (!(n >= 0 && n <= 95)) return avisar("Escribe un número entre 0 y 95", "error");
  try {
    const r = await api("PUT", "/api/finanzas/config", { pais: st.pais, devPct: n });
    st.config.devPct = r.devPct;
    renderControl($("view"));
  } catch (err) { avisar(err.message, "error"); }
};

// ---------- Agrupar productos ----------
window.fzAbrirGrupos = () => {
  const lista = productos();
  const conteo = new Map();
  for (const l of st.lineas) conteo.set(String(l.productoId), (conteo.get(String(l.productoId)) || new Set()).add(l.ordenId));
  const sueltos = new Map();
  for (const l of st.lineas) if (!sueltos.has(String(l.productoId))) sueltos.set(String(l.productoId), l.producto);
  const enGrupo = new Set(grupos().flatMap(g => g.ids.map(String)));

  const modal = document.createElement("div");
  modal.className = "modal-overlay fz-modal";
  modal.innerHTML = `
    <div class="modal-box fz-modal-box">
      <h3><i data-lucide="combine"></i> Agrupar productos</h3>
      <p class="fz-mini">Si vendes el mismo producto con nombres distintos (dos proveedores, una variante, o un regalo que va con otro), únelos para que sus pedidos y su pauta cuenten juntos.</p>
      <div class="fz-grupos-cols">
        <div>
          <h4>Productos sueltos</h4>
          <div class="fz-lista-chk">
            ${[...sueltos.entries()].filter(([id]) => !enGrupo.has(id)).sort((a, b) => (conteo.get(b[0])?.size || 0) - (conteo.get(a[0])?.size || 0)).map(([id, nombre]) => `
              <label><input type="checkbox" value="${esc(id)}" class="fzChkGrupo"> <span>${esc(nombre)}</span> <small>${conteo.get(id)?.size || 0} ped.</small></label>`).join("") || `<p class="fz-mini">No hay productos sueltos.</p>`}
          </div>
          <input id="fzNombreGrupo" placeholder="Nombre del grupo (el que se ve)">
          <button class="fz-btn" onclick="fzCrearGrupo()"><i data-lucide="plus"></i> Unir seleccionados</button>
        </div>
        <div>
          <h4>Grupos (${grupos().length})</h4>
          ${grupos().map(g => `
            <div class="fz-grupo">
              <b>${esc(g.nombre)}</b>
              ${g.ids.map(id => `<span>${esc(sueltos.get(String(id)) || id)} <small>${conteo.get(String(id))?.size || 0} ped.</small></span>`).join("")}
              <button class="fz-btn claro chico" onclick="fzSepararGrupo('${esc(g.id)}')"><i data-lucide="undo-2"></i> Separar</button>
            </div>`).join("") || `<p class="fz-mini">Aún no tienes grupos.</p>`}
        </div>
      </div>
      <div class="fz-modal-pie"><button class="fz-btn claro" onclick="fzCerrarGrupos()">Cerrar</button></div>
    </div>`;
  modal.onclick = (e) => { if (e.target === modal) fzCerrarGrupos(); };
  document.body.appendChild(modal);
  iconos();
  void lista;
};

window.fzCerrarGrupos = () => document.querySelector(".fz-modal")?.remove();

async function guardarGrupos(nuevos) {
  const r = await api("PUT", "/api/finanzas/config", { pais: st.pais, grupos: nuevos });
  st.config.grupos = r.grupos;
  fzCerrarGrupos();
  fzAbrirGrupos();
  PAGINAS[st.pagina]($("view"));
}

window.fzCrearGrupo = async () => {
  const ids = [...document.querySelectorAll(".fzChkGrupo:checked")].map(x => x.value);
  if (ids.length < 2) return avisar("Marca al menos 2 productos para unirlos", "error");
  const nombre = $("fzNombreGrupo")?.value.trim() || st.lineas.find(l => String(l.productoId) === ids[0])?.producto || "Grupo";
  try { await guardarGrupos([...grupos(), { id: Math.random().toString(36).slice(2, 10), nombre, ids }]); avisar("Productos unidos ✓"); }
  catch (err) { avisar(err.message, "error"); }
};

window.fzSepararGrupo = async (id) => {
  try { await guardarGrupos(grupos().filter(g => g.id !== id)); avisar("Grupo separado"); }
  catch (err) { avisar(err.message, "error"); }
};

// ---------- Exportar (CSV para Excel) ----------
function descargarCSV(nombre, filas) {
  const csv = filas.map(f => f.map(v => {
    const s = v === null || v === undefined ? "" : typeof v === "number" ? String(Math.round(v * 100) / 100).replace(".", ",") : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const ENC_CSV = ["Fecha", "Producto", "Tipo", "Pedidos", "Uds", "Cancelados", "%Dev", "Efectivas", "Precio", "Proveedor", "Flete base", "Flete c/dev", "Meta", "TikTok", "Gasto", "CPA", "CPA equilibrio", "Util x prod", "Utilidad"];
const filaCSV = (f) => [f.fecha, f.nombre, f.tipo, f.pedidos, f.uds, f.cancelados, f.devPct, f.efectivas, f.precio, f.proveedor, f.fleteBase, f.fleteDev, f.meta, f.tiktok, f.gasto, f.cpa, f.equilibrio, f.utilProd, f.utilidad];
window.fzExportarDia = () => descargarCSV(`control-diario-${st.pais}-${st.dia}.csv`, [ENC_CSV, ...filasDelDia().map(filaCSV)]);
window.fzExportarRango = () => {
  const [desde, hasta] = rangoFechas();
  let filas = controlDiario(st.lineas, { desde, hasta, grupos: grupos(), pauta: st.pauta, devPct: st.config?.devPct ?? 25 });
  if (st.rango.clave) filas = filas.filter(f => f.clave === st.rango.clave);
  descargarCSV(`control-diario-${st.pais}-${desde}-a-${hasta}.csv`, [ENC_CSV, ...filas.map(filaCSV)]);
};

// =============================================
// REPORTE FINANCIERO
// =============================================
function periodo(p, desdeP, hastaP) {
  const hoy = hoyISO();
  if (p === "hoy") return [hoy, hoy];
  if (p === "ayer") { const a = sumarDias(hoy, -1); return [a, a]; }
  if (p === "7d") return [sumarDias(hoy, -6), hoy];
  if (p === "30d") return [sumarDias(hoy, -29), hoy];
  if (p === "mesAnterior") { const fin = sumarDias(hoy.slice(0, 8) + "01", -1); return [fin.slice(0, 8) + "01", fin]; }
  if (p === "custom") return [desdeP || st.config?.desde || hoy, hastaP || hoy];
  return [st.config?.desde || "", st.config?.hasta || ""];
}

const chipsPeriodo = (estado, fn) => `
  <div class="fz-chips">
    <small>PERIODO:</small>
    ${[["todo", "Todo"], ["hoy", "Hoy"], ["ayer", "Ayer"], ["7d", "7 días"], ["30d", "30 días"], ["mesAnterior", "Mes anterior"], ["custom", "Personalizado"]].map(([k, t]) => `<button class="fz-chip ${estado.periodo === k ? "activo" : ""}" onclick="${fn}('${k}')">${t}</button>`).join("")}
    ${estado.periodo === "custom" ? `<input type="date" value="${periodo("custom", estado.desde, estado.hasta)[0]}" onchange="${fn}('custom', this.value, null)"> a <input type="date" value="${periodo("custom", estado.desde, estado.hasta)[1]}" onchange="${fn}('custom', null, this.value)">` : ""}
  </div>`;

const barra = (valor, total, color) => `<span class="fz-barra"><i style="width:${total ? Math.min(100, valor / total * 100) : 0}%;background:${color}"></i></span>`;
const COLOR = { entregado: "#16a34a", transito: "#f59e0b", novedad: "#7c3aed", devolucion: "#dc2626", cancelado: "#94a3b8", pendiente: "#334155" };

function renderReporte(view) {
  const c = st.config;
  const R = st.rep;
  const [desde, hasta] = periodo(R.periodo, R.desde, R.hasta);
  const gasto = gastoRango(desde, hasta, R.clave);
  const r = c?.desde ? reporteFinanciero(st.lineas, { desde, hasta, clave: R.clave, grupos: grupos(), gastoMeta: gasto.meta, gastoTiktok: gasto.tiktok, referenciaEntrega: R.referencia }) : null;
  const salud = !r ? "" : r.margenNeto >= 30 ? ["ok", "MARGEN SALUDABLE"] : r.margenNeto >= 10 ? ["warn", "MARGEN AJUSTADO"] : ["mal", "MARGEN EN RIESGO"];
  const maxDia = r ? Math.max(1, ...r.porDia.map(([, v]) => v)) : 1;

  view.innerHTML = `
  <div class="fz-page">
    ${cabecera(R.clave ? `Resumen: ${esc(nombreDe(R.clave))}` : "Reporte Financiero", "Lo que de verdad entra a tu wallet de Dropi por lo entregado, menos devoluciones y publicidad.", "bar-chart-3")}
    ${!r ? vacio() : `
    <section class="fz-card fz-filtros">
      <label>Producto
        <select onchange="fzRepProducto(this.value)"><option value="">Resumen total de productos</option>${productos().map(p => `<option value="${esc(p.clave)}" ${R.clave === p.clave ? "selected" : ""}>${esc(p.nombre)}</option>`).join("")}</select>
      </label>
      ${chipsPeriodo(R, "fzRepPeriodo")}
      <small class="fz-mini">${fechaCorta(desde)} a ${fechaCorta(hasta)} · ${r.pedidos} pedidos</small>
    </section>

    <section class="fz-salud ${salud[0]}"><span><i data-lucide="trending-up"></i> ${salud[1]}</span><b>${pct(r.margenNeto)} <small>MARGEN NETO</small></b></section>

    <div class="fz-kpis">
      <div class="fz-kpi"><small>TOTAL DE PEDIDOS</small><b>${r.pedidos}</b><span>${r.transito} en tránsito · ${r.novedades} novedad${r.novedades === 1 ? "" : "es"} por gestionar</span></div>
      <div class="fz-kpi"><small>TASA DE ENTREGA</small><b class="${r.tasaEntrega < (c.metaEntrega || 70) ? "rojo" : "verde"}">${pct(r.tasaEntrega)}</b><span>${r.entregados} entregados de ${r.despachados} despachados</span></div>
      <div class="fz-kpi"><small>TOTAL FACTURADO</small><b>${$$(r.facturado)}</b><span>de los pedidos despachados</span></div>
      <div class="fz-kpi"><small>VALOR ENTREGADO</small><b>${$$(r.valorEntregado)}</b><span>${r.entregados} entregados: lo que entra a la wallet</span></div>
      <div class="fz-kpi"><small>GANANCIA BRUTA</small><b>${$$s(r.gananciaBruta)}</b><span>wallet menos costo de devoluciones</span></div>
    </div>

    <div class="fz-dos">
      <section class="fz-card">
        <h3>Estado de pedidos</h3><p class="fz-mini">${r.despachados} despachados</p>
        ${[["entregado", r.entregados], ["transito", r.transito], ["novedad", r.novedades], ["devolucion", r.devoluciones], ["cancelado", r.cancelados], ["pendiente", r.pendientes]].map(([k, v]) => `
          <div class="fz-estado"><span><i style="background:${COLOR[k]}"></i>${NOMBRE_GRUPO[k]}${k === "devolucion" && r.despachados && v / r.despachados > 0.2 ? ` <em class="fz-tag rojo">ALTO</em>` : ""}</span><b>${v}</b>${barra(v, k === "cancelado" || k === "pendiente" ? r.pedidos : r.despachados, COLOR[k])}<small>${pct(k === "cancelado" || k === "pendiente" ? (r.pedidos ? v / r.pedidos * 100 : 0) : (r.despachados ? v / r.despachados * 100 : 0))}</small></div>`).join("")}
      </section>
      <section class="fz-card">
        <h3>Pedidos por día</h3><p class="fz-mini">Volumen diario</p>
        <div class="fz-barras">
          ${r.porDia.map(([d, v]) => `<div title="${fechaCorta(d)}: ${v} pedidos"><i style="height:${v / maxDia * 100}%"></i><small>${d.slice(8)}</small></div>`).join("")}
        </div>
      </section>
    </div>

    <section class="fz-card">
      <h3>Forma de cobro</h3>
      <div class="fz-dos">
        ${[["contraEntrega", "Contra entrega", "El cliente paga al recibir. Dropi recauda y te abona a la wallet."], ["prepagado", "Prepagado (sin recaudo)", "Ya te pagaron por fuera. Dropi solo transporta."]].map(([k, t, d]) => {
          const x = r.cobro[k];
          return `<div class="fz-cobro">
            <b>${t}</b><p class="fz-mini">${d}</p>
            <strong>${x.pedidos} <small>${pct(r.pedidos ? x.pedidos / r.pedidos * 100 : 0)} de los pedidos</small></strong>
            <dl><dt>Entregados</dt><dd>${x.entregados}</dd><dt>Devoluciones</dt><dd>${x.devoluciones}</dd><dt>Cancelados</dt><dd>${x.cancelados}</dd><dt>En tránsito</dt><dd>${x.transito}</dd><dt>Novedades</dt><dd>${x.novedades}</dd><dt>Facturado</dt><dd>${$$(x.facturado)}</dd><dt>Ganancia</dt><dd>${$$s(x.ganancia)}</dd></dl>
          </div>`;
        }).join("")}
      </div>
    </section>

    <div class="fz-dos">
      <section class="fz-card">
        <h3>Estado financiero</h3><p class="fz-mini">Lo que entra a la wallet por lo entregado, menos el costo real de las devoluciones</p>
        <dl class="fz-pyg">
          <dt class="mas">Ingreso por entregados</dt><dd>+${$$(r.ingreso)}</dd>
          <dt class="menos">Costo productos entregados</dt><dd>${$$(r.costoProductos)}</dd>
          <dt class="menos">Fletes de entregados</dt><dd>${$$(r.fletesEntregados)}</dd>
          <dt class="menos">Costo devoluciones <small>ida y vuelta, lo que descuenta Dropi</small></dt><dd>${$$(r.costoDevoluciones)}</dd>
          <dt class="total">Ganancia bruta</dt><dd class="total">${$$s(r.gananciaBruta)}</dd>
        </dl>
        <h4>Tus fletes <small>${r.fletes.envios} envíos</small></h4>
        <div class="fz-dos chico">
          <div class="fz-mini-card"><small>ENVIAR UN PEDIDO</small><b>${$$(r.fletes.promedio)}</b><span>promedio</span>
            <dl><dt>El más barato</dt><dd>${$$(r.fletes.min)}</dd><dt>El más caro</dt><dd>${$$(r.fletes.max)}</dd><dt>La mitad paga menos de</dt><dd>${$$(r.fletes.mediana)}</dd></dl></div>
          <div class="fz-mini-card"><small>QUE TE LO DEVUELVAN</small>${r.fletes.devolucionPromedio ? `<b>${$$(r.fletes.devolucionPromedio)}</b><span>promedio por devolución cobrada</span>` : `<p class="fz-mini">Dropi todavía no ha cobrado devoluciones en este periodo.</p>`}</div>
        </div>
      </section>
      <section class="fz-card">
        <h3>Resultado neto</h3><p class="fz-mini">P&amp;G del periodo</p>
        <dl class="fz-pyg">
          <dt class="mas">Ganancia bruta</dt><dd>${$$s(r.gananciaBruta)}</dd>
          <dt>Inversión Meta Ads</dt><dd>${$$(r.gastoMeta)}</dd>
          <dt>Inversión TikTok Ads</dt><dd>${$$(r.gastoTiktok)}</dd>
          <dt class="total">Ganancia neta <small>margen ${pct(r.margenNeto)} · incluye publicidad</small></dt><dd class="total ${r.gananciaNeta < 0 ? "rojo" : "verde"}">${$$s(r.gananciaNeta)}</dd>
        </dl>
        ${r.publicidad === 0 ? `<p class="fz-mini">La publicidad sale de lo que escribas en el Control Diario (o de Meta cuando esté conectado).</p>` : ""}
        <div class="fz-proy">
          <b>Y si de los ${r.proyeccion.rodando} que siguen rodando…</b>
          <div class="fz-slider"><strong>${R.referencia}%</strong><input type="range" min="0" max="100" step="5" value="${R.referencia}" oninput="fzRepReferencia(this.value)"></div>
          <p class="fz-mini">se entregan ${r.proyeccion.seEntregan} y se devuelven ${r.proyeccion.seDevuelven}</p>
          <dl class="fz-pyg">
            <dt>Los que se entregan · venta − producto − flete</dt><dd class="verde">+${$$(r.proyeccion.gana)}</dd>
            <dt>Los que se devuelven · costo de devolución</dt><dd class="rojo">-${$$(r.proyeccion.pierde)}</dd>
            <dt class="total">Ganancia neta si cierra así</dt><dd class="total">${$$s(r.proyeccion.netaFinal)}</dd>
          </dl>
        </div>
      </section>
    </div>

    <section class="fz-card">
      <h3><i data-lucide="sparkles"></i> Análisis con IA</h3>
      <p class="fz-mini">La IA lee las mismas cifras de arriba: el embudo de pedidos, la ganancia neta con tu publicidad y si el periodo sigue abierto. Te dice qué mirar y qué hacer.</p>
      <button id="fzBtnIA" class="fz-btn" onclick="fzAnalizarIA()"><i data-lucide="sparkles"></i> Analizar con IA</button>
      <div id="fzIA" class="fz-ia"></div>
    </section>
  `}
    <p class="fz-aviso">Estas cifras se calculan con los datos de tu Excel de Dropi y pueden diferir unos pesos de tu wallet. Sirven para orientarte, no reemplazan tu contabilidad.</p>
  </div>`;
  iconos();
}

window.fzRepProducto = (v) => { st.rep.clave = v; renderReporte($("view")); };
window.fzRepPeriodo = (p, d, h) => { st.rep.periodo = p; if (d) st.rep.desde = d; if (h) st.rep.hasta = h; renderReporte($("view")); };
let tRef = null;
window.fzRepReferencia = (v) => { st.rep.referencia = Number(v); clearTimeout(tRef); tRef = setTimeout(() => { const y = window.scrollY; renderReporte($("view")); window.scrollTo(0, y); }, 120); };

window.fzAnalizarIA = async () => {
  const b = $("fzBtnIA"), out = $("fzIA");
  const [desde, hasta] = periodo(st.rep.periodo, st.rep.desde, st.rep.hasta);
  const gasto = gastoRango(desde, hasta, st.rep.clave);
  const r = reporteFinanciero(st.lineas, { desde, hasta, clave: st.rep.clave, grupos: grupos(), gastoMeta: gasto.meta, gastoTiktok: gasto.tiktok, referenciaEntrega: st.rep.referencia });
  const lg = logistica(st.lineas, { desde, hasta, grupos: grupos(), ahora: new Date(st.config?.ultimaImportacion || Date.now()) });
  if (b) { b.disabled = true; b.innerHTML = `<span class="est-spin"></span> Analizando...`; }
  try {
    const { analisis } = await api("POST", "/api/finanzas/analisis", {
      pais: st.pais, producto: st.rep.clave ? nombreDe(st.rep.clave) : "Todos los productos", desde, hasta,
      cifras: {
        pedidos: r.pedidos, despachados: r.despachados, entregados: r.entregados, devoluciones: r.devoluciones, cancelados: r.cancelados,
        transito: r.transito, novedades: r.novedades, tasaEntrega: r.tasaEntrega, metaEntrega: st.config?.metaEntrega ?? 70,
        ingreso: r.ingreso, costoProductos: r.costoProductos, fletes: r.fletesEntregados, costoDevoluciones: r.costoDevoluciones,
        gananciaBruta: r.gananciaBruta, publicidadMeta: r.gastoMeta, publicidadTiktok: r.gastoTiktok, gananciaNeta: r.gananciaNeta,
        margenNeto: r.margenNeto, proyeccion: r.proyeccion,
        transportadoras: lg.transportadoras.slice(0, 5).map(t => ({ nombre: t.nombre, despachados: t.despachados, tasaEntrega: Math.round(t.tasa) })),
        ciudadesPeores: lg.ciudades.filter(x => x.despachados >= 10).sort((a, b) => a.tasa - b.tasa).slice(0, 5).map(x => ({ ciudad: x.nombre, despachados: x.despachados, tasaEntrega: Math.round(x.tasa) })),
        novedadesTop: lg.novedadesActivas.porTipo.slice(0, 5),
        productos: lg.productos.slice(0, 8).map(p => ({ nombre: p.nombre, pedidos: p.pedidos, entrega: Math.round(p.entrega), devolucion: Math.round(p.devolucion), gananciaBruta: Math.round(p.gananciaBruta) }))
      }
    });
    if (out) out.innerHTML = esc(analisis).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  } catch (err) {
    avisar(err.message, "error");
  } finally {
    if (b && document.body.contains(b)) { b.disabled = false; b.innerHTML = `<i data-lucide="sparkles"></i> Volver a analizar`; iconos(); }
  }
};

// =============================================
// LOGÍSTICA
// =============================================
function renderLogistica(view) {
  const c = st.config;
  const L = st.log;
  const [desde, hasta] = periodo(L.periodo, L.desde, L.hasta);
  const ahora = new Date(c?.ultimaImportacion || Date.now());
  const r = c?.desde ? logistica(st.lineas, { desde, hasta, grupos: grupos(), ahora, metaEntrega: c.metaEntrega }) : null;

  view.innerHTML = `
  <div class="fz-page">
    ${cabecera("Logística", "Cómo van tus envíos: entregas, novedades, devoluciones, transportadoras y ciudades.", "truck")}
    ${!r ? vacio() : `
    <section class="fz-card fz-filtros">${chipsPeriodo(L, "fzLogPeriodo")}<small class="fz-mini">${r.pedidos} pedidos · ${fechaCorta(desde)} a ${fechaCorta(hasta)} · estados al ${ahora.toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></section>

    <div class="fz-dos">
      <section class="fz-alerta amarillo"><b>${r.sinMovimiento.total}</b><div><strong>pedidos sin movimiento +24 h</strong><small>Revisar estado con la transportadora${r.sinMovimiento.porTransportadora.length ? ": " + r.sinMovimiento.porTransportadora.slice(0, 3).map(([t, n]) => `${esc(t)} ${n}`).join(" · ") : ""}</small></div><button class="fz-btn chico" onclick="fzLogFiltro('mov24')">Ver pedidos</button></section>
      <section class="fz-alerta morado"><b>${r.novedadesActivas.total}</b><div><strong>novedades sin resolver</strong><small>${r.novedadesActivas.porTipo.slice(0, 2).map(([t, n]) => `${esc(t)} (${n})`).join(" · ") || "Nada pendiente"}</small></div><button class="fz-btn chico" onclick="fzLogFiltro('novedades')">Ver pedidos</button></section>
    </div>

    <div class="fz-kpis seis">
      <div class="fz-kpi grande"><small>TOTAL DE PEDIDOS</small><b>${r.pedidos}</b>${barraApilada(r.estados, r.pedidos)}</div>
      ${["entregado", "devolucion", "cancelado", "pendiente", "transito", "novedad"].map(k => `<div class="fz-kpi"><small><i style="background:${COLOR[k]}"></i>${NOMBRE_GRUPO[k].toUpperCase()}</small><b style="color:${COLOR[k]}">${r.estados[k] || 0}</b><span>${pct(r.pedidos ? (r.estados[k] || 0) / r.pedidos * 100 : 0)} del total</span></div>`).join("")}
    </div>

    <section class="fz-card">
      <h3>Efectividad operativa</h3><p class="fz-mini">${r.pedidos} pedidos · ${r.despachados} despachados</p>
      <div class="fz-efect">
        <div>
          <b class="${r.tasaEntrega >= r.metaEntrega ? "verde" : "ambar"}">${pct(r.tasaEntrega)}</b> <span>tasa de entrega</span>
          ${barra(r.tasaEntrega, 100, r.tasaEntrega >= r.metaEntrega ? "#16a34a" : "#f59e0b")}
          <p class="fz-mini">${r.estados.entregado} entregados de ${r.despachados} despachados · Meta: ${r.metaEntrega}% · ${r.tasaEntrega >= r.metaEntrega ? "¡Cumplida!" : `Faltan ${(r.metaEntrega - r.tasaEntrega).toFixed(1)} puntos`}</p>
        </div>
        <ul>${["entregado", "devolucion", "cancelado", "pendiente", "transito", "novedad"].map(k => `<li><i style="background:${COLOR[k]}"></i>${NOMBRE_GRUPO[k]}<b>${r.estados[k] || 0}</b><small>${pct(r.pedidos ? (r.estados[k] || 0) / r.pedidos * 100 : 0)}</small></li>`).join("")}</ul>
      </div>
    </section>

    <section class="fz-card">
      <h3>Análisis de novedades</h3><p class="fz-mini">${r.novedades.total} pedidos tuvieron novedad · según la columna "Fue solucionada la novedad"</p>
      <div class="fz-nov">
        <div><small>TOTAL</small><b class="morado">${r.novedades.total}</b></div>
        <div><small>SOLUCIONADAS</small><b class="verde">${r.novedades.solucionadas}</b><span>${pct(r.novedades.total ? r.novedades.solucionadas / r.novedades.total * 100 : 0)}</span></div>
        <div><small>NO SOLUCIONADAS</small><b class="rojo">${r.novedades.noSolucionadas}</b><span>${pct(r.novedades.total ? r.novedades.noSolucionadas / r.novedades.total * 100 : 0)}</span></div>
        <div><small>DÍAS RESOLUCIÓN</small><b>${r.novedades.diasResolucion.toFixed(1)}d</b><span>promedio</span></div>
        <div><small>RESULTADO FINAL</small><span class="verde">${r.novedades.resultado.entregadas} entregadas</span><span class="rojo">${r.novedades.resultado.devueltas} devueltas</span><span>${r.novedades.resultado.otras} en otro estado</span></div>
      </div>
    </section>

    <section class="fz-card">
      <h3>Efectividad de transportadoras</h3><p class="fz-mini">${r.transportadoras.length} transportadoras · <span class="fz-ley"><i style="background:${COLOR.entregado}"></i>Entregados <i style="background:${COLOR.transito}"></i>En tránsito <i style="background:${COLOR.novedad}"></i>Novedades <i style="background:${COLOR.devolucion}"></i>Devoluciones</span></p>
      ${r.transportadoras.map(t => `
        <div class="fz-transp">
          <span>${esc(t.nombre)}</span>
          <div class="fz-apilada" style="width:${Math.max(4, t.despachados / Math.max(1, r.despachados) * 100)}%">
            ${[["entregados", "entregado"], ["transito", "transito"], ["novedades", "novedad"], ["devoluciones", "devolucion"]].map(([k, c2]) => t[k] ? `<i style="flex:${t[k]};background:${COLOR[c2]}" title="${NOMBRE_GRUPO[c2]}: ${t[k]}"></i>` : "").join("")}
          </div>
          <small>${t.despachados} · entrega ${pct(t.tasa)}${t.despachados < 10 ? " ⚠ pocos datos" : ""}</small>
        </div>`).join("")}
    </section>

    ${tablaCiudades(r)}
    ${tablaProductos(r)}
    ${tablaSeguimiento(r)}
  `}
    <p class="fz-aviso">Estados según el último Excel que subiste. Para verlos al día, vuelve a descargar el reporte de Dropi y súbelo.</p>
  </div>`;
  iconos();
}

function barraApilada(estados, total) {
  return `<div class="fz-apilada full">${["entregado", "devolucion", "cancelado", "pendiente", "transito", "novedad"].map(k => estados[k] ? `<i style="flex:${estados[k]};background:${COLOR[k]}"></i>` : "").join("")}</div><span>${total ? "repartidos en las seis tarjetas" : ""}</span>`;
}

function tablaCiudades(r) {
  const L = st.log;
  let lista = [...r.ciudades];
  const orden = { total: (a, b) => b.total - a.total, tasa: (a, b) => b.tasa - a.tasa, tasaAsc: (a, b) => a.tasa - b.tasa, devoluciones: (a, b) => b.devoluciones - a.devoluciones };
  lista.sort(orden[L.ciudadOrden] || orden.total);
  if (L.priorizar && L.ciudadOrden.startsWith("tasa")) lista.sort((a, b) => (b.despachados >= 10) - (a.despachados >= 10));
  const paginas = Math.max(1, Math.ceil(lista.length / L.ciudadesN));
  if (L.ciudadesPag > paginas) L.ciudadesPag = paginas;
  const ini = (L.ciudadesPag - 1) * L.ciudadesN;
  const th = (k, t) => `<th class="n clic ${L.ciudadOrden === k ? "activo" : ""}" onclick="fzCiudadOrden('${k}')">${t}</th>`;
  return `<section class="fz-card">
    <h3>Ciudades por volumen</h3><p class="fz-mini">${lista.length} ciudades · tasa de entrega por ciudad</p>
    <div class="fz-scroll"><table class="fz-tabla">
      <thead><tr><th>#</th><th>Ciudad</th>${th("total", "Total")}<th class="n">Entregados</th><th class="n">Tránsito</th><th class="n">Novedades</th><th class="n">Cancelados</th>${th("devoluciones", "Devolución")}<th></th>${th(L.ciudadOrden === "tasa" ? "tasaAsc" : "tasa", "Tasa " + (L.ciudadOrden === "tasaAsc" ? "↑" : "↓"))}</tr></thead>
      <tbody>${lista.slice(ini, ini + L.ciudadesN).map((x, i) => `<tr>
        <td class="gris">${ini + i + 1}</td><td><b>${esc(x.nombre)}</b></td><td class="n">${x.total}</td>
        <td class="n">${x.entregados} <small>(${pct(x.despachados ? x.entregados / x.despachados * 100 : 0, 0)})</small></td><td class="n">${x.transito}</td><td class="n morado">${x.novedades}</td>
        <td class="n">${x.cancelados}</td><td class="n rojo">${x.devoluciones} <small>(${pct(x.despachados ? x.devoluciones / x.despachados * 100 : 0, 0)})</small></td>
        <td><div class="fz-apilada mini">${[["entregados", "entregado"], ["transito", "transito"], ["novedades", "novedad"], ["devoluciones", "devolucion"]].map(([k, c2]) => x[k] ? `<i style="flex:${x[k]};background:${COLOR[c2]}"></i>` : "").join("")}</div></td>
        <td class="n ${x.tasa >= 60 ? "verde" : "rojo"}">${pct(x.tasa)}</td></tr>`).join("")}</tbody>
    </table></div>
    <div class="fz-pie-tabla">
      <label class="fz-check"><input type="checkbox" ${L.priorizar ? "checked" : ""} onchange="fzCiudadPriorizar(this.checked)"> Priorizar ciudades con datos suficientes (≥ 10 pedidos) al ordenar por tasa</label>
      <span>Mostrar ${[5, 10, 25].map(n => `<button class="fz-chip ${L.ciudadesN === n ? "activo" : ""}" onclick="fzCiudadN(${n})">${n}</button>`).join("")}</span>
      <span><button class="fz-chip" ${L.ciudadesPag <= 1 ? "disabled" : ""} onclick="fzCiudadPag(-1)">Anterior</button> ${L.ciudadesPag} / ${paginas} <button class="fz-chip" ${L.ciudadesPag >= paginas ? "disabled" : ""} onclick="fzCiudadPag(1)">Siguiente</button></span>
    </div>
  </section>`;
}

function tablaProductos(r) {
  const b = st.log.prodBuscar.trim().toLowerCase();
  const lista = r.productos.filter(p => !b || p.nombre.toLowerCase().includes(b));
  return `<section class="fz-card">
    <h3>Análisis de productos</h3><p class="fz-mini">${r.productos.length} productos · entrega, tránsito, novedad y devolución sobre pedidos con guía · cancelado sobre el total</p>
    <input class="fz-buscar" placeholder="Buscar producto..." value="${esc(st.log.prodBuscar)}" oninput="fzLogProdBuscar(this.value)" id="fzProdBuscar">
    <div class="fz-scroll"><table class="fz-tabla">
      <thead><tr><th>Producto</th><th class="n">Pedidos</th><th class="n verde">Entrega</th><th class="n ambar">Tránsito</th><th class="n morado">Novedad</th><th class="n">Cancelado</th><th class="n rojo">Devolución</th><th class="n">Ganancia bruta</th></tr></thead>
      <tbody>${lista.map((p, i) => `<tr>
        <td><small class="gris">#${i + 1}</small> <b>${esc(p.nombre)}</b>
          <div class="fz-apilada mini">${[["entrega", "entregado"], ["transito", "transito"], ["novedad", "novedad"], ["devolucion", "devolucion"]].map(([k, c2]) => p[k] ? `<i style="flex:${p[k]};background:${COLOR[c2]}"></i>` : "").join("")}</div></td>
        <td class="n">${p.pedidos}</td><td class="n">${pct(p.entrega)}</td><td class="n">${pct(p.transito)}</td><td class="n">${pct(p.novedad)}</td><td class="n">${pct(p.cancelado)}</td><td class="n">${pct(p.devolucion)}</td>
        <td class="n ${p.gananciaBruta < 0 ? "rojo" : "verde"}"><b>${$$s(p.gananciaBruta)}</b></td></tr>`).join("")}</tbody>
    </table></div>
  </section>`;
}

function tablaSeguimiento(r) {
  const L = st.log;
  const filtros = {
    activos: (o) => o.grupo !== "pendiente",
    mov24: (o) => (o.horasSinMovimiento ?? 0) > 24,
    novedades: (o) => o.grupo === "novedad",
    pendientes: (o) => o.grupo === "pendiente"
  };
  const b = L.buscar.trim().toLowerCase();
  let lista = r.seguimiento.filter(filtros[L.filtro] || filtros.activos)
    .filter(o => !b || [o.producto, o.guia, o.ciudad, o.ordenId, o.transportadora].some(v => String(v || "").toLowerCase().includes(b)));
  const paginas = Math.max(1, Math.ceil(lista.length / L.porPagina));
  if (L.pagina > paginas) L.pagina = paginas;
  const ini = (L.pagina - 1) * L.porPagina;
  const cuenta = (f) => r.seguimiento.filter(filtros[f]).length;

  return `<section class="fz-card" id="fzSeguimiento">
    <h3>Seguimiento de pedidos</h3><p class="fz-mini">${cuenta("activos")} activos de ${r.pedidos} pedidos</p>
    <div class="fz-chips">
      <input class="fz-buscar" placeholder="Buscar guía, producto, ciudad u orden..." value="${esc(L.buscar)}" oninput="fzLogBuscar(this.value)" id="fzLogBuscar">
      ${[["activos", "Activos"], ["mov24", "+24h sin mov."], ["novedades", "Solo novedades"], ["pendientes", "Pendiente confirmación"]].map(([k, t]) => `<button class="fz-chip ${L.filtro === k ? "activo" : ""}" onclick="fzLogFiltro('${k}', true)">${t} (${cuenta(k)})</button>`).join("")}
      <button class="fz-btn claro chico" onclick="fzExportarSeguimiento()"><i data-lucide="download"></i> Exportar</button>
    </div>
    <div class="fz-scroll"><table class="fz-tabla">
      <thead><tr><th>Fecha</th><th>Orden</th><th>Producto</th><th>Ciudad</th><th>Estatus</th><th>Guía</th><th>Transportadora</th><th>Últ. movimiento</th></tr></thead>
      <tbody>${lista.slice(ini, ini + L.porPagina).map(o => `<tr>
        <td>${fechaCorta(o.fecha)}</td><td class="gris">${esc(o.ordenId)}</td><td><b>${esc(o.producto)}</b></td><td>${esc(o.ciudad)}</td>
        <td><span class="fz-tag ${o.grupo}">${o.grupo === "novedad" ? "NOVEDAD" : esc(o.estatus)}</span>${o.novedad ? `<small class="morado">${esc(o.novedad)}</small>` : ""}</td>
        <td>${o.guia ? `<button class="fz-guia" title="Copiar guía" onclick="fzCopiar('${esc(o.guia)}')">${esc(o.guia)} <i data-lucide="copy"></i></button>` : "—"}</td>
        <td>${esc(o.transportadora)}</td>
        <td>${fechaCorta(o.fechaUltMov)}${o.horasSinMovimiento > 24 ? ` <small class="ambar">${Math.floor(o.horasSinMovimiento / 24)}d sin mov.</small>` : ""}<small>${esc(o.ultimoMovimiento)}</small></td>
      </tr>`).join("") || `<tr><td colspan="8" class="fz-sin">Nada por aquí.</td></tr>`}</tbody>
    </table></div>
    <div class="fz-pie-tabla">
      <span>Mostrando ${lista.length ? ini + 1 : 0}–${Math.min(lista.length, ini + L.porPagina)} de ${lista.length}</span>
      <span>Por página ${[25, 50, 100].map(n => `<button class="fz-chip ${L.porPagina === n ? "activo" : ""}" onclick="fzLogPorPagina(${n})">${n}</button>`).join("")}</span>
      <span><button class="fz-chip" ${L.pagina <= 1 ? "disabled" : ""} onclick="fzLogPagina(-1)">Anterior</button> ${L.pagina} / ${paginas} <button class="fz-chip" ${L.pagina >= paginas ? "disabled" : ""} onclick="fzLogPagina(1)">Siguiente</button></span>
    </div>
  </section>`;
}

const reLog = (foco) => {
  const y = window.scrollY;
  renderLogistica($("view"));
  window.scrollTo(0, y);
  if (foco) { const el = $(foco); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
};
window.fzLogPeriodo = (p, d, h) => { st.log.periodo = p; if (d) st.log.desde = d; if (h) st.log.hasta = h; st.log.pagina = 1; reLog(); };
window.fzLogFiltro = (f, quieto) => {
  st.log.filtro = f; st.log.pagina = 1; reLog();
  if (!quieto) $("fzSeguimiento")?.scrollIntoView({ behavior: "smooth", block: "start" });
};
window.fzLogBuscar = (v) => { st.log.buscar = v; st.log.pagina = 1; reLog("fzLogBuscar"); };
window.fzLogProdBuscar = (v) => { st.log.prodBuscar = v; reLog("fzProdBuscar"); };
window.fzLogPagina = (d) => { st.log.pagina += d; reLog(); };
window.fzLogPorPagina = (n) => { st.log.porPagina = n; st.log.pagina = 1; reLog(); };
window.fzCiudadOrden = (k) => { st.log.ciudadOrden = k; st.log.ciudadesPag = 1; reLog(); };
window.fzCiudadPriorizar = (v) => { st.log.priorizar = v; reLog(); };
window.fzCiudadN = (n) => { st.log.ciudadesN = n; st.log.ciudadesPag = 1; reLog(); };
window.fzCiudadPag = (d) => { st.log.ciudadesPag += d; reLog(); };
window.fzCopiar = async (t) => { try { await navigator.clipboard.writeText(t); avisar("Guía copiada ✓"); } catch { avisar(t); } };
window.fzExportarSeguimiento = () => {
  const [desde, hasta] = periodo(st.log.periodo, st.log.desde, st.log.hasta);
  const r = logistica(st.lineas, { desde, hasta, grupos: grupos(), ahora: new Date(st.config?.ultimaImportacion || Date.now()) });
  descargarCSV(`seguimiento-${st.pais}-${hoyISO()}.csv`, [
    ["Fecha", "Orden", "Producto", "Ciudad", "Estatus", "Novedad", "Guía", "Transportadora", "Último movimiento", "Fecha últ. mov.", "Horas sin movimiento"],
    ...r.seguimiento.map(o => [o.fecha, o.ordenId, o.producto, o.ciudad, o.estatus, o.novedad, o.guia, o.transportadora, o.ultimoMovimiento, o.fechaUltMov, o.horasSinMovimiento === null ? "" : Math.round(o.horasSinMovimiento)])
  ]);
};

// ---------- Rutas ----------
const PAGINAS = { "control-diario": renderControl, "reporte-financiero": renderReporte, logistica: renderLogistica };

for (const [ruta, render] of Object.entries(PAGINAS)) {
  registrarRuta(ruta, async (view) => {
    st.pagina = ruta;
    window.marcarMenuActivo?.(ruta);
    abrirMenuFinanzas(true);
    view.innerHTML = `<div class="fz-page"><p class="est-muted">Cargando...</p></div>`;
    try {
      await cargar(true);
      if (st.pagina === ruta) render(view);
    } catch (err) {
      view.innerHTML = `<div class="fz-page"><p class="est-error">${esc(err.message)}</p></div>`;
    }
  });
}

// Submenú "Finanzas" del menú lateral
function abrirMenuFinanzas(abrir) {
  const menu = $("finanzas-submenu"), flecha = $("finanzas-arrow");
  if (!menu) return;
  const abierto = abrir ?? !menu.classList.contains("open");
  menu.classList.toggle("open", abierto);
  flecha?.setAttribute("data-lucide", abierto ? "chevron-down" : "chevron-right");
  iconos();
}
window.toggleFinanzasMenu = function () {
  const sidebar = document.querySelector("aside");
  if (sidebar?.classList.contains("collapsed")) { window.toggleSidebar?.(); setTimeout(() => abrirMenuFinanzas(true), 50); return; }
  abrirMenuFinanzas();
};

// Para pruebas
window.__fz = st;
void claveProducto;
