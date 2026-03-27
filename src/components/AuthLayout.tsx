import type { PropsWithChildren, ReactNode } from 'react';
import { BrandLockup, Panel } from './ui';

export function AuthLayout({
  code,
  title,
  subtitle,
  warning,
  children
}: PropsWithChildren<{
  code: string;
  title: ReactNode;
  subtitle: string;
  warning: string;
}>) {
  return (
    <div className="auth-shell">
      <header className="auth-topbar">
        <BrandLockup />
        <div className="auth-status">
          <p>SYSTEM_STATUS</p>
          <strong>ALPHA_FNF_NODE</strong>
        </div>
      </header>

      <main className="auth-grid">
        <section className="auth-hero">
          <div className="auth-hero-frame">
            <span className="auth-code">{code}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <Panel accent="amber" className="auth-warning">
            <p className="auth-warning-label">SECURITY_WARNING</p>
            <p>{warning}</p>
          </Panel>
        </section>

        <Panel className="auth-form-panel">{children}</Panel>
      </main>
    </div>
  );
}
