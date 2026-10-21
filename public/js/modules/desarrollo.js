// =============================================
// Desarrollo con IA: avatares, ángulos, guiones y creativos
// =============================================
import { state } from "../state.js";
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";

window.previewImagenDev = function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const empty = document.getElementById("devUploadEmpty");
  const preview = document.getElementById("devUploadPreview");
  const img = document.getElementById("devUploadImg");
  const name = document.getElementById("devUploadName");

  const url = URL.createObjectURL(file);

  if (img) {
    img.src = url;
    img.style.display = "block";
  }

  if (name) name.textContent = file.name;

  empty?.classList.add("hidden");
  preview?.classList.remove("hidden");
};

function guardarEstadoDesarrollo() {
  const producto = document.getElementById("inputProductoDev")?.value || "";
  const info = document.getElementById("inputInfoDev")?.value || "";
  const tipo = document.getElementById("tipoDesarrolloDev")?.value || "completo";
  const resultado = document.getElementById("resultadoDesarrollo")?.innerHTML || "";
  const claseResultado = document.getElementById("resultadoDesarrollo")?.className || "dev-result-empty";
  const nombreImagen = document.getElementById("devUploadName")?.textContent || "";
  const previewSrc = document.getElementById("devUploadImg")?.src || "";

  localStorage.setItem("dev_producto", producto);
  localStorage.setItem("dev_info", info);
  localStorage.setItem("dev_tipo", tipo);
  localStorage.setItem("dev_resultado_html", resultado);
  localStorage.setItem("dev_resultado_class", claseResultado);
  localStorage.setItem("dev_imagen_nombre", nombreImagen);
  localStorage.setItem("dev_imagen_preview", previewSrc);
}

function restaurarEstadoDesarrollo() {
  const producto = localStorage.getItem("dev_producto") || "";
  const info = localStorage.getItem("dev_info") || "";
  const tipo = localStorage.getItem("dev_tipo") || "completo";
  const resultadoHtml = localStorage.getItem("dev_resultado_html") || "";
  const resultadoClass = localStorage.getItem("dev_resultado_class") || "dev-result-empty";
  const imagenNombre = localStorage.getItem("dev_imagen_nombre") || "";
  const imagenPreview = localStorage.getItem("dev_imagen_preview") || "";

  const inputProducto = document.getElementById("inputProductoDev");
  const inputInfo = document.getElementById("inputInfoDev");
  const inputTipo = document.getElementById("tipoDesarrolloDev");
  const resultado = document.getElementById("resultadoDesarrollo");

  if (inputProducto) inputProducto.value = producto;
  if (inputInfo) inputInfo.value = info;
  if (inputTipo) inputTipo.value = tipo;

  if (resultado && resultadoHtml) {
    resultado.className = resultadoClass;
    resultado.innerHTML = resultadoHtml;
  }

  if (imagenPreview) {
    const empty = document.getElementById("devUploadEmpty");
    const preview = document.getElementById("devUploadPreview");
    const img = document.getElementById("devUploadImg");
    const name = document.getElementById("devUploadName");

    if (img) img.src = imagenPreview;
    if (name) name.textContent = imagenNombre;

    empty?.classList.add("hidden");
    preview?.classList.remove("hidden");
  }

  if (window.lucide) lucide.createIcons();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.generarDesarrollo = async function() {
  const producto = document.getElementById("inputProductoDev")?.value?.trim();
  const info = document.getElementById("inputInfoDev")?.value?.trim();
  const tipo = document.getElementById("tipoDesarrolloDev")?.value || "completo";
  const resultado = document.getElementById("resultadoDesarrollo");
  const imageInput = document.getElementById("inputImagenDev");
  const imageFile = imageInput?.files?.[0] || null;

  if (!producto && !imageFile) {
    alert("Escribe el producto o sube una imagen");
    return;
  }

  resultado.className = "dev-result-loading";
  resultado.innerHTML = `
    <div class="dev-loading-box">
      <div class="dev-loading-spinner"></div>
      <p>Generando estrategia de desarrollo...</p>
    </div>
  `;
  guardarEstadoDesarrollo();

  try {
    let imageBase64 = null;

    if (imageFile) {
      imageBase64 = await fileToBase64(imageFile);
    }

   let res;
let raw = "";

try {
  // El prompt vive en el servidor (prompts.js): aquí solo enviamos los datos
  res = await fetch("/api/ia/desarrollo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      producto,
      info,
      tipo,
      image: imageBase64,
      productoId: productoVinculado(producto)
    })
  });
} catch (err) {
  throw new Error("No se pudo conectar con el servidor. Revisa tu internet.");
}

raw = await res.text();

let data;

try {
  data = JSON.parse(raw);
} catch (e) {
  throw new Error("El servidor devolvió HTML o respuesta inválida");
}

    if (!res.ok) {
      throw new Error(data?.error || "Error generando desarrollo");
    }

    const reply = data && data.reply ? data.reply : "Sin respuesta del servidor";
resultado.className = "dev-result-box";
resultado.innerHTML = `
  <div class="dev-result-toolbar">
    <span class="dev-result-pill">IA lista</span>
  </div>
  ${renderParsedDesarrollo(reply)}
`;

guardarEstadoDesarrollo();
cargarHistorialDesarrollo();

if (window.lucide) lucide.createIcons();

  } catch (error) {
  resultado.className = "dev-result-error";
  resultado.innerHTML = `
    <div class="dev-error-box">
      <strong>Error</strong>
      <p>${error.message || "Falló la conexión con la IA"}</p>
    </div>
  `;

  guardarEstadoDesarrollo();
  console.error("Error en generarDesarrollo:", error);
}
};

function escapeHtmlDev(str = "") {
  return String(str).replace(/[&<>"']/g, function(m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m];
  });
}

function splitBlocks(text) {
  const normalized = String(text || "").replace(/\r/g, "").trim();

  const patterns = [
    { key: "avatares", regex: /(?:^|\n)(?:1[\).\-\s]*|#+\s*)\s*AVATARES\b/i },
    { key: "angulos", regex: /(?:^|\n)(?:2[\).\-\s]*|#+\s*)\s*[ÁA]NGULOS\b/i },
    { key: "guiones", regex: /(?:^|\n)(?:3[\).\-\s]*|#+\s*)\s*GUIONES(?:\s+DE\s+VIDEO)?\b/i },
    { key: "creativos", regex: /(?:^|\n)(?:4[\).\-\s]*|#+\s*)\s*CREATIVOS(?:\s+DE\s+IMAGEN)?\b/i },
    { key: "recomendacion", regex: /(?:^|\n)(?:5[\).\-\s]*|#+\s*)\s*RECOMENDACI[ÓO]N(?:\s+FINAL)?\b/i }
  ];

  const found = patterns
    .map(p => {
      const match = normalized.match(p.regex);
      return match ? { key: p.key, index: match.index, match: match[0] } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);

  if (!found.length) {
    return {
      avatares: "",
      angulos: "",
      guiones: "",
      creativos: "",
      recomendacion: "",
      raw: normalized
    };
  }

  const result = {
    avatares: "",
    angulos: "",
    guiones: "",
    creativos: "",
    recomendacion: "",
    raw: ""
  };

  for (let i = 0; i < found.length; i++) {
    const current = found[i];
    const next = found[i + 1];
    const start = current.index;
    const end = next ? next.index : normalized.length;
    result[current.key] = normalized.slice(start, end).trim();
  }

  return result;
}

function formatSectionHtml(text = "") {
  if (!text) {
    return `<div class="dev-card-empty">Sin contenido</div>`;
  }

  const safe = escapeHtmlDev(text);

  const html = safe
    .split("\n")
    .map(line => {
      const trimmed = line.trim();

      if (!trimmed) {
        return `<div class="dev-line-space"></div>`;
      }

      if (/^(AVATARES|ÁNGULOS|ANGULOS|GUIONES|GUIONES DE VIDEO|CREATIVOS|CREATIVOS DE IMAGEN|RECOMENDACIÓN FINAL|RECOMENDACION FINAL)\b/i.test(trimmed.replace(/^(\d+[\).\-\s]*)/, ""))) {
        return `<h4 class="dev-section-mini-title">${trimmed}</h4>`;
      }

      if (/^[-•*]\s+/.test(trimmed) || /^\d+[\).\s-]+/.test(trimmed)) {
        return `<div class="dev-bullet-row">${trimmed}</div>`;
      }

      if (/^[A-ZÁÉÍÓÚÑ0-9 ][A-ZÁÉÍÓÚÑ0-9 :\-]{4,}$/i.test(trimmed) && trimmed.length < 90) {
        return `<h5 class="dev-subblock-title">${trimmed}</h5>`;
      }

      return `<p class="dev-paragraph">${trimmed}</p>`;
    })
    .join("");

  return html;
}

function renderParsedDesarrollo(reply = "") {
  const bloques = extraerBloquesPorAvatar(reply);

  if (!bloques.length) {
    return `
      <div class="pro-card full">
        <div class="pro-card-head">
          <div class="pro-icon">📄</div>
          <h3>Resultado completo</h3>
        </div>
        <div class="pro-card-body">
          ${formatProContent(reply)}
        </div>
      </div>
    `;
  }

  window._devAvatars = bloques;

  return `
    <div class="dev-avatar-grid">
      <div class="dev-avatar-header">
        <h2>Resultado completo</h2>
      </div>

      <div class="dev-avatar-cards">
        ${bloques.map(a => `
          <div class="dev-avatar-card">
           <div class="dev-avatar-icon" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:50%;width:52px;height:52px;display:flex;align-items:center;justify-content:center;">
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/><circle cx="9" cy="16" r="1" fill="white"/><circle cx="15" cy="16" r="1" fill="white"/><path d="M12 3v2"/></svg>
</div>
            <button onclick="abrirAvatarModal(${a.id})" class="dev-avatar-btn">
              AVATAR ${a.id}
            </button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function extraerBloquesPorAvatar(texto = "") {
  const limpio = String(texto).replace(/\r/g, "").trim();

  // SOLO toma los títulos que empiezan al inicio de línea:
  // AVATAR 1:
  // AVATAR 2:
  // AVATAR 3:
  // y NO ÁNGULOS AVATAR 1, GUIONES AVATAR 1, etc.
  const regex = /(?:^|\n)AVATAR\s*(\d+)\s*:\s*([\s\S]*?)(?=(?:\nAVATAR\s*\d+\s*:)|(?:\nRECOMENDACIÓN FINAL:)|(?:\nRECOMENDACION FINAL:)|$)/g;

  const bloques = [];
  let match;

  while ((match = regex.exec(limpio)) !== null) {
    const id = Number(match[1]);
    const bloque = match[2].trim();

    const avatarInfo = extraerSeccion(
      bloque,
      /^(Nombre:|Dolor principal:|Deseo:|Objeción:|Trigger de compra:)/im,
      /^(ÁNGULOS AVATAR|ANGULOS AVATAR)/im
    );

    const angulos = extraerSeccion(
      bloque,
      /^(ÁNGULOS AVATAR|ANGULOS AVATAR)/im,
      /^GUIONES AVATAR/im
    );

    const guiones = extraerSeccion(
      bloque,
      /^GUIONES AVATAR/im,
      /^IDEAS AVATAR/im
    );

    const ideas = extraerSeccion(
      bloque,
      /^IDEAS AVATAR/im,
      /^(RECOMENDACIÓN FINAL:|RECOMENDACION FINAL:)/im
    );

    bloques.push({
      id,
      avatar: avatarInfo || bloque,
      angulos: angulos || "",
      guiones: guiones || "",
      ideas: ideas || ""
    });
  }

  return bloques;
}

function extraerSeccion(texto, inicioRegex, finRegex) {
  const matchInicio = texto.match(inicioRegex);
  if (!matchInicio) return "";

  const inicio = matchInicio.index;
  const desdeInicio = texto.slice(inicio);

  const matchFin = desdeInicio.slice(1).match(finRegex);

  if (!matchFin) return desdeInicio.trim();

  const fin = matchFin.index + 1;
  return desdeInicio.slice(0, fin).trim();
}

window.abrirAvatarModal = function(id) {

  const a = window._devAvatars.find(x => x.id === id);
  if (!a) return;

  const contenido = document.getElementById("modalAvatarContenido");

  contenido.innerHTML = `
    <h4>👤 Avatar</h4>
    <div class="bloque">${formatProContent(a.avatar)}</div>

    <h4>🎯 Ángulos</h4>
    <div class="bloque">${formatProContent(a.angulos)}</div>

    <h4>🎬 Guiones (AIDA)</h4>
    <div class="bloque">${formatProContent(a.guiones)}</div>

    <h4>🖼 Ideas Creativas</h4>
    <div class="bloque">${formatProContent(a.ideas)}</div>
  `;

  document.getElementById("modalAvatar").classList.remove("hidden");
};

function dividirPorNombre(texto) {
  const partes = texto.split(/Para /i);
  partes.shift();
  return partes.map(p => p.trim());
}

window.cerrarAvatarModal = function() {
  document.getElementById("modalAvatar").classList.add("hidden");
};

function formatProContent(text = "") {
  if (!text) return `<div class="empty">Sin contenido</div>`;

  return text.split("\n").map(line => {
    const l = line.trim();

    if (!l) return "";

    // títulos
    if (/^(#+|\d+\.|\*\*)/.test(l)) {
      return `<div class="pro-title">${l.replace(/\*\*/g, "")}</div>`;
    }

    // bullets
    if (l.startsWith("-") || l.startsWith("•")) {
      return `<div class="pro-bullet">${l}</div>`;
    }

    // AIDA
    if (l.includes("[A:") || l.includes("[I:") || l.includes("[D:")) {
      return `<div class="pro-highlight">${l}</div>`;
    }

    return `<div class="pro-text">${l}</div>`;
  }).join("");
}

window.irDesarrollo = function(index) {

  const producto = state.productos[index];

  if (!producto) return;

  // 🔥 Guardar en localStorage
  localStorage.setItem("dev_producto", producto.nombre || "");
  localStorage.setItem("dev_info", producto.material || "");
  localStorage.setItem("dev_producto_id", producto._id || "");
  localStorage.setItem("dev_producto_id_nombre", producto.nombre || "");

  // 🔥 ir a desarrollo
  goTo("desarrollo");
};

window.removeImagenDev = function(e) {
  e.stopPropagation();

  const input = document.getElementById("inputImagenDev");
  const empty = document.getElementById("devUploadEmpty");
  const preview = document.getElementById("devUploadPreview");
  const img = document.getElementById("devUploadImg");
  const name = document.getElementById("devUploadName");

  if (input) input.value = "";
  if (img) img.src = "";
  if (name) name.textContent = "";

  preview?.classList.add("hidden");
  empty?.classList.remove("hidden");
};

// Ruta: desarrollo
registrarRuta("desarrollo", (view) => {
  view.innerHTML = `
    <div class="dev-page">

      <section class="dev-layout">

        <div class="dev-left">
    <div class="dev-hero-left">
  <div class="dev-badge">
    <i data-lucide="brain"></i>
      <span>Desarrollo de producto</span>
  </div>
</div>
          <div class="dev-card">
            <div class="dev-card-head">
              <h3>Entrada estratégica</h3>
              <p>Describe producto, problema, mecanismo, beneficios o contexto de mercado.</p>
            </div>

            <div class="dev-form">
              <label>Producto / mecanismo / problema</label>
              <input id="inputProductoDev" oninput="guardarEstadoDesarrollo()" placeholder="Ej: parche para dolor de rodilla, mejora movilidad y reduce inflamación">
    <label>Imagen del producto</label>

<div class="dev-upload-box" onclick="document.getElementById('inputImagenDev').click()">
  <input id="inputImagenDev" type="file" accept="image/*" onchange="previewImagenDev(event)" hidden>

  <div id="devUploadEmpty" class="dev-upload-empty">
    <div class="dev-upload-icon">⇪</div>
    <div class="dev-upload-title">Subir Archivo</div>
    <div class="dev-upload-sub">PNG, JPG, WEBP</div>
  </div>

  <div id="devUploadPreview" class="dev-upload-preview hidden">
    <button type="button" class="dev-upload-remove" onclick="removeImagenDev(event)">✕</button>
    <img id="devUploadImg" src="" alt="preview">
    <div id="devUploadName" class="dev-upload-name"></div>
  </div>
</div>              
              <label>Información adicional</label>
             <textarea id="inputInfoDev" oninput="guardarEstadoDesarrollo()" placeholder="Ej: público objetivo, beneficios, objeciones, promesa, competencia..."></textarea>
              <label>Objetivo</label>
              <select id="tipoDesarrolloDev" onchange="guardarEstadoDesarrollo()">
                <option value="completo">Desarrollo completo</option>
                <option value="avatar">Solo avatar</option>
                <option value="angulos">Solo ángulos</option>
                <option value="guiones">Solo guiones</option>
                <option value="creativos">Solo creativos</option>
              </select>

              <button class="primary dev-main-btn" onclick="generarDesarrollo()">
                <i data-lucide="sparkles"></i>
                Generar desarrollo
              </button>
            </div>
          </div>

          <div class="dev-card dev-help-card">
            <div class="dev-card-head">
              <h3>Cómo usarlo</h3>
            </div>

            <ul class="dev-help-list">
              <li>Empieza por el problema principal.</li>
              <li>Luego define mecanismo y producto.</li>
              <li>Después genera avatars y ángulos.</li>
              <li>Con eso construyes landings y creativos.</li>
            </ul>
          </div>

          <div class="dev-card dev-history-card">
            <div class="dev-card-head">
              <h3>Historial</h3>
              <p>Tus desarrollos se guardan solos. Haz clic para volver a verlos.</p>
            </div>
            <div id="devHistorial" class="dev-history-list">
              <p class="dev-history-empty">Cargando...</p>
            </div>
          </div>
        </div>

     <div class="dev-right">
  <div class="dev-card">
    <div class="dev-card-head" style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <h3>Resultado IA</h3>
        <p>Salida organizada para avatar, ángulos, guiones y creativos.</p>
      </div>
      <span id="iaBadge" class="dev-result-pill" style="display:none;">IA lista</span>
    </div>

    <div id="resultadoDesarrollo" class="dev-result-empty">
      <i data-lucide="layout-dashboard"></i>
      <p>Aquí aparecerá el desarrollo del producto.</p>
    </div>
  </div>

 <div id="modalAvatar" class="modal-overlay hidden">
  <div class="modal-box modal-avatar-box">
    
    <button class="modal-close" onclick="cerrarAvatarModal()">✕</button>

    <h3>Detalle Avatar</h3>

      <div id="modalAvatarContenido" style="margin-top:10px;"></div>

      <div style="margin-top:20px; text-align:right;">
        <button onclick="cerrarAvatarModal()">Cerrar</button>
      </div>
    </div>
  </div>
</div>

      </section>
    </div>
  `;

  marcarMenuActivo("desarrollo");

 setTimeout(() => {
  restaurarEstadoDesarrollo();
  cargarHistorialDesarrollo();
  if (window.lucide) lucide.createIcons();
}, 0);

  return;
});


// =============================================
// 📚 HISTORIAL DE DESARROLLOS (guardados en Mongo)
// =============================================
const NOMBRES_TIPO = {
  completo: "Completo", avatar: "Avatar", angulos: "Ángulos", guiones: "Guiones", creativos: "Creativos"
};

// Devuelve el id del producto de la Base de Productos solo si el nombre no se cambió
function productoVinculado(nombreActual) {
  const id = localStorage.getItem("dev_producto_id");
  const nombre = localStorage.getItem("dev_producto_id_nombre");
  return id && nombre && nombre === nombreActual ? id : null;
}

function formatoFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" }) + " · " +
    d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

async function cargarHistorialDesarrollo() {
  const cont = document.getElementById("devHistorial");
  if (!cont) return;

  try {
    const res = await fetch("/api/desarrollos?limit=20");
    if (!res.ok) throw new Error();
    const lista = await res.json();

    if (!lista.length) {
      cont.innerHTML = `<p class="dev-history-empty">Aún no has generado desarrollos.</p>`;
      return;
    }

    cont.innerHTML = lista.map(d => `
      <div class="dev-history-item" onclick="abrirDesarrolloGuardado('${d._id}')">
        <div class="dev-history-main">
          <strong>${escapeHTML(d.producto || "Producto desde imagen")}</strong>
          <span>${NOMBRES_TIPO[d.tipo] || "Completo"}${d.conImagen ? " · con imagen" : ""} · ${formatoFecha(d.fecha)}</span>
        </div>
        <button class="dev-history-del" title="Eliminar" onclick="event.stopPropagation(); eliminarDesarrolloGuardado('${d._id}')">✕</button>
      </div>
    `).join("");
  } catch {
    cont.innerHTML = `<p class="dev-history-empty">No se pudo cargar el historial.</p>`;
  }
}

window.abrirDesarrolloGuardado = async function(id) {
  const resultado = document.getElementById("resultadoDesarrollo");
  if (!resultado) return;

  try {
    const res = await fetch(`/api/desarrollos/${id}`);
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "No se pudo abrir");

    const inputProducto = document.getElementById("inputProductoDev");
    const inputInfo = document.getElementById("inputInfoDev");
    const inputTipo = document.getElementById("tipoDesarrolloDev");
    if (inputProducto) inputProducto.value = d.producto || "";
    if (inputInfo) inputInfo.value = d.info || "";
    if (inputTipo) inputTipo.value = d.tipo || "completo";

    resultado.className = "dev-result-box";
    resultado.innerHTML = `
      <div class="dev-result-toolbar">
        <span class="dev-result-pill">Guardado · ${formatoFecha(d.fecha)}</span>
      </div>
      ${renderParsedDesarrollo(d.resultado || "")}
    `;

    guardarEstadoDesarrollo();
    if (window.lucide) lucide.createIcons();
    resultado.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    alert(err.message || "No se pudo abrir el desarrollo");
  }
};

window.eliminarDesarrolloGuardado = async function(id) {
  if (!confirm("¿Eliminar este desarrollo del historial?")) return;
  const res = await fetch(`/api/desarrollos/${id}`, { method: "DELETE" });
  if (!res.ok) return alert("No se pudo eliminar");
  cargarHistorialDesarrollo();
};
