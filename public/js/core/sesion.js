// =============================================
// Sesión: manejo de 401 y cierre de sesión
// =============================================

const _fetchOriginal = window.fetch.bind(window);

window.fetch = async (...args) => {
  const res = await _fetchOriginal(...args);
  const url = String(args[0]?.url || args[0] || "");

  if (res.status === 401 && url.startsWith("/api/") && !url.startsWith("/api/auth/login")) {
    window.location.href = "/login.html";
  }
  return res;
};

window.cerrarSesion = async function() {
  try {
    await _fetchOriginal("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "/login.html";
  }
};

