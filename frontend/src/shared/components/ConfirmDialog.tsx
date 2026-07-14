import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

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
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div className="modal">
        <div className="modal-title">
          <span className={`modal-icon modal-icon-${variant === 'success' ? 'primary' : 'danger'}`}>
            {variant === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          </span>
          <h2 id="confirm-dialog-title">{title}</h2>
        </div>
        <p>{message}</p>
        <div className="modal-actions">
          {!hideCancel && (
            <button type="button" className="button ghost" onClick={onClose}>
              Cancelar
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            className={variant === 'success' ? 'button primary' : 'button danger'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
