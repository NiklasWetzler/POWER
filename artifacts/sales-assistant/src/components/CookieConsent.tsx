import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useCookieConsent, onOpenCookieSettings } from "@/hooks/useCookieConsent";

export function CookieConsent() {
  const { consent, save, hasChoice } = useCookieConsent();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  // Show banner on first visit (no stored choice yet)
  useEffect(() => {
    if (!hasChoice) setOpen(true);
  }, [hasChoice]);

  // Escape closes the dialog, but only if the user already made a choice;
  // before that the banner stays modal so a deliberate decision is required.
  useEffect(() => {
    if (!open && !settingsOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (settingsOpen && hasChoice) setSettingsOpen(false);
      else if (open && hasChoice) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, settingsOpen, hasChoice]);

  // Allow re-opening settings from elsewhere
  useEffect(() => {
    return onOpenCookieSettings(() => {
      setFunctional(consent?.functional ?? true);
      setAnalytics(consent?.analytics ?? false);
      setSettingsOpen(true);
    });
  }, [consent]);

  const acceptAll = () => {
    save({ functional: true, analytics: true });
    setOpen(false);
    setSettingsOpen(false);
  };
  const rejectAll = () => {
    save({ functional: false, analytics: false });
    setOpen(false);
    setSettingsOpen(false);
  };
  const saveChoice = () => {
    save({ functional, analytics });
    setOpen(false);
    setSettingsOpen(false);
  };

  if (!open && !settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 id="cookie-title" className="font-bold text-gray-900 text-lg">
                Cookies & Datenschutz
              </h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                Wir verwenden nur das, was wirklich nötig ist. Ihr entscheidet, was zusätzlich erlaubt sein soll.
                Mehr Details findet ihr in unserer{" "}
                <Link href="/datenschutz">
                  <span className="text-amber-600 hover:text-amber-700 underline cursor-pointer">Datenschutzerklärung</span>
                </Link>.
              </p>
            </div>
          </div>

          {settingsOpen ? (
            <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
              <ConsentRow
                title="Notwendig"
                desc="Login-Session, Cookie-Auswahl und Sicherheits-Cookies. Diese sind technisch erforderlich und immer aktiv."
                checked={true}
                onChange={() => {}}
                disabled
              />
              <ConsentRow
                title="Funktional"
                desc="Speichert eure Eingaben lokal, damit ihr sie nach einem Reload wiederfindet — auch ohne Login."
                checked={functional}
                onChange={setFunctional}
              />
              <ConsentRow
                title="Statistik"
                desc="Anonyme Nutzungsstatistiken, damit wir die App verbessern können. (Aktuell nicht im Einsatz, ihr könnt es vorab erlauben oder ablehnen.)"
                checked={analytics}
                onChange={setAnalytics}
              />
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
              <li className="bg-gray-50 border border-gray-100 rounded p-2"><strong>Notwendig:</strong> immer aktiv</li>
              <li className="bg-gray-50 border border-gray-100 rounded p-2"><strong>Funktional:</strong> Entwürfe merken</li>
              <li className="bg-gray-50 border border-gray-100 rounded p-2"><strong>Statistik:</strong> derzeit nicht im Einsatz</li>
            </ul>
          )}
        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={rejectAll}>
            Nur notwendige
          </Button>
          {settingsOpen ? (
            <Button onClick={saveChoice} className="bg-gray-900 hover:bg-gray-800 text-white">
              Auswahl speichern
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              Einstellungen
            </Button>
          )}
          <Button onClick={acceptAll} className="bg-amber-600 hover:bg-amber-700 text-white">
            Alle akzeptieren
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConsentRow({
  title, desc, checked, onChange, disabled,
}: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded border ${disabled ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200"}`}>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="mt-0.5" />
      <div className="flex-1">
        <Label className="font-semibold text-sm text-gray-900">{title}</Label>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
