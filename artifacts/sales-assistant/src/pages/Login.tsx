import { useState } from "react";
import { useLocation } from "wouter";
import { Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        onLogin();
        navigate("/fragebogen");
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? "Anmeldung fehlgeschlagen.");
      }
    } catch {
      setError("Server nicht erreichbar. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Logo size="xs" />
          <span className="ml-auto text-sm text-gray-400 tracking-wider uppercase text-[11px]">Admin-Bereich</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-sm shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-gray-600" />
            </div>
            <CardTitle className="text-xl">Admin-Anmeldung</CardTitle>
            <CardDescription>Bitte mit deinen Zugangsdaten anmelden.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="username">Benutzername</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Wird angemeldet…" : "Anmelden"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        NIWE Weddings · NIWE Events · info@niwe-events.com
      </footer>
    </div>
  );
}
