import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import {
  FileText, Mail, Trash2, Plus, Image as ImageIcon, Loader2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardCanvas } from "@/components/karten/CardCanvas";
import { TEMPLATES, KIND_LABEL, type CardKind, type TemplateSpec } from "@/components/karten/templates";

interface SavedDesign {
  id: number;
  kind: CardKind;
  templateId: string;
  data: Record<string, string>;
  hasPhoto: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MeineKarten() {
  const [items, setItems] = useState<SavedDesign[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/designs", { credentials: "include" });
      if (res.ok) {
        setItems(await res.json() as SavedDesign[]);
      } else {
        toast.error("Karten konnten nicht geladen werden.");
      }
    } catch {
      toast.error("Server nicht erreichbar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const emailOne = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/designs/${id}/email`, { method: "POST", credentials: "include" });
      if (res.ok) toast.success("E-Mail wurde verschickt!");
      else {
        const b = await res.json().catch(() => ({})) as { error?: string };
        toast.error(b.error ?? "Versand fehlgeschlagen.");
      }
    } finally { setBusyId(null); }
  };

  const remove = async (id: number) => {
    if (!confirm("Diese Karte wirklich löschen?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/designs/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setItems((it) => (it ?? []).filter((d) => d.id !== id));
        toast.success("Gelöscht.");
      } else toast.error("Löschen fehlgeschlagen.");
    } finally { setBusyId(null); }
  };

  const handlePhoto = async (id: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Bild ist zu groß (max. 5 MB).");
      return;
    }
    setBusyId(id);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`/api/designs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ photoBase64: dataUrl }),
      });
      if (res.ok) {
        toast.success("Foto hinzugefügt!");
        await load();
      } else toast.error("Foto konnte nicht gespeichert werden.");
    } catch {
      toast.error("Foto konnte nicht gelesen werden.");
    } finally { setBusyId(null); }
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Meine Karten</h1>
            <p className="text-sm text-gray-500 mt-1">Alle eure gespeicherten Karten-Designs.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
            <Link href="/karten">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="w-4 h-4 mr-1.5" />
                Neue Karte
              </Button>
            </Link>
          </div>
        </div>

        {loading && !items && (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600" /></div>
        )}

        {items && items.length === 0 && (
          <Card><CardContent className="p-10 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Noch keine gespeicherten Karten.</p>
            <Link href="/karten">
              <Button size="sm" className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="w-4 h-4 mr-1.5" /> Erste Karte gestalten
              </Button>
            </Link>
          </CardContent></Card>
        )}

        {items && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((d) => {
              const template = TEMPLATES.find((t) => t.id === d.templateId) ?? TEMPLATES[0];
              return (
                <Card key={d.id} className="overflow-hidden">
                  <div className="bg-gray-50 p-4 flex items-center justify-center">
                    <CardCanvas kind={d.kind} template={template as TemplateSpec} data={d.data} width={220} />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-baseline justify-between">
                      <p className="font-semibold text-sm">{KIND_LABEL[d.kind]}</p>
                      <p className="text-[10px] text-gray-400">{new Date(d.updatedAt).toLocaleDateString("de-DE")}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Vorlage: {template.name}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <a href={`/api/designs/${d.id}/pdf`} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                        </Button>
                      </a>
                      <Button size="sm" variant="outline" className="flex-1"
                        onClick={() => emailOne(d.id)} disabled={busyId === d.id}>
                        {busyId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Mail className="w-3.5 h-3.5 mr-1" />}
                        E-Mail
                      </Button>
                    </div>
                    {d.kind === "dankeskarte" && (
                      <>
                        <input
                          ref={(el) => { fileInputs.current[d.id] = el; }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePhoto(d.id, f);
                            e.target.value = "";
                          }}
                        />
                        <Button size="sm" variant="outline" className="w-full mt-2"
                          onClick={() => fileInputs.current[d.id]?.click()} disabled={busyId === d.id}>
                          <ImageIcon className="w-3.5 h-3.5 mr-1" />
                          {d.hasPhoto ? "Foto austauschen" : "Foto hinzufügen"}
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="w-full mt-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => remove(d.id)} disabled={busyId === d.id}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Löschen
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
