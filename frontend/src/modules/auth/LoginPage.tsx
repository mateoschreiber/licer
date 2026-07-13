import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../shared/auth/AuthProvider';

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
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="brand-block">
          <span className="brand-mark">PL</span>
          <div>
            <h1>Portal de Licitaciones</h1>
            <p>Acceso seguro para empresa y proveedores.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="stack-form">
          <label>
            Usuario o correo
            <input type="text" autoComplete="username" {...register('email', { required: true })} />
          </label>
          <label>
            Password
            <input type="password" {...register('password', { required: true })} />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button primary" type="submit" disabled={formState.isSubmitting}>
            <LogIn size={18} />
            Ingresar
          </button>
        </form>
        <div className="auth-links">
          <Link to="/reset-password">Recuperar password</Link>
          <Link to="/supplier/register">Registrar proveedor</Link>
        </div>
      </section>
    </main>
  );
}
