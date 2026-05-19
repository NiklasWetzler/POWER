import { useState } from "react";
import { Lock, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { HochzeitsTimeline } from "@/components/HochzeitsTimeline";

interface CustomerInfo {
  id: number;
  name: string;
  email: string;
}

export default function Landing({ onLogin }: { onLogin: (customer: CustomerInfo) => void }) {
  const [email, setEmail] = useState("");
  const [angebotsnummer, setAngebotsnummer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, angebotsnummer }),
      });
      if (res.ok) {
        const data = await res.json() as { customer: CustomerInfo };
        onLogin(data.customer);
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? "Anmeldung fehlgeschlagen.");
      }
    } catch {
      setError("Server nicht erreichbar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-3">
          <Link href="/">
            <div className="cursor-pointer flex items-center gap-3">
              <Logo size="sm" variant="light" />
              <span className="text-[10px] text-white/70 tracking-[0.2em] uppercase hidden sm:inline">
                Kundenportal
              </span>
            </div>
          </Link>
          <div className="ml-auto">
            <Link href="/admin">
              <span className="text-xs text-white/70 hover:text-white transition-colors cursor-pointer">
                Admin-Bereich →
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with wedding image background */}
      <section className="relative min-h-[88vh] flex items-center">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-wedding.jpg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
          />
          {/* Cinematic overlay: dark left for text legibility, warmer right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-32 sm:py-40 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: editorial brand statement */}
          <div className="lg:col-span-7 text-white">
            <div className="inline-flex items-center gap-2 text-amber-200 text-[11px] font-medium uppercase tracking-[0.25em] mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NIWE Weddings · Hochzeitsagentur</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.1] tracking-tight">
              Euer großer Tag,
              <br />
              <span className="italic text-amber-200">aus einer Hand</span> geplant.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl font-light">
              Von der ersten Idee bis zum letzten Tanz — wir kümmern uns um die Details,
              damit ihr eure Hochzeit einfach nur genießen könnt. Persönlich, professionell, mit Liebe.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a href="#timeline">
                <Button size="lg" variant="outline"
                  className="bg-white/10 backdrop-blur border-white/40 text-white hover:bg-white hover:text-gray-900 h-12 px-6">
                  Planungs-Timeline ansehen
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </a>
              <a
                href="https://niwe-events.com/kontakt/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg"
                  className="bg-amber-500 hover:bg-amber-600 text-white h-12 px-6 shadow-lg">
                  Jetzt Hochzeit anfragen
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </a>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/70">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>DSGVO-konform · Server in der EU</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-300" />
                <span>Verschlüsselte Übertragung</span>
              </div>
            </div>
          </div>

          {/* Right: login card */}
          <div className="lg:col-span-5">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
              <CardContent className="p-7">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-amber-700 font-semibold">
                    Bestandskunden
                  </span>
                </div>
                <h2 className="font-serif text-2xl text-gray-900 mt-3">Im Kundenportal anmelden</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Zugang per E-Mail und persönlicher Angebotsnummer.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3 mt-5">
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs">E-Mail-Adresse</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="eure@email.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="angebotsnummer" className="text-xs">Angebotsnummer</Label>
                    <Input
                      id="angebotsnummer"
                      type="text"
                      placeholder="z. B. AN-2025-001"
                      value={angebotsnummer}
                      onChange={(e) => setAngebotsnummer(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  )}
                  <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 h-11" disabled={loading}>
                    {loading ? "Wird angemeldet…" : "Anmelden"}
                  </Button>
                </form>
                <p className="text-[11px] text-center text-gray-400 mt-4">
                  Probleme beim Login?{" "}
                  <a href="mailto:info@niwe-events.com" className="underline hover:text-gray-600">
                    info@niwe-events.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tagline strip */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-10 text-center">
          <p className="font-serif text-2xl sm:text-3xl text-amber-600 italic">
            Alles aus einer Hand
          </p>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mt-2">
            Persönlich · Professionell · Mit Liebe zum Detail
          </p>
        </div>
      </section>

      {/* Hochzeits-Timeline (öffentlich nutzbar, kein Login nötig) */}
      <div id="timeline">
        <HochzeitsTimeline />
      </div>

      {/* Karten-Designer (öffentlich, Login erst beim Speichern) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-12 sm:pt-8 sm:pb-16">
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-rose-50 border border-amber-100 rounded-3xl p-8 sm:p-14 text-center shadow-sm">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-rose-200/30 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white border border-amber-200 text-amber-700 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">
              <Sparkles className="w-3 h-3" />
              Neu · KI-gestützt · kostenlos
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-gray-900">
              Gestaltet eure Hochzeitseinladung
              <br />
              <span className="italic text-amber-600">in wenigen Minuten.</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-4 max-w-xl mx-auto leading-relaxed">
              Wählt eine Stilrichtung — unsere KI erschafft daraus drei einzigartige Designs.
              Zweiseitige Klappkarte mit eurem Foto, Datum und persönlichem Gruß. PDF und E-Mail-Versand inklusive.
            </p>
            <Link href="/karten">
              <button className="mt-7 inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-full text-sm font-semibold transition shadow-lg">
                Jetzt Einladung gestalten
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400 bg-gray-50/50">
        <div className="space-x-3">
          <span>NIWE Weddings · NIWE Events · info@niwe-events.com</span>
          <Link href="/impressum">
            <span className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">Impressum</span>
          </Link>
          <Link href="/datenschutz">
            <span className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">Datenschutz</span>
          </Link>
          <Link href="/agb">
            <span className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">AGB &amp; Widerruf</span>
          </Link>
          <button onClick={() => import("@/hooks/useCookieConsent").then(m => m.openCookieSettings())}
            className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">
            Cookie-Einstellungen
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-gray-500">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>
            Eure Daten sind bei uns sicher: HTTPS-Verschlüsselung, geschütztes Login, Speicherung in der EU, DSGVO-konform.
          </span>
        </div>
      </footer>
    </div>
  );
}
