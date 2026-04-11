import { state } from "../js/state.js";

export function renderProductos() {
  return `
    <div class="productos-page">

      <div class="productos-hero">
        <div class="productos-hero-head">
          <div class="productos-title-wrap">
            <div class="productos-title-icon">
              <i data-lucide="package-2"></i>
            </div>

            <div>
              <h1 class="productos-title">Guardar producto para testeo (${window.productoPaisActivo || ""})</h1>
              <p class="productos-subtitle">Organiza, valida y mueve productos a desarrollo.</p>
            </div>
          </div>
        </div>

        <div class="top-bar">
          <input id="nombre" placeholder="Nombre del producto">

          <select id="origen" onchange="toggleCampoDropi()">
            <option value="dropi">Dropi</option>
            <option value="importacion">Importación</option>
            <option value="laboratorio">Laboratorio</option>
          </select>

         <div id="dropiIdWrap" hidden>
  <input id="dropiId" placeholder="ID Dropi">
</div>
          <input id="material" placeholder="Material / Tipo">
          <input id="creativos" placeholder="Link Creativos">
          <input id="landing" placeholder="Landing Page">

          <button class="btn-primary" onclick="guardarProducto()">
            <i data-lucide="save"></i>
            Guardar
          </button>
        </div>
      </div>

      <div class="tabla-pro">
        <div class="tabla-header">
          <div>Nombre</div>
          <div>Fuente</div>
          <div>Material</div>
          <div>Creativos</div>
          <div>Landing</div>
          <div>Proceso</div>
          <div>Desarrollo</div>
          <div>Acciones</div>
        </div>

        <div id="tabla-productos"></div>
      </div>

    </div>
  `;
}