import { Link } from 'react-router-dom';
import { DataMetric, Panel, SectionTitle, StatusTag } from '../components/ui';
import { formatDateTime } from '../lib/format';
import { useAppState } from '../state/AppState';

export function TerminalPage() {
  const { currentUser, state, getJobById, getRunnerById } = useAppState();

  const inbound = state.jobs.flatMap((job) => {
    if (job.ownerId !== currentUser?.id) {
      return [];
    }

    return job.applications
      .filter((application) => application.status === 'pending')
      .map((application) => ({
        type: 'PENDING_APPLICATION',
        jobId: job.id,
        runnerId: application.runnerId,
        date: application.createdAt
      }));
  });

  const outbound = state.jobs.flatMap((job) =>
    job.applications
      .filter((application) => application.applicantId === currentUser?.id)
      .map((application) => ({
        type: `APPLICATION_${application.status.toUpperCase()}`,
        jobId: job.id,
        runnerId: application.runnerId,
        date: application.createdAt
      }))
  );

  const events = [...inbound, ...outbound].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
  );

  return (
    <div className="page-stack">
      <SectionTitle
        kicker="TERMINAL_STREAM"
        title={
          <>
            SIGNAL_TRAFFIC <span className="title-accent-pink">/</span>{' '}
            <span className="title-accent-mint">BLACKWIRE</span>
          </>
        }
        meta={
          <>
            <span className="meta-dot" />
            EVENTS
            <span className="meta-separator">//</span>
            {events.length}
          </>
        }
      />

      <div className="metric-row metric-row-compact">
        <Panel className="mini-metric-panel">
          <DataMetric label="INBOUND" value={inbound.length} />
        </Panel>
        <Panel className="mini-metric-panel">
          <DataMetric label="OUTBOUND" value={outbound.length} tone="pink" />
        </Panel>
      </div>

      <Panel className="detail-panel" accent="mint">
        <div className="terminal-event-list">
          {events.map((event, index) => {
            const job = getJobById(event.jobId);
            const runner = getRunnerById(event.runnerId);

            return (
              <div key={`${event.jobId}-${event.runnerId}-${index}`} className="terminal-event-row">
                <StatusTag tone={event.type.includes('PENDING') ? 'amber' : 'mint'}>
                  {event.type}
                </StatusTag>
                <div>
                  <strong>{job?.title ?? 'UNKNOWN_JOB'}</strong>
                  <p>{runner?.streetName ?? 'UNKNOWN_RUNNER'}</p>
                </div>
                <div className="terminal-event-side">
                  <p>{formatDateTime(event.date)}</p>
                  {job ? (
                    <Link className="inline-link" to={`/jobs/${job.id}`}>
                      OPEN_RUN
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
          {events.length === 0 ? <p>NO_SIGNAL_ACTIVITY</p> : null}
        </div>
      </Panel>
    </div>
  );
}
