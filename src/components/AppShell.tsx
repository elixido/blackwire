import { Link, NavLink, Outlet } from 'react-router-dom';
import { BETA_MODE, useAppState } from '../state/AppState';
import { BrandLockup, MaterialIcon, cx } from './ui';

const navigation = [
  { to: '/jobs', label: 'JOBS', icon: 'assignment' },
  { to: '/runners', label: 'RUNNERS', icon: 'group' },
  { to: '/terminal', label: 'TERMINAL', icon: 'terminal' },
  { to: '/account', label: 'ACCOUNT', icon: 'person' }
];

export function AppShell() {
  const { currentUser, logout } = useAppState();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <BrandLockup compact />
          <nav className="topbar-nav">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cx('topbar-link', isActive && 'topbar-link-active')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="topbar-right">
          {BETA_MODE ? <span className="topbar-beta-pill">ALPHA_FNF</span> : null}
          <NavLink to="/account" className="topbar-account-link">
            {currentUser?.displayName}
          </NavLink>
          <button
            className="logout-button"
            type="button"
            aria-label="logout"
            onClick={() => {
              void logout();
            }}
          >
            LOGOUT
          </button>
        </div>
      </header>

      <main className="app-content">
        <Outlet />
      </main>

      <footer className="legal-footer">
        <span className="legal-footer-label">LEGAL</span>
        <div className="legal-footer-links">
          <Link to="/impressum">IMPRESSUM</Link>
          <Link to="/datenschutz">DATENSCHUTZ</Link>
        </div>
      </footer>

      <nav className="mobile-nav">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cx('mobile-link', isActive && 'mobile-link-active')}
          >
            <MaterialIcon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
