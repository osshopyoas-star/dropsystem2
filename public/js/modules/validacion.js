// =============================================
// Motor de validación: palabras clave, Ads Library, TikTok, Dropi, análisis de producto
// =============================================
import { renderTendenciasDashboard, renderTrendDashboard } from "./tendencias.js";
import { keywordsDB } from "../data/keywords.js";
import { renderBusqueda } from "../../views/busqueda.js";
import { registrarRuta } from "./navegacion.js";

let paisActivo = "US";

window.currentStep = 5;

function renderStep() {
  const container = document.getElementById("trendResult");
  const data = JSON.parse(localStorage.getItem("trendMap") || "{}");

  if (!container) return;

  if (window.currentStep === 1) {
  container.innerHTML = `
    <h2>Maslow</h2>

    <p><strong>Nivel:</strong> ${data.maslow?.nivel || "-"}</p>

    <p><strong>Insight:</strong></p>
    <p>${data.maslow?.explicacion || "-"}</p>

    <p><strong>Deseo oculto:</strong></p>
    <p>${data.maslow?.deseo_oculto || "-"}</p>

    <p><strong>Trigger de compra:</strong></p>
    <p>${data.maslow?.trigger_compra || "-"}</p>

    <p><strong>Cómo piensa el cliente:</strong></p>
    <p>${data.maslow?.pensamiento_cliente || "-"}</p>
  `;
  return;
}

  if (window.currentStep === 2) {
    container.innerHTML = `
      <h2>Problema</h2>
      <p><strong>Dolor:</strong> ${data.problema?.dolor_principal || "-"}</p>
      <ul>
        ${(data.problema?.dolores_relacionados || []).map(x => `<li>${x}</li>`).join("")}
      </ul>
    `;
    return;
  }

  if (window.currentStep === 3) {
    container.innerHTML = `
      <h2>Audiencia</h2>
      <ul>
        ${(data.mercado?.audiencias || []).map(x => `<li>${x}</li>`).join("")}
      </ul>
    `;
    return;
  }

  if (window.currentStep === 4) {
    container.innerHTML = `
      <h2>Nicho</h2>
      <p>${data.tema_central || "-"}</p>
    `;
    return;
  }

  if (window.currentStep === 5) {
    container.innerHTML = renderTendenciasDashboard();
    renderTrendDashboard(data);
    return;
  }

  if (window.currentStep === 6) {
  container.innerHTML = `
    <div class="trend-step-panel">
      <h2>Producto</h2>

      <div class="trend-step-block">
        <h3>Solución principal</h3>
        <p>${data.solucion?.solucion_principal || "-"}</p>
      </div>

      <div class="trend-step-block">
        <h3>Beneficios</h3>
        <ul>
          ${(data.solucion?.beneficios_relacionados || []).map(x => `<li>${x}</li>`).join("")}
        </ul>
      </div>

      <div class="trend-step-block">
        <h3>Productos relacionados</h3>
        <ul>
          ${(data.solucion?.productos_relacionados || []).map(x => `<li>${x}</li>`).join("")}
        </ul>
      </div>

      <div class="trend-step-block">
        <h3>Mecanismo principal</h3>
        <p>${data.mecanismo?.mecanismo_principal || "-"}</p>
      </div>

      <div class="trend-step-block">
        <h3>Mecanismos secundarios</h3>
        <ul>
          ${(data.mecanismo?.mecanismos_secundarios || []).map(x => `<li>${x}</li>`).join("")}
        </ul>
      </div>

      <div class="trend-step-block">
        <h3>Creencias de venta</h3>
        <ul>
          ${(data.mecanismo?.creencias_venta || []).map(x => `<li>${x}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;
  return;
}

  if (window.currentStep === 7) {
    container.innerHTML = `
      <h2>Marketing</h2>
      <ul>
        ${(data.marketing?.hooks || []).map(x => `<li>${x}</li>`).join("")}
      </ul>
    `;
    return;
  }
}

window.goStep = function(step) {
  window.currentStep = step;

  document.querySelectorAll(".trend-tab").forEach((btn, i) => {
    btn.classList.toggle("active", i === step - 1);
  });

  renderStep();
};

function autoSeleccionarKeywords(texto) {

  texto = texto.toLowerCase();

  const botones = document.querySelectorAll("#keywords-import .keyword-item span");

  botones.forEach(btn => {
    const keyword = btn.innerText.toLowerCase();

    // si el texto incluye algo parecido → activar
    if (texto.includes(keyword.split(" ")[0])) {
      btn.classList.add("active");
      
      // simular click lógico
      if (!keywordsImport.includes(keyword)) {
        keywordsImport.push(keyword);
      }
    }
  });
}

function getIdioma(pais) {

  // Español
  if (["MX","CO","ES","PE","CL","AR","EC","UY","PY","PA"].includes(pais)) return "ES";

  // Portugués
  if (["BR","PT"].includes(pais)) return "PT";

  // Francés
  if (["FR"].includes(pais)) return "FR";

  // Alemán
  if (["DE"].includes(pais)) return "DE";

  // Italiano
  if (["IT"].includes(pais)) return "IT";

  // Japonés
  if (["JP"].includes(pais)) return "JP";

  // Coreano
  if (["KR"].includes(pais)) return "KR";

  // India (puedes usar inglés optimizado)
  if (["IN"].includes(pais)) return "IN";

  // Default
  return "EN";
}

window.setPais = function(pais) {
  paisActivo = pais;
  actualizarLabelPais();
  renderKeywords();
};

window.buscar = function(keyword) {
  const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${paisActivo}&q=${encodeURIComponent(keyword)}`;
  window.open(url, "_blank");
};

function actualizarLabelPais() {
  const nombres = {
    MX:"México", CO:"Colombia", ES:"España",
    EC:"Ecuador",UY:"Uruguay", PY:"Paraguay",
    PE:"Perú", CL:"Chile", AR:"Argentina",
    US:"USA", CA:"Canadá", GB:"Reino Unido",
    AU:"Australia", BR:"Brasil", PT:"Portugal",
    FR:"Francia", DE:"Alemania", IT:"Italia",
    IN:"India", JP:"Japón", PA:"Panamá",
  };

  const label = document.getElementById("pais-label");
  if (label) {
   label.innerHTML = `
  <span style="display:flex; align-items:center; gap:6px; padding:10px;">
    <i data-lucide="globe"></i>
    País: <strong>${nombres[paisActivo]}</strong>
  </span>
`;


  }
}

window.toggleDropiMenu = function() {
  const menu = document.getElementById("dropi-menu");
  menu.classList.toggle("open");
};

window.abrirDropiPais = function(pais) {

  let url = "";

  if (pais === "CO") {
    url = "https://app.dropi.co/dashboard/search";
  }

  if (pais === "EC") {
    url = "https://app.dropi.ec/dashboard/search";
  }

  window.open(url, "_blank");

  // cerrar menú
  document.getElementById("dropi-menu").classList.remove("open");
};

let selectedKeywords = [];

window.toggleKeyword = function(el, keyword) {
  el.classList.toggle("active");

  if (selectedKeywords.includes(keyword)) {
    selectedKeywords = selectedKeywords.filter(k => k !== keyword);
  } else {
    selectedKeywords.push(keyword);
  }

  updateQueryPreview();
};

window.renderKeywords = function() {
  const tipo = document.getElementById("tipo").value;
  const idioma = getIdioma(paisActivo);

  const lista = keywordsDB[idioma][tipo] || [];

  const contenedor = document.getElementById("keywords");

  contenedor.innerHTML = lista.map(k => `
    <button class="keyword-btn" onclick="toggleKeyword(this, '${k}')">
      ${k}
    </button>
  `).join("");

  selectedKeywords = [];
  updateQueryPreview();
};

function updateQueryPreview() {
  const query = selectedKeywords.join(" ");

  const el = document.getElementById("queryPreview");
  if (el) el.innerText = query || "Selecciona keywords...";
}

window.buscarEnMeta = function() {
  const pais = document.getElementById("pais").value;
  const query = selectedKeywords.join(" ");

  if (!query) return alert("Selecciona keywords");

  const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${pais}&q=${encodeURIComponent(query)}`;
  window.open(url, "_blank");
};

window.buscarEnTikTok = function() {
  const query = selectedKeywords.join(" ");
  window.open(`https://www.tiktok.com/search?q=${encodeURIComponent(query)}`, "_blank");
};

window.buscarProducto = function(tipo) {
  const q = document.getElementById("productoInput").value?.trim();

  if (!q) return alert("Escribe producto");

  if (tipo === "googletrends") {
    window.open(`https://trends.google.com/trends/explore?q=${encodeURIComponent(q)}`, "_blank");
  }

  if (tipo === "amazon") {
    window.open(`https://www.amazon.com/s?k=${encodeURIComponent(q)}`, "_blank");
  }

  if (tipo === "aliexpress") {
    window.open(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}`, "_blank");
  }

  if (tipo === "alibaba") {
    window.open(`https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}`, "_blank");
  }

  if (tipo === "ml") {
    window.open(`https://listado.mercadolibre.com/${encodeURIComponent(q)}`, "_blank");
  }

  if (tipo === "tiktok") {
    window.open(`https://www.tiktok.com/search?q=${encodeURIComponent(q)}`, "_blank");
  }

  if (tipo === "meta") {
    window.open(`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(q)}`, "_blank");
  }
};

window.generarBusqueda = function() {
  buscarEnMeta();
};

let keywordsImport = [];

window.renderKeywordsImport = function() {
  const tipo = document.getElementById("tipo-import").value;
  const pais = document.getElementById("pais-import").value;
  const idioma = getIdioma(pais);

  const lista = keywordsDB[idioma][tipo] || [];

  document.getElementById("keywords-import").innerHTML =
  lista.map(k => `
    <div class="keyword-item">
      <span>${k}</span>
      <div>
        <button onclick="buscarDirecto('${k}','meta','import')">M</button>
        <button onclick="buscarDirecto('${k}','tiktok','import')">T</button>
      </div>
    </div>
  `).join("");
};

window.toggleImport = function(el, k) {
  el.classList.toggle("active");

  if (keywordsImport.includes(k)) {
    keywordsImport = keywordsImport.filter(x => x !== k);
  } else {
    keywordsImport.push(k);
  }
};

window.buscarImport = function() {
  const pais = document.getElementById("pais-import").value;
  const q = keywordsImport.join(" ");

  window.open(`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${pais}&q=${encodeURIComponent(q)}`);
};

let keywordsCat = [];

window.renderKeywordsCat = function() {
  const tipo = document.getElementById("tipo-cat").value;
  const pais = document.getElementById("pais-cat").value;
  const idioma = getIdioma(pais);

  const lista = keywordsDB[idioma][tipo] || [];

  document.getElementById("keywords-cat").innerHTML =
    lista.map(k => `
  <div class="keyword-item">
    <span onclick="toggleCat(this,'${k}')">${k}</span>

    <div class="kw-actions">
      <button onclick="buscarDirecto('${k}','meta','cat')">M</button>
      <button onclick="buscarDirecto('${k}','tiktok','cat')">T</button>
    </div>
  </div>
`).join("");
};

window.toggleCat = function(el, k) {
  el.classList.toggle("active");

  if (keywordsCat.includes(k)) {
    keywordsCat = keywordsCat.filter(x => x !== k);
  } else {
    keywordsCat.push(k);
  }
};

window.buscarCatalogo = function() {
  const pais = document.getElementById("pais-cat").value;
  const q = keywordsCat.join(" ");

  window.open(`https://www.facebook.com/ads/library/?country=${pais}&q=${q}`);
};

window.updateImport = function() {
  renderKeywordsImport();
};

window.buscarDirecto = function(keyword, tipo, origen) {

  let pais = "US";

  if (origen === "import") {
    pais = document.getElementById("pais-import").value;
  }

  if (origen === "cat") {
    pais = document.getElementById("pais-cat").value;
  }

  // ===== META =====
  if (tipo === "meta") {
    const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${pais}&q=${encodeURIComponent(keyword)}`;
    window.open(url, "_blank");
  }

  // ===== TIKTOK =====
  if (tipo === "tiktok") {
    const region = getTikTokRegion(pais);

    const url = `https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en?period=7&region=${region}`;

    window.open(url, "_blank");
  }
};

function getTikTokRegion(pais) {

  const map = {
    US: "US",
    GB: "GB",
    AU: "AU",
    CA: "CA",

    CO: "US", // fallback
    MX: "MX",
    CL: "US",
    PE: "US",

    FR: "FR",
    DE: "DE",
    IT: "IT",
    ES: "ES",

    JP: "JP"
  };

  return map[pais] || "US";
}

function analizarTextoProducto(texto) {

  texto = texto.toLowerCase();

  let data = {
    score: 0,
    insights: [],
    angulo: null,
    nicho: null
  };

  // =====================
  // NICHO
  if (texto.includes("energia") || texto.includes("energy") || texto.includes("fatiga")) {
    data.nicho = "energía masculina";
    data.score += 20;
    data.insights.push("🔋 Nicho: energía masculina");
  }

  if (texto.includes("libido") || texto.includes("sexual") || texto.includes("potencia")) {
    data.nicho = "sexual";
    data.score += 30;
    data.insights.push("🔥 Nicho caliente");
  }

  // =====================
  // ÁNGULO
  if (texto.includes("cansancio") || texto.includes("fatiga") || texto.includes("tired")) {
    data.angulo = "problema";
    data.score += 25;
    data.insights.push("💥 Ángulo: dolor directo");
  }

  if (texto.includes("energía") || texto.includes("boost") || texto.includes("mejora")) {
    data.score += 15;
    data.insights.push("✨ Ángulo: beneficio");
  }

  // =====================
  // PRODUCTO VENDIBLE
  if (
    texto.includes("capsulas") ||
    texto.includes("suplemento") ||
    texto.includes("pills")
  ) {
    data.score += 20;
    data.insights.push("📦 Formato ganador (fácil de vender)");
  }

  return data;
}

window.analizarProducto = function() {

  const texto = document.getElementById("productoInput").value;

// limpiar selección previa
keywordsImport = [];
document.querySelectorAll("#keywords-import span").forEach(el => {
  el.classList.remove("active");
});

// AUTO seleccionar keywords
if (texto) {
  autoSeleccionarKeywords(texto);
}

const keywordsImportEls = document.querySelectorAll("#keywords-import .active");
const keywordsCatEls = document.querySelectorAll("#keywords-cat .active");

const totalKeywords = keywordsImportEls.length + keywordsCatEls.length;

  let score = 0;
  let resultado = [];

  // =====================
  // 1. DEMANDA (mejorada)
  if (totalKeywords >= 5) {
    score += 30;
    resultado.push("🔥 Alta exploración de mercado (muchas keywords)");
  } else if (totalKeywords >= 3) {
    score += 20;
    resultado.push("🟡 Demanda moderada");
  } else {
    resultado.push("⚠️ Muy poca data (riesgoso)");
  }

  // =====================
  // 2. ÁNGULO
  const tipoImport = document.getElementById("tipo-import")?.value;
  const tipoCat = document.getElementById("tipo-cat")?.value;

  if (tipoImport === "problema" || tipoCat === "problema") {
    score += 25;
    resultado.push("💥 Producto basado en dolor (muy ganador)");
  }

  if (tipoImport === "beneficio" || tipoCat === "beneficio") {
    score += 15;
    resultado.push("✨ Enfoque en beneficio (vende bien)");
  }

  if (tipoImport === "sexuales" || tipoCat === "sexuales") {
    score += 30;
    resultado.push("🔥 Nicho caliente (alta conversión)");
  }

  // =====================
  // 3. SATURACIÓN INTELIGENTE
  if (totalKeywords > 8) {
    score -= 20;
    resultado.push("⚠️ Mercado posiblemente saturado");
  }

  // =====================
  // 4. LÓGICA DE VALIDACIÓN (NUEVA)
  if (totalKeywords >= 4 && (tipoImport === "problema" || tipoCat === "problema")) {
    score += 15;
    resultado.push("✅ Buena combinación: problema + demanda");
  }

  // =====================
  // 5. DECISIÓN MEJORADA
 let decision = "";
let recomendacion = "";

if (score >= 80) {
  decision = "🟢 PRODUCTO GANADOR";
  recomendacion = "Escalar agresivo con UGC + ángulo problema";
}
else if (score >= 60) {
  decision = "🟡 TEST FUERTE";
  recomendacion = "Testear 3 creativos diferentes";
}
else if (score >= 40) {
  decision = "🟠 TEST SUAVE";
  recomendacion = "Solo si tienes buen creativo";
}
else {
  decision = "🔴 DESCARTAR";
  recomendacion = "No hay ventaja competitiva";
}

if (texto) {
  const pais = document.getElementById("pais-import").value;
  window.open(`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${pais}&q=${encodeURIComponent(texto)}`);
}

// =====================
// 3. VALIDACIÓN REAL (AQUÍ VA)
resultado.push("<br>🔎 VALIDACIÓN REAL:");
resultado.push("👉 Abrir Meta Ads Library y revisar:");
resultado.push("✔ +5 anuncios activos");
resultado.push("✔ Creativos repetidos");
resultado.push("✔ Anuncios con días corriendo");

resultado.push("<br>🎥 VALIDACIÓN TIKTOK:");
resultado.push("✔ Videos con +50k views");
resultado.push("✔ Hooks repetidos");

  // =====================
  // OUTPUT PRO
  document.getElementById("score-result").innerHTML = `
    <strong>Score: ${score}</strong><br><br>
    ${resultado.join("<br>")}<br><br>
    <strong>${decision}</strong><br>
    <small>👉 ${recomendacion}</small>
  `;
};

window.analizarTiendaMeta = function() {

  const url = document.getElementById("tiendaInput").value;

  if (!url) {
    alert("Pega una URL");
    return;
  }

  let dominio = url
    .replace("https://", "")
    .replace("http://", "")
    .replace("www.", "")
    .split("/")[0];

 const pais = document.getElementById("pais-meta-tienda").value;

window.open(`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${pais}&q=${encodeURIComponent(dominio)}`);
};

// Ruta: busqueda
registrarRuta("busqueda", (view) => {
    view.innerHTML = renderBusqueda();
    marcarMenuActivo("busqueda");

    setTimeout(() => {
      renderKeywordsImport();
      renderKeywordsCat();
      if (window.lucide) lucide.createIcons();
    }, 0);

    return;
  });

