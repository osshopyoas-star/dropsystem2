// =============================================
// 🔎 ANÁLISIS DEL PRODUCTO — 19 criterios en 3 grupos + recursos guardados
// Lo usan el servidor (limpiar lo que llega) y el navegador (Base de Productos).
// Cada criterio se marca sí / no / sin responder. Todos están escritos para que "sí" sea bueno.
// =============================================

export const GRUPOS_ANALISIS = [
  {
    id: "producto", nombre: "Producto y comunicación", criterios: [
      ["misma_comunicacion", "Puedo comunicarlo igual o mejor que quien ya lo vende"],
      ["creativos_otro_idioma", "Hay creativos en otro idioma que no se han usado en mi mercado"],
      ["stock", "El proveedor tiene stock suficiente"],
      ["variacion", "Tiene una variación que se puede vender (color, tamaño, pack)"],
      ["sin_saturar", "Mi mercado NO está lleno de competidores con este producto"]
    ]
  },
  {
    id: "competencia", nombre: "Competencia", criterios: [
      ["no_se_vende", "NO lo están vendiendo fuerte en mi país"],
      ["pocos_proveedores", "Lo tienen 3 proveedores o menos"],
      ["competir_precio", "Puedo competir en precio"],
      ["creativo_no_usado", "Mi creativo NO lo está usando nadie en mi mercado"],
      ["creativo_nuevo", "Mi creativo NUNCA se ha usado"]
    ]
  },
  {
    id: "tecnico", nombre: "Técnico", criterios: [
      ["problema_real", "Resuelve un problema real"],
      ["valor_percibido", "Tiene alta percepción de valor"],
      ["efecto_wow", "Tiene efecto wow"],
      ["no_marketplaces", "NO está en los marketplaces del país (Mercado Libre, Falabella…)"],
      ["recompra", "Genera recompra"],
      ["ticket_bajo", "Es de ticket bajo (compra por impulso)"],
      ["anuncio_cautivador", "Se puede hacer un anuncio que atrape"],
      ["oferta_limpia", "La oferta NO es black (Meta no la rechaza)"],
      ["facil_importar", "Es fácil de importar o fabricar"]
    ]
  }
];

export const TOTAL_CRITERIOS = GRUPOS_ANALISIS.reduce((s, g) => s + g.criterios.length, 0);   // 19
const CLAVES = new Set(GRUPOS_ANALISIS.flatMap(g => g.criterios.map(c => c[0])));

export const TIPOS_RECURSO = {
  anuncio: "Anuncio",
  tiktok: "Video TikTok",
  proveedor: "Proveedor",
  competencia: "Competencia",
  otro: "Otro"
};
export const MAX_RECURSOS = 30;

// Puntaje 0-100: en cada grupo, sí / total del grupo; luego el promedio de los 3 grupos.
// null si no ha respondido nada.
export function puntaje(analisis) {
  const r = analisis?.respuestas || {};
  const respondidas = Object.keys(r).filter(k => CLAVES.has(k) && (r[k] === "si" || r[k] === "no")).length;
  if (!respondidas) return null;
  const grupos = GRUPOS_ANALISIS.map(g => g.criterios.filter(([k]) => r[k] === "si").length / g.criterios.length);
  return Math.round(grupos.reduce((s, x) => s + x, 0) / grupos.length * 100);
}

export function porGrupo(analisis) {
  const r = analisis?.respuestas || {};
  return GRUPOS_ANALISIS.map(g => ({
    id: g.id, nombre: g.nombre, total: g.criterios.length,
    si: g.criterios.filter(([k]) => r[k] === "si").length,
    no: g.criterios.filter(([k]) => r[k] === "no").length
  }));
}

export function veredicto(p) {
  if (p == null) return null;
  if (p >= 70) return { clave: "prometedor", texto: "Prometedor" };
  if (p >= 40) return { clave: "reservas", texto: "Con reservas" };
  return { clave: "arriesgado", texto: "Arriesgado" };
}

export function limpiarAnalisis(a) {
  if (!a || typeof a !== "object") return { respuestas: {}, nota: "" };
  const respuestas = {};
  for (const [k, v] of Object.entries(a.respuestas || {})) {
    if (CLAVES.has(k) && (v === "si" || v === "no")) respuestas[k] = v;
  }
  return { respuestas, nota: String(a.nota || "").slice(0, 2000) };
}

function urlValida(u) {
  let s = String(u || "").trim();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const x = new URL(s);
    return /^https?:$/.test(x.protocol) && x.hostname.includes(".") ? x.href.slice(0, 1000) : "";
  } catch { return ""; }
}

export function limpiarRecursos(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.slice(0, MAX_RECURSOS).map(x => ({
    tipo: TIPOS_RECURSO[x?.tipo] ? x.tipo : "otro",
    url: urlValida(x?.url),
    nombre: String(x?.nombre || "").trim().slice(0, 120)
  })).filter(x => x.url);
}
