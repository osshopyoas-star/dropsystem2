// Imágenes de anuncios ganadores (docs/referencias/anuncios/E1…E18): guía de composición, nunca de marca ni producto
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { RECETAS_AD } from "./public/js/core/anuncios.js";

const BASE = path.join(path.dirname(fileURLToPath(import.meta.url)), "docs", "referencias", "anuncios");
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
export const AVISO_REF_AD = "Imita SOLO la composición y el nivel de diseño de esta referencia. No copies su producto, su marca, sus textos, sus colores, sus personas ni sus precios.";

export function archivosRefAd(estructura) {
  const r = RECETAS_AD[estructura];
  if (!r?.carpeta) return [];
  try {
    return fs.readdirSync(path.join(BASE, r.carpeta)).filter(f => MIME[path.extname(f).toLowerCase()] && !/SOLO-DISENO/i.test(f)).sort();
  } catch { return []; }
}
// Una referencia por versión (rota entre las de esa estructura)
export function refAd(estructura, n = 0) {
  const lista = archivosRefAd(estructura);
  if (!lista.length) return null;
  const f = lista[Math.abs(n) % lista.length];
  const r = RECETAS_AD[estructura];
  const datos = fs.readFileSync(path.join(BASE, r.carpeta, f));
  return { archivo: f, mime: MIME[path.extname(f).toLowerCase()], datos, dataUrl: `data:${MIME[path.extname(f).toLowerCase()]};base64,${datos.toString("base64")}` };
}
