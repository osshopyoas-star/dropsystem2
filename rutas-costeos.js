// =============================================
// 🧮 COSTEOS GUARDADOS (Calculadora)
// Un costeo por producto de la Base (o libre, sin producto).
// =============================================
import mongoose from "mongoose";
import { TIPOS_COMPLEMENTO, formatear } from "./public/js/core/costeo.js";

const Mixed = mongoose.Schema.Types.Mixed;

const costeoSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", index: true },
  nombre: { type: String, default: "" },
  pais: { type: String, enum: ["CO", "EC"], default: "CO" },
  datos: { type: Mixed, default: {} },      // lo que escribiste: proveedor, flete, % cancelados, etc.
  resumen: { type: Mixed, default: {} },    // precio, redondeado, antes, utilidad %, paquetes
  actualizado: { type: Date, default: Date.now }
});

export const Costeo = mongoose.model("Costeo", costeoSchema);

const CAMPOS_DATOS = ["proveedor", "flete", "cancelados", "devoluciones", "admin", "fulfillment", "cpa", "utilidad", "descuento", "precio"];

export function limpiarComplementos(lista) {
  if (!Array.isArray(lista)) return undefined;
  const n = (v, max) => { const x = Number(v); return Number.isFinite(x) && x >= 0 ? Math.min(x, max) : 0; };
  return lista.slice(0, 12).filter(c => c && TIPOS_COMPLEMENTO[c.tipo]).map(c => ({
    id: String(c.id || c.tipo).slice(0, 40), tipo: c.tipo, activo: c.activo !== false,
    nombre: String(c.nombre || "").slice(0, 80), precio: n(c.precio, 1e9), costo: n(c.costo, 1e9), toma: n(c.toma, 100)
  }));
}

function limpiarDatos(d = {}) {
  const out = {};
  for (const k of CAMPOS_DATOS) {
    if (d[k] === "" || d[k] === null || d[k] === undefined) continue;
    const n = Number(d[k]);
    if (Number.isFinite(n) && n >= 0) out[k] = n;
  }
  const comp = limpiarComplementos(d.complementos);
  if (comp && comp.length) out.complementos = comp;
  return out;
}

function limpiarResumen(r = {}) {
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  return {
    precio: n(r.precio), redondeado: n(r.redondeado), precioAntes: n(r.precioAntes),
    utilidad: n(r.utilidad), utilidadPct: n(r.utilidadPct), bep: n(r.bep), costosTotales: n(r.costosTotales),
    gananciaCliente: n(r.gananciaCliente), ticketPromedio: n(r.ticketPromedio),
    paquetes: Array.isArray(r.paquetes)
      ? r.paquetes.slice(0, 3).map(p => ({ unidades: n(p.unidades), precio: n(p.precio), unitario: n(p.unitario), utilidadPct: n(p.utilidadPct) }))
      : []
  };
}

export function registrarRutasCosteos(app, { idValido, Producto, llamarIA, iaLimiter, parsearJSON }) {
  // IA: mejora los textos de Releasit y sugiere productos que combinan (con los precios que TÚ pusiste)
  app.post("/api/costeos/complementos-ia", ...(iaLimiter ? [iaLimiter] : []), async (req, res) => {
    try {
      if (!llamarIA) return res.status(503).json({ error: "La IA no está disponible" });
      const b = req.body || {};
      const pais = b.pais === "EC" ? "EC" : "CO";
      const producto = String(b.producto || "").slice(0, 200).trim();
      if (!producto) return res.status(400).json({ error: "Elige el producto o escribe su nombre" });
      const precio = Number(b.precio) || 0;
      const comp = limpiarComplementos(b.complementos) || [];
      const lista = comp.map(c => `- ${TIPOS_COMPLEMENTO[c.tipo].nombre}: "${c.nombre}" a ${formatear(c.precio, pais)}`).join("\n") || "(ninguno)";
      const prompt = `Producto: ${producto}
${String(b.descripcion || "").slice(0, 800)}
País: ${pais === "EC" ? "Ecuador (dólares)" : "Colombia (pesos)"} · Pago contra entrega · Precio del producto: ${formatear(precio, pais)}

COMPLEMENTOS QUE VA A OFRECER (precios fijos, NO los cambies):
${lista}

TAREA:
1. "texto": los textos listos para pegar en el formulario de Releasit, en este formato de texto plano:
— EN EL FORMULARIO (casillas de 1 clic) —
(una línea por cada complemento del formulario: emoji + beneficio concreto + precio exacto. Máximo 90 caracteres por línea)

— OFERTA DESPUÉS DE COMPRAR (ventana de 1 clic) —   (solo si hay oferta después de comprar)
Título: (máximo 6 palabras)
Texto: (1 o 2 frases: "Antes X · Ahora Y", que llega en el mismo paquete y se paga al recibir)
Botón sí: Sí, añadir por (precio)
Botón no: No, gracias
2. "ideas": 3 productos complementarios REALES y baratos que tenga sentido ofrecer con este producto (que se usen juntos o mejoren el resultado), cada uno con una frase de por qué.

Reglas: español natural de ${pais === "EC" ? "Ecuador" : "Colombia"} con TÚ, usa EXACTAMENTE los precios dados, sin urgencia falsa, sin inventar reseñas ni cifras, sin promesas médicas. La protección de envío es: si se pierde o llega dañado se reenvía sin costo.

Responde SOLO este JSON válido:
{ "texto": "", "ideas": [ { "producto": "", "por_que": "" } ] }`;
      const reply = await llamarIA({ prompt, system: "Eres experto en aumentar el ticket promedio en tiendas de dropshipping con pago contra entrega. Respondes en español latino." });
      const j = parsearJSON ? parsearJSON(reply) : JSON.parse(reply);
      res.json({
        texto: String(j.texto || "").slice(0, 3000),
        ideas: (Array.isArray(j.ideas) ? j.ideas : []).slice(0, 5).map(x => ({ producto: String(x?.producto || "").slice(0, 120), por_que: String(x?.por_que || "").slice(0, 240) })).filter(x => x.producto)
      });
    } catch (err) {
      console.error("Error IA complementos:", err);
      res.status(err.status || 500).json({ error: err.message || "No se pudieron mejorar los textos" });
    }
  });


  app.get("/api/costeos", async (req, res) => {
    try {
      const filtro = { owner: req.user.uid };
      if (req.query.productoId && idValido(req.query.productoId)) filtro.productoId = req.query.productoId;
      if (req.query.pais === "CO" || req.query.pais === "EC") filtro.pais = req.query.pais;
      const lista = await Costeo.find(filtro).sort({ actualizado: -1 }).limit(200);
      res.json(lista);
    } catch (err) {
      console.error("Error listando costeos:", err);
      res.status(500).json({ error: "No se pudieron cargar los costeos" });
    }
  });

  // Guarda: si es de un producto, actualiza su costeo (uno por producto)
  app.post("/api/costeos", async (req, res) => {
    try {
      const body = req.body || {};
      const pais = body.pais === "EC" ? "EC" : "CO";
      let nombre = String(body.nombre || "").slice(0, 200).trim();
      let productoId = null;

      if (body.productoId) {
        if (!idValido(body.productoId)) return res.status(400).json({ error: "Producto inválido" });
        const prod = await Producto.findOne({ _id: body.productoId, owner: req.user.uid });
        if (!prod) return res.status(404).json({ error: "Producto no encontrado" });
        productoId = prod._id;
        nombre = nombre || prod.nombre || "";
      }
      if (!nombre) return res.status(400).json({ error: "Escribe el nombre del producto o elígelo de la Base" });

      const cambios = { nombre, pais, datos: limpiarDatos(body.datos), resumen: limpiarResumen(body.resumen), actualizado: new Date() };

      let c = productoId ? await Costeo.findOne({ owner: req.user.uid, productoId }) : null;
      if (!c && body.id && idValido(body.id)) c = await Costeo.findOne({ owner: req.user.uid, _id: body.id });

      if (c) {
        Object.assign(c, cambios);
        c.markModified("datos"); c.markModified("resumen");
        await c.save();
      } else {
        c = await Costeo.create({ owner: req.user.uid, productoId, ...cambios });
      }
      res.json(c);
    } catch (err) {
      console.error("Error guardando costeo:", err);
      res.status(500).json({ error: "No se pudo guardar el costeo" });
    }
  });

  app.delete("/api/costeos/:id", async (req, res) => {
    if (!idValido(req.params.id)) return res.status(400).json({ error: "ID inválido" });
    const r = await Costeo.findOneAndDelete({ _id: req.params.id, owner: req.user.uid });
    if (!r) return res.status(404).json({ error: "Costeo no encontrado" });
    res.json({ ok: true });
  });
}
