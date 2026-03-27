import { useEffect, useState, type FormEvent } from 'react';
import { ActionButton, DataMetric, Panel, SectionTitle, StatusTag } from '../components/ui';
import { useAppState } from '../state/AppState';

export function AccountPage() {
  const { currentUser, state, updateProfile } = useAppState();
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    discord: currentUser?.handles.discord ?? '',
    instagram: currentUser?.handles.instagram ?? '',
    other: currentUser?.handles.other ?? '',
    notes: currentUser?.notes ?? ''
  });

  useEffect(() => {
    setForm({
      discord: currentUser?.handles.discord ?? '',
      instagram: currentUser?.handles.instagram ?? '',
      other: currentUser?.handles.other ?? '',
      notes: currentUser?.notes ?? ''
    });
  }, [currentUser]);

  if (!currentUser) {
    return null;
  }

  const ownJobs = state.jobs.filter((job) => job.ownerId === currentUser.id);
  const ownRunners = state.runners.filter((runner) => runner.ownerId === currentUser.id);
  const acceptedAsRunner = state.jobs.reduce((sum, job) => {
    return (
      sum +
      job.applications.filter(
        (application) => application.applicantId === currentUser.id && application.status === 'accepted'
      ).length
    );
  }, 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await updateProfile({
      handles: {
        discord: form.discord,
        instagram: form.instagram,
        other: form.other
      },
      notes: form.notes
    });
    setStatus(result.message);
  };

  return (
    <div className="page-stack">
      <SectionTitle
        kicker="USER_AUTH_LOCK"
        title={
          <>
            WELCOME_BACK, <span className="title-accent-mint">{currentUser.displayName}</span>
          </>
        }
        meta={
          <>
            <span className="meta-dot" />
            DISPLAY_NAME_LOCKED
          </>
        }
        actions={
          <div className="metric-row metric-row-compact">
            <Panel className="mini-metric-panel">
              <DataMetric label="RUNNERS" value={ownRunners.length} />
            </Panel>
            <Panel className="mini-metric-panel">
              <DataMetric label="JOBS" value={ownJobs.length} tone="pink" />
            </Panel>
            <Panel className="mini-metric-panel">
              <DataMetric label="ACCEPTED" value={acceptedAsRunner} tone="amber" />
            </Panel>
          </div>
        }
      />

      <div className="account-layout">
        <section className="account-main">
          <Panel className="detail-panel" accent="mint">
            <h2>ACCOUNT_LOCK</h2>
            <div className="account-identity-grid">
              <div>
                <p className="metric-label">DISPLAY_NAME</p>
                <p className="account-locked-value">{currentUser.displayName}</p>
              </div>
              <div>
                <p className="metric-label">EMAIL</p>
                <p className="account-locked-value">{currentUser.email}</p>
              </div>
            </div>
            <div className="tag-row">
              <StatusTag tone="mint">VERIFIED</StatusTag>
              <StatusTag tone="neutral">IMMUTABLE_ALIAS</StatusTag>
            </div>
          </Panel>

          <Panel className="detail-panel" accent="pink">
            <form className="form-stack" onSubmit={handleSubmit}>
              <h2>COMMUNICATION_LINKS</h2>
              <div className="split-fields">
                <label className="field">
                  <span>DISCORD_</span>
                  <input
                    className="input-field"
                    value={form.discord}
                    onChange={(event) => setForm((current) => ({ ...current, discord: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>INSTAGRAM_</span>
                  <input
                    className="input-field"
                    value={form.instagram}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, instagram: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>OTHER_</span>
                  <input
                    className="input-field"
                    value={form.other}
                    onChange={(event) => setForm((current) => ({ ...current, other: event.target.value }))}
                  />
                </label>
              </div>

              <label className="field">
                <span>VISIBLE_NOTES_</span>
                <textarea
                  className="textarea-field"
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={6}
                />
              </label>

              <p className="inline-status">{status || 'DISPLAY_NAME_CANNOT_BE_CHANGED'}</p>

              <div className="form-actions">
                <ActionButton type="submit" tone="mint">
                  UPDATE_CREDENTIALS
                </ActionButton>
                <ActionButton to={`/profiles/${currentUser.id}`} tone="neutral" fill={false}>
                  PUBLIC_PROFILE
                </ActionButton>
              </div>
            </form>
          </Panel>
        </section>

        <aside className="account-side">
          <Panel className="side-brief-panel" accent="pink">
            <h2>ACTIVE_RUNS</h2>
            <div className="simple-list">
              {ownJobs.slice(0, 3).map((job) => (
                <div key={job.id}>
                  <span>{job.title}</span>
                  <strong>{job.threatLevel}</strong>
                </div>
              ))}
              {ownJobs.length === 0 ? <p>NO_POSTED_JOBS</p> : null}
            </div>
          </Panel>

          <Panel className="side-brief-panel" accent="amber">
            <h2>RUNNER_LOGS</h2>
            <div className="simple-list">
              {ownRunners.slice(0, 4).map((runner) => (
                <div key={runner.id}>
                  <span>{runner.streetName}</span>
                  <strong>{runner.riskLevel}</strong>
                </div>
              ))}
              {ownRunners.length === 0 ? <p>NO_DOSSIERS</p> : null}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
