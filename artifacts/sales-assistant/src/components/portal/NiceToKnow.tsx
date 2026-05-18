import { useState } from "react";
import {
  Sparkles,
  Music2,
  ClipboardCheck,
  Heart,
  Cable,
  Lightbulb,
  ChevronDown,
  ChevronRight,
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

const ACCENT: Record<Topic["accent"], { ring: string; bg: string; icon: string }> = {
  amber:   { ring: "border-amber-200",   bg: "bg-amber-50/60",   icon: "bg-amber-500" },
  rose:    { ring: "border-rose-200",    bg: "bg-rose-50/60",    icon: "bg-rose-500" },
  blue:    { ring: "border-blue-200",    bg: "bg-blue-50/60",    icon: "bg-blue-500" },
  emerald: { ring: "border-emerald-200", bg: "bg-emerald-50/60", icon: "bg-emerald-500" },
};

export const NICE_TO_KNOW_TOPICS: Topic[] = [
  {
    id: "dj-platzierung",
    icon: <Cable className="w-4 h-4" />,
    title: "Hochzeits-DJ — Platzierung am Tag",
    intro: "Der DJ ist gebucht. Bitte beachtet vor Ort nur diese zwei Punkte.",
    accent: "amber",
    body: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          Damit am Hochzeitstag alles reibungslos läuft, brauchen wir am DJ-Platz lediglich
          zwei Dinge:
        </p>
        <ul className="space-y-2 list-disc pl-5">
          <li>
            <strong>Strom in der Nähe.</strong> Bitte sorgt dafür, dass am DJ-Platz mindestens
            eine freie Steckdose verfügbar ist, idealerweise ein eigener Stromkreis. Ohne
            Strom geht keine Musik.
          </li>
          <li>
            <strong>Keine Stolperfallen.</strong> Plant den DJ-Platz so, dass keine Kabel über
            die Tanzfläche oder Laufwege gespannt werden müssen. Am besten steht der DJ direkt
            an der Wand neben der Tanzfläche – kurze Wege, sichere Kabel, sauberer Sound.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Alles Weitere (Technik, Aufbau, Ablauf) übernehmen wir.
        </p>
      </div>
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
          Bitte sendet uns den Musikfragebogen{" "}
          <strong>spätestens 2 Wochen vor eurer Hochzeit</strong> ab. So kann der DJ in Ruhe
          Playlisten kuratieren, fehlende Tracks beschaffen und gezielt auf eure Wünsche
          eingehen.
        </p>
        <p>
          Tipp: Ihr könnt auch eine{" "}
          <strong>Spotify-Playlist</strong> direkt im Musikfragebogen verlinken. Wir hören sie
          an und nehmen die Stimmung mit in eure Hochzeit auf.
        </p>
        <p className="text-xs text-muted-foreground">
          Lieber etwas zu viel als zu wenig – jede Information hilft uns, euren Abend
          treffsicher zu gestalten.
        </p>
      </div>
    ),
  },
  {
    id: "perfekte-planung",
    icon: <Heart className="w-4 h-4" />,
    title: "Perfekte Planung — alles aus einer Hand",
    intro: "Weniger Stress, mehr Qualität – wir koordinieren das große Ganze.",
    accent: "emerald",
    body: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          Bei NIWE bekommt ihr nicht nur den DJ. Wir verbinden{" "}
          <strong>alle wichtigen Gewerke</strong> (Musik, Licht, Foto, Moderation und mehr)
          aufeinander abgestimmt. Das spart euch das Hin und Her zwischen verschiedenen
          Dienstleistern und sorgt dafür, dass alles wie aus einem Guss wirkt.
        </p>
        <ul className="space-y-1.5 list-disc pl-5">
          <li>Ein fester Ansprechpartner statt Mailflut.</li>
          <li>Abgestimmtes Timing zwischen DJ, Foto und Programm.</li>
          <li>Gleicher Qualitätsanspruch über alle Bereiche.</li>
          <li>Ein Vertrag, ein Team, ein konsistentes Erlebnis.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "facts",
    icon: <Lightbulb className="w-4 h-4" />,
    title: "Wusstet ihr schon? — Cool Facts",
    intro: "Vier kleine Erkenntnisse, die eure Feier besser machen.",
    accent: "blue",
    body: (
      <ul className="space-y-2.5 text-sm text-gray-700 leading-relaxed list-disc pl-5">
        <li>
          Die <strong>ersten 30 Minuten</strong> auf der Tanzfläche entscheiden über den Rest
          der Nacht. Deshalb planen wir den Opener bewusst und vermeiden Risiko-Songs direkt
          nach dem Eröffnungstanz.
        </li>
        <li>
          Ein <strong>kurzer Sektempfang mit Hintergrundmusik</strong> (instrumental, ca. 60
          dB) lockert die Stimmung, ohne den Smalltalk zu stören.
        </li>
        <li>
          <strong>Wunschlieder von Gästen</strong> funktionieren am besten{" "}
          <em>nach Mitternacht</em>. Davor halten wir den roten Faden der Feier.
        </li>
        <li>
          Ein{" "}
          <Music2 className="w-3 h-3 inline -mt-0.5" />{" "}
          <strong>Lieblingssong des Brautpaares</strong> zum Anstoßen vor dem Essen – kleine
          Geste, große Wirkung.
        </li>
      </ul>
    ),
  },
];

export function NiceToKnowTopicCard({
  topic,
  defaultOpen = false,
}: {
  topic: Topic;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
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
        <div
          className={cn(
            "w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm",
            a.icon,
          )}
        >
          {topic.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 leading-snug">{topic.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{topic.intro}</p>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className={cn("px-4 pb-4 pt-3 border-t", a.ring)}>{topic.body}</div>
      )}
    </div>
  );
}

export function NiceToKnowList({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <div className="space-y-2.5">
      {NICE_TO_KNOW_TOPICS.map((t) => (
        <NiceToKnowTopicCard key={t.id} topic={t} defaultOpen={defaultOpen} />
      ))}
    </div>
  );
}

export function NiceToKnowHomeCard() {
  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow group">
      <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors text-sm">
          Nice to know — Weddings
        </p>
        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
          Wichtige Hinweise und kleine Erkenntnisse für euren Tag.
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 shrink-0 transition-colors" />
    </div>
  );
}
