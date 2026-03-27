import { Link } from 'react-router-dom';
import {
  ActionButton,
  AvatarFrame,
  DataMetric,
  EmptyPanel,
  Panel,
  ProgressBar,
  SectionTitle,
  StatusTag
} from '../components/ui';
import { riskScore } from '../lib/format';
import { useAppState } from '../state/AppState';

export function RunnersPage() {
  const { state, currentUser } = useAppState();

  const ownRunners = state.runners.filter((runner) => runner.ownerId === currentUser?.id);
  const activeApplications = state.jobs.reduce((sum, job) => {
    return (
      sum +
      job.applications.filter((application) => application.applicantId === currentUser?.id).length
    );
  }, 0);

  return (
    <div className="page-stack">
      <SectionTitle
        kicker="RUNNER_REGISTRY"
        title={
          <>
            PERSONAL_DOSSIERS <span className="title-accent-mint">-</span>{' '}
            <span className="title-accent-pink">ENCRYPTED</span>
          </>
        }
        meta={
          <>
            <span className="meta-dot" />
            ACTIVE_RUNNERS
            <span className="meta-separator">//</span>
            {ownRunners.length}
          </>
        }
        actions={
          <div className="metric-row metric-row-compact">
            <Panel className="mini-metric-panel">
              <DataMetric label="DOSSIERS" value={ownRunners.length} />
            </Panel>
            <Panel className="mini-metric-panel">
              <DataMetric label="APPLICATIONS" value={activeApplications} tone="pink" />
            </Panel>
          </div>
        }
      />

      <div className="jobs-feed-actions">
        <ActionButton to="/runners/new" tone="mint">
          ADD_RUNNER
        </ActionButton>
      </div>

      {ownRunners.length === 0 ? (
        <EmptyPanel
          icon="person_add"
          title="NO_RUNNERS_ON_FILE"
          copy="Create your first dossier so you can apply to open jobs."
          action={<ActionButton to="/runners/new">CREATE_DOSSIER</ActionButton>}
        />
      ) : null}

      <div className="runner-grid">
        {ownRunners.map((runner) => {
          const applications = state.jobs.flatMap((job) =>
            job.applications.filter((application) => application.runnerId === runner.id)
          );

          return (
            <Panel key={runner.id} className="runner-card" accent="mint">
              <div className="runner-card-top">
                <AvatarFrame src={runner.avatar} alt={runner.streetName} size="medium" />
                <div className="runner-card-copy">
                  <p className="runner-archetype">{runner.archetype}</p>
                  <h3>{runner.streetName}</h3>
                  <p>{runner.metatype}</p>
                </div>
              </div>

              <div className="tag-row">
                {runner.specialties.map((entry) => (
                  <StatusTag key={entry} tone="neutral">
                    {entry}
                  </StatusTag>
                ))}
              </div>

              <div className="metric-row">
                <DataMetric label="RISK" value={runner.riskLevel} tone="pink" />
                <DataMetric label="APPS" value={applications.length} tone="amber" />
              </div>

              <ProgressBar value={riskScore(runner.riskLevel)} tone="mint" />
              <p className="runner-summary">{runner.summary}</p>

              <div className="job-card-actions">
                <ActionButton to={`/runners/${runner.id}/edit`} tone="mint">
                  EDIT_DOSSIER
                </ActionButton>
                <ActionButton to={`/profiles/${runner.ownerId}`} tone="neutral" fill={false}>
                  PUBLIC_PROFILE
                </ActionButton>
              </div>
            </Panel>
          );
        })}

        <Panel className="runner-card runner-card-empty">
          <div className="runner-empty-icon">+</div>
          <h3>RECRUIT_NEW_TALENT</h3>
          <p>Deploy another character profile.</p>
          <ActionButton to="/runners/new" tone="pink">
            ADD_RUNNER
          </ActionButton>
        </Panel>
      </div>

      <Panel className="terminal-log-panel">
        <p>[LOG_STATUS: STREAMING_ACTIVE]</p>
        <p>{`> FETCHING_RUNNER_DATA_FROM_SEGMENT_A09...`}</p>
        <p>{`> VERIFYING_LOCAL_MASKS... [OK]`}</p>
        <p>{`> READY_FOR_NEXT_DEPLOYMENT.`}</p>
      </Panel>
    </div>
  );
}
