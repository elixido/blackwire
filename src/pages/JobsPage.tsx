import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ActionButton,
  DataMetric,
  EmptyPanel,
  Panel,
  SectionTitle,
  StatusTag
} from '../components/ui';
import { acceptedSlots, formatDateTime, formatNuyen, threatTone } from '../lib/format';
import { useAppState } from '../state/AppState';
import type { Job, ThreatLevel } from '../types';

function sortJobs(left: Job, right: Job) {
  return new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime();
}

export function JobsPage() {
  const { state, currentUser, getUserById } = useAppState();
  const [query, setQuery] = useState('');
  const [threat, setThreat] = useState<'All' | ThreatLevel>('All');
  const [minimumPayout, setMinimumPayout] = useState('0');

  const jobs = useMemo(() => {
    const min = Number(minimumPayout) || 0;
    return [...state.jobs]
      .sort(sortJobs)
      .filter((job) => {
        const matchesThreat = threat === 'All' || job.threatLevel === threat;
        const matchesPayout = job.payout >= min;
        const haystack = [job.title, job.site, job.description, job.requirements.join(' ')]
          .join(' ')
          .toLowerCase();
        const matchesQuery = haystack.includes(query.trim().toLowerCase());
        return matchesThreat && matchesPayout && matchesQuery;
      });
  }, [minimumPayout, query, state.jobs, threat]);

  const ownJobs = state.jobs.filter((job) => job.ownerId === currentUser?.id).length;
  const ownRunners = state.runners.filter((runner) => runner.ownerId === currentUser?.id).length;
  const openApplications = state.jobs.reduce((sum, job) => {
    return (
      sum +
      job.applications.filter((application) => application.applicantId === currentUser?.id).length
    );
  }, 0);

  return (
    <div className="page-stack">
      <SectionTitle
        kicker="LIVE_SECURE_FEED"
        title={
          <>
            AVAILABLE_RUNS <span className="title-accent-mint">-</span>{' '}
            <span className="title-accent-pink">BLACKWIRE_BOARD</span>
          </>
        }
        meta={
          <>
            <span className="meta-dot" />
            JOBS_OPEN
            <span className="meta-separator">//</span>
            {jobs.length}
          </>
        }
        actions={
          <div className="metric-row metric-row-compact">
            <Panel className="mini-metric-panel">
              <DataMetric label="POSTED" value={ownJobs} />
            </Panel>
            <Panel className="mini-metric-panel">
              <DataMetric label="RUNNERS" value={ownRunners} tone="pink" />
            </Panel>
            <Panel className="mini-metric-panel">
              <DataMetric label="APPS" value={openApplications} tone="amber" />
            </Panel>
          </div>
        }
      />

      <div className="jobs-layout">
        <aside className="jobs-sidebar">
          <Panel className="filter-panel" accent="mint">
            <h2>DATA_FILTER</h2>
            <label className="field">
              <span>QUERY_</span>
              <input
                className="input-field"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="matrix, stealth, saturday..."
              />
            </label>

            <label className="field">
              <span>THREAT_VECTOR_</span>
              <select
                className="select-field"
                value={threat}
                onChange={(event) => setThreat(event.target.value as 'All' | ThreatLevel)}
              >
                <option value="All">ALL</option>
                <option value="Low">LOW</option>
                <option value="Moderate">MODERATE</option>
                <option value="High">HIGH</option>
                <option value="Lethal">LETHAL</option>
              </select>
            </label>

            <label className="field">
              <span>MIN_PAYOUT_</span>
              <input
                className="input-field"
                type="number"
                min="0"
                value={minimumPayout}
                onChange={(event) => setMinimumPayout(event.target.value)}
              />
            </label>

            <ActionButton tone="neutral" fill={false} onClick={() => {
              setQuery('');
              setThreat('All');
              setMinimumPayout('0');
            }}>
              RECALIBRATE_GRID
            </ActionButton>
          </Panel>

          <Panel className="alert-panel" accent="red">
            <p className="alert-label">ALERT</p>
            <p>Open runs lock automatically when accepted slots are filled.</p>
          </Panel>
        </aside>

        <section className="jobs-feed">
          <div className="jobs-feed-actions">
            <ActionButton to="/jobs/new" tone="mint">
              ADD_NEW_JOB
            </ActionButton>
          </div>

          {jobs.length === 0 ? (
            <EmptyPanel
              icon="search_off"
              title="NO_MATCHING_RUNS"
              copy="Adjust the board filters or deploy a new mission."
              action={<ActionButton to="/jobs/new">POST_MISSION</ActionButton>}
            />
          ) : null}

          {jobs.map((job) => {
            const owner = getUserById(job.ownerId);
            const accepted = acceptedSlots(job);
            const isOwner = currentUser?.id === job.ownerId;

            return (
              <Panel key={job.id} className="job-card" accent={threatTone(job.threatLevel)}>
                <div className="job-card-top">
                  <div>
                    <div className="job-card-kicker">
                      <StatusTag tone={threatTone(job.threatLevel)}>{job.threatLevel}</StatusTag>
                      <span className="job-card-id">{job.id.toUpperCase()}</span>
                    </div>
                    <h3>{job.title}</h3>
                    <p className="job-card-copy">{job.description}</p>
                  </div>
                  <div className="job-card-payout">
                    <span className="job-card-payout-symbol">¥</span>
                    {formatNuyen(job.payout)}
                  </div>
                </div>

                <div className="job-card-meta">
                  <p>{job.site}</p>
                  <p>{formatDateTime(job.scheduledAt)}</p>
                  <p>
                    {accepted}/{job.playerSlots} SLOTS
                  </p>
                  <p>
                    JOHNSON:{' '}
                    <Link className="inline-link" to={`/profiles/${job.ownerId}`}>
                      {owner?.displayName ?? 'UNKNOWN'}
                    </Link>
                  </p>
                </div>

                <div className="tag-row">
                  {job.requirements.map((entry) => (
                    <StatusTag key={entry} tone="neutral">
                      {entry}
                    </StatusTag>
                  ))}
                </div>

                <div className="job-card-actions">
                  <ActionButton to={`/jobs/${job.id}`} tone="mint">
                    OPEN_RUN
                  </ActionButton>
                  {isOwner ? (
                    <ActionButton to={`/jobs/${job.id}/edit`} tone="pink" fill={false}>
                      EDIT
                    </ActionButton>
                  ) : null}
                </div>
              </Panel>
            );
          })}
        </section>
      </div>
    </div>
  );
}
