import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { api } from '../../shared/api/client';
import { notify } from '../../shared/components/FeedbackHost';

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
    <main className="auth-screen">
      <section className="auth-panel">
        <h1>Recuperar password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="stack-form">
          <label>
            Email
            <input type="email" {...register('email', { required: true })} />
          </label>
          <button className="button primary" type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
        <Link to="/login">Volver al login</Link>
      </section>
    </main>
  );
}
