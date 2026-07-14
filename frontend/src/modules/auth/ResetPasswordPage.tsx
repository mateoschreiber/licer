import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { api } from '../../shared/api/client';
import { notify } from '../../shared/components/FeedbackHost';
import { AuthLayout } from '../../shared/components/AuthLayout';

interface ResetForm {
  email: string;
}

export function ResetPasswordPage() {
  const { register, handleSubmit, formState } = useForm<ResetForm>();

  async function onSubmit(values: ResetForm) {
    await api.post('/auth/reset-password/request', values);
    notify('Si la cuenta existe, recibirá las instrucciones en su correo.', {
      title: 'Solicitud enviada',
    });
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      description="Le enviaremos instrucciones al correo asociado con su cuenta."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="stack-form auth-form">
        <label>
          Correo electrónico
          <input type="email" autoComplete="email" {...register('email', { required: true })} />
        </label>
        <button
          className="button primary auth-submit"
          type="submit"
          disabled={formState.isSubmitting}
        >
          {formState.isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </form>
      <div className="auth-links auth-links-single">
        <Link to="/login">Volver al inicio de sesión</Link>
      </div>
    </AuthLayout>
  );
}
