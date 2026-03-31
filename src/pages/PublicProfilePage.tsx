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
import { acceptedSlots, formatDateTime, formatNuyen, riskScore, threatTone } from '../lib/format';
import { createPortraitDataUrl } from '../lib/portraits';
import { useAppState } from '../state/AppState';
import { useParams } from 'react-router-dom';

export function PublicProfilePage() {
  const { userId } = useParams();
  const { getUserById, state } = useAppState();
  const user = userId ? getUserById(userId) : undefined;

  if (!user) {
    return (
      <EmptyPanel
        icon="warning"
        title="DOSSIER_NOT_FOUND"
        copy="This public profile does not exist."
        action={<ActionButton to="/jobs">RETURN_TO_BOARD</ActionButton>}
      />
    );
  }

  const runners = state.runners.filter((runner) => runner.ownerId === user.id);
  const jobs = state.jobs.filter((job) => job.ownerId === user.id);
  const heroImage =
    runners[0]?.avatar ?? createPortraitDataUrl(user.displayName, '#a9ffdf', '#ff51fa', '#16161a');

  return (
    <div className="page-stack">
      <SectionTitle
        kicker="PUBLIC_DOSSIER"
        title={
          <>
            {user.displayName} <span className="title-accent-mint">_PROFILE</span>
          </>
        }
        meta={
          <>
            <span className="meta-dot" />
            RUNNERS
            <span className="meta-separator">//</span>
            {runners.length}
          </>
        }
      />

      <Panel className="public-hero" accent="pink">
        <AvatarFrame src={heroImage} alt={user.displayName} size="large" />
        <div className="public-hero-copy">
          <h2>{user.displayName}</h2>
          <p>{user.notes || 'NO_PUBLIC_NOTES'}</p>
          <div className="tag-row">
            <StatusTag tone="mint">PUBLIC_HANDLE</StatusTag>
            <StatusTag tone="neutral">JOHNSON_AND_RUNNER</StatusTag>
          </div>
        </div>
        <Panel className="public-contact-panel">
          <div className="simple-list">
            <div>
              <span>DISCORD</span>
              <strong>{user.handles.discord || 'NOT_SET'}</strong>
            </div>
            <div>
              <span>CONTACT_EMAIL</span>
              <strong>{user.handles.contactEmail || 'NOT_SET'}</strong>
            </div>
            <div>
              <span>PREFERRED_CONTACT</span>
              <strong>{user.handles.preferredContact || 'NOT_SET'}</strong>
            </div>
            <div>
              <span>AVAILABILITY</span>
              <strong>{user.handles.availability || 'NOT_SET'}</strong>
            </div>
          </div>
        </Panel>
      </Panel>

      <div className="public-layout">
        <section className="public-main">
          <Panel className="detail-panel" accent="mint">
            <div className="detail-header-row">
              <h2>RUNNER_CAPABILITIES</h2>
              <StatusTag tone="mint">{runners.length} DOSSIERS</StatusTag>
            </div>
            <div className="public-runner-list">
              {runners.map((runner) => (
                <div key={runner.id} className="public-runner-row">
                  <AvatarFrame src={runner.avatar} alt={runner.streetName} size="small" />
                  <div className="public-runner-copy">
                    <h3>{runner.streetName}</h3>
                    <p>
                      {runner.archetype} // {runner.metatype}
                    </p>
                    <div className="tag-row">
                      {runner.specialties.map((entry) => (
                        <StatusTag key={entry} tone="neutral">
                          {entry}
                        </StatusTag>
                      ))}
                    </div>
                    <div className="public-runner-risk">
                      <span>RISK_LEVEL</span>
                      <strong>{runner.riskLevel.toUpperCase()}</strong>
                    </div>
                    <ProgressBar value={riskScore(runner.riskLevel)} tone="mint" />
                  </div>
                </div>
              ))}
              {runners.length === 0 ? <p>NO_PUBLIC_RUNNERS</p> : null}
            </div>
          </Panel>

          <Panel className="detail-panel" accent="amber">
            <div className="detail-header-row">
              <h2>RECENT_POSTINGS</h2>
              <StatusTag tone="amber">{jobs.length} JOBS</StatusTag>
            </div>
            <div className="public-job-list">
              {jobs.map((job) => (
                <div key={job.id} className="public-job-row">
                  <div>
                    <p className="job-card-id">{job.id.toUpperCase()}</p>
                    <h3>{job.title}</h3>
                    <p>{formatDateTime(job.scheduledAt)}</p>
                  </div>
                  <div className="public-job-side">
                    <StatusTag tone={threatTone(job.threatLevel)}>{job.threatLevel}</StatusTag>
                    <strong>
                      ¥{formatNuyen(job.payout)} / {acceptedSlots(job)}/{job.playerSlots}
                    </strong>
                  </div>
                </div>
              ))}
              {jobs.length === 0 ? <p>NO_PUBLIC_JOBS</p> : null}
            </div>
          </Panel>
        </section>

        <aside className="public-side">
          <Panel className="side-brief-panel" accent="pink">
            <div className="metric-row">
              <DataMetric label="RUNNERS" value={runners.length} />
              <DataMetric label="JOBS" value={jobs.length} tone="pink" />
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
