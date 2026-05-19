import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import type { CardKind } from "./templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface DataFormProps {
  kind: CardKind;
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
  photoDataUrl?: string | null;
  onPhotoChange?: (dataUrl: string | null) => void;
}

/** Read a File, downscale to max 1600px on the long edge, return JPEG data URL. */
async function fileToResizedDataUrl(file: File, maxEdge = 1600, quality = 0.85): Promise<string> {
  const orig = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = orig;
  });
  let { width, height } = img;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return orig;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

function PhotoUpload({ value, onChange }: { value: string | null | undefined; onChange: (v: string | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      onChange(dataUrl);
    } catch {
      onChange(null);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-gray-600">Foto für die Innenseite (optional)</Label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Hochzeitsfoto" className="h-32 w-44 object-cover rounded-md border" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow hover:bg-rose-50"
            aria-label="Foto entfernen"
          >
            <X className="w-3.5 h-3.5 text-rose-600" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-amber-300 rounded-md p-4 text-center cursor-pointer hover:bg-amber-50/50 transition"
        >
          <ImagePlus className="w-6 h-6 mx-auto text-amber-500 mb-1" />
          <p className="text-xs text-gray-600">Foto auswählen</p>
          <p className="text-[10px] text-gray-400 mt-0.5">JPG/PNG · wird auf 1600px verkleinert</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handle} />
      {value && (
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          Anderes Foto wählen
        </Button>
      )}
    </div>
  );
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

export function DataForm({ kind, data, onChange, photoDataUrl, onPhotoChange }: DataFormProps) {
  const g = (k: string) => data[k] ?? "";

  if (kind === "einladung") {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-2">Titelseite</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field("Name Partner/in 1", "partner1", g("partner1"), onChange, "z. B. Anna")}
            {field("Name Partner/in 2", "partner2", g("partner2"), onChange, "z. B. Markus")}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-2">Innenseite — Wann & Wo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field("Hochzeitsdatum", "datum", g("datum"), onChange, "z. B. 12. Juni 2027")}
            {field("Uhrzeit", "zeit", g("zeit"), onChange, "z. B. 15:00 Uhr")}
            {field("Location", "location", g("location"), onChange, "z. B. Schloss Weingarten")}
            {field("Ort/Adresse", "ort", g("ort"), onChange, "z. B. Hauptstraße 1, 12345 Musterstadt")}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-2">Innenseite — Eure Worte</p>
          <div className="space-y-3">
            {area("Persönlicher Gruß", "gruss", g("gruss"), onChange, 2,
              "z. B. Wir würden uns von Herzen freuen, diesen besonderen Tag mit euch zu feiern.")}
            {area("RSVP-Hinweis", "rsvp", g("rsvp"), onChange, 2,
              "z. B. Bitte um Rückmeldung bis 4 Wochen vor dem Fest an anna@email.de")}
          </div>
        </div>
        {onPhotoChange && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-2">Innenseite — Foto</p>
            <PhotoUpload value={photoDataUrl} onChange={onPhotoChange} />
          </div>
        )}
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
