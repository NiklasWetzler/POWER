interface FormData {
  [key: string]: unknown;
}

function row(label: string, value: unknown): string {
  if (!value || (Array.isArray(value) && value.length === 0)) return "";
  const display = Array.isArray(value) ? value.join(", ") : String(value);
  return `
    <tr>
      <td style="padding:6px 12px;width:220px;color:#555;vertical-align:top;font-weight:600;white-space:nowrap;">${label}</td>
      <td style="padding:6px 12px;color:#222;">${display}</td>
    </tr>`;
}

function section(title: string, rows: string): string {
  if (!rows.trim()) return "";
  return `
    <tr>
      <td colspan="2" style="padding:16px 12px 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;border-top:1px solid #eee;">${title}</td>
    </tr>
    ${rows}`;
}

export function buildEmailHtml(brautpaar: string, datum: string | undefined, location: string | undefined, data: FormData): string {
  const genres: string[] = [];
  const genreKeys = ["Pop", "Rock", "Charts / Aktuelles", "Oldies (60er–80er)", "90er / 2000er",
    "Hip-Hop / R'n'B", "House / EDM", "Schlager", "Disco / Funk", "Soul / Motown",
    "Jazz / Swing", "Klassik", "Volksmusik", "Internationale Musik", "Sonstiges"];
  for (const g of genreKeys) {
    if (data[`genre-${g}`] === "true" || data[`genre-${g}`] === true) genres.push(g);
  }

  const alterList: string[] = [];
  if (data["alter-unter20"] === "true" || data["alter-unter20"] === true) alterList.push("unter 20");
  if (data["alter-20bis35"] === "true" || data["alter-20bis35"] === true) alterList.push("20–35");
  if (data["alter-35bis50"] === "true" || data["alter-35bis50"] === true) alterList.push("35–50");
  if (data["alter-50plus"] === "true" || data["alter-50plus"] === true) alterList.push("50+");

  const songs = [1, 2, 3, 4, 5]
    .map((n) => data[`lieblingssong_${n}`])
    .filter(Boolean)
    .join(", ");

  const s1 = section("1. Allgemeine Angaben", [
    row("Name des Brautpaares", brautpaar),
    row("Datum der Hochzeit", datum),
    row("Location", location),
    row("Anzahl der Gäste", data["gaeste"]),
    row("Durchschnittsalter", alterList.join(", ")),
    row("Altersverteilung", data["altersverteilung"]),
  ].join(""));

  const s2 = section("2. Musikgeschmack", [
    row("Bevorzugte Genres", genres),
    row("Zu vermeiden", data["vermeiden"]),
    row("Lieblingssongs / Künstler", songs),
    row("Verbotene Songs / Künstler", data["verboten"]),
  ].join(""));

  const s3 = section("3. Musikverlauf der Feier", [
    row("Musik beim Sektempfang", data["sektempfangMusik"]),
    row("Stil Sektempfang", data["sektStil"]),
    row("Musik beim Essen", data["essensMusik"]),
    row("Stil beim Essen", data["essensStil"]),
    row("Eröffnungstanz", data["eröffnungstanz"]),
    row("Eröffnungstanz Song", data["eröffnungSong"]),
    row("Art des Tanzes", Array.isArray(data["eröffnungTyp"]) ? (data["eröffnungTyp"] as string[]).join(", ") : data["eröffnungTyp"]),
    row("Einzug", data["einzug"]),
    row("Torte", data["torte"]),
    row("Brautstraußwurf", data["brautstrauss"]),
    row("Sonstige Punkte", data["sonstigePunkte"]),
    row("Gastwünsche", data["gästeWünsche"]),
  ].join(""));

  const s4 = section("4. Technik & Ablauf", [
    row("Musik ab", data["musikAb"]),
    row("Aufbau ab", data["aufbauAb"]),
    row("Musik bis", data["musikBis"]),
    row("Lautstärkeregeln", data["lautstärke"]),
    row("Lautstärkeregel Detail", data["lautstärkeRegel"]),
    row("Technik vorhanden", data["technikVorhanden"]),
    row("Location Besonderheiten", data["locationBes"]),
    row("Strom", data["strom"]),
    row("Aufbau Info", data["aufbauInfo"]),
    row("Musikanschlüsse", data["musikanschluss"]),
    row("Bühne", data["buehne"]),
  ].join(""));

  const s5 = section("5. Weitere Hinweise", [
    row("Besondere Wünsche", data["besondereWuensche"]),
    row("Sonstige Hinweise", data["sonstigeHinweise"]),
  ].join(""));

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;font-size:14px;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1a1a;padding:28px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:0.5px;">NIWE Weddings</p>
            <p style="margin:4px 0 0;font-size:13px;color:#aaa;">Neuer Musikfragebogen eingegangen</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 8px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#111;">${brautpaar}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#888;">${datum ?? "–"} · ${location ?? "–"}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${s1}${s2}${s3}${s4}${s5}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#f9f9f9;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#999;">Dieser Fragebogen wurde über das Online-Formular von NIWE Weddings übermittelt.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildEmailText(brautpaar: string, datum: string | undefined, location: string | undefined): string {
  return `Neuer Musikfragebogen von NIWE Weddings

Brautpaar: ${brautpaar}
Datum: ${datum ?? "–"}
Location: ${location ?? "–"}

Der vollständige Fragebogen ist im HTML-Anhang dieser E-Mail enthalten.
`;
}
