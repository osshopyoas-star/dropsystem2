// =============================================
// 🏠 INICIO — tablero del día
// Utilidad, pedidos, logística, testeos y productos en desarrollo de un vistazo.
// Usa los mismos datos que Finanzas, Mis testeos y Desarrollo.
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { formatear } from "../core/costeo.js";
import { controlDiario, totalesControl, reporteFinanciero, logistica, flujoCaja } from "../core/finanzas.js";
import { numerosTesteo } from "./testeos.js";
import { proximasTemporadas } from "../core/temporadas.js";

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
// Un mensaje motivador distinto cada vez que entras o refrescas (general: sirve para quien esté usando CoDropX)
const MOTIVACION = [
  "¡Vamos con toda! 💪", "Campeón, tú puedes 🏆", "¡Lo vas a lograr! 🚀", "¡Con toda la energía hoy! ⚡",
  "Hoy es un gran día para vender 🔥", "Un producto ganador te está esperando 🎯", "Paso a paso se llega lejos 👣",
  "La constancia gana 💯", "¡A romperla hoy! 💥", "Cada testeo te acerca al winner 🧪", "¡Hoy no se para! 🔋",
  "Hoy se vende, campeón 💸", "Disciplina hoy, libertad mañana 🗝️", "¡Enfocados y con hambre de más! 🎯",
  "El que la sigue la consigue 🙌", "Hoy montamos algo grande 🏗️", "¡Equipo imparable! 🤝",
  "Lo difícil se hace, lo imposible se intenta 💪", "¡Dale que sí se puede! ✊", "Tu próximo winner está a un testeo 🚀",
  "Los resultados llegan a los que no se rinden 🔥", "¡Modo bestia activado! 🦁", "Hoy mejor que ayer 📈",
  "Confía en el proceso 🧭", "¡A facturar se dijo! 💰", "Grandes cosas vienen ✨",
  "Hoy no es suerte, es trabajo 🛠️", "¡Arriba ese ánimo! ☀️", "Cada pedido cuenta, sigue así 📦",
  "¡Juntos lo hacemos crecer! 👑"
];
let mensajeInicio = null;
function nuevoMensaje() {
  let ultimo = -1;
  try { ultimo = Number(localStorage.getItem("ih_motivacion") ?? -1); } catch {}
  let i = Math.floor(Math.random() * MOTIVACION.length);
  if (i === ultimo) i = (i + 1) % MOTIVACION.length;
  try { localStorage.setItem("ih_motivacion", String(i)); } catch {}
  mensajeInicio = MOTIVACION[i];
}
const saludo = () => {
  if (!mensajeInicio) nuevoMensaje();
  return mensajeInicio;
};
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
  // Mes en curso (utilidad del Control Diario) y lo que sigue rodando (de los últimos 60 días)
  const mes = hoyISO().slice(0, 7);
  const delMes = control(`${mes}-01`, hoyISO());
  const r60 = reporteFinanciero(f.lineas, { desde: sumarDias(ultimo, -59), hasta: ultimo, grupos, referenciaEntrega: f.config.metaEntrega || 70 });
  return { f, dia, delDia, filasDia, semana, semanaAntes, r30, lg, porDia, ultimo, mes, delMes, r60 };
}

// ---------- Pantalla ----------
function render(view) {
  const n = numeros();
  const testeos = st.productos.filter(p => p.resultado === "testeando");
  const resultados = ["winner", "perdedor", "inconcluso"].map(k => st.productos.filter(p => p.resultado === k).length);
  const enDesarrollo = [...st.proyectos].sort((a, b) => new Date(b.actualizado) - new Date(a.actualizado)).slice(0, 5);
  const alertas = avisos(n);

  view.innerHTML = `
  <div class="in-home">
    <header class="ih-head">
      <div>
        <h1>${esc(saludo())}</h1>
        <p>${n ? `Así va tu operación en ${st.pais === "EC" ? "Ecuador" : "Colombia"} · datos de Dropi hasta el ${fechaCorta(n.ultimo)}` : "Tu tablero se llena cuando subes el Excel de Dropi en Finanzas."}</p>
      </div>
      <div class="ih-pais">
        ${["CO", "EC"].map(p => `<button class="${st.pais === p ? "activo" : ""}" onclick="ihPais('${p}')">${p === "CO" ? "🇨🇴 Colombia" : "🇪🇨 Ecuador"}</button>`).join("")}
      </div>
    </header>

    ${n ? tarjetaResumen(n, testeos) : ""}

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

    ${tarjetaMeta(n)}
    ${tarjetaFlujo(n)}

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

    ${tarjetaTemporadas()}

    <section class="ih-accesos">
      ${[
        ["calculator", "Costear un producto", "goTo('calculadora')"],
        ["plus-circle", "Nuevo producto", "setProductoPais('" + st.pais + "')"],
        ["layout-template", "Mi plantilla", "goTo('plantilla')"],
        ["radar", "Buscar tendencias", "goTo('tendencias')"],
        ["plug", "Integraciones", "goTo('integraciones')"]
      ].concat(yaInstalada() ? [] : [["smartphone", "Instalar en el celular", "ihInstalar()"]]).map(([i, t, f]) => `<button onclick="${f}"><i data-lucide="${i}"></i>${t}</button>`).join("")}
    </section>
  </div>`;
  iconos();
}

// ---------- Resumen de la mañana: lo que toca hoy + texto para WhatsApp ----------
function decisionesTesteo(testeos) {
  return testeos.map(p => ({ p, ...numerosTesteo(p, st.fin, st.costeos.get(String(p._id))) }))
    .filter(x => x.sug && ["escalar", "apagar"].includes(x.sug.accion));
}
function loQueToca(n, testeos) {
  const t = [];
  const ayer = n.dia === sumarDias(hoyISO(), -1);
  for (const x of decisionesTesteo(testeos)) {
    t.push({ icono: x.sug.accion === "escalar" ? "rocket" : "power", tipo: x.sug.accion === "escalar" ? "verde" : "rojo", ir: "goTo('testeos')",
      texto: `<b>${x.sug.accion === "escalar" ? "Escalar" : "Apagar"} ${esc(x.p.nombre)}</b>${x.sug.motivo ? ` · ${esc(x.sug.motivo)}` : ""}` });
  }
  if (n.lg.novedadesActivas.total) t.push({ icono: "alert-triangle", tipo: "morado", ir: "goTo('logistica')", texto: `<b>Gestionar ${n.lg.novedadesActivas.total} novedad${n.lg.novedadesActivas.total === 1 ? "" : "es"}</b>${n.lg.novedadesActivas.porTipo.length ? ` · ${n.lg.novedadesActivas.porTipo.slice(0, 2).map(([k, c]) => `${esc(k)} (${c})`).join(", ")}` : ""}` });
  if (n.lg.sinMovimiento.total) t.push({ icono: "clock", tipo: "ambar", ir: "goTo('logistica')", texto: `<b>Revisar ${n.lg.sinMovimiento.total} pedido${n.lg.sinMovimiento.total === 1 ? "" : "s"} sin movimiento</b> hace más de 24 h` });
  if (n.filasDia.length && n.delDia.gasto === 0) t.push({ icono: "pencil", tipo: "azul", ir: "goTo('control-diario')", texto: `<b>Registrar la pauta ${ayer ? "de ayer" : `del ${fechaCorta(n.dia)}`}</b> para ver la utilidad real` });
  // Anuncios que se están gastando (Meta, guardado 30 min en el servidor)
  for (const x of (st.fatiga?.anuncios || []).slice(0, 3)) t.push({ icono: "battery-low", tipo: "ambar", ir: "goTo('testeos')",
    texto: `<b>Renueva el anuncio de ${esc(x.producto || x.campana || "Meta")}</b>${x.avatar ? ` (${esc(x.avatar)})` : ""} · ${esc(x.razones[0] || "")}. En Mis testeos → Hazme variaciones.` });
  // Temporadas: ya es hora de testear (o lo será esta semana)
  for (const x of proximasTemporadas(st.pais, hoyISO(), 6)) {
    const enDias = Math.round((new Date(x.testearDesde + "T12:00:00Z") - new Date(hoyISO() + "T12:00:00Z")) / 864e5);
    if (x.faltan > 3 && enDias <= 7) t.push({ icono: "calendar-clock", tipo: "azul", ir: "document.getElementById('ihTemporadas')?.scrollIntoView({ behavior: 'smooth' })",
      texto: `<b>${enDias <= 0 ? "Testea ya" : `En ${enDias} día${enDias === 1 ? "" : "s"} empieza a testear`} para ${esc(x.nombre)}</b> · faltan ${x.faltan} días` });
  }
  const dias = diasDesde(n.f.config.ultimaImportacion);
  if (dias !== null && dias >= 1) t.push({ icono: "upload", tipo: "gris", ir: "goTo('control-diario')", texto: `<b>Subir el Excel de Dropi</b> · el último es de hace ${dias} día${dias === 1 ? "" : "s"}` });
  return t;
}
function textoResumen(n, testeos) {
  const pais = st.pais === "EC" ? "Ecuador 🇪🇨" : "Colombia 🇨🇴";
  const pct = (a, b) => (!b ? "" : ` (${a >= b ? "▲" : "▼"} ${Math.abs((a - b) / Math.abs(b) * 100).toFixed(0)}%)`);
  const ayer = n.dia === sumarDias(hoyISO(), -1) ? "Ayer" : `El ${fechaCorta(n.dia)}`;
  const dec = decisionesTesteo(testeos);
  const lineas = [
    `☀️ Resumen CoDropX · ${pais}`,
    "",
    `📅 ${ayer}: ${n.delDia.pedidos} pedidos · gasto ${plata(n.delDia.gasto)} · utilidad ${plata(n.delDia.utilidad)}${n.delDia.gasto === 0 && n.delDia.pedidos ? " (falta la pauta)" : ""}`,
    `📈 7 días: ${n.semana.pedidos} pedidos${pct(n.semana.pedidos, n.semanaAntes.pedidos)} · utilidad ${plata(n.semana.utilidad)}${pct(n.semana.utilidad, n.semanaAntes.utilidad)}`,
    `🚚 Entrega 30 días: ${n.r30.tasaEntrega.toFixed(1)}% · ${n.r30.devoluciones} devoluciones`,
    `⚠️ Por gestionar: ${n.lg.novedadesActivas.total} novedades · ${n.lg.sinMovimiento.total} sin movimiento +24 h`
  ];
  const top = n.filasDia.slice().sort((a, b) => b.utilidad - a.utilidad)[0];
  if (top && top.pedidos) lineas.push(`🏆 Mejor producto ${ayer.toLowerCase()}: ${top.nombre} (${top.pedidos} pedidos · ${plata(top.utilidad)})`);
  if (dec.length) { lineas.push("", "🧪 Testeos:"); for (const x of dec) lineas.push(`${x.sug.accion === "escalar" ? "🚀 Escalar" : "⛔ Apagar"} ${x.p.nombre}${x.sug.motivo ? `: ${x.sug.motivo}` : ""}`); }
  lineas.push("", `Datos de Dropi hasta el ${fechaCorta(n.ultimo)}.`);
  return lineas.join("\n");
}
function tarjetaResumen(n, testeos) {
  const t = loQueToca(n, testeos);
  return `
  <section class="ih-card ih-resumen">
    <div class="ih-card-head">
      <h3><i data-lucide="sunrise"></i> Lo que toca hoy</h3>
      <button class="ih-btn chico" onclick="ihCopiarResumen()"><i data-lucide="message-circle"></i> Copiar resumen para WhatsApp</button>
    </div>
    ${t.length ? `<ul class="ih-toca">${t.map(x => `<li class="${x.tipo}" onclick="${x.ir}"><i data-lucide="${x.icono}"></i><span>${x.texto}</span><i data-lucide="chevron-right"></i></li>`).join("")}</ul>`
      : `<p class="ih-vacio">Todo al día: sin novedades, sin testeos por decidir y con la pauta registrada. 🙌</p>`}
  </section>`;
}
window.ihCopiarResumen = async () => {
  const n = numeros();
  if (!n) return;
  const txt = textoResumen(n, st.productos.filter(p => p.resultado === "testeando"));
  try { await navigator.clipboard.writeText(txt); }
  catch { const t = document.createElement("textarea"); t.value = txt; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
  const b = document.querySelector(".ih-resumen .ih-btn");
  if (b) { const antes = b.innerHTML; b.innerHTML = "✓ Copiado"; setTimeout(() => { b.innerHTML = antes; iconos(); }, 1500); }
};

// ---------- Flujo de caja de los próximos 7 días ----------
const saldoGuardado = () => { try { return Number(localStorage.getItem(`ih_saldo_${st.pais}`)) || 0; } catch { return 0; } };
function tarjetaFlujo(n) {
  const cfg = n.f.config, hoy = hoyISO();
  // Pauta diaria: promedio de los últimos 7 días registrados
  let gasto = 0;
  for (const p of Object.values(n.f.pauta)) if (p.fecha > sumarDias(hoy, -8) && p.fecha <= hoy) gasto += (Number(p.meta) || 0) + (Number(p.tiktok) || 0);
  const gastoDiario = gasto / 7;
  // Costos operativos del mes, por día (lo que esté en otra moneda se pasa con la TRM)
  const moneda = st.pais === "EC" ? "USD" : "COP", trm = Number(cfg.trm || cfg.trmDia) || 4000;
  const mes = hoy.slice(0, 7), diasMes = new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5, 7), 0)).getUTCDate();
  const op = (cfg.costosOperativos || []).filter(c => c.mes === mes).reduce((a, c) => a + (c.moneda === moneda ? c.valor : c.moneda === "USD" ? c.valor * trm : c.valor / trm), 0) / diasMes;
  const saldo = saldoGuardado();
  const fc = flujoCaja(n.f.lineas, { hoy, gastoDiario, operativosDiario: op, saldo, grupos: cfg.grupos || [] });
  const max = Math.max(1, ...fc.dias.map(d => Math.abs(d.saldo)));
  const dia = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("es-CO", { weekday: "short", day: "numeric", timeZone: "UTC" });
  return `
  <section class="ih-card ih-flujo">
    <div class="ih-card-head"><h3><i data-lucide="landmark"></i> Flujo de caja · próximos 7 días</h3>
      <span class="ih-meta-edit"><small>Plata que tienes hoy</small><input id="ihSaldo" type="number" step="any" value="${saldo || ""}" placeholder="Wallet + cuenta" onchange="ihSaldo(this.value)"></span></div>
    ${!saldo ? `<p class="ih-flujo-aviso">Esta semana te entran unos <b class="verde">${plata(fc.entra)}</b> y salen unos <b class="rojo">${plata(fc.sale)}</b>. Escribe la plata que tienes hoy y te digo si te alcanza día por día.</p>`
      : fc.primerCorto ? `<p class="ih-flujo-aviso rojo">⚠️ El <b>${dia(fc.primerCorto.fecha)}</b> te quedarías corto (${plata(fc.primerCorto.saldo)}). Baja la pauta o guarda plata para esos días.</p>`
      : `<p class="ih-flujo-aviso verde">Te alcanza para la pauta de toda la semana. Cierras con unos <b>${plata(fc.dias[fc.dias.length - 1].saldo)}</b>.</p>`}
    <div class="ih-flujo-dias">${fc.dias.map(d => `
      <div title="Entra ${plata(d.entra)} · sale ${plata(d.pauta + d.operativos + d.devoluciones)} (pauta ${plata(d.pauta)}, operativos ${plata(d.operativos)}, devoluciones ${plata(d.devoluciones)})">
        <span class="ih-flujo-barra"><i class="${d.saldo < 0 ? "neg" : ""}" style="height:${Math.abs(d.saldo) / max * 100}%"></i></span>
        <b class="${d.saldo < 0 ? "rojo" : ""}">${plata(d.saldo)}</b>
        <small>${dia(d.fecha)}</small>
        <em>+${plata(d.entra)}</em>
      </div>`).join("")}</div>
    <p class="ih-mini">Entra: tus ${fc.rodando} pedidos rodando y los nuevos (unos ${fc.pedidosDia.toFixed(1)} al día) cuando se entreguen (tardan unos ${fc.diasEntrega} días; se entrega el ${fc.tasa.toFixed(0)}%). Sale: tu pauta (${plata(gastoDiario)} al día, promedio de la última semana), costos operativos (${plata(op)} al día) y las devoluciones. Es una estimación: Dropi puede tardar en liberarte la plata.</p>
  </section>`;
}
window.ihSaldo = (v) => { try { localStorage.setItem(`ih_saldo_${st.pais}`, String(Number(v) || 0)); } catch {} const y = window.scrollY; render($("view")); window.scrollTo(0, y); };

// ---------- Meta del mes y plata por cobrar ----------
function tarjetaMeta(n) {
  const meta = Number(n.f.config.metasMes?.[n.mes]) || 0;
  const nombreMes = new Date(n.mes + "-15T12:00:00Z").toLocaleDateString("es-CO", { month: "long", timeZone: "UTC" });
  const diasMes = new Date(Date.UTC(+n.mes.slice(0, 4), +n.mes.slice(5, 7), 0)).getUTCDate();
  const hoy = Number(hoyISO().slice(8, 10));
  const pasados = Math.max(1, hoy - 1);              // hoy todavía no termina
  const restantes = Math.max(1, diasMes - pasados);
  const llevas = n.delMes.utilidad;
  const proyeccion = llevas / pasados * diasMes;
  const avance = meta ? Math.max(0, Math.min(100, llevas / meta * 100)) : 0;
  const esperado = pasados / diasMes * 100;
  const porDia = meta ? Math.max(0, (meta - llevas) / restantes) : 0;
  const va = !meta ? "" : llevas >= meta ? "lograda" : proyeccion >= meta ? "bien" : "atras";
  const e = n.r60.escenarios;
  return `
  <div class="ih-dos">
    <section class="ih-card ih-meta ${va}">
      <div class="ih-card-head"><h3><i data-lucide="target"></i> Meta de ${nombreMes}</h3>
        <span class="ih-meta-edit"><input id="ihMeta" type="number" min="0" step="any" value="${meta || ""}" placeholder="Tu meta de utilidad"><button class="ih-btn chico" onclick="ihGuardarMeta()">${meta ? "Cambiar" : "Poner meta"}</button></span></div>
      ${meta ? `
      <div class="ih-meta-num"><b>${plata(llevas)}</b><span>de ${plata(meta)} · ${avance.toFixed(0)}%</span></div>
      <div class="ih-meta-barra"><i style="width:${avance}%"></i><em style="left:${esperado}%" title="Dónde deberías ir hoy"></em></div>
      <p class="ih-mini">${va === "lograda" ? "¡Meta cumplida! 🎉 Todo lo que venga es extra."
        : va === "bien" ? `Vas bien: a este ritmo cierras el mes en <b>${plata(proyeccion)}</b>.`
        : `Vas atrás: a este ritmo cierras en <b>${plata(proyeccion)}</b>. Necesitas <b>${plata(porDia)}</b> por día los ${restantes} días que quedan.`}</p>`
      : `<p class="ih-mini">Llevas <b>${plata(llevas)}</b> de utilidad en ${nombreMes}. Ponte una meta y te digo si vas al ritmo y cuánto necesitas por día.</p>`}
      <p class="ih-mini">Utilidad del Control Diario (pedidos del mes, con tu % de devolución estimado y la pauta).</p>
    </section>
    <section class="ih-card">
      <div class="ih-card-head"><h3><i data-lucide="wallet"></i> Plata por cobrar</h3><button class="ih-link" onclick="goTo('reporte-financiero')">Reporte →</button></div>
      ${e ? `
      <div class="ih-meta-num"><b class="verde">${plata(e.actual.gana)}</b><span>de ${e.rodando} pedidos rodando</span></div>
      <p class="ih-mini">Es lo que te entra a la wallet si se entregan como vienes entregando (${e.tasaCerrada === null ? `tu meta de ${n.f.config.metaEntrega || 70}%` : `${Math.round(e.tasaCerrada)}% de los que ya cerraron`}): unos <b>${e.actual.seEntregan}</b> de ${e.rodando}. Los que se devuelvan te costarían unos <b class="rojo">${plata(e.actual.pierde)}</b>.</p>
      <p class="ih-mini">Si se entregan todos: ${plata(e.optimista.gana)}. Gestionar las novedades a tiempo es lo que más mueve este número.</p>`
      : `<p class="ih-vacio">No tienes pedidos rodando ahora.</p>`}
    </section>
  </div>`;
}
window.ihGuardarMeta = async () => {
  const v = Math.max(0, Number($("ihMeta")?.value) || 0);
  try {
    const res = await fetch("/api/finanzas/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pais: st.pais, metaMes: { mes: hoyISO().slice(0, 7), valor: v } }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "No se pudo guardar la meta");
    st.fin[st.pais].config.metasMes = d.metasMes || {};
    const y = window.scrollY; render($("view")); window.scrollTo(0, y);
  } catch (err) { alert(err.message); }
};

// ---------- Kit de temporada: oferta con tus costos + copys, TikTok, banner y ganchos ----------
const kitSt = { temp: null, proyecto: "", av: "", ofertas: null, oferta: "", fin: "", kit: null, estilo: "", cargando: false };
const copiasKit = [];
const btnCopiar = (texto, etiqueta = "Copiar") => { if (!String(texto || "").trim()) return ""; copiasKit.push(String(texto)); return `<button class="ih-copiar" onclick="ihCopiarKit(${copiasKit.length - 1}, this)"><i data-lucide="copy"></i> ${etiqueta}</button>`; };
window.ihCopiarKit = async (i, b) => {
  const t = copiasKit[i] || "";
  try { await navigator.clipboard.writeText(t); } catch { const x = document.createElement("textarea"); x.value = t; document.body.appendChild(x); x.select(); document.execCommand("copy"); x.remove(); }
  if (b) { const a = b.innerHTML; b.innerHTML = "✓ Copiado"; setTimeout(() => { b.innerHTML = a; iconos(); }, 1200); }
};
function modalKit() {
  let m = document.querySelector(".ih-modal-kit");
  if (!m) {
    m = document.createElement("div");
    m.className = "modal-overlay fz-modal ih-modal-kit";
    m.innerHTML = `<div class="modal-box fz-modal-box"></div>`;
    m.addEventListener("click", (e) => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
  }
  return m.querySelector(".fz-modal-box");
}
const proyectosDelPais = () => st.proyectos.filter(p => (p.pais || "CO") === st.pais && Object.keys(p.pasosRamas || {}).length);
window.ihKit = async (id, nombre, fecha) => {
  kitSt.temp = { id, nombre, fecha };
  kitSt.kit = null; kitSt.ofertas = null; kitSt.fin = fecha;
  const lista = proyectosDelPais();
  kitSt.proyecto = lista.some(p => p._id === kitSt.proyecto) ? kitSt.proyecto : (lista[0]?._id || "");
  await cargarOfertas();
};
async function cargarOfertas() {
  const p = st.proyectos.find(x => x._id === kitSt.proyecto);
  const avs = Object.keys(p?.pasosRamas || {}).sort();
  if (!avs.includes(kitSt.av)) kitSt.av = avs[0] || "";
  kitSt.ofertas = null; kitSt.kit = null;
  pintarKit();
  if (!p) return;
  try {
    const r = await (await fetch(`/api/proyectos/${p._id}/ofertas-temporada`)).json();
    if (r.error) throw new Error(r.error);
    kitSt.ofertas = r;
    kitSt.oferta = r.recomendada || r.ofertas[0]?.id || "";
    kitSt.kit = r.kits?.[kitSt.av]?.[kitSt.temp.id] || null;
    kitSt.estilo = r.estilos?.[kitSt.av] || "";
  } catch (err) { kitSt.ofertas = { error: err.message }; }
  pintarKit();
}
function pintarKit() {
  const box = modalKit();
  copiasKit.length = 0;
  const t = kitSt.temp, lista = proyectosDelPais();
  const p = st.proyectos.find(x => x._id === kitSt.proyecto);
  const avs = Object.keys(p?.pasosRamas || {}).sort();
  const o = kitSt.ofertas, k = kitSt.kit;
  const f = (v) => plata(v);
  box.innerHTML = `
    <h3><i data-lucide="gift"></i> Kit de ${esc(t.nombre)}</h3>
    <p class="ih-mini">Elige el producto y la oferta: CoDropX te arma los copys, lo de TikTok, el banner y los ganchos de video con esa oferta exacta.</p>
    ${!lista.length ? `<p class="ih-vacio">No tienes productos en Desarrollo de ${st.pais === "EC" ? "Ecuador" : "Colombia"} con avatares.</p>` : `
    <div class="ih-kit-sel">
      <label>Producto<select onchange="ihKitProyecto(this.value)">${lista.map(x => `<option value="${esc(x._id)}" ${x._id === kitSt.proyecto ? "selected" : ""}>${esc(x.nombre)}</option>`).join("")}</select></label>
      ${avs.length > 1 ? `<label>Avatar<select onchange="ihKitAvatar(this.value)">${avs.map(a => `<option ${a === kitSt.av ? "selected" : ""}>${esc(a)}</option>`).join("")}</select></label>` : ""}
      <label>La oferta va hasta<input type="date" value="${esc(kitSt.fin)}" onchange="ihKitFin(this.value)"></label>
    </div>
    ${!o ? `<p class="ih-mini">Calculando las ofertas con tus costos…</p>` : o.error ? `<p class="rojo">${esc(o.error)}</p>` : `
    <h4>Oferta ${o.conCosteo ? "(con tus costos del costeo)" : ""}</h4>
    ${o.conCosteo ? "" : `<p class="ih-mini rojo">Este producto no tiene costeo: no sé cuánto te deja cada oferta. Cóstealo en la Calculadora antes de lanzar.</p>`}
    <div class="ih-ofertas">${o.ofertas.map(x => `
      <label class="ih-oferta ${kitSt.oferta === x.id ? "elegida" : ""} ${x.viable === false ? "pierde" : ""}">
        <input type="radio" name="ihOferta" ${kitSt.oferta === x.id ? "checked" : ""} onchange="ihKitOferta('${x.id}')">
        <b>${esc(x.nombre)}</b>${o.recomendada === x.id ? `<em>Recomendada</em>` : ""}
        <span>${x.unidades} ud. por ${f(x.precio)}${x.antes > x.precio ? ` <s>${f(x.antes)}</s>` : ""}</span>
        ${x.utilidad === null ? "" : `<small class="${x.utilidad < 0 ? "rojo" : ""}">${x.utilidad < 0 ? "Pierdes" : "Te deja"} ${f(Math.abs(x.utilidad))} por pedido (${x.margen.toFixed(0)}%)</small>`}
      </label>`).join("")}</div>
    ${o.normal.utilidad !== null ? `<p class="ih-mini">Sin oferta, cada pedido te deja ${f(o.normal.utilidad)}. Las ofertas cuentan tus devoluciones y la pauta de los que no se entregan.</p>` : ""}
    <div class="ih-kit-acc"><button class="ih-btn" id="ihBtnKit" onclick="ihArmarKit()"><i data-lucide="sparkles"></i> ${k ? "Volver a armar el kit" : "Armar kit"}</button></div>
    ${k ? vistaKit(k) : ""}`}`}
    <div class="fz-modal-pie"><button class="ih-btn" onclick="document.querySelector('.ih-modal-kit')?.remove()">Cerrar</button></div>`;
  iconos();
}
function vistaKit(k) {
  const tk = k.tiktok || {}, b = k.banner || {};
  return `
    <div class="ih-kit">
      <p class="ih-mini">Kit armado el ${new Date(k.creado).toLocaleDateString("es-CO")} con la oferta <b>${esc(k.oferta?.texto || "")}</b> a ${plata(k.oferta?.precio)}${k.fin ? `, hasta el ${esc(k.fin.split("-").reverse().join("/"))}` : ""}.</p>
      <h4>Copys para Meta</h4>
      ${(k.copys || []).map(c => `<div class="ih-kit-copy"><small>${esc(c.enfoque)}</small><p>${esc(c.texto_principal).replace(/\n/g, "<br>")}</p><small>Título: <b>${esc(c.titulo)}</b> · Descripción: ${esc(c.descripcion)}</small><div>${btnCopiar(c.texto_principal, "Copiar texto")}${btnCopiar(c.titulo, "Copiar título")}${btnCopiar(c.descripcion, "Copiar descripción")}</div></div>`).join("")}
      <h4>TikTok</h4>
      <div class="ih-kit-copy"><small>Texto del anuncio</small><p>${esc(tk.texto)}</p><small>Caption para Spark Ads</small><p>${esc(tk.caption)}</p>${(tk.ganchos || []).length ? `<small>Ganchos</small><p>${tk.ganchos.map((g, i) => `${i + 1}. ${esc(g)}`).join("<br>")}</p>` : ""}<div>${btnCopiar(tk.texto, "Copiar texto")}${btnCopiar(tk.caption, "Copiar caption")}</div></div>
      <h4>Banner de temporada</h4>
      <div class="ih-kit-copy"><p><b>${esc(b.sello)}</b><br>${esc(b.titular)}<br>${esc(b.subtitulo)}<br>${esc(b.oferta)} · ${esc(b.cta)}</p>
        ${k.prompt_banner ? `<details><summary>Prompt para Gemini</summary><pre>${esc(k.prompt_banner)}</pre></details>` : ""}
        <div>${btnCopiar((kitSt.estilo ? kitSt.estilo + "\n\n" : "") + (k.prompt_banner || ""), "Copiar estilo + prompt")}</div></div>
      ${(k.ganchos_video || []).length ? `<h4>Ganchos de video</h4><div class="ih-kit-copy"><p>${k.ganchos_video.map((g, i) => `${i + 1}. ${esc(g)}`).join("<br>")}</p><div>${btnCopiar(k.ganchos_video.join("\n"), "Copiar ganchos")}</div></div>` : ""}
      <p class="ih-mini">Pon el mismo precio y la misma oferta en la landing de Shopify: Meta y TikTok revisan que coincidan.</p>
    </div>`;
}
window.ihKitProyecto = (id) => { kitSt.proyecto = id; cargarOfertas(); };
window.ihKitAvatar = (av) => { kitSt.av = av; kitSt.kit = kitSt.ofertas?.kits?.[av]?.[kitSt.temp.id] || null; kitSt.estilo = kitSt.ofertas?.estilos?.[av] || ""; pintarKit(); };
window.ihKitOferta = (id) => { kitSt.oferta = id; pintarKit(); };
window.ihKitFin = (v) => { kitSt.fin = v; };
window.ihArmarKit = async () => {
  const b = $("ihBtnKit");
  if (!b || b.disabled) return;
  const o = kitSt.ofertas?.ofertas?.find(x => x.id === kitSt.oferta);
  if (o?.viable === false && !confirm(`Con esta oferta pierdes plata en cada pedido. ¿Armar el kit igual?`)) return;
  b.disabled = true; b.innerHTML = `<span class="est-spin"></span> Armando el kit…`;
  try {
    const res = await fetch(`/api/proyectos/${kitSt.proyecto}/rama/${encodeURIComponent(kitSt.av)}/ia/kit-temporada`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temporada: kitSt.temp, ofertaId: kitSt.oferta, fin: kitSt.fin })
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "No se pudo armar el kit");
    kitSt.kit = d.kit; kitSt.estilo = d.bloqueEstilo || "";
    (kitSt.ofertas.kits ||= {})[kitSt.av] = { ...(kitSt.ofertas.kits[kitSt.av] || {}), [kitSt.temp.id]: d.kit };
    pintarKit();
  } catch (err) {
    alert(err.message);
    if (document.body.contains(b)) { b.disabled = false; b.innerHTML = `<i data-lucide="sparkles"></i> Armar kit`; iconos(); }
  }
};

// ---------- Próximas temporadas ----------
function tarjetaTemporadas() {
  const lista = proximasTemporadas(st.pais, hoyISO(), 5);
  if (!lista.length) return "";
  const fechaLarga = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });
  return `
  <section class="ih-card" id="ihTemporadas">
    <div class="ih-card-head"><h3><i data-lucide="calendar-days"></i> Próximas temporadas en ${st.pais === "EC" ? "Ecuador" : "Colombia"}</h3></div>
    <ul class="ih-temporadas">${lista.map(x => `
      <li class="${x.yaTestear ? "ya" : ""}">
        <div class="ih-temp-fecha"><b>${x.faltan === 0 ? "Hoy" : x.faltan}</b><small>${x.faltan === 0 ? "" : x.faltan === 1 ? "día" : "días"}</small></div>
        <div class="ih-temp-info">
          <strong>${esc(x.nombre)}</strong> <small>${fechaLarga(x.fecha)}${x.aprox ? " (aprox.)" : ""}</small>
          <p>${esc(x.ideas)}</p>
          <button class="ih-btn chico ih-kit-btn" onclick="ihKit('${esc(x.id)}', '${esc(x.nombre)}', '${esc(x.fecha)}')"><i data-lucide="gift"></i> Armar kit</button>
          <em>${x.yaTestear ? (x.faltan <= 7 ? "Ya es tarde para testear algo nuevo: escala lo que ya te funciona." : "Ya deberías estar testeando para esta fecha.") : `Empieza a testear el ${fechaLarga(x.testearDesde)} (${x.testear} días antes).`}</em>
        </div>
      </li>`).join("")}</ul>
  </section>`;
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
  // Excel viejo, pauta pendiente y novedades van en "Lo que toca hoy"
  if (st.meta && st.meta.configurado && !st.meta.conectado) a.push({ tipo: "azul", icono: "plug", texto: "Conecta Meta Ads para que la pauta se llene sola.", ir: "goTo('integraciones')" });
  const lanzadosSinCosteo = st.productos.filter(p => p.estado === "lanzado" && (p.pais || "CO") === st.pais && !st.costeos.has(String(p._id)));
  if (lanzadosSinCosteo.length) a.push({ tipo: "gris", icono: "calculator", texto: `${lanzadosSinCosteo.length} producto(s) lanzados sin costeo: ${lanzadosSinCosteo.slice(0, 2).map(p => esc(p.nombre)).join(", ")}${lanzadosSinCosteo.length > 2 ? "…" : ""}`, ir: "goTo('calculadora')" });
  return a.slice(0, 4);
}

// ---------- CoDropX como app en el celular ----------
const yaInstalada = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
window.ihInstalar = async () => {
  const e = window.__instalarApp;
  if (e) {
    e.prompt();
    const r = await e.userChoice.catch(() => null);
    window.__instalarApp = null;
    if (r?.outcome === "accepted") render($("view"));
    return;
  }
  const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent);
  alert(iphone
    ? "En iPhone: abre codropx.com en Safari, toca el botón Compartir (el cuadrito con la flecha hacia arriba) y elige \"Agregar a pantalla de inicio\"."
    : "En Android: abre codropx.com en Chrome, toca el menú ⋮ (arriba a la derecha) y elige \"Instalar app\" o \"Agregar a pantalla principal\".\n\nEn el computador: en Chrome, el ícono de instalar aparece a la derecha de la barra de direcciones.");
};

window.ihPais = async (p) => {
  st.pais = p === "EC" ? "EC" : "CO";
  try { localStorage.setItem("fz_pais", st.pais); } catch {}
  await cargarFinanzas(st.pais);
  render($("view"));
};
window.ihAbrirProyecto = (id) => { goTo("desarrollo"); setTimeout(() => window.estAbrirProyectoEn?.(id, null), 50); };

// Fatiga de anuncios: se pide aparte para no demorar el tablero (solo si Meta está conectado y hay cuentas elegidas)
async function cargarFatiga(view) {
  if (!st.meta?.conectado || !(st.fin[st.pais]?.config?.metaCuentas || []).length) return;
  try {
    st.fatiga = await api(`/api/meta/fatiga?pais=${st.pais}`);
    if (st.fatiga?.anuncios?.length && document.body.contains(view)) { const y = window.scrollY; render(view); window.scrollTo(0, y); }
  } catch { st.fatiga = null; }
}

registrarRuta("inicio", async (view) => {
  window.marcarMenuActivo?.("inicio");
  nuevoMensaje();      // cada vez que entras a Inicio, otro mensaje
  try { st.pais = localStorage.getItem("fz_pais") || st.pais; } catch {}
  view.innerHTML = `<div class="in-home"><p class="est-muted">Cargando tu tablero...</p></div>`;
  try {
    await cargar();
    render(view);
    cargarFatiga(view);
  } catch (err) {
    view.innerHTML = `<div class="in-home"><p class="est-error">${esc(err.message)}</p></div>`;
  }
});
