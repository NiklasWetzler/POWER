import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, ArrowRight, Heart, FileText, Mail, ChevronLeft,
  ShieldCheck, Sparkles, MailCheck, Folder, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardCanvas } from "@/components/karten/CardCanvas";
import { TinderSwipe } from "@/components/karten/TinderSwipe";
import { DataForm } from "@/components/karten/DataForm";
import { LoginGate } from "@/components/karten/LoginGate";
import { TEMPLATES, CARD_KINDS, KIND_LABEL, type CardKind, type TemplateSpec } from "@/components/karten/templates";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useCookieConsent } from "@/hooks/useCookieConsent";

type Step = "kind" | "swipe" | "pick" | "data" | "saved";

const SAMPLE_DATA: Record<string, string> = {
  partner1: "Anna",
  partner2: "Markus",
  datum: "12. Juni 2027",
  zeit: "15:00 Uhr",
  location: "Schloss Weingarten",
  ort: "Hauptstraße 1, 12345 Musterstadt",
  rsvp: "Bitte um Rückmeldung bis vier Wochen vor dem Fest.",
  gastname: "Familie Müller",
  tisch: "Tisch 3",
  vorspeise: "Burrata · Tomaten · Basilikum",
  suppe: "Klare Rinderbrühe mit Markklößchen",
  hauptgang: "Rinderfilet · Trüffel-Kartoffelstampf",
  dessert: "Schokoladen-Mousse · Beeren",
  getraenke: "Auswahl an Weinen · Champagner · Wasser",
  dankestext: "Von Herzen Danke für eure Glückwünsche, eure Geschenke und für die wunderschöne Zeit, die wir mit euch teilen durften.",
};

const DRAFT_STORAGE_KEY = "niwe-karten-draft-v1";

interface SavedDraft {
  kind: CardKind | null;
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

  const [step, setStep] = useState<Step>("kind");
  const [kind, setKind] = useState<CardKind | null>(null);
  const [likedTemplates, setLikedTemplates] = useState<TemplateSpec[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSpec | null>(null);
  const [data, setData] = useState<Record<string, string>>({});
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);

  // Restore draft (only if user gave functional consent)
  useEffect(() => {
    if (!functional) {
      // consent revoked or never given → make sure no draft remains on this device
      try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* ignore */ }
      return;
    }
    const d = loadDraft(functional);
    if (d) {
      setStep(d.step);
      setKind(d.kind);
      setData(d.data ?? {});
      const t = TEMPLATES.find((x) => x.id === d.templateId);
      if (t) setSelectedTemplate(t);
    }
  }, [functional]);

  // Persist on every meaningful change
  useEffect(() => {
    saveDraft({
      kind, templateId: selectedTemplate?.id ?? null, data, step,
    }, functional);
  }, [kind, selectedTemplate, data, step, functional]);

  const handleField = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));

  const proceedToData = () => {
    if (!loggedIn) {
      setShowLoginGate(true);
      return;
    }
    setStep("data");
  };

  const submitDesign = async () => {
    if (!selectedTemplate || !kind) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ kind, templateId: selectedTemplate.id, data }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        toast.error(body.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      const { id } = await res.json() as { id: number };
      setSavedId(id);
      setStep("saved");
      // clear local draft once saved
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
        {/* Free-of-charge + no-data badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Kostenlos · Unsere Server speichern eure Daten erst nach dem Login
          </div>
          {functional && (
            <p className="text-[11px] text-gray-500 mt-2 max-w-md mx-auto">
              Tipp: Ihr habt funktionale Cookies aktiviert, daher merken wir uns euren Entwurf lokal in eurem Browser
              (auf diesem Gerät). Ihr könnt das in den Cookie-Einstellungen jederzeit deaktivieren.
            </p>
          )}
        </div>

        {/* STEP: kind */}
        {step === "kind" && (
          <section>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
              Findet euren <span className="text-amber-600">Kartenstil</span>
            </h1>
            <p className="text-center text-gray-500 mt-2 max-w-xl mx-auto">
              Wischt euch durch unsere Designs wie bei einer Dating-App und sammelt eure Favoriten.
              Erst wenn ihr eure Daten eintragen wollt, brauchen wir euer Kundenkonto.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CARD_KINDS.map((k) => (
                <button
                  key={k.id}
                  onClick={() => { setKind(k.id); setStep("swipe"); }}
                  className="text-left bg-white border border-gray-200 hover:border-amber-300 hover:shadow-md rounded-xl p-4 transition group"
                >
                  <div className="aspect-[3/4] bg-gray-50 rounded-md flex items-center justify-center mb-3 overflow-hidden">
                    <CardCanvas kind={k.id} template={TEMPLATES[0]} data={SAMPLE_DATA} width={140} />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm group-hover:text-amber-700">{k.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{k.desc}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* STEP: swipe */}
        {step === "swipe" && kind && (
          <section>
            <BackBtn onClick={() => setStep("kind")} label={`${KIND_LABEL[kind]} – andere Kartenart wählen`} />
            <h2 className="text-2xl font-bold text-center mb-2">Welcher Stil gefällt euch?</h2>
            <TinderSwipe
              kind={kind}
              templates={TEMPLATES}
              sampleData={SAMPLE_DATA}
              onComplete={(liked) => {
                setLikedTemplates(liked);
                setStep("pick");
              }}
            />
          </section>
        )}

        {/* STEP: pick */}
        {step === "pick" && kind && (
          <section>
            <BackBtn onClick={() => setStep("swipe")} label="Nochmal swipen" />
            <h2 className="text-2xl font-bold text-center mb-2">Wählt eure Lieblings-Vorlage</h2>
            <p className="text-center text-gray-500 text-sm mb-6">Tippt auf eine Karte, um sie auszuwählen.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {likedTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`bg-white rounded-xl p-3 border-2 transition ${
                    selectedTemplate?.id === t.id
                      ? "border-amber-500 shadow-lg"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <CardCanvas kind={kind} template={t} data={SAMPLE_DATA} width={240} />
                  <p className="font-semibold text-sm text-gray-900 mt-3">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.tagline}</p>
                </button>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button
                onClick={proceedToData}
                disabled={!selectedTemplate}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Mit dieser Vorlage weiter
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP: data */}
        {step === "data" && kind && selectedTemplate && loggedIn && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <BackBtn onClick={() => setStep("pick")} label="Andere Vorlage wählen" />
              <h2 className="text-xl font-bold mb-1">Eure Daten</h2>
              <p className="text-xs text-gray-500 mb-4">
                Die Vorschau aktualisiert sich live.
              </p>
              <Card>
                <CardContent className="p-4">
                  <DataForm kind={kind} data={data} onChange={handleField} />
                </CardContent>
              </Card>
              <Button onClick={submitDesign} disabled={submitting}
                className="w-full mt-4 bg-gray-900 hover:bg-gray-800">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <FileText className="w-4 h-4 mr-1.5" />}
                Karte speichern & PDF erstellen
              </Button>
            </div>
            <div className="lg:sticky lg:top-6 self-start">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Live-Vorschau</p>
              <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center">
                <CardCanvas kind={kind} template={selectedTemplate} data={{ ...SAMPLE_DATA, ...data }} width={300} />
              </div>
              <p className="text-[11px] text-gray-400 text-center mt-2">
                Vorlage: {selectedTemplate.name}
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
            <Button
              variant="ghost"
              className="mt-6 text-amber-600"
              onClick={() => {
                setStep("kind"); setKind(null); setSelectedTemplate(null);
                setLikedTemplates([]); setData({}); setSavedId(null);
              }}
            >
              <Heart className="w-4 h-4 mr-1.5" /> Noch eine Karte gestalten
            </Button>
          </section>
        )}
      </main>

      {showLoginGate && (
        <LoginGate
          onLogin={async () => {
            setShowLoginGate(false);
            await refresh();
            setStep("data");
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
// keep unused linter happy
ArrowLeft;
