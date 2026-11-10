// =============================================
// 🪧 COTIZADOR DE LETREROS — configuración en CoDropX
// Precios, textos, fotos de trabajos y reseñas reales, frenos de gasto y las cotizaciones que van llegando.
// La página pública es /cotiza/:clave y se pone dentro de una página de Shopify con el código que da esta pantalla.
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { cotizar, formatoPlata, precioCm2 } from "../core/cotizador.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");
const iconos = () => { if (window.lucide) lucide.createIcons(); };

const st = { datos: null, cfg: null, cotizaciones: null, cambios: false, guardando: false, prueba: { material: "", ancho: 60, alto: 40 } };

async function api(metodo, url, body) {
  const res = await fetch(url, { method: metodo, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || `Error ${res.status}`);
  return d;
}
function avisar(texto, tipo = "ok") {
  let el = $("ctToast");
  if (!el) { el = document.createElement("div"); el.id = "ctToast"; el.className = "ct-toast"; document.body.appendChild(el); }
  el.textContent = texto; el.className = `ct-toast ver ${tipo}`;
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("ver"), 3000);
}

const enlace = () => `${location.origin}/cotiza/${st.datos?.clave || ""}`;
const codigoShopify = () => `<div id="cdx-caja" style="width:100%;margin:0;padding:0">
<iframe id="cdx-cotiza" src="${enlace()}?modo=app" width="100%" frameborder="0" style="display:block;width:100%;height:100vh;border:0;margin:0;background:#07080d" allow="clipboard-write" title="Cotiza tu letrero"></iframe>
</div>
<script>
(function () {
  var f = document.getElementById("cdx-cotiza");
  // Alto = desde donde empieza el cotizador hasta el final de la pantalla (cabe completo, con los botones siempre a la vista)
  // En iPhone se usa la parte VISIBLE de la pantalla (sin la barra de Safari de abajo)
  function ajustar() {
    var vista = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var top = f.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
    var h = document.querySelector("header, .header-wrapper, sticky-header, .shopify-section-header-sticky");
    var menu = h && /fixed|sticky/.test(getComputedStyle(h).position) ? h.getBoundingClientRect().height : 0;
    var alto = top < vista * 0.5 ? vista - top : vista - menu - 10;
    f.style.height = Math.max(420, Math.round(alto)) + "px";
  }
  ajustar();
  window.addEventListener("load", ajustar);
  setTimeout(ajustar, 600);
  setTimeout(ajustar, 1500);
  window.addEventListener("resize", ajustar);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", ajustar);
  window.addEventListener("message", function (e) {
    if (e.origin !== "${location.origin}" || !e.data) return;
    if (typeof e.data.cdxIr === "string" && /^https:\/\//.test(e.data.cdxIr)) { f.contentWindow.postMessage({ cdxVoy: true }, e.origin); window.location.href = e.data.cdxIr; }
    // Al cambiar de paso: si la tienda quedó corrida, volver a dejar el cotizador justo debajo del menú
    if (e.data.cdxArriba) {
      var h = document.querySelector("header, .header-wrapper, sticky-header, .shopify-section-header-sticky");
      var menu = h && /fixed|sticky/.test(getComputedStyle(h).position) ? h.getBoundingClientRect().height : 0;
      var top = f.getBoundingClientRect().top;
      if (Math.abs(top - menu) > 4) window.scrollTo({ top: Math.max(0, top + (window.pageYOffset || 0) - menu), behavior: "smooth" });
    }
  });
})();
</script>`;

function marcarCambio() {
  st.cambios = true;
  const b = $("ctGuardar"); if (b) { b.disabled = false; b.textContent = "Guardar cambios"; }
  const p = $("ctPrueba"); if (p) p.innerHTML = pruebaHTML();
}

// Tabla editable de opciones (materiales, luces, dónde va, montaje)
// Foto de ejemplo de una opción (dónde va, forma, luz, montaje): sale en la tarjeta de la opción
function fotoOpcion(grupo, id) {
  const ej = (st.datos.galeria || []).find(g => g.tipo === "ejemplo" && (g.grupo || "materiales") === grupo && g.material === id);
  return `<span class="ct-foto-op">
    <label title="${ej ? "Cambiar foto" : "Subir foto de ejemplo"}">${ej ? `<img src="${esc(ej.url)}" alt="">` : `<i data-lucide="image-plus"></i>`}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="ctEjemploOp('${grupo}','${esc(id)}', this.files[0])"></label>
    ${ej ? `<button class="ct-link" onclick="ctBorrarFoto('${esc(ej.id)}')">Quitar</button>` : ""}</span>`;
}
window.ctEjemploOp = async (grupo, id, file) => {
  if (!file) return;
  try {
    const d = await api("POST", "/api/cotizador/galeria", { tipo: "ejemplo", grupo, material: id, dataUrl: await achicar(file) });
    st.datos.galeria = d.galeria; render(); avisar("Foto de ejemplo guardada");
  } catch (e) { avisar(e.message, "error"); }
};

function tablaOpciones(grupo, titulo, ayuda, campos) {
  const filas = st.cfg[grupo] || [];
  return `
  <section class="ct-card">
    <div class="ct-card-head"><h3>${titulo}</h3><small>${ayuda}</small></div>
    <div class="ct-scroll"><table class="ct-tabla">
      <thead><tr><th>Nombre</th><th>Descripción (la ve el cliente)</th><th class="n">Foto de ejemplo</th>${campos.map(c => `<th class="n">${c.t}</th>`).join("")}<th></th></tr></thead>
      <tbody>${filas.map((x, i) => `<tr>
        <td><input value="${esc(x.nombre)}" oninput="ctCampo('${grupo}',${i},'nombre',this.value)"></td>
        <td><input class="ancho" value="${esc(x.desc)}" oninput="ctCampo('${grupo}',${i},'desc',this.value)"></td>
        <td class="n">${fotoOpcion(grupo, x.id)}</td>
        ${campos.map(c => c.tipo === "bool"
          ? `<td class="n"><input type="checkbox" ${x[c.k] ? "checked" : ""} onchange="ctCampo('${grupo}',${i},'${c.k}',this.checked)"></td>`
          : `<td class="n"><input type="number" min="0" step="any" class="num" value="${x[c.k] ?? 0}" oninput="ctCampo('${grupo}',${i},'${c.k}',Number(this.value)||0)"></td>`).join("")}
        <td><button class="ct-icono" title="Quitar" onclick="ctQuitar('${grupo}',${i})"><i data-lucide="trash-2"></i></button></td>
      </tr>`).join("")}</tbody>
    </table></div>
    <button class="ct-btn claro chico" onclick="ctAgregar('${grupo}')"><i data-lucide="plus"></i> Agregar</button>
  </section>`;
}

function pruebaHTML() {
  const p = st.prueba;
  if (!st.cfg.materiales.some(m => m.id === p.material)) p.material = st.cfg.materiales[0]?.id || "";
  // Las mismas preguntas que ve el cliente, para comparar exacto con la página
  for (const [k, g] of [["ubicacion", "ubicaciones"], ["forma", "formas"], ["luz", "luces"], ["montaje", "montajes"]]) if (!(st.cfg[g] || []).some(x => x.id === p[k])) p[k] = st.cfg[g]?.[0]?.id || "";
  const mat = st.cfg.materiales.find(m => m.id === p.material);
  const r = cotizar(st.cfg, { material: p.material, ancho: p.ancho, alto: p.alto, luz: p.luz, ubicacion: p.ubicacion, forma: p.forma, montaje: p.montaje, cantidad: 1 });
  const sel = (k, g) => (st.cfg[g] || []).length > 1 ? `<select onchange="ctPrueba('${k}',this.value)">${st.cfg[g].map(x => `<option value="${esc(x.id)}" ${x.id === p[k] ? "selected" : ""}>${esc(x.nombre)}</option>`).join("")}</select>` : "";
  const f = (v) => formatoPlata(v, st.cfg.moneda);
  const fila = (t, v, cls = "") => `<tr class="${cls}"><td>${t}</td><td>${f(v)}</td></tr>`;
  return `<div class="ct-prueba-fila">
      <select onchange="ctPrueba('material',this.value)">${st.cfg.materiales.map(m => `<option value="${esc(m.id)}" ${m.id === p.material ? "selected" : ""}>${esc(m.nombre)}</option>`).join("")}</select>
      <label>Ancho <input type="number" value="${p.ancho}" onchange="ctPrueba('ancho',this.value)"> cm</label>
      <label>Alto <input type="number" value="${p.alto}" onchange="ctPrueba('alto',this.value)"> cm</label>
    </div>
    <div class="ct-prueba-fila" style="margin-top:8px">${sel("ubicacion", "ubicaciones")}${sel("forma", "formas")}${mat?.conLuz ? sel("luz", "luces") : ""}${sel("montaje", "montajes")}</div>
    ${st.cambios ? `<p class="ct-aviso-amarillo">⚠ Tienes cambios sin guardar: este precio ya los incluye, pero la página del cliente todavía usa los precios anteriores. Dale <b>Guardar cambios</b> y recarga la página del cliente.</p>` : ""}
    ${r ? `<table class="ct-excel">
      ${r.detalle.laminas.map(x => fila(esc(x.nombre), x.valor)).join("")}
      ${fila(esc(r.detalle.laser.nombre), r.detalle.laser.valor)}
      ${r.detalle.otros.map(x => fila(esc(x.nombre), x.valor)).join("")}
      ${fila("Materiales", r.materiales, "sub")}
      ${fila(`Mano de obra (${st.cfg.manoObraPct}%)`, r.manoObra)}
      ${fila(`Ganancia del producto (${st.cfg.gananciaProductoPct}%)`, r.gananciaProducto)}
      ${fila("FABRICACIÓN", r.fabricacion, "fab")}
      ${r.recargoLuz ? fila(`Luz: ${esc(r.luz.nombre)}`, r.recargoLuz) : ""}${r.recargoUbicacion ? fila(esc(r.ubicacion.nombre), r.recargoUbicacion) : ""}${r.recargoForma ? fila(`Forma: ${esc(r.forma.nombre)}`, r.recargoForma) : ""}${r.precioMontaje ? fila(esc(r.montaje.nombre), r.precioMontaje) : ""}
      ${fila("Pauta", r.pauta)}
      ${fila("Flete", r.flete)}
      ${fila(`Tu ganancia (${st.cfg.gananciaPct}%)`, r.ganancia)}
      ${fila("PRECIO AL CLIENTE", r.total, "tot")}
      ${st.cfg.anticipoPct > 0 && st.cfg.anticipoPct < 100 ? fila(`Anticipo ${st.cfg.anticipoPct}%`, r.anticipo) : ""}
    </table><p class="ct-mini">Elige las mismas opciones que eligió el cliente para comparar. El cliente NO ve este desglose: solo el precio final.</p>` : ""}`;
}

// ---------- Costos como en el Excel ----------
function costosHTML() {
  const c = st.cfg, f = (v) => formatoPlata(v, c.moneda);
  const num = (ruta, v, paso = "any") => `<input type="number" min="0" step="${paso}" class="num" value="${v}" oninput="ctNum('${ruta}', this.value)">`;
  return `
  <section class="ct-card">
    <div class="ct-card-head"><h3>1. Láminas</h3><small>Precio de la lámina completa y sus m² · CoDropX saca el precio del cm²</small></div>
    <div class="ct-scroll"><table class="ct-tabla"><thead><tr><th>Lámina</th><th class="n">Precio lámina</th><th class="n">m²</th><th class="n">$ por cm²</th><th></th></tr></thead><tbody>
      ${c.laminas.map((l, i) => `<tr><td><input value="${esc(l.nombre)}" oninput="ctCampo('laminas',${i},'nombre',this.value)"></td><td class="n">${num(`laminas.${i}.precio`, l.precio, 1000)}</td><td class="n">${num(`laminas.${i}.m2`, l.m2, 0.01)}</td><td class="n"><b id="ctCm2_${i}">${precioCm2(l).toFixed(1)}</b></td><td><button class="ct-icono" title="Quitar" onclick="ctQuitar('laminas',${i})"><i data-lucide="trash-2"></i></button></td></tr>`).join("")}
    </tbody></table></div>
    <button class="ct-btn claro chico" onclick="ctAgregar('laminas')"><i data-lucide="plus"></i> Agregar lámina</button>
  </section>

  <section class="ct-card">
    <div class="ct-card-head"><h3>2. Tipos de letrero</h3><small>Lo que elige el cliente · marca qué láminas lleva (cada una del tamaño del letrero)</small></div>
    <div class="ct-scroll"><table class="ct-tabla"><thead><tr><th>Nombre</th><th>Descripción (la ve el cliente)</th>${c.laminas.map(l => `<th class="n">${esc(l.nombre.split(" ").slice(0, 2).join(" "))}</th>`).join("")}${c.costos.filter(x => x.opcional).map(x => `<th class="n">${esc(x.nombre)}</th>`).join("")}<th class="n">Lleva luz</th><th class="n" title="La IA redibuja el logo con pocas líneas de tubo, sin detalles finos">Neón (simplifica)</th><th class="n" title="El cliente elige el color del fondo y del logo">Pide colores</th><th></th></tr></thead><tbody>
      ${c.materiales.map((m, i) => `<tr><td><input value="${esc(m.nombre)}" oninput="ctCampo('materiales',${i},'nombre',this.value)"></td><td><input class="ancho" value="${esc(m.desc)}" oninput="ctCampo('materiales',${i},'desc',this.value)"></td>
        ${c.laminas.map(l => `<td class="n"><input type="checkbox" ${m.capas.includes(l.id) ? "checked" : ""} onchange="ctCapa(${i},'${esc(l.id)}',this.checked)"></td>`).join("")}
        ${c.costos.filter(x => x.opcional).map(x => `<td class="n"><input type="checkbox" ${(m.extras || []).includes(x.id) ? "checked" : ""} onchange="ctExtra(${i},'${esc(x.id)}',this.checked)"></td>`).join("")}
        <td class="n"><input type="checkbox" ${m.conLuz ? "checked" : ""} onchange="ctCampo('materiales',${i},'conLuz',this.checked)"></td>
        <td class="n"><input type="checkbox" ${m.neon ? "checked" : ""} onchange="ctCampo('materiales',${i},'neon',this.checked)"></td>
        <td class="n"><input type="checkbox" ${m.pideColores ? "checked" : ""} onchange="ctCampo('materiales',${i},'pideColores',this.checked)"></td>
        <td><button class="ct-icono" title="Quitar" onclick="ctQuitar('materiales',${i})"><i data-lucide="trash-2"></i></button></td></tr>`).join("")}
    </tbody></table></div>
    <button class="ct-btn claro chico" onclick="ctAgregar('materiales')"><i data-lucide="plus"></i> Agregar tipo</button>
  </section>

  <section class="ct-card">
    <div class="ct-card-head"><h3><i data-lucide="image"></i> Cómo se ve cada tipo</h3><small>Sube una foto REAL de un letrero de ese tipo que ya hicieron: sale en la opción y la IA copia ese acabado (material, grabado, luz) con el diseño del cliente</small></div>
    <div class="ct-ejemplos">${c.materiales.map((m, i) => {
      const ej = (st.datos.galeria || []).find(g => g.tipo === "ejemplo" && (g.grupo || "materiales") === "materiales" && g.material === m.id);
      return `<div class="ct-ejemplo">
        <label class="ct-par-foto">${ej ? `<img src="${esc(ej.url)}" alt="">` : `<i data-lucide="image-plus"></i><span>Foto de ejemplo</span>`}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="ctEjemplo('${esc(m.id)}', this.files[0])"></label>
        <div><b>${esc(m.nombre)}</b>${ej ? ` <button class="ct-link" onclick="ctBorrarFoto('${esc(ej.id)}')">Quitar foto</button>` : ""}
          <textarea rows="4" placeholder="Cómo se ve este tipo (para la IA)" oninput="ctCampo('materiales',${i},'aspecto',this.value)">${esc(m.aspecto || "")}</textarea></div>
      </div>`;
    }).join("")}</div>
    <button class="ct-btn claro chico" style="margin-top:10px" onclick="ctAgregar('materiales')"><i data-lucide="plus"></i> Agregar categoría</button>
    <p class="ct-mini">La categoría nueva aparece también en "Tipos de letrero": ahí le pones el nombre, qué láminas lleva y si lleva luz. Si cambias el texto, dale Guardar. La foto se guarda sola al subirla. Cada maqueta con foto de ejemplo cuesta unos US$0,01 más.</p>
  </section>

  <section class="ct-card">
    <div class="ct-card-head"><h3>3. Láser</h3><small>Minutos = preparación + minutos por cada metro de contorno del letrero (la máquina recorre el borde)</small></div>
    <div class="ct-grid">
      <label>Precio del minuto ($)${num("laser.precioMinuto", c.laser.precioMinuto, 100)}</label>
      <label>Minutos de preparación${num("laser.minFijos", c.laser.minFijos, 1)}</label>
      <label>Minutos por cada metro de contorno${num("laser.minPorMetro", c.laser.minPorMetro, 1)}</label>
    </div>
    <p class="ct-mini">${[[30, 30], [60, 40], [100, 80]].map(([an, al]) => { const m = c.laser.minFijos + 2 * (an + al) / 100 * c.laser.minPorMetro; return `${an} × ${al} cm (${(2 * (an + al) / 100).toLocaleString("es-CO")} m de contorno): ${Math.round(m)} min = ${f(m * c.laser.precioMinuto)}`; }).join(" · ")}</p>
  </section>

  <section class="ct-card">
    <div class="ct-card-head"><h3>4. Otros costos por letrero</h3><small>Valor para uno de 30 × 30 cm · "sube con el tamaño" = proporcional al área · "sube con el borde" = proporcional al contorno</small></div>
    <div class="ct-scroll"><table class="ct-tabla"><thead><tr><th>Costo</th><th class="n">Valor (30 × 30)</th><th>Cómo cambia</th><th class="n">Solo si lleva luz</th><th class="n" title="Solo lo cobran los tipos que lo tengan marcado en Tipos de letrero">Solo en tipos marcados</th><th></th></tr></thead><tbody>
      ${c.costos.map((x, i) => `<tr><td><input value="${esc(x.nombre)}" oninput="ctCampo('costos',${i},'nombre',this.value)"></td><td class="n">${num(`costos.${i}.valor`, x.valor, 500)}</td>
        <td><select onchange="ctCampo('costos',${i},'modo',this.value)">${[["fijo", "Fijo"], ["area", "Sube con el tamaño"], ["contorno", "Sube con el borde"]].map(([k, t]) => `<option value="${k}" ${x.modo === k ? "selected" : ""}>${t}</option>`).join("")}</select></td>
        <td class="n"><input type="checkbox" ${x.soloLuz ? "checked" : ""} onchange="ctCampo('costos',${i},'soloLuz',this.checked)"></td>
        <td class="n"><input type="checkbox" ${x.opcional ? "checked" : ""} onchange="ctCampo('costos',${i},'opcional',this.checked);ctRepintar()"></td>
        <td><button class="ct-icono" title="Quitar" onclick="ctQuitar('costos',${i})"><i data-lucide="trash-2"></i></button></td></tr>`).join("")}
    </tbody></table></div>
    <button class="ct-btn claro chico" onclick="ctAgregar('costos')"><i data-lucide="plus"></i> Agregar costo</button>
  </section>

  <section class="ct-card">
    <div class="ct-card-head"><h3>5. Porcentajes, pauta, flete y tu ganancia</h3><small>El precio final sale de aquí</small></div>
    <div class="ct-grid">
      <label>Mano de obra (% de materiales)${num("manoObraPct", c.manoObraPct, 1)}</label>
      <label>Ganancia del producto (%)${num("gananciaProductoPct", c.gananciaProductoPct, 1)}</label>
      <label>Tu ganancia final (%)${num("gananciaPct", c.gananciaPct, 1)}</label>
    </div>
    <div class="ct-scroll" style="margin-top:12px"><table class="ct-tabla"><thead><tr><th class="n">Si el precio final es hasta</th><th class="n">Pauta $</th><th class="n">o pauta % del precio</th><th class="n">Flete $</th><th></th></tr></thead><tbody>
      ${c.tramos.map((t, i) => `<tr><td class="n">${t.hasta ? num(`tramos.${i}.hasta`, t.hasta, 10000) : `<input class="num" value="Sin tope" disabled>`}</td><td class="n">${num(`tramos.${i}.pauta`, t.pauta, 1000)}</td><td class="n">${num(`tramos.${i}.pautaPct`, t.pautaPct, 1)}</td><td class="n">${num(`tramos.${i}.flete`, t.flete, 1000)}</td>
        <td>${c.tramos.length > 1 ? `<button class="ct-icono" title="Quitar" onclick="ctQuitar('tramos',${i})"><i data-lucide="trash-2"></i></button>` : ""}</td></tr>`).join("")}
    </tbody></table></div>
    <button class="ct-btn claro chico" onclick="ctAgregarTramo()"><i data-lucide="plus"></i> Agregar tramo</button>
    <p class="ct-mini">La pauta usa el mayor entre el valor en $ y el %. El último tramo es "sin tope". Tu ganancia se calcula sobre fabricación + pauta + flete.</p>
  </section>`;
}

function galeriaHTML(tipo, titulo, ayuda) {
  const fotos = (st.datos.galeria || []).filter(g => g.tipo === tipo);
  return `<div class="ct-gal">
    <div class="ct-card-head"><h3>${titulo}</h3><small>${ayuda}</small></div>
    <div class="ct-gal-grid">
      ${fotos.map(g => `<figure><img src="${esc(g.url)}" alt=""><figcaption>${esc(g.titulo || "")}</figcaption><button class="ct-icono" title="Quitar" onclick="ctBorrarFoto('${esc(g.id)}')"><i data-lucide="x"></i></button></figure>`).join("")}
      <label class="ct-gal-subir"><i data-lucide="image-plus"></i><span>Subir foto</span><input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="ctSubirFoto('${tipo}', this.files[0])"></label>
    </div></div>`;
}

// Carrusel "Tu logo → Así quedó": cada par es la foto del logo que mandó el cliente y la foto del letrero terminado
const nuevoPar = { antes: "", despues: "", titulo: "", real: true };
function paresHTML() {
  const pares = (st.datos.galeria || []).filter(g => g.tipo === "par");
  return `<div class="ct-gal">
    <div class="ct-card-head"><h3>Carrusel: tu logo → así quedó</h3><small>El logo que mandó el cliente y cómo quedó. Sale de primero en la página, apenas subas el primero.</small></div>
    <div class="ct-pares">
      ${pares.map(g => `<div class="ct-par"><img src="${esc(g.urlAntes)}" alt=""><span>→</span><img src="${esc(g.url)}" alt=""><small>${g.real === false ? "🖼 Maqueta" : "✅ Letrero real"}${g.titulo ? ` · ${esc(g.titulo)}` : ""}</small><button class="ct-icono" title="Quitar" onclick="ctBorrarFoto('${esc(g.id)}')"><i data-lucide="x"></i></button></div>`).join("") || `<p class="ct-mini">Todavía no hay. Agrega el primero abajo.</p>`}
    </div>
    <div class="ct-par-nuevo">
      <label class="ct-par-foto">${nuevoPar.antes ? `<img src="${nuevoPar.antes}" alt="">` : `<i data-lucide="image"></i><span>1. Logo del cliente</span>`}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="ctParFoto('antes', this.files[0])"></label>
      <span class="ct-flecha">→</span>
      <label class="ct-par-foto">${nuevoPar.despues ? `<img src="${nuevoPar.despues}" alt="">` : `<i data-lucide="sparkles"></i><span>2. Cómo quedó</span>`}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="ctParFoto('despues', this.files[0])"></label>
      <div class="ct-par-acc"><select onchange="ctParReal(this.value)"><option value="1" ${nuevoPar.real ? "selected" : ""}>✅ Es foto del letrero real (dice "ASÍ QUEDÓ")</option><option value="0" ${nuevoPar.real ? "" : "selected"}>🖼 Es una maqueta hecha con IA (dice "MAQUETA")</option></select><input placeholder="Título (opcional), ej: Escudo para club" value="${esc(nuevoPar.titulo)}" oninput="ctParTitulo(this.value)"><button class="ct-btn chico" onclick="ctParGuardar()" ${nuevoPar.antes && nuevoPar.despues ? "" : "disabled"}><i data-lucide="plus"></i> Agregar al carrusel</button></div>
    </div></div>`;
}
window.ctParFoto = async (lado, file) => { if (!file) return; try { nuevoPar[lado] = await achicar(file); render(); } catch (e) { avisar(e.message, "error"); } };
window.ctParTitulo = (v) => { nuevoPar.titulo = v; };
window.ctParReal = (v) => { nuevoPar.real = v === "1"; };
window.ctParGuardar = async () => {
  try {
    const d = await api("POST", "/api/cotizador/galeria", { tipo: "par", dataUrlAntes: nuevoPar.antes, dataUrl: nuevoPar.despues, titulo: nuevoPar.titulo, real: nuevoPar.real });
    st.datos.galeria = d.galeria; nuevoPar.antes = nuevoPar.despues = nuevoPar.titulo = "";
    render(); avisar("Agregado al carrusel");
  } catch (e) { avisar(e.message, "error"); }
};
// Reseñas reales: la foto que mandó el cliente (o la captura) y, si quieres, lo que dijo, su nombre, ciudad y estrellas
const nuevaRes = { foto: "", nombre: "", ciudad: "", texto: "", estrellas: 5 };
function resenasHTML() {
  const rs = (st.datos.galeria || []).filter(g => g.tipo === "resena");
  return `<div class="ct-gal">
    <div class="ct-card-head"><h3>Reseñas reales</h3><small>Salen en tarjetas que se deslizan, también en el paso de subir el logo. Solo lo que de verdad les dijeron: nada inventado.</small></div>
    <div class="ct-res-lista">${rs.map(r => `<div class="ct-res"><img src="${esc(r.url)}" alt=""><div>${r.estrellas ? `<span class="ct-est">${"★".repeat(r.estrellas)}</span>` : ""}${r.texto ? `<p>${esc(r.texto)}</p>` : `<p class="ct-mini">Solo foto</p>`}<small>${esc([r.nombre, r.ciudad].filter(Boolean).join(" · "))}</small></div><button class="ct-icono" title="Quitar" onclick="ctBorrarFoto('${esc(r.id)}')"><i data-lucide="x"></i></button></div>`).join("") || `<p class="ct-mini">Todavía no hay reseñas.</p>`}</div>
    <div class="ct-res-nueva">
      <label class="ct-par-foto">${nuevaRes.foto ? `<img src="${nuevaRes.foto}" alt="">` : `<i data-lucide="image-plus"></i><span>Foto o captura</span>`}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="ctResFoto(this.files[0])"></label>
      <div class="ct-res-campos">
        <div class="ct-res-fila"><input placeholder="Nombre (opcional)" value="${esc(nuevaRes.nombre)}" oninput="ctRes('nombre',this.value)"><input placeholder="Ciudad (opcional)" value="${esc(nuevaRes.ciudad)}" oninput="ctRes('ciudad',this.value)">
          <select onchange="ctRes('estrellas',this.value)">${[5, 4, 3, 0].map(n => `<option value="${n}" ${Number(nuevaRes.estrellas) === n ? "selected" : ""}>${n ? "★".repeat(n) : "Sin estrellas"}</option>`).join("")}</select></div>
        <textarea rows="2" placeholder="Lo que dijo el cliente, tal cual (opcional)" oninput="ctRes('texto',this.value)">${esc(nuevaRes.texto)}</textarea>
        <button class="ct-btn chico" onclick="ctResGuardar()" ${nuevaRes.foto ? "" : "disabled"}><i data-lucide="plus"></i> Agregar reseña</button>
      </div>
    </div></div>`;
}
window.ctResFoto = async (file) => { if (!file) return; try { nuevaRes.foto = await achicar(file); render(); } catch (e) { avisar(e.message, "error"); } };
window.ctRes = (k, v) => { nuevaRes[k] = v; };
window.ctResGuardar = async () => {
  try {
    const d = await api("POST", "/api/cotizador/galeria", { tipo: "resena", dataUrl: nuevaRes.foto, nombre: nuevaRes.nombre, ciudad: nuevaRes.ciudad, texto: nuevaRes.texto, estrellas: Number(nuevaRes.estrellas) });
    st.datos.galeria = d.galeria; Object.assign(nuevaRes, { foto: "", nombre: "", ciudad: "", texto: "", estrellas: 5 });
    render(); avisar("Reseña agregada");
  } catch (e) { avisar(e.message, "error"); }
};
window.ctMarcaImg = async (campo, file) => {
  if (!file) return;
  try {
    const dataUrl = await new Promise((ok, mal) => { const l = new FileReader(); l.onload = () => ok(l.result); l.onerror = mal; l.readAsDataURL(file); });
    const d = await api("POST", "/api/cotizador/galeria", { tipo: "marca", dataUrl: /^data:image\/(png|jpeg|webp);/.test(dataUrl) && dataUrl.length < 3.9e6 ? dataUrl : await achicar(file) });
    const nueva = d.galeria.filter(g => g.tipo === "marca").pop();
    st.datos.galeria = d.galeria;
    st.cfg[campo] = `/api/cotiza/img/${nueva.id}`;
    await ctGuardar();
  } catch (e) { avisar(e.message, "error"); }
};
window.ctEjemplo = async (material, file) => {
  if (!file) return;
  try {
    const d = await api("POST", "/api/cotizador/galeria", { tipo: "ejemplo", grupo: "materiales", material, dataUrl: await achicar(file) });
    st.datos.galeria = d.galeria; render(); avisar("Foto de ejemplo guardada");
  } catch (e) { avisar(e.message, "error"); }
};
window.ctPaso = (i, k, v) => { st.cfg.pasos[i][k] = v; marcarCambio(); };
window.ctTaller = (k, v) => { st.cfg.taller[k] = v; marcarCambio(); };

// Espacio en la base de datos y limpieza de cotizaciones de prueba
let espacio = null;   // null = sin cargar · "cargando" · { filas, total, cotizacionesPrueba } · { error }
function espacioHTML() {
  if (espacio === null) {
    espacio = "cargando";
    api("GET", "/api/espacio").then(d => { espacio = d; render(); }).catch(e => { espacio = { error: e.message }; render(); });
  }
  return `<section class="ct-card">
    <div class="ct-card-head"><h3><i data-lucide="database"></i> Espacio en la base de datos</h3><small>El plan gratis de MongoDB trae 512 MB para TODO CoDropX. Si se llena, no se puede guardar nada.</small>
      <button class="ct-btn claro chico" onclick="ctEspacio()"><i data-lucide="refresh-cw"></i> Medir</button></div>
    ${espacio === "cargando" ? `<p class="ct-mini">Midiendo…</p>` : espacio?.error ? `<p class="ct-mini rojo">${esc(espacio.error)}</p>` : `
      <table class="ct-excel">${espacio.filas.map(f => `<tr><td>${esc(f.que)} <small class="ct-mini">(${f.n.toLocaleString("es-CO")})</small></td><td>${f.mb.toLocaleString("es-CO")} MB</td></tr>`).join("")}
        <tr class="sub"><td>Total de lo tuyo</td><td>${espacio.total.toLocaleString("es-CO")} MB</td></tr></table>
      <div class="ct-limpiar">
        <p class="ct-mini">Hay <b>${espacio.cotizacionesPrueba}</b> cotizaciones donde el cliente <b>no pidió</b> por WhatsApp (tus pruebas y gente que solo miró). Borrarlas libera el espacio de sus logos y maquetas. Las que sí pidieron no se tocan.</p>
        <button class="ct-btn chico peligro" onclick="ctLimpiar(0)" ${espacio.cotizacionesPrueba ? "" : "disabled"}><i data-lucide="trash-2"></i> Borrar todas las que no pidieron</button>
        <button class="ct-btn claro chico" onclick="ctLimpiar(7)" ${espacio.cotizacionesPrueba ? "" : "disabled"}>Solo las de hace más de 7 días</button>
      </div>`}
  </section>`;
}
window.ctEspacio = () => { espacio = null; render(); };
window.ctLimpiar = async (dias) => {
  if (!confirm(dias ? `¿Borrar las cotizaciones de hace más de ${dias} días donde el cliente no pidió (con su logo y maqueta)?` : "¿Borrar TODAS las cotizaciones donde el cliente no pidió (con su logo y maqueta)? Las que pidieron por WhatsApp se quedan.")) return;
  try {
    const r = await api("POST", "/api/cotizador/limpiar", { dias });
    avisar(`Listo: se borraron ${r.cotizaciones} cotizaciones y ${r.imagenes} imágenes`);
    espacio = null; st.cotizaciones = null; render();
  } catch (e) { avisar(e.message, "error"); }
};

// Tiendas de Shopify conectadas (para cobrar con su checkout)
let tiendas = null;
function tiendasPago() {
  if (tiendas === null) {
    tiendas = "cargando";
    api("GET", "/api/shopify/tiendas").then(d => { tiendas = d.tiendas || []; render(); }).catch(() => { tiendas = []; render(); });
  }
  if (tiendas === "cargando") return `<select disabled><option>Cargando…</option></select>`;
  if (!tiendas.length) return `<small class="ct-mini rojo">Conecta la tienda en Integraciones → Shopify.</small>`;
  const t = tiendas.find(x => x._id === st.cfg.tiendaPago);
  const sinPermiso = t && !(t.permisos || []).includes("write_draft_orders");
  return `<select onchange="ctCfg('tiendaPago', this.value)"><option value="">Elige la tienda…</option>${tiendas.map(x => `<option value="${esc(x._id)}" ${x._id === st.cfg.tiendaPago ? "selected" : ""}>${esc(x.nombre || x.shop)}</option>`).join("")}</select>
    ${sinPermiso ? `<small class="ct-mini rojo">A esta tienda le falta el permiso <b>write_draft_orders</b>: agrégalo en el Dev Dashboard de su app (Versions → Access scopes), dale Release, apruébalo en la tienda y en Integraciones dale Probar.</small>` : ""}`;
}

// ---------- Cotizaciones: tablero de producción con filtros ----------
const ESTADOS = [
  ["nuevo", "🆕 Nuevo"], ["falta_material", "🧱 Falta material"], ["en_produccion", "🔧 En producción"], ["listo", "✅ Listo para enviar"], ["entregado", "📦 Entregado"]
];
const nombreEstado = (e) => (ESTADOS.find(x => x[0] === e) || ESTADOS[0])[1];
const filtroCots = (() => { try { return JSON.parse(localStorage.getItem("ct_filtro") || "{}"); } catch { return {}; } })();
filtroCots.tipo ||= "pidieron"; filtroCots.orden ||= "nuevas";
let conteoEstados = {};
async function cargarCots() {
  st.cotizaciones = "cargando";
  const p = new URLSearchParams(Object.entries(filtroCots).filter(([, v]) => v));
  try {
    const res = await fetch(`/api/cotizador/cotizaciones?${p}`);
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "No se pudieron leer las cotizaciones");
    try { conteoEstados = JSON.parse(res.headers.get("X-Conteo") || "{}"); } catch { conteoEstados = {}; }
    st.cotizaciones = d;
  } catch (e) { st.cotizaciones = { error: e.message }; }
  render();
}
window.ctFiltro = (k, v) => { filtroCots[k] = v; try { localStorage.setItem("ct_filtro", JSON.stringify(filtroCots)); } catch {} cargarCots(); };
window.ctEstado = async (id, estado) => {
  try {
    const r = await api("PUT", `/api/cotizador/cotizaciones/${id}`, { estado });
    const c = st.cotizaciones.find(x => x.id === id); if (c) Object.assign(c, r);
    avisar(`Pedido marcado: ${nombreEstado(estado)}`);
    cargarCots();
  } catch (e) { avisar(e.message, "error"); }
};
window.ctNotaPedido = async (id, nota) => {
  try { await api("PUT", `/api/cotizador/cotizaciones/${id}`, { notaInterna: nota }); avisar("Nota guardada"); }
  catch (e) { avisar(e.message, "error"); }
};
window.ctBorrarCot = async (id) => {
  if (!confirm("¿Borrar este pedido con su logo y su maqueta? No se puede deshacer.")) return;
  try { await api("DELETE", `/api/cotizador/cotizaciones/${id}`); avisar("Pedido borrado"); cargarCots(); }
  catch (e) { avisar(e.message, "error"); }
};

function filtrosCotsHTML() {
  const f = filtroCots;
  const chip = (k, v, t, n) => `<button class="ct-chip ${f[k] === v || (!f[k] && !v) ? "on" : ""}" onclick="ctFiltro('${k}','${v}')">${t}${n ? ` <em>${n}</em>` : ""}</button>`;
  const total = Object.values(conteoEstados).reduce((a, b) => a + b, 0);
  return `<div class="ct-filtros">
    <div class="ct-chips">${chip("estado", "", "Todos", total)}${ESTADOS.map(([k, t]) => chip("estado", k, t, conteoEstados[k] || 0)).join("")}</div>
    <div class="ct-filtros-fila">
      <label>Mostrar<select onchange="ctFiltro('tipo', this.value)">
        <option value="pidieron" ${f.tipo === "pidieron" ? "selected" : ""}>Solo los que pidieron</option>
        <option value="miraron" ${f.tipo === "miraron" ? "selected" : ""}>Solo los que miraron</option>
        <option value="todas" ${f.tipo === "todas" ? "selected" : ""}>Todas</option></select></label>
      <label>Orden<select onchange="ctFiltro('orden', this.value)">
        <option value="nuevas" ${f.orden !== "viejas" ? "selected" : ""}>Más nuevas primero</option>
        <option value="viejas" ${f.orden === "viejas" ? "selected" : ""}>Orden de llegada (más viejas primero)</option></select></label>
      <label>Desde<input type="date" value="${esc(f.desde || "")}" onchange="ctFiltro('desde', this.value)"></label>
      <label>Hasta<input type="date" value="${esc(f.hasta || "")}" onchange="ctFiltro('hasta', this.value)"></label>
      ${f.desde || f.hasta || f.estado ? `<button class="ct-link" onclick="ctFiltro('desde','');ctFiltro('hasta','');ctFiltro('estado','')">Quitar filtros</button>` : ""}
    </div></div>`;
}

function cotizacionesHTML() {
  if (st.cotizaciones === null) cargarCots();
  if (st.cotizaciones === null || st.cotizaciones === "cargando") return `${filtrosCotsHTML()}<p class="ct-mini">Cargando…</p>`;
  if (st.cotizaciones?.error) return `${filtrosCotsHTML()}<p class="ct-mini rojo">${esc(st.cotizaciones.error)}</p>`;
  if (!st.cotizaciones.length) return `${filtrosCotsHTML()}<p class="ct-mini">No hay cotizaciones con estos filtros.</p>`;
  const nombre = (grupo, id) => st.cfg[grupo]?.find(x => x.id === id)?.nombre || id || "";
  const fecha = (d) => new Date(d).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
  return `${filtrosCotsHTML()}<div class="ct-cots">${st.cotizaciones.map((c, i) => `
    <div class="ct-cot est-${esc(c.estado)}">
      <span class="ct-num">#${i + 1}</span>
      <a href="${esc(c.maqueta || c.logo)}" target="_blank" rel="noopener"><img src="${esc(c.maqueta || c.logo)}" alt=""></a>
      <div>
        <b>${formatoPlata(c.total, c.moneda)}</b> ${c.pidio ? `<span class="ct-tag ok">${c.pago ? "fue a pagar" : "pidió"}</span>` : `<span class="ct-tag">solo miró</span>`}
        <small>${esc(nombre("materiales", c.eleccion?.material))} · ${c.eleccion?.ancho} × ${c.eleccion?.alto} cm${c.eleccion?.cantidad > 1 ? ` · ×${c.eleccion.cantidad}` : ""}</small>
        <small>${esc(nombre("ubicaciones", c.eleccion?.ubicacion))}${c.eleccion?.luz ? ` · ${esc(nombre("luces", c.eleccion.luz))}${c.eleccion?.colorFondo || c.eleccion?.colorLogo ? ` · colores: ${esc([c.eleccion.colorFondo, c.eleccion.colorLogo].filter(Boolean).join(" / "))}` : ""}${c.eleccion?.colorLuz ? ` (${esc(c.eleccion.colorLuz)})` : ""}` : ""}${c.eleccion?.forma ? ` · ${esc(nombre("formas", c.eleccion.forma))}` : ""}</small>
        <small>🕒 Llegó: ${fecha(c.creado)}${c.cambioEstado ? ` · cambió: ${fecha(c.cambioEstado)}` : ""}</small>
        ${c.notas ? `<small class="ct-nota">📝 Cliente: ${esc(c.notas)}</small>` : ""}
        ${c.error ? `<small class="rojo">⚠ No salió la maqueta: ${esc(c.error)}</small>` : ""}
        ${c.pidio ? `<select class="ct-estado" onchange="ctEstado('${esc(c.id)}', this.value)">${ESTADOS.map(([k, t]) => `<option value="${k}" ${c.estado === k ? "selected" : ""}>${t}</option>`).join("")}</select>
        <input class="ct-nota-int" placeholder="Nota interna (ej: falta acrílico espejo)" value="${esc(c.notaInterna)}" onchange="ctNotaPedido('${esc(c.id)}', this.value)">` : ""}
        <div class="ct-cot-acc">
          ${c.logo && c.maqueta ? `<a class="ct-link" href="${esc(c.logo)}" target="_blank" rel="noopener">Ver logo original</a>` : ""}
          <button class="ct-link rojo" onclick="ctBorrarCot('${esc(c.id)}')">${c.estado === "entregado" ? "Borrar (ya entregado)" : "Borrar"}</button>
        </div>
      </div>
    </div>`).join("")}</div>`;
}

function render() {
  const view = $("view");
  if (!view || !window.enPantalla("cotizador")) return;
  const c = st.cfg, g = st.datos.gasto;
  view.innerHTML = `
  <div class="ct-page">
    <header class="ct-head">
      <div><h1><i data-lucide="sparkles"></i> Cotizador de letreros</h1>
      <p>Tu cliente sube su logo, ve la maqueta hecha con IA y el precio al instante, y te pide por WhatsApp. Aquí manejas los precios y lo que ve.</p></div>
      <button class="ct-btn" id="ctGuardar" onclick="ctGuardar()" ${st.cambios ? "" : "disabled"}>${st.guardando ? "Guardando…" : st.cambios ? "Guardar cambios" : "Todo guardado"}</button>
    </header>

    <section class="ct-card ct-link-card">
      <div class="ct-card-head"><h3><i data-lucide="link"></i> Tu página</h3><small>Este link va en tus anuncios o dentro de una página de Shopify</small></div>
      <div class="ct-link-fila"><input readonly value="${esc(enlace())}" onclick="this.select()"><a class="ct-btn claro" href="${esc(enlace())}" target="_blank" rel="noopener"><i data-lucide="external-link"></i> Abrir</a><button class="ct-btn claro" onclick="ctCopiar('link')"><i data-lucide="copy"></i> Copiar link</button></div>
      <details class="ct-shopify"><summary>Ponerlo dentro de tu tienda Shopify</summary>
        <ol>
          <li>En Shopify: <b>Tienda online → Páginas → Agregar página</b>. Título: "Cotiza tu letrero". Guarda.</li>
          <li>Ve a <b>Tienda online → Personalizar</b>, abre esa página y agrega la sección <b>"Liquid personalizado"</b> (Custom Liquid).</li>
          <li>Pega este código ahí y guarda. El link de esa página es el que pones en el anuncio.</li>
        </ol>
        <button class="ct-btn claro chico" onclick="ctCopiar('codigo')"><i data-lucide="code"></i> Copiar código para Shopify</button>
      </details>
      <label class="ct-check"><input type="checkbox" ${c.activo ? "checked" : ""} onchange="ctCfg('activo', this.checked)"> Página encendida (si la apagas, el link dice que está apagado)</label>
    </section>

    <section class="ct-card">
      <div class="ct-card-head"><h3>Lo que ve el cliente</h3></div>
      <div class="ct-grid">
        <label>Marca<input value="${esc(c.marca)}" oninput="ctCfg('marca', this.value)"></label>
        <label>Arriba de la página mostrar<select onchange="ctCfg('cabecera', this.value)">${[["nada", "Nada (dentro de Shopify ya sale tu logo)"], ["nombre", "El nombre de la marca"], ["logo", "El logo"]].map(([k, t]) => `<option value="${k}" ${c.cabecera === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <div class="ct-marca-imgs">
          <label class="ct-par-foto ct-logo-marca">${c.logo ? `<img src="${esc(c.logo)}" alt="">` : `<i data-lucide="image-plus"></i><span>Logo (arriba)</span>`}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="ctMarcaImg('logo', this.files[0])"></label>
          <label class="ct-par-foto">${c.icono ? `<img src="${esc(c.icono)}" alt="">` : `<i data-lucide="image-plus"></i><span>Ícono pestaña</span>`}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="ctMarcaImg('icono', this.files[0])"></label>
          <small class="ct-mini">El logo sale arriba de la página (PNG con fondo transparente se ve mejor). El ícono es el de la pestaña del navegador. ${c.logo ? `<button class="ct-link" onclick="ctCfg('logo','');ctGuardar()">Quitar logo (mostrar el nombre)</button>` : ""}</small>
        </div>
        <label>Cuando el cliente termina<select onchange="ctCfg('cierre', this.value); ctRepintar()">
          <option value="whatsapp" ${c.cierre !== "shopify" ? "selected" : ""}>Me escribe por WhatsApp con el pedido</option>
          <option value="shopify" ${c.cierre === "shopify" ? "selected" : ""}>Paga el total en el checkout de mi tienda Shopify</option></select></label>
        ${c.cierre === "shopify" ? `<label>Tienda donde paga${tiendasPago()}</label>` : ""}
        <label>WhatsApp donde llegan los pedidos<input value="${esc(c.whatsapp)}" placeholder="573001234567 (con el 57)" oninput="ctCfg('whatsapp', this.value)"></label>
        <label class="dos">Título<input value="${esc(c.titulo)}" oninput="ctCfg('titulo', this.value)"></label>
        <label class="dos">Subtítulo<input value="${esc(c.subtitulo)}" oninput="ctCfg('subtitulo', this.value)"></label>
        <label class="dos">Mientras se hace la maqueta, mostrar (uno por línea · SOLO lo que de verdad ofreces)<textarea rows="4" oninput="ctCfg('beneficios', this.value.split('\\n'))">${esc((c.beneficios || []).join("\n"))}</textarea></label>
        <label class="dos">Cinta que se mueve debajo del carrusel (uno por línea)<textarea rows="4" oninput="ctCfg('cinta', this.value.split('\\n'))">${esc((c.cinta || []).join("\n"))}</textarea></label>
      </div>
    </section>

    <section class="ct-card">
      <div class="ct-card-head"><h3>"De tu logo a letrero en 3 pasos"</h3><small>Deja el título vacío para quitar un paso</small></div>
      <div class="ct-grid">${(c.pasos || []).map((p, i) => `
        <label>Paso ${i + 1}<input value="${esc(p.titulo)}" oninput="ctPaso(${i},'titulo',this.value)"></label>
        <label class="dos2">Texto del paso ${i + 1}<input value="${esc(p.desc)}" oninput="ctPaso(${i},'desc',this.value)"></label>`).join("")}</div>
    </section>

    <section class="ct-card">
      <div class="ct-card-head"><h3>"De la maqueta a la realidad"</h3><small>Con fotos reales de ustedes fabricando · deja el título vacío para quitarla</small></div>
      <div class="ct-grid">
        <label class="dos">Título<input value="${esc(c.taller.titulo)}" oninput="ctTaller('titulo',this.value)"></label>
        <label class="dos">Texto<textarea rows="3" oninput="ctTaller('texto',this.value)">${esc(c.taller.texto)}</textarea></label>
        <label>Recuadro: título<input value="${esc(c.taller.puntoTitulo)}" oninput="ctTaller('puntoTitulo',this.value)"></label>
        <label>Recuadro: texto<input value="${esc(c.taller.puntoDesc)}" oninput="ctTaller('puntoDesc',this.value)"></label>
      </div>
      ${galeriaHTML("taller", "Fotos del taller", "Ustedes cortando, armando o soldando (hasta 4)")}
    </section>

    ${costosHTML()}

    <section class="ct-card">
      <div class="ct-card-head"><h3><i data-lucide="calculator"></i> Prueba tus precios</h3><small>Igual que tu Excel: revisa que cuadre con lo que cobran</small></div>
      <div id="ctPrueba">${pruebaHTML()}</div>
    </section>

    ${tablaOpciones("luces", "Tipo de luz", "Solo para tipos con luz · recargo en % sobre la fabricación · \"Pide color\": el cliente escribe el color que quiere", [{ k: "pct", t: "Recargo %" }, { k: "pideColor", t: "Pide color", tipo: "bool" }])}
    ${tablaOpciones("ubicaciones", "¿Dónde va?", "Recargo en % sobre la fabricación (por ejemplo exterior, que aguante lluvia)", [{ k: "pct", t: "Recargo %" }])}
    ${tablaOpciones("formas", "Forma del letrero", "Rectangular o con la forma del logo · recargo en % sobre la fabricación (cortar la silueta tarda más)", [{ k: "pct", t: "Recargo %" }])}
    ${tablaOpciones("montajes", "Montaje", "Precio fijo que se suma por letrero", [{ k: "precio", t: "Precio $" }])}

    <section class="ct-card">
      <div class="ct-card-head"><h3>Tamaño, anticipo y redondeo</h3></div>
      <div class="ct-grid">
        <label>Ancho mínimo (cm)<input type="number" value="${c.anchoMin}" oninput="ctCfg('anchoMin', Number(this.value))"></label>
        <label>Ancho máximo (cm)<input type="number" value="${c.anchoMax}" oninput="ctCfg('anchoMax', Number(this.value))"></label>
        <label>Ancho con el que arranca (cm)<input type="number" value="${c.anchoDefecto}" oninput="ctCfg('anchoDefecto', Number(this.value))"></label>
        <label class="ct-check" style="grid-column:1/-1"><input type="checkbox" ${c.envioGratis ? "checked" : ""} onchange="ctCfg('envioGratis', this.checked)"> Mostrar el gancho de envío gratis en el resumen (el flete ya va dentro del precio)</label>
        <label>Texto del envío gratis<input value="${esc(c.envioTexto)}" oninput="ctCfg('envioTexto', this.value)"></label>
        <label>Anticipo para empezar (%)<input type="number" min="0" max="100" value="${c.anticipoPct}" oninput="ctCfg('anticipoPct', Number(this.value))"></label>
        <label>Redondear el precio a<select onchange="ctCfg('redondeo', Number(this.value))">${[1, 100, 500, 1000, 5000, 10000].map(v => `<option value="${v}" ${c.redondeo === v ? "selected" : ""}>${v === 1 ? "Sin redondeo" : `$${v.toLocaleString("es-CO")}`}</option>`).join("")}</select></label>
        <label>Moneda<select onchange="ctCfg('moneda', this.value)"><option value="COP" ${c.moneda === "COP" ? "selected" : ""}>COP (pesos)</option><option value="USD" ${c.moneda === "USD" ? "selected" : ""}>USD (dólares)</option></select></label>
      </div>
    </section>

    <section class="ct-card">
      <div class="ct-card-head"><h3><i data-lucide="shield"></i> Frenos de gasto de la IA</h3><small>La página es pública: así nadie se gasta tu saldo de xAI</small></div>
      <div class="ct-grid">
        <label>Maquetas por persona al día<input type="number" min="0" max="500" value="${c.limites.maquetasPorDia}" oninput="ctLimite('maquetasPorDia', Number(this.value))"></label>
        <label>Tope de gasto al mes (US$)<input type="number" min="0" step="0.5" value="${c.limites.usdMes}" oninput="ctLimite('usdMes', Number(this.value))"></label>
      </div>
      <p class="ct-mini">Este mes: <b>${g.maquetas}</b> maquetas · <b>US$${(g.usd || 0).toFixed(2)}</b> de US$${c.limites.usdMes} (cada maqueta cuesta unos US$0,05). Si se llega al tope, la página sigue funcionando: muestra el logo en la pared sin IA y el precio.</p>
    </section>

    <section class="ct-card">
      ${paresHTML()}
    </section>

    <section class="ct-card">
      ${galeriaHTML("trabajo", "Trabajos que ya entregaron", "Fotos REALES de letreros que hicieron (pueden ir con su diseño al lado). Salen en la página.")}
      ${resenasHTML()}
    </section>

    ${espacioHTML()}

    <section class="ct-card">
      <div class="ct-card-head"><h3><i data-lucide="inbox"></i> Cotizaciones</h3><small>Tablero de producción: filtra, marca cómo va cada pedido y bórralo cuando se entregue</small>
        <button class="ct-btn claro chico" onclick="ctRecargarCots()"><i data-lucide="refresh-cw"></i> Actualizar</button></div>
      ${cotizacionesHTML()}
    </section>
  </div>`;
  iconos();
}

window.ctCfg = (k, v) => { st.cfg[k] = v; marcarCambio(); };
window.ctLimite = (k, v) => { st.cfg.limites[k] = v; marcarCambio(); };
window.ctCampo = (grupo, i, k, v) => { st.cfg[grupo][i][k] = v; marcarCambio(); };
window.ctQuitar = (grupo, i) => {
  if (st.cfg[grupo].length <= 1) return avisar("Deja al menos una opción", "error");
  st.cfg[grupo].splice(i, 1); marcarCambio(); render();
};
window.ctAgregar = (grupo) => {
  const nuevo = { laminas: { nombre: "Nueva lámina", precio: 100000, m2: 2.16 }, costos: { nombre: "Nuevo costo", valor: 0, modo: "fijo", soloLuz: false }, materiales: { nombre: "Nuevo tipo", desc: "", capas: [st.cfg.laminas[0]?.id].filter(Boolean), conLuz: false }, luces: { nombre: "Nueva luz", desc: "", pct: 0 }, ubicaciones: { nombre: "Nuevo lugar", desc: "", pct: 0 }, montajes: { nombre: "Nuevo montaje", desc: "", precio: 0 }, formas: { nombre: "Nueva forma", desc: "", pct: 0 } }[grupo];
  st.cfg[grupo].push({ id: `${grupo.slice(0, 3)}${Date.now().toString(36)}`, ...nuevo });
  marcarCambio(); render();
};
window.ctPrueba = (k, v) => { st.prueba[k] = ["ancho", "alto"].includes(k) ? Number(v) || 0 : v; $("ctPrueba").innerHTML = pruebaHTML(); };
// Número en una ruta como "laminas.0.precio" o "laser.minFijos"
window.ctNum = (ruta, v) => {
  const partes = ruta.split("."), ultimo = partes.pop();
  let o = st.cfg; for (const p of partes) o = o[p];
  o[ultimo] = Number(v) || 0;
  const m = ruta.match(/^laminas\.(\d+)\./);
  if (m) { const el = $(`ctCm2_${m[1]}`); if (el) el.textContent = precioCm2(st.cfg.laminas[m[1]]).toFixed(1); }
  marcarCambio();
};
window.ctRepintar = () => render();
window.ctExtra = (i, id, si) => {
  const m = st.cfg.materiales[i];
  m.extras = si ? [...new Set([...(m.extras || []), id])] : (m.extras || []).filter(x => x !== id);
  marcarCambio();
};
window.ctCapa = (i, id, si) => {
  const m = st.cfg.materiales[i];
  m.capas = si ? [...new Set([...m.capas, id])] : m.capas.filter(x => x !== id);
  marcarCambio();
};
window.ctAgregarTramo = () => {
  const t = st.cfg.tramos, ult = t[t.length - 1];
  const previo = t.length > 1 ? t[t.length - 2].hasta : 0;
  t.splice(t.length - 1, 0, { hasta: (previo || 100000) + 150000, pauta: ult?.pauta || 25000, pautaPct: 0, flete: ult?.flete || 20000 });
  marcarCambio(); render();
};
window.ctGuardar = async () => {
  st.guardando = true; render();
  try {
    const d = await api("PUT", "/api/cotizador", { config: st.cfg });
    st.datos = d; st.cfg = structuredClone(d.config); st.cambios = false;
    avisar("Guardado. Tu página ya muestra los cambios.");
  } catch (e) { avisar(e.message, "error"); }
  st.guardando = false; render();
};
window.ctCopiar = async (que) => {
  try { await navigator.clipboard.writeText(que === "codigo" ? codigoShopify() : enlace()); avisar(que === "codigo" ? "Código copiado. Pégalo en la sección Liquid personalizado." : "Link copiado"); }
  catch { avisar("No se pudo copiar", "error"); }
};
window.ctRecargarCots = () => cargarCots();

// Fotos de la galería: se achican en el navegador antes de subir
function achicar(file, max = 1400) {
  return new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        ok(cv.toDataURL("image/jpeg", 0.86));
      };
      img.onerror = () => mal(new Error("No se pudo abrir la imagen"));
      img.src = lector.result;
    };
    lector.readAsDataURL(file);
  });
}
window.ctSubirFoto = async (tipo, file) => {
  if (!file) return;
  try {
    const titulo = tipo === "trabajo" || tipo === "taller" ? (prompt("Título corto (opcional), ej: Letrero LED para barbería:", "") || "") : "";
    const d = await api("POST", "/api/cotizador/galeria", { tipo, titulo, dataUrl: await achicar(file) });
    st.datos.galeria = d.galeria; render(); avisar("Foto agregada");
  } catch (e) { avisar(e.message, "error"); }
};
window.ctBorrarFoto = async (id) => {
  if (!confirm("¿Quitar esta foto de la página?")) return;
  try { const d = await api("DELETE", `/api/cotizador/galeria/${id}`); st.datos.galeria = d.galeria; render(); }
  catch (e) { avisar(e.message, "error"); }
};

registrarRuta("cotizador", async (view) => {
  window.marcarMenuActivo?.("cotizador");
  view.innerHTML = `<div class="ct-page"><p class="est-muted">Cargando cotizador…</p></div>`;
  try {
    st.datos = await api("GET", "/api/cotizador");
    st.cfg = structuredClone(st.datos.config);
    st.cambios = false; st.cotizaciones = null;
    render();
  } catch (e) {
    if (window.enPantalla("cotizador")) view.innerHTML = `<div class="ct-page"><p class="est-error">${esc(e.message)}</p></div>`;
  }
});
