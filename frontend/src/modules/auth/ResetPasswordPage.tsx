import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../shared/api/client';
import { notify } from '../../shared/components/FeedbackHost';
import { AuthLayout } from '../../shared/components/AuthLayout';

interface ResetForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export function ResetPasswordPage() {
  const { register, handleSubmit, formState } = useForm<ResetForm>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  async function onSubmit(values: ResetForm) {
    if (token) {
      if (values.password !== values.confirmPassword) {
        notify('Las contraseñas no coinciden.', { title: 'No se pudo restablecer' });
        return;
      }
      await api.post('/auth/reset-password/confirm', { token, password: values.password });
      notify('Contraseña actualizada. Ya puede iniciar sesión.', {
        title: 'Restablecimiento completado',
      });
      navigate('/login');
      return;
    }
    await api.post('/auth/reset-password/request', { email: values.email });
    notify('Si la cuenta existe, recibirá las instrucciones en su correo.', {
      title: 'Solicitud enviada',
    });
  }

  return (
    <AuthLayout
      title={token ? 'Definir nueva contraseña' : 'Recuperar contraseña'}
      description={
        token
          ? 'Elija una contraseña segura para recuperar el acceso.'
          : 'Le enviaremos instrucciones al correo asociado con su cuenta.'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="stack-form auth-form">
        {token ? (
          <>
            <label>
              Nueva contraseña
              <input
                type="password"
                autoComplete="new-password"
                {...register('password', { required: true, minLength: 8 })}
              />
            </label>
            <label>
              Confirmar contraseña
              <input
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword', { required: true })}
              />
            </label>
          </>
        ) : (
          <label>
            Correo electrónico
            <input type="email" autoComplete="email" {...register('email', { required: true })} />
          </label>
        )}
        <button
          className="button primary auth-submit"
          type="submit"
          disabled={formState.isSubmitting}
        >
          {formState.isSubmitting
            ? 'Enviando...'
            : token
              ? 'Actualizar contraseña'
              : 'Enviar solicitud'}
        </button>
      </form>
      <div className="auth-links auth-links-single">
        <Link to="/login">Volver al inicio de sesión</Link>
      </div>
    </AuthLayout>
  );
}
