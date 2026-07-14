import { FileText, HelpCircle, Mail, UserRound } from 'lucide-react';
import { ApplicationShell, ShellNavItem } from '../../shared/components/ApplicationShell';
import { useAuth } from '../../shared/auth/AuthProvider';

const items: ShellNavItem[] = [
  { label: 'Mi perfil', to: '/supplier/profile', icon: UserRound },
  { label: 'Mis documentos', to: '/supplier/documents', icon: FileText },
  { label: 'Licitaciones disponibles', to: '/supplier/tenders', icon: FileText },
  { label: 'Mis consultas', to: '/supplier/questions', icon: HelpCircle },
  { label: 'Comunicaciones', to: '/supplier/communications', icon: Mail },
];

export function SupplierLayout() {
  const { logout, user } = useAuth();
  return (
    <ApplicationShell
      workspace="Portal proveedor"
      items={items}
      user={user}
      onLogout={logout}
      tone="supplier"
    />
  );
}
