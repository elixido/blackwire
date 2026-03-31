import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ActionButton,
  AvatarFrame,
  DataMetric,
  EmptyPanel,
  Panel,
  SectionTitle,
  StatusTag
} from '../components/ui';
import {
  acceptedSlots,
  applicationLabel,
  formatDateTime,
  formatNuyen,
  openSlots,
  threatTone
} from '../lib/format';
import { useAppState } from '../state/AppState';

export function JobDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<'idle' | 'success' | 'error'>('idle');
  const {
    currentUser,
    state,
    getJobById,
    getRunnerById,
    getUserById,
    applyToJob,
    reviewApplication,
    deleteJob
  } = useAppState();
  const job = jobId ? getJobById(jobId) : undefined;

  if (!job) {
    return (
      <EmptyPanel
        icon="warning"
        title="MISSION_NOT_FOUND"
        copy="This job record no longer exists."
        action={<ActionButton to="/jobs">RETURN_TO_BOARD</ActionButton>}
      />
    );
  }

  const owner = getUserById(job.ownerId);
  const isOwner = currentUser?.id === job.ownerId;
  const accepted = acceptedSlots(job);
  const myRunners = state.runners.filter((runner) => runner.ownerId === currentUser?.id);

  useEffect(() => {
    const nextState = location.state as { notice?: string } | null;
    if (nextState?.notice) {
      setStatus(nextState.notice);
      setStatusTone('success');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this mission?')) {
      return;
    }

    const result = await deleteJob(job.id);
    if (result.ok) {
      navigate('/jobs');
      return;
    }

    setStatusTone('error');
    setStatus(result.message);
  };

  return (
    <div className="page-stack">
      <SectionTitle
        kicker={job.id.toUpperCase()}
        title={
          <>
            {job.title} <span className={`title-accent-${threatTone(job.threatLevel)}`}>_</span>
          </>
        }
        meta={
          <>
            <span className="meta-dot" />
            {job.site}
            <span className="meta-separator">//</span>
            {formatDateTime(job.scheduledAt)}
          </>
        }
        actions={
          <Panel className="detail-metric-panel">
            <DataMetric label="PAYOUT_ESTIMATE" value={`${'\u00A5'}${formatNuyen(job.payout)}`} />
          </Panel>
        }
      />

      <div className="detail-layout">
        <section className="detail-main">
          <Panel className="intel-map-panel">
            <div className="intel-grid">
              <div className="intel-target">TARGET</div>
            </div>
            <div className="intel-footer">
              <p>{job.site}</p>
              <p>{formatDateTime(job.scheduledAt)}</p>
            </div>
          </Panel>

          <Panel className="detail-panel" accent="mint">
            <div className="detail-tab-row">
              <StatusTag tone="mint">MISSION_DETAILS</StatusTag>
              <StatusTag tone="neutral">SURVEILLANCE_LOGS</StatusTag>
              <StatusTag tone="neutral">COMMS_TRAFFIC</StatusTag>
            </div>

            <div className="detail-columns">
              <div>
                <h2>OBJECTIVE_SUMMARY</h2>
                <p className="detail-copy">{job.description}</p>
                <h2>JOHNSON_NOTES</h2>
                <p className="detail-copy">{job.notes || 'NO_EXTRA_NOTES'}</p>
                {status ? (
                  <p className={`inline-status ${statusTone !== 'idle' ? `inline-status-${statusTone}` : ''}`}>
                    {status}
                  </p>
                ) : null}
              </div>

              <div>
                <h2>MISSION_REQUISITES</h2>
                <div className="tag-row">
                  {job.requirements.map((entry) => (
                    <StatusTag key={entry} tone="neutral">
                      {entry}
                    </StatusTag>
                  ))}
                </div>
                <Panel className="warning-strip" accent="red">
                  <p>SLOT_STATUS</p>
                  <strong>
                    {accepted}/{job.playerSlots} LOCKED
                  </strong>
                </Panel>
              </div>
            </div>
          </Panel>

          {isOwner ? (
            <Panel className="detail-panel" accent="pink">
              <div className="detail-header-row">
                <h2>APPLICANT_ROSTER</h2>
                <StatusTag tone="pink">{job.applications.length} TOTAL</StatusTag>
              </div>

              {job.applications.length === 0 ? (
                <EmptyPanel
                  icon="group_off"
                  title="NO_APPLICATIONS"
                  copy="No runner has applied to this mission yet."
                />
              ) : (
                <div className="application-list">
                  {job.applications.map((application) => {
                    const runner = getRunnerById(application.runnerId);
                    const user = getUserById(application.applicantId);

                    return (
                      <div key={application.id} className="application-row">
                        {runner ? (
                          <AvatarFrame src={runner.avatar} alt={runner.streetName} size="small" />
                        ) : null}
                        <div className="application-copy">
                          <h3>{runner?.streetName ?? 'UNKNOWN_RUNNER'}</h3>
                          <p>
                            <Link className="inline-link" to={`/profiles/${application.applicantId}`}>
                              {user?.displayName ?? 'UNKNOWN_HANDLE'}
                            </Link>
                          </p>
                          <StatusTag
                            tone={
                              application.status === 'accepted'
                                ? 'mint'
                                : application.status === 'rejected'
                                  ? 'red'
                                  : 'amber'
                            }
                          >
                            {applicationLabel(application.status)}
                          </StatusTag>
                        </div>
                        <div className="application-actions">
                          <ActionButton
                            tone="mint"
                            fill={application.status === 'accepted'}
                            onClick={async () => {
                              const result = await reviewApplication(job.id, application.id, 'accepted');
                              setStatusTone(result.ok ? 'success' : 'error');
                              setStatus(result.message);
                            }}
                            disabled={application.status === 'accepted' || openSlots(job) === 0}
                          >
                            ACCEPT
                          </ActionButton>
                          <ActionButton
                            tone="pink"
                            fill={application.status === 'rejected'}
                            onClick={async () => {
                              const result = await reviewApplication(job.id, application.id, 'rejected');
                              setStatusTone(result.ok ? 'success' : 'error');
                              setStatus(result.message);
                            }}
                            disabled={application.status === 'rejected'}
                          >
                            REJECT
                          </ActionButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          ) : (
            <Panel className="detail-panel" accent="mint">
              <div className="detail-header-row">
                <h2>DEPLOY_RUNNER</h2>
                <StatusTag tone={openSlots(job) > 0 ? 'mint' : 'red'}>
                  {openSlots(job) > 0 ? `${openSlots(job)} OPEN` : 'FULL'}
                </StatusTag>
              </div>

              {myRunners.length === 0 ? (
                <EmptyPanel
                  icon="person_add"
                  title="NO_RUNNER_AVAILABLE"
                  copy="Create a runner dossier before you apply."
                  action={<ActionButton to="/runners/new">CREATE_RUNNER</ActionButton>}
                />
              ) : (
                <div className="application-list">
                  {myRunners.map((runner) => {
                    const existing = job.applications.find((application) => application.runnerId === runner.id);
                    const disabled =
                      Boolean(existing) || openSlots(job) === 0 || job.status !== 'open' || isOwner;

                    return (
                      <div key={runner.id} className="application-row">
                        <AvatarFrame src={runner.avatar} alt={runner.streetName} size="small" />
                        <div className="application-copy">
                          <h3>{runner.streetName}</h3>
                          <p>{runner.archetype}</p>
                          <div className="tag-row">
                            {runner.specialties.slice(0, 3).map((entry) => (
                              <StatusTag key={entry} tone="neutral">
                                {entry}
                              </StatusTag>
                            ))}
                          </div>
                        </div>
                        <div className="application-actions">
                          <ActionButton
                            tone="mint"
                            onClick={async () => {
                              const result = await applyToJob(job.id, runner.id);
                              setStatusTone(result.ok ? 'success' : 'error');
                              setStatus(result.message);
                            }}
                            disabled={disabled}
                          >
                            {existing ? applicationLabel(existing.status) : 'APPLY'}
                          </ActionButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          )}
        </section>

        <aside className="detail-side">
          <Panel className="side-brief-panel" accent="pink">
            <h2>MISSION_PARAMETERS</h2>
            <div className="side-brief-list">
              <div>
                <span>EMPLOYER</span>
                <strong>{owner?.displayName ?? 'UNKNOWN'}</strong>
              </div>
              <div>
                <span>THREAT</span>
                <strong>{job.threatLevel}</strong>
              </div>
              <div>
                <span>STATUS</span>
                <strong>{job.status.toUpperCase()}</strong>
              </div>
            </div>
          </Panel>

          <Panel className="side-brief-panel" accent="amber">
            <h2>INTEL_BRIEF</h2>
            <div className="side-brief-list">
              <div>
                <span>DATE</span>
                <strong>{formatDateTime(job.scheduledAt)}</strong>
              </div>
              <div>
                <span>SLOTS</span>
                <strong>
                  {accepted}/{job.playerSlots}
                </strong>
              </div>
              <div>
                <span>PROFILE</span>
                <strong>
                  <Link className="inline-link" to={`/profiles/${job.ownerId}`}>
                    OPEN_DOSSIER
                  </Link>
                </strong>
              </div>
            </div>
          </Panel>

          {isOwner ? (
            <div className="detail-owner-actions">
              <ActionButton to={`/jobs/${job.id}/edit`} tone="mint">
                EDIT_RUN
              </ActionButton>
              <ActionButton tone="pink" fill={false} onClick={handleDelete}>
                DELETE_RUN
              </ActionButton>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
