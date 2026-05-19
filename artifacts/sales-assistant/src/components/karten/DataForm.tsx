import type { CardKind } from "./templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DataFormProps {
  kind: CardKind;
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

function field(label: string, key: string, value: string, onChange: (k: string, v: string) => void, placeholder?: string) {
  return (
    <div className="space-y-1">
      <Label htmlFor={`f-${key}`} className="text-xs text-gray-600">{label}</Label>
      <Input id={`f-${key}`} value={value} onChange={(e) => onChange(key, e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function area(label: string, key: string, value: string, onChange: (k: string, v: string) => void, rows = 3, placeholder?: string) {
  return (
    <div className="space-y-1">
      <Label htmlFor={`f-${key}`} className="text-xs text-gray-600">{label}</Label>
      <Textarea id={`f-${key}`} value={value} onChange={(e) => onChange(key, e.target.value)} rows={rows} placeholder={placeholder} />
    </div>
  );
}

export function DataForm({ kind, data, onChange }: DataFormProps) {
  const g = (k: string) => data[k] ?? "";

  if (kind === "einladung") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("Name Partner/in 1", "partner1", g("partner1"), onChange, "z. B. Anna")}
        {field("Name Partner/in 2", "partner2", g("partner2"), onChange, "z. B. Markus")}
        {field("Hochzeitsdatum", "datum", g("datum"), onChange, "z. B. 12. Juni 2027")}
        {field("Uhrzeit", "zeit", g("zeit"), onChange, "z. B. 15:00 Uhr")}
        {field("Location", "location", g("location"), onChange, "z. B. Schloss Weingarten")}
        {field("Ort/Adresse", "ort", g("ort"), onChange, "z. B. Hauptstraße 1, 12345 Musterstadt")}
        <div className="sm:col-span-2">
          {area("RSVP-Hinweis", "rsvp", g("rsvp"), onChange, 2,
            "z. B. Bitte um Rückmeldung bis 4 Wochen vor dem Fest an anna@email.de")}
        </div>
      </div>
    );
  }

  if (kind === "tischkarte") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("Name Partner/in 1", "partner1", g("partner1"), onChange)}
        {field("Name Partner/in 2", "partner2", g("partner2"), onChange)}
        {field("Name des Gastes", "gastname", g("gastname"), onChange, "z. B. Familie Müller")}
        {field("Tisch", "tisch", g("tisch"), onChange, "z. B. Tisch 3")}
        <p className="sm:col-span-2 text-xs text-gray-500 italic">
          Tipp: Du kannst diese Karte später für jeden Gast separat herunterladen, indem du den Namen anpasst.
        </p>
      </div>
    );
  }

  if (kind === "menuekarte") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("Name Partner/in 1", "partner1", g("partner1"), onChange)}
        {field("Name Partner/in 2", "partner2", g("partner2"), onChange)}
        {field("Hochzeitsdatum", "datum", g("datum"), onChange)}
        <div className="sm:col-span-2 border-t pt-3 mt-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Die Gänge</p>
        </div>
        {area("Vorspeise", "vorspeise", g("vorspeise"), onChange, 2)}
        {area("Suppe", "suppe", g("suppe"), onChange, 2)}
        {area("Hauptgang", "hauptgang", g("hauptgang"), onChange, 2)}
        {area("Dessert", "dessert", g("dessert"), onChange, 2)}
        <div className="sm:col-span-2">
          {area("Getränke", "getraenke", g("getraenke"), onChange, 2)}
        </div>
      </div>
    );
  }

  // dankeskarte
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {field("Name Partner/in 1", "partner1", g("partner1"), onChange)}
      {field("Name Partner/in 2", "partner2", g("partner2"), onChange)}
      {field("Hochzeitsdatum", "datum", g("datum"), onChange, "z. B. Juni 2027")}
      <div className="sm:col-span-2">
        {area("Eure Dankes-Worte", "dankestext", g("dankestext"), onChange, 4,
          "Von Herzen Danke …")}
      </div>
      <p className="sm:col-span-2 text-xs text-gray-500 italic">
        Hinweis: Das Foto könnt ihr nach dem Speichern jederzeit in „Meine Karten" hochladen oder austauschen.
      </p>
    </div>
  );
}
