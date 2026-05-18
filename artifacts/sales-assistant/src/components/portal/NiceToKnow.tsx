import { useState } from "react";
import {
  Sparkles,
  Music2,
  ClipboardCheck,
  Heart,
  Cable,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Topic {
  id: string;
  icon: React.ReactNode;
  title: string;
  intro: string;
  body: React.ReactNode;
  accent: "amber" | "rose" | "blue" | "emerald";
}

const ACCENT: Record<Topic["accent"], { ring: string; bg: string; icon: string; pill: string }> = {
  amber:   { ring: "border-amber-200",   bg: "bg-amber-50/60",   icon: "bg-amber-500",   pill: "bg-amber-100 text-amber-700" },
  rose:    { ring: "border-rose-200",    bg: "bg-rose-50/60",    icon: "bg-rose-500",    pill: "bg-rose-100 text-rose-700" },
  blue:    { ring: "border-blue-200",    bg: "bg-blue-50/60",    icon: "bg-blue-500",    pill: "bg-blue-100 text-blue-700" },
  emerald: { ring: "border-emerald-200", bg: "bg-emerald-50/60", icon: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-700" },
};

const TOPICS: Topic[] = [
  {
    id: "dj-platzierung",
    icon: <Cable className="w-4 h-4" />,
    title: "Hochzeits-DJ — Platzierung am Tag",
    intro: "Der DJ ist gebucht — bitte beachtet vor Ort nur diese zwei Punkte.",
    accent: "amber",
    body: (
      <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc pl-5">
        <li>
          <strong>Strom in der Nähe:</strong> Bitte sorgt dafür, dass am DJ-Platz mindestens eine
          freie Steckdose verfügbar ist (möglichst eigener Stromkreis). Ohne Strom geht keine Musik.
        </li>
        <li>
          <strong>Keine Stolperfallen:</strong> Plant den DJ-Platz so, dass keine Kabel über
          Tanzfläche oder Laufwege gespannt werden müssen. Im Idealfall steht der DJ direkt an der
          Wand neben der Tanzfläche — kurze Wege, sichere Kabel, perfekter Sound.
        </li>
      </ul>
    ),
  },
  {
    id: "musikfragebogen-deadline",
    icon: <ClipboardCheck className="w-4 h-4" />,
    title: "Musikfragebogen — Deadline 2 Wochen vorher",
    intro: "Je mehr ihr ausfüllt, desto persönlicher wird euer Sound.",
    accent: "rose",
    body: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          Bitte sendet uns den Musikfragebogen <strong>spätestens 2 Wochen vor eurer Hochzeit</strong> ab.
          So kann der DJ in Ruhe Playlisten kuratieren, fehlende Tracks beschaffen und auf Wünsche
          eingehen.
        </p>
        <p>
          Tipp: Auch <strong>Spotify-Playlist</strong> einfach mit reinpacken — direkt im
          Musikfragebogen. Wir hören sie an und nehmen die Stimmung mit auf.
        </p>
      </div>
    ),
  },
  {
    id: "perfekte-planung",
    icon: <Heart className="w-4 h-4" />,
    title: "Perfekte Planung — alles aus einer Hand",
    intro: "Weniger Stress, mehr Qualität — wir koordinieren das große Ganze.",
    accent: "emerald",
    body: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          Bei NIWE bekommt ihr nicht nur den DJ — wir verbinden <strong>alle wichtigen Gewerke</strong>{" "}
          (Musik, Licht, Foto, Moderation u.v.m.) aufeinander abgestimmt. Das spart euch das
          Hin und Her zwischen Dienstleistern und sorgt dafür, dass alles wie aus einem Guss wirkt.
        </p>
        <ul className="space-y-1.5 list-disc pl-5">
          <li>Ein fester Ansprechpartner — keine Mailflut.</li>
          <li>Abgestimmtes Timing zwischen DJ, Foto und Programm.</li>
          <li>Gleicher Qualitätsanspruch über alle Bereiche.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "facts",
    icon: <Lightbulb className="w-4 h-4" />,
    title: "Wusstet ihr schon? — Cool Facts",
    intro: "Drei kleine Erkenntnisse, die eure Feier besser machen.",
    accent: "blue",
    body: (
      <ul className="space-y-2.5 text-sm text-gray-700 leading-relaxed list-disc pl-5">
        <li>
          Die <strong>ersten 30 Minuten</strong> auf der Tanzfläche entscheiden über den Rest der Nacht.
          Deshalb planen wir den Opener bewusst — kein Risiko-Song direkt nach dem Eröffnungstanz.
        </li>
        <li>
          Ein <strong>kurzer Sektempfang mit Hintergrundmusik</strong> (instrumental, ca. 60 dB) lockert
          die Stimmung ohne den Smalltalk zu stören.
        </li>
        <li>
          <strong>Wunschlieder von Gästen</strong> funktionieren am besten <em>nach Mitternacht</em> —
          davor halten wir den roten Faden.
        </li>
        <li>
          Ein <Music2 className="w-3 h-3 inline -mt-0.5" /> <strong>Lieblingssong des Brautpaares</strong>{" "}
          zum Anstoßen vorm Essen — kleine Geste, große Wirkung.
        </li>
      </ul>
    ),
  },
];

function TopicCard({ topic }: { topic: Topic }) {
  const [open, setOpen] = useState(false);
  const a = ACCENT[topic.accent];

  return (
    <div className={cn("rounded-xl border bg-white overflow-hidden transition-all", a.ring)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full text-left flex items-center gap-3 p-4 transition-colors",
          open ? a.bg : "hover:bg-gray-50/80",
        )}
        aria-expanded={open}
      >
        <div className={cn("w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm", a.icon)}>
          {topic.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900">{topic.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{topic.intro}</p>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className={cn("px-4 pb-4 pt-1 border-t", a.ring)}>{topic.body}</div>
      )}
    </div>
  );
}

export function NiceToKnow() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h2 className="text-base font-semibold text-gray-800">
          Nice to know — Weddings
        </h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        Kurze Hinweise, damit euer Tag rund läuft. Tippt auf eine Karte für Details.
      </p>
      <div className="space-y-2.5">
        {TOPICS.map((t) => (
          <TopicCard key={t.id} topic={t} />
        ))}
      </div>
    </section>
  );
}
