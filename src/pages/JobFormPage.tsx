import { useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ActionButton, Panel, SectionTitle, StatusTag } from '../components/ui';
import { fromInputDateTime, parseTags, serializeTags, toInputDateTime } from '../lib/format';
import { useAppState } from '../state/AppState';
import type { ThreatLevel } from '../types';

const threatOptions: ThreatLevel[] = ['Low', 'Moderate', 'High', 'Lethal'];

export function JobFormPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { currentUser, getJobById, createJob, updateJob, deleteJob } = useAppState();
  const existing = jobId ? getJobById(jobId) : undefined;
  const isEditing = Boolean(existing);

  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [form, setForm] = useState(() => ({
    title: existing?.title ?? '',
    description: existing?.description ?? '',
    payout: existing ? String(existing.payout) : '15000',
    threatLevel: existing?.threatLevel ?? ('Moderate' as ThreatLevel),
    scheduledAt: existing ? toInputDateTime(existing.scheduledAt) : '',
    site: existing?.site ?? '',
    playerSlots: existing ? String(existing.playerSlots) : '4',
    notes: existing?.notes ?? '',
    requirements: existing ? serializeTags(existing.requirements) : '',
    status: existing?.status ?? ('open' as 'open' | 'closed')
  }));

  if (isEditing && (!existing || existing.ownerId !== currentUser?.id)) {
    return (
      <Panel className="detail-panel">
        <h2>MISSION_LOCKED</h2>
      </Panel>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    if (!form.title.trim() || !form.description.trim() || !form.scheduledAt || !form.site.trim()) {
      setStatus('MISSING_REQUIRED_FIELDS');
      return;
    }

    if (isEditing && !window.confirm('Apply changes to this mission?')) {
      return;
    }

    const draft = {
      title: form.title.trim().toUpperCase(),
      description: form.description.trim(),
      payout: Number(form.payout) || 0,
      threatLevel: form.threatLevel,
      scheduledAt: fromInputDateTime(form.scheduledAt),
      scheduledTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      site: form.site.trim(),
      playerSlots: Math.max(Number(form.playerSlots) || 1, 1),
      notes: form.notes.trim(),
      requirements: parseTags(form.requirements),
      status: form.status
    };

    submittingRef.current = true;
    setIsSubmitting(true);

    let next = null;
    try {
      next = isEditing && existing ? await updateJob(existing.id, draft) : await createJob(draft);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'MISSION_WRITE_FAILED');
      return;
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }

    if (!next) {
      setStatus('MISSION_WRITE_FAILED');
      return;
    }

    navigate(`/jobs/${next.id}`);
  };

  const handleDelete = async () => {
    if (!existing || !window.confirm('Delete this mission?')) {
      return;
    }

    const result = await deleteJob(existing.id);
    if (result.ok) {
      navigate('/jobs');
    } else {
      setStatus(result.message);
    }
  };

  return (
    <div className="page-stack">
      <SectionTitle
        kicker={isEditing ? 'MISSION_EDIT' : 'DEPLOY_MISSION'}
        title={
          <>
            {isEditing ? 'EDIT_MISSION' : 'DEPLOY_MISSION'}{' '}
            <span className="title-accent-pink">BLACKWIRE</span>
          </>
        }
        meta={
          <>
            <span className="meta-dot" />
            STATUS: {form.status.toUpperCase()}
          </>
        }
      />

      <form className="mission-form-layout" onSubmit={handleSubmit}>
        <section className="mission-form-main">
          <Panel className="mission-title-panel" accent="mint">
            <label className="field">
              <span>MISSION_TITLE_</span>
              <input
                className="input-field input-large"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="E.G. DATA_EXTRACTION_CORP_X"
              />
            </label>
          </Panel>

          <Panel className="mission-description-panel" accent="pink">
            <label className="field">
              <span>OBJECTIVE_PARAMETERS_</span>
              <textarea
                className="textarea-field textarea-large"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Describe the target, route, session plan and expected obstacles..."
                rows={10}
              />
            </label>
          </Panel>

          <div className="split-panels">
            <Panel className="detail-panel" accent="amber">
              <label className="field">
                <span>LOCATION_</span>
                <input
                  className="input-field"
                  value={form.site}
                  onChange={(event) => setForm((current) => ({ ...current, site: event.target.value }))}
                  placeholder="Seattle Pyramid"
                />
              </label>

              <label className="field">
                <span>REQUIREMENTS_</span>
                <input
                  className="input-field"
                  value={form.requirements}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, requirements: event.target.value }))
                  }
                  placeholder="Decking, Stealth, SR6"
                />
              </label>

              <label className="field">
                <span>NOTES_</span>
                <textarea
                  className="textarea-field"
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={5}
                  placeholder="House rules, expected runtime, prerequisites..."
                />
              </label>
            </Panel>

            <Panel className="detail-panel">
              <div className="field">
                <span>MISSION_STATUS_</span>
                <div className="choice-row">
                  {(['open', 'closed'] as const).map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className={`choice-chip ${form.status === entry ? 'choice-chip-active' : ''}`}
                      onClick={() => setForm((current) => ({ ...current, status: entry }))}
                    >
                      {entry.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <span>THREAT_LEVEL_</span>
                <div className="choice-row">
                  {threatOptions.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className={`choice-chip ${form.threatLevel === entry ? 'choice-chip-active' : ''}`}
                      onClick={() => setForm((current) => ({ ...current, threatLevel: entry }))}
                    >
                      {entry.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="split-fields">
                <label className="field">
                  <span>PAYOUT_</span>
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    value={form.payout}
                    onChange={(event) => setForm((current) => ({ ...current, payout: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>SLOTS_</span>
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    max="12"
                    value={form.playerSlots}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, playerSlots: event.target.value }))
                    }
                  />
                </label>
              </div>

              <label className="field">
                <span>DATE_AND_TIME_</span>
                <input
                  className="input-field"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, scheduledAt: event.target.value }))
                  }
                />
              </label>

              <div className="tag-row">
                <StatusTag tone="mint">RESPONSIVE_READY</StatusTag>
                <StatusTag tone="neutral">PWA_NODE</StatusTag>
                <StatusTag tone="pink">SOFT_RP</StatusTag>
              </div>
            </Panel>
          </div>
        </section>

        <aside className="mission-form-side">
          <Panel className="side-console-panel" accent="amber">
            <p>{`> INITIALIZING_UPLINK...`}</p>
            <p>{`> ENCRYPTING_MISSION_DATA...`}</p>
            <p>{`> GENERATING_SMART_CONTRACT...`}</p>
            <p>{`> AWAITING_FINAL_COMMAND_`}</p>
          </Panel>

          <p className="inline-status">{status || 'SAVE_LOCKS_THE_CURRENT_PAYLOAD'}</p>

          <ActionButton type="submit" tone="mint" disabled={isSubmitting}>
            {isSubmitting ? 'WRITING_MISSION...' : isEditing ? 'UPDATE_MISSION' : 'DEPLOY_MISSION'}
          </ActionButton>
          <ActionButton to={existing ? `/jobs/${existing.id}` : '/jobs'} tone="neutral" fill={false}>
            CANCEL
          </ActionButton>
          {isEditing ? (
            <ActionButton tone="pink" fill={false} onClick={handleDelete}>
              DELETE_MISSION
            </ActionButton>
          ) : null}
        </aside>
      </form>
    </div>
  );
}
