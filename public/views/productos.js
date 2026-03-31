import { state } from "../js/state.js";



export function renderProductos() {
  return `
    <h1>📊 Base de Productos (${window.productoPaisActivo || ""})</h1>

    <div class="card">
      <h3>Agregar Producto</h3>

      <input id="nombre" placeholder="Nombre del producto">
      <input id="dropiId" placeholder="ID Dropi / Importación">
      <input id="material" placeholder="Material / Tipo">
      <input id="landing" placeholder="Link Landing Page">
      <input id="creativos" placeholder="Link Creativos">

      <button onclick="guardarProducto()">Guardar</button>
    </div>

    <div class="card">
      <h3>Base de Datos</h3>

      <table style="width:100%; border-collapse: collapse;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th>Producto</th>
            <th>Fuente</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-productos"></tbody>
      </table>
    </div>
  `;
}