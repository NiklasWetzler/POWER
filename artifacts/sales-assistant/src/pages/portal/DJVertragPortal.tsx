import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Eraser, Download, FileSignature, Maximize2, Check, X } from "lucide-react";
import SignaturePad from "signature_pad";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface DjContract {
  djKuenstler: string;
  djSpielzeit: string;
  djBemerkung: string;
  djGage: string;
  djVerlaengerung: string;
  djAnzahlungProzent: string;
  djAnzahlungFrist: string;
  djSondervereinbarungen: string;
}

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
  djContract: DjContract;
}

const todayFormatted = () => new Date().toLocaleDateString("de-DE");

function formatDateDe(iso: string): string {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ─── Full contract text shown to the customer (mirrors the original PDF §1–§17) ───
function ContractText({
  customerName,
  strasse,
  plz,
  ort,
  telefon,
  email,
  veranstaltungsort,
  datum,
  dj,
}: {
  customerName: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  veranstaltungsort: string;
  datum: string;
  dj: DjContract;
}) {
  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <div className="text-xs font-semibold text-gray-600">{k}</div>
      <div className="col-span-2 text-xs text-gray-900">{v || "—"}</div>
    </div>
  );

  const Paragraph = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <h4 className="text-sm font-bold text-gray-900">{title}</h4>
      <div className="text-xs text-gray-700 leading-relaxed space-y-1.5">{children}</div>
    </div>
  );

  const List = ({ items }: { items: string[] }) => (
    <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-gray-700">
      {items.map((i, idx) => <li key={idx}>{i}</li>)}
    </ul>
  );

  return (
    <div className="border border-gray-300 rounded-xl bg-white">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <h3 className="font-bold text-sm text-gray-900">Aufführungsvertrag — Hochzeit / DJ-Leistung</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Vertrag über die musikalische Gestaltung einer privaten Hochzeitsfeier
        </p>
      </div>

      <div className="max-h-[460px] overflow-y-auto px-5 py-4 space-y-5">
        {/* Vertragspartner */}
        <section className="space-y-2">
          <h4 className="text-sm font-bold text-gray-900">Vertragspartner</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-200 p-3 text-xs">
              <p className="font-semibold text-gray-700 mb-1">Auftraggeber</p>
              <p>Name: <span className="font-medium">{customerName || "—"}</span></p>
              <p>Adresse: {strasse || "—"}</p>
              <p>{[plz, ort].filter(Boolean).join(" ") || "—"}</p>
              <p>Telefon/E-Mail: {[telefon, email].filter(Boolean).join(" / ") || "—"}</p>
              <p className="text-gray-500 italic mt-1">– nachfolgend „Auftraggeber" genannt –</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 text-xs">
              <p className="font-semibold text-gray-700 mb-1">Auftragnehmer</p>
              <p>NIWE Events</p>
              <p>Quellenweg 1</p>
              <p>88480 Achstetten</p>
              <p>Vertreten durch: Niklas Wetzler</p>
              <p>E-Mail: wetzler@niwe-events.com</p>
              <p className="text-gray-500 italic mt-1">– nachfolgend „Auftragnehmer" genannt –</p>
            </div>
          </div>
        </section>

        <Paragraph title="§1 Vertragsgegenstand">
          <p>
            Der Auftragnehmer übernimmt die musikalische Gestaltung der nachfolgend bezeichneten privaten
            Hochzeitsveranstaltung des Auftraggebers.
          </p>
          <div className="rounded-lg border border-gray-200 mt-2">
            <Row k="Veranstaltungsort" v={veranstaltungsort} />
            <Row k="Datum" v={formatDateDe(datum)} />
            <Row k="DJ / Künstler" v={dj.djKuenstler} />
            <Row k="Vereinbarte Spielzeit" v={dj.djSpielzeit} />
            <Row k="Bemerkung" v={dj.djBemerkung} />
          </div>
        </Paragraph>

        <Paragraph title="§2 Leistungen des Auftragnehmers">
          <p>Der Auftragnehmer erbringt im Rahmen dieses Vertrags insbesondere folgende Leistungen:</p>
          <List items={[
            "Bereitstellung eines professionellen DJs für die vereinbarte Spielzeit.",
            "Musikalische Begleitung und Gestaltung der Hochzeitsfeier nach vorheriger Abstimmung.",
            "Berücksichtigung von Musikwünschen im angemessenen und technisch möglichen Rahmen.",
            "Einsatz professioneller Ton- und, soweit vereinbart, Lichttechnik.",
            "Aufbau, Soundcheck und Abbau des DJ-Setups.",
            "Abstimmung des Ablaufs und besonderer Programmpunkte mit dem Auftraggeber.",
          ]} />
          <p>
            Die konkrete Musikauswahl liegt während der Veranstaltung im fachlichen Ermessen des DJs.
            Wünsche des Auftraggebers und der Gäste werden berücksichtigt, sofern sie zum Ablauf und zur
            Stimmung der Veranstaltung passen.
          </p>
        </Paragraph>

        <Paragraph title="§3 Vergütung">
          <p>Für die vereinbarten Leistungen erhält der Auftragnehmer eine Gesamtgage in Höhe von:</p>
          <p className="text-center font-bold text-base text-gray-900 py-1.5">{dj.djGage} netto</p>
          <p>Gemäß §19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.</p>
        </Paragraph>

        <Paragraph title="§4 Verlängerungsoption">
          <p>Eine Verlängerung der vereinbarten Spielzeit ist nach Absprache möglich.</p>
          <List items={[
            `Die Verlängerung wird mit ${dj.djVerlaengerung} netto pro angefangener Stunde berechnet.`,
            "Die Abrechnung erfolgt im 60-Minuten-Takt.",
            "Eine Verlängerung kann auch spontan während der Veranstaltung vereinbart werden.",
            "Voraussetzung ist, dass keine behördlichen, örtlichen, technischen oder vertraglichen Einschränkungen entgegenstehen.",
            "Die zusätzlich entstandenen Kosten werden im Nachgang mit der Schlussrechnung berechnet.",
          ]} />
          <p>
            Die Entscheidung über eine Verlängerung erfolgt durch den Auftraggeber oder durch eine von ihm
            benannte vertretungsberechtigte Person, zum Beispiel Trauzeuge, Trauzeugin oder Veranstaltungsleitung.
          </p>
        </Paragraph>

        <Paragraph title="§5 Zahlungsbedingungen">
          <List items={[
            "Die Rechnungsstellung erfolgt nach der Veranstaltung.",
            "Der Auftragnehmer stellt die Rechnung spätestens 7 Tage nach der Veranstaltung.",
            "Das Zahlungsziel beträgt 7 Tage nach Rechnungseingang.",
            "Die Zahlung erfolgt per Überweisung auf das in der Rechnung angegebene Konto.",
          ]} />
          <p>
            Vereinbarte Anzahlung: <span className="font-semibold">{dj.djAnzahlungProzent}</span> der
            Gesamtgage, fällig innerhalb <span className="font-semibold">{dj.djAnzahlungFrist}</span> nach
            Vertragsabschluss.
          </p>
        </Paragraph>

        <Paragraph title="§6 Voraussetzungen und Technik">
          <p>
            Der Auftraggeber stellt sicher, dass die für die Durchführung der DJ-Leistung notwendigen
            Voraussetzungen am Veranstaltungsort vorhanden sind:
          </p>
          <List items={[
            "geeignete Stromversorgung in unmittelbarer Nähe des DJ-Platzes, mindestens 230V / 16A;",
            "ausreichend Platz für DJ-Setup, Technik und ggf. Lichttechnik;",
            "stabiler, ebener und sicherer Aufbauort;",
            "bei Outdoor-Events ein vollständig wettergeschützter Aufbauort;",
            "Zugang zur Location mindestens 2 Stunden vor Veranstaltungsbeginn;",
            "Parkmöglichkeit in unmittelbarer Nähe zum Be- und Entladen;",
            "eine verantwortliche Ansprechperson vor Ort.",
          ]} />
          <p>
            Sollten die genannten Voraussetzungen nicht erfüllt sein und dadurch die Leistung nicht oder nur
            eingeschränkt erbracht werden können, bleibt der Vergütungsanspruch des Auftragnehmers bestehen,
            sofern der Auftragnehmer dies nicht zu vertreten hat.
          </p>
        </Paragraph>

        <Paragraph title="§7 Private Veranstaltung">
          <p>
            Die Veranstaltung ist als private Hochzeitsfeier geplant. Etwaige anfallende Gebühren, Abgaben,
            Genehmigungen oder Auflagen im Zusammenhang mit der Veranstaltung liegen im Verantwortungsbereich
            des Auftraggebers beziehungsweise des Betreibers der Veranstaltungsstätte.
          </p>
        </Paragraph>

        <Paragraph title="§8 Ablauf und Abstimmung">
          <p>
            Der Auftraggeber stellt dem Auftragnehmer spätestens 14 Tage vor der Veranstaltung folgende
            Informationen zur Verfügung:
          </p>
          <List items={[
            "Ablaufplan der Hochzeit;",
            "wichtige Programmpunkte, zum Beispiel Eröffnungstanz, Reden, Spiele oder Überraschungen;",
            "gewünschte Musikrichtungen und besondere Musikwünsche;",
            "Titel oder Musikrichtungen, die nicht gespielt werden sollen;",
            "Kontakt einer verantwortlichen Ansprechperson für den Veranstaltungstag.",
          ]} />
          <p>
            Änderungen am Ablauf während der Veranstaltung sind nach Möglichkeit mit dem DJ abzustimmen. Der
            Auftragnehmer bemüht sich, kurzfristige Änderungen im angemessenen Rahmen zu berücksichtigen.
          </p>
        </Paragraph>

        <Paragraph title="§9 Lautstärke, Hausordnung und behördliche Auflagen">
          <p>
            Der Auftragnehmer hält sich an die Vorgaben der Location, insbesondere an Hausordnung, Sperrzeiten,
            Lautstärkebegrenzungen und behördliche Auflagen. Der Auftraggeber informiert den Auftragnehmer
            rechtzeitig über entsprechende Einschränkungen.
          </p>
          <p>
            Eine Einschränkung der Leistung durch Vorgaben der Location, Behörden oder durch Dritte berechtigt
            nicht zur Minderung der vereinbarten Vergütung, sofern der Auftragnehmer diese Einschränkung nicht
            zu vertreten hat.
          </p>
        </Paragraph>

        <Paragraph title="§10 Haftung">
          <List items={[
            "Der Auftragnehmer haftet nur für Schäden, die durch Vorsatz oder grobe Fahrlässigkeit verursacht wurden.",
            "Der Auftraggeber haftet für Schäden am Equipment des Auftragnehmers, die durch Gäste, Dienstleister oder sonstige Dritte verursacht werden.",
            "Für höhere Gewalt, zum Beispiel Unwetter, Stromausfall, behördliche Verbote, Krankheit oder sonstige unvorhersehbare Ereignisse, übernimmt keine Partei eine Haftung.",
            "Der Auftragnehmer haftet nicht für Leistungseinschränkungen, die durch fehlende oder mangelhafte Voraussetzungen am Veranstaltungsort entstehen.",
          ]} />
        </Paragraph>

        <Paragraph title="§11 Ausfall und Stornierung">
          <p className="font-semibold">Absage durch den Auftraggeber:</p>
          <List items={[
            "bis 90 Tage vor dem Veranstaltungstermin: 30 % der vereinbarten Gage;",
            "bis 30 Tage vor dem Veranstaltungstermin: 60 % der vereinbarten Gage;",
            "weniger als 30 Tage vor dem Veranstaltungstermin: 100 % der vereinbarten Gage.",
          ]} />
          <p>Bereits entstandene und nachweisbare Kosten sind zusätzlich zu erstatten.</p>
          <p className="font-semibold">Ausfall des Auftragnehmers:</p>
          <List items={[
            "Bei Krankheit, höherer Gewalt oder sonstigem unverschuldetem Ausfall bemüht sich der Auftragnehmer um gleichwertigen Ersatz.",
            "Sollte kein Ersatz möglich sein, entfällt die Zahlungspflicht für die nicht erbrachte Leistung.",
            "Weitergehende Ansprüche sind ausgeschlossen, sofern der Ausfall nicht vorsätzlich oder grob fahrlässig verursacht wurde.",
          ]} />
        </Paragraph>

        <Paragraph title="§12 Foto-, Video- und Referenznutzung">
          <p>
            Eine Nutzung von Foto- oder Videomaterial der Veranstaltung durch den Auftragnehmer zu Werbe-
            oder Referenzzwecken erfolgt nur nach vorheriger Zustimmung des Auftraggebers. Dies gilt
            insbesondere für Veröffentlichungen auf Website, Social Media oder in Werbematerialien.
          </p>
        </Paragraph>

        <Paragraph title="§13 Sondervereinbarungen">
          {dj.djSondervereinbarungen.trim() ? (
            <p className="whitespace-pre-wrap">{dj.djSondervereinbarungen}</p>
          ) : (
            <p className="text-gray-400 italic">— keine —</p>
          )}
        </Paragraph>

        <Paragraph title="§14 Geheimhaltung">
          <p>
            Beide Parteien verpflichten sich, vertrauliche Informationen, persönliche Daten und interne
            Absprachen nicht unbefugt an Dritte weiterzugeben. Dies gilt auch nach Beendigung des Vertrags.
          </p>
        </Paragraph>

        <Paragraph title="§15 Datenschutz">
          <p>
            Personenbezogene Daten werden ausschließlich zur Durchführung und Abwicklung dieses Vertrags
            verarbeitet. Eine Weitergabe an Dritte erfolgt nur, soweit dies zur Vertragserfüllung erforderlich
            ist oder eine gesetzliche Verpflichtung besteht.
          </p>
        </Paragraph>

        <Paragraph title="§16 Salvatorische Klausel">
          <p>
            Sollten einzelne Bestimmungen dieses Vertrags ganz oder teilweise unwirksam sein oder werden,
            bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Die Parteien verpflichten sich, die
            unwirksame Regelung durch eine wirksame Regelung zu ersetzen, die dem wirtschaftlichen Zweck
            möglichst nahekommt.
          </p>
        </Paragraph>

        <Paragraph title="§17 Schlussbestimmungen">
          <List items={[
            "Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform.",
            "Es gilt deutsches Recht.",
            "Gerichtsstand ist, soweit gesetzlich zulässig, Biberach an der Riß.",
            "Der Vertrag wird in zwei Ausfertigungen erstellt. Jede Partei erhält eine Ausfertigung.",
          ]} />
        </Paragraph>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DJVertragPortal() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: number; downloadUrl: string } | null>(null);
  const [dj, setDj] = useState<DjContract | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [agbAccepted, setAgbAccepted] = useState(false);

  const fsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fsPadRef = useRef<SignaturePad | null>(null);

  const [form, setForm] = useState({
    auftraggeberName: "",
    strasse: "",
    plz: "",
    ort: "",
    telefon: "",
    email: "",
    veranstaltungsort: "",
    datum: "",
  });

  useEffect(() => {
    fetch("/api/customer/me/info", { credentials: "include" })
      .then((r) => r.json() as Promise<CustomerInfo>)
      .then((c) => {
        setForm({
          auftraggeberName: c.name ?? "",
          email: c.email ?? "",
          telefon: c.telefon ?? "",
          strasse: c.strasse ?? "",
          plz: c.plz ?? "",
          ort: c.ort ?? "",
          veranstaltungsort: c.location ?? "",
          datum: c.hochzeitsdatum ?? "",
        });
        setDj(c.djContract);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;

    let lastWidth = 0;
    let isDrawing = false;

    function resizeCanvas(force = false) {
      if (!canvas) return;
      if (isDrawing) return; // never resize mid-stroke
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (!force && Math.abs(rect.width - lastWidth) < 1) return; // width unchanged → skip
      lastWidth = rect.width;
      const data = sigPadRef.current?.toData();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx?.scale(ratio, ratio);
      sigPadRef.current?.clear();
      if (data && data.length > 0) sigPadRef.current?.fromData(data);
    }

    sigPadRef.current = new SignaturePad(canvas, {
      backgroundColor: "rgb(255,255,255)",
      penColor: "rgb(0,0,0)",
      minWidth: 1.2,
      maxWidth: 3.0,
      throttle: 0,
      minDistance: 1,
    });

    const onBegin = () => { isDrawing = true; };
    const onEnd = () => { isDrawing = false; };
    sigPadRef.current.addEventListener("beginStroke", onBegin);
    sigPadRef.current.addEventListener("endStroke", onEnd);

    // Initial sizing after layout
    requestAnimationFrame(() => resizeCanvas(true));

    const onResize = () => resizeCanvas(false);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      sigPadRef.current?.removeEventListener("beginStroke", onBegin);
      sigPadRef.current?.removeEventListener("endStroke", onEnd);
      sigPadRef.current?.off();
    };
  }, [loading]);

  function clearSignature() { sigPadRef.current?.clear(); }

  // ── Fullscreen signature overlay ─────────────────────────────────────────
  useEffect(() => {
    if (!fullscreen) return;
    const canvas = fsCanvasRef.current;
    if (!canvas) return;

    // Lock body scroll while overlay is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let lastWidth = 0;
    let isDrawing = false;

    function resizeCanvas(force = false) {
      if (!canvas) return;
      if (isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (!force && Math.abs(rect.width - lastWidth) < 1) return;
      lastWidth = rect.width;
      const data = fsPadRef.current?.toData();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx?.scale(ratio, ratio);
      fsPadRef.current?.clear();
      if (data && data.length > 0) fsPadRef.current?.fromData(data);
    }

    fsPadRef.current = new SignaturePad(canvas, {
      backgroundColor: "rgb(255,255,255)",
      penColor: "rgb(0,0,0)",
      minWidth: 1.4,
      maxWidth: 3.6,
      throttle: 0,
      minDistance: 1,
    });

    const onBegin = () => { isDrawing = true; };
    const onEnd = () => { isDrawing = false; };
    fsPadRef.current.addEventListener("beginStroke", onBegin);
    fsPadRef.current.addEventListener("endStroke", onEnd);

    // Defer to rAF so the overlay has finished layout before we size the canvas
    requestAnimationFrame(() => {
      resizeCanvas(true);
      // Preload existing signature from inline pad, if any
      if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
        const data = sigPadRef.current.toDataURL("image/png");
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const rect = canvas.getBoundingClientRect();
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = data;
      }
    });

    const onResize = () => resizeCanvas(false);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      fsPadRef.current?.removeEventListener("beginStroke", onBegin);
      fsPadRef.current?.removeEventListener("endStroke", onEnd);
      fsPadRef.current?.off();
      fsPadRef.current = null;
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);

  function clearFullscreen() { fsPadRef.current?.clear(); }

  async function acceptFullscreen() {
    if (!fsPadRef.current || fsPadRef.current.isEmpty()) {
      toast({ title: "Bitte unterschreiben", description: "Das Feld ist noch leer.", variant: "destructive" });
      return;
    }
    const dataUrl = fsPadRef.current.toDataURL("image/png");
    setFullscreen(false);
    // After close, transfer to inline pad on next tick
    setTimeout(() => {
      sigPadRef.current?.fromDataURL(dataUrl);
    }, 50);
  }

  function setField<K extends keyof typeof form>(key: K, v: string) {
    setForm((f) => ({ ...f, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agbAccepted) {
      toast({
        title: "Zustimmung fehlt",
        description:
          "Bitte bestätigt die Vertragsbedingungen sowie AGB und Widerrufsbelehrung, um den Vertrag zu unterschreiben.",
        variant: "destructive",
      });
      return;
    }
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

  if (loading || !dj) return <p className="text-sm text-muted-foreground">Wird geladen…</p>;

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
            Bitte prüft eure persönlichen Daten und lest den vollständigen Vertrag durch. Mit eurer
            Unterschrift unten bestätigt ihr alle Bedingungen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer fields */}
          <section className="space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-500">Eure Daten</h2>
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
              <div className="space-y-1 sm:col-span-2">
                <Label>Hochzeitslocation</Label>
                <Input value={form.veranstaltungsort} onChange={(e) => setField("veranstaltungsort", e.target.value)} placeholder="z. B. Restaurant Ulm" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Datum der Hochzeit</Label>
                <Input type="date" value={form.datum} onChange={(e) => setField("datum", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Full contract text in scrollable box */}
          <section className="space-y-2">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-500">
              Vertragstext (bitte vollständig lesen)
            </h2>
            <ContractText
              customerName={form.auftraggeberName}
              strasse={form.strasse}
              plz={form.plz}
              ort={form.ort}
              telefon={form.telefon}
              email={form.email}
              veranstaltungsort={form.veranstaltungsort}
              datum={form.datum}
              dj={dj}
            />
          </section>

          {/* Confirmation note */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            Mit eurer Unterschrift bestätigt ihr alle oben aufgeführten Vertragsbedingungen (§1–§17) gemäß
            dem Aufführungsvertrag von NIWE Events. Den vollständigen Vertrag erhaltet ihr nach der
            Übermittlung als PDF zum Download.
          </div>

          {/* Pflicht-Checkbox: Vertragsbedingungen + AGB + Widerruf */}
          <section className="space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-500">
              Bestätigung *
            </h2>
            <label
              htmlFor="agb-accept"
              className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                agbAccepted
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-amber-300 bg-white hover:bg-amber-50/60"
              }`}
            >
              <input
                id="agb-accept"
                type="checkbox"
                required
                checked={agbAccepted}
                onChange={(e) => setAgbAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer flex-shrink-0"
              />
              <div className="text-sm text-gray-700 leading-6">
                <p className="font-medium text-gray-900">
                  Ich habe die Vertragsbedingungen gelesen und stimme diesen vollumfänglich zu.
                </p>
                <p className="mt-1">
                  Ich habe zudem die{" "}
                  <Link href="/agb">
                    <span className="underline underline-offset-2 text-amber-700 hover:text-amber-800 cursor-pointer">
                      AGB und die Widerrufsbelehrung
                    </span>
                  </Link>{" "}
                  gelesen und akzeptiere diese. Ich stimme ausdrücklich zu, dass NIWE Events
                  vor Ablauf der Widerrufsfrist mit der Ausführung der Dienstleistung beginnt.
                  Mir ist bekannt, dass mein Widerrufsrecht gemäß § 356 Abs. 4 BGB bei
                  vollständiger Vertragserfüllung erlischt.
                </p>
              </div>
            </label>
          </section>

          {/* Signature */}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label className="text-sm font-semibold">Unterschrift Auftraggeber *</Label>
                <p className="text-xs text-gray-500 mt-0.5">Datum heute: <span className="font-medium text-gray-700">{todayFormatted()}</span></p>
              </div>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setFullscreen(true)} className="gap-1.5 h-8 text-xs">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Vollbild
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearSignature} className="gap-1.5 h-8 text-xs">
                  <Eraser className="w-3.5 h-3.5" />
                  Löschen
                </Button>
              </div>
            </div>
            <div className="relative w-full rounded-lg border-2 border-dashed border-amber-400 bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full block"
                style={{ height: "260px", touchAction: "none" }}
              />
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-md bg-white/95 hover:bg-white border border-amber-300 px-2.5 py-1.5 text-xs font-medium text-amber-700 shadow-sm"
                title="Vollbildmodus öffnen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Vergrößern
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Mit dem Finger oder der Maus direkt im Feld unterschreiben — oder „Vergrößern" für den Vollbildmodus.
            </p>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={submitting || !agbAccepted} className="gap-2">
              <FileSignature className="w-4 h-4" />
              {submitting ? "Wird übermittelt…" : "Vertrag rechtsgültig unterschreiben"}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Fullscreen signature overlay ──────────────────────────── */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-gray-900/95 flex flex-col p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 text-white">
            <div>
              <h2 className="font-bold text-lg">Hier unterschreiben</h2>
              <p className="text-xs text-gray-300">Mit Finger oder Maus, Datum: {todayFormatted()}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFullscreen(false)}
              className="text-white hover:bg-white/10"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 rounded-xl bg-white overflow-hidden shadow-2xl">
            <canvas ref={fsCanvasRef} className="w-full h-full block touch-none" />
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={clearFullscreen}
              className="flex-1 gap-2 h-12"
            >
              <Eraser className="w-4 h-4" />
              Löschen
            </Button>
            <Button
              type="button"
              onClick={acceptFullscreen}
              className="flex-1 gap-2 h-12 bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="w-4 h-4" />
              Übernehmen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
