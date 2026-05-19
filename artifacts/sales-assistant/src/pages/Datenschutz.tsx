import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 flex gap-3">
        <span className="text-amber-500 tabular-nums">{number}</span>
        <span>{title}</span>
      </h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-3 pl-8">{children}</div>
    </section>
  );
}

function SubSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-800">
        <span className="text-gray-400 mr-2 tabular-nums">{number}</span>{title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-outside ml-5 space-y-1 marker:text-amber-400">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 space-y-10">
        {/* Header */}
        <div>
          <Link href="/">
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 cursor-pointer mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Datenschutzerklärung</h1>
          <p className="text-sm text-gray-500 mt-2">Stand: 7. November 2025</p>
        </div>

        {/* 1. Allgemeine Informationen */}
        <Section number="1." title="Allgemeine Informationen">
          <SubSection number="1.1" title="Verarbeitung von personenbezogenen Daten">
            <p>Personenbezogene Daten sind alle Informationen, mit denen Du persönlich identifiziert werden kannst, z.B.:</p>
            <List items={["IP-Adresse", "Name", "Anschrift", "E-Mail-Adresse", "Telefonnummer", "Zahlungsdaten"]} />
            <p>„Verarbeitung" bedeutet jeder Vorgang im Zusammenhang mit personenbezogenen Daten, z.B. Erheben, Speichern, Verwenden, Übermitteln oder Löschen (Art. 4 Nr. 2 DSGVO).</p>
            <p>Weitere Begriffsbestimmungen findest Du in Art. 4 DSGVO.</p>
          </SubSection>

          <SubSection number="1.2" title="Anwendbare Rechtsgrundlagen">
            <p>Wir verarbeiten personenbezogene Daten ausschließlich auf Basis der gesetzlichen Grundlagen der DSGVO, insbesondere:</p>
            <List items={[
              "Art. 6 Abs. 1 lit. a DSGVO – Einwilligung",
              "Art. 6 Abs. 1 lit. b DSGVO – Vertrag / vorvertragliche Maßnahmen",
              "Art. 6 Abs. 1 lit. c DSGVO – rechtliche Verpflichtung",
              "Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse",
            ]} />
            <p>Ggf. findet ergänzend das BDSG und für den Einsatz von Cookies und ähnlichen Technologien das TTDSG Anwendung.</p>
          </SubSection>
        </Section>

        {/* 2. Verantwortlicher */}
        <Section number="2." title="Verantwortlicher">
          <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 leading-7">
            <p className="font-semibold text-gray-900">NIWE Events</p>
            <p>Vertreten durch: Niklas Wetzler</p>
            <p>Quellenweg 1</p>
            <p>88480 Achstetten</p>
            <p className="pt-1">Telefon: <a href="tel:+4915122284776" className="hover:text-amber-600">+49 151 22284776</a></p>
            <p>E-Mail: <a href="mailto:wetzler@niwe-events.com" className="hover:text-amber-600">wetzler@niwe-events.com</a></p>
          </div>
          <p>Wenn Du Fragen zum Datenschutz hast oder Deine Rechte geltend machen möchtest, kannst Du Dich jederzeit über die oben genannten Kontaktdaten an uns wenden.</p>
        </Section>

        {/* 3. Unsere Grundsätze */}
        <Section number="3." title="Unsere Grundsätze">
          <p>Datenschutz ist für uns keine Formsache, sondern Ausdruck eines respektvollen Umgangs mit Deinen Daten.</p>
          <p>Wir:</p>
          <List items={[
            "erheben nur die Daten, die wir wirklich benötigen,",
            "verwenden sie zweckgebunden,",
            "schützen sie durch technische und organisatorische Maßnahmen,",
            "geben sie nur weiter, wenn hierfür eine Rechtsgrundlage besteht,",
            "löschen sie, sobald der Zweck entfällt und keine Aufbewahrungspflichten entgegenstehen.",
          ]} />
        </Section>

        {/* 4. Hosting */}
        <Section number="4." title="Hosting">
          <p>Unsere Website wird bei folgendem Anbieter gehostet:</p>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 leading-7">
            <p className="font-semibold text-gray-900">STRATO GmbH</p>
            <p>Otto-Ostrowski-Straße 7</p>
            <p>10249 Berlin</p>
            <p>Deutschland</p>
          </div>
          <p>Im Rahmen des Hostings werden insbesondere folgende Daten verarbeitet:</p>
          <List items={[
            "Server-Logfiles (siehe Abschnitt 5)",
            "alle Daten, die über die Website übermittelt werden (z.B. Kontaktanfragen, Bestellungen)",
          ]} />
          <p>Das Hosting erfolgt zum Zweck einer sicheren, schnellen und zuverlässigen Bereitstellung unserer Website.</p>
          <p className="font-medium text-gray-800">Rechtsgrundlagen:</p>
          <List items={[
            "Art. 6 Abs. 1 lit. b DSGVO (Vertrag / vorvertragliche Maßnahmen)",
            "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an stabiler und sicherer Bereitstellung)",
            "Art. 6 Abs. 1 lit. a DSGVO i.V.m. § 25 Abs. 1 TTDSG (bei Einwilligung in Cookies / Endgerätezugriffe, sofern einschlägig)",
          ]} />
          <p>Mit STRATO haben wir einen Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO geschlossen. STRATO verarbeitet personenbezogene Daten nur nach unserer Weisung.</p>
        </Section>

        {/* 5. Server-Logfiles */}
        <Section number="5." title="Datenerhebung beim Aufruf der Website (Server-Logfiles)">
          <p>Beim Besuch unserer Website werden automatisch Informationen in Server-Logfiles gespeichert. Dazu gehören:</p>
          <List items={[
            "Browsertyp und -version",
            "verwendetes Betriebssystem",
            "Referrer URL",
            "Hostname des zugreifenden Rechners",
            "Uhrzeit der Serveranfrage",
            "IP-Adresse",
          ]} />
          <p>Diese Daten werden verarbeitet, um:</p>
          <List items={[
            "einen reibungslosen Verbindungsaufbau zur Website zu gewährleisten",
            "die Systemsicherheit und -stabilität zu sichern",
            "technische Fehler zu analysieren",
            "die Website korrekt darzustellen",
          ]} />
          <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an technischer Funktionalität und Sicherheit).</p>
          <p className="font-medium text-gray-800">Speicherdauer:</p>
          <p>Die Logfiles werden in der Regel für maximal 14 Tage gespeichert und anschließend gelöscht, sofern keine längere Aufbewahrung zur Aufklärung sicherheitsrelevanter Vorfälle erforderlich ist.</p>
          <p>Eine Zusammenführung mit anderen Daten findet nicht statt.</p>
        </Section>

        {/* 6. Cookies */}
        <Section number="6." title="Cookies">
          <SubSection number="6.1" title="Allgemeines">
            <p>Unsere Website verwendet Cookies und ähnliche Technologien. Cookies sind kleine Textdateien, die auf Deinem Endgerät gespeichert werden und Informationen enthalten, die im Zusammenhang mit unserer Website stehen.</p>
            <p>Cookies können unterschiedliche Funktionen haben, z.B.:</p>
            <List items={["technisch notwendige Funktionen", "Komfortfunktionen", "Analyse und Reichweitenmessung"]} />
          </SubSection>

          <SubSection number="6.2" title="Ablehnung von Cookies">
            <p>Du kannst das Setzen von Cookies über die Einstellungen Deines Browsers einschränken oder verhindern. Dort kannst Du auch bereits gesetzte Cookies löschen.</p>
            <p>Hinweise für gängige Browser:</p>
            <List items={["Mozilla Firefox", "Google Chrome", "Microsoft Edge", "Safari"]} />
            <p className="text-gray-500 italic text-xs">(Die jeweiligen Anleitungen findest Du über die Support-Seiten der Anbieter.)</p>
            <p>Bitte beachte: Die Deaktivierung bestimmter Cookies kann die Funktionalität unserer Website einschränken.</p>
          </SubSection>

          <SubSection number="6.3" title="Technisch notwendige Cookies">
            <p>Diese Cookies sind erforderlich, damit unsere Website ordnungsgemäß funktioniert (z.B. Navigation, Sicherheit, ggf. Warenkorbfunktionen).</p>
            <p className="font-medium text-gray-800">Rechtsgrundlagen:</p>
            <List items={[
              "Art. 6 Abs. 1 lit. b DSGVO (zur Vertragserfüllung erforderlich)",
              "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem und funktionsfähigem Betrieb)",
              "ggf. Art. 6 Abs. 1 lit. c DSGVO (gesetzliche Verpflichtung)",
            ]} />
          </SubSection>

          <SubSection number="6.4" title="Technisch nicht notwendige Cookies">
            <p>Hierzu zählen z.B. Cookies für Statistik, Marketing oder Komfortfunktionen. Diese setzen wir nur ein, wenn Du zuvor eingewilligt hast.</p>
            <p className="font-medium text-gray-800">Rechtsgrundlage:</p>
            <List items={["Art. 6 Abs. 1 lit. a DSGVO", "§ 25 Abs. 1 TTDSG"]} />
            <p>Du kannst Deine Einwilligung jederzeit über die Einstellungen des Cookie-Banners bzw. Deines Browsers widerrufen.</p>
          </SubSection>
        </Section>

        {/* 7. Datenverarbeitung durch Nutzereingabe */}
        <Section number="7." title="Datenverarbeitung durch Nutzereingabe">
          <SubSection number="7.1" title="Merchandise / Bestellungen">
            <p>Sofern wir über unsere Website Merchandise oder vergleichbare Leistungen anbieten, verarbeiten wir zur Abwicklung:</p>
            <List items={["Name", "Anschrift", "E-Mail-Adresse", "ggf. Telefonnummer", "Zahlungsdaten / Kontodaten", "Bestelldaten"]} />
            <p><span className="font-medium text-gray-800">Zweck:</span> Durchführung und Abwicklung von Bestellungen und ggf. Kundenkommunikation.</p>
            <p><span className="font-medium text-gray-800">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. b DSGVO.</p>
            <p><span className="font-medium text-gray-800">Speicherdauer:</span> Bis der Zweck entfällt und keine gesetzlichen Aufbewahrungspflichten (z.B. handels- und steuerrechtlich) mehr bestehen.</p>
          </SubSection>

          <SubSection number="7.2" title="Kontaktaufnahme (E-Mail / Telefon / Formular)">
            <p>Wenn Du mit uns Kontakt aufnimmst, verarbeiten wir die von Dir übermittelten Daten (z.B. E-Mail-Adresse, Telefonnummer, Name, Inhalte der Nachricht), um Deine Anfrage zu bearbeiten.</p>
            <p className="font-medium text-gray-800">Rechtsgrundlagen:</p>
            <List items={[
              "Art. 6 Abs. 1 lit. b DSGVO (vertragsbezogene Anfragen)",
              "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Kommunikation)",
            ]} />
            <p>Daten werden gelöscht, sobald Deine Anfrage abschließend beantwortet ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>
          </SubSection>
        </Section>

        {/* 7a. KI-gestützter Karten-Designer */}
        <Section number="7a." title="KI-gestützter Karten-Designer (Pollinations.ai)">
          <p>Auf unserer Website bieten wir einen kostenlosen Karten-Designer an, mit dem Ihr eure Hochzeitseinladung von einer KI gestalten lassen könnt. Für die Erzeugung der Hintergrundbilder nutzen wir einen externen KI-Dienst:</p>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 leading-7">
            <p className="font-semibold text-gray-900">Pollinations.ai</p>
            <p>Pollinations GmbH (Anbieter des Bildgenerierungsdienstes „Flux")</p>
            <p>Webseite: <a href="https://pollinations.ai" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 underline">pollinations.ai</a></p>
          </div>
          <p><span className="font-medium text-gray-800">Welche Daten werden übertragen?</span><br />
            Wenn ihr ein KI-Design generieren lasst, übermitteln wir an Pollinations.ai ausschließlich euren gewählten Stil bzw. den Beschreibungstext (Prompt) sowie technische Verbindungsdaten (insbesondere die IP-Adresse unseres Servers). <strong>Eure E-Mail-Adresse, euer Name oder andere persönliche Daten werden nicht übertragen.</strong> Auch von euch hochgeladene Fotos werden nicht an Pollinations.ai gesendet — diese werden ausschließlich lokal in eurem Browser bzw. nach dem Speichern auf unseren Servern in der EU verarbeitet.</p>
          <p><span className="font-medium text-gray-800">Zweck:</span> Erzeugung von Bildvorschlägen für eure Hochzeitseinladung mittels KI-Bildgenerierung.</p>
          <p><span className="font-medium text-gray-800">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch aktive Nutzung des Karten-Designers) sowie Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche/vertragliche Bereitstellung der Funktion).</p>
          <p><span className="font-medium text-gray-800">Speicherdauer:</span> Die generierten Bilder werden nur so lange in eurem Browser-Entwurf bzw. nach dem Speichern in unserem System vorgehalten, wie ihr sie selbst aufbewahrt. Ihr könnt euren Entwurf und die gespeicherten Karten jederzeit löschen.</p>
          <p><span className="font-medium text-gray-800">Drittlandübermittlung:</span> Eine Übermittlung in Drittländer außerhalb der EU/EWR kann technisch nicht ausgeschlossen werden, da Pollinations.ai weltweit Rechenkapazitäten nutzt. Wir empfehlen, in eurem Prompt keine personenbezogenen Daten einzutragen.</p>
          <p><span className="font-medium text-gray-800">Hinweis zur KI:</span> Die erzeugten Bilder sind Ergebnis eines automatisierten Bildgenerierungsverfahrens (Generative KI). Es findet keine Profilbildung und keine ausschließlich automatisierte Entscheidung im Sinne von Art. 22 DSGVO statt. Die endgültige Auswahl und Verwendung der Karte trefft ihr immer selbst.</p>
        </Section>

        {/* 8. Social Media */}
        <Section number="8." title="Social Media & Einbindungen von Drittanbietern">
          <SubSection number="8.1" title="Instagram (Profil & Einbindung)">
            <p>Wir nutzen Instagram, um Inhalte und Angebote von NIWE Events zu präsentieren. Anbieter ist:</p>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 leading-7">
              <p className="font-semibold text-gray-900">Meta Platforms Ireland Limited</p>
              <p>4 Grand Canal Square</p>
              <p>Grand Canal Harbour</p>
              <p>Dublin 2, Irland</p>
            </div>
            <p>Beim Besuch unseres Instagram-Profils oder bei Interaktionen (Likes, Kommentare, Nachrichten) verarbeitet Meta personenbezogene Daten nach eigener Verantwortung. Wir erhalten von Meta ggf. anonymisierte Statistiken (Insights), aber keine direkten personenbezogenen Nutzungsprofile.</p>
            <p>Wenn auf unserer Website Instagram-Inhalte (z.B. Buttons, Feeds) eingebunden sind und Du diese aktivierst, kann eine direkte Verbindung zu den Servern von Meta hergestellt und Deine IP-Adresse sowie ggf. weitere Daten übertragen werden. Bist Du bei Instagram eingeloggt, kann Meta den Besuch Deinem Profil zuordnen.</p>
            <p><span className="font-medium text-gray-800">Rechtsgrundlage für die Einbindung (sofern Cookies / Tracking):</span><br />Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TTDSG (Einwilligung über Cookie-/Consent-Tool).</p>
            <p><span className="font-medium text-gray-800">Rechtsgrundlage für unsere Nutzung von Insights / Interaktionen:</span><br />Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Außendarstellung und Kommunikation).</p>
            <p>Zwischen uns und Meta kann im Rahmen bestimmter Funktionen eine gemeinsame Verantwortlichkeit gemäß Art. 26 DSGVO bestehen (siehe Informationen bei Meta).</p>
            <p>Weitere Infos zum Datenschutz bei Instagram/Meta findest Du in der dortigen Datenschutzerklärung.</p>
          </SubSection>
        </Section>

        {/* 9. Zahlungsdienste */}
        <Section number="9." title="Zahlungsdienste">
          <p>Wenn Du kostenpflichtige Leistungen in Anspruch nimmst, können folgende Zahlungsdienstleister eingebunden sein (abhängig vom konkreten Angebot auf unserer Website):</p>

          <SubSection number="9.1" title="PayPal">
            <p><span className="font-medium text-gray-800">Anbieter:</span> PayPal (Europe) S.à r.l. et Cie, S.C.A., 22-24 Boulevard Royal, L-2449 Luxembourg.</p>
            <p><span className="font-medium text-gray-800">Zweck:</span> Zahlungsabwicklung.</p>
            <p><span className="font-medium text-gray-800">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. b DSGVO (Vertrag), Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherer Zahlung).</p>
            <p>Es gelten ergänzend die Datenschutzbestimmungen von PayPal.</p>
          </SubSection>

          <SubSection number="9.2" title="Apple Pay">
            <p><span className="font-medium text-gray-800">Anbieter:</span> Apple Inc., One Apple Park Way, Cupertino, CA 95014, USA.</p>
            <p><span className="font-medium text-gray-800">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. b DSGVO, Art. 6 Abs. 1 lit. f DSGVO.</p>
            <p>Es gelten ergänzend die Datenschutzbestimmungen von Apple.</p>
          </SubSection>

          <SubSection number="9.3" title="Google Pay">
            <p><span className="font-medium text-gray-800">Anbieter:</span> Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.</p>
            <p><span className="font-medium text-gray-800">Rechtsgrundlage:</span> Art. 6 Abs. 1 lit. b DSGVO, Art. 6 Abs. 1 lit. f DSGVO.</p>
            <p>Es gelten ergänzend die Datenschutzbestimmungen von Google.</p>
          </SubSection>

          <p>Die Zahlungsdienstleister verarbeiten die Zahlungsdaten eigenverantwortlich. Bitte beachte deren Datenschutzerklärungen.</p>
        </Section>

        {/* 10. CRM */}
        <Section number="10." title="CRM / Kommunikation & Organisation">
          <p>Soweit wir Systeme zur Verwaltung von Kundenanfragen, Kontakten oder Buchungen einsetzen (z.B. E-Mail-Systeme oder Tools unseres Hostinganbieters bzw. vergleichbare Dienste), werden die dort gespeicherten personenbezogenen Daten ausschließlich zum Zweck der Kommunikation, Vertragsdurchführung und Organisation verwendet.</p>
          <p className="font-medium text-gray-800">Rechtsgrundlagen:</p>
          <List items={[
            "Art. 6 Abs. 1 lit. b DSGVO",
            "Art. 6 Abs. 1 lit. f DSGVO (effiziente und geordnete Bearbeitung von Anfragen und Kundenbeziehungen)",
          ]} />
        </Section>

        {/* 11. Deine Rechte */}
        <Section number="11." title="Deine Rechte">
          <p>Du hast nach der DSGVO folgende Rechte in Bezug auf Deine personenbezogenen Daten:</p>
          <div className="space-y-2">
            <div className="border-l-2 border-amber-200 pl-3">
              <p className="font-medium text-gray-800">Auskunft (Art. 15 DSGVO)</p>
              <p className="text-gray-600 text-sm">Ob und welche Daten wir von Dir verarbeiten.</p>
            </div>
            <div className="border-l-2 border-amber-200 pl-3">
              <p className="font-medium text-gray-800">Berichtigung (Art. 16 DSGVO)</p>
              <p className="text-gray-600 text-sm">Berichtigung unrichtiger oder Vervollständigung unvollständiger Daten.</p>
            </div>
            <div className="border-l-2 border-amber-200 pl-3">
              <p className="font-medium text-gray-800">Löschung (Art. 17 DSGVO)</p>
              <p className="text-gray-600 text-sm">Löschung Deiner Daten, sofern die Voraussetzungen erfüllt sind („Recht auf Vergessenwerden").</p>
            </div>
            <div className="border-l-2 border-amber-200 pl-3">
              <p className="font-medium text-gray-800">Einschränkung der Verarbeitung (Art. 18 DSGVO)</p>
            </div>
            <div className="border-l-2 border-amber-200 pl-3">
              <p className="font-medium text-gray-800">Datenübertragbarkeit (Art. 20 DSGVO)</p>
              <p className="text-gray-600 text-sm">Erhalt der von Dir bereitgestellten Daten in einem strukturierten, gängigen Format.</p>
            </div>
            <div className="border-l-2 border-amber-200 pl-3">
              <p className="font-medium text-gray-800">Widerspruch (Art. 21 DSGVO)</p>
              <p className="text-gray-600 text-sm">Gegen Verarbeitungen auf Basis von Art. 6 Abs. 1 lit. e oder f DSGVO, insbesondere gegen Direktwerbung.</p>
            </div>
            <div className="border-l-2 border-amber-200 pl-3">
              <p className="font-medium text-gray-800">Keine ausschließlich automatisierte Entscheidung (Art. 22 DSGVO)</p>
            </div>
          </div>
          <p>Du kannst erteilte Einwilligungen jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO).</p>
          <p>Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt.</p>
          <p>Zur Ausübung Deiner Rechte genügt eine formlose Mitteilung an die unter Ziffer 2 genannten Kontaktdaten.</p>
        </Section>

        {/* 12. Beschwerderecht */}
        <Section number="12." title="Beschwerderecht">
          <p>Wenn Du der Ansicht bist, dass die Verarbeitung Deiner personenbezogenen Daten gegen die DSGVO verstößt, hast Du das Recht, Dich bei einer Datenschutzaufsichtsbehörde zu beschweren (Art. 77 DSGVO). Zuständig ist z.B. die Aufsichtsbehörde Deines gewöhnlichen Aufenthaltsorts oder unseres Unternehmenssitzes.</p>
        </Section>

        {/* 13. Änderungen */}
        <Section number="13." title="Änderungen dieser Datenschutzerklärung">
          <p>Rechtliche oder technische Entwicklungen können Anpassungen dieser Datenschutzerklärung erforderlich machen.</p>
          <p>Die jeweils aktuelle Version wird auf dieser Website veröffentlicht. Wir empfehlen Dir, die Datenschutzerklärung in regelmäßigen Abständen zu lesen.</p>
        </Section>

        <p className="text-xs text-gray-400 pt-4 border-t border-gray-200">Stand: 7. November 2025</p>
      </main>

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400 space-x-3">
        <span>NIWE Weddings · NIWE Events · info@niwe-events.com</span>
        <Link href="/impressum"><span className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">Impressum</span></Link>
        <Link href="/datenschutz"><span className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">Datenschutz</span></Link>
      </footer>
    </div>
  );
}
