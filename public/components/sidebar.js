export function renderSidebar() {
  document.getElementById("sidebar").innerHTML = `
    
   <div class="logo-full">
  <img src="assets/logo.png" />
</div>

<div class="logo-icon">
  <img src="assets/favicon.png" />
</div>

      <div class="toggle-btn" onclick="toggleSidebar()">
        <i data-lucide="chevron-left"></i>
      </div>
    

    <div class="sidebar-container">
   <div class="sidebar-item" data-route="inicio" onclick="goTo('inicio')">
  <i data-lucide="home"></i>
  <span>Inicio</span>
</div>

<div class="sidebar-item sidebar-item-desc" onclick="toggleDescubrimientoMenu()">
  <i data-lucide="compass"></i>
  <span>Descubrimiento</span>
  <i id="descubrimiento-arrow" data-lucide="chevron-right" style="margin-left:auto;"></i>
</div>

<div id="descubrimiento-submenu" class="submenu">
  <div class="sidebar-item" data-route="tendencias" onclick="goTo('tendencias')">
    <i data-lucide="trending-up"></i>
    <span>Tendencias</span>
  </div>

<div class="sidebar-item" data-route="busqueda" onclick="goTo('busqueda')">
   <i data-lucide="check-circle"></i>
    <span>Buscar productos</span>
  </div>

</div>

     <div class="sidebar-item" onclick="toggleProductosMenu()">
  <i data-lucide="package"></i>
  <span>Base de Productos</span>

  <i id="productos-arrow" data-lucide="chevron-right" style="margin-left:auto;"></i>
</div>

<div id="productos-submenu" class="submenu">
<div class="sidebar-item" data-route="productos-co" onclick="setProductoPais('CO')">
  <i data-lucide="flag"></i>
  <span>Colombia</span>
</div>

<div class="sidebar-item" data-route="productos-ec" onclick="setProductoPais('EC')">
  <i data-lucide="map"></i>
  <span>Ecuador</span>
</div>

</div>

<div class="sidebar-item" data-route="testeos" onclick="goTo('testeos')">
  <i data-lucide="flask-conical"></i>
  <span>Mis testeos</span>
</div>

<div class="sidebar-item" data-route="desarrollo" onclick="goTo('desarrollo')">
  <i data-lucide="brain"></i>
  <span>Desarrollo</span>
</div>

<div class="sidebar-item" data-route="plantilla" onclick="goTo('plantilla')">
  <i data-lucide="layout-template"></i>
  <span>Mi plantilla</span>
</div>

<div class="sidebar-item" onclick="toggleFinanzasMenu()">
  <i data-lucide="wallet"></i>
  <span>Finanzas</span>
  <i id="finanzas-arrow" data-lucide="chevron-right" style="margin-left:auto;"></i>
</div>

<div id="finanzas-submenu" class="submenu">
<div class="sidebar-item" data-route="control-diario" onclick="goTo('control-diario')">
  <i data-lucide="calendar-check"></i>
  <span>Control Diario</span>
</div>
<div class="sidebar-item" data-route="reporte-financiero" onclick="goTo('reporte-financiero')">
  <i data-lucide="bar-chart-3"></i>
  <span>Reporte Financiero</span>
</div>
<div class="sidebar-item" data-route="logistica" onclick="goTo('logistica')">
  <i data-lucide="truck"></i>
  <span>Logística</span>
</div>
</div>

<div class="sidebar-item" data-route="calculadora" onclick="goTo('calculadora')">
  <i data-lucide="calculator"></i>
  <span>Calculadora</span>
</div>

<div class="sidebar-item" data-route="integraciones" onclick="goTo('integraciones')">
  <i data-lucide="plug"></i>
  <span>Integraciones</span>
</div>

<div class="sidebar-item sidebar-logout" onclick="cerrarSesion()">
  <i data-lucide="log-out"></i>
  <span>Cerrar sesión</span>
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

 if (window.lucide) {
  lucide.createIcons();
}
}
