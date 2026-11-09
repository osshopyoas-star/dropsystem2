// =============================================
// 🪧 COTIZADOR DE LETREROS — configuración en CoDropX
// Precios, textos, fotos de trabajos y reseñas reales, frenos de gasto y las cotizaciones que van llegando.
// La página pública es /cotiza/:clave y se pone dentro de una página de Shopify con el código que da esta pantalla.
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { cotizar, formatoPlata, precioCm2, COMPLEJIDADES } from "../core/cotizador.js";

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
const codigoShopify = () => `<div style="margin:0 auto;max-width:900px">
<iframe id="cdx-cotiza" src="${enlace()}" style="width:100%;min-height:900px;border:0;display:block;background:#07080d" allow="clipboard-write" loading="lazy" title="Cotiza tu letrero"></iframe>
</div>
<script>
window.addEventListener("message", function (e) {
  if (e.origin !== "${location.origin}" || !e.data) return;
  var f = document.getElementById("cdx-cotiza");
  if (e.data.cdxAlto) f.style.height = e.data.cdxAlto + "px";
  if (e.data.cdxArriba) f.scrollIntoView({ behavior: "smooth" });
});
</script>`;

function marcarCambio() {
  st.cambios = true;
  const b = $("ctGuardar"); if (b) { b.disabled = false; b.textContent = "Guardar cambios"; }
  const p = $("ctPrueba"); if (p) p.innerHTML = pruebaHTML();
}

// Tabla editable de opciones (materiales, luces, dónde va, montaje)
function tablaOpciones(grupo, titulo, ayuda, campos) {
  const filas = st.cfg[grupo] || [];
  return `
  <section class="ct-card">
    <div class="ct-card-head"><h3>${titulo}</h3><small>${ayuda}</small></div>
    <div class="ct-scroll"><table class="ct-tabla">
      <thead><tr><th>Nombre</th><th>Descripción (la ve el cliente)</th>${campos.map(c => `<th class="n">${c.t}</th>`).join("")}<th></th></tr></thead>
      <tbody>${filas.map((x, i) => `<tr>
        <td><input value="${esc(x.nombre)}" oninput="ctCampo('${grupo}',${i},'nombre',this.value)"></td>
        <td><input class="ancho" value="${esc(x.desc)}" oninput="ctCampo('${grupo}',${i},'desc',this.value)"></td>
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
  const r = cotizar(st.cfg, { material: p.material, ancho: p.ancho, alto: p.alto, luz: st.cfg.luces[0]?.id, ubicacion: st.cfg.ubicaciones[0]?.id, montaje: st.cfg.montajes[0]?.id });
  const f = (v) => formatoPlata(v, st.cfg.moneda);
  const fila = (t, v, cls = "") => `<tr class="${cls}"><td>${t}</td><td>${f(v)}</td></tr>`;
  return `<div class="ct-prueba-fila">
      <select onchange="ctPrueba('material',this.value)">${st.cfg.materiales.map(m => `<option value="${esc(m.id)}" ${m.id === p.material ? "selected" : ""}>${esc(m.nombre)}</option>`).join("")}</select>
      <label>Ancho <input type="number" value="${p.ancho}" onchange="ctPrueba('ancho',this.value)"> cm</label>
      <label>Alto <input type="number" value="${p.alto}" onchange="ctPrueba('alto',this.value)"> cm</label>
    </div>
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
    </table><p class="ct-mini">Con la primera opción de luz, lugar y montaje. El cliente NO ve este desglose: solo el precio final.</p>` : ""}`;
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
    <div class="ct-scroll"><table class="ct-tabla"><thead><tr><th>Nombre</th><th>Descripción (la ve el cliente)</th>${c.laminas.map(l => `<th class="n">${esc(l.nombre.split(" ").slice(0, 2).join(" "))}</th>`).join("")}${c.costos.filter(x => x.opcional).map(x => `<th class="n">${esc(x.nombre)}</th>`).join("")}<th class="n">Lleva luz</th><th class="n" title="La IA redibuja el logo con pocas líneas de tubo, sin detalles finos">Neón (simplifica)</th><th></th></tr></thead><tbody>
      ${c.materiales.map((m, i) => `<tr><td><input value="${esc(m.nombre)}" oninput="ctCampo('materiales',${i},'nombre',this.value)"></td><td><input class="ancho" value="${esc(m.desc)}" oninput="ctCampo('materiales',${i},'desc',this.value)"></td>
        ${c.laminas.map(l => `<td class="n"><input type="checkbox" ${m.capas.includes(l.id) ? "checked" : ""} onchange="ctCapa(${i},'${esc(l.id)}',this.checked)"></td>`).join("")}
        ${c.costos.filter(x => x.opcional).map(x => `<td class="n"><input type="checkbox" ${(m.extras || []).includes(x.id) ? "checked" : ""} onchange="ctExtra(${i},'${esc(x.id)}',this.checked)"></td>`).join("")}
        <td class="n"><input type="checkbox" ${m.conLuz ? "checked" : ""} onchange="ctCampo('materiales',${i},'conLuz',this.checked)"></td>
        <td class="n"><input type="checkbox" ${m.neon ? "checked" : ""} onchange="ctCampo('materiales',${i},'neon',this.checked)"></td>
        <td><button class="ct-icono" title="Quitar" onclick="ctQuitar('materiales',${i})"><i data-lucide="trash-2"></i></button></td></tr>`).join("")}
    </tbody></table></div>
    <button class="ct-btn claro chico" onclick="ctAgregar('materiales')"><i data-lucide="plus"></i> Agregar tipo</button>
  </section>

  <section class="ct-card">
    <div class="ct-card-head"><h3><i data-lucide="image"></i> Cómo se ve cada tipo</h3><small>Sube una foto REAL de un letrero de ese tipo que ya hicieron: sale en la opción y la IA copia ese acabado (material, grabado, luz) con el diseño del cliente</small></div>
    <div class="ct-ejemplos">${c.materiales.map((m, i) => {
      const ej = (st.datos.galeria || []).find(g => g.tipo === "ejemplo" && g.material === m.id);
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
    <div class="ct-card-head"><h3>3. Láser</h3><small>Minutos = preparación + minutos por cada 100 cm² (sube con el tamaño del letrero)</small></div>
    <div class="ct-grid">
      <label>Precio del minuto ($)${num("laser.precioMinuto", c.laser.precioMinuto, 100)}</label>
      <label>Minutos de preparación${num("laser.minFijos", c.laser.minFijos, 1)}</label>
      <label>Minutos por cada 100 cm²${num("laser.minPor100", c.laser.minPor100, 0.1)}</label>
    </div>
    <p class="ct-mini">Con 30 × 30 cm: ${Math.round((c.laser.minFijos + 9 * c.laser.minPor100))} minutos = ${f((c.laser.minFijos + 9 * c.laser.minPor100) * c.laser.precioMinuto)}.</p>
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
    const d = await api("POST", "/api/cotizador/galeria", { tipo: "ejemplo", material, dataUrl: await achicar(file) });
    st.datos.galeria = d.galeria; render(); avisar("Foto de ejemplo guardada");
  } catch (e) { avisar(e.message, "error"); }
};
window.ctPaso = (i, k, v) => { st.cfg.pasos[i][k] = v; marcarCambio(); };
window.ctTaller = (k, v) => { st.cfg.taller[k] = v; marcarCambio(); };

function cotizacionesHTML() {
  if (st.cotizaciones === null) {
    st.cotizaciones = "cargando";
    api("GET", "/api/cotizador/cotizaciones").then(l => { st.cotizaciones = l; render(); }).catch(e => { st.cotizaciones = { error: e.message }; render(); });
  }
  if (st.cotizaciones === "cargando") return `<p class="ct-mini">Cargando…</p>`;
  if (st.cotizaciones?.error) return `<p class="ct-mini rojo">${esc(st.cotizaciones.error)}</p>`;
  if (!st.cotizaciones.length) return `<p class="ct-mini">Todavía no hay cotizaciones. Abre tu link y prueba con un logo.</p>`;
  const nombre = (grupo, id) => st.cfg[grupo]?.find(x => x.id === id)?.nombre || id || "";
  return `<div class="ct-cots">${st.cotizaciones.map(c => `
    <div class="ct-cot">
      <a href="${esc(c.maqueta || c.logo)}" target="_blank" rel="noopener"><img src="${esc(c.maqueta || c.logo)}" alt=""></a>
      <div>
        <b>${formatoPlata(c.total, c.moneda)}</b> ${c.pidio ? `<span class="ct-tag ok">pidió</span>` : `<span class="ct-tag">solo miró</span>`}
        <small>${esc(nombre("materiales", c.eleccion?.material))} · ${c.eleccion?.ancho} × ${c.eleccion?.alto} cm${c.eleccion?.cantidad > 1 ? ` · ×${c.eleccion.cantidad}` : ""}</small>
        <small>${esc(nombre("ubicaciones", c.eleccion?.ubicacion))}${c.eleccion?.luz ? ` · ${esc(nombre("luces", c.eleccion.luz))}` : ""} · ${new Date(c.creado).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}</small>
        ${c.notas ? `<small class="ct-nota">📝 ${esc(c.notas)}</small>` : ""}
        ${c.error ? `<small class="rojo">⚠ No salió la maqueta: ${esc(c.error)}</small>` : ""}
        ${c.logo && c.maqueta ? `<a class="ct-link" href="${esc(c.logo)}" target="_blank" rel="noopener">Ver logo original</a>` : ""}
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
        <div class="ct-marca-imgs">
          <label class="ct-par-foto ct-logo-marca">${c.logo ? `<img src="${esc(c.logo)}" alt="">` : `<i data-lucide="image-plus"></i><span>Logo (arriba)</span>`}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="ctMarcaImg('logo', this.files[0])"></label>
          <label class="ct-par-foto">${c.icono ? `<img src="${esc(c.icono)}" alt="">` : `<i data-lucide="image-plus"></i><span>Ícono pestaña</span>`}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="ctMarcaImg('icono', this.files[0])"></label>
          <small class="ct-mini">El logo sale arriba de la página (PNG con fondo transparente se ve mejor). El ícono es el de la pestaña del navegador. ${c.logo ? `<button class="ct-link" onclick="ctCfg('logo','');ctGuardar()">Quitar logo (mostrar el nombre)</button>` : ""}</small>
        </div>
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

    ${tablaOpciones("luces", "Tipo de luz", "Solo para tipos con luz · recargo en % sobre la fabricación", [{ k: "pct", t: "Recargo %" }])}
    ${tablaOpciones("ubicaciones", "¿Dónde va?", "Recargo en % sobre la fabricación (por ejemplo exterior, que aguante lluvia)", [{ k: "pct", t: "Recargo %" }])}
    ${tablaOpciones("formas", "Forma del letrero", "Rectangular o con la forma del logo · recargo en % sobre la fabricación (cortar la silueta tarda más)", [{ k: "pct", t: "Recargo %" }])}
    ${tablaOpciones("montajes", "Montaje", "Precio fijo que se suma por letrero", [{ k: "precio", t: "Precio $" }])}

    <section class="ct-card">
      <div class="ct-card-head"><h3>Tamaño, anticipo y redondeo</h3></div>
      <div class="ct-grid">
        <label>Ancho mínimo (cm)<input type="number" value="${c.anchoMin}" oninput="ctCfg('anchoMin', Number(this.value))"></label>
        <label>Ancho máximo (cm)<input type="number" value="${c.anchoMax}" oninput="ctCfg('anchoMax', Number(this.value))"></label>
        <label>Ancho con el que arranca (cm)<input type="number" value="${c.anchoDefecto}" oninput="ctCfg('anchoDefecto', Number(this.value))"></label>
        <label>Anticipo para empezar (%)<input type="number" min="0" max="100" value="${c.anticipoPct}" oninput="ctCfg('anticipoPct', Number(this.value))"></label>
        <label>Redondear el precio a<select onchange="ctCfg('redondeo', Number(this.value))">${[1, 100, 500, 1000, 5000, 10000].map(v => `<option value="${v}" ${c.redondeo === v ? "selected" : ""}>${v === 1 ? "Sin redondeo" : `$${v.toLocaleString("es-CO")}`}</option>`).join("")}</select></label>
        <label>Moneda<select onchange="ctCfg('moneda', this.value)"><option value="COP" ${c.moneda === "COP" ? "selected" : ""}>COP (pesos)</option><option value="USD" ${c.moneda === "USD" ? "selected" : ""}>USD (dólares)</option></select></label>
      </div>
    </section>

    <section class="ct-card">
      <div class="ct-card-head"><h3><i data-lucide="shield"></i> Frenos de gasto de la IA</h3><small>La página es pública: así nadie se gasta tu saldo de xAI</small></div>
      <div class="ct-grid">
        <label>Maquetas por persona al día<input type="number" min="0" max="20" value="${c.limites.maquetasPorDia}" oninput="ctLimite('maquetasPorDia', Number(this.value))"></label>
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

    <section class="ct-card">
      <div class="ct-card-head"><h3><i data-lucide="inbox"></i> Cotizaciones</h3><small>Las últimas 60: lo que eligieron y su maqueta (no se guardan datos personales)</small>
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
window.ctPrueba = (k, v) => { st.prueba[k] = ["material", "complejidad"].includes(k) ? v : Number(v) || 0; $("ctPrueba").innerHTML = pruebaHTML(); };
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
window.ctRecargarCots = () => { st.cotizaciones = null; render(); };

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
