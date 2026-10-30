// =============================================
// 🧪 MIS TESTEOS — cómo le fue a cada producto que lanzaste
// Resultado (listo, testeando, winner, perdedor, inconcluso), fecha, avatar y nota.
// Usa los productos de la Base (Colombia y Ecuador juntos).
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { formatear } from "../core/costeo.js";
import { claveDeProducto, metricasProducto, decidirTesteo, ACCIONES_TESTEO } from "../core/finanzas.js";
import { ENFOQUES_COPY } from "../core/anuncios.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");
const iconos = () => { if (window.lucide) lucide.createIcons(); };

const RESULTADOS = {
  listo: { nombre: "Listo para testear", corto: "LISTO", desc: "landing y anuncios listos" },
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
let fin = {};   // { CO: { lineas, pauta, config, metaPend }, EC: {...} } de Finanzas
const meta = { cargando: false, hecho: false, error: "" };
const filtro = { resultado: "todos", pais: "", buscar: "" };
const kits = new Map();      // proyectoId → kit para montar la campaña (links de Shopify, copys, creativos) | "cargando" | { error }
let copias = [];             // textos de los botones "Copiar"

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

    ${listosParaMontar()}

    ${resumenDecisiones()}

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
    ${mejoresAnuncios()}
    ${bibliotecaGanadores()}
    <p class="ts-nota">Los números salen de <b>Finanzas</b>: pedidos de tus Excel de Dropi (por el ID de Dropi del producto) y la pauta de Meta que confirmaste en el Control Diario, desde la fecha de inicio del testeo. <b>ESCALAR</b>: 3+ entregas y cada una te cuesta 70% o menos de tu CPA máximo. <b>APAGAR</b>: gastó 1 CPA máximo sin ventas, o 2 y va perdiendo. <b>AGUANTAR</b>: lo demás, con cuánto más gastar. Nada cambia solo: tú marcas el resultado.</p>
  </div>`;
  iconos();
}

// ---------- LISTOS PARA MONTAR: lo que se terminó en Desarrollo, con todo lo que se necesita para la campaña ----------
const fechaCorta = (d) => d ? new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "";
const copiar = (texto, etiqueta = "Copiar") => {
  if (!String(texto || "").trim()) return "";
  copias.push(String(texto));
  return `<button class="ts-copiar" onclick="tsCopiar(${copias.length - 1}, this)"><i data-lucide="copy"></i> ${etiqueta}</button>`;
};
function listosParaMontar() {
  copias = [];
  const listos = productos.filter(p => p.resultado === "listo" && (!filtro.pais || (p.pais || "CO") === filtro.pais))
    .sort((a, b) => new Date(b.testeo?.listo || 0) - new Date(a.testeo?.listo || 0));
  if (!listos.length) return "";
  return `
  <section class="ts-listos">
    <div class="ts-listos-head">
      <h2><i data-lucide="rocket"></i> Listos para montar <span>${listos.length}</span></h2>
      <small>Terminados en Desarrollo. Aquí está todo para la campaña: país, tienda, links de Shopify de cada avatar, creativos y copys. Al montarla, dale <b>Ya monté la campaña</b>.</small>
    </div>
    ${listos.map(tarjetaListo).join("")}
  </section>`;
}
function tarjetaListo(p) {
  const pr = proyectos.get(String(p._id));
  let kit = pr ? kits.get(String(pr._id)) : null;
  if (pr && !kit) {
    kits.set(String(pr._id), "cargando");
    api("GET", `/api/proyectos/${pr._id}/kit`)
      .then(k => { kits.set(String(pr._id), k); const y = window.scrollY; render(); window.scrollTo(0, y); })
      .catch(e => { kits.set(String(pr._id), { error: e.message }); render(); });
    kit = "cargando";
  }
  const pais = p.pais || "CO";
  const cuerpo = !pr ? `<p class="ts-kit-nota">No tiene proyecto en Desarrollo.</p>`
    : kit === "cargando" ? `<p class="ts-kit-nota">Cargando links y copys…</p>`
    : kit?.error ? `<p class="ts-kit-nota rojo">${esc(kit.error)}</p>`
    : `<div class="ts-kit-avs">${(kit.avatares || []).map(a => avatarKit(a, pais, pr._id)).join("") || `<p class="ts-kit-nota">Sin avatares trabajados.</p>`}</div>`;
  return `
  <article class="ts-listo">
    <div class="ts-listo-top">
      <div>
        <strong>${esc(p.nombre)}</strong>
        <small>${PAISES[pais] || esc(pais)} · ${pais === "EC" ? "Ecuador (USD)" : "Colombia (COP)"}${p.testeo?.listo ? ` · Terminado el <b>${esc(fechaCorta(p.testeo.listo))}</b>` : ""}${kit?.precio ? ` · Precio ${formatear(kit.precio, pais)}` : ""}${kit?.formato ? ` · ${kit.formato === "normal" ? "Landing normal" : "Ban page"}${kit.tipo === "moda" ? " (moda)" : ""}` : ""}</small>
      </div>
      <div class="ts-listo-acc">
        ${pr ? `<button class="ts-btn claro chico" onclick="bpAbrirProyecto('${esc(pr._id)}')"><i data-lucide="folder-open"></i> Abrir en Desarrollo</button>` : ""}
        <button class="ts-btn chico" onclick="tsGuardar('${esc(p._id)}', { resultado: 'testeando' })"><i data-lucide="play"></i> Ya monté la campaña</button>
      </div>
    </div>
    ${cuerpo}
  </article>`;
}
function avatarKit(a, pais, proyectoId) {
  const pubs = a.publicaciones || [];
  const links = pubs.length ? pubs.map(x => {
    const tienda = x.dominio && x.handle ? `https://${x.dominio}/products/${x.handle}` : "";
    return `<div class="ts-kit-pub">
      <span><b>${esc(x.tienda)}</b> · ${x.estado === "ACTIVE" ? "Activo" : "Borrador"} · ${x.imagenes} imágenes en la landing</span>
      <span class="ts-kit-links">
        ${tienda ? `<a href="${esc(tienda)}" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i> Ver landing</a>${copiar(tienda, "Copiar link")}` : ""}
        ${x.adminUrl ? `<a href="${esc(x.adminUrl)}" target="_blank" rel="noopener noreferrer"><i data-lucide="store"></i> Shopify</a>` : ""}
      </span>
    </div>`;
  }).join("") : `<p class="ts-kit-nota rojo">No está publicado en Shopify.</p>`;
  const copys = (a.copys || []).map((c, i) => `
    <div class="ts-copy">
      <div class="ts-copy-top"><b>Copy ${i + 1}</b> <small>${esc(ENFOQUES_COPY[c.enfoque] || c.enfoque)}</small></div>
      <p>${esc(c.texto_principal).replace(/\n/g, "<br>")}</p>
      ${c.titulo ? `<small>Título: <b>${esc(c.titulo)}</b></small>` : ""}${c.descripcion ? `<small>Descripción: ${esc(c.descripcion)}</small>` : ""}
      <div class="ts-copy-btns">${copiar(c.texto_principal, "Copiar texto")}${copiar(c.titulo, "Copiar título")}${copiar(c.descripcion, "Copiar descripción")}</div>
    </div>`).join("");
  return `
  <div class="ts-kit-av">
    <div class="ts-kit-av-top"><span class="ts-av">Avatar ${esc(a.id)}</span>${a.quien ? `<small>${esc(a.quien)}</small>` : ""}</div>
    ${links}
    <p class="ts-kit-crea"><i data-lucide="image"></i> ${a.ads} creativo${a.ads === 1 ? "" : "s"} estático${a.ads === 1 ? "" : "s"}${a.adsHechos ? ` (${a.adsHechos} hechos)` : ""} · ${a.guiones} guion${a.guiones === 1 ? "" : "es"} de video</p>
    ${copys ? `<details class="ts-kit-copys" ${copysAbiertos.has(`${proyectoId}|${a.id}`) ? "open" : ""} ontoggle="tsCopysAbiertos('${esc(proyectoId)}', '${esc(a.id)}', this.open)"><summary>Copys para Meta (${a.copys.length})${a.tiktok ? " y TikTok" : ""}</summary>${copys}${tiktokKit(a)}</details>` : `<p class="ts-kit-nota rojo">Sin copys de Meta.</p>`}
    <div class="ts-copy-btns"><button class="ts-btn claro chico" id="tsCopys-${esc(proyectoId)}-${esc(a.id)}" onclick="tsEscribirCopys('${esc(proyectoId)}', '${esc(a.id)}', ${copys ? "true" : "false"})"><i data-lucide="sparkles"></i> ${copys ? "Escribir otros copys" : "Escribir copys"}</button></div>
  </div>`;
}
// TikTok del kit: texto del anuncio, caption de Spark Ads y ganchos
function tiktokKit(a) {
  const x = a.tiktokExtra || {};
  if (!a.tiktok && !x.caption) return "";
  return `
    <div class="ts-copy">
      <div class="ts-copy-top"><b>TikTok</b></div>
      ${a.tiktok ? `<small>Texto del anuncio:</small><p>${esc(a.tiktok)}</p>` : ""}
      ${x.caption ? `<small>Caption para Spark Ads:</small><p>${esc(x.caption)}</p>` : ""}
      ${(x.ganchos || []).length ? `<small>Ganchos para los primeros 3 segundos:</small><p>${x.ganchos.map((g, i) => `${i + 1}. ${esc(g)}`).join("<br>")}</p>` : ""}
      <div class="ts-copy-btns">${copiar(a.tiktok, "Copiar texto")}${copiar(x.caption, "Copiar caption")}${copiar((x.ganchos || []).join("\n"), "Copiar ganchos")}</div>
    </div>`;
}
const copysAbiertos = new Set();
window.tsCopysAbiertos = (id, av, abierto) => { const k = `${id}|${av}`; if (abierto) copysAbiertos.add(k); else copysAbiertos.delete(k); };
// Escribe copys nuevos para un avatar (las mismas opciones con que se hicieron) sin ir a Desarrollo
window.tsEscribirCopys = async (proyectoId, av, reemplaza) => {
  if (reemplaza && !confirm(`¿Escribir copys nuevos para el avatar ${av}? Los de ahora se reemplazan.`)) return;
  const b = document.getElementById(`tsCopys-${proyectoId}-${av}`);
  if (b?.disabled) return;
  if (b) { b.disabled = true; b.innerHTML = `<span class="est-spin"></span> Analizando y escribiendo...`; }
  try {
    const kit = kits.get(String(proyectoId));
    const op = (kit?.avatares || []).find(x => x.id === av)?.copysOpciones || { contraEntrega: true };
    await api("POST", `/api/proyectos/${proyectoId}/rama/${encodeURIComponent(av)}/ia/copys`, { contraEntrega: op.contraEntrega !== false, envio: !!op.envio, precio: !!op.precio });
    copysAbiertos.add(`${proyectoId}|${av}`);
    const nuevo = await api("GET", `/api/proyectos/${proyectoId}/kit`);
    kits.set(String(proyectoId), nuevo);
    const y = window.scrollY; render(); window.scrollTo(0, y);
    avisar(`Copys nuevos para el avatar ${av} ✓`);
  } catch (err) {
    avisar(err.message, "error");
    if (b && document.body.contains(b)) { b.disabled = false; b.innerHTML = `<i data-lucide="sparkles"></i> Escribir otros copys`; if (window.lucide) lucide.createIcons(); }
  }
};

window.tsCopiar = async (i, btn) => {
  try { await navigator.clipboard.writeText(copias[i] || ""); }
  catch { const t = document.createElement("textarea"); t.value = copias[i] || ""; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
  if (btn) { const o = btn.innerHTML; btn.textContent = "Copiado ✓"; setTimeout(() => { btn.innerHTML = o; iconos(); }, 1200); }
};

function resumenDecisiones() {
  const activos = enTesteo().filter(p => p.resultado === "testeando" || p.resultado === "winner");
  if (!activos.length) return "";
  const ds = activos.map(p => ({ p, d: numerosTesteo(p, fin, costeos.get(String(p._id))).d }));
  const n = (a) => ds.filter(x => x.d.accion === a).length;
  const conMeta = Object.values(fin).some(f => (f.config?.metaCuentas || []).length);
  return `
  <section class="ts-decisiones">
    <div><b>Decisión de hoy</b><small>${activos.length} producto${activos.length === 1 ? "" : "s"} en pauta · CPA real contra tu CPA máximo</small></div>
    <span class="ts-dchip escalar"><b>${n("escalar")}</b> escalar</span>
    <span class="ts-dchip aguantar"><b>${n("aguantar")}</b> aguantar</span>
    <span class="ts-dchip apagar"><b>${n("apagar")}</b> apagar</span>
    ${n("falta") ? `<span class="ts-dchip falta"><b>${n("falta")}</b> faltan datos</span>` : ""}
    <span class="ts-espacio"></span>
    ${conMeta ? `<button class="ts-btn claro" onclick="tsMeta()" ${meta.cargando ? "disabled" : ""}><span class="ts-meta-logo">∞</span> ${meta.cargando ? "Trayendo Meta…" : "Actualizar con Meta"}</button>` : `<small>Elige tus cuentas publicitarias en el Control Diario para traer Meta solo.</small>`}
    ${meta.error ? `<small class="rojo">${esc(meta.error)}</small>` : ""}
  </section>`;
}

// Números del testeo desde Finanzas + la decisión (ESCALAR · AGUANTAR · APAGAR)
const hoyISO = () => new Date(Date.now() - 5 * 36e5).toISOString().slice(0, 10);
const restarDias = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };

// CPA máximo del costeo, sumando lo que dejan los complementos (si los guardaste en la Calculadora)
export function cpaMaximoCosteo(costeo) {
  const r = costeo?.resumen || {};
  if (!(Number(r.bep) > 0)) return null;
  const extra = Number(r.gananciaCliente) > 0 && Number.isFinite(Number(r.utilidad)) ? Math.max(0, Number(r.gananciaCliente) - Number(r.utilidad)) : 0;
  return Number(r.bep) + extra;
}

export function numerosTesteo(p, finanzas = fin, costeo = null) {
  const pais = p.pais || "CO";
  const f = finanzas[pais];
  const fmt = (v) => formatear(v, pais);
  if (!f || !f.lineas?.length) {
    const d = { accion: "falta", resultado: null, nombre: ACCIONES_TESTEO.falta.nombre, motivo: "Sube el Excel de Dropi en Finanzas para ver los números.", pasos: [] };
    return { m: null, d, sug: d };
  }
  const grupos = f.config?.grupos || [];
  const clave = claveDeProducto(p, f.lineas, grupos);
  const desde = p.testeo?.inicio ? new Date(p.testeo.inicio).toISOString().slice(0, 10) : null;
  const hasta = p.testeo?.fin ? new Date(p.testeo.fin).toISOString().slice(0, 10) : null;
  const args = { clave, pauta: f.pauta, grupos, devPct: f.config?.devPct ?? 25 };
  const m = clave ? metricasProducto(f.lineas, { ...args, desde, hasta }) : null;
  const fin3 = hasta || hoyISO();
  const ini3 = [restarDias(fin3, 2), desde].filter(Boolean).sort().pop();
  const m3 = clave ? metricasProducto(f.lineas, { ...args, desde: ini3, hasta: fin3 }) : null;
  const d = decidirTesteo(m && (m.pedidos || m.gasto) ? m : null, { cpaMaximoRef: cpaMaximoCosteo(costeo), ultimos: m3, fmt });
  const pendiente = clave ? Object.entries(f.metaPend?.[clave] || {}).filter(([fe]) => (!desde || fe >= desde) && (!hasta || fe <= hasta)).reduce((a, [, g]) => a + g, 0) : 0;
  return { m, m3, d, sug: d, clave, pendiente };
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
      ${decision(p, c)}
    </div>
    <div class="ts-fecha">
      <input type="date" value="${fechaInput(p.testeo?.inicio)}" onchange="tsGuardar('${esc(p._id)}', { inicio: this.value })">
      <small>${diasDe(p)}</small>
    </div>
    ${celdaNumeros(p, c)}
    <div class="ts-acciones">
      <button class="ts-icono" title="Nota de lo que aprendiste" onclick="tsNota('${esc(p._id)}')"><i data-lucide="sticky-note"></i></button>
      ${pr && r !== "listo" ? `<button class="ts-icono" title="Avatar A vs B: qué landing va ganando en Meta" onclick="tsAvatares('${esc(pr._id)}', '${esc(p._id)}')"><i data-lucide="split"></i></button>` : ""}
      ${pr ? `<button class="ts-icono" title="Abrir su proyecto en Desarrollo" onclick="bpAbrirProyecto('${esc(pr._id)}')"><i data-lucide="folder-open"></i></button>` : ""}
      <button class="ts-icono peligro" title="Quitar de Mis testeos" onclick="tsQuitar('${esc(p._id)}')"><i data-lucide="x"></i></button>
    </div>
  </div>`;
}

function celdaNumeros(p, c) {
  if (p.resultado === "listo") return `<div class="ts-precio"><small>Aún sin pauta</small><button class="ts-btn chico" onclick="tsGuardar('${esc(p._id)}', { resultado: 'testeando' })">Empezar testeo hoy</button></div>`;
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

function decision(p, c) {
  if (p.resultado === "listo") return "";
  const { d, pendiente } = numerosTesteo(p, fin, c);
  const pais = p.pais || "CO";
  const aplicar = d.resultado && d.resultado !== p.resultado && ["testeando", "winner", "perdedor"].includes(p.resultado)
    ? `<button onclick="tsGuardar('${esc(p._id)}', { resultado: '${d.resultado}' })">Marcar ${RESULTADOS[d.resultado].corto}</button>` : "";
  return `<div class="ts-dec ${d.accion}">
    <div class="ts-dec-top"><b>${d.nombre}</b>${aplicar}</div>
    <small>${esc(d.motivo)}</small>
    ${d.entregaMala ? `<small class="ts-dec-alerta">⚠ Se está entregando poco: revisa confirmación, transportadora y ciudades en Logística.</small>` : ""}
    ${d.pasos?.length ? `<details><summary>Qué hacer</summary><ul>${d.pasos.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>` : ""}
    ${pendiente > 0 ? `<button class="ts-dec-meta" onclick="goTo('control-diario')">+${formatear(pendiente, pais)} de Meta sin confirmar → revisa en Control Diario</button>` : ""}
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
      fin[pa] = { lineas, config, pauta: Object.fromEntries(pauta.map(x => [`${x.fecha}|${x.clave}`, x])), metaPend: {} };
    } catch { /* sin finanzas: la lista funciona igual */ }
  }));
}

// Trae de Meta el gasto de las campañas ya confirmadas (lo escribe en la pauta) y suma lo sugerido sin confirmar
async function sincronizarMeta() {
  const paises = Object.keys(fin).filter(pa => (fin[pa].config?.metaCuentas || []).length);
  if (!paises.length) { meta.hecho = true; return; }
  meta.cargando = true; meta.error = "";
  render();
  const hoy = hoyISO();
  await Promise.all(paises.map(async (pa) => {
    const inicios = enTesteo().filter(p => (p.pais || "CO") === pa && p.testeo?.inicio).map(p => new Date(p.testeo.inicio).toISOString().slice(0, 10));
    const desde = [restarDias(hoy, 30), ...inicios].sort()[0];
    try {
      const r = await api("POST", "/api/finanzas/meta/sincronizar", { pais: pa, desde, hasta: hoy });
      if (r.sinCuentas) return;
      const f = fin[pa];
      for (const k of Object.keys(f.pauta)) { const fe = k.slice(0, 10); if (fe >= r.desde && fe <= r.hasta) delete f.pauta[k]; }
      for (const x of r.pauta || []) f.pauta[`${x.fecha}|${x.clave}`] = x;
      // Gasto sugerido (aún no confirmado) por producto y día
      const pend = {};
      for (const c of r.campanas || []) {
        if (c.origen !== "auto" || !c.clave) continue;
        const dias = (pend[c.clave] ||= {});
        for (const [fe, g] of Object.entries(c.dias || {})) dias[fe] = (dias[fe] || 0) + g;
      }
      f.metaPend = pend;
    } catch (err) { meta.error = err.message; }
  }));
  meta.cargando = false; meta.hecho = true;
  const y = window.scrollY; render(); window.scrollTo(0, y);
}
window.tsMeta = () => { meta.hecho = false; sincronizarMeta(); };

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
    if (cambios.resultado !== undefined || cambios.nota !== undefined || cambios.avatar !== undefined) ganadores = null;   // la biblioteca se vuelve a leer
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

// ---------- Avatar A vs B: qué landing va ganando en Meta ----------
function modalTs(html) {
  document.querySelector(".ts-modal")?.remove();
  const m = document.createElement("div");
  m.className = "modal-overlay fz-modal ts-modal";
  m.innerHTML = `<div class="modal-box fz-modal-box">${html}</div>`;
  m.addEventListener("click", (e) => { if (e.target === m) m.remove(); });
  document.body.appendChild(m);
  iconos();
  return m;
}
window.tsCerrarModal = () => document.querySelector(".ts-modal")?.remove();
window.tsAvatares = async (proyectoId, productoId, forzar = false) => {
  const p = productos.find(x => x._id === productoId);
  const pais = p?.pais || "CO";
  const desde = p?.testeo?.inicio ? new Date(p.testeo.inicio).toISOString().slice(0, 10) : "";
  const m = modalTs(`<h3><i data-lucide="split"></i> Avatar A vs B · ${esc(p?.nombre || "")}</h3><p class="est-muted">Leyendo tus anuncios de Meta…</p>`);
  try {
    const r = await api("GET", `/api/proyectos/${proyectoId}/meta-avatares?desde=${desde}${forzar ? "&forzar=1" : ""}`);
    if (!document.body.contains(m)) return;
    const f = (v) => (v === null || v === undefined ? "—" : formatear(v, pais));
    const pct = (v) => (v === null ? "—" : `${v.toFixed(2)}%`);
    const g = r.veredicto?.ganador;
    m.querySelector(".fz-modal-box").innerHTML = `
      <h3><i data-lucide="split"></i> Avatar A vs B · ${esc(p?.nombre || "")}</h3>
      <p class="fz-mini">Anuncios de Meta del ${esc(r.desde)} al ${esc(r.hasta)}, repartidos por la landing a la que llevan. Las <b>compras</b> son las que reporta el píxel de Meta (no las entregas de Dropi).</p>
      <div class="ts-ab-veredicto ${r.veredicto?.tipo || ""}"><i data-lucide="${g ? "trophy" : "info"}"></i> ${esc(r.veredicto?.texto || "")}</div>
      ${(r.filas || []).length ? `
      <div class="fz-scroll"><table class="fz-tabla ts-ab">
        <thead><tr><th></th>${r.filas.map(x => `<th class="n ${g === x.id ? "gana" : ""}">Avatar ${esc(x.id)}${g === x.id ? " 🏆" : ""}</th>`).join("")}</tr></thead>
        <tbody>
          ${[["Gasto", x => f(x.gasto)], ["Impresiones", x => x.impresiones.toLocaleString("es-CO")], ["Clics al link", x => x.clics.toLocaleString("es-CO")], ["CTR (clics ÷ impresiones)", x => pct(x.ctr)], ["Costo por clic", x => f(x.cpc)], ["Compras (píxel)", x => x.compras], ["Costo por compra", x => f(x.cpa)], ["Anuncios", x => x.anuncios.length]]
            .map(([t, fn]) => `<tr><td>${t}</td>${r.filas.map(x => `<td class="n ${g === x.id ? "gana" : ""}">${fn(x)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table></div>
      ${r.filas.map(x => x.anuncios.length ? `<details class="ts-ab-ads"><summary>Anuncios del avatar ${esc(x.id)} (${x.anuncios.length})</summary><ul>${x.anuncios.slice(0, 15).map(a => `<li><span>${esc(a.anuncio || "Anuncio")}<small>${esc(a.campana || "")}</small></span><b>${f(a.gasto)}</b><small>${a.clics} clics · ${a.compras} compras</small></li>`).join("")}</ul></details>` : "").join("")}` : ""}
      ${r.errores?.length ? `<p class="fz-mini rojo">No se pudo leer: ${r.errores.map(esc).join(", ")}</p>` : ""}
      <p class="fz-mini">Para que un anuncio cuente, tiene que llevar al link de la landing de ese avatar (el que publicaste desde Desarrollo).</p>
      <div class="fz-modal-pie"><button class="ts-btn claro" onclick="tsAvatares('${esc(proyectoId)}', '${esc(productoId)}', true)"><i data-lucide="refresh-cw"></i> Actualizar</button><button class="ts-btn" onclick="tsCerrarModal()">Cerrar</button></div>`;
    iconos();
  } catch (err) {
    if (!document.body.contains(m)) return;
    m.querySelector(".fz-modal-box").innerHTML = `<h3>Avatar A vs B</h3><p class="rojo">${esc(err.message)}</p><div class="fz-modal-pie"><button class="ts-btn" onclick="tsCerrarModal()">Cerrar</button></div>`;
  }
};

// ---------- Tus mejores anuncios de Meta (todos los productos) y los que gastan sin vender ----------
const mejores = { pais: "CO", dias: 30, datos: null, cargando: false, error: "" };
function mejoresAnuncios() {
  const d = mejores.datos, pais = mejores.pais;
  const f = (v) => (v === null || v === undefined ? "—" : formatear(v, pais));
  const pct = (v) => (v === null ? "—" : `${v.toFixed(2)}%`);
  const tarjeta = (a, i) => `
    <article class="ts-ad">
      ${a.miniatura ? `<img src="${esc(a.miniatura)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<div class="ts-ad-sin"><i data-lucide="image"></i></div>`}
      <div class="ts-ad-info">
        <div class="ts-ad-top"><b>#${i + 1} ${esc(a.producto || a.campana || "Anuncio")}</b>${a.avatar ? `<span class="ts-av">Avatar ${esc(a.avatar)}</span>` : ""}</div>
        <small>${esc(a.anuncio || "")}${a.campana && a.producto ? ` · ${esc(a.campana)}` : ""}</small>
        <div class="ts-ad-num"><span>Compra a <b class="verde">${f(a.cpa)}</b></span><span>${a.compras} compras</span><span>gasto ${f(a.gasto)}</span><span>CTR ${pct(a.ctr)}</span></div>
        ${a.texto ? `<details><summary>Ver el copy</summary><p>${esc(a.texto).replace(/\n/g, "<br>")}</p>${a.titulo ? `<small>Título: <b>${esc(a.titulo)}</b></small>` : ""}</details>` : ""}
        <div class="ts-copy-btns">${copiar(a.texto, "Copiar copy")}${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i> Ver landing</a>` : ""}</div>
      </div>
    </article>`;
  return `
  <section class="ts-listos ts-mejores">
    <div class="ts-listos-head">
      <h2><i data-lucide="flame"></i> Tus mejores anuncios en Meta</h2>
      <small>De todos tus productos, ordenados por lo que te cuesta cada compra (las que reporta el píxel de Meta, con 2 o más compras). Abajo, los que más gastan sin vender nada.</small>
    </div>
    <div class="ts-mejores-filtros">
      <select onchange="tsMejores({ pais: this.value })">${["CO", "EC"].map(x => `<option value="${x}" ${pais === x ? "selected" : ""}>${x === "CO" ? "🇨🇴 Colombia" : "🇪🇨 Ecuador"}</option>`).join("")}</select>
      ${[7, 30, 90].map(n => `<button class="ts-chip ${mejores.dias === n ? "activo" : ""}" onclick="tsMejores({ dias: ${n} })">${n} días</button>`).join("")}
      <button class="ts-btn chico" onclick="tsMejores({ forzar: true })" ${mejores.cargando ? "disabled" : ""}><i data-lucide="${d ? "refresh-cw" : "search"}"></i> ${mejores.cargando ? "Leyendo Meta…" : d ? "Actualizar" : "Ver mis mejores anuncios"}</button>
    </div>
    ${mejores.error ? `<p class="ts-kit-nota rojo">${esc(mejores.error)}</p>` : ""}
    ${!d ? "" : d.sinCuentas ? `<p class="ts-kit-nota">Elige tus cuentas publicitarias de ${pais === "EC" ? "Ecuador" : "Colombia"} en Finanzas → Control Diario.</p>` : `
      <p class="ts-kit-nota">${d.total.anuncios} anuncios con gasto del ${esc(d.desde)} al ${esc(d.hasta)} · gasto ${f(d.total.gasto)} · ${d.total.compras} compras${d.errores?.length ? ` · <span class="rojo">no se pudo leer: ${d.errores.map(esc).join(", ")}</span>` : ""}</p>
      ${d.mejores.length ? `<div class="ts-ads">${d.mejores.map(tarjeta).join("")}</div>` : `<p class="ts-kit-nota">Ningún anuncio tiene 2 o más compras en este periodo.</p>`}
      ${d.sinVender.length ? `
      <h3 class="ts-mejores-sub"><i data-lucide="power"></i> Gastan sin vender: revisa si los apagas</h3>
      <div class="fz-scroll"><table class="fz-tabla">
        <thead><tr><th>Anuncio</th><th>Producto</th><th class="n">Gasto</th><th class="n">Clics</th><th class="n">CTR</th></tr></thead>
        <tbody>${d.sinVender.map(a => `<tr><td>${esc(a.anuncio || "Anuncio")}<small class="gris"> · ${esc(a.campana || "")}</small></td><td>${esc(a.producto || "—")}${a.avatar ? ` (${esc(a.avatar)})` : ""}</td><td class="n rojo">${f(a.gasto)}</td><td class="n">${a.clics}</td><td class="n">${pct(a.ctr)}</td></tr>`).join("")}</tbody>
      </table></div>` : ""}`}
  </section>`;
}
window.tsMejores = async ({ pais, dias, forzar } = {}) => {
  if (pais) mejores.pais = pais === "EC" ? "EC" : "CO";
  if (dias) mejores.dias = dias;
  mejores.cargando = true; mejores.error = "";
  const y = window.scrollY; render(); window.scrollTo(0, y);
  try {
    mejores.datos = await api("GET", `/api/meta/mejores-anuncios?pais=${mejores.pais}&dias=${mejores.dias}${forzar ? "&forzar=1" : ""}`);
  } catch (err) { mejores.error = err.message; mejores.datos = null; }
  mejores.cargando = false;
  const y2 = window.scrollY; render(); window.scrollTo(0, y2);
};

// ---------- Biblioteca de ganadores: lo que vendió, para repetirlo ----------
let ganadores = null;   // null = sin cargar · "cargando" · lista · { error }
function bibliotecaGanadores() {
  const hay = productos.some(p => p.resultado === "winner");
  if (!hay) return "";
  if (ganadores === null) {
    ganadores = "cargando";
    api("GET", "/api/proyectos-ganadores").then(l => { ganadores = l; const y = window.scrollY; render(); window.scrollTo(0, y); })
      .catch(e => { ganadores = { error: e.message }; render(); });
  }
  const lista = Array.isArray(ganadores) ? ganadores.filter(g => !filtro.pais || g.producto.pais === filtro.pais) : [];
  return `
  <section class="ts-listos ts-ganadores">
    <div class="ts-listos-head">
      <h2><i data-lucide="trophy"></i> Biblioteca de ganadores <span>${Array.isArray(ganadores) ? lista.length : "…"}</span></h2>
      <small>Lo que vendió: el avatar, el ángulo, los copys y lo que aprendiste. Úsalo para el próximo producto. Cuando escribes copys nuevos en Desarrollo, la IA mira estos como referencia de tono y estructura.</small>
    </div>
    ${ganadores === "cargando" ? `<p class="ts-kit-nota">Cargando ganadores…</p>` : ganadores?.error ? `<p class="ts-kit-nota rojo">${esc(ganadores.error)}</p>`
      : lista.map(g => `
      <details class="ts-ganador">
        <summary><strong>${esc(g.producto.nombre)}</strong><small>${PAISES[g.producto.pais] || esc(g.producto.pais)}${g.producto.inicio ? ` · testeado desde ${esc(fechaCorta(g.producto.inicio))}` : ""}${g.producto.avatar ? ` · ganó con avatar ${esc(g.producto.avatar)}` : ""}</small></summary>
        ${g.producto.nota ? `<p class="ts-ganador-nota">📝 ${esc(g.producto.nota)}</p>` : `<p class="ts-kit-nota">Sin nota. Anota qué aprendiste con el botón 📝 en la lista de testeos.</p>`}
        ${g.kit ? `<div class="ts-kit-avs">${(g.kit.avatares || []).map(a => `
          <div class="ts-kit-av">
            <div class="ts-kit-av-top"><span class="ts-av">Avatar ${esc(a.id)}</span>${a.quien ? `<small>${esc(a.quien)}</small>` : ""}</div>
            ${a.angulo ? `<p class="ts-kit-crea"><b>Ángulo:</b> ${esc(a.angulo)}</p>` : ""}
            ${(a.copys || []).map((c, i) => `
              <div class="ts-copy"><div class="ts-copy-top"><b>Copy ${i + 1}</b> <small>${esc(ENFOQUES_COPY[c.enfoque] || c.enfoque)}</small></div>
                <p>${esc(c.texto_principal).replace(/\n/g, "<br>")}</p>
                <div class="ts-copy-btns">${copiar(c.texto_principal, "Copiar texto")}${copiar(c.titulo, "Copiar título")}</div></div>`).join("") || `<p class="ts-kit-nota">Sin copys.</p>`}
            ${tiktokKit(a)}
          </div>`).join("")}</div>` : `<p class="ts-kit-nota">No tiene proyecto en Desarrollo.</p>`}
      </details>`).join("") || `<p class="ts-kit-nota">No hay ganadores en este país.</p>`}
  </section>`;
}

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
    sincronizarMeta();
  } catch (err) {
    view.innerHTML = `<div class="ts-page"><p class="est-error">${esc(err.message)}</p></div>`;
  }
});
