import { useState } from "react";
import { Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <Logo size="xs" variant="dark-frame" />
          <span className="text-xs text-amber-400/70 tracking-[0.3em] uppercase">Admin-Bereich</span>
          <div className="ml-auto">
            <Link href="/">
              <span className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">
                ← Zurück zur App
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-sm shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-gray-600" />
            </div>
            <CardTitle className="text-xl">Admin-Anmeldung</CardTitle>
            <CardDescription>Nur für NIWE-Team-Mitglieder.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="username">Benutzername</Label>
                <Input
                  id="username"
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
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Wird angemeldet…" : "Anmelden"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <footer className="border-t border-gray-200 py-5 text-center text-xs text-gray-400">
        NIWE Weddings · NIWE Events · info@niwe-events.com
      </footer>
    </div>
  );
}
