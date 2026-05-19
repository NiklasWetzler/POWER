import { useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Heart, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardCanvas } from "./CardCanvas";
import type { CardKind, TemplateSpec } from "./templates";

interface TinderSwipeProps {
  kind: CardKind;
  templates: TemplateSpec[];
  onComplete: (liked: TemplateSpec[]) => void;
  /** sample data for previews */
  sampleData: Record<string, string>;
}

interface CardState {
  template: TemplateSpec;
  decided: "liked" | "skipped" | null;
}

export function TinderSwipe({ kind, templates, onComplete, sampleData }: TinderSwipeProps) {
  const initial: CardState[] = useMemo(
    () => templates.map((t) => ({ template: t, decided: null })),
    [templates],
  );
  const [stack, setStack] = useState<CardState[]>(initial);
  const [index, setIndex] = useState(0);

  const current = stack[index];
  const next = stack[index + 1];
  const done = index >= stack.length;

  const decide = (decision: "liked" | "skipped") => {
    setStack((s) => s.map((c, i) => (i === index ? { ...c, decided: decision } : c)));
    setTimeout(() => setIndex((i) => i + 1), 200);
  };

  const reset = () => {
    setStack(initial);
    setIndex(0);
  };

  const finish = () => {
    const liked = stack.filter((c) => c.decided === "liked").map((c) => c.template);
    onComplete(liked.length > 0 ? liked : templates); // if nothing liked, show all
  };

  if (done) {
    const liked = stack.filter((c) => c.decided === "liked");
    return (
      <div className="text-center py-10 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-4">
          <Heart className="w-6 h-6 text-amber-600 fill-amber-600" />
        </div>
        <h3 className="text-xl font-bold mb-1">
          {liked.length === 0
            ? "Keine Favoriten — kein Problem"
            : liked.length === 1
              ? "1 Favorit ausgewählt"
              : `${liked.length} Favoriten ausgewählt`}
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          {liked.length === 0
            ? "Wir zeigen euch alle Vorlagen zur Auswahl."
            : "Jetzt könnt ihr eure Lieblings-Vorlage auswählen."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Nochmal swipen
          </Button>
          <Button onClick={finish} className="bg-amber-600 hover:bg-amber-700 text-white">
            Weiter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="text-center text-xs text-gray-500 mb-3">
        Karte {index + 1} von {stack.length} · Wisch nach rechts für ♡, nach links zum Überspringen
      </div>

      <div className="relative h-[460px] flex items-center justify-center">
        {next && <SwipeCard key={`bg-${index}`} state={next} kind={kind} data={sampleData} stacked />}
        {current && (
          <SwipeCard
            key={current.template.id + "-" + index}
            state={current}
            kind={kind}
            data={sampleData}
            onDecide={decide}
          />
        )}
      </div>

      <div className="flex justify-center gap-6 mt-6">
        <button
          onClick={() => decide("skipped")}
          className="w-12 h-12 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition"
          aria-label="Überspringen"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <button
          onClick={() => decide("liked")}
          className="w-12 h-12 rounded-full bg-rose-500 border border-rose-600 shadow-sm flex items-center justify-center hover:bg-rose-600 active:scale-95 transition"
          aria-label="Gefällt mir"
        >
          <Heart className="w-5 h-5 text-white fill-white" />
        </button>
      </div>
    </div>
  );
}

function SwipeCard({
  state, kind, data, onDecide, stacked,
}: {
  state: CardState;
  kind: CardKind;
  data: Record<string, string>;
  onDecide?: (d: "liked" | "skipped") => void;
  stacked?: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const skipOpacity = useTransform(x, [-140, -40], [1, 0]);

  const handleEnd = (_: unknown, info: PanInfo) => {
    if (!onDecide) return;
    if (info.offset.x > 120) onDecide("liked");
    else if (info.offset.x < -120) onDecide("skipped");
  };

  return (
    <motion.div
      drag={onDecide ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleEnd}
      style={onDecide ? { x, rotate } : undefined}
      initial={stacked ? { scale: 0.95, y: 12, opacity: 0.6 } : { scale: 1 }}
      animate={stacked ? { scale: 0.95, y: 12, opacity: 0.6 } : { scale: 1, y: 0, opacity: 1 }}
      exit={{ x: 600, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`absolute select-none ${onDecide ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100">
        <CardCanvas kind={kind} template={state.template} data={data} width={260} />
        <div className="mt-3 text-center">
          <p className="font-semibold text-sm text-gray-900">{state.template.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{state.template.tagline}</p>
        </div>
      </div>
      {onDecide && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-6 right-6 px-3 py-1.5 rounded-md border-2 border-rose-500 text-rose-500 font-bold text-sm rotate-12 bg-white/90"
          >
            FAVORIT
          </motion.div>
          <motion.div
            style={{ opacity: skipOpacity }}
            className="absolute top-6 left-6 px-3 py-1.5 rounded-md border-2 border-gray-400 text-gray-500 font-bold text-sm -rotate-12 bg-white/90"
          >
            SKIP
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
