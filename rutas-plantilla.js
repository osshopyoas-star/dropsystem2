// =============================================
// 🧩 MI PLANTILLA — cómo nacen las landings nuevas
// Una plantilla por usuario, con una parte para cada formato (ban page y landing normal)
// =============================================
import mongoose from "mongoose";
import { normalizarPlantilla } from "./public/js/core/plantilla.js";

const Mixed = mongoose.Schema.Types.Mixed;

const plantillaSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true, unique: true },
  ban: { type: Mixed, default: {} },
  normal: { type: Mixed, default: {} },
  actualizado: { type: Date, default: Date.now }
});

export const Plantilla = mongoose.model("Plantilla", plantillaSchema);

const FORMATOS = ["ban", "normal"];

// Plantilla lista para usar en los prompts (con los valores de siempre si no hay nada guardado)
export async function obtenerPlantilla(owner, formato) {
  const f = formato === "normal" ? "normal" : "ban";
  try {
    const doc = await Plantilla.findOne({ owner }).lean();
    return normalizarPlantilla(f, doc?.[f]);
  } catch (err) {
    console.error("Error leyendo plantilla:", err);
    return normalizarPlantilla(f, {});
  }
}

export function registrarRutasPlantilla(app) {
  app.get("/api/plantilla", async (req, res) => {
    try {
      const doc = await Plantilla.findOne({ owner: req.user.uid }).lean();
      res.json({
        ban: normalizarPlantilla("ban", doc?.ban),
        normal: normalizarPlantilla("normal", doc?.normal),
        actualizado: doc?.actualizado || null
      });
    } catch (err) {
      console.error("Error cargando plantilla:", err);
      res.status(500).json({ error: "No se pudo cargar la plantilla" });
    }
  });

  app.put("/api/plantilla/:formato", async (req, res) => {
    try {
      const f = String(req.params.formato);
      if (!FORMATOS.includes(f)) return res.status(400).json({ error: "Formato inválido" });
      const limpia = normalizarPlantilla(f, req.body);
      const doc = await Plantilla.findOneAndUpdate(
        { owner: req.user.uid },
        { $set: { [f]: limpia, actualizado: new Date() }, $setOnInsert: { owner: req.user.uid } },
        { new: true, upsert: true }
      ).lean();
      res.json({ [f]: normalizarPlantilla(f, doc?.[f]), actualizado: doc?.actualizado });
    } catch (err) {
      console.error("Error guardando plantilla:", err);
      res.status(500).json({ error: "No se pudo guardar la plantilla" });
    }
  });
}
