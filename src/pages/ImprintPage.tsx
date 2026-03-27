import { Link } from 'react-router-dom';
import { BrandLockup, Panel, SectionTitle } from '../components/ui';

export function ImprintPage() {
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
                IMPRESSUM
                <br />
                <span className="title-accent-pink">PLACEHOLDER</span>
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
              <h2>VERANTWORTLICHE_STELLE</h2>
              <div className="legal-list">
                <div>
                  <span>Name</span>
                  <strong>[Name ergaenzen]</strong>
                </div>
                <div>
                  <span>Anschrift</span>
                  <strong>[Adresse ergaenzen]</strong>
                </div>
                <div>
                  <span>E-Mail</span>
                  <strong>[Kontaktadresse ergaenzen]</strong>
                </div>
                <div>
                  <span>Telefon</span>
                  <strong>[Optional ergaenzen]</strong>
                </div>
              </div>
            </Panel>

            <Panel accent="pink" className="legal-panel">
              <h2>PROJEKTSTATUS</h2>
              <p>
                BLACKWIRE befindet sich aktuell in einer geschlossenen Alpha-Friends-and-Family-Phase.
                Diese Seite dient derzeit als Platzhalter und muss vor einem oeffentlichen Launch mit
                echten Anbieterangaben ersetzt werden.
              </p>
            </Panel>

            <Panel accent="amber" className="legal-panel">
              <h2>INHALTLICHE_HINWEISE</h2>
              <p>
                Bitte hier spaeter Angaben zu Verantwortlichkeit fuer Inhalte, externen Links,
                urheberrechtlich geschuetzten Inhalten und gegebenenfalls zur Streitbeilegung
                ergaenzen.
              </p>
            </Panel>

            <Panel accent="red" className="legal-panel">
              <h2>WICHTIG</h2>
              <p>
                Dieser Text ist kein rechtsverbindliches Impressum. Vor einer oeffentlichen
                Veroeffentlichung solltest du die finalen Pflichtangaben fuer dein Land und deine
                konkrete Betriebsform pruefen.
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
