import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ActionButton, AvatarFrame, Panel, SectionTitle, StatusTag } from '../components/ui';
import { parseTags, riskScore, serializeTags } from '../lib/format';
import { useAppState } from '../state/AppState';
import type { RiskLevel } from '../types';

const archetypes = [
  'Street Samurai',
  'Decker',
  'Mage',
  'Rigger',
  'Face',
  'Adept',
  'Technomancer',
  'Magieradept'
];
const riskLevels: RiskLevel[] = ['Initiate', 'Experienced', 'Professional', 'Legend'];

export function RunnerFormPage() {
  const navigate = useNavigate();
  const { runnerId } = useParams();
  const { currentUser, getRunnerById, createRunner, updateRunner, deleteRunner } = useAppState();
  const existing = runnerId ? getRunnerById(runnerId) : undefined;
  const isEditing = Boolean(existing);

  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [form, setForm] = useState(() => ({
    streetName: existing?.streetName ?? '',
    realName: existing?.realName ?? '',
    age: existing?.age ?? '',
    metatype: existing?.metatype ?? '',
    archetype: existing?.archetype ?? archetypes[0],
    specialties: existing ? serializeTags(existing.specialties) : '',
    riskLevel: existing?.riskLevel ?? ('Experienced' as RiskLevel),
    summary: existing?.summary ?? '',
    avatar: existing?.avatar ?? ''
  }));

  if (isEditing && (!existing || existing.ownerId !== currentUser?.id)) {
    return (
      <Panel className="detail-panel">
        <h2>DOSSIER_LOCKED</h2>
      </Panel>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    if (!form.streetName.trim() || !form.metatype.trim() || !form.summary.trim()) {
      setStatusTone('error');
      setStatus('MISSING_REQUIRED_FIELDS');
      return;
    }

    if (isEditing && !window.confirm('Apply changes to this runner dossier?')) {
      return;
    }

    const draft = {
      streetName: form.streetName.trim().toUpperCase(),
      realName: form.realName.trim(),
      age: form.age.trim(),
      metatype: form.metatype.trim(),
      archetype: form.archetype,
      specialties: parseTags(form.specialties),
      riskLevel: form.riskLevel,
      summary: form.summary.trim(),
      avatar: form.avatar
    };

    submittingRef.current = true;
    setIsSubmitting(true);

    let next = null;
    try {
      next = isEditing && existing ? await updateRunner(existing.id, draft) : await createRunner(draft);
    } catch (error) {
      setStatusTone('error');
      setStatus(error instanceof Error ? error.message : 'DOSSIER_WRITE_FAILED');
      return;
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }

    if (!next) {
      setStatusTone('error');
      setStatus('DOSSIER_WRITE_FAILED');
      return;
    }

    navigate('/runners', {
      state: { notice: isEditing ? 'DOSSIER_UPDATED' : 'DOSSIER_SAVED' }
    });
  };

  const handleDelete = async () => {
    if (!existing || !window.confirm('Delete this runner dossier?')) {
      return;
    }

    const result = await deleteRunner(existing.id);
    if (result.ok) {
      navigate('/runners', { state: { notice: 'RUNNER_PURGED' } });
    } else {
      setStatusTone('error');
      setStatus(result.message);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setForm((current) => ({ ...current, avatar: url }));
  };

  return (
    <div className="page-stack">
      <SectionTitle
        kicker={isEditing ? 'RUNNER_EDIT' : 'CREATE_DOSSIER'}
        title={
          <>
            {isEditing ? 'REFINE_RUNNER' : 'CREATE_RUNNER'}{' '}
            <span className="title-accent-pink">DOSSIER</span>
          </>
        }
        meta={
          <>
            <span className="meta-dot" />
            RISK_SCORE
            <span className="meta-separator">//</span>
            {riskScore(form.riskLevel)}%
          </>
        }
      />

      <form className="runner-form-layout" onSubmit={handleSubmit}>
        <section className="runner-form-hero">
          <div className="runner-form-poster">
            {form.avatar ? (
              <AvatarFrame src={form.avatar} alt={form.streetName || 'runner'} size="large" />
            ) : (
              <div className="runner-poster-empty">NO_IMAGE</div>
            )}
            <div className="runner-poster-copy">
              <span className="page-kicker">IDENTITY_PROTOCOL_v8.2</span>
              <h2>{isEditing ? 'PATCH_EXISTING_RUNNER' : 'CREATE_NEW_RUNNER'}</h2>
              <p>Profile picture is optional. Small square portraits work best.</p>
            </div>
          </div>

          <Panel className="auth-warning" accent="amber">
            <p className="auth-warning-label">SECURITY_WARNING</p>
            <p>Deleting a runner also removes every linked application on the board.</p>
          </Panel>
        </section>

        <section className="runner-form-main">
          <label className="field">
            <span>
              [01] RUNNER_ALIAS_
              <em className="field-hint field-hint-required">REQUIRED</em>
            </span>
            <input
              className="input-field"
              value={form.streetName}
              onChange={(event) => setForm((current) => ({ ...current, streetName: event.target.value }))}
              placeholder="E.G. NEO_GHOST"
              required
            />
          </label>

          <div className="split-fields">
            <label className="field">
              <span>
                REAL_NAME_
                <em className="field-hint field-hint-optional">OPTIONAL</em>
              </span>
              <input
                className="input-field"
                value={form.realName}
                onChange={(event) => setForm((current) => ({ ...current, realName: event.target.value }))}
                placeholder="optional"
              />
            </label>
            <label className="field">
              <span>
                AGE_
                <em className="field-hint field-hint-optional">OPTIONAL</em>
              </span>
              <input
                className="input-field"
                value={form.age}
                onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
                placeholder="29"
              />
            </label>
            <label className="field">
              <span>
                METATYPE_
                <em className="field-hint field-hint-required">REQUIRED</em>
              </span>
              <input
                className="input-field"
                value={form.metatype}
                onChange={(event) => setForm((current) => ({ ...current, metatype: event.target.value }))}
                placeholder="Elf"
                required
              />
            </label>
          </div>

          <div className="field">
            <span>
              [02] OPERATIONAL_SPECIALTY_
              <em className="field-hint field-hint-required">REQUIRED</em>
            </span>
            <div className="archetype-grid">
              {archetypes.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  className={`archetype-card ${form.archetype === entry ? 'archetype-card-active' : ''}`}
                  onClick={() => setForm((current) => ({ ...current, archetype: entry }))}
                >
                  <strong>{entry}</strong>
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>
              SPECIALTIES_
              <em className="field-hint field-hint-optional">OPTIONAL</em>
            </span>
            <input
              className="input-field"
              value={form.specialties}
              onChange={(event) => setForm((current) => ({ ...current, specialties: event.target.value }))}
              placeholder="Rigger, Ground Vehicles, Gunnery"
            />
          </label>

          <div className="field">
            <span>
              RISK_ASSESSMENT_
              <em className="field-hint field-hint-required">REQUIRED</em>
            </span>
            <div className="choice-row">
              {riskLevels.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  className={`choice-chip ${form.riskLevel === entry ? 'choice-chip-active' : ''}`}
                  onClick={() => setForm((current) => ({ ...current, riskLevel: entry }))}
                >
                  {entry.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>
              SUMMARY_
              <em className="field-hint field-hint-required">REQUIRED</em>
            </span>
            <textarea
              className="textarea-field"
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
              rows={5}
              placeholder="Short profile so Johnsons know what the runner brings to the table..."
              required
            />
          </label>

          <label className="field">
            <span>
              AVATAR_UPLOAD_
              <em className="field-hint field-hint-optional">OPTIONAL</em>
            </span>
            <input className="file-field" type="file" accept="image/*" onChange={handleAvatarUpload} />
          </label>

          <div className="tag-row">
            <StatusTag tone="mint">IMAGE_OPTIONAL</StatusTag>
            <StatusTag tone="neutral">SQUARE_PORTRAIT</StatusTag>
            <StatusTag tone="pink">SERVER_UPLOAD</StatusTag>
          </div>

          <p className={`inline-status ${statusTone !== 'idle' ? `inline-status-${statusTone}` : ''}`}>
            {status || 'SAVE_CONFIRMS_THIS_DOSSIER'}
          </p>

          <div className="form-actions">
            <ActionButton type="submit" tone="mint" disabled={isSubmitting}>
              {isSubmitting ? 'WRITING_DOSSIER...' : isEditing ? 'UPDATE_DOSSIER' : 'SAVE_DOSSIER'}
            </ActionButton>
            <ActionButton to="/runners" tone="neutral" fill={false}>
              CANCEL
            </ActionButton>
            {isEditing ? (
              <ActionButton tone="pink" fill={false} onClick={handleDelete}>
                DELETE_DOSSIER
              </ActionButton>
            ) : null}
          </div>
        </section>
      </form>
    </div>
  );
}
