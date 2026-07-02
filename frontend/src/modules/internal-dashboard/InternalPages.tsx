import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, FilePlus, X } from 'lucide-react';
import { api } from '../../shared/api/client';
import { BidSummary, TenderSummary } from '../../shared/types';
import { DataTable } from '../../shared/components/DataTable';
import { EvaluationMatrix } from '../../shared/components/EvaluationMatrix';
import { PageHeader } from '../../shared/components/PageHeader';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { Timeline } from '../../shared/components/Timeline';

type Row = Record<string, unknown>;

export function DashboardPage() {
  const { data: tenders = [] } = useQuery({
    queryKey: ['internal-tenders'],
    queryFn: () => api.get<TenderSummary[]>('/tenders'),
  });
  const { data: bids = [] } = useQuery({
    queryKey: ['internal-bids'],
    queryFn: () => api.get<BidSummary[]>('/bids'),
  });

  return (
    <>
      <PageHeader title="Dashboard" description="Vista operativa de procesos activos." />
      <section className="metric-grid">
        <div className="metric"><span>Licitaciones</span><strong>{tenders.length}</strong></div>
        <div className="metric"><span>Ofertas internas</span><strong>{bids.length}</strong></div>
        <div className="metric"><span>Regla critica</span><strong>Auditada</strong></div>
      </section>
    </>
  );
}

export function UsersRolesPage() {
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<Row[]>('/users'),
  });
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<Row[]>('/roles'),
  });

  return (
    <>
      <PageHeader title="Usuarios y roles" />
      <div className="split">
        <section>
          <h2>Usuarios</h2>
          <DataTable
            rows={users}
            columns={[
              { key: 'email', header: 'Email', render: (row) => String(row.email) },
              { key: 'name', header: 'Nombre', render: (row) => String(row.name) },
              { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={String(row.status)} /> },
            ]}
          />
        </section>
        <section>
          <h2>Roles</h2>
          <DataTable
            rows={roles}
            columns={[
              { key: 'name', header: 'Rol', render: (row) => String(row.name) },
              { key: 'description', header: 'Descripcion', render: (row) => String(row.description ?? '') },
            ]}
          />
        </section>
      </div>
    </>
  );
}

export function SuppliersManagementPage() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<Row[]>('/suppliers'),
  });
  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/suppliers/${id}/approve`, { reason: 'Homologacion manual' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
  const block = useMutation({
    mutationFn: (id: string) => api.post(`/suppliers/${id}/block`, { reason: 'Bloqueo manual' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });

  return (
    <>
      <PageHeader title="Gestion de proveedores" />
      <DataTable
        rows={data}
        columns={[
          { key: 'ruc', header: 'RUC', render: (row) => String(row.ruc) },
          { key: 'legalName', header: 'Razon social', render: (row) => String(row.legalName) },
          { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={String(row.status)} /> },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <div className="row-actions">
                <Link to={`/internal/suppliers/${String(row.id)}`}>Ver</Link>
                <button className="icon-button" type="button" onClick={() => approve.mutate(String(row.id))} title="Aprobar">
                  <Check size={16} />
                </button>
                <button className="icon-button danger" type="button" onClick={() => block.mutate(String(row.id))} title="Bloquear">
                  <X size={16} />
                </button>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}

export function SupplierDetailPage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader title="Detalle proveedor" description={id} />
      <section className="panel">
        <p>Detalle preparado para auditoria de documentos, estado e historial.</p>
      </section>
    </>
  );
}

export function TendersManagementPage() {
  const { data = [] } = useQuery({
    queryKey: ['tenders-management'],
    queryFn: () => api.get<TenderSummary[]>('/tenders'),
  });

  return (
    <>
      <PageHeader
        title="Gestion de licitaciones"
        actions={<Link className="button primary" to="/internal/tenders/new"><FilePlus size={18} /> Nueva</Link>}
      />
      <DataTable
        rows={data}
        columns={[
          { key: 'code', header: 'Codigo', render: (row) => row.code },
          { key: 'title', header: 'Titulo', render: (row) => row.title },
          { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'deadline', header: 'Cierre', render: (row) => new Date(row.bidDeadline).toLocaleString() },
          { key: 'action', header: '', render: (row) => <Link to={`/internal/tenders/${row.id}`}>Abrir</Link> },
        ]}
      />
    </>
  );
}

interface TenderForm {
  code: string;
  title: string;
  description: string;
  requesterArea: string;
  bidDeadline: string;
  questionDeadline: string;
}

export function TenderCreateEditPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<TenderForm>();

  async function onSubmit(values: TenderForm) {
    const tender = await api.post<TenderSummary>('/tenders', {
      ...values,
      bidDeadline: new Date(values.bidDeadline).toISOString(),
      questionDeadline: values.questionDeadline
        ? new Date(values.questionDeadline).toISOString()
        : undefined,
    });
    navigate(`/internal/tenders/${tender.id}`);
  }

  return (
    <>
      <PageHeader title="Crear licitacion" />
      <section className="panel">
        <form className="grid-form" onSubmit={handleSubmit(onSubmit)}>
          <label>Codigo<input {...register('code', { required: true })} /></label>
          <label>Titulo<input {...register('title', { required: true })} /></label>
          <label>Area solicitante<input {...register('requesterArea')} /></label>
          <label>Limite consultas<input type="datetime-local" {...register('questionDeadline')} /></label>
          <label>Limite ofertas<input type="datetime-local" {...register('bidDeadline', { required: true })} /></label>
          <label className="full">Descripcion<textarea {...register('description', { required: true })} /></label>
          <button className="button primary" type="submit" disabled={formState.isSubmitting}>Guardar</button>
        </form>
      </section>
    </>
  );
}

export function TenderDetailInternalPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['internal-tender', id],
    queryFn: () => api.get<TenderSummary & { description: string; publishedAt?: string }>(`/tenders/${id}`),
    enabled: Boolean(id),
  });
  const publish = useMutation({
    mutationFn: () => api.post(`/tenders/${id}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['internal-tender', id] }),
  });
  const close = useMutation({
    mutationFn: () => api.post(`/tenders/${id}/close`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['internal-tender', id] }),
  });

  return (
    <>
      <PageHeader
        title={data?.title ?? 'Licitacion'}
        description={data?.code}
        actions={
          <div className="row-actions">
            <button className="button primary" type="button" onClick={() => publish.mutate()}>Publicar</button>
            <button className="button ghost" type="button" onClick={() => close.mutate()}>Cerrar</button>
          </div>
        }
      />
      <section className="panel">
        {data?.status ? <StatusBadge status={data.status} /> : null}
        <p>{data?.description}</p>
        <Timeline items={[{ label: 'Publicada', date: data?.publishedAt }, { label: 'Cierre ofertas', date: data?.bidDeadline }]} />
      </section>
    </>
  );
}

export function DocumentsAddendasPage() {
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<{ tenderId: string; type: string; title: string; fileId: string }>();
  const { data = [] } = useQuery({
    queryKey: ['internal-documents'],
    queryFn: () => api.get<Row[]>('/tender-documents'),
  });
  const create = useMutation({
    mutationFn: (values: { tenderId: string; type: string; title: string; fileId: string }) => api.post('/tender-documents', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['internal-documents'] }),
  });

  return (
    <>
      <PageHeader title="Documentos y addendas" />
      <section className="panel">
        <form className="grid-form compact" onSubmit={handleSubmit((values) => create.mutate(values))}>
          <label>Licitacion ID<input {...register('tenderId', { required: true })} /></label>
          <label>Tipo<input {...register('type', { required: true })} placeholder="BASE / ADDENDA" /></label>
          <label>Titulo<input {...register('title', { required: true })} /></label>
          <label>File ID<input {...register('fileId', { required: true })} /></label>
          <button className="button primary" type="submit">Agregar</button>
        </form>
      </section>
      <DataTable rows={data} columns={[
        { key: 'title', header: 'Titulo', render: (row) => String(row.title) },
        { key: 'type', header: 'Tipo', render: (row) => String(row.type) },
        { key: 'version', header: 'Version', render: (row) => String(row.version) },
      ]} />
    </>
  );
}

export function QuestionsInboxPage() {
  const { data = [] } = useQuery({
    queryKey: ['internal-questions'],
    queryFn: () => api.get<Row[]>('/questions'),
  });

  return (
    <>
      <PageHeader title="Bandeja de consultas" />
      <DataTable rows={data} columns={[
        { key: 'tenderId', header: 'Licitacion', render: (row) => String(row.tenderId) },
        { key: 'text', header: 'Pregunta', render: (row) => String(row.text) },
        { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={String(row.status)} /> },
      ]} />
    </>
  );
}

export function BidsInboxPage() {
  const { data = [] } = useQuery({
    queryKey: ['internal-bids'],
    queryFn: () => api.get<BidSummary[]>('/bids'),
  });

  return (
    <>
      <PageHeader title="Ofertas recibidas" description="Las ofertas enviadas son visibles inmediatamente para usuarios autorizados." />
      <DataTable rows={data} columns={[
        { key: 'tenderId', header: 'Licitacion', render: (row) => row.tender?.code ?? row.tenderId },
        { key: 'supplierId', header: 'Proveedor', render: (row) => row.supplierId },
        { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'submittedAt', header: 'Enviada', render: (row) => row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '-' },
        { key: 'action', header: '', render: (row) => <Link to={`/internal/bids/${row.id}`}>Ver</Link> },
      ]} />
    </>
  );
}

export function BidDetailInternalPage() {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ['internal-bid', id],
    queryFn: () => api.get<Row>(`/bids/${id}`),
    enabled: Boolean(id),
  });

  return (
    <>
      <PageHeader title="Detalle interno de oferta" description="Esta vista genera auditoria." />
      <section className="panel">
        <dl className="detail-grid">
          <dt>ID</dt><dd>{String(data?.id ?? '-')}</dd>
          <dt>Estado</dt><dd>{data?.status ? <StatusBadge status={String(data.status)} /> : '-'}</dd>
          <dt>Total</dt><dd>{String(data?.totalAmount ?? '-')}</dd>
          <dt>Proveedor</dt><dd>{String(data?.supplierId ?? '-')}</dd>
        </dl>
      </section>
    </>
  );
}

function EvaluationPage({ title }: { title: string }) {
  const [tenderId, setTenderId] = useState('');
  const { data = [] } = useQuery({
    queryKey: ['evaluation', tenderId],
    queryFn: () => api.get<Array<{ id: string; category: string; name: string; weight: string; maxScore: string }>>(`/evaluations?tenderId=${tenderId}`),
    enabled: tenderId.length > 0,
  });

  return (
    <>
      <PageHeader title={title} />
      <section className="panel">
        <label className="inline-field">Licitacion ID<input value={tenderId} onChange={(event) => setTenderId(event.target.value)} /></label>
      </section>
      <EvaluationMatrix rows={data} />
    </>
  );
}

export function DocumentalEvaluationPage() {
  return <EvaluationPage title="Evaluacion documental" />;
}

export function TechnicalEvaluationPage() {
  return <EvaluationPage title="Evaluacion tecnica" />;
}

export function EconomicEvaluationPage() {
  return <EvaluationPage title="Evaluacion economica" />;
}

export function InternalComparisonPage() {
  const { data = [] } = useQuery({
    queryKey: ['comparison-bids'],
    queryFn: () => api.get<BidSummary[]>('/bids'),
  });

  return (
    <>
      <PageHeader title="Comparativo interno" description="No visible para proveedores." />
      <DataTable rows={data} columns={[
        { key: 'tender', header: 'Licitacion', render: (row) => row.tender?.code ?? row.tenderId },
        { key: 'supplier', header: 'Proveedor', render: (row) => row.supplierId },
        { key: 'total', header: 'Total', render: (row) => String(row.totalAmount ?? '-') },
        { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
      ]} />
    </>
  );
}

export function AwardCancelDesertPage() {
  const { register, handleSubmit, reset } = useForm<{ tenderId: string; supplierId: string; bidId?: string; amount?: number; reason: string; mode: string }>();
  const mutation = useMutation({
    mutationFn: (values: { tenderId: string; supplierId: string; bidId?: string; amount?: number; reason: string; mode: string }) => {
      if (values.mode === 'cancel') {
        return api.post('/awards/cancel', { tenderId: values.tenderId, reason: values.reason });
      }
      if (values.mode === 'desert') {
        return api.post('/awards/desert', { tenderId: values.tenderId, reason: values.reason });
      }
      return api.post('/awards', values);
    },
    onSuccess: () => reset(),
  });

  return (
    <>
      <PageHeader title="Adjudicar, cancelar o declarar desierta" />
      <section className="panel">
        <form className="grid-form" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <label>Modo<select {...register('mode')}><option value="award">Adjudicar</option><option value="cancel">Cancelar</option><option value="desert">Desierta</option></select></label>
          <label>Licitacion ID<input {...register('tenderId', { required: true })} /></label>
          <label>Proveedor ID<input {...register('supplierId')} /></label>
          <label>Oferta ID<input {...register('bidId')} /></label>
          <label>Monto<input type="number" {...register('amount', { valueAsNumber: true })} /></label>
          <label className="full">Motivo<textarea {...register('reason', { required: true })} /></label>
          <button className="button danger" type="submit">Registrar decision</button>
        </form>
      </section>
    </>
  );
}

export function ExpedientePage() {
  const [tenderId, setTenderId] = useState('');
  const { data } = useQuery({
    queryKey: ['expediente', tenderId],
    queryFn: () => api.get<Row>(`/reports/tenders/${tenderId}/expediente`),
    enabled: tenderId.length > 0,
  });

  return (
    <>
      <PageHeader title="Expediente" />
      <section className="panel">
        <label className="inline-field">Licitacion ID<input value={tenderId} onChange={(event) => setTenderId(event.target.value)} /></label>
        <pre className="json-preview">{data ? JSON.stringify(data, null, 2) : 'Ingrese una licitacion.'}</pre>
      </section>
    </>
  );
}

export function AuditLogsPage() {
  const { data = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get<Row[]>('/audit-logs'),
  });

  return (
    <>
      <PageHeader title="Auditoria" />
      <DataTable rows={data} columns={[
        { key: 'createdAt', header: 'Fecha', render: (row) => String(row.createdAt) },
        { key: 'action', header: 'Accion', render: (row) => String(row.action) },
        { key: 'entity', header: 'Entidad', render: (row) => String(row.entity) },
        { key: 'result', header: 'Resultado', render: (row) => <StatusBadge status={String(row.result)} /> },
      ]} />
    </>
  );
}
