// CoDropX como app en el celular.
// No guarda copias de la app: siempre carga la última versión (Render despliega seguido).
// Solo si no hay internet muestra un aviso en vez de la pantalla de error del navegador.
const SIN_INTERNET = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CoDropX</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;color:#0f172a;text-align:center;padding:24px}
button{margin-top:16px;padding:12px 20px;border:0;border-radius:10px;background:#2563eb;color:#fff;font:inherit;font-weight:700}</style></head>
<body><div><h1>Sin internet</h1><p>CoDropX necesita conexión para traer tus números.<br>Revisa tus datos o el wifi.</p><button onclick="location.reload()">Intentar de nuevo</button></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;   // todo lo demás (API, archivos) va directo a la red
  e.respondWith(fetch(e.request).catch(() => new Response(SIN_INTERNET, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
