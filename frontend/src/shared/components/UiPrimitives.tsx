import { ReactNode } from 'react';
import {
  AlertCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Inbox,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`.trim()}>{children}</section>;
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>;
}

export function MetricCard({
  label,
  value,
  detail,
  trend,
  tone = 'primary',
}: {
  label: string;
  value: ReactNode;
  detail: string;
  trend?: string;
  tone?: 'primary' | 'blue' | 'amber' | 'violet';
}) {
  return (
    <article className={`metric metric-${tone}`}>
      <div className="metric-heading">
        <span>{label}</span>
        <span className="metric-icon" aria-hidden="true">
          <BarChart3 size={17} />
        </span>
      </div>
      <strong>{value}</strong>
      <div className="metric-meta">
        <span>{detail}</span>
        {trend ? <span className="metric-trend">{trend}</span> : null}
      </div>
    </article>
  );
}

export function MiniBarChart({
  title,
  description,
  values,
}: {
  title: string;
  description: string;
  values: Array<{ label: string; value: number; tone?: 'primary' | 'blue' | 'amber' }>;
}) {
  const maximum = Math.max(1, ...values.map((item) => item.value));
  return (
    <section className="panel chart-card" aria-labelledby="activity-chart-title">
      <div className="section-heading">
        <div>
          <h2 id="activity-chart-title">{title}</h2>
          <p>{description}</p>
        </div>
        <span className="data-source">Actualización en tiempo real</span>
      </div>
      <div className="mini-chart" role="img" aria-label={`${title}. ${description}`}>
        {values.map((item) => (
          <div className="mini-chart-item" key={item.label}>
            <div className="mini-chart-track">
              <span
                className={`mini-chart-bar chart-${item.tone ?? 'primary'}`}
                style={
                  {
                    '--chart-value': `${Math.max(6, (item.value / maximum) * 100)}%`,
                  } as React.CSSProperties
                }
              />
            </div>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LoadingState({ label = 'Cargando información', rows = 4 }) {
  return (
    <section className="panel state-card" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <span className="skeleton-line" key={index} />
      ))}
    </section>
  );
}

export function EmptyState({
  title = 'Sin información disponible',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        <Inbox size={22} />
      </span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={20} aria-hidden="true" />
      <div>
        <strong>No pudimos cargar esta información</strong>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <button className="button ghost" type="button" onClick={onRetry}>
          <RefreshCw size={16} /> Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        className="icon-button"
        type="button"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={17} />
      </button>
      <span>
        Página <strong>{page}</strong> de <strong>{Math.max(1, pageCount)}</strong>
      </span>
      <button
        className="icon-button"
        type="button"
        aria-label="Página siguiente"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={17} />
      </button>
    </nav>
  );
}

export function ContextMenu({
  label = 'Más acciones',
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <details className="context-menu">
      <summary className="icon-button" aria-label={label} title={label}>
        <MoreHorizontal size={18} />
      </summary>
      <div className="context-menu-content">{children}</div>
    </details>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="tooltip" data-tooltip={label} tabIndex={0}>
      {children}
    </span>
  );
}
