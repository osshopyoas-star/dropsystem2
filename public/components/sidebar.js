// =============================================
// Menú lateral (estilo panel futurista). Los estilos están al final de css/styles.css ("MENÚ LATERAL v2").
// data-label = el nombre que sale flotando cuando el menú está cerrado.
// =============================================
const item = (ruta, icono, texto, accion = `goTo('${ruta}')`) => `
  <div class="sidebar-item" ${ruta ? `data-route="${ruta}"` : ""} data-label="${texto}" onclick="${accion}">
    <div class="sb-ico"><i data-lucide="${icono}"></i></div>
    <span class="sb-txt">${texto}</span>
  </div>`;

const grupo = (id, icono, texto, accion, hijos) => `
  <div class="sidebar-item sb-padre" id="${id}-padre" data-label="${texto}" onclick="${accion}">
    <div class="sb-ico"><i data-lucide="${icono}"></i></div>
    <span class="sb-txt">${texto}</span>
    <i id="${id}-arrow" class="sb-flecha" data-lucide="chevron-right"></i>
  </div>
  <div id="${id}-submenu" class="submenu">${hijos}</div>`;

const seccion = (texto) => `<div class="sb-seccion"><span>${texto}</span></div>`;

export function renderSidebar() {
  document.getElementById("sidebar").innerHTML = `
    <div class="sb-fondo" aria-hidden="true"></div>

    <div class="sb-cabeza">
      <div class="logo-full"><img src="assets/logo.png" alt="CoDropX" /></div>
      <div class="logo-icon"><img src="assets/favicon.png" alt="CoDropX" /></div>
    </div>

    <div class="toggle-btn" onclick="toggleSidebar()" title="Abrir o cerrar el menú">
      <i data-lucide="chevron-left"></i>
    </div>

    <div class="sidebar-container">
      ${seccion("General")}
      ${item("inicio", "layout-dashboard", "Inicio")}
      ${grupo("descubrimiento", "compass", "Descubrimiento", "toggleDescubrimientoMenu()", `
        ${item("tendencias", "trending-up", "Tendencias")}
        ${item("busqueda", "search", "Buscar productos")}`)}

      ${seccion("Productos")}
      ${grupo("productos", "package", "Base de Productos", "toggleProductosMenu()", `
        ${item("productos-co", "flag", "Colombia", "setProductoPais('CO')")}
        ${item("productos-ec", "map", "Ecuador", "setProductoPais('EC')")}`)}
      ${item("testeos", "flask-conical", "Mis testeos")}

      ${seccion("Crear")}
      ${item("desarrollo", "sparkles", "Desarrollo")}
      ${item("plantilla", "layout-template", "Mi plantilla")}

      ${seccion("Finanzas")}
      ${grupo("finanzas", "wallet", "Finanzas", "toggleFinanzasMenu()", `
        ${item("control-diario", "calendar-check", "Control Diario")}
        ${item("reporte-financiero", "bar-chart-3", "Reporte Financiero")}
        ${item("logistica", "truck", "Logística")}`)}
      ${item("calculadora", "calculator", "Calculadora")}

      ${seccion("Herramientas")}
      ${item("integraciones", "plug", "Integraciones")}

      <div class="sb-pie">
        <div class="sidebar-item sidebar-logout" data-label="Cerrar sesión" onclick="cerrarSesion()">
          <div class="sb-ico"><i data-lucide="log-out"></i></div>
          <span class="sb-txt">Cerrar sesión</span>
        </div>
      </div>
    </div>
  `;

  // Botón ☰ y fondo oscuro para el menú en celular
  if (!document.querySelector(".menu-movil")) {
    const boton = document.createElement("button");
    boton.className = "menu-movil";
    boton.setAttribute("aria-label", "Abrir menú");
    boton.textContent = "☰";
    boton.onclick = () => document.body.classList.toggle("menu-abierto");

    const fondo = document.createElement("div");
    fondo.className = "menu-fondo";
    fondo.onclick = () => document.body.classList.remove("menu-abierto");

    document.body.append(boton, fondo);
  }

  if (window.lucide) lucide.createIcons();
}
