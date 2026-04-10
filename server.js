import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fetch from "node-fetch";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

// 🔥 CONEXIÓN CORRECTA
console.log("Conectando a Mongo...");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo conectado"))
  .catch(err => console.error("❌ Error Mongo:", err));

// 🔥 MODELO
const productoSchema = new mongoose.Schema({
  nombre: String,
  dropiId: String,
  material: String,
  landing: String,
  creativos: String,
  pais: String,
  estado: String,
  fuente: String,
  desarrollo: {
    avatar: Boolean,
    angulos: Boolean,
    creativos: Boolean,
    landing: Boolean
  },
  fecha: Date
});

const Producto = mongoose.model("Producto", productoSchema);

const app = express();
const API_KEY = process.env.API_KEY;

// 🔧 necesario para __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🌐 CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/test", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/ia", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning",
        messages: [
          {
            role: "system",
            content: "Eres un experto en marketing, tendencias y validación de productos para ecommerce."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices) {
      console.log("ERROR IA:", data);
      return res.status(500).json(data);
    }

    res.json({
      reply: data.choices[0].message.content
    });

  } catch (error) {
    console.error("ERROR SERVER:", error);
    res.status(500).json({ error: "Error IA" });
  }
});

app.post("/api/productos", async (req, res) => {
  try {
    console.log("Recibido:", req.body);

    const nuevoProducto = await Producto.create(req.body);

    console.log("Guardado en Mongo:", nuevoProducto);

    res.json({ ok: true, producto: nuevoProducto });
  } catch (err) {
    console.error("Error guardando producto:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/productos", async (req, res) => {
  try {
    const filtro = {};

    if (req.query.pais) {
      filtro.pais = req.query.pais;
    }

    const productos = await Producto.find(filtro).sort({ fecha: -1 });
    res.json(productos);
  } catch (err) {
    console.error("Error leyendo productos:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/productos/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    );

    res.json({ ok: true, producto: productoActualizado });
  } catch (err) {
    console.error("Error actualizando estado:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({ ok: true, producto: productoActualizado });
  } catch (err) {
    console.error("Error editando producto:", err);
    res.status(500).json({ error: err.message });
  }
});

// ❌ ELIMINAR PRODUCTO
app.delete("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Producto.findByIdAndDelete(id);

    res.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando producto:", err);
    res.status(500).json({ error: err.message });
  }
});

// ⚠️ ESTA RUTA SIEMPRE DEBE IR AL FINAL
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 PUERTO
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});