import { Link } from 'react-router-dom';
import { BrandLockup, Panel, SectionTitle } from '../components/ui';

export function PrivacyPage() {
  return (
    <div className="legal-shell">
      <header className="auth-topbar legal-topbar">
        <BrandLockup />
      </header>

      <main className="legal-main">
        <div className="page-stack">
          <SectionTitle
            kicker="LEGAL_NODE"
            title={
              <>
                DATENSCHUTZ
                <br />
                <span className="title-accent-mint">PLACEHOLDER</span>
              </>
            }
            meta={
              <>
                <span className="meta-dot" />
                <span>ALPHA_FNF_ONLY</span>
                <span className="meta-separator">//</span>
                <span>REPLACE_BEFORE_PUBLIC_LAUNCH</span>
              </>
            }
          />

          <div className="legal-grid">
            <Panel accent="mint" className="legal-panel">
              <h2>ERFASSTE_DATEN</h2>
              <p>
                Aktuell verarbeitet BLACKWIRE unter anderem Account-Daten, Runner-Daten,
                Job-Ausschreibungen, Bewerbungen, hochgeladene Avatare sowie technische Logdaten, die
                fuer Betrieb, Sicherheit und Moderation erforderlich sein koennen.
              </p>
            </Panel>

            <Panel accent="pink" className="legal-panel">
              <h2>ZWECK_DER_VERARBEITUNG</h2>
              <p>
                Die Daten werden verwendet, um Konten bereitzustellen, Jobs und Bewerbungen
                darzustellen, Profile oeffentlich anzeigbar zu machen und die Plattform technisch
                stabil zu betreiben.
              </p>
            </Panel>

            <Panel accent="amber" className="legal-panel">
              <h2>DRITTDIENSTE</h2>
              <p>
                Fuer den Betrieb koennen Dienste wie Hosting, Datenbank, Dateispeicher oder
                E-Mail-Versand eingesetzt werden. Vor dem oeffentlichen Launch sollten hier die
                konkret genutzten Anbieter, Speicherorte und Aufbewahrungsfristen eingetragen werden.
              </p>
            </Panel>

            <Panel accent="red" className="legal-panel">
              <h2>BETROFFENENRECHTE</h2>
              <p>
                Bitte hier spaeter die Rechte auf Auskunft, Berichtigung, Loeschung, Einschraenkung,
                Datenuebertragbarkeit, Widerruf und Beschwerde samt Kontaktweg sauber beschreiben.
              </p>
            </Panel>
          </div>

          <div className="legal-actions">
            <Link className="text-link" to="/login">
              RETURN_TO_LOGIN
            </Link>
            <Link className="text-link" to="/jobs">
              OPEN_JOBBOARD
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
