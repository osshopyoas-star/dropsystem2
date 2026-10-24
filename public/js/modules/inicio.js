// =============================================
// 🏠 INICIO — tablero del día
// Utilidad, pedidos, logística, testeos y productos en desarrollo de un vistazo.
// Usa los mismos datos que Finanzas, Mis testeos y Desarrollo.
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { formatear } from "../core/costeo.js";
import { controlDiario, totalesControl, reporteFinanciero, logistica } from "../core/finanzas.js";
import { numerosTesteo } from "./testeos.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");
const iconos = () => { if (window.lucide) lucide.createIcons(); };

const st = {
  pais: (() => { try { return localStorage.getItem("fz_pais") || "CO"; } catch { return "CO"; } })(),
  usuario: null, productos: [], costeos: new Map(), proyectos: [], fin: {}, meta: null
};

async function api(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

const hoyISO = () => new Date(Date.now() - 5 * 36e5).toISOString().slice(0, 10);
const sumarDias = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const fechaCorta = (iso) => { if (!iso) return ""; const [, m, d] = iso.split("-"); return `${d}/${m}`; };
const plata = (v) => (v === null || v === undefined ? "—" : (v < 0 ? "-" : "") + formatear(Math.abs(v), st.pais));
const saludo = () => { const h = new Date().getHours(); return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"; };
const diasDesde = (fecha) => (fecha ? Math.floor((Date.now() - new Date(fecha)) / 864e5) : null);

async function cargarFinanzas(pa) {
  if (st.fin[pa]) return st.fin[pa];
  try {
    const [lineas, pauta, config] = await Promise.all([
      api(`/api/finanzas/lineas?pais=${pa}`), api(`/api/finanzas/pauta?pais=${pa}`), api(`/api/finanzas/config?pais=${pa}`)
    ]);
    st.fin[pa] = { lineas, config, pauta: Object.fromEntries(pauta.map(x => [`${x.fecha}|${x.clave}`, x])) };
  } catch { st.fin[pa] = { lineas: [], pauta: {}, config: null }; }
  return st.fin[pa];
}

async function cargar() {
  const [usuario, productos, costeos, proyectos, meta] = await Promise.all([
    api("/api/auth/me").catch(() => null),
    api("/api/productos").catch(() => []),
    api("/api/costeos").catch(() => []),
    api("/api/proyectos").catch(() => []),
    api("/api/meta/estado").catch(() => null)
  ]);
  st.usuario = usuario;
  st.productos = Array.isArray(productos) ? productos : [];
  st.costeos = new Map((costeos || []).filter(c => c.productoId).map(c => [String(c.productoId), c]));
  st.proyectos = Array.isArray(proyectos) ? proyectos : [];
  st.meta = meta;
  st.fin = {};
  const paises = new Set([st.pais, ...st.productos.filter(p => p.resultado === "testeando").map(p => p.pais || "CO")]);
  await Promise.all([...paises].map(cargarFinanzas));
}

// ---------- Números de la operación ----------
function numeros() {
  const f = st.fin[st.pais];
  if (!f?.config?.desde) return null;
  const grupos = f.config.grupos || [], devPct = f.config.devPct ?? 25;
  const ultimo = f.config.hasta;
  const ayer = sumarDias(hoyISO(), -1);
  const dia = f.config.dias.includes(ayer) ? ayer : ultimo;
  const control = (desde, hasta) => totalesControl(controlDiario(f.lineas, { desde, hasta, grupos, pauta: f.pauta, devPct }));
  const delDia = control(dia, dia);
  const filasDia = controlDiario(f.lineas, { desde: dia, hasta: dia, grupos, pauta: f.pauta, devPct });
  const semana = control(sumarDias(dia, -6), dia);
  const semanaAntes = control(sumarDias(dia, -13), sumarDias(dia, -7));
  const r30 = reporteFinanciero(f.lineas, { desde: sumarDias(ultimo, -29), hasta: ultimo, grupos });
  const lg = logistica(f.lineas, { desde: sumarDias(ultimo, -45), hasta: ultimo, grupos, ahora: new Date(f.config.ultimaImportacion || Date.now()), metaEntrega: f.config.metaEntrega });
  // Pedidos por día (últimos 14 días con datos)
  const porDia = [];
  for (let i = 13; i >= 0; i--) {
    const d = sumarDias(dia, -i);
    const t = control(d, d);
    porDia.push({ d, pedidos: t.pedidos, utilidad: t.utilidad });
  }
  return { f, dia, delDia, filasDia, semana, semanaAntes, r30, lg, porDia, ultimo };
}

// ---------- Pantalla ----------
function render(view) {
  const n = numeros();
  const nombre = (st.usuario?.nombre || "").split(" ")[0];
  const testeos = st.productos.filter(p => p.resultado === "testeando");
  const resultados = ["winner", "perdedor", "inconcluso"].map(k => st.productos.filter(p => p.resultado === k).length);
  const enDesarrollo = [...st.proyectos].sort((a, b) => new Date(b.actualizado) - new Date(a.actualizado)).slice(0, 5);
  const alertas = avisos(n);

  view.innerHTML = `
  <div class="in-home">
    <header class="ih-head">
      <div>
        <h1>${saludo()}${nombre ? `, ${esc(nombre)}` : ""} 👋</h1>
        <p>${n ? `Así va tu operación en ${st.pais === "EC" ? "Ecuador" : "Colombia"} · datos de Dropi hasta el ${fechaCorta(n.ultimo)}` : "Tu tablero se llena cuando subes el Excel de Dropi en Finanzas."}</p>
      </div>
      <div class="ih-pais">
        ${["CO", "EC"].map(p => `<button class="${st.pais === p ? "activo" : ""}" onclick="ihPais('${p}')">${p === "CO" ? "🇨🇴 Colombia" : "🇪🇨 Ecuador"}</button>`).join("")}
      </div>
    </header>

    ${alertas.length ? `<section class="ih-alertas">${alertas.map(a => `
      <div class="ih-alerta ${a.tipo}" ${a.ir ? `onclick="${a.ir}"` : ""}><i data-lucide="${a.icono}"></i><span>${a.texto}</span>${a.ir ? `<i data-lucide="chevron-right"></i>` : ""}</div>`).join("")}</section>` : ""}

    ${n ? `
    <section class="ih-kpis">
      <div class="ih-kpi principal ${n.delDia.utilidad < 0 ? "pierde" : ""}" onclick="goTo('control-diario')">
        <small>UTILIDAD ${n.dia === sumarDias(hoyISO(), -1) ? "DE AYER" : `DEL ${fechaCorta(n.dia)}`}</small>
        <b>${plata(n.delDia.utilidad)}</b>
        <span>${n.delDia.pedidos} pedidos · gasto ${plata(n.delDia.gasto)}${n.delDia.gasto === 0 && n.delDia.pedidos ? " (falta registrar pauta)" : ""}</span>
      </div>
      <div class="ih-kpi" onclick="goTo('control-diario')">
        <small>UTILIDAD 7 DÍAS</small>
        <b class="${n.semana.utilidad < 0 ? "rojo" : ""}">${plata(n.semana.utilidad)}</b>
        <span>${variacion(n.semana.utilidad, n.semanaAntes.utilidad)} vs. semana anterior</span>
      </div>
      <div class="ih-kpi" onclick="goTo('control-diario')">
        <small>PEDIDOS 7 DÍAS</small>
        <b>${n.semana.pedidos}</b>
        <span>${variacion(n.semana.pedidos, n.semanaAntes.pedidos)} vs. semana anterior</span>
      </div>
      <div class="ih-kpi" onclick="goTo('logistica')">
        <small>TASA DE ENTREGA 30 DÍAS</small>
        <b class="${n.r30.tasaEntrega < (n.f.config.metaEntrega || 70) ? "ambar" : "verde"}">${n.r30.tasaEntrega.toFixed(1)}%</b>
        <span>meta ${n.f.config.metaEntrega || 70}% · ${n.r30.devoluciones} devoluciones</span>
      </div>
      <div class="ih-kpi" onclick="goTo('reporte-financiero')">
        <small>GANANCIA BRUTA 30 DÍAS</small>
        <b>${plata(n.r30.gananciaBruta)}</b>
        <span>lo que entró a la wallet menos devoluciones</span>
      </div>
    </section>

    <div class="ih-dos">
      <section class="ih-card">
        <div class="ih-card-head"><h3><i data-lucide="bar-chart-2"></i> Últimos 14 días</h3><button class="ih-link" onclick="goTo('control-diario')">Control diario →</button></div>
        ${graficaDias(n.porDia)}
      </section>
      <section class="ih-card">
        <div class="ih-card-head"><h3><i data-lucide="trophy"></i> ${n.dia === sumarDias(hoyISO(), -1) ? "Ayer" : fechaCorta(n.dia)} por producto</h3></div>
        ${n.filasDia.length ? `<ul class="ih-lista">${n.filasDia.slice().sort((a, b) => b.utilidad - a.utilidad).slice(0, 6).map(f => `
          <li><span><b>${esc(f.nombre)}</b><small>${f.pedidos} pedidos · gasto ${plata(f.gasto)}</small></span><em class="${f.utilidad < 0 ? "rojo" : "verde"}">${plata(f.utilidad)}</em></li>`).join("")}</ul>`
          : `<p class="ih-vacio">Sin pedidos ese día.</p>`}
      </section>
    </div>

    <section class="ih-card">
      <div class="ih-card-head"><h3><i data-lucide="truck"></i> Logística para hoy</h3><button class="ih-link" onclick="goTo('logistica')">Ver logística →</button></div>
      <div class="ih-log">
        <div onclick="goTo('logistica')"><b class="morado">${n.lg.novedadesActivas.total}</b><span>novedades sin resolver</span><small>${n.lg.novedadesActivas.porTipo.slice(0, 2).map(([t, c]) => `${esc(t)} (${c})`).join(" · ")}</small></div>
        <div onclick="goTo('logistica')"><b class="ambar">${n.lg.sinMovimiento.total}</b><span>sin movimiento +24 h</span><small>${n.lg.sinMovimiento.porTransportadora.slice(0, 2).map(([t, c]) => `${esc(t)} ${c}`).join(" · ")}</small></div>
        <div onclick="goTo('logistica')"><b>${n.lg.estados.transito || 0}</b><span>en tránsito</span></div>
        <div onclick="goTo('logistica')"><b>${n.lg.estados.pendiente || 0}</b><span>pendientes de confirmación</span></div>
      </div>
    </section>` : `
    <section class="ih-card ih-empezar">
      <i data-lucide="file-spreadsheet"></i>
      <div><h3>Sube tu Excel de Dropi</h3><p>En Finanzas → Control Diario sube el reporte "órdenes con productos" y aquí verás tu utilidad, pedidos, entregas y novedades.</p></div>
      <button class="ih-btn" onclick="goTo('control-diario')">Ir a Finanzas</button>
    </section>`}

    <div class="ih-dos">
      <section class="ih-card">
        <div class="ih-card-head"><h3><i data-lucide="flask-conical"></i> Testeos activos (${testeos.length})</h3><button class="ih-link" onclick="goTo('testeos')">Mis testeos →</button></div>
        <p class="ih-mini">${resultados[0]} winner · ${resultados[1]} perdedores · ${resultados[2]} inconclusos en total</p>
        ${testeos.length ? `<ul class="ih-lista">${testeos.slice(0, 6).map(p => {
          const { m, sug } = numerosTesteo(p, st.fin, st.costeos.get(String(p._id)));
          const pa = p.pais || "CO";
          return `<li onclick="goTo('testeos')">
            <span><b>${esc(p.nombre)}</b><small>${pa === "EC" ? "🇪🇨" : "🇨🇴"} ${m && (m.pedidos || m.gasto) ? `${m.pedidos} ped · gasto ${formatear(m.gasto, pa)} · ${m.utilidad < 0 ? "-" : ""}${formatear(Math.abs(m.utilidad), pa)}` : "sin números todavía"}</small></span>
            <em class="ih-sug ${sug.accion === "escalar" ? "winner" : sug.accion === "apagar" ? "perdedor" : ""}">${sug.nombre || "Testeando"}</em>
          </li>`;
        }).join("")}</ul>` : `<p class="ih-vacio">No tienes testeos activos. Pasa un producto a "Lanzado" en tu Base y entra aquí solo.</p>`}
      </section>
      <section class="ih-card">
        <div class="ih-card-head"><h3><i data-lucide="brain"></i> En desarrollo</h3><button class="ih-link" onclick="goTo('desarrollo')">Desarrollo →</button></div>
        ${enDesarrollo.length ? `<ul class="ih-lista">${enDesarrollo.map(p => {
          const pasos = Object.entries(p.pasosRamas || {}).sort();
          const max = Math.max(p.paso || 1, ...pasos.map(([, v]) => v));
          return `<li onclick="ihAbrirProyecto('${esc(p._id)}')">
            <span><b>${esc(p.nombre)}</b><small>${pasos.length ? pasos.map(([k, v]) => `Avatar ${k}: paso ${v}/6`).join(" · ") : `paso ${Math.min(p.paso || 1, 2)}/6`}${p.formato === "normal" ? " · landing normal" : ""}</small></span>
            <span class="ih-progreso"><i style="width:${max / 6 * 100}%"></i></span>
          </li>`;
        }).join("")}</ul>` : `<p class="ih-vacio">Aún no tienes proyectos en Desarrollo.</p>`}
      </section>
    </div>

    <section class="ih-accesos">
      ${[
        ["calculator", "Costear un producto", "goTo('calculadora')"],
        ["plus-circle", "Nuevo producto", "setProductoPais('" + st.pais + "')"],
        ["layout-template", "Mi plantilla", "goTo('plantilla')"],
        ["radar", "Buscar tendencias", "goTo('tendencias')"],
        ["plug", "Integraciones", "goTo('integraciones')"]
      ].map(([i, t, f]) => `<button onclick="${f}"><i data-lucide="${i}"></i>${t}</button>`).join("")}
    </section>
  </div>`;
  iconos();
}

function variacion(ahora, antes) {
  if (!antes) return ahora ? "nuevo" : "—";
  const v = (ahora - antes) / Math.abs(antes) * 100;
  return `<b class="${v >= 0 ? "verde" : "rojo"}">${v >= 0 ? "▲" : "▼"} ${Math.abs(v).toFixed(0)}%</b>`;
}

function graficaDias(dias) {
  const max = Math.max(1, ...dias.map(d => d.pedidos));
  return `<div class="ih-grafica">${dias.map(d => `
    <div title="${fechaCorta(d.d)}: ${d.pedidos} pedidos · utilidad ${plata(d.utilidad)}">
      <i style="height:${d.pedidos / max * 100}%" class="${d.utilidad < 0 ? "pierde" : ""}"></i>
      <small>${d.d.slice(8)}</small>
    </div>`).join("")}</div>
    <p class="ih-mini">Altura = pedidos del día. En rojo los días con utilidad negativa.</p>`;
}

function avisos(n) {
  const a = [];
  const f = st.fin[st.pais];
  if (!f?.config?.desde) return a;
  const dias = diasDesde(f.config.ultimaImportacion);
  if (dias !== null && dias >= 2) a.push({ tipo: "amarillo", icono: "upload", texto: `Tu último Excel de Dropi es de hace ${dias} días: súbelo de nuevo para ver los estados al día.`, ir: "goTo('control-diario')" });
  if (n && n.filasDia.length && n.delDia.gasto === 0) a.push({ tipo: "azul", icono: "pencil", texto: `Falta registrar la pauta del ${fechaCorta(n.dia)} para ver la utilidad real.`, ir: "goTo('control-diario')" });
  if (n && n.lg.novedadesActivas.total > 0) a.push({ tipo: "morado", icono: "alert-triangle", texto: `${n.lg.novedadesActivas.total} novedades sin resolver: gestiónalas para salvar entregas.`, ir: "goTo('logistica')" });
  if (st.meta && st.meta.configurado && !st.meta.conectado) a.push({ tipo: "azul", icono: "plug", texto: "Conecta Meta Ads para que la pauta se llene sola.", ir: "goTo('integraciones')" });
  const lanzadosSinCosteo = st.productos.filter(p => p.estado === "lanzado" && (p.pais || "CO") === st.pais && !st.costeos.has(String(p._id)));
  if (lanzadosSinCosteo.length) a.push({ tipo: "gris", icono: "calculator", texto: `${lanzadosSinCosteo.length} producto(s) lanzados sin costeo: ${lanzadosSinCosteo.slice(0, 2).map(p => esc(p.nombre)).join(", ")}${lanzadosSinCosteo.length > 2 ? "…" : ""}`, ir: "goTo('calculadora')" });
  return a.slice(0, 4);
}

window.ihPais = async (p) => {
  st.pais = p === "EC" ? "EC" : "CO";
  try { localStorage.setItem("fz_pais", st.pais); } catch {}
  await cargarFinanzas(st.pais);
  render($("view"));
};
window.ihAbrirProyecto = (id) => { goTo("desarrollo"); setTimeout(() => window.estAbrirProyectoEn?.(id, null), 50); };

registrarRuta("inicio", async (view) => {
  window.marcarMenuActivo?.("inicio");
  try { st.pais = localStorage.getItem("fz_pais") || st.pais; } catch {}
  view.innerHTML = `<div class="in-home"><p class="est-muted">Cargando tu tablero...</p></div>`;
  try {
    await cargar();
    render(view);
  } catch (err) {
    view.innerHTML = `<div class="in-home"><p class="est-error">${esc(err.message)}</p></div>`;
  }
});
