// =============================================
// 📣 ANUNCIOS RÁPIDOS — anuncios de imagen para productos que salen directo a testear.
// Nombre, descripción y fotos (y datos opcionales) → las mismas 18 estructuras de Ads estáticos.
// NO se guarda nada: ni producto ni imágenes. Los creas, los descargas y listo.
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { RECETAS_AD, TAGS_AD, FECHAS_AD, FORMATOS_AD, mezclarAds, conPrecioAsignado, maxConPrecio, precioObligatorio, precioPosible } from "../core/anuncios.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");
const iconos = () => { if (window.lucide) lucide.createIcons(); };

// Todo vive en memoria mientras la página esté abierta
let fotos = [];
let sel = new Set(), preciosMezcla = null;
let cuantos = 5, conPrecio = "1", fecha = "", formato = "4:5";
let ads = [];             // { id, estructura, precio, fecha, formato, titular, titulares, versiones: [{ imagen, revision }], creando }
let gasto = null, ocupado = false;

async function api(metodo, url, body) {
  const res = await fetch(url, { method: metodo, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
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
  el._t = setTimeout(() => el.classList.remove("show"), tipo === "error" ? 4500 : 1600);
}
function achicar(archivo, max = 1400) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      ok(c.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => mal(new Error("No se pudo leer la imagen"));
    img.src = URL.createObjectURL(archivo);
  });
}
const costo = () => (gasto ? gasto.precioImagen + gasto.precioReferencia * (Math.min(3, fotos.length || 1) + 1) : 0.06);
const val = (id) => ($(id)?.value || "").trim();
const numero = (id) => Number(val(id).replace(/\D/g, "")) || null;

// El producto se lee del formulario cada vez (no se guarda)
let datos = { nombre: "", descripcion: "", precio: "", precioAntes: "", oferta: "descuento", envioGratis: false, colores: "", quien: "", problema: "", pais: "CO", tipo: "producto" };
function leerProducto() {
  if ($("arNombre")) datos = {
    nombre: val("arNombre"), descripcion: val("arDesc"), precio: numero("arPrecio"), precioAntes: numero("arAntes"),
    oferta: val("arOferta") || "descuento", envioGratis: !!$("arEnvio")?.checked, colores: val("arColores"),
    quien: val("arQuien"), problema: val("arProblema"), pais: val("arPais") || "CO", tipo: val("arTipo") || "producto"
  };
  return { ...datos, fotos };
}
const hayPaquetes = () => false;   // en anuncios rápidos la oferta es normal o 2x1
const hayDolor = () => !!datos.problema;

function plan(lista) {
  if (preciosMezcla && lista.every(k => k in preciosMezcla)) return Object.fromEntries(lista.map(k => [k, preciosMezcla[k]]));
  return Object.fromEntries(conPrecioAsignado(lista, maxConPrecio(lista.length, conPrecio), () => 0.5).map(x => [x.estructura, x.precio]));
}

function render() {
  const view = $("view");
  if (!view || !window.enPantalla("anuncios")) return;
  const lista = [...sel];
  const pl = plan(lista);
  const sinImg = ads.filter(a => !a.versiones.length);
  view.innerHTML = `
  <div class="est-page">
    <header class="est-head"><div>
      <h1>Anuncios rápidos</h1>
      <p class="est-muted">Para productos que salen directo a testear. Pon el producto, elige las estructuras y CoDropX crea los anuncios de imagen. <b>No se guarda nada</b>: descárgalos antes de cerrar la página.</p>
    </div></header>

    <div class="est-card">
      <h3>1. El producto</h3>
      <div class="est-form">
        <label>Nombre del producto</label><input id="arNombre" placeholder="Ej: morral acolchado" maxlength="120" value="${esc(datos.nombre)}">
        <label>Descripción (la del proveedor sirve)</label><textarea id="arDesc" rows="3" placeholder="Qué es, material, medidas, qué incluye">${esc(datos.descripcion)}</textarea>
        <label>Fotos del producto (hasta 6; sirven las del proveedor)</label>
        <div class="ar-fotos" id="arFotos">${fotosHTML()}</div>
        <label class="est-btn chico ar-subir"><i data-lucide="image-plus"></i> Subir fotos<input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onchange="arFotos(this.files); this.value=''"></label>
        <details class="ar-mas" ${datos.precio || datos.colores || datos.quien ? "open" : ""}>
          <summary>Más datos (opcional): precio, oferta, colores y a quién le habla</summary>
          <div class="est-row">
            <div><label>Precio</label><input id="arPrecio" inputmode="numeric" placeholder="Ej: 139900" value="${esc(datos.precio || "")}"></div>
            <div><label>Precio antes (tachado)</label><input id="arAntes" inputmode="numeric" placeholder="Opcional" value="${esc(datos.precioAntes || "")}"></div>
          </div>
          <div class="est-row">
            <div><label>Oferta</label><select id="arOferta"><option value="descuento">Precio normal / descuento</option><option value="2x1" ${datos.oferta === "2x1" ? "selected" : ""}>2x1 (compra 1 y lleva 2)</option></select></div>
            <div><label>País</label><select id="arPais"><option value="CO">Colombia</option><option value="EC" ${datos.pais === "EC" ? "selected" : ""}>Ecuador</option></select></div>
          </div>
          <label class="est-check"><input type="checkbox" id="arEnvio" ${datos.envioGratis ? "checked" : ""}> Envío gratis (solo si es verdad)</label>
          <label>Colores (separados por coma)</label><input id="arColores" placeholder="Ej: Negro, Rosado, Beige" maxlength="200" value="${esc(datos.colores)}">
          <label>¿Quién lo compra?</label><input id="arQuien" placeholder="Ej: mujer de 25 a 35 años que trabaja en oficina" maxlength="200" value="${esc(datos.quien)}">
          <label>¿Qué problema le resuelve?</label><input id="arProblema" placeholder="Ej: carga todo en un bolso que le cansa el hombro" maxlength="250" value="${esc(datos.problema)}">
          <input type="hidden" id="arTipo" value="producto">
        </details>
      </div>
    </div>

    <div class="est-card">
      <h3>2. Elige los anuncios</h3>
      <p class="est-muted">Dale <b>Mezcla automática</b> (estructuras distintas: máximo 40% con precio, al menos 1 de cada 3 sin persona) o márcalas a mano.</p>
      <div class="est-ad-ops">
        <span class="est-muted">¿Cuántos?</span>${[3, 5, 8, 10].map(n => `<button class="est-chip-btn ${cuantos === n ? "activo" : ""}" onclick="arCuantos(${n})">${n}</button>`).join("")}
        <span class="est-muted">Con precio:</span>${[["0", "0"], ["1", "1"], ["2", "2"], ["mitad", "La mitad"]].map(([k, t]) => `<button class="est-chip-btn ${conPrecio === k ? "activo" : ""}" onclick="arConPrecio('${k}')">${t}</button>`).join("")}
        <label class="est-muted">Fecha especial <select onchange="arFecha(this.value)">${Object.entries(FECHAS_AD).map(([k, t]) => `<option value="${k}" ${fecha === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <button class="est-btn primary" onclick="arMezcla()"><i data-lucide="shuffle"></i> Mezcla automática</button>
      </div>
      <div class="est-ad-grid est-ad-grid-18">
        ${Object.entries(RECETAS_AD).map(([k, e]) => `
          <button class="est-ad-op ${sel.has(k) ? "sel" : ""} ${(e.conFecha && !fecha) || k === "e10" ? "apagado" : ""}" title="${esc(e.desc)}" onclick="arSel('${k}')">
            <span class="est-ad-mini-img"><img src="/api/anuncios/referencia/${k}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"></span>
            <span><b>${e.cod}</b> ${esc(e.nombre)}</span>
            <span class="est-ad-tags">${TAGS_AD(e).map(t => `<em>${t}</em>`).join("")}${sel.has(k) && pl[k] ? `<em class="precio">$ en este</em>` : ""}</span>
          </button>`).join("")}
      </div>
      <div class="est-ad-ops">
        <span class="est-muted">Formato:</span>
        ${Object.entries(FORMATOS_AD).map(([k, f]) => `<button class="est-chip-btn ${formato === k ? "activo" : ""}" onclick="arFormato('${k}')"><b>${k}</b> ${f.uso}</button>`).join("")}
        <span class="est-muted">${lista.length} marcadas · ${Object.values(pl).filter(Boolean).length} con precio</span>
        <button id="arPreparar" class="est-btn primary" onclick="arPreparar()" ${lista.length && !ocupado ? "" : "disabled"}><i data-lucide="list-checks"></i> Preparar ${lista.length || ""} anuncio${lista.length === 1 ? "" : "s"}</button>
      </div>
    </div>

    ${ads.length ? `
    <div class="est-card">
      <div class="est-card-row">
        <h3>3. Tus anuncios</h3>
        <div class="est-actions">
          ${sinImg.length ? `<button id="arTodos" class="est-btn primary" onclick="arGenerarTodos()" ${ocupado ? "disabled" : ""}><i data-lucide="wand-sparkles"></i> Generar todos (${sinImg.length}, ~$${(sinImg.length * costo()).toFixed(2)} USD)</button>` : ""}
          ${ads.some(a => a.versiones.length) ? `<button class="est-btn" onclick="arBajarTodos()"><i data-lucide="download"></i> Descargar todos</button>` : ""}
          <button class="est-btn ghost" onclick="arLimpiar()">Empezar de nuevo</button>
        </div>
      </div>
      <div class="est-ads">${ads.map((a, i) => tarjeta(a, i)).join("")}</div>
    </div>` : ""}
  </div>`;
  iconos();
}
function fotosHTML() {
  return fotos.map((f, i) => `<div class="ar-foto"><img src="${f}" alt="Foto ${i + 1}"><button onclick="arQuitarFoto(${i})" title="Quitar">✕</button></div>`).join("");
}
function tarjeta(a, i) {
  const e = RECETAS_AD[a.estructura];
  const t = a.titular;
  const ult = a.versiones[a.versiones.length - 1];
  return `
  <article class="est-sec est-ad ${a.versiones.length ? "hecha" : ""}">
    <div class="est-sec-info">
      <select class="est-variante" onchange="arEstructura(${i}, this.value)">${Object.entries(RECETAS_AD).map(([k, r]) => `<option value="${k}" ${k === a.estructura ? "selected" : ""}>${r.cod} · ${esc(r.nombre)}</option>`).join("")}</select>
      <div class="est-sec-tags">
        <span class="est-chip">${esc(a.formato)}</span>
        <label class="est-check"><input type="checkbox" ${a.precio ? "checked" : ""} ${precioObligatorio(e) || !precioPosible(e) || !datos.precio ? "disabled" : ""} onchange="arPrecioUno(${i}, this.checked)"> Con precio</label>
      </div>
    </div>
    <div class="est-titulares">
      <div class="est-card-row"><b>Titular</b>${t ? `<span class="est-tit-elegido">"${esc(t.l1)}" / <span>"${esc(t.l2 || "")}"</span></span>` : `<span class="est-hint">sin titular</span>`}</div>
      ${(a.titulares || []).length ? `<div class="est-tit-opciones">${a.titulares.map((o, k) => `<button class="est-tit ${t && o.l1 === t.l1 && o.l2 === t.l2 ? "on" : ""}" onclick="arTitular(${i}, ${k})"><span>${esc(o.l1)}</span><span class="l2">${esc(o.l2 || "")}</span></button>`).join("")}</div>` : ""}
      <button class="est-btn chico" onclick="arOtrosTitulares(${i})"><i data-lucide="sparkles"></i> ${(a.titulares || []).length ? "Otros titulares" : "Proponer titulares"}</button>
    </div>
    <div class="est-imgs est-ad-imgs">
      ${[...a.versiones].reverse().map((v, k) => `<div class="est-img ${v.revision && !v.revision.ok ? "mala" : ""}">
        <a href="${v.imagen}" target="_blank" rel="noopener"><img src="${v.imagen}" alt="Anuncio"></a>
        <a class="est-img-bajar" href="${v.imagen}" download="anuncio-${e?.cod || ""}-${a.versiones.length - k}.jpg" title="Descargar">⬇</a>
        <button title="Quitar" onclick="arQuitarVersion(${i}, ${a.versiones.length - 1 - k})">✕</button>
        ${v.revision ? (v.revision.ok ? `<span class="est-img-rev ok">✓ OK</span>` : `<span class="est-img-rev mal" title="${esc((v.revision.problemas || []).map(p => p.texto).join("\n"))}">⚠ Revisar</span>`) : ""}
      </div>`).join("")}
      ${a.creando ? `<div class="est-img add ia ocupado"><span class="est-spin"></span><span>Creando… (hasta 1 min)</span></div>`
        : `<button class="est-img add ia" onclick="arImagen(${i})"><i data-lucide="${a.versiones.length ? "refresh-cw" : "wand-sparkles"}"></i><span>${a.versiones.length ? "Regenerar" : "Crear imagen"}</span><small>~$${costo().toFixed(2)} USD</small></button>`}
    </div>
    ${ult?.revision && !ult.revision.ok ? `<div class="est-alert warn est-rev-lista"><b>⚠ La revisión encontró:</b><ul>${ult.revision.problemas.map(p => `<li>${esc(p.texto)}</li>`).join("")}</ul></div>` : ""}
    <div class="est-sec-actions"><button class="est-btn ghost danger" title="Quitar anuncio" onclick="arQuitar(${i})"><i data-lucide="x"></i></button></div>
  </article>`;
}
const repintar = () => { leerProducto(); render(); };

window.arFotos = async (files) => {
  leerProducto();
  for (const f of [...(files || [])].filter(f => /^image\//.test(f.type))) {
    if (fotos.length >= 6) { avisar("Máximo 6 fotos", "error"); break; }
    try { fotos.push(await achicar(f)); } catch (e) { avisar(e.message, "error"); }
  }
  render();
};
window.arQuitarFoto = (i) => { leerProducto(); fotos.splice(i, 1); render(); };
window.arCuantos = (n) => { cuantos = n; repintar(); };
window.arConPrecio = (k) => { conPrecio = k; preciosMezcla = null; repintar(); };
window.arFecha = (v) => { fecha = FECHAS_AD[v] !== undefined ? v : ""; if (!fecha) sel.delete("e12"); repintar(); };
window.arFormato = (f) => { formato = FORMATOS_AD[f] ? f : "4:5"; repintar(); };
window.arSel = (k) => {
  leerProducto();
  if (k === "e10") return avisar("La tabla de packs necesita paquetes de 1, 2 y 3 unidades: úsala desde Desarrollo", "error");
  if (RECETAS_AD[k]?.conFecha && !fecha && !sel.has(k)) return avisar("Elige primero una fecha especial", "error");
  if (sel.has(k)) sel.delete(k); else if (sel.size < 10) sel.add(k); else return avisar("Máximo 10 a la vez", "error");
  preciosMezcla = null; render();
};
window.arMezcla = () => {
  leerProducto();
  const m = mezclarAds({ n: cuantos, conPrecio: datos.precio ? conPrecio : 0, fecha, hayDolor: hayDolor(), hayPaquetes: hayPaquetes() });
  sel = new Set(m.map(x => x.estructura));
  preciosMezcla = Object.fromEntries(m.map(x => [x.estructura, x.precio]));
  render();
};
function validar() {
  const p = leerProducto();
  if (!p.nombre) { avisar("Escribe el nombre del producto", "error"); return null; }
  if (!fotos.length) { avisar("Sube al menos una foto del producto", "error"); return null; }
  return p;
}
const tandaLigera = () => ads.map(a => ({ id: a.id, estructura: a.estructura, precio: a.precio, fecha: a.fecha }));
async function pedirTitulares(lista) {
  const producto = leerProducto();
  const { titulares } = await api("POST", "/api/anuncios-rapidos/titulares", { producto: { ...producto, fotos: [] }, ads: lista.map(a => ({ id: a.id, estructura: a.estructura, fecha: a.fecha })) });
  for (const a of lista) if (titulares[a.id]?.length) { a.titulares = titulares[a.id]; a.titular = a.titular || titulares[a.id][0]; }
}
window.arPreparar = async () => {
  if (!validar()) return;
  const lista = [...sel];
  const pl = plan(lista);
  const nuevos = lista.map(k => ({ id: Math.random().toString(36).slice(2, 10), estructura: k, precio: !!pl[k] && !!datos.precio, fecha: k === "e12" ? fecha : "", formato, titular: null, titulares: [], versiones: [], creando: false }));
  ads = [...ads, ...nuevos].slice(-12);
  sel = new Set(); preciosMezcla = null;
  ocupado = true; render();
  const b = $("arTodos"); if (b) b.innerHTML = `<span class="est-spin"></span> Pensando titulares...`;
  try { await pedirTitulares(nuevos); avisar("Revisa el titular de cada uno y dale «Generar todos»"); }
  catch (e) { avisar(e.message, "error"); }
  ocupado = false; render();
};
window.arTitular = (i, k) => { leerProducto(); ads[i].titular = ads[i].titulares[k]; render(); };
window.arOtrosTitulares = async (i) => {
  if (!validar()) return;
  try { ads[i].titular = null; await pedirTitulares([ads[i]]); } catch (e) { avisar(e.message, "error"); }
  render();
};
window.arPrecioUno = (i, v) => { leerProducto(); ads[i].precio = !!v; render(); };
window.arEstructura = async (i, k) => {
  leerProducto();
  const e = RECETAS_AD[k]; if (!e) return;
  Object.assign(ads[i], { estructura: k, precio: precioObligatorio(e) ? !!datos.precio : precioPosible(e) ? ads[i].precio : false, fecha: k === "e12" ? fecha : "", titular: null, titulares: [] });
  render();
  try { await pedirTitulares([ads[i]]); } catch (e2) { avisar(e2.message, "error"); }
  render();
};
window.arQuitar = (i) => { leerProducto(); ads.splice(i, 1); render(); };
window.arQuitarVersion = (i, k) => { leerProducto(); ads[i].versiones.splice(k, 1); render(); };
window.arLimpiar = () => {
  if (ads.some(a => a.versiones.length) && !confirm("¿Borrar estos anuncios? Si no los descargaste, se pierden.")) return;
  leerProducto(); ads = []; render();
};

async function crear(i) {
  const a = ads[i];
  const producto = leerProducto();
  a.creando = true; render();
  try {
    const r = await api("POST", "/api/anuncios-rapidos/imagen", {
      producto, ads: tandaLigera(), version: a.versiones.length,
      ad: { id: a.id, estructura: a.estructura, precio: a.precio, fecha: a.fecha, formato: a.formato, titular: a.titular }
    });
    a.versiones.push({ imagen: r.imagen, revision: r.revision });
    gasto = r.gasto || gasto;
    return r.revision;
  } finally { a.creando = false; render(); }
}
window.arImagen = async (i) => {
  if (!validar() || ads[i].creando) return;
  if (!confirm(`¿Crear ${ads[i].versiones.length ? "otra versión de este anuncio" : "este anuncio"}? Unos $${costo().toFixed(2)} USD.`)) return;
  try { const rev = await crear(i); if (rev && !rev.ok) avisar("Salió con ⚠: mira lo que encontró la revisión", "error"); } catch (e) { avisar(e.message, "error"); }
};
window.arGenerarTodos = async () => {
  if (!validar() || ocupado) return;
  const ids = ads.map((a, i) => (a.versiones.length ? -1 : i)).filter(i => i >= 0);
  if (!ids.length) return;
  if (!confirm(`Se van a crear ${ids.length} anuncio${ids.length === 1 ? "" : "s"}, unos $${(ids.length * costo()).toFixed(2)} USD. ¿Seguir?`)) return;
  ocupado = true;
  let ok = 0, malas = 0;
  for (const i of ids) {
    try { const rev = await crear(i); ok++; if (rev && !rev.ok) malas++; }
    catch (e) { avisar(e.message, "error"); if (/límite/i.test(e.message)) break; }
  }
  ocupado = false; render();
  if (ok) avisar(`${ok} anuncio${ok === 1 ? "" : "s"} listo${ok === 1 ? "" : "s"} ✓${malas ? ` · ${malas} con ⚠` : ""}. Descárgalos antes de salir.`, malas ? "error" : "ok");
};
window.arBajarTodos = async () => {
  let n = 0;
  for (const a of ads) for (const [k, v] of a.versiones.entries()) {
    const link = document.createElement("a");
    link.href = v.imagen; link.download = `anuncio-${n + 1}-${RECETAS_AD[a.estructura]?.cod || ""}-v${k + 1}.jpg`;
    document.body.appendChild(link); link.click(); link.remove();
    n++; await new Promise(r => setTimeout(r, 350));
  }
  avisar(`${n} imagen${n === 1 ? "" : "es"} descargada${n === 1 ? "" : "s"} ✓`);
};
// Aviso al salir si hay anuncios sin descargar
window.addEventListener("beforeunload", (e) => { if (ads.some(a => a.versiones.length)) { e.preventDefault(); e.returnValue = ""; } });

registrarRuta("anuncios", async () => {
  window.marcarMenuActivo?.("anuncios");
  try { gasto = await api("GET", "/api/ia/gasto"); } catch {}
  render();
});
