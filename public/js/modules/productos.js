// =============================================
// Base de productos: tabla, guardar, editar, estado, eliminar
// =============================================
import { state } from "../state.js";
import { escapeHTML } from "../core/utils.js";
import { renderProductos } from "../../views/productos.js";
import { registrarRuta } from "./navegacion.js";

window.productoPaisActivo = null;

window.setProductoPais = function(pais) {
  window.productoPaisActivo = pais;
  goTo("productos");

  if (pais === "CO") {
    marcarMenuActivo("productos-co");
  }

  if (pais === "EC") {
    marcarMenuActivo("productos-ec");
  }
};

window.toggleCampoDropi = function() {
  const origenEl = document.getElementById("origen");
  const wrap = document.getElementById("dropiIdWrap");
  const input = document.getElementById("dropiId");
  const topBar = document.querySelector(".top-bar");

  if (!origenEl || !wrap || !input || !topBar) return;

  const origen = (origenEl.value || "").trim().toLowerCase();
  const mostrar = origen === "dropi";

  wrap.hidden = !mostrar;
  topBar.classList.toggle("con-dropi", mostrar);
  topBar.classList.toggle("sin-dropi", !mostrar);

  if (!mostrar) {
    input.value = "";
  } else {
    input.placeholder = "ID Dropi";
  }
};

window.guardarProducto = async function() {
 const producto = {
  nombre: document.getElementById("nombre").value,
  origen: document.getElementById("origen").value,
dropiId: document.getElementById("origen").value === "dropi"
  ? document.getElementById("dropiId").value
  : "",
  material: document.getElementById("material").value,
  landing: document.getElementById("landing").value,
  creativos: document.getElementById("creativos").value,
  pais: window.productoPaisActivo,
estado: window.productoEditandoId
  ? (state.productos.find(p => p._id === window.productoEditandoId)?.estado || "idea")
  : "idea",
  desarrollo: {
    avatar: false,
    angulos: false,
    creativos: false,
    landing: false
  },
  fecha: new Date()
};

  try {
    let res;

    if (window.productoEditandoId) {
      res = await fetch(`/api/productos/${window.productoEditandoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(producto)
      });
    } else {
      res = await fetch("/api/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(producto)
      });
    }

    const data = await res.json();

    if (!res.ok) {
      alert("Error guardando en Mongo");
      console.error(data);
      return;
    }

    window.productoEditandoId = null;

    document.getElementById("nombre").value = "";
    document.getElementById("dropiId").value = "";
    document.getElementById("material").value = "";
    document.getElementById("landing").value = "";
    document.getElementById("creativos").value = "";

    await cargarProductos();
    renderTablaProductos();
  } catch (err) {
    console.error("Error guardando producto:", err);
    alert("No se pudo guardar");
  }
};

function renderTablaProductos() {
  const tabla = document.getElementById("tabla-productos");
  if (!tabla) return;

tabla.innerHTML = state.productos.map((p, i) => `
  <div class="fila-producto">

  <div class="texto-celda">${escapeHTML(p.nombre || "")}</div>

<div class="texto-celda">
  ${
    p.origen === "dropi"
      ? `Dropi: ${escapeHTML(p.dropiId || "sin id")}`
      : p.origen === "importacion"
      ? "Importación"
      : p.origen === "laboratorio"
      ? "Laboratorio"
      : "-"
  }
</div>

  <div>
  <button class="icon-btn" onclick="abrirMaterial('${p.material || ""}')">
    <i data-lucide="file-text"></i>
  </button>
</div>

    <div>
      <button class="icon-btn" onclick="abrirCreativos('${p.creativos || ""}')">
        <i data-lucide="video"></i>
      </button>
    </div>

    <div>
      <button class="icon-btn" onclick="abrirLanding('${p.landing || ""}')">
        <i data-lucide="globe"></i>
      </button>
    </div>

    <!-- 🔥 PROCESO -->
    <div>
   <select
    class="select-pro estado-${(p.estado || "idea").replace(" ", "-")}"
    onchange="cambiarEstado('${p._id}', this.value)"
  >
    <option value="idea" ${p.estado === "idea" ? "selected" : ""}>Idea</option>
    <option value="validando" ${p.estado === "validando" ? "selected" : ""}>Validando</option>
    <option value="desarrollo" ${p.estado === "desarrollo" ? "selected" : ""}>Desarrollo</option>
    <option value="lanzado" ${p.estado === "lanzado" ? "selected" : ""}>Lanzado</option>
  </select>
</div>

    <!-- 🔥 BOTÓN DESARROLLO -->
    <div>
      <button class="btn-dev" onclick="irDesarrollo(${i})">
        Ir
      </button>
    </div>

    <!-- 🔥 ACCIONES -->
    <div class="acciones">
      <button class="icon-btn" onclick="editarProducto('${p._id}')">
        <i data-lucide="pencil"></i>
      </button>

      <button class="icon-btn" onclick="eliminarProducto('${p._id}')">
        <i data-lucide="trash"></i>
      </button>
    </div>

  </div>
`).join("");

// 🔥 IMPORTANTE
lucide.createIcons();
}

window.abrirLanding = function(url) {
  if (!url) return;
  window.open(url, "_blank");
};

window.abrirCreativos = function(url) {
  if (!url) return;
  window.open(url, "_blank");
};

window.abrirMaterial = function(texto) {
  if (!texto) return;

  const modal = document.getElementById("modalMaterial");
  const contenido = document.getElementById("modalMaterialContenido");

  if (contenido) contenido.innerText = texto;

  modal.classList.remove("hidden");
};

window.abrirDropi = function(id) {
  const url = `https://app.dropi.co/product/${id}`;
  window.open(url, "_blank");
};

window.cerrarModalMaterial = function() {
  const modal = document.getElementById("modalMaterial");
  modal.classList.add("hidden");
};

window.cargarProductos = async function() {
  try {
    let url = "/api/productos";

    if (window.productoPaisActivo) {
      url += `?pais=${window.productoPaisActivo}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    state.productos = data;
    console.log("Productos desde Mongo:", data);
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
};

window.cambiarEstado = async function(id, nuevoEstado) {
  try {
    const res = await fetch(`/api/productos/${id}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Error actualizando estado");
      console.error(data);
      return;
    }

    await cargarProductos();
    renderTablaProductos();
  } catch (err) {
    console.error("Error cambiando estado:", err);
    alert("No se pudo actualizar el estado");
  }
};

window.editarProducto = function(id) {
  const producto = state.productos.find(p => p._id === id);
  if (!producto) return;

  document.getElementById("nombre").value = producto.nombre || "";
  document.getElementById("origen").value = producto.origen || "dropi";
  document.getElementById("dropiId").value = producto.dropiId || "";
  document.getElementById("material").value = producto.material || "";
  document.getElementById("landing").value = producto.landing || "";
  document.getElementById("creativos").value = producto.creativos || "";

  window.productoEditandoId = id;
  toggleCampoDropi();
};

let productoAEliminar = null;

window.eliminarProducto = function(id) {
  productoAEliminar = id;

  const modal = document.getElementById("modalConfirm");
  if (!modal) {
    console.error("No existe #modalConfirm en el HTML");
    return;
  }

  modal.classList.remove("hidden");
};

async function confirmarEliminacion() {
  if (!productoAEliminar) return;

  try {
    const res = await fetch(`/api/productos/${productoAEliminar}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Error eliminando producto");
      console.error(data);
      return;
    }

    await cargarProductos();
    renderTablaProductos();
  } catch (err) {
    console.error("Error eliminando producto:", err);
    alert("No se pudo eliminar");
  } finally {
    productoAEliminar = null;
    const modal = document.getElementById("modalConfirm");
    if (modal) {
      modal.classList.add("hidden");
    }
  }
}

// Botones del modal "¿Eliminar producto?" (está en index.html)
export function initModalEliminar() {
  const btnCancelar = document.getElementById("btnCancelar");
  const btnAceptar = document.getElementById("btnAceptar");
  const modal = document.getElementById("modalConfirm");

  const cerrar = () => {
    productoAEliminar = null;
    modal?.classList.add("hidden");
  };

  if (btnCancelar) btnCancelar.onclick = cerrar;
  if (btnAceptar) btnAceptar.onclick = () => confirmarEliminacion();
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) cerrar();
    };
  }
}

// Ruta: productos
registrarRuta("productos", (view) => {
  cargarProductos().then(() => {
    view.innerHTML = renderProductos();

    setTimeout(() => {
  renderTablaProductos();
  toggleCampoDropi();

  if (window.productoPaisActivo === "CO") {
    marcarMenuActivo("productos-co");
  }

  if (window.productoPaisActivo === "EC") {
    marcarMenuActivo("productos-ec");
  }

  if (window.lucide) lucide.createIcons();
}, 0);
  });

  return;
});

