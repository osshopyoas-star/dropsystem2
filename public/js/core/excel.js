// =============================================
// 📄 LECTOR DE EXCEL (.xlsx) SIN LIBRERÍAS
// Un .xlsx es un .zip con archivos XML adentro: aquí se abre el zip,
// se descomprime la primera hoja y se convierte en filas.
// Funciona en el navegador (y en Node 18+ para las pruebas).
// =============================================

const u16 = (b, i) => b[i] | (b[i + 1] << 8);
const u32 = (b, i) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

async function inflar(datos) {
  const ds = new DecompressionStream("deflate-raw");
  const flujo = new Blob([datos]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(flujo).arrayBuffer());
}

// Lee los archivos del zip que pasen el filtro
async function abrirZip(buffer, quiero) {
  const b = new Uint8Array(buffer);
  let fin = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 70000); i--) {
    if (u32(b, i) === 0x06054b50) { fin = i; break; }
  }
  if (fin < 0) throw new Error("El archivo no es un Excel (.xlsx) válido");
  const total = u16(b, fin + 10);
  let p = u32(b, fin + 16);
  const salida = {};
  const dec = new TextDecoder();
  for (let n = 0; n < total; n++) {
    if (u32(b, p) !== 0x02014b50) break;
    const metodo = u16(b, p + 10);
    const tamComp = u32(b, p + 20);
    const largoNombre = u16(b, p + 28), largoExtra = u16(b, p + 30), largoComent = u16(b, p + 32);
    const local = u32(b, p + 42);
    const nombre = dec.decode(b.subarray(p + 46, p + 46 + largoNombre));
    p += 46 + largoNombre + largoExtra + largoComent;
    if (!quiero(nombre)) continue;
    const inicio = local + 30 + u16(b, local + 26) + u16(b, local + 28);
    const crudo = b.subarray(inicio, inicio + tamComp);
    const datos = metodo === 0 ? crudo : metodo === 8 ? await inflar(crudo) : null;
    if (datos) salida[nombre] = dec.decode(datos);
  }
  return salida;
}

const entidades = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const desescapar = (t) => String(t).replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
  if (e[0] === "#") return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  return entidades[e] ?? m;
});
const textos = (xml) => [...String(xml).matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(m => desescapar(m[1])).join("");

const columna = (ref) => {
  const letras = String(ref).match(/^[A-Z]+/)?.[0] || "A";
  let n = 0;
  for (const c of letras) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
};

/** Devuelve las filas de la primera hoja: [[celda, celda...], ...] */
export async function leerExcel(buffer) {
  const archivos = await abrirZip(buffer, (n) => n === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d*\.xml$/.test(n) || n === "xl/workbook.xml" || n === "xl/_rels/workbook.xml.rels");
  const compartidos = [...String(archivos["xl/sharedStrings.xml"] || "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => textos(m[1]));

  // Primera hoja según el libro (o sheet1)
  let hoja = "xl/worksheets/sheet1.xml";
  const rid = String(archivos["xl/workbook.xml"] || "").match(/<sheet\b[^>]*r:id="([^"]+)"/)?.[1];
  const destino = rid && String(archivos["xl/_rels/workbook.xml.rels"] || "").match(new RegExp(`<Relationship[^>]*Id="${rid}"[^>]*Target="([^"]+)"`))?.[1];
  if (destino) hoja = "xl/" + destino.replace(/^\/?xl\//, "").replace(/^\//, "");
  const xml = archivos[hoja] || archivos[Object.keys(archivos).filter(k => k.includes("worksheets/")).sort()[0]];
  if (!xml) throw new Error("No encontramos la hoja dentro del Excel");

  const filas = [];
  for (const fm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const fila = [];
    for (const cm of fm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1];
      const ref = attrs.match(/\br="([A-Z]+)\d+"/)?.[1];
      const tipo = attrs.match(/\bt="(\w+)"/)?.[1];
      const cuerpo = cm[2] || "";
      const v = cuerpo.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let valor = null;
      if (tipo === "s") valor = compartidos[Number(v)] ?? "";
      else if (tipo === "inlineStr") valor = textos(cuerpo);
      else if (tipo === "str" || tipo === "e") valor = v != null ? desescapar(v) : "";
      else if (tipo === "b") valor = v === "1";
      else if (v != null && v !== "") valor = Number(v);
      fila[ref ? columna(ref) : fila.length] = valor;
    }
    filas.push(Array.from(fila, x => (x === undefined ? null : x)));
  }
  return filas;
}
