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
    <div class="sidebar-item" onclick="setActive(this); goTo('inicio')">
  <i data-lucide="home"></i>
  <span>Inicio</span>
</div>

  <div class="sidebar-item" onclick="toggleBusquedaMenu()">
  <i data-lucide="search"></i>
  <span>Investigación de Mercado</span>

  <i id="busqueda-arrow" data-lucide="chevron-right" style="margin-left:auto;"></i>
</div>

<div id="busqueda-submenu" class="submenu">

  <div class="sidebar-item" onclick="setActive(this); goTo('busqueda')">
   <span>Buscar productos</span>
  </div>

  <div class="sidebar-item" onclick="setActive(this); goTo('tendencias')">
    <span>Tendencias</span>
  </div>

  <div class="sidebar-item" onclick="setActive(this); goTo('nichos')">
    <span>Nichos</span>
  </div>

</div>

   <div class="sidebar-item" onclick="toggleProductosMenu()">
  <i data-lucide="package"></i>
  <span>Base de Productos</span>

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


<div class="sidebar-item" onclick="toggleDesarrolloMenu()">
  <i data-lucide="brain"></i>
  <span>Desarrollo</span>

  <i id="desarrollo-arrow" data-lucide="chevron-right" style="margin-left:auto;"></i>
</div>

<div id="desarrollo-submenu" class="submenu">

  <div class="sidebar-item" onclick="setActive(this); goTo('avatar')">
    <span>Avatar</span>
  </div>

  <div class="sidebar-item" onclick="setActive(this); goTo('angulos')">
    <span>Ángulos</span>
  </div>

  <div class="sidebar-item" onclick="setActive(this); goTo('prompts')">
    <span>Prompts IA</span>
  </div>

  <div class="sidebar-item" onclick="setActive(this); goTo('creativos')">
    <span>Creativos</span>
  </div>

  <div class="sidebar-item" onclick="setActive(this); goTo('landing')">
    <span>Landing Page</span>
  </div>

  <div class="sidebar-item" onclick="setActive(this); goTo('banpage')">
    <span>Ban Page</span>
  </div>

</div>

</div>

    </div>
  `;

 if (window.lucide) {
  lucide.createIcons();
}
}
function toggleDesarrolloMenu() {
  const submenu = document.getElementById("desarrollo-submenu");
  submenu.classList.toggle("open");
}