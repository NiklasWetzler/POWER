import PDFDocument from "pdfkit";

export interface QuestionnaireData {
  brautpaar: string;
  datum: string | null;
  location: string | null;
  formData: Record<string, unknown>;
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 55;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 60;
const CONTENT_W = PAGE_W - 2 * MARGIN_X;
const CONTENT_BOTTOM = PAGE_H - MARGIN_BOTTOM;

const GENRES = [
  "Pop", "Rock", "Charts / Aktuelles", "Oldies (60er–80er)", "90er / 2000er",
  "Hip-Hop / R'n'B", "House / EDM", "Schlager", "Disco / Funk", "Soul / Motown",
  "Jazz / Swing", "Klassik", "Volksmusik",
];
const ALTER_OPTIONS: { id: string; label: string }[] = [
  { id: "unter20", label: "unter 20" },
  { id: "20bis35", label: "20–35" },
  { id: "35bis50", label: "35–50" },
  { id: "50plus", label: "50+" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).map(String) : [];
}

function body(doc: PDFKit.PDFDocument) {
  doc.font("Helvetica").fontSize(10.5).fillColor("black");
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > CONTENT_BOTTOM) {
    doc.addPage();
    doc.x = MARGIN_X;
    doc.y = MARGIN_TOP;
    body(doc);
  }
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, gapBefore = 16, gapAfter = 8) {
  ensureSpace(doc, 38);
  doc.x = MARGIN_X;
  doc.y += gapBefore;
  const top = doc.y;
  // Small gold accent bar to the left of the title
  doc.save().rect(MARGIN_X, top + 1, 3, 14).fillColor("#c9a55a").fill().restore();
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#1a1a1a")
    .text(title, MARGIN_X + 10, top, { width: CONTENT_W - 10 });
  doc.y = Math.max(doc.y, top + 16);
  // Hairline under section title
  const ruleY = doc.y + 2;
  doc.save().lineWidth(0.4).strokeColor("#e7d9b4")
    .moveTo(MARGIN_X, ruleY).lineTo(MARGIN_X + CONTENT_W, ruleY).stroke().restore();
  doc.y = ruleY + gapAfter;
  body(doc);
}

function label(doc: PDFKit.PDFDocument, text: string, gapAfter = 2) {
  ensureSpace(doc, 18 + gapAfter);
  doc.x = MARGIN_X;
  doc.font("Helvetica").fontSize(10.5).fillColor("#222").text(text, { width: CONTENT_W });
  doc.y += gapAfter;
}

// Fills a value on a thin underline. If value is empty, draws dotted line.
function valueLine(doc: PDFKit.PDFDocument, value: string, gapAfter = 8) {
  ensureSpace(doc, 20 + gapAfter);
  doc.x = MARGIN_X;
  const top = doc.y + 2;
  const v = value.trim();
  if (v) {
    doc.font("Helvetica").fontSize(10.5).fillColor("black").text(v, MARGIN_X, top, {
      width: CONTENT_W,
    });
    const after = doc.y + 2;
    doc.moveTo(MARGIN_X, after).lineTo(MARGIN_X + CONTENT_W, after)
      .strokeColor("#bbb").lineWidth(0.5).stroke();
    doc.y = after + gapAfter;
  } else {
    const lineY = top + 12;
    drawDotted(doc, MARGIN_X, lineY, MARGIN_X + CONTENT_W);
    doc.y = lineY + gapAfter;
  }
  doc.strokeColor("black").lineWidth(1);
}

function drawDotted(doc: PDFKit.PDFDocument, x1: number, y: number, x2: number) {
  doc.save();
  doc.lineWidth(0.6).strokeColor("#aaa").dash(1.6, { space: 2 });
  doc.moveTo(x1, y).lineTo(x2, y).stroke();
  doc.undash();
  doc.restore();
}

// Draws a checkbox at (x, y). If checked, adds an X inside.
function checkbox(doc: PDFKit.PDFDocument, x: number, y: number, checked: boolean, size = 9) {
  doc.save();
  doc.lineWidth(0.7).strokeColor("#333");
  doc.rect(x, y, size, size).stroke();
  if (checked) {
    doc.lineWidth(1).strokeColor("#000");
    doc.moveTo(x + 1.2, y + 1.2).lineTo(x + size - 1.2, y + size - 1.2).stroke();
    doc.moveTo(x + size - 1.2, y + 1.2).lineTo(x + 1.2, y + size - 1.2).stroke();
  }
  doc.restore();
}

// Renders checkbox + label inline at current position
function checkLabel(doc: PDFKit.PDFDocument, x: number, y: number, text: string, checked: boolean, maxW = 120) {
  checkbox(doc, x, y + 1.5, checked);
  doc.font("Helvetica").fontSize(10).fillColor("black")
    .text(text, x + 13, y, { width: maxW, lineBreak: false });
}

function checkRow(doc: PDFKit.PDFDocument, options: { label: string; checked: boolean }[], colW = 130, gapAfter = 8) {
  const cols = Math.max(1, Math.floor(CONTENT_W / colW));
  const rows = Math.ceil(options.length / cols);
  ensureSpace(doc, rows * 16 + gapAfter + 4);
  doc.x = MARGIN_X;
  const startY = doc.y + 2;
  options.forEach((opt, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN_X + col * colW;
    const y = startY + row * 16;
    checkLabel(doc, x, y, opt.label, opt.checked, colW - 18);
  });
  doc.y = startY + rows * 16 + gapAfter;
}

function yesNoStyle(doc: PDFKit.PDFDocument, question: string, value: string, styleValue: string, styleLabel = "Stil") {
  label(doc, question, 4);
  const startY = doc.y;
  checkLabel(doc, MARGIN_X, startY, "Ja", value === "Ja", 40);
  checkLabel(doc, MARGIN_X + 60, startY, "Nein", value === "Nein", 50);
  doc.y = startY + 16;
  if (value === "Ja" && styleValue.trim()) {
    doc.font("Helvetica").fontSize(10).fillColor("#444")
      .text(`${styleLabel}: ${styleValue.trim()}`, MARGIN_X + 13, doc.y, { width: CONTENT_W - 13 });
    doc.y += 4;
  }
  doc.y += 6;
}

function multilineValue(doc: PDFKit.PDFDocument, value: string, minLines = 2, gapAfter = 8) {
  ensureSpace(doc, minLines * 16 + gapAfter + 4);
  doc.x = MARGIN_X;
  const v = value.trim();
  if (v) {
    doc.font("Helvetica").fontSize(10.5).fillColor("black").text(v, MARGIN_X, doc.y, {
      width: CONTENT_W,
      lineGap: 1,
    });
    doc.y += 2;
    doc.moveTo(MARGIN_X, doc.y).lineTo(MARGIN_X + CONTENT_W, doc.y)
      .strokeColor("#bbb").lineWidth(0.5).stroke();
    doc.y += gapAfter;
  } else {
    const top = doc.y + 4;
    for (let i = 0; i < minLines; i++) {
      const lineY = top + i * 16;
      drawDotted(doc, MARGIN_X, lineY, MARGIN_X + CONTENT_W);
    }
    doc.y = top + minLines * 16 + gapAfter - 4;
  }
  doc.strokeColor("black").lineWidth(1);
}

function labeledValue(doc: PDFKit.PDFDocument, labelText: string, value: string, gapAfter = 8) {
  ensureSpace(doc, 24 + gapAfter);
  doc.x = MARGIN_X;
  const lblW = 150;
  const valX = MARGIN_X + lblW;
  const valW = CONTENT_W - lblW;
  const startY = doc.y;
  doc.font("Helvetica").fontSize(10).fillColor("#444")
    .text(labelText, MARGIN_X, startY, { width: lblW - 6 });
  const v = value.trim();
  if (v) {
    doc.font("Helvetica").fontSize(10.5).fillColor("black")
      .text(v, valX, startY, { width: valW });
    const after = Math.max(doc.y, startY + 14);
    doc.moveTo(valX, after).lineTo(valX + valW, after)
      .strokeColor("#bbb").lineWidth(0.5).stroke();
    doc.y = after + gapAfter;
  } else {
    const lineY = startY + 14;
    drawDotted(doc, valX, lineY, valX + valW);
    doc.y = lineY + gapAfter;
  }
  doc.strokeColor("black").lineWidth(1);
}

function pageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = 0; i < total; i++) {
    doc.switchToPage(range.start + i);
    const origTop = doc.page.margins.top;
    const origBottom = doc.page.margins.bottom;
    doc.page.margins.top = 0;
    doc.page.margins.bottom = 0;
    doc.font("Helvetica").fontSize(8.5).fillColor("#666").text(
      "NIWE Weddings · Musiknachfragebogen",
      MARGIN_X, 26,
      { width: CONTENT_W, align: "right", lineBreak: false },
    );
    doc.fontSize(9).fillColor("#666").text(
      `Seite ${i + 1} von ${total}`,
      MARGIN_X, PAGE_H - 36,
      { width: CONTENT_W, align: "center", lineBreak: false },
    );
    doc.fillColor("black");
    doc.page.margins.top = origTop;
    doc.page.margins.bottom = origBottom;
  }
}

// ── Generator ─────────────────────────────────────────────────────────────────
export async function generateQuestionnairePdf(data: QuestionnaireData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_X, right: MARGIN_X },
      bufferPages: true,
      info: { Title: "Musiknachfragebogen", Author: "NIWE Weddings" },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const fd = data.formData;
    body(doc);
    doc.x = MARGIN_X;
    doc.y = MARGIN_TOP;

    // Title — elegant typographic mark with gold rule
    doc.font("Helvetica").fontSize(8.5).fillColor("#c9a55a")
      .text("N I W E   W E D D I N G S", MARGIN_X, doc.y, {
        width: CONTENT_W, align: "center", characterSpacing: 1.6,
      });
    doc.moveDown(0.4);
    doc.font("Helvetica-Bold").fontSize(24).fillColor("#1a1a1a")
      .text("Musiknachfragebogen", MARGIN_X, doc.y, { width: CONTENT_W, align: "center" });
    doc.moveDown(0.4);
    // Thin gold rule under title
    {
      const ruleY = doc.y;
      const ruleW = 60;
      const ruleX = MARGIN_X + (CONTENT_W - ruleW) / 2;
      doc.save().lineWidth(0.8).strokeColor("#c9a55a")
        .moveTo(ruleX, ruleY).lineTo(ruleX + ruleW, ruleY).stroke().restore();
    }
    doc.moveDown(0.6);
    doc.font("Helvetica").fontSize(9.5).fillColor("#666")
      .text(
        "Bitte möglichst vollständig ausfüllen — je mehr wir wissen, desto besser wird euer großer Tag.",
        MARGIN_X, doc.y, { width: CONTENT_W, align: "center" },
      );
    doc.fillColor("black");
    doc.moveDown(0.8);

    // ═══════════════════════════ 1. Allgemeine Angaben ═══════════════════════
    sectionTitle(doc, "1. Allgemeine Angaben", 6);

    label(doc, "Namen des Brautpaares:");
    valueLine(doc, data.brautpaar);

    const datumOrt = [
      data.datum ? formatDate(data.datum) : "",
      str(data.location),
    ].filter(Boolean).join(", ");
    label(doc, "Datum & Ort der Hochzeit:");
    valueLine(doc, datumOrt);

    label(doc, "Anzahl der Gäste:");
    valueLine(doc, str(fd.gaeste));

    label(doc, "Durchschnittsalter der Gäste:");
    const selAlter = arr(fd.selectedAlter);
    checkRow(
      doc,
      ALTER_OPTIONS.map((a) => ({ label: a.label, checked: selAlter.includes(a.id) })),
      110,
      6,
    );

    label(doc, "Altersverteilung der Gäste (ungefähr):");
    valueLine(doc, str(fd.altersverteilung));

    // ═══════════════════════════ 2. Musikgeschmack ═══════════════════════════
    sectionTitle(doc, "2. Musikgeschmack & Genrevorlieben");

    label(doc, "Welche Musikrichtungen mögt ihr besonders gern? (Mehrfachauswahl möglich)");
    const selGenres = arr(fd.selectedGenres);
    checkRow(
      doc,
      GENRES.map((g) => ({ label: g, checked: selGenres.includes(g) })),
      155,
      4,
    );
    // "Internationale Musik" + "Sonstiges" with free text
    const intl = selGenres.includes("Internationale Musik");
    const sonst = selGenres.includes("Sonstiges");
    if (intl || sonst) {
      doc.x = MARGIN_X;
      const yStart = doc.y;
      doc.font("Helvetica").fontSize(10).fillColor("#444")
        .text(
          [
            intl ? "Internationale Musik enthalten" : "",
            sonst ? "Sonstiges enthalten" : "",
          ].filter(Boolean).join(" · "),
          MARGIN_X, yStart, { width: CONTENT_W },
        );
      doc.y += 6;
    }

    label(doc, "Welche Musikrichtungen sollten vermieden werden?");
    valueLine(doc, str(fd.vermeiden));

    // Page break before favorites for clean layout
    if (doc.y > CONTENT_BOTTOM - 200) {
      doc.addPage();
      doc.x = MARGIN_X;
      doc.y = MARGIN_TOP;
      body(doc);
    }

    label(doc, "Lieblingssongs / -künstler (max. 5):", 4);
    for (let i = 1; i <= 5; i++) {
      labeledValue(doc, `${i}.`, str(fd[`lieblingssong_${i}`]), 4);
    }

    const spotify = str(fd.spotifyPlaylist);
    if (spotify) {
      label(doc, "Spotify-Playlist:");
      valueLine(doc, spotify);
    }

    label(doc, "Songs oder Künstler, die nicht gespielt werden sollen:", 4);
    labeledValue(doc, "1.", str(fd.verboten), 4);
    labeledValue(doc, "2.", "", 8);

    // ═══════════════════════════ 3. Musikverlauf ═════════════════════════════
    sectionTitle(doc, "3. Musikverlauf der Feier");

    yesNoStyle(doc, "Musik beim Sektempfang?", str(fd.sektempfangMusik), str(fd.sektStil));
    yesNoStyle(doc, "Musik beim Essen?", str(fd.essensMusik), str(fd.essensStil));

    // Eröffnungstanz with song + Choreo/Klassisch
    label(doc, "Eröffnungstanz gewünscht?", 4);
    {
      const startY = doc.y;
      const v = str(fd.eröffnungstanz);
      checkLabel(doc, MARGIN_X, startY, "Ja", v === "Ja", 40);
      checkLabel(doc, MARGIN_X + 60, startY, "Nein", v === "Nein", 50);
      doc.y = startY + 16;
      if (v === "Ja") {
        labeledValue(doc, "Songtitel:", str(fd.eröffnungSong), 4);
        const typen = arr(fd.eröffnungTyp);
        const tY = doc.y;
        checkLabel(doc, MARGIN_X, tY, "Choreografie", typen.includes("Choreografie"), 100);
        checkLabel(doc, MARGIN_X + 140, tY, "Klassischer Hochzeitstanz", typen.includes("Klassischer Hochzeitstanz"), 200);
        doc.y = tY + 16;
      }
      doc.y += 4;
    }

    label(doc, "Musik zu besonderen Programmpunkten:", 4);
    labeledValue(doc, "Einzug:", str(fd.einzug), 4);
    labeledValue(doc, "Torte:", str(fd.torte), 4);
    labeledValue(doc, "Brautstraußwurf:", str(fd.brautstrauss), 4);
    labeledValue(doc, "Sonstige Punkte:", str(fd.sonstigePunkte), 8);

    label(doc, "Dürfen Gäste Musikwünsche äußern?", 4);
    {
      const v = str(fd.gästeWünsche);
      const sY = doc.y;
      checkLabel(doc, MARGIN_X, sY, "Ja", v === "Ja", 40);
      checkLabel(doc, MARGIN_X + 60, sY, "Nein", v === "Nein", 50);
      checkLabel(doc, MARGIN_X + 120, sY, "Nur passende Wünsche", v === "Nur passende Wünsche", 200);
      doc.y = sY + 18;
    }

    // ═══════════════════════════ 4. Technik & Ablauf ═════════════════════════
    sectionTitle(doc, "4. Technik & Ablauf");

    labeledValue(doc, "Ab wann soll Musik gespielt werden?", str(fd.musikAb));
    labeledValue(doc, "Ab wann darf aufgebaut werden?", str(fd.aufbauAb));
    labeledValue(doc, "Bis wann darf Musik laufen?", str(fd.musikBis));

    label(doc, "Lautstärkeregeln?", 4);
    {
      const v = str(fd.lautstärke);
      const sY = doc.y;
      checkLabel(doc, MARGIN_X, sY, "Ja", v === "Ja", 40);
      checkLabel(doc, MARGIN_X + 60, sY, "Nein", v === "Nein", 50);
      doc.y = sY + 16;
      if (v === "Ja" && str(fd.lautstärkeRegel)) {
        doc.font("Helvetica").fontSize(10).fillColor("#444")
          .text(`Regel: ${str(fd.lautstärkeRegel)}`, MARGIN_X + 13, doc.y, { width: CONTENT_W - 13 });
        doc.y += 6;
      }
      doc.y += 4;
    }

    label(doc, "Ist Technik (Musikanlage, Licht etc.) vor Ort vorhanden?", 4);
    {
      const v = str(fd.technikVorhanden);
      const sY = doc.y;
      checkLabel(doc, MARGIN_X, sY, "Ja", v === "Ja", 40);
      checkLabel(doc, MARGIN_X + 60, sY, "Nein", v === "Nein", 50);
      doc.y = sY + 20;
    }

    label(doc, "Besonderheiten zur Location (Strom, Aufbau, Musikanschlüsse, Bühne):", 4);
    const besonderheiten = [
      str(fd.locationBes) && `Allgemein: ${str(fd.locationBes)}`,
      str(fd.strom) && `Strom: ${str(fd.strom)}`,
      str(fd.aufbauInfo) && `Aufbau: ${str(fd.aufbauInfo)}`,
      str(fd.musikanschluss) && `Musikanschlüsse: ${str(fd.musikanschluss)}`,
      str(fd.buehne) && `Bühne: ${str(fd.buehne)}`,
    ].filter(Boolean).join("\n");
    multilineValue(doc, besonderheiten, 3);

    // ═══════════════════════════ 5. Weitere Hinweise ═════════════════════════
    sectionTitle(doc, "5. Weitere Hinweise & Wünsche");

    label(doc, "Ablaufwünsche für den musikalischen Abend (z. B. loungig → Party):", 4);
    multilineValue(doc, str(fd.besondereWuensche), 2);

    label(doc, "Sonstige Hinweise oder Anregungen:", 4);
    multilineValue(doc, str(fd.sonstigeHinweise), 2);

    doc.moveDown(1);
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("#666")
      .text("Bei weiteren Fragen bitte an den vermittelten DJ wenden.", MARGIN_X, doc.y, {
        width: CONTENT_W, align: "center",
      });
    doc.moveDown(0.3);
    doc.text("Wir wünschen euch eine unvergessliche Hochzeit!", MARGIN_X, doc.y, {
      width: CONTENT_W, align: "center",
    });
    doc.fillColor("black");

    pageNumbers(doc);
    doc.flushPages();
    doc.end();
  });
}

function formatDate(d: string): string {
  // Accepts YYYY-MM-DD; outputs DD.MM.YYYY. Other strings pass through.
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-");
    return `${day}.${m}.${y}`;
  }
  return d;
}
