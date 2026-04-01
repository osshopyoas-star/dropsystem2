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

     <div class="sidebar-item" onclick="toggleBusquedaMenu()">
  <i data-lucide="search"></i>
  <span>Búsqueda</span>

  <i id="busqueda-arrow" data-lucide="chevron-right" style="margin-left:auto;"></i>
</div>

<div id="busqueda-submenu" class="submenu">

  <div class="sidebar-item" onclick="setActive(this); goTo('busqueda')">
    <span>Problemas</span>
  </div>

  <div class="sidebar-item" onclick="setActive(this); goTo('tendencias')">
    <span>Tendencias</span>
  </div>

    

   <div class="sidebar-item" onclick="toggleProductosMenu()">
  <i data-lucide="package"></i>
  <span>Productos</span>

  <i id="productos-arrow" data-lucide="chevron-right" style="margin-left:auto;"></i>
</div>

    

<div id="productos-submenu" class="submenu">
 <div class="sidebar-item" onclick="setActive(this); setProductoPais('CO')">
  <i data-lucide="flag"></i>
  <span>Colombia</span>
</div>

<div class="sidebar-item" onclick="setActive(this); setProductoPais('EC')">
  <i data-lucide="map"></i>
  <span>Ecuador</span>
</div>
</div>

    </div>
  `;

 if (window.lucide) {
  lucide.createIcons();
}
}