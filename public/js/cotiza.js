// =============================================
// Página pública del cotizador de letreros (/cotiza/:clave)
// Pasos: inicio → subir logo → material → dónde va y luz → tamaño → maqueta → precio y pedido
// =============================================
import { cotizar, altoDe, formatoPlata } from "./core/cotizador.js";

const clave = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "");
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = $("app");

const st = {
  cfg: null, paso: "inicio",
  logo: null,            // { dataUrl, ratio }
  e: { material: "", luz: "", ubicacion: "", montaje: "", ancho: 60, alto: 60, cantidad: 1 },
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
    st.e.ancho = st.cfg.anchoDefecto;
    st.e.material = st.cfg.materiales[0]?.id || "";
    st.e.luz = st.cfg.luces[0]?.id || "";
    st.e.ubicacion = st.cfg.ubicaciones[0]?.id || "";
    st.e.montaje = st.cfg.montajes[0]?.id || "";
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

function opcion(grupo, x, extra = "") {
  const on = st.e[grupo] === x.id;
  return `<button class="op ${on ? "on" : ""}" onclick="cxElegir('${grupo}','${esc(x.id)}')">${extra ? `<span class="extra">${esc(extra)}</span>` : ""}<b>${esc(x.nombre)}</b>${x.desc ? `<small>${esc(x.desc)}</small>` : ""}</button>`;
}

function pintar() {
  const c = st.cfg;
  const r = q();
  let html = "";
  if (st.paso === "inicio") {
    const titulo = esc(c.titulo).replace(/(letrero|logo|neón|neon)/i, '<span class="brilla">$1</span>');
    html = `<div class="marca">${esc(c.marca)}</div>
      <h1>${titulo}</h1>
      <p class="sub">${esc(c.subtitulo)}</p>
      <button class="btn" onclick="cxIr('subir')">Sube tu logo y míralo</button>
      <p class="mini">Gratis y sin compromiso · precio al instante</p>
      ${galeria("trabajo", "Trabajos que ya entregamos")}
      ${galeria("resena", "Lo que dicen nuestros clientes")}`;
  } else if (st.paso === "subir") {
    html = `${pasos()}<h2>Sube tu logo o diseño</h2><p class="sub">Una foto, captura o archivo de tu logo. Mientras más claro, mejor sale.</p>
      <label class="subir" for="cxArchivo"><span class="ico">⬆️</span><b>${st.logo ? "Cambiar imagen" : "Toca para subir"}</b><small>JPG, PNG o WEBP</small></label>
      <input id="cxArchivo" type="file" accept="image/png,image/jpeg,image/webp" class="oculto" onchange="cxArchivo(this.files[0])">
      ${st.error ? `<div class="error">${esc(st.error)}</div>` : ""}
      ${st.logo ? `<div style="margin-top:14px">${pared()}</div>` : ""}
      <div class="fila"><button class="btn claro" onclick="cxIr('inicio')">Atrás</button><button class="btn" ${st.logo ? "" : "disabled"} onclick="cxIr('material')">Continuar</button></div>`;
  } else if (st.paso === "material") {
    html = `${pasos()}<h2>¿En qué material lo quieres?</h2><p class="sub">Lo fabricamos con corte láser a la medida.</p>
      <div class="opciones dos">${c.materiales.map(m => opcion("material", m)).join("")}</div>
      <div class="fila"><button class="btn claro" onclick="cxIr('subir')">Atrás</button><button class="btn" onclick="cxIr('lugar')">Continuar</button></div>`;
  } else if (st.paso === "lugar") {
    const m = c.materiales.find(x => x.id === st.e.material);
    html = `${pasos()}<h2>¿Dónde lo vas a poner?</h2><p class="sub">Así sabemos qué tan resistente tiene que ser.</p>
      <div class="opciones dos">${c.ubicaciones.map(u => opcion("ubicacion", u, u.pct ? `+${u.pct}%` : "")).join("")}</div>
      ${m?.conLuz ? `<h2 style="margin-top:26px">¿Qué luz quieres?</h2><div class="opciones dos" style="margin-top:12px">${c.luces.map(l => opcion("luz", l, l.pct ? `+${l.pct}%` : "")).join("")}</div>` : ""}
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
          <tr><td>${esc(r.material.nombre)} · ${r.ancho} × ${r.alto} cm${r.minimoAplicado ? " (precio mínimo)" : ""}</td><td>${plata(r.base)}</td></tr>
          ${r.recargoLuz ? `<tr><td>Luz: ${esc(r.luz.nombre)}</td><td>+${plata(r.recargoLuz)}</td></tr>` : ""}
          ${r.recargoUbicacion ? `<tr><td>${esc(r.ubicacion.nombre)}</td><td>+${plata(r.recargoUbicacion)}</td></tr>` : ""}
          ${r.precioMontaje ? `<tr><td>${esc(r.montaje.nombre)}</td><td>+${plata(r.precioMontaje)}</td></tr>` : ""}
          ${r.cantidad > 1 ? `<tr><td>× ${r.cantidad} unidades</td><td></td></tr>` : ""}
          <tr class="tot"><td>Total</td><td>${plata(r.total)}</td></tr>
          ${c.anticipoPct > 0 && c.anticipoPct < 100 ? `<tr><td>Anticipo para empezar (${c.anticipoPct}%)</td><td>${plata(r.anticipo)}</td></tr>` : ""}
        </table>` : ""}
      </div>
      <label class="campo" style="margin-top:16px">¿Algún cambio o detalle? (opcional)<textarea id="cxNotas" placeholder="Colores, letras, dónde va, para cuándo lo necesitas…" oninput="cxNotas(this.value)">${esc(st.notas)}</textarea></label>
      ${st.error ? `<div class="error">${esc(st.error)}</div>` : ""}
      <div class="fila"><button class="btn wa" onclick="cxPedir()" ${st.enviando ? "disabled" : ""}>${st.enviando ? "Armando tu pedido…" : c.whatsapp ? "Pedir por WhatsApp" : "Quiero este letrero"}</button></div>
      <div class="fila"><button class="btn claro" onclick="cxIr('tamano')">Cambiar tamaño u opciones</button></div>
      ${galeria("trabajo", "Trabajos que ya entregamos")}
      ${galeria("resena", "Lo que dicen nuestros clientes")}`;
  }
  app.innerHTML = html;
  // Barra de precio abajo (desde que eliges material hasta antes del resultado)
  const barra = $("barra");
  const verBarra = r && ["material", "lugar", "tamano"].includes(st.paso);
  barra.classList.toggle("ver", !!verBarra);
  if (verBarra) {
    $("barraTotal").textContent = plata(r.total);
    $("barraTxt").textContent = `${r.ancho} × ${r.alto} cm · precio estimado`;
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
  if (r) { $("barraTotal").textContent = plata(r.total); $("barraTxt").textContent = `${r.ancho} × ${r.alto} cm · precio estimado`; }
  document.querySelectorAll(".medidas input")[0] && (document.querySelectorAll(".medidas input")[0].value = st.e.ancho);
  document.querySelectorAll(".medidas input")[1] && (document.querySelectorAll(".medidas input")[1].value = st.e.alto);
  const rango = document.querySelector(".rango"); if (rango && Number(rango.value) !== st.e.ancho) rango.value = st.e.ancho;
};
window.cxAlto = (v) => { const n = Math.round(Number(v) * 10) / 10; if (n > 0) { st.e.alto = n; st.altoManual = true; } pintar(); };

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
      let dataUrl = cv.toDataURL(png ? "image/png" : "image/jpeg", 0.9);
      if (dataUrl.length > 3.8e6) dataUrl = cv.toDataURL("image/jpeg", 0.82);
      st.logo = { dataUrl, ratio: cv.height / cv.width };
      st.altoManual = false;
      st.e.alto = altoDe(st.e.ancho, st.logo.ratio);
      st.maqueta = null; st.cotizacion = null;
      pintar();
    };
    img.onerror = () => { st.error = "No pudimos abrir esa imagen. Prueba con otra."; pintar(); };
    img.src = lector.result;
  };
  lector.readAsDataURL(file);
};

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
    const r = await api("POST", `/api/cotiza/${encodeURIComponent(clave)}/maqueta`, { logo: st.logo.dataUrl, eleccion: st.e });
    st.cotizacion = r.cotizacion; st.maqueta = r.maqueta; st.aviso = st.cfg.conMaqueta ? (r.aviso || "") : "";
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
