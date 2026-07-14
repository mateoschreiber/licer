import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, LogOut, LucideIcon, Menu, X } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { UserSession } from '../types';

export interface ShellNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

interface ApplicationShellProps {
  workspace: string;
  items: ShellNavItem[];
  user: UserSession | null;
  onLogout: () => Promise<void>;
  tone?: 'internal' | 'supplier';
}

export function ApplicationShell({
  workspace,
  items,
  user,
  onLogout,
  tone = 'supplier',
}: ApplicationShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const displayName = [user?.name, user?.lastName].filter(Boolean).join(' ');
  const initials = displayName
    ? displayName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'US';

  return (
    <div
      className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${drawerOpen ? 'drawer-open' : ''}`}
    >
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <header className="mobile-header">
        <button
          className="icon-button"
          type="button"
          aria-label="Abrir navegación"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={20} />
        </button>
        <div className="mobile-brand">
          <span className="brand-mark">LI</span>
          <strong>LICI</strong>
        </div>
        <span className="avatar" aria-hidden="true">
          {initials}
        </span>
      </header>

      <button
        className="drawer-backdrop"
        type="button"
        aria-label="Cerrar navegación"
        onClick={() => setDrawerOpen(false)}
      />

      <aside className={`sidebar ${tone}`} aria-label="Navegación principal">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="brand-mark">LI</span>
            <div className="sidebar-brand-copy">
              <strong>LICI</strong>
              <span>{workspace}</span>
            </div>
          </div>
          <button
            className="icon-button sidebar-close-mobile"
            type="button"
            aria-label="Cerrar navegación"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={18} />
          </button>
          <button
            className="icon-button sidebar-collapse"
            type="button"
            aria-label={collapsed ? 'Expandir navegación' : 'Contraer navegación'}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {items.map(({ icon: Icon, ...item }) => (
            <NavLink key={item.to} to={item.to} end={item.end} title={item.label}>
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="avatar" aria-hidden="true">
              {initials}
            </span>
            <div>
              <strong>{displayName || 'Usuario'}</strong>
              <span>{user?.roles[0]?.replaceAll('_', ' ') ?? workspace}</span>
            </div>
          </div>
          <button className="nav-button" type="button" onClick={() => void onLogout()}>
            <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      <main className="content" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
