// =============================================
// 🧮 Calculadora de precio COD (contra entrega)
// Costeo por producto → guarda → pasa precio, "antes" y paquetes a Desarrollo
// Las fórmulas están en core/costeo.js
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { PAISES_COSTEO, calcularCosteo, formatear, redondear, TIPOS_COMPLEMENTO, complementosPorDefecto, calcularComplementos, precioExtra, evaluarProducto } from "../core/costeo.js";
import { proximasTemporadas } from "../core/temporadas.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");

let productos = [];
let costeos = [];
let productoPendiente = null;   // producto con el que se abrió la calculadora desde la Base
let ultimo = null;              // último resultado calculado
// Complementos (unidad extra, protección, garantía, post-compra). Mientras no los toques, se recalculan con el precio.
const comp = { lista: [], personalizado: false, textosIA: null };

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
          <div id="calReal" class="cal-real"></div>
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
    utilidad: v("calUtilidad"), descuento: v("calDescuento"), precio: v("calPrecio"),
    complementos: comp.personalizado ? comp.lista : undefined
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
  comp.personalizado = Array.isArray(d.complementos) && d.complementos.length > 0;
  comp.lista = comp.personalizado ? d.complementos.map(c => ({ ...c })) : [];
  comp.textosIA = null;
}

function guardarBorrador() {
  try {
    localStorage.setItem("cal_borrador", JSON.stringify({
      ...leerDatos(), productoId: $("calProducto")?.value || "", nombre: $("calNombre")?.value || ""
    }));
  } catch {}
}

// ---------- Color de los % de cancelación y devolución ----------
// hasta 15% morado (bien) · 16% a 30% naranja (cuidado) · 31% o más rojo (alto)
function colorPorcentaje(valor) {
  const v = Number(valor) || 0;
  if (v <= 15) return "#4f46e5";
  if (v <= 30) return "#ea580c";
  return "#dc2626";
}

function pintarPorcentaje(id, valor) {
  const color = colorPorcentaje(valor);
  const v = Number(valor) || 0;
  const barra = $(id);
  const texto = $(`${id}Txt`);
  if (texto) { texto.textContent = `${v}%`; texto.style.color = color; }
  if (barra) {
    barra.style.accentColor = color;
    barra.style.color = color;   // borde del círculo
    // parte llena de la barra del mismo color (Chrome/Edge)
    const pct = (v / Number(barra.max || 100)) * 100;
    barra.style.background = `linear-gradient(to right, ${color} ${pct}%, #e2e8f0 ${pct}%)`;
  }
}

// ---------- Cálculo ----------
window.calCalcular = function () {
  const d = leerDatos();
  const r = calcularCosteo(d);
  ultimo = r;
  guardarBorrador();

  pintarPorcentaje("calCancelados", d.cancelados);
  pintarPorcentaje("calDevoluciones", d.devoluciones);
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

    ${sinProveedor ? "" : bloqueLoTesteo(r, d)}

    <h3 class="cal-sub"><i data-lucide="package"></i> Ofertas de cantidad sugeridas</h3>
    <label class="cal-envio"><input type="checkbox" id="calEnvioPacks" ${envioPacks() ? "checked" : ""} onchange="calEnvioPacks(this.checked)"> Los paquetes llevan envío gratis</label>
    <div class="cal-packs">
      ${r.paquetes.map((p, i) => `
        <div class="cal-pack ${i === 0 ? "mejor" : ""}">
          <span class="cal-pack-tag">${i === 0 ? "MÁS VENDIDO" : "MEJOR PRECIO"}</span>
          <small>${p.unidades} UNIDADES</small>
          <strong>${fmt(p.precio)}</strong>
          <span>Antes: <s>${fmt(p.unidades * p.normal)}</s> · <span class="cal-pack-ahorro">Ahorras ${fmt(p.unidades * p.normal - p.precio)}</span></span>
          <span>Unitario: <b>${fmt(p.unitario)}</b>${envioPacks() ? " · Envío gratis" : ""}</span>
          <span class="cal-pack-pct">-${p.ahorroPct}% por unidad · tu utilidad ${p.utilidadPct.toFixed(0)}%</span>
        </div>
      `).join("")}
    </div>

    ${sinProveedor ? "" : bloqueComplementos(r)}

    <button class="cal-btn grande" id="calBtnDesarrollo" onclick="calPasarADesarrollo()" ${sinProveedor ? "disabled" : ""}>
      <i data-lucide="arrow-right-circle"></i> Guardar y pasar a Desarrollo
    </button>
    <small class="cal-hint centro">Lleva a la Ficha el precio redondeado, el "antes" y los paquetes.</small>
  `;
  if (window.lucide) lucide.createIcons();
};

// =============================================
// 🛒 COMPLEMENTOS: sube lo que te deja cada cliente
// =============================================
let ultimoComp = null;
const tipoNombre = (t) => TIPOS_COMPLEMENTO[t]?.nombre || "Complemento";

function bloqueComplementos(r) {
  const d = leerDatos();
  if (!comp.personalizado) comp.lista = complementosPorDefecto({ pais: pais(), precio: r.redondeado, proveedor: d.proveedor, flete: d.flete });
  const k = calcularComplementos(r, comp.lista);
  ultimoComp = k;
  const barras = [
    ["Solo el producto", k.utilidadBase, "base"],
    ["+ complementos", k.conCheckout, "medio"],
    ["+ oferta post-compra", k.conTodo, "alto"]
  ];
  const tope = Math.max(1, ...barras.map(b => Math.abs(b[1])));
  return `
    <h3 class="cal-sub"><i data-lucide="shopping-cart"></i> Sube tu ticket: complementos y oferta post-compra</h3>
    <p class="cal-hint">En el formulario de compra (Releasit) le ofreces extras con un clic, y al terminar una oferta de 1 clic. Van en el <b>mismo paquete</b>: no pagas otro flete ni otra pauta, y en contra entrega solo los cobras si se entrega.</p>

    <div class="cal-comp-barras">
      ${barras.map(([t, v, c]) => `
        <div class="cal-comp-barra ${c}">
          <b class="${v < 0 ? "neg" : ""}">${fmt(v)}</b>
          <span style="height:${Math.max(6, Math.round(Math.abs(v) / tope * 100))}%"></span>
          <small>${t}</small>
        </div>`).join("")}
    </div>
    <p class="cal-comp-res">Lo que te deja <b>cada cliente entregado</b>, en promedio: ${fmt(k.utilidadBase)} → <b>${fmt(k.conTodo)}</b>${k.multiplicador && k.multiplicador > 1.05 ? ` (<b>×${k.multiplicador.toFixed(1)}</b>)` : ""}. Ticket promedio ${fmt(k.ticketPromedio)} · si lo toma todo ${fmt(k.ticketMaximo)}.</p>
    <div class="cal-bep cal-bep-comp">
      <div><b>Nuevo CPA máximo sin perder</b><small>con los complementos puedes pagar más por cada venta y seguir ganando (antes ${fmt(k.bepBase)}).</small></div>
      <strong>${fmt(k.bepNuevo)}</strong>
    </div>
    ${k.utilidadBase <= 0 ? `<div class="cal-alert warn">Sin complementos este producto no te deja ganancia por cliente. Los complementos ayudan, pero revisa primero el precio.</div>` : ""}
    ${k.hayPerdida ? `<div class="cal-alert error">Hay un complemento que vendes por debajo de su costo (en rojo). Súbele el precio o apágalo.</div>` : ""}

    <div class="cal-comp-lista">
      <div class="cal-comp-enc"><span></span><span></span><span>Precio</span><span>Costo</span><span title="De cada 100 clientes, cuántos lo toman">% lo toma</span><span>Te deja / cliente</span><span></span></div>
      ${k.complementos.map((c, i) => `
        <div class="cal-comp ${c.activo === false ? "apagado" : ""} ${c.perdida ? "pierde" : ""}">
          <input type="checkbox" ${c.activo !== false ? "checked" : ""} onchange="calComp(${i}, 'activo', this.checked)" title="Usar este complemento">
          <div class="cal-comp-nombre">
            <input value="${esc(c.nombre)}" onchange="calComp(${i}, 'nombre', this.value)">
            <small><em class="${c.donde}">${c.donde === "postcompra" ? "Después de comprar" : "En el formulario"}</em> ${esc(tipoNombre(c.tipo))}</small>
          </div>
          <input type="number" min="0" step="any" value="${c.precio}" onchange="calComp(${i}, 'precio', this.value)" aria-label="Precio">
          <input type="number" min="0" step="any" value="${c.costo}" onchange="calComp(${i}, 'costo', this.value)" aria-label="Costo" title="${esc(TIPOS_COMPLEMENTO[c.tipo]?.ayuda || "")}">
          <label class="cal-comp-toma"><input type="number" min="0" max="100" step="1" value="${Math.round(c.toma)}" onchange="calComp(${i}, 'toma', this.value)" aria-label="% que lo toma">%</label>
          <b class="${c.margen < 0 ? "neg" : ""}" title="${fmt(c.margen)} cada vez que lo toman">${c.activo === false ? "—" : "+" + fmt(c.aporte)}</b>
          <button class="cal-mini" title="Quitar" onclick="calCompQuitar(${i})">✕</button>
        </div>`).join("")}
      <div class="cal-comp-acciones">
        <select id="calCompTipo">${Object.entries(TIPOS_COMPLEMENTO).map(([t, x]) => `<option value="${t}">${x.nombre}</option>`).join("")}</select>
        <button class="cal-mini" onclick="calCompAgregar()">+ Agregar</button>
        ${comp.personalizado ? `<button class="cal-link" onclick="calCompRestablecer()">Volver a los sugeridos</button>` : ""}
      </div>
      <small class="cal-hint">"% lo toma" es de cada 100 clientes cuántos lo marcan. Empieza con estos números y ajústalos con tus pedidos reales. El costo de la protección y la garantía es lo que te cuesta en promedio reenviar o cambiar.</small>
    </div>

    <details class="cal-comp-textos" ${comp.textosIA ? "open" : ""}>
      <summary><i data-lucide="clipboard-list"></i> Textos para Releasit (formulario y oferta post-compra)</summary>
      <pre id="calCompTxt">${esc(textosComplementos(k))}</pre>
      <div class="cal-comp-acciones">
        <button class="cal-mini" onclick="calCompCopiar()">Copiar</button>
        <button class="cal-mini" id="calBtnCompIA" onclick="calCompIA()"><i data-lucide="sparkles"></i> Mejorar con IA y sugerir complementos</button>
      </div>
      ${comp.textosIA?.ideas?.length ? `<div class="cal-comp-ideas"><b>Productos que combinan (busca su costo en Dropi y agrégalos):</b><ul>${comp.textosIA.ideas.map(x => `<li><b>${esc(x.producto)}</b> — ${esc(x.por_que)}</li>`).join("")}</ul></div>` : ""}
    </details>`;
}

// Textos listos para pegar: con tus precios reales
function textosComplementos(k) {
  if (comp.textosIA?.texto) return comp.textosIA.texto;
  const precio = k.ticketBase;
  const lineas = [];
  const activos = k.complementos.filter(c => c.activo !== false);
  const check = activos.filter(c => c.donde === "checkout");
  if (check.length) {
    lineas.push("— EN EL FORMULARIO (casillas de 1 clic) —");
    for (const c of check) {
      if (c.tipo === "unidad") lineas.push(`✅ ${c.nombre} por solo ${fmt(c.precio)} (ahorras ${fmt(Math.max(0, precio - c.precio))}) · llega en el mismo paquete`);
      else if (c.tipo === "proteccion") lineas.push(`🛡️ ${c.nombre} +${fmt(c.precio)}: si tu paquete se pierde o llega dañado, te lo reenviamos sin costo`);
      else if (c.tipo === "garantia") lineas.push(`⭐ ${c.nombre} +${fmt(c.precio)}: si algo falla, te lo cambiamos`);
      else lineas.push(`➕ Añade ${c.nombre} por ${fmt(c.precio)}`);
    }
  }
  for (const c of activos.filter(x => x.donde === "postcompra")) {
    lineas.push("", "— OFERTA DESPUÉS DE COMPRAR (ventana de 1 clic) —",
      `Título: ${c.nombre}`,
      `Texto: Antes ${fmt(precio)} · Ahora ${fmt(c.precio)}. Llega en el mismo paquete y lo pagas al recibir.`,
      `Botón sí: Sí, añadir por ${fmt(c.precio)}`,
      `Botón no: No, gracias`);
  }
  return lineas.join("\n") || "Activa al menos un complemento.";
}

const reCalc = () => { comp.textosIA = null; calCalcular(); };
window.calComp = (i, campo, valor) => {
  const c = comp.lista[i]; if (!c) return;
  comp.personalizado = true;
  c[campo] = campo === "activo" ? !!valor : campo === "nombre" ? String(valor).slice(0, 80) : Math.max(0, Number(valor) || 0);
  if (campo === "toma") c.toma = Math.min(100, c.toma);
  reCalc();
};
window.calCompQuitar = (i) => { comp.personalizado = true; comp.lista.splice(i, 1); reCalc(); };
window.calCompAgregar = () => {
  const tipo = $("calCompTipo")?.value || "complemento";
  const r = ultimo || {}; const d = leerDatos();
  const base = complementosPorDefecto({ pais: pais(), precio: r.redondeado, proveedor: d.proveedor, flete: d.flete }).find(x => x.tipo === tipo);
  comp.personalizado = true;
  comp.lista.push(base ? { ...base, id: `${tipo}-${Date.now()}`, activo: true }
    : { id: `c-${Date.now()}`, tipo, activo: true, nombre: tipoNombre(tipo), precio: precioExtra((r.redondeado || 0) * 0.5, pais()), costo: 0, toma: TIPOS_COMPLEMENTO[tipo]?.toma || 10 });
  reCalc();
};
window.calCompRestablecer = () => { comp.personalizado = false; comp.lista = []; reCalc(); };
window.calCompCopiar = async () => {
  const t = $("calCompTxt")?.textContent || "";
  try { await navigator.clipboard.writeText(t); avisar("Textos copiados ✓"); } catch { avisar("No se pudo copiar", "error"); }
};
window.calCompIA = () => conBoton("calBtnCompIA", "Pensando...", async () => {
  const prod = productos.find(p => String(p._id) === String($("calProducto")?.value));
  const r = await api("POST", "/api/costeos/complementos-ia", {
    pais: pais(), producto: prod?.nombre || $("calNombre")?.value || "", descripcion: prod?.descripcion || prod?.notas || "",
    precio: ultimo?.redondeado, complementos: comp.lista.filter(c => c.activo !== false).map(c => ({ tipo: c.tipo, nombre: c.nombre, precio: c.precio }))
  });
  comp.textosIA = r;
  calCalcular();
  avisar("Textos mejorados ✓");
});

// ¿Los paquetes llevan envío gratis? (se recuerda en este navegador)
function envioPacks() {
  try { return localStorage.getItem("cal_envio_packs") !== "0"; } catch { return true; }
}
window.calEnvioPacks = (v) => { try { localStorage.setItem("cal_envio_packs", v ? "1" : "0"); } catch {} calCalcular(); };

// Texto de paquetes para la Ficha (lo leen los prompts tal cual)
function textoPaquetes(r, p, precioAntes) {
  const envio = envioPacks();
  const uno = `1 unidad ${formatear(r.redondeado, p)}${precioAntes > r.redondeado ? ` (antes ${formatear(precioAntes, p)})` : ""}`;
  const packs = r.paquetes.map((x, i) => {
    const antes = x.unidades * x.normal;
    const extras = [`antes ${formatear(antes, p)}`, `ahorras ${formatear(antes - x.precio, p)}`];
    if (envio) extras.push("envío gratis");
    if (i === 0) extras.push("MÁS VENDIDO");
    return `${x.unidades} unidades ${formatear(x.precio, p)} (${extras.join(", ")})`;
  });
  return [uno, ...packs].join("; ");
}

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

// ---------- Tus números reales de Dropi (Finanzas): cancelados, devoluciones y flete ----------
const tasas = new Map();   // "CO|dropiId" → respuesta | "cargando" | { error }
function pintarReal() {
  const el = $("calReal");
  if (!el) return;
  const prod = productos.find(p => String(p._id) === String($("calProducto")?.value || ""));
  const k = `${pais()}|${prod?.dropiId || ""}`;
  const t = tasas.get(k);
  if (!t) {
    tasas.set(k, "cargando");
    api("GET", `/api/finanzas/tasas?pais=${pais()}&dropiId=${encodeURIComponent(prod?.dropiId || "")}`)
      .then(r => { tasas.set(k, r); pintarReal(); calCalcular(); })
      .catch(e => { tasas.set(k, { error: e.message }); pintarReal(); });
    el.innerHTML = `<small class="cal-hint">Buscando tus números reales de Dropi…</small>`;
    return;
  }
  if (t === "cargando") return;
  if (t.error || !t.tienda?.pedidos) { el.innerHTML = t.error ? "" : `<small class="cal-hint">Sube tu Excel de Dropi en Finanzas y aquí verás tu % real de cancelados y devoluciones.</small>`; return; }
  const pct = (v) => (v === null ? "—" : `${Math.round(v)}%`);
  const fila = (x, titulo, cual) => !x?.pedidos ? "" : `
    <div class="cal-real-fila">
      <span><b>${titulo}</b> · ${x.pedidos} pedidos</span>
      <span>Cancelados <b>${pct(x.canceladosPct)}</b> · Devoluciones <b>${pct(x.devolucionesPct)}</b>${x.cerrados ? ` <small>(de ${x.cerrados} cerrados)</small>` : ""}${x.flete ? ` · Flete <b>${formatear(x.flete, pais())}</b>` : ""}</span>
      ${x.cerrados < 20 ? `<small class="cal-real-ojo">Pocos pedidos cerrados: tómalo con cuidado.</small>` : ""}
      <button type="button" class="cal-btn ghost chico" onclick="calUsarReal('${cual}')">Usar estos</button>
    </div>`;
  el.innerHTML = `<p class="cal-real-tit">📊 Tus números reales en Dropi</p>
    ${prod?.dropiId ? (t.producto ? fila(t.producto, "Este producto", "producto") : `<small class="cal-hint">Este producto (Dropi ${esc(prod.dropiId)}) todavía no tiene pedidos en tus Excel.</small>`) : ""}
    ${fila(t.tienda, "Toda la tienda", "tienda")}
    ${prod?.dropiId && t.producto ? consejoPaquetes(t.producto.unidades) : ""}`;
}
// ¿Lo testeo? Nota del producto con tu CPA real, tu devolución real y la próxima temporada
function bloqueLoTesteo(r, d) {
  const prod = productos.find(p => String(p._id) === String($("calProducto")?.value || ""));
  const t = tasas.get(`${pais()}|${prod?.dropiId || ""}`);
  const real = t && typeof t === "object" && !t.error ? t : null;
  const hoy = new Date(Date.now() - 5 * 36e5).toISOString().slice(0, 10);
  const e = evaluarProducto(r, {
    cpaReal: real?.cpa30?.cpa || null, proveedor: Number(d.proveedor) || 0, pais: pais(),
    devolucion: real?.producto?.devolucionesPct ?? null, cerrados: real?.producto?.cerrados || 0,
    temporada: proximasTemporadas(pais(), hoy, 4).find(x => x.faltan >= 10) || null   // a menos de 10 días ya no da tiempo de testear
  });
  if (!e) return "";
  const icono = { dale: "🟢", cuidado: "🟡", no: "🔴" }[e.veredicto];
  return `
    <div class="cal-testeo ${e.veredicto}">
      <h3>${icono} ¿Lo testeo? <b>${e.titulo}</b></h3>
      <ul>${e.puntos.map(p => `<li class="${p.signo > 0 ? "si" : p.signo < 0 ? "no" : ""}">${p.signo > 0 ? "✓" : p.signo < 0 ? "✗" : "•"} ${esc(p.texto)}</li>`).join("")}</ul>
      ${e.presupuesto && e.veredicto !== "no" ? `<p>Presupuesto de testeo: hasta <b>${formatear(e.presupuesto, pais())}</b> en pauta (2 veces el CPA máximo). Si en 1 CPA máximo no vende nada, apágalo.</p>` : ""}
      ${e.veredicto === "no" ? `<p>Para que valga la pena: sube el precio, busca mejor costo de proveedor o baja tus devoluciones. Prueba otro precio arriba y mira cómo cambia.</p>` : ""}
      ${real?.cpa30 ? `<small>Tu CPA real: ${formatear(real.cpa30.cpa, pais())} por pedido (${real.cpa30.pedidos} pedidos y ${formatear(real.cpa30.gasto, pais())} de pauta del ${real.cpa30.desde.split("-").reverse().join("/")} al ${real.cpa30.hasta.split("-").reverse().join("/")}).</small>` : ""}
    </div>`;
}

// ¿Vale la pena un paquete? Con lo que ya piden tus clientes de este producto
function consejoPaquetes(u) {
  if (!u?.pedidos) return "";
  const pct = (v) => `${Math.round(v)}%`;
  const varios = u.variosPct ?? 0;
  const entregaPeor = u.entregaUno !== null && u.entregaVarios !== null && u.entregaVarios < u.entregaUno - 10;
  const veredicto = u.pedidos < 15 ? ["gris", `Con ${u.pedidos} pedidos todavía es pronto para saberlo.`]
    : varios >= 15 ? ["verde", `Ya el ${pct(varios)} de tus clientes lleva 2 o más: arma un paquete de ${u.tresMas >= u.dos / 2 ? "2 y otro de 3" : "2"} con un descuento que se note (abajo en Paquetes).`]
    : varios >= 5 ? ["azul", `El ${pct(varios)} lleva 2 o más: prueba un paquete de 2 con buen descuento para subir el ticket.`]
    : ["gris", `Casi todos llevan 1 (${pct(100 - varios)}). Un paquete puede ayudar, pero empieza con un regalo o un "lleva 2" fuerte.`];
  return `
    <div class="cal-real-fila cal-real-paq ${veredicto[0]}">
      <span><b>¿Paquetes?</b> De ${u.pedidos} pedidos de este producto: <b>${u.uno}</b> con 1 unidad · <b>${u.dos}</b> con 2 · <b>${u.tresMas}</b> con 3 o más${u.promedio ? ` · promedio ${u.promedio.toFixed(2)} por pedido` : ""}.</span>
      <span>${veredicto[1]}</span>
      ${u.entregaVarios !== null ? `<small class="${entregaPeor ? "cal-real-ojo" : "cal-hint"}">Los de 2 o más se entregan el ${pct(u.entregaVarios)}${u.entregaUno !== null ? ` (los de 1, el ${pct(u.entregaUno)})` : ""}.${entregaPeor ? " Se devuelven más: confirma bien esos pedidos." : ""}</small>` : ""}
    </div>`;
}

window.calUsarReal = (cual) => {
  const prod = productos.find(p => String(p._id) === String($("calProducto")?.value || ""));
  const x = tasas.get(`${pais()}|${prod?.dropiId || ""}`)?.[cual];
  if (!x) return;
  const set = (id, v) => { const el = $(id); if (el && v !== null && v !== undefined) el.value = v; };
  // hacia arriba: mejor que el precio aguante una semana mala
  if (x.canceladosPct !== null) set("calCancelados", Math.min(60, Math.ceil(x.canceladosPct)));
  if (x.devolucionesPct !== null) set("calDevoluciones", Math.min(60, Math.ceil(x.devolucionesPct)));
  if (x.flete) set("calFlete", Math.round(x.flete));
  calCalcular();
};

function infoProducto() {
  const id = $("calProducto")?.value;
  const info = $("calInfoProducto");
  const c = costeos.find(x => String(x.productoId) === String(id));
  if (info) info.textContent = !id ? "" : c ? `Costeo guardado el ${new Date(c.actualizado).toLocaleDateString("es-CO")} — lo cargamos.` : "Sin costeo guardado todavía.";
  pintarReal();
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
    datos: { ...leerDatos(), complementos: comp.lista },
    resumen: {
      precio: r.precio, redondeado: r.redondeado, precioAntes: r.precioAntes,
      utilidad: r.utilidad, utilidadPct: r.utilidadPct, bep: r.bep, costosTotales: r.costosTotales,
      paquetes: r.paquetes,
      ...(ultimoComp ? { gananciaCliente: ultimoComp.conTodo, ticketPromedio: ultimoComp.ticketPromedio } : {})
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

  // "antes" calculado desde el precio que publicas, para que el % de descuento cuadre
  const precioAntes = redondear(r.redondeado / (1 - (Number($("calDescuento")?.value) || 0) / 100), p);
  const ficha = {
    ...(actual.ficha || {}),
    precio: r.redondeado,
    precioAntes,
    paquetes: textoPaquetes(r, p, precioAntes),
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
  pintarReal();
  calCalcular();
});
