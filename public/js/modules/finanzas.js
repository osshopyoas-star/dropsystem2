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
  leerReporteDropi, controlDiario, totalesControl, reporteFinanciero, logistica, rentabilidadProductos,
  nombresProductos, claveProducto, NOMBRE_GRUPO, costosPeriodo, mesesEntre
} from "../core/finanzas.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");
const iconos = () => { if (window.lucide) lucide.createIcons(); };
const PAIS_NOMBRE = { CO: "Colombia", EC: "Ecuador" };
const MONEDA_PAIS = { CO: "COP", EC: "USD" };

// ---------- Estado ----------
const st = {
  pais: (() => { try { return localStorage.getItem("fz_pais") || "CO"; } catch { return "CO"; } })(),
  // Origen elegido en el selector (vacío = aún no lo eliges)
  origen: (() => { try { return localStorage.getItem("fz_origen") || ""; } catch { return ""; } })(),
  meta: { estado: null, sync: null, cargando: false, error: "", abierto: false, rango: null },
  lineas: [], config: null, pauta: {}, cargadoPais: null,
  dia: null,
  rango: { modo: "7d", desde: "", hasta: "", clave: "", porProducto: false },
  rep: { periodo: "todo", desde: "", hasta: "", clave: "", referencia: 70, rentOrden: "neta", mesCostos: "" },
  log: { periodo: "todo", desde: "", hasta: "", filtro: "activos", buscar: "", pagina: 1, porPagina: 25, ciudadesN: 5, ciudadesPag: 1, ciudadOrden: "total", priorizar: true, prodBuscar: "", ciudadTransp: "" },
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
  const [config, lineas, pauta, notas] = await Promise.all([
    api("GET", `/api/finanzas/config?pais=${st.pais}`),
    api("GET", `/api/finanzas/lineas?pais=${st.pais}`),
    api("GET", `/api/finanzas/pauta?pais=${st.pais}`),
    api("GET", `/api/finanzas/notas?pais=${st.pais}`).catch(() => ({}))
  ]);
  st.notas = notas || {};
  st.config = config;
  st.lineas = lineas;
  st.meta.sync = null; st.meta.rango = null; st.meta.error = "";
  if (!st.meta.estado) st.meta.estado = await api("GET", "/api/meta/estado").catch(() => ({ conectado: false }));
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

// ---------- Cabecera común: origen de los datos (Dropi) + cuentas publicitarias (Meta) ----------
function selectorCuentas() {
  const m = st.meta.estado;
  if (!m) return `<div class="fz-cta-caja cargando"><span class="fz-cta-ico"><i data-lucide="loader"></i></span><span class="fz-cta-txt">Cargando…</span></div>`;
  if (!m.conectado) return `<a class="fz-cta-caja" href="#/integraciones" onclick="goTo('integraciones');return false"><span class="fz-cta-ico">∞</span><span class="fz-cta-txt">Conecta Meta en Integraciones</span><i data-lucide="chevron-right"></i></a>`;
  const elegidas = new Set(st.config?.metaCuentas || []);
  const cuentas = [...(m.cuentas || [])].sort((x, y) => (elegidas.has(y.account_id) - elegidas.has(x.account_id)) || (y.activa - x.activa) || x.name.localeCompare(y.name, "es"));
  const sel = cuentas.filter(c => elegidas.has(c.account_id));
  const texto = !sel.length ? `<span class="fz-placeholder">Elige cuenta(s)...</span>`
    : `<span class="fz-chips-cta">${sel.slice(0, 3).map(c => `<span class="fz-chip-cta">${esc(c.name)} <small>${esc(c.currency)}</small></span>`).join("")}${sel.length > 3 ? `<span class="fz-chip-cta mas">+${sel.length - 3}</span>` : ""}</span>`;
  return `
    <div class="fz-cta ${st.meta.abierto ? "abierto" : ""}">
      <button type="button" class="fz-cta-caja" onclick="fzCuentasAbrir()"><span class="fz-cta-ico">∞</span><span class="fz-cta-txt">${texto}</span><i data-lucide="chevron-down"></i></button>
      ${st.meta.abierto ? `
      <div class="fz-cta-lista">
        ${cuentas.map(c => `
          <label class="${c.activa ? "" : "inactiva"}">
            <input type="checkbox" value="${esc(c.account_id)}" ${elegidas.has(c.account_id) ? "checked" : ""} onchange="fzCuenta(this.value, this.checked)">
            <span><b>${esc(c.name)}</b><small>${esc(c.account_id)}${c.activa ? "" : ` · ${esc(c.status)}`}</small></span>
            <em class="${c.currency && c.currency !== MONEDA_PAIS[st.pais] ? "otra" : ""}" title="${c.currency !== MONEDA_PAIS[st.pais] ? "Se convierte con la TRM" : ""}">${esc(c.currency)}</em>
          </label>`).join("") || `<p class="fz-sin">No hay cuentas. Dale "Actualizar cuentas" en Integraciones.</p>`}
        <button type="button" class="fz-btn chico" onclick="fzCuentasAbrir(false)">Listo</button>
      </div>` : ""}
    </div>`;
}

function estadoMeta() {
  const elegidas = st.config?.metaCuentas || [];
  if (!st.meta.estado?.conectado) return `<small class="fz-cta-ayuda">Sin Meta conectado la pauta la llenas a mano.</small>`;
  if (!elegidas.length) return `<small class="fz-cta-ayuda">Elige al menos una; el gasto se suma.</small>`;
  const s = st.meta.sync;
  const cuentas = st.meta.estado.cuentas || [];
  const otra = cuentas.some(c => elegidas.includes(c.account_id) && c.currency && c.currency !== MONEDA_PAIS[st.pais]);
  const errores = (s?.cuentas || []).filter(c => c.error);
  return `<small class="fz-cta-ayuda">
      ${st.meta.cargando ? `<i data-lucide="loader" class="gira"></i> Trayendo el gasto de Meta…` : st.meta.error ? `<span class="rojo">${esc(st.meta.error)}</span>` : s ? `<span class="fz-ok">●</span> Gasto de Meta al día · ${hace(s.actualizado)} <button type="button" class="fz-link" onclick="fzMetaSync(true)">Actualizar</button>` : "Elige al menos una; el gasto se suma."}
      ${errores.length ? `<br><span class="rojo">No se pudo leer: ${errores.map(e => esc(e.name)).join(", ")}</span>` : ""}
    </small>
    ${otra ? `<label class="fz-trm">1 USD = <input type="number" min="100" step="0.5" value="${st.config?.trm || ""}" placeholder="${s?.trm || "TRM"}" onchange="fzTrm(this.value)"> COP <small>${st.config?.trm ? "tu TRM · borra para usar la del día" : s?.trmFuente ? `TRM ${esc(s.trmFuente)}` : "TRM del día"}</small></label>` : ""}`;
}

function cabecera(titulo, desc, icono) {
  const c = st.config || {};
  const origen = st.origen;
  return `
  <header class="fz-head">
    <div>
      <h1><i data-lucide="${icono}"></i> ${titulo}</h1>
      <p>${desc}</p>
    </div>
  </header>
  <section class="fz-card fz-fuente">
    <p class="fz-fuente-intro">Conecta <b>Dropi</b> y <b>Meta</b> en <a href="#/integraciones" onclick="goTo('integraciones');return false">Integraciones</a>, elige tu cuenta de Dropi y de Meta a continuación para que los datos se llenen automáticamente.</p>
    <div class="fz-fuente-grid">
      <div class="fz-fuente-col">
        <span class="fz-fuente-tit">ORIGEN DE LOS DATOS</span>
        <label class="fz-sel-caja">
          <span class="fz-sel-ico"><i data-lucide="database"></i></span>
          <select onchange="fzOrigen(this.value)">
            <option value="" ${origen ? "" : "selected"} disabled>Elige un origen...</option>
            <option value="CO" ${origen === "CO" ? "selected" : ""}>🇨🇴 Reporte Dropi (Excel) · Colombia${origen === "CO" && c.cuenta ? ` · ${esc(c.cuenta)}` : ""}</option>
            <option value="EC" ${origen === "EC" ? "selected" : ""}>🇪🇨 Reporte Dropi (Excel) · Ecuador${origen === "EC" && c.cuenta ? ` · ${esc(c.cuenta)}` : ""}</option>
            <option value="api" disabled>🔌 Cuenta Dropi conectada · pronto</option>
          </select>
          <i data-lucide="chevron-down"></i>
        </label>
        ${origen ? `
        <div class="fz-origen-fila">
          <div class="fz-origen-info">
            ${c.desde
              ? `<span class="fz-ok">● ${st.lineas.length ? new Set(st.lineas.map(l => l.ordenId)).size : 0} pedidos del ${fechaCorta(c.desde)} al ${fechaCorta(c.hasta)}</span><small>Última carga ${hace(c.ultimaImportacion)}</small>`
              : `<span class="fz-vacio-txt">Aún no hay pedidos de ${PAIS_NOMBRE[st.pais]}. Sube el Excel de Dropi.</span>`}
          </div>
          <label class="fz-btn ${c.desde ? "claro" : ""} chico">
            <i data-lucide="upload"></i> ${c.desde ? "Actualizar Excel" : "Subir Excel de Dropi"}
            <input type="file" accept=".xlsx" hidden onchange="fzSubirExcel(this)">
          </label>
        </div>` : ""}
      </div>
      <div class="fz-fuente-col">
        <span class="fz-fuente-tit"><span class="fz-meta-logo">∞</span> CUENTAS PUBLICITARIAS <small>de aquí sale el gasto de Meta</small></span>
        ${origen ? selectorCuentas() : `<div class="fz-cta-caja apagada"><span class="fz-cta-ico">∞</span><span class="fz-cta-txt fz-placeholder">Elige cuenta(s)...</span><i data-lucide="chevron-down"></i></div>`}
        ${origen ? estadoMeta() : `<small class="fz-cta-ayuda">Elige al menos una; el gasto se suma.</small>`}
      </div>
    </div>
    ${origen ? `
    <details class="fz-ayuda">
      <summary>¿Qué Excel subo?</summary>
      <p>En Dropi → <b>Mis pedidos</b> → descarga el reporte <b>"órdenes con productos"</b> del rango que quieras (por ejemplo el mes). Puedes subirlo las veces que quieras: los pedidos se <b>actualizan</b> (cambian de estado), no se duplican.
      Los datos de tus clientes (nombre, teléfono, documento, dirección) <b>no se suben</b>: el Excel se lee aquí en tu navegador y solo se envían las columnas de pedidos.
      Cuando Dropi active la integración CoDropX, esto se llenará solo.</p>
    </details>` : `
    <div class="fz-elige">
      <b>ELIGE UN ORIGEN ARRIBA PARA CONTINUAR</b>
      <p>Reporte mensual Dropi (tu Excel) o una cuenta Dropi.<br>Elige una cuenta publicitaria para llenar su gasto automáticamente, de lo contrario llena la pauta manualmente.</p>
    </div>`}
  </section>`;
}

window.fzOrigen = async (v) => {
  if (v !== "CO" && v !== "EC") return;
  st.origen = v;
  try { localStorage.setItem("fz_origen", v); } catch {}
  await window.fzPais(v);
};

window.fzCuentasAbrir = (abrir) => {
  st.meta.abierto = abrir === undefined ? !st.meta.abierto : !!abrir;
  rePintar();
  if (!st.meta.abierto && st.meta.pendiente) { st.meta.pendiente = false; fzMetaSync(true); }
};

window.fzCuenta = async (id, marcada) => {
  const set = new Set(st.config?.metaCuentas || []);
  if (marcada) set.add(id); else set.delete(id);
  try {
    const r = await api("PUT", "/api/finanzas/config", { pais: st.pais, metaCuentas: [...set] });
    st.config.metaCuentas = r.metaCuentas;
    st.meta.sync = null;
    st.meta.pendiente = true;   // se trae el gasto al cerrar la lista
    rePintar();
  } catch (err) { avisar(err.message, "error"); }
};

window.fzTrm = async (v) => {
  try {
    const r = await api("PUT", "/api/finanzas/config", { pais: st.pais, trm: Number(v) });
    st.config.trm = r.trm;
    await fzMetaSync(false);
  } catch (err) { avisar(err.message, "error"); }
};

// Rango a traer de Meta: lo que se está viendo (día elegido + vista por rango), hasta hoy
function rangoMeta() {
  const hoy = hoyISO();
  const fechas = [sumarDias(hoy, -30), st.dia || hoy, rangoFechas()[0]].filter(Boolean).sort();
  return { desde: fechas[0], hasta: hoy };
}

async function metaSync(forzar = false) {
  if (!st.origen || !st.meta.estado?.conectado || !(st.config?.metaCuentas || []).length) { st.meta.sync = null; return; }
  const { desde, hasta } = rangoMeta();
  const pais = st.pais;
  st.meta.cargando = true; st.meta.error = "";
  rePintar();
  try {
    const r = await api("POST", "/api/finanzas/meta/sincronizar", { pais: st.pais, desde, hasta, forzar });
    if (pais !== st.pais) return;
    // La pauta de ese rango se reemplaza por la que quedó guardada
    for (const k of Object.keys(st.pauta)) { const f = k.slice(0, 10); if (f >= r.desde && f <= r.hasta) delete st.pauta[k]; }
    for (const p of r.pauta || []) st.pauta[`${p.fecha}|${p.clave}`] = p;
    st.meta.sync = r; st.meta.rango = { desde: r.desde, hasta: r.hasta };
  } catch (err) {
    st.meta.error = err.message;
  } finally {
    st.meta.cargando = false;
    rePintar();
  }
}
window.fzMetaSync = (forzar) => metaSync(!!forzar);

// Si te vas a un día más viejo de lo que ya se trajo, se trae
function metaAlDia() {
  const r = st.meta.rango;
  if (!st.meta.cargando && st.meta.sync && r && st.dia && st.dia < r.desde) metaSync(false);
}

function sinOrigen(view, titulo, icono) {
  view.innerHTML = `<div class="fz-page">${cabecera(titulo, "Elige de dónde salen tus pedidos y tu gasto en publicidad.", icono)}</div>`;
  iconos();
}

function rePintar() {
  const view = $("view");
  if (!view || !st.pagina) return;
  const y = window.scrollY;
  PAGINAS[st.pagina](view);
  window.scrollTo(0, y);
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
    if (st.origen && st.pais !== st.origen) st.pais = st.origen;
    await cargar(forzar);
    PAGINAS[st.pagina](view);
    if (st.origen && !st.meta.sync && !st.meta.cargando) metaSync(false);
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

  if (!st.origen) return sinOrigen(view, "Control Diario", "calendar-check");
  view.innerHTML = `
  <div class="fz-page">
    ${cabecera("Control Diario", "Tu <b>utilidad real diaria</b> por producto: cruza tus pedidos, cancelaciones y devoluciones de Dropi con lo que gastaste en pauta.", "calendar-check")}
    ${guiaControl()}
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
      <p class="fz-mini">${c.dias.includes(st.dia) ? `Pedidos de este día traídos del Excel de Dropi.` : `Este día no tiene pedidos en tus Excel.`} ${(c.metaCuentas || []).length && st.meta.estado?.conectado ? `El gasto de Meta se trae solo de tus cuentas publicitarias.` : `La pauta la escribes en la lista (o elige tus cuentas publicitarias arriba y se trae sola).`}</p>
    </section>

    <div class="fz-acciones">
      <h2>${nombreDia(st.dia)} <span>${fechaCorta(st.dia)}</span></h2>
      <div>
        ${(c.metaCuentas || []).length && st.meta.estado?.conectado ? `<span class="fz-tip" data-tip="Revisa el gasto de Meta del ${fechaCorta(st.dia)} antes de que entre a tus números"><button class="fz-btn claro fz-btn-meta" onclick="fzRevisar()" ${st.meta.cargando ? "disabled" : ""}><span class="fz-meta-logo">∞</span> Actualizar Pauta</button></span>` : ""}
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
                <td class="n">${celdaMeta(f, i)}</td>
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

    ${avisoMetaDia()}

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

// Celda Meta: si viene de Meta Ads se marca; si la escribiste tú, puedes volver a lo de Meta
function celdaMeta(f, i) {
  const p = st.pauta[`${st.dia}|${f.clave}`] || {};
  const conMeta = (st.config?.metaCuentas || []).length && st.meta.estado?.conectado;
  return `<span class="fz-input ${p.metaAuto ? "auto" : ""}" title="${p.metaAuto ? "Traído de Meta Ads. Si lo cambias, queda el tuyo." : ""}">$<input type="number" min="0" step="any" value="${f.meta || ""}" placeholder="0" onchange="fzPauta(${i}, 'meta', this.value)">${p.metaAuto ? `<em class="fz-meta-tag">∞</em>` : ""}</span>${conMeta && p.metaManual ? `<button class="fz-icono" title="Volver al gasto de Meta" onclick="fzVolverMeta(${i})"><i data-lucide="rotate-ccw"></i></button>` : ""}`;
}

window.fzVolverMeta = async (i) => {
  const fila = filasDelDia()[i];
  if (!fila) return;
  try {
    await guardarPauta(fila, { metaAuto: true });
    await metaSync(false);
  } catch (err) { avisar(err.message, "error"); }
};

// ---------- Guía ----------
function guiaControl() {
  let abierta = true;
  try { abierta = localStorage.getItem("fz_guia") !== "0"; } catch {}
  return `
  <details class="fz-card fz-guiacd" ${abierta ? "open" : ""} ontoggle="try{localStorage.setItem('fz_guia', this.open ? '1' : '0')}catch{}">
    <summary><i data-lucide="help-circle"></i> ¿Cómo llenar mi control diario? <span class="fz-guia-tag">guía rápida</span></summary>
    <ol class="fz-guia-pasos">
      <li><b>Elige de dónde salen tus pedidos</b>: tu reporte de Dropi en Excel (Colombia o Ecuador). Súbelo cuando quieras: los pedidos se actualizan, no se duplican.</li>
      <li><b>Elige tus cuentas publicitarias y pulsa «Actualizar Pauta»</b>: revisa campaña por campaña a qué producto va (CoDropX te sugiere por el nombre y el link del anuncio). Pulsa <b>«Guardar pauta»</b>: nada entra a tus números antes.</li>
      <li><b>Llena a mano el gasto de TikTok</b> en su casilla de la lista de productos. La tabla de control diario se llena sola.</li>
    </ol>
    <div class="fz-guia-tips">
      <p><i data-lucide="combine"></i><span>Si vendes el mismo producto de <b>varios proveedores</b>, Dropi lo guarda con nombres distintos. Únelos en <b>Agrupar productos</b> y cuentan como uno solo.</span></p>
      <p><i data-lucide="repeat"></i><span>Las campañas que asignas quedan guardadas: los <b>demás días se llenan solos</b> con esa misma asignación. Las nuevas te esperan en «Actualizar Pauta».</span></p>
    </div>
  </details>`;
}

// ---------- Aviso del día: lo de Meta que falta revisar ----------
function avisoMetaDia() {
  const s = st.meta.sync;
  if (!s?.campanas || st.dia < s.desde || st.dia > s.hasta) return "";
  const hoy = s.campanas.filter(c => (c.dias || {})[st.dia] > 0);
  if (!hoy.length) return "";
  const pendiente = hoy.filter(c => c.origen !== "manual" && c.origen !== "ignorada");
  const total = hoy.reduce((a, c) => a + c.dias[st.dia], 0);
  const falta = pendiente.reduce((a, c) => a + c.dias[st.dia], 0);
  if (!pendiente.length) return `<p class="fz-meta-ok"><span class="fz-meta-logo">∞</span> Pauta de Meta del ${fechaCorta(st.dia)} revisada: ${$$(total)} en ${hoy.length} campaña${hoy.length === 1 ? "" : "s"}. <button class="fz-link" onclick="fzRevisar()">Ver</button></p>`;
  return `<button class="fz-meta-pend" onclick="fzRevisar()"><span class="fz-meta-logo">∞</span> <span><b>${$$(falta)}</b> de Meta del ${fechaCorta(st.dia)} sin revisar (${pendiente.length} campaña${pendiente.length === 1 ? "" : "s"}) · aún no cuentan en tu utilidad</span> <b class="fz-meta-pend-cta">Actualizar Pauta →</b></button>`;
}

// =============================================
// VENTANA "REVISA EL GASTO DE META" (un día)
// Nada entra a tus números hasta "Guardar pauta"
// =============================================
const rev = { abierta: false };

window.fzRevisar = async () => {
  if (!st.meta.sync || st.dia < (st.meta.rango?.desde || "") || st.dia > (st.meta.rango?.hasta || "")) await metaSync(false);
  const s = st.meta.sync;
  if (!s) return avisar(st.meta.error || "No se pudo traer el gasto de Meta", "error");
  const cuentas = Object.fromEntries((st.meta.estado?.cuentas || []).map(c => [c.account_id, c.name]));
  rev.fecha = st.dia;
  rev.monedaPais = s.moneda; rev.ver = s.moneda; rev.trm = s.trm; rev.trmFuente = s.trmFuente;
  rev.filas = s.campanas.filter(c => (c.dias || {})[st.dia] > 0).map(c => {
    const clave = c.origen === "ignorada" ? "x" : (c.clave || "");
    return { id: c.id, nombre: c.nombre, cuenta: cuentas[c.account_id] || c.account_id, moneda: c.moneda, link: c.link || "", linkProducto: c.linkProducto,
      original: (c.diasOriginal || {})[st.dia] || 0, meta: c.dias[st.dia], gasto: c.dias[st.dia], editado: false,
      clave, claveInicial: clave, origen: c.origen };
  }).sort((a, b) => b.gasto - a.gasto);
  rev.productos = (s.productos || []).slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  rev.tab = rev.filas.some(f => !f.clave) ? "sin" : "asig";
  rev.buscar = ""; rev.sel = new Set(); rev.producto = "";
  rev.abierta = true;
  pintarRev(true);
};

const nombreProd = (clave) => rev.productos.find(p => p.clave === clave)?.nombre || nombreDe(clave);
const verMonto = (v) => rev.ver === rev.monedaPais ? v : rev.ver === "USD" ? v / rev.trm : v * rev.trm;
const deVer = (v) => rev.ver === rev.monedaPais ? v : rev.ver === "USD" ? v * rev.trm : v / rev.trm;
const fmtVer = (v) => rev.ver === "USD" ? `$${(Number(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${Math.round(Number(v) || 0).toLocaleString("es-CO")}`;
const tabDe = (f) => (!f.clave ? "sin" : f.clave === "x" ? "otras" : "asig");

function pintarRev(entero = false) {
  let el = $("fzRev");
  if (!rev.abierta) { el?.remove(); document.body.classList.remove("fz-sin-scroll"); return; }
  if (!el || entero) {
    el?.remove();
    el = document.createElement("div");
    el.id = "fzRev"; el.className = "fz-rev-fondo";
    el.onclick = (e) => { if (e.target === el) fzRevCerrar(); };
    el.innerHTML = `
    <div class="fz-rev" role="dialog" aria-modal="true" aria-label="Revisa el gasto de Meta">
      <header class="fz-rev-head">
        <div><h2>Revisa el gasto de Meta</h2><p>Cada campaña va a un producto. Nada entra a tus números hasta que guardes. <b>${fechaCorta(rev.fecha)}</b></p></div>
        <div class="fz-rev-moneda" id="fzRevMoneda"></div>
        <button class="fz-rev-x" onclick="fzRevCerrar()" title="Cerrar"><i data-lucide="x"></i></button>
      </header>
      <div class="fz-rev-kpis" id="fzRevKpis"></div>
      <div class="fz-rev-cuerpo">
        <section class="fz-rev-camp">
          <div class="fz-rev-camp-head"><b>CAMPAÑAS DE META</b><label class="fz-rev-buscar"><i data-lucide="search"></i><input type="search" placeholder="Buscar campaña..." oninput="fzRevBuscar(this.value)"></label></div>
          <div class="fz-rev-tabs" id="fzRevTabs"></div>
          <div class="fz-rev-masivo" id="fzRevMasivo"></div>
          <div class="fz-rev-lista" id="fzRevLista"></div>
        </section>
        <aside class="fz-rev-prod"><div class="fz-rev-prod-head"><b>TUS PRODUCTOS</b><small>pulsa uno para ver lo suyo · arrastra campañas aquí</small></div><div id="fzRevProd"></div></aside>
      </div>
      <footer class="fz-rev-pie">
        <button class="fz-btn claro fz-rev-volver" onclick="fzRevVolver()"><i data-lucide="rotate-ccw"></i> Volver a los datos de Meta</button>
        <span></span>
        <button class="fz-btn claro" onclick="fzRevCerrar()">Cancelar</button>
        <button class="fz-btn" id="fzRevGuardar" onclick="fzRevGuardar()"><i data-lucide="check"></i> Guardar pauta</button>
      </footer>
    </div>`;
    document.body.appendChild(el);
    document.body.classList.add("fz-sin-scroll");
  }
  // Moneda
  $("fzRevMoneda").innerHTML = rev.monedaPais === "COP" || rev.filas.some(f => f.moneda !== rev.monedaPais)
    ? `<div class="fz-seg">${["COP", "USD"].map(m => `<button class="${rev.ver === m ? "on" : ""}" onclick="fzRevMonedaVer('${m}')">${m}</button>`).join("")}</div><small>1 USD = ${Number(rev.trm).toLocaleString("es-CO", { maximumFractionDigits: 2 })} COP${rev.trmFuente ? ` · ${esc(rev.trmFuente)}` : ""}</small>` : "";
  // KPIs
  const suma = (arr) => arr.reduce((a, f) => a + f.gasto, 0);
  const asignada = suma(rev.filas.filter(f => tabDe(f) === "asig")), sinAsig = suma(rev.filas.filter(f => tabDe(f) === "sin"));
  $("fzRevKpis").innerHTML = `
    <div><small>CAMPAÑAS</small><b>${rev.filas.length}</b></div>
    <div><small>PAUTA TOTAL</small><b>${fmtVer(verMonto(suma(rev.filas)))}</b></div>
    <div class="verde"><small>ASIGNADA</small><b>${fmtVer(verMonto(asignada))}</b></div>
    <div class="${sinAsig > 0 ? "alerta" : ""}"><small>SIN ASIGNAR</small><b>${fmtVer(verMonto(sinAsig))}</b></div>`;
  // Pestañas
  const q = normalizar(rev.buscar);
  const visibles = rev.filas.filter(f => (!q || normalizar(f.nombre).includes(q)) && (!rev.producto || f.clave === rev.producto));
  const cuenta = (t) => visibles.filter(f => tabDe(f) === t).length;
  $("fzRevTabs").innerHTML = [["sin", "Sin asignar"], ["asig", "Ya asignadas"], ["otras", "Otras"]].map(([k, tx]) =>
    `<button class="${rev.tab === k ? "on" : ""} ${k}" onclick="fzRevTab('${k}')">${tx} <em>${cuenta(k)}</em></button>`).join("")
    + (rev.producto ? `<span class="fz-rev-filtro">${esc(nombreProd(rev.producto))} <button onclick="fzRevProducto('')" title="Quitar filtro">×</button></span>` : "");
  // Lista
  const filas = visibles.filter(f => tabDe(f) === rev.tab);
  const opciones = (f) => `<option value="" ${!f.clave ? "selected" : ""}>Sin asignar...</option>${rev.productos.map(p => `<option value="${esc(p.clave)}" ${f.clave === p.clave ? "selected" : ""}>${esc(p.nombre)}</option>`).join("")}<option value="x" ${f.clave === "x" ? "selected" : ""}>Otras (no es de un producto)</option>`;
  $("fzRevLista").innerHTML = filas.map(f => {
    const i = rev.filas.indexOf(f);
    return `
    <div class="fz-rev-fila ${rev.sel.has(i) ? "sel" : ""}" draggable="true" ondragstart="fzRevArrastrar(event, ${i})">
      <input type="checkbox" ${rev.sel.has(i) ? "checked" : ""} onchange="fzRevSel(${i}, this.checked)" aria-label="Seleccionar">
      <span class="fz-rev-asa" title="Arrastra a un producto"><i data-lucide="grip-vertical"></i></span>
      <div class="fz-rev-nombre">
        <b>${esc(f.nombre)}</b>
        <span class="fz-rev-tags">
          ${f.linkProducto === false ? `<span class="fz-rtag rojo" title="${esc(f.link)}"><i data-lucide="ban"></i> Link sin producto</span>` : f.linkProducto ? `<span class="fz-rtag azul" title="${esc(f.link)}"><i data-lucide="link"></i> Link a producto</span>` : ""}
          ${f.clave && f.clave !== "x" && f.origen === "auto" && f.clave === f.claveInicial ? `<span class="fz-rtag sug">sugerida</span>` : ""}
          ${f.editado ? `<span class="fz-rtag edit">editado</span>` : ""}
          <small>${esc(f.cuenta)}${f.moneda !== rev.monedaPais ? ` · ${esc(f.moneda)} ${f.moneda === "USD" ? "$" + f.original.toFixed(2) : Math.round(f.original).toLocaleString("es-CO")}` : ""}</small>
        </span>
      </div>
      <label class="fz-rev-monto">$<input type="number" min="0" step="any" value="${rev.ver === "USD" ? verMonto(f.gasto).toFixed(2) : Math.round(verMonto(f.gasto))}" onchange="fzRevMonto(${i}, this.value)"></label>
      <select onchange="fzRevAsignar(${i}, this.value)">${opciones(f)}</select>
      ${f.clave === "x" ? `<button class="fz-rev-quitar" title="Volver a sin asignar" onclick="fzRevAsignar(${i}, '')"><i data-lucide="undo-2"></i></button>`
        : `<button class="fz-rev-quitar" title="Mandar a Otras" onclick="fzRevAsignar(${i}, 'x')"><i data-lucide="x"></i></button>`}
    </div>`;
  }).join("") || `<p class="fz-rev-vacio">${rev.tab === "sin" ? (rev.filas.length ? "¡Todo asignado! 🎉" : "Meta no tiene gasto este día en tus cuentas elegidas.") : rev.tab === "asig" ? "Aún no hay campañas asignadas." : "Aquí van las campañas que no son de un producto (marca, pruebas, etc.)."}</p>`;
  // Masivo
  $("fzRevMasivo").innerHTML = rev.sel.size ? `<b>${rev.sel.size} seleccionada${rev.sel.size === 1 ? "" : "s"}</b> → <select onchange="fzRevAsignarSel(this.value)"><option value="">Asignar a...</option>${rev.productos.map(p => `<option value="${esc(p.clave)}">${esc(p.nombre)}</option>`).join("")}<option value="x">Otras</option></select> <button class="fz-link" onclick="fzRevSelTodo(false)">Quitar selección</button>`
    : filas.length > 1 ? `<button class="fz-link" onclick="fzRevSelTodo(true)">Seleccionar las ${filas.length}</button>` : "";
  // Productos: los que vendieron ese día + los que ya tienen campañas
  const delDia = new Set(controlDiario(st.lineas, { desde: rev.fecha, hasta: rev.fecha, grupos: grupos(), devPct: 0 }).filter(f => f.pedidos).map(f => f.clave));
  rev.filas.forEach(f => { if (f.clave && f.clave !== "x") delDia.add(f.clave); });
  const prods = [...delDia].map(clave => ({ clave, nombre: nombreProd(clave), gasto: suma(rev.filas.filter(f => f.clave === clave)), n: rev.filas.filter(f => f.clave === clave).length }))
    .sort((a, b) => b.gasto - a.gasto || a.nombre.localeCompare(b.nombre, "es"));
  $("fzRevProd").innerHTML = prods.length ? prods.map(p => `
    <button class="fz-rev-p ${rev.producto === p.clave ? "on" : ""} ${p.n ? "" : "sin"}" onclick="fzRevProducto('${esc(p.clave)}')"
      ondragover="event.preventDefault(); this.classList.add('drop')" ondragleave="this.classList.remove('drop')" ondrop="fzRevSoltar(event, '${esc(p.clave)}')">
      <span><b>${esc(p.nombre)}</b><small>${p.n ? `${p.n} campaña${p.n === 1 ? "" : "s"}` : "sin campañas"}</small></span>
      <em>${p.n ? fmtVer(verMonto(p.gasto)) : "—"}</em>
    </button>`).join("") : `<p class="fz-rev-vacio">Este día no tiene productos todavía. Aparecerán al asignarles campañas.</p>`;
  iconos();
}

const normalizar = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
window.fzRevCerrar = () => { rev.abierta = false; pintarRev(); };
window.fzRevTab = (t) => { rev.tab = t; rev.sel.clear(); pintarRev(); };
window.fzRevBuscar = (v) => { rev.buscar = v; pintarRev(); };
window.fzRevMonedaVer = (m) => { rev.ver = m; pintarRev(); };
window.fzRevProducto = (clave) => { rev.producto = rev.producto === clave ? "" : clave; if (rev.producto) rev.tab = "asig"; pintarRev(); };
window.fzRevSel = (i, v) => { if (v) rev.sel.add(i); else rev.sel.delete(i); pintarRev(); };
window.fzRevSelTodo = (v) => {
  rev.sel.clear();
  if (v) { const q = normalizar(rev.buscar); rev.filas.forEach((f, i) => { if (tabDe(f) === rev.tab && (!q || normalizar(f.nombre).includes(q)) && (!rev.producto || f.clave === rev.producto)) rev.sel.add(i); }); }
  pintarRev();
};
window.fzRevAsignar = (i, clave) => { const f = rev.filas[i]; if (!f) return; f.clave = clave; rev.sel.delete(i); pintarRev(); };
window.fzRevAsignarSel = (clave) => { if (!clave) return; for (const i of rev.sel) rev.filas[i].clave = clave; rev.sel.clear(); pintarRev(); };
window.fzRevMonto = (i, v) => {
  const f = rev.filas[i]; if (!f) return;
  const n = Math.max(0, deVer(Number(v) || 0));
  f.gasto = n; f.editado = Math.abs(n - f.meta) > (rev.monedaPais === "USD" ? 0.005 : 0.5);
  pintarRev();
};
window.fzRevArrastrar = (e, i) => { e.dataTransfer.setData("text/plain", String(i)); e.dataTransfer.effectAllowed = "move"; };
window.fzRevSoltar = (e, clave) => {
  e.preventDefault(); e.currentTarget.classList.remove("drop");
  const i = Number(e.dataTransfer.getData("text/plain"));
  const lote = rev.sel.has(i) ? [...rev.sel] : [i];
  for (const k of lote) if (rev.filas[k]) rev.filas[k].clave = clave;
  rev.sel.clear(); pintarRev();
};
window.fzRevVolver = () => {
  for (const f of rev.filas) { f.gasto = f.meta; f.editado = false; f.clave = f.claveInicial; }
  rev.sel.clear(); pintarRev();
  avisar("Volviste a los datos de Meta (aún sin guardar)");
};
window.fzRevGuardar = async () => {
  const btn = $("fzRevGuardar"); if (btn) btn.disabled = true;
  try {
    const nombres = {};
    for (const f of rev.filas) if (f.clave && f.clave !== "x") nombres[f.clave] = nombreProd(f.clave);
    const r = await api("POST", "/api/finanzas/meta/guardar", {
      pais: st.pais, fecha: rev.fecha, nombres,
      asignaciones: rev.filas.map(f => ({ campanaId: f.id, clave: f.clave, gasto: Math.round(f.gasto * 100) / 100, editado: f.editado }))
    });
    for (const k of Object.keys(st.pauta)) if (k.startsWith(rev.fecha + "|")) { const p = st.pauta[k]; if (p.metaAuto || p.metaManual) delete st.pauta[k]; }
    for (const p of r.pauta || []) st.pauta[`${p.fecha}|${p.clave}`] = p;
    rev.abierta = false; pintarRev();
    avisar(`Pauta del ${fechaCorta(r.fecha)} guardada ✓`);
    await metaSync(false);
  } catch (err) {
    avisar(err.message, "error");
    if (btn) btn.disabled = false;
  }
};
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && rev.abierta) fzRevCerrar(); });

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

window.fzRango = (m) => { st.rango.modo = m; renderControl($("view")); metaRango(); };
window.fzRangoFecha = (k, v) => { st.rango[k] = v; renderControl($("view")); metaRango(); };
function metaRango() { const r = st.meta.rango; if (!st.meta.cargando && st.meta.sync && r && rangoFechas()[0] < r.desde) metaSync(false); }
window.fzRangoProducto = (v) => { st.rango.clave = v; renderControl($("view")); };
window.fzRangoTotal = (v) => { st.rango.porProducto = v; renderControl($("view")); };

// ---------- Día ----------
window.fzIrDia = (v) => { if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { st.dia = v; renderControl($("view")); metaAlDia(); } };
window.fzDia = (dir) => {
  const dias = st.config?.dias || [];
  const sig = dir > 0 ? dias.find(d => d > st.dia) : [...dias].reverse().find(d => d < st.dia);
  st.dia = sig || sumarDias(st.dia, dir);
  renderControl($("view"));
  metaAlDia();
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
  const op = operativosPeriodo(desde, hasta);
  const r = c?.desde ? reporteFinanciero(st.lineas, { desde, hasta, clave: R.clave, grupos: grupos(), gastoMeta: gasto.meta, gastoTiktok: gasto.tiktok, costosOperativos: R.clave ? 0 : op.total, referenciaEntrega: R.referencia }) : null;
  const salud = !r ? "" : r.margenNeto >= 30 ? ["ok", "MARGEN SALUDABLE"] : r.margenNeto >= 10 ? ["warn", "MARGEN AJUSTADO"] : ["mal", "MARGEN EN RIESGO"];
  const maxDia = r ? Math.max(1, ...r.porDia.map(([, v]) => v)) : 1;

  if (!st.origen) return sinOrigen(view, "Reporte Financiero", "bar-chart-3");
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
      <button class="fz-btn claro chico" onclick="fzExportarReporte()"><i data-lucide="download"></i> Exportar</button>
    </section>

    <section class="fz-salud ${salud[0]}"><span><i data-lucide="trending-up"></i> ${salud[1]}</span><b>${pct(r.margenNeto)} <small>MARGEN NETO</small></b></section>

    <div class="fz-kpis">
      <div class="fz-kpi"><small>TOTAL DE PEDIDOS</small><b>${r.pedidos}</b><span>${r.transito} en tránsito · ${r.novedades} novedad${r.novedades === 1 ? "" : "es"} por gestionar</span></div>
      <div class="fz-kpi"><small>TASA DE ENTREGA</small><b class="${r.tasaEntrega < (c.metaEntrega || 70) ? "rojo" : "verde"}">${pct(r.tasaEntrega)}</b><span>${r.entregados} entregados de ${r.despachados} despachados</span></div>
      <div class="fz-kpi"><small>TOTAL FACTURADO</small><b>${$$(r.facturado)}</b><span>de los pedidos despachados (${pct(r.pedidos ? r.despachados / r.pedidos * 100 : 0)} de tus pedidos salieron)</span></div>
      <div class="fz-kpi"><small>VALOR ENTREGADO</small><b>${$$(r.valorEntregado)}</b><span>${r.entregados} entregados: lo que entra a la wallet</span></div>
      <div class="fz-kpi"><small>GANANCIA BRUTA</small><b>${$$s(r.gananciaBruta)}</b><span>wallet menos costo de devoluciones · margen ${pct(r.margenBruto)} sobre lo entregado</span></div>
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
          ${R.clave ? "" : `<dt>Costos operativos <small>${op.total ? "Shopify, apps, salarios… (abajo)" : "aún no registras ninguno (abajo)"}</small></dt><dd>${$$(r.operativos)}</dd>`}
          <dt class="total">Ganancia neta <small>margen ${pct(r.margenNeto)} · incluye publicidad${R.clave ? "" : " y costos operativos"}</small></dt><dd class="total ${r.gananciaNeta < 0 ? "rojo" : "verde"}">${$$s(r.gananciaNeta)}</dd>
        </dl>
        ${r.publicidad === 0 ? `<p class="fz-mini">La publicidad sale de lo que escribas en el Control Diario (o de Meta cuando esté conectado).</p>` : ""}
        ${r.escenarios ? `<p class="fz-mini">Ojo: ${r.escenarios.rodando} pedidos siguen rodando. Mira abajo en <b>Simulador de escenarios</b> cómo cerraría el periodo.</p>` : ""}
        </div>
      </section>
    </div>

    ${R.clave ? "" : seccionCostosOp(desde, hasta, op)}
    ${seccionDesglose(r)}
    ${seccionEscenarios(r, R)}
    ${R.clave ? "" : seccionRentabilidad(desde, hasta)}

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

// ---------- Costos operativos: Shopify, checkout, IA, edición, salarios... (por mes) ----------
const MONEDA_LOCAL = () => MONEDA_PAIS[st.pais];
const trmUso = () => Number(st.config?.trm || st.config?.trmDia || st.meta.sync?.trm) || 4000;
const aLocal = (v, moneda) => moneda === MONEDA_LOCAL() ? v : moneda === "USD" ? v * trmUso() : v / trmUso();
const costosOp = () => st.config?.costosOperativos || [];
// "Todo el reporte" cuenta los meses completos; en un rango más corto, la parte de esos días
function operativosPeriodo(desde, hasta) {
  return costosPeriodo(costosOp(), { desde, hasta, completos: st.rep.periodo === "todo", convertir: aLocal });
}
function reporteActual(desde, hasta) {
  const gasto = gastoRango(desde, hasta, st.rep.clave);
  return reporteFinanciero(st.lineas, { desde, hasta, clave: st.rep.clave, grupos: grupos(), gastoMeta: gasto.meta, gastoTiktok: gasto.tiktok, costosOperativos: st.rep.clave ? 0 : operativosPeriodo(desde, hasta).total, referenciaEntrega: st.rep.referencia });
}
const NOMBRE_MES = (mes) => new Date(mes + "-15T12:00:00Z").toLocaleDateString("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).replace(/^\w/, c => c.toUpperCase());

function seccionCostosOp(desde, hasta, op) {
  const meses = mesesEntre(desde, hasta);
  if (!meses.length) return "";
  const mes = meses.includes(st.rep.mesCostos) ? st.rep.mesCostos : meses[meses.length - 1];
  const filas = costosOp().filter(x => x.mes === mes);
  const info = op.meses.find(x => x.mes === mes);
  const otraMoneda = MONEDA_LOCAL() === "COP" ? "USD" : "COP";
  const hayOtra = filas.some(x => x.moneda !== MONEDA_LOCAL());
  return `
  <section class="fz-card" id="fzCostosOp" onfocusout="fzCostosSalir(event)">
    <h3><i data-lucide="building-2"></i> Costos operativos</h3>
    <p class="fz-mini">Lo que pagas para tener la tienda andando: suscripción de Shopify, checkout (Releasit u otro), apps, herramientas de IA, edición de videos, salarios… Se anotan por mes y se restan solos en el <b>Resultado neto</b>.</p>
    ${meses.length > 1 ? `<div class="fz-chips">${meses.map(m => `<button class="fz-chip ${m === mes ? "activo" : ""}" onclick="fzCostosMes('${m}')">${NOMBRE_MES(m)}</button>`).join("")}</div>` : ""}
    <div class="fz-scroll"><table class="fz-tabla fz-costos">
      <thead><tr><th>Descripción · ${NOMBRE_MES(mes)}</th><th class="n">Valor</th><th>Moneda</th><th></th></tr></thead>
      <tbody>
        ${filas.map(x => `<tr>
          <td><input type="text" maxlength="80" value="${esc(x.desc)}" placeholder="Ej: Shopify, Releasit, salario…" onchange="fzCostoCambio('${x.id}', 'desc', this.value)"></td>
          <td class="n"><input type="number" min="0" step="any" value="${x.valor || ""}" placeholder="0" onchange="fzCostoCambio('${x.id}', 'valor', this.value)"></td>
          <td><select onchange="fzCostoCambio('${x.id}', 'moneda', this.value)">${[MONEDA_LOCAL(), otraMoneda].map(m => `<option ${x.moneda === m ? "selected" : ""}>${m}</option>`).join("")}</select></td>
          <td><button class="fz-x" title="Quitar" onclick="fzCostoQuitar('${x.id}')">×</button></td>
        </tr>`).join("") || `<tr><td colspan="4" class="fz-sin">Aún no anotas costos de ${NOMBRE_MES(mes).toLowerCase()}.</td></tr>`}
      </tbody>
      <tfoot><tr class="fz-total"><td><b>Total del mes</b></td><td class="n"><b id="fzCostosTotal">${$$(info?.delMes || 0)}</b></td><td colspan="2"></td></tr></tfoot>
    </table></div>
    <div class="fz-costos-acc">
      <button class="fz-btn claro chico" onclick="fzCostoAgregar('${mes}')"><i data-lucide="plus"></i> Agregar costo</button>
      ${meses.length === 1 && filas.length === 0 && costosOp().length ? `<button class="fz-btn claro chico" onclick="fzCostosCopiar('${mes}')"><i data-lucide="copy"></i> Copiar los del mes anterior</button>` : ""}
    </div>
    <p class="fz-mini">
      En este reporte cuentan <b>${$$(op.total)}</b>${op.meses.some(x => x.dias < x.diasMes && x.delMes) ? ` (la parte de los días que estás mirando: ${op.meses.filter(x => x.delMes).map(x => `${x.dias} de ${x.diasMes} días de ${NOMBRE_MES(x.mes).toLowerCase()}`).join(", ")})` : ""}.
      ${hayOtra ? `Lo que está en ${otraMoneda} se pasa con 1 USD = ${trmUso().toLocaleString("es-CO", { maximumFractionDigits: 2 })} COP${st.config?.trm ? " (tu TRM)" : st.config?.trmDia ? " (TRM del día)" : " (aproximada)"}.` : ""}
    </p>
  </section>`;
}

// pintar = false mientras escribes en la tabla: se repinta al salir de ella (si no, se pierde el foco)
async function guardarCostosOp(lista, pintar = true) {
  const previa = st.config.costosOperativos;
  st.config.costosOperativos = lista;
  if (pintar) rePintar();
  try {
    await api("PUT", "/api/finanzas/config", { pais: st.pais, costosOperativos: lista.filter(x => x.desc || x.valor > 0) });
  } catch (err) {
    st.config.costosOperativos = previa;
    rePintar();
    avisar(err.message, "error");
  }
}
const idNuevo = () => Math.random().toString(36).slice(2, 10);
window.fzCostosMes = (m) => { st.rep.mesCostos = m; rePintar(); };
window.fzCostoAgregar = (mes) => {
  st.rep.mesCostos = mes;
  st.config.costosOperativos = [...costosOp(), { id: idNuevo(), mes, desc: "", valor: 0, moneda: MONEDA_LOCAL() }];
  rePintar();
  const inputs = document.querySelectorAll("#fzCostosOp tbody input[type=text]");
  inputs[inputs.length - 1]?.focus();
};
let costosSinPintar = false;
window.fzCostoCambio = (id, campo, v) => {
  const valor = campo === "valor" ? Math.max(0, Number(v) || 0) : campo === "moneda" ? (v === "USD" ? "USD" : "COP") : String(v).trim().slice(0, 80);
  const lista = costosOp().map(x => (x.id === id ? { ...x, [campo]: valor } : x));
  costosSinPintar = true;
  guardarCostosOp(lista, false);
  const mes = lista.find(x => x.id === id)?.mes;
  const tot = $("fzCostosTotal");
  if (tot && mes) tot.textContent = $$(lista.filter(x => x.mes === mes).reduce((a, x) => a + aLocal(x.valor, x.moneda), 0));
};
window.fzCostosSalir = (e) => {
  if (!costosSinPintar || e.currentTarget.contains(e.relatedTarget)) return;
  costosSinPintar = false;
  rePintar();
};
window.fzCostoQuitar = (id) => guardarCostosOp(costosOp().filter(x => x.id !== id));
// Los costos fijos casi siempre se repiten: trae los del último mes que tenga
window.fzCostosCopiar = (mes) => {
  const antes = [...new Set(costosOp().map(x => x.mes).filter(m => m < mes))].sort().pop();
  if (!antes) return avisar("No hay costos de meses anteriores para copiar", "error");
  guardarCostosOp([...costosOp(), ...costosOp().filter(x => x.mes === antes).map(x => ({ ...x, id: idNuevo(), mes }))]);
  avisar(`Copiamos los costos de ${NOMBRE_MES(antes).toLowerCase()} ✓`);
};

// ---------- Exportar el reporte (CSV para Excel) ----------
window.fzExportarReporte = () => {
  const [desde, hasta] = periodo(st.rep.periodo, st.rep.desde, st.rep.hasta);
  const r = reporteActual(desde, hasta);
  const nombre = st.rep.clave ? nombreDe(st.rep.clave) : "Todos los productos";
  const filas = [
    ["Reporte Financiero CoDropX", `${PAIS_NOMBRE[st.pais]} (${MONEDA_LOCAL()})`], ["Producto", nombre], ["Desde", desde], ["Hasta", hasta], [],
    ["Pedidos", r.pedidos], ["Despachados", r.despachados], ["Entregados", r.entregados], ["En tránsito", r.transito], ["Novedades", r.novedades],
    ["Devoluciones", r.devoluciones], ["Cancelados", r.cancelados], ["Tasa de entrega %", r.tasaEntrega.toFixed(1)], [],
    ["Total facturado", Math.round(r.facturado)], ["Ingreso por entregados", Math.round(r.ingreso)], ["Costo productos entregados", Math.round(r.costoProductos)],
    ["Fletes de entregados", Math.round(r.fletesEntregados)], ["Costo devoluciones", Math.round(r.costoDevoluciones)], ["Ganancia bruta", Math.round(r.gananciaBruta)], [],
    ["Inversión Meta Ads", Math.round(r.gastoMeta)], ["Inversión TikTok Ads", Math.round(r.gastoTiktok)], ["Costos operativos", Math.round(r.operativos)],
    ["Ganancia neta", Math.round(r.gananciaNeta)], ["Margen neto %", r.margenNeto.toFixed(1)]
  ];
  if (!st.rep.clave) {
    const op = operativosPeriodo(desde, hasta);
    const lista = costosOp().filter(x => op.meses.some(m => m.mes === x.mes));
    if (lista.length) filas.push([], ["Costos operativos (detalle)", "Mes", "Valor", "Moneda"], ...lista.map(x => [x.desc, x.mes, x.valor, x.moneda]));
    const { filas: prods } = rentabilidadProductos(st.lineas, { desde, hasta, grupos: grupos(), pauta: Object.values(st.pauta) });
    if (prods.length) filas.push([], ["Producto", "Pedidos", "Entregados", "Venta entregada", "Pauta", "Utilidad neta", "Margen %"],
      ...prods.map(x => [x.nombre, x.pedidos, x.entregados, Math.round(x.venta), Math.round(x.pauta), Math.round(x.neta), x.margen === null ? "" : x.margen.toFixed(1)]));
  }
  descargarCSV(`reporte-financiero-${st.pais}-${desde}-a-${hasta}.csv`, filas);
};

// ---------- ¿A dónde se va tu plata? ----------
const COLOR_COSTO = { producto: "#2563eb", flete: "#f59e0b", otros: "#94a3b8", devoluciones: "#dc2626", publicidad: "#7c3aed", operativos: "#0ea5e9", neta: "#16a34a" };
const NOMBRE_COSTO = { producto: "Producto (proveedor)", flete: "Fletes de entregados", otros: "Comisiones y otros de Dropi", devoluciones: "Devoluciones", publicidad: "Publicidad (Meta + TikTok)", operativos: "Costos operativos", neta: "Te queda (utilidad neta)" };
function seccionDesglose(r) {
  const d = r.desglose;
  if (!d || !d.ingreso) return "";
  const partes = ["producto", "flete", "otros", "devoluciones", "publicidad", "operativos"].map(k => [k, d[k]]).filter(([, v]) => v > 0);
  if (d.neta > 0) partes.push(["neta", d.neta]);
  const base = Math.max(d.ingreso, partes.reduce((a, [, v]) => a + v, 0));
  return `
  <section class="fz-card">
    <h3><i data-lucide="pie-chart"></i> ¿A dónde se va tu plata?</h3>
    <p class="fz-mini">De cada ${$$(100000)} que te pagan por lo entregado (${$$(d.ingreso)} en total en el periodo).${d.neta < 0 ? ` <b class="rojo">Los costos superan lo que entra: pierdes ${$$(-d.neta)}.</b>` : ""}</p>
    <div class="fz-desglose">${partes.map(([k, v]) => `<i style="flex:${v};background:${COLOR_COSTO[k]}" title="${NOMBRE_COSTO[k]}: ${$$(v)}"></i>`).join("")}</div>
    <ul class="fz-desglose-ley">${partes.map(([k, v]) => `
      <li><i style="background:${COLOR_COSTO[k]}"></i><span>${NOMBRE_COSTO[k]}</span><b>${$$(v)}</b><small>${pct(v / base * 100)}</small><em>${$$(v / d.ingreso * 100000)} de cada ${$$(100000)}</em></li>`).join("")}</ul>
  </section>`;
}

// ---------- Simulador de escenarios: lo que sigue rodando todavía no es plata tuya ----------
function seccionEscenarios(r, R) {
  const e = r.escenarios;
  if (!e) return `<section class="fz-card"><h3><i data-lucide="git-branch"></i> Simulador de escenarios</h3><p class="fz-mini">No tienes pedidos rodando en este periodo: la ganancia neta de arriba ya es la final.</p></section>`;
  const tarjeta = (k, titulo, sub, x) => `
    <div class="fz-esc ${k}">
      <small>${titulo}</small>
      <b class="${x.neta < 0 ? "rojo" : ""}">${$$s(x.neta)}</b>
      <span>margen ${pct(x.margen)}</span>
      <p>${sub}</p>
      <dl><dt>Se entregan</dt><dd>${x.seEntregan}</dd><dt>Se devuelven</dt><dd>${x.seDevuelven}</dd><dt>Ganas</dt><dd class="verde">+${$$(x.gana)}</dd><dt>Pierdes</dt><dd class="rojo">-${$$(x.pierde)}</dd></dl>
    </div>`;
  const min = e.pesimista.neta, max = e.optimista.neta, rango = Math.max(1, max - min);
  const pos = (v) => Math.min(100, Math.max(0, (v - min) / rango * 100));
  const ref = Math.min(100, Math.max(0, Number(R.referencia) || 0)) / 100;
  const libre = { neta: r.gananciaNeta + (e.optimista.gana) * ref - e.pesimista.pierde * (1 - ref), seEntregan: Math.round(e.rodando * ref) };
  return `
  <section class="fz-card">
    <h3><i data-lucide="git-branch"></i> Simulador de escenarios</h3>
    <p class="fz-mini">Tienes <b>${e.rodando} pedidos rodando</b> (en tránsito y con novedad) por ${$$(e.ventaRodando)}. Hasta que se entreguen esa plata no es tuya. Así cerraría tu ganancia neta del periodo:</p>
    <div class="fz-escs">
      ${tarjeta("pesimista", "PESIMISTA", "Se devuelve todo lo que está rodando.", e.pesimista)}
      ${tarjeta("actual", `ACTUAL · ${pct(e.actual.pct, 0)}`, e.tasaCerrada === null ? "Con tu referencia de entrega (aún no hay pedidos cerrados)." : `Con tu entrega real: ${pct(e.tasaCerrada, 0)} de los pedidos que ya cerraron se entregaron.`, e.actual)}
      ${tarjeta("optimista", "OPTIMISTA", "Se entrega todo lo que está rodando.", e.optimista)}
    </div>
    <div class="fz-esc-linea"><i style="left:0"></i><i class="act" style="left:${pos(e.actual.neta)}%"></i><i style="left:100%"></i>
      <span style="left:0">${$$s(min)}</span><span class="act" style="left:${pos(e.actual.neta)}%">${$$s(e.actual.neta)}</span><span style="left:100%">${$$s(max)}</span></div>
    <div class="fz-proy">
      <b>Prueba tu propio %: si de los ${e.rodando} rodando se entrega…</b>
      <div class="fz-slider"><strong>${R.referencia}%</strong><input type="range" min="0" max="100" step="5" value="${R.referencia}" oninput="fzRepReferencia(this.value)"></div>
      <p class="fz-mini">se entregan ${libre.seEntregan} y se devuelven ${e.rodando - libre.seEntregan} → ganancia neta <b class="${libre.neta < 0 ? "rojo" : "verde"}">${$$s(libre.neta)}</b></p>
    </div>
  </section>`;
}

// ---------- Rentabilidad por producto: margen, ticket, CPA y ROAS ----------
function seccionRentabilidad(desde, hasta) {
  const { filas, total } = rentabilidadProductos(st.lineas, { desde, hasta, grupos: grupos(), pauta: Object.values(st.pauta) });
  if (!filas.length) return "";
  const orden = st.rep.rentOrden || "neta";
  const val = (x) => (x[orden] === null || x[orden] === undefined ? -Infinity : x[orden]);
  const lista = [...filas].sort((a, b) => val(b) - val(a));
  const th = (k, t, tip) => `<th class="n clic ${orden === k ? "activo" : ""}" title="${tip}" onclick="fzRentOrden('${k}')">${t}</th>`;
  const roas = (v) => (v === null ? "—" : `${v.toFixed(2)}x`);
  const fila = (x, tot = false) => `<tr class="${tot ? "fz-total" : ""}">
    <td>${tot ? "<b>Total</b>" : `<b>${esc(x.nombre)}</b>`}${x.rodando ? `<small class="gris"> · ${x.rodando} rodando</small>` : ""}</td>
    <td class="n">${x.pedidos}</td><td class="n">${x.entregados}</td><td class="n">${$$(x.venta)}</td><td class="n">${$$(x.ticket)}</td>
    <td class="n">${$$(x.pauta)}</td><td class="n">${$$(x.cpa)}</td><td class="n">${$$(x.cpaReal)}</td>
    <td class="n ${x.roas !== null && x.roas < 1.5 ? "rojo" : ""}">${roas(x.roas)}</td>
    <td class="n ${x.neta < 0 ? "rojo" : "verde"}"><b>${$$s(x.neta)}</b></td><td class="n ${x.margen !== null && x.margen < 10 ? "rojo" : ""}">${pct(x.margen)}</td></tr>`;
  return `
  <section class="fz-card">
    <h3><i data-lucide="table-2"></i> Rentabilidad por producto</h3>
    <p class="fz-mini">Venta y costos de lo <b>entregado</b>, menos devoluciones y la pauta del Control Diario. <b>CPA</b>: pauta ÷ pedidos. <b>CPA real</b>: pauta ÷ entregados. <b>ROAS</b>: venta entregada ÷ pauta. Toca un título para ordenar.</p>
    <div class="fz-scroll"><table class="fz-tabla">
      <thead><tr><th>Producto</th>${th("pedidos", "Pedidos", "Pedidos del periodo")}${th("entregados", "Entreg.", "Pedidos entregados")}${th("venta", "Venta entregada", "Lo que pagaron los clientes por lo entregado")}${th("ticket", "Ticket", "Venta ÷ entregados")}${th("pauta", "Pauta", "Meta + TikTok del Control Diario")}${th("cpa", "CPA", "Pauta ÷ pedidos")}${th("cpaReal", "CPA real", "Pauta ÷ entregados")}${th("roas", "ROAS", "Venta entregada ÷ pauta")}${th("neta", "Utilidad neta", "Ganancia de lo entregado − devoluciones − pauta")}${th("margen", "Margen", "Utilidad neta ÷ venta entregada")}</tr></thead>
      <tbody>${lista.map(x => fila(x)).join("")}${fila(total, true)}</tbody>
    </table></div>
  </section>`;
}
window.fzRentOrden = (k) => { st.rep.rentOrden = k; const y = window.scrollY; renderReporte($("view")); window.scrollTo(0, y); };

window.fzCiudadTransp = (v) => { st.log.ciudadTransp = v; st.log.ciudadesPag = 1; const y = window.scrollY; renderLogistica($("view")); window.scrollTo(0, y); };
window.fzRepProducto = (v) => { st.rep.clave = v; renderReporte($("view")); };
window.fzRepPeriodo = (p, d, h) => { st.rep.periodo = p; if (d) st.rep.desde = d; if (h) st.rep.hasta = h; renderReporte($("view")); };
let tRef = null;
window.fzRepReferencia = (v) => { st.rep.referencia = Number(v); clearTimeout(tRef); tRef = setTimeout(() => { const y = window.scrollY; renderReporte($("view")); window.scrollTo(0, y); }, 120); };

window.fzAnalizarIA = async () => {
  const b = $("fzBtnIA"), out = $("fzIA");
  const [desde, hasta] = periodo(st.rep.periodo, st.rep.desde, st.rep.hasta);
  const r = reporteActual(desde, hasta);
  const lg = logistica(st.lineas, { desde, hasta, grupos: grupos(), ahora: new Date(st.config?.ultimaImportacion || Date.now()) });
  if (b) { b.disabled = true; b.innerHTML = `<span class="est-spin"></span> Analizando...`; }
  try {
    const { analisis } = await api("POST", "/api/finanzas/analisis", {
      pais: st.pais, producto: st.rep.clave ? nombreDe(st.rep.clave) : "Todos los productos", desde, hasta,
      cifras: {
        pedidos: r.pedidos, despachados: r.despachados, entregados: r.entregados, devoluciones: r.devoluciones, cancelados: r.cancelados,
        transito: r.transito, novedades: r.novedades, tasaEntrega: r.tasaEntrega, metaEntrega: st.config?.metaEntrega ?? 70,
        ingreso: r.ingreso, costoProductos: r.costoProductos, fletes: r.fletesEntregados, costoDevoluciones: r.costoDevoluciones,
        gananciaBruta: r.gananciaBruta, publicidadMeta: r.gastoMeta, publicidadTiktok: r.gastoTiktok, costosOperativos: r.operativos, gananciaNeta: r.gananciaNeta,
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

  if (!st.origen) return sinOrigen(view, "Logística", "truck");
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

    ${tablaTranspMes(r)}
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

// Mes a mes: tasa de entrega de cada transportadora (sobre lo que ya cerró)
function tablaTranspMes(r) {
  const { meses, filas } = r.transportadorasMes || {};
  if (!meses || meses.length < 2 || !filas?.length) return "";
  const ult = meses.slice(-6);
  const nombreMes = (m) => new Date(m + "-15T12:00:00").toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
  return `<section class="fz-card">
    <h3><i data-lucide="calendar-range"></i> Transportadoras mes a mes</h3>
    <p class="fz-mini">Tasa de entrega de cada mes sobre los pedidos que ya cerraron (entregados ÷ entregados + devueltos). La flecha compara con el mes anterior.</p>
    <div class="fz-scroll"><table class="fz-tabla">
      <thead><tr><th>Transportadora</th>${ult.map(m => `<th class="n">${nombreMes(m)}</th>`).join("")}</tr></thead>
      <tbody>${filas.map(t => {
        const ms = t.meses.filter(x => ult.includes(x.mes));
        return `<tr><td><b>${esc(t.nombre)}</b></td>${ms.map((x, i) => {
          const ant = i > 0 ? ms[i - 1].tasa : null;
          const flecha = x.tasa !== null && ant !== null ? (x.tasa - ant >= 3 ? `<em class="verde">▲</em>` : ant - x.tasa >= 3 ? `<em class="rojo">▼</em>` : "") : "";
          return `<td class="n">${x.tasa === null ? `<span class="gris">${x.despachados ? `${x.despachados} rodando` : "—"}</span>` : `<b class="${x.tasa >= 70 ? "verde" : x.tasa >= 55 ? "ambar" : "rojo"}">${pct(x.tasa, 0)}</b> ${flecha}<small class="gris"> ${x.entregados + x.devueltos}${x.entregados + x.devueltos < 10 ? " ⚠" : ""}</small>`}</td>`;
        }).join("")}</tr>`;
      }).join("")}</tbody>
    </table></div>
    <p class="fz-mini">El número pequeño son los pedidos cerrados de ese mes; con ⚠ hay menos de 10 y el porcentaje todavía no es confiable.</p>
  </section>`;
}

function tablaCiudades(r) {
  const L = st.log;
  const tr = L.ciudadTransp && r.ciudadesPorTransportadora?.[L.ciudadTransp] ? L.ciudadTransp : "";
  let lista = [...(tr ? r.ciudadesPorTransportadora[tr] : r.ciudades)];
  const orden = { total: (a, b) => b.total - a.total, tasa: (a, b) => b.tasa - a.tasa, tasaAsc: (a, b) => a.tasa - b.tasa, devoluciones: (a, b) => b.devoluciones - a.devoluciones };
  lista.sort(orden[L.ciudadOrden] || orden.total);
  if (L.priorizar && L.ciudadOrden.startsWith("tasa")) lista.sort((a, b) => (b.despachados >= 10) - (a.despachados >= 10));
  const paginas = Math.max(1, Math.ceil(lista.length / L.ciudadesN));
  if (L.ciudadesPag > paginas) L.ciudadesPag = paginas;
  const ini = (L.ciudadesPag - 1) * L.ciudadesN;
  const th = (k, t) => `<th class="n clic ${L.ciudadOrden === k ? "activo" : ""}" onclick="fzCiudadOrden('${k}')">${t}</th>`;
  return `<section class="fz-card">
    <div class="fz-card-row"><div><h3>Ciudades por volumen</h3><p class="fz-mini">${lista.length} ciudades · tasa de entrega por ciudad${tr ? ` con <b>${esc(tr)}</b>` : ""}</p></div>
      <label class="fz-mini">Transportadora <select onchange="fzCiudadTransp(this.value)"><option value="">Todas</option>${r.transportadoras.map(t => `<option value="${esc(t.nombre)}" ${tr === t.nombre ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select></label></div>
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
    pendientes: (o) => o.grupo === "pendiente",
    conNotas: (o) => (st.notas?.[o.ordenId] || []).length > 0
  };
  const b = L.buscar.trim().toLowerCase();
  let lista = r.seguimiento.filter(filtros[L.filtro] || filtros.activos)
    .filter(o => !b || [o.producto, o.guia, o.ciudad, o.ordenId, o.transportadora, ...(st.notas?.[o.ordenId] || []).map(n => n.texto)].some(v => String(v || "").toLowerCase().includes(b)));
  const paginas = Math.max(1, Math.ceil(lista.length / L.porPagina));
  if (L.pagina > paginas) L.pagina = paginas;
  const ini = (L.pagina - 1) * L.porPagina;
  const cuenta = (f) => r.seguimiento.filter(filtros[f]).length;

  return `<section class="fz-card" id="fzSeguimiento">
    <h3>Seguimiento de pedidos</h3><p class="fz-mini">${cuenta("activos")} activos de ${r.pedidos} pedidos</p>
    <div class="fz-chips">
      <input class="fz-buscar" placeholder="Buscar guía, producto, ciudad u orden..." value="${esc(L.buscar)}" oninput="fzLogBuscar(this.value)" id="fzLogBuscar">
      ${[["activos", "Activos"], ["mov24", "+24h sin mov."], ["novedades", "Solo novedades"], ["pendientes", "Pendiente confirmación"], ["conNotas", "Con notas"]].map(([k, t]) => `<button class="fz-chip ${L.filtro === k ? "activo" : ""}" onclick="fzLogFiltro('${k}', true)">${t} (${cuenta(k)})</button>`).join("")}
      <button class="fz-btn claro chico" onclick="fzExportarSeguimiento()"><i data-lucide="download"></i> Exportar</button>
    </div>
    <div class="fz-scroll"><table class="fz-tabla">
      <thead><tr><th>Fecha</th><th>Orden</th><th>Producto</th><th>Ciudad</th><th>Estatus</th><th>Guía</th><th>Notas</th><th>Transportadora</th><th>Últ. movimiento</th></tr></thead>
      <tbody>${lista.slice(ini, ini + L.porPagina).map(o => `<tr>
        <td>${fechaCorta(o.fecha)}</td><td class="gris">${esc(o.ordenId)}</td><td><b>${esc(o.producto)}</b></td><td>${esc(o.ciudad)}</td>
        <td><span class="fz-tag ${o.grupo}">${o.grupo === "novedad" ? "NOVEDAD" : esc(o.estatus)}</span>${o.novedad ? `<small class="morado">${esc(o.novedad)}</small>` : ""}</td>
        <td>${o.guia ? `<button class="fz-guia" title="Copiar guía" onclick="fzCopiar('${esc(o.guia)}')">${esc(o.guia)} <i data-lucide="copy"></i></button>` : "—"}</td>
        <td>${celdaNotas(o)}</td>
        <td>${esc(o.transportadora)}</td>
        <td>${fechaCorta(o.fechaUltMov)}${o.horasSinMovimiento > 24 ? ` <small class="ambar">${Math.floor(o.horasSinMovimiento / 24)}d sin mov.</small>` : ""}<small>${esc(o.ultimoMovimiento)}</small></td>
      </tr>`).join("") || `<tr><td colspan="9" class="fz-sin">Nada por aquí.</td></tr>`}</tbody>
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
// ---------- Notas por pedido (seguimiento) ----------
const NOTAS_RAPIDAS = ["Llamé al cliente", "No contesta", "Confirmó que recibe", "Reprogramada la entrega", "Cambio de dirección", "Escribí por WhatsApp", "Pidió devolución", "Reclamo a la transportadora"];
const fechaNota = (iso) => new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
function celdaNotas(o) {
  const ns = st.notas?.[o.ordenId] || [];
  const id = esc(o.ordenId);
  if (!ns.length) return `<button class="fz-nota-add" onclick="fzNotas('${id}')" title="Agregar una nota a este pedido"><i data-lucide="plus"></i> Nota</button>`;
  const u = ns[ns.length - 1];
  return `<button class="fz-nota-celda" onclick="fzNotas('${id}')" title="Ver, editar o borrar las notas">
    <span>${esc(u.texto)}</span>
    <small>${fechaNota(u.editada || u.fecha)}${ns.length > 1 ? ` · ${ns.length} notas` : ""}</small>
  </button>`;
}
const notaEdit = { orden: "", editando: null };
function pedidoDe(ordenId) {
  const ls = st.lineas.filter(l => l.ordenId === ordenId);
  return ls.length ? { ordenId, producto: ls.map(l => l.producto).join(" + "), guia: ls[0].guia, ciudad: ls[0].ciudad, transportadora: ls[0].transportadora, estatus: ls[0].estatus } : { ordenId };
}
function pintarModalNotas() {
  const m = document.querySelector(".fz-modal-notas");
  if (!m) return;
  const o = pedidoDe(notaEdit.orden);
  const ns = st.notas?.[notaEdit.orden] || [];
  m.querySelector(".fz-modal-box").innerHTML = `
    <h3><i data-lucide="sticky-note"></i> Notas del pedido ${esc(o.ordenId)}</h3>
    <p class="fz-mini">${esc(o.producto || "")}${o.ciudad ? ` · ${esc(o.ciudad)}` : ""}${o.guia ? ` · Guía ${esc(o.guia)}` : ""}${o.transportadora ? ` · ${esc(o.transportadora)}` : ""}${o.estatus ? ` · ${esc(o.estatus)}` : ""}</p>
    <ul class="fz-notas">${ns.map(n => `
      <li>
        ${notaEdit.editando === n.id ? `
          <textarea id="fzNotaEdit" rows="3" maxlength="500">${esc(n.texto)}</textarea>
          <div class="fz-notas-acc"><button class="fz-btn chico" onclick="fzNotaGuardarEdit('${n.id}')">Guardar</button><button class="fz-btn claro chico" onclick="fzNotaEditar(null)">Cancelar</button></div>` : `
          <p>${esc(n.texto).replace(/\n/g, "<br>")}</p>
          <small>${fechaNota(n.fecha)}${n.editada ? ` · editada ${fechaNota(n.editada)}` : ""}</small>
          <div class="fz-notas-acc">
            <button class="fz-icono" title="Editar" onclick="fzNotaEditar('${n.id}')"><i data-lucide="pencil"></i></button>
            <button class="fz-icono peligro" title="Borrar" onclick="fzNotaBorrar('${n.id}')"><i data-lucide="trash-2"></i></button>
          </div>`}
      </li>`).join("") || `<li class="vacia">Todavía no hay notas en este pedido.</li>`}</ul>
    <label class="fz-mini">Nueva nota</label>
    <div class="fz-notas-rapidas">${NOTAS_RAPIDAS.map((t, i) => `<button class="fz-chip" onclick="fzNotaRapida(${i})">${esc(t)}</button>`).join("")}</div>
    <textarea id="fzNotaNueva" rows="3" maxlength="500" placeholder="Ej: llamé a las 3 pm, dice que mañana está en casa"></textarea>
    <div class="fz-modal-pie">
      <button class="fz-btn claro" onclick="fzCerrarNotas()">Cerrar</button>
      <button class="fz-btn" onclick="fzNotaAgregar()"><i data-lucide="plus"></i> Agregar nota</button>
    </div>`;
  iconos();
}
async function guardarNotas(ordenId, notas) {
  const r = await api("PUT", "/api/finanzas/notas", { pais: st.pais, ordenId, notas });
  st.notas = { ...(st.notas || {}) };
  if (r.notas?.length) st.notas[ordenId] = r.notas; else delete st.notas[ordenId];
  pintarModalNotas();
  if (st.pagina === "logistica") reLog();
}
window.fzNotas = (ordenId) => {
  notaEdit.orden = ordenId; notaEdit.editando = null;
  document.querySelector(".fz-modal-notas")?.remove();
  const modal = document.createElement("div");
  modal.className = "modal-overlay fz-modal fz-modal-notas";
  modal.innerHTML = `<div class="modal-box fz-modal-box chico"></div>`;
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  pintarModalNotas();
  setTimeout(() => $("fzNotaNueva")?.focus(), 50);
};
window.fzCerrarNotas = () => document.querySelector(".fz-modal-notas")?.remove();
window.fzNotaRapida = (i) => {
  const t = $("fzNotaNueva"); if (!t) return;
  t.value = (t.value.trim() ? t.value.trim() + ". " : "") + NOTAS_RAPIDAS[i];
  t.focus();
};
window.fzNotaAgregar = async () => {
  const texto = $("fzNotaNueva")?.value.trim();
  if (!texto) return avisar("Escribe la nota", "error");
  try {
    await guardarNotas(notaEdit.orden, [...(st.notas?.[notaEdit.orden] || []), { id: Math.random().toString(36).slice(2, 10), texto, fecha: new Date().toISOString() }]);
    avisar("Nota guardada ✓");
  } catch (err) { avisar(err.message, "error"); }
};
window.fzNotaEditar = (id) => { notaEdit.editando = id; pintarModalNotas(); setTimeout(() => $("fzNotaEdit")?.focus(), 30); };
window.fzNotaGuardarEdit = async (id) => {
  const texto = $("fzNotaEdit")?.value.trim();
  if (!texto) return avisar("La nota no puede quedar vacía. Si no la quieres, bórrala.", "error");
  notaEdit.editando = null;
  try {
    await guardarNotas(notaEdit.orden, (st.notas?.[notaEdit.orden] || []).map(n => n.id === id ? { ...n, texto, editada: new Date().toISOString() } : n));
    avisar("Nota editada ✓");
  } catch (err) { avisar(err.message, "error"); }
};
window.fzNotaBorrar = async (id) => {
  if (!confirm("¿Borrar esta nota?")) return;
  try {
    await guardarNotas(notaEdit.orden, (st.notas?.[notaEdit.orden] || []).filter(n => n.id !== id));
    avisar("Nota borrada");
  } catch (err) { avisar(err.message, "error"); }
};

window.fzExportarSeguimiento = () => {
  const [desde, hasta] = periodo(st.log.periodo, st.log.desde, st.log.hasta);
  const r = logistica(st.lineas, { desde, hasta, grupos: grupos(), ahora: new Date(st.config?.ultimaImportacion || Date.now()) });
  descargarCSV(`seguimiento-${st.pais}-${hoyISO()}.csv`, [
    ["Fecha", "Orden", "Producto", "Ciudad", "Estatus", "Novedad", "Guía", "Transportadora", "Último movimiento", "Fecha últ. mov.", "Horas sin movimiento", "Notas"],
    ...r.seguimiento.map(o => [o.fecha, o.ordenId, o.producto, o.ciudad, o.estatus, o.novedad, o.guia, o.transportadora, o.ultimoMovimiento, o.fechaUltMov, o.horasSinMovimiento === null ? "" : Math.round(o.horasSinMovimiento),
      (st.notas?.[o.ordenId] || []).map(n => `${fechaNota(n.fecha)}: ${n.texto}`).join(" | ")])
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

// Cerrar la lista de cuentas al hacer clic afuera
document.addEventListener("click", (e) => {
  if (st.meta.abierto && !e.target.closest?.(".fz-cta")) window.fzCuentasAbrir(false);
});
