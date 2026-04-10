import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fetch from "node-fetch";
import path from "path";
import mongoose from "mongoose"; // 👈 CORRECTO
import { fileURLToPath } from "url";

console.log(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
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
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.error(err));
const app = express();
const API_KEY = process.env.API_KEY;

// 🔧 necesario para __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🌐 CORS (por si accedes desde otro dominio)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// 📦 leer JSON
app.use(express.json());

// 📁 SERVIR FRONTEND (IMPORTANTE)
app.use(express.static(path.join(__dirname, "public")));

// 🧪 TEST
app.get("/api/test", (req, res) => {
  res.json({ status: "ok" });
});

// 🤖 API IA
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

    // 🔍 debug si algo falla
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

// 🌍 SPA (para que cualquier ruta cargue index.html)


// 🚀 PUERTO (Render usa process.env.PORT)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});


app.post("/api/productos", async (req, res) => {
  try {
    const producto = req.body;

    const nuevoProducto = await Producto.create(producto);

    res.json({ ok: true, producto: nuevoProducto });
  } catch (err) {
    console.error("Error guardando producto:", err);
    res.status(500).json({ error: err.message });
  }
});
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
