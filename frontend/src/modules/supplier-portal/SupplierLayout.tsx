import { FileText, HelpCircle, LogOut, Send, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthProvider';

export function SupplierLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">PL</span>
          <div>
            <strong>Proveedor</strong>
            <span>{user?.name}</span>
          </div>
        </div>
        <nav>
          <NavLink to="/supplier/profile">
            <UserRound size={18} /> Perfil
          </NavLink>
          <NavLink to="/supplier/documents">
            <FileText size={18} /> Documentos
          </NavLink>
          <NavLink to="/supplier/tenders">
            <FileText size={18} /> Licitaciones
          </NavLink>
          <NavLink to="/supplier/questions">
            <HelpCircle size={18} /> Consultas
          </NavLink>
          <NavLink to="/supplier/bids/new">
            <Send size={18} /> Oferta
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
