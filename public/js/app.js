import { renderSidebar } from "../components/sidebar.js";
import { renderBusqueda } from "../views/busqueda.js";
import { renderProductos } from "../views/productos.js";
import { state } from "./state.js";

const view = document.getElementById("view");


let paisActivo = "US";

window.productoPaisActivo = null;


// =============================

window.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
  goTo("inicio");
  marcarMenuActivo("inicio");

  const btnCancelar = document.getElementById("btnCancelar");
  const btnAceptar = document.getElementById("btnAceptar");
  const modal = document.getElementById("modalConfirm");

  if (btnCancelar) {
    btnCancelar.onclick = () => {
      productoAEliminar = null;
      modal?.classList.add("hidden");
    };
  }

  if (btnAceptar) {
    btnAceptar.onclick = () => {
      confirmarEliminacion();
    };
  }

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) {
        productoAEliminar = null;
        modal.classList.add("hidden");
      }
    };
  }

  setTimeout(() => {
    if (window.lucide) lucide.createIcons();
  }, 100);
});


window.marcarMenuActivo = function(route) {
  document.querySelectorAll(".sidebar-item").forEach(i => {
    i.classList.remove("active");
  });

  const item = document.querySelector(`[data-route="${route}"]`);
  if (item) item.classList.add("active");
};



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

// =============================
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

// =============================
// 🔥 BASE COMPLETA (DE TU DOC)
const keywordsDB = {

  // 🇪🇸 BASE COMPLETA (NO SE TOCA)
  ES: {
  problema: [
    "baja energía masculina"," trastornos del sueño","agotamiento extremo","fatiga crónica","cansancio extremo",
    "falta de vitalidad","bajo rendimiento físico","estrés masculino","debilidad muscular",
    "agotamiento","falta de enfoque","cansancio todo el tiempo","no tengo energía","energía baja hombres",
    "me siento agotado","falta de fuerza hombres","bajo rendimiento hombres",
    "debilidad física","cansancio constante","sin energía en el día",
    "agotamiento físico mental","fatiga hombres solución",
    "falta de energía en hombres","estrés y cansancio"
  ],

  mecanismo: [
    "mejora circulación sanguínea","aumenta energía natural",
    "activa testosterona natural","mejora resistencia física",
    "optimiza rendimiento","recuperación muscular rápida",
    "estimula energía celular",

    // 🔥 NUEVAS (más usadas en ads)
    "mejora flujo sanguíneo","aumenta testosterona naturalmente",
    "activa energía corporal","mejora oxigenación celular",
    "estimula rendimiento físico","mejora vigor masculino",
    "activa circulación natural","equilibra energía masculina",
    "soporte hormonal masculino","energía natural inmediata"
  ],

  beneficio: [
    "más energía","mayor confianza","mejor desempeño físico",
    "vitalidad masculina","rendimiento deportivo",
    "enfoque mental","mejor calidad de vida",

    // 🔥 NUEVAS (más comerciales)
    "más energía todo el día","rendir mejor en el día",
    "sentirse activo nuevamente","mejor rendimiento en hombres",
    "más resistencia física","mejor desempeño en pareja",
    "recuperar vitalidad masculina","más fuerza y energía",
    "sentirse joven otra vez","más enfoque y energía mental"
  ],

  busqueda: [
    "energía masculina suplemento","circulación sanguínea natural",
    "fatiga hombres solución","rendimiento físico natural",
    "vitalidad masculina natural","suplemento energía hombres",
    "mejorar energía natural hombres",

    // 🔥 NUEVAS (clave para Ads Library)
    "cápsulas energía hombres","vitaminas para el cansancio hombres",
    "suplemento testosterona ","pastillas energía hombres",
    "producto energía masculina","solución cansancio hombres",
    "aumentar energía hombres natural","energía baja solución",
    "rendimiento masculino suplemento","fuerza masculina suplemento"
  ],

  safe: [
    "bienestar íntimo","cuidado personal adulto","salud masculina",
    "salud femenina","wellness","self care",
    "masajeadores","relajación corporal",

    // 🔥 NUEVAS (más abiertas para escalar)
    "bienestar general","vida saludable","equilibrio corporal",
    "cuidado personal","salud y bienestar","relajación física",
    "rutina saludable","estilo de vida saludable"
  ],

  producto: [
    "mejora rendimiento masculino","energía masculina natural",
    "resistencia masculina","control masculino natural",
    "suplemento vitalidad hombres",

    // 🔥 NUEVAS (CLAVE)
    "suplemento masculino natural","cápsulas masculinas",
    "fórmula masculina avanzada","gotas energía hombres",
    "vitaminas masculinas energía","producto natural hombres",
    "suplemento rendimiento hombres","fórmula energía masculina",
    "suplemento fuerza hombres","energizante natural hombres"
  ],
  sexuales: [
  // 🔥 suaves (pasan políticas)
  "rendimiento masculino","mejor desempeño hombres",
  "confianza masculina","vitalidad masculina",
  "resistencia hombres","energía en pareja",
  "mejor rendimiento","desempeño en hombres",
  "más energía hombres","potencial masculino",

  // 🔥 eufemismos (MUY IMPORTANTES)
  "segunda ronda",
  "sin pausas","más resistencia",
  "durar más","mejor rendimiento en la cama",
  "más energía en la noche","rendimiento sin límites",
  "recupera tu confianza","más potencia natural",

  // 🔥 disfraz médico (ORO)
  "mejorar circulación sanguínea","flujo sanguíneo natural",
  "mejorar circulación hombres","óxido nítrico natural",
  "salud vascular hombres","mejor oxigenación",
  "circulación saludable","apoyo circulación",

  // 🔥 intención de producto
  "potenciador masculino","mejorar potencia masculina",
  "libido hombres","bienestar íntimo hombres",
  "salud sexual masculina","vigor masculino",
  "suplemento rendimiento hombres","energía íntima masculina",
  "desempeño masculino suplemento",

  // 🔥 extras de alta conversión
  "cápsulas potencia masculina","energía y resistencia hombres",
  "suplemento vitalidad masculina","rendimiento masculino natural",
  "fuerza masculina natural"," masculina natural"
],

  feromonas: [
    "perfume atracción","perfume irresistible","fragancia seducción",

    // 🔥 NUEVAS (eufemismos que sí usan ads)
    "perfume conquista","fragancia masculina irresistible",
    "aroma atracción masculina","perfume para atraer mujeres",
    "fragancia magnetismo","perfume confianza masculina",
    "esencia seducción","aroma irresistible hombres",
    "perfume feromonas hombres","fragancia atracción natural"
  ]

  },

  // 🇺🇸 INGLÉS (COPIA COMPLETA)
  EN: {
  problema: [
    "low male energy","fatigue","chronic fatigue","extreme tiredness",
    "low vitality","poor physical performance","male stress",
    "daily exhaustion","lack of focus",

    // 🔥 NEW (real ad language)
    "always tired","no energy all day","low energy men",
    "feeling exhausted","lack of strength","low stamina men",
    "constant fatigue","feeling drained","no motivation",
    "physical and mental fatigue","tired all the time",
    "energy crash","burnout symptoms","low drive men"
  ],

  mecanismo: [
    "improve blood circulation","increase natural energy",
    "boost testosterone","improve physical endurance",
    "optimize daily performance","fast muscle recovery",
    "stimulate cellular energy",

    // 🔥 NEW (used in ads)
    "enhance blood flow","increase testosterone naturally",
    "boost male vitality","support hormone balance",
    "increase oxygen flow","improve energy production",
    "activate natural energy","boost stamina naturally",
    "enhance male performance","support energy levels",
    "increase circulation naturally"
  ],

  beneficio: [
    "more daily energy","more confidence","better physical performance",
    "male vitality","sports performance",
    "mental focus","better quality of life",

    // 🔥 NEW (sales language)
    "feel energized all day","boost daily performance",
    "increase stamina","more strength and energy",
    "feel younger again","improve performance in bed",
    "higher energy levels","stronger body and mind",
    "better endurance","more power and confidence"
  ],

  busqueda: [
    "male energy supplement","natural blood circulation",
    "fatigue solution men","natural physical performance",
    "male vitality supplement","energy supplement men",
    "increase energy naturally men",

    // 🔥 NEW (HIGH VALUE)
    "male enhancement supplement","testosterone booster natural",
    "energy pills for men","male stamina supplement",
    "natural male booster","increase stamina men",
    "boost energy men supplement","men vitality pills",
    "natural testosterone support","performance booster men"
  ],

  safe: [
    "intimate wellness","adult self care","male health",
    "female health","wellness","self care",
    "massagers","body relaxation",

    // 🔥 NEW (broad targeting)
    "health and wellness","healthy lifestyle","body care",
    "self improvement","daily wellness","natural health",
    "lifestyle balance","wellbeing routine"
  ],

  producto: [
    "male performance booster","natural male energy",
    "male stamina","male control supplement",
    "male vitality supplement",

    // 🔥 NEW (CRITICAL)
    "male enhancement capsules","natural male formula",
    "energy capsules men","male booster supplement",
    "testosterone support supplement","natural stamina booster",
    "men energy formula","male vitality capsules",
    "performance supplement men","natural energy booster men"
  ],
  sexuales: [
  // 🔥 soft (policy safe)
  "male performance","performance support men",
  "confidence men","male vitality support",
  "stamina men","endurance men",
  "energy in bed","better performance",
  "men confidence boost","daily performance men",

  // 🔥 euphemisms (TOP converting)
  "like in your 20s","second round",
  "no breaks","more stamina",
  "longer performance","stronger performance",
  "boost confidence in bed","last longer naturally",
  "perform better at night",

  // 🔥 medical disguise (GOLD)
  "blood flow support","circulation support",
  "vascular health men","nitric oxide booster",
  "oxygen flow supplement","improve blood flow",
  "circulation booster men",

  // 🔥 product intent
  "male enhancement","performance booster",
  "libido support men","sexual wellness men",
  "intimate health men","male booster supplement",
  "stamina booster men","testosterone support",

  // 🔥 high converting extras
  "natural male enhancement","men vitality capsules",
  "performance capsules men","energy + stamina men",
  "alpha performance","male power support"
],

  feromonas: [
    "pheromone perfume","attraction perfume","confidence perfume",

    // 🔥 NEW (ad-friendly euphemisms)
    "irresistible fragrance","men attraction scent",
    "confidence boosting fragrance","seduction cologne",
    "magnetic scent men","alpha male fragrance",
    "pheromone cologne men","attraction scent",
    "irresistible cologne","men confidence scent"
  ]

  },

  // 🇧🇷 PORTUGUÉS (COPIA COMPLETA)
  PT: {
  problema: [
    "baixa energia masculina","fadiga","fadiga crônica","cansaço extremo",
    "falta de vitalidade","baixo desempenho físico","estresse masculino",
    "exaustão diária","falta de foco",

    // 🔥 NOVAS (linguagem real de anúncios)
    "cansaço o tempo todo","sem energia","energia baixa homens",
    "me sinto cansado sempre","falta de força","baixo rendimento homens",
    "fraqueza física","cansaço constante","sem disposição",
    "esgotamento físico mental","fadiga homens solução",
    "sem energia no dia a dia","desânimo constante",
    "falta de disposição","cansaço diário"
  ],

  mecanismo: [
    "melhora circulação sanguínea","aumenta energia natural",
    "ativa testosterona","melhora resistência física",
    "otimiza desempenho diário","recuperação muscular rápida",
    "estimula energia celular",

    // 🔥 NOVAS (usadas em ads)
    "melhora fluxo sanguíneo","aumenta testosterona naturalmente",
    "ativa energia corporal","melhora oxigenação celular",
    "estimula desempenho masculino","melhora vigor masculino",
    "ativa circulação natural","equilibra hormônios masculinos",
    "suporte hormonal masculino","energia natural rápida",
    "aumenta disposição física"
  ],

  beneficio: [
    "mais energia diária","mais confiança","melhor desempenho físico",
    "vitalidade masculina","desempenho esportivo",
    "foco mental","melhor qualidade de vida",

    // 🔥 NOVAS (mais comerciais)
    "mais energia o dia todo","mais disposição diária",
    "sentir-se ativo novamente","melhor rendimento",
    "mais resistência física","melhor desempenho na cama",
    "recuperar vitalidade","mais força e energia",
    "sentir-se mais jovem","mais foco e energia mental"
  ],

  busqueda: [
    "suplemento energia masculina","circulação natural",
    "solução fadiga homens","desempenho físico natural",
    "vitalidade masculina suplemento","energia homens suplemento",
    "melhorar energia naturalmente",

    // 🔥 NOVAS (ALTA PERFORMANCE)
    "cápsulas energia homens","vitaminas para cansaço homens",
    "suplemento testosterona","remédio para cansaço",
    "produto energia masculina","solução cansaço homens",
    "aumentar energia homens","energia baixa solução",
    "suplemento desempenho masculino","força masculina suplemento"
  ],

  safe: [
    "bem-estar íntimo","cuidado pessoal adulto","saúde masculina",
    "saúde feminina","wellness","self care",
    "massageadores","relaxamento corporal",

    // 🔥 NOVAS (escala)
    "bem-estar geral","vida saudável","equilíbrio corporal",
    "cuidado pessoal","saúde e bem-estar","rotina saudável",
    "estilo de vida saudável","qualidade de vida"
  ],

  producto: [
    "melhora desempenho masculino","energia masculina natural",
    "resistência masculina","controle masculino natural",
    "suplemento vitalidade homens",

    // 🔥 NOVAS (ESSENCIAL)
    "suplemento masculino natural","cápsulas masculinas",
    "fórmula masculina avançada","gotas energia homens",
    "vitaminas masculinas energia","produto natural homens",
    "suplemento energia homens","fórmula energia masculina",
    "suplemento força homens","energético natural masculino"
  ],
  sexuales: [
  // 🔥 suaves (passam políticas)
  "desempenho masculino","melhor desempenho homens",
  "confiança masculina","vitalidade masculina",
  "resistência homens","energia na relação",
  "melhor desempenho diário","performance masculina",
  "mais energia homens","potencial masculino",

  // 🔥 eufemismos (TOP no Brasil)
  "como aos 20","segunda rodada",
  "sem pausas","mais resistência",
  "durar mais","melhor desempenho na cama",
  "mais energia à noite","desempenho sem limites",
  "recupere sua confiança","mais potência natural",

  // 🔥 disfarce médico (OURO)
  "melhora circulação sanguínea","fluxo sanguíneo natural",
  "melhorar circulação homens","óxido nítrico natural",
  "saúde vascular homens","melhor oxigenação",
  "circulação saudável","suporte à circulação",

  // 🔥 intenção de produto
  "potencializador masculino","aumentar potência masculina",
  "libido homens","bem-estar íntimo masculino",
  "saúde sexual masculina","vigor masculino",
  "suplemento desempenho masculino","energia íntima masculina",
  "performance masculina suplemento",

  // 🔥 extras alta conversão
  "cápsulas potência masculina","energia e resistência homens",
  "suplemento vitalidade masculina","desempenho masculino natural",
  "força masculina natural"," masculina natural"
],

  feromonas: [
    "perfume atração","perfume irresistível","fragrância sedução",

    // 🔥 NOVAS (eufemismos brasileiros)
    "perfume conquista","fragrância masculina irresistível",
    "aroma de atração","perfume para atrair mulheres",
    "fragrância magnética","perfume confiança masculina",
    "essência sedutora","cheiro irresistível masculino",
    "perfume feromônio masculino","fragrância envolvente"
  ]
  },

  FR: {
  problema: [
    "faible énergie masculine","fatigue","fatigue chronique","fatigue extrême",
    "manque de vitalité","faible performance physique","stress masculin",
    "épuisement quotidien","manque de concentration",

    // 🔥 NOUVEAU (langage réel)
    "toujours fatigué","pas d'énergie","manque d'énergie hommes",
    "fatigue constante","manque de force","baisse d'énergie",
    "épuisement physique","sans motivation","fatigue permanente",
    "fatigue mentale","coup de fatigue","manque d'énergie au quotidien",
    "baisse de forme","perte d'énergie"
  ],

  mecanismo: [
    "améliore la circulation sanguine","augmente l'énergie naturelle",
    "active la testostérone","améliore l'endurance physique",
    "optimise les performances quotidiennes","récupération musculaire rapide",
    "stimule l'énergie cellulaire",

    // 🔥 NOUVEAU (ads style)
    "améliore le flux sanguin","booste la testostérone naturellement",
    "stimule l'énergie naturelle","améliore l'oxygénation",
    "augmente la vitalité masculine","soutient l'équilibre hormonal",
    "active l'énergie du corps","améliore les performances masculines",
    "soutien énergétique naturel","augmente l'endurance"
  ],

  beneficio: [
    "plus d'énergie quotidienne","plus de confiance","meilleure performance physique",
    "vitalité masculine","performance sportive",
    "concentration mentale","meilleure qualité de vie",

    // 🔥 NOUVEAU (plus vendeur)
    "plus d'énergie toute la journée","retrouver de l'énergie",
    "plus de force et d'endurance","se sentir plus jeune",
    "améliorer ses performances","plus de vitalité",
    "meilleure performance au lit","plus d'énergie mentale",
    "retrouver sa forme","plus de puissance et confiance"
  ],

  busqueda: [
    "supplément énergie masculine","circulation sanguine naturelle",
    "solution fatigue hommes","performance physique naturelle",
    "vitalité masculine naturelle","complément énergie hommes",
    "améliorer énergie naturellement hommes",

    // 🔥 NOUVEAU (HIGH INTENT)
    "complément alimentaire homme énergie","gélules énergie homme",
    "booster testostérone naturel","complément vitalité homme",
    "produit énergie homme","solution fatigue homme",
    "augmenter énergie homme","complément performance homme",
    "booster énergie homme","vitalité homme complément"
  ],

  safe: [
    "bien-être intime","soin personnel adulte","santé masculine",
    "santé féminine","wellness","self care",
    "appareils de massage","relaxation corporelle",

    // 🔥 NOUVEAU (scale)
    "bien-être général","mode de vie sain","équilibre corporel",
    "santé et bien-être","routine bien-être","soin du corps",
    "qualité de vie","forme et santé"
  ],

  producto: [
    "amélioration performance masculine","énergie masculine naturelle",
    "endurance masculine","contrôle masculin naturel",
    "supplément vitalité hommes",

    // 🔥 NOUVEAU (CRUCIAL)
    "complément alimentaire homme","gélules masculines",
    "formule masculine avancée","capsules énergie homme",
    "complément testostérone","booster masculin naturel",
    "complément énergie homme","formule vitalité masculine",
    "booster performance homme","complément force homme"
  ],
  sexuales: [
  // 🔥 soft (passe les politiques)
  "performance masculine","améliorer performance homme",
  "confiance masculine","vitalité masculine",
  "endurance homme","énergie en couple",
  "meilleure performance quotidienne","puissance masculine",
  "plus d'énergie homme","potentiel masculin",

  // 🔥 euphémismes (TRÈS IMPORTANT)
  "comme à 20 ans","deuxième round",
  "sans pause","plus d'endurance",
  "durer plus longtemps","meilleure performance au lit",
  "plus d'énergie la nuit","performance sans limites",
  "retrouver sa confiance","plus de puissance naturelle",

  // 🔥 déguisement médical (OR)
  "améliorer la circulation sanguine","flux sanguin naturel",
  "circulation homme","oxyde nitrique naturel",
  "santé vasculaire homme","meilleure oxygénation",
  "circulation saine","soutien circulation",

  // 🔥 intention produit
  "booster masculin","puissance masculine",
  "libido homme","bien-être intime homme",
  "santé sexuelle masculine","vigueur masculine",
  "complément performance homme","énergie intime masculine",
  "performance masculine complément",

  // 🔥 extras haute conversion
  "gélules puissance masculine","énergie et endurance homme",
  "complément vitalité masculine","performance masculine naturelle",
  "force masculine naturelle","puissance masculine naturelle"
],

  feromonas: [
    "parfum attraction","parfum irrésistible","fragrance séduction",

    // 🔥 NOUVEAU (euphémismes FR)
    "parfum de séduction","fragrance irrésistible homme",
    "parfum attirance","parfum magnétique",
    "fragrance confiance homme","parfum charisme",
    "essence séduisante","parfum homme irrésistible",
    "fragrance attirance","parfum pouvoir de séduction"
  ]
},
DE: {
  problema: [
    "niedrige männliche energie","chronische müdigkeit","müdigkeit","extreme erschöpfung",
    "mangel an vitalität","schwache körperliche leistung","männlicher stress",
    "tägliche erschöpfung","konzentrationsmangel",

    // 🔥 NEU (real ads language)
    "ständig müde","keine energie","energiemangel männer",
    "immer erschöpft","kraftlosigkeit","leistungsabfall männer",
    "anhaltende müdigkeit","erschöpfung im alltag",
    "keine motivation","mentale erschöpfung",
    "energieverlust","müdigkeit den ganzen tag",
    "schlappheit","antriebslosigkeit"
  ],

  mecanismo: [
    "verbessert die durchblutung","steigert natürliche energie",
    "aktiviert testosteron","verbessert die körperliche ausdauer",
    "optimiert die tägliche leistung","schnelle muskelregeneration",
    "stimuliert zellenergie",

    // 🔥 NEU (ads style)
    "fördert die durchblutung","unterstützt den testosteronspiegel",
    "steigert die energieproduktion","verbessert den sauerstofffluss",
    "aktiviert natürliche energie","unterstützt den hormonhaushalt",
    "erhöht die leistungsfähigkeit","fördert die ausdauer",
    "unterstützt die regeneration","natürlicher energie boost"
  ],

  beneficio: [
    "mehr tägliche energie","mehr selbstvertrauen","bessere körperliche leistung",
    "männliche vitalität","sportliche leistung",
    "mentaler fokus","bessere lebensqualität",

    // 🔥 NEU (sales language)
    "mehr energie den ganzen tag","mehr kraft und ausdauer",
    "wieder fit fühlen","mehr leistungsfähigkeit",
    "mehr energie im alltag","mehr vitalität",
    "bessere leistung im bett","mehr fokus und energie",
    "stärkerer körper","mehr energie und selbstvertrauen"
  ],

  busqueda: [
    "männliche energie supplement","natürliche durchblutung",
    "lösung müdigkeit männer","natürliche körperleistung",
    "männliche vitalität supplement","energie supplement männer",
    "energie natürlich steigern männer",

    // 🔥 NEU (HIGH INTENT)
    "nahrungsergänzungsmittel männer energie",
    "energie kapseln männer","testosteron booster natürlich",
    "männer energie kapseln","vitalität männer supplement",
    "produkt energie männer","lösung müdigkeit männer",
    "energie steigern männer","leistung männer supplement",
    "energie booster männer","kraft männer supplement"
  ],

  safe: [
    "intimes wohlbefinden","körperpflege erwachsene","männergesundheit",
    "frauengesundheit","wellness","self care",
    "massagegeräte","körperentspannung",

    // 🔥 NEU (scale keywords)
    "gesundheit und wohlbefinden","gesunder lebensstil",
    "körperpflege","wohlbefinden","lebensqualität",
    "natürliche gesundheit","balance im alltag",
    "gesund leben"
  ],

  producto: [
    "männliche leistungssteigerung","natürliche männliche energie",
    "männliche ausdauer","männliche kontrolle supplement",
    "vitalität supplement männer",

    // 🔥 NEU (CRUCIAL)
    "nahrungsergänzungsmittel männer",
    "energie kapseln männer","männer booster supplement",
    "testosteron unterstützung","natürlicher männer booster",
    "energie formel männer","vitalität kapseln männer",
    "leistungssteigerung supplement männer",
    "kraft booster männer","energie booster männer"
  ],
sexuales: [
  // 🔥 soft (policy safe)
  "männliche leistungsfähigkeit","bessere leistung männer",
  "männliches selbstvertrauen","männliche vitalität",
  "ausdauer männer","energie im bett",
  "bessere tägliche leistung","männliche performance",
  "mehr energie männer","männliches potenzial",

  // 🔥 eufemismen (SEHR WICHTIG)
  "wie mit 20","zweite runde",
  "ohne pause","mehr ausdauer",
  "länger durchhalten","bessere leistung im bett",
  "mehr energie nachts","leistung ohne grenzen",
  "selbstvertrauen zurückgewinnen","mehr natürliche kraft",

  // 🔥 medizinischer disguise (GOLD)
  "durchblutung verbessern","blutfluss verbessern",
  "durchblutung männer","stickstoffmonoxid natürlich",
  "gefäßgesundheit männer","bessere sauerstoffversorgung",
  "gesunde durchblutung","durchblutung unterstützen",

  // 🔥 produkt intent
  "männlicher booster","potenz steigern männer",
  "libido männer","intime gesundheit männer",
  "sexuelle gesundheit männer","männliche kraft",
  "leistungssteigerung supplement männer","intime energie männer",
  "performance supplement männer",

  // 🔥 high converting extras
  "potenz kapseln männer","energie und ausdauer männer",
  "vitalität supplement männer","natürliche leistungssteigerung",
  "männliche kraft natürlich","potenz natürlich steigern"
],
  feromonas: [
    "anziehungs parfum","unwiderstehliches parfum","verführungsduft",

    // 🔥 NEU (euphemisms used in ads)
    "pheromon parfum männer","anziehungskraft parfum",
    "verführerischer duft","magnetischer duft männer",
    "selbstbewusstsein parfum","charisma duft",
    "anziehung duft männer","männer parfum anziehung",
    "attraktiver duft","dominanter duft männer"
  ]
},
IT: {
  problema: [
    "bassa energia maschile","stanchezza cronica","fatica","affaticamento estremo",
    "mancanza di vitalità","bassa prestazione fisica","stress maschile",
    "stanchezza quotidiana","mancanza di concentrazione",

    // 🔥 NUOVE (linguaggio reale)
    "sempre stanco","senza energia","energia bassa uomini",
    "mi sento stanco sempre","mancanza di forza","basso rendimento uomini",
    "debolezza fisica","stanchezza costante","senza motivazione",
    "affaticamento mentale","stanchezza tutto il giorno",
    "calo di energia","senza voglia","esaurimento fisico"
  ],

  mecanismo: [
    "migliora la circolazione sanguigna","aumenta energia naturale",
    "attiva testosterone","migliora resistenza fisica",
    "ottimizza le prestazioni quotidiane","recupero muscolare rapido",
    "stimola energia cellulare",

    // 🔥 NUOVE (ads style)
    "migliora il flusso sanguigno","aumenta il testosterone naturalmente",
    "stimola energia naturale","migliora ossigenazione",
    "aumenta vitalità maschile","supporta equilibrio ormonale",
    "attiva energia del corpo","migliora prestazioni maschili",
    "supporto energetico naturale","aumenta resistenza"
  ],

  beneficio: [
    "più energia quotidiana","più fiducia","migliori prestazioni fisiche",
    "vitalità maschile","prestazioni sportive",
    "concentrazione mentale","migliore qualità della vita",

    // 🔥 NUOVE (più vendita)
    "più energia tutto il giorno","sentirsi attivi",
    "più forza e resistenza","sentirsi più giovani",
    "migliorare le prestazioni","più vitalità",
    "migliori prestazioni a letto","più energia mentale",
    "ritrovare energia","più potenza e sicurezza"
  ],

  busqueda: [
    "integratore energia maschile","circolazione naturale",
    "soluzione stanchezza uomini","prestazioni fisiche naturali",
    "vitalità maschile naturale","integratore energia uomini",
    "aumentare energia naturalmente uomini",

    // 🔥 NUOVE (HIGH INTENT)
    "integratore uomini energia","capsule energia uomini",
    "testosterone naturale integratore","integratore vitalità uomini",
    "prodotto energia uomini","soluzione stanchezza uomini",
    "aumentare energia uomini","integratore prestazioni uomini",
    "booster energia uomini","integratore forza uomini"
  ],

  safe: [
    "benessere intimo","cura personale adulti","salute maschile",
    "salute femminile","wellness","self care",
    "massaggiatori","rilassamento corporeo",

    // 🔥 NUOVE (scale)
    "benessere generale","stile di vita sano",
    "equilibrio corpo","salute e benessere",
    "cura del corpo","routine benessere",
    "qualità della vita","vita sana"
  ],

  producto: [
    "migliora prestazione maschile","energia maschile naturale",
    "resistenza maschile","controllo maschile naturale",
    "integratore vitalità uomini",

    // 🔥 NUOVE (CRUCIALI)
    "integratore maschile naturale","capsule maschili",
    "formula maschile avanzata","capsule energia uomini",
    "integratore testosterone","booster maschile naturale",
    "integratore energia uomini","formula vitalità maschile",
    "booster prestazioni uomini","integratore forza uomini"
  ],
sexuales: [
  // 🔥 soft (passa le policy)
  "prestazioni maschili","migliorare prestazioni uomo",
  "fiducia maschile","vitalità maschile",
  "resistenza uomini","energia nella coppia",
  "miglior rendimento quotidiano","performance maschile",
  "più energia uomini","potenziale maschile",

  // 🔥 eufemismi (MOLTO IMPORTANTI)
  "come a 20 anni","secondo round",
  "senza pause","più resistenza",
  "durare di più","migliori prestazioni a letto",
  "più energia di notte","prestazioni senza limiti",
  "ritrova la tua fiducia","più potenza naturale",

  // 🔥 dissimulazione medica (ORO)
  "migliora la circolazione sanguigna","flusso sanguigno naturale",
  "circolazione uomini","ossido nitrico naturale",
  "salute vascolare uomini","migliore ossigenazione",
  "circolazione sana","supporto alla circolazione",

  // 🔥 intento prodotto
  "potenziatore maschile","aumentare potenza maschile",
  "libido uomini","benessere intimo uomo",
  "salute sessuale maschile","vigore maschile",
  "integratore prestazioni uomini","energia intima maschile",
  "performance maschile integratore",

  // 🔥 extras alta conversione
  "capsule potenza maschile","energia e resistenza uomini",
  "integratore vitalità maschile","prestazioni maschili naturali",
  "forza maschile naturale","potenza maschile naturale"
],
  feromonas: [
    "profumo attrazione","profumo irresistibile","fragranza seduzione",

    // 🔥 NUOVE (eufemismi italiani)
    "profumo seduzione","fragranza irresistibile uomo",
    "profumo magnetico","profumo per attirare",
    "fragranza maschile intensa","profumo carisma",
    "essenza seducente","profumo uomo irresistibile",
    "fragranza attrazione","profumo potere attrattivo"
  ]
},
JP:  {
  problema: [
    "疲労","男性の低エネルギー","慢性的な疲労","極度の疲れ",
    "活力不足","身体パフォーマンス低下","男性ストレス",
    "日常的な疲労","集中力不足",

    // 🔥 新しい（広告でよく使われる）
    "いつも疲れている","エネルギー不足","元気が出ない",
    "だるさ","疲れやすい","体力低下",
    "スタミナ不足","やる気が出ない","慢性的なだるさ",
    "疲れが取れない","日中の眠気","体のだるさ",
    "気力低下","疲労感"
  ],

  mecanismo: [
    "血流を改善","自然なエネルギーを増加",
    "テストステロンを活性化","身体持久力を向上",
    "日常パフォーマンスを最適化","筋肉回復を促進",
    "細胞エネルギーを刺激",

    // 🔥 新しい（広告スタイル）
    "血行促進","エネルギー生成をサポート",
    "自然な活力をサポート","ホルモンバランスを整える",
    "酸素供給をサポート","体内エネルギーを高める",
    "持久力をサポート","活力を引き出す",
    "体力をサポート","コンディション改善"
  ],

  beneficio: [
    "日々のエネルギー向上","自信向上","身体能力向上",
    "男性の活力","スポーツパフォーマンス",
    "集中力向上","生活の質向上",

    // 🔥 新しい（売れる表現）
    "一日中元気","活力アップ","体力アップ",
    "毎日をもっと快適に","若々しさを取り戻す",
    "パフォーマンス向上","スタミナ向上",
    "集中力アップ","エネルギー持続",
    "元気な毎日","自信アップ"
  ],

  busqueda: [
    "男性エネルギーサプリ","血流改善 自然",
    "疲労 男性 解決","自然な身体パフォーマンス",
    "男性活力 サプリ","エネルギーサプリ 男性",
    "自然にエネルギー向上 男性",

    // 🔥 新しい（高意図）
    "疲労回復 サプリ 男性","活力サプリ メンズ",
    "スタミナ サプリ 男性","エネルギー補給 サプリ",
    "男性用 サプリメント","元気 サプリ 男性",
    "体力 回復 サプリ","疲れ 改善 サプリ",
    "活力アップ サプリ","コンディション サプリ"
  ],

  safe: [
    "親密な健康","大人のセルフケア","男性の健康",
    "女性の健康","ウェルネス","セルフケア",
    "マッサージ器","身体リラックス",

    // 🔥 新しい（拡張）
    "健康サポート","ライフスタイル改善",
    "日常ケア","健康維持","体調管理",
    "バランスの取れた生活","リラクゼーション",
    "健康習慣"
  ],

  producto: [
    "男性パフォーマンス向上","男性エネルギー自然",
    "男性持久力","男性コントロールサポート",
    "男性活力サプリ",

    // 🔥 新しい（重要）
    "男性用サプリメント","活力サポートサプリ",
    "エネルギーサポートサプリ","スタミナサプリ",
    "男性向け健康サプリ","体力サポートサプリ",
    "活力補給サプリ","エネルギーブーストサプリ",
    "パフォーマンスサポート","男性健康サプリ"
  ],
sexuales: [
  // 🔥 ソフト（安全・よく使われる）
  "男性パフォーマンス","パフォーマンス向上 男性",
  "男性の自信","男性の活力",
  "持久力 男性","エネルギー サポート",
  "日常パフォーマンス向上","男性エネルギー",
  "男性の可能性","元気サポート",

  // 🔥 婉曲表現（超重要）
  "若い頃のように","もう一度実感",
  "途切れない力","持続力アップ",
  "長く続く","夜の自信",
  "夜のパフォーマンス","自信を取り戻す",
  "自然な力をサポート","パワーアップ",

  // 🔥 医療的な表現（ゴールド）
  "血流サポート","血行改善",
  "血流を良くする","一酸化窒素 サポート",
  "血管健康","酸素供給サポート",
  "循環サポート","体内循環改善",

  // 🔥 商品意図
  "男性サポートサプリ","活力サプリ 男性",
  "男性用サプリメント","精力サポート",
  "男性健康サポート","スタミナサプリ",
  "活力補助","パフォーマンスサプリ",

  // 🔥 高コンバージョン
  "精力サプリ","活力アップ サプリ",
  "スタミナ強化","エネルギーと持久力",
  "男性活力サプリ","自然な活力サポート",
  "体力サポート","コンディション改善"
],
  feromonas: [
    "魅力香水","誘惑の香り","フェロモン香水",

    // 🔥 新しい（日本向け表現）
    "モテる香り","魅力アップ香水",
    "印象アップ香り","好印象フレグランス",
    "大人の香り","自信アップ香水",
    "男性用フレグランス","魅力的な香り",
    "好感度アップ香水","フェロモンフレグランス"
  ]
}


};

// =============================
window.setPais = function(pais) {
  paisActivo = pais;
  actualizarLabelPais();
  renderKeywords();
};

// =============================


// =============================
window.buscar = function(keyword) {
  const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${paisActivo}&q=${encodeURIComponent(keyword)}`;
  window.open(url, "_blank");
};

// =============================
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


window.setActive = function(el) {
  document.querySelectorAll(".sidebar-item")
    .forEach(i => i.classList.remove("active"));

  el.classList.add("active");
};

window.toggleSidebar = function() {
  const sidebar = document.querySelector("aside");
  const btn = document.querySelector(".toggle-btn");

  sidebar.classList.toggle("collapsed");

  // 🔥 reemplazar icono completamente
  if (sidebar.classList.contains("collapsed")) {
    btn.innerHTML = `<i data-lucide="panel-right"></i>`;
  } else {
    btn.innerHTML = `<i data-lucide="panel-left"></i>`;
  }

  lucide.createIcons(); // 🔥 ahora sí funciona
};

window.goTo = function(route) {



if (route === "desarrollo") {
  view.innerHTML = `
    <div class="dev-page">

      <section class="dev-hero">
        <div class="dev-hero-left">
          <div class="dev-badge">
            <i data-lucide="brain"></i>
            <span>Desarrollo de producto</span>
          </div>

          <h1 class="dev-title">Crea avatares, ángulos y guiones con IA</h1>
          <p class="dev-subtitle">
            Analiza producto, problema, mecanismo o información del producto
            para construir la base de landing, creativos y segmentación.
          </p>
        </div>

        <div class="dev-hero-right">
          <div class="dev-stat-card">
            <strong>Salida esperada</strong>
            <span>3 avatares · 5 ángulos por avatar · 3 guiones · 2 ideas visuales</span>
          </div>
        </div>
      </section>

      <section class="dev-layout">

        <div class="dev-left">
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
        </div>

        <div class="dev-right">
          <div class="dev-card">
            <div class="dev-card-head">
              <h3>Resultado IA</h3>
              <p>Salida organizada para avatar, ángulos, guiones y creativos.</p>
            </div>

            <div id="resultadoDesarrollo" class="dev-result-empty">
              <i data-lucide="layout-dashboard"></i>
              <p>Aquí aparecerá el desarrollo del producto.</p>
            </div>
          </div>
        </div>

      </section>
    </div>
  `;

  marcarMenuActivo("desarrollo");

 setTimeout(() => {
  restaurarEstadoDesarrollo();
  if (window.lucide) lucide.createIcons();
}, 0);

  return;
}

if (route === "calculadora") {
  view.innerHTML = renderCalculadoraDashboard();
  marcarMenuActivo("calculadora");

  setTimeout(() => {
    actualizarCalculadoraDashboard();
    if (window.lucide) lucide.createIcons();
  }, 0);

  return;
}


if (route === "inicio") {
  view.innerHTML = `
    <div class="home-page">

      <section class="home-hero">
        <div class="home-hero-left">
          <div class="home-badge">
            <i data-lucide="sparkles"></i>
            <span>Workspace de ecommerce</span>
          </div>

          <h1 class="home-title">
            Descubre, valida y desarrolla productos
            <span>desde una sola plataforma</span>
          </h1>

          <p class="home-subtitle">
            CoDropX te ayuda a encontrar oportunidades, validar demanda,
            organizar tu base de productos y construir ángulos, avatares,
            guiones y creativos con IA.
          </p>

          <div class="home-actions">
            <button class="primary home-main-btn" onclick="goTo('tendencias')">
              <i data-lucide="radar"></i>
              Explorar oportunidades
            </button>

            <button class="home-secondary-btn" onclick="goTo('desarrollo')">
              <i data-lucide="brain"></i>
              Ir a desarrollo
            </button>
          </div>
        </div>

        <div class="home-hero-right">
          <div class="home-kpi-card">
            <div class="home-kpi-top">
              <span class="home-kpi-label">Flujo principal</span>
              <span class="home-kpi-pill">Activo</span>
            </div>

            <div class="home-kpi-steps">
              <div class="home-step">
                <strong>1</strong>
                <span>Descubrir</span>
              </div>
              <div class="home-step">
                <strong>2</strong>
                <span>Validar</span>
              </div>
              <div class="home-step">
                <strong>3</strong>
                <span>Desarrollar</span>
              </div>
              <div class="home-step">
                <strong>4</strong>
                <span>Lanzar</span>
              </div>
            </div>

            <div class="home-kpi-note">
              Centraliza tendencias, productos y estrategia creativa en un solo lugar.
            </div>
          </div>
        </div>
      </section>

      <section class="home-stats">
        <div class="home-stat">
          <div class="home-stat-icon"><i data-lucide="line-chart"></i></div>
          <div>
            <strong>Radar de tendencias</strong>
            <p>Encuentra oportunidades con lógica de mercado.</p>
          </div>
        </div>

        <div class="home-stat">
          <div class="home-stat-icon"><i data-lucide="shield-check"></i></div>
          <div>
            <strong>Validación real</strong>
            <p>Contrasta señales con Ads Library y proveedores.</p>
          </div>
        </div>

        <div class="home-stat">
          <div class="home-stat-icon"><i data-lucide="brain-circuit"></i></div>
          <div>
            <strong>Desarrollo con IA</strong>
            <p>Genera avatares, ángulos, guiones y creativos.</p>
          </div>
        </div>
      </section>

      <section class="home-grid">
        <article class="home-card" onclick="goTo('tendencias')">
          <div class="home-card-top">
            <div class="home-card-icon blue"><i data-lucide="compass"></i></div>
            <span class="home-card-tag">Descubrimiento</span>
          </div>
          <h3>Explora tendencias y nichos</h3>
          <p>Analiza dolores, mercados, señales y oportunidades antes de entrar a validar.</p>
          <div class="home-card-link">Abrir módulo</div>
        </article>

        <article class="home-card" onclick="goTo('busqueda')">
          <div class="home-card-top">
            <div class="home-card-icon indigo"><i data-lucide="search-check"></i></div>
            <span class="home-card-tag">Validación</span>
          </div>
          <h3>Confirma demanda real</h3>
          <p>Usa búsquedas, Ads Library, TikTok y análisis de mercado para validar productos.</p>
          <div class="home-card-link">Abrir módulo</div>
        </article>

        <article class="home-card" onclick="goTo('productos')">
          <div class="home-card-top">
            <div class="home-card-icon sky"><i data-lucide="database"></i></div>
            <span class="home-card-tag">Base de productos</span>
          </div>
          <h3>Organiza tu inventario estratégico</h3>
          <p>Guarda productos, clasifícalos por estado y controla materiales, landings y creativos.</p>
          <div class="home-card-link">Abrir módulo</div>
        </article>

        <article class="home-card wide" onclick="goTo('desarrollo')">
          <div class="home-card-top">
            <div class="home-card-icon violet"><i data-lucide="sparkles"></i></div>
            <span class="home-card-tag">Desarrollo</span>
          </div>
          <h3>Construye la estrategia del producto</h3>
          <p>
            Convierte un producto o una imagen en avatares, ángulos, guiones,
            creativos y recomendaciones listas para landing y anuncios.
          </p>

          <div class="home-feature-list">
            <span>3 avatares</span>
            <span>5 ángulos por avatar</span>
            <span>Guiones AIDA</span>
            <span>Creativos de imagen</span>
          </div>

          <div class="home-card-link">Abrir módulo</div>
        </article>
      </section>
    </div>
  `;

  marcarMenuActivo("inicio");

  setTimeout(() => {
    if (window.lucide) lucide.createIcons();
  }, 0);

  return;
}

  if (route === "busqueda") {
    view.innerHTML = renderBusqueda();
    marcarMenuActivo("busqueda");

    setTimeout(() => {
      renderKeywordsImport();
      renderKeywordsCat();
      if (window.lucide) lucide.createIcons();
    }, 0);

    return;
  }

 if (route === "productos") {
  cargarProductos().then(() => {
    view.innerHTML = renderProductos();

    setTimeout(() => {
  renderTablaProductos();
  toggleCampoDropi();

  if (window.productoPaisActivo === "CO") {
    marcarMenuActivo("productos-co");
  }

  if (window.productoPaisActivo === "EC") {
    marcarMenuActivo("productos-ec");
  }

  if (window.lucide) lucide.createIcons();
}, 0);
  });

  return;
}

if (route === "tendencias") {
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
}

};

setTimeout(() => {
  if (window.lucide) {
    lucide.createIcons();
  }
}, 500);





window.previewImagenDev = function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const empty = document.getElementById("devUploadEmpty");
  const preview = document.getElementById("devUploadPreview");
  const img = document.getElementById("devUploadImg");
  const name = document.getElementById("devUploadName");

  const url = URL.createObjectURL(file);

  if (img) img.src = url;
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

    const prompt = `
Eres un estratega senior de ecommerce y marketing de respuesta directa.

CONTEXTO:
PRODUCTO / PROBLEMA / MECANISMO:
${producto || "No se escribió texto. Analiza la imagen."}

INFO ADICIONAL:
${info || "Sin info adicional"}

IMPORTANTE:
Si se adjunta una imagen, primero analízala y determina:
- qué producto es
- qué problema resuelve
- beneficios visibles o inferidos
- tipo de cliente ideal
- mecanismo o promesa principal

Si NO hay imagen, usa solo el texto.
Si HAY imagen, prioriza la imagen sobre el texto.

TIPO DE SALIDA:
${tipo}

Si el tipo es "completo", Devuelve EXACTAMENTE con estos títulos en MAYÚSCULA:

AVATARES:
ÁNGULOS:
GUIONES DE VIDEO:
CREATIVOS DE IMAGEN:
RECOMENDACIÓN FINAL:

1. AVATARES
- 3 avatares
- nombre
- dolor principal
- deseo
- objeción
- trigger de compra

2. ÁNGULOS
- 5 ángulos por avatar
- enfocados en venta

3. GUIONES DE VIDEO
- 3 guiones de 25 a 30 segundos
- modelo AIDA
- CTA fuerte
- compra impulsiva
- efecto wow

4. CREATIVOS DE IMAGEN
- 2 ideas
- qué mostrar
- texto principal
- emoción

5. RECOMENDACIÓN FINAL
- cómo usar en landing
- cómo usar en ads

Formato limpio, claro y organizado.
`;

    const res = await fetch("/api/ia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        image: imageBase64
      })
    });

 const raw = await res.text();
console.log("RAW /api/ia:", raw);

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

if (window.lucide) lucide.createIcons();

  } catch (error) {
  resultado.className = "dev-result-error";
  resultado.innerHTML = `
    <div class="dev-error-box">
      <strong>Error</strong>
      <p>${error.message}</p>
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
  const sections = splitBlocks(reply);

  const tieneContenido =
    sections.avatares ||
    sections.angulos ||
    sections.guiones ||
    sections.creativos ||
    sections.recomendacion;

  // 🔥 SI FALLA EL PARSER → MOSTRAR TODO
  if (!tieneContenido) {
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

  const renderBlock = (title, content, icon) => `
    <div class="pro-card">
      <div class="pro-card-head">
        <div class="pro-icon">${icon}</div>
        <h3>${title}</h3>
      </div>
      <div class="pro-card-body">
        ${formatProContent(content)}
      </div>
    </div>
  `;

  return `
    <div class="pro-grid">

      ${renderBlock("Avatares", sections.avatares, "👤")}
      ${renderBlock("Ángulos", sections.angulos, "🎯")}
      ${renderBlock("Guiones", sections.guiones, "🎬")}
      ${renderBlock("Creativos", sections.creativos, "🖼️")}

      <div class="pro-card full">
        <div class="pro-card-head">
          <div class="pro-icon">📌</div>
          <h3>Recomendación final</h3>
        </div>
        <div class="pro-card-body">
          ${formatProContent(sections.recomendacion)}
        </div>
      </div>

    </div>
  `;
}


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

window.toggleBusquedaMenu = function() {
  const sidebar = document.querySelector("aside");
  if (sidebar.classList.contains("collapsed")) {
    toggleSidebar();
    setTimeout(() => toggleBusquedaMenu(), 50);
    return;
  }

  const menu = document.getElementById("busqueda-submenu");
  const arrow = document.getElementById("busqueda-arrow");

  menu.classList.toggle("open");

  if (menu.classList.contains("open")) {
    arrow.setAttribute("data-lucide", "chevron-down");
  } else {
    arrow.setAttribute("data-lucide", "chevron-right");
  }

  lucide.createIcons();
};

window.toggleProductosMenu = function() {
  const sidebar = document.querySelector("aside");
  if (sidebar.classList.contains("collapsed")) {
    toggleSidebar();
    setTimeout(() => toggleProductosMenu(), 50);
    return;
  }

  const menu = document.getElementById("productos-submenu");
  const arrow = document.getElementById("productos-arrow");

  menu.classList.toggle("open");

  if (menu.classList.contains("open")) {
    arrow.setAttribute("data-lucide", "chevron-down");
  } else {
    arrow.setAttribute("data-lucide", "chevron-right");
  }

  lucide.createIcons();
};

window.setProductoPais = function(pais) {
  window.productoPaisActivo = pais;
  goTo("productos");

  if (pais === "CO") {
    marcarMenuActivo("productos-co");
  }

  if (pais === "EC") {
    marcarMenuActivo("productos-ec");
  }
};

window.toggleCampoDropi = function() {
  const origenEl = document.getElementById("origen");
  const wrap = document.getElementById("dropiIdWrap");
  const input = document.getElementById("dropiId");
  const topBar = document.querySelector(".top-bar");

  if (!origenEl || !wrap || !input || !topBar) return;

  const origen = (origenEl.value || "").trim().toLowerCase();
  const mostrar = origen === "dropi";

  wrap.hidden = !mostrar;
  topBar.classList.toggle("con-dropi", mostrar);
  topBar.classList.toggle("sin-dropi", !mostrar);

  if (!mostrar) {
    input.value = "";
  } else {
    input.placeholder = "ID Dropi";
  }
};

window.guardarProducto = async function() {
 const producto = {
  nombre: document.getElementById("nombre").value,
  origen: document.getElementById("origen").value,
dropiId: document.getElementById("origen").value === "dropi"
  ? document.getElementById("dropiId").value
  : "",
  material: document.getElementById("material").value,
  landing: document.getElementById("landing").value,
  creativos: document.getElementById("creativos").value,
  pais: window.productoPaisActivo,
estado: window.productoEditandoId
  ? (state.productos.find(p => p._id === window.productoEditandoId)?.estado || "idea")
  : "idea",
  desarrollo: {
    avatar: false,
    angulos: false,
    creativos: false,
    landing: false
  },
  fecha: new Date()
};

  try {
    let res;

    if (window.productoEditandoId) {
      res = await fetch(`/api/productos/${window.productoEditandoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(producto)
      });
    } else {
      res = await fetch("/api/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(producto)
      });
    }

    const data = await res.json();

    if (!res.ok) {
      alert("Error guardando en Mongo");
      console.error(data);
      return;
    }

    window.productoEditandoId = null;

    document.getElementById("nombre").value = "";
    document.getElementById("dropiId").value = "";
    document.getElementById("material").value = "";
    document.getElementById("landing").value = "";
    document.getElementById("creativos").value = "";

    await cargarProductos();
    renderTablaProductos();
  } catch (err) {
    console.error("Error guardando producto:", err);
    alert("No se pudo guardar");
  }
};
function escapeHTML(str = "") {
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

function fillList(id, items = []) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = (items || [])
    .map(x => `<li>${escapeHTML(x)}</li>`)
    .join("");
}

// =============================
// RENDER TABLA
function renderTablaProductos() {
  const tabla = document.getElementById("tabla-productos");
  if (!tabla) return;

tabla.innerHTML = state.productos.map((p, i) => `
  <div class="fila-producto">

  <div class="texto-celda">${escapeHTML(p.nombre || "")}</div>

<div class="texto-celda">
  ${
    p.origen === "dropi"
      ? `Dropi: ${escapeHTML(p.dropiId || "sin id")}`
      : p.origen === "importacion"
      ? "Importación"
      : p.origen === "laboratorio"
      ? "Laboratorio"
      : "-"
  }
</div>

  <div>
  <button class="icon-btn" onclick="abrirMaterial('${p.material || ""}')">
    <i data-lucide="file-text"></i>
  </button>
</div>

    <div>
      <button class="icon-btn" onclick="abrirCreativos('${p.creativos || ""}')">
        <i data-lucide="video"></i>
      </button>
    </div>

    <div>
      <button class="icon-btn" onclick="abrirLanding('${p.landing || ""}')">
        <i data-lucide="globe"></i>
      </button>
    </div>

    <!-- 🔥 PROCESO -->
    <div>
   <select
    class="select-pro estado-${(p.estado || "idea").replace(" ", "-")}"
    onchange="cambiarEstado('${p._id}', this.value)"
  >
    <option value="idea" ${p.estado === "idea" ? "selected" : ""}>Idea</option>
    <option value="validando" ${p.estado === "validando" ? "selected" : ""}>Validando</option>
    <option value="desarrollo" ${p.estado === "desarrollo" ? "selected" : ""}>Desarrollo</option>
    <option value="lanzado" ${p.estado === "lanzado" ? "selected" : ""}>Lanzado</option>
  </select>
</div>

    <!-- 🔥 BOTÓN DESARROLLO -->
    <div>
      <button class="btn-dev" onclick="irDesarrollo(${i})">
        Ir
      </button>
    </div>

    <!-- 🔥 ACCIONES -->
    <div class="acciones">
      <button class="icon-btn" onclick="editarProducto('${p._id}')">
        <i data-lucide="pencil"></i>
      </button>

      <button class="icon-btn" onclick="eliminarProducto('${p._id}')">
        <i data-lucide="trash"></i>
      </button>
    </div>

  </div>
`).join("");

// 🔥 IMPORTANTE
lucide.createIcons();
}



// =============================
window.abrirLanding = function(url) {
  if (!url) return;
  window.open(url, "_blank");
};

window.abrirCreativos = function(url) {
  if (!url) return;
  window.open(url, "_blank");
};

window.abrirMaterial = function(url) {
  if (!url) return;
  window.open(url, "_blank");
};

window.abrirDropi = function(id) {
  const url = `https://app.dropi.co/product/${id}`;
  window.open(url, "_blank");
};


// =============================
window.toggleDropiMenu = function() {
  const menu = document.getElementById("dropi-menu");
  menu.classList.toggle("open");
};

// =============================
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

// seleccionar keyword
window.toggleKeyword = function(el, keyword) {
  el.classList.toggle("active");

  if (selectedKeywords.includes(keyword)) {
    selectedKeywords = selectedKeywords.filter(k => k !== keyword);
  } else {
    selectedKeywords.push(keyword);
  }

  updateQueryPreview();
};

// render keywords (modificado)
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

// preview query
function updateQueryPreview() {
  const query = selectedKeywords.join(" ");

  const el = document.getElementById("queryPreview");
  if (el) el.innerText = query || "Selecciona keywords...";
}

// búsqueda Meta
window.buscarEnMeta = function() {
  const pais = document.getElementById("pais").value;
  const query = selectedKeywords.join(" ");

  if (!query) return alert("Selecciona keywords");

  const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${pais}&q=${encodeURIComponent(query)}`;
  window.open(url, "_blank");
};

// búsqueda TikTok
window.buscarEnTikTok = function() {
  const query = selectedKeywords.join(" ");
  window.open(`https://www.tiktok.com/search?q=${encodeURIComponent(query)}`, "_blank");
};

// producto
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


// ejecutar final
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




async function llamarIA(texto) {
  const res = await fetch("/api/ia", {
      method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: texto
    })
  });

  const data = await res.json();
  console.log(data);
}

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


function renderTendenciasDashboard() {
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


function fillChips(id, items = [], extraClass = "") {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = (items || [])
    .map(x => `<span class="trend-chip ${extraClass}">${escapeHTML(x)}</span>`)
    .join("");
}
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "-";
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


function renderCalculadoraDashboard() {
  return `
    <div class="calcx-page">
      <section class="calcx-layout">

        <aside class="calcx-sidebar">
          <div class="calcx-panel">
            <div class="calcx-panel-head">
              <div class="calcx-badge">
                <i data-lucide="calculator"></i>
                <span>Calculadora</span>
              </div>
              <h2>Panel de parámetros</h2>
              <p>Configura costos, pérdidas y margen objetivo.</p>
            </div>

            <div class="calcx-form">
              <label>Divisa</label>
              <select id="calcxMoneda" onchange="actualizarCalculadoraDashboard()">
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </select>

              <label>Valor de venta deseado</label>
              <input id="calcxPrecioVenta" type="number" value="99842" oninput="actualizarCalculadoraDashboard()">

              <label>Costo del producto</label>
              <input id="calcxPrecioProveedor" type="number" value="21000" oninput="actualizarCalculadoraDashboard()">

              <label>Flete base</label>
              <input id="calcxFleteBase" type="number" value="20000" oninput="actualizarCalculadoraDashboard()">

              <label>Fulfillment</label>
              <input id="calcxFulfillment" type="number" value="0" oninput="actualizarCalculadoraDashboard()">

              <label>Confirmación logística</label>
              <input id="calcxConfirmacion" type="number" value="0" oninput="actualizarCalculadoraDashboard()">

              <label>Costos administrativos</label>
              <input id="calcxAdmin" type="number" value="5000" oninput="actualizarCalculadoraDashboard()">
              <label>Impuestos (%)</label>
              <input id="calcxImpuestos" type="number" step="0.1" value="2" oninput="actualizarCalculadoraDashboard()">

              <label>Plataforma de pago</label>
              <select id="calcxPasarela" onchange="actualizarCalculadoraDashboard()">
                <option value="none">Sin comisión</option>
                <option value="payu">PayU</option>
                <option value="mercadopago">Mercado Pago</option>
                <option value="stripe">Stripe</option>
              </select>

              <label>% cancelaciones</label>
              <input id="calcxCancelados" type="number" step="0.1" value="10" oninput="actualizarCalculadoraDashboard()">

              <label>% devoluciones</label>
              <input id="calcxDevoluciones" type="number" step="0.1" value="20" oninput="actualizarCalculadoraDashboard()">

              <label>Margen objetivo</label>
              <input id="calcxMargenObjetivo" type="number" step="0.1" value="18" oninput="actualizarCalculadoraDashboard()">
            </div>
          </div>
        </aside>

        <div class="calcx-main">
          <div class="calcx-top-grid">
            <div class="calcx-card principal">
              <span>Precio / utilidad / margen</span>
              <strong id="calcxOutPrecioVenta">$0</strong>

              <div class="calcx-triple">
                <div>
                  <small>Utilidad</small>
                  <b id="calcxOutUtilidad">$0</b>
                </div>
                <div>
                  <small>Margen</small>
                  <b id="calcxOutMargen">0%</b>
                </div>
              </div>
            </div>

            <div class="calcx-card amarillo">
              <span>Punto de equilibrio</span>
              <strong id="calcxOutBreakEven">$0</strong>
              <small>Lo mínimo para no perder</small>
            </div>

            <div class="calcx-card naranja">
              <span>Costo bruto total por venta</span>
              <strong id="calcxOutCostosTotales">$0</strong>
              <small>Incluye operación, pérdidas y pauta</small>
            </div>
          </div>

          <div class="calcx-grid">
            <div class="calcx-card">
              <span>Precio mínimo</span>
              <strong id="calcxOutPrecioMinimo">$0</strong>
              <small>Con margen mínimo de seguridad</small>
            </div>

            <div class="calcx-card">
              <span>Precio ideal</span>
              <strong id="calcxOutPrecioIdeal">$0</strong>
              <small>Basado en margen objetivo</small>
            </div>

            <div class="calcx-card">
              <span>Pauta máxima permitida</span>
              <strong id="calcxOutPautaMaxima">$0</strong>
              <small>Límite recomendado</small>
            </div>

            <div class="calcx-card">
              <span>Inversión en pauta efectiva</span>
              <strong id="calcxOutCPA">$0</strong>
              <small>20% del valor de venta</small>
            </div>

            <div class="calcx-card">
              <span>Pérdida por cancelaciones</span>
              <strong id="calcxOutPerdidaCancelados">$0</strong>
              <small>Impacto estimado</small>
            </div>

            <div class="calcx-card">
              <span>Pérdida por devoluciones</span>
              <strong id="calcxOutPerdidaDevoluciones">$0</strong>
              <small>Impacto estimado</small>
            </div>

            <div class="calcx-card">
              <span>Proyección ROAS</span>
              <strong id="calcxOutROAS">0.00</strong>
              <small>Venta / pauta efectiva</small>
            </div>

            <div class="calcx-card">
              <span>Proyección ROI</span>
              <strong id="calcxOutROI">0%</strong>
              <small>Utilidad / costo bruto total</small>
            </div>

            <div class="calcx-card full resumen">
              <span>Resumen ejecutivo</span>
              <p id="calcxResumen">Aquí verás el resumen calculado.</p>
            </div>
          </div>
        </div>

      </section>
    </div>
  `;
}
window.syncMonedaCalculadora = function() {
  const pais = document.getElementById("calcxPais")?.value || "CO";
  const moneda = document.getElementById("calcxMoneda");
  if (!moneda) return;
  moneda.value = pais === "CO" ? "COP" : "USD";
};

function formatMoneyCalcx(value, currency) {
  const num = Number(value || 0);

  if (currency === "COP") {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(num);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

function getPasarelaConfig(tipo) {
  const map = {
    none: { pct: 0, fijo: 0, nombre: "Sin comisión" },
    payu: { pct: 0.044, fijo: 900, nombre: "PayU 4.4% + fijo" },
    mercadopago: { pct: 0.035, fijo: 0, nombre: "Mercado Pago 3.5%" },
    stripe: { pct: 0.029, fijo: 0.3, nombre: "Stripe 2.9% + fijo" }
  };

  return map[tipo] || map.none;
}

window.actualizarCalculadoraDashboard = function() {
  const moneda = document.getElementById("calcxMoneda")?.value || "COP";
const impuestosPct = Number(document.getElementById("calcxImpuestos")?.value || 0);
  const precioVentaFinal = Number(document.getElementById("calcxPrecioVenta")?.value || 0);
  const costoProducto = Number(document.getElementById("calcxPrecioProveedor")?.value || 0);
  const fleteBase = Number(document.getElementById("calcxFleteBase")?.value || 0);
  const fulfillment = Number(document.getElementById("calcxFulfillment")?.value || 0);
  const confirmacion = Number(document.getElementById("calcxConfirmacion")?.value || 0);
  const admin = Number(document.getElementById("calcxAdmin")?.value || 0);
  const cancelados = Number(document.getElementById("calcxCancelados")?.value || 0);
  const devoluciones = Number(document.getElementById("calcxDevoluciones")?.value || 0);
  const margenObjetivo = Number(document.getElementById("calcxMargenObjetivo")?.value || 0);
  const pasarelaTipo = document.getElementById("calcxPasarela")?.value || "none";

  const pasarela = getPasarelaConfig(pasarelaTipo);

  const efectividad = 1 - ((cancelados + devoluciones) / 100);
  const fleteAjustado = efectividad > 0 ? fleteBase / efectividad : 0;

  const cpa = precioVentaFinal * 0.20;
  const comisionPasarela = (precioVentaFinal * pasarela.pct) + pasarela.fijo;

  const perdidaCancelados = precioVentaFinal * (cancelados / 100) * 0.25;
  const perdidaDevoluciones = precioVentaFinal * (devoluciones / 100) * 0.12;

const subtotalCostos =
  costoProducto +
  fleteAjustado +
  fulfillment +
  confirmacion +
  admin +
  comisionPasarela +
  cpa +
  perdidaCancelados +
  perdidaDevoluciones;

// impuestos sobre el subtotal
const impuestos = subtotalCostos * (impuestosPct / 100);

const costosTotales = subtotalCostos + impuestos;

  const utilidad = precioVentaFinal - costosTotales;
  const margen = precioVentaFinal > 0 ? (utilidad / precioVentaFinal) * 100 : 0;

  const breakEven = costosTotales;
  const precioMinimo = costosTotales / 0.90;
  const precioIdeal = (100 - margenObjetivo) > 0
    ? costosTotales / (1 - (margenObjetivo / 100))
    : costosTotales;

  const pautaMaxima = precioVentaFinal * 0.20;
  const roas = cpa > 0 ? precioVentaFinal / cpa : 0;
  const roi = costosTotales > 0 ? (utilidad / costosTotales) * 100 : 0;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("calcxOutPrecioVenta", formatMoneyCalcx(precioVentaFinal, moneda));
  setText("calcxOutUtilidad", formatMoneyCalcx(utilidad, moneda));
  setText("calcxOutMargen", `${margen.toFixed(1)}%`);
  setText("calcxOutBreakEven", formatMoneyCalcx(breakEven, moneda));
  setText("calcxOutCostosTotales", formatMoneyCalcx(costosTotales, moneda));
  setText("calcxOutPrecioMinimo", formatMoneyCalcx(precioMinimo, moneda));
  setText("calcxOutPrecioIdeal", formatMoneyCalcx(precioIdeal, moneda));
  setText("calcxOutPautaMaxima", formatMoneyCalcx(pautaMaxima, moneda));
  setText("calcxOutCPA", formatMoneyCalcx(cpa, moneda));
  setText("calcxOutPerdidaCancelados", formatMoneyCalcx(perdidaCancelados, moneda));
  setText("calcxOutPerdidaDevoluciones", formatMoneyCalcx(perdidaDevoluciones, moneda));
  setText("calcxOutROAS", roas.toFixed(2));
  setText("calcxOutROI", `${roi.toFixed(1)}%`);

  const resumen = document.getElementById("calcxResumen");
  if (resumen) {
    resumen.textContent =
      `Con un valor de venta deseado de ${formatMoneyCalcx(precioVentaFinal, moneda)}, ` +
      `el costo bruto total por venta es ${formatMoneyCalcx(costosTotales, moneda)}. ` +
      `La utilidad proyectada es ${formatMoneyCalcx(utilidad, moneda)} con un margen de ${margen.toFixed(1)}%. ` +
      `El precio ideal para lograr tu margen objetivo sería ${formatMoneyCalcx(precioIdeal, moneda)}.`;
  }

  const principalCard = document.querySelector(".calcx-card.principal");
  if (principalCard) {
    principalCard.classList.toggle("danger", utilidad < 0);
  }
};

function renderTrendDashboard(json) {
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
    const res = await fetch("/api/ia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
     body: JSON.stringify({
  prompt: `




Responde SOLO en JSON válido, sin explicación fuera del JSON.

Actúa como un estratega senior de ecommerce DTC, experto en productos virales, Ads Library y comportamiento de compra.

Analiza esta oportunidad:
"${texto}"

País prioritario: "${pais}"

NO respondas superficial.
Quiero insights accionables, específicos y con lógica de negocio real.

---

1. MERCADO (nivel PRO)
- intención de compra (no genérica, explica el por qué compran)
- países donde realmente escalaría (no obvio)
- audiencias detalladas (edad, mindset, situación)
- búsquedas reales tipo Ads Library (no genéricas)

---

2. MASLOW (psicología profunda de compra)

- nivel dominante (elige uno claro)
- explicación profunda (mínimo 3 líneas)
- deseo oculto real (qué quiere en el fondo)
- trigger de compra (qué lo hace actuar ya)
- pensamiento interno del cliente (como si fuera él hablando)

NO seas superficial.
Esto debe ayudar a crear copies de venta.
---

3. PROBLEMA (deep pain)
- dolor principal real (emocional + físico)
- dolores secundarios (situaciones específicas)
- emociones (miedo, frustración, vergüenza, etc.)

---

4. SOLUCIÓN (transformación)
- transformación real que promete
- beneficios tangibles
- tipo de producto ideal (formato ganador)

---

5. MECANISMO (clave para vender)
- mecanismo principal creíble
- mecanismos alternativos usados en ads
- creencias que hacen que el producto convierta

---

6. MARKETING (nivel creativo)
- ángulos que realmente escalan
- hooks tipo UGC (copy corto realista)
- formato ganador (UGC, testimonial, antes/después, etc.)

---

7. VALIDACIÓN REAL (NUEVO 🔥)
- qué señales buscar en Ads Library
- cómo saber si está saturado o no
- qué indicaría oportunidad escondida

---

8. DECISIÓN (estratégica)
- oportunidad real (no genérica)
- recomendación concreta (qué hacer exactamente)
- riesgos reales de negocio

---
9. SCORE (OBLIGATORIO)
Calcula un score de 0 a 100 con esta lógica:

- +25 si el dolor es frecuente y claro
- +20 si tiene compra impulsiva o urgente
- +15 si el mercado permite hooks visuales fuertes
- +15 si hay varios ángulos de marketing
- +10 si se puede vender en formato simple ecommerce
- +10 si hay posibilidad de repetición o recompra
- -10 si tiene alta complejidad regulatoria
- -10 si requiere demasiada educación para vender
- -15 si está muy saturado sin diferenciación

Reglas del score:
- 80 a 100 = oportunidad fuerte
- 60 a 79 = buena oportunidad testable
- 40 a 59 = oportunidad media
- 0 a 39 = débil

NO pongas scores absurdamente bajos si hay dolor, demanda y ángulos claros.
El score debe ser coherente con la oportunidad y con la decisión final.
---

Reglas:
- máximo 5-6 items por lista
- lenguaje directo (no académico)
- evita frases vacías
- todo debe ser accionable para vender
- oportunidad y recomendación deben tener máximo 2 frases
- riesgos deben ser cortos
- no uses signos como < o >; escribe "menos de 14 días" en vez de "<14 días"
- no uses markdown
- no uses comillas innecesarias
---

Devuelve exactamente este JSON:

{
  "tema_central": "",
  "score": 0,
  "direccion": "subiendo/estable/bajando",
  "senal_general": "fuerte/media/debil",
  "etapa_mercado": "nuevo/creciendo/competido/saturado",
  "estacionalidad": "",

 "maslow": {
  "nivel": "",
  "explicacion": "",
  "deseo_oculto": "",
  "trigger_compra": "",
  "pensamiento_cliente": ""
},

  "mercado": {
    "intencion_busqueda": "",
    "paises_recomendados": [],
    "audiencias": [],
    "busquedas_relacionadas": []
  },

  "problema": {
    "dolor_principal": "",
    "dolores_relacionados": [],
    "emociones": []
  },

  "solucion": {
    "solucion_principal": "",
    "beneficios_relacionados": [],
    "productos_relacionados": []
  },

  "mecanismo": {
    "mecanismo_principal": "",
    "mecanismos_secundarios": [],
    "creencias_venta": []
  },

  "marketing": {
    "angulos_marketing": [],
    "formato_ganador": "",
    "hooks": []
  },

  "validacion": {
    "senales_ads": [],
    "indicadores_saturacion": [],
    "oportunidad_oculta": []
  },

  "decision": {
    "oportunidad": "",
    "recomendacion": "",
    "riesgos": []
  }
}
`

})
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
    const res = await fetch("/api/ia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: `
Responde SOLO en JSON válido.

Actúa como estratega de ecommerce y psicología del consumidor.

Genera una lista de palabras clave tipo problema, basadas en la pirámide de Maslow.
Quiero ideas amplias, no una sola categoría.
Deben ser problemas reales que la gente buscaría o compraría para resolver.

País prioritario: "${pais}"

Devuelve EXACTAMENTE este JSON:
{
  "keywords": []
}

Reglas:
- devuelve entre 20 y 30 keywords
- NO repitas ejemplos genéricos
- NO copies siempre las mismas palabras
- mezcla problemas físicos, emocionales, estéticos, energéticos, sueño, dolor, seguridad, autoestima y atracción
- deben ser búsquedas que una persona sí escribiría
- frases cortas, directas y vendibles
- evita categorías; quiero keywords concretas
- devuelve solo el JSON
`
      })
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



window.toggleDescubrimientoMenu = function() {
  const sidebar = document.querySelector("aside");
  if (sidebar.classList.contains("collapsed")) {
    toggleSidebar();
    setTimeout(() => toggleDescubrimientoMenu(), 50);
    return;
  }

  const menu = document.getElementById("descubrimiento-submenu");
  const arrow = document.getElementById("descubrimiento-arrow");

  menu.classList.toggle("open");

  if (menu.classList.contains("open")) {
    arrow.setAttribute("data-lucide", "chevron-down");
  } else {
    arrow.setAttribute("data-lucide", "chevron-right");
  }

  lucide.createIcons();
};

window.toggleValidacionMenu = function() {
  const sidebar = document.querySelector("aside");
  if (sidebar.classList.contains("collapsed")) {
    toggleSidebar();
    setTimeout(() => toggleValidacionMenu(), 50);
    return;
  }

  const menu = document.getElementById("validacion-submenu");
  const arrow = document.getElementById("validacion-arrow");

  menu.classList.toggle("open");

  if (menu.classList.contains("open")) {
    arrow.setAttribute("data-lucide", "chevron-down");
  } else {
    arrow.setAttribute("data-lucide", "chevron-right");
  }

  lucide.createIcons();
};
window.irDesarrollo = function(index) {
  state.productoActivo = state.productos[index];
  goTo("desarrollo");
};

window.cargarProductos = async function() {
  try {
    let url = "/api/productos";

    if (window.productoPaisActivo) {
      url += `?pais=${window.productoPaisActivo}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    state.productos = data;
    console.log("Productos desde Mongo:", data);
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
};

window.cambiarEstado = async function(id, nuevoEstado) {
  try {
    const res = await fetch(`/api/productos/${id}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Error actualizando estado");
      console.error(data);
      return;
    }

    await cargarProductos();
    renderTablaProductos();
  } catch (err) {
    console.error("Error cambiando estado:", err);
    alert("No se pudo actualizar el estado");
  }
};

window.editarProducto = function(id) {
  const producto = state.productos.find(p => p._id === id);
  if (!producto) return;

  document.getElementById("nombre").value = producto.nombre || "";
  document.getElementById("origen").value = producto.origen || "dropi";
  document.getElementById("dropiId").value = producto.dropiId || "";
  document.getElementById("material").value = producto.material || "";
  document.getElementById("landing").value = producto.landing || "";
  document.getElementById("creativos").value = producto.creativos || "";

  window.productoEditandoId = id;
  toggleCampoDropi();
};

let productoAEliminar = null;

window.eliminarProducto = function(id) {
  productoAEliminar = id;

  const modal = document.getElementById("modalConfirm");
  if (!modal) {
    console.error("No existe #modalConfirm en el HTML");
    return;
  }

  modal.classList.remove("hidden");
};

async function confirmarEliminacion() {
  if (!productoAEliminar) return;

  try {
    const res = await fetch(`/api/productos/${productoAEliminar}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Error eliminando producto");
      console.error(data);
      return;
    }

    await cargarProductos();
    renderTablaProductos();
  } catch (err) {
    console.error("Error eliminando producto:", err);
    alert("No se pudo eliminar");
  } finally {
    productoAEliminar = null;
    const modal = document.getElementById("modalConfirm");
    if (modal) {
      modal.classList.add("hidden");
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const btnCancelar = document.getElementById("btnCancelar");
  const btnAceptar = document.getElementById("btnAceptar");
  const modal = document.getElementById("modalConfirm");

  if (btnCancelar) {
    btnCancelar.onclick = () => {
      productoAEliminar = null;
      modal?.classList.add("hidden");
    };
  }

  if (btnAceptar) {
    btnAceptar.onclick = () => {
      confirmarEliminacion();
    };
  }

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) {
        productoAEliminar = null;
        modal.classList.add("hidden");
      }
    };
  }
});

