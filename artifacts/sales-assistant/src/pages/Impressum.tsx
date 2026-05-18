import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Impressum() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">
        <div>
          <Link href="/">
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 cursor-pointer mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Impressum</h1>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 leading-relaxed">
          <p className="font-semibold mb-1">Wichtiger Hinweis</p>
          <p>
            Diese Impressum-Vorlage wurde mit größter Sorgfalt erstellt. Dennoch übernehmen wir keine Gewähr für die
            Vollständigkeit und Richtigkeit der Inhalte sowie für deren Rechtssicherheit. Es liegt in der Verantwortung
            des Nutzers, die Vorlage eigenständig an die jeweils geltenden gesetzlichen Bestimmungen anzupassen und auf
            ihre Aktualität zu prüfen. Eine Haftung für Schäden, die direkt oder indirekt aus der Nutzung dieser Vorlage
            entstehen, wird ausgeschlossen.
          </p>
        </div>

        {/* Angaben gemäß § 5 TMG */}
        <section className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Angaben gemäß § 5 TMG</h2>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-700 leading-7">
            <p className="font-semibold text-gray-900">Website-Betreiber:</p>
            <p>NIWE EVENTS</p>
            <p>Quellenweg 1</p>
            <p>88480 Achstetten</p>
            <p>Deutschland</p>
          </div>
        </section>

        {/* Kontakt */}
        <section className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Kontaktinformationen</h2>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-700 leading-7">
            <p>
              <span className="text-gray-500 w-20 inline-block">Telefon:</span>
              <a href="tel:+4915122284776" className="hover:text-amber-600 transition-colors">+49 151 22284776</a>
            </p>
            <p>
              <span className="text-gray-500 w-20 inline-block">E-Mail:</span>
              <a href="mailto:info@niwe-events.com" className="hover:text-amber-600 transition-colors">info@niwe-events.com</a>
            </p>
            <p>
              <span className="text-gray-500 w-20 inline-block">Website:</span>
              <a href="https://www.niwe-events.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 transition-colors">www.niwe-events.com</a>
            </p>
          </div>
        </section>

        {/* Vertretung */}
        <section className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Vertretungsberechtigte Person</h2>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-700 leading-7">
            <p>Niklas Wetzler</p>
            <p className="text-gray-500">(Geschäftsführer)</p>
          </div>
        </section>

        {/* Unternehmensregistrierung */}
        <section className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Unternehmensregistrierung</h2>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-700 leading-7">
            <p>
              <span className="text-gray-500">Umsatzsteuer-ID gemäß § 27a UStG:</span>
              <span className="ml-2 font-medium">DE3524411460</span>
            </p>
          </div>
        </section>

        {/* Letzte Aktualisierung */}
        <p className="text-xs text-gray-400">Letzte Aktualisierung: 03.10.2025</p>
      </main>

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        NIWE Weddings · NIWE Events · info@niwe-events.com
      </footer>
    </div>
  );
}
