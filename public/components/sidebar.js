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

<div class="sidebar-item" data-route="desarrollo" onclick="goTo('desarrollo')">
  <i data-lucide="brain"></i>
  <span>Desarrollo</span>
</div>


</div>
  `;

 if (window.lucide) {
  lucide.createIcons();
}
}
