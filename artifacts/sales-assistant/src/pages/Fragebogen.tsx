import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ClipboardList, CheckCircle, Music2 } from "lucide-react";

const GENRES = [
  "Pop", "Rock", "Charts / Aktuelles", "Oldies (60er–80er)", "90er / 2000er",
  "Hip-Hop / R'n'B", "House / EDM", "Schlager", "Disco / Funk", "Soul / Motown",
  "Jazz / Swing", "Klassik", "Volksmusik", "Internationale Musik", "Sonstiges",
];

const GAST_ALTER = [
  { id: "unter20", label: "unter 20" },
  { id: "20bis35", label: "20–35" },
  { id: "35bis50", label: "35–50" },
  { id: "50plus", label: "50+" },
];

function FragebogenForm({ isAdminView = false }: { isAdminView?: boolean }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAlter, setSelectedAlter] = useState<string[]>([]);
  const [eröffnungstanz, setEröffnungstanz] = useState<string | null>(null);
  const [eröffnungTyp, setEröffnungTyp] = useState<string[]>([]);
  const [sektempfangMusik, setSektempfangMusik] = useState<string | null>(null);
  const [essensMusik, setEssensMusik] = useState<string | null>(null);
  const [gästeWünsche, setGästeWünsche] = useState<string | null>(null);
  const [lautstärke, setLautstärke] = useState<string | null>(null);
  const [technikVorhanden, setTechnikVorhanden] = useState<string | null>(null);
  const [dsgvo1, setDsgvo1] = useState(false);
  const [dsgvo2, setDsgvo2] = useState(false);
  const [dsgvo3, setDsgvo3] = useState(false);
  const [dsgvoError, setDsgvoError] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm();

  const allDsgvo = dsgvo1 && dsgvo2 && dsgvo3;

  const toggleGenre = (g: string) =>
    setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const toggleAlter = (id: string) =>
    setSelectedAlter((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleEröffnungTyp = (t: string) =>
    setEröffnungTyp((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const onSubmit = async () => {
    if (!allDsgvo) {
      setDsgvoError(true);
      return;
    }
    setDsgvoError(false);
    setSubmitting(true);
    setSubmitError(null);

    const values = getValues();

    // Collect checkbox states that aren't tracked by react-hook-form
    const formData: Record<string, unknown> = {
      ...values,
      selectedGenres,
      selectedAlter,
      eröffnungstanz,
      eröffnungTyp,
      sektempfangMusik,
      essensMusik,
      gästeWünsche,
      lautstärke,
      technikVorhanden,
    };

    try {
      const res = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brautpaar: values.brautpaar || "",
          datum: values.datum || undefined,
          location: values.location || undefined,
          formData,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || "Fehler beim Senden.");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const content = (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 animate-in fade-in duration-500">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <div>
          <h2 className="text-2xl font-bold mb-2">Vielen Dank!</h2>
          <p className="text-muted-foreground max-w-md">
            Euer Musikfragebogen wurde erfolgreich übermittelt. Ihr könnt eure PDF-Kopie hier herunterladen.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Neues Formular ausfüllen
        </Button>
      </div>
    );
    if (!isAdminView) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
          <div className="flex flex-col items-center gap-2 mb-8">
            <Music2 className="w-8 h-8 text-amber-500" />
            <span className="text-xl font-semibold tracking-wide text-gray-800">NIWE Weddings</span>
          </div>
          {content}
        </div>
      );
    }
    return content;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      {isAdminView && (
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Online Fragebogen</h1>
            <p className="text-muted-foreground mt-1">
              Bitte möglichst vollständig ausfüllen – je mehr wir wissen, desto besser wird eure musikalische Hochzeitsreise!
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* 1. Allgemeine Angaben */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-widest text-muted-foreground">1. Allgemeine Angaben</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="brautpaar">Name des Brautpaares</Label>
              <Input id="brautpaar" placeholder="z. B. Müller / Schmidt" {...register("brautpaar", { required: true })} data-testid="input-brautpaar" />
              {errors.brautpaar && <p className="text-xs text-destructive">Pflichtfeld</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="datum">Datum der Hochzeit</Label>
              <Input id="datum" type="date" {...register("datum", { required: true })} data-testid="input-datum" />
              {errors.datum && <p className="text-xs text-destructive">Pflichtfeld</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="location">Location / Veranstaltungsort</Label>
              <Input id="location" placeholder="Ort der Feier" {...register("location")} data-testid="input-location" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gaeste">Anzahl der Gäste</Label>
              <Input id="gaeste" type="number" placeholder="z. B. 80" {...register("gaeste")} data-testid="input-gaeste" />
            </div>
            <div className="space-y-2">
              <Label>Durchschnittsalter der Gäste</Label>
              <div className="flex flex-wrap gap-4">
                {GAST_ALTER.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`alter-${a.id}`}
                      checked={selectedAlter.includes(a.id)}
                      onCheckedChange={() => toggleAlter(a.id)}
                      data-testid={`checkbox-alter-${a.id}`}
                    />
                    <Label htmlFor={`alter-${a.id}`} className="font-normal cursor-pointer">{a.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="altersverteilung">Wie ist die Altersverteilung der Gäste?</Label>
              <Input id="altersverteilung" placeholder="z. B. hauptsächlich 30–45 Jahre" {...register("altersverteilung")} data-testid="input-altersverteilung" />
            </div>
          </CardContent>
        </Card>

        {/* 2. Musikgeschmack */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-widest text-muted-foreground">2. Musikgeschmack & Genrevorlieben</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Welche Musikrichtungen mögt ihr besonders?</Label>
              <div className="grid grid-cols-2 gap-2">
                {GENRES.map((g) => (
                  <div key={g} className="flex items-center gap-2">
                    <Checkbox
                      id={`genre-${g}`}
                      checked={selectedGenres.includes(g)}
                      onCheckedChange={() => toggleGenre(g)}
                      data-testid={`checkbox-genre-${g.replace(/\s/g, "-")}`}
                    />
                    <Label htmlFor={`genre-${g}`} className="font-normal cursor-pointer">{g}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="vermeiden">Welche Musikrichtungen sollen vermieden werden?</Label>
              <Input id="vermeiden" {...register("vermeiden")} data-testid="input-vermeiden" />
            </div>
            <div className="space-y-2">
              <Label>Lieblingssongs oder Lieblingskünstler (max. 5)</Label>
              {[1, 2, 3, 4, 5].map((n) => (
                <Input key={n} placeholder={`Song / Künstler ${n}`} {...register(`lieblingssong_${n}`)} data-testid={`input-lieblingssong-${n}`} />
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor="verboten">Welche Songs oder Künstler dürfen auf keinen Fall gespielt werden?</Label>
              <Input id="verboten" {...register("verboten")} data-testid="input-verboten" />
            </div>
          </CardContent>
        </Card>

        {/* 3. Musikverlauf */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-widest text-muted-foreground">3. Musikverlauf der Feier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Musik beim Sektempfang?</Label>
              <div className="flex gap-4">
                {["Ja", "Nein"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <Checkbox id={`sekt-${v}`} checked={sektempfangMusik === v} onCheckedChange={() => setSektempfangMusik(v)} data-testid={`checkbox-sekt-${v.toLowerCase()}`} />
                    <Label htmlFor={`sekt-${v}`} className="font-normal cursor-pointer">{v}</Label>
                  </div>
                ))}
              </div>
              {sektempfangMusik === "Ja" && (
                <Input placeholder="Wenn ja, welcher Stil?" {...register("sektStil")} data-testid="input-sekt-stil" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Musik beim Essen?</Label>
              <div className="flex gap-4">
                {["Ja", "Nein"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <Checkbox id={`essen-${v}`} checked={essensMusik === v} onCheckedChange={() => setEssensMusik(v)} data-testid={`checkbox-essen-${v.toLowerCase()}`} />
                    <Label htmlFor={`essen-${v}`} className="font-normal cursor-pointer">{v}</Label>
                  </div>
                ))}
              </div>
              {essensMusik === "Ja" && (
                <Input placeholder="Wenn ja, welcher Stil?" {...register("essensStil")} data-testid="input-essen-stil" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Eröffnungstanz gewünscht?</Label>
              <div className="flex gap-4">
                {["Ja", "Nein"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <Checkbox id={`etanz-${v}`} checked={eröffnungstanz === v} onCheckedChange={() => setEröffnungstanz(v)} data-testid={`checkbox-etanz-${v.toLowerCase()}`} />
                    <Label htmlFor={`etanz-${v}`} className="font-normal cursor-pointer">{v}</Label>
                  </div>
                ))}
              </div>
              {eröffnungstanz === "Ja" && (
                <div className="space-y-2 pl-1">
                  <Input placeholder="Songtitel" {...register("eröffnungSong")} data-testid="input-eroeffnung-song" />
                  <div className="flex gap-4">
                    {["Choreografie", "Klassischer Hochzeitstanz"].map((t) => (
                      <div key={t} className="flex items-center gap-2">
                        <Checkbox id={`etyp-${t}`} checked={eröffnungTyp.includes(t)} onCheckedChange={() => toggleEröffnungTyp(t)} data-testid={`checkbox-etyp-${t.replace(/\s/g, "-").toLowerCase()}`} />
                        <Label htmlFor={`etyp-${t}`} className="font-normal cursor-pointer">{t}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <Label>Musik zu besonderen Programmpunkten</Label>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-32 text-sm text-muted-foreground shrink-0">Einzug:</span>
                  <Input placeholder="Song / Stil" {...register("einzug")} data-testid="input-einzug" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-32 text-sm text-muted-foreground shrink-0">Torte:</span>
                  <Input placeholder="Song / Stil" {...register("torte")} data-testid="input-torte" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-32 text-sm text-muted-foreground shrink-0">Brautstraußwurf:</span>
                  <Input placeholder="Song / Stil" {...register("brautstrauss")} data-testid="input-brautstrauss" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-32 text-sm text-muted-foreground shrink-0">Sonstige:</span>
                  <Input placeholder="Song / Stil" {...register("sonstigePunkte")} data-testid="input-sonstige-punkte" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dürfen Gäste Musikwünsche äußern?</Label>
              <div className="flex flex-wrap gap-4">
                {["Ja", "Nein", "Nur passende Wünsche"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <Checkbox id={`gaestewunsch-${v}`} checked={gästeWünsche === v} onCheckedChange={() => setGästeWünsche(v)} data-testid={`checkbox-gaestewunsch-${v.replace(/\s/g, "-").toLowerCase()}`} />
                    <Label htmlFor={`gaestewunsch-${v}`} className="font-normal cursor-pointer">{v}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Technik & Ablauf */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-widest text-muted-foreground">4. Technik & Ablauf</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="musikAb">Ab wann soll Musik gespielt werden?</Label>
              <Input id="musikAb" placeholder="z. B. 15:00 Uhr" {...register("musikAb")} data-testid="input-musik-ab" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="aufbauAb">Ab wann darf aufgebaut werden?</Label>
              <Input id="aufbauAb" placeholder="z. B. 12:00 Uhr" {...register("aufbauAb")} data-testid="input-aufbau-ab" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="musikBis">Bis wann darf Musik laufen?</Label>
              <Input id="musikBis" placeholder="z. B. 02:00 Uhr" {...register("musikBis")} data-testid="input-musik-bis" />
            </div>
            <div className="space-y-2">
              <Label>Gibt es Lautstärkeregeln?</Label>
              <div className="flex gap-4">
                {["Ja", "Nein"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <Checkbox id={`lauts-${v}`} checked={lautstärke === v} onCheckedChange={() => setLautstärke(v)} data-testid={`checkbox-lautstaerke-${v.toLowerCase()}`} />
                    <Label htmlFor={`lauts-${v}`} className="font-normal cursor-pointer">{v}</Label>
                  </div>
                ))}
              </div>
              {lautstärke === "Ja" && (
                <Input placeholder="Wenn ja, welche Regel?" {...register("lautstärkeRegel")} data-testid="input-lautstaerke-regel" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Ist Technik vorhanden?</Label>
              <div className="flex gap-4">
                {["Ja", "Nein"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <Checkbox id={`tech-${v}`} checked={technikVorhanden === v} onCheckedChange={() => setTechnikVorhanden(v)} data-testid={`checkbox-technik-${v.toLowerCase()}`} />
                    <Label htmlFor={`tech-${v}`} className="font-normal cursor-pointer">{v}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: "locationBes", label: "Besonderheiten zur Location" },
                { id: "strom", label: "Strom" },
                { id: "aufbauInfo", label: "Aufbau" },
                { id: "musikanschluss", label: "Musikanschlüsse" },
                { id: "buehne", label: "Bühne" },
              ].map(({ id, label }) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="w-44 text-sm text-muted-foreground shrink-0">{label}:</span>
                  <Input {...register(id)} data-testid={`input-${id.toLowerCase()}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 5. Weitere Hinweise */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-widest text-muted-foreground">5. Weitere Hinweise & Wünsche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="besondereWuensche">Besondere Wünsche für den musikalischen Ablauf</Label>
              <Textarea id="besondereWuensche" rows={3} {...register("besondereWuensche")} data-testid="textarea-besondere-wuensche" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sonstigeHinweise">Sonstige Hinweise oder Anregungen</Label>
              <Textarea id="sonstigeHinweise" rows={3} {...register("sonstigeHinweise")} data-testid="textarea-sonstige-hinweise" />
            </div>
          </CardContent>
        </Card>

        {/* Datenschutz */}
        <Card className={`border-border bg-card/50 ${dsgvoError ? "border-destructive" : ""}`}>
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-widest text-muted-foreground">Datenschutz & Einverständnis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox id="dsgvo1" checked={dsgvo1} onCheckedChange={(v) => { setDsgvo1(!!v); setDsgvoError(false); }} data-testid="checkbox-dsgvo1" />
              <Label htmlFor="dsgvo1" className="font-normal cursor-pointer leading-relaxed">
                Ich bin damit einverstanden, dass meine angegebenen Daten zur Bearbeitung des Musikfragebogens und zur Vorbereitung unserer Hochzeit von NIWE Weddings / NIWE Events gespeichert und verarbeitet werden.
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="dsgvo2" checked={dsgvo2} onCheckedChange={(v) => { setDsgvo2(!!v); setDsgvoError(false); }} data-testid="checkbox-dsgvo2" />
              <Label htmlFor="dsgvo2" className="font-normal cursor-pointer leading-relaxed">
                Ich bin damit einverstanden, dass der ausgefüllte Musikfragebogen per E-Mail an info@niwe-events.com übermittelt wird.
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="dsgvo3" checked={dsgvo3} onCheckedChange={(v) => { setDsgvo3(!!v); setDsgvoError(false); }} data-testid="checkbox-dsgvo3" />
              <Label htmlFor="dsgvo3" className="font-normal cursor-pointer leading-relaxed">
                Ich bestätige, dass alle Angaben freiwillig und nach bestem Wissen gemacht wurden.
              </Label>
            </div>
            {dsgvoError && (
              <p className="text-sm text-destructive font-medium" data-testid="dsgvo-error">
                Bitte bestätigt alle Datenschutz- und Einverständniserklärungen.
              </p>
            )}
          </CardContent>
        </Card>

        {submitError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive" data-testid="submit-error">
            {submitError}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={!allDsgvo || submitting}
          className="w-full"
          data-testid="button-submit"
        >
          {submitting ? "Wird gesendet …" : "Fragebogen absenden"}
        </Button>
      </form>
    </div>
  );
}

export default function Fragebogen({ isAdminView = false }: { isAdminView?: boolean }) {
  if (isAdminView) {
    return <FragebogenForm isAdminView />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Public header — clean, no sales branding */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Music2 className="w-6 h-6 text-amber-500" />
          <span className="text-lg font-semibold tracking-wide text-gray-800">NIWE Weddings</span>
          <span className="ml-auto text-sm text-gray-400">Musikfragebogen</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Musikfragebogen</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Bitte möglichst vollständig ausfüllen – je mehr wir wissen, desto besser wird eure musikalische Hochzeitsreise!
            </p>
          </div>
          <FragebogenForm isAdminView={false} />
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        NIWE Weddings · NIWE Events · info@niwe-events.com
        <span className="mx-2">·</span>
        <a href="/login" className="hover:text-gray-600 transition-colors">Admin</a>
      </footer>
    </div>
  );
}
