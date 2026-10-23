// =============================================
// 🔤 TEXTO QUE LA IA DE IMÁGENES NO DEBE ESCRIBIR
// Las IA de imágenes escriben como si fuera parte del diseño:
//   · el nombre de la fuente ("Bebas Neue")  → lo cambiamos por cómo se ve la letra
//   · los códigos de color ("#111111")        → los cambiamos por el nombre del color
// Ojo: solo palabras completas ("Inter" sí, "interruptor" no; "Impact" sí, "IMPACTO" no).
// La usan el servidor (prompts) y el navegador (botones de copiar).
// =============================================
const L = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";
const palabra = (patron) => new RegExp(`(?<![${L}])(?:${patron})(?![${L}])`, "gi");

const FUENTES = [
  [palabra("bebas(?:\\s*neue)?"), "letra condensada alta en mayúsculas, estilo póster"],
  [palabra("anton|oswald|league\\s*gothic|fjalla(?:\\s*one)?"), "letra condensada gruesa en mayúsculas"],
  [palabra("impact"), "letra condensada muy gruesa"],
  [palabra("montserrat|poppins|gotham|avenir|futura|nunito|raleway|proxima\\s*nova"), "letra sans geométrica gruesa"],
  [palabra("roboto|inter|arial|helvetica(?:\\s*neue)?|open\\s*sans|lato|source\\s*sans(?:\\s*pro)?"), "letra sans limpia"],
  [palabra("playfair(?:\\s*display)?|didot|bodoni|garamond|georgia|times(?:\\s*new\\s*roman)?|merriweather|lora"), "letra serif elegante"],
  [palabra("lobster|pacifico|dancing\\s*script|great\\s*vibes|brush\\s*script"), "letra cursiva de brocha"],
  [palabra("permanent\\s*marker|bangers"), "letra de marcador a mano"]
];

// #RRGGBB / #RGB → nombre del color en español
export function nombreColor(hex) {
  let h = String(hex || "").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return String(hex || "");
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (d) {
    if (max === r) hue = 60 * (((g - b) / d) % 6);
    else if (max === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
  }
  if (hue < 0) hue += 360;
  if (l < 0.1) return "negro";
  if (l > 0.94) return "blanco";
  if (s < 0.12) return l < 0.35 ? "gris oscuro" : l > 0.7 ? "gris claro" : "gris";
  const base = hue < 15 || hue >= 345 ? "rojo" : hue < 40 ? "naranja" : hue < 65 ? "amarillo" : hue < 90 ? "verde lima"
    : hue < 160 ? "verde" : hue < 200 ? "cian" : hue < 250 ? "azul" : hue < 290 ? "morado" : hue < 330 ? "fucsia" : "rosado";
  if (l < 0.3) return `${base} oscuro`;
  if (l > 0.75) return `${base} claro`;
  if (s > 0.7 && l >= 0.4 && l <= 0.6) return `${base} intenso`;
  return base;
}

export function limpiarFuentes(texto) {
  let s = String(texto || "");
  for (const [re, desc] of FUENTES) s = s.replace(re, desc);
  // Códigos de color → nombre (la IA los escribía arriba de la imagen)
  s = s.replace(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z])/g, (m) => nombreColor(m));
  return s.replace(/(?<![A-Za-zÁÉÍÓÚÑáéíóúñ])(letra [a-záéíóúñ ,]+?)\s*\(\s*\1\s*\)/gi, "$1");
}
