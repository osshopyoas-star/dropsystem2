// =============================================
// 🔌 INTEGRACIONES — Meta Ads (solo lectura), Shopify (publicar landings como borrador); Dropi después
// =============================================
import { registrarRuta } from "./navegacion.js";
import { escapeHTML } from "../core/utils.js";
import { SECCION_LIQUID } from "../core/seccion-shopify.js";

const $ = (id) => document.getElementById(id);
const esc = (v) => escapeHTML(v ?? "");
const iconos = () => { if (window.lucide) lucide.createIcons(); };

let meta = null;          // estado de la conexión
let elegidas = new Set(); // cuentas marcadas (sin guardar todavía)
let gasto = null;         // últimos días de gasto

const MENSAJES = {
  ok: ["Meta Ads conectado ✓", "ok"],
  cancelado: ["Cancelaste el permiso en Facebook. No se conectó nada.", "error"],
  invalido: ["La conexión venció o no era válida. Vuelve a darle a Conectar.", "error"],
  error: ["Meta no respondió bien. Intenta de nuevo en un momento.", "error"],
  "sin-configurar": ["Falta poner los datos de la app de Meta en Render.", "error"]
};

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
  el._t = setTimeout(() => el.classList.remove("show"), tipo === "error" ? 5000 : 1800);
}

async function conCarga(id, texto, fn) {
  const b = $(id); const orig = b?.innerHTML;
  if (b) { b.disabled = true; b.innerHTML = `<span class="est-spin oscuro"></span> ${texto}`; }
  try { await fn(); }
  catch (err) { avisar(err.message, "error"); }
  finally { if (b && document.body.contains(b)) { b.disabled = false; b.innerHTML = orig; iconos(); } }
}

const fechaCorta = (iso) => iso ? new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "";
const diasPara = (iso) => iso ? Math.ceil((new Date(iso) - Date.now()) / 864e5) : null;
const dinero = (v, moneda) => {
  const n = Number(v) || 0;
  return moneda === "COP" ? "$" + Math.round(n).toLocaleString("es-CO") : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (moneda && moneda !== "USD" ? ` ${moneda}` : "");
};

function render() {
  const view = $("view");
  if (!view) return;
  view.innerHTML = `
  <div class="in-page">
    <header class="in-head">
      <h1>Integraciones</h1>
      <p>Conecta tus herramientas a CoDropX. Meta es de <b>solo lectura</b> (nunca cambia tus campañas). En Shopify, CoDropX solo crea productos en <b>borrador</b>: nada sale a tu tienda hasta que tú lo actives.</p>
    </header>
    ${tarjetaMeta()}
    ${tarjetaShopify()}
    <section class="in-card in-pronto">
      <div class="in-card-head">
        <span class="in-logo dropi">D</span>
        <div><small>DROPI</small><p>Trae tus órdenes para el Control Diario y tus % reales de cancelación y devolución.</p></div>
        <span class="in-badge">Próximamente</span>
      </div>
    </section>

  </div>`;
  iconos();
}

function tarjetaMeta() {
  const m = meta || {};
  const cabeza = `
    <div class="in-card-head">
      <span class="in-logo meta">∞</span>
      <div><small>META ADS</small><p>Conecta tu cuenta para traer el gasto de tus anuncios automáticamente.</p></div>
      ${m.conectado ? `<span class="in-badge ok">${(m.cuentas || []).length} cuentas</span>` : ""}
    </div>`;

  if (!m.configurado) {
    return `<section class="in-card">${cabeza}
      <div class="in-alerta">Falta terminar la configuración: pon en Render las variables <code>META_APP_ID</code>, <code>META_APP_SECRET</code> y <code>META_CONFIG_ID</code> y vuelve a cargar la página.</div>
    </section>`;
  }

  if (!m.conectado) {
    return `<section class="in-card">${cabeza}
      <ul class="in-puntos">
        <li><i data-lucide="shield-check"></i> Entras en la página oficial de Facebook: tu contraseña nunca pasa por CoDropX.</li>
        <li><i data-lucide="eye"></i> Permiso de solo lectura (<code>ads_read</code>): ve gasto y resultados, no puede crear, cambiar ni pausar nada.</li>
        <li><i data-lucide="unplug"></i> Lo quitas cuando quieras con "Desconectar".</li>
      </ul>
      <a class="in-btn meta" href="/api/meta/conectar"><span>∞</span> Conectar con Facebook</a>
    </section>`;
  }

  const vence = diasPara(m.expira);
  return `<section class="in-card">${cabeza}
    <p class="in-sub">Conectado como <b>${esc(m.nombre)}</b> desde el ${esc(fechaCorta(m.conectadoEl))}.
      ${vence !== null ? (vence <= 7
        ? `<span class="in-aviso">La conexión vence en ${Math.max(vence, 0)} día(s): dale a "Volver a conectar".</span>`
        : `Vence el ${esc(fechaCorta(m.expira))} (Meta pide reconectar cada ~60 días).`) : ""}</p>

    <p class="in-sub">Cuentas de anuncios disponibles. Marca las que usarás en CoDropX:</p>
    <div class="in-cuentas">
      ${(m.cuentas || []).length ? m.cuentas.map(c => `
        <label class="in-cuenta ${c.activa ? "" : "inactiva"}">
          <input type="checkbox" ${elegidas.has(c.account_id) ? "checked" : ""} onchange="inMarcar('${esc(c.account_id)}', this.checked)">
          <span class="in-ini">${esc((c.name || "?").trim().charAt(0).toUpperCase())}</span>
          <span class="in-nombre"><b>${esc(c.name)}</b><small>${esc(c.business || "")}</small></span>
          <span class="in-mon">${esc(c.currency)}</span>
          <span class="in-id">${esc(c.account_id)}</span>
          <span class="in-estado ${c.activa ? "ok" : ""}">${esc(c.status)}</span>
        </label>`).join("") : `<p class="in-sub">No encontramos cuentas publicitarias en esta conexión. Revisa que al conectar hayas marcado tus cuentas.</p>`}
    </div>

    <div class="in-acciones">
      <button id="inBtnGuardar" class="in-btn" onclick="inGuardar()"><i data-lucide="save"></i> Guardar selección (${elegidas.size})</button>
      <button id="inBtnGasto" class="in-btn claro" onclick="inGasto()"><i data-lucide="bar-chart-3"></i> Ver gasto últimos 7 días</button>
      <button id="inBtnActualizar" class="in-btn claro" onclick="inActualizar()"><i data-lucide="refresh-cw"></i> Actualizar cuentas</button>
      <a class="in-btn claro" href="/api/meta/conectar"><i data-lucide="link"></i> Volver a conectar</a>
      <button id="inBtnDesconectar" class="in-btn peligro" onclick="inDesconectar()"><i data-lucide="unplug"></i> Desconectar</button>
    </div>
    ${tablaGasto()}
  </section>`;
}

// ---------- Shopify ----------
let shopify = null;        // { tiendas, permisos }
let shFormAbierto = false;

function tarjetaShopify() {
  const sh = shopify || { tiendas: [], permisos: ["write_products", "write_files"] };
  const tiendas = sh.tiendas || [];
  const cabeza = `
    <div class="in-card-head">
      <span class="in-logo shopify">S</span>
      <div><small>SHOPIFY</small><p>Publica tus landings en tus tiendas como borrador, con las imágenes, el precio y los textos.</p></div>
      ${tiendas.length ? `<span class="in-badge ok">${tiendas.length} tienda${tiendas.length === 1 ? "" : "s"}</span>` : ""}
    </div>`;
  const lista = tiendas.map(t => `
    <div class="in-tienda ${t.conectada ? "" : "mal"}">
      <span class="in-ini">${esc((t.nombre || t.shop).charAt(0).toUpperCase())}</span>
      <span class="in-nombre"><b>${esc(t.nombre || t.shop)}</b><small>${esc(t.dominio || t.shop + ".myshopify.com")}</small></span>
      <span class="in-mon">${esc(t.moneda)}</span>
      <select title="País de esta tienda" onchange="inShPais('${esc(t._id)}', this.value)">
        <option value="" ${!t.pais ? "selected" : ""}>País…</option>
        <option value="CO" ${t.pais === "CO" ? "selected" : ""}>Colombia</option>
        <option value="EC" ${t.pais === "EC" ? "selected" : ""}>Ecuador</option>
      </select>
      <span class="in-estado ${t.conectada && !t.faltanPermisos.length ? "ok" : ""}">${t.error ? "Con error" : t.faltanPermisos.length ? "Faltan permisos" : "Conectada"}</span>
      <button class="in-btn claro chico" id="inShProbar-${esc(t._id)}" onclick="inShProbar('${esc(t._id)}')"><i data-lucide="refresh-cw"></i> Probar</button>
      <button class="in-btn peligro chico" onclick="inShQuitar('${esc(t._id)}')"><i data-lucide="unplug"></i></button>
      ${t.error ? `<p class="in-aviso">${esc(t.error)}</p>` : t.faltanPermisos.length ? `<p class="in-aviso">Faltan permisos: ${t.faltanPermisos.map(esc).join(", ")}. Agrégalos en la app del Dev Dashboard, publica una versión nueva (Release) y apruébala en la tienda; luego dale a Probar.</p>` : ""}
    </div>`).join("");

  const form = (shFormAbierto || !tiendas.length) ? `
    <details class="in-guia" ${tiendas.length ? "" : "open"}>
      <summary>Cómo crear la app en Shopify (5 minutos, una vez por tienda)</summary>
      <ol>
        <li>En tu tienda: <b>Configuración → Apps → Desarrollar apps</b> → <b>Crear apps en el Dev Dashboard</b>.</li>
        <li><b>Create app</b> → <b>Start from Dev Dashboard</b> → nombre: <code>CoDropX</code> → Create.</li>
        <li>En <b>Versions</b>: App URL <code>https://codropx.com</code>, "Embed app in Shopify admin" apagado. En <b>Access scopes</b> pega: <code>${[...sh.permisos, "read_themes"].map(esc).join(",")}</code></li>
        <li><b>Release</b> (publica la versión) y luego <b>Install app</b> → elige tu tienda → aprueba.</li>
        <li>En <b>Settings</b> de la app copia el <b>Client ID</b> y el <b>Client secret</b> y pégalos aquí abajo.</li>
      </ol>
      <p class="in-sub">El secreto se guarda cifrado y nunca se vuelve a mostrar. CoDropX solo puede crear y editar productos y subir imágenes; los productos quedan en <b>borrador</b>.</p>
    </details>
    <div class="in-form">
      <label>Tienda<input id="inShShop" placeholder="mitienda.myshopify.com" autocomplete="off"></label>
      <label>Client ID<input id="inShId" autocomplete="off" spellcheck="false"></label>
      <label>Client secret<input id="inShSecreto" type="password" autocomplete="new-password" spellcheck="false"></label>
      <button id="inShConectar" class="in-btn" onclick="inShConectar()"><i data-lucide="plug"></i> Conectar tienda</button>
    </div>` : `<div class="in-acciones"><button class="in-btn claro" onclick="inShNueva()"><i data-lucide="plus"></i> Conectar otra tienda</button></div>`;

  return `<section class="in-card">${cabeza}${lista ? `<div class="in-tiendas">${lista}</div>` : ""}${form}${tiendas.length ? guiaSeccion() : ""}</section>`;
}

// Sección "CoDropX landing" para el tema (se instala una vez por tienda/tema)
function guiaSeccion() {
  return `
  <details class="in-guia">
    <summary>Poner tus landings en la plantilla del tema (una sola vez por tienda)</summary>
    <ol>
      <li>Si ya conectaste la tienda antes, agrega el permiso <code>read_themes</code> a tu app en el Dev Dashboard (Versions → Access scopes), dale <b>Release</b> y aprueba la actualización en la tienda. Luego aquí dale <b>Probar</b>.</li>
      <li>En Shopify: <b>Tienda online → Temas → … → Editar código</b>. En la carpeta <b>Sections</b> dale <b>Agregar nueva sección</b>, ponle de nombre <code>codropx-landing</code> y reemplaza todo lo que trae por el código de abajo. Guarda.</li>
      <li>En <b>Personalizar</b>, abre (o crea) la plantilla de producto que usas para tus ban pages. Agrega la sección <b>CoDropX landing</b> donde quieras que vayan las imágenes y alrededor pon tus botones y GIF. Guarda.</li>
      <li>En CoDropX, al publicar elige esa plantilla. Cada producto nuevo sale con sus imágenes en esa sección, en orden.</li>
    </ol>
    <div class="in-acciones">
      <button class="in-btn" onclick="inCopiarSeccion()"><i data-lucide="copy"></i> Copiar código de la sección</button>
      <button class="in-btn claro" onclick="inDescargarSeccion()"><i data-lucide="download"></i> Descargar codropx-landing.liquid</button>
    </div>
    <p class="in-sub">Las imágenes quedan guardadas en cada producto (metacampos <code>codropx</code>), así que puedes cambiar el diseño de la plantilla cuando quieras sin volver a publicar.</p>
  </details>`;
}

window.inCopiarSeccion = async () => {
  try { await navigator.clipboard.writeText(SECCION_LIQUID); avisar("Código copiado ✓"); }
  catch {
    const t = document.createElement("textarea"); t.value = SECCION_LIQUID; document.body.appendChild(t); t.select();
    document.execCommand("copy"); t.remove(); avisar("Código copiado ✓");
  }
};
window.inDescargarSeccion = () => {
  const url = URL.createObjectURL(new Blob([SECCION_LIQUID], { type: "text/plain" }));
  const a = document.createElement("a"); a.href = url; a.download = "codropx-landing.liquid"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

window.inShNueva = () => { shFormAbierto = true; render(); $("inShShop")?.focus(); };
window.inShConectar = () => conCarga("inShConectar", "Conectando...", async () => {
  const datos = { shop: $("inShShop").value, clientId: $("inShId").value, clientSecret: $("inShSecreto").value };
  const { tienda } = await api("POST", "/api/shopify/tiendas", datos);
  shopify.tiendas = [...shopify.tiendas.filter(t => t._id !== tienda._id), tienda];
  shFormAbierto = false;
  avisar(`${tienda.nombre || tienda.shop} conectada ✓`);
  render();
});
window.inShProbar = (id) => conCarga(`inShProbar-${id}`, "Probando...", async () => {
  try {
    const { tienda } = await api("POST", `/api/shopify/tiendas/${id}/probar`);
    shopify.tiendas = shopify.tiendas.map(t => t._id === id ? tienda : t);
    avisar(tienda.faltanPermisos.length ? "Conecta, pero faltan permisos" : "Conexión correcta ✓", tienda.faltanPermisos.length ? "error" : "ok");
  } finally {
    shopify = await api("GET", "/api/shopify/tiendas").catch(() => shopify);
    render();
  }
});
window.inShPais = async (id, pais) => {
  try {
    const { tienda } = await api("PUT", `/api/shopify/tiendas/${id}`, { pais });
    shopify.tiendas = shopify.tiendas.map(t => t._id === id ? tienda : t);
    avisar("Guardado ✓");
  } catch (err) { avisar(err.message, "error"); }
};
window.inShQuitar = async (id) => {
  const t = shopify.tiendas.find(x => x._id === id);
  if (!confirm(`¿Quitar "${t?.nombre || t?.shop}" de CoDropX? Los productos ya publicados siguen en tu tienda. Para quitarle el acceso del todo, desinstala la app en Shopify.`)) return;
  try {
    await api("DELETE", `/api/shopify/tiendas/${id}`);
    shopify.tiendas = shopify.tiendas.filter(x => x._id !== id);
    render();
  } catch (err) { avisar(err.message, "error"); }
};

function tablaGasto() {
  if (!gasto) return "";
  if (!gasto.cuentas.length) return `<p class="in-sub">Marca y guarda al menos una cuenta para ver su gasto.</p>`;
  return `<div class="in-gasto">
    ${gasto.cuentas.map(c => {
      const total = c.dias.reduce((a, d) => a + d.gasto, 0);
      const compras = c.dias.reduce((a, d) => a + d.compras, 0);
      return `<div class="in-gasto-cta">
        <div class="in-gasto-head"><b>${esc(c.cuenta)}</b>
          ${c.error ? `<span class="in-aviso">${esc(c.error)}</span>` : `<span>${dinero(total, c.moneda)} · ${compras} compras${compras ? ` · ${dinero(total / compras, c.moneda)} por compra` : ""}</span>`}
        </div>
        ${c.dias.length ? `<table><thead><tr><th>Día</th><th>Gasto</th><th>Compras</th><th>Clics</th></tr></thead><tbody>
          ${c.dias.map(d => `<tr><td>${esc(d.fecha)}</td><td>${dinero(d.gasto, c.moneda)}</td><td>${d.compras}</td><td>${d.clics}</td></tr>`).join("")}
        </tbody></table>` : (c.error ? "" : `<p class="in-sub">Sin gasto en estos días.</p>`)}
      </div>`;
    }).join("")}
    <p class="in-nota">"Compras" es lo que reporta el píxel (pedidos), no entregas. Las entregas reales vendrán de Dropi.</p>
  </div>`;
}

async function cargar() {
  const [m, sh] = await Promise.all([
    api("GET", "/api/meta/estado"),
    api("GET", "/api/shopify/tiendas").catch(() => ({ tiendas: [], permisos: ["write_products", "write_files"] }))
  ]);
  meta = m;
  shopify = sh;
  shFormAbierto = false;
  elegidas = new Set(meta.elegidas || []);
}

window.inMarcar = (id, v) => {
  if (v) elegidas.add(id); else elegidas.delete(id);
  const b = $("inBtnGuardar");
  if (b) b.innerHTML = `<i data-lucide="save"></i> Guardar selección (${elegidas.size})`;
  iconos();
};

window.inGuardar = () => conCarga("inBtnGuardar", "Guardando...", async () => {
  const r = await api("PUT", "/api/meta/cuentas", { elegidas: [...elegidas] });
  meta = { ...meta, ...r };
  elegidas = new Set(r.elegidas || []);
  gasto = null;
  avisar("Cuentas guardadas ✓");
  render();
});

window.inActualizar = () => conCarga("inBtnActualizar", "Leyendo cuentas...", async () => {
  const r = await api("POST", "/api/meta/actualizar");
  meta = { ...meta, ...r };
  elegidas = new Set(r.elegidas || []);
  avisar("Cuentas actualizadas ✓");
  render();
});

window.inGasto = () => conCarga("inBtnGasto", "Leyendo gasto...", async () => {
  gasto = await api("GET", "/api/meta/gasto?dias=7");
  render();
});

window.inDesconectar = async () => {
  if (!confirm("¿Desconectar Meta Ads? CoDropX deja de leer tus cuentas y se retira el permiso en Facebook.")) return;
  await conCarga("inBtnDesconectar", "Desconectando...", async () => {
    await api("DELETE", "/api/meta");
    gasto = null;
    await cargar();
    avisar("Meta Ads desconectado");
    render();
  });
};

registrarRuta("integraciones", async (view) => {
  window.marcarMenuActivo?.("integraciones");
  view.innerHTML = `<div class="in-page"><p class="est-muted">Cargando integraciones...</p></div>`;
  try {
    await cargar();
    gasto = null;
    render();
    const r = window.__metaResultado;
    if (r) {
      window.__metaResultado = null;
      const [texto, tipo] = MENSAJES[r] || ["Listo", "ok"];
      avisar(texto, tipo);
    }
  } catch (err) {
    view.innerHTML = `<div class="in-page"><p class="est-error">${esc(err.message)}</p></div>`;
  }
});
