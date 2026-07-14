import { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
}

export function AuthLayout({ title, description, children, wide = false }: AuthLayoutProps) {
  return (
    <main className="auth-screen">
      <div className={`auth-layout${wide ? ' auth-layout-wide' : ''}`}>
        <aside className="auth-intro" aria-label="Portal de Licitaciones">
          <div className="auth-brand">
            <span className="brand-mark" aria-hidden="true">
              LI
            </span>
            <div>
              <strong>LICI</strong>
              <span>Portal de Licitaciones</span>
            </div>
          </div>
          <div className="auth-intro-copy">
            <span className="auth-eyebrow">Gestión de compras</span>
            <h1>Procesos claros para empresas y proveedores.</h1>
            <p>Centralice licitaciones, consultas, ofertas y decisiones en un entorno seguro.</p>
          </div>
          <p className="auth-intro-foot">Acceso protegido · Información trazable</p>
        </aside>

        <section className="auth-panel">
          <header className="auth-panel-header">
            <span className="auth-eyebrow">Portal de Licitaciones</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
