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
import "./modules/integraciones.js";
import "./modules/testeos.js";
import "./modules/finanzas.js";
import "./modules/inicio.js";

import { renderSidebar } from "../components/sidebar.js";
import { initModalEliminar } from "./modules/productos.js";

window.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
  // Al volver de conectar Meta, abrir Integraciones con el resultado
  const meta = new URLSearchParams(location.search).get("meta");
  if (meta) {
    history.replaceState(null, "", location.pathname);
    window.__metaResultado = meta;
    goTo("integraciones");
  } else {
    // Volver a donde estabas: la pantalla de la dirección o la que tenías antes de que se venciera la sesión
    let volver = location.hash;
    try { if (!volver) volver = sessionStorage.getItem("codropx_volver") || ""; sessionStorage.removeItem("codropx_volver"); } catch {}
    if (!abrirDesdeUrl(volver)) {
      history.replaceState(null, "", location.pathname + location.search + "#inicio");
      goTo("inicio", { desdeHistorial: true });
      marcarMenuActivo("inicio");
    } else if (volver !== location.hash) history.replaceState(null, "", volver);
  }
  initModalEliminar();

  setTimeout(() => {
    if (window.lucide) lucide.createIcons();
  }, 100);
});

setTimeout(() => {
  if (window.lucide) lucide.createIcons();
}, 500);
