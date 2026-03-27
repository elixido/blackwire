import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { ActionButton, SectionLabel } from '../components/ui';
import { BETA_MODE, useAppState } from '../state/AppState';

interface LoginLocationState {
  notice?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAppState();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const state = location.state as LoginLocationState | null;
    if (state?.notice) {
      setStatus(state.notice);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await login(identifier, password);
    setStatus(result.message);
    if (!result.ok && result.code === 'SECURITY_CODE_REQUIRED' && result.email) {
      navigate('/verify', { state: { email: result.email } });
      return;
    }
    if (result.ok) {
      navigate('/jobs');
    }
  };

  return (
    <AuthLayout
      code="HANDSHAKE_PROTOCOL_v6.1"
      title={
        <>
          ACCESS_NODE
          <br />
          <span className="title-accent-pink">LOGIN</span>
        </>
      }
      subtitle="Verified handles only. Use alias or mail address to enter the node."
      warning={
        BETA_MODE
          ? 'Beta mode active. New accounts are unlocked immediately so testers can enter without mail confirmation.'
          : 'New accounts require the mailed security code before the first login.'
      }
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <SectionLabel>[01] ACCESS_KEY_</SectionLabel>
        <label className="field">
          <span>IDENTIFIER_</span>
          <input
            className="input-field"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="EMAIL_OR_ALIAS"
            autoComplete="username"
          />
        </label>

        <label className="field">
          <span>ENCRYPTION_KEY_</span>
          <input
            className="input-field"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="PASSWORD"
            autoComplete="current-password"
          />
        </label>

        <p className="inline-status">
          {status || (BETA_MODE ? 'BETA_MODE: REGISTER_AND_ENTER_IMMEDIATELY' : 'DEMO_LOGIN: K1LL_SWITCH / blackwire')}
        </p>

        <div className="form-actions">
          <ActionButton type="submit" tone="mint">
            JACK_IN
          </ActionButton>
          <Link className="text-link" to="/register">
            CREATE_ACCOUNT
          </Link>
          {!BETA_MODE ? (
            <Link className="text-link" to="/forgot-password">
              RESET_PASSWORD
            </Link>
          ) : null}
        </div>
      </form>
    </AuthLayout>
  );
}
