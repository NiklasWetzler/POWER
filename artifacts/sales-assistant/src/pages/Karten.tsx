import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowRight, FileText, Mail, ChevronLeft,
  ShieldCheck, Sparkles, MailCheck, Folder, Loader2, Wand2, Check,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CardCanvas } from "@/components/karten/CardCanvas";
import { DataForm } from "@/components/karten/DataForm";
import { LoginGate } from "@/components/karten/LoginGate";
import { TEMPLATES, type TemplateSpec } from "@/components/karten/templates";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useCookieConsent } from "@/hooks/useCookieConsent";

type Step = "ai-style" | "ai-pick" | "data" | "saved";
type CardKind = "einladung";
const KIND: CardKind = "einladung";
const KIND_LABEL_INVITATION = "Hochzeitseinladung";

const SAMPLE_DATA: Record<string, string> = {
  partner1: "Anna",
  partner2: "Markus",
  datum: "12. Juni 2027",
  zeit: "15:00 Uhr",
  location: "Schloss Weingarten",
  ort: "Hauptstraße 1, 12345 Musterstadt",
  rsvp: "Bitte um Rückmeldung bis vier Wochen vor dem Fest.",
  gruss: "Wir würden uns von Herzen freuen, diesen besonderen Tag mit euch zu feiern.",
  gastname: "Familie Müller",
  tisch: "Tisch 3",
  vorspeise: "Burrata · Tomaten · Basilikum",
  suppe: "Klare Rinderbrühe mit Markklößchen",
  hauptgang: "Rinderfilet · Trüffel-Kartoffelstampf",
  dessert: "Schokoladen-Mousse · Beeren",
  getraenke: "Auswahl an Weinen · Champagner · Wasser",
  dankestext: "Von Herzen Danke für eure Glückwünsche, eure Geschenke und für die wunderschöne Zeit, die wir mit euch teilen durften.",
};

const DRAFT_STORAGE_KEY = "niwe-karten-draft-v2";

const AI_STYLES: Array<{ id: string; label: string; desc: string }> = [
  { id: "watercolor-floral", label: "Aquarell Blumen", desc: "Sanft, romantisch, pastell" },
  { id: "blue-china", label: "Delft Blau", desc: "Yasmin & Dominic Stil" },
  { id: "soft-greenery", label: "Sage Greenery", desc: "Eukalyptus, modern romantisch" },
  { id: "wildflower-meadow", label: "Wildblumenwiese", desc: "Locker, verspielt, hell" },
  { id: "gold-monogram", label: "Gold Monogramm", desc: "Klassisch, Lorbeer, Gold" },
  { id: "boho-pampas", label: "Boho Pampasgras", desc: "Beige & Terracotta" },
  { id: "minimal-modern", label: "Modern Minimal", desc: "Editorial, viel Weißraum" },
  { id: "moody-floral", label: "Moody Romance", desc: "Burgund, dunkel, intim" },
];

interface SavedDraft {
  templateId: string | null;
  data: Record<string, string>;
  step: Step;
}

function loadDraft(functional: boolean): SavedDraft | null {
  if (!functional) return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) as SavedDraft : null;
  } catch { return null; }
}

function saveDraft(d: SavedDraft, functional: boolean) {
  if (!functional) return;
  try { window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

export default function Karten() {
  const { loggedIn, customer, refresh } = useCustomerAuth();
  const { consent } = useCookieConsent();
  const functional = consent?.functional === true;

  const [step, setStep] = useState<Step>("ai-style");
  const kind: CardKind = KIND;
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSpec | null>(null);
  const [data, setData] = useState<Record<string, string>>({});
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);

  // AI flow state
  const [aiStyle, setAiStyle] = useState<string>("watercolor-floral");
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiCandidates, setAiCandidates] = useState<string[]>([]);
  const [aiSelected, setAiSelected] = useState<string | null>(null);

  // Restore draft (only if user gave functional consent). Never restore AI image
  // or photo (too big for localStorage) — user re-uploads if they come back.
  useEffect(() => {
    if (!functional) {
      try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* ignore */ }
      return;
    }
    const d = loadDraft(functional);
    if (d) {
      // Only AI flow exists now — any legacy/unknown step restarts at ai-style.
      const validSteps: Step[] = ["ai-style", "ai-pick", "data", "saved"];
      const restored: Step =
        d.step === "ai-pick" ? "ai-style"
        : validSteps.includes(d.step as Step) ? (d.step as Step)
        : "ai-style";
      setStep(restored);
      setData(d.data ?? {});
      const t = TEMPLATES.find((x) => x.id === d.templateId);
      if (t) setSelectedTemplate(t);
    }
  }, [functional]);

  useEffect(() => {
    saveDraft({
      templateId: selectedTemplate?.id ?? null, data, step,
    }, functional);
  }, [selectedTemplate, data, step, functional]);

  const handleField = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));

  const proceedToData = () => {
    if (!loggedIn) {
      setShowLoginGate(true);
      return;
    }
    setStep("data");
  };

  const generateAiBackgrounds = async () => {
    if (!loggedIn) {
      setShowLoginGate(true);
      return;
    }
    setAiGenerating(true);
    setAiCandidates([]);
    setAiSelected(null);
    try {
      const res = await fetch("/api/ai/card-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          style: aiCustomPrompt.trim() ? undefined : aiStyle,
          prompt: aiCustomPrompt.trim() || undefined,
          count: 3,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { error?: string };
        toast.error(b.error ?? "KI-Generierung fehlgeschlagen.");
        return;
      }
      const body = await res.json() as { images: string[] };
      setAiCandidates(body.images);
      setStep("ai-pick");
    } catch {
      toast.error("Server nicht erreichbar.");
    } finally {
      setAiGenerating(false);
    }
  };

  const submitDesign = async () => {
    if (!selectedTemplate) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        kind, templateId: selectedTemplate.id, data,
        photoBase64: photoDataUrl,
      };
      if (aiSelected) {
        payload.data = { ...data, __aiBg: aiSelected };
      }
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        toast.error(body.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      const { id } = await res.json() as { id: number };
      setSavedId(id);
      setStep("saved");
      try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* ignore */ }
    } catch {
      toast.error("Server nicht erreichbar.");
    } finally {
      setSubmitting(false);
    }
  };

  const emailMe = async () => {
    if (!savedId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/designs/${savedId}/email`, { method: "POST", credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        toast.error(body.error ?? "E-Mail-Versand fehlgeschlagen.");
        return;
      }
      toast.success("E-Mail wurde verschickt!");
    } catch {
      toast.error("Server nicht erreichbar.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep("ai-style");
    setSelectedTemplate(null);
    setData({}); setPhotoDataUrl(null); setSavedId(null);
    setAiCandidates([]); setAiSelected(null); setAiCustomPrompt("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 to-white flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <div className="cursor-pointer flex items-center gap-3">
              <Logo size="sm" />
              <span className="text-[10px] text-gray-400 tracking-wider uppercase hidden sm:inline">Kartenstudio</span>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {loggedIn && customer && (
              <Link href="/portal/meine-karten">
                <span className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer flex items-center gap-1">
                  <Folder className="w-3.5 h-3.5" />
                  Meine Karten
                </span>
              </Link>
            )}
            <Link href="/">
              <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">← zur Startseite</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Kostenlos · Unsere Server speichern eure Daten erst nach dem Login
          </div>
        </div>

        {/* STEP: ai-style */}
        {step === "ai-style" && (
          <section>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
              Gestaltet eure <span className="text-amber-600">Hochzeitseinladung</span>
            </h1>
            <p className="text-center text-gray-500 mt-2 max-w-xl mx-auto mb-8">
              Zweiseitige Klappkarte mit KI-Titelbild und Innenseite für Datum, Ort und euer Foto. Komplett kostenlos.
            </p>
            <h2 className="text-2xl font-bold text-center mb-2">
              Welche Stilrichtung gefällt euch?
            </h2>
            <p className="text-center text-gray-500 mb-6 max-w-lg mx-auto text-sm">
              Unsere KI erschafft daraus in wenigen Sekunden 3 einzigartige Designs für eure {KIND_LABEL_INVITATION}.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {AI_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setAiStyle(s.id); setAiCustomPrompt(""); }}
                  className={`text-left rounded-xl p-3 border-2 transition ${
                    aiStyle === s.id && !aiCustomPrompt.trim()
                      ? "border-amber-500 bg-amber-50/50 shadow"
                      : "border-gray-200 bg-white hover:border-amber-300"
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>

            <Card className="mb-6">
              <CardContent className="p-4">
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Oder beschreibt euren Wunsch in eigenen Worten (optional)
                </label>
                <Textarea
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value.slice(0, 400))}
                  placeholder="z. B. Aquarell-Lavendel mit Goldakzenten, sehr romantisch, viel Weißraum…"
                  rows={2}
                  className="text-sm"
                />
                <p className="text-[10px] text-gray-400 mt-1">{aiCustomPrompt.length}/400</p>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                onClick={generateAiBackgrounds}
                disabled={aiGenerating}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white shadow-lg"
              >
                {aiGenerating ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Designs werden erstellt … (ca. 15 Sek)</>
                ) : (
                  <><Wand2 className="w-5 h-5 mr-2" /> 3 KI-Designs erstellen</>
                )}
              </Button>
              <p className="text-xs text-gray-400 mt-3">
                {loggedIn ? "Pro Stunde maximal 12 Generierungen (à 3 Bilder) pro Kundenkonto." : "Login erforderlich für KI-Generierung."}
              </p>
            </div>
          </section>
        )}

        {/* STEP: ai-pick */}
        {step === "ai-pick" && aiCandidates.length > 0 && (
          <section>
            <BackBtn onClick={() => setStep("ai-style")} label="Anderen Stil wählen / nochmal generieren" />
            <h2 className="text-2xl font-bold text-center mb-2">Eure 3 KI-Designs</h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              Tippt auf das Lieblings-Design. Euer Text kommt in der nächsten Ansicht darüber.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {aiCandidates.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAiSelected(img);
                    // Default template — text styling neutral, dark serif. AI image is the hero.
                    setSelectedTemplate(TEMPLATES[0]);
                  }}
                  className={`relative bg-white rounded-xl p-2 border-2 transition ${
                    aiSelected === img
                      ? "border-amber-500 shadow-lg ring-2 ring-amber-200"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <CardCanvas
                    kind={kind}
                    template={TEMPLATES[0]}
                    data={SAMPLE_DATA}
                    aiBackgroundDataUrl={img}
                    width={240}
                  />
                  {aiSelected === img && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              <Button
                variant="outline"
                onClick={generateAiBackgrounds}
                disabled={aiGenerating}
              >
                {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
                Andere 3 Designs generieren
              </Button>
              <Button
                onClick={proceedToData}
                disabled={!aiSelected}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Mit diesem Design weiter
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP: data */}
        {step === "data" && selectedTemplate && loggedIn && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <BackBtn
                onClick={() => setStep("ai-pick")}
                label="Anderes KI-Design wählen"
              />
              <h2 className="text-xl font-bold mb-1">Eure Daten</h2>
              <p className="text-xs text-gray-500 mb-4">Die Vorschau aktualisiert sich live — beide Seiten unten rechts.</p>
              <Card>
                <CardContent className="p-4">
                  <DataForm
                    kind={kind}
                    data={data}
                    onChange={handleField}
                    photoDataUrl={photoDataUrl}
                    onPhotoChange={setPhotoDataUrl}
                  />
                </CardContent>
              </Card>
              <Button onClick={submitDesign} disabled={submitting}
                className="w-full mt-4 bg-gray-900 hover:bg-gray-800">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <FileText className="w-4 h-4 mr-1.5" />}
                Einladung speichern & PDF erstellen
              </Button>
            </div>
            <div className="lg:sticky lg:top-6 self-start">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Live-Vorschau · Titel + Innenseite</p>
              <div className="bg-gray-50 rounded-xl p-4 flex flex-wrap items-start justify-center gap-3">
                <div className="text-center">
                  <CardCanvas
                    kind={kind}
                    template={selectedTemplate}
                    data={{ ...SAMPLE_DATA, ...data }}
                    aiBackgroundDataUrl={aiSelected}
                    width={230}
                    page="cover"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">Seite 1 · Titel</p>
                </div>
                <div className="text-center">
                  <CardCanvas
                    kind={kind}
                    template={selectedTemplate}
                    data={{ ...SAMPLE_DATA, ...data }}
                    photoDataUrl={photoDataUrl}
                    width={230}
                    page="inside"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">Seite 2 · Innenseite</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 text-center mt-2">
                KI-Design (Pollinations · Flux)
              </p>
            </div>
          </section>
        )}

        {/* STEP: saved */}
        {step === "saved" && savedId && (
          <section className="text-center py-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
              <MailCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold">Eure Karte ist gespeichert!</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              Ihr könnt sie jetzt als PDF herunterladen, per E-Mail an euch schicken,
              oder in „Meine Karten" jederzeit weiter bearbeiten.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <a href={`/api/designs/${savedId}/pdf`} target="_blank" rel="noopener noreferrer">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  <FileText className="w-4 h-4 mr-1.5" />
                  PDF herunterladen
                </Button>
              </a>
              <Button variant="outline" onClick={emailMe} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Mail className="w-4 h-4 mr-1.5" />}
                Per E-Mail schicken
              </Button>
              <Link href="/portal/meine-karten">
                <Button variant="outline">
                  <Folder className="w-4 h-4 mr-1.5" />
                  Meine Karten
                </Button>
              </Link>
            </div>
            <Button variant="ghost" className="mt-6 text-amber-600" onClick={resetAll}>
              <Sparkles className="w-4 h-4 mr-1.5" /> Noch eine Karte gestalten
            </Button>
          </section>
        )}
      </main>

      {showLoginGate && (
        <LoginGate
          onLogin={async () => {
            setShowLoginGate(false);
            await refresh();
            // If they were on the style picker, kick off generation now.
            if (step === "ai-style") {
              setTimeout(() => { void generateAiBackgrounds(); }, 50);
            } else {
              setStep("data");
            }
          }}
          onCancel={() => setShowLoginGate(false)}
        />
      )}
    </div>
  );
}

function BackBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="mb-4 inline-flex items-center text-xs text-gray-500 hover:text-amber-700">
      <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
      {label}
    </button>
  );
}
