import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function AGB() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">
        <div>
          <Link href="/">
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 cursor-pointer mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            AGB &amp; Widerrufsbelehrung
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Diese Bedingungen gelten für sämtliche online abgeschlossenen Verträge über die
            Plattform{" "}
            <a
              href="https://niweweddingsapp.de"
              className="underline underline-offset-2 hover:text-amber-700"
            >
              https://niweweddingsapp.de
            </a>
            .
          </p>
        </div>

        {/* AGB */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Allgemeine Geschäftsbedingungen
          </h2>

          <article className="rounded-xl border border-gray-200 bg-white px-5 py-5 text-sm text-gray-700 leading-7 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-900">§1 Geltungsbereich</h3>
              <p>
                Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge, die über die
                Plattform „NIWE Weddings App" zwischen NIWE Events und dem jeweiligen Kunden
                abgeschlossen werden.
              </p>
              <p>
                Die Plattform dient insbesondere der digitalen Vertragsabwicklung, Bereitstellung
                von Dokumenten sowie der elektronischen Unterzeichnung von Aufführungsverträgen
                und Eventdienstleistungen.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">§2 Vertragspartner</h3>
              <p className="font-medium">Auftragnehmer:</p>
              <p>NIWE Events</p>
              <p>Quellenweg 1</p>
              <p>88480 Achstetten</p>
              <p>Vertreten durch: Niklas Wetzler</p>
              <p>
                E-Mail:{" "}
                <a
                  href="mailto:wetzler@niwe-events.com"
                  className="underline underline-offset-2 hover:text-amber-700"
                >
                  wetzler@niwe-events.com
                </a>
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">§3 Vertragsschluss</h3>
              <p>
                (1) Der Vertrag kommt rechtsverbindlich zustande, sobald der Kunde den
                bereitgestellten Vertrag über die Plattform https://niweweddingsapp.de digital
                unterzeichnet.
              </p>
              <p>
                (2) Die digitale Unterzeichnung gilt als rechtsverbindliche Willenserklärung und
                ersetzt die handschriftliche Unterschrift, soweit gesetzlich zulässig.
              </p>
              <p>(3) Mit der Unterzeichnung bestätigt der Kunde:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>die Kenntnisnahme der Vertragsinhalte,</li>
                <li>die Zustimmung zu diesen AGB,</li>
                <li>die Zustimmung zur Datenschutzerklärung,</li>
                <li>die verbindliche Buchung der vereinbarten Leistungen.</li>
              </ul>
              <p>
                (4) Der digital signierte Vertrag wird elektronisch gespeichert und gilt als
                Nachweis des Vertragsschlusses.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">§4 Vertragsgegenstand</h3>
              <p>Gegenstand des Vertrags sind insbesondere:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>DJ-Leistungen,</li>
                <li>musikalische Gestaltung von Hochzeiten und Events,</li>
                <li>Bereitstellung von Ton- und Lichttechnik,</li>
                <li>Eventdienstleistungen,</li>
                <li>Künstler- und DJ-Vermittlungen,</li>
                <li>sonstige individuell vereinbarte Leistungen.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">§5 Zahlungsbedingungen</h3>
              <p>Es gelten die individuell vereinbarten Preise laut Vertrag.</p>
              <p>
                Vereinbarte Anzahlungen sind innerhalb der im Vertrag genannten Fristen fällig.
              </p>
              <p>
                Rechnungen sind innerhalb von 7 Tagen nach Rechnungserhalt ohne Abzug zahlbar,
                sofern keine abweichende Vereinbarung getroffen wurde.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                §6 Widerrufsrecht &amp; digitales Vertragsmodell
              </h3>
              <p>Verbrauchern steht grundsätzlich ein gesetzliches Widerrufsrecht zu.</p>
              <p>
                Der Kunde stimmt ausdrücklich zu, dass NIWE Events bereits vor Ablauf der
                Widerrufsfrist mit der Planung, Vorbereitung oder Durchführung der gebuchten
                Dienstleistung beginnt.
              </p>
              <p>
                Der Kunde bestätigt gleichzeitig, dass sein Widerrufsrecht gemäß § 356 Abs. 4 BGB
                erlischt, sobald die Dienstleistung vollständig erbracht wurde.
              </p>
              <p>
                Mit der digitalen Vertragsunterzeichnung erklärt sich der Kunde ausdrücklich mit
                dieser Regelung einverstanden.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">§7 Speicherung &amp; Nachweis</h3>
              <p>
                Digitale Verträge, Formulare, Zustimmungen und Zeitstempel werden elektronisch
                gespeichert.
              </p>
              <p>
                Die elektronische Speicherung gilt als Nachweis für den rechtswirksamen
                Vertragsschluss.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">§8 Haftung</h3>
              <p>
                NIWE Events haftet nur bei Vorsatz oder grober Fahrlässigkeit, soweit gesetzlich
                zulässig.
              </p>
              <p>
                Für Ausfälle durch höhere Gewalt, behördliche Einschränkungen oder unvorhersehbare
                Ereignisse besteht keine Haftung.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">§9 Datenschutz</h3>
              <p>
                Personenbezogene Daten werden ausschließlich zur Vertragsabwicklung verarbeitet.
              </p>
              <p>
                Es gelten ergänzend die{" "}
                <Link href="/datenschutz">
                  <span className="underline underline-offset-2 hover:text-amber-700 cursor-pointer">
                    Datenschutzbestimmungen
                  </span>
                </Link>{" "}
                auf https://niweweddingsapp.de.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">§10 Schlussbestimmungen</h3>
              <p>Es gilt deutsches Recht.</p>
              <p>Gerichtsstand ist – soweit gesetzlich zulässig – Biberach an der Riß.</p>
              <p>
                Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen
                Regelungen unberührt.
              </p>
            </div>
          </article>
        </section>

        {/* Widerrufsbelehrung */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Widerrufsbelehrung
          </h2>

          <article className="rounded-xl border border-gray-200 bg-white px-5 py-5 text-sm text-gray-700 leading-7 space-y-5">
            <p>Verbraucher haben grundsätzlich ein gesetzliches Widerrufsrecht von 14 Tagen.</p>

            <div>
              <h3 className="font-semibold text-gray-900">Widerrufsrecht</h3>
              <p>
                Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag
                zu widerrufen.
              </p>
              <p>Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.</p>
              <p>
                Zur Ausübung Ihres Widerrufsrechts müssen Sie NIWE Events mittels eindeutiger
                Erklärung informieren.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                Vorzeitiges Erlöschen des Widerrufsrechts
              </h3>
              <p>
                Das Widerrufsrecht erlischt vorzeitig, wenn der Kunde ausdrücklich zustimmt, dass
                NIWE Events vor Ablauf der Widerrufsfrist mit der Ausführung der Dienstleistung
                beginnt und bestätigt, dass er dadurch sein Widerrufsrecht verliert.
              </p>
            </div>
          </article>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 leading-7">
            <p className="font-semibold mb-1">
              Pflicht-Checkbox vor Vertragsunterzeichnung
            </p>
            <p className="italic">
              „Ich habe die AGB und Widerrufsbelehrung gelesen und akzeptiere diese. Ich stimme
              ausdrücklich zu, dass NIWE Events vor Ablauf der Widerrufsfrist mit der Ausführung
              der Dienstleistung beginnt. Mir ist bekannt, dass mein Widerrufsrecht bei
              vollständiger Vertragserfüllung erlischt."
            </p>
          </div>
        </section>

        <p className="text-xs text-gray-400">Stand: Mai 2026</p>
      </main>

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        NIWE Weddings · NIWE Events · info@niwe-events.com
      </footer>
    </div>
  );
}
