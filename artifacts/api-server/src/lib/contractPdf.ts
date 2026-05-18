import PDFDocument from "pdfkit";

export interface ContractData {
  auftraggeberName: string;
  auftraggeberAdresse: string;
  auftraggeberPlzOrt: string;
  auftraggeberTelefonEmail: string;
  veranstaltungsort: string;
  datum: string;
  djKuenstler: string;
  spielzeit: string;
  bemerkung: string;
  gage: string;
  verlaengerungProStunde: string;
  anzahlungProzent: string;
  anzahlungFrist: string;
  sondervereinbarungen: string;
  signatureDataUrl: string | null;
  unterschriftDatum: string;
}

// ── Page geometry (A4) ────────────────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 50;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 60;
const CONTENT_W = PAGE_W - 2 * MARGIN_X; // 495.28
const CONTENT_BOTTOM = PAGE_H - MARGIN_BOTTOM; // 781.89

const HEADER_TEXT = "NIWE Events | Aufführungsvertrag Hochzeit / DJ";

// ── Helpers ───────────────────────────────────────────────────────────────────
function setBody(doc: PDFKit.PDFDocument) {
  doc.font("Helvetica").fontSize(9).fillColor("black");
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, gapBefore = 4) {
  doc.x = MARGIN_X;
  doc.y += gapBefore;
  doc.font("Helvetica-Bold").fontSize(10).fillColor("black").text(title, { width: CONTENT_W });
  doc.y += 0.5;
  setBody(doc);
}

function paragraph(doc: PDFKit.PDFDocument, text: string, gapAfter = 2) {
  doc.x = MARGIN_X;
  setBody(doc);
  doc.text(text, { width: CONTENT_W, align: "justify", lineGap: 0.5 });
  doc.y += gapAfter;
}

function bullets(doc: PDFKit.PDFDocument, items: string[], gapAfter = 2) {
  doc.x = MARGIN_X;
  setBody(doc);
  doc.list(items, MARGIN_X, doc.y, {
    width: CONTENT_W,
    bulletRadius: 1.2,
    textIndent: 5,
    bulletIndent: 4,
    lineGap: 0.5,
    paragraphGap: 0.5,
  });
  doc.y += gapAfter;
}

function boldLine(doc: PDFKit.PDFDocument, text: string, gapAfter = 1) {
  doc.x = MARGIN_X;
  doc.font("Helvetica-Bold").fontSize(9).fillColor("black").text(text, { width: CONTENT_W });
  doc.y += gapAfter;
  setBody(doc);
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > CONTENT_BOTTOM) {
    doc.addPage();
    doc.x = MARGIN_X;
    doc.y = MARGIN_TOP;
    setBody(doc);
  }
}

// Force a page break — but only if we're not already at the top of a fresh page
function forcePage(doc: PDFKit.PDFDocument) {
  if (doc.y > MARGIN_TOP + 5) {
    doc.addPage();
    doc.x = MARGIN_X;
    doc.y = MARGIN_TOP;
    setBody(doc);
  }
}

function drawDataTable(doc: PDFKit.PDFDocument, rows: [string, string][]) {
  const tableX = MARGIN_X;
  const labelW = 170;
  const valueW = CONTENT_W - labelW;

  doc.fontSize(9.5);
  for (const [label, value] of rows) {
    const startY = doc.y;
    const labelOpts = { width: labelW - 12, lineGap: 0.5 };
    const valueOpts = { width: valueW - 12, lineGap: 0.5 };

    const labelH = doc.heightOfString(label, labelOpts);
    const valueH = doc.heightOfString(value || "—", valueOpts);
    const rowH = Math.max(labelH, valueH) + 8;

    doc
      .rect(tableX, startY, labelW, rowH)
      .strokeColor("#bbb")
      .lineWidth(0.6)
      .stroke();
    doc
      .rect(tableX + labelW, startY, valueW, rowH)
      .strokeColor("#bbb")
      .lineWidth(0.6)
      .stroke();

    doc.font("Helvetica-Bold").fillColor("#222").text(label, tableX + 6, startY + 5, labelOpts);
    doc.font("Helvetica").fillColor("black").text(value || "—", tableX + labelW + 6, startY + 5, valueOpts);

    doc.y = startY + rowH;
  }
  doc.strokeColor("black").lineWidth(1);
  doc.x = MARGIN_X;
  doc.y += 4;
}

// ── Generator ─────────────────────────────────────────────────────────────────
export async function generateContractPdf(data: ContractData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_X, right: MARGIN_X },
      bufferPages: true,
      info: {
        Title: "Aufführungsvertrag Hochzeit / DJ",
        Author: "NIWE Events",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ═════════════════════════════ PAGE 1 ═════════════════════════════
    setBody(doc);
    doc.x = MARGIN_X;
    doc.y = MARGIN_TOP;

    // Title block
    doc.font("Helvetica-Bold").fontSize(22).fillColor("black").text("AUFFÜHRUNGSVERTRAG", MARGIN_X, doc.y, {
      width: CONTENT_W,
      align: "center",
    });
    doc.moveDown(0.15);
    doc.font("Helvetica").fontSize(12).fillColor("#333").text("Hochzeit / DJ-Leistung", { align: "center" });
    doc.moveDown(0.05);
    doc.fontSize(9).fillColor("#666").text(
      "Vertrag über die musikalische Gestaltung einer privaten Hochzeitsfeier",
      { align: "center" },
    );
    doc.fillColor("black");
    doc.moveDown(0.8);

    // Vertragspartner
    boldLine(doc, "Vertragspartner", 3);

    const partnerStartY = doc.y;
    const colW = (CONTENT_W - 20) / 2; // 20px gap between columns
    const leftX = MARGIN_X;
    const rightX = MARGIN_X + colW + 20;

    // Left column — Auftraggeber
    doc.font("Helvetica-Bold").fontSize(10).fillColor("black").text("Auftraggeber", leftX, partnerStartY, { width: colW });
    doc.font("Helvetica").fontSize(9.5);
    doc.moveDown(0.3);
    const lLineGap = 2;
    doc.text(`Name:  ${data.auftraggeberName}`, leftX, doc.y, { width: colW });
    doc.y += lLineGap;
    doc.text(`Adresse:  ${data.auftraggeberAdresse}`, leftX, doc.y, { width: colW });
    doc.y += lLineGap;
    doc.text(data.auftraggeberPlzOrt, leftX, doc.y, { width: colW });
    doc.y += lLineGap;
    doc.text(`Telefon / E-Mail:  ${data.auftraggeberTelefonEmail}`, leftX, doc.y, { width: colW });
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor("#555").text("\u2013 nachfolgend \u201EAuftraggeber\u201C genannt \u2013", leftX, doc.y, { width: colW });
    const leftEndY = doc.y;

    // Right column — Auftragnehmer
    doc.fontSize(10).font("Helvetica-Bold").fillColor("black").text("Auftragnehmer", rightX, partnerStartY, { width: colW });
    doc.font("Helvetica").fontSize(9.5);
    doc.moveDown(0.3);
    doc.text("NIWE Events", rightX, doc.y, { width: colW });
    doc.y += lLineGap;
    doc.text("Quellenweg 1", rightX, doc.y, { width: colW });
    doc.y += lLineGap;
    doc.text("88480 Achstetten", rightX, doc.y, { width: colW });
    doc.y += lLineGap;
    doc.text("Vertreten durch: Niklas Wetzler", rightX, doc.y, { width: colW });
    doc.y += lLineGap;
    doc.text("E-Mail: wetzler@niwe-events.com", rightX, doc.y, { width: colW });
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor("#555").text("\u2013 nachfolgend \u201EAuftragnehmer\u201C genannt \u2013", rightX, doc.y, { width: colW });
    const rightEndY = doc.y;

    doc.fillColor("black");
    doc.x = MARGIN_X;
    doc.y = Math.max(leftEndY, rightEndY) + 8;

    // §1
    sectionTitle(doc, "§1 Vertragsgegenstand", 0);
    paragraph(
      doc,
      "Der Auftragnehmer übernimmt die musikalische Gestaltung der nachfolgend bezeichneten privaten Hochzeitsveranstaltung des Auftraggebers.",
      3,
    );
    drawDataTable(doc, [
      ["Veranstaltungsort", data.veranstaltungsort],
      ["Datum", data.datum],
      ["DJ / Künstler", data.djKuenstler],
      ["Vereinbarte Spielzeit", data.spielzeit],
      ["Bemerkung", data.bemerkung],
    ]);

    // §2
    sectionTitle(doc, "§2 Leistungen des Auftragnehmers");
    paragraph(doc, "Der Auftragnehmer erbringt im Rahmen dieses Vertrags insbesondere folgende Leistungen:");
    bullets(doc, [
      "Bereitstellung eines professionellen DJs für die vereinbarte Spielzeit.",
      "Musikalische Begleitung und Gestaltung der Hochzeitsfeier nach vorheriger Abstimmung.",
      "Berücksichtigung von Musikwünschen im angemessenen und technisch möglichen Rahmen.",
      "Einsatz professioneller Ton- und, soweit vereinbart, Lichttechnik.",
      "Aufbau, Soundcheck und Abbau des DJ-Setups.",
      "Abstimmung des Ablaufs und besonderer Programmpunkte mit dem Auftraggeber.",
    ]);
    paragraph(
      doc,
      "Die konkrete Musikauswahl liegt während der Veranstaltung im fachlichen Ermessen des DJs. Wünsche des Auftraggebers und der Gäste werden berücksichtigt, sofern sie zum Ablauf und zur Stimmung der Veranstaltung passen.",
    );

    sectionTitle(doc, "§3 Vergütung");
    paragraph(doc, "Für die vereinbarten Leistungen erhält der Auftragnehmer eine Gesamtgage in Höhe von:");
    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("black").text(`${data.gage} netto`, MARGIN_X, doc.y, {
      width: CONTENT_W,
      align: "center",
    });
    doc.moveDown(0.3);
    setBody(doc);
    paragraph(doc, "Gemäß §19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.");

    sectionTitle(doc, "§4 Verlängerungsoption");
    paragraph(doc, "Eine Verlängerung der vereinbarten Spielzeit ist nach Absprache möglich.");
    bullets(doc, [
      `Die Verlängerung wird mit ${data.verlaengerungProStunde} netto pro angefangener Stunde berechnet.`,
      "Die Abrechnung erfolgt im 60-Minuten-Takt.",
      "Eine Verlängerung kann auch spontan während der Veranstaltung vereinbart werden.",
      "Voraussetzung ist, dass keine behördlichen, örtlichen, technischen oder vertraglichen Einschränkungen entgegenstehen.",
      "Die zusätzlich entstandenen Kosten werden im Nachgang mit der Schlussrechnung berechnet.",
    ]);
    paragraph(
      doc,
      "Die Entscheidung über eine Verlängerung erfolgt durch den Auftraggeber oder durch eine von ihm benannte vertretungsberechtigte Person, zum Beispiel Trauzeuge, Trauzeugin oder Veranstaltungsleitung.",
    );

    sectionTitle(doc, "§5 Zahlungsbedingungen");
    bullets(doc, [
      "Die Rechnungsstellung erfolgt nach der Veranstaltung.",
      "Der Auftragnehmer stellt die Rechnung spätestens 7 Tage nach der Veranstaltung.",
      "Das Zahlungsziel beträgt 7 Tage nach Rechnungseingang.",
      "Die Zahlung erfolgt per Überweisung auf das in der Rechnung angegebene Konto.",
    ]);
    paragraph(
      doc,
      `Vereinbarte Anzahlung: ${data.anzahlungProzent} der Gesamtgage, fällig innerhalb ${data.anzahlungFrist} nach Vertragsabschluss.`,
    );

    sectionTitle(doc, "§6 Voraussetzungen und Technik");
    paragraph(
      doc,
      "Der Auftraggeber stellt sicher, dass die für die Durchführung der DJ-Leistung notwendigen Voraussetzungen am Veranstaltungsort vorhanden sind:",
    );
    bullets(doc, [
      "geeignete Stromversorgung in unmittelbarer Nähe des DJ-Platzes, mindestens 230V / 16A;",
      "ausreichend Platz für DJ-Setup, Technik und ggf. Lichttechnik;",
      "stabiler, ebener und sicherer Aufbauort;",
      "bei Outdoor-Events ein vollständig wettergeschützter Aufbauort;",
      "Zugang zur Location mindestens 2 Stunden vor Veranstaltungsbeginn;",
      "Parkmöglichkeit in unmittelbarer Nähe zum Be- und Entladen;",
      "eine verantwortliche Ansprechperson vor Ort.",
    ]);
    paragraph(
      doc,
      "Sollten die genannten Voraussetzungen nicht erfüllt sein und dadurch die Leistung nicht oder nur eingeschränkt erbracht werden können, bleibt der Vergütungsanspruch des Auftragnehmers bestehen, sofern der Auftragnehmer dies nicht zu vertreten hat.",
    );

    sectionTitle(doc, "§7 Private Veranstaltung");
    paragraph(
      doc,
      "Die Veranstaltung ist als private Hochzeitsfeier geplant. Etwaige anfallende Gebühren, Abgaben, Genehmigungen oder Auflagen im Zusammenhang mit der Veranstaltung liegen im Verantwortungsbereich des Auftraggebers beziehungsweise des Betreibers der Veranstaltungsstätte.",
    );

    sectionTitle(doc, "§8 Ablauf und Abstimmung");
    paragraph(
      doc,
      "Der Auftraggeber stellt dem Auftragnehmer spätestens 14 Tage vor der Veranstaltung folgende Informationen zur Verfügung:",
    );
    bullets(doc, [
      "Ablaufplan der Hochzeit;",
      "wichtige Programmpunkte, zum Beispiel Eröffnungstanz, Reden, Spiele oder Überraschungen;",
      "gewünschte Musikrichtungen und besondere Musikwünsche;",
      "Titel oder Musikrichtungen, die nicht gespielt werden sollen;",
      "Kontakt einer verantwortlichen Ansprechperson für den Veranstaltungstag.",
    ]);
    paragraph(
      doc,
      "Änderungen am Ablauf während der Veranstaltung sind nach Möglichkeit mit dem DJ abzustimmen. Der Auftragnehmer bemüht sich, kurzfristige Änderungen im angemessenen Rahmen zu berücksichtigen.",
    );

    sectionTitle(doc, "§9 Lautstärke, Hausordnung und behördliche Auflagen");
    paragraph(
      doc,
      "Der Auftragnehmer hält sich an die Vorgaben der Location, insbesondere an Hausordnung, Sperrzeiten, Lautstärkebegrenzungen und behördliche Auflagen. Der Auftraggeber informiert den Auftragnehmer rechtzeitig über entsprechende Einschränkungen.",
    );
    paragraph(
      doc,
      "Eine Einschränkung der Leistung durch Vorgaben der Location, Behörden oder durch Dritte berechtigt nicht zur Minderung der vereinbarten Vergütung, sofern der Auftragnehmer diese Einschränkung nicht zu vertreten hat.",
    );

    sectionTitle(doc, "§10 Haftung");
    bullets(doc, [
      "Der Auftragnehmer haftet nur für Schäden, die durch Vorsatz oder grobe Fahrlässigkeit verursacht wurden.",
      "Der Auftraggeber haftet für Schäden am Equipment des Auftragnehmers, die durch Gäste, Dienstleister oder sonstige Dritte verursacht werden.",
      "Für höhere Gewalt, zum Beispiel Unwetter, Stromausfall, behördliche Verbote, Krankheit oder sonstige unvorhersehbare Ereignisse, übernimmt keine Partei eine Haftung.",
      "Der Auftragnehmer haftet nicht für Leistungseinschränkungen, die durch fehlende oder mangelhafte Voraussetzungen am Veranstaltungsort entstehen.",
    ]);

    sectionTitle(doc, "§11 Ausfall und Stornierung");
    boldLine(doc, "Absage durch den Auftraggeber:");
    bullets(doc, [
      "bis 90 Tage vor dem Veranstaltungstermin: 30 % der vereinbarten Gage;",
      "bis 30 Tage vor dem Veranstaltungstermin: 60 % der vereinbarten Gage;",
      "weniger als 30 Tage vor dem Veranstaltungstermin: 100 % der vereinbarten Gage.",
    ]);
    paragraph(doc, "Bereits entstandene und nachweisbare Kosten sind zusätzlich zu erstatten.");
    boldLine(doc, "Ausfall des Auftragnehmers:");
    bullets(doc, [
      "Bei Krankheit, höherer Gewalt oder sonstigem unverschuldetem Ausfall bemüht sich der Auftragnehmer um gleichwertigen Ersatz.",
      "Sollte kein Ersatz möglich sein, entfällt die Zahlungspflicht für die nicht erbrachte Leistung.",
      "Weitergehende Ansprüche sind ausgeschlossen, sofern der Ausfall nicht vorsätzlich oder grob fahrlässig verursacht wurde.",
    ]);

    sectionTitle(doc, "§12 Foto-, Video- und Referenznutzung");
    paragraph(
      doc,
      "Eine Nutzung von Foto- oder Videomaterial der Veranstaltung durch den Auftragnehmer zu Werbe- oder Referenzzwecken erfolgt nur nach vorheriger Zustimmung des Auftraggebers. Dies gilt insbesondere für Veröffentlichungen auf Website, Social Media oder in Werbematerialien.",
    );

    sectionTitle(doc, "§13 Sondervereinbarungen");
    if (data.sondervereinbarungen.trim()) {
      paragraph(doc, data.sondervereinbarungen.trim());
    } else {
      // 4 leere Linien wie im Original
      const lineY0 = doc.y + 4;
      for (let i = 0; i < 4; i++) {
        const y = lineY0 + i * 18;
        doc.moveTo(MARGIN_X, y).lineTo(MARGIN_X + CONTENT_W, y).strokeColor("#888").lineWidth(0.5).stroke();
      }
      doc.strokeColor("black").lineWidth(1);
      doc.y = lineY0 + 4 * 18 + 6;
    }

    sectionTitle(doc, "§14 Geheimhaltung");
    paragraph(
      doc,
      "Beide Parteien verpflichten sich, vertrauliche Informationen, persönliche Daten und interne Absprachen nicht unbefugt an Dritte weiterzugeben. Dies gilt auch nach Beendigung des Vertrags.",
    );

    sectionTitle(doc, "§15 Datenschutz");
    paragraph(
      doc,
      "Personenbezogene Daten werden ausschließlich zur Durchführung und Abwicklung dieses Vertrags verarbeitet. Eine Weitergabe an Dritte erfolgt nur, soweit dies zur Vertragserfüllung erforderlich ist oder eine gesetzliche Verpflichtung besteht.",
    );

    sectionTitle(doc, "§16 Salvatorische Klausel");
    paragraph(
      doc,
      "Sollten einzelne Bestimmungen dieses Vertrags ganz oder teilweise unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Die Parteien verpflichten sich, die unwirksame Regelung durch eine wirksame Regelung zu ersetzen, die dem wirtschaftlichen Zweck möglichst nahekommt.",
    );

    sectionTitle(doc, "§17 Schlussbestimmungen");
    bullets(doc, [
      "Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform.",
      "Es gilt deutsches Recht.",
      "Gerichtsstand ist, soweit gesetzlich zulässig, Biberach an der Riß.",
      "Der Vertrag wird in zwei Ausfertigungen erstellt. Jede Partei erhält eine Ausfertigung.",
    ]);

    // ── Unterschriften ───────────────────────────────────────────────────────
    const sigBlockH = 140;
    ensureSpace(doc, sigBlockH);
    doc.x = MARGIN_X;
    // Push signature block to bottom of current page for a clean look
    const sigTop = Math.max(doc.y + 10, CONTENT_BOTTOM - sigBlockH);
    doc.y = sigTop;

    doc.font("Helvetica-Bold").fontSize(12).fillColor("black").text("Unterschriften", MARGIN_X, doc.y, {
      width: CONTENT_W,
    });
    doc.y += 18;

    const sigRowY = doc.y;
    const sigColW = (CONTENT_W - 40) / 2;
    const sigLeftX = MARGIN_X;
    const sigRightX = MARGIN_X + sigColW + 40;

    // Headers
    doc.font("Helvetica-Bold").fontSize(10).fillColor("black").text("Auftraggeber", sigLeftX, sigRowY, { width: sigColW });
    doc.text("Auftragnehmer (NIWE Events)", sigRightX, sigRowY, { width: sigColW });
    doc.font("Helvetica");

    const sigImgTop = sigRowY + 16;
    const sigImgH = 50;
    const sigLineY = sigImgTop + sigImgH + 4;

    // Left: customer signature image
    if (data.signatureDataUrl && data.signatureDataUrl.startsWith("data:image/")) {
      try {
        const base64Part = data.signatureDataUrl.split(",")[1] ?? "";
        const sigBuf = Buffer.from(base64Part, "base64");
        doc.image(sigBuf, sigLeftX, sigImgTop, { fit: [sigColW, sigImgH] });
      } catch {
        /* ignore */
      }
    }

    // Right: provider signature (text)
    doc.font("Helvetica-Oblique").fontSize(13).fillColor("#222").text("Niklas Wetzler", sigRightX, sigImgTop + 18, {
      width: sigColW,
    });

    // Lines + caption
    doc.strokeColor("#333").lineWidth(0.7);
    doc.moveTo(sigLeftX, sigLineY).lineTo(sigLeftX + sigColW, sigLineY).stroke();
    doc.moveTo(sigRightX, sigLineY).lineTo(sigRightX + sigColW, sigLineY).stroke();
    doc.strokeColor("black").lineWidth(1);

    doc.font("Helvetica").fontSize(9.5).fillColor("#222")
      .text(`${data.unterschriftDatum},  ${data.auftraggeberName}`, sigLeftX, sigLineY + 4, { width: sigColW });
    doc.text(`${data.unterschriftDatum},  Niklas Wetzler`, sigRightX, sigLineY + 4, { width: sigColW });

    doc.fontSize(9).fillColor("#666")
      .text("Datum, Unterschrift", sigLeftX, sigLineY + 20, { width: sigColW });
    doc.text("Datum, Unterschrift", sigRightX, sigLineY + 20, { width: sigColW });
    doc.fillColor("black");

    // ── Add header + page numbers to all pages ───────────────────────────────
    const range = doc.bufferedPageRange();
    const totalPages = range.count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(range.start + i);
      // Top header
      doc.font("Helvetica").fontSize(8.5).fillColor("#666").text(
        HEADER_TEXT,
        MARGIN_X,
        26,
        { width: CONTENT_W, align: "right", lineBreak: false },
      );
      // Bottom page number
      doc.fontSize(9).fillColor("#666").text(
        `Seite ${i + 1} von ${totalPages}`,
        MARGIN_X,
        PAGE_H - 36,
        { width: CONTENT_W, align: "center", lineBreak: false },
      );
      doc.fillColor("black");
    }

    doc.end();
  });
}
