// Minimal RFC 5545 .ics generator (single VEVENT, 60-min default duration).
function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toIcsDate(d: Date): string {
  // UTC basic format: YYYYMMDDTHHMMSSZ
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export interface IcalEventInput {
  uid: string;
  start: Date;
  durationMinutes?: number;
  summary: string;
  description?: string;
  location?: string;
  organizerEmail?: string;
  organizerName?: string;
}

export function buildIcs(input: IcalEventInput): string {
  const duration = input.durationMinutes ?? 60;
  const end = new Date(input.start.getTime() + duration * 60_000);
  const now = new Date();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NIWE Weddings//Termin//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(input.start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(input.summary)}`,
  ];
  if (input.description) lines.push(`DESCRIPTION:${escapeIcs(input.description)}`);
  if (input.location) lines.push(`LOCATION:${escapeIcs(input.location)}`);
  if (input.organizerEmail) {
    const name = input.organizerName ?? "NIWE Weddings";
    lines.push(`ORGANIZER;CN=${escapeIcs(name)}:mailto:${input.organizerEmail}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR", "");

  return lines.join("\r\n");
}
