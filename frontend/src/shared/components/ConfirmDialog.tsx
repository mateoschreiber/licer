import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: 'danger' | 'success';
  hideCancel?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  variant = 'danger',
  hideCancel = false,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-title">
          {variant === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <h2>{title}</h2>
        </div>
        <p>{message}</p>
        <div className="modal-actions">
          {!hideCancel && <button type="button" className="button ghost" onClick={onClose}>
            Cancelar
          </button>}
          <button type="button" className={variant === 'success' ? 'button primary' : 'button danger'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
