import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../shared/auth/AuthProvider';
import { AuthLayout } from '../../shared/components/AuthLayout';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmation: string;
}

export function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, watch } = useForm<ChangePasswordForm>();

  if (!user) return <Navigate to="/login" replace />;
  const destination = user.roles.includes('PROVEEDOR') ? '/supplier' : '/internal';

  async function onSubmit(values: ChangePasswordForm) {
    setError(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cambiar la contraseña.');
    }
  }

  return (
    <AuthLayout
      title="Crear nueva contraseña"
      description="Por seguridad, reemplace la clave inicial antes de continuar."
    >
      <form className="stack-form auth-form" onSubmit={handleSubmit(onSubmit)}>
        <label>
          Clave actual
          <span className="input-with-icon">
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              type="password"
              autoComplete="current-password"
              {...register('currentPassword', { required: true, minLength: 8 })}
            />
          </span>
        </label>
        <label>
          Nueva contraseña
          <span className="input-with-icon">
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              type="password"
              autoComplete="new-password"
              {...register('newPassword', { required: true, minLength: 8 })}
            />
          </span>
        </label>
        <label>
          Confirmar nueva contraseña
          <span className="input-with-icon">
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              type="password"
              autoComplete="new-password"
              {...register('confirmation', {
                required: true,
                validate: (value) =>
                  value === watch('newPassword') || 'Las contraseñas no coinciden.',
              })}
            />
          </span>
        </label>
        {formState.errors.confirmation?.message ? (
          <p className="form-error" role="alert">
            {formState.errors.confirmation.message}
          </p>
        ) : null}
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="button primary auth-submit"
          type="submit"
          disabled={formState.isSubmitting}
        >
          <Check size={18} />
          {formState.isSubmitting ? 'Guardando...' : 'Guardar nueva contraseña'}
        </button>
        <button className="button ghost" type="button" onClick={() => void logout()}>
          Cerrar sesión
        </button>
      </form>
    </AuthLayout>
  );
}
