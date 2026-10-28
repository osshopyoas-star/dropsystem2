# CoDropX (codropx.com)

Herramienta propia de Oscar para su operación de dropshipping contra entrega en **Colombia (COP, tienda TuPaqueteCo)** y **Ecuador (USD, tienda TUPAQUETEC)**. Todo el texto de la app va en **español sencillo** (tuteo, palabras de dropshipper colombiano, sin tecnicismos).

## Cómo está armado
- **Backend:** Node + Express 5 (ESM, `"type": "module"`) + MongoDB (Mongoose). Entrada: `server.js`. Cada área tiene su archivo `rutas-*.js` que registra sus rutas `/api/...`.
- **Frontend:** HTML + JS sin framework en `public/`. `public/js/modules/*.js` = pantallas (cada una se registra con `registrarRuta("nombre", render)` y se abre con `goTo('nombre')`). `public/js/core/*.js` = lógica pura sin DOM (cálculos, prompts, plantillas). Estilos en `public/css/styles.css` (colores de CoDropX: azul `#3b82f6` / `#2563eb`; verde solo para ganancia/"va bien").
- **Hosting:** Render, despliega solo al hacer `git push` a `main` de `osshopyoas-star/dropsystem2`.
- **Datos por usuario:** todo se filtra por `owner: req.user.uid`. Un proyecto de Desarrollo tiene "ramas" por avatar (A y B).

## Módulos principales
- Desarrollo (`desarrollo.js`, `rutas-proyectos.js`, `prompts-landing.js`): Ficha → Avatares → Estilo → Landing (prompts para Gemini, AIDA) → Anuncios → Publicar en Shopify → "Pasar a testeo".
- Mi plantilla (`plantilla.js`, `core/plantilla.js`, `core/ejemplos.js`, imágenes en `public/ejemplos/*.webp`).
- Shopify (`rutas-shopify.js`, `rutas-publicar.js`, `core/seccion-shopify.js` = sección Liquid "CoDropX landing", subir `VERSION_SECCION` si cambia).
- Finanzas (`modules/finanzas.js`, `core/finanzas.js`, `rutas-finanzas.js`): Excel de Dropi → Control Diario, Reporte Financiero, Logística (con notas por pedido).
- Meta Ads (`rutas-meta.js`), Mis testeos (`testeos.js`), Calculadora (`calculadora.js`, `rutas-costeos.js`).

## Reglas
- **Nunca** leer, mostrar ni subir `.env` ni `Mongodb.txt`. Las claves (Meta, Shopify, Gemini, xAI, Mongo) viven en las variables de entorno de Render.
- No inventar reseñas, nombres ni testimonios de clientes en prompts o landings: solo fotos y textos reales que el dueño sube en la Ficha.
- Productos para menores: los avatares son los adultos que compran; en las fotos, ropa normal y escenas familiares.
- El producto en las imágenes va siempre a su tamaño real.
- Precio solo en portada/oferta, paquetes y oferta de cierre.
- No guardar datos personales de clientes del Excel de Dropi (nombres, teléfonos, direcciones).

## Flujo de trabajo (varios PCs)
1. Antes de empezar: `git pull`.
2. Al terminar: `git add .` → `git commit -m "qué cambió"` → `git push` (Render despliega solo).
3. Para correrlo en local: `npm install` y crear un `.env` propio en ese PC (nunca se sube a GitHub), luego `npm start`.
