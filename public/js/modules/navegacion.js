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

window.goTo = function(route) {
  const view = document.getElementById("view");
  const render = rutas[route];

  if (!render) {
    console.warn("Ruta no encontrada:", route);
    return;
  }

  document.body.classList.remove("menu-abierto");   // en celular, cerrar el menú al navegar
  render(view);
  window.scrollTo?.(0, 0);
};

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


