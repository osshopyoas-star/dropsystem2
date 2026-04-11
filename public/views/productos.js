import { state } from "../js/state.js";

export function renderProductos() {
  return `
    <h2 style="display:flex; align-items:center; gap:10px;">
      <i data-lucide="package"></i>
      Guardar producto para testeo (${window.productoPaisActivo || ""})
    </h2>

    <!-- 🔥 BARRA PRO -->
    <div class="top-bar">

      <input id="nombre" placeholder="Nombre del producto">

      <select id="origen">
        <option value="dropi">Dropi</option>
        <option value="importacion">Importación</option>
        <option value="laboratorio">Laboratorio</option>
      </select>

      <input id="dropiId" placeholder="ID / Importación">
      <input id="material" placeholder="Material / Tipo">
      <input id="creativos" placeholder="Link Creativos">
      <input id="landing" placeholder="Landing Page">

      <!-- ❌ quitamos estado de aquí -->

      <button class="btn-primary" onclick="guardarProducto()">
        <i data-lucide="save"></i> Guardar
      </button>

    </div>

    <!-- 🔥 TABLA -->
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
  `;
}