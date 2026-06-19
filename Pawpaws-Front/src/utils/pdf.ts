// Generación de PDF real (jsPDF + autotable) con descarga directa: el archivo se guarda en
// Descargas con su nombre, sin pasar por el diálogo de impresión del navegador.
//
// API basada en datos (no HTML): cada documento es un título + secciones tipadas. Las librerías
// se cargan de forma diferida (dynamic import) para no inflar el bundle principal.

type RGB = [number, number, number];

const COL = {
  moss: [0, 95, 115] as RGB,
  deep: [1, 58, 71] as RGB,
  clay: [187, 62, 3] as RGB,
  ink: [43, 47, 51] as RGB,
  muted: [122, 128, 136] as RGB,
  bone: [243, 239, 230] as RGB,
  zebra: [250, 248, 243] as RGB,
  line: [231, 224, 211] as RGB,
  white: [255, 255, 255] as RGB,
};

export interface SeccionDatos {
  titulo: string;
  tipo: "datos";
  datos: Array<[string, string]>;
}
export interface SeccionTabla {
  titulo: string;
  tipo: "tabla";
  headers: string[];
  filas: string[][];
  vacio?: string;
  total?: string[]; // fila de totales (pie de tabla, en negrita)
}
export interface SeccionTexto {
  titulo: string;
  tipo: "texto";
  texto: string;
}
export interface SeccionKpis {
  titulo: string;
  tipo: "kpis";
  items: Array<{ label: string; valor: string }>;
}
export type SeccionPdf = SeccionDatos | SeccionTabla | SeccionTexto | SeccionKpis;

export interface DocumentoPdf {
  tituloDoc: string; // tipo de documento (arriba a la derecha)
  titulo: string; // título grande
  subtitulo?: string;
  etiqueta?: string; // p. ej. el estado del animal
  secciones: SeccionPdf[];
  nombreArchivo: string; // sin extensión
  pie?: string;
}

async function cargar() {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  return { jsPDF, autoTable: autoTableMod.default };
}

export async function descargarPdf(d: DocumentoPdf): Promise<void> {
  const { jsPDF, autoTable } = await cargar();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 40;
  const ancho = W - margin * 2;
  const fecha = new Date().toLocaleDateString("es", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // ── Encabezado con banda de marca ────────────────────────────────────────
  const bandaY = margin;
  const bandaH = 56;
  doc.setFillColor(...COL.moss);
  doc.roundedRect(margin, bandaY, ancho, bandaH, 9, 9, "F");

  // Patita (círculos blancos).
  const px = margin + 26;
  const py = bandaY + bandaH / 2;
  doc.setFillColor(...COL.white);
  doc.ellipse(px - 8, py - 3, 3, 4, "F");
  doc.ellipse(px - 2.8, py - 7, 3, 4.3, "F");
  doc.ellipse(px + 2.8, py - 7, 3, 4.3, "F");
  doc.ellipse(px + 8, py - 3, 3, 4, "F");
  doc.ellipse(px, py + 3.5, 6.5, 5.5, "F");

  doc.setTextColor(...COL.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Papaws", margin + 44, bandaY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Refugio & cuidado animal", margin + 44, bandaY + 39);

  doc.setFontSize(9.5);
  doc.text(d.tituloDoc, W - margin - 14, bandaY + 23, { align: "right" });
  doc.setTextColor(220, 235, 232);
  doc.setFontSize(8.5);
  doc.text(`Generado el ${fecha}`, W - margin - 14, bandaY + 37, { align: "right" });

  let y = bandaY + bandaH + 26;

  // ── Título ───────────────────────────────────────────────────────────────
  doc.setTextColor(...COL.deep);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(d.titulo, margin, y);
  y += 16;
  if (d.subtitulo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...COL.muted);
    doc.text(d.subtitulo, margin, y);
    y += 14;
  }
  if (d.etiqueta) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...COL.clay);
    doc.text(d.etiqueta.toUpperCase(), margin, y);
    y += 12;
  }
  y += 8;

  const nuevaPaginaSiHaceFalta = (necesario: number) => {
    if (y + necesario > H - margin - 20) {
      doc.addPage();
      y = margin;
    }
  };

  const encabezadoSeccion = (titulo: string) => {
    nuevaPaginaSiHaceFalta(60);
    doc.setDrawColor(...COL.clay);
    doc.setLineWidth(2.5);
    doc.line(margin, y - 3, margin + 16, y - 3);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...COL.clay);
    doc.text(titulo.toUpperCase(), margin + 22, y);
    y += 12;
  };

  for (const s of d.secciones) {
    encabezadoSeccion(s.titulo);

    if (s.tipo === "kpis") {
      const items = s.items;
      if (items.length > 0) {
        const porFila = Math.min(items.length, 4);
        const gap = 10;
        const cajaW = (ancho - gap * (porFila - 1)) / porFila;
        const cajaH = 44;
        items.forEach((kpi, i) => {
          const col = i % porFila;
          if (col === 0) nuevaPaginaSiHaceFalta(cajaH + 8);
          const bx = margin + col * (cajaW + gap);
          doc.setFillColor(...COL.bone);
          doc.roundedRect(bx, y, cajaW, cajaH, 6, 6, "F");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(...COL.muted);
          doc.text(kpi.label.toUpperCase(), bx + 10, y + 16);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(15);
          doc.setTextColor(...COL.deep);
          doc.text(kpi.valor, bx + 10, y + 35);
          if (col === porFila - 1 || i === items.length - 1) y += cajaH + gap;
        });
        y += 8;
      }
    } else if (s.tipo === "datos") {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: "plain",
        body: s.datos.filter(([, v]) => v != null && v !== ""),
        styles: { fontSize: 9.5, cellPadding: 3, textColor: COL.ink, lineColor: COL.line },
        columnStyles: { 0: { cellWidth: 175, fontStyle: "bold", textColor: COL.muted } },
      });
      y = (doc as any).lastAutoTable.finalY + 18;
    } else if (s.tipo === "tabla") {
      if (s.filas.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(...COL.muted);
        doc.text(s.vacio ?? "Sin datos.", margin, y);
        y += 22;
      } else {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [s.headers],
          body: s.filas,
          foot: s.total ? [s.total] : undefined,
          styles: { fontSize: 9, cellPadding: 5, textColor: COL.ink, lineColor: COL.line, lineWidth: 0.5, valign: "top" },
          headStyles: { fillColor: COL.bone, textColor: COL.muted, fontStyle: "bold", fontSize: 8.5 },
          footStyles: { fillColor: COL.moss, textColor: COL.white, fontStyle: "bold", fontSize: 9 },
          alternateRowStyles: { fillColor: COL.zebra },
        });
        y = (doc as any).lastAutoTable.finalY + 18;
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...COL.ink);
      const lineas = doc.splitTextToSize(s.texto, ancho) as string[];
      nuevaPaginaSiHaceFalta(lineas.length * 13 + 10);
      doc.text(lineas, margin, y);
      y += lineas.length * 13 + 14;
    }
  }

  // ── Pie en todas las páginas ─────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COL.line);
    doc.setLineWidth(0.5);
    doc.line(margin, H - margin + 4, W - margin, H - margin + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COL.muted);
    doc.text(d.pie ?? "Documento generado por el sistema Papaws.", margin, H - margin + 16);
    doc.text(`Página ${i} de ${total}`, W - margin, H - margin + 16, { align: "right" });
  }

  doc.save(`${d.nombreArchivo}.pdf`);
}
