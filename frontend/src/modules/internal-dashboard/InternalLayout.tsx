import {
  Building2,
  ClipboardCheck,
  FileText,
  Gavel,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthProvider';

export function InternalLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar internal">
        <div className="sidebar-brand">
          <span className="brand-mark">PL</span>
          <div>
            <strong>Empresa</strong>
            <span>{user?.name}</span>
          </div>
        </div>
        <nav>
          <NavLink to="/internal">
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/internal/users-roles">
            <ShieldCheck size={18} /> Usuarios
          </NavLink>
          <NavLink to="/internal/requesting-areas">
            <Building2 size={18} /> Areas Solicitantes
          </NavLink>
          <NavLink to="/internal/suppliers">
            <Users size={18} /> Proveedores
          </NavLink>
          <NavLink to="/internal/tenders">
            <FileText size={18} /> Licitaciones
          </NavLink>
          <NavLink to="/internal/questions">
            <HelpCircle size={18} /> Consultas
          </NavLink>
          <NavLink to="/internal/bids">
            <ClipboardCheck size={18} /> Ofertas
          </NavLink>
          <NavLink to="/internal/awards">
            <Gavel size={18} /> Decision
          </NavLink>
          <NavLink to="/internal/audit">
            <ShieldCheck size={18} /> Auditoria
          </NavLink>
        </nav>
        <button className="nav-button" type="button" onClick={() => void logout()}>
          <LogOut size={18} /> Salir
        </button>
      </aside>
      <section className="content">
        <Outlet />
      </section>
    </div>
  );
}
