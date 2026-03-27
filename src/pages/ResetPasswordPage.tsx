import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { ActionButton, Panel, SectionLabel, StatusTag } from '../components/ui';
import { formatDateTime } from '../lib/format';
import { BETA_MODE, useAppState } from '../state/AppState';
import type { MailMessage } from '../types';

interface ResetLocationState {
  email?: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadMailRelay, resetPassword } = useAppState();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [relayMessages, setRelayMessages] = useState<MailMessage[]>([]);

  if (BETA_MODE) {
    return (
      <AuthLayout
        code="BETA_RESET_LOCK"
        title={
          <>
            PASSWORD_RESET
            <br />
            <span className="title-accent-pink">OFFLINE</span>
          </>
        }
        subtitle="Password reset is disabled during the current beta."
        warning="For the beta phase, contact the operator if an account needs to be reset."
      >
        <div className="form-stack">
          <p className="inline-status">BETA_PASSWORD_RESET_DISABLED</p>
          <div className="form-actions">
            <ActionButton to="/login" tone="mint">
              RETURN_TO_LOGIN
            </ActionButton>
          </div>
        </div>
      </AuthLayout>
    );
  }

  useEffect(() => {
    const routeState = location.state as ResetLocationState | null;
    if (routeState?.email) {
      setEmail(routeState.email);
    }
  }, [location.state]);

  useEffect(() => {
    if (!email.trim()) {
      setRelayMessages([]);
      return;
    }

    void (async () => {
      const relay = await loadMailRelay(email);
      setRelayMessages(relay.mailbox);
    })();
  }, [email]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await resetPassword({ email, code, password });
    setStatus(result.message);
    if (result.ok) {
      navigate('/login', { state: { notice: 'PASSWORD_RESET_CONFIRMED' } });
    }
  };

  return (
    <AuthLayout
      code="PASSWORD_RECOVERY_v2.1"
      title={
        <>
          RESET_NODE
          <br />
          <span className="title-accent-pink">NEW_KEY</span>
        </>
      }
      subtitle="Enter the reset code from the relay and lock in a fresh encryption key."
      warning="Reset codes expire quickly and invalidate older sessions once confirmed."
    >
      <div className="verify-layout">
        <form className="form-stack" onSubmit={handleSubmit}>
          <SectionLabel>[01] RESET_PAYLOAD_</SectionLabel>
          <label className="field">
            <span>EMAIL_</span>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@blackwire.net"
            />
          </label>

          <label className="field">
            <span>RESET_CODE_</span>
            <input
              className="input-field"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="000000"
              inputMode="numeric"
            />
          </label>

          <label className="field">
            <span>NEW_PASSWORD_</span>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="NEW_PASSWORD"
              autoComplete="new-password"
            />
          </label>

          <div className="tag-row">
            <StatusTag tone="amber">PASSWORD_RESET</StatusTag>
            <StatusTag tone="neutral">SESSION_INVALIDATION</StatusTag>
          </div>

          <p className="inline-status">{status || 'ENTER_THE_RESET_CODE_FROM_THE_RELAY'}</p>

          <div className="form-actions">
            <ActionButton type="submit" tone="mint">
              CONFIRM_RESET
            </ActionButton>
            <Link className="text-link" to="/forgot-password">
              REQUEST_NEW_CODE
            </Link>
            <Link className="text-link" to="/login">
              RETURN_TO_LOGIN
            </Link>
          </div>
        </form>

        <Panel className="verify-relay-panel" accent="pink">
          <h2>MAIL_RELAY</h2>
          <div className="relay-list">
            {relayMessages
              .filter((mail) => mail.type === 'password-reset')
              .slice(0, 3)
              .map((mail) => (
                <div key={mail.id} className="relay-mail">
                  <div className="relay-mail-head">
                    <StatusTag tone="amber">PASSWORD_RESET</StatusTag>
                    <span>{formatDateTime(mail.sentAt)}</span>
                  </div>
                  <p>TO: {mail.email}</p>
                  <p>SUBJECT: {mail.subject}</p>
                  <strong>CODE: {mail.code}</strong>
                </div>
              ))}
            {relayMessages.filter((mail) => mail.type === 'password-reset').length === 0 ? (
              <p>NO_RESET_MAILS_FOR_THIS_ADDRESS</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </AuthLayout>
  );
}
