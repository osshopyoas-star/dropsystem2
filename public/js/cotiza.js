// =============================================
// Página pública del cotizador de letreros (/cotiza/:clave)
// Pasos: inicio → subir logo → material → dónde va y luz → tamaño → maqueta → precio y pedido
// =============================================
import { cotizar, altoDe, formatoPlata, complejidadDe, COMPLEJIDADES } from "./core/cotizador.js";

const clave = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "");
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = $("app");

const st = {
  cfg: null, paso: "inicio",
  logo: null,            // { dataUrl, ratio }
  e: { material: "", luz: "", ubicacion: "", montaje: "", forma: "", ancho: 60, alto: 60, cantidad: 1, complejidad: "medio" },
  altoManual: false, maqueta: null, cotizacion: null, aviso: "", error: "", notas: "", enviando: false
};
const PASOS = ["subir", "material", "lugar", "tamano", "resultado"];
const plata = (v) => formatoPlata(v, st.cfg?.moneda);
const q = () => (st.cfg && st.e.material ? cotizar(st.cfg, st.e) : null);

// Altura para Shopify: la página va dentro de un iframe y le avisa cuánto mide
const avisarAlto = () => { try { parent.postMessage({ cdxAlto: document.documentElement.scrollHeight }, "*"); } catch {} };
new ResizeObserver(avisarAlto).observe(document.body);
const arriba = () => { window.scrollTo({ top: 0, behavior: "smooth" }); try { parent.postMessage({ cdxArriba: true }, "*"); } catch {} };

async function api(metodo, url, body) {
  const r = await fetch(url, { method: metodo, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Algo falló. Intenta de nuevo.");
  return d;
}

async function iniciar() {
  try {
    st.cfg = await api("GET", `/api/cotiza/${encodeURIComponent(clave)}/config`);
    document.title = `${st.cfg.titulo} · ${st.cfg.marca}`;
    if (st.cfg.icono) for (const rel of ["icon", "apple-touch-icon"]) { const l = document.createElement("link"); l.rel = rel; l.href = st.cfg.icono; document.head.appendChild(l); }
    st.e.ancho = st.cfg.anchoDefecto;
    st.e.material = st.cfg.materiales[0]?.id || "";
    st.e.luz = st.cfg.luces[0]?.id || "";
    st.e.ubicacion = st.cfg.ubicaciones[0]?.id || "";
    st.e.montaje = st.cfg.montajes[0]?.id || "";
    st.e.forma = st.cfg.formas?.[0]?.id || "";
    pintar();
  } catch (e) {
    app.innerHTML = `<p class="sub">${esc(e.message)}</p>`;
  }
}

function pasos() {
  const i = PASOS.indexOf(st.paso === "generando" ? "resultado" : st.paso);
  return i < 0 ? "" : `<div class="pasos">${PASOS.map((_, n) => `<i class="${n <= i ? "on" : ""}"></i>`).join("")}</div>`;
}

// El logo en una pared (sin IA): se usa mientras eliges el tamaño o si no hay maqueta
function pared() {
  if (!st.logo) return "";
  const m = st.cfg.materiales.find(x => x.id === st.e.material);
  const pct = Math.round(25 + 55 * (st.e.ancho - st.cfg.anchoMin) / Math.max(1, st.cfg.anchoMax - st.cfg.anchoMin));
  return `<div class="pared"><img class="logo ${m?.conLuz ? "luz" : ""}" src="${st.logo.dataUrl}" alt="Tu logo" style="width:${pct}%">
    <span class="medida an">${st.e.ancho} cm</span><span class="medida al">${st.e.alto} cm</span></div>`;
}

function galeria(tipo, titulo) {
  const fotos = (st.cfg.galeria || []).filter(g => g.tipo === tipo);
  if (!fotos.length) return "";
  return `<section class="seccion"><h3>${titulo}</h3><div class="galeria">${fotos.map(g => `<figure><img src="${esc(g.url)}" alt="${esc(g.titulo || titulo)}" loading="lazy">${g.titulo ? `<figcaption>${esc(g.titulo)}</figcaption>` : ""}</figure>`).join("")}</div></section>`;
}

// Reseñas reales en tarjetas que se deslizan (foto + estrellas + texto + nombre, lo que hayas puesto)
function resenas(titulo = "Lo que dicen nuestros clientes") {
  const rs = (st.cfg.galeria || []).filter(g => g.tipo === "resena");
  if (!rs.length) return "";
  // Con 2 o más reseñas se duplican para que el carrusel se mueva solo sin fin
  const lista = rs.length > 1 ? [...rs, ...rs] : rs;
  return `<section class="seccion res-sec"><h3 class="izq">${titulo}</h3><div class="resenas ${rs.length > 1 ? "auto" : ""}">${lista.map(r => `
    <div class="resena ${r.texto || r.nombre ? "" : "solo-foto"}"><img src="${esc(r.url)}" alt="Foto de cliente" loading="lazy">
      ${r.texto || r.nombre ? `<div class="res-txt">
        ${Number(r.estrellas) ? `<div class="estrellas">${"★".repeat(Number(r.estrellas))}</div>` : ""}
        ${r.texto ? `<p>${esc(r.texto)}</p>` : ""}
        ${r.nombre || r.ciudad ? `<div class="res-quien">${r.nombre ? `<b>${esc(r.nombre)}</b>` : ""}${r.ciudad ? `<small>${esc(r.ciudad)}</small>` : ""}</div>` : ""}
      </div>` : ""}
    </div>`).join("")}</div></section>`;
}

// Las reseñas se deslizan solas, despacio; si la persona toca o pasa el mouse, se detienen un momento
let pausaResenas = 0;
const pausar = (e) => { if (e.target.closest?.(".resenas")) pausaResenas = Date.now() + 3500; };
["pointerdown", "touchstart", "wheel", "mouseover"].forEach(ev => document.addEventListener(ev, pausar, { passive: true }));
setInterval(() => {
  if (Date.now() < pausaResenas) return;
  document.querySelectorAll(".resenas.auto").forEach(c => {
    const mitad = c.scrollWidth / 2;
    if (mitad <= c.clientWidth) return;
    c.scrollLeft += 1;
    if (c.scrollLeft >= mitad) c.scrollLeft -= mitad;
  });
}, 30);

// ---------- Secciones del inicio (como las grandes marcas de letreros) ----------
const ICONOS = {
  subir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>',
  ia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
  envio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'
};

// Carrusel "Tu logo → Así quedó" con los pares reales que subes en CoDropX
function carrusel() {
  const pares = (st.cfg.galeria || []).filter(g => g.tipo === "par" && g.urlAntes);
  if (!pares.length) return "";
  return `<section class="seccion"><div class="carrusel" id="cxCarrusel" onscroll="cxCarruselPunto()">
    ${pares.map(g => `<div class="slide">
      <div class="lado"><span class="etq">TU LOGO</span><img src="${esc(g.urlAntes)}" alt="Logo del cliente" loading="lazy" class="antes"></div>
      <div class="lado"><span class="etq azul">${g.real === false ? "MAQUETA" : "ASÍ QUEDÓ"}</span><img src="${esc(g.url)}" alt="${esc(g.titulo || "Letrero terminado")}" loading="lazy" class="despues"></div>
      ${g.titulo ? `<p class="slide-tit">${esc(g.titulo)}</p>` : ""}
    </div>`).join("")}
  </div>${pares.length > 1 ? `<div class="puntos">${pares.map((_, i) => `<button class="${i ? "" : "on"}" onclick="cxIrSlide(${i})" aria-label="Ver ${i + 1}"></button>`).join("")}</div>` : ""}</section>`;
}
window.cxCarruselPunto = () => {
  const c = $("cxCarrusel"); if (!c) return;
  const i = Math.round(c.scrollLeft / c.clientWidth);
  document.querySelectorAll(".puntos button").forEach((b, n) => b.classList.toggle("on", n === i));
};
window.cxIrSlide = (i) => { const c = $("cxCarrusel"); if (c) c.scrollTo({ left: i * c.clientWidth, behavior: "smooth" }); };
setInterval(() => {
  const c = $("cxCarrusel");
  if (!c || c.matches(":hover") || c.children.length < 2) return;
  const i = Math.round(c.scrollLeft / c.clientWidth);
  cxIrSlide((i + 1) % c.children.length);
}, 4500);

function cinta() {
  const t = st.cfg.cinta || [];
  if (!t.length) return "";
  const fila = t.map(x => `<span>${esc(x)}</span>`).join("");
  return `<div class="cinta"><div class="cinta-in">${fila}${fila}</div></div>`;
}

function seccionPasos() {
  const p = (st.cfg.pasos || []).filter(x => x.titulo);
  if (!p.length) return "";
  const ic = [ICONOS.subir, ICONOS.ia, ICONOS.envio];
  return `<section class="seccion pasos3"><h2 class="grande">De tu logo a letrero en ${p.length} pasos</h2>
    ${p.map((x, i) => `<div class="paso3"><span class="ico3">${ic[i] || ICONOS.ok}</span><b>${i + 1}. ${esc(x.titulo)}</b><p>${esc(x.desc)}</p></div>`).join("")}</section>`;
}

function seccionTaller() {
  const t = st.cfg.taller || {};
  const fotos = (st.cfg.galeria || []).filter(g => g.tipo === "taller");
  if (!t.titulo && !fotos.length) return "";
  return `<section class="seccion taller">
    ${t.titulo ? `<h2 class="grande izq">${esc(t.titulo)}</h2>` : ""}
    ${t.texto ? `<p class="taller-txt">${esc(t.texto)}</p>` : ""}
    ${t.puntoTitulo ? `<div class="punto"><span class="ico3 chico">${ICONOS.ok}</span><div><b>${esc(t.puntoTitulo)}</b>${t.puntoDesc ? `<small>${esc(t.puntoDesc)}</small>` : ""}</div></div>` : ""}
    ${fotos.map(g => `<img class="taller-foto" src="${esc(g.url)}" alt="${esc(g.titulo || "Nuestro taller")}" loading="lazy">`).join("")}
  </section>`;
}

// Si la luz elegida pide color: botones rápidos + casilla para escribir otro
const COLORES = [["Blanco", "#f8fafc"], ["Blanco cálido", "#fde68a"], ["Amarillo", "#facc15"], ["Rojo", "#ef4444"], ["Azul", "#3b82f6"], ["Verde", "#22c55e"], ["Rosado", "#f472b6"], ["Morado", "#a855f7"]];
function colorLuzHTML(c) {
  const luz = c.luces.find(l => l.id === st.e.luz);
  if (!luz?.pideColor) return "";
  const v = st.e.colorLuz || "";
  return `<div class="color-luz"><b>¿De qué color quieres la luz?</b>
    <div class="colores">${COLORES.map(([n, hex]) => `<button class="color ${v.toLowerCase() === n.toLowerCase() ? "on" : ""}" onclick="cxColor('${n}')"><i style="background:${hex};box-shadow:0 0 10px ${hex}"></i>${n}</button>`).join("")}</div>
    <input id="cxColorLuz" placeholder="O escribe el color (ej: verde menta)" value="${esc(v)}" maxlength="40" oninput="cxColorTexto(this.value)">
  </div>`;
}
window.cxColor = (n) => { st.e.colorLuz = n; pintar(); };
window.cxColorTexto = (v) => { st.e.colorLuz = v; document.querySelectorAll(".color-luz .color").forEach(b => b.classList.toggle("on", b.textContent.trim().toLowerCase() === v.trim().toLowerCase())); };

function opcion(grupo, x, extra = "") {
  const on = st.e[grupo] === x.id;
  const lista = { material: "materiales", ubicacion: "ubicaciones", forma: "formas", luz: "luces", montaje: "montajes" }[grupo];
  const ej = (st.cfg.galeria || []).find(g => g.tipo === "ejemplo" && (g.grupo || "materiales") === lista && g.material === x.id);
  return `<button class="op ${on ? "on" : ""} ${ej ? "con-foto" : ""}" onclick="cxElegir('${grupo}','${esc(x.id)}')">${ej ? `<span class="op-foto"><img src="${esc(ej.url)}" alt="Ejemplo: ${esc(x.nombre)}" loading="lazy"><em>EJEMPLO</em></span>` : ""}<span>${extra ? `<span class="extra">${esc(extra)}</span>` : ""}<b>${esc(x.nombre)}</b>${x.desc ? `<small>${esc(x.desc)}</small>` : ""}</span></button>`;
}

function pintar() {
  const c = st.cfg;
  const r = q();
  let html = "";
  if (st.paso === "inicio") {
    const titulo = esc(c.titulo).replace(/(letrero|logo|neón|neon)/i, '<span class="brilla">$1</span>');
    html = `<div class="marca">${c.logo ? `<img src="${esc(c.logo)}" alt="${esc(c.marca)}">` : esc(c.marca)}</div>
      <h1>${titulo}</h1>
      <p class="sub">${esc(c.subtitulo)}</p>
      <button class="btn" onclick="cxIr('subir')">Sube tu logo y míralo</button>
      <p class="mini">Gratis y sin compromiso · precio al instante</p>
      ${carrusel()}
      ${cinta()}
      ${seccionPasos()}
      ${seccionTaller()}
      ${galeria("trabajo", "Trabajos que ya entregamos")}
      ${resenas()}
      <div class="seccion"><button class="btn" onclick="cxIr('subir')">Sube tu logo y míralo</button></div>`;
  } else if (st.paso === "subir") {
    html = `${pasos()}<h2>Sube tu logo o diseño</h2><p class="sub">Una foto, captura o archivo de tu logo. Mientras más claro, mejor sale.</p>
      <label class="subir" for="cxArchivo">
        <span class="nube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg></span>
        <small class="arrastra">O arrastra tu archivo aquí</small>
        <span class="btn-subir">${st.logo || st.recorte ? "Cambiar imagen" : "Toca para subir"}</span>
        <small>Gratis · sin compromiso</small>
        <span class="formatos"><i>PNG</i><i>JPG</i><i>WEBP</i></span>
      </label>
      <input id="cxArchivo" type="file" accept="image/png,image/jpeg,image/webp" class="oculto" onchange="cxArchivo(this.files[0])">
      ${st.error ? `<div class="error">${esc(st.error)}</div>` : ""}
      ${st.recorte ? `
        <h2 style="margin-top:22px;font-size:20px">Recorta tu logo</h2>
        <div class="recorte" id="cxRecorte"><img src="${st.recorte.dataUrl}" alt="Tu imagen" draggable="false">
          <div class="caja-rec" id="cxCaja" style="${cajaEstilo()}"><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div></div>
        <p class="mini">ⓘ Arrastra las esquinas para dejar solo el logo. Deja un poquito de espacio alrededor.</p>
        <div class="fila"><button class="btn claro" onclick="cxSinRecorte()">Usar completa</button><button class="btn" onclick="cxRecortar()">Recortar y continuar</button></div>`
      : st.logo ? `<div style="margin-top:14px">${pared()}</div>
        <div class="fila"><button class="btn claro" onclick="cxIr('inicio')">Atrás</button><button class="btn" onclick="cxIr('material')">Continuar</button></div>
        <p class="mini"><button class="enlace" onclick="cxVolverRecortar()">Recortar de nuevo</button></p>`
      : `<div class="fila"><button class="btn claro" onclick="cxIr('inicio')">Atrás</button><button class="btn" disabled>Continuar</button></div>`}
      ${resenas()}`;
  } else if (st.paso === "material") {
    html = `${pasos()}<h2>¿En qué material lo quieres?</h2><p class="sub">Lo fabricamos con corte láser a la medida.</p>
      <div class="opciones dos">${c.materiales.map(m => opcion("material", m)).join("")}</div>
      <div class="fila"><button class="btn claro" onclick="cxIr('subir')">Atrás</button><button class="btn" onclick="cxIr('lugar')">Continuar</button></div>`;
  } else if (st.paso === "lugar") {
    const m = c.materiales.find(x => x.id === st.e.material);
    html = `${pasos()}<h2>¿Dónde lo vas a poner?</h2><p class="sub">Así sabemos qué tan resistente tiene que ser.</p>
      <div class="opciones dos">${c.ubicaciones.map(u => opcion("ubicacion", u, u.pct ? `+${u.pct}%` : "")).join("")}</div>
      ${(c.formas || []).length > 1 ? `<h2 style="margin-top:26px">¿Qué forma quieres?</h2><div class="opciones dos" style="margin-top:12px">${c.formas.map(f => opcion("forma", f, f.pct ? `+${f.pct}%` : "")).join("")}</div>` : ""}
      ${m?.conLuz ? `<h2 style="margin-top:26px">¿Qué luz quieres?</h2><div class="opciones dos" style="margin-top:12px">${c.luces.map(l => opcion("luz", l, l.pct ? `+${l.pct}%` : "")).join("")}</div>${colorLuzHTML(c)}` : ""}
      <div class="fila"><button class="btn claro" onclick="cxIr('material')">Atrás</button><button class="btn" onclick="cxIr('tamano')">Continuar</button></div>`;
  } else if (st.paso === "tamano") {
    html = `${pasos()}<h2>¿De qué tamaño?</h2><p class="sub">Mueve la barra. El alto sale solo según la forma de tu logo (puedes cambiarlo).</p>
      ${pared()}
      <input class="rango" type="range" min="${c.anchoMin}" max="${c.anchoMax}" step="1" value="${st.e.ancho}" oninput="cxAncho(this.value)">
      <div class="medidas">
        <label class="campo">Ancho (cm)<input type="number" min="${c.anchoMin}" max="${c.anchoMax}" value="${st.e.ancho}" onchange="cxAncho(this.value)"></label>
        <label class="campo">Alto (cm)<input type="number" min="5" max="${c.anchoMax * 3}" value="${st.e.alto}" onchange="cxAlto(this.value)"></label>
      </div>
      <div class="fila"><button class="btn claro" onclick="cxIr('lugar')">Atrás</button><button class="btn" onclick="cxMaqueta()">${c.conMaqueta ? "Ver mi letrero" : "Ver mi precio"}</button></div>`;
  } else if (st.paso === "generando") {
    html = `<h2>Haciendo tu maqueta…</h2><p class="sub">Estamos convirtiendo tu logo en letrero. Tarda menos de un minuto.</p>
      <div class="esfera" id="cxEsfera"></div>
      <p class="beneficio" id="cxBeneficio">${esc(c.beneficios[0] || "")}</p>
      <div class="progreso"><div id="cxProgreso"></div></div>`;
  } else if (st.paso === "resultado") {
    html = `${pasos()}<h2>Así se vería tu letrero</h2><p class="sub">${st.maqueta ? "Maqueta hecha con IA a partir de tu logo. Antes de fabricar te mandamos el diseño final para que lo apruebes." : "Tu logo en la pared con la medida que elegiste."}</p>
      ${st.aviso ? `<div class="aviso">${esc(st.aviso)}</div>` : ""}
      ${st.maqueta ? `<img class="maqueta" src="${esc(st.maqueta)}" alt="Maqueta de tu letrero">` : pared()}
      ${c.montajes.length > 1 ? `<h2 style="margin-top:26px;font-size:20px">¿Cómo lo vas a montar?</h2><div class="opciones dos" style="margin-top:12px">${c.montajes.map(m => opcion("montaje", m, m.precio ? `+${plata(m.precio)}` : "Incluido")).join("")}</div>` : ""}
      <div class="caja" style="margin-top:18px">
        <div class="contador"><span style="flex:1;text-align:left;font-weight:600;font-size:15px">Cantidad</span><button onclick="cxCantidad(-1)">−</button><span>${st.e.cantidad}</span><button onclick="cxCantidad(1)">+</button></div>
        ${r ? `<table class="desglose">
          <tr><td>${esc(r.material.nombre)}</td><td>${r.ancho} × ${r.alto} cm</td></tr>
          ${r.luz ? `<tr><td>Luz</td><td>${esc(r.luz.nombre)}${r.colorLuz ? ` · ${esc(r.colorLuz)}` : ""}</td></tr>` : ""}
          ${r.ubicacion ? `<tr><td>Va en</td><td>${esc(r.ubicacion.nombre)}</td></tr>` : ""}
          ${r.forma ? `<tr><td>Forma</td><td>${esc(r.forma.nombre)}</td></tr>` : ""}
          ${r.montaje ? `<tr><td>Montaje</td><td>${esc(r.montaje.nombre)}</td></tr>` : ""}
          ${r.cantidad > 1 ? `<tr><td>Cantidad</td><td>${r.cantidad}</td></tr>` : ""}
          ${c.envioGratis ? `<tr class="envio-fila"><td>Envío</td><td>${r.flete ? `<s>${plata(r.flete)}</s> ` : ""}<b>GRATIS</b></td></tr>` : ""}
        </table>
        ${c.envioGratis ? `<div class="envio-gratis"><span class="camion">🚚</span><span><b>${esc(c.envioTexto)}</b><small>Ya va incluido en tu precio: no pagas nada más</small></span></div>` : ""}
        <table class="desglose">
          <tr class="tot"><td>Total</td><td>${plata(r.total)}</td></tr>
          ${c.anticipoPct > 0 && c.anticipoPct < 100 ? `<tr><td>Anticipo para empezar (${c.anticipoPct}%)</td><td>${plata(r.anticipo)}</td></tr>` : ""}
        </table>` : ""}
      </div>
      <label class="campo" style="margin-top:16px">¿Algún cambio o detalle? (opcional)<textarea id="cxNotas" placeholder="Colores, letras, dónde va, para cuándo lo necesitas…" oninput="cxNotas(this.value)">${esc(st.notas)}</textarea></label>
      ${st.error ? `<div class="error">${esc(st.error)}</div>` : ""}
      <div class="fila"><button class="btn wa" onclick="cxPedir()" ${st.enviando ? "disabled" : ""}>${st.enviando ? "Armando tu pedido…" : c.whatsapp ? "Pedir por WhatsApp" : "Quiero este letrero"}</button></div>
      <div class="fila"><button class="btn claro" onclick="cxIr('tamano')">Cambiar tamaño u opciones</button></div>
      ${galeria("trabajo", "Trabajos que ya entregamos")}
      ${resenas()}`;
  }
  app.innerHTML = html;
  // Barra de precio abajo (desde que eliges material hasta antes del resultado)
  const barra = $("barra");
  const verBarra = r && ["material", "lugar", "tamano"].includes(st.paso);
  barra.classList.toggle("ver", !!verBarra);
  if (verBarra) {
    $("barraTotal").textContent = plata(r.total);
    $("barraTxt").textContent = `${r.ancho} × ${r.alto} cm · precio estimado${st.cfg.envioGratis ? " · ✓ envío gratis" : ""}`;
    $("barraBtn").onclick = () => (st.paso === "tamano" ? cxMaqueta() : cxIr(st.paso === "material" ? "lugar" : "tamano"));
    $("barraBtn").textContent = st.paso === "tamano" ? "Ver mi letrero" : "Continuar";
  }
  setTimeout(avisarAlto, 50);
}

window.cxIr = (paso) => { st.error = ""; st.paso = paso; pintar(); arriba(); };
window.cxElegir = (grupo, id) => { st.e[grupo] = id; pintar(); };
window.cxNotas = (v) => { st.notas = v; };
window.cxCantidad = (d) => { st.e.cantidad = Math.min(50, Math.max(1, st.e.cantidad + d)); pintar(); };
window.cxAncho = (v) => {
  st.e.ancho = Math.min(st.cfg.anchoMax, Math.max(st.cfg.anchoMin, Math.round(Number(v) || st.cfg.anchoDefecto)));
  if (!st.altoManual) st.e.alto = altoDe(st.e.ancho, st.logo?.ratio || 1);
  // Solo actualizar la pared y la barra (para que la barra no se reinicie al arrastrar)
  const p = document.querySelector(".pared");
  if (p) p.outerHTML = pared();
  const r = q();
  if (r) { $("barraTotal").textContent = plata(r.total); $("barraTxt").textContent = `${r.ancho} × ${r.alto} cm · precio estimado${st.cfg.envioGratis ? " · ✓ envío gratis" : ""}`; }
  document.querySelectorAll(".medidas input")[0] && (document.querySelectorAll(".medidas input")[0].value = st.e.ancho);
  document.querySelectorAll(".medidas input")[1] && (document.querySelectorAll(".medidas input")[1].value = st.e.alto);
  const rango = document.querySelector(".rango"); if (rango && Number(rango.value) !== st.e.ancho) rango.value = st.e.ancho;
};
window.cxAlto = (v) => { const n = Math.round(Number(v) * 10) / 10; if (n > 0) { st.e.alto = n; st.altoManual = true; } pintar(); };

// Arrastrar y soltar el archivo sobre la caja de subir
document.addEventListener("dragover", (e) => { if (e.target.closest?.(".subir")) e.preventDefault(); });
document.addEventListener("drop", (e) => { if (!e.target.closest?.(".subir")) return; e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) cxArchivo(f); });

// Mide qué tan complejo es el diseño: separa el logo del fondo y cuenta cuánto borde tiene.
// Más bordes (letras, detalles, piezas) = más minutos de láser.
function medirComplejidad(img) {
  try {
    const lado = 220, k = Math.min(1, lado / Math.max(img.width, img.height));
    const w = Math.max(8, Math.round(img.width * k)), h = Math.max(8, Math.round(img.height * k));
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0, w, h);
    const d = cx.getImageData(0, 0, w, h).data;
    // Color del fondo: el promedio de las 4 esquinas
    const esquina = (x, y) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };
    const es = [esquina(0, 0), esquina(w - 1, 0), esquina(0, h - 1), esquina(w - 1, h - 1)];
    const fondo = [0, 1, 2, 3].map(j => es.reduce((t, e) => t + e[j], 0) / 4);
    const transparente = fondo[3] < 40;
    const lleno = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      lleno[p] = transparente ? (d[i + 3] > 100 ? 1 : 0)
        : (Math.abs(d[i] - fondo[0]) + Math.abs(d[i + 1] - fondo[1]) + Math.abs(d[i + 2] - fondo[2]) > 90 ? 1 : 0);
    }
    let bordes = 0, relleno = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (!lleno[p]) continue;
      relleno++;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !lleno[p - 1] || !lleno[p + 1] || !lleno[p - w] || !lleno[p + w]) bordes++;
    }
    return complejidadDe({ bordes, relleno });
  } catch { return "medio"; }
}

// Achica la imagen en el navegador (máx. 1400 px) para subirla rápido
window.cxArchivo = (file) => {
  st.error = "";
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { st.error = "Sube una imagen JPG, PNG o WEBP."; return pintar(); }
  const lector = new FileReader();
  lector.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 1400, k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      const png = file.type === "image/png";
      const dataUrl = cv.toDataURL(png ? "image/png" : "image/jpeg", 0.92);
      st.recorte = { dataUrl, png, w: cv.width, h: cv.height, x: 0.05, y: 0.05, cw: 0.9, ch: 0.9 };
      st.logo = null; st.maqueta = null; st.cotizacion = null;
      pintar();
    };
    img.onerror = () => { st.error = "No pudimos abrir esa imagen. Prueba con otra."; pintar(); };
    img.src = lector.result;
  };
  lector.readAsDataURL(file);
};

// ---------- Recortar el logo (arrastrando las esquinas o la caja) ----------
const cajaEstilo = () => { const r = st.recorte; return `left:${r.x * 100}%;top:${r.y * 100}%;width:${r.cw * 100}%;height:${r.ch * 100}%`; };
let arrastre = null;
document.addEventListener("pointerdown", (e) => {
  const caja = e.target.closest?.("#cxCaja");
  if (!caja || !st.recorte) return;
  e.preventDefault();
  const zona = $("cxRecorte").getBoundingClientRect();
  arrastre = { h: e.target.dataset?.h || "mover", x0: e.clientX, y0: e.clientY, zona, ini: { ...st.recorte } };
  caja.setPointerCapture?.(e.pointerId);
});
document.addEventListener("pointermove", (e) => {
  if (!arrastre) return;
  const r = st.recorte, a = arrastre, i = a.ini;
  const dx = (e.clientX - a.x0) / a.zona.width, dy = (e.clientY - a.y0) / a.zona.height;
  const min = 0.08, lim = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  if (a.h === "mover") { r.x = lim(i.x + dx, 0, 1 - i.cw); r.y = lim(i.y + dy, 0, 1 - i.ch); }
  else {
    let x1 = i.x, y1 = i.y, x2 = i.x + i.cw, y2 = i.y + i.ch;
    if (a.h.includes("w")) x1 = lim(i.x + dx, 0, x2 - min);
    if (a.h.includes("e")) x2 = lim(i.x + i.cw + dx, x1 + min, 1);
    if (a.h.includes("n")) y1 = lim(i.y + dy, 0, y2 - min);
    if (a.h.includes("s")) y2 = lim(i.y + i.ch + dy, y1 + min, 1);
    r.x = x1; r.y = y1; r.cw = x2 - x1; r.ch = y2 - y1;
  }
  const caja = $("cxCaja"); if (caja) caja.style.cssText = cajaEstilo();
});
document.addEventListener("pointerup", () => { arrastre = null; });

// Lo que se le manda a la IA: sin transparencia. Un PNG con fondo transparente y dibujo negro le llega
// "negro sobre negro" (vacío) y la IA termina copiando la foto de ejemplo. Se pone un fondo que contraste.
function paraLaIA(cv) {
  try {
    const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
    let transp = 0, suma = 0, n = 0;
    const paso = Math.max(1, Math.floor(d.length / 4 / 40000));
    for (let p = 0; p < d.length / 4; p += paso) {
      const i = p * 4;
      if (d[i + 3] < 200) { transp++; continue; }
      suma += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++;
    }
    const total = Math.ceil(d.length / 4 / paso);
    if (transp < total * 0.02) return cv.toDataURL("image/jpeg", 0.92);   // no tiene transparencia
    const claro = n ? suma / n > 150 : false;                                // logo claro → fondo oscuro
    const out = document.createElement("canvas"); out.width = cv.width; out.height = cv.height;
    const cx = out.getContext("2d");
    cx.fillStyle = claro ? "#1f2430" : "#ffffff"; cx.fillRect(0, 0, out.width, out.height);
    cx.drawImage(cv, 0, 0);
    return out.toDataURL("image/jpeg", 0.92);
  } catch { return cv.toDataURL("image/jpeg", 0.92); }
}

// Corta la imagen y la deja lista como logo
function aplicarRecorte(completa = false) {
  const r = st.recorte; if (!r) return;
  const img = new Image();
  img.onload = () => {
    const sx = completa ? 0 : Math.round(r.x * r.w), sy = completa ? 0 : Math.round(r.y * r.h);
    const sw = completa ? r.w : Math.max(10, Math.round(r.cw * r.w)), sh = completa ? r.h : Math.max(10, Math.round(r.ch * r.h));
    const cv = document.createElement("canvas"); cv.width = sw; cv.height = sh;
    cv.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    let dataUrl = cv.toDataURL(r.png ? "image/png" : "image/jpeg", 0.9);
    if (dataUrl.length > 3.8e6) dataUrl = cv.toDataURL("image/jpeg", 0.82);
    const fin = new Image();
    fin.onload = () => {
      st.logo = { dataUrl, ratio: sh / sw, envio: paraLaIA(cv) };
      st.altoManual = false;
      st.e.alto = altoDe(st.e.ancho, st.logo.ratio);
      st.recorteHecho = st.recorte; st.recorte = null;
      pintar();
    };
    fin.src = dataUrl;
  };
  img.src = r.dataUrl;
}
window.cxRecortar = () => aplicarRecorte(false);
window.cxSinRecorte = () => aplicarRecorte(true);
window.cxVolverRecortar = () => { if (st.recorteHecho) { st.recorte = st.recorteHecho; st.logo = null; pintar(); } };

// Pide la maqueta a la IA (mientras, muestra los beneficios de la marca)
window.cxMaqueta = async () => {
  if (!st.logo) return cxIr("subir");
  st.error = ""; st.aviso = "";
  st.paso = "generando"; pintar(); arriba();
  const colores = ["#22d3ee", "#a855f7", "#ec4899", "#facc15", "#34d399", "#f97316", "#6366f1"];
  let n = 0, prog = 4;
  const reloj = setInterval(() => {
    n++; prog = Math.min(94, prog + (prog < 60 ? 6 : 2));
    const e = $("cxEsfera"), b = $("cxBeneficio"), p = $("cxProgreso");
    if (e) e.style.setProperty("--c", colores[n % colores.length]);
    if (b && st.cfg.beneficios.length) b.textContent = st.cfg.beneficios[n % st.cfg.beneficios.length];
    if (p) p.style.width = `${prog}%`;
  }, 1600);
  try {
    if (!st.cfg.conMaqueta) await new Promise(r => setTimeout(r, 1500));
    const r = await api("POST", `/api/cotiza/${encodeURIComponent(clave)}/maqueta`, { logo: st.logo.envio || st.logo.dataUrl, eleccion: st.e });
    st.cotizacion = r.cotizacion; st.maqueta = r.maqueta; st.aviso = r.aviso || "";
  } catch (e) {
    st.aviso = e.message;
  }
  clearInterval(reloj);
  st.paso = "resultado"; pintar(); arriba();
};

window.cxPedir = async () => {
  st.error = ""; st.enviando = true; pintar();
  try {
    const r = await api("POST", `/api/cotiza/${encodeURIComponent(clave)}/pedido`, { cotizacion: st.cotizacion, eleccion: st.e, notas: st.notas });
    st.enviando = false; pintar();
    if (r.whatsapp) window.open(r.whatsapp, "_blank", "noopener");
    else { try { await navigator.clipboard.writeText(r.texto); } catch {} st.aviso = "Copiamos tu pedido. Escríbenos y pégalo en el chat."; pintar(); }
  } catch (e) { st.enviando = false; st.error = e.message; pintar(); }
};

iniciar();
