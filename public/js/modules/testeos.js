// =============================================
// 🧪 MIS TESTEOS — cómo le fue a cada producto que lanzaste
// Resultado (testeando, winner, perdedor, inconcluso), fecha, avatar y nota.
// Usa los productos de la Base (Colombia y Ecuador juntos).
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { formatear } from "../core/costeo.js";
import { claveDeProducto, metricasProducto, sugerirResultado } from "../core/finanzas.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");
const iconos = () => { if (window.lucide) lucide.createIcons(); };

const RESULTADOS = {
  testeando: { nombre: "Testeando", corto: "TESTEANDO", desc: "en pauta ahora" },
  winner: { nombre: "Winner", corto: "WINNER", desc: "vendió y es rentable" },
  perdedor: { nombre: "Perdedor", corto: "PERDEDOR", desc: "no funcionó" },
  inconcluso: { nombre: "Inconcluso", corto: "INCONCLUSO", desc: "faltó gasto o datos" }
};
const PAISES = { CO: "🇨🇴 CO", EC: "🇪🇨 EC" };
const AVATARES = [["", "—"], ["A", "Avatar A"], ["B", "Avatar B"], ["AB", "A y B"]];

let productos = [];
let costeos = new Map();
let proyectos = new Map();
let fin = {};   // { CO: { lineas, pauta, config }, EC: {...} } de Finanzas
const filtro = { resultado: "todos", pais: "", buscar: "" };

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
  el._t = setTimeout(() => el.classList.remove("show"), tipo === "error" ? 4000 : 1400);
}

const enTesteo = () => productos.filter(p => p.resultado);
const fechaInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const diasDe = (p) => {
  const ini = p.testeo?.inicio ? new Date(p.testeo.inicio) : null;
  if (!ini) return "";
  const fin = p.testeo?.fin ? new Date(p.testeo.fin) : new Date();
  const d = Math.max(0, Math.round((fin - ini) / 864e5));
  return `${d} día${d === 1 ? "" : "s"}`;
};

function lista() {
  const t = filtro.buscar.trim().toLowerCase();
  return enTesteo()
    .filter(p => filtro.resultado === "todos" || p.resultado === filtro.resultado)
    .filter(p => !filtro.pais || (p.pais || "CO") === filtro.pais)
    .filter(p => !t || String(p.nombre || "").toLowerCase().includes(t) || String(p.dropiId || "").includes(t))
    .sort((a, b) => new Date(b.testeo?.inicio || 0) - new Date(a.testeo?.inicio || 0));
}

function render() {
  const view = $("view");
  if (!view) return;
  const todos = enTesteo();
  const cuenta = (r) => todos.filter(p => p.resultado === r).length;
  const sinTesteo = productos.filter(p => !p.resultado)
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es", { sensitivity: "base" }));
  const filas = lista();

  view.innerHTML = `
  <div class="ts-page">
    <header class="ts-head">
      <h1><i data-lucide="flask-conical"></i> Mis testeos</h1>
      <p>Cada producto que lanzas, con su resultado, desde cuándo, con qué avatar y lo que aprendiste. Al pasar un producto a "Lanzado" en tu Base, entra aquí solo como <b>Testeando</b>.</p>
    </header>

    <div class="ts-tarjetas">
      ${Object.entries(RESULTADOS).map(([k, r]) => `
        <button class="ts-tarjeta ${k} ${filtro.resultado === k ? "activa" : ""}" onclick="tsFiltrar('${k}')">
          <b>${cuenta(k)}</b><span>${r.corto}</span><small>${r.desc}</small>
        </button>`).join("")}
    </div>

    <div class="ts-barra">
      <input id="tsBuscar" placeholder="Buscar por nombre o ID de Dropi" value="${esc(filtro.buscar)}" oninput="tsBuscar(this.value)">
      <select onchange="tsPais(this.value)">
        <option value="">Todos los países</option>
        <option value="CO" ${filtro.pais === "CO" ? "selected" : ""}>🇨🇴 Colombia</option>
        <option value="EC" ${filtro.pais === "EC" ? "selected" : ""}>🇪🇨 Ecuador</option>
      </select>
      ${filtro.resultado !== "todos" ? `<button class="ts-limpiar" onclick="tsFiltrar('todos')">Ver todos (${todos.length})</button>` : ""}
      <span class="ts-espacio"></span>
      <select id="tsAgregar" title="Producto de tu Base que vas a testear">
        <option value="">+ Agregar producto al testeo…</option>
        ${["CO", "EC"].map(pa => {
          const items = sinTesteo.filter(p => (p.pais || "CO") === pa);
          return items.length ? `<optgroup label="${pa === "CO" ? "Colombia" : "Ecuador"}">${items.map(p => `<option value="${esc(p._id)}">${esc(p.nombre)}${p.dropiId ? ` · Dropi ${esc(p.dropiId)}` : ""}</option>`).join("")}</optgroup>` : "";
        }).join("")}
      </select>
      <button class="ts-btn" onclick="tsAgregar()"><i data-lucide="plus"></i> Agregar</button>
    </div>

    <section class="ts-tabla">
      <div class="ts-fila ts-enc">
        <div>Producto</div><div>País</div><div>Avatar</div><div>Resultado</div><div>Inicio</div><div>Números del testeo</div><div></div>
      </div>
      ${filas.length ? filas.map(fila).join("") : `<div class="ts-vacio">${todos.length
        ? "No hay testeos con ese filtro."
        : "Todavía no tienes testeos. Agrega un producto arriba, o pásalo a \"Lanzado\" en tu Base de Productos."}</div>`}
    </section>
    <p class="ts-nota">Los números salen de <b>Finanzas</b>: pedidos de tus Excel de Dropi (por el ID de Dropi del producto) y la pauta que registras en el Control Diario, desde la fecha de inicio del testeo. La sugerencia no cambia nada sola: tú decides con "Aplicar".</p>
  </div>`;
  iconos();
}

// Números del testeo desde Finanzas
export function numerosTesteo(p, finanzas = fin, costeo = null) {
  const f = finanzas[p.pais || "CO"];
  if (!f || !f.lineas?.length) return { m: null, sug: { resultado: null, motivo: "Sube el Excel de Dropi en Finanzas para ver los números." } };
  const grupos = f.config?.grupos || [];
  const clave = claveDeProducto(p, f.lineas, grupos);
  const desde = p.testeo?.inicio ? new Date(p.testeo.inicio).toISOString().slice(0, 10) : null;
  const hasta = p.testeo?.fin ? new Date(p.testeo.fin).toISOString().slice(0, 10) : null;
  const m = clave ? metricasProducto(f.lineas, { clave, desde, hasta, pauta: f.pauta, grupos, devPct: f.config?.devPct ?? 25 }) : null;
  return { m, sug: sugerirResultado(m && (m.pedidos || m.gasto) ? m : null, costeo?.resumen?.bep || null) };
}

function fila(p) {
  const c = costeos.get(String(p._id));
  const pr = proyectos.get(String(p._id));
  const r = p.resultado;
  const nota = p.testeo?.nota || "";
  return `
  <div class="ts-fila">
    <div class="ts-nombre">
      <strong>${esc(p.nombre)}</strong>
      <small>${p.dropiId ? `Dropi ${esc(p.dropiId)}` : esc(p.origen || "")}${pr?.vendio ? ` · <span class="ts-vendio">Vendió ✓</span>` : ""}</small>
      ${nota ? `<small class="ts-nota-fila" title="${esc(nota)}">📝 ${esc(nota)}</small>` : ""}
    </div>
    <div class="ts-pais">${PAISES[p.pais || "CO"] || esc(p.pais)}</div>
    <div>
      <select class="ts-sel" onchange="tsGuardar('${esc(p._id)}', { avatar: this.value })">
        ${AVATARES.map(([k, t]) => `<option value="${k}" ${(p.testeo?.avatar || "") === k ? "selected" : ""}>${t}</option>`).join("")}
      </select>
    </div>
    <div>
      <select class="ts-sel ts-res ${r}" onchange="tsGuardar('${esc(p._id)}', { resultado: this.value })">
        ${Object.entries(RESULTADOS).map(([k, x]) => `<option value="${k}" ${r === k ? "selected" : ""}>${x.corto}</option>`).join("")}
      </select>
      ${sugerencia(p, c)}
    </div>
    <div class="ts-fecha">
      <input type="date" value="${fechaInput(p.testeo?.inicio)}" onchange="tsGuardar('${esc(p._id)}', { inicio: this.value })">
      <small>${diasDe(p)}</small>
    </div>
    ${celdaNumeros(p, c)}
    <div class="ts-acciones">
      <button class="ts-icono" title="Nota de lo que aprendiste" onclick="tsNota('${esc(p._id)}')"><i data-lucide="sticky-note"></i></button>
      ${pr ? `<button class="ts-icono" title="Abrir su proyecto en Desarrollo" onclick="bpAbrirProyecto('${esc(pr._id)}')"><i data-lucide="folder-open"></i></button>` : ""}
      <button class="ts-icono peligro" title="Quitar de Mis testeos" onclick="tsQuitar('${esc(p._id)}')"><i data-lucide="x"></i></button>
    </div>
  </div>`;
}

function celdaNumeros(p, c) {
  const { m } = numerosTesteo(p, fin, c);
  const pais = p.pais || "CO";
  if (!m || (!m.pedidos && !m.gasto)) {
    return `<div class="ts-precio"><small>${c?.resumen?.redondeado ? `Precio ${formatear(c.resumen.redondeado, pais)} · equilibrio ${formatear(c.resumen.bep, pais)}` : "Sin costeo"}</small><small>Sin pedidos ni pauta en Finanzas</small></div>`;
  }
  return `<div class="ts-num">
    <span><b>${m.pedidos}</b> ped · gasto <b>${formatear(m.gasto, pais)}</b></span>
    <span>CPA ${m.cpa === null ? "—" : formatear(m.cpa, pais)}${m.equilibrio ? ` <small>/ eq. ${formatear(m.equilibrio, pais)}</small>` : ""}</span>
    <span class="${m.utilidad < 0 ? "rojo" : "verde"}">Utilidad ${m.utilidad < 0 ? "-" : ""}${formatear(Math.abs(m.utilidad), pais)}</span>
    ${m.tasaEntrega !== null && m.cerrados ? `<small>Entrega real ${Math.round(m.tasaEntrega)}% (${m.entregados}/${m.despachados})</small>` : ""}
  </div>`;
}

function sugerencia(p, c) {
  const { sug } = numerosTesteo(p, fin, c);
  if (!sug.resultado || sug.resultado === p.resultado) return sug.motivo ? `<small class="ts-sug-txt" title="${esc(sug.motivo)}">${esc(sug.motivo)}</small>` : "";
  return `<div class="ts-sug ${sug.resultado}" title="${esc(sug.motivo)}">
    <span>Sugerido: <b>${RESULTADOS[sug.resultado].corto}</b></span>
    <button onclick="tsGuardar('${esc(p._id)}', { resultado: '${sug.resultado}' })">Aplicar</button>
    <small>${esc(sug.motivo)}</small>
  </div>`;
}

async function cargarFinanzas() {
  const paises = [...new Set(enTesteo().map(p => p.pais || "CO"))].filter(x => ["CO", "EC"].includes(x));
  fin = {};
  await Promise.all(paises.map(async (pa) => {
    try {
      const [lineas, pauta, config] = await Promise.all([
        api("GET", `/api/finanzas/lineas?pais=${pa}`),
        api("GET", `/api/finanzas/pauta?pais=${pa}`),
        api("GET", `/api/finanzas/config?pais=${pa}`)
      ]);
      fin[pa] = { lineas, config, pauta: Object.fromEntries(pauta.map(x => [`${x.fecha}|${x.clave}`, x])) };
    } catch { /* sin finanzas: la lista funciona igual */ }
  }));
}

async function cargar() {
  const [ps, cs, prs] = await Promise.all([
    api("GET", "/api/productos"),
    api("GET", "/api/costeos").catch(() => []),
    api("GET", "/api/proyectos").catch(() => [])
  ]);
  productos = Array.isArray(ps) ? ps : [];
  costeos = new Map((cs || []).filter(c => c.productoId).map(c => [String(c.productoId), c]));
  proyectos = new Map((prs || []).filter(p => p.productoId).map(p => [String(p.productoId), p]));
  await cargarFinanzas();
}

async function guardar(id, cambios) {
  const { producto } = await api("PUT", `/api/productos/${id}/testeo`, cambios);
  const i = productos.findIndex(p => p._id === id);
  if (i >= 0) productos[i] = producto;
}

window.tsGuardar = async (id, cambios) => {
  try {
    await guardar(id, cambios);
    avisar("Guardado ✓");
    const y = window.scrollY; render(); window.scrollTo(0, y);
  } catch (err) { avisar(err.message, "error"); }
};

window.tsAgregar = async () => {
  const id = $("tsAgregar")?.value;
  if (!id) return avisar("Elige el producto que vas a testear", "error");
  try {
    await guardar(id, { resultado: "testeando" });
    await cargarFinanzas();
    filtro.resultado = "todos";
    avisar("Agregado a Mis testeos ✓");
    render();
  } catch (err) { avisar(err.message, "error"); }
};

window.tsNota = async (id) => {
  const p = productos.find(x => x._id === id);
  const nota = prompt(`Nota del testeo de "${p?.nombre || ""}" (qué aprendiste, por qué ganó o perdió):`, p?.testeo?.nota || "");
  if (nota === null) return;
  await window.tsGuardar(id, { nota });
};

window.tsQuitar = async (id) => {
  const p = productos.find(x => x._id === id);
  if (!confirm(`¿Quitar "${p?.nombre || ""}" de Mis testeos? El producto sigue en tu Base.`)) return;
  await window.tsGuardar(id, { resultado: "", inicio: null, avatar: "", nota: "" });
};

window.tsFiltrar = (r) => { filtro.resultado = filtro.resultado === r ? "todos" : r; render(); };
window.tsPais = (v) => { filtro.pais = v; render(); };
window.tsBuscar = (v) => {
  filtro.buscar = v;
  const pos = $("tsBuscar")?.selectionStart;
  render();
  const el = $("tsBuscar"); if (el) { el.focus(); el.setSelectionRange(pos, pos); }
};

registrarRuta("testeos", async (view) => {
  window.marcarMenuActivo?.("testeos");
  filtro.buscar = "";
  view.innerHTML = `<div class="ts-page"><p class="est-muted">Cargando testeos...</p></div>`;
  try {
    await cargar();
    render();
  } catch (err) {
    view.innerHTML = `<div class="ts-page"><p class="est-error">${esc(err.message)}</p></div>`;
  }
});
