import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { ActionButton, SectionLabel } from '../components/ui';
import { BETA_MODE, useAppState } from '../state/AppState';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAppState();
  const [form, setForm] = useState({
    email: '',
    displayName: '',
    password: '',
    discord: '',
    instagram: '',
    other: '',
    notes: '',
    accepted: false
  });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    if (!form.accepted) {
      setStatus('OPERATION_TERMS_REQUIRED');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const result = await register({
        email: form.email,
        displayName: form.displayName,
        password: form.password,
        notes: form.notes,
        handles: {
          discord: form.discord,
          instagram: form.instagram,
          other: form.other
        }
      });

      setStatus(result.message);
      if (result.ok) {
        navigate('/jobs');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      code="IDENTITY_PROTOCOL_v8.2"
      title={
        <>
          CREATE_ACCOUNT
          <br />
          <span className="title-accent-pink">BLACKWIRE_ID</span>
        </>
      }
      subtitle="Unique aliases are locked permanently. Discord and one extra social handle stay visible on the public dossier."
      warning={
        BETA_MODE
          ? 'Alpha FNF mode active. Registration unlocks the account immediately. Mail confirmation comes later for the public launch.'
          : 'After registration, a security code must be confirmed before the account can log in.'
      }
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <SectionLabel>[01] RUNNER_ALIAS_</SectionLabel>
        <label className="field">
          <span>
            DISPLAY_NAME_
            <em className="field-hint field-hint-required">REQUIRED</em>
          </span>
          <input
            className="input-field"
            value={form.displayName}
            onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
            placeholder="E.G. NEO_GHOST"
            autoComplete="nickname"
            required
          />
        </label>

        <div className="split-fields">
          <label className="field">
            <span>
              MAIL_ADDRESS_
              <em className="field-hint field-hint-required">REQUIRED</em>
            </span>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@blackwire.net"
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span>
              ENCRYPTION_KEY_
              <em className="field-hint field-hint-required">REQUIRED</em>
            </span>
            <input
              className="input-field"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="PASSWORD"
              autoComplete="new-password"
              required
            />
          </label>
        </div>

        <SectionLabel>[02] SOCIAL_HANDLES_</SectionLabel>
        <div className="split-fields">
          <label className="field">
            <span>
              DISCORD_
              <em className="field-hint field-hint-optional">OPTIONAL</em>
            </span>
            <input
              className="input-field"
              value={form.discord}
              onChange={(event) => setForm((current) => ({ ...current, discord: event.target.value }))}
              placeholder="handle#0000"
            />
          </label>
          <label className="field">
            <span>
              INSTAGRAM_
              <em className="field-hint field-hint-optional">OPTIONAL</em>
            </span>
            <input
              className="input-field"
              value={form.instagram}
              onChange={(event) => setForm((current) => ({ ...current, instagram: event.target.value }))}
              placeholder="@yourhandle"
            />
          </label>
          <label className="field">
            <span>
              OTHER_
              <em className="field-hint field-hint-optional">OPTIONAL</em>
            </span>
            <input
              className="input-field"
              value={form.other}
              onChange={(event) => setForm((current) => ({ ...current, other: event.target.value }))}
              placeholder="other contact"
            />
          </label>
        </div>

        <SectionLabel>[03] TABLE_NOTES_</SectionLabel>
        <label className="field">
          <span>
            VISIBLE_NOTES_
            <em className="field-hint field-hint-optional">OPTIONAL</em>
          </span>
          <textarea
            className="textarea-field"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="SR6 only, long sessions, timezone, expectations..."
            rows={4}
          />
        </label>

        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={form.accepted}
            onChange={(event) => setForm((current) => ({ ...current, accepted: event.target.checked }))}
            required
          />
          <span>
            I_ACCEPT_TERMS_OF_OPERATION
            <em className="field-hint field-hint-required">REQUIRED</em>
          </span>
        </label>

        <p className="inline-status">
          {status || (BETA_MODE ? 'ALPHA_FNF_ACCESS: ACCOUNT_UNLOCKS_IMMEDIATELY' : 'DISPLAY_NAMES_ARE_UNIQUE_AND_LOCKED')}
        </p>

        <div className="form-actions">
          <ActionButton type="submit" tone="mint" disabled={isSubmitting}>
            {isSubmitting ? 'WRITING_ACCOUNT...' : 'EXECUTE_REGISTRATION'}
          </ActionButton>
          <Link className="text-link" to="/login">
            RETURN_TO_LOGIN
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
