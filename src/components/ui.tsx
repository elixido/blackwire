import { Link } from 'react-router-dom';
import type { PropsWithChildren, ReactNode } from 'react';

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function MaterialIcon({
  name,
  className
}: {
  name: string;
  className?: string;
}) {
  return <span className={cx('material-symbols-outlined', className)}>{name}</span>;
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cx('brand-lockup', compact && 'brand-lockup-compact')}>
      <div className="brand-copy">
        <Link to="/jobs" className="brand-wordmark">
          BLACKWIRE
        </Link>
        <p className="brand-subline">A Shadowrun Jobboard</p>
      </div>
      <img
        className="brand-mark"
        src="/shadowrun_5_schlange_150x115px.png"
        alt=""
        aria-hidden="true"
      />
    </div>
  );
}

export function Panel({
  className,
  accent,
  children
}: PropsWithChildren<{ className?: string; accent?: 'mint' | 'pink' | 'amber' | 'red' }>) {
  return <section className={cx('panel', accent && `panel-${accent}`, className)}>{children}</section>;
}

export function StatusTag({
  tone = 'mint',
  children
}: PropsWithChildren<{ tone?: 'mint' | 'pink' | 'amber' | 'red' | 'neutral' }>) {
  return <span className={cx('status-tag', `status-tag-${tone}`)}>{children}</span>;
}

export function SectionLabel({ children }: PropsWithChildren) {
  return <p className="section-label">{children}</p>;
}

export function SectionTitle({
  title,
  kicker,
  meta,
  actions
}: {
  title: ReactNode;
  kicker?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-intro">
      <div>
        {kicker ? <p className="page-kicker">{kicker}</p> : null}
        <h1 className="page-title">{title}</h1>
        {meta ? <div className="page-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function DataMetric({
  label,
  value,
  tone = 'mint'
}: {
  label: string;
  value: ReactNode;
  tone?: 'mint' | 'pink' | 'amber' | 'red';
}) {
  return (
    <div className="metric">
      <p className="metric-label">{label}</p>
      <p className={cx('metric-value', `metric-${tone}`)}>{value}</p>
    </div>
  );
}

export function ProgressBar({
  value,
  tone = 'mint'
}: {
  value: number;
  tone?: 'mint' | 'pink' | 'amber' | 'red';
}) {
  return (
    <div className="progress-track">
      <span className={cx('progress-fill', `progress-${tone}`)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function AvatarFrame({
  src,
  alt,
  size = 'medium'
}: {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
}) {
  return (
    <div className={cx('avatar-frame', `avatar-${size}`)}>
      <img src={src} alt={alt} />
    </div>
  );
}

export function ActionButton({
  to,
  children,
  tone = 'mint',
  fill = true,
  type = 'button',
  onClick,
  disabled
}: {
  to?: string;
  children: ReactNode;
  tone?: 'mint' | 'pink' | 'amber' | 'red' | 'neutral';
  fill?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const className = cx(
    'action-button',
    fill ? `action-button-${tone}` : 'action-button-outline',
    disabled && 'action-button-disabled'
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function EmptyPanel({
  icon,
  title,
  copy,
  action
}: {
  icon: string;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="empty-panel">
      <MaterialIcon name={icon} className="empty-panel-icon" />
      <h3>{title}</h3>
      <p>{copy}</p>
      {action}
    </Panel>
  );
}
