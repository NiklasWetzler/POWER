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

const FOOTER = "NIWE Events | Aufführungsvertrag Hochzeit / DJ";

function addHeader(doc: PDFKit.PDFDocument) {
  doc.fontSize(8).fillColor("#666").text(FOOTER, 50, 30, { align: "left", width: 500 });
  doc.fillColor("black");
}

function addPageNumber(doc: PDFKit.PDFDocument, page: number, total: number) {
  doc.fontSize(9).fillColor("#666").text(`Seite ${page} von ${total}`, 50, 770, {
    align: "center",
    width: 500,
  });
  doc.fillColor("black");
}

function paragraph(doc: PDFKit.PDFDocument, text: string, opts: { gap?: number } = {}) {
  doc.fontSize(10).fillColor("black").text(text, { align: "justify", lineGap: 2 });
  if (opts.gap !== undefined) doc.moveDown(opts.gap);
  else doc.moveDown(0.5);
}

function bullet(doc: PDFKit.PDFDocument, lines: string[]) {
  doc.fontSize(10).fillColor("black").list(lines, { bulletRadius: 1.5, lineGap: 2, textIndent: 8 });
  doc.moveDown(0.4);
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor("black").font("Helvetica-Bold").text(title);
  doc.font("Helvetica");
  doc.moveDown(0.2);
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number, addHeaderFn: () => void) {
  if (doc.y + needed > 740) {
    doc.addPage();
    addHeaderFn();
  }
}

export async function generateContractPdf(data: ContractData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 60, left: 50, right: 50 },
      info: {
        Title: "Aufführungsvertrag Hochzeit / DJ",
        Author: "NIWE Events",
      },
    });

    const buffers: Buffer[] = [];
    doc.on("data", (b: Buffer) => buffers.push(b));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const TOTAL_PAGES = 4;
    let currentPage = 1;

    const headerFn = () => {
      addHeader(doc);
      doc.y = 50;
    };

    doc.on("pageAdded", () => {
      currentPage++;
      addPageNumber(doc, currentPage, TOTAL_PAGES);
    });

    // ── Page 1 ─────────────────────────────────────────────────
    headerFn();
    addPageNumber(doc, 1, TOTAL_PAGES);

    doc.moveDown(1.2);
    doc.fontSize(20).font("Helvetica-Bold").text("AUFFÜHRUNGSVERTRAG", { align: "center" });
    doc.fontSize(13).font("Helvetica").fillColor("#444").text("Hochzeit / DJ-Leistung", { align: "center" });
    doc.fontSize(10).fillColor("#666").text(
      "Vertrag über die musikalische Gestaltung einer privaten Hochzeitsfeier",
      { align: "center" },
    );
    doc.fillColor("black");
    doc.moveDown(1.2);

    // Vertragspartner
    doc.fontSize(12).font("Helvetica-Bold").text("Vertragspartner");
    doc.moveDown(0.5);

    // Two-column box
    const colW = 235;
    const startY = doc.y;
    const leftX = 50;
    const rightX = 310;

    doc.fontSize(10).font("Helvetica-Bold").text("Auftraggeber", leftX, startY, { width: colW });
    doc.font("Helvetica");
    doc.moveDown(0.4);
    doc.text(`Name: ${data.auftraggeberName}`, leftX, doc.y, { width: colW });
    doc.text(`Adresse: ${data.auftraggeberAdresse}`, leftX, doc.y, { width: colW });
    doc.text(data.auftraggeberPlzOrt, leftX, doc.y, { width: colW });
    doc.text(`Telefon/E-Mail: ${data.auftraggeberTelefonEmail}`, leftX, doc.y, { width: colW });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#555").text("- nachfolgend \u201EAuftraggeber\u201C genannt -", leftX, doc.y, { width: colW });
    const leftEndY = doc.y;
    doc.fillColor("black");

    // Right column
    doc.fontSize(10).font("Helvetica-Bold").text("Auftragnehmer", rightX, startY, { width: colW });
    doc.font("Helvetica");
    doc.moveDown(0.4);
    doc.text("NIWE Events", rightX, doc.y, { width: colW });
    doc.text("Quellenweg 1", rightX, doc.y, { width: colW });
    doc.text("88480 Achstetten", rightX, doc.y, { width: colW });
    doc.text("Vertreten durch: Niklas Wetzler", rightX, doc.y, { width: colW });
    doc.text("E-Mail: wetzler@niwe-events.com", rightX, doc.y, { width: colW });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#555").text("- nachfolgend \u201EAuftragnehmer\u201C genannt -", rightX, doc.y, { width: colW });
    doc.fillColor("black");

    doc.y = Math.max(leftEndY, doc.y) + 15;
    doc.x = 50;

    // §1
    section(doc, "§1 Vertragsgegenstand");
    paragraph(
      doc,
      "Der Auftragnehmer übernimmt die musikalische Gestaltung der nachfolgend bezeichneten privaten Hochzeitsveranstaltung des Auftraggebers.",
    );

    // Veranstaltungsdetails als kleine Tabelle
    const detailRows: [string, string][] = [
      ["Veranstaltungsort", data.veranstaltungsort],
      ["Datum", data.datum],
      ["DJ / Künstler", data.djKuenstler],
      ["Vereinbarte Spielzeit", data.spielzeit],
      ["Bemerkung", data.bemerkung],
    ];
    const tableX = 50;
    const labelW = 160;
    const valueW = 335;
    doc.fontSize(10);
    detailRows.forEach(([k, v]) => {
      const rowY = doc.y;
      doc.font("Helvetica-Bold").text(k, tableX + 5, rowY + 4, { width: labelW - 10 });
      const labelHeight = doc.y - rowY;
      doc.font("Helvetica").text(v || "—", tableX + labelW + 5, rowY + 4, { width: valueW - 10 });
      const rowH = Math.max(doc.y - rowY, labelHeight) + 4;
      doc
        .rect(tableX, rowY, labelW, rowH)
        .strokeColor("#ccc")
        .stroke();
      doc
        .rect(tableX + labelW, rowY, valueW, rowH)
        .strokeColor("#ccc")
        .stroke();
      doc.y = rowY + rowH;
    });
    doc.strokeColor("black");
    doc.moveDown(0.6);

    section(doc, "§2 Leistungen des Auftragnehmers");
    paragraph(doc, "Der Auftragnehmer erbringt im Rahmen dieses Vertrags insbesondere folgende Leistungen:");
    bullet(doc, [
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

    // ── Page 2 ─────────────────────────────────────────────────
    doc.addPage();
    headerFn();

    section(doc, "§3 Vergütung");
    paragraph(doc, "Für die vereinbarten Leistungen erhält der Auftragnehmer eine Gesamtgage in Höhe von:");
    doc.font("Helvetica-Bold").fontSize(13).text(`${data.gage} netto`, { align: "center" });
    doc.font("Helvetica").fontSize(10);
    doc.moveDown(0.4);
    paragraph(doc, "Gemäß §19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.");

    section(doc, "§4 Verlängerungsoption");
    paragraph(doc, "Eine Verlängerung der vereinbarten Spielzeit ist nach Absprache möglich.");
    bullet(doc, [
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

    section(doc, "§5 Zahlungsbedingungen");
    bullet(doc, [
      "Die Rechnungsstellung erfolgt nach der Veranstaltung.",
      "Der Auftragnehmer stellt die Rechnung spätestens 7 Tage nach der Veranstaltung.",
      "Das Zahlungsziel beträgt 7 Tage nach Rechnungseingang.",
      "Die Zahlung erfolgt per Überweisung auf das in der Rechnung angegebene Konto.",
    ]);
    paragraph(
      doc,
      `Vereinbarte Anzahlung: ${data.anzahlungProzent} der Gesamtgage, fällig innerhalb ${data.anzahlungFrist} nach Vertragsabschluss.`,
    );

    section(doc, "§6 Voraussetzungen und Technik");
    paragraph(
      doc,
      "Der Auftraggeber stellt sicher, dass die für die Durchführung der DJ-Leistung notwendigen Voraussetzungen am Veranstaltungsort vorhanden sind:",
    );
    bullet(doc, [
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

    // ── Page 3 ─────────────────────────────────────────────────
    doc.addPage();
    headerFn();

    section(doc, "§7 Private Veranstaltung");
    paragraph(
      doc,
      "Die Veranstaltung ist als private Hochzeitsfeier geplant. Etwaige anfallende Gebühren, Abgaben, Genehmigungen oder Auflagen im Zusammenhang mit der Veranstaltung liegen im Verantwortungsbereich des Auftraggebers beziehungsweise des Betreibers der Veranstaltungsstätte.",
    );

    section(doc, "§8 Ablauf und Abstimmung");
    paragraph(
      doc,
      "Der Auftraggeber stellt dem Auftragnehmer spätestens 14 Tage vor der Veranstaltung folgende Informationen zur Verfügung:",
    );
    bullet(doc, [
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

    section(doc, "§9 Lautstärke, Hausordnung und behördliche Auflagen");
    paragraph(
      doc,
      "Der Auftragnehmer hält sich an die Vorgaben der Location, insbesondere an Hausordnung, Sperrzeiten, Lautstärkebegrenzungen und behördliche Auflagen. Der Auftraggeber informiert den Auftragnehmer rechtzeitig über entsprechende Einschränkungen.",
    );
    paragraph(
      doc,
      "Eine Einschränkung der Leistung durch Vorgaben der Location, Behörden oder durch Dritte berechtigt nicht zur Minderung der vereinbarten Vergütung, sofern der Auftragnehmer diese Einschränkung nicht zu vertreten hat.",
    );

    section(doc, "§10 Haftung");
    bullet(doc, [
      "Der Auftragnehmer haftet nur für Schäden, die durch Vorsatz oder grobe Fahrlässigkeit verursacht wurden.",
      "Der Auftraggeber haftet für Schäden am Equipment des Auftragnehmers, die durch Gäste, Dienstleister oder sonstige Dritte verursacht werden.",
      "Für höhere Gewalt, zum Beispiel Unwetter, Stromausfall, behördliche Verbote, Krankheit oder sonstige unvorhersehbare Ereignisse, übernimmt keine Partei eine Haftung.",
      "Der Auftragnehmer haftet nicht für Leistungseinschränkungen, die durch fehlende oder mangelhafte Voraussetzungen am Veranstaltungsort entstehen.",
    ]);

    section(doc, "§11 Ausfall und Stornierung");
    doc.font("Helvetica-Bold").fontSize(10).text("Absage durch den Auftraggeber:");
    doc.font("Helvetica");
    bullet(doc, [
      "bis 90 Tage vor dem Veranstaltungstermin: 30 % der vereinbarten Gage;",
      "bis 30 Tage vor dem Veranstaltungstermin: 60 % der vereinbarten Gage;",
      "weniger als 30 Tage vor dem Veranstaltungstermin: 100 % der vereinbarten Gage.",
    ]);
    paragraph(doc, "Bereits entstandene und nachweisbare Kosten sind zusätzlich zu erstatten.");
    doc.font("Helvetica-Bold").fontSize(10).text("Ausfall des Auftragnehmers:");
    doc.font("Helvetica");
    bullet(doc, [
      "Bei Krankheit, höherer Gewalt oder sonstigem unverschuldetem Ausfall bemüht sich der Auftragnehmer um gleichwertigen Ersatz.",
      "Sollte kein Ersatz möglich sein, entfällt die Zahlungspflicht für die nicht erbrachte Leistung.",
      "Weitergehende Ansprüche sind ausgeschlossen, sofern der Ausfall nicht vorsätzlich oder grob fahrlässig verursacht wurde.",
    ]);

    // ── Page 4 ─────────────────────────────────────────────────
    doc.addPage();
    headerFn();

    section(doc, "§12 Foto-, Video- und Referenznutzung");
    paragraph(
      doc,
      "Eine Nutzung von Foto- oder Videomaterial der Veranstaltung durch den Auftragnehmer zu Werbe- oder Referenzzwecken erfolgt nur nach vorheriger Zustimmung des Auftraggebers. Dies gilt insbesondere für Veröffentlichungen auf Website, Social Media oder in Werbematerialien.",
    );

    section(doc, "§13 Sondervereinbarungen");
    if (data.sondervereinbarungen.trim()) {
      paragraph(doc, data.sondervereinbarungen.trim());
    } else {
      doc.fontSize(10).fillColor("#999").text("—keine—");
      doc.fillColor("black");
      doc.moveDown(0.5);
    }

    section(doc, "§14 Geheimhaltung");
    paragraph(
      doc,
      "Beide Parteien verpflichten sich, vertrauliche Informationen, persönliche Daten und interne Absprachen nicht unbefugt an Dritte weiterzugeben. Dies gilt auch nach Beendigung des Vertrags.",
    );

    section(doc, "§15 Datenschutz");
    paragraph(
      doc,
      "Personenbezogene Daten werden ausschließlich zur Durchführung und Abwicklung dieses Vertrags verarbeitet. Eine Weitergabe an Dritte erfolgt nur, soweit dies zur Vertragserfüllung erforderlich ist oder eine gesetzliche Verpflichtung besteht.",
    );

    section(doc, "§16 Salvatorische Klausel");
    paragraph(
      doc,
      "Sollten einzelne Bestimmungen dieses Vertrags ganz oder teilweise unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Die Parteien verpflichten sich, die unwirksame Regelung durch eine wirksame Regelung zu ersetzen, die dem wirtschaftlichen Zweck möglichst nahekommt.",
    );

    section(doc, "§17 Schlussbestimmungen");
    bullet(doc, [
      "Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform.",
      "Es gilt deutsches Recht.",
      "Gerichtsstand ist, soweit gesetzlich zulässig, Biberach an der Riß.",
      "Der Vertrag wird in zwei Ausfertigungen erstellt. Jede Partei erhält eine Ausfertigung.",
    ]);

    // Unterschriften
    ensureSpace(doc, 170, headerFn);
    doc.moveDown(0.8);
    doc.fontSize(12).font("Helvetica-Bold").text("Unterschriften");
    doc.font("Helvetica");
    doc.moveDown(0.6);

    const sigY = doc.y;
    const sigLeftX = 50;
    const sigRightX = 310;
    const sigW = 235;

    // Left: Auftraggeber
    doc.fontSize(10).font("Helvetica-Bold").text("Auftraggeber", sigLeftX, sigY, { width: sigW });
    doc.font("Helvetica");

    if (data.signatureDataUrl && data.signatureDataUrl.startsWith("data:image/")) {
      try {
        const base64Part = data.signatureDataUrl.split(",")[1] ?? "";
        const sigBuf = Buffer.from(base64Part, "base64");
        doc.image(sigBuf, sigLeftX, sigY + 20, { fit: [sigW, 60] });
      } catch {
        // ignore signature errors
      }
    }
    doc
      .moveTo(sigLeftX, sigY + 90)
      .lineTo(sigLeftX + sigW, sigY + 90)
      .strokeColor("#333")
      .stroke();
    doc
      .fontSize(9)
      .fillColor("#333")
      .text(`${data.unterschriftDatum}, ${data.auftraggeberName}`, sigLeftX, sigY + 95, { width: sigW });
    doc.fontSize(9).fillColor("#666").text("Datum, Unterschrift", sigLeftX, sigY + 108, { width: sigW });

    // Right: Auftragnehmer (preset)
    doc.fontSize(10).font("Helvetica-Bold").fillColor("black").text("Auftragnehmer (NIWE Events)", sigRightX, sigY, { width: sigW });
    doc.font("Helvetica");
    doc.fontSize(11).fillColor("#222").text("Niklas Wetzler", sigRightX, sigY + 50, { width: sigW });
    doc
      .moveTo(sigRightX, sigY + 90)
      .lineTo(sigRightX + sigW, sigY + 90)
      .strokeColor("#333")
      .stroke();
    doc.fontSize(9).fillColor("#333").text(`${data.unterschriftDatum}, Niklas Wetzler`, sigRightX, sigY + 95, { width: sigW });
    doc.fontSize(9).fillColor("#666").text("Datum, Unterschrift", sigRightX, sigY + 108, { width: sigW });
    doc.fillColor("black");

    doc.end();
  });
}
