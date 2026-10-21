// =============================================
// Calculadora de precios y rentabilidad
// =============================================
import { setText } from "../core/utils.js";
import { registrarRuta } from "./navegacion.js";

function renderCalculadoraDashboard() {
  return `
    <div class="calcx-page">
      <section class="calcx-layout">

      <div class="calcx-sidebar">
          <div class="calcx-panel">
            <div class="calcx-panel-head">
              <div class="calcx-badge">
                <i data-lucide="calculator"></i>
                <span>Calculadora</span>
              </div>
              <h2>Panel de parámetros</h2>
              <p>Configura costos, pérdidas y margen objetivo.</p>
            </div>

            <div class="calcx-form">
              <label>Divisa</label>
              <select id="calcxMoneda" onchange="actualizarCalculadoraDashboard()">
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </select>

              <label>Valor de venta deseado</label>
              <input id="calcxPrecioVenta" type="number" value="99842" oninput="actualizarCalculadoraDashboard()">

              <label>Costo del producto</label>
              <input id="calcxPrecioProveedor" type="number" value="21000" oninput="actualizarCalculadoraDashboard()">

              <label>Flete base</label>
              <input id="calcxFleteBase" type="number" value="20000" oninput="actualizarCalculadoraDashboard()">

              <label>Fulfillment</label>
              <input id="calcxFulfillment" type="number" value="0" oninput="actualizarCalculadoraDashboard()">

              <label>Confirmación logística</label>
              <input id="calcxConfirmacion" type="number" value="0" oninput="actualizarCalculadoraDashboard()">

              <label>Costos administrativos</label>
              <input id="calcxAdmin" type="number" value="5000" oninput="actualizarCalculadoraDashboard()">
              <label>Impuestos (%)</label>
              <input id="calcxImpuestos" type="number" step="0.1" value="2" oninput="actualizarCalculadoraDashboard()">

              <label>Plataforma de pago</label>
              <select id="calcxPasarela" onchange="actualizarCalculadoraDashboard()">
                <option value="none">Sin comisión</option>
                <option value="payu">PayU</option>
                <option value="mercadopago">Mercado Pago</option>
                <option value="stripe">Stripe</option>
              </select>

              <label>% cancelaciones</label>
              <input id="calcxCancelados" type="number" step="0.1" value="10" oninput="actualizarCalculadoraDashboard()">

              <label>% devoluciones</label>
              <input id="calcxDevoluciones" type="number" step="0.1" value="20" oninput="actualizarCalculadoraDashboard()">

              <label>Margen objetivo</label>
              <input id="calcxMargenObjetivo" type="number" step="0.1" value="18" oninput="actualizarCalculadoraDashboard()">
            </div>
          </div>
      </div>

        <div class="calcx-main">
          <div class="calcx-top-grid">
            <div class="calcx-card principal">
              <span>Precio / utilidad / margen</span>
              <strong id="calcxOutPrecioVenta">$0</strong>

              <div class="calcx-triple">
                <div>
                  <small>Utilidad</small>
                  <b id="calcxOutUtilidad">$0</b>
                </div>
                <div>
                  <small>Margen</small>
                  <b id="calcxOutMargen">0%</b>
                </div>
              </div>
            </div>

            <div class="calcx-card amarillo">
              <span>Punto de equilibrio</span>
              <strong id="calcxOutBreakEven">$0</strong>
              <small>Precio mínimo para no perder</small>
            </div>

            <div class="calcx-card naranja">
              <span>Costo bruto total por venta</span>
              <strong id="calcxOutCostosTotales">$0</strong>
              <small>Incluye operación, pérdidas y pauta</small>
            </div>
          </div>

          <div class="calcx-grid">
            <div class="calcx-card">
              <span>Precio mínimo</span>
              <strong id="calcxOutPrecioMinimo">$0</strong>
              <small>Con margen mínimo de seguridad</small>
            </div>

            <div class="calcx-card">
              <span>Precio ideal</span>
              <strong id="calcxOutPrecioIdeal">$0</strong>
              <small>Basado en margen objetivo</small>
            </div>

            <div class="calcx-card">
              <span>Pauta máxima permitida</span>
              <strong id="calcxOutPautaMaxima">$0</strong>
              <small>Límite recomendado</small>
            </div>

            <div class="calcx-card">
              <span>Inversión en pauta efectiva</span>
              <strong id="calcxOutCPA">$0</strong>
              <small>20% del valor de venta</small>
            </div>

            <div class="calcx-card">
              <span>Pérdida por cancelaciones</span>
              <strong id="calcxOutPerdidaCancelados">$0</strong>
              <small>Impacto estimado</small>
            </div>

            <div class="calcx-card">
              <span>Pérdida por devoluciones</span>
              <strong id="calcxOutPerdidaDevoluciones">$0</strong>
              <small>Impacto estimado</small>
            </div>

            <div class="calcx-card">
              <span>Proyección ROAS</span>
              <strong id="calcxOutROAS">0.00</strong>
              <small>Venta / pauta efectiva</small>
            </div>

            <div class="calcx-card">
              <span>Proyección ROI</span>
              <strong id="calcxOutROI">0%</strong>
              <small>Utilidad / costo bruto total</small>
            </div>

            <div class="calcx-card full resumen">
              <span>Resumen ejecutivo</span>
              <p id="calcxResumen">Aquí verás el resumen calculado.</p>
            </div>
          </div>
        </div>

      </section>
    </div>
  `;
}

window.syncMonedaCalculadora = function() {
  const pais = document.getElementById("calcxPais")?.value || "CO";
  const moneda = document.getElementById("calcxMoneda");
  if (!moneda) return;
  moneda.value = pais === "CO" ? "COP" : "USD";
};

function formatMoneyCalcx(value, currency) {
  // Cuando los costos variables se comen todo el precio, no existe un precio posible
  if (typeof value === "number" && !Number.isFinite(value)) return "No alcanzable";

  const num = Number(value || 0);

  if (currency === "COP") {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(num);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

function getPasarelaConfig(tipo) {
  const map = {
    none: { pct: 0, fijo: 0, nombre: "Sin comisión" },
    payu: { pct: 0.044, fijo: 900, nombre: "PayU 4.4% + fijo" },
    mercadopago: { pct: 0.035, fijo: 0, nombre: "Mercado Pago 3.5%" },
    stripe: { pct: 0.029, fijo: 0.3, nombre: "Stripe 2.9% + fijo" }
  };

  return map[tipo] || map.none;
}

window.actualizarCalculadoraDashboard = function() {
  const moneda = document.getElementById("calcxMoneda")?.value || "COP";
const impuestosPct = Number(document.getElementById("calcxImpuestos")?.value || 0);
  const precioVentaFinal = Number(document.getElementById("calcxPrecioVenta")?.value || 0);
  const costoProducto = Number(document.getElementById("calcxPrecioProveedor")?.value || 0);
  const fleteBase = Number(document.getElementById("calcxFleteBase")?.value || 0);
  const fulfillment = Number(document.getElementById("calcxFulfillment")?.value || 0);
  const confirmacion = Number(document.getElementById("calcxConfirmacion")?.value || 0);
  const admin = Number(document.getElementById("calcxAdmin")?.value || 0);
  const cancelados = Number(document.getElementById("calcxCancelados")?.value || 0);
  const devoluciones = Number(document.getElementById("calcxDevoluciones")?.value || 0);
  const margenObjetivo = Number(document.getElementById("calcxMargenObjetivo")?.value || 0);
  const pasarelaTipo = document.getElementById("calcxPasarela")?.value || "none";

  const pasarela = getPasarelaConfig(pasarelaTipo);

  const efectividad = 1 - ((cancelados + devoluciones) / 100);
  const fleteAjustado = efectividad > 0 ? fleteBase / efectividad : 0;

  const cpa = precioVentaFinal * 0.20;
  const comisionPasarela = (precioVentaFinal * pasarela.pct) + pasarela.fijo;

  const perdidaCancelados = precioVentaFinal * (cancelados / 100) * 0.25;
  const perdidaDevoluciones = precioVentaFinal * (devoluciones / 100) * 0.12;

const subtotalCostos =
  costoProducto +
  fleteAjustado +
  fulfillment +
  confirmacion +
  admin +
  comisionPasarela +
  cpa +
  perdidaCancelados +
  perdidaDevoluciones;

// impuestos sobre el subtotal
const impuestos = subtotalCostos * (impuestosPct / 100);

const costosTotales = subtotalCostos + impuestos;

  const utilidad = precioVentaFinal - costosTotales;
  const margen = precioVentaFinal > 0 ? (utilidad / precioVentaFinal) * 100 : 0;

  // 🧮 Precios correctos: la pauta, la pasarela y las pérdidas crecen con el precio.
  // Costos fijos por venta (no dependen del precio):
  const costosFijos =
    costoProducto + fleteAjustado + fulfillment + confirmacion + admin + pasarela.fijo;

  // Fracción del precio que se va en costos variables:
  const tasaVariable =
    0.20 +                                 // pauta (CPA = 20% del precio)
    pasarela.pct +                         // comisión pasarela
    (cancelados / 100) * 0.25 +            // pérdida por cancelaciones
    (devoluciones / 100) * 0.12;           // pérdida por devoluciones

  const factorImp = 1 + (impuestosPct / 100);

  // Precio P tal que: P - (costosFijos + tasaVariable·P)·factorImp = margen·P
  const precioParaMargen = (margenPct) => {
    const denom = 1 - (margenPct / 100) - (tasaVariable * factorImp);
    return denom > 0 ? (costosFijos * factorImp) / denom : NaN;
  };

  const breakEven = precioParaMargen(0);
  const precioMinimo = precioParaMargen(10);
  const precioIdeal = precioParaMargen(margenObjetivo);

  const pautaMaxima = precioVentaFinal * 0.20;
  const roas = cpa > 0 ? precioVentaFinal / cpa : 0;
  const roi = costosTotales > 0 ? (utilidad / costosTotales) * 100 : 0;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("calcxOutPrecioVenta", formatMoneyCalcx(precioVentaFinal, moneda));
  setText("calcxOutUtilidad", formatMoneyCalcx(utilidad, moneda));
  setText("calcxOutMargen", `${margen.toFixed(1)}%`);
  setText("calcxOutBreakEven", formatMoneyCalcx(breakEven, moneda));
  setText("calcxOutCostosTotales", formatMoneyCalcx(costosTotales, moneda));
  setText("calcxOutPrecioMinimo", formatMoneyCalcx(precioMinimo, moneda));
  setText("calcxOutPrecioIdeal", formatMoneyCalcx(precioIdeal, moneda));
  setText("calcxOutPautaMaxima", formatMoneyCalcx(pautaMaxima, moneda));
  setText("calcxOutCPA", formatMoneyCalcx(cpa, moneda));
  setText("calcxOutPerdidaCancelados", formatMoneyCalcx(perdidaCancelados, moneda));
  setText("calcxOutPerdidaDevoluciones", formatMoneyCalcx(perdidaDevoluciones, moneda));
  setText("calcxOutROAS", roas.toFixed(2));
  setText("calcxOutROI", `${roi.toFixed(1)}%`);

  const resumen = document.getElementById("calcxResumen");
  if (resumen) {
    resumen.textContent =
      `Con un valor de venta deseado de ${formatMoneyCalcx(precioVentaFinal, moneda)}, ` +
      `el costo bruto total por venta es ${formatMoneyCalcx(costosTotales, moneda)}. ` +
      `La utilidad proyectada es ${formatMoneyCalcx(utilidad, moneda)} con un margen de ${margen.toFixed(1)}%. ` +
      `El precio ideal para lograr tu margen objetivo sería ${formatMoneyCalcx(precioIdeal, moneda)}.`;
  }

  const principalCard = document.querySelector(".calcx-card.principal");
  if (principalCard) {
    principalCard.classList.toggle("danger", utilidad < 0);
  }
};

// Ruta: calculadora
registrarRuta("calculadora", (view) => {
  view.innerHTML = renderCalculadoraDashboard();
  marcarMenuActivo("calculadora");

  setTimeout(() => {
    actualizarCalculadoraDashboard();
    if (window.lucide) lucide.createIcons();
  }, 0);

  return;
});

