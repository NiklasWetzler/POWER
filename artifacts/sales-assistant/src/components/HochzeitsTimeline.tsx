import { useMemo, useState } from "react";
import {
  Calendar, MapPin, Camera, Music2, Utensils, Cake, Shirt, Scissors,
  Flower2, Mail, HeartHandshake, FileText, Info, CalendarPlus, ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * Recommended lead times in MONTHS before the wedding.
 * Values are midrange Erfahrungswerte from the German wedding industry
 * (Hauptsaison-Mittel: Mai–Sep, Samstage tendieren zum oberen Ende).
 */
interface TimelineItem {
  key: string;
  label: string;
  leadMonths: number;        // months before wedding to book by
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}

const ITEMS: TimelineItem[] = [
  { key: "location",   label: "Location",                     leadMonths: 15, icon: MapPin,        hint: "Sehr früh anfragen — beliebte Locations sind 12–18 Monate vorher ausgebucht." },
  { key: "fotograf",   label: "Fotograf/in",                  leadMonths: 15, icon: Camera,        hint: "In der Hauptsaison (Mai–Sep) eher 18 Monate vorher buchen." },
  { key: "dj",         label: "DJ / Band",                    leadMonths: 15, icon: Music2,        hint: "Sobald die Location steht, direkt mit der DJ-Suche starten." },
  { key: "catering",   label: "Catering",                     leadMonths: 10, icon: Utensils,      hint: "Wird oft über die Location organisiert — frühzeitig abstimmen." },
  { key: "kleid",      label: "Brautkleid",                   leadMonths: 8,  icon: Shirt,         hint: "Bestellzeit + 2–3 Anproben einplanen." },
  { key: "anzug",      label: "Anzug / Maßanzug",             leadMonths: 6,  icon: Shirt,         hint: "Bei Maßanzügen mind. 6 Monate Vorlauf." },
  { key: "konditor",   label: "Hochzeitstorte",               leadMonths: 7,  icon: Cake,          hint: "Beliebte Konditoreien sind in der Saison schnell ausgebucht." },
  { key: "stylistin",  label: "Stylistin / Friseurin",        leadMonths: 7,  icon: Scissors,      hint: "Probestyling 2–3 Monate vorher einplanen." },
  { key: "florist",    label: "Florist / Deko",               leadMonths: 5,  icon: Flower2,       hint: "Inspiration sammeln und ein konkretes Konzept besprechen." },
  { key: "einladungen",label: "Einladungen verschicken",      leadMonths: 4,  icon: Mail,          hint: "Save-the-Dates idealerweise schon 6–8 Monate vorher." },
  { key: "ringe",      label: "Eheringe",                     leadMonths: 5,  icon: HeartHandshake, hint: "Gravur und Anpassungen brauchen Zeit." },
  { key: "standesamt", label: "Standesamt-Termin anmelden",   leadMonths: 6,  icon: FileText,      hint: "Die meisten Standesämter nehmen Anmeldungen erst ~6 Monate vorher entgegen." },
];

interface ComputedItem extends TimelineItem {
  deadline: Date;
  daysUntil: number;       // negative = deadline already passed
  status: "relaxed" | "soon" | "now";
}

/**
 * Subtract months from a date, clamping to the last day of the target month
 * if it would otherwise overflow (e.g., March 31 minus 1 month → Feb 28/29,
 * not March 3). Operates in local time.
 */
function addMonthsToDateBackwards(weddingDate: Date, months: number): Date {
  const targetYear = weddingDate.getFullYear();
  const targetMonthRaw = weddingDate.getMonth() - months;
  const targetMonth = ((targetMonthRaw % 12) + 12) % 12;
  const yearOffset = Math.floor(targetMonthRaw / 12);
  const year = targetYear + yearOffset;
  // Last day of the resulting month (handles leap years via Date overflow on day 0 of next month).
  const lastDay = new Date(year, targetMonth + 1, 0).getDate();
  const day = Math.min(weddingDate.getDate(), lastDay);
  return new Date(year, targetMonth, day, 0, 0, 0, 0);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/** Parse a "YYYY-MM-DD" string as a LOCAL date (not UTC). */
function parseLocalDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** YYYY-MM-DD from LOCAL components (used for <input type="date" min />). */
function toLocalDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDateDE(d: Date): string {
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtDateICS(d: Date): string {
  // YYYYMMDD for VALUE=DATE
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function fmtTimestampICS(d: Date): string {
  // YYYYMMDDTHHMMSSZ
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/**
 * Fold a single iCalendar content line to a max of 75 octets per RFC 5545,
 * continuing lines with CRLF + single space. Counts bytes (UTF-8) so we
 * never split inside a multi-byte sequence.
 */
function foldICSLine(line: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;
  const decoder = new TextDecoder();
  const out: string[] = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Walk back if we would split a multi-byte UTF-8 sequence.
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    out.push(decoder.decode(bytes.slice(start, end)));
    start = end;
    limit = 74; // continuation lines start with a leading space, leaving 74 bytes for content
  }
  return out.join("\r\n ");
}

function joinICS(lines: string[]): string {
  return lines.map(foldICSLine).join("\r\n");
}

function buildICS(item: ComputedItem, weddingDate: Date): string {
  const dtStart = item.deadline;
  const dtEndExclusive = new Date(dtStart);
  dtEndExclusive.setDate(dtEndExclusive.getDate() + 1);
  const uid = `niwe-${item.key}-${fmtDateICS(dtStart)}@niweweddingsapp.de`;
  const summary = `Hochzeit: ${item.label} kümmern`;
  const description =
    `Empfohlener Zeitpunkt, um sich um „${item.label}“ zu kümmern.\n` +
    `Hochzeitsdatum: ${fmtDateDE(weddingDate)}\n` +
    `Hinweis: ${item.hint}\n\n` +
    `Erfahrungswert von NIWE Weddings – keine verbindliche Empfehlung.`;
  return joinICS([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NIWE Weddings//Hochzeits-Timeline//DE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmtTimestampICS(new Date())}`,
    `DTSTART;VALUE=DATE:${fmtDateICS(dtStart)}`,
    `DTEND;VALUE=DATE:${fmtDateICS(dtEndExclusive)}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICS(summary)}`,
    "TRIGGER:-P7D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]);
}

function downloadICS(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildAllICS(items: ComputedItem[], weddingDate: Date): string {
  const head = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NIWE Weddings//Hochzeits-Timeline//DE",
    "CALSCALE:GREGORIAN",
  ];
  const tail = ["END:VCALENDAR", ""];
  const events: string[] = [];
  for (const item of items) {
    const dtEndExclusive = new Date(item.deadline);
    dtEndExclusive.setDate(dtEndExclusive.getDate() + 1);
    const uid = `niwe-${item.key}-${fmtDateICS(item.deadline)}@niweweddingsapp.de`;
    events.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${fmtTimestampICS(new Date())}`,
      `DTSTART;VALUE=DATE:${fmtDateICS(item.deadline)}`,
      `DTEND;VALUE=DATE:${fmtDateICS(dtEndExclusive)}`,
      `SUMMARY:${escapeICS(`Hochzeit: ${item.label} kümmern`)}`,
      `DESCRIPTION:${escapeICS(
        `Empfohlener Zeitpunkt für „${item.label}“. Hochzeitsdatum: ${fmtDateDE(weddingDate)}. ` +
        `Hinweis: ${item.hint} (Erfahrungswert von NIWE Weddings)`,
      )}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeICS(`Hochzeit: ${item.label} kümmern`)}`,
      "TRIGGER:-P7D",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  return joinICS([...head, ...events, ...tail]);
}

export function HochzeitsTimeline() {
  const [weddingDateStr, setWeddingDateStr] = useState("");

  const today = startOfDay(new Date());
  const minDate = toLocalDateInputValue(today);

  const computed: ComputedItem[] | null = useMemo(() => {
    if (!weddingDateStr) return null;
    const parsed = parseLocalDate(weddingDateStr);
    if (!parsed) return null;
    const w = startOfDay(parsed);
    if (w < today) return null;

    return ITEMS
      .map((it) => {
        const deadline = startOfDay(addMonthsToDateBackwards(w, it.leadMonths));
        const daysUntil = Math.round((deadline.getTime() - today.getTime()) / 86_400_000);
        let status: ComputedItem["status"];
        if (daysUntil >= 60) status = "relaxed";
        else if (daysUntil >= 14) status = "soon";
        else status = "now";
        return { ...it, deadline, daysUntil, status };
      })
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }, [weddingDateStr, today]);

  const weddingDate = (() => {
    const p = weddingDateStr ? parseLocalDate(weddingDateStr) : null;
    return p ? startOfDay(p) : null;
  })();

  return (
    <section className="border-t border-gray-100 bg-gradient-to-b from-amber-50/30 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-amber-600 text-xs font-medium uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Eure Hochzeits-Timeline</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Wann solltet ihr was buchen?
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">
            Tragt euer Wunschdatum ein und wir zeigen euch, bis wann ihr euch um DJ, Location,
            Fotograf, Stylistin & Co. kümmern solltet — ganz entspannt, ohne Druck.
          </p>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-md mx-auto">
              <div className="flex-1 space-y-1">
                <Label htmlFor="wedding-date" className="text-xs text-gray-600">
                  Euer Hochzeitsdatum
                </Label>
                <Input
                  id="wedding-date"
                  type="date"
                  min={minDate}
                  value={weddingDateStr}
                  onChange={(e) => setWeddingDateStr(e.target.value)}
                  className="bg-white"
                />
              </div>
              {weddingDateStr && weddingDate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => {
                    if (!computed) return;
                    downloadICS(
                      `Hochzeits-Timeline_${fmtDateICS(weddingDate)}.ics`,
                      buildAllICS(computed, weddingDate),
                    );
                  }}
                >
                  <CalendarPlus className="w-4 h-4 mr-1.5" />
                  Alle in Kalender
                </Button>
              )}
            </div>

            {computed && weddingDate && (
              <div className="mt-6 space-y-2">
                {computed.map((it) => {
                  const Icon = it.icon;
                  const isPast = it.daysUntil < 0;
                  const statusLabel =
                    it.status === "relaxed" ? "Noch viel Zeit"
                    : it.status === "soon" ? "Zeitnah angehen"
                    : "Bald kümmern";
                  const statusClasses =
                    it.status === "relaxed" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : it.status === "soon" ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200";
                  const whenText = isPast
                    ? "möglichst zeitnah angehen"
                    : it.daysUntil === 0
                      ? "idealerweise heute"
                      : `idealerweise in ca. ${it.daysUntil} Tagen`;

                  return (
                    <div
                      key={it.key}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5 hover:border-amber-200 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-gray-900 truncate">{it.label}</p>
                          <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${statusClasses}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isPast ? "Empfohlen ab sofort" : `Empfohlen bis ${fmtDateDE(it.deadline)}`}
                          <span className="text-gray-400"> · {whenText}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-amber-700 hover:bg-amber-50 shrink-0 h-8 px-2"
                        title={`„${it.label}“ in meinen Kalender speichern`}
                        aria-label={`„${it.label}“ in meinen Kalender speichern`}
                        onClick={() =>
                          downloadICS(
                            `Hochzeit-${it.key}.ics`,
                            buildICS(it, weddingDate),
                          )
                        }
                      >
                        <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                        <span className="hidden sm:inline ml-1 text-xs">Kalender</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {!computed && weddingDateStr && (
              <p className="mt-5 text-center text-xs text-gray-500">
                Bitte ein gültiges Datum in der Zukunft wählen.
              </p>
            )}

            {computed && (
              <div className="mt-6 flex items-start gap-2 rounded-md bg-gray-50 border border-gray-200 px-3 py-2.5 text-xs text-gray-700 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" aria-hidden="true" />
                <p>
                  Alle Angaben sind <strong>Erfahrungswerte</strong> aus der Hochzeitsbranche und
                  <strong> keine verbindliche Empfehlung</strong>. In der Hauptsaison
                  (Mai–September, Samstage) sind Vorlaufzeiten oft länger.
                  „In Kalender" lädt eine <code>.ics</code>-Datei herunter, die ihr in Google,
                  Apple oder Outlook öffnen könnt. Erinnerungen funktionieren je nach
                  Kalender-Programm unterschiedlich.
                </p>
              </div>
            )}

            {computed && (
              <p className="mt-4 text-center text-xs text-gray-500">
                Ihr habt Fragen oder wollt direkt loslegen?{" "}
                <a
                  href="https://niwe-events.com/kontakt/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 underline underline-offset-2 inline-flex items-center gap-1"
                >
                  Schreibt uns
                  <ExternalLink className="w-3 h-3" />
                </a>
                .
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
