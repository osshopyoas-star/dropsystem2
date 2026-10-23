// =============================================
// Base de productos: lista con buscador, filtros, páginas y avance
// guardar, editar, estado, eliminar
// =============================================
import { state } from "../state.js";
import { escapeHTML } from "../core/utils.js";
import { formatear } from "../core/costeo.js";
import { renderProductos } from "../../views/productos.js";
import { registrarRuta } from "./navegacion.js";
import { GRUPOS_ANALISIS, TIPOS_RECURSO, MAX_RECURSOS, puntaje, porGrupo, veredicto } from "../core/analisis.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");

const POR_PAGINA = 15;
const ESTADOS = [
  ["idea", "Idea"],
  ["validando", "Validando"],
  ["desarrollo", "Desarrollo"],
  ["lanzado", "Lanzado"]
];
const ORDEN_ESTADO = { idea: 0, validando: 1, desarrollo: 2, lanzado: 3 };

// Preferencias de la lista (se recuerdan mientras navegas)
const vista = { buscar: "", estado: "todos", orden: "estado", pagina: 1 };
try { Object.assign(vista, JSON.parse(sessionStorage.getItem("bp_vista") || "{}"), { buscar: "" }); } catch {}
const recordarVista = () => { try { sessionStorage.setItem("bp_vista", JSON.stringify(vista)); } catch {} };

let costeosPorProducto = new Map();
let proyectosPorProducto = new Map();

window.productoPaisActivo = null;

window.setProductoPais = function(pais) {
  if (window.productoPaisActivo !== pais) vista.pagina = 1;
  window.productoPaisActivo = pais;
  goTo("productos");
  marcarMenuActivo(pais === "EC" ? "productos-ec" : "productos-co");
};

// ---------- Formulario ----------
window.toggleCampoDropi = function() {
  const origen = ($("origen")?.value || "").toLowerCase();
  const wrap = $("dropiIdWrap");
  if (!wrap) return;
  const mostrar = origen === "dropi";
  wrap.hidden = !mostrar;
  if (!mostrar && $("dropiId")) $("dropiId").value = "";
};

function limpiarFormulario() {
  ["nombre", "dropiId", "material", "landing", "creativos"].forEach(id => { if ($(id)) $(id).value = ""; });
  if ($("origen")) $("origen").value = "dropi";
  window.productoEditandoId = null;
  toggleCampoDropi();
}

window.bpMostrarFormulario = function() {
  limpiarFormulario();
  $("bpFormTitulo").textContent = "Nuevo producto";
  $("bpFormulario")?.classList.remove("hidden");
  $("nombre")?.focus();
};

window.bpCancelarFormulario = function() {
  limpiarFormulario();
  $("bpFormulario")?.classList.add("hidden");
};

window.guardarProducto = async function() {
  const nombre = $("nombre").value.trim();
  if (!nombre) { alert("Escribe el nombre del producto"); return; }

  const editando = window.productoEditandoId;
  const producto = {
    nombre,
    origen: $("origen").value,
    dropiId: $("origen").value === "dropi" ? $("dropiId").value.trim() : "",
    material: $("material").value,
    landing: $("landing").value.trim(),
    creativos: $("creativos").value.trim(),
    pais: window.productoPaisActivo
  };
  if (!editando) {
    Object.assign(producto, {
      estado: "idea",
      desarrollo: { avatar: false, angulos: false, creativos: false, landing: false },
      fecha: new Date()
    });
  }

  try {
    const res = await fetch(editando ? `/api/productos/${editando}` : "/api/productos", {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(producto)
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "No se pudo guardar"); return; }

    bpCancelarFormulario();
    await cargarProductos();
    renderTablaProductos();
  } catch (err) {
    console.error("Error guardando producto:", err);
    alert("No se pudo guardar");
  }
};

window.editarProducto = function(id) {
  const p = state.productos.find(x => x._id === id);
  if (!p) return;
  $("bpFormulario")?.classList.remove("hidden");
  $("bpFormTitulo").textContent = `Editando: ${p.nombre}`;
  $("nombre").value = p.nombre || "";
  $("origen").value = p.origen || "dropi";
  $("dropiId").value = p.dropiId || "";
  $("material").value = p.material || "";
  $("landing").value = p.landing || "";
  $("creativos").value = p.creativos || "";
  window.productoEditandoId = id;
  toggleCampoDropi();
  $("bpFormulario")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

// ---------- Datos ----------
window.cargarProductos = async function() {
  try {
    const q = window.productoPaisActivo ? `?pais=${window.productoPaisActivo}` : "";
    const [productos, costeos, proyectos] = await Promise.all([
      fetch(`/api/productos${q}`).then(r => r.json()),
      fetch("/api/costeos").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/proyectos").then(r => r.ok ? r.json() : []).catch(() => [])
    ]);
    state.productos = Array.isArray(productos) ? productos : [];
    costeosPorProducto = new Map((costeos || []).filter(c => c.productoId).map(c => [String(c.productoId), c]));
    proyectosPorProducto = new Map((proyectos || []).filter(p => p.productoId).map(p => [String(p.productoId), p]));
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
};

function filtrados() {
  const texto = vista.buscar.trim().toLowerCase();
  let lista = state.productos.filter(p => {
    if (vista.estado !== "todos" && (p.estado || "idea") !== vista.estado) return false;
    if (!texto) return true;
    return String(p.nombre || "").toLowerCase().includes(texto) || String(p.dropiId || "").includes(texto);
  });

  const porNombre = (a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" });
  if (vista.orden === "nombre") lista.sort(porNombre);
  else if (vista.orden === "recientes") lista.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  else lista.sort((a, b) => (ORDEN_ESTADO[a.estado || "idea"] ?? 0) - (ORDEN_ESTADO[b.estado || "idea"] ?? 0) || porNombre(a, b));
  return lista;
}

// ---------- Lista ----------
function chipsAvance(p) {
  const c = costeosPorProducto.get(String(p._id));
  const pr = proyectosPorProducto.get(String(p._id));
  const chips = [];
  if (c?.resumen?.redondeado) {
    const util = c.resumen.utilidadPct != null ? ` · ${Number(c.resumen.utilidadPct).toFixed(0)}%` : "";
    chips.push(`<span class="bp-chip precio" title="Precio de la calculadora y utilidad">${formatear(c.resumen.redondeado, c.pais)}${util}</span>`);
  }
  if (pr) {
    const pasos = Object.entries(pr.pasosRamas || {}).sort().map(([k, v]) => `${k} ${v}/6`).join(" · ");
    chips.push(`<span class="bp-chip proyecto" title="Avance en Desarrollo">${pasos || `paso ${Math.min(pr.paso || 1, 2)}/6`}</span>`);
  }
  if (pr?.vendio) chips.push(`<span class="bp-chip vendio">Vendió ✓</span>`);
  const RES = { listo: "Listo para testear", testeando: "Testeando", winner: "Winner", perdedor: "Perdedor", inconcluso: "Inconcluso" };
  if (RES[p.resultado]) chips.push(`<span class="bp-chip res-${p.resultado}" title="Resultado en Mis testeos">${RES[p.resultado]}</span>`);
  const pts = puntaje(p.analisis);
  const ver = veredicto(pts);
  if (ver) chips.push(`<button class="bp-chip an-${ver.clave}" title="Análisis de 19 criterios: ${ver.texto}" onclick="bpAbrirAnalisis('${esc(p._id)}')">${pts}/100</button>`);
  return chips.join("") || `<span class="bp-sin">Sin empezar</span>`;
}

function fuente(p) {
  if (p.origen === "dropi") return p.dropiId
    ? `<button class="bp-dropi" title="Abrir el buscador de Dropi ${p.pais === "EC" ? "Ecuador" : "Colombia"} (el ID queda copiado: pégalo con Ctrl+V)" onclick="abrirDropi('${esc(p.dropiId)}', '${esc(p.pais || "CO")}')">Dropi ${esc(p.dropiId)} <i data-lucide="external-link"></i></button>`
    : "Dropi · sin ID";
  if (p.origen === "importacion") return "Importación";
  if (p.origen === "laboratorio") return "Laboratorio";
  return "";
}

function fila(p) {
  const i = state.productos.indexOf(p);
  const pr = proyectosPorProducto.get(String(p._id));
  const estado = p.estado || "idea";
  const link = (url, icono, titulo, fn) => url
    ? `<button class="bp-icono" title="${titulo}" onclick="${fn}(${i})"><i data-lucide="${icono}"></i></button>`
    : `<button class="bp-icono vacio" title="${titulo}: sin dato" disabled><i data-lucide="${icono}"></i></button>`;

  return `
  <div class="bp-fila">
    <div class="bp-nombre">
      <strong>${esc(p.nombre)}</strong>
      <small>${fuente(p)}</small>
    </div>
    <div class="bp-avance">${chipsAvance(p)}</div>
    <div class="bp-links">
      ${link(p.material, "file-text", "Notas", "abrirMaterial")}
      ${link(p.creativos, "video", "Creativos", "abrirCreativos")}
      ${link(p.landing, "globe", "Landing", "abrirLanding")}
    </div>
    <div>
      <select class="select-pro estado-${esc(estado)}" onchange="cambiarEstado('${esc(p._id)}', this.value)">
        ${ESTADOS.map(([k, t]) => `<option value="${k}" ${estado === k ? "selected" : ""}>${t}</option>`).join("")}
      </select>
    </div>
    <div class="bp-accion">
      ${pr
        ? `<button class="bp-btn chico" title="Abrir su proyecto en Desarrollo" onclick="bpAbrirProyecto('${esc(pr._id)}')">Abrir</button>
           <button class="bp-icono" title="Ver costeo en la calculadora" onclick="calAbrirConProducto('${esc(p._id)}', '${esc(p.pais || "")}')"><i data-lucide="calculator"></i></button>`
        : `<button class="bp-btn chico" title="Costear en la calculadora y pasar a Desarrollo" onclick="calAbrirConProducto('${esc(p._id)}', '${esc(p.pais || "")}')">Crear</button>`}
    </div>
    <div class="bp-acciones">
      <button class="bp-icono ${(p.recursos || []).length || p.analisis ? "con-datos" : ""}" title="Análisis y recursos${(p.recursos || []).length ? ` (${p.recursos.length} guardados)` : ""}" onclick="bpAbrirAnalisis('${esc(p._id)}')"><i data-lucide="clipboard-check"></i></button>
      <button class="bp-icono" title="Editar" onclick="editarProducto('${esc(p._id)}')"><i data-lucide="pencil"></i></button>
      <button class="bp-icono peligro" title="Eliminar" onclick="eliminarProducto('${esc(p._id)}')"><i data-lucide="trash-2"></i></button>
    </div>
  </div>`;
}

function renderFiltros() {
  const cont = $("bpFiltros");
  if (!cont) return;
  const cuenta = (e) => state.productos.filter(p => (p.estado || "idea") === e).length;
  const botones = [["todos", "Todos", state.productos.length], ...ESTADOS.map(([k, t]) => [k, t, cuenta(k)])];
  cont.innerHTML = botones.map(([k, t, n]) => `
    <button class="bp-filtro ${vista.estado === k ? "activo" : ""} estado-${k}" onclick="bpFiltrar('${k}')">${t} <span>${n}</span></button>
  `).join("");
}

function renderPaginas(total) {
  const cont = $("bpPaginas");
  if (!cont) return;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (vista.pagina > paginas) vista.pagina = paginas;
  if (paginas <= 1) { cont.innerHTML = total ? `<span class="bp-total">${total} producto${total === 1 ? "" : "s"}</span>` : ""; return; }

  const desde = (vista.pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(total, vista.pagina * POR_PAGINA);
  const nums = [];
  for (let n = 1; n <= paginas; n++) {
    if (n === 1 || n === paginas || Math.abs(n - vista.pagina) <= 1) nums.push(n);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  cont.innerHTML = `
    <span class="bp-total">${desde}–${hasta} de ${total}</span>
    <div class="bp-nums">
      <button ${vista.pagina === 1 ? "disabled" : ""} onclick="bpPagina(${vista.pagina - 1})">‹</button>
      ${nums.map(n => n === "…" ? `<span>…</span>` : `<button class="${n === vista.pagina ? "activa" : ""}" onclick="bpPagina(${n})">${n}</button>`).join("")}
      <button ${vista.pagina === paginas ? "disabled" : ""} onclick="bpPagina(${vista.pagina + 1})">›</button>
    </div>`;
}

function renderTablaProductos() {
  const tabla = $("tabla-productos");
  if (!tabla) return;

  renderFiltros();
  const lista = filtrados();
  const inicio = (vista.pagina - 1) * POR_PAGINA;
  const pagina = lista.slice(inicio, inicio + POR_PAGINA);

  tabla.innerHTML = pagina.length
    ? pagina.map(fila).join("")
    : `<div class="bp-vacio">${state.productos.length
        ? "No hay productos con ese filtro o búsqueda."
        : "Todavía no tienes productos en este país. Usa \"Nuevo producto\"."}</div>`;

  renderPaginas(lista.length);

  const conProyecto = state.productos.filter(p => proyectosPorProducto.has(String(p._id))).length;
  if ($("bpResumen")) $("bpResumen").textContent = `${state.productos.length} productos · ${costeosPorProducto.size ? `${state.productos.filter(p => costeosPorProducto.has(String(p._id))).length} costeados · ` : ""}${conProyecto} en Desarrollo`;
  if ($("bpOrden")) $("bpOrden").value = vista.orden;

  if (window.lucide) lucide.createIcons();
}

window.bpBuscar = (texto) => { vista.buscar = texto; vista.pagina = 1; renderTablaProductos(); };
window.bpFiltrar = (estado) => { vista.estado = estado; vista.pagina = 1; recordarVista(); renderTablaProductos(); };
window.bpOrdenar = (orden) => { vista.orden = orden; vista.pagina = 1; recordarVista(); renderTablaProductos(); };
window.bpPagina = (n) => {
  vista.pagina = n; recordarVista(); renderTablaProductos();
  document.querySelector(".bp-lista")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.bpAbrirProyecto = (id) => {
  goTo("desarrollo");
  setTimeout(() => window.estAbrirProyectoEn?.(id, null), 50);
};

// ---------- Links y notas (por índice: evita errores con comillas) ----------
const abrirUrl = (url) => {
  if (!url) return;
  const u = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  window.open(u, "_blank", "noopener");
};
window.abrirLanding = (i) => abrirUrl(state.productos[i]?.landing);
window.abrirCreativos = (i) => abrirUrl(state.productos[i]?.creativos);
window.abrirMaterial = function(i) {
  const texto = state.productos[i]?.material;
  if (!texto) return;
  $("modalMaterialContenido").textContent = texto;
  $("modalMaterial")?.classList.remove("hidden");
};
window.cerrarModalMaterial = () => $("modalMaterial")?.classList.add("hidden");
// Dropi no tiene link directo al producto: abre su buscador (CO o EC) y deja el ID copiado para pegarlo
const DROPI_BUSCAR = { CO: "https://app.dropi.co/dashboard/search", EC: "https://app.dropi.ec/dashboard/search?search_type=simple" };
window.abrirDropi = async (id, pais = "CO") => {
  const w = window.open(DROPI_BUSCAR[pais] || DROPI_BUSCAR.CO, "_blank", "noopener");
  try { await navigator.clipboard.writeText(String(id)); }
  catch {
    const t = document.createElement("textarea"); t.value = String(id); document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch {} t.remove();
  }
  avisarBp(`ID ${id} copiado: en Dropi pégalo en el buscador con Ctrl+V`);
  return w;
};
function avisarBp(texto) {
  let el = document.getElementById("estToast");
  if (!el) { el = document.createElement("div"); el.id = "estToast"; document.body.appendChild(el); }
  el.textContent = texto;
  el.className = "est-toast show ok";
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3500);
}

// ---------- Análisis de 19 criterios + recursos ----------
let an = null;   // { id, analisis, recursos, cambios }

function panelAnalisis() {
  const p = state.productos.find(x => x._id === an.id);
  const r = an.analisis.respuestas;
  const pts = puntaje(an.analisis);
  const ver = veredicto(pts);
  const grupos = porGrupo(an.analisis);
  const respondidas = Object.keys(r).length;
  return `
  <div class="bp-an-box" role="dialog" aria-modal="true" aria-labelledby="bpAnTitulo">
    <header class="bp-an-head">
      <div>
        <small>Análisis del producto</small>
        <h3 id="bpAnTitulo">${esc(p?.nombre || "")}</h3>
      </div>
      <div class="bp-an-score ${ver ? "an-" + ver.clave : ""}">
        <strong>${pts ?? "—"}</strong><span>${ver ? ver.texto : "Sin responder"}</span>
      </div>
      <button class="bp-icono" title="Cerrar" onclick="bpCerrarAnalisis()"><i data-lucide="x"></i></button>
    </header>
    <div class="bp-an-cuerpo">
      <p class="bp-an-ayuda">Marca <b>Sí</b> o <b>No</b> en cada punto (${respondidas}/19 respondidos). El puntaje promedia los 3 grupos: 70 o más es prometedor, 40 a 69 con reservas, menos de 40 arriesgado. Es una guía para decidir, no una garantía.</p>
      ${GRUPOS_ANALISIS.map((g, gi) => `
        <section class="bp-an-grupo">
          <h4>${esc(g.nombre)} <span>${grupos[gi].si}/${grupos[gi].total}</span></h4>
          ${g.criterios.map(([k, texto]) => `
            <div class="bp-an-fila">
              <span>${esc(texto)}</span>
              <div class="bp-an-sino">
                <button class="${r[k] === "si" ? "si" : ""}" onclick="bpMarcar('${k}','si')">Sí</button>
                <button class="${r[k] === "no" ? "no" : ""}" onclick="bpMarcar('${k}','no')">No</button>
              </div>
            </div>`).join("")}
        </section>`).join("")}
      <label class="bp-an-label">Notas del análisis</label>
      <textarea id="bpAnNota" rows="3" placeholder="Ej: el proveedor de Medellín tiene 400 unidades" oninput="bpNotaAnalisis(this.value)">${esc(an.analisis.nota)}</textarea>

      <section class="bp-an-grupo">
        <h4>Recursos guardados <span>${an.recursos.length}</span></h4>
        ${an.recursos.length ? an.recursos.map((x, i) => `
          <div class="bp-rec">
            <span class="bp-chip">${esc(TIPOS_RECURSO[x.tipo])}</span>
            <a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.nombre || x.url.replace(/^https?:\/\//, "").slice(0, 60))}</a>
            <button class="bp-icono peligro" title="Quitar" onclick="bpQuitarRecurso(${i})"><i data-lucide="x"></i></button>
          </div>`).join("") : `<p class="bp-an-ayuda">Guarda aquí los links de anuncios, videos de TikTok, proveedores y competencia de este producto.</p>`}
        ${an.recursos.length < MAX_RECURSOS ? `
        <div class="bp-rec-nuevo">
          <select id="bpRecTipo">${Object.entries(TIPOS_RECURSO).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select>
          <input id="bpRecUrl" placeholder="https://..." inputmode="url">
          <input id="bpRecNombre" placeholder="Nombre (opcional)">
          <button class="bp-btn chico" onclick="bpAgregarRecurso()">Agregar</button>
        </div>` : ""}
      </section>
    </div>
    <footer class="bp-an-pie">
      <span id="bpAnEstado">${an.cambios ? "Cambios sin guardar" : "Todo guardado"}</span>
      <button class="bp-btn" onclick="bpCerrarAnalisis()">Cerrar</button>
      <button class="bp-btn primario" id="bpAnGuardar" onclick="bpGuardarAnalisis()" ${an.cambios ? "" : "disabled"}>Guardar</button>
    </footer>
  </div>`;
}

function pintarAnalisis() {
  let cont = $("bpAnalisis");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "bpAnalisis";
    cont.className = "bp-an-overlay";
    cont.onclick = (e) => { if (e.target === cont) bpCerrarAnalisis(); };
    document.body.appendChild(cont);
  }
  const scroll = cont.querySelector(".bp-an-cuerpo")?.scrollTop || 0;
  cont.innerHTML = panelAnalisis();
  const cuerpo = cont.querySelector(".bp-an-cuerpo"); if (cuerpo) cuerpo.scrollTop = scroll;
  if (window.lucide) lucide.createIcons();
}

const marcarCambio = () => {
  an.cambios = true;
  if ($("bpAnEstado")) $("bpAnEstado").textContent = "Cambios sin guardar";
  if ($("bpAnGuardar")) $("bpAnGuardar").disabled = false;
};

window.bpAbrirAnalisis = (id) => {
  const p = state.productos.find(x => x._id === id);
  if (!p) return;
  an = {
    id,
    analisis: { respuestas: { ...(p.analisis?.respuestas || {}) }, nota: p.analisis?.nota || "" },
    recursos: (p.recursos || []).map(x => ({ ...x })),
    cambios: false
  };
  pintarAnalisis();
  document.addEventListener("keydown", escAnalisis);
};
function escAnalisis(e) { if (e.key === "Escape") bpCerrarAnalisis(); }
window.bpMarcar = (k, v) => {
  if (an.analisis.respuestas[k] === v) delete an.analisis.respuestas[k];
  else an.analisis.respuestas[k] = v;
  an.cambios = true;
  pintarAnalisis();
};
window.bpNotaAnalisis = (v) => { an.analisis.nota = v; marcarCambio(); };
window.bpAgregarRecurso = () => {
  const url = $("bpRecUrl").value.trim();
  if (!/^(https?:\/\/)?[^\s.]+\.[^\s]+$/i.test(url)) { alert("Pega un link válido"); return; }
  an.recursos.push({ tipo: $("bpRecTipo").value, url: /^https?:\/\//i.test(url) ? url : `https://${url}`, nombre: $("bpRecNombre").value.trim() });
  an.cambios = true;
  pintarAnalisis();
  $("bpRecUrl")?.focus();
};
window.bpQuitarRecurso = (i) => { an.recursos.splice(i, 1); an.cambios = true; pintarAnalisis(); };
window.bpGuardarAnalisis = async () => {
  if (!an) return;
  const b = $("bpAnGuardar"); if (b) { b.disabled = true; b.textContent = "Guardando..."; }
  try {
    const res = await fetch(`/api/productos/${an.id}/ficha`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analisis: an.analisis, recursos: an.recursos })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "No se pudo guardar");
    const p = state.productos.find(x => x._id === an.id);
    if (p) Object.assign(p, { analisis: data.producto.analisis, recursos: data.producto.recursos });
    an.recursos = (data.producto.recursos || []).map(x => ({ ...x }));
    an.cambios = false;
    pintarAnalisis();
    renderTablaProductos();
  } catch (err) {
    alert(err.message);
    if (b) { b.disabled = false; b.textContent = "Guardar"; }
  }
};
window.bpCerrarAnalisis = () => {
  if (an?.cambios && !confirm("Tienes cambios sin guardar. ¿Cerrar sin guardar?")) return;
  an = null;
  $("bpAnalisis")?.remove();
  document.removeEventListener("keydown", escAnalisis);
};

// ---------- Estado ----------
window.cambiarEstado = async function(id, nuevoEstado) {
  try {
    const res = await fetch(`/api/productos/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!res.ok) { alert("No se pudo actualizar el estado"); return; }
    const data = await res.json().catch(() => ({}));
    const p = state.productos.find(x => x._id === id);
    if (p) Object.assign(p, data.producto || { estado: nuevoEstado });
    renderTablaProductos();
  } catch (err) {
    console.error("Error cambiando estado:", err);
    alert("No se pudo actualizar el estado");
  }
};

// ---------- Eliminar ----------
let productoAEliminar = null;

window.eliminarProducto = function(id) {
  productoAEliminar = id;
  $("modalConfirm")?.classList.remove("hidden");
};

async function confirmarEliminacion() {
  if (!productoAEliminar) return;
  try {
    const res = await fetch(`/api/productos/${productoAEliminar}`, { method: "DELETE" });
    if (!res.ok) { alert("No se pudo eliminar"); return; }
    await cargarProductos();
    renderTablaProductos();
  } catch (err) {
    console.error("Error eliminando producto:", err);
    alert("No se pudo eliminar");
  } finally {
    productoAEliminar = null;
    $("modalConfirm")?.classList.add("hidden");
  }
}

// Botones del modal "¿Eliminar producto?" (está en index.html)
export function initModalEliminar() {
  const modal = $("modalConfirm");
  const cerrar = () => { productoAEliminar = null; modal?.classList.add("hidden"); };
  if ($("btnCancelar")) $("btnCancelar").onclick = cerrar;
  if ($("btnAceptar")) $("btnAceptar").onclick = () => confirmarEliminacion();
  if (modal) modal.onclick = (e) => { if (e.target === modal) cerrar(); };
}

// Ruta: productos
registrarRuta("productos", (view) => {
  vista.buscar = "";            // la búsqueda empieza vacía cada vez que entras
  view.innerHTML = renderProductos();
  $("tabla-productos").innerHTML = `<div class="bp-vacio">Cargando productos...</div>`;
  marcarMenuActivo(window.productoPaisActivo === "EC" ? "productos-ec" : "productos-co");
  if (window.lucide) lucide.createIcons();

  cargarProductos().then(() => {
    toggleCampoDropi();
    renderTablaProductos();
  });
});
