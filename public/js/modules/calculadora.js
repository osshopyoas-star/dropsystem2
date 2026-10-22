// =============================================
// 🧮 Calculadora de precio COD (contra entrega)
// Costeo por producto → guarda → pasa precio, "antes" y paquetes a Desarrollo
// Las fórmulas están en core/costeo.js
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { PAISES_COSTEO, calcularCosteo, formatear, redondear } from "../core/costeo.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");

let productos = [];
let costeos = [];
let productoPendiente = null;   // producto con el que se abrió la calculadora desde la Base
let ultimo = null;              // último resultado calculado

const CAMPOS = ["proveedor", "flete", "cancelados", "devoluciones", "admin", "fulfillment", "cpa", "utilidad", "descuento", "precio"];

async function api(metodo, url, body) {
  const res = await fetch(url, {
    method: metodo,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

function avisar(texto, tipo = "ok") {
  let el = $("estToast");
  if (!el) { el = document.createElement("div"); el.id = "estToast"; document.body.appendChild(el); }
  el.textContent = texto;
  el.className = `est-toast show ${tipo}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), tipo === "error" ? 4000 : 1600);
}

const pais = () => $("calPais")?.value === "EC" ? "EC" : "CO";
const moneda = () => PAISES_COSTEO[pais()].moneda;
const fmt = (v) => formatear(v, pais());

// ---------- Pantalla ----------
function render() {
  return `
  <div class="cal-page">
    <header class="cal-head">
      <div>
        <h1><i data-lucide="calculator"></i> Calculadora de precio</h1>
        <p>Costeo contra entrega por país. Elige el producto, ajusta los costos y pasa el precio a Desarrollo.</p>
      </div>
      <div class="cal-head-actions">
        <select id="calPais" onchange="calCambiarPais()">
          <option value="CO">🇨🇴 Colombia (COP)</option>
          <option value="EC">🇪🇨 Ecuador (USD)</option>
        </select>
        <button class="cal-btn ghost" onclick="calRestablecer()"><i data-lucide="rotate-ccw"></i> Restablecer</button>
        <button class="cal-btn ghost" onclick="calVerGuardados()"><i data-lucide="folder-open"></i> Costeos guardados</button>
        <button class="cal-btn" id="calBtnGuardar" onclick="calGuardar()"><i data-lucide="save"></i> Guardar costeo</button>
      </div>
    </header>

    <div id="calGuardados" class="cal-card cal-guardados hidden"></div>

    <section class="cal-layout">
      <div class="cal-card">
        <h2>Datos del producto</h2>

        <div class="cal-form">
          <label>Producto</label>
          <select id="calProducto" onchange="calElegirProducto()"><option value="">Cargando...</option></select>
          <input id="calNombre" placeholder="…o escribe el nombre si no está en la Base">
          <small id="calInfoProducto" class="cal-hint"></small>

          <div class="cal-row">
            <div>
              <label>Precio proveedor</label>
              <input id="calProveedor" type="number" min="0" step="any" oninput="calCalcular()">
              <small>Lo que le pagas al proveedor por unidad</small>
            </div>
            <div>
              <label>Flete base</label>
              <input id="calFlete" type="number" min="0" step="any" oninput="calCalcular()">
              <small>Flete promedio del envío contra entrega</small>
            </div>
          </div>

          <div class="cal-slider">
            <div><label>% Cancelaciones + rechazados</label><b id="calCanceladosTxt">0%</b></div>
            <input id="calCancelados" type="range" min="0" max="60" step="1" oninput="calCalcular()">
          </div>
          <div class="cal-slider">
            <div><label>% Devoluciones (sobre despachados)</label><b id="calDevolucionesTxt">0%</b></div>
            <input id="calDevoluciones" type="range" min="0" max="60" step="1" oninput="calCalcular()">
          </div>
          <small class="cal-hint">Usa números algo más altos que tu promedio: es mejor que el precio aguante una semana mala.</small>
          <small id="calEfectividad" class="cal-efect"></small>

          <div class="cal-row">
            <div>
              <label>Costos administrativos</label>
              <input id="calAdmin" type="number" min="0" step="any" oninput="calCalcular()">
              <small>Opcional — tienda, herramientas, etc. por venta</small>
            </div>
            <div>
              <label>Fulfillment</label>
              <input id="calFulfillment" type="number" min="0" step="any" oninput="calCalcular()">
              <small>Opcional — bodega propia o importado</small>
            </div>
          </div>

          <div class="cal-row">
            <div>
              <label>CPA objetivo</label>
              <input id="calCpa" type="number" min="0" step="any" oninput="calCalcular()">
              <small>Costo por venta en el Ads Manager</small>
            </div>
            <div>
              <label>% utilidad deseada</label>
              <input id="calUtilidad" type="number" min="0" max="90" step="1" oninput="calCalcular()">
              <small id="calUtilidadHint">Margen que quieres ganar</small>
            </div>
          </div>

          <div class="cal-row">
            <div>
              <label>Descuento de comparación (%)</label>
              <input id="calDescuento" type="number" min="0" max="90" step="1" oninput="calCalcular()">
              <small>Para el precio "antes" tachado</small>
            </div>
            <div>
              <label>¿Ya tienes precio de venta?</label>
              <div class="cal-inline">
                <input id="calPrecio" type="number" min="0" step="any" placeholder="Vacío = te lo sugerimos" oninput="calCalcular()">
                <button class="cal-mini" onclick="calBorrarPrecio()">Borrar</button>
              </div>
              <small>Si lo dejas vacío, te sugerimos el precio</small>
            </div>
          </div>
        </div>
      </div>

      <div class="cal-card cal-result" id="calResultado"></div>
    </section>
  </div>`;
}

function leerDatos() {
  const v = (id) => $(id)?.value;
  return {
    pais: pais(),
    proveedor: v("calProveedor"), flete: v("calFlete"),
    cancelados: v("calCancelados"), devoluciones: v("calDevoluciones"),
    admin: v("calAdmin"), fulfillment: v("calFulfillment"), cpa: v("calCpa"),
    utilidad: v("calUtilidad"), descuento: v("calDescuento"), precio: v("calPrecio")
  };
}

function ponerDatos(d = {}) {
  const base = PAISES_COSTEO[pais()];
  const set = (id, val) => { const el = $(id); if (el) el.value = val ?? ""; };
  set("calProveedor", d.proveedor ?? "");
  set("calFlete", d.flete ?? base.flete);
  set("calCancelados", d.cancelados ?? base.cancelados);
  set("calDevoluciones", d.devoluciones ?? base.devoluciones);
  set("calAdmin", d.admin ?? base.admin);
  set("calFulfillment", d.fulfillment ?? base.fulfillment);
  set("calCpa", d.cpa ?? base.cpa);
  set("calUtilidad", d.utilidad ?? base.utilidad);
  set("calDescuento", d.descuento ?? base.descuento);
  set("calPrecio", d.precio ?? "");
}

function guardarBorrador() {
  try {
    localStorage.setItem("cal_borrador", JSON.stringify({
      ...leerDatos(), productoId: $("calProducto")?.value || "", nombre: $("calNombre")?.value || ""
    }));
  } catch {}
}

// ---------- Cálculo ----------
window.calCalcular = function () {
  const d = leerDatos();
  const r = calcularCosteo(d);
  ultimo = r;
  guardarBorrador();

  if ($("calCanceladosTxt")) $("calCanceladosTxt").textContent = `${Number(d.cancelados) || 0}%`;
  if ($("calDevolucionesTxt")) $("calDevolucionesTxt").textContent = `${Number(d.devoluciones) || 0}%`;
  if ($("calEfectividad")) $("calEfectividad").textContent = `Entrega sobre despachado: ${Math.round(r.entregaPct)}% · Efectividad total: ${Math.round(r.efectividadPct)}%`;

  const utilidadInput = $("calUtilidad");
  if (utilidadInput) {
    utilidadInput.disabled = r.modo === "validar";
    $("calUtilidadHint").textContent = r.modo === "validar"
      ? "Desactivado mientras validas tu precio (borra el precio para ajustar la meta)"
      : "Margen que quieres ganar";
  }

  const sinProveedor = !(Number(d.proveedor) > 0);
  const cont = $("calResultado");
  if (!cont) return;

  cont.innerHTML = `
    <h2>Resultado</h2>
    ${sinProveedor ? `<div class="cal-alert info">Escribe el precio del proveedor para ver el costeo.</div>` : ""}

    <h3 class="cal-sub"><i data-lucide="receipt"></i> Desglose de costos</h3>
    <ul class="cal-desglose">
      <li><span>Flete con devoluciones <em>pagas el flete de los que vuelven</em></span><b>${fmt(r.fleteConDevoluciones)}</b></li>
      <li><span>CPA costeado <em>pauta de los pedidos que no se entregan</em></span><b>${fmt(r.cpaCosteado)}</b></li>
      <li><span>Costos totales por venta</span><b>${fmt(r.costosTotales)}</b></li>
      <li><span>Utilidad ${r.modo === "validar" ? "real" : ""} (${r.utilidadPct.toFixed(1)}%) <em>${r.modo === "validar" ? "con tu precio" : "con el precio sugerido"}</em></span><b class="${r.utilidad < 0 ? "neg" : ""}">${fmt(r.utilidad)}</b></li>
    </ul>

    <div class="cal-modo">
      ${r.modo === "validar"
        ? `<span>Estás validando <b>tu precio</b></span><button class="cal-link" onclick="calBorrarPrecio()">Volver al precio sugerido</button>`
        : `<span>Precio sugerido para ganar el <b>${r.utilidadDeseada}%</b></span>`}
    </div>

    <div class="cal-precio">
      <div class="cal-precio-fila"><span>Comparación "antes"</span><s>${fmt(r.precioAntes)}</s></div>
      <div class="cal-precio-fila grande"><span>${r.modo === "validar" ? "Tu precio de venta" : "Precio sugerido"}</span><strong>${fmt(r.precio)}</strong></div>
      <div class="cal-precio-fila"><span>Redondeado (el que publicas)</span><b>${fmt(r.redondeado)}</b></div>
    </div>

    <div class="cal-bep">
      <div><b>BEP — CPA máximo sin perder</b><small>utilidad + CPA objetivo. Si en tus campañas el costo por venta supera esto, pierdes.</small></div>
      <strong>${fmt(r.bep)}</strong>
    </div>

    ${!sinProveedor ? (r.cumpleMeta
      ? `<div class="cal-alert ok">Tu precio cubre los costos y cumple tu utilidad deseada (${r.utilidadPct.toFixed(1)}% ≥ ${r.utilidadDeseada}%).</div>`
      : r.utilidad < 0
        ? `<div class="cal-alert error">Con este precio <b>pierdes ${fmt(-r.utilidad)}</b> por venta. Para ganar el ${r.utilidadDeseada}%, vende desde <b>${fmt(r.precioMinimoMeta)}</b>.</div>`
        : `<div class="cal-alert warn">Tu precio cubre los costos, pero la utilidad (${r.utilidadPct.toFixed(1)}%) queda por debajo de la deseada (${r.utilidadDeseada}%). Para llegar, vende desde <b>${fmt(r.precioMinimoMeta)}</b>.</div>`) : ""}

    ${r.alertaEfectividad && !sinProveedor ? `
      <div class="cal-alert error">${Math.round(r.efectividadPct)}% de efectividad total — la inefectividad te cuesta <b>${fmt(r.costoInefectividad)}</b> por venta (${fmt(r.fleteExtra)} en fletes de devoluciones + ${fmt(r.cpaExtra)} de CPA extra) y está inflando tu precio. Mejora tus % de cancelados y devoluciones.</div>` : ""}

    <h3 class="cal-sub"><i data-lucide="package"></i> Ofertas de cantidad sugeridas</h3>
    <div class="cal-packs">
      ${r.paquetes.map((p, i) => `
        <div class="cal-pack ${i === 1 ? "mejor" : ""}">
          <span class="cal-pack-tag">${i === 0 ? "PACK" : "MEJOR PRECIO"}</span>
          <small>${p.unidades} UNIDADES</small>
          <strong>${fmt(p.precio)}</strong>
          <span>Unitario: <b>${fmt(p.unitario)}</b> · Normal: <s>${fmt(p.normal)}</s></span>
          <span class="cal-pack-pct">-${p.ahorroPct}% por unidad · tu utilidad ${p.utilidadPct.toFixed(0)}%</span>
        </div>
      `).join("")}
    </div>

    <button class="cal-btn grande" id="calBtnDesarrollo" onclick="calPasarADesarrollo()" ${sinProveedor ? "disabled" : ""}>
      <i data-lucide="arrow-right-circle"></i> Guardar y pasar a Desarrollo
    </button>
    <small class="cal-hint centro">Lleva a la Ficha el precio redondeado, el "antes" y los paquetes.</small>
  `;
  if (window.lucide) lucide.createIcons();
};

// ---------- Productos ----------
function llenarProductos(seleccion = "") {
  const sel = $("calProducto");
  if (!sel) return;
  const delPais = productos
    .filter(p => (p.pais || "CO") === pais())
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es", { sensitivity: "base" }));
  const conCosteo = new Set(costeos.map(c => String(c.productoId)));
  sel.innerHTML = `<option value="">Elegir de la Base de Productos (${PAISES_COSTEO[pais()].nombre})</option>` +
    delPais.map(p => `<option value="${esc(p._id)}" ${String(p._id) === String(seleccion) ? "selected" : ""}>${esc(p.nombre)}${p.dropiId ? ` · Dropi ${esc(p.dropiId)}` : ""}${conCosteo.has(String(p._id)) ? " — ✓ costeado" : ""}</option>`).join("");
}

function infoProducto() {
  const id = $("calProducto")?.value;
  const info = $("calInfoProducto");
  const c = costeos.find(x => String(x.productoId) === String(id));
  if (info) info.textContent = !id ? "" : c ? `Costeo guardado el ${new Date(c.actualizado).toLocaleDateString("es-CO")} — lo cargamos.` : "Sin costeo guardado todavía.";
}

window.calElegirProducto = function () {
  const id = $("calProducto")?.value;
  if ($("calNombre")) $("calNombre").value = "";
  const c = costeos.find(x => String(x.productoId) === String(id));
  if (c) ponerDatos(c.datos);
  else if (id) ponerDatos({});   // valores del país, proveedor vacío
  infoProducto();
  calCalcular();
  if (id && !c) $("calProveedor")?.focus();
};

window.calCambiarPais = function () {
  try { localStorage.setItem("cal_pais", pais()); } catch {}
  ponerDatos({ proveedor: $("calProveedor")?.value });
  llenarProductos();
  infoProducto();
  calCalcular();
};

window.calRestablecer = function () {
  if ($("calProducto")) $("calProducto").value = "";
  if ($("calNombre")) $("calNombre").value = "";
  ponerDatos({});
  infoProducto();
  calCalcular();
};

window.calBorrarPrecio = function () {
  if ($("calPrecio")) $("calPrecio").value = "";
  calCalcular();
};

// ---------- Guardar ----------
async function guardarCosteo() {
  const productoId = $("calProducto")?.value || null;
  const nombre = $("calNombre")?.value.trim() || "";
  if (!productoId && !nombre) throw new Error("Elige el producto o escribe su nombre");
  if (!ultimo || !(Number($("calProveedor")?.value) > 0)) throw new Error("Falta el precio del proveedor");

  const r = ultimo;
  const c = await api("POST", "/api/costeos", {
    productoId, nombre, pais: pais(),
    datos: leerDatos(),
    resumen: {
      precio: r.precio, redondeado: r.redondeado, precioAntes: r.precioAntes,
      utilidad: r.utilidad, utilidadPct: r.utilidadPct, bep: r.bep, costosTotales: r.costosTotales,
      paquetes: r.paquetes
    }
  });
  const i = costeos.findIndex(x => x._id === c._id);
  if (i >= 0) costeos[i] = c; else costeos.unshift(c);
  return c;
}

async function conBoton(id, texto, fn) {
  const b = $(id); const orig = b?.innerHTML;
  if (b) { b.disabled = true; b.innerHTML = `<span class="est-spin"></span> ${texto}`; }
  try { return await fn(); }
  catch (err) { avisar(err.message, "error"); }
  finally { if (b && document.body.contains(b)) { b.disabled = false; b.innerHTML = orig; if (window.lucide) lucide.createIcons(); } }
}

window.calGuardar = () => conBoton("calBtnGuardar", "Guardando...", async () => {
  await guardarCosteo();
  llenarProductos($("calProducto")?.value);
  infoProducto();
  avisar("Costeo guardado ✓");
});

window.calPasarADesarrollo = () => conBoton("calBtnDesarrollo", "Pasando a Desarrollo...", async () => {
  const c = await guardarCosteo();
  const r = ultimo;
  const p = pais();

  // Abre el proyecto existente del producto o crea uno nuevo
  const proyecto = await api("POST", "/api/proyectos", c.productoId ? { productoId: c.productoId, pais: p } : { nombre: c.nombre, pais: p });
  const actual = await api("GET", `/api/proyectos/${proyecto._id}`);

  const paquetes = r.paquetes.map(x => `${x.unidades} unidades ${formatear(x.precio, p)}`).join("; ");
  const ficha = {
    ...(actual.ficha || {}),
    precio: r.redondeado,
    // "antes" calculado desde el precio que publicas, para que el % de descuento cuadre
    precioAntes: redondear(r.redondeado / (1 - (Number($("calDescuento")?.value) || 0) / 100), p),
    paquetes: `1 unidad ${formatear(r.redondeado, p)}; ${paquetes}`,
    costeoId: c._id
  };
  await api("PUT", `/api/proyectos/${proyecto._id}`, { ficha, pais: p });

  avisar("Precio y paquetes pasados a la Ficha ✓");
  goTo("desarrollo");
  setTimeout(() => window.estAbrirProyectoEn?.(proyecto._id, 1), 50);
});

// ---------- Costeos guardados ----------
window.calVerGuardados = function () {
  const box = $("calGuardados");
  if (!box) return;
  if (!box.classList.contains("hidden")) { box.classList.add("hidden"); return; }
  box.classList.remove("hidden");
  box.innerHTML = costeos.length ? `
    <div class="cal-guardados-head"><h2>Costeos guardados</h2><button class="cal-mini" onclick="calVerGuardados()">Cerrar</button></div>
    <ul>
      ${costeos.map(c => `
        <li>
          <button class="cal-guardado" onclick="calCargarCosteo('${esc(c._id)}')">
            <span class="cal-flag">${c.pais === "EC" ? "🇪🇨" : "🇨🇴"}</span>
            <b>${esc(c.nombre)}</b>
            <span>${c.resumen?.redondeado ? formatear(c.resumen.redondeado, c.pais) : "—"} · utilidad ${c.resumen?.utilidadPct != null ? Number(c.resumen.utilidadPct).toFixed(1) + "%" : "—"}</span>
            <small>${new Date(c.actualizado).toLocaleDateString("es-CO")}</small>
          </button>
          <button class="cal-mini danger" title="Eliminar" onclick="calEliminarCosteo('${esc(c._id)}')">✕</button>
        </li>`).join("")}
    </ul>` : `<div class="cal-guardados-head"><h2>Costeos guardados</h2><button class="cal-mini" onclick="calVerGuardados()">Cerrar</button></div><p class="cal-hint">Todavía no has guardado costeos.</p>`;
};

window.calCargarCosteo = function (id) {
  const c = costeos.find(x => x._id === id);
  if (!c) return;
  $("calPais").value = c.pais;
  llenarProductos(c.productoId || "");
  if ($("calNombre")) $("calNombre").value = c.productoId ? "" : c.nombre;
  ponerDatos(c.datos);
  infoProducto();
  calCalcular();
  $("calGuardados")?.classList.add("hidden");
  avisar(`Costeo de ${c.nombre} cargado`);
};

window.calEliminarCosteo = async function (id) {
  if (!confirm("¿Eliminar este costeo guardado?")) return;
  try {
    await api("DELETE", `/api/costeos/${id}`);
    costeos = costeos.filter(x => x._id !== id);
    $("calGuardados")?.classList.add("hidden");
    calVerGuardados();
    llenarProductos($("calProducto")?.value);
  } catch (err) { avisar(err.message, "error"); }
};

// Abrir la calculadora con un producto ya elegido (desde Base de Productos o la Ficha)
window.calAbrirConProducto = function (productoId, paisProducto = null) {
  productoPendiente = { productoId, pais: paisProducto };
  goTo("calculadora");
};

// ---------- Ruta ----------
registrarRuta("calculadora", async (view) => {
  view.innerHTML = render();
  marcarMenuActivo("calculadora");
  if (window.lucide) lucide.createIcons();

  let borrador = null;
  try { borrador = JSON.parse(localStorage.getItem("cal_borrador") || "null"); } catch {}
  const pendiente = productoPendiente;
  productoPendiente = null;

  try {
    [productos, costeos] = await Promise.all([api("GET", "/api/productos"), api("GET", "/api/costeos")]);
  } catch (err) {
    avisar(err.message, "error");
  }

  if (pendiente) {
    const prod = productos.find(p => String(p._id) === String(pendiente.productoId));
    $("calPais").value = (pendiente.pais || prod?.pais) === "EC" ? "EC" : "CO";
    llenarProductos(pendiente.productoId);
    const c = costeos.find(x => String(x.productoId) === String(pendiente.productoId));
    ponerDatos(c ? c.datos : {});
    infoProducto();
    if (!c) setTimeout(() => $("calProveedor")?.focus(), 50);
  } else if (borrador) {
    $("calPais").value = borrador.pais === "EC" ? "EC" : "CO";
    llenarProductos(borrador.productoId);
    if ($("calNombre")) $("calNombre").value = borrador.nombre || "";
    ponerDatos(borrador);
    infoProducto();
  } else {
    let p = "CO";
    try { p = localStorage.getItem("cal_pais") || "CO"; } catch {}
    $("calPais").value = p === "EC" ? "EC" : "CO";
    llenarProductos();
    ponerDatos({});
  }
  calCalcular();
});
