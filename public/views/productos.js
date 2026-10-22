// =============================================
// Base de Productos — estructura de la pantalla
// (la lógica está en js/modules/productos.js)
// =============================================
export function renderProductos() {
  const pais = window.productoPaisActivo === "EC" ? "Ecuador" : "Colombia";
  const bandera = window.productoPaisActivo === "EC" ? "🇪🇨" : "🇨🇴";

  return `
  <div class="bp-page">

    <header class="bp-head">
      <div>
        <h1>${bandera} Base de Productos · ${pais}</h1>
        <p id="bpResumen">Organiza, valida y mueve productos a desarrollo.</p>
      </div>
      <button id="bpBtnNuevo" class="bp-btn" onclick="bpMostrarFormulario()">
        <i data-lucide="plus"></i> Nuevo producto
      </button>
    </header>

    <!-- Formulario (se abre con "Nuevo producto" o con el lápiz de editar) -->
    <section id="bpFormulario" class="bp-card bp-form hidden">
      <div class="bp-form-head">
        <h2 id="bpFormTitulo">Nuevo producto</h2>
        <button class="bp-mini" onclick="bpCancelarFormulario()">Cancelar</button>
      </div>
      <div class="bp-form-grid">
        <label class="bp-campo bp-ancho">Nombre del producto
          <input id="nombre" placeholder="Ej: Cinta de kinesiología x10">
        </label>
        <label class="bp-campo">Fuente
          <select id="origen" onchange="toggleCampoDropi()">
            <option value="dropi">Dropi</option>
            <option value="importacion">Importación</option>
            <option value="laboratorio">Laboratorio</option>
          </select>
        </label>
        <label class="bp-campo" id="dropiIdWrap">ID de Dropi
          <input id="dropiId" placeholder="Ej: 2240213">
        </label>
        <label class="bp-campo bp-ancho">Notas / material
          <input id="material" placeholder="Lo que quieras recordar del producto">
        </label>
        <label class="bp-campo">Link de creativos
          <input id="creativos" placeholder="https://...">
        </label>
        <label class="bp-campo">Link de la landing
          <input id="landing" placeholder="https://...">
        </label>
      </div>
      <div class="bp-form-acciones">
        <button class="bp-btn" id="bpBtnGuardar" onclick="guardarProducto()"><i data-lucide="save"></i> Guardar</button>
      </div>
    </section>

    <!-- Buscador, filtros y orden -->
    <section class="bp-toolbar">
      <div class="bp-buscar">
        <i data-lucide="search"></i>
        <input id="bpBuscar" placeholder="Buscar por nombre o ID de Dropi" oninput="bpBuscar(this.value)">
      </div>
      <div id="bpFiltros" class="bp-filtros"></div>
      <select id="bpOrden" onchange="bpOrdenar(this.value)">
        <option value="estado">Ordenar: por estado</option>
        <option value="nombre">Ordenar: nombre A–Z</option>
        <option value="recientes">Ordenar: más recientes</option>
      </select>
    </section>

    <section class="bp-card bp-lista">
      <div class="bp-fila bp-encabezado">
        <div>Producto</div>
        <div>Avance</div>
        <div>Links</div>
        <div>Estado</div>
        <div></div>
        <div></div>
      </div>
      <div id="tabla-productos"></div>
      <div id="bpPaginas" class="bp-paginas"></div>
    </section>

    <div id="modalMaterial" class="modal-overlay hidden">
      <div class="modal-box" style="width:500px; max-width:calc(100vw - 32px); text-align:left;">
        <h3>Notas del producto</h3>
        <div id="modalMaterialContenido" style="margin-top:10px; font-size:14px; line-height:1.6; white-space:pre-wrap;"></div>
        <div style="margin-top:20px; text-align:right;">
          <button onclick="cerrarModalMaterial()">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
  `;
}
