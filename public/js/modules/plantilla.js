// =============================================
// 🧩 MI PLANTILLA — cómo nacen tus landings nuevas
// Orden y secciones visibles, diseño de cada sección y colores,
// por separado para Ban page y Landing normal.
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { SECCIONES, FORMATOS, esFija, plantillaPorDefecto, normalizarPlantilla, CLAVES, claveDe, TIPOS_PRODUCTO, ACABADOS, MARGENES_ABAJO, MUESTRAS_COLORES, llevaBarra } from "../core/plantilla.js";
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
let misEjemplos = [];     // ejemplos reales que creaste (uno por sección y diseño)
let misRefs = [];         // "Mis landings que venden"
let gastoIA = null;
let creando = null;       // { tipo, variante } o { todos: true, hechas, total }
let refTipo = "oferta";   // a qué sección van las referencias que subes

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
  if (!view || !window.enPantalla("plantilla")) return;
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
              : base() === "ban"
                ? `<b>Orden de las recetas</b> (las landings que sí venden): portada, dolor, calidad, reseñas, foto real, cómo funciona, lo que recibes, paquetes, por qué comprar aquí y entrega. Se saltan solas las que no aplican (sin reseñas reales, sin paquetes…). Prende esto para usar tu orden.`
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
              ${base() === "ban" && !["foto_real", "galeria"].includes(x.tipo) ? `<label class="pl-barra"><input type="checkbox" ${llevaBarra(x.tipo, p) ? "checked" : ""} onchange="plBarra('${x.tipo}', this.checked)"> Barra de confianza (envío, pago contra entrega, garantía)</label>` : ""}
              ${s.receta && base() === "ban" ? `<details class="pl-receta"><summary>Receta: qué lleva esta imagen</summary><ol>${s.receta.bloques.map(b => `<li>${esc(b)}</li>`).join("")}</ol><small>Escena: ${esc(s.receta.escena)}. Los diseños A, B, C… cambian solo la forma.</small></details>` : ""}
              <div class="pl-variantes">
                <button class="pl-var ${actual ? "" : "elegida"}" onclick="plEstilo('${x.tipo}', '')">
                  ${ICONO_AZAR}<span>Al azar</span><small>como hoy</small>
                </button>
                ${s.variantes.map((v, k) => {
                  const mio = ejemploMio(x.tipo, v.id);
                  const ocupado = creando && ((creando.tipo === x.tipo && creando.variante === v.id) || creando.actual === `${x.tipo}:${v.id}`);
                  return `<div class="pl-var-caja">
                  <button class="pl-var ${actual === v.id ? "elegida" : ""}" title="${esc(v.desc)}" onclick="plEstilo('${x.tipo}', '${v.id}')">
                    ${miniatura(x.tipo, v, azul, "pl-dibujo")}
                    <span>${String.fromCharCode(65 + k)} · ${esc(v.nombre)}</span>
                  </button>
                  <div class="pl-ej-acc">${ocupado ? `<span class="pl-ej-creando"><span class="est-spin"></span> Creando…</span>`
                    : mio ? `<button title="Rehacer el ejemplo (${esc(mio.producto)})" onclick="plEjemplo('${x.tipo}', '${v.id}')"><i data-lucide="refresh-cw"></i></button><button title="Borrar el ejemplo" onclick="plBorrarEjemplo('${mio._id}')"><i data-lucide="trash-2"></i></button>`
                    : `<button class="pl-ej-crear" onclick="plEjemplo('${x.tipo}', '${v.id}')"><i data-lucide="sparkles"></i> Crear ejemplo</button>`}</div>
                </div>`; }).join("")}
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

        ${tarjetaReferencias(p)}

        <section class="pl-card">
          <div class="pl-card-head">
            <div>
              <h2>Muestra de colores en la portada</h2>
              <p>Cuando el producto tiene 2 o más colores, así se muestran en la portada y en la oferta de cierre. En cada proyecto lo puedes cambiar desde la Ficha.</p>
            </div>
          </div>
          <div class="pl-acabados">
            ${Object.entries(MUESTRAS_COLORES).map(([k, a]) => `
              <button class="pl-acabado ${(p.muestraColores || "circulos") === k ? "elegido" : ""}" onclick="plMuestraColores('${k}')">
                <strong>${esc(a.nombre)}</strong>
                <small>${esc(a.desc)}</small>
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
        <button class="pl-btn pl-ej-todos" ${creando ? "disabled" : ""} onclick="plEjemplosTodos()">${creando?.todos ? `<span class="est-spin"></span> Creando ${creando.hechas + 1} de ${creando.total}…` : `<i data-lucide="sparkles"></i> Crear ejemplos de toda la plantilla`}</button>
        ${gastoIA ? `<p class="pl-nota">Ejemplos este mes: ${gastoIA.ejemplos || 0} (unos $${Number(gastoIA.usdEjemplos || 0).toFixed(2)} USD). Te quedan $${Number(gastoIA.queda || 0).toFixed(2)} de $${Number(gastoIA.limite || 0).toFixed(2)}.</p>` : ""}
        <div class="pl-telefono">
          <div class="pl-pantalla">
            ${vistaPrevia(p, azul)}
          </div>
        </div>
        <p class="pl-nota">${p.usarOrden
          ? "Así queda el orden de tus landings nuevas. Lo que dejes «Al azar» sale distinto en cada landing."
          : base() === "ban" ? "El orden de las recetas. Las que no aplican a un producto (sin reseñas reales, sin paquetes…) se saltan solas. Entre imagen e imagen va el botón de tu tienda."
          : "Ejemplo con el orden de siempre: con «La IA elige», las secciones cambian según el producto. El diseño que fijes sí se respeta."}</p>
      </div>
    </div>
  </div>`;
  iconos();
}

// Imagen real de ejemplo (si ya existe) o el dibujo del diseño
const ejemploMio = (tipo, variante) => misEjemplos.find(e => e.clave === formato && e.tipo === tipo && e.variante === variante);
const ejemploDeTipo = (tipo, variante) => ejemploMio(tipo, variante) || misEjemplos.find(e => e.clave === formato && e.tipo === tipo);
const srcMio = (e) => `/api/plantilla/ejemplos/${e._id}/img?v=${encodeURIComponent(e.creado || "")}`;
function miniatura(tipo, v, azul, clase) {
  const mio = ejemploMio(tipo, v.id);
  if (mio) return `<img class="${clase} pl-ejemplo mio ${base() === "normal" ? "cuadrada" : ""}" src="${srcMio(mio)}" alt="Tu ejemplo: ${esc(v.nombre)}" loading="lazy" decoding="async">`;
  const src = ejemploDe(tipo, v.id, base(), tipoProd());
  return src
    ? `<img class="${clase} pl-ejemplo ${base() === "normal" ? "cuadrada" : ""}" src="${src}" alt="Ejemplo: ${esc(v.nombre)}" loading="lazy" decoding="async">`
    : dibujar(v.dibujo, azul, clase);
}

function vistaPrevia(p, azul) {
  const boton = base() === "ban" ? `<div class="pl-boton-tienda">ORDENA AHORA, PAGAS EN CASA</div>` : "";
  return p.orden.filter(x => x.visible).map(x => {
    const s = SECCIONES[x.tipo];
    const fija = s.variantes.find(v => v.id === p.estilos[x.tipo]);
    const v = fija || s.variantes[0];
    const mio = ejemploDeTipo(x.tipo, v.id);
    return `
      <div class="pl-bloque ${fija ? "" : "azar"} ${mio ? "real" : ""}" data-tipo="${x.tipo}" onclick="document.getElementById('pl-sec-${x.tipo}')?.scrollIntoView({behavior:'smooth', block:'center'})">
        ${mio ? `<img class="pl-dibujo-grande pl-ejemplo mio ${base() === "normal" ? "cuadrada" : ""}" src="${srcMio(mio)}" alt="Ejemplo de ${esc(s.titulo)}" loading="lazy">` : miniatura(x.tipo, v, azul, "pl-dibujo-grande")}
        <span>${esc(s.titulo)}${fija ? ` · ${esc(fija.nombre)}` : " · al azar"}</span>
      </div>${boton}`;
  }).join("");
}

// ---------- Ejemplos reales: "¿Con qué producto?" ----------
let proyectosCache = null;
function recordar(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ""; localStorage.setItem(k, v); } catch { return ""; } return ""; }
async function pedirProducto(titulo) {
  if (!proyectosCache) { try { proyectosCache = await api("GET", "/api/proyectos"); } catch { proyectosCache = []; } }
  const costo = gastoIA ? gastoIA.precioImagen + gastoIA.precioReferencia : 0.05;
  return new Promise((resolver) => {
    const fondo = document.createElement("div");
    fondo.className = "pl-modal-fondo";
    fondo.innerHTML = `<div class="pl-modal" role="dialog" aria-label="${esc(titulo)}">
      <h3>${esc(titulo)}</h3>
      <label>¿Con qué producto?<input id="plEjProd" placeholder="Ej: camiseta de fútbol, masajeador de cuello" maxlength="120" value="${esc(recordar("pl_ej_producto"))}"></label>
      <label>O usa uno de tus proyectos (con su Ficha y sus fotos)<select id="plEjProy"><option value="">— Ninguno —</option>${(proyectosCache || []).map(x => `<option value="${esc(x._id)}">${esc(x.nombre)}</option>`).join("")}</select></label>
      <label>Foto del producto (opcional)<input id="plEjFoto" type="file" accept="image/png,image/jpeg,image/webp"></label>
      <p class="pl-nota">Cada ejemplo cuesta unos $${costo.toFixed(2)} USD de tu saldo de xAI. No toca ningún proyecto.</p>
      <div class="pl-modal-acc"><button class="pl-btn ghost" data-no>Cancelar</button><button class="pl-btn" data-si><i data-lucide="sparkles"></i> Crear</button></div>
    </div>`;
    document.body.appendChild(fondo);
    iconos();
    const cerrar = (v) => { fondo.remove(); resolver(v); };
    fondo.querySelector("[data-no]").onclick = () => cerrar(null);
    fondo.onclick = (e) => { if (e.target === fondo) cerrar(null); };
    fondo.querySelector("[data-si]").onclick = async () => {
      const producto = $("plEjProd").value.trim(), proyecto = $("plEjProy").value;
      if (!producto && !proyecto) { avisar("Escribe un producto o elige un proyecto", "error"); return; }
      const archivo = $("plEjFoto").files?.[0];
      const foto = archivo ? await achicar(archivo, 1280) : "";
      if (producto) recordar("pl_ej_producto", producto);
      cerrar({ producto, proyecto, foto });
    };
    setTimeout(() => $("plEjProd")?.focus(), 50);
  });
}
// Achica una imagen en el navegador (JPG, lado mayor máx)
function achicar(archivo, max = 1600) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      ok(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => mal(new Error("No se pudo leer la imagen"));
    img.src = URL.createObjectURL(archivo);
  });
}
async function crearUno(tipo, variante, datos) {
  const { ejemplo, gasto } = await api("POST", "/api/plantilla/ejemplos", { clave: formato, tipo, variante, ...datos });
  misEjemplos = [ejemplo, ...misEjemplos.filter(e => !(e.clave === ejemplo.clave && e.tipo === ejemplo.tipo && e.variante === ejemplo.variante))];
  gastoIA = gasto || gastoIA;
}
window.plEjemplo = async (tipo, variante) => {
  if (creando) return;
  const datos = await pedirProducto(`Crear ejemplo: ${SECCIONES[tipo].titulo}`);
  if (!datos) return;
  creando = { tipo, variante };
  render();
  try { await crearUno(tipo, variante, datos); avisar("Ejemplo listo ✓"); }
  catch (e) { avisar(e.message, "error"); }
  creando = null;
  render();
};
window.plEjemplosTodos = async () => {
  if (creando) return;
  const p = borrador[formato];
  const lista = p.orden.filter(x => x.visible).map(x => ({ tipo: x.tipo, variante: p.estilos[x.tipo] || SECCIONES[x.tipo].variantes[0]?.id || "" }));
  const datos = await pedirProducto(`Crear ejemplos de toda la plantilla (${lista.length} secciones)`);
  if (!datos) return;
  if (!confirm(`Se van a crear ${lista.length} imágenes, unos $${(lista.length * (gastoIA ? gastoIA.precioImagen + gastoIA.precioReferencia : 0.05)).toFixed(2)} USD. ¿Seguir?`)) return;
  creando = { todos: true, hechas: 0, total: lista.length };
  const fallas = [];
  for (const it of lista) {
    creando.actual = `${it.tipo}:${it.variante}`;
    render();
    try { await crearUno(it.tipo, it.variante, datos); }
    catch (e) { fallas.push(`${SECCIONES[it.tipo].titulo}: ${e.message}`); if (/límite/i.test(e.message)) break; }
    creando.hechas++;
  }
  creando = null;
  render();
  avisar(fallas.length ? `Listo, con ${fallas.length} sin hacer. ${fallas[0]}` : "Ejemplos listos ✓", fallas.length ? "error" : "ok");
};
window.plBorrarEjemplo = async (id) => {
  if (!confirm("¿Borrar este ejemplo?")) return;
  try { await api("DELETE", `/api/plantilla/ejemplos/${id}`); misEjemplos = misEjemplos.filter(e => e._id !== id); render(); }
  catch (e) { avisar(e.message, "error"); }
};

// ---------- Mis landings que venden ----------
function tarjetaReferencias(p) {
  const tipos = p.orden.map(x => x.tipo);
  const opciones = (sel) => tipos.map(t => `<option value="${t}" ${t === sel ? "selected" : ""}>${esc(SECCIONES[t].titulo)}</option>`).join("");
  const mias = misRefs.filter(r => tipos.includes(r.tipo));
  return `<section class="pl-card">
    <div class="pl-card-head"><div>
      <h2>Mis landings que venden</h2>
      <p>Sube las imágenes de una landing tuya que funciona y dile a qué sección corresponde cada una. Al escribir los prompts y al generar esa sección, CoDropX la usa como guía de <b>composición, densidad y acabado</b>, sin copiar su producto, textos, logos ni colores. Cuesta un poco más por imagen (la referencia también se cobra).</p>
    </div></div>
    <div class="pl-ref-subir">
      <label>Sección <select onchange="plRefTipo(this.value)">${opciones(tipos.includes(refTipo) ? refTipo : tipos[0])}</select></label>
      <label class="pl-btn"><i data-lucide="upload"></i> Subir imágenes<input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onchange="plSubirRefs(this.files); this.value=''"></label>
    </div>
    ${mias.length ? `<div class="pl-refs">${mias.map(r => `<div class="pl-ref ${r.activa ? "" : "apagada"}">
      <img src="/api/plantilla/referencias/${r._id}/img" alt="Referencia" loading="lazy">
      <select onchange="plRefCambiar('${r._id}', {tipo: this.value})">${opciones(r.tipo)}</select>
      <label><input type="checkbox" ${r.activa ? "checked" : ""} onchange="plRefCambiar('${r._id}', {activa: this.checked})"> Usarla</label>
      <button class="est-link" onclick="plRefBorrar('${r._id}')">Borrar</button>
    </div>`).join("")}</div>` : `<p class="pl-nota">Aún no tienes referencias. Si hay varias activas para una sección, se usa la más nueva.</p>`}
  </section>`;
}
window.plRefTipo = (t) => { refTipo = t; };
window.plSubirRefs = async (files) => {
  const tipo = SECCIONES[refTipo] && borrador[formato].orden.some(x => x.tipo === refTipo) ? refTipo : borrador[formato].orden[0].tipo;
  let n = 0;
  for (const f of [...(files || [])].filter(f => /^image\//.test(f.type)).slice(0, 10)) {
    try { const r = await api("POST", "/api/plantilla/referencias", { tipo, dataUrl: await achicar(f, 1600) }); misRefs = [r, ...misRefs]; n++; }
    catch (e) { avisar(e.message, "error"); break; }
  }
  if (n) avisar(n === 1 ? "Referencia guardada ✓" : `${n} referencias guardadas ✓`);
  render();
};
window.plRefCambiar = async (id, cambios) => {
  try { const r = await api("PUT", `/api/plantilla/referencias/${id}`, cambios); misRefs = misRefs.map(x => (x._id === id ? r : x)); render(); }
  catch (e) { avisar(e.message, "error"); }
};
window.plRefBorrar = async (id) => {
  if (!confirm("¿Borrar esta referencia?")) return;
  try { await api("DELETE", `/api/plantilla/referencias/${id}`); misRefs = misRefs.filter(x => x._id !== id); render(); }
  catch (e) { avisar(e.message, "error"); }
};

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
window.plBarra = (tipo, v) => cambio(p => { p.barras = { ...(p.barras || {}), [tipo]: !!v }; });
window.plMuestraColores = (k) => cambio(p => { p.muestraColores = MUESTRAS_COLORES[k] ? k : "circulos"; });
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
    const [r, ej, refs, g] = await Promise.all([
      api("GET", "/api/plantilla"),
      api("GET", "/api/plantilla/ejemplos").catch(() => []),
      api("GET", "/api/plantilla/referencias").catch(() => []),
      api("GET", "/api/ia/gasto").catch(() => null)
    ]);
    misEjemplos = Array.isArray(ej) ? ej : []; misRefs = Array.isArray(refs) ? refs : []; gastoIA = g;
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
