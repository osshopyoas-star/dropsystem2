// =============================================
// 🧮 COSTEOS GUARDADOS (Calculadora)
// Un costeo por producto de la Base (o libre, sin producto).
// =============================================
import mongoose from "mongoose";

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

function limpiarDatos(d = {}) {
  const out = {};
  for (const k of CAMPOS_DATOS) {
    if (d[k] === "" || d[k] === null || d[k] === undefined) continue;
    const n = Number(d[k]);
    if (Number.isFinite(n) && n >= 0) out[k] = n;
  }
  return out;
}

function limpiarResumen(r = {}) {
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  return {
    precio: n(r.precio), redondeado: n(r.redondeado), precioAntes: n(r.precioAntes),
    utilidad: n(r.utilidad), utilidadPct: n(r.utilidadPct), bep: n(r.bep), costosTotales: n(r.costosTotales),
    paquetes: Array.isArray(r.paquetes)
      ? r.paquetes.slice(0, 3).map(p => ({ unidades: n(p.unidades), precio: n(p.precio), unitario: n(p.unitario), utilidadPct: n(p.utilidadPct) }))
      : []
  };
}

export function registrarRutasCosteos(app, { idValido, Producto }) {

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
