// =============================================
// Utilidades compartidas (HTML seguro, listas, textos)
// =============================================

export function escapeHTML(str = "") {
  return String(str).replace(/[&<>"']/g, function(m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m];
  });
}

export function fillList(id, items = []) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = (items || [])
    .map(x => `<li>${escapeHTML(x)}</li>`)
    .join("");
}

export function fillChips(id, items = [], extraClass = "") {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = (items || [])
    .map(x => `<span class="trend-chip ${extraClass}">${escapeHTML(x)}</span>`)
    .join("");
}

export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "-";
}

