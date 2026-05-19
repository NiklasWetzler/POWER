import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { CheckCircle2, AlertCircle } from "lucide-react";

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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pwTooShort = pw.length > 0 && pw.length < 10;
  const pwMismatch = pw2.length > 0 && pw !== pw2;

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
    setSubmitError(null);
    if (pw.length < 10) {
      setSubmitError("Das Passwort muss mindestens 10 Zeichen lang sein.");
      return;
    }
    if (pw !== pw2) {
      setSubmitError("Die beiden Passwörter stimmen nicht überein.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`/api/admin-invite/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        throw new Error(data.error ?? `Server-Fehler (${r.status}).`);
      }
      setDone(true);
      setTimeout(() => navigate("/admin"), 2500);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Verbindung fehlgeschlagen. Bitte erneut versuchen.",
      );
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
                  <Input
                    id="pw"
                    type="password"
                    value={pw}
                    onChange={(e) => { setPw(e.target.value); setSubmitError(null); }}
                    required
                    autoComplete="new-password"
                  />
                  {pwTooShort && (
                    <p className="text-xs text-amber-700 mt-1">
                      Noch {10 - pw.length} Zeichen bis zur Mindestlänge.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="pw2">Passwort wiederholen</Label>
                  <Input
                    id="pw2"
                    type="password"
                    value={pw2}
                    onChange={(e) => { setPw2(e.target.value); setSubmitError(null); }}
                    required
                    autoComplete="new-password"
                  />
                  {pwMismatch && (
                    <p className="text-xs text-red-600 mt-1">Passwörter stimmen nicht überein.</p>
                  )}
                </div>

                {submitError && (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  disabled={submitting}
                >
                  {submitting ? "Wird gespeichert…" : "Passwort setzen & loslegen"}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Tipp: Mindestens 10 Zeichen, gerne mit Zahlen oder Sonderzeichen.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
