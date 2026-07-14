import {
  Building2,
  ClipboardCheck,
  FileText,
  Gavel,
  HelpCircle,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { ApplicationShell, ShellNavItem } from '../../shared/components/ApplicationShell';
import { useAuth } from '../../shared/auth/AuthProvider';

const items: ShellNavItem[] = [
  { label: 'Resumen', to: '/internal', icon: LayoutDashboard, end: true },
  { label: 'Usuarios y roles', to: '/internal/users-roles', icon: ShieldCheck },
  { label: 'Áreas solicitantes', to: '/internal/requesting-areas', icon: Building2 },
  { label: 'Proveedores', to: '/internal/suppliers', icon: Users },
  { label: 'Licitaciones', to: '/internal/tenders', icon: FileText },
  { label: 'Consultas', to: '/internal/questions', icon: HelpCircle },
  { label: 'Ofertas', to: '/internal/bids', icon: ClipboardCheck },
  { label: 'Decisión', to: '/internal/awards', icon: Gavel },
  { label: 'Auditoría', to: '/internal/audit', icon: ShieldCheck },
];

export function InternalLayout() {
  const { logout, user } = useAuth();
  return (
    <ApplicationShell
      workspace="Administración"
      items={items}
      user={user}
      onLogout={logout}
      tone="internal"
    />
  );
}
