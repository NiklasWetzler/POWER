import { useState } from "react";
import { Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <div className="cursor-pointer flex items-center gap-3">
              <Logo size="sm" />
              <span className="text-[10px] text-gray-400 tracking-wider uppercase hidden sm:inline">Kundenportal</span>
            </div>
          </Link>
          <div className="ml-auto">
            <Link href="/admin">
              <span className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                Admin-Bereich →
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Branding */}
          <div className="space-y-6 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start">
              <Logo size="xl" variant="hero" className="mb-8" />
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-tight">
                Willkommen bei<br />
                <span className="text-amber-500">eurer Hochzeitsagentur</span>
              </h1>
              <p className="mt-4 text-gray-500 text-base leading-relaxed max-w-md">
                Hier findet ihr alles für die Planung eures großen Tages an einem Ort — von ersten Absprachen bis zum Hochzeitstag.
              </p>
            </div>
          </div>

          {/* Right: Login card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <Lock className="w-4 h-4 text-gray-600" />
              </div>
              <CardTitle className="text-lg">Anmelden</CardTitle>
              <CardDescription>
                Bitte meldet euch mit eurer E-Mail-Adresse und eurer Angebotsnummer an.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="eure@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="angebotsnummer">Angebotsnummer</Label>
                  <Input
                    id="angebotsnummer"
                    type="text"
                    placeholder="z. B. AN-2025-001"
                    value={angebotsnummer}
                    onChange={(e) => setAngebotsnummer(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive font-medium">{error}</p>
                )}
                <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800" disabled={loading}>
                  {loading ? "Wird angemeldet…" : "Anmelden"}
                </Button>
              </form>
              <p className="text-xs text-center text-gray-400 mt-4">
                Ihr habt noch keinen Zugang? Kontaktiert uns unter{" "}
                <a href="mailto:info@niwe-events.com" className="underline hover:text-gray-600">
                  info@niwe-events.com
                </a>
              </p>

              <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                  Noch kein Kunde?{" "}
                  <a
                    href="https://niwe-events.com/kontakt/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-2"
                  >
                    Jetzt Hochzeit anfragen!
                  </a>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-500">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>
                  Verschlüsselte Übertragung · Sicheres Login · DSGVO-konform
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hochzeits-Timeline (öffentlich nutzbar, kein Login nötig) */}
      <HochzeitsTimeline />

      {/* Karten-Designer (öffentlich, Login erst beim Speichern) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-100 rounded-2xl p-6 sm:p-10 text-center">
          <div className="inline-flex items-center gap-1.5 bg-white border border-amber-200 text-amber-700 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider mb-3">
            Gratis · ohne Anmeldung ausprobieren
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Karten-Designer im Tinder-Stil
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-xl mx-auto">
            Wischt euch durch unsere Vorlagen für <strong>Einladung</strong>, <strong>Tischkärtchen</strong>,
            <strong> Menükarte</strong> und <strong>Dankeskarte</strong> — findet euren Stil in unter zwei Minuten.
            PDF und E-Mail-Versand inklusive.
          </p>
          <Link href="/karten">
            <button className="mt-5 inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
              Jetzt Karten gestalten →
            </button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
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
        <div className="mt-2 flex items-center justify-center gap-1.5 text-gray-500">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>
            Eure Daten sind bei uns sicher: HTTPS-Verschlüsselung, geschütztes Login, Speicherung in der EU, DSGVO-konform.
          </span>
        </div>
      </footer>
    </div>
  );
}
