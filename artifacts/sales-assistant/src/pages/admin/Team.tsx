import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Mail, KeyRound, Trash2, Copy, ShieldCheck, Clock } from "lucide-react";

interface StaffRow {
  id: number;
  username: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  hasAvatar: boolean;
  status: "active" | "invited";
  inviteExpiresAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

export default function Team() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { me } = useAuth();

  const { data: staff = [], isLoading, error } = useQuery<StaffRow[]>({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const r = await fetch("/api/admin/staff", { credentials: "include" });
      if (!r.ok) throw new Error("Mitarbeiter konnten nicht geladen werden.");
      return r.json();
    },
  });

  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  // Form
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"password" | "invite">("invite");
  const [password, setPassword] = useState("");

  const resetForm = () => {
    setUsername(""); setName(""); setEmail("");
    setMode("invite"); setPassword("");
  };

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/staff", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          name: name.trim(),
          email: email.trim(),
          mode,
          password: mode === "password" ? password : undefined,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((data as { error?: string }).error ?? "Fehler.");
      return data as { id: number; inviteUrl: string | null };
    },
    onSuccess: (data) => {
      toast({
        title: mode === "invite" ? "Mitarbeiter eingeladen" : "Mitarbeiter angelegt",
        description: mode === "invite"
          ? "Einladungslink ist gültig für 7 Tage."
          : "Mitarbeiter kann sich jetzt anmelden.",
      });
      void qc.invalidateQueries({ queryKey: ["admin-staff"] });
      if (data.inviteUrl) setInviteUrl(data.inviteUrl);
      setAddOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/staff/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Fehler.");
      }
    },
    onSuccess: () => {
      toast({ title: "Mitarbeiter gelöscht" });
      void qc.invalidateQueries({ queryKey: ["admin-staff"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const toDelete = staff.find((s) => s.id === deleteId);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mitarbeiter</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verwalte das NIWE-Team. Mitarbeiter dürfen alles außer neue Mitarbeiter anlegen.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-amber-500 hover:bg-amber-600">
          <UserPlus className="w-4 h-4 mr-1.5" /> Mitarbeiter hinzufügen
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="py-4 text-sm text-red-700">
            {error instanceof Error ? error.message : "Fehler beim Laden."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {isLoading && <div className="text-sm text-muted-foreground">Wird geladen…</div>}
        {staff.map((s) => (
          <Card key={s.id} className="border-gray-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-100 text-amber-700 flex items-center justify-center font-semibold shrink-0">
                {s.hasAvatar ? (
                  <img src={`/api/admin-avatars/${s.id}.jpg`} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{s.name.split(/\s+/).map((p) => p.charAt(0)).join("").slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-gray-900">{s.name}</p>
                  {s.isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3" /> NIWEWorker
                    </span>
                  )}
                  {s.status === "invited" && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-blue-700 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded">
                      <Clock className="w-3 h-3" /> Eingeladen
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{s.email} · @{s.username}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Letzter Login: {fmtDate(s.lastLoginAt)} · angelegt {fmtDate(s.createdAt)}
                </p>
              </div>
              {!s.isSuperAdmin && s.id !== me?.id && (
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteId(s.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Add staff dialog ─────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mitarbeiter hinzufügen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="u">Benutzername (Login)</Label>
              <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="z. B. anna" />
              <p className="text-[10px] text-muted-foreground mt-1">3–30 Zeichen, nur a–z 0–9 . _ -</p>
            </div>
            <div>
              <Label htmlFor="n">Name</Label>
              <Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anna Beispiel" />
            </div>
            <div>
              <Label htmlFor="e">E-Mail</Label>
              <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anna@niwe.de" />
            </div>

            <div className="rounded-md border border-gray-200 p-3 space-y-2">
              <p className="text-xs font-medium text-gray-700">Zugangsweise</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("invite")}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    mode === "invite" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> Per E-Mail einladen
                </button>
                <button
                  type="button"
                  onClick={() => setMode("password")}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    mode === "password" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" /> Passwort selbst setzen
                </button>
              </div>
              {mode === "password" && (
                <div>
                  <Label htmlFor="pw">Passwort (min. 10 Zeichen)</Label>
                  <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Abbrechen</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600"
              disabled={create.isPending || !username || !name || !email || (mode === "password" && password.length < 10)}
              onClick={() => create.mutate()}
            >
              {mode === "invite" ? "Einladen" : "Anlegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invite URL dialog ────────────────────────────────────── */}
      <Dialog open={!!inviteUrl} onOpenChange={(o) => { if (!o) setInviteUrl(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Einladungslink</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Wir haben versucht, eine E-Mail zu schicken. Falls die nicht ankommt,
              kannst du diesen Link auch direkt weitergeben (gültig 7 Tage):
            </p>
            <div className="flex gap-2">
              <Input value={inviteUrl ?? ""} readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                onClick={() => {
                  if (inviteUrl) {
                    void navigator.clipboard.writeText(inviteUrl);
                    toast({ title: "Kopiert" });
                  }
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setInviteUrl(null)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ───────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitarbeiter löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && (
                <>
                  <strong>{toDelete.name}</strong> ({toDelete.email}) verliert sofort den Zugang.
                  Aktivitäts-Einträge dieser Person bleiben mit Namen erhalten.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => { e.preventDefault(); if (deleteId) del.mutate(deleteId); }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
