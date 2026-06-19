// Generación de documentos PDF imprimibles (vía window.print) con un diseño consistente
// y profesional, compartido por la ficha del animal y los reportes.

export function escHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Marca de la patita en SVG (se ve mucho mejor que un emoji al imprimir).
const PAW = `<svg width="30" height="30" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
  <ellipse cx="21" cy="19" rx="7" ry="9"/>
  <ellipse cx="43" cy="19" rx="7" ry="9"/>
  <ellipse cx="10.5" cy="34" rx="6" ry="7.5"/>
  <ellipse cx="53.5" cy="34" rx="6" ry="7.5"/>
  <path d="M32 31c-9.4 0-15.5 6.7-15.5 13.7 0 5.6 4.4 8.3 9.6 8.3 3 0 4.6-1.3 5.9-1.3s2.9 1.3 5.9 1.3c5.2 0 9.6-2.7 9.6-8.3C47.5 37.7 41.4 31 32 31z"/>
</svg>`;

const STYLES = `
  @page { margin: 15mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif;
    color: #2b2f33; background: #fff; font-size: 13px; line-height: 1.5;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .doc { max-width: 780px; margin: 0 auto; padding: 6px 4px 24px; }
  .header {
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(135deg, #005f73 0%, #0a9396 100%);
    color: #fff; border-radius: 16px; padding: 16px 22px;
  }
  .brand { display: flex; align-items: center; gap: 13px; }
  .brand .logo { width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,.16);
    display: flex; align-items: center; justify-content: center; color: #fff; }
  .brand .name { font-size: 21px; font-weight: 800; letter-spacing: .3px; line-height: 1; }
  .brand .tag { font-size: 11px; opacity: .85; margin-top: 3px; }
  .header .meta { text-align: right; font-size: 11px; line-height: 1.6; opacity: .95; }
  .header .meta b { font-size: 12px; }
  .titlewrap { margin: 22px 2px 2px; }
  .titlewrap h1 { font-size: 30px; margin: 0; color: #013a47; letter-spacing: -.4px; }
  .titlewrap .sub { color: #5a6068; margin-top: 5px; font-size: 14px; }
  .chips { margin-top: 11px; display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { display: inline-block; padding: 3px 11px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .chip.moss { background: #d6efe8; color: #005f73; }
  .chip.clay { background: #fde3d3; color: #9b3a04; }
  .chip.sun  { background: #fcebc8; color: #8a5e00; }
  .chip.neutral { background: #ece7dc; color: #5a6068; }
  .section { margin-top: 24px; break-inside: avoid; }
  .section > h2 {
    font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: #bb3e03;
    margin: 0 0 11px; display: flex; align-items: center; gap: 9px; font-weight: 700;
  }
  .section > h2::before { content: ""; width: 16px; height: 3px; border-radius: 2px; background: #bb3e03; }
  table { border-collapse: collapse; width: 100%; font-size: 12.5px; }
  thead th {
    background: #f3efe6; text-align: left; padding: 8px 11px; color: #6b7178;
    text-transform: uppercase; font-size: 10.5px; letter-spacing: .05em; border-bottom: 2px solid #e7e0d3;
  }
  tbody td { padding: 8px 11px; border-bottom: 1px solid #efeae0; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #faf8f3; }
  tbody tr { break-inside: avoid; }
  table.kv td { padding: 6px 11px; border-bottom: 1px solid #f1ece2; }
  table.kv td.k { color: #6b7178; width: 210px; font-weight: 600; }
  table.kv tr:last-child td { border-bottom: none; }
  .card { border: 1px solid #e7e0d3; border-radius: 12px; padding: 12px 15px; margin-bottom: 9px; break-inside: avoid; }
  .card .ch { color: #013a47; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .card .ch .cod { margin-left: auto; color: #9aa0a6; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 500; }
  .card p { margin: 4px 0; font-size: 12.5px; }
  .card p .lbl { font-weight: 700; color: #4a5057; }
  .signos { margin-top: 7px; display: flex; flex-wrap: wrap; gap: 5px; }
  .pill { display: inline-block; background: #f1ece2; border-radius: 999px; padding: 2px 9px; font-size: 11px; }
  .pill b { color: #013a47; }
  .muted { color: #8a9099; }
  .empty { color: #9aa0a6; font-style: italic; }
  .foot { margin-top: 30px; padding-top: 11px; border-top: 1px solid #e7e0d3; color: #9aa0a6;
    font-size: 10.5px; display: flex; justify-content: space-between; gap: 12px; }
`;

export type ChipTono = "moss" | "clay" | "sun" | "neutral";

export function pdfChip(texto: string, tono: ChipTono = "neutral"): string {
  return `<span class="chip ${tono}">${escHtml(texto)}</span>`;
}

export function pdfSeccion(titulo: string, contenidoHtml: string): string {
  return `<div class="section"><h2>${escHtml(titulo)}</h2>${contenidoHtml}</div>`;
}

/** Tabla clave/valor (los valores se escapan). */
export function pdfTablaDatos(pares: Array<[string, string]>): string {
  const filas = pares
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `<tr><td class="k">${escHtml(k)}</td><td>${escHtml(v)}</td></tr>`)
    .join("");
  return `<table class="kv"><tbody>${filas}</tbody></table>`;
}

/** Tabla de datos. Las celdas se reciben como HTML ya seguro (escapar en el llamador). */
export function pdfTabla(headers: string[], filas: string[][]): string {
  const ths = headers.map((h) => `<th>${escHtml(h)}</th>`).join("");
  const trs = filas
    .map((fila) => `<tr>${fila.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

interface DocumentoOpts {
  tituloDoc: string; // tipo de documento (arriba a la derecha)
  titulo: string; // título grande
  subtitulo?: string;
  chips?: string[]; // HTML de chips (usar pdfChip)
  cuerpo: string; // secciones (usar pdfSeccion)
  pie?: string;
}

export function construirDocumentoHtml(opts: DocumentoOpts): string {
  const fecha = new Date().toLocaleDateString("es", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${escHtml(opts.titulo)}</title>
<style>${STYLES}</style></head><body><div class="doc">
  <div class="header">
    <div class="brand">
      <div class="logo">${PAW}</div>
      <div><div class="name">Papaws</div><div class="tag">Refugio &amp; cuidado animal</div></div>
    </div>
    <div class="meta"><b>${escHtml(opts.tituloDoc)}</b><br>Generado el ${escHtml(fecha)}</div>
  </div>
  <div class="titlewrap">
    <h1>${escHtml(opts.titulo)}</h1>
    ${opts.subtitulo ? `<div class="sub">${escHtml(opts.subtitulo)}</div>` : ""}
    ${opts.chips && opts.chips.length ? `<div class="chips">${opts.chips.join("")}</div>` : ""}
  </div>
  ${opts.cuerpo}
  <div class="foot">
    <span>${escHtml(opts.pie ?? "Documento generado por el sistema Papaws.")}</span>
    <span>papaws · ${escHtml(fecha)}</span>
  </div>
</div></body></html>`;
}

/** Abre el documento en una ventana e invoca la impresión. Devuelve false si fue bloqueada. */
export function imprimirDocumento(html: string): boolean {
  const w = window.open("", "_blank", "width=980,height=1100");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
  return true;
}
