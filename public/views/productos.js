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

      <div class="top-bar sin-dropi">
          <input id="nombre" placeholder="Nombre del producto">

         <select id="origen" onchange="toggleCampoDropi()">
  <option value="dropi">Dropi</option>
  <option value="importacion">Importación</option>
  <option value="laboratorio">Laboratorio</option>
</select>

         <div id="dropiIdWrap" hidden>
  <input id="dropiId" placeholder="ID Dropi">
</div>
          <input id="material" placeholder="Agregar Notas">
          <input id="creativos" placeholder="Link Creativos">
          <input id="landing" placeholder="Link Landing Page">

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



<div id="modalMaterial" class="modal-overlay hidden">
  <div class="modal-box" style="width:500px; text-align:left;">
    
    <h3>Contenido o material del producto/h3>

    <div id="modalMaterialContenido" style="margin-top:10px; font-size:14px; line-height:1.6;"></div>

    <div style="margin-top:20px; text-align:right;">
      <button onclick="cerrarModalMaterial()">Cerrar</button>
    </div>

  </div>
</div>
    </div>
  `;
}