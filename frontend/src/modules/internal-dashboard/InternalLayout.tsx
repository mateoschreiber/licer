import {
  Archive,
  Building2,
  ClipboardCheck,
  FileCheck2,
  FileStack,
  FileText,
  Gavel,
  HelpCircle,
  LayoutDashboard,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { ApplicationShell, ShellNavGroup } from '../../shared/components/ApplicationShell';
import { useAuth } from '../../shared/auth/AuthProvider';

const groups: ShellNavGroup[] = [
  {
    label: 'General',
    items: [{ label: 'Resumen', to: '/internal', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Gestión',
    items: [
      { label: 'Usuarios y roles', to: '/internal/users-roles', icon: ShieldCheck },
      { label: 'Áreas solicitantes', to: '/internal/requesting-areas', icon: Building2 },
      { label: 'Proveedores', to: '/internal/suppliers', icon: Users },
      { label: 'Licitaciones', to: '/internal/tenders', icon: FileText },
      { label: 'Documentos y adendas', to: '/internal/documents', icon: FileStack },
      { label: 'Consultas', to: '/internal/questions', icon: HelpCircle },
      { label: 'Ofertas', to: '/internal/bids', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Evaluación',
    items: [
      { label: 'Documental', to: '/internal/evaluation/documental', icon: FileCheck2 },
      { label: 'Técnica', to: '/internal/evaluation/technical', icon: SlidersHorizontal },
      { label: 'Económica', to: '/internal/evaluation/economic', icon: Scale },
      { label: 'Comparativa', to: '/internal/comparison', icon: Archive },
      { label: 'Decisión', to: '/internal/awards', icon: Gavel },
    ],
  },
  {
    label: 'Control',
    items: [
      { label: 'Expediente', to: '/internal/expediente', icon: Archive },
      { label: 'Auditoría', to: '/internal/audit', icon: ShieldCheck },
    ],
  },
];

export function InternalLayout() {
  const { logout, user } = useAuth();
  return (
    <ApplicationShell
      workspace="Administración"
      groups={groups}
      user={user}
      onLogout={logout}
      tone="internal"
    />
  );
}
