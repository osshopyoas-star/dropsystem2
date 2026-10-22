// =============================================
// CoDropX — punto de entrada
// Cada parte de la app vive en su propio archivo:
//   core/       sesión y utilidades compartidas
//   data/       datos fijos (palabras clave)
//   modules/    una pantalla o función por archivo
// =============================================
import "./core/sesion.js";
import "./modules/navegacion.js";
import "./modules/validacion.js";
import "./modules/tendencias.js";
import "./modules/productos.js";
import "./modules/desarrollo.js";
import "./modules/calculadora.js";
import "./modules/plantilla.js";

import { renderSidebar } from "../components/sidebar.js";
import { initModalEliminar } from "./modules/productos.js";

window.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
  goTo("inicio");
  marcarMenuActivo("inicio");
  initModalEliminar();

  setTimeout(() => {
    if (window.lucide) lucide.createIcons();
  }, 100);
});

setTimeout(() => {
  if (window.lucide) lucide.createIcons();
}, 500);
