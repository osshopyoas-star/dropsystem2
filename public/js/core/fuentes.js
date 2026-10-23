// =============================================
// 🔤 TIPOGRAFÍAS SIN NOMBRE — las IA de imágenes escriben el nombre de la fuente
// ("Bebas Neue") como si fuera un texto del diseño. Aquí cambiamos los nombres
// por una descripción de cómo se ve la letra.
// La usan el servidor (prompts) y el navegador (botones de copiar).
// =============================================
const FUENTES = [
  [/bebas(\s*neue)?/gi, "letra condensada alta en mayúsculas, estilo póster"],
  [/anton|oswald|league\s*gothic|fjalla(\s*one)?/gi, "letra condensada gruesa en mayúsculas"],
  [/impact/gi, "letra condensada muy gruesa"],
  [/montserrat|poppins|gotham|avenir|futura|nunito|raleway|proxima\s*nova/gi, "letra sans geométrica gruesa"],
  [/roboto|inter|arial|helvetica(\s*neue)?|open\s*sans|lato|source\s*sans(\s*pro)?/gi, "letra sans limpia"],
  [/playfair(\s*display)?|didot|bodoni|garamond|georgia|times(\s*new\s*roman)?|merriweather|lora/gi, "letra serif elegante"],
  [/lobster|pacifico|dancing\s*script|great\s*vibes|brush\s*script/gi, "letra cursiva de brocha"],
  [/permanent\s*marker|bangers/gi, "letra de marcador a mano"]
];

export function limpiarFuentes(texto) {
  let s = String(texto || "");
  for (const [re, desc] of FUENTES) s = s.replace(re, desc);
  // "tipografía letra ... (letra ...)" repetido o restos como "fuente X"
  return s.replace(/\b(letra [a-záéíóúñ ,]+?)\s*\(\s*\1\s*\)/gi, "$1");
}
