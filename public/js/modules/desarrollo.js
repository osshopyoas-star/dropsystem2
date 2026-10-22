// =============================================
// 🧪 Estudio de landing (Desarrollo por pasos)
// Ficha → Avatares → Estilo → Landing → Guiones → Notas
// Los prompts viven en el servidor (prompts-landing.js)
// =============================================
import { state } from "../state.js";
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";

const PASOS = [
  { n: 1, titulo: "Ficha", icono: "clipboard-list" },
  { n: 2, titulo: "Avatares", icono: "users" },
  { n: 3, titulo: "Estilo", icono: "palette" },
  { n: 4, titulo: "Landing", icono: "images" },
  { n: 5, titulo: "Guiones", icono: "clapperboard" },
  { n: 6, titulo: "Notas", icono: "list-checks" }
];

const TIPOS_SECCION = {
  oferta: "Oferta (hero)", dolor: "Dolor o identificación", identificacion: "¿Es para ti?",
  funcion_estrella: "La función estrella", detalles: "Detalles y calidad", que_incluye: "¿Qué incluye?",
  tamano_variantes: "Tamaño, colores o variantes", como_se_usa: "Cómo se usa", para_quien: "Para quién es",
  antes_despues: "Antes y después", paquetes: "Paquetes", como_funciona: "Cómo funciona tu pedido",
  por_que_aqui: "¿Por qué comprar aquí?", resenas: "Reseñas reales (plantilla)", preguntas: "Preguntas frecuentes",
  confianza: "Confianza y aliados", oferta_cierre: "Oferta de cierre"
};

const PAIS_NOMBRE = { CO: "Colombia", EC: "Ecuador" };

let proyecto = null;   // proyecto abierto
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
  if (!productoId && !nombre) throw new Error("Elige un producto o escribe el nombre");
  const p = await api("POST", "/api/proyectos", productoId ? { productoId, pais } : { nombre, pais });
  if (p.existente) avisar("Ese producto ya tenía proyecto: lo abrimos", "ok");
  await abrir(p._id, p.existente ? null : 1);
});

window.estAbrirProyecto = (id) => abrir(id);
window.estAbrirProyectoEn = (id, paso) => abrir(id, paso);

window.estVolverLista = () => renderLista($("view"));

async function abrir(id, pasoInicial = null) {
  try {
    proyecto = await api("GET", `/api/proyectos/${id}`);
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
  const render = { 1: pasoFicha, 2: pasoAvatares, 3: pasoEstilo, 4: pasoLanding, 5: pasoGuiones, 6: pasoNotas }[tab];
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
            <li><b>Foto:</b> ${esc(e.tipo_foto)}</li>
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
window.estCopiarBloque = () => copiar($("estBloque")?.value || R().bloqueEstilo || "");

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

  return `
  <div class="est-card">
    <div class="est-card-row">
      <div>
        <h3>Landing ${avTag()}</h3>
        <p class="est-muted">En Gemini: chat nuevo por imagen → adjunta la foto real → pega "estilo + prompt". ${secs.length ? `${conPrompt}/${secs.length} prompts · ${hechas} imágenes hechas` : ""}</p>
      </div>
      <div class="est-actions">
        <button id="estBtnSecciones" class="est-btn" onclick="estProponerSecciones()"><i data-lucide="layout-list"></i> ${secs.length ? "Volver a proponer" : "Proponer secciones"}</button>
        ${secs.length ? `<button id="estBtnTodos" class="est-btn primary" onclick="estGenerarTodos()" ${generandoTodo ? "disabled" : ""}><i data-lucide="sparkles"></i> Generar prompts faltantes</button>` : ""}
      </div>
    </div>
  </div>

  <div class="est-secciones">
    ${secs.map((x, i) => tarjetaSeccion(x, i, i + 1)).join("")}
  </div>

  ${secs.length ? `
    <div class="est-card est-add">
      <select id="estNuevaTipo">${Object.entries(TIPOS_SECCION).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
      <button class="est-btn" onclick="estAgregarSeccion()"><i data-lucide="plus"></i> Agregar sección</button>
    </div>
    ${siguiente(5, "Seguir con los guiones")}
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
          ${x.composicion ? `<span class="est-chip">${esc(x.composicion)}</span>` : ""}
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
  copiar(`${r.bloqueEstilo}\n\n${r.secciones[i].prompt}`);
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

window.estAgregarSeccion = async () => {
  const tipo = $("estNuevaTipo")?.value;
  const nueva = { id: Math.random().toString(36).slice(2, 10), tipo, titulo: TIPOS_SECCION[tipo], grupo: av, formato: "9:16", composicion: "", proposito: "", prompt: "", hecha: false };
  await cambiarSecciones(secs => [...secs, nueva]);
  renderPaso();
};

// =============================================
// PASO 5: GUIONES (3 del avatar elegido)
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
