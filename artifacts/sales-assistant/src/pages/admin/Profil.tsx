import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Trash2 } from "lucide-react";

interface MeResponse {
  id: number;
  username: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  hasAvatar: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

function fileToBase64(file: File): Promise<{ data: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      const comma = result.indexOf(",");
      resolve({ data: result.slice(comma + 1), mime: file.type || "image/jpeg" });
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function Profil() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { refresh: refreshAuth } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: me, isLoading } = useQuery<MeResponse>({
    queryKey: ["admin-me"],
    queryFn: async () => {
      const r = await fetch("/api/admin/me", { credentials: "include" });
      if (!r.ok) throw new Error("Profil konnte nicht geladen werden.");
      return r.json();
    },
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [avatarVersion, setAvatarVersion] = useState(0);

  // Lazy-init form values once the query resolves
  if (me && name === "" && email === "") {
    setName(me.name);
    setEmail(me.email);
  }

  const saveProfile = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const r = await fetch("/api/admin/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Fehler beim Speichern.");
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-me"] });
      void refreshAuth();
      setAvatarVersion((v) => v + 1);
    },
  });

  const onSaveBasic = () => {
    saveProfile.mutate(
      { name: name.trim(), email: email.trim() },
      {
        onSuccess: () => toast({ title: "Profil aktualisiert" }),
        onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
      },
    );
  };

  const onSavePassword = () => {
    if (newPw !== newPw2) {
      toast({ title: "Passwörter stimmen nicht überein", variant: "destructive" });
      return;
    }
    saveProfile.mutate(
      { currentPassword: currentPw, newPassword: newPw },
      {
        onSuccess: () => {
          toast({ title: "Passwort geändert" });
          setCurrentPw(""); setNewPw(""); setNewPw2("");
        },
        onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
      },
    );
  };

  const onUploadAvatar = async (file: File) => {
    if (file.size > 600 * 1024) {
      toast({ title: "Bild zu groß", description: "Max. 600 KB.", variant: "destructive" });
      return;
    }
    const { data, mime } = await fileToBase64(file);
    saveProfile.mutate(
      { profilePicBase64: data, profilePicMime: mime },
      {
        onSuccess: () => toast({ title: "Profilbild aktualisiert" }),
        onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
      },
    );
  };

  const onRemoveAvatar = () => {
    saveProfile.mutate(
      { profilePicBase64: null },
      {
        onSuccess: () => toast({ title: "Profilbild entfernt" }),
        onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
      },
    );
  };

  if (isLoading || !me) {
    return <div className="p-6 text-sm text-muted-foreground">Wird geladen…</div>;
  }

  const initials = me.name.split(/\s+/).map((p) => p.charAt(0)).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mein Profil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {me.isSuperAdmin ? "NIWEWorker (Super-Admin)" : "Mitarbeiter-Konto"} · Benutzername: {me.username}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Profilbild</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-amber-100 text-amber-700 flex items-center justify-center font-semibold text-xl ring-2 ring-amber-200">
            {me.hasAvatar ? (
              <img
                src={`/api/admin-avatars/${me.id}.jpg?v=${avatarVersion}`}
                alt={me.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUploadAvatar(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={saveProfile.isPending}>
              <Upload className="w-4 h-4 mr-1.5" /> Bild hochladen
            </Button>
            {me.hasAvatar && (
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={onRemoveAvatar}>
                <Trash2 className="w-4 h-4 mr-1.5" /> Entfernen
              </Button>
            )}
            <p className="text-xs text-muted-foreground">JPG, PNG oder WebP · max. 600 KB.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Name & E-Mail</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={onSaveBasic} disabled={saveProfile.isPending} className="bg-amber-500 hover:bg-amber-600">
            Speichern
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Passwort ändern</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {me.isSuperAdmin ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Das NIWEWorker-Passwort wird über die Umgebungsvariable <code>ADMIN_PASSWORD</code> gesetzt und beim
              nächsten Serverstart synchronisiert. Änderungen hier werden bei einem Neustart überschrieben.
            </p>
          ) : null}
          <div>
            <Label htmlFor="cpw">Aktuelles Passwort</Label>
            <Input id="cpw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="npw">Neues Passwort (min. 10 Zeichen)</Label>
            <Input id="npw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="npw2">Neues Passwort wiederholen</Label>
            <Input id="npw2" type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} />
          </div>
          <Button
            onClick={onSavePassword}
            disabled={saveProfile.isPending || !currentPw || !newPw || newPw.length < 10}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Passwort ändern
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
