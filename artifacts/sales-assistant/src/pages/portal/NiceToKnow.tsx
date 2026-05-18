import { Link } from "wouter";
import { ArrowLeft, Sparkles } from "lucide-react";
import { NiceToKnowList } from "@/components/portal/NiceToKnow";

export default function NiceToKnowPage() {
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <Link href="/portal">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" />
          Zurück zur Startseite
        </span>
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Nice to know — Weddings
          </h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Eine kleine Sammlung an Hinweisen und Erfahrungswerten, damit euer Hochzeitstag
          rund läuft. Tippt auf eine Karte, um die Details zu lesen.
        </p>
      </div>

      <NiceToKnowList />
    </div>
  );
}
