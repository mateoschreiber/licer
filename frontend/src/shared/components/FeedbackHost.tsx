import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type FeedbackTone = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  title?: string;
  tone: FeedbackTone;
}

interface ConfirmationRequest {
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'danger' | 'primary';
  resolve: (result: boolean) => void;
}

const toastEvent = 'lici:toast';
const confirmationEvent = 'lici:confirm';

export function notify(message: string, options: { title?: string; tone?: FeedbackTone } = {}) {
  window.dispatchEvent(
    new CustomEvent(toastEvent, {
      detail: { message, title: options.title, tone: options.tone ?? 'success' },
    }),
  );
}

export function confirmAction(options: {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
}) {
  return new Promise<boolean>((resolve) => {
    window.dispatchEvent(
      new CustomEvent(confirmationEvent, {
        detail: {
          ...options,
          confirmLabel: options.confirmLabel ?? 'Confirmar',
          tone: options.tone ?? 'primary',
          resolve,
        },
      }),
    );
  });
}

export function FeedbackHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<Omit<ToastMessage, 'id'>>).detail;
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { ...detail, id }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4500);
    }
    function onConfirm(event: Event) {
      setConfirmation((event as CustomEvent<ConfirmationRequest>).detail);
    }
    window.addEventListener(toastEvent, onToast);
    window.addEventListener(confirmationEvent, onConfirm);
    return () => {
      window.removeEventListener(toastEvent, onToast);
      window.removeEventListener(confirmationEvent, onConfirm);
    };
  }, []);

  useEffect(() => {
    if (confirmation) confirmButtonRef.current?.focus();
  }, [confirmation]);

  function closeConfirmation(result: boolean) {
    confirmation?.resolve(result);
    setConfirmation(null);
  }

  return (
    <>
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} role="status" key={toast.id}>
            {toast.tone === 'success' ? (
              <CheckCircle2 size={19} />
            ) : toast.tone === 'error' ? (
              <AlertTriangle size={19} />
            ) : (
              <Info size={19} />
            )}
            <div>
              {toast.title ? <strong>{toast.title}</strong> : null}
              <p>{toast.message}</p>
            </div>
            <button
              className="toast-close"
              type="button"
              aria-label="Cerrar notificación"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {confirmation ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="global-confirmation-title"
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeConfirmation(false);
          }}
        >
          <section className="modal">
            <div className="modal-title">
              <span className={`modal-icon modal-icon-${confirmation.tone}`}>
                <AlertTriangle size={20} />
              </span>
              <div>
                <h2 id="global-confirmation-title">{confirmation.title}</h2>
                <p>{confirmation.message}</p>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="button ghost"
                type="button"
                onClick={() => closeConfirmation(false)}
              >
                Cancelar
              </button>
              <button
                ref={confirmButtonRef}
                className={`button ${confirmation.tone === 'danger' ? 'danger' : 'primary'}`}
                type="button"
                onClick={() => closeConfirmation(true)}
              >
                {confirmation.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
