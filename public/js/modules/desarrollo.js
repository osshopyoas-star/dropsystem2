// =============================================
// 🧪 Estudio de landing (Desarrollo por pasos)
// Ficha → Avatares → Estilo → Landing → Anuncios → Publicar (vista previa, Shopify y notas)
// Los prompts viven en el servidor (prompts-landing.js)
// =============================================
import { state } from "../state.js";
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { SECCIONES, FORMATOS, tiposDe, varianteDe, elegirVariante, formatoImagen, claveDe } from "../core/plantilla.js";
import { ESTRUCTURAS_AD, FORMATOS_AD, ENFOQUES_COPY, MAX_ADS } from "../core/anuncios.js";
import { dibujar } from "./plantilla.js";
import { construirLanding } from "../core/landing-html.js";
import { limpiarFuentes } from "../core/fuentes.js";

const PASOS = [
  { n: 1, titulo: "Ficha", icono: "clipboard-list" },
  { n: 2, titulo: "Avatares", icono: "users" },
  { n: 3, titulo: "Estilo", icono: "palette" },
  { n: 4, titulo: "Landing", icono: "images" },
  { n: 5, titulo: "Anuncios", icono: "megaphone" },
  { n: 6, titulo: "Publicar", icono: "rocket" }
];

// Tipos de sección que se pueden usar en el formato del proyecto abierto
const formatoDe = (p) => (p?.formato === "normal" ? "normal" : "ban");
const claveProyecto = (p = proyecto) => claveDe(formatoDe(p), p?.tipo);
const tiposSeccion = () => Object.fromEntries(tiposDe(claveProyecto()).map(k => [k, SECCIONES[k].titulo]));
let cachePlantilla = null;   // Mi plantilla (para las secciones que agregas a mano)

const PAIS_NOMBRE = { CO: "Colombia", EC: "Ecuador" };

let proyecto = null;   // proyecto abierto
let imagenes = [];     // imágenes de Gemini subidas a las secciones (solo datos; la imagen se ve en /api/imagenes/:id)
let tiendasShopify = null;   // tiendas conectadas (se cargan al abrir el paso Publicar)
let tiendaElegida = null;
const temaTiendas = {};      // tiendaId → { plantillas, seccion, tema, sinPermiso, elegida } (o "cargando")
let destinoPub = (() => { try { return localStorage.getItem("est_destino_pub") || "tema"; } catch { return "tema"; } })();
let plantillaPub = null;     // sufijo elegido ("" = predeterminada)
let gastoIA = null;          // { usd, limite, queda, imagenes, precioImagen, precioReferencia }
const generandoIA = new Set();
let tab = 1;           // paso que se está viendo
let av = null;         // avatar con el que se está trabajando (A o B)
let generandoTodo = false;
let cacheProductos = [];
let cacheProyectos = [];

const ORIGEN = { dropi: "Dropi", importacion: "Importación", laboratorio: "Laboratorio" };
const ESTADO = { idea: "Idea", validando: "Validando", desarrollo: "Desarrollo", lanzado: "Lanzado" };

function proyectoDe(productoId) {
  return cacheProyectos.find(p => String(p.productoId) === String(productoId));
}

function fuenteTexto(prod) {
  if (!prod) return "";
  if (prod.origen === "dropi") return prod.dropiId ? `Dropi ID ${prod.dropiId}` : "Dropi (sin ID)";
  return ORIGEN[prod.origen] || "";
}

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");
const iconos = () => { if (window.lucide) lucide.createIcons(); };

// ---------- API ----------
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

// ---------- Trabajo de cada avatar ("rama") ----------
const RAMA_VACIA = { paso: 3, estilosPropuestos: [], estilo: null, bloqueEstilo: "", secciones: [], guiones: [], notas: null, vendio: false };

function R() {
  return { ...RAMA_VACIA, ...((proyecto?.ramas || {})[av] || {}) };
}

function ponerRama(rama) {
  proyecto.ramas = { ...(proyecto.ramas || {}), [av]: rama };
  proyecto.pasosRamas = { ...(proyecto.pasosRamas || {}), [av]: rama.paso };
}

const urlRama = (sub = "") => `/api/proyectos/${proyecto._id}/rama/${av}${sub ? "/" + sub : ""}`;

async function guardarRama(cambios) {
  if (!proyecto || !av) return;
  try {
    const { rama } = await api("PUT", urlRama(), cambios);
    ponerRama(rama);
    avisar("Guardado", "ok");
  } catch (err) {
    avisar(err.message, "error");
  }
}

const avatarActual = () => (proyecto?.avatares || []).find(a => a.id === av) || null;
const resumenAvatar = (a) => String(a?.quien || "").split(/[,.]/)[0].slice(0, 40);

// Paso más avanzado de un proyecto (para la lista)
function pasoTexto(p) {
  const pr = p.pasosRamas || {};
  const ids = Object.keys(pr);
  if (!ids.length) return `Paso ${Math.min(p.paso || 1, 2)}/6`;
  return ids.sort().map(k => `${k}: paso ${pr[k]}/6`).join(" · ");
}
const pasoMax = (p) => Math.max(p.paso || 1, ...Object.values(p.pasosRamas || {}));

async function guardar(cambios) {
  if (!proyecto) return;
  try {
    proyecto = await api("PUT", `/api/proyectos/${proyecto._id}`, cambios);
    avisar("Guardado", "ok");
  } catch (err) {
    avisar(err.message, "error");
  }
}

function avisar(texto, tipo = "ok") {
  let el = $("estToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "estToast";
    el.className = "est-toast";
    document.body.appendChild(el);
  }
  el.textContent = texto;
  el.className = `est-toast show ${tipo}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), tipo === "error" ? 4000 : 1400);
}

async function conCarga(boton, textoCargando, fn) {
  const b = typeof boton === "string" ? $(boton) : boton;
  const original = b?.innerHTML;
  if (b) { b.disabled = true; b.innerHTML = `<span class="est-spin"></span> ${textoCargando}`; }
  try { return await fn(); }
  catch (err) { avisar(err.message, "error"); }
  finally { if (b && document.body.contains(b)) { b.disabled = false; b.innerHTML = original; iconos(); } }
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const t = document.createElement("textarea");
    t.value = texto; document.body.appendChild(t); t.select();
    document.execCommand("copy"); t.remove();
  }
  avisar("Copiado ✓", "ok");
}

// Comprime una foto a máximo 1280 px en JPG
function comprimirFoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1280;
      const escala = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * escala);
      c.height = Math.round(img.height * escala);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen")); };
    img.src = url;
  });
}

function formatoPrecio(valor, pais) {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return "";
  return pais === "EC" ? "$" + n.toFixed(2).replace(".", ",") : "$" + Math.round(n).toLocaleString("es-CO").replace(/,/g, ".");
}

function fecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

// =============================================
// LISTA DE PROYECTOS
// =============================================
async function renderLista(view) {
  proyecto = null;
  view.innerHTML = `
    <div class="est-page">
      <header class="est-head">
        <div>
          <div class="est-badge"><i data-lucide="brain"></i> Desarrollo</div>
          <h1>Estudio de landing</h1>
          <p>Un proyecto por producto: ficha, avatares, estilo, prompts para Gemini y notas antes de publicar.</p>
        </div>
        <button class="est-btn claro" onclick="goTo('plantilla')"><i data-lucide="layout-template"></i> Mi plantilla</button>
      </header>

      <section class="est-card">
        <h3>Nuevo proyecto</h3>
        <div class="est-new">
          <select id="estNuevoPais" onchange="estFiltrarProductos()">
            <option value="CO">Colombia (COP)</option>
            <option value="EC">Ecuador (USD)</option>
          </select>
          <select id="estNuevoProducto" onchange="estInfoProducto()">
            <option value="">Cargando productos...</option>
          </select>
          <input id="estNuevoNombre" placeholder="…o escribe el nombre del producto">
          <select id="estNuevoTipo" title="Tipo de producto">
            <option value="producto">Producto</option>
            <option value="moda">Moda (ropa, calzado, accesorios)</option>
          </select>
          <select id="estNuevoFormato" title="Formato de la landing">
            <option value="ban">Ban page (todo en imágenes)</option>
            <option value="normal">Landing normal (Shopify + imágenes)</option>
          </select>
          <button id="estBtnCrear" class="est-btn primary" onclick="estCrearProyecto()">
            <i data-lucide="plus"></i> Crear
          </button>
        </div>
        <div id="estInfoProd" class="est-info-prod"></div>
      </section>

      <section>
        <h3 class="est-section-title">Tus proyectos</h3>
        <div id="estLista" class="est-grid"><p class="est-muted">Cargando...</p></div>
      </section>
    </div>
  `;
  iconos();

  try {
    const [productos, proyectos] = await Promise.all([
      api("GET", "/api/productos"),
      api("GET", "/api/proyectos")
    ]);

    cacheProductos = productos;
    cacheProyectos = proyectos;
    try {
      const ultimoPais = localStorage.getItem("est_pais");
      if (ultimoPais && $("estNuevoPais")) $("estNuevoPais").value = ultimoPais;
      const ultimoFormato = localStorage.getItem("est_formato");
      if (ultimoFormato && $("estNuevoFormato")) $("estNuevoFormato").value = ultimoFormato;
    } catch {}
    estFiltrarProductos();

    const lista = $("estLista");
    if (!lista) return;
    if (!proyectos.length) {
      lista.innerHTML = `<p class="est-muted">Aún no tienes proyectos. Crea el primero arriba.</p>`;
      return;
    }
    lista.innerHTML = proyectos.map(p => `
      <article class="est-proj" onclick="estAbrirProyecto('${esc(p._id)}')">
        <div class="est-proj-top">
          <span class="est-chip">${esc(p.pais)}</span>
          <span class="est-chip">${esc(FORMATOS[formatoDe(p)].corto)}</span>
          ${p.tipo === "moda" ? `<span class="est-chip">Moda</span>` : ""}
          ${p.vendio ? `<span class="est-chip ok">Vendió ✓</span>` : ""}
        </div>
        <strong>${esc(p.nombre)}</strong>
        <span class="est-muted">${pasoTexto(p)} · ${fecha(p.actualizado)}</span>
        <div class="est-progress"><span style="width:${(pasoMax(p) / 6) * 100}%"></span></div>
      </article>
    `).join("");
  } catch (err) {
    const lista = $("estLista");
    if (lista) lista.innerHTML = `<p class="est-error">${esc(err.message)}</p>`;
  }
}

// Lista de productos del país elegido: primero los que aún no tienen proyecto
window.estFiltrarProductos = () => {
  const pais = $("estNuevoPais")?.value || "CO";
  try { localStorage.setItem("est_pais", pais); } catch {}
  const sel = $("estNuevoProducto");
  if (!sel) return;

  const porNombre = (a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" });
  const delPais = cacheProductos.filter(p => (p.pais || "CO") === pais).sort(porNombre);
  const sinProyecto = delPais.filter(p => !proyectoDe(p._id));
  const conProyecto = delPais.filter(p => proyectoDe(p._id));

  const opcion = (p) => {
    const pr = proyectoDe(p._id);
    const fuente = fuenteTexto(p);
    const extra = pr ? ` — ${pasoTexto(pr)}` : "";
    return `<option value="${esc(p._id)}">${esc(p.nombre)}${fuente ? ` · ${esc(fuente)}` : ""}${extra}</option>`;
  };

  // Grupos en el orden en que normalmente trabajas
  const GRUPOS = [
    ["idea", "💡 Idea"],
    ["validando", "🔍 Validando"],
    ["desarrollo", "🛠️ En desarrollo (sin proyecto)"],
    ["lanzado", "🚀 Lanzados"]
  ];
  const estadoDe = (p) => ESTADO[p.estado] ? p.estado : "idea";

  let html = `<option value="">${delPais.length ? `Elegir producto de ${PAIS_NOMBRE[pais]} (${sinProyecto.length} sin proyecto)` : `No hay productos de ${PAIS_NOMBRE[pais]} en la Base`}</option>`;
  for (const [estado, titulo] of GRUPOS) {
    const items = sinProyecto.filter(p => estadoDe(p) === estado);
    if (items.length) html += `<optgroup label="${titulo} (${items.length})">${items.map(opcion).join("")}</optgroup>`;
  }
  if (conProyecto.length) {
    html += `<optgroup label="✓ Ya tienen proyecto (${conProyecto.length}) — se abre el existente">${conProyecto.map(opcion).join("")}</optgroup>`;
  }
  sel.innerHTML = html;
  estInfoProducto();
};

window.estInfoProducto = () => {
  const id = $("estNuevoProducto")?.value;
  const info = $("estInfoProd");
  const boton = $("estBtnCrear");
  const prod = cacheProductos.find(p => p._id === id);
  const pr = prod && proyectoDe(prod._id);
  if (boton) boton.innerHTML = pr ? `<i data-lucide="folder-open"></i> Abrir` : `<i data-lucide="plus"></i> Crear`;
  if (info) {
    info.innerHTML = prod ? `
      ${fuenteTexto(prod) ? `<span class="est-chip">${esc(fuenteTexto(prod))}</span>` : ""}
      <span class="est-chip">${ESTADO[prod.estado] || "Idea"}</span>
      ${pr ? `<span class="est-chip ok">Ya tiene proyecto · ${pasoTexto(pr)} — se abrirá ese</span>` : `<span class="est-muted">Al crear el proyecto, el producto pasa a "Desarrollo" en tu Base.</span>`}
    ` : "";
  }
  iconos();
};

window.estCrearProyecto = () => conCarga("estBtnCrear", "Creando...", async () => {
  const productoId = $("estNuevoProducto")?.value || null;
  const nombre = $("estNuevoNombre")?.value.trim() || "";
  const pais = $("estNuevoPais")?.value || "CO";
  const formato = $("estNuevoFormato")?.value === "normal" ? "normal" : "ban";
  const tipo = $("estNuevoTipo")?.value === "moda" ? "moda" : "producto";
  try { localStorage.setItem("est_formato", formato); } catch {}
  if (!productoId && !nombre) throw new Error("Elige un producto o escribe el nombre");
  const p = await api("POST", "/api/proyectos", productoId ? { productoId, pais, formato, tipo } : { nombre, pais, formato, tipo });
  if (p.existente) avisar("Ese producto ya tenía proyecto: lo abrimos", "ok");
  await abrir(p._id, p.existente ? null : 1);
});

window.estAbrirProyecto = (id) => abrir(id);
window.estAbrirProyectoEn = (id, paso) => abrir(id, paso);

window.estVolverLista = () => renderLista($("view"));

async function abrir(id, pasoInicial = null) {
  importado = null;
  plantillaPub = null;
  try {
    const [p, pl, imgs] = await Promise.all([
      api("GET", `/api/proyectos/${id}`),
      api("GET", "/api/plantilla").catch(() => null),
      api("GET", `/api/proyectos/${id}/imagenes`).catch(() => [])
    ]);
    proyecto = p;
    imagenes = Array.isArray(imgs) ? imgs : [];
    cachePlantilla = pl;
    const ids = (proyecto.avatares || []).map(a => a.id);
    let guardado = null;
    try { guardado = localStorage.getItem(`est_av_${id}`); localStorage.setItem("est_ultimo", id); } catch {}
    av = ids.includes(guardado) ? guardado : (ids.find(k => proyecto.ramas?.[k]) || null);
    const pasoRama = av ? (R().paso || 3) : 0;
    tab = pasoInicial || (av ? Math.min(Math.max(pasoRama, 3), PASOS.length) : Math.min(proyecto.paso || 1, 2));
    renderProyecto();
  } catch (err) {
    avisar(err.message, "error");
  }
}

// =============================================
// PROYECTO
// =============================================
function renderProyecto() {
  const view = $("view");
  const p = proyecto;
  view.innerHTML = `
    <div class="est-page">
      <header class="est-head">
        <div>
          <button class="est-link" onclick="estVolverLista()"><i data-lucide="arrow-left"></i> Proyectos</button>
          <h1>${esc(p.nombre)}</h1>
          ${fuenteTexto(p) ? `<span class="est-chip est-chip-claro">${esc(fuenteTexto(p))}</span>` : ""}
          <div class="est-head-meta">
            <select onchange="estCambiarPais(this.value)">
              <option value="CO" ${p.pais === "CO" ? "selected" : ""}>Colombia (COP)</option>
              <option value="EC" ${p.pais === "EC" ? "selected" : ""}>Ecuador (USD)</option>
            </select>
            <select onchange="estCambiarAvatares(this.value)">
              <option value="2" ${p.numAvatares !== 1 ? "selected" : ""}>Testeo con 2 avatares (2 landings)</option>
              <option value="1" ${p.numAvatares === 1 ? "selected" : ""}>1 avatar (1 landing)</option>
            </select>
            <select onchange="estCambiarFormato(this.value)" title="Formato de la landing">
              <option value="ban" ${formatoDe(p) === "ban" ? "selected" : ""}>Ban page (todo en imágenes)</option>
              <option value="normal" ${formatoDe(p) === "normal" ? "selected" : ""}>Landing normal (Shopify + imágenes)</option>
            </select>
            <select onchange="estCambiarTipo(this.value)" title="Tipo de producto">
              <option value="producto" ${p.tipo !== "moda" ? "selected" : ""}>Producto</option>
              <option value="moda" ${p.tipo === "moda" ? "selected" : ""}>Moda (ropa, calzado)</option>
            </select>
            <button class="est-btn claro chico" onclick="goTo('plantilla')"><i data-lucide="layout-template"></i> Mi plantilla</button>
          </div>
        </div>
        <button class="est-btn ghost danger" onclick="estEliminarProyecto()"><i data-lucide="trash-2"></i> Eliminar</button>
      </header>

      <nav class="est-steps">
        ${PASOS.map(s => `
          <button class="est-step ${tab === s.n ? "active" : ""} ${(s.n <= 2 ? (p.paso || 1) >= s.n : av && R().paso >= s.n) ? "done" : ""}" onclick="estIrPaso(${s.n})">
            <span class="est-step-n">${s.n}</span>
            <span>${s.titulo}</span>
          </button>
        `).join("")}
      </nav>

      ${(p.avatares || []).length ? `
        <div class="est-avbar">
          <span class="est-avbar-label">Trabajando con:</span>
          ${p.avatares.map(a => `
            <button class="est-avbtn ${av === a.id ? "active" : ""}" onclick="estElegirAvatar('${esc(a.id)}')">
              <b>${esc(a.id)}</b>
              <span>${esc(resumenAvatar(a))}</span>
              <small>${p.ramas?.[a.id] ? `paso ${p.ramas[a.id].paso || 3}/6` : "sin empezar"}</small>
            </button>
          `).join("")}
          <span class="est-muted">Ficha y avatares son compartidos. Estilo, landing, guiones y notas se guardan aparte para cada avatar.</span>
        </div>
      ` : ""}

      <section id="estContenido"></section>
    </div>
  `;
  renderPaso();
}

function renderPaso() {
  const cont = $("estContenido");
  if (!cont) return;
  const render = { 1: pasoFicha, 2: pasoAvatares, 3: pasoEstilo, 4: pasoLanding, 5: pasoAnuncios, 6: pasoPublicar }[tab];
  if (tab >= 3 && !avatarActual()) {
    cont.innerHTML = `<div class="est-card"><div class="est-alert warn">${(proyecto.avatares || []).length
      ? "Elige con qué avatar vas a trabajar (arriba, en \"Trabajando con\")."
      : "Primero genera los avatares en el paso 2."}</div>${(proyecto.avatares || []).length ? "" : siguiente(2, "Ir a avatares")}</div>`;
    iconos();
    return;
  }
  cont.innerHTML = render();
  iconos();
}

window.estIrPaso = (n) => {
  tab = n;
  document.querySelectorAll(".est-step").forEach((b, i) => b.classList.toggle("active", i + 1 === n));
  renderPaso();
  $("estContenido")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.estElegirAvatar = (id) => {
  av = id;
  try { localStorage.setItem(`est_av_${proyecto._id}`, id); } catch {}
  if (tab < 3) tab = Math.min(Math.max(R().paso || 3, 3), PASOS.length);
  renderProyecto();
  avisar(`Trabajando con el avatar ${id}`, "ok");
};

window.estCambiarPais = async (pais) => { await guardar({ pais }); renderPaso(); };
window.estCambiarFormato = async (formato) => {
  const conSecciones = Object.values(proyecto.ramas || {}).some(r => (r?.secciones || []).length);
  if (conSecciones && !confirm(`Pasar a ${FORMATOS[formato].nombre}: las secciones que ya armaste eran para el otro formato. Después vuelve a proponer secciones en el paso Landing. ¿Seguir?`)) {
    renderProyecto(); return;
  }
  await guardar({ formato });
  renderProyecto();
};

window.estCambiarTipo = async (tipo) => {
  const conSecciones = Object.values(proyecto.ramas || {}).some(r => (r?.secciones || []).length);
  if (conSecciones && !confirm("Cambiar el tipo de producto cambia las secciones disponibles. Después vuelve a proponer secciones en el paso Landing. ¿Seguir?")) {
    renderProyecto(); return;
  }
  await guardar({ tipo });
  renderProyecto();
};

window.estCambiarAvatares = async (n) => {
  if (proyecto.avatares?.length && !confirm("Cambiar la cantidad de avatares: tendrás que regenerar los avatares. ¿Seguir?")) {
    renderProyecto(); return;
  }
  await guardar({ numAvatares: Number(n) });
  renderProyecto();
};

window.estEliminarProyecto = async () => {
  if (!confirm(`¿Eliminar el proyecto "${proyecto.nombre}"? No se puede deshacer.`)) return;
  try {
    await api("DELETE", `/api/proyectos/${proyecto._id}`);
    renderLista($("view"));
  } catch (err) { avisar(err.message, "error"); }
};

const siguiente = (n, texto) => `
  <div class="est-next">
    <button class="est-btn primary" onclick="estIrPaso(${n})">${texto} <i data-lucide="arrow-right"></i></button>
  </div>`;

// =============================================
// PASO 1: FICHA
// =============================================
function pasoFicha() {
  const p = proyecto;
  const f = p.ficha || {};
  const pr = f.promesas || {};
  const r = p.revision || {};
  const tieneRevision = !!r.descripcionFisica;
  const fotos = p.fotos || [];
  const descuento = f.precioAntes > f.precio && f.precio > 0 ? Math.round((f.precioAntes - f.precio) / f.precioAntes * 100) : null;

  return `
  ${tarjetaImportar()}
  <div class="est-cols">
    <div class="est-card">
      <h3>Fotos reales del producto</h3>
      <p class="est-muted">Máximo 6. Son las que adjuntarás en Gemini y las que la IA revisa.</p>
      <div class="est-fotos">
        ${fotos.map((src, i) => `
          <div class="est-foto"><img src="${src}" alt="Foto ${i + 1}"><button onclick="estQuitarFoto(${i})" title="Quitar">✕</button></div>
        `).join("")}
        ${fotos.length < 6 ? `
          <label class="est-foto add">
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple onchange="estSubirFotos(this)" hidden>
            <i data-lucide="image-plus"></i><span>Subir</span>
          </label>` : ""}
      </div>

      <h3 class="mt">Datos del producto</h3>
      <div class="est-form">
        <label>Descripción del proveedor</label>
        <textarea id="fDescripcion" rows="5" placeholder="Pega aquí la descripción del proveedor">${esc(f.descripcion)}</textarea>

        <div class="est-row">
          <div><label>Precio (${p.pais === "EC" ? "USD" : "COP"})</label><input id="fPrecio" type="number" step="any" min="0" value="${esc(f.precio)}" oninput="estVerDescuento()"></div>
          <div><label>Precio "antes"</label><input id="fPrecioAntes" type="number" step="any" min="0" value="${esc(f.precioAntes)}" oninput="estVerDescuento()"></div>
        </div>
        <button class="est-btn est-calc-btn" onclick="estAbrirCalculadora()"><i data-lucide="calculator"></i> ${f.costeoId ? "Ver costeo en la calculadora" : "Calcular precio y paquetes en la calculadora"}</button>
        <p id="fDescuento" class="est-hint">${descuento ? `Se verá: ${formatoPrecio(f.precio, p.pais)} antes ${formatoPrecio(f.precioAntes, p.pais)} · ${descuento}% de descuento` : "Escribe el precio y el 'antes' para calcular el descuento."}</p>

        <label>Medidas reales</label>
        <input id="fMedidas" value="${esc(f.medidas)}" placeholder="Ej: 18 x 11 cm, 1.92 m de alto, 40 cm">
        <label>Lo que NO tiene (para que la IA no lo invente)</label>
        <input id="fNoTiene" value="${esc(f.noTiene)}" placeholder="Ej: no tiene cámara, no trae caja de marca">
        <label>Tallas / colores / variantes</label>
        <input id="fVariantes" value="${esc(f.variantes)}" placeholder="Ej: tallas 35 a 40; colores negro y blanco">
        <label>Regalo</label>
        <input id="fRegalo" value="${esc(f.regalo)}" placeholder="Ej: llavero de regalo">
        <label>Paquetes</label>
        <input id="fPaquetes" value="${esc(f.paquetes)}" placeholder="Ej: 1 unidad $199.990; 2 unidades $339.990; 3 unidades $449.990">
      </div>
    </div>

    <div class="est-card">
      <h3>Lo que SÍ es verdad</h3>
      <p class="est-muted">Solo esto aparecerá en las imágenes.</p>
      <div class="est-checks">
        <label><input type="checkbox" id="fEnvioGratis" ${pr.envioGratis ? "checked" : ""}> Envío gratis</label>
        <label><input type="checkbox" id="fOriginal" ${pr.original ? "checked" : ""}> Es original / licenciado</label>
      </div>
      <div class="est-form">
        <label>Garantía</label>
        <input id="fGarantia" value="${esc(pr.garantia)}" placeholder="Vacío = no hay garantía. Ej: 30 días">
        <label>Tiempo de entrega</label>
        <input id="fEntrega" value="${esc(pr.entrega)}" placeholder="Ej: 3 a 5 días hábiles">
        <label>Estilo que prefieres (opcional)</label>
        <input id="fEstiloPref" value="${esc(f.estiloPreferido)}" placeholder="Ej: estilo gym, algo femenino y elegante...">
        <label>Notas para la IA (opcional)</label>
        <textarea id="fNotas" rows="3" placeholder="Cualquier cosa importante del producto o del cliente">${esc(f.notas)}</textarea>
      </div>

      <div class="est-actions">
        <button id="estBtnGuardarFicha" class="est-btn" onclick="estGuardarFicha()"><i data-lucide="save"></i> Guardar</button>
        <button id="estBtnRevisar" class="est-btn primary" onclick="estRevisarFicha()"><i data-lucide="scan-search"></i> ${tieneRevision ? "Volver a revisar" : "Revisar con IA"}</button>
      </div>

      ${tieneRevision ? `
        <div class="est-review">
          <h3>Revisión de la IA</h3>
          ${r.coincide === false ? `<div class="est-alert error">⚠️ Las fotos no parecen coincidir con la descripción. Revisa antes de seguir.</div>` : ""}
          ${(r.marcas || []).length ? `<div class="est-alert error"><strong>Marcas o logos de terceros:</strong> ${r.marcas.map(esc).join(", ")}. Riesgo en anuncios de Meta.</div>` : ""}
          ${(r.dudas || []).length ? `<div class="est-alert warn"><strong>Dudas:</strong><ul>${r.dudas.map(d => `<li>${esc(d)}</li>`).join("")}</ul></div>` : ""}
          <div class="est-form">
            <label>Descripción física (se usa en cada prompt, corrígela si algo está mal)</label>
            <textarea id="rDescripcion" rows="5">${esc(r.descripcionFisica)}</textarea>
            <label>Lo que NO tiene (una por línea)</label>
            <textarea id="rNoTiene" rows="3">${esc((r.noTiene || []).join("\n"))}</textarea>
            <label>Tamaño real estimado</label>
            <input id="rTamano" value="${esc(r.tamano)}">
          </div>
          <button class="est-btn" onclick="estGuardarRevision()"><i data-lucide="save"></i> Guardar correcciones</button>
        </div>
      ` : ""}
    </div>
  </div>
  ${tieneRevision ? siguiente(2, "Seguir con avatares") : ""}
  `;
}

// ---------- Importar ficha desde un link ----------
let importado = null;   // respuesta de /api/importar-url mientras el usuario decide qué usar

function tarjetaImportar() {
  const i = importado;
  const libres = 6 - (proyecto.fotos || []).length;
  return `
  <div class="est-card est-importar">
    <div class="est-card-row">
      <div>
        <h3>Importar desde un link</h3>
        <p class="est-muted">Pega el link del producto en tu tienda Shopify o en la página del proveedor: CoDropX trae la descripción, el precio, las variantes y las fotos. Usa solo fotos que tengas permiso de usar.</p>
      </div>
    </div>
    <div class="est-importar-fila">
      <input id="estUrlImportar" class="est-url" type="url" inputmode="url" placeholder="https://mitienda.com/products/..." value="${esc(i?.url || "")}" onkeydown="if(event.key==='Enter') estImportarUrl()">
      <button id="estBtnImportar" class="est-btn primary" onclick="estImportarUrl()"><i data-lucide="link"></i> Leer link</button>
    </div>
    ${i ? `
    <div class="est-importado">
      <p><b>${esc(i.nombre || "Producto sin nombre")}</b> · ${i.origen === "shopify" ? "Tienda Shopify" : "Página web"}</p>
      <div class="est-checks">
        ${i.descripcion ? `<label><input type="checkbox" id="impDesc" checked> Descripción (${i.descripcion.length} letras)</label>` : ""}
        ${i.variantes ? `<label><input type="checkbox" id="impVar" checked> Variantes: ${esc(i.variantes.slice(0, 80))}</label>` : ""}
        ${i.precio ? `<label><input type="checkbox" id="impPrecio" ${proyecto.ficha?.precio ? "" : "checked"}> Precio ${formatoPrecio(i.precio, proyecto.pais)}${i.precioAntes ? ` (antes ${formatoPrecio(i.precioAntes, proyecto.pais)})` : ""}${i.moneda ? ` ${esc(i.moneda)}` : ""}</label>` : ""}
        ${i.fotos.length ? `<label><input type="checkbox" id="impFotos" ${libres > 0 ? "checked" : "disabled"}> ${Math.min(i.fotos.length, Math.max(libres, 0))} de ${i.fotos.length} fotos${libres <= 0 ? " (ya tienes 6)" : ""}</label>` : `<span class="est-hint">No se pudieron traer fotos${i.fotosEncontradas ? ` (había ${i.fotosEncontradas})` : ""}.</span>`}
      </div>
      ${i.fotos.length ? `<div class="est-importado-fotos">${i.fotos.map(src => `<img src="${src}" alt="">`).join("")}</div>` : ""}
      <div class="est-sec-actions">
        <button id="estBtnAplicarImport" class="est-btn primary" onclick="estAplicarImportado()"><i data-lucide="check"></i> Usar en la ficha</button>
        <button class="est-btn ghost" onclick="estDescartarImportado()">Descartar</button>
      </div>
    </div>` : ""}
  </div>`;
}

window.estImportarUrl = () => conCarga("estBtnImportar", "Leyendo...", async () => {
  const url = $("estUrlImportar")?.value.trim();
  if (!url) { avisar("Pega el link del producto", "error"); return; }
  importado = await api("POST", "/api/importar-url", { url });
  renderPaso();
});
window.estDescartarImportado = () => { importado = null; renderPaso(); };

function dataUrlABlob(dataUrl) {
  const [cab, datos] = dataUrl.split(",");
  const tipo = (cab.match(/data:([^;]+)/) || [])[1] || "image/jpeg";
  const bin = atob(datos);
  const arr = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
  return new Blob([arr], { type: tipo });
}

window.estAplicarImportado = () => conCarga("estBtnAplicarImport", "Guardando...", async () => {
  const i = importado; if (!i) return;
  const ficha = leerFicha();
  if ($("impDesc")?.checked) {
    if (ficha.descripcion && ficha.descripcion !== i.descripcion && !confirm("Ya hay una descripción. ¿Reemplazarla por la del link?")) { /* deja la actual */ }
    else ficha.descripcion = i.descripcion;
  }
  if ($("impVar")?.checked) ficha.variantes = i.variantes;
  if ($("impPrecio")?.checked) { ficha.precio = i.precio; if (i.precioAntes) ficha.precioAntes = i.precioAntes; }
  let fotos = proyecto.fotos || [];
  if ($("impFotos")?.checked) {
    const nuevas = [];
    for (const src of i.fotos.slice(0, Math.max(0, 6 - fotos.length))) {
      try { nuevas.push(await comprimirFoto(dataUrlABlob(src))); } catch { /* foto que el navegador no lee */ }
    }
    fotos = [...fotos, ...nuevas];
  }
  await guardar({ ficha, fotos });
  importado = null;
  renderPaso();
  avisar("Ficha actualizada desde el link ✓");
});

function leerFicha() {
  const val = (id) => $(id)?.value?.trim() ?? "";
  const num = (id) => { const n = Number($(id)?.value); return Number.isFinite(n) && n > 0 ? n : null; };
  return {
    ...proyecto.ficha,
    descripcion: val("fDescripcion"),
    precio: num("fPrecio"),
    precioAntes: num("fPrecioAntes"),
    medidas: val("fMedidas"),
    noTiene: val("fNoTiene"),
    variantes: val("fVariantes"),
    regalo: val("fRegalo"),
    paquetes: val("fPaquetes"),
    estiloPreferido: val("fEstiloPref"),
    notas: val("fNotas"),
    promesas: {
      envioGratis: !!$("fEnvioGratis")?.checked,
      original: !!$("fOriginal")?.checked,
      garantia: val("fGarantia"),
      entrega: val("fEntrega")
    }
  };
}

// Ir a la calculadora con este producto; al volver con "Pasar a Desarrollo" se llenan precio y paquetes
window.estAbrirCalculadora = async () => {
  await guardar({ ficha: leerFicha() });
  if (proyecto.productoId) return calAbrirConProducto(proyecto.productoId, proyecto.pais);
  goTo("calculadora");
  setTimeout(() => {
    const n = document.getElementById("calNombre");
    const sel = document.getElementById("calProducto");
    const pais = document.getElementById("calPais");
    if (pais) { pais.value = proyecto.pais; calCambiarPais(); }
    if (sel) sel.value = "";
    if (n) { n.value = proyecto.nombre; calCalcular(); }
  }, 400);
};

window.estVerDescuento = () => {
  const a = Number($("fPrecioAntes")?.value), b = Number($("fPrecio")?.value);
  const el = $("fDescuento");
  if (!el) return;
  el.textContent = a > b && b > 0
    ? `Se verá: ${formatoPrecio(b, proyecto.pais)} antes ${formatoPrecio(a, proyecto.pais)} · ${Math.round((a - b) / a * 100)}% de descuento`
    : "Escribe el precio y el 'antes' para calcular el descuento.";
};

window.estGuardarFicha = () => conCarga("estBtnGuardarFicha", "Guardando...", () => guardar({ ficha: leerFicha() }));

window.estRevisarFicha = () => conCarga("estBtnRevisar", "Revisando fotos...", async () => {
  await guardar({ ficha: leerFicha() });
  const { revision } = await api("POST", `/api/proyectos/${proyecto._id}/ia/revisar`);
  proyecto.revision = revision;
  renderPaso();
});

window.estGuardarRevision = async () => {
  const revision = {
    ...proyecto.revision,
    descripcionFisica: $("rDescripcion")?.value.trim() || "",
    noTiene: ($("rNoTiene")?.value || "").split("\n").map(x => x.trim()).filter(Boolean),
    tamano: $("rTamano")?.value.trim() || ""
  };
  await guardar({ revision, bloqueEstilo: "" });
};

window.estSubirFotos = async (input) => {
  const archivos = [...(input.files || [])].slice(0, 6 - (proyecto.fotos || []).length);
  if (!archivos.length) return;
  avisar("Subiendo fotos...", "ok");
  try {
    const nuevas = [];
    for (const f of archivos) nuevas.push(await comprimirFoto(f));
    await guardar({ ficha: leerFicha(), fotos: [...(proyecto.fotos || []), ...nuevas] });
    renderPaso();
  } catch (err) { avisar(err.message, "error"); }
};

window.estQuitarFoto = async (i) => {
  const fotos = [...(proyecto.fotos || [])];
  fotos.splice(i, 1);
  await guardar({ ficha: leerFicha(), fotos });
  renderPaso();
};

// =============================================
// PASO 2: AVATARES
// =============================================
const CAMPOS_AVATAR = [
  ["quien", "Quién es (edad, sexo, ocupación)"],
  ["problema", "Su problema o deseo principal"],
  ["probado", "Qué ha probado y por qué no le sirvió"],
  ["frase", "Frase que diría con sus palabras"],
  ["angulo", "Ángulo de venta"],
  ["titular", "Titular de la imagen 1 (línea 1 / línea 2)"],
  ["escena", "Escena y modelo de las fotos"],
  ["tono", "Tono"]
];

function pasoAvatares() {
  const avs = proyecto.avatares || [];
  return `
  <div class="est-card">
    <div class="est-card-row">
      <div>
        <h3>${proyecto.numAvatares === 1 ? "Avatar" : "Avatares A y B"}</h3>
        <p class="est-muted">${proyecto.numAvatares === 1 ? "Un avatar, una landing." : "Dos avatares, cada uno con su propia landing, estilo y guiones. Elige con cuál trabajar; luego puedes hacer el otro."}</p>
      </div>
      <button id="estBtnAvatares" class="est-btn primary" onclick="estGenerarAvatares()">
        <i data-lucide="sparkles"></i> ${avs.length ? "Regenerar" : "Generar avatares"}
      </button>
    </div>
    ${!proyecto.revision?.descripcionFisica ? `<div class="est-alert warn">Consejo: primero revisa la ficha con IA (paso 1) para que los avatares partan del producto real.</div>` : ""}
  </div>

  ${avs.length ? `
    <div class="est-cols">
      ${avs.map((a, i) => `
        <div class="est-card est-avatar">
          <div class="est-avatar-id">${esc(a.id)}</div>
          <div class="est-form">
            ${CAMPOS_AVATAR.map(([k, label]) => `
              <label>${label}</label>
              <textarea rows="${k === "escena" || k === "problema" ? 3 : 2}" onchange="estEditarAvatar(${i}, '${k}', this.value)">${esc(a[k])}</textarea>
            `).join("")}
          </div>
          <button class="est-btn ${av === a.id ? "" : "primary"} est-avatar-go" onclick="estTrabajarCon('${esc(a.id)}')">
            ${av === a.id ? "✓ Trabajando con este avatar — continuar" : proyecto.ramas?.[a.id] ? `Continuar con el avatar ${esc(a.id)} (paso ${proyecto.ramas[a.id].paso || 3}/6)` : `Trabajar con el avatar ${esc(a.id)}`}
            <i data-lucide="arrow-right"></i>
          </button>
        </div>
      `).join("")}
    </div>
  ` : ""}
  `;
}

window.estTrabajarCon = (id) => {
  av = id;
  try { localStorage.setItem(`est_av_${proyecto._id}`, id); } catch {}
  tab = Math.min(Math.max(R().paso || 3, 3), PASOS.length);
  renderProyecto();
  $("estContenido")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.estGenerarAvatares = () => conCarga("estBtnAvatares", "Creando avatares...", async () => {
  if (proyecto.avatares?.length && !confirm(Object.keys(proyecto.ramas || {}).length
    ? "¿Reemplazar los avatares? El trabajo ya hecho (estilo, landing, guiones) se conserva, pero quedará pensado para los avatares anteriores."
    : "¿Reemplazar los avatares actuales?")) return;
  const { avatares } = await api("POST", `/api/proyectos/${proyecto._id}/ia/avatares`);
  proyecto.avatares = avatares;
  proyecto.paso = Math.max(proyecto.paso || 1, 2);
  renderProyecto();
});

window.estEditarAvatar = (i, campo, valor) => {
  const avatares = proyecto.avatares.map((a, j) => j === i ? { ...a, [campo]: valor } : a);
  guardar({ avatares });
};

// =============================================
// PASO 3: ESTILO (del avatar elegido)
// =============================================
const colores = (e) => [e.fondo, e.color1, e.color2, e.acento]
  .map(v => String(v || "").match(/#[0-9a-f]{3,8}\b/i)?.[0])
  .filter(Boolean);

const avTag = () => `<span class="est-chip grupo">Avatar ${esc(av)}</span>`;

function pasoEstilo() {
  const r = R();
  const props = r.estilosPropuestos || [];
  const elegido = r.estilo;

  return `
  <div class="est-card">
    <div class="est-card-row">
      <div>
        <h3>Estilo de la landing ${avTag()}</h3>
        <p class="est-muted">Pensado para ${esc(resumenAvatar(avatarActual()))}. La IA evita los estilos que ya usaste y el del otro avatar.</p>
      </div>
      <button id="estBtnEstilos" class="est-btn primary" onclick="estProponerEstilos()">
        <i data-lucide="palette"></i> ${props.length ? "Otras 3 opciones" : "Proponer 3 estilos"}
      </button>
    </div>
  </div>

  ${props.length ? `
    <div class="est-grid three">
      ${props.map((e, i) => `
        <div class="est-card est-estilo ${elegido?.nombre === e.nombre ? "selected" : ""}">
          <div class="est-swatches">${colores(e).map(c => `<span style="background:${esc(c)}" title="${esc(c)}"></span>`).join("")}</div>
          <h3>${esc(e.nombre)}</h3>
          <p>${esc(e.idea)}</p>
          <ul class="est-mini">
            <li><b>Fondo:</b> ${esc(e.fondo)}</li>
            <li><b>Colores:</b> ${esc(e.color1)} / ${esc(e.color2)}</li>
            <li><b>Letra:</b> ${esc(e.tipografia)}</li>
            ${e.mundo ? `<li><b>Mundo:</b> ${esc(e.mundo)}</li>` : `<li><b>Foto:</b> ${esc(e.tipo_foto)}</li>`}
            ${e.recursos ? `<li><b>Recursos:</b> ${esc(e.recursos)}</li>` : ""}
            <li><b>Tono:</b> ${esc(e.tono)}</li>
          </ul>
          <p class="est-muted">${esc(e.por_que)}</p>
          <button class="est-btn ${elegido?.nombre === e.nombre ? "" : "primary"}" onclick="estElegirEstilo(${i}, this)">
            ${elegido?.nombre === e.nombre ? "Elegido ✓" : "Elegir este"}
          </button>
        </div>
      `).join("")}
    </div>
  ` : ""}

  ${elegido ? `
    <div class="est-card">
      <div class="est-card-row">
        <div>
          <h3>Bloque de estilo: ${esc(elegido.nombre)}</h3>
          <p class="est-muted">Va primero en cada chat de Gemini. Puedes corregirlo.</p>
        </div>
        <button class="est-btn" onclick="estCopiarBloque()"><i data-lucide="copy"></i> Copiar</button>
      </div>
      <textarea id="estBloque" class="est-code" rows="12" onchange="estGuardarBloque(this.value)">${esc(r.bloqueEstilo)}</textarea>
    </div>
    ${siguiente(4, "Seguir con la landing")}
  ` : ""}
  `;
}

window.estProponerEstilos = () => conCarga("estBtnEstilos", "Pensando estilos...", async () => {
  const { rama } = await api("POST", urlRama("ia/estilos"));
  ponerRama(rama);
  renderProyecto();
});

window.estElegirEstilo = (i, boton) => conCarga(boton, "Armando bloque...", async () => {
  const estilo = R().estilosPropuestos[i];
  const { rama } = await api("POST", urlRama("estilo"), { estilo });
  ponerRama(rama);
  renderProyecto();
});

window.estGuardarBloque = (v) => guardarRama({ bloqueEstilo: v });
window.estCopiarBloque = () => copiar(limpiarFuentes($("estBloque")?.value || R().bloqueEstilo || ""));

// =============================================
// PASO 4: LANDING (del avatar elegido)
// =============================================
function pasoLanding() {
  const r = R();
  if (!r.estilo) {
    return `<div class="est-card"><div class="est-alert warn">Primero elige el estilo del avatar ${esc(av)} en el paso 3.</div>${siguiente(3, "Ir al estilo")}</div>`;
  }
  const secs = r.secciones || [];
  const hechas = secs.filter(x => x.hecha).length;
  const conPrompt = secs.filter(x => x.prompt).length;
  const normal = formatoDe(proyecto) === "normal";
  const tipos = tiposSeccion();
  const fueraDeFormato = secs.filter(x => !tipos[x.tipo]).length;

  return `
  <div class="est-card">
    <div class="est-card-row">
      <div>
        <h3>Landing ${avTag()} <span class="est-chip">${esc(FORMATOS[formatoDe(proyecto)].nombre)}</span></h3>
        <p class="est-muted">${normal
          ? "Landing normal: imágenes cuadradas 1:1 + textos para pegar en Shopify. En Gemini: chat nuevo por imagen → adjunta la foto real → pega \"estilo + prompt\"."
          : "Ban page: imágenes 9:16. En Gemini: chat nuevo por imagen → adjunta la foto real → pega \"estilo + prompt\"."} ${secs.length ? `${conPrompt}/${secs.length} prompts · ${hechas} imágenes hechas` : ""}</p>
        <p class="est-hint">El orden y el diseño de cada sección salen de <a href="#" onclick="goTo('plantilla'); return false;">Mi plantilla</a>.</p>
        ${lineaGastoIA()}
      </div>
      <div class="est-actions">
        <button id="estBtnSecciones" class="est-btn" onclick="estProponerSecciones()"><i data-lucide="layout-list"></i> ${secs.length ? "Volver a proponer" : "Proponer secciones"}</button>
        ${secs.length ? `<button id="estBtnTodos" class="est-btn primary" onclick="estGenerarTodos()" ${generandoTodo ? "disabled" : ""}><i data-lucide="sparkles"></i> Generar prompts faltantes</button>` : ""}
      </div>
    </div>
  </div>

  ${fueraDeFormato ? `<div class="est-alert warn">Hay ${fueraDeFormato} sección(es) del otro formato. Dale a "Volver a proponer" para armar la landing en ${esc(FORMATOS[formatoDe(proyecto)].nombre)}.</div>` : ""}

  ${normal ? tarjetaTextos(r) : ""}

  <div class="est-secciones">
    ${secs.map((x, i) => tarjetaSeccion(x, i, i + 1)).join("")}
  </div>

  ${secs.length ? `
    <div class="est-card est-add">
      <select id="estNuevaTipo">${Object.entries(tipos).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("")}</select>
      <button class="est-btn" onclick="estAgregarSeccion()"><i data-lucide="plus"></i> Agregar sección</button>
    </div>
    ${siguiente(5, "Seguir con los anuncios")}
  ` : ""}
  `;
}

function tarjetaSeccion(x, i, numero) {
  return `
  <article class="est-sec ${x.hecha ? "hecha" : ""}" id="sec-${esc(x.id)}">
    <div class="est-sec-head">
      <span class="est-sec-n">${numero}</span>
      <div class="est-sec-info">
        <strong>${esc(x.titulo)}</strong>
        <div class="est-sec-tags">
          <span class="est-chip">${esc(x.formato || "9:16")}</span>
          ${(SECCIONES[x.tipo]?.variantes || []).length ? `
            <select class="est-variante" title="Diseño de la sección" onchange="estCambiarVariante(${i}, this.value)">
              ${!varianteDe(x.tipo, x.variante) ? `<option value="">${esc(x.composicion || "Diseño libre")}</option>` : ""}
              ${SECCIONES[x.tipo].variantes.map(v => `<option value="${v.id}" ${v.id === x.variante ? "selected" : ""}>Diseño: ${esc(v.nombre)}</option>`).join("")}
            </select>` : (x.composicion ? `<span class="est-chip">${esc(x.composicion)}</span>` : "")}
        </div>
        ${x.proposito ? `<p class="est-muted">${esc(x.proposito)}</p>` : ""}
      </div>
      <div class="est-sec-move">
        <button title="Subir" onclick="estMoverSeccion(${i}, -1)">▲</button>
        <button title="Bajar" onclick="estMoverSeccion(${i}, 1)">▼</button>
      </div>
    </div>

    ${x.prompt ? `
      <textarea class="est-code" rows="10" onchange="estEditarPrompt(${i}, this.value)">${esc(x.prompt)}</textarea>
    ` : `<div class="est-empty">Sin prompt todavía.</div>`}
    ${tiraImagenes(x)}

    <div class="est-sec-actions">
      <button class="est-btn ${x.prompt ? "" : "primary"}" id="btnSec-${esc(x.id)}" onclick="estGenerarSeccion('${esc(x.id)}')">
        <i data-lucide="sparkles"></i> ${x.prompt ? "Regenerar" : "Generar prompt"}
      </button>
      ${x.prompt ? `<button class="est-btn primary" onclick="estCopiarSeccion(${i})"><i data-lucide="copy"></i> Copiar estilo + prompt</button>` : ""}
      ${x.prompt ? `<label class="est-check"><input type="checkbox" ${x.hecha ? "checked" : ""} onchange="estMarcarHecha(${i}, this.checked)"> Imagen hecha</label>` : ""}
      <button class="est-btn ghost danger" title="Quitar sección" onclick="estQuitarSeccion(${i})"><i data-lucide="x"></i></button>
    </div>
  </article>`;
}

// ---------- Imágenes de cada sección (las que sacas de Gemini) ----------
const imgsDe = (idSeccion) => imagenes.filter(i => i.rama === av && i.seccion === idSeccion);
const MAX_IMGS_SECCION = 6;

function tiraImagenes(x) {
  const imgs = imgsDe(x.id);
  return `
  <div class="est-imgs" ondragover="event.preventDefault(); this.classList.add('soltar')" ondragleave="this.classList.remove('soltar')" ondrop="estSoltarImagen(event, '${esc(x.id)}')">
    ${imgs.map(im => `
      <div class="est-img">
        <a href="/api/imagenes/${esc(im._id)}" target="_blank" rel="noopener" title="Ver en grande"><img src="/api/imagenes/${esc(im._id)}" alt="Imagen de ${esc(x.titulo)}" loading="lazy"></a>
        ${im.origen === "ia" ? `<span class="est-img-ia">IA</span>` : ""}
        <button title="Quitar imagen" onclick="estQuitarImagen('${esc(im._id)}')">✕</button>
      </div>`).join("")}
    ${imgs.length < MAX_IMGS_SECCION ? `
      <label class="est-img add" id="imgAdd-${esc(x.id)}">
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onchange="estSubirImagen('${esc(x.id)}', this.files); this.value=''">
        <i data-lucide="upload"></i><span>${imgs.length ? "Agregar otra" : "Subir la imagen de Gemini"}</span>
      </label>
      ${x.prompt ? (generandoIA.has(x.id)
        ? `<div class="est-img add ia ocupado"><span class="est-spin"></span><span>Creando con IA... (hasta 1 min)</span></div>`
        : `<button class="est-img add ia" id="imgIA-${esc(x.id)}" title="Crea la imagen con Grok Imagine usando el estilo, este prompt y tus fotos reales" onclick="estGenerarImagenIA('${esc(x.id)}')">
            <i data-lucide="wand-sparkles"></i><span>Generar con IA</span><small>~$${costoIA().toFixed(2)} USD</small>
          </button>`) : ""}` : ""}
  </div>`;
}

// Comprime para la web: máximo 1920 px de lado, JPG de buena calidad
function comprimirImagen(file, max = 1920, calidad = 0.88) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const escala = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * escala);
      c.height = Math.round(img.height * escala);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);   // PNG transparente → fondo blanco
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve({ dataUrl: c.toDataURL("image/jpeg", calidad), ancho: c.width, alto: c.height });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen")); };
    img.src = url;
  });
}

window.estSubirImagen = async (idSeccion, files) => {
  const libres = MAX_IMGS_SECCION - imgsDe(idSeccion).length;
  const archivos = [...(files || [])].filter(f => /^image\//.test(f.type)).slice(0, libres);
  if (!archivos.length) return;
  const avInicio = av;
  const etiqueta = $(`imgAdd-${idSeccion}`);
  if (etiqueta) etiqueta.innerHTML = `<span class="est-spin"></span><span>Subiendo...</span>`;
  let subidas = 0;
  for (const f of archivos) {
    try {
      const { dataUrl, ancho, alto } = await comprimirImagen(f);
      const { imagen, rama } = await api("POST", `/api/proyectos/${proyecto._id}/rama/${avInicio}/imagenes`, { seccion: idSeccion, dataUrl, ancho, alto });
      imagenes.push(imagen);
      if (av === avInicio) ponerRama(rama);
      subidas++;
    } catch (err) { avisar(err.message, "error"); break; }
  }
  if (subidas) avisar(subidas === 1 ? "Imagen guardada ✓" : `${subidas} imágenes guardadas ✓`);
  if (tab === 4) renderPaso();
};
// ---------- Generar con IA (Grok Imagine) ----------
// Fotos de la Ficha que la IA usa como referencia (máx 3), recordadas por proyecto en este navegador
function refsIA() {
  const n = (proyecto?.fotos || []).length;
  let r = null;
  try { r = JSON.parse(localStorage.getItem(`est_refs_${proyecto._id}`) || "null"); } catch {}
  r = Array.isArray(r) ? r.filter(i => Number.isInteger(i) && i >= 0 && i < n).slice(0, 3) : [];
  return r.length ? r : Array.from({ length: Math.min(3, n) }, (_, i) => i);
}
window.estRefIA = (i) => {
  let r = refsIA();
  if (r.includes(i)) { if (r.length === 1) return avisar("Deja al menos una foto de referencia", "error"); r = r.filter(x => x !== i); }
  else { if (r.length >= 3) return avisar("Máximo 3 fotos de referencia", "error"); r = [...r, i].sort((a, b) => a - b); }
  try { localStorage.setItem(`est_refs_${proyecto._id}`, JSON.stringify(r)); } catch {}
  renderPaso();
};

const costoIA = () => {
  const g = gastoIA || { precioImagen: 0.04, precioReferencia: 0.01 };
  return g.precioImagen + g.precioReferencia * refsIA().length;
};

function lineaGastoIA() {
  if (gastoIA === null) {
    gastoIA = undefined;
    api("GET", "/api/ia/gasto").then(g => { gastoIA = g; if (tab === 4) renderPaso(); }).catch(() => { gastoIA = null; });
    return "";
  }
  if (!gastoIA) return "";
  const pct = gastoIA.limite > 0 ? Math.min(100, gastoIA.usd / gastoIA.limite * 100) : 100;
  return `
  <div class="est-gasto-ia">
    <i data-lucide="wand-sparkles"></i>
    <span>Imágenes con IA este mes: <b>$${gastoIA.usd.toFixed(2)}</b> de $${gastoIA.limite.toFixed(2)} USD · ${gastoIA.imagenes} imagen(es)</span>
    <span class="est-gasto-barra"><i style="width:${pct.toFixed(0)}%"></i></span>
    <button class="est-link" onclick="estLimiteIA()">Cambiar límite</button>
  </div>
  ${(proyecto.fotos || []).length ? `
  <div class="est-refs-ia">
    <span>Fotos que la IA copia (toca para elegir, máx 3). Funcionan mejor las del producto solo, nítido y con fondo limpio:</span>
    <div>${proyecto.fotos.map((src, i) => `<button class="${refsIA().includes(i) ? "sel" : ""}" onclick="estRefIA(${i})" title="Foto ${i + 1}"><img src="${src}" alt="Foto ${i + 1}"></button>`).join("")}</div>
  </div>` : `<p class="est-hint">Para generar con IA sube primero fotos reales del producto en la Ficha.</p>`}`;
}

window.estLimiteIA = async () => {
  const v = prompt("Límite de gasto mensual para imágenes con IA (USD). 0 = apagado.", String(gastoIA?.limite ?? 5));
  if (v === null) return;
  try {
    gastoIA = await api("PUT", "/api/ia/gasto", { limite: Number(String(v).replace(",", ".")) });
    avisar("Límite guardado ✓");
    renderPaso();
  } catch (err) { avisar(err.message, "error"); }
};

window.estGenerarImagenIA = async (idSeccion) => {
  if (generandoIA.has(idSeccion)) return;
  if (!(proyecto.fotos || []).length) { avisar("Primero sube fotos reales del producto en la Ficha (paso 1). Sin fotos la IA inventa otro producto.", "error"); return; }
  const avInicio = av;
  generandoIA.add(idSeccion);
  renderPaso();
  try {
    const { imagen, rama, gasto } = await api("POST", `/api/proyectos/${proyecto._id}/rama/${avInicio}/ia/imagen/${idSeccion}`, { refs: refsIA() });
    imagenes.push(imagen);
    if (av === avInicio) ponerRama(rama);
    gastoIA = gasto;
    avisar("Imagen creada ✓ Revísala: si no te gusta, quítala y genera otra.");
  } catch (err) {
    avisar(err.message, "error");
    api("GET", "/api/ia/gasto").then(g => { gastoIA = g; }).catch(() => {});
  } finally {
    generandoIA.delete(idSeccion);
    if (tab === 4) renderPaso();
  }
};

window.estSoltarImagen = (e, idSeccion) => {
  e.preventDefault();
  e.currentTarget?.classList.remove("soltar");
  estSubirImagen(idSeccion, e.dataTransfer?.files);
};
window.estQuitarImagen = async (id) => {
  if (!confirm("¿Quitar esta imagen?")) return;
  try {
    await api("DELETE", `/api/imagenes/${id}`);
    imagenes = imagenes.filter(i => i._id !== id);
    renderPaso();
  } catch (err) { avisar(err.message, "error"); }
};

window.estProponerSecciones = () => conCarga("estBtnSecciones", "Armando estructura...", async () => {
  if (R().secciones?.length && !confirm("¿Reemplazar las secciones de este avatar y sus prompts?")) return;
  const { rama } = await api("POST", urlRama("ia/secciones"));
  ponerRama(rama);
  renderPaso();
});

async function generarSeccion(id) {
  const avDeLaPeticion = av;
  const { seccion } = await api("POST", urlRama(`ia/seccion/${id}`));
  if (av !== avDeLaPeticion) return;   // cambiaste de avatar mientras se generaba
  const r = R();
  const secciones = r.secciones.map(x => x.id === id ? seccion : x);
  ponerRama({ ...r, secciones });
}

window.estGenerarSeccion = (id) => conCarga(`btnSec-${id}`, "Escribiendo...", async () => {
  await generarSeccion(id);
  renderPaso();
  $(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
});

window.estGenerarTodos = async () => {
  if (generandoTodo) return;
  const avInicio = av;
  const faltan = R().secciones.filter(x => !x.prompt).map(x => x.id);
  if (!faltan.length) return avisar("Todas las secciones ya tienen prompt", "ok");
  generandoTodo = true;
  let hechos = 0, errores = 0;
  const boton = () => $("estBtnTodos");
  for (const id of faltan) {
    if (av !== avInicio) break;
    if (boton()) { boton().disabled = true; boton().innerHTML = `<span class="est-spin"></span> Escribiendo ${hechos + 1} de ${faltan.length}...`; }
    try { await generarSeccion(id); hechos++; }
    catch (err) {
      errores++;
      avisar(err.message, "error");
      if (/límite/i.test(err.message)) break;
    }
  }
  generandoTodo = false;
  if (tab === 4) renderPaso();
  avisar(errores ? `Listo con ${errores} error(es). Puedes reintentar las que faltan.` : `${hechos} prompts listos ✓`, errores ? "error" : "ok");
};

window.estCopiarSeccion = (i) => {
  const r = R();
  copiar(limpiarFuentes(`${r.bloqueEstilo}\n\n${r.secciones[i].prompt}`));
};

const cambiarSecciones = (fn) => guardarRama({ secciones: fn([...R().secciones]) });

window.estEditarPrompt = (i, v) => cambiarSecciones(secs => secs.map((x, j) => j === i ? { ...x, prompt: v } : x));

window.estMarcarHecha = async (i, v) => {
  await cambiarSecciones(secs => secs.map((x, j) => j === i ? { ...x, hecha: v } : x));
  renderPaso();
};

window.estMoverSeccion = async (i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= R().secciones.length) return;
  await cambiarSecciones(secs => { [secs[i], secs[j]] = [secs[j], secs[i]]; return secs; });
  renderPaso();
};

window.estQuitarSeccion = async (i) => {
  if (!confirm(`¿Quitar "${R().secciones[i].titulo}"?`)) return;
  await cambiarSecciones(secs => secs.filter((_, j) => j !== i));
  renderPaso();
};

window.estCambiarVariante = async (i, id) => {
  const v = varianteDe(R().secciones[i]?.tipo, id);
  await cambiarSecciones(secs => secs.map((x, j) => j === i ? { ...x, variante: id, composicion: v?.nombre || x.composicion } : x));
  if (R().secciones[i]?.prompt) avisar("Diseño cambiado: dale a Regenerar para aplicarlo", "ok");
  renderPaso();
};

window.estAgregarSeccion = async () => {
  const tipo = $("estNuevaTipo")?.value;
  const formato = formatoDe(proyecto);
  const variante = elegirVariante(tipo, cachePlantilla?.[claveProyecto()]);
  const nueva = {
    id: Math.random().toString(36).slice(2, 10), tipo, titulo: SECCIONES[tipo]?.titulo || tipo, grupo: av,
    formato: formatoImagen(tipo, formato), variante, composicion: varianteDe(tipo, variante)?.nombre || "",
    proposito: "", prompt: "", hecha: false
  };
  await cambiarSecciones(secs => [...secs, nueva]);
  renderPaso();
};

// ---------- Landing normal: textos para Shopify ----------
function tarjetaTextos(r) {
  const t = r.textos;
  const fila = (campo, titulo, valor, multilinea = false) => `
    <div class="est-texto">
      <div class="est-texto-head"><b>${titulo}</b><button class="est-mini-btn" onclick="estCopiarTexto('${campo}')"><i data-lucide="copy"></i> Copiar</button></div>
      ${multilinea ? `<pre>${esc(valor)}</pre>` : `<p>${esc(valor)}</p>`}
    </div>`;
  return `
  <div class="est-card est-textos-card">
    <div class="est-card-row">
      <div>
        <h3>Textos para Shopify ${avTag()}</h3>
        <p class="est-muted">Lo que va en el bloque de compra y en las pestañas del producto: título, frase de oferta, beneficios con ✔, descripción, envío y preguntas frecuentes.</p>
      </div>
      <button id="estBtnTextos" class="est-btn ${t ? "" : "primary"}" onclick="estGenerarTextos()"><i data-lucide="type"></i> ${t ? "Volver a escribir" : "Escribir textos"}</button>
    </div>
    ${t ? `
      <div class="est-textos">
        ${fila("titulo", "Título del producto", t.titulo)}
        ${fila("frase_oferta", "Frase encima del precio", t.frase_oferta)}
        ${fila("beneficios", "Beneficios (con ✔)", textoCampo(t, "beneficios"), true)}
        ${fila("descripcion", "Descripción", t.descripcion, true)}
        ${fila("especificaciones", "Detalles y especificaciones", textoCampo(t, "especificaciones"), true)}
        ${fila("envio", "Envío y devoluciones", t.envio, true)}
        ${fila("preguntas", "Preguntas frecuentes", textoCampo(t, "preguntas"), true)}
      </div>` : ""}
  </div>`;
}

function textoCampo(t, campo) {
  if (!t) return "";
  if (campo === "beneficios") return (t.beneficios || []).map(b => `✔ ${b}`).join("\n");
  if (campo === "especificaciones") return (t.especificaciones || []).map(b => `• ${b}`).join("\n");
  if (campo === "preguntas") return (t.preguntas || []).map(q => `${q.pregunta}\n${q.respuesta}`).join("\n\n");
  return String(t[campo] || "");
}

window.estCopiarTexto = (campo) => copiar(textoCampo(R().textos, campo));

window.estGenerarTextos = () => conCarga("estBtnTextos", "Escribiendo textos...", async () => {
  const { rama } = await api("POST", urlRama("ia/textos"));
  ponerRama(rama);
  renderPaso();
});

// =============================================
// PASO 5: ANUNCIOS (copys, ads estáticos y guiones)
// =============================================
let subAnuncio = (() => { try { return localStorage.getItem("est_sub_anuncio") || "copys"; } catch { return "copys"; } })();
let adSel = new Set();
let adFormato = "4:5";
let adPrecio = true;

function pasoAnuncios() {
  const r = R();
  const subs = [
    ["copys", "Copys", "type", r.copys?.meta?.length ? "✓" : ""],
    ["ads", "Ads estáticos", "image", (r.ads || []).length ? String((r.ads || []).length) : ""],
    ["guiones", "Guiones de video", "clapperboard", (r.guiones || []).filter(g => g.guion).length ? String((r.guiones || []).filter(g => g.guion).length) : ""]
  ];
  const cuerpo = subAnuncio === "ads" ? pasoAds() : subAnuncio === "guiones" ? pasoGuiones() : pasoCopys();
  return `
  <nav class="est-subtabs">
    ${subs.map(([k, t, i, n]) => `<button class="${subAnuncio === k ? "activa" : ""}" onclick="estSubAnuncio('${k}')"><i data-lucide="${i}"></i> ${t}${n ? ` <em>${n}</em>` : ""}</button>`).join("")}
  </nav>
  ${cuerpo}`;
}

window.estSubAnuncio = (k) => {
  subAnuncio = ["copys", "ads", "guiones"].includes(k) ? k : "copys";
  try { localStorage.setItem("est_sub_anuncio", subAnuncio); } catch {}
  renderPaso();
};

// ---------- Copys ----------
function pasoCopys() {
  const r = R();
  const c = r.copys;
  const op = c?.opciones || { contraEntrega: true, envio: !!proyecto.ficha?.promesas?.envioGratis, precio: false };
  const envioReal = !!proyecto.ficha?.promesas?.envioGratis;
  return `
  <div class="est-card">
    <div class="est-card-row">
      <div>
        <h3>Copys para Meta y TikTok ${avTag()}</h3>
        <p class="est-muted">3 textos para Meta Ads (problema, beneficio y curiosidad) y una frase para TikTok, hablándole a ${esc(resumenAvatar(avatarActual()))}. Escritos para que Meta no los rechace.</p>
      </div>
      <button id="estBtnCopys" class="est-btn ${c ? "" : "primary"}" onclick="estGenerarCopys()"><i data-lucide="sparkles"></i> ${c ? "Escribir otros" : "Escribir copys"}</button>
    </div>
    <div class="est-checks inline">
      <label><input type="checkbox" id="cpContra" ${op.contraEntrega !== false ? "checked" : ""}> Mencionar pago contra entrega</label>
      <label title="${envioReal ? "" : "Marca 'Envío gratis' en la Ficha si es verdad"}"><input type="checkbox" id="cpEnvio" ${op.envio && envioReal ? "checked" : ""} ${envioReal ? "" : "disabled"}> Envío gratis${envioReal ? "" : " (no está en la ficha)"}</label>
      <label><input type="checkbox" id="cpPrecio" ${op.precio ? "checked" : ""}> Poner el precio</label>
    </div>
  </div>
  ${c ? `
    <div class="est-copys">
      ${c.meta.map((v, i) => `
        <article class="est-copy">
          <span class="est-chip">${esc(ENFOQUES_COPY[v.enfoque] || v.enfoque)}</span>
          <label class="est-label">Texto principal <button class="est-mini-btn" onclick="estCopiarCopy(${i}, 'texto_principal')"><i data-lucide="copy"></i> Copiar</button></label>
          <textarea class="est-code" rows="7" onchange="estEditarCopy(${i}, 'texto_principal', this.value)">${esc(v.texto_principal)}</textarea>
          <label class="est-label">Título <small>${(v.titulo || "").length}/40</small> <button class="est-mini-btn" onclick="estCopiarCopy(${i}, 'titulo')"><i data-lucide="copy"></i></button></label>
          <input class="est-input" value="${esc(v.titulo)}" maxlength="80" onchange="estEditarCopy(${i}, 'titulo', this.value)">
          <label class="est-label">Descripción <small>${(v.descripcion || "").length}/30</small> <button class="est-mini-btn" onclick="estCopiarCopy(${i}, 'descripcion')"><i data-lucide="copy"></i></button></label>
          <input class="est-input" value="${esc(v.descripcion)}" maxlength="60" onchange="estEditarCopy(${i}, 'descripcion', this.value)">
        </article>`).join("")}
    </div>
    <div class="est-card">
      <div class="est-card-row"><h3>TikTok</h3><button class="est-mini-btn" onclick="estCopiarTiktok()"><i data-lucide="copy"></i> Copiar</button></div>
      <input class="est-input" value="${esc(c.tiktok)}" maxlength="200" onchange="estEditarTiktok(this.value)">
    </div>` : ""}
  <div class="est-next"><button class="est-btn primary" onclick="estSubAnuncio('ads')">Seguir con los ads estáticos <i data-lucide="arrow-right"></i></button></div>`;
}

window.estCopiarTiktok = () => copiar(R().copys?.tiktok || "");
window.estGenerarCopys = () => conCarga("estBtnCopys", "Escribiendo...", async () => {
  const { rama } = await api("POST", urlRama("ia/copys"), {
    contraEntrega: !!$("cpContra")?.checked, envio: !!$("cpEnvio")?.checked, precio: !!$("cpPrecio")?.checked
  });
  ponerRama(rama);
  renderPaso();
});
window.estCopiarCopy = (i, campo) => copiar(R().copys?.meta?.[i]?.[campo] || "");
window.estEditarCopy = (i, campo, v) => {
  const c = R().copys; if (!c) return;
  guardarRama({ copys: { ...c, meta: c.meta.map((x, j) => j === i ? { ...x, [campo]: v } : x) } });
};
window.estEditarTiktok = (v) => { const c = R().copys; if (c) guardarRama({ copys: { ...c, tiktok: v } }); };

// ---------- Ads estáticos ----------
function pasoAds() {
  const r = R();
  const ads = r.ads || [];
  const acento = r.estilo?.color2 && /^#[0-9a-f]{3,8}$/i.test(r.estilo.color2) ? r.estilo.color2 : "#6366f1";
  const libres = Math.max(0, MAX_ADS - ads.length);
  const conPrompt = ads.filter(a => a.prompt).length;
  return `
  <div class="est-card">
    <h3>Ads estáticos ${avTag()}</h3>
    <p class="est-muted">Marca las estructuras que quieres probar (hasta ${Math.min(5, libres)} a la vez), elige el formato y CoDropX escribe el prompt de cada anuncio con el estilo de esta landing. Se hacen en Gemini igual que las secciones.</p>
    ${!r.estilo ? `<div class="est-alert warn">Sin estilo elegido (paso 3) los anuncios no tendrán tus colores de marca.</div>` : ""}
    <div class="est-ad-grid">
      ${Object.entries(ESTRUCTURAS_AD).map(([k, e]) => `
        <button class="est-ad-op ${adSel.has(k) ? "sel" : ""}" title="${esc(e.desc)}" onclick="estAdSel('${k}')">
          ${dibujar(e.dibujo, acento, "est-ad-dib")}
          <span>${esc(e.nombre)}</span>
        </button>`).join("")}
    </div>
    <div class="est-ad-ops">
      <span class="est-muted">Formato:</span>
      ${Object.entries(FORMATOS_AD).map(([k, f]) => `<button class="est-chip-btn ${adFormato === k ? "activo" : ""}" onclick="estAdFormato('${k}')"><b>${k}</b> ${f.uso}</button>`).join("")}
      <label class="est-check"><input type="checkbox" ${adPrecio ? "checked" : ""} onchange="estAdPrecio(this.checked)"> Mostrar precio</label>
      <button id="estBtnAds" class="est-btn primary" onclick="estCrearAds()" ${adSel.size && libres ? "" : "disabled"}><i data-lucide="sparkles"></i> Crear ${adSel.size || ""} anuncio${adSel.size === 1 ? "" : "s"}</button>
    </div>
    ${!libres ? `<p class="est-hint">Llegaste a ${MAX_ADS} anuncios: quita alguno para crear más.</p>` : ""}
  </div>

  ${ads.length ? `
    <div class="est-card-row" style="margin:4px 0">
      <p class="est-muted">${conPrompt}/${ads.length} prompts · ${ads.filter(a => a.hecha).length} imágenes hechas</p>
      ${ads.some(a => !a.prompt) ? `<button id="estBtnAdsFaltan" class="est-btn" onclick="estGenerarAdsFaltantes()"><i data-lucide="sparkles"></i> Escribir los que faltan</button>` : ""}
    </div>
    <div class="est-ads">
      ${ads.map((a, i) => tarjetaAd(a, i, acento)).join("")}
    </div>` : ""}
  <div class="est-next"><button class="est-btn primary" onclick="estSubAnuncio('guiones')">Seguir con los guiones de video <i data-lucide="arrow-right"></i></button></div>`;
}

function tarjetaAd(a, i, acento) {
  const e = ESTRUCTURAS_AD[a.estructura];
  return `
  <article class="est-sec est-ad ${a.hecha ? "hecha" : ""}" id="ad-${esc(a.id)}">
    <div class="est-sec-head">
      ${dibujar(e?.dibujo, acento, "est-ad-mini")}
      <div class="est-sec-info">
        <strong>${esc(e?.nombre || a.estructura)}</strong>
        <div class="est-sec-tags"><span class="est-chip">${esc(a.formato)} · ${esc(FORMATOS_AD[a.formato]?.uso || "")}</span><span class="est-chip">${a.precio ? "Con precio" : "Sin precio"}</span></div>
        <input class="est-input chico" value="${esc(a.nota)}" placeholder="Nota opcional (ej: usar la foto en la cocina)" onchange="estEditarAd(${i}, 'nota', this.value)">
      </div>
    </div>
    ${a.prompt ? `<textarea class="est-code" rows="9" onchange="estEditarAd(${i}, 'prompt', this.value)">${esc(a.prompt)}</textarea>` : `<div class="est-empty">Sin prompt todavía.</div>`}
    <div class="est-sec-actions">
      <button class="est-btn ${a.prompt ? "" : "primary"}" id="btnAd-${esc(a.id)}" onclick="estGenerarAd('${esc(a.id)}')"><i data-lucide="sparkles"></i> ${a.prompt ? "Regenerar" : "Escribir prompt"}</button>
      ${a.prompt ? `<button class="est-btn primary" onclick="estCopiarAd(${i})"><i data-lucide="copy"></i> Copiar estilo + prompt</button>
      <label class="est-check"><input type="checkbox" ${a.hecha ? "checked" : ""} onchange="estEditarAd(${i}, 'hecha', this.checked, true)"> Imagen hecha</label>` : ""}
      <button class="est-btn ghost danger" title="Quitar anuncio" onclick="estQuitarAd(${i})"><i data-lucide="x"></i></button>
    </div>
  </article>`;
}

window.estAdSel = (k) => {
  if (adSel.has(k)) adSel.delete(k);
  else if (adSel.size < 5) adSel.add(k);
  else avisar("Máximo 5 estructuras a la vez", "error");
  renderPaso();
};
window.estAdFormato = (f) => { adFormato = FORMATOS_AD[f] ? f : "4:5"; renderPaso(); };
window.estAdPrecio = (v) => { adPrecio = !!v; };

async function generarAd(id) {
  const avDeLaPeticion = av;
  const { ad } = await api("POST", urlRama(`ia/ad/${id}`));
  if (av !== avDeLaPeticion) return;
  const r = R();
  ponerRama({ ...r, ads: (r.ads || []).map(a => a.id === id ? ad : a) });
}

async function generarVarios(ids, botonId) {
  let hechos = 0;
  for (const id of ids) {
    const b = $(botonId);
    if (b) { b.disabled = true; b.innerHTML = `<span class="est-spin"></span> Escribiendo ${hechos + 1} de ${ids.length}...`; }
    try { await generarAd(id); hechos++; }
    catch (err) { avisar(err.message, "error"); if (/límite/i.test(err.message)) break; }
    if (tab === 5 && subAnuncio === "ads") renderPaso();
  }
  avisar(`${hechos} anuncio(s) listos ✓`);
  if (tab === 5) renderPaso();
}

window.estCrearAds = async () => {
  const r = R();
  const libres = MAX_ADS - (r.ads || []).length;
  const nuevos = [...adSel].slice(0, libres).map(estructura => ({
    id: Math.random().toString(36).slice(2, 10), estructura, formato: adFormato, precio: adPrecio, nota: "", prompt: "", hecha: false
  }));
  if (!nuevos.length) return;
  await guardarRama({ ads: [...(r.ads || []), ...nuevos] });
  adSel = new Set();
  renderPaso();
  await generarVarios(nuevos.map(a => a.id), "estBtnAdsFaltan");
};
window.estGenerarAdsFaltantes = () => generarVarios((R().ads || []).filter(a => !a.prompt).map(a => a.id), "estBtnAdsFaltan");
window.estGenerarAd = (id) => conCarga(`btnAd-${id}`, "Escribiendo...", async () => { await generarAd(id); renderPaso(); });
window.estCopiarAd = (i) => { const r = R(); copiar(limpiarFuentes(`${r.bloqueEstilo || ""}\n\n${r.ads[i].prompt}`.trim())); };
window.estEditarAd = async (i, campo, v, repintar) => {
  await guardarRama({ ads: (R().ads || []).map((a, j) => j === i ? { ...a, [campo]: v } : a) });
  if (repintar) renderPaso();
};
window.estQuitarAd = async (i) => {
  const a = R().ads?.[i]; if (!a) return;
  if (!confirm(`¿Quitar el anuncio "${ESTRUCTURAS_AD[a.estructura]?.nombre || ""}"?`)) return;
  await guardarRama({ ads: R().ads.filter((_, j) => j !== i) });
  renderPaso();
};

// =============================================
// PASO 5c: GUIONES (3 del avatar elegido)
// =============================================
const POR_AVATAR = 3;

// Texto que se lee (sin lo que va entre corchetes)
const soloVoz = (t = "") => String(t).replace(/\[[^\]]*\]/g, " ").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
const contarPalabras = (t = "") => (soloVoz(t).match(/[\p{L}\p{N}]+/gu) || []).length;
const segundos = (palabras) => Math.round(palabras / 2.6);

function guionesActuales() {
  const actuales = R().guiones || [];
  const lista = [...actuales];
  while (lista.length < POR_AVATAR) {
    lista.push({ id: Math.random().toString(36).slice(2, 10), avatar: av, referencia: "", link: "", nota: "", guion: "", ganchos: [], historiaReal: false, verificar: [] });
  }
  return lista.slice(0, POR_AVATAR);
}

function pasoGuiones() {
  const guiones = guionesActuales();
  if ((R().guiones || []).length < POR_AVATAR) {
    ponerRama({ ...R(), guiones });
    guardarRama({ guiones });
  }
  const hechos = guiones.filter(g => g.guion).length;

  return `
  <div class="est-card">
    <h3>Guiones de voz en off ${avTag()}</h3>
    <p class="est-muted">${POR_AVATAR} guiones para ${esc(resumenAvatar(avatarActual()))}, cada uno basado en un video de referencia distinto. Pega el texto del video (en inglés, chino o español, sin traducir) y la IA lo reescribe para este avatar. ${hechos}/${POR_AVATAR} listos.</p>
    <p class="est-hint">Formato: 20 a 25 segundos · [lo que se ve] entre corchetes · gancho en los primeros 3 segundos · cierre con precio, contra entrega y llamado a la acción.</p>
  </div>

  <div class="est-guiones">
    ${guiones.map((g, i) => tarjetaGuion(g, i, i + 1)).join("")}
  </div>

  ${siguiente(6, "Seguir con las notas")}
  `;
}

function tarjetaGuion(g, i, n) {
  const palabras = contarPalabras(g.guion);
  const seg = segundos(palabras);
  const estado = !g.guion ? "" : seg < 18 ? "corto" : seg > 27 ? "largo" : "bien";
  return `
  <article class="est-guion" id="gui-${esc(g.id)}">
    <div class="est-card-row">
      <strong>Guion ${esc(av)}${n}</strong>
      ${g.guion ? `<span class="est-chip ${estado === "bien" ? "ok" : "warn"}">≈ ${seg} s · ${palabras} palabras${estado === "corto" ? " · corto" : estado === "largo" ? " · largo" : ""}</span>` : ""}
    </div>

    <div class="est-form">
      <label>Texto del video de referencia (opcional)</label>
      <textarea rows="4" placeholder="Pega aquí la transcripción del video de ScaleBoost o PiPiAds. Si lo dejas vacío, la IA escribe uno original desde el ángulo del avatar." onchange="estEditarGuion(${i}, 'referencia', this.value)">${esc(g.referencia)}</textarea>
      <div class="est-row">
        <div><label>Link del video</label><input value="${esc(g.link)}" placeholder="https://..." onchange="estEditarGuion(${i}, 'link', this.value)"></div>
        <div><label>Nota</label><input value="${esc(g.nota)}" placeholder="Ej: muestra antes y después" onchange="estEditarGuion(${i}, 'nota', this.value)"></div>
      </div>
    </div>

    <div class="est-sec-actions">
      <button id="btnGui-${esc(g.id)}" class="est-btn ${g.guion ? "" : "primary"}" onclick="estGenerarGuion('${esc(g.id)}')">
        <i data-lucide="sparkles"></i> ${g.guion ? "Reescribir de nuevo" : g.referencia ? "Reescribir para el avatar" : "Escribir guion"}
      </button>
      ${g.link ? `<a class="est-btn ghost" href="${esc(/^https?:\/\//.test(g.link) ? g.link : "#")}" target="_blank" rel="noopener"><i data-lucide="external-link"></i> Ver video</a>` : ""}
    </div>

    ${g.guion ? `
      <label class="est-label">Guion</label>
      <textarea class="est-code" rows="9" oninput="estContarGuion(this, '${esc(g.id)}')" onchange="estEditarGuion(${i}, 'guion', this.value)">${esc(g.guion)}</textarea>
      <div class="est-sec-actions">
        <button class="est-btn primary" onclick="estCopiarVoz(${i})"><i data-lucide="mic"></i> Copiar solo voz</button>
        <button class="est-btn" onclick="estCopiarGuion(${i})"><i data-lucide="copy"></i> Copiar con escenas</button>
      </div>
      ${(g.ganchos || []).length ? `
        <label class="est-label">Ganchos alternativos para testear</label>
        <ul class="est-ganchos">${g.ganchos.map((h, k) => `<li><span>${esc(h)}</span><button class="est-btn ghost" title="Usar este gancho" onclick="estUsarGancho(${i}, ${k})">Usar</button></li>`).join("")}</ul>
      ` : ""}
      ${g.historiaReal || (g.verificar || []).length ? `
        <div class="est-alert warn"><strong>Verifica antes de publicar:</strong><ul>${(g.verificar || []).map(v => `<li>${esc(v)}</li>`).join("") || "<li>Los datos de la historia real</li>"}</ul></div>
      ` : ""}
    ` : ""}
  </article>`;
}

const cambiarGuiones = (fn) => {
  const guiones = fn(guionesActuales());
  ponerRama({ ...R(), guiones });
  return guardarRama({ guiones });
};

window.estEditarGuion = (i, campo, valor) => cambiarGuiones(gs => gs.map((g, j) => j === i ? { ...g, [campo]: valor } : g));

window.estContarGuion = (ta, id) => {
  const chip = document.querySelector(`#gui-${id} .est-chip`);
  if (!chip) return;
  const p = contarPalabras(ta.value), s = segundos(p);
  chip.textContent = `≈ ${s} s · ${p} palabras${s < 18 ? " · corto" : s > 27 ? " · largo" : ""}`;
  chip.className = `est-chip ${s >= 18 && s <= 27 ? "ok" : "warn"}`;
};

window.estGenerarGuion = (id) => conCarga(`btnGui-${id}`, "Escribiendo guion...", async () => {
  document.querySelectorAll(`#gui-${id} textarea, #gui-${id} input`).forEach(el => el.blur());
  await guardarRama({ guiones: guionesActuales() });
  const avDeLaPeticion = av;
  const { guion } = await api("POST", urlRama(`ia/guion/${id}`));
  if (av !== avDeLaPeticion) return;
  const r = R();
  ponerRama({ ...r, guiones: r.guiones.map(g => g.id === id ? guion : g), paso: Math.max(r.paso || 3, 5) });
  renderProyecto();
  $(`gui-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
});

window.estCopiarVoz = (i) => copiar(soloVoz(guionesActuales()[i].guion));
window.estCopiarGuion = (i) => copiar(guionesActuales()[i].guion);

window.estUsarGancho = async (i, k) => {
  await cambiarGuiones(gs => gs.map((g, j) => {
    if (j !== i) return g;
    const gancho = g.ganchos[k];
    const nuevo = g.guion.replace(/^((?:\s*\[[^\]]*\]\s*)*)([^.!?\n]*[.!?]?)/, (m, escenas) => `${escenas}${gancho}`);
    const ganchos = [...g.ganchos];
    ganchos[k] = soloVoz(g.guion).split(/(?<=[.!?])\s/)[0];
    return { ...g, guion: nuevo, ganchos };
  }));
  renderPaso();
};

// =============================================
// PASO 6: NOTAS (del avatar elegido)
// =============================================
// =============================================
// PASO 6: PUBLICAR (vista previa + Shopify + notas)
// =============================================
function landingActual() {
  const r = R();
  const mapa = {};
  for (const im of imagenes) if (im.rama === av) (mapa[im.seccion] ||= []).push(`/api/imagenes/${im._id}`);
  return construirLanding({ formato: formatoDe(proyecto), secciones: r.secciones || [], imagenes: mapa, textos: r.textos, nombre: r.textos?.titulo || proyecto.nombre });
}

function vistaPrevia(L) {
  const r = R();
  const f = proyecto.ficha || {};
  const normal = formatoDe(proyecto) === "normal";
  const cabecera = normal ? `
    <div class="est-pv-prod">
      ${L.galeria.length ? `<img src="${esc(L.galeria[0])}" alt="">` : `<div class="est-pv-vacio">Galería de fotos</div>`}
      ${L.galeria.length > 1 ? `<div class="est-pv-mini">${L.galeria.slice(1, 5).map(g => `<img src="${esc(g)}" alt="">`).join("")}</div>` : ""}
      <h4>${esc(r.textos?.titulo || proyecto.nombre)}</h4>
      <p class="est-pv-precio">${formatoPrecio(f.precio, proyecto.pais) || "Sin precio"} ${f.precioAntes > f.precio ? `<s>${formatoPrecio(f.precioAntes, proyecto.pais)}</s>` : ""}</p>
      <div class="est-pv-comprar">Comprar ahora</div>
    </div>` : "";
  const vacio = !L.totalImagenes;
  return `
  <div class="est-phone">
    <div class="est-phone-barra"><span></span></div>
    <div class="est-phone-pantalla">
      ${cabecera}
      ${vacio && !normal ? `<div class="est-pv-vacio alto">Sube las imágenes de Gemini en el paso 4 para ver la ban page aquí.</div>` : L.html}
    </div>
  </div>`;
}

function tarjetaPublicar(L) {
  const r = R();
  const pubs = Object.values(r.publicaciones || {});
  if (tiendasShopify === null) {
    api("GET", "/api/shopify/tiendas").then(d => { tiendasShopify = d.tiendas || []; if (tab === 6) renderPaso(); })
      .catch(() => { tiendasShopify = []; if (tab === 6) renderPaso(); });
    return `<div class="est-card"><h3>Publicar en Shopify</h3><p class="est-muted">Cargando tus tiendas...</p></div>`;
  }
  const tiendas = tiendasShopify.filter(t => t.conectada);
  if (!tiendas.find(t => t._id === tiendaElegida)) {
    tiendaElegida = (tiendas.find(t => t.pais === proyecto.pais) || tiendas[0])?._id || null;
  }
  const t = tiendas.find(x => x._id === tiendaElegida);
  const ya = t ? r.publicaciones?.[t._id] : null;
  const normal = formatoDe(proyecto) === "normal";
  return `
  <div class="est-card">
    <h3>Publicar en Shopify ${avTag()}</h3>
    ${!tiendas.length ? `
      <p class="est-muted">Conecta tu tienda una vez y desde aquí subes la landing con un clic: imágenes, precio${normal ? ", textos" : ""} y todo en orden.</p>
      <button class="est-btn primary" onclick="goTo('integraciones')"><i data-lucide="plug"></i> Conectar mi tienda Shopify</button>` : `
      <p class="est-muted">Se crea el producto en <b>borrador</b> con ${L.totalImagenes} imagen(es)${normal ? ", la galería, los textos" : ""} y el precio${proyecto.ficha?.precioAntes ? " con el \"antes\" tachado" : ""}. En Shopify le pones botones y GIF, revisas y lo activas.</p>
      <label class="est-label-claro">Tienda</label>
      <select id="estTienda" onchange="estElegirTienda(this.value)">
        ${tiendas.map(x => `<option value="${esc(x._id)}" ${x._id === tiendaElegida ? "selected" : ""}>${esc(x.nombre || x.shop)} · ${esc(x.moneda)}</option>`).join("")}
      </select>
      ${t ? opcionesTema(t) : ""}
      ${L.faltan.length ? `<div class="est-alert warn">Sin imagen: ${L.faltan.map(esc).join(", ")}. Esas secciones no se publican.</div>` : ""}
      ${t?.faltanPermisos?.length ? `<div class="est-alert warn">A esta tienda le faltan permisos (${t.faltanPermisos.map(esc).join(", ")}). Revísala en Integraciones.</div>` : ""}
      <div class="est-sec-actions">
        <button id="estBtnPublicar" class="est-btn primary" onclick="estPublicar()" ${L.totalImagenes ? "" : "disabled"}><i data-lucide="${ya ? "refresh-cw" : "upload-cloud"}"></i> ${ya ? "Actualizar en Shopify" : "Publicar como borrador"}</button>
      </div>
      ${!L.totalImagenes ? `<p class="est-hint">Primero sube las imágenes en el paso 4 (Landing).</p>` : ""}`}
    ${pubs.length ? `
      <div class="est-pubs">
        ${pubs.map(pb => `
          <div class="est-pub">
            <i data-lucide="check-circle-2"></i>
            <div><b>${esc(pb.tienda)}</b><small>${pb.estado === "ACTIVE" ? "Activo" : "Borrador"} · ${esc(fecha(pb.fecha))} · ${pb.imagenes} imágenes</small></div>
            <a class="est-btn chico" href="${esc(pb.adminUrl)}" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i> Abrir en Shopify</a>
          </div>`).join("")}
      </div>` : ""}
  </div>`;
}

window.estElegirTienda = (id) => { tiendaElegida = id; plantillaPub = null; renderPaso(); };

// Dónde van las imágenes: en la sección "CoDropX landing" de una plantilla del tema, o en la descripción
function opcionesTema(t) {
  const info = temaTiendas[t._id];
  if (info === undefined) {
    temaTiendas[t._id] = "cargando";
    api("GET", `/api/shopify/tiendas/${t._id}/plantillas`)
      .then(d => { temaTiendas[t._id] = d; if (tab === 6) renderPaso(); })
      .catch(err => { temaTiendas[t._id] = { error: err.message, plantillas: [] }; if (tab === 6) renderPaso(); });
  }
  const d = info && info !== "cargando" ? info : null;
  const formato = formatoDe(proyecto);
  // Por defecto: la plantilla con la que ya se publicó ESTE proyecto en esta tienda; si no, la última que usaste
  if (plantillaPub === null && d) plantillaPub = R().publicaciones?.[t._id]?.plantilla ?? d.elegida?.[formato] ?? "";
  const lista = d?.plantillas || [];
  return `
    <label class="est-label-claro">Dónde van las imágenes</label>
    <select id="estDestino" onchange="estDestino(this.value)">
      <option value="tema" ${destinoPub === "tema" ? "selected" : ""}>En mi plantilla del tema (sección CoDropX landing)</option>
      <option value="descripcion" ${destinoPub === "descripcion" ? "selected" : ""}>En la descripción del producto</option>
    </select>
    ${destinoPub === "tema" ? `
      <label class="est-label-claro">Plantilla de producto ${d?.tema ? `<small>(tema "${esc(d.tema)}")</small>` : ""}
        <button class="est-link" onclick="estRecargarPlantillas('${esc(t._id)}')" title="Si creaste una plantilla nueva en Shopify">↻ Recargar lista</button></label>
      ${!d ? `<p class="est-hint">Leyendo las plantillas de tu tema...</p>`
        : d.sinPermiso || d.error ? `
          <input id="estPlantilla" class="est-input" placeholder="Nombre de la plantilla (ej: ban-page). Vacío = predeterminada" value="${esc(plantillaPub || "")}" onchange="estPlantilla(this.value.trim())">
          <p class="est-hint">${d.sinPermiso ? "Para ver la lista de tus plantillas agrega el permiso read_themes a la app (Integraciones)." : esc(d.error)}</p>`
        : `<div class="est-pl-buscar">
            <div class="est-pl-fila">
              <input id="estPlantillaBuscar" class="est-input" placeholder="Busca tu plantilla (ej: ban)" autocomplete="off"
                value="${esc(plantillaPub ? plantillaPub : "")}" oninput="estBuscarPlantilla(this.value)" onfocus="estBuscarPlantilla(this.value, true)"
                onkeydown="if(event.key==='Enter'){event.preventDefault(); estPrimeraPlantilla();}">
              ${d.editorUrl ? `<a class="est-btn chico" href="${esc(d.editorUrl)}" target="_blank" rel="noopener" title="Abre el editor de tu tema en las plantillas de producto. Ahí: Crear plantilla → basada en banpage. Luego vuelve y dale Recargar lista."><i data-lucide="plus"></i> Crear plantilla</a>` : ""}
            </div>
            <input type="hidden" id="estPlantilla" value="${esc(plantillaPub || "")}">
            <p class="est-pl-elegida">Elegida: <b>${plantillaPub ? `product.${esc(plantillaPub)}` : "Predeterminada (product)"}</b>${plantillaPub && !lista.includes(plantillaPub) ? ` <span class="est-hint">(no está en el tema)</span>` : ""}</p>
            <div id="estPlantillaLista" class="est-pl-lista" hidden></div>
          </div>`}
      ${d && d.seccion === false ? `<div class="est-alert warn">Tu tema todavía no tiene la sección <b>CoDropX landing</b>: instálala una vez desde <a href="#" onclick="goTo('integraciones'); return false;">Integraciones → Shopify</a> y agrégala a esa plantilla. Sin ella, las imágenes quedan guardadas en el producto pero no se ven.</div>` : ""}
    ` : `<p class="est-hint">Las imágenes van una debajo de otra dentro de la descripción.</p>`}`;
}
// Buscador de plantillas: filtra mientras escribes; si queda una sola (o coincide exacto) la elige
function plantillasActuales() {
  const d = temaTiendas[tiendaElegida];
  return d && d !== "cargando" ? (d.plantillas || []) : [];
}
function elegirPlantillaUI(sfx) {
  plantillaPub = String(sfx || "");
  const h = $("estPlantilla"); if (h) h.value = plantillaPub;
  const e = document.querySelector(".est-pl-elegida b"); if (e) e.textContent = plantillaPub ? `product.${plantillaPub}` : "Predeterminada (product)";
}
window.estBuscarPlantilla = (txt, alEntrar) => {
  const q = String(txt || "").trim().toLowerCase().replace(/^product\.?/, "");
  const lista = plantillasActuales();
  const hay = q ? lista.filter(s => (s || "predeterminada").toLowerCase().includes(q)) : lista;
  const caja = $("estPlantillaLista");
  if (!caja) return;
  caja.hidden = false;
  caja.innerHTML = hay.length
    ? hay.slice(0, 50).map(s => `<button type="button" class="${s === plantillaPub ? "sel" : ""}" onmousedown="event.preventDefault(); estClicPlantilla('${esc(s)}')">${s ? `product.${esc(s)}` : "Predeterminada (product)"}</button>`).join("")
    : `<p class="est-hint">No hay ninguna plantilla con "${esc(q)}". Créala con el botón y dale ↻ Recargar lista.</p>`;
  if (!alEntrar && q) {
    const exacta = hay.find(s => s.toLowerCase() === q);
    if (exacta !== undefined) elegirPlantillaUI(exacta);
    else if (hay.length === 1) elegirPlantillaUI(hay[0]);
  }
};
window.estClicPlantilla = (s) => {
  elegirPlantillaUI(s);
  const i = $("estPlantillaBuscar"); if (i) i.value = s;
  const caja = $("estPlantillaLista"); if (caja) caja.hidden = true;
};
window.estPrimeraPlantilla = () => {
  const b = document.querySelector("#estPlantillaLista button");
  if (b) b.dispatchEvent(new MouseEvent("mousedown"));
};
document.addEventListener("click", (e) => {
  if (!e.target.closest?.(".est-pl-buscar")) { const c = $("estPlantillaLista"); if (c) c.hidden = true; }
});

window.estRecargarPlantillas = (id) => { delete temaTiendas[id]; plantillaPub = null; renderPaso(); };
window.estDestino = (v) => { destinoPub = v === "descripcion" ? "descripcion" : "tema"; try { localStorage.setItem("est_destino_pub", destinoPub); } catch {} renderPaso(); };
window.estPlantilla = (v) => { plantillaPub = String(v || ""); };
window.estPublicar = () => conCarga("estBtnPublicar", "Subiendo a Shopify...", async () => {
  const L = landingActual();
  if (L.faltan.length && !confirm(`${L.faltan.length} sección(es) no tienen imagen y no se van a publicar. ¿Seguir?`)) return;
  const avInicio = av;
  const cuerpo = { tiendaId: tiendaElegida, destino: destinoPub };
  if (destinoPub === "tema") cuerpo.plantilla = $("estPlantilla")?.value?.trim() ?? plantillaPub ?? "";
  const { publicacion, nuevo, rama, listo } = await api("POST", urlRama("publicar"), cuerpo);
  if (av === avInicio) ponerRama(rama);
  avisar((nuevo ? `Borrador creado en ${publicacion.tienda} ✓` : `Actualizado en ${publicacion.tienda} ✓`) + (listo ? " · Quedó en Mis testeos como LISTO para testear" : ""));
  if (tab === 6) renderPaso();
});

function pasoPublicar() {
  const L = landingActual();
  return `
  <div class="est-publicar">
    <div class="est-card est-pv-card">
      <div class="est-card-row">
        <h3>Vista previa en el celular ${avTag()}</h3>
        <span class="est-muted">${L.totalImagenes} imagen(es)</span>
      </div>
      ${vistaPrevia(L)}
    </div>
    <div class="est-publicar-lado">
      ${tarjetaPublicar(L)}
      ${pasoNotas()}
    </div>
  </div>`;
}

function pasoNotas() {
  const r = R();
  const n = r.notas;
  const bloque = (titulo, items, clase = "") => items?.length ? `
    <div class="est-card ${clase}">
      <h3>${titulo}</h3>
      <ul class="est-list">${items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    </div>` : "";

  return `
  <div class="est-card">
    <div class="est-card-row">
      <div>
        <h3>Notas antes de publicar ${avTag()}</h3>
        <p class="est-muted">Dudas, riesgos y datos por confirmar de la landing y los guiones de este avatar.</p>
      </div>
      <button id="estBtnNotas" class="est-btn primary" onclick="estGenerarNotas()"><i data-lucide="list-checks"></i> ${n ? "Actualizar notas" : "Generar notas"}</button>
    </div>
  </div>
  ${n ? `
    <div class="est-cols">
      ${bloque("⚠️ Riesgos", n.riesgos, "warn")}
      ${bloque("❓ Dudas", n.dudas)}
      ${bloque("📋 Por confirmar", n.por_confirmar)}
      ${bloque("🔍 Revisar en las imágenes de Gemini", n.revisar_en_imagenes)}
    </div>
  ` : ""}
  <div class="est-card">
    <label class="est-check big">
      <input type="checkbox" ${r.vendio ? "checked" : ""} onchange="estMarcarVendio(this.checked)">
      La landing del avatar ${esc(av)} vendió bien ✓ <span class="est-muted">(la usaremos como base para clonar en próximos productos)</span>
    </label>
  </div>
  ${otroAvatarPendiente()}
  `;
}

// Al terminar un avatar, invitar a hacer el otro
function otroAvatarPendiente() {
  const otro = (proyecto.avatares || []).find(a => a.id !== av);
  if (!otro) return "";
  const pasoOtro = proyecto.ramas?.[otro.id]?.paso;
  return `
  <div class="est-card est-otro">
    <div class="est-card-row">
      <div>
        <h3>Avatar ${esc(otro.id)}: ${esc(resumenAvatar(otro))}</h3>
        <p class="est-muted">${pasoOtro ? `Va en el paso ${pasoOtro}/6.` : "Todavía no lo has empezado."}</p>
      </div>
      <button class="est-btn primary" onclick="estTrabajarCon('${esc(otro.id)}')">${pasoOtro ? "Continuar" : "Empezar"} con el avatar ${esc(otro.id)} <i data-lucide="arrow-right"></i></button>
    </div>
  </div>`;
}

window.estGenerarNotas = () => conCarga("estBtnNotas", "Revisando todo...", async () => {
  const { rama } = await api("POST", urlRama("ia/notas"));
  ponerRama(rama);
  renderProyecto();
});

window.estMarcarVendio = (v) => guardarRama({ vendio: v });

// =============================================
// Desde la Base de Productos (botón "Ir")
// =============================================
window.irDesarrollo = async function(index) {
  const producto = state.productos[index];
  if (!producto) return;
  goTo("desarrollo");
  try {
    // El servidor abre el proyecto existente o crea uno, y pasa el producto a "Desarrollo"
    const p = await api("POST", "/api/proyectos", { productoId: producto._id });
    producto.estado = producto.estado === "lanzado" ? "lanzado" : "desarrollo";
    abrir(p._id, p.existente ? null : 1);
  } catch (err) {
    avisar(err.message, "error");
  }
};

// Ruta: desarrollo
registrarRuta("desarrollo", (view) => {
  marcarMenuActivo("desarrollo");
  renderLista(view);
});
