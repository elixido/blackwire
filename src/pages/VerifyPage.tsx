import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { ActionButton, Panel, SectionLabel, StatusTag } from '../components/ui';
import { formatDateTime } from '../lib/format';
import { BETA_MODE, useAppState } from '../state/AppState';
import type { MailMessage } from '../types';

interface VerifyLocationState {
  email?: string;
}

export function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadMailRelay, verifyAccount, resendSecurityCode } = useAppState();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [relayMessages, setRelayMessages] = useState<MailMessage[]>([]);
  const [verified, setVerified] = useState(false);

  if (BETA_MODE) {
    return (
      <AuthLayout
        code="BETA_ACCESS_GATE"
        title={
          <>
            VERIFY_NODE
            <br />
            <span className="title-accent-pink">SKIPPED</span>
          </>
        }
        subtitle="Account mail verification is disabled during the current beta."
        warning="Test accounts are unlocked immediately. Return to login or create a fresh account."
      >
        <div className="form-stack">
          <p className="inline-status">BETA_MODE_SKIPS_EMAIL_VERIFICATION</p>
          <div className="form-actions">
            <ActionButton to="/login" tone="mint">
              RETURN_TO_LOGIN
            </ActionButton>
            <ActionButton to="/register" tone="neutral" fill={false}>
              CREATE_ACCOUNT
            </ActionButton>
          </div>
        </div>
      </AuthLayout>
    );
  }

  useEffect(() => {
    const routeState = location.state as VerifyLocationState | null;
    if (routeState?.email) {
      setEmail(routeState.email);
    }
  }, [location.state]);

  useEffect(() => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setRelayMessages([]);
      setVerified(false);
      return;
    }

    void (async () => {
      const relay = await loadMailRelay(normalizedEmail);
      setRelayMessages(relay.mailbox);
      setVerified(relay.verified);
    })();
  }, [email]);

  const latestMessages = useMemo(
    () =>
      [...relayMessages]
        .sort((left, right) => new Date(right.sentAt).getTime() - new Date(left.sentAt).getTime())
        .slice(0, 3),
    [relayMessages]
  );

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await verifyAccount(email, code);
    setStatus(result.message);
    if (result.ok) {
      setCode('');
      const relay = await loadMailRelay(email);
      setRelayMessages(relay.mailbox);
      setVerified(relay.verified);
    }
  };

  const handleResend = async () => {
    const result = await resendSecurityCode(email);
    setStatus(result.message);
    const relay = await loadMailRelay(email);
    setRelayMessages(relay.mailbox);
    setVerified(relay.verified);
  };

  return (
    <AuthLayout
      code="SECURITY_CODE_RELAY_v1.0"
      title={
        <>
          VERIFY_NODE
          <br />
          <span className="title-accent-pink">SECURITY_CODE</span>
        </>
      }
      subtitle="Confirm the emailed code once after registration. The account stays locked until this step is complete."
      warning="For this local build, outgoing mails are rendered in the relay panel on the right."
    >
      <div className="verify-layout">
        <form className="form-stack" onSubmit={handleVerify}>
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

          <label className="field">
            <span>SECURITY_CODE_</span>
            <input
              className="input-field"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="000000"
              inputMode="numeric"
            />
          </label>

          <div className="tag-row">
            <StatusTag tone={verified ? 'mint' : 'amber'}>{verified ? 'VERIFIED' : 'LOCKED'}</StatusTag>
            <StatusTag tone="neutral">FIRST_LOGIN_GATE</StatusTag>
          </div>

          <p className="inline-status">{status || 'ENTER_THE_CODE_FROM_THE_MAIL_RELAY'}</p>

          <div className="form-actions">
            <ActionButton type="submit" tone="mint">
              VERIFY_ACCOUNT
            </ActionButton>
            <ActionButton tone="neutral" fill={false} onClick={handleResend}>
              RESEND_CODE
            </ActionButton>
            {verified ? (
              <button
                className="text-link text-link-button"
                type="button"
                onClick={() => navigate('/login', { state: { notice: 'VERIFICATION_CONFIRMED' } })}
              >
                GO_TO_LOGIN
              </button>
            ) : (
              <Link className="text-link" to="/login">
                RETURN_TO_LOGIN
              </Link>
            )}
          </div>
        </form>

        <Panel className="verify-relay-panel" accent="pink">
          <h2>MAIL_RELAY</h2>
          <div className="relay-list">
            {latestMessages.map((mail) => (
              <div key={mail.id} className="relay-mail">
                <div className="relay-mail-head">
                  <StatusTag tone={mail.type === 'security-code' ? 'amber' : 'mint'}>
                    {mail.type === 'security-code'
                      ? 'SECURITY_CODE'
                      : mail.type === 'password-reset'
                        ? 'PASSWORD_RESET'
                        : 'WELCOME_MAIL'}
                  </StatusTag>
                  <span>{formatDateTime(mail.sentAt)}</span>
                </div>
                <p>TO: {mail.email}</p>
                <p>SUBJECT: {mail.subject}</p>
                {mail.code ? <strong>CODE: {mail.code}</strong> : <strong>{mail.body}</strong>}
              </div>
            ))}
            {latestMessages.length === 0 ? <p>NO_MAILS_FOR_THIS_ADDRESS</p> : null}
          </div>
        </Panel>
      </div>
    </AuthLayout>
  );
}
