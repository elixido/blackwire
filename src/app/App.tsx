import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAppState } from '../state/AppState';
import { AccountPage } from '../pages/AccountPage';
import { JobDetailPage } from '../pages/JobDetailPage';
import { JobFormPage } from '../pages/JobFormPage';
import { JobsPage } from '../pages/JobsPage';
import { LoginPage } from '../pages/LoginPage';
import { PublicProfilePage } from '../pages/PublicProfilePage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { RegisterPage } from '../pages/RegisterPage';
import { RunnerFormPage } from '../pages/RunnerFormPage';
import { RunnersPage } from '../pages/RunnersPage';
import { TerminalPage } from '../pages/TerminalPage';
import { VerifyPage } from '../pages/VerifyPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ImprintPage } from '../pages/ImprintPage';
import { PrivacyPage } from '../pages/PrivacyPage';

function RootRedirect() {
  const { currentUser, isReady } = useAppState();
  if (!isReady) {
    return <div className="boot-screen">SYNCING_NODE...</div>;
  }
  return <Navigate to={currentUser ? '/jobs' : '/login'} replace />;
}

function RequireAuth() {
  const { currentUser, isReady } = useAppState();
  if (!isReady) {
    return <div className="boot-screen">SYNCING_NODE...</div>;
  }
  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicOnly() {
  const { currentUser, isReady } = useAppState();
  if (!isReady) {
    return <div className="boot-screen">SYNCING_NODE...</div>;
  }
  return currentUser ? <Navigate to="/jobs" replace /> : <Outlet />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/impressum" element={<ImprintPage />} />
        <Route path="/datenschutz" element={<PrivacyPage />} />

        <Route element={<PublicOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/new" element={<JobFormPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
            <Route path="/jobs/:jobId/edit" element={<JobFormPage />} />
            <Route path="/runners" element={<RunnersPage />} />
            <Route path="/runners/new" element={<RunnerFormPage />} />
            <Route path="/runners/:runnerId/edit" element={<RunnerFormPage />} />
            <Route path="/terminal" element={<TerminalPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/profiles/:userId" element={<PublicProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
