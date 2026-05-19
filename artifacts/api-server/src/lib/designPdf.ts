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
  photoBase64?: string | null; // data URL or base64 (einladung inside / dankeskarte)
  aiBackgroundDataUrl?: string | null; // when set, replaces template bg + decoration
}

function dataUrlToBuffer(dataUrl: string | null | undefined): Buffer | null {
  if (!dataUrl) return null;
  try {
    const raw = dataUrl.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    const buf = Buffer.from(raw, "base64");
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
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

/** Draws either the AI-generated image (full-bleed) or the template bg + decoration. */
function drawCanvasBg(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  w: number,
  h: number,
  aiBg?: string | null,
) {
  if (aiBg) {
    try {
      const raw = aiBg.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
      const buf = Buffer.from(raw, "base64");
      doc.save();
      doc.image(buf, 0, 0, { cover: [w, h], align: "center", valign: "center" });
      doc.restore();
      return;
    } catch {
      // fall through to template bg if image broken
    }
  }
  drawBackground(doc, spec, w, h);
  drawDecoration(doc, spec, w, h);
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
  maxWidth?: number; // in pt; default = w - 2 * leftMargin
  minScale?: number; // default 0.5
}

/** Shrink the font size until the text fits within `maxWidth` at the current font. */
function fitFontSize(
  doc: PDFKit.PDFDocument,
  text: string,
  fontName: string,
  baseSize: number,
  maxWidth: number,
  letterSpacing = 0,
  minScale = 0.5,
): number {
  if (!text) return baseSize;
  doc.font(fontName).fontSize(baseSize);
  const ls = letterSpacing * Math.max(0, text.length - 1);
  const natural = doc.widthOfString(text) + ls;
  if (natural <= maxWidth) return baseSize;
  const fitted = Math.max(baseSize * minScale, baseSize * (maxWidth - ls) / Math.max(1, natural - ls));
  return fitted;
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
    const fontName = pdfFont(spec, b.font ?? "regular");
    const maxW = b.maxWidth ?? (w - 2 * leftMargin);
    const size = fitFontSize(doc, text, fontName, b.size, maxW, b.letterSpacing ?? 0, b.minScale);
    doc.font(fontName).fontSize(size).fillColor(b.color ?? spec.primary);
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

/** Soft cream panel + thin double border — keeps typography readable on AI bg. */
function drawGlassPanel(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  x: number, y: number, w: number, h: number,
) {
  doc.save();
  doc.fillColor("#fffdf7", 0.9).roundedRect(x, y, w, h, 1.2).fill();
  doc.lineWidth(0.5).strokeColor(spec.accent, 0.55)
    .rect(x + 1.2 * MM, y + 1.2 * MM, w - 2.4 * MM, h - 2.4 * MM).stroke();
  doc.lineWidth(0.25).strokeColor(spec.accent, 0.3)
    .rect(x + 2 * MM, y + 2 * MM, w - 4 * MM, h - 4 * MM).stroke();
  doc.restore();
}

/** Spaced-caps header with hairline rules + tiny dots on either side. */
function drawCapsRule(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  text: string,
  cx: number,
  y: number,
  size: number,
  letterSpacing: number,
  lineLen: number,
  color: string,
  fontKind: "regular" | "bold" = "regular",
) {
  const fontName = pdfFont(spec, fontKind);
  doc.font(fontName).fontSize(size).fillColor(color);
  const upper = text.toUpperCase();
  const ls = letterSpacing * Math.max(0, upper.length - 1);
  const textW = doc.widthOfString(upper) + ls;
  const gap = textW / 2 + 3 * MM;
  doc.lineWidth(0.5).strokeColor(color);
  doc.moveTo(cx - gap - lineLen, y).lineTo(cx - gap, y).stroke();
  doc.moveTo(cx + gap, y).lineTo(cx + gap + lineLen, y).stroke();
  doc.fillColor(color).circle(cx - gap - lineLen - 0.8 * MM, y, 0.4).fill();
  doc.circle(cx + gap + lineLen + 0.8 * MM, y, 0.4).fill();
  doc.font(fontName).fontSize(size).fillColor(color)
    .text(upper, 0, y - size * 0.4, { width: 2 * cx, align: "center", characterSpacing: letterSpacing });
}

function renderEinladung(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  data: Record<string, unknown>,
  w: number,
  h: number,
  aiBg?: string | null,
) {
  drawCanvasBg(doc, spec, w, h, aiBg);

  const partner1 = s(data["partner1"]) || "Anna";
  const partner2 = s(data["partner2"]) || "Markus";
  const datum = s(data["datum"]) || "Sommer 2026";
  const location = s(data["location"]) || "Eure Hochzeitslocation";
  const ort = s(data["ort"]) || "";
  const zeit = s(data["zeit"]) || "15:00 Uhr";
  const rsvp = s(data["rsvp"]) || "Bitte um Rückmeldung bis vier Wochen vor dem Fest.";

  const panelX = w * 0.12;
  const panelY = h * 0.1;
  const panelW = w - 2 * panelX;
  const panelH = h - 2 * panelY;
  const innerMargin = 5 * MM;
  const innerW = panelW - 2 * innerMargin;

  if (aiBg) drawGlassPanel(doc, spec, panelX, panelY, panelW, panelH);

  // Top header
  drawCapsRule(doc, spec, "Wir heiraten", w / 2, panelY + 6 * MM, 7, 2.5, panelW * 0.15, spec.accent);

  // Names — auto-fit each so even long names stay inside the panel
  const cx = w / 2;
  const nameFont = pdfFont(spec, "italic");
  const nameBase = 22;
  const sz1 = fitFontSize(doc, partner1, nameFont, nameBase, innerW * 0.9);
  const sz2 = fitFontSize(doc, partner2, nameFont, nameBase, innerW * 0.9);
  const nameSize = Math.min(sz1, sz2);

  const namesCy = panelY + panelH * 0.42;
  doc.font(nameFont).fontSize(nameSize).fillColor(spec.primary)
    .text(partner1, panelX + innerMargin, namesCy - nameSize * 1.4,
      { width: panelW - 2 * innerMargin, align: "center" });
  doc.font(pdfFont(spec, "italic")).fontSize(nameSize * 0.62).fillColor(spec.accent)
    .text("&", panelX + innerMargin, namesCy - nameSize * 0.3,
      { width: panelW - 2 * innerMargin, align: "center" });
  doc.font(nameFont).fontSize(nameSize).fillColor(spec.primary)
    .text(partner2, panelX + innerMargin, namesCy + nameSize * 0.45,
      { width: panelW - 2 * innerMargin, align: "center" });

  // Date band lower third
  drawCapsRule(doc, spec, datum, cx, panelY + panelH * 0.78, 8, 2, panelW * 0.12, spec.primary, "bold");

  doc.font(pdfFont(spec, "regular")).fontSize(8).fillColor(spec.primary)
    .text(`${zeit} · ${location}`, panelX + innerMargin, panelY + panelH * 0.78 + 4 * MM,
      { width: panelW - 2 * innerMargin, align: "center" });
  if (ort) {
    doc.font(pdfFont(spec, "italic")).fontSize(7).fillColor(spec.accent)
      .text(ort, panelX + innerMargin, doc.y + 1,
        { width: panelW - 2 * innerMargin, align: "center" });
  }
  doc.font(pdfFont(spec, "italic")).fontSize(6.5).fillColor(spec.primary)
    .text(rsvp, panelX + innerMargin, doc.y + 3 * MM,
      { width: panelW - 2 * innerMargin, align: "center" });
}

function renderEinladungInside(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  data: Record<string, unknown>,
  w: number,
  h: number,
  photoBuf: Buffer | null,
) {
  drawBackground(doc, spec, w, h);

  const datum = s(data["datum"]) || "Sommer 2026";
  const zeit = s(data["zeit"]) || "15:00 Uhr";
  const location = s(data["location"]) || "Eure Hochzeitslocation";
  const ort = s(data["ort"]) || "";
  const rsvp = s(data["rsvp"]) || "Bitte um Rückmeldung bis vier Wochen vor dem Fest.";
  const gruss = s(data["gruss"]) ||
    "Wir würden uns von Herzen freuen, diesen besonderen Tag mit euch zu feiern.";

  const margin = 8 * MM;
  const photoH = h * 0.42;
  const photoW = w - 2 * margin;
  const photoR = 1.5 * MM;

  if (photoBuf) {
    doc.save();
    doc.roundedRect(margin, margin, photoW, photoH, photoR).clip();
    try {
      doc.image(photoBuf, margin, margin, { cover: [photoW, photoH], align: "center", valign: "center" });
    } catch {
      doc.rect(margin, margin, photoW, photoH).fill(spec.accent);
    }
    doc.restore();
    doc.save().lineWidth(0.4).strokeColor(spec.accent).opacity(0.5)
      .roundedRect(margin, margin, photoW, photoH, photoR).stroke().restore();
  } else {
    doc.save().lineWidth(0.5).strokeColor(spec.accent).opacity(0.55).dash(3, { space: 3 })
      .roundedRect(margin, margin, photoW, photoH, photoR).stroke().restore();
    doc.font(pdfFont(spec, "italic")).fontSize(11).fillColor(spec.accent).opacity(0.75)
      .text("Euer Foto", 0, margin + photoH / 2 - 6, { width: w, align: "center" });
    doc.opacity(1);
  }

  const textTop = margin + photoH + 5 * MM;

  drawCapsRule(doc, spec, "Wann & wo", w / 2, textTop, 7, 3, w * 0.12, spec.accent);

  const datumFont = pdfFont(spec, "italic");
  const datumSize = fitFontSize(doc, datum, datumFont, 24, w - 2 * margin);
  doc.font(datumFont).fontSize(datumSize).fillColor(spec.primary)
    .text(datum, margin, textTop + 6 * MM, { width: w - 2 * margin, align: "center" });

  doc.font(pdfFont(spec, "regular")).fontSize(9).fillColor(spec.primary)
    .text(`${zeit.toUpperCase()} · ${location}`.toUpperCase(), margin, doc.y + 2 * MM,
      { width: w - 2 * margin, align: "center", characterSpacing: 1.5 });
  if (ort) {
    doc.font(pdfFont(spec, "italic")).fontSize(7.5).fillColor(spec.accent)
      .text(ort, margin, doc.y + 1, { width: w - 2 * margin, align: "center" });
  }

  const grussClamped = gruss.length > 180 ? gruss.slice(0, 177).trimEnd() + "…" : gruss;
  const rsvpClamped = rsvp.length > 140 ? rsvp.slice(0, 137).trimEnd() + "…" : rsvp;

  doc.font(pdfFont(spec, "italic")).fontSize(8).fillColor(spec.primary)
    .text(grussClamped, margin, doc.y + 4 * MM, {
      width: w - 2 * margin, align: "center", lineGap: 2, height: h * 0.18, ellipsis: true,
    });

  // Anchor RSVP below the greeting if it grew past the bottom slot, otherwise pin near the page bottom.
  const rsvpFloor = h - 13 * MM;
  const rsvpY = Math.max(rsvpFloor, doc.y + 3 * MM);
  doc.font(pdfFont(spec, "regular")).fontSize(6.5).fillColor(spec.accent)
    .text(rsvpClamped, margin, rsvpY, {
      width: w - 2 * margin, align: "center", lineGap: 1.5, height: h - rsvpY - 4 * MM, ellipsis: true,
    });
}

function renderTischkarte(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  data: Record<string, unknown>,
  w: number,
  h: number,
  aiBg?: string | null,
) {
  drawCanvasBg(doc, spec, w, h, aiBg);

  const panelX = 4 * MM, panelY = 4 * MM;
  const panelW = w - 8 * MM, panelH = h - 8 * MM;
  const innerW = panelW - 6 * MM;

  if (aiBg) {
    drawGlassPanel(doc, spec, panelX, panelY, panelW, panelH);
  } else {
    doc.save().strokeColor(spec.accent).lineWidth(0.4)
      .rect(3 * MM, 3 * MM, w - 6 * MM, h - 6 * MM).stroke().restore();
  }

  const guest = s(data["gastname"]) || "Gast";
  const tisch = s(data["tisch"]) || "";
  const partner1 = s(data["partner1"]) || "";
  const partner2 = s(data["partner2"]) || "";
  const couple = partner1 && partner2 ? `${partner1} & ${partner2}` : "";

  const nameFont = pdfFont(spec, "italic");
  const guestSize = fitFontSize(doc, guest, nameFont, 14, innerW * 0.9);

  if (couple) {
    doc.font(pdfFont(spec, "regular")).fontSize(5.5).fillColor(spec.accent)
      .text(couple.toUpperCase(), 0, h / 2 - guestSize - 2,
        { width: w, align: "center", characterSpacing: 2 });
  }
  doc.font(nameFont).fontSize(guestSize).fillColor(spec.primary)
    .text(guest, 0, h / 2 - guestSize / 2, { width: w, align: "center" });
  if (tisch) {
    doc.font(pdfFont(spec, "regular")).fontSize(6).fillColor(spec.accent)
      .text(tisch.toUpperCase(), 0, h / 2 + guestSize / 2 + 2,
        { width: w, align: "center", characterSpacing: 2 });
  }
}

function renderMenuekarte(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  data: Record<string, unknown>,
  w: number,
  h: number,
  aiBg?: string | null,
) {
  drawCanvasBg(doc, spec, w, h, aiBg);

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

  const panelX = w * 0.1, panelY = h * 0.07;
  const panelW = w - 2 * panelX, panelH = h - 2 * panelY;
  const innerMargin = 5 * MM;
  const innerW = panelW - 2 * innerMargin;

  if (aiBg) drawGlassPanel(doc, spec, panelX, panelY, panelW, panelH);

  drawCapsRule(doc, spec, "Menü", w / 2, panelY + 6 * MM, 7, 3, panelW * 0.18, spec.accent);

  const couple = `${partner1} & ${partner2}`;
  const coupleFont = pdfFont(spec, "italic");
  const coupleSize = fitFontSize(doc, couple, coupleFont, 14, innerW * 0.85);
  doc.font(coupleFont).fontSize(coupleSize).fillColor(spec.primary)
    .text(couple, panelX + innerMargin, panelY + 13 * MM,
      { width: panelW - 2 * innerMargin, align: "center" });

  if (datum) {
    doc.font(pdfFont(spec, "regular")).fontSize(6).fillColor(spec.accent)
      .text(datum.toUpperCase(), panelX + innerMargin, doc.y + 1,
        { width: panelW - 2 * innerMargin, align: "center", characterSpacing: 3 });
  }

  let y = panelY + 30 * MM;
  for (const c of courses) {
    const vFont = pdfFont(spec, "italic");
    const vSize = fitFontSize(doc, c.v, vFont, 10, innerW * 0.88);
    doc.font(pdfFont(spec, "regular")).fontSize(6).fillColor(spec.accent)
      .text(c.label.toUpperCase(), 0, y, { align: "center", width: w, characterSpacing: 4 });
    y = doc.y + 1;
    doc.font(vFont).fontSize(vSize).fillColor(spec.primary)
      .text(c.v, panelX + innerMargin, y,
        { align: "center", width: panelW - 2 * innerMargin });
    y = doc.y + 4;
  }
}

function renderDankeskarte(
  doc: PDFKit.PDFDocument,
  spec: TemplateSpec,
  data: Record<string, unknown>,
  w: number,
  h: number,
  photoBase64?: string | null,
  aiBg?: string | null,
) {
  drawCanvasBg(doc, spec, w, h, aiBg);

  // Left half: photo (or placeholder), right half: text
  const photoBoxX = 6 * MM;
  const photoBoxY = 6 * MM;
  const photoBoxW = w * 0.42;
  const photoBoxH = h - 12 * MM;

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
    doc.save().strokeColor(spec.accent).lineWidth(0.5).dash(2, { space: 1.5 })
      .rect(photoBoxX, photoBoxY, photoBoxW, photoBoxH).stroke().undash().restore();
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

  if (aiBg) drawGlassPanel(doc, spec, tx - 3 * MM, 4 * MM, tw + 6 * MM, h - 8 * MM);

  doc.font(pdfFont(spec, "regular")).fontSize(6).fillColor(spec.accent)
    .text("DANKE", tx, 12 * MM, { align: "left", width: tw, characterSpacing: 5 });

  const coupleFont = pdfFont(spec, "italic");
  const coupleSize = fitFontSize(doc, `${partner1} & ${partner2}`, coupleFont, 14, tw * 0.95);
  doc.font(coupleFont).fontSize(coupleSize).fillColor(spec.primary)
    .text(`${partner1} & ${partner2}`, tx, doc.y + 3, { width: tw });

  if (datum) {
    doc.font(pdfFont(spec, "regular")).fontSize(6).fillColor(spec.accent)
      .text(datum.toUpperCase(), tx, doc.y + 2, { width: tw, characterSpacing: 3 });
  }
  doc.font(pdfFont(spec, "regular")).fontSize(7.5).fillColor(spec.primary)
    .text(text, tx, doc.y + 5, { width: tw, lineGap: 2 });
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
      const aiBg = input.aiBackgroundDataUrl ?? null;
      switch (input.kind) {
        case "einladung": {
          renderEinladung(doc, input.template, input.data, w, h, aiBg);
          // Page 2: inside / details page (same page size, with photo + venue info)
          doc.addPage({ size: [w, h], margin: 0 });
          const photoBuf = dataUrlToBuffer(input.photoBase64);
          renderEinladungInside(doc, input.template, input.data, w, h, photoBuf);
          break;
        }
        case "tischkarte":
          renderTischkarte(doc, input.template, input.data, w, h, aiBg);
          break;
        case "menuekarte":
          renderMenuekarte(doc, input.template, input.data, w, h, aiBg);
          break;
        case "dankeskarte":
          renderDankeskarte(doc, input.template, input.data, w, h, input.photoBase64, aiBg);
          break;
      }
    } catch (err) {
      reject(err);
      return;
    }
    doc.end();
  });
}
