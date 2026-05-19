import PDFDocument from "pdfkit";
import {
  KIND_SIZE_MM,
  type CardKind,
  type TemplateSpec,
} from "./designTemplates";

const MM = 2.834645669; // pt per mm

interface RenderInput {
  kind: CardKind;
  template: TemplateSpec;
  data: Record<string, unknown>;
  photoBase64?: string | null; // data URL or base64 (dankeskarte only)
}

function s(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function pdfFont(spec: TemplateSpec, weight: "regular" | "bold" | "italic" = "regular"): string {
  if (spec.fontFamily === "serif" || spec.fontFamily === "display") {
    if (weight === "bold") return "Times-Bold";
    if (weight === "italic") return "Times-Italic";
    return "Times-Roman";
  }
  if (weight === "bold") return "Helvetica-Bold";
  if (weight === "italic") return "Helvetica-Oblique";
  return "Helvetica";
}

function drawBackground(doc: PDFKit.PDFDocument, spec: TemplateSpec, w: number, h: number) {
  doc.save().rect(0, 0, w, h).fill(spec.background).restore();
}

function drawDecoration(doc: PDFKit.PDFDocument, spec: TemplateSpec, w: number, h: number) {
  doc.save();
  switch (spec.decoration) {
    case "minimal-line": {
      const cx = w / 2;
      doc.lineWidth(0.5).strokeColor(spec.accent);
      doc.moveTo(cx - 20 * MM, h / 2 - 24 * MM).lineTo(cx - 3 * MM, h / 2 - 24 * MM).stroke();
      doc.moveTo(cx + 3 * MM, h / 2 - 24 * MM).lineTo(cx + 20 * MM, h / 2 - 24 * MM).stroke();
      doc.fillColor(spec.accent).circle(cx, h / 2 - 24 * MM, 0.6).fill();
      doc.moveTo(cx - 20 * MM, h / 2 + 30 * MM).lineTo(cx + 20 * MM, h / 2 + 30 * MM).stroke();
      break;
    }
    case "frame": {
      const m = 6 * MM;
      doc.lineWidth(0.8).strokeColor(spec.accent);
      doc.rect(m, m, w - 2 * m, h - 2 * m).stroke();
      doc.lineWidth(0.4);
      doc.rect(m + 1.6 * MM, m + 1.6 * MM, w - 2 * (m + 1.6 * MM), h - 2 * (m + 1.6 * MM)).stroke();
      // corner flourishes
      doc.lineWidth(0.7);
      const flourish = (x: number, y: number, sx: number, sy: number) => {
        doc.moveTo(x, y).lineTo(x + sx * 3 * MM, y).stroke();
        doc.moveTo(x, y).lineTo(x, y + sy * 3 * MM).stroke();
      };
      flourish(m, m, 1, 1);
      flourish(w - m, m, -1, 1);
      flourish(m, h - m, 1, -1);
      flourish(w - m, h - m, -1, -1);
      break;
    }
    case "botanical": {
      const drawLeaf = (cx: number, cy: number, scale: number, flip: boolean) => {
        doc.save().translate(cx, cy);
        if (flip) doc.scale(-1, 1);
        doc.strokeColor(spec.accent).lineWidth(0.5);
        doc.moveTo(0, 0).lineTo(scale * 18, scale * -18).stroke();
        for (let i = 0; i < 5; i++) {
          const t = (i + 1) / 6;
          const x = scale * 18 * t;
          const y = scale * -18 * t;
          const lx = scale * 4 * (i % 2 === 0 ? 1 : -1);
          const ly = scale * -4 * (i % 2 === 0 ? -1 : 1);
          doc.moveTo(x, y).lineTo(x + lx, y + ly).stroke();
        }
        doc.restore();
      };
      drawLeaf(8 * MM, h - 8 * MM, MM, false);
      drawLeaf(w - 8 * MM, 8 * MM, MM, true);
      drawLeaf(8 * MM, 8 * MM, MM, false);
      drawLeaf(w - 8 * MM, h - 8 * MM, MM, true);
      break;
    }
    case "monogram": {
      const cx = w / 2;
      const cy = h / 2 - 8 * MM;
      const r = Math.min(w, h) * 0.18;
      doc.strokeColor(spec.accent).lineWidth(0.6).circle(cx, cy, r).stroke();
      doc.lineWidth(0.3).circle(cx, cy, r * 0.86).stroke();
      // laurel arms
      doc.lineWidth(0.4);
      for (const s of [-1, 1]) {
        for (let i = 0; i < 5; i++) {
          const t = i / 5;
          const ax = cx + s * (r + 2 * MM + t * 7 * MM);
          const ay = cy - 2 * MM + t * 4 * MM;
          doc.moveTo(ax, ay).lineTo(ax + s * 1.5 * MM, ay - 1 * MM).stroke();
        }
      }
      break;
    }
    case "editorial": {
      doc.fillColor(spec.accent).rect(0, 0, 3.5 * MM, h).fill();
      doc.fillColor(spec.accent, 0.5).rect(w - 1 * MM, 0, 0.6 * MM, h).fill();
      break;
    }
    case "wash": {
      doc.save();
      const bands = 18;
      for (let i = 0; i < bands; i++) {
        doc.fillColor(spec.accent, 0.04).rect(0, (h * i) / bands, w, h / bands).fill();
      }
      doc.restore();
      break;
    }
    case "art-deco": {
      doc.strokeColor(spec.accent).lineWidth(0.6);
      const fan = (cx: number, cy: number, sx: number, sy: number) => {
        doc.save().translate(cx, cy).scale(sx, sy);
        for (let i = 0; i <= 5; i++) {
          const a = (i / 5) * (Math.PI / 2);
          const len = (11 - i * 0.6) * MM;
          doc.moveTo(0, 0).lineTo(Math.cos(a) * len, Math.sin(a) * len).stroke();
        }
        // quarter arc
        const r = 12 * MM;
        doc.lineWidth(0.4)
          .moveTo(r, 0)
          .bezierCurveTo(r, r * 0.55, r * 0.55, r, 0, r)
          .stroke();
        doc.lineWidth(0.6);
        doc.restore();
      };
      fan(5 * MM, 5 * MM, 1, 1);
      fan(w - 5 * MM, 5 * MM, -1, 1);
      fan(5 * MM, h - 5 * MM, 1, -1);
      fan(w - 5 * MM, h - 5 * MM, -1, -1);
      // center diamond divider
      const cx = w / 2;
      const cy = h / 2 + 28 * MM > h - 6 * MM ? h - 9 * MM : h / 2 + 28 * MM;
      doc.lineWidth(0.5);
      doc.moveTo(cx - 14 * MM, cy).lineTo(cx - 2 * MM, cy).stroke();
      doc.moveTo(cx + 2 * MM, cy).lineTo(cx + 14 * MM, cy).stroke();
      doc.save().translate(cx, cy).rotate(45);
      doc.rect(-0.9 * MM, -0.9 * MM, 1.8 * MM, 1.8 * MM).stroke();
      doc.fillColor(spec.accent).rect(-0.45 * MM, -0.45 * MM, 0.9 * MM, 0.9 * MM).fill();
      doc.restore();
      break;
    }
    case "arch": {
      const m = 7 * MM;
      const archX = m;
      const archY = m;
      const archW = w - 2 * m;
      const innerH = h - 2 * m;
      const r = Math.min(archW / 2, innerH * 0.55);
      doc.strokeColor(spec.accent).lineWidth(0.7);
      // outer arch
      doc.moveTo(archX, archY + innerH)
        .lineTo(archX, archY + r)
        .bezierCurveTo(archX, archY + r * 0.45, archX + archW * 0.18, archY, archX + archW / 2, archY)
        .bezierCurveTo(archX + archW * 0.82, archY, archX + archW, archY + r * 0.45, archX + archW, archY + r)
        .lineTo(archX + archW, archY + innerH)
        .stroke();
      // inner arch
      const inset = 1.4 * MM;
      const ax2 = archX + inset;
      const aw2 = archW - 2 * inset;
      const ar2 = Math.max(0, r - inset);
      doc.lineWidth(0.3);
      doc.moveTo(ax2, archY + innerH)
        .lineTo(ax2, archY + inset + ar2)
        .bezierCurveTo(ax2, archY + inset + ar2 * 0.45, ax2 + aw2 * 0.18, archY + inset, ax2 + aw2 / 2, archY + inset)
        .bezierCurveTo(ax2 + aw2 * 0.82, archY + inset, ax2 + aw2, archY + inset + ar2 * 0.45, ax2 + aw2, archY + inset + ar2)
        .lineTo(ax2 + aw2, archY + innerH)
        .stroke();
      break;
    }
    case "wreath": {
      const cx = w / 2;
      const cy = h * 0.16;
      const r = Math.min(w * 0.18, h * 0.1);
      const n = 16;
      doc.strokeColor(spec.accent).lineWidth(0.45);
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i / (n - 1)) * Math.PI;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const tx = Math.cos(a + Math.PI / 2);
        const ty = Math.sin(a + Math.PI / 2);
        const len = 1.8 * MM;
        doc.moveTo(x, y).lineTo(x + tx * len, y + ty * len).stroke();
        doc.lineWidth(0.3);
        doc.moveTo(x + tx * 0.4 * MM, y + ty * 0.4 * MM)
          .lineTo(x + tx * 1.2 * MM + ty * 0.7 * MM, y + ty * 1.2 * MM - tx * 0.7 * MM)
          .stroke();
        doc.lineWidth(0.45);
      }
      doc.fillColor(spec.accent).circle(cx, cy + r + 0.7 * MM, 0.5).fill();
      break;
    }
    case "terrazzo": {
      // All values in mm; convert once at draw time.
      const wMm = w / MM;
      const hMm = h / MM;
      const dots: Array<[number, number, number, number]> = [
        [6, 9, 0.8, 0.55], [14, 20, 0.55, 0.42], [wMm - 8, 13, 0.7, 0.52],
        [wMm - 14, 32, 0.45, 0.38], [8, hMm - 13, 0.85, 0.52], [wMm - 10, hMm - 8, 0.65, 0.55],
        [wMm / 2 - 12, hMm - 20, 0.5, 0.48], [wMm / 2 + 9, 7, 0.45, 0.38],
        [22, hMm - 32, 0.55, 0.48], [wMm - 22, hMm / 2, 0.6, 0.42],
        [4, hMm / 2 + 8, 0.4, 0.38], [wMm / 2 + 20, hMm - 9, 0.5, 0.5],
        [wMm / 2 - 22, hMm / 3, 0.45, 0.38],
      ];
      for (const [x, y, r, op] of dots) {
        if (x < 0 || y < 0 || x > wMm || y > hMm) continue;
        doc.fillColor(spec.accent, op).circle(x * MM, y * MM, r * MM).fill();
      }
      break;
    }
  }
  doc.restore();
}

interface TextBlock {
  text: string;
  size: number;
  font?: "regular" | "bold" | "italic";
  color?: string;
  letterSpacing?: number;
  align?: "center" | "left";
  upper?: boolean;
  marginTop?: number;
}

function drawCenteredStack(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  blocks: TextBlock[],
  w: number,
  startY: number,
  leftMargin = 8 * MM,
) {
  let y = startY;
  for (const b of blocks) {
    if (!b.text) continue;
    y += (b.marginTop ?? 0) * MM;
    const text = b.upper ? b.text.toUpperCase() : b.text;
    doc
      .font(pdfFont(spec, b.font ?? "regular"))
      .fontSize(b.size)
      .fillColor(b.color ?? spec.primary);
    const opts: PDFKit.Mixins.TextOptions = {
      align: b.align ?? "center",
      width: w - 2 * leftMargin,
      characterSpacing: b.letterSpacing ?? 0,
      lineBreak: true,
    };
    doc.text(text, leftMargin, y, opts);
    y = doc.y + 2;
  }
  return y;
}

function renderEinladung(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  data: Record<string, unknown>,
  w: number,
  h: number,
) {
  drawBackground(doc, spec, w, h);
  drawDecoration(doc, spec, w, h);

  const partner1 = s(data["partner1"]) || "Anna";
  const partner2 = s(data["partner2"]) || "Markus";
  const datum = s(data["datum"]) || "Sommer 2026";
  const location = s(data["location"]) || "Eure Hochzeitslocation";
  const ort = s(data["ort"]) || "";
  const zeit = s(data["zeit"]) || "15:00 Uhr";
  const rsvp = s(data["rsvp"]) || "Bitte um Rückmeldung bis vier Wochen vor dem Fest.";

  drawCenteredStack(doc, spec, [
    { text: "Wir heiraten", size: 9, upper: true, letterSpacing: 3, color: spec.accent, marginTop: 18 },
    { text: partner1, size: 28, font: "bold", marginTop: 12 },
    { text: "&", size: 18, color: spec.accent, marginTop: 1, font: "italic" },
    { text: partner2, size: 28, font: "bold", marginTop: 1 },
    { text: datum, size: 12, marginTop: 16, letterSpacing: 2, upper: true },
    { text: `${zeit} · ${location}`, size: 10, marginTop: 4 },
    { text: ort, size: 9, color: spec.accent, marginTop: 1 },
    { text: rsvp, size: 8, marginTop: 18, font: "italic" },
  ], w, 0);
}

function renderTischkarte(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  data: Record<string, unknown>,
  w: number,
  h: number,
) {
  drawBackground(doc, spec, w, h);
  drawDecoration(doc, spec, w, h);
  // Light border for place cards
  doc.save().strokeColor(spec.accent).lineWidth(0.4).rect(3 * MM, 3 * MM, w - 6 * MM, h - 6 * MM).stroke().restore();

  const guest = s(data["gastname"]) || "Gast";
  const tisch = s(data["tisch"]) || "";
  const partner1 = s(data["partner1"]) || "";
  const partner2 = s(data["partner2"]) || "";
  const couple = partner1 && partner2 ? `${partner1} & ${partner2}` : "";

  const cy = h / 2 - 10;
  drawCenteredStack(doc, spec, [
    { text: couple, size: 7, upper: true, letterSpacing: 2, color: spec.accent },
    { text: guest, size: 20, font: "bold", marginTop: 4 },
    { text: tisch, size: 9, marginTop: 4, color: spec.accent, letterSpacing: 1 },
  ], w, cy);
}

function renderMenuekarte(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  data: Record<string, unknown>,
  w: number,
  h: number,
) {
  drawBackground(doc, spec, w, h);
  drawDecoration(doc, spec, w, h);

  const partner1 = s(data["partner1"]) || "Anna";
  const partner2 = s(data["partner2"]) || "Markus";
  const datum = s(data["datum"]) || "";
  const courses = [
    { label: "Vorspeise", v: s(data["vorspeise"]) },
    { label: "Suppe", v: s(data["suppe"]) },
    { label: "Hauptgang", v: s(data["hauptgang"]) },
    { label: "Dessert", v: s(data["dessert"]) },
    { label: "Getränke", v: s(data["getraenke"]) },
  ].filter((c) => c.v);

  drawCenteredStack(doc, spec, [
    { text: "Menü", size: 9, upper: true, letterSpacing: 4, color: spec.accent, marginTop: 16 },
    { text: `${partner1} & ${partner2}`, size: 22, font: "bold", marginTop: 8 },
    { text: datum, size: 9, marginTop: 4, color: spec.accent, letterSpacing: 2, upper: true },
  ], w, 0);

  let y = h * 0.35;
  for (const c of courses) {
    doc.font(pdfFont(spec, "bold")).fontSize(9).fillColor(spec.accent)
      .text(c.label.toUpperCase(), 0, y, { align: "center", width: w, characterSpacing: 2 });
    y = doc.y + 2;
    doc.font(pdfFont(spec, "italic")).fontSize(11).fillColor(spec.primary)
      .text(c.v, 12 * MM, y, { align: "center", width: w - 24 * MM });
    y = doc.y + 8;
  }
}

function renderDankeskarte(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  data: Record<string, unknown>,
  w: number,
  h: number,
  photoBase64?: string | null,
) {
  drawBackground(doc, spec, w, h);
  drawDecoration(doc, spec, w, h);

  // Left half: photo (or placeholder), right half: text
  const photoBoxX = 6 * MM;
  const photoBoxY = 6 * MM;
  const photoBoxW = w * 0.42;
  const photoBoxH = h - 12 * MM;

  doc.save().strokeColor(spec.accent).lineWidth(0.5)
    .rect(photoBoxX, photoBoxY, photoBoxW, photoBoxH).stroke().restore();

  if (photoBase64) {
    try {
      const raw = photoBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
      const buf = Buffer.from(raw, "base64");
      doc.image(buf, photoBoxX, photoBoxY, {
        fit: [photoBoxW, photoBoxH],
        align: "center",
        valign: "center",
      });
    } catch {
      // ignore broken image; placeholder rectangle stays
    }
  } else {
    doc.font(pdfFont(spec, "italic")).fontSize(8).fillColor(spec.accent)
      .text("Foto später ergänzen", photoBoxX, photoBoxY + photoBoxH / 2 - 4, {
        align: "center", width: photoBoxW,
      });
  }

  const partner1 = s(data["partner1"]) || "Anna";
  const partner2 = s(data["partner2"]) || "Markus";
  const datum = s(data["datum"]) || "";
  const text = s(data["dankestext"]) ||
    "Von Herzen Danke für eure Glückwünsche, eure Geschenke und für die wunderschöne Zeit, die wir mit euch teilen durften.";

  const tx = photoBoxX + photoBoxW + 5 * MM;
  const tw = w - tx - 6 * MM;

  doc.font(pdfFont(spec, "bold")).fontSize(8).fillColor(spec.accent)
    .text("DANKE", tx, 14 * MM, { align: "left", width: tw, characterSpacing: 4 });
  doc.font(pdfFont(spec, "bold")).fontSize(17).fillColor(spec.primary)
    .text(`${partner1} & ${partner2}`, tx, doc.y + 4, { width: tw });
  doc.font(pdfFont(spec, "italic")).fontSize(8).fillColor(spec.accent)
    .text(datum, tx, doc.y + 2, { width: tw });
  doc.font(pdfFont(spec, "regular")).fontSize(9).fillColor(spec.primary)
    .text(text, tx, doc.y + 8, { width: tw, lineGap: 2 });
}

export function generateDesignPdf(input: RenderInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const [wMm, hMm] = KIND_SIZE_MM[input.kind];
    const w = wMm * MM;
    const h = hMm * MM;

    const doc = new PDFDocument({
      size: [w, h],
      margin: 0,
      info: {
        Title: `NIWE Weddings · ${input.kind}`,
        Author: "NIWE Weddings",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      switch (input.kind) {
        case "einladung":
          renderEinladung(doc, input.template, input.data, w, h);
          break;
        case "tischkarte":
          renderTischkarte(doc, input.template, input.data, w, h);
          break;
        case "menuekarte":
          renderMenuekarte(doc, input.template, input.data, w, h);
          break;
        case "dankeskarte":
          renderDankeskarte(doc, input.template, input.data, w, h, input.photoBase64);
          break;
      }
    } catch (err) {
      reject(err);
      return;
    }
    doc.end();
  });
}
