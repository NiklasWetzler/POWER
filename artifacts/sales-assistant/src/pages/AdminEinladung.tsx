import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { CheckCircle2 } from "lucide-react";

interface InviteInfo {
  username: string;
  name: string;
  email: string;
}

export default function AdminEinladung() {
  const [, params] = useRoute<{ token: string }>("/admin-einladung/:token");
  const [, navigate] = useLocation();
  const token = params?.token ?? "";

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const r = await fetch(`/api/admin-invite/${encodeURIComponent(token)}`);
        if (!r.ok) {
          const err = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? "Einladung ungültig.");
        }
        setInfo(await r.json());
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Fehler.");
      }
    })();
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 10 || pw !== pw2) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/admin-invite/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Fehler.");
      }
      setDone(true);
      setTimeout(() => navigate("/admin"), 2500);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Fehler.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo size="md" variant="default" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Willkommen im NIWE Admin-Bereich</CardTitle>
          </CardHeader>
          <CardContent>
            {loadError && !done ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-red-600">{loadError}</p>
                <Button variant="outline" onClick={() => navigate("/admin")}>
                  Zum Login
                </Button>
              </div>
            ) : done ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-sm font-medium text-gray-900">Passwort gesetzt!</p>
                <p className="text-xs text-muted-foreground">Du wirst zum Login weitergeleitet…</p>
              </div>
            ) : !info ? (
              <p className="text-sm text-muted-foreground text-center">Einladung wird geprüft…</p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="rounded-md bg-amber-50/60 border border-amber-200 px-3 py-2 text-xs text-amber-900">
                  Hallo <strong>{info.name}</strong>! Setze hier dein persönliches Passwort.
                  <br />
                  Dein Benutzername: <strong>{info.username}</strong>
                </div>
                <div>
                  <Label htmlFor="pw">Neues Passwort (min. 10 Zeichen)</Label>
                  <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="pw2">Passwort wiederholen</Label>
                  <Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
                  {pw2 && pw !== pw2 && (
                    <p className="text-xs text-red-600 mt-1">Passwörter stimmen nicht überein.</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  disabled={submitting || pw.length < 10 || pw !== pw2}
                >
                  Passwort setzen & loslegen
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
