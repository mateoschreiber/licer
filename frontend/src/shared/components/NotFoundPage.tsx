import { ArrowLeft, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function NotFoundPage() {
  const { user } = useAuth();
  const destination = user?.roles.includes('PROVEEDOR')
    ? '/supplier'
    : user
      ? '/internal'
      : '/login';

  return (
    <main className="auth-screen">
      <section className="auth-panel not-found">
        <span className="empty-state-icon" aria-hidden="true">
          <SearchX size={24} />
        </span>
        <p className="error-code">404</p>
        <h1>Página no encontrada</h1>
        <p>La dirección no existe o ya no está disponible.</p>
        <Link className="button primary" to={destination}>
          <ArrowLeft size={17} /> Volver al inicio
        </Link>
      </section>
    </main>
  );
}
