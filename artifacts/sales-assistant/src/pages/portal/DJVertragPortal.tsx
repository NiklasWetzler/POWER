import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Eraser, Download, FileSignature } from "lucide-react";
import SignaturePad from "signature_pad";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface CustomerInfo {
  id: number;
  name: string;
  email: string;
  hochzeitsdatum: string | null;
  telefon: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  location: string | null;
}

export default function DJVertragPortal() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: number; downloadUrl: string } | null>(null);

  const [form, setForm] = useState({
    auftraggeberName: "",
    strasse: "",
    plz: "",
    ort: "",
    telefon: "",
    email: "",
    veranstaltungsort: "",
    datum: "",
    spielzeit: "21:00 Uhr bis 02:00 Uhr",
    bemerkung: "inklusive Hintergrundmusik zu Beginn nach vorheriger Absprache",
    djKuenstler: "Nik Wetzler",
    gage: "1.300,00 €",
    verlaengerungProStunde: "100,00 €",
    anzahlungProzent: "30 %",
    anzahlungFrist: "14 Tagen",
    sondervereinbarungen: "",
  });

  // Load customer info for prefill
  useEffect(() => {
    fetch("/api/customer/me/info", { credentials: "include" })
      .then((r) => r.json() as Promise<CustomerInfo>)
      .then((c) => {
        setForm((f) => ({
          ...f,
          auftraggeberName: c.name ?? "",
          email: c.email ?? "",
          telefon: c.telefon ?? "",
          strasse: c.strasse ?? "",
          plz: c.plz ?? "",
          ort: c.ort ?? "",
          veranstaltungsort: c.location ?? "",
          datum: c.hochzeitsdatum ?? "",
        }));
      })
      .finally(() => setLoading(false));
  }, []);

  // Signature pad setup with hi-DPI handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resizeCanvas() {
      if (!canvas) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx?.scale(ratio, ratio);
      sigPadRef.current?.clear();
    }

    sigPadRef.current = new SignaturePad(canvas, {
      backgroundColor: "rgb(255,255,255)",
      penColor: "rgb(0,0,0)",
      minWidth: 0.8,
      maxWidth: 2.2,
    });

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      sigPadRef.current?.off();
    };
  }, [loading]);

  function clearSignature() {
    sigPadRef.current?.clear();
  }

  function setField<K extends keyof typeof form>(key: K, v: string) {
    setForm((f) => ({ ...f, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      toast({
        title: "Unterschrift fehlt",
        description: "Bitte unten mit dem Finger oder der Maus unterschreiben.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const signatureDataUrl = sigPadRef.current.toDataURL("image/png");
      const res = await fetch("/api/customer/forms/dj-vertrag/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, signatureDataUrl }),
      });
      const data = (await res.json()) as { success: boolean; id: number; downloadUrl: string; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "Fehler beim Übermitteln.");

      toast({ title: "Vertrag übermittelt", description: "Eine Kopie wurde an NIWE Events gesendet." });
      setSubmitted({ id: data.id, downloadUrl: data.downloadUrl });
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Unbekannter Fehler.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Wird geladen…</p>;
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <Link href="/portal/formulare">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            Zurück zu Formulare
          </span>
        </Link>
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <FileSignature className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Vertrag erfolgreich übermittelt!</h2>
            <p className="text-sm text-muted-foreground">
              Wir haben eure Unterschrift erhalten. Ihr könnt euren Vertrag jetzt als PDF herunterladen.
            </p>
            <Button asChild className="gap-2">
              <a href={submitted.downloadUrl} target="_blank" rel="noreferrer">
                <Download className="w-4 h-4" />
                Vertrag als PDF herunterladen
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/portal/formulare">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" />
          Zurück zu Formulare
        </span>
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">DJ-Booking Vertrag</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aufführungsvertrag für die DJ-Leistung. Eure Daten sind vorausgefüllt — bitte prüfen, ggf. ergänzen und unten mit dem Finger unterschreiben.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Auftraggeber */}
          <section className="space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-500">Auftraggeber</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label>Name (Brautpaar) *</Label>
                <Input required value={form.auftraggeberName} onChange={(e) => setField("auftraggeberName", e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Straße & Hausnummer</Label>
                <Input value={form.strasse} onChange={(e) => setField("strasse", e.target.value)} placeholder="z. B. Musterstraße 12" />
              </div>
              <div className="space-y-1">
                <Label>PLZ</Label>
                <Input value={form.plz} onChange={(e) => setField("plz", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Ort</Label>
                <Input value={form.ort} onChange={(e) => setField("ort", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Telefon</Label>
                <Input value={form.telefon} onChange={(e) => setField("telefon", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>E-Mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Veranstaltung */}
          <section className="space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-500">Veranstaltung</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label>Veranstaltungsort</Label>
                <Input value={form.veranstaltungsort} onChange={(e) => setField("veranstaltungsort", e.target.value)} placeholder="z. B. Waldvogel Leipheim" />
              </div>
              <div className="space-y-1">
                <Label>Datum</Label>
                <Input type="date" value={form.datum} onChange={(e) => setField("datum", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>DJ / Künstler</Label>
                <Input value={form.djKuenstler} onChange={(e) => setField("djKuenstler", e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Vereinbarte Spielzeit</Label>
                <Input value={form.spielzeit} onChange={(e) => setField("spielzeit", e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Bemerkung</Label>
                <Input value={form.bemerkung} onChange={(e) => setField("bemerkung", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Konditionen */}
          <section className="space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-500">Konditionen</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Gesamtgage (netto)</Label>
                <Input value={form.gage} onChange={(e) => setField("gage", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Verlängerung pro Stunde</Label>
                <Input value={form.verlaengerungProStunde} onChange={(e) => setField("verlaengerungProStunde", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Anzahlung</Label>
                <Input value={form.anzahlungProzent} onChange={(e) => setField("anzahlungProzent", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Frist für Anzahlung</Label>
                <Input value={form.anzahlungFrist} onChange={(e) => setField("anzahlungFrist", e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Sondervereinbarungen (optional)</Label>
                <Textarea
                  rows={3}
                  value={form.sondervereinbarungen}
                  onChange={(e) => setField("sondervereinbarungen", e.target.value)}
                  placeholder="z. B. zusätzliche Lichttechnik, besondere Wünsche…"
                />
              </div>
            </div>
          </section>

          {/* Hinweis */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            Mit eurer Unterschrift bestätigt ihr alle Vertragsbedingungen (§1–§17) gemäß dem
            Aufführungsvertrag von NIWE Events. Den vollständigen Vertrag erhaltet ihr nach der
            Übermittlung als PDF zum Download.
          </div>

          {/* Unterschrift */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Unterschrift Auftraggeber *</Label>
              <Button type="button" variant="ghost" size="sm" onClick={clearSignature} className="gap-1.5 h-7 text-xs">
                <Eraser className="w-3 h-3" />
                Löschen
              </Button>
            </div>
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full block touch-none"
                style={{ height: "180px" }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Mit Finger oder Maus unterschreiben.</p>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="gap-2">
              <FileSignature className="w-4 h-4" />
              {submitting ? "Wird übermittelt…" : "Vertrag rechtsgültig unterschreiben"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
