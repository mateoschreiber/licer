import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, LogIn, UserRound } from 'lucide-react';
import { useAuth } from '../../shared/auth/AuthProvider';
import { AuthLayout } from '../../shared/components/AuthLayout';

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginForm>();

  async function onSubmit(values: LoginForm) {
    setError(null);
    await login(values.email, values.password)
      .then(() => {
        const session = window.localStorage.getItem('user_session');
        const user = session ? JSON.parse(session) : null;
        navigate(user?.roles?.includes('PROVEEDOR') ? '/supplier' : '/internal');
      })
      .catch(() => setError('Credenciales invalidas o usuario inactivo.'));
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      description="Ingrese sus credenciales para acceder a su espacio de trabajo."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="stack-form auth-form">
        <label>
          Usuario o correo
          <span className="input-with-icon">
            <UserRound size={18} aria-hidden="true" />
            <input type="text" autoComplete="username" {...register('email', { required: true })} />
          </span>
        </label>
        <label>
          Contraseña
          <span className="input-with-icon">
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              type="password"
              autoComplete="current-password"
              {...register('password', { required: true })}
            />
          </span>
        </label>
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
          <LogIn size={18} />
          {formState.isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <div className="auth-links">
        <Link to="/reset-password">Recuperar contraseña</Link>
        <Link to="/supplier/register">Registrar proveedor</Link>
      </div>
    </AuthLayout>
  );
}
