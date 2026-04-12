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
window.renderKeywords = function() {
  const tipo = document.getElementById("tipo").value;
  const idioma = getIdioma(paisActivo);

  const lista = keywordsDB[idioma][tipo] || keywordsDB["EN"][tipo] || [];

  const contenedor = document.getElementById("keywords");

  contenedor.innerHTML = lista.map(k => `
    <button class="keyword-btn" onclick="buscar('${k}')">
      ${k}
    </button>
  `).join("");
};

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
  if (route === "inicio") {
   view.innerHTML = `
  <h1>🏠 Inicio</h1>
  <p>Bienvenido a CoDropX. Desde aquí puedes descubrir oportunidades, validarlas, guardar productos y desarrollar ángulos.</p>

  <div class="grid-3">
    <div class="panel">
      <h3>Descubrimiento</h3>
      <p>Explora tendencias, nichos y oportunidades de mercado.</p>
    </div>

    <div class="panel">
      <h3>Validación</h3>
      <p>Confirma demanda con Ads Library, tiendas, Dropi y proveedores.</p>
    </div>

    <div class="panel">
      <h3>Base de Productos</h3>
      <p>Organiza productos validados para Colombia y Ecuador.</p>
    </div>

    <div class="panel">
      <h3>Desarrollo</h3>
      <p>Trabaja avatar, ángulos, prompts, creativos y landing.</p>
    </div>
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

    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 0);

    return;
  }

  if (route === "nichos") {
    view.innerHTML = `
      <h1>🧠 Nichos</h1>
      <p>Aquí clasificaremos problemas, audiencias y oportunidades</p>
    `;
    marcarMenuActivo("nichos");

    setTimeout(() => {
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

window.toggleDesarrolloMenu = function() {
  const sidebar = document.querySelector("aside");
  if (sidebar.classList.contains("collapsed")) {
    toggleSidebar();
    setTimeout(() => toggleDesarrolloMenu(), 50);
    return;
  }

  const menu = document.getElementById("desarrollo-submenu");
  const arrow = document.getElementById("desarrollo-arrow");

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
// =============================
// RENDER TABLA
function renderTablaProductos() {
  const tabla = document.getElementById("tabla-productos");
  if (!tabla) return;

tabla.innerHTML = state.productos.map((p, i) => `
  <div class="fila-producto">

   <div class="texto-celda">${p.nombre}</div>

<div class="texto-celda">
  ${
    p.origen === "dropi"
      ? `Dropi: ${p.dropiId || "sin id"}`
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
  window.open(url, "_blank");
};

window.abrirCreativos = function(url) {
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
  const q = document.getElementById("productoInput").value;

  if (!q) return alert("Escribe producto");

  if (tipo === "dropi") {
    window.open("https://app.dropi.co/dashboard/search", "_blank");
  }

  if (tipo === "aliexpress") {
    window.open(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}`, "_blank");
  }

  if (tipo === "alibaba") {
    window.open(`https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}`, "_blank");
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

      <div class="tendencias-hero">
        <div class="tendencias-title-wrap">
          <div class="tendencias-title-icon">
            <i data-lucide="line-chart"></i>
          </div>

          <div>
            <h1 class="tendencias-title">Tendencias</h1>
            <p class="tendencias-subtitle">
              Analiza un tema como mapa de oportunidad, no solo como keyword.
            </p>
          </div>
        </div>

        <div class="tendencias-form tendencias-form-3">
          <input id="trendInput" placeholder="Ej: baja energía masculina" />

          <select id="trendPais">
            <option value="ALL">Todos</option>
            <option value="CO">Colombia</option>
            <option value="MX">México</option>
            <option value="EC">Ecuador</option>
            <option value="US">USA</option>
            <option value="ES">España</option>
          </select>

          <select id="trendMode">
            <option value="cluster">Mapa de oportunidad</option>
            <option value="pain">Mapa de dolor</option>
            <option value="product">Mapa de producto</option>
            <option value="angle">Mapa de ángulos</option>
          </select>

          <button class="primary" onclick="analizarTendencia()">
            <i data-lucide="sparkles"></i>
            Analizar
          </button>
        </div>
      </div>

      <div id="trendResult" class="trend-result-empty">
        Escribe un tema para empezar.
      </div>

    </div>
  `;
}

window.analizarTendencia = async function() {
  const texto = document.getElementById("trendInput").value;
  const pais = document.getElementById("trendPais")?.value || "ALL";
const modo = document.getElementById("trendMode")?.value || "cluster";

  if (!texto) return alert("Escribe algo");

  document.getElementById("trendResult").innerHTML = `
  <div class="trend-result-empty">Analizando tendencia...</div>
`;

  try {
    const res = await fetch("/api/ia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
     body: JSON.stringify({
  prompt: `
Responde SOLO en JSON válido, sin explicación extra.

Analiza esta oportunidad de mercado: "${texto}"

País prioritario: "${pais}"
Modo de análisis: "${modo}"

No respondas como si fuera solo una keyword exacta.
Analízalo como un CLUSTER o MAPA de oportunidad:
- intención de búsqueda
- problemas relacionados
- beneficios buscados
- productos relacionados
- audiencias
- países donde puede funcionar
- señales de crecimiento o saturación
- ángulos de marketing
- riesgo de estacionalidad

Devuelve exactamente este JSON:

{
  "tema_central": "",
  "intencion_busqueda": "",
  "etapa_mercado": "nuevo/creciendo/competido/saturado",
  "senal_general": "fuerte/media/debil",
  "direccion": "subiendo/estable/bajando",
  "estacionalidad": "",
  "paises_recomendados": [],
  "audiencias": [],
  "dolores_relacionados": [],
  "beneficios_relacionados": [],
  "busquedas_relacionadas": [],
  "productos_relacionados": [],
  "angulos_marketing": [],
  "formato_ganador": "",
  "riesgos": [],
  "oportunidad": "",
  "recomendacion": "",
  "score": 0
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

const data = JSON.parse(raw);

    try {
      let respuesta = data.reply.trim();

      const inicio = respuesta.indexOf("{");
      const fin = respuesta.lastIndexOf("}");

      if (inicio !== -1 && fin !== -1) {
        respuesta = respuesta.substring(inicio, fin + 1);
      }

      const json = JSON.parse(respuesta);
      state.trendMap = json;
state.ideaActual = texto;
state.nichoActual = json.tema_central || "";
state.tendenciaActual = json.direccion || "";

    document.getElementById("trendResult").innerHTML = `
  <div class="trend-result-card">
    <div class="trend-result-head">
      <h2>🧠 Mapa de Oportunidad</h2>
      <div class="trend-score">Score: ${json.score}</div>
    </div>

    <div class="trend-grid">
      <div class="trend-box">
        <h3>📌 Resumen</h3>
        <p><strong>Tema:</strong> ${json.tema_central}</p>
        <p><strong>Intención:</strong> ${json.intencion_busqueda}</p>
        <p><strong>Etapa:</strong> ${json.etapa_mercado}</p>
        <p><strong>Señal:</strong> ${json.senal_general}</p>
        <p><strong>Dirección:</strong> ${json.direccion}</p>
        <p><strong>Estacionalidad:</strong> ${json.estacionalidad}</p>
      </div>

      <div class="trend-box">
        <h3>🌍 Mercado</h3>
        <p><strong>Países recomendados:</strong></p>
        <ul>${(json.paises_recomendados || []).map(x => `<li>${x}</li>`).join("")}</ul>

        <p><strong>Audiencias:</strong></p>
        <ul>${(json.audiencias || []).map(x => `<li>${x}</li>`).join("")}</ul>
      </div>

      <div class="trend-box">
        <h3>💥 Dolores y beneficios</h3>
        <p><strong>Dolores:</strong></p>
        <ul>${(json.dolores_relacionados || []).map(x => `<li>${x}</li>`).join("")}</ul>

        <p><strong>Beneficios:</strong></p>
        <ul>${(json.beneficios_relacionados || []).map(x => `<li>${x}</li>`).join("")}</ul>
      </div>

      <div class="trend-box">
        <h3>🔎 Cluster de búsqueda</h3>
        <p><strong>Búsquedas relacionadas:</strong></p>
        <ul>${(json.busquedas_relacionadas || []).map(x => `<li>${x}</li>`).join("")}</ul>
      </div>

      <div class="trend-box">
        <h3>📦 Productos y ángulos</h3>
        <p><strong>Productos relacionados:</strong></p>
        <ul>${(json.productos_relacionados || []).map(x => `<li>${x}</li>`).join("")}</ul>

        <p><strong>Ángulos:</strong></p>
        <ul>${(json.angulos_marketing || []).map(x => `<li>${x}</li>`).join("")}</ul>

        <p><strong>Formato ganador:</strong> ${json.formato_ganador}</p>
      </div>

      <div class="trend-box trend-box--highlight">
        <h3>🚀 Decisión</h3>
        <p><strong>Oportunidad:</strong> ${json.oportunidad}</p>
        <p><strong>Recomendación:</strong> ${json.recomendacion}</p>

        <p><strong>Riesgos:</strong></p>
        <ul>${(json.riesgos || []).map(x => `<li>${x}</li>`).join("")}</ul>
      </div>
    </div>
  </div>
`;
    } catch (e) {
      console.error("ERROR PARSE:", e);
      document.getElementById("trendResult").innerText = data.reply || "Respuesta inválida";
    }

  } catch (err) {
    console.error("ERROR API:", err);
    document.getElementById("trendResult").innerText = "Error en API";
  }
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