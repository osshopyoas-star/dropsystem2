// =============================================
// 🪧 COTIZADOR DE LETREROS — configuración en CoDropX
// Precios, textos, fotos de trabajos y reseñas reales, frenos de gasto y las cotizaciones que van llegando.
// La página pública es /cotiza/:clave y se pone dentro de una página de Shopify con el código que da esta pantalla.
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { cotizar, formatoPlata } from "../core/cotizador.js";

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
  if (!p.material) p.material = st.cfg.materiales[0]?.id || "";
  const r = cotizar(st.cfg, { material: p.material, ancho: p.ancho, alto: p.alto, luz: st.cfg.luces[0]?.id, ubicacion: st.cfg.ubicaciones[0]?.id, montaje: st.cfg.montajes[0]?.id });
  const f = (v) => formatoPlata(v, st.cfg.moneda);
  return `<div class="ct-prueba-fila">
      <select onchange="ctPrueba('material',this.value)">${st.cfg.materiales.map(m => `<option value="${esc(m.id)}" ${m.id === p.material ? "selected" : ""}>${esc(m.nombre)}</option>`).join("")}</select>
      <label>Ancho <input type="number" value="${p.ancho}" onchange="ctPrueba('ancho',this.value)"> cm</label>
      <label>Alto <input type="number" value="${p.alto}" onchange="ctPrueba('alto',this.value)"> cm</label>
    </div>
    ${r ? `<p class="ct-prueba-res">${r.ancho} × ${r.alto} cm = ${Math.round(r.area).toLocaleString("es-CO")} cm² → <b>${f(r.total)}</b>${r.minimoAplicado ? " <small>(se aplicó el mínimo)</small>" : ""}${st.cfg.anticipoPct > 0 && st.cfg.anticipoPct < 100 ? ` · anticipo ${st.cfg.anticipoPct}%: ${f(r.anticipo)}` : ""}<br><small>Con la primera opción de luz, lugar y montaje. Lo que elija el cliente suma sus recargos.</small></p>` : ""}`;
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
        <label>WhatsApp donde llegan los pedidos<input value="${esc(c.whatsapp)}" placeholder="573001234567 (con el 57)" oninput="ctCfg('whatsapp', this.value)"></label>
        <label class="dos">Título<input value="${esc(c.titulo)}" oninput="ctCfg('titulo', this.value)"></label>
        <label class="dos">Subtítulo<input value="${esc(c.subtitulo)}" oninput="ctCfg('subtitulo', this.value)"></label>
        <label class="dos">Mientras se hace la maqueta, mostrar (uno por línea · SOLO lo que de verdad ofreces)<textarea rows="4" oninput="ctCfg('beneficios', this.value.split('\\n'))">${esc((c.beneficios || []).join("\n"))}</textarea></label>
      </div>
    </section>

    ${tablaOpciones("materiales", "Materiales", "Precio por cm² del frente del letrero, con un precio mínimo por letrero", [{ k: "precioCm2", t: "$ por cm²" }, { k: "minimo", t: "Mínimo $" }, { k: "conLuz", t: "Lleva luz", tipo: "bool" }])}

    <section class="ct-card">
      <div class="ct-card-head"><h3><i data-lucide="calculator"></i> Prueba tus precios</h3><small>Para que tu hermano revise que cuadre con lo que cobran</small></div>
      <div id="ctPrueba">${pruebaHTML()}</div>
    </section>

    ${tablaOpciones("luces", "Tipo de luz", "Solo para materiales que llevan luz · recargo en %", [{ k: "pct", t: "Recargo %" }])}
    ${tablaOpciones("ubicaciones", "¿Dónde va?", "Recargo en % (por ejemplo exterior, que aguante lluvia)", [{ k: "pct", t: "Recargo %" }])}
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
      ${galeriaHTML("trabajo", "Trabajos que ya entregaron", "Fotos REALES de letreros que hicieron (pueden ir con su diseño al lado). Salen en la página.")}
      ${galeriaHTML("resena", "Reseñas reales", "Capturas de WhatsApp o fotos que les mandaron los clientes. Nada inventado.")}
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
  const nuevo = { materiales: { nombre: "Nuevo material", desc: "", precioCm2: 50, minimo: 50000, conLuz: false }, luces: { nombre: "Nueva luz", desc: "", pct: 0 }, ubicaciones: { nombre: "Nuevo lugar", desc: "", pct: 0 }, montajes: { nombre: "Nuevo montaje", desc: "", precio: 0 } }[grupo];
  st.cfg[grupo].push({ id: `${grupo.slice(0, 3)}${Date.now().toString(36)}`, ...nuevo });
  marcarCambio(); render();
};
window.ctPrueba = (k, v) => { st.prueba[k] = k === "material" ? v : Number(v) || 0; $("ctPrueba").innerHTML = pruebaHTML(); };
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
    const titulo = tipo === "trabajo" ? (prompt("Título corto (opcional), ej: Letrero LED para barbería:", "") || "") : "";
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
