import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { FragebogenForm } from "@/pages/Fragebogen";

export default function MusikFragebogenPortal() {
  return (
    <div className="space-y-4">
      <Link href="/portal/formulare">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" />
          Zurück zu Formulare
        </span>
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Musikfragebogen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bitte möglichst vollständig ausfüllen – je mehr wir wissen, desto besser wird eure musikalische Hochzeitsreise!
          </p>
        </div>
        <FragebogenForm isAdminView />
      </div>
    </div>
  );
}
