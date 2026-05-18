import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Music2, ChevronRight, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Form {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function Formulare() {
  const { data: forms = [], isLoading } = useQuery<Form[]>({
    queryKey: ["customer-forms"],
    queryFn: async () => {
      const res = await fetch("/api/customer/forms", { credentials: "include" });
      if (!res.ok) throw new Error("Fehler beim Laden.");
      return res.json() as Promise<Form[]>;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Formulare</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hier findet ihr alle verfügbaren Formulare für eure Hochzeitsplanung.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Wird geladen…</p>
      ) : forms.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aktuell sind keine Formulare verfügbar.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {forms.map((form) => (
            <Link key={form.id} href={`/portal/formulare/${form.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 group">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    {form.icon === "music" ? (
                      <Music2 className="w-5 h-5 text-amber-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                      {form.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{form.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 shrink-0 mt-0.5 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
