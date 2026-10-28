// =============================================
// 🧩 MI PLANTILLA — cómo nacen tus landings nuevas
// Orden y secciones visibles, diseño de cada sección y colores,
// por separado para Ban page y Landing normal.
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { SECCIONES, FORMATOS, esFija, plantillaPorDefecto, normalizarPlantilla, CLAVES, claveDe, TIPOS_PRODUCTO, ACABADOS, MARGENES_ABAJO } from "../core/plantilla.js";
import { ejemploDe } from "../core/ejemplos.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");
const iconos = () => { if (window.lucide) lucide.createIcons(); };
const copia = (o) => JSON.parse(JSON.stringify(o));
const CLAVE_BORRADOR = "pl_borrador";

let guardada = null;     // { ban, normal } como está en el servidor
let borrador = null;     // lo que estás editando
let formato = "ban";     // clave: ban · normal · moda_ban · moda_normal
const base = () => (formato.endsWith("normal") ? "normal" : "ban");
const tipoProd = () => (formato.startsWith("moda_") ? "moda" : "producto");
let recuperado = false;

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

const sucio = (f) => guardada && borrador && JSON.stringify(guardada[f]) !== JSON.stringify(borrador[f]);

function guardarBorrador() {
  try {
    if (CLAVES.some(sucio)) sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
    else sessionStorage.removeItem(CLAVE_BORRADOR);
  } catch {}
}

// ---------- Dibujos ----------
const TONOS = { d: "#1f2937", g: "#e5e7eb", m: "#9ca3af", w: "#ffffff" };

export function dibujar(dibujo, acento = "#3b82f6", clase = "") {
  const color = (t) => (t === "a" ? acento : TONOS[t] || TONOS.g);
  const partes = (dibujo || []).map(el => {
    const [k, ...v] = el;
    if (k === "r") return `<rect x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}" rx="${v[5] || 0}" fill="${color(v[4])}"/>`;
    if (k === "c") return `<circle cx="${v[0]}" cy="${v[1]}" r="${v[2]}" fill="${color(v[3])}"/>`;
    if (k === "o") return `<circle cx="${v[0]}" cy="${v[1]}" r="${v[2]}" fill="none" stroke="${color(v[3])}" stroke-width="1.4"/>`;
    if (k === "t") return `<rect x="${v[0]}" y="${v[1] - 1.3}" width="${v[2]}" height="2.6" rx="1.3" fill="${color(v[3])}"/>`;
    if (k === "x") return `<line x1="${v[0]}" y1="${v[1]}" x2="${v[2]}" y2="${v[3]}" stroke="${color(v[4])}" stroke-width="0.9"/>`;
    return "";
  }).join("");
  return `<svg class="${clase}" viewBox="0 0 60 90" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><rect width="60" height="90" rx="4" fill="#f8fafc"/>${partes}</svg>`;
}

const ICONO_AZAR = `<svg class="pl-dibujo" viewBox="0 0 60 90" aria-hidden="true"><rect x="2" y="2" width="56" height="86" rx="5" fill="none" stroke="#cbd5e1" stroke-dasharray="3 3"/><path d="M20 38h6l10 14h6m-4-4 4 4-4 4M20 52h6l3-4m7-10h6m-4-4 4 4-4 4" fill="none" stroke="#64748b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const acentoDe = (p) => (p.colores.modo === "fijos" ? p.colores.acento : "#3b82f6");

// ---------- Pantalla ----------
function render() {
  const view = $("view");
  if (!view) return;
  const p = borrador[formato];
  const azul = acentoDe(p);
  const visibles = p.orden.filter(x => x.visible).length;
  const fijados = Object.keys(p.estilos).length;

  view.innerHTML = `
  <div class="pl-page">
    <header class="pl-head">
      <div>
        <button class="est-link" onclick="goTo('desarrollo')"><i data-lucide="arrow-left"></i> Desarrollo</button>
        <h1>Mi plantilla</h1>
        <p>Elige cómo nacen tus landings nuevas: qué secciones van, en qué orden y cómo se ve cada una. La IA sigue escribiendo los textos y los prompts de cada producto, y en cada landing puedes cambiar lo que quieras.</p>
      </div>
    </header>

    <div class="pl-tipos">
      ${Object.entries(TIPOS_PRODUCTO).map(([k, t]) => `
        <button class="${k === tipoProd() ? "activo" : ""}" onclick="plTipo('${k}')" title="${esc(t.desc)}">
          <i data-lucide="${k === "moda" ? "shirt" : "package"}"></i> ${esc(t.nombre)}
          ${[claveDe("ban", k), claveDe("normal", k)].some(sucio) ? `<span class="pl-punto"></span>` : ""}
        </button>`).join("")}
    </div>
    <div class="pl-tabs">
      ${Object.entries(FORMATOS).map(([k, f]) => {
        const c = claveDe(k, tipoProd());
        return `<button class="${c === formato ? "activa" : ""}" onclick="plFormato('${k}')">
          ${esc(f.nombre)} ${sucio(c) ? `<span class="pl-punto" title="Cambios sin guardar"></span>` : ""}
        </button>`;
      }).join("")}
    </div>
    <p class="pl-formato-desc">${tipoProd() === "moda" ? "<b>Moda:</b> " : ""}${esc(FORMATOS[base()].desc)}</p>

    <div class="pl-cols">
      <div class="pl-main">

        <section class="pl-card">
          <div class="pl-card-head">
            <div>
              <h2>Orden y secciones visibles</h2>
              <p>Sube, baja y apaga con el ojo las secciones que no quieres. La ${base() === "ban" ? "portada" : "galería"} siempre se ve.</p>
            </div>
          </div>
          <label class="pl-switch">
            <input type="checkbox" ${p.usarOrden ? "checked" : ""} onchange="plUsarOrden(this.checked)">
            <span class="pl-switch-ui"></span>
            <span>${p.usarOrden
              ? `<b>Usar mi orden</b> en las landings nuevas (${visibles} secciones). "Paquetes" se salta solo si el producto no tiene paquetes.`
              : `<b>La IA elige</b> las secciones según el producto (como hoy). Prende esto para usar tu orden.`}</span>
          </label>
          <ol class="pl-orden ${p.usarOrden ? "" : "apagado"}">
            ${p.orden.map((x, i) => {
              const fija = esFija(x.tipo, formato);
              return `
              <li class="${x.visible ? "" : "oculta"}">
                <span class="pl-n">${i + 1}</span>
                <span class="pl-nombre">${esc(SECCIONES[x.tipo].titulo)}</span>
                <span class="pl-acciones">
                  <button title="Subir" ${i === 0 ? "disabled" : ""} onclick="plMover(${i}, -1)"><i data-lucide="chevron-up"></i></button>
                  <button title="Bajar" ${i === p.orden.length - 1 ? "disabled" : ""} onclick="plMover(${i}, 1)"><i data-lucide="chevron-down"></i></button>
                  ${fija
                    ? `<span class="pl-fija"><i data-lucide="lock"></i> Siempre visible</span>`
                    : `<button title="${x.visible ? "Ocultar" : "Mostrar"}" class="pl-ojo ${x.visible ? "" : "off"}" onclick="plVisible(${i})"><i data-lucide="${x.visible ? "eye" : "eye-off"}"></i></button>`}
                </span>
              </li>`;
            }).join("")}
          </ol>
        </section>

        <section class="pl-card">
          <div class="pl-card-head">
            <div>
              <h2>Cómo se ve cada sección</h2>
              <p>Fija el diseño de las secciones que quieras. Las que dejes en «Al azar» salen con uno distinto cada vez. Fijados: ${fijados} de ${p.orden.length}.</p>
            </div>
          </div>
          ${p.orden.map(x => {
            const s = SECCIONES[x.tipo];
            const actual = p.estilos[x.tipo] || "";
            return `
            <div class="pl-seccion ${x.visible || !p.usarOrden ? "" : "oculta"}" id="pl-sec-${x.tipo}">
              <h3>${esc(s.titulo)} ${x.visible || !p.usarOrden ? "" : `<small>(apagada)</small>`}</h3>
              <div class="pl-variantes">
                <button class="pl-var ${actual ? "" : "elegida"}" onclick="plEstilo('${x.tipo}', '')">
                  ${ICONO_AZAR}<span>Al azar</span><small>como hoy</small>
                </button>
                ${s.variantes.map((v, k) => `
                  <button class="pl-var ${actual === v.id ? "elegida" : ""}" title="${esc(v.desc)}" onclick="plEstilo('${x.tipo}', '${v.id}')">
                    ${miniatura(x.tipo, v, azul, "pl-dibujo")}
                    <span>${String.fromCharCode(65 + k)} · ${esc(v.nombre)}</span>
                  </button>`).join("")}
              </div>
            </div>`;
          }).join("")}
        </section>

        <section class="pl-card">
          <div class="pl-card-head">
            <div>
              <h2>Acabado del diseño</h2>
              <p>Cómo se ven las imágenes. "Alto impacto" es el estilo de anuncio premium (como tus letreros neón y los tenis La Titular).</p>
            </div>
          </div>
          <div class="pl-acabados">
            ${Object.entries(ACABADOS).map(([k, a]) => `
              <button class="pl-acabado ${p.acabado === k ? "elegido" : ""} ${k}" onclick="plAcabado('${k}')">
                <span class="pl-acabado-muestra ${k}"><b>TITULAR</b><i>$99.900</i></span>
                <strong>${esc(a.nombre)}</strong>
                <small>${esc(a.desc)}</small>
              </button>`).join("")}
          </div>
        </section>

        <section class="pl-card">
          <div class="pl-card-head">
            <div>
              <h2>Margen abajo para el botón de compra</h2>
              <p>El botón fijo de Releasit o de Shopify ("ORDENA AHORA, PAGAS EN CASA") tapa la parte de abajo de cada imagen. Este espacio queda solo con el fondo, y la barra de confianza sube encima.</p>
            </div>
          </div>
          <div class="pl-margenes">
            ${MARGENES_ABAJO.map(m => `
              <button class="pl-margen ${p.margenAbajo === m ? "elegido" : ""}" onclick="plMargen(${m})">
                <span class="pl-margen-muestra"><i style="height:${m * 2.2}%"></i><b style="bottom:${m * 2.2 + 6}%"></b></span>
                <strong>${m ? `${m}%` : "Sin margen"}</strong>
                <small>${m === 0 ? "La imagen usa todo el alto" : m === 8 ? "Botón delgado" : m === 12 ? "Botón normal de Releasit" : "Botón grande o con texto debajo"}</small>
              </button>`).join("")}
          </div>
        </section>

        <section class="pl-card">
          <div class="pl-card-head">
            <div>
              <h2>Colores</h2>
              <p>Si los fijas, todas tus landings nuevas de ${esc(FORMATOS[base()].nombre)} usan estos colores (por ejemplo, los de tu marca). Si no, salen del estilo que elijas para cada producto, como hasta ahora.</p>
            </div>
          </div>
          <div class="pl-radios">
            <label><input type="radio" name="plColores" ${p.colores.modo === "producto" ? "checked" : ""} onchange="plModoColores('producto')"> Que salgan de cada producto</label>
            <label><input type="radio" name="plColores" ${p.colores.modo === "fijos" ? "checked" : ""} onchange="plModoColores('fijos')"> Fijar mis colores</label>
          </div>
          ${p.colores.modo === "fijos" ? `
            <div class="pl-colores">
              ${[["fondo", "Fondo"], ["color1", "Titular línea 1"], ["color2", "Titular línea 2"], ["acento", "Acento (íconos, precio)"]].map(([k, t]) => `
                <label><input type="color" value="${esc(p.colores[k])}" oninput="plColor('${k}', this.value)"><span>${t}<small>${esc(p.colores[k])}</small></span></label>
              `).join("")}
            </div>
            <div class="pl-muestra" style="background:${esc(p.colores.fondo)}">
              <b style="color:${esc(p.colores.color1)}">TITULAR EN</b>
              <b style="color:${esc(p.colores.color2)}">DOS COLORES</b>
              <span style="background:${esc(p.colores.acento)}">$99.900</span>
            </div>` : ""}
        </section>

        <div class="pl-guardar">
          ${recuperado && sucio(formato) ? `<span class="pl-recuperado">Recuperamos los cambios sin guardar que dejaste. <a href="#" onclick="plDescartar(); return false;">Descartarlos</a></span>` : ""}
          <button id="plBtnGuardar" class="pl-btn" onclick="plGuardar()" ${sucio(formato) ? "" : "disabled"}><i data-lucide="save"></i> Guardar plantilla</button>
          <span class="pl-estado">${sucio(formato) ? "Tienes cambios sin guardar" : "Todo guardado ✓"}</span>
          ${sucio(formato) && !recuperado ? `<a href="#" class="pl-descartar" onclick="plDescartar(); return false;">Descartar cambios</a>` : ""}
          <a href="#" class="pl-descartar" onclick="plRestablecer(); return false;">Volver a lo de siempre</a>
        </div>
      </div>

      <div class="pl-preview">
        <h3>Vista previa del orden</h3>
        <div class="pl-telefono">
          <div class="pl-pantalla">
            ${vistaPrevia(p, azul)}
          </div>
        </div>
        <p class="pl-nota">${p.usarOrden
          ? "Así queda el orden de tus landings nuevas. Lo que dejes «Al azar» sale distinto en cada landing."
          : "Ejemplo con el orden de siempre: con «La IA elige», las secciones cambian según el producto. El diseño que fijes sí se respeta."}</p>
      </div>
    </div>
  </div>`;
  iconos();
}

// Imagen real de ejemplo (si ya existe) o el dibujo del diseño
function miniatura(tipo, v, azul, clase) {
  const src = ejemploDe(tipo, v.id, base(), tipoProd());
  return src
    ? `<img class="${clase} pl-ejemplo ${base() === "normal" ? "cuadrada" : ""}" src="${src}" alt="Ejemplo: ${esc(v.nombre)}" loading="lazy" decoding="async">`
    : dibujar(v.dibujo, azul, clase);
}

function vistaPrevia(p, azul) {
  return p.orden.filter(x => x.visible).map(x => {
    const s = SECCIONES[x.tipo];
    const fija = s.variantes.find(v => v.id === p.estilos[x.tipo]);
    const v = fija || s.variantes[0];
    return `
      <div class="pl-bloque ${fija ? "" : "azar"}" data-tipo="${x.tipo}" onclick="document.getElementById('pl-sec-${x.tipo}')?.scrollIntoView({behavior:'smooth', block:'center'})">
        ${miniatura(x.tipo, v, azul, "pl-dibujo-grande")}
        <span>${esc(s.titulo)}${fija ? ` · ${esc(fija.nombre)}` : " · al azar"}</span>
      </div>`;
  }).join("");
}

function cambio(fn) {
  fn(borrador[formato]);
  borrador[formato] = normalizarPlantilla(formato, borrador[formato]);
  guardarBorrador();
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
}

// ---------- Acciones ----------
window.plFormato = (f) => { formato = claveDe(f, tipoProd()); try { localStorage.setItem("pl_formato", formato); } catch {} render(); };
window.plTipo = (t) => { formato = claveDe(base(), t); try { localStorage.setItem("pl_formato", formato); } catch {} render(); };
window.plUsarOrden = (v) => cambio(p => { p.usarOrden = !!v; });
window.plMover = (i, dir) => cambio(p => {
  const j = i + dir;
  if (j < 0 || j >= p.orden.length) return;
  [p.orden[i], p.orden[j]] = [p.orden[j], p.orden[i]];
});
window.plVisible = (i) => cambio(p => { p.orden[i].visible = !p.orden[i].visible; });
window.plEstilo = (tipo, id) => {
  cambio(p => { if (id) p.estilos[tipo] = id; else delete p.estilos[tipo]; });
  // En la vista previa, ir a la sección que acabas de cambiar
  const pantalla = document.querySelector(".pl-pantalla");
  const bloque = pantalla?.querySelector(`[data-tipo="${tipo}"]`);
  if (pantalla && bloque) pantalla.scrollTop = bloque.offsetTop - pantalla.offsetTop - 8;
};
window.plMargen = (m) => cambio(p => { p.margenAbajo = MARGENES_ABAJO.includes(Number(m)) ? Number(m) : 12; });
window.plAcabado = (k) => cambio(p => { p.acabado = ACABADOS[k] ? k : "impacto"; });
window.plModoColores = (modo) => cambio(p => { p.colores.modo = modo; });

// El color se actualiza sin redibujar todo (para que el selector no se cierre)
let tColor = null;
window.plColor = (k, v) => {
  borrador[formato].colores[k] = v;
  guardarBorrador();
  clearTimeout(tColor);
  tColor = setTimeout(() => { const y = window.scrollY; render(); window.scrollTo(0, y); }, 350);
};

window.plDescartar = () => {
  borrador[formato] = copia(guardada[formato]);
  recuperado = false;
  guardarBorrador();
  render();
};

window.plRestablecer = () => {
  if (!confirm(`¿Volver ${FORMATOS[base()].nombre} a lo de siempre? (la IA elige, todo al azar y colores de cada producto). Después dale a Guardar.`)) return;
  borrador[formato] = plantillaPorDefecto(formato);
  guardarBorrador();
  render();
};

window.plGuardar = async () => {
  const b = $("plBtnGuardar");
  if (b) { b.disabled = true; b.innerHTML = `<span class="est-spin"></span> Guardando...`; }
  try {
    const r = await api("PUT", `/api/plantilla/${formato}`, borrador[formato]);
    guardada[formato] = r[formato];
    borrador[formato] = copia(r[formato]);
    recuperado = false;
    guardarBorrador();
    avisar("Plantilla guardada ✓");
  } catch (err) {
    avisar(err.message, "error");
  }
  render();
};

registrarRuta("plantilla", async (view) => {
  window.marcarMenuActivo?.("plantilla");
  view.innerHTML = `<div class="pl-page"><p class="est-muted">Cargando tu plantilla...</p></div>`;
  try {
    const r = await api("GET", "/api/plantilla");
    guardada = Object.fromEntries(CLAVES.map(c => [c, r[c]]));
    borrador = copia(guardada);
    recuperado = false;
    try {
      const b = JSON.parse(sessionStorage.getItem(CLAVE_BORRADOR) || "null");
      if (b && b.ban && b.normal) {
        borrador = Object.fromEntries(CLAVES.map(c => [c, normalizarPlantilla(c, b[c] || guardada[c])]));
        recuperado = CLAVES.some(sucio);
      }
      const f = localStorage.getItem("pl_formato");
      if (CLAVES.includes(f)) formato = f;
    } catch {}
    render();
  } catch (err) {
    view.innerHTML = `<div class="pl-page"><p class="est-error">${esc(err.message)}</p></div>`;
  }
});
