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

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadMailRelay, requestPasswordReset } = useAppState();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [relayMessages, setRelayMessages] = useState<MailMessage[]>([]);

  if (BETA_MODE) {
    return (
      <AuthLayout
        code="ALPHA_FNF_RESET_LOCK"
        title={
          <>
            PASSWORD_RESET
            <br />
            <span className="title-accent-pink">OFFLINE</span>
          </>
        }
        subtitle="Password reset is disabled during the current alpha FNF phase."
        warning="For the alpha FNF phase, contact the operator if an account needs to be reset."
      >
        <div className="form-stack">
          <p className="inline-status">ALPHA_FNF_PASSWORD_RESET_DISABLED</p>
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
    const result = await requestPasswordReset(email);
    setStatus(result.message);

    if (result.email) {
      const relay = await loadMailRelay(result.email);
      setRelayMessages(relay.mailbox);
      navigate('/reset-password', { state: { email: result.email } });
    }
  };

  return (
    <AuthLayout
      code="PASSWORD_RECOVERY_v2.0"
      title={
        <>
          RESET_NODE
          <br />
          <span className="title-accent-pink">REQUEST_CODE</span>
        </>
      }
      subtitle="Request a reset code and route it through the local relay."
      warning="For this local build, password reset mails are rendered in the relay panel on the right."
    >
      <div className="verify-layout">
        <form className="form-stack" onSubmit={handleSubmit}>
          <SectionLabel>[01] MAIL_DESTINATION_</SectionLabel>
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

          <div className="tag-row">
            <StatusTag tone="amber">RESET_CODE_FLOW</StatusTag>
            <StatusTag tone="neutral">MAIL_RELAY</StatusTag>
          </div>

          <p className="inline-status">{status || 'REQUEST_A_RESET_CODE_TO_CONTINUE'}</p>

          <div className="form-actions">
            <ActionButton type="submit" tone="mint">
              REQUEST_RESET
            </ActionButton>
            <Link className="text-link" to="/reset-password">
              ENTER_CODE
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
