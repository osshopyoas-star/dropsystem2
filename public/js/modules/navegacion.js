// =============================================
// Navegación: router, menú lateral y página de inicio
// =============================================

// ---------- Router ----------
// Cada módulo registra sus pantallas con registrarRuta("nombre", (view) => {...}).
// Para agregar una pantalla nueva no hay que tocar este archivo.
const rutas = {};

export function registrarRuta(nombre, render) {
  rutas[nombre] = render;
}

// La pantalla actual queda en la dirección (#calculadora, #productos-co…) para que, si el navegador
// recarga la página (pestaña dormida, F5, sesión vencida), vuelvas a la misma pantalla y no a Inicio.
const nombreEnUrl = (route) => route === "productos" ? `productos-${(window.productoPaisActivo || "CO").toLowerCase()}` : route;

window.goTo = function(route, { desdeHistorial = false } = {}) {
  const view = document.getElementById("view");
  const render = rutas[route];

  if (!render) {
    console.warn("Ruta no encontrada:", route);
    return;
  }

  document.body.classList.remove("menu-abierto");   // en celular, cerrar el menú al navegar
  // Cada vez que cambias de pantalla se pone un "lienzo" nuevo. Si la pantalla anterior seguía cargando
  // (servidor lento), cuando por fin le llegan los datos pinta en el lienzo viejo, que ya no se ve,
  // y no encima de la pantalla que abriste.
  window.rutaActual = route;
  const nuevo = view.cloneNode(false);
  view.replaceWith(nuevo);
  if (!desdeHistorial) {
    const hash = "#" + nombreEnUrl(route);
    if (location.hash !== hash) history.pushState(null, "", hash);
  }
  render(nuevo);
  window.scrollTo?.(0, 0);
};

// ¿Sigues en esta pantalla? Lo usan las pantallas que se vuelven a pintar después de esperar al servidor.
window.enPantalla = (ruta) => !window.rutaActual || window.rutaActual === ruta;

// Abre la pantalla que dice la dirección. Devuelve false si no hay ninguna válida.
window.abrirDesdeUrl = function(hash = location.hash) {
  const h = decodeURIComponent(String(hash || "").replace(/^#/, ""));
  if (h === "productos-co" || h === "productos-ec") {
    window.productoPaisActivo = h === "productos-ec" ? "EC" : "CO";
    goTo("productos", { desdeHistorial: true });
    marcarMenuActivo(h);
    return true;
  }
  if (!h || !rutas[h]) return false;
  goTo(h, { desdeHistorial: true });
  marcarMenuActivo(h);
  return true;
};

// Botón "atrás" del navegador o del celular: vuelve a la pantalla anterior de CoDropX
window.addEventListener("popstate", () => {
  if (!abrirDesdeUrl()) { goTo("inicio", { desdeHistorial: true }); marcarMenuActivo("inicio"); }
});

window.marcarMenuActivo = function(route) {
  document.querySelectorAll(".sidebar-item").forEach(i => {
    i.classList.remove("active");
  });

  const item = document.querySelector(`[data-route="${route}"]`);
  if (item) item.classList.add("active");
};

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

// La pantalla de inicio (tablero) vive en modules/inicio.js


