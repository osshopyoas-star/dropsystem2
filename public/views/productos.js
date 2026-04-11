import { state } from "../js/state.js";

export function renderProductos() {
  return `
     <h1>📊 Base de Productos (${window.productoPaisActivo || ""})</h1>

    <!-- 🔥 BARRA SUPERIOR -->
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

      <select id="estado">
        <option value="idea">Idea</option>
        <option value="validando">Validando</option>
        <option value="desarrollo">Desarrollo</option>
        <option value="lanzado">Lanzado</option>
      </select>

      <button onclick="guardarProducto()">Guardar</button>
    </div>

    <!-- 🔥 TABLA NUEVA -->
    <div class="tabla-pro">
      <div class="tabla-header">
        <div>Nombre</div>
        <div>Fuente</div>
        <div>Material</div>
        <div>Creativos</div>
        <div>Landing</div>
        <div>Proceso</div>
        <div>Acciones</div>
      </div>

      <div id="tabla-productos"></div>
    </div>
  `;
}