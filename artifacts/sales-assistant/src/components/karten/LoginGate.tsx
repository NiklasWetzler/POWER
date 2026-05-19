import { useState } from "react";
import { Lock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginGateProps {
  onLogin: (customer: { id: number; name: string; email: string }) => void;
  onCancel: () => void;
}

export function LoginGate({ onLogin, onCancel }: LoginGateProps) {
  const [email, setEmail] = useState("");
  const [angebotsnummer, setAngebotsnummer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
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
        const data = await res.json() as { customer: { id: number; name: string; email: string } };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center border-b border-gray-100">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-3">
            <Heart className="w-5 h-5 text-amber-600 fill-amber-600" />
          </div>
          <h2 className="text-lg font-bold">Schön, dass euch ein Design gefällt!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Damit wir eure Karte mit euren Hochzeitsdaten füllen und für euch speichern können,
            meldet euch bitte kurz mit eurem Kundenkonto an.
          </p>
        </div>

        <form onSubmit={submit} className="p-6 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="gate-email">E-Mail-Adresse</Label>
            <Input id="gate-email" type="email" autoComplete="email" required autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="eure@email.de" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="gate-angebot">Angebotsnummer</Label>
            <Input id="gate-angebot" type="text" required value={angebotsnummer}
              onChange={(e) => setAngebotsnummer(e.target.value)} placeholder="z. B. AN-2025-001" />
          </div>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-gray-900 hover:bg-gray-800">
            <Lock className="w-4 h-4 mr-1.5" />
            {loading ? "Wird angemeldet…" : "Anmelden & weiter"}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-xs text-gray-500 hover:text-gray-700 mt-2 underline"
          >
            Zurück zum Design
          </button>
          <p className="text-xs text-center text-gray-400 pt-1">
            Noch kein Kunde?{" "}
            <a href="https://niwe-events.com/kontakt/" target="_blank" rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 underline">
              Hochzeit anfragen
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
