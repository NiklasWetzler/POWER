import { useState } from "react";
import { Music2, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";

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
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-widest uppercase text-gray-800">NIWE Weddings</p>
            <p className="text-[10px] text-gray-400 tracking-wider uppercase">Kundenportal</p>
          </div>
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
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 leading-tight">
                NIWE<br />
                <span className="text-amber-500">WEDDINGS</span><br />
                APP
              </h1>
              <p className="mt-4 text-gray-500 text-base leading-relaxed">
                Euer persönliches Portal für die Planung eurer Hochzeitsmusik. Füllt Formulare aus, verfolgt den Status und kommuniziert direkt mit eurem DJ-Team.
              </p>
            </div>
            <div className="space-y-2">
              {[
                "Musikfragebogen online ausfüllen",
                "Status eurer Anfragen einsehen",
                "Direkte Abstimmung mit dem Team",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                  {item}
                </div>
              ))}
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
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400 space-x-3">
        <span>NIWE Weddings · NIWE Events · info@niwe-events.com</span>
        <Link href="/impressum">
          <span className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">Impressum</span>
        </Link>
        <Link href="/datenschutz">
          <span className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">Datenschutz</span>
        </Link>
      </footer>
    </div>
  );
}
