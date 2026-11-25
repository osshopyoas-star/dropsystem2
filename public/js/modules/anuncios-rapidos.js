// =============================================
// 📣 ANUNCIOS RÁPIDOS — productos que salen directo a testear (sin landing en Desarrollo)
// Ficha corta (nombre, fotos, precio, oferta, colores, quién lo compra) → la misma pantalla de
// Ads estáticos de Desarrollo (18 estructuras, mezcla automática, titulares y botón).
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");
const iconos = () => { if (window.lucide) lucide.createIcons(); };
let fotos = [];          // data URLs ya achicadas
let creando = false;

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
function achicar(archivo, max = 1600) {
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
const num = (id) => Number(String($(id)?.value || "").replace(/\D/g, "")) || null;

function render(view, lista = []) {
  const mios = lista.filter(p => p.soloAnuncios);
  view.innerHTML = `
  <div class="est-page">
    <header class="est-head"><div>
      <h1>Anuncios rápidos</h1>
      <p class="est-muted">Para productos que salen directo a testear, sin hacer la landing en Desarrollo. Llena lo básico y CoDropX te arma los anuncios de imagen con las 18 estructuras ganadoras.</p>
    </div></header>

    <div class="est-cols">
      <div class="est-card">
        <h3>Producto nuevo</h3>
        <div class="est-form">
          <label>Nombre del producto</label><input id="arNombre" placeholder="Ej: morral acolchado" maxlength="120">
          <div class="est-row">
            <div><label>País</label><select id="arPais"><option value="CO">Colombia</option><option value="EC">Ecuador</option></select></div>
            <div><label>Tipo</label><select id="arTipo"><option value="producto">Producto</option><option value="moda">Moda (ropa, bolsos, calzado)</option></select></div>
          </div>
          <label>Fotos del producto (hasta 6; sirven las del proveedor)</label>
          <div class="ar-fotos" id="arFotos">${fotosHTML()}</div>
          <label class="est-btn chico ar-subir"><i data-lucide="image-plus"></i> Subir fotos<input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onchange="arFotos(this.files); this.value=''"></label>
          <div class="est-row">
            <div><label>Precio</label><input id="arPrecio" inputmode="numeric" placeholder="Ej: 139900"></div>
            <div><label>Precio antes (tachado)</label><input id="arAntes" inputmode="numeric" placeholder="Opcional"></div>
          </div>
          <div class="est-row">
            <div><label>Oferta</label><select id="arOferta"><option value="descuento">Precio normal / descuento</option><option value="2x1">2x1 (compra 1 y lleva 2)</option></select></div>
            <div><label>&nbsp;</label><label class="est-check"><input type="checkbox" id="arEnvio"> Envío gratis (si es verdad)</label></div>
          </div>
          <label>Colores (separados por coma)</label><input id="arColores" placeholder="Ej: Negro, Rosado, Beige" maxlength="200">
          <label>¿Quién lo compra?</label><input id="arQuien" placeholder="Ej: mujer de 25 a 35 años que trabaja en oficina" maxlength="200">
          <label>¿Qué problema le resuelve? (opcional)</label><input id="arProblema" placeholder="Ej: carga todo en un bolso pesado que le cansa el hombro" maxlength="250">
          <label>Descripción del proveedor (opcional)</label><textarea id="arDesc" rows="3" placeholder="Pega aquí lo que dice el proveedor"></textarea>
        </div>
        <button id="arCrear" class="est-btn primary" onclick="arCrear()" ${creando ? "disabled" : ""}><i data-lucide="wand-sparkles"></i> Crear y hacer anuncios</button>
        <p class="est-hint">CoDropX revisa tus fotos con IA (para saber cómo es el producto y qué textos del proveedor no copiar) y te lleva a los anuncios.</p>
      </div>

      <div class="est-card">
        <h3>Mis productos de anuncios rápidos</h3>
        ${mios.length ? `<div class="ar-lista">${mios.map(p => `
          <button class="ar-item" onclick="arAbrir('${esc(p._id)}')">
            <b>${esc(p.nombre)}</b><span class="est-muted">${p.pais === "EC" ? "Ecuador" : "Colombia"} · ${new Date(p.actualizado || p.creado).toLocaleDateString("es-CO")}</span>
            <i data-lucide="arrow-right"></i>
          </button>`).join("")}</div>` : `<p class="est-muted">Todavía no tienes. Crea el primero aquí al lado.</p>`}
        <p class="est-hint">Si después el producto vende, ábrelo en Desarrollo para hacerle la landing: la Ficha y las fotos ya quedan guardadas.</p>
      </div>
    </div>
  </div>`;
  iconos();
}
function fotosHTML() {
  return fotos.map((f, i) => `<div class="ar-foto"><img src="${f}" alt="Foto ${i + 1}"><button onclick="arQuitarFoto(${i})" title="Quitar">✕</button></div>`).join("");
}
window.arFotos = async (files) => {
  for (const f of [...(files || [])].filter(f => /^image\//.test(f.type))) {
    if (fotos.length >= 6) { avisar("Máximo 6 fotos", "error"); break; }
    try { fotos.push(await achicar(f)); } catch (e) { avisar(e.message, "error"); }
  }
  $("arFotos").innerHTML = fotosHTML();
};
window.arQuitarFoto = (i) => { fotos.splice(i, 1); $("arFotos").innerHTML = fotosHTML(); };

function abrirEnAnuncios(id) {
  try { localStorage.setItem("est_sub_anuncio", "ads"); localStorage.setItem(`est_av_${id}`, "A"); } catch {}
  window.goTo("desarrollo");
  let n = 0;
  const t = setInterval(() => {
    if (typeof window.estAbrirProyectoEn === "function" && window.enPantalla?.("desarrollo")) { clearInterval(t); Promise.resolve(window.estAbrirProyectoEn(id, 5)).then(() => window.estSubAnuncio?.("ads")); }
    else if (++n > 40) clearInterval(t);
  }, 150);
}
window.arAbrir = (id) => abrirEnAnuncios(id);

window.arCrear = async () => {
  if (creando) return;
  const nombre = $("arNombre").value.trim();
  if (!nombre) return avisar("Escribe el nombre del producto", "error");
  if (!fotos.length) return avisar("Sube al menos una foto del producto", "error");
  const precio = num("arPrecio");
  if (!precio) return avisar("Escribe el precio", "error");
  const quien = $("arQuien").value.trim();
  if (!quien) return avisar("Escribe quién lo compra", "error");
  creando = true;
  const b = $("arCrear");
  const paso = (t) => { if (b) { b.disabled = true; b.innerHTML = `<span class="est-spin"></span> ${t}`; } };
  try {
    paso("Creando...");
    const p = await api("POST", "/api/proyectos", { nombre, pais: $("arPais").value, tipo: $("arTipo").value, soloAnuncios: true });
    const colores = $("arColores").value.split(",").map(x => x.trim()).filter(Boolean).slice(0, 12);
    const antes = num("arAntes");
    await api("PUT", `/api/proyectos/${p._id}`, {
      fotos,
      numAvatares: 1,
      avatares: [{ id: "A", quien, problema: $("arProblema").value.trim(), palabras: $("arProblema").value.trim() }],
      paso: 5,
      ficha: {
        descripcion: $("arDesc").value.trim(),
        precio, precioAntes: antes && antes > precio ? antes : null,
        oferta: { tipo: $("arOferta").value === "2x1" ? "2x1" : "descuento" },
        variantesLista: colores.map(c => ({ tipo: "color", nombre: c, hex: "#888888", foto: "" })),
        promesas: { envioGratis: !!$("arEnvio").checked }
      }
    });
    paso("Revisando las fotos con IA...");
    try { await api("POST", `/api/proyectos/${p._id}/ia/revisar`); } catch (e) { avisar(`No se pudieron revisar las fotos (${e.message}). Igual puedes seguir.`, "error"); }
    fotos = [];
    avisar("Listo. Ahora elige los anuncios ✓");
    abrirEnAnuncios(p._id);
  } catch (e) {
    avisar(e.message, "error");
  } finally {
    creando = false;
    if ($("arCrear")) { $("arCrear").disabled = false; $("arCrear").innerHTML = `<i data-lucide="wand-sparkles"></i> Crear y hacer anuncios`; iconos(); }
  }
};

registrarRuta("anuncios", async (view) => {
  window.marcarMenuActivo?.("anuncios");
  view.innerHTML = `<div class="est-page"><p class="est-muted">Cargando...</p></div>`;
  let lista = [];
  try { lista = await api("GET", "/api/proyectos"); } catch {}
  render(view, Array.isArray(lista) ? lista : []);
});
