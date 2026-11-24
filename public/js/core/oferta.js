// =============================================
// OFERTA: una sola fuente de verdad para los precios de la landing.
// Todos los textos de dinero los arma el código (la IA nunca escribe ni cambia un número).
// Lo usan la Ficha (vista previa) y los prompts (servidor).
// =============================================

export const TIPOS_OFERTA = [
  ["descuento", "Descuento normal"],
  ["2x1", "2x1 (compra 1 y lleva 2)"],
  ["xy", "Lleva X y paga Y (3x2…)"],
  ["paquetes", "Paquetes (1, 2, 3 unidades)"],
  ["regalo", "Regalo con la compra"]
];

export function plata(valor, pais = "CO") {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return "";
  return pais === "EC" ? "$" + n.toFixed(2).replace(".", ",") : "$" + Math.round(n).toLocaleString("es-CO").replace(/,/g, ".");
}
// "Cada uno en…": en Colombia de a $50, en Ecuador con centavos
const redondo = (v, pais) => (pais === "EC" ? Math.round(v * 100) / 100 : Math.round(v / 50) * 50);

// Montos que trae el texto libre de paquetes de antes ("2 unidades $199.900")
export function montosTexto(texto, pais = "CO") {
  const out = [];
  for (const m of String(texto || "").matchAll(/\$?\s?(\d{1,3}(?:[.,]\d{3})+|\d{4,7}|\d{1,3},\d{2})(?![\d%])/g)) {
    const c = m[1];
    const n = pais === "EC" && /^\d{1,3},\d{2}$/.test(c) ? Number(c.replace(",", ".")) : Number(c.replace(/[.,]/g, ""));
    if (pais === "EC" ? n > 0 && n < 10000 : n >= 1000) out.push(n);
  }
  return [...new Set(out)];
}

// Paquetes del texto libre de antes ("1 unidad $199.990; 2 unidades $339.990") → filas
export function paquetesDeTexto(texto, pais = "CO") {
  return String(texto || "").split(/[;\n]/).map(t => {
    const u = Number((t.match(/(\d+)\s*(unidad|und|uds|x\b)/i) || [])[1]);
    const precio = montosTexto(t, pais)[0];
    return u > 0 && precio ? { unidades: u, precio } : null;
  }).filter(Boolean).slice(0, 5);
}

/**
 * ficha: { precio, precioAntes, oferta: { tipo, x, y, paquetes: [{ unidades, precio, masVendido }], regalos: [{ nombre, foto }] }, paquetes (texto viejo) }
 * Devuelve los textos exactos, los montos permitidos y si hay algo que no cuadra.
 */
export function ofertaDe(ficha = {}, pais = "CO") {
  const o = ficha.oferta || {};
  const tipo = TIPOS_OFERTA.some(([k]) => k === o.tipo) ? o.tipo : "descuento";
  const P = Number(ficha.precio) || 0, A = Number(ficha.precioAntes) || 0;
  const pct = A > P && P > 0 ? Math.round((1 - P / A) * 100) : null;
  const f = (v) => plata(v, pais);
  const r = { tipo, unidades: 1, textos: {}, montos: [], sellos: [], paquetes: [], regalos: [], conflicto: null, resumen: "" };

  if (tipo === "2x1") {
    const cada = redondo(P / 2, pais);
    r.unidades = 2;
    r.textos = { promo: "¡2x1! COMPRA 1 Y LLEVA 2", precio: P ? `2 POR ${f(P)}` : "", cadaUno: P ? `Te sale cada uno en ${f(cada)}` : "", antes: A ? `Antes ${f(A)} c/u` : "", sello: "2x1" };
    r.montos = [P, cada, A];
    r.resumen = `2x1: el cliente paga ${f(P)} y se lleva 2 unidades (cada una le sale en ${f(cada)}${A ? `; antes ${f(A)} cada una` : ""}).`;
  } else if (tipo === "xy") {
    const X = Math.max(2, Math.min(10, Math.round(Number(o.x) || 3))), Y = Math.max(1, Math.min(X - 1, Math.round(Number(o.y) || 2)));
    const total = P * Y, cada = redondo(total / X, pais);
    r.unidades = X;
    r.textos = { promo: `LLEVA ${X} Y PAGA ${Y}`, precio: P ? `${X} POR ${f(total)}` : "", cadaUno: P ? `Cada uno en ${f(cada)}` : "", antes: A ? `Antes ${f(A)} c/u` : "", sello: `${X}x${Y}` };
    r.montos = [total, cada, P, A];
    r.resumen = `Lleva ${X} y paga ${Y}: ${X} unidades por ${f(total)} (cada una en ${f(cada)}; una sola vale ${f(P)}).`;
  } else if (tipo === "paquetes") {
    const filas = (Array.isArray(o.paquetes) ? o.paquetes : []).map(x => ({ unidades: Math.round(Number(x?.unidades) || 0), precio: Number(x?.precio) || 0, masVendido: !!x?.masVendido }))
      .filter(x => x.unidades > 0 && x.precio > 0).sort((a, b) => a.unidades - b.unidades).slice(0, 5);
    const uno = filas.find(x => x.unidades === 1)?.precio || P;
    r.paquetes = filas.map(x => {
      const ahorro = uno && x.unidades > 1 ? uno * x.unidades - x.precio : 0;
      return { ...x, ahorro: ahorro > 0 ? ahorro : 0, texto: `${x.unidades} ${x.unidades === 1 ? "unidad" : "unidades"} ${f(x.precio)}${ahorro > 0 ? ` (ahorras ${f(ahorro)})` : ""}${x.masVendido ? " · MÁS VENDIDO" : ""}` };
    });
    r.textos = { precio: P ? f(P) : "", antes: A ? f(A) : "", sello: pct ? `-${pct}%` : "" };
    r.montos = [P, A, ...r.paquetes.flatMap(x => [x.precio, x.ahorro])];
    r.sellos = pct ? [`-${pct}%`] : [];
    r.resumen = r.paquetes.length ? `Paquetes: ${r.paquetes.map(x => x.texto).join("; ")}.` : "Paquetes: (aún no hay paquetes en la Ficha).";
  } else {
    r.textos = { precio: P ? f(P) : "", antes: A ? f(A) : "", sello: pct ? `-${pct}%` : "" };
    r.montos = [P, A];
    r.sellos = pct ? [`-${pct}%`] : [];
    if (tipo === "regalo") {
      r.regalos = (Array.isArray(o.regalos) ? o.regalos : []).map(x => ({ nombre: String(x?.nombre || "").replace(/[<>"]/g, "").trim().slice(0, 40), foto: /^data:image\/(jpeg|png|webp);base64,/.test(x?.foto || "") ? x.foto : "" })).filter(x => x.nombre).slice(0, 4);
      const n = r.regalos.length;
      r.textos.promo = n > 1 ? `+ ${n} REGALOS GRATIS` : "+ REGALO GRATIS";
      r.resumen = n ? `Regalo con la compra: ${r.regalos.map(x => x.nombre).join(", ")} (gratis, van incluidos).` : "Regalo con la compra: (aún no hay regalos en la Ficha).";
    } else r.resumen = P ? `Precio ${f(P)}${A ? `, antes ${f(A)}` : ""}${pct ? ` (-${pct}%)` : ""}.` : "";
  }
  r.montos = [...new Set(r.montos.filter(v => Number(v) > 0))].map(f);
  // El texto de paquetes de antes choca con una oferta nueva
  const viejo = String(ficha.paquetes || "").trim();
  if (tipo !== "descuento" && viejo && montosTexto(viejo, pais).length) r.conflicto = "La oferta y los paquetes no coinciden: ¿cuál uso?";
  return r;
}
