import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, FilePlus, Search, X } from 'lucide-react';
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
  requestingAreaId: string;
  publishedAt: string;
  questionDeadline: string;
  bidDeadline: string;
}

function getDefaultDates() {
  const now = new Date();
  const today = toDateTimeLocal(now);
  const plus15 = toDateTimeLocal(new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000));
  const plus30 = toDateTimeLocal(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
  return { today, plus15, plus30 };
}

function toDateTimeLocal(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function TenderCreateEditPage() {
  const navigate = useNavigate();
  const defaults = getDefaultDates();
  const { register, handleSubmit, formState, watch, setValue } = useForm<TenderForm>({
    defaultValues: {
      publishedAt: defaults.today,
      questionDeadline: defaults.plus15,
      bidDeadline: defaults.plus30,
    },
  });
  const [questionEdited, setQuestionEdited] = useState(false);
  const [bidEdited, setBidEdited] = useState(false);

  const { data: areas = [] } = useQuery({
    queryKey: ['requesting-areas'],
    queryFn: () => api.get<Array<{ id: string; code: string; name: string; status: string }>>('/requesting-areas'),
  });

  const activeAreas = areas.filter((a) => a.status === 'ACTIVA');

  const publishedAt = watch('publishedAt');

  useEffect(() => {
    if (!publishedAt) return;
    const base = new Date(publishedAt);
    if (Number.isNaN(base.getTime())) return;
    if (!questionEdited) {
      setValue('questionDeadline', toDateTimeLocal(new Date(base.getTime() + 15 * 24 * 60 * 60 * 1000)));
    }
    if (!bidEdited) {
      setValue('bidDeadline', toDateTimeLocal(new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000)));
    }
  }, [bidEdited, publishedAt, questionEdited, setValue]);

  async function onSubmit(values: TenderForm) {
    const tender = await api.post<TenderSummary>('/tenders', {
      title: values.title,
      description: values.description,
      requestingAreaId: values.requestingAreaId || undefined,
      publishedAt: values.publishedAt
        ? new Date(values.publishedAt).toISOString()
        : undefined,
      questionDeadline: values.questionDeadline
        ? new Date(values.questionDeadline).toISOString()
        : undefined,
      bidDeadline: values.bidDeadline
        ? new Date(values.bidDeadline).toISOString()
        : undefined,
    });
    navigate(`/internal/tenders/${tender.id}`);
  }

  return (
    <>
      <PageHeader title="Crear licitacion" description="El codigo se genera automaticamente. Las fechas son editables." />
      <section className="panel">
        <form className="grid-form" onSubmit={handleSubmit(onSubmit)}>
          <label>Titulo<input {...register('title', { required: true })} /></label>
          <label>Fecha base
            <input type="datetime-local" {...register('publishedAt')} />
            <small>Autocompletado, editable</small>
          </label>
          <label>Area solicitante
            <select {...register('requestingAreaId')}>
              <option value="">Seleccionar...</option>
              {activeAreas.map((area) => (
                <option key={area.id} value={area.id}>{area.code ? `${area.code} - ` : ''}{area.name}</option>
              ))}
            </select>
          </label>
          <label>Limite consultas
            <input type="datetime-local" {...register('questionDeadline', { onChange: () => setQuestionEdited(true) })} />
            <small>Autocompletado (+15 dias), editable</small>
          </label>
          <label>Limite ofertas
            <input type="datetime-local" {...register('bidDeadline', { onChange: () => setBidEdited(true) })} />
            <small>Autocompletado (+30 dias), editable</small>
          </label>
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

interface AwardResolveResponse {
  mode: string;
  matchedBy: string | null;
  tender?: { id: string; code: string; title: string; status: string; currency: string };
  supplier?: { id: string; ruc: string; legalName: string; tradeName: string | null; status: string };
  bid?: { id: string; version: number; status: string; submittedAt: string; totalAmount: string; currency: string };
  eligibleBids?: Array<{
    id: string;
    version: number;
    status: string;
    submittedAt: string;
    totalAmount: string;
    currency: string;
    tender?: { id: string; code: string; title: string; status: string; currency: string };
    supplier?: { id: string; ruc: string; legalName: string; tradeName: string | null; status: string };
  }>;
  options?: Array<{ id: string; ruc: string; legalName: string; tradeName: string | null; status: string }>;
  warnings?: string[];
  message?: string;
}

export function AwardCancelDesertPage() {
  const { register, handleSubmit, reset, setValue } = useForm<{ tenderId: string; supplierId: string; bidId?: string; amount?: number; reason: string; mode: string }>();
  const [identifier, setIdentifier] = useState('');
  const [resolveResult, setResolveResult] = useState<AwardResolveResponse | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);

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
    onSuccess: () => {
      reset();
      setResolveResult(null);
      setIdentifier('');
    },
  });

  async function resolveIdentifier(value: string) {
    if (!value.trim()) return;
    setResolveLoading(true);
    try {
      const result = await api.get<AwardResolveResponse>(`/awards/resolve?identifier=${encodeURIComponent(value.trim())}`);
      setResolveResult(result);

      if (result.mode === 'single') {
        if (result.tender) {
          setValue('tenderId', result.tender.id);
        }
        if (result.supplier) {
          setValue('supplierId', result.supplier.id);
        }
        if (result.bid) {
          setValue('bidId', result.bid.id);
          if (result.bid.totalAmount) {
            setValue('amount', Number(result.bid.totalAmount));
          }
        }
      }
    } finally {
      setResolveLoading(false);
    }
  }

  async function handleResolve() {
    await resolveIdentifier(identifier);
  }

  function selectEligibleBid(bid: { id: string; totalAmount: string; supplier?: { id: string }; tender?: { id: string } }) {
    setValue('bidId', bid.id);
    if (bid.totalAmount) setValue('amount', Number(bid.totalAmount));
    if (bid.supplier?.id) setValue('supplierId', bid.supplier.id);
    if (bid.tender?.id) setValue('tenderId', bid.tender.id);
  }

  return (
    <>
      <PageHeader title="Adjudicar, cancelar o declarar desierta" />
      <section className="panel">
        <div className="search-field">
          <label>Buscar por ID/Codigo/RUC/Nombre</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleResolve(); } }}
              placeholder="Ej: tenderCode, bidId, supplierRUC..."
            />
            <button className="button primary" type="button" onClick={() => void handleResolve()} disabled={resolveLoading}>
              <Search size={16} /> Buscar
            </button>
          </div>
        </div>

        {resolveResult?.mode === 'single' && (
          <div className="resolve-preview">
            {resolveResult.tender && (
              <div className="preview-row"><strong>Licitacion:</strong> {resolveResult.tender.code} - {resolveResult.tender.title}</div>
            )}
            {resolveResult.supplier && (
              <div className="preview-row"><strong>Proveedor:</strong> {resolveResult.supplier.legalName} (RUC: {resolveResult.supplier.ruc})</div>
            )}
            {resolveResult.bid && (
              <div className="preview-row"><strong>Oferta:</strong> {resolveResult.bid.id} - {resolveResult.bid.status} - {resolveResult.bid.totalAmount} {resolveResult.bid.currency}</div>
            )}
            {resolveResult.eligibleBids && resolveResult.eligibleBids.length > 0 && (
              <div>
                <strong>Ofertas elegibles:</strong>
                <ul className="bid-list">
                  {resolveResult.eligibleBids.map((b) => (
                    <li key={b.id} style={{ cursor: 'pointer' }} onClick={() => selectEligibleBid(b)}>
                      {b.tender && `${b.tender.code} | `}
                      {b.supplier && `${b.supplier.legalName} | `}
                      {b.id.slice(0, 8)}... | {b.status} | {b.totalAmount} {b.currency}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {resolveResult.warnings?.map((w, i) => <small key={i} className="warning">{w}</small>)}
          </div>
        )}

        {resolveResult?.mode === 'multiple' && (
          <div className="resolve-preview">
            <strong>Resultados posibles:</strong>
            <ul className="bid-list">
              {resolveResult.options?.map((option) => (
                <li key={option.id}>
                  <button className="link-button" type="button" onClick={() => { setIdentifier(option.ruc); void resolveIdentifier(option.ruc); }}>
                    {option.legalName} {option.tradeName ? `(${option.tradeName})` : ''} - RUC {option.ruc}
                  </button>
                </li>
              ))}
            </ul>
            {resolveResult.warnings?.map((w, i) => <small key={i} className="warning">{w}</small>)}
          </div>
        )}

        {resolveResult?.mode === 'none' && (
          <p className="resolve-empty">{resolveResult.message || 'Sin resultados'}</p>
        )}
      </section>
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

export function RequestingAreasPage() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ['requesting-areas'],
    queryFn: () => api.get<Row[]>('/requesting-areas'),
  });

  const { register, handleSubmit, reset } = useForm<{ name: string; code: string; description: string }>();

  const create = useMutation({
    mutationFn: (values: { name: string; code: string; description: string }) => api.post('/requesting-areas', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requesting-areas'] });
      reset();
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/requesting-areas/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requesting-areas'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/requesting-areas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requesting-areas'] }),
  });

  return (
    <>
      <PageHeader title="Areas Solicitantes" description="Gestion de areas que pueden solicitar licitaciones." />
      <section className="panel">
        <form className="grid-form compact" onSubmit={handleSubmit((values) => create.mutate(values))}>
          <label>Codigo<input {...register('code')} placeholder="Opcional" /></label>
          <label>Nombre<input {...register('name', { required: true })} /></label>
          <label className="full">Descripcion<input {...register('description')} /></label>
          <button className="button primary" type="submit">Crear area</button>
        </form>
      </section>
      <DataTable
        rows={data}
        columns={[
          { key: 'code', header: 'Codigo', render: (row) => String(row.code ?? '-') },
          { key: 'name', header: 'Nombre', render: (row) => String(row.name) },
          { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={String(row.status)} /> },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <div className="row-actions">
                {row.status === 'ACTIVA' ? (
                  <button className="icon-button" type="button" onClick={() => toggleStatus.mutate({ id: String(row.id), status: 'INACTIVA' })} title="Inactivar">
                    <X size={16} />
                  </button>
                ) : (
                  <button className="icon-button" type="button" onClick={() => toggleStatus.mutate({ id: String(row.id), status: 'ACTIVA' })} title="Activar">
                    <Check size={16} />
                  </button>
                )}
                <button className="icon-button danger" type="button" onClick={() => { if (confirm('Anular area solicitante?')) remove.mutate(String(row.id)); }} title="Anular">
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
