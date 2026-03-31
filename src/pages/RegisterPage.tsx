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
    contactEmail: '',
    preferredContact: '',
    availability: '',
    notes: '',
    accepted: false
  });
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    if (!form.accepted) {
      setStatusTone('error');
      setStatus('OPERATION_TERMS_REQUIRED');
      return;
    }

    if (form.password.trim().length < 6) {
      setStatusTone('error');
      setStatus('PASSWORD_MIN_6_CHARS');
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
          contactEmail: form.contactEmail,
          preferredContact: form.preferredContact,
          availability: form.availability
        }
      });

      setStatusTone(result.ok ? 'success' : 'error');
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
      subtitle="Unique aliases are locked permanently. Public contact fields are optional and can be changed later in the account dossier."
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
              minLength={6}
              required
            />
            <p className="field-note">MINIMUM_6_CHARACTERS</p>
          </label>
        </div>

        <SectionLabel>[02] CONTACT_CHANNELS_</SectionLabel>
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
              CONTACT_EMAIL_
              <em className="field-hint field-hint-optional">OPTIONAL</em>
            </span>
            <input
              className="input-field"
              type="email"
              value={form.contactEmail}
              onChange={(event) =>
                setForm((current) => ({ ...current, contactEmail: event.target.value }))
              }
              placeholder="public-contact@example.com"
            />
            <p className="field-note">VISIBLE_ON_PUBLIC_PROFILE_IF_FILLED</p>
          </label>
          <label className="field">
            <span>
              PREFERRED_CONTACT_
              <em className="field-hint field-hint-optional">OPTIONAL</em>
            </span>
            <input
              className="input-field"
              value={form.preferredContact}
              onChange={(event) =>
                setForm((current) => ({ ...current, preferredContact: event.target.value }))
              }
              placeholder="Discord DM first"
            />
          </label>
          <label className="field">
            <span>
              AVAILABILITY_
              <em className="field-hint field-hint-optional">OPTIONAL</em>
            </span>
            <input
              className="input-field"
              value={form.availability}
              onChange={(event) =>
                setForm((current) => ({ ...current, availability: event.target.value }))
              }
              placeholder="Fri after 19:00, Sat flexible"
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

        <p className={`inline-status ${statusTone !== 'idle' ? `inline-status-${statusTone}` : ''}`}>
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
