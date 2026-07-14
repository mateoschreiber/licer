interface StatusBadgeProps {
  status: string;
}

const toneByStatus: Record<string, string> = {
  ACTIVO: 'good',
  ACTIVE: 'good',
  APROBADO: 'good',
  RESPONDIDA: 'good',
  PUBLICADA: 'good',
  ENVIADA: 'good',
  ADJUDICADA: 'good',
  PENDIENTE: 'warn',
  PENDING: 'warn',
  BORRADOR: 'neutral',
  REVISION: 'warn',
  CERRADA: 'neutral',
  CANCELADA: 'danger',
  DESIERTA: 'danger',
  BLOQUEADO: 'danger',
  BLOCKED: 'danger',
  ANULADA: 'danger',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = toneByStatus[status] ?? 'neutral';
  return <span className={`status-badge ${tone}`}>{status}</span>;
}
