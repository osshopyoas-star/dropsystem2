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

// Ruta: inicio
registrarRuta("inicio", (view) => {
  view.innerHTML = `
    <div class="home-page">

      <section class="home-hero">
        <div class="home-hero-left">
          <div class="home-badge">
            <i data-lucide="sparkles"></i>
            <span>Workspace de ecommerce</span>
          </div>

          <h1 class="home-title">
            Descubre, valida y desarrolla productos
            <span>desde una sola plataforma</span>
          </h1>

          <p class="home-subtitle">
            CoDropX te ayuda a encontrar oportunidades, validar demanda,
            organizar tu base de productos y construir ángulos, avatares,
            guiones y creativos con IA.
          </p>

          <div class="home-actions">
            <button class="primary home-main-btn" onclick="goTo('tendencias')">
              <i data-lucide="radar"></i>
              Explorar oportunidades
            </button>

            <button class="home-secondary-btn" onclick="goTo('desarrollo')">
              <i data-lucide="brain"></i>
              Ir a desarrollo
            </button>
          </div>
        </div>

        <div class="home-hero-right">
          <div class="home-kpi-card">
            <div class="home-kpi-top">
              <span class="home-kpi-label">Flujo principal</span>
              <span class="home-kpi-pill">Activo</span>
            </div>

            <div class="home-kpi-steps">
              <div class="home-step">
                <strong>1</strong>
                <span>Descubrir</span>
              </div>
              <div class="home-step">
                <strong>2</strong>
                <span>Validar</span>
              </div>
              <div class="home-step">
                <strong>3</strong>
                <span>Desarrollar</span>
              </div>
              <div class="home-step">
                <strong>4</strong>
                <span>Lanzar</span>
              </div>
            </div>

            <div class="home-kpi-note">
              Centraliza tendencias, productos y estrategia creativa en un solo lugar.
            </div>
          </div>
        </div>
      </section>

      <section class="home-stats">
        <div class="home-stat">
          <div class="home-stat-icon"><i data-lucide="line-chart"></i></div>
          <div>
            <strong>Radar de tendencias</strong>
            <p>Encuentra oportunidades con lógica de mercado.</p>
          </div>
        </div>

        <div class="home-stat">
          <div class="home-stat-icon"><i data-lucide="shield-check"></i></div>
          <div>
            <strong>Validación real</strong>
            <p>Contrasta señales con Ads Library y proveedores.</p>
          </div>
        </div>

        <div class="home-stat">
          <div class="home-stat-icon"><i data-lucide="brain-circuit"></i></div>
          <div>
            <strong>Desarrollo con IA</strong>
            <p>Genera avatares, ángulos, guiones y creativos.</p>
          </div>
        </div>
      </section>

      <section class="home-grid">
        <article class="home-card" onclick="goTo('tendencias')">
          <div class="home-card-top">
            <div class="home-card-icon blue"><i data-lucide="compass"></i></div>
            <span class="home-card-tag">Descubrimiento</span>
          </div>
          <h3>Explora tendencias y nichos</h3>
          <p>Analiza dolores, mercados, señales y oportunidades antes de entrar a validar.</p>
          <div class="home-card-link">Abrir módulo</div>
        </article>

        <article class="home-card" onclick="goTo('busqueda')">
          <div class="home-card-top">
            <div class="home-card-icon indigo"><i data-lucide="search-check"></i></div>
            <span class="home-card-tag">Validación</span>
          </div>
          <h3>Confirma demanda real</h3>
          <p>Usa búsquedas, Ads Library, TikTok y análisis de mercado para validar productos.</p>
          <div class="home-card-link">Abrir módulo</div>
        </article>

        <article class="home-card" onclick="goTo('productos')">
          <div class="home-card-top">
            <div class="home-card-icon sky"><i data-lucide="database"></i></div>
            <span class="home-card-tag">Base de productos</span>
          </div>
          <h3>Organiza tu inventario estratégico</h3>
          <p>Guarda productos, clasifícalos por estado y controla materiales, landings y creativos.</p>
          <div class="home-card-link">Abrir módulo</div>
        </article>

        <article class="home-card wide" onclick="goTo('desarrollo')">
          <div class="home-card-top">
            <div class="home-card-icon violet"><i data-lucide="sparkles"></i></div>
            <span class="home-card-tag">Desarrollo</span>
          </div>
          <h3>Construye la estrategia del producto</h3>
          <p>
            Convierte un producto o una imagen en avatares, ángulos, guiones,
            creativos y recomendaciones listas para landing y anuncios.
          </p>

          <div class="home-feature-list">
            <span>3 avatares</span>
            <span>5 ángulos por avatar</span>
            <span>Guiones AIDA</span>
            <span>Creativos de imagen</span>
          </div>

          <div class="home-card-link">Abrir módulo</div>
        </article>
      </section>
    </div>
  `;

  marcarMenuActivo("inicio");

  setTimeout(() => {
    if (window.lucide) lucide.createIcons();
  }, 0);

  return;
});

