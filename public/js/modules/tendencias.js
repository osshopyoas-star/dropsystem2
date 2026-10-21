// =============================================
// Descubrimiento: radar de tendencias y análisis de mercado con IA
// =============================================
import { escapeHTML, fillChips, fillList, setText } from "../core/utils.js";
import { state } from "../state.js";
import { registrarRuta } from "./navegacion.js";

function renderTendencias() {
  return `
  <div class="tendencias-page">
    <div class="trend-screen-1">

      <div class="tendencias-hero ejecutivo">
        <div class="tendencias-title-wrap">
          <div class="tendencias-title-icon">
            <i data-lucide="line-chart"></i>
          </div>

          <div>
          <div class="tendencias-title-row">
  <h1 class="tendencias-title">Radar de oportunidad</h1>
  <button class="btn-secondary" onclick="generarKeywordsMaslow()">
    Palabras clave IA
  </button>
</div>
            <p class="tendencias-subtitle">
              Analiza una oportunidad como mercado, dolor, solución, mecanismo y decisión.
            </p>
          </div>
        </div>

        <div class="tendencias-form tendencias-form-3">
           <div id="maslowKeywordsPanel" class="maslow-keywords-panel hidden">
  <div class="maslow-keywords-head">
    <strong>Palabras clave sugeridas por IA</strong>
    <button onclick="cerrarMaslowKeywords()">✕</button>
  </div>

  <div id="maslowKeywordsList"></div>
</div>

          <input id="trendInput" placeholder="Ej: caída del cabello, ansiedad, seguridad física..." />

          <select id="trendPais">
            <option value="ALL">Todos</option>
            <option value="CO">Colombia</option>
            <option value="MX">México</option>
            <option value="EC">Ecuador</option>
            <option value="US">USA</option>
            <option value="ES">España</option>
          </select>

          <button class="primary" onclick="analizarTendencia()">
            <i data-lucide="sparkles"></i>
            Analizar
          </button>
        </div>
      </div>

 <div class="trend-tabs">
  <button class="trend-tab" onclick="goStep(1)">Maslow</button>
  <button class="trend-tab" onclick="goStep(2)">Problema</button>
  <button class="trend-tab" onclick="goStep(3)">Audiencia</button>
  <button class="trend-tab" onclick="goStep(4)">Nicho</button>
 <button class="trend-tab active" onclick="goStep(5)">Validación</button>
  <button class="trend-tab" onclick="goStep(6)">Producto</button>
  <button class="trend-tab" onclick="goStep(7)">Marketing</button>
</div>

     <div id="trendResult" class="trend-step-content"></div>

     </div>
    </div>
  `;
}

export function renderTendenciasDashboard() {
  return `
    <div class="trend-board">

      <div class="trend-board-top">
        <section class="board-topic">
          <div class="board-block-title">TEMA CENTRAL</div>
          <h2 id="kpiTema">-</h2>
          <p id="resEstacionalidadTop" class="board-muted">-</p>

          <div class="trend-chart-box">
            <svg id="trendChart" class="trend-chart-svg" viewBox="0 0 520 180" preserveAspectRatio="none">
              <g id="trendChartGrid"></g>
              <path id="trendChartLine" d=""></path>
              <g id="trendChartDots"></g>
              <g id="trendChartLabels"></g>
            </svg>
          </div>
        </section>

        <section class="board-market">
          <div class="board-block-title">Señal del mercado</div>

          <div class="board-market-grid">
  <div class="board-market-label">PAÍSES <strong id="countPaises">0</strong></div>
  <div id="mercadoPaisesBox" class="paises-box pro"></div>

  <div class="board-market-label">AUDIENCIAS <strong id="countAudiencias">0</strong></div>
  <div class="board-market-label">HOOKS <strong id="countHooks">0</strong></div>
</div>

          <div class="trend-signal trend-signal-lg board-signal">
            <span id="sig1"></span>
            <span id="sig2"></span>
            <span id="sig3"></span>
          </div>
        </section>

        <section class="board-score">
          <div class="board-block-title">SCORE GENERAL</div>

          <div class="score-ring score-ring-lg" id="scoreRing">
            <div class="score-ring-inner">
              <strong id="kpiScore">0</strong>
              <span>/100</span>
            </div>
          </div>

          <div class="board-score-direction" id="kpiDireccionBadge">-</div>
          <div class="board-score-stage" id="kpiEtapaMini">-</div>
        </section>
      </div>

      <div class="trend-board-bottom">
        <section class="board-seasonality">
          <div class="board-section-bar">Estacionalidad</div>

          <div class="seasonality-scale">
  <div class="scale-bar"></div>
  <div class="scale-numbers">
    <span>0</span>
    <span>10</span>
    <span>20</span>
    <span>30</span>
    <span>40</span>
    <span>50</span>
  </div>
</div>
            <div class="seasonality-row">
              <span>SEÑAL</span>
              <strong id="kpiSenalBox">-</strong>
            </div>

            <div class="seasonality-row light">
              <span>ETAPA</span>
              <strong id="kpiEtapaBox">-</strong>
            </div>

           <div class="seasonality-row dark">
  <span>DIRECCIÓN</span>
  <strong id="kpiDireccionBox">-</strong>
</div>
</section>

      <section class="board-summary card-resumen">
  <div class="resumen-head">
    <i data-lucide="brain"></i>
    <h3>Resumen ejecutivo</h3>
  </div>

          <div class="board-summary-text">
            <p><strong>Estacionalidad</strong> <span id="resEstacionalidad">-</span></p>
            <p><strong>Oportunidad</strong> <span id="resOportunidad">-</span></p>
            <p><strong>Recomendación</strong> <span id="resRecomendacion">-</span></p>
          </div>
        </section>

    <section class="board-decision card-decision">
  <div class="board-decision-head">
    <h3> Decisión</h3>
  </div>

  <div class="board-decision-text">
    <p><strong>Oportunidad</strong> <span id="decisionOportunidad">-</span></p>
    <p><strong>Recomendación</strong> <span id="decisionRecomendacion">-</span></p>
  </div>

  <div class="trend-list-block board-risk-list">
    <strong>Riesgos</strong>
    <ul id="decisionRiesgos"></ul>
  </div>

  <div class="trend-list-block board-risk-list">
    <strong>Validación real</strong>
    <ul id="valSenales"></ul>
  </div>

  <div class="trend-list-block board-risk-list">
    <strong>Saturación</strong>
    <ul id="valSaturacion"></ul>
  </div>

  <div class="trend-list-block board-risk-list">
    <strong>Oportunidad oculta</strong>
    <ul id="valOportunidad"></ul>
  </div>
</section>
      </div>

    </div>
  `;
}

async function getRealTrendData(keyword) {
  try {
    const pais = document.getElementById("trendPais")?.value || "ALL";

    const res = await fetch("/api/trends", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        keyword,
        pais
      })
    });

    const raw = await res.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("Respuesta no JSON en /api/trends:", raw);
      return {
        values: [20, 25, 30, 28, 35, 40, 32, 30, 31, 33, 36, 42],
        labels: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
      };
    }

    if (!res.ok) {
      console.error("Error trends API:", data);
      return {
        values: [20, 25, 30, 28, 35, 40, 32, 30, 31, 33, 36, 42],
        labels: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
      };
    }

    if (!Array.isArray(data.trend_data)) {
      console.error("trend_data invalido:", data);
      return {
        values: [20, 25, 30, 28, 35, 40, 32, 30, 31, 33, 36, 42],
        labels: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
      };
    }

    return {
      values: data.trend_data.map(x => Number(x.value) || 0),
      labels: data.trend_data.map(x => x.label || "")
    };
  } catch (err) {
    console.error("Error trends:", err);
    return {
      values: [20, 25, 30, 28, 35, 40, 32, 30, 31, 33, 36, 42],
      labels: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
    };
  }
}

async function renderTrendChart(json) {
  const svg = document.getElementById("trendChart");
  const grid = document.getElementById("trendChartGrid");
  const line = document.getElementById("trendChartLine");
  const dots = document.getElementById("trendChartDots");
  const labels = document.getElementById("trendChartLabels");

  if (!svg || !grid || !line || !dots || !labels) return;
const trend = await getRealTrendData(json.tema_central);
const data = trend.values;
const months = trend.labels;

  const W = 520;
  const H = 180;
  const left = 18;
  const right = 18;
  const top = 18;
  const bottom = 30;

  const innerW = W - left - right;
  const innerH = H - top - bottom;

  const minVal = 0;
  const maxVal = 50;

  const xStep = innerW / (data.length - 1);

  const toX = (i) => left + i * xStep;
  const toY = (v) => top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  grid.innerHTML = "";
  dots.innerHTML = "";
  labels.innerHTML = "";

  // líneas horizontales
  [0, 10, 20, 30, 40, 50].forEach(val => {
    const y = toY(val);
    const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineEl.setAttribute("x1", left);
    lineEl.setAttribute("x2", W - right);
    lineEl.setAttribute("y1", y);
    lineEl.setAttribute("y2", y);
    lineEl.setAttribute("class", "chart-grid-line");
    grid.appendChild(lineEl);

    const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textEl.setAttribute("x", 0);
    textEl.setAttribute("y", y + 4);
    textEl.setAttribute("class", "chart-axis-label");
    textEl.textContent = val;
    labels.appendChild(textEl);
  });

  // labels meses
  months.forEach((m, i) => {
    const tx = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tx.setAttribute("x", toX(i));
    tx.setAttribute("y", H - 8);
    tx.setAttribute("text-anchor", "middle");
    tx.setAttribute("class", "chart-month-label");
    tx.textContent = m;
    labels.appendChild(tx);
  });

  // path
 let d = `M ${toX(0)} ${toY(data[0])}`;

for (let i = 1; i < data.length; i++) {
  const x = toX(i);
  const y = toY(data[i]);
  const prevX = toX(i - 1);
  const prevY = toY(data[i - 1]);

  const cx = (prevX + x) / 2;

  d += ` Q ${cx} ${prevY}, ${x} ${y}`;
}
  line.setAttribute("d", d);
  line.setAttribute("class", "chart-line");

  // dots
  data.forEach((v, i) => {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", toX(i));
    c.setAttribute("cy", toY(v));
    c.setAttribute("r", i === data.length - 1 ? 4 : 2.8);
    c.setAttribute("class", "chart-dot");
    c.addEventListener("click", () => {
  alert(`${months[i]}: ${data[i]}`);
});
    dots.appendChild(c);
  });
}

export function renderTrendDashboard(json) {
 const rawScore = Number(json.score || 0);
const score = Math.max(35, Math.min(rawScore, 100));

setText("kpiEtapaMini", json.etapa_mercado || "-");
  setText("kpiSenalBox", json.senal_general || "-");
setText("kpiEtapaBox", json.etapa_mercado || "-");
setText("kpiDireccionBox", json.direccion || "-");


  setText("kpiTema", json.tema_central || "-");
  setText("kpiScore", score || 0);

  setText("resEstacionalidad", json.estacionalidad || "-");
  setText("resEstacionalidadTop", json.estacionalidad || "-");
  setText("resOportunidad", json.decision?.oportunidad || "-");
  setText("resRecomendacion", json.decision?.recomendacion || "-");

  setText("mercadoIntencion", json.mercado?.intencion_busqueda || "-");
  setText("maslowNivel", json.maslow?.nivel || "-");
  setText("maslowExplicacion", json.maslow?.explicacion || "-");

setText("maslowDeseo", json.maslow?.deseo_oculto || "-");
setText("maslowTrigger", json.maslow?.trigger_compra || "-");
setText("maslowPensamiento", json.maslow?.pensamiento_cliente || "-");

  setText("mecanismoPrincipal", json.mecanismo?.mecanismo_principal || "-");
  setText("marketingFormato", json.marketing?.formato_ganador || "-");

  setText("decisionOportunidad", json.decision?.oportunidad || "-");
  setText("decisionRecomendacion", json.decision?.recomendacion || "-");

  fillChips("mercadoPaises", json.mercado?.paises_recomendados || []);
  fillList("mercadoAudiencias", json.mercado?.audiencias || []);
  fillList("mercadoBusquedas", json.mercado?.busquedas_relacionadas || []);

  fillList("problemaDolores", json.problema?.dolores_relacionados || []);
  fillChips("problemaEmociones", json.problema?.emociones || [], "trend-chip-danger");

  fillList("marketingAngulos", json.marketing?.angulos_marketing || []);
  fillList("marketingHooks", json.marketing?.hooks || []);


fillList("decisionRiesgos", json.decision?.riesgos || []);
fillList("valSenales", json.validacion?.senales_ads || []);
fillList("valSaturacion", json.validacion?.indicadores_saturacion || []);
fillList("valOportunidad", json.validacion?.oportunidad_oculta || []);

 setText("countPaises", (json.mercado?.paises_recomendados || []).length);

const paisesBox = document.getElementById("mercadoPaisesBox");

if (paisesBox) {
  const paises = json.mercado?.paises_recomendados || [];

  const flags = {
    "USA": "🇺🇸",
    "ESTADOS UNIDOS": "🇺🇸",
    "COLOMBIA": "🇨🇴",
    "MEXICO": "🇲🇽",
    "MÉXICO": "🇲🇽",
    "ECUADOR": "🇪🇨",
    "ESPAÑA": "🇪🇸",
    "SPAIN": "🇪🇸",
    "CHILE": "🇨🇱",
    "PERU": "🇵🇪",
    "PERÚ": "🇵🇪",
    "ARGENTINA": "🇦🇷",
    "BRASIL": "🇧🇷",
    "BRAZIL": "🇧🇷",
    "CANADA": "🇨🇦",
    "CANADÁ": "🇨🇦",
    "FRANCIA": "🇫🇷",
    "FRANCE": "🇫🇷",
    "ALEMANIA": "🇩🇪",
    "GERMANY": "🇩🇪",
    "ITALIA": "🇮🇹",
    "ITALY": "🇮🇹",
    "JAPON": "🇯🇵",
    "JAPÓN": "🇯🇵",
    "JAPAN": "🇯🇵",
    "REINO UNIDO": "🇬🇧",
    "UK": "🇬🇧"
  };

  paisesBox.innerHTML = paises.map((p, i) => {
    const nombre = String(p).toUpperCase();
    const flag = flags[nombre] || "🌍";

    return `
      <div class="pais-card">
        <span class="pais-rank">${i + 1}</span>
        <span class="pais-flag">${flag}</span>
        <span class="pais-name">${escapeHTML(p)}</span>
      </div>
    `;
  }).join("");
}
  setText("countAudiencias", (json.mercado?.audiencias || []).length);
  setText("countBusquedas", (json.mercado?.busquedas_relacionadas || []).length);

  setText("countDolores", (json.problema?.dolores_relacionados || []).length);
  setText("countEmociones", (json.problema?.emociones || []).length);

  setText("countAngulos", (json.marketing?.angulos_marketing || []).length);
  setText("countHooks", (json.marketing?.hooks || []).length);

  const scoreRing = document.getElementById("scoreRing");

if (scoreRing) {
  const percent = Math.max(0, Math.min(score, 100));
  scoreRing.style.background = `conic-gradient(#4f7ef7 ${percent * 3.6}deg, #e5e7eb 0deg)`;
}

  if (scoreRing) {
    scoreRing.style.setProperty("--score", `${Math.max(0, Math.min(score, 100))}`);
  }

  const dir = (json.direccion || "").toLowerCase();
  const dirBadge = document.getElementById("kpiDireccionBadge");
  if (dirBadge) {
    dirBadge.textContent = json.direccion || "-";
    dirBadge.className = "trend-badge";

    if (dir.includes("sub")) dirBadge.classList.add("up");
    else if (dir.includes("baj")) dirBadge.classList.add("down");
    else dirBadge.classList.add("mid");
  }

  const senal = (json.senal_general || "").toLowerCase();
  const sig1 = document.getElementById("sig1");
  const sig2 = document.getElementById("sig2");
  const sig3 = document.getElementById("sig3");

  [sig1, sig2, sig3].forEach(el => {
    if (el) el.className = "";
  });

  if (senal === "debil") {
    sig1?.classList.add("on");
  }
  if (senal === "media") {
    sig1?.classList.add("on");
    sig2?.classList.add("on");
  }
  if (senal === "fuerte") {
    sig1?.classList.add("on");
    sig2?.classList.add("on");
    sig3?.classList.add("on");
  }
 renderTrendChart(json).catch(err => {
  console.error("Error renderTrendChart:", err);
});

}

window.analizarTendencia = async function() {
  const texto = document.getElementById("trendInput").value;
  const pais = document.getElementById("trendPais")?.value || "ALL";
const modo = "full";

  if (!texto) return alert("Escribe algo");

 const kpiTema = document.getElementById("kpiTema");
const kpiScore = document.getElementById("kpiScore");
const scoreBar = document.getElementById("kpiScoreBar");

if (kpiTema) kpiTema.textContent = "Analizando...";
if (kpiScore) kpiScore.textContent = "-";
if (scoreBar) scoreBar.style.width = "0%";

  try {
    // El prompt vive en el servidor (prompts.js)
    const res = await fetch("/api/ia/tendencia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ texto, pais })
    });
const raw = await res.text();

if (!res.ok) {
  console.error("ERROR API RAW:", raw);
  document.getElementById("trendResult").innerText = `Error API (${res.status})`;
  return;
}

try {
  const data = JSON.parse(raw);
  let respuesta = (data.reply || "").trim();

  const jsonStart = respuesta.indexOf("{");
  const jsonEnd = respuesta.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd !== -1) {
    respuesta = respuesta.substring(jsonStart, jsonEnd + 1);
  }

  const json = JSON.parse(respuesta);

  state.trendMap = json;
  state.ideaActual = texto;
  state.nichoActual = json.tema_central || "";
  state.tendenciaActual = json.direccion || "";

  localStorage.setItem("trendMap", JSON.stringify(json));
  localStorage.setItem("trendInput", texto);
  localStorage.setItem("trendPais", pais);
  localStorage.setItem("trendMode", modo);

  renderTrendDashboard(json);
} catch (e) {
  console.error("ERROR PARSE:", e);
  console.error("RAW IA:", raw);
  document.getElementById("trendResult").innerText = "Respuesta inválida";
}

  } catch (err) {
    console.error("ERROR API:", err);
    document.getElementById("trendResult").innerText = "Error en API";
  }
};

window.generarKeywordsMaslow = async function() {
  const pais = document.getElementById("trendPais")?.value || "ALL";
  const panel = document.getElementById("maslowKeywordsPanel");
  const list = document.getElementById("maslowKeywordsList");

  if (!panel || !list) return;

  panel.classList.remove("hidden");
  list.innerHTML = "Generando palabras clave...";

  try {
    // El prompt vive en el servidor (prompts.js)
    const res = await fetch("/api/ia/keywords", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pais })
    });

    const data = await res.json();
    let raw = (data.reply || "").trim();

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      raw = raw.substring(start, end + 1);
    }

    const parsed = JSON.parse(raw);
    const keywords = parsed.keywords || [];

    list.innerHTML = keywords.map(k => `
      <button class="keyword-pick-btn" onclick="usarKeywordMaslow('${String(k).replace(/'/g, "\\'")}')">
        ${k}
      </button>
    `).join("");

  } catch (err) {
    console.error("Error generando keywords Maslow:", err);
    list.innerHTML = "Error generando palabras clave";
  }
};

window.usarKeywordMaslow = function(keyword) {
  const input = document.getElementById("trendInput");
  if (input) input.value = keyword;

  cerrarMaslowKeywords();
};

window.cerrarMaslowKeywords = function() {
  const panel = document.getElementById("maslowKeywordsPanel");
  if (panel) panel.classList.add("hidden");
};

// Ruta: tendencias
registrarRuta("tendencias", (view) => {
  view.innerHTML = renderTendencias();
  marcarMenuActivo("tendencias");

  const sub = document.getElementById("descubrimiento-submenu");
const arrow = document.getElementById("descubrimiento-arrow");

if (sub) sub.classList.add("open");
if (arrow) arrow.setAttribute("data-lucide", "chevron-down");

  setTimeout(() => {
    const savedInput = localStorage.getItem("trendInput");
    const savedPais = localStorage.getItem("trendPais");
    const savedTrendMap = localStorage.getItem("trendMap");

    if (savedInput) {
      const input = document.getElementById("trendInput");
      if (input) input.value = savedInput;
    }

    if (savedPais) {
      const selectPais = document.getElementById("trendPais");
      if (selectPais) selectPais.value = savedPais;
    }

   
    if (savedTrendMap) {
      const json = JSON.parse(savedTrendMap);
      renderTrendDashboard(json);
    }

    if (window.lucide) lucide.createIcons();
  }, 0);

  return;
});

