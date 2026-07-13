import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, Send } from 'lucide-react';
import { api, apiRequest, downloadFile } from '../../shared/api/client';
import { BidSummary, TenderSummary } from '../../shared/types';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { TenderSelector } from '../../shared/components/TenderSelector';
import { displayTenderCode, formatPyDate, formatPyDateTime } from '../../shared/utils/format';
import { API_URL } from '../../config/api';

interface SupplierRegisterForm {
  ruc: string;
  legalName: string;
  billingEmail: string;
  billingAddress: string;
  tradeName?: string;
  contactName?: string;
  contactEmail?: string;
  legalRepresentative?: string;
  relevantContacts?: string;
  clientRelationshipDuration?: string;
  phone?: string;
  username: string;
  password: string;
}

interface SupplierDocumentInfo {
  id: string;
  type: string;
  description?: string | null;
  status: string;
  fileId: string;
  file?: { id: string; originalName: string; mime: string };
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

interface SupplierProfileInfo {
  id: string;
  ruc: string;
  legalName: string;
  tradeName?: string | null;
  billingEmail: string;
  billingAddress: string;
  legalRepresentative?: string | null;
  relevantContacts?: string | null;
  clientRelationshipDuration?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  status: string;
  documents?: SupplierDocumentInfo[];
}

interface TenderItem {
  id: string;
  description: string;
  quantity: string | number;
  specs?: string | null;
  referenceBrandModel?: string | null;
  allowsEquivalent?: boolean;
  minimumWarranty?: string | null;
  warrantyDocumentRequired?: boolean;
}

interface SupplierTenderDetail extends TenderSummary {
  description: string;
  publishedAt?: string | null;
  questionDeadline?: string | null;
  responseDeadline?: string | null;
  responsibleEmail?: string | null;
  vatIncluded?: boolean;
  paymentMethod?: string | null;
  paymentTerms?: string | null;
  allowBidReplacement?: boolean;
  category?: { name: string } | null;
  branch?: { name: string } | null;
  requestingArea?: { code?: string; name: string } | null;
  items?: TenderItem[];
  documents?: Array<{ id: string; fileId: string; title: string; type: string; version: number }>;
}

interface BidLine {
  clientId: string;
  tenderItemId?: string;
  description: string;
  requestedQuantity: number;
  quantity: number;
  unitPrice: number;
  total: number;
  brand: string;
  model: string;
  notes: string;
  pendingApproval: boolean;
}

interface BidDetail extends BidSummary {
  receiptCode?: string | null;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  currency?: string;
  vatIncludedAccepted?: boolean;
  items?: Array<BidLine & { id: string }>;
  documents?: Array<{ id: string; fileId: string; type: string }>;
}

export function SupplierRegisterPage() {
  const { register, handleSubmit, formState } = useForm<SupplierRegisterForm>();
  const navigate = useNavigate();

  async function onSubmit(values: SupplierRegisterForm) {
    await api.post('/suppliers/register', { ...values, categories: [] });
    navigate('/login');
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel wide">
        <h1>Registro proveedor</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="grid-form">
          <label>RUC<input {...register('ruc', { required: true })} /></label>
          <label>Razon social<input {...register('legalName', { required: true })} /></label>
          <label>Correo de facturacion<input type="email" {...register('billingEmail', { required: true })} /></label>
          <label>Direccion de facturacion<input {...register('billingAddress', { required: true })} /></label>
          <label>Nombre comercial<input {...register('tradeName')} /></label>
          <label>Representante legal<input {...register('legalRepresentative')} /></label>
          <label>Correo de contacto<input type="email" {...register('contactEmail')} /></label>
          <label>Telefono<input {...register('phone')} /></label>
          <label className="full">Funcionarios relevantes / contacto basico<textarea rows={3} {...register('relevantContacts')} placeholder="Nombre, cargo, telefono y correo de los funcionarios relevantes" /></label>
          <label>Tiempo de trabajo con la empresa licitante<input {...register('clientRelationshipDuration')} placeholder="Ej.: 2 anos" /></label>
          <label>Usuario<input autoComplete="username" {...register('username', { required: true, minLength: 3 })} /></label>
          <label>Password<input type="password" {...register('password', { required: true })} /></label>
          <div className="form-actions full">
            <button className="button primary" type="submit" disabled={formState.isSubmitting}>Solicitar registro</button>
            <button className="button ghost" type="button" onClick={() => navigate('/login')}>Cancelar</button>
          </div>
        </form>
      </section>
    </main>
  );
}

export function SupplierProfilePage() {
  const { data } = useQuery({ queryKey: ['supplier-profile'], queryFn: () => api.get<SupplierProfileInfo>('/suppliers/me') });
  const logo = data?.documents?.find((document) => document.type === 'LOGO' && document.file?.mime.startsWith('image/'));
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (!logo?.fileId) { setLogoUrl(''); return; }
    let objectUrl = '';
    const controller = new AbortController();
    const token = window.localStorage.getItem('access_token');
    fetch(API_URL + '/files/' + logo.fileId + '/download', {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.blob() : Promise.reject())
      .then((blob) => { objectUrl = URL.createObjectURL(blob); setLogoUrl(objectUrl); })
      .catch(() => setLogoUrl(''));
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [logo?.fileId]);

  return (
    <>
      <PageHeader title="Mi perfil" description="Datos legales, facturacion y estado de homologacion." />
      {!data ? <section className="panel">Cargando perfil...</section> : <section className="panel supplier-profile-panel">
        <div className="supplier-profile-photo">{logoUrl ? <img src={logoUrl} alt={'Logo de ' + data.legalName} /> : <span>PL</span>}</div>
        <div><dl className="detail-grid">
          <dt>RUC</dt><dd>{data.ruc}</dd>
          <dt>Razon social</dt><dd>{data.legalName}</dd>
          <dt>Correo de facturacion</dt><dd>{data.billingEmail}</dd>
          <dt>Direccion de facturacion</dt><dd>{data.billingAddress}</dd>
          <dt>Representante legal</dt><dd>{data.legalRepresentative ?? '-'}</dd>
          <dt>Funcionarios relevantes</dt><dd>{data.relevantContacts ?? '-'}</dd>
          <dt>Tiempo de trabajo con la empresa licitante</dt><dd>{data.clientRelationshipDuration ?? '-'}</dd>
          <dt>Contacto</dt><dd>{data.contactEmail ?? data.contactName ?? '-'}</dd>
          <dt>Telefono</dt><dd>{data.phone ?? '-'}</dd>
          <dt>Estado</dt><dd><StatusBadge status={data.status} /></dd>
        </dl>
        <p className="muted profile-admin-note">La edicion de datos y documentos se realiza desde Administracion de proveedores.</p></div>
      </section>}
    </>
  );
}

export function SupplierDocumentsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['supplier-profile'], queryFn: () => api.get<SupplierProfileInfo>('/suppliers/me') });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('CONSTANCIA_RUC');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const documents = data?.documents ?? [];
  const constancia = documents.find((document) => document.type === 'CONSTANCIA_RUC');
  const conformidad = documents.find((document) => document.type === 'NOTA_CONFORMIDAD');
  const addDocument = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Seleccione un archivo');
      const body = new FormData(); body.append('file', selectedFile);
      const uploaded = await apiRequest<{ id: string }>('/files/upload', { method: 'POST', body });
      return api.post('/suppliers/me/documents', {
        fileId: uploaded.id,
        type: documentType,
        description: documentDescription || undefined,
      });
    },
    onSuccess: async () => {
      setSelectedFile(null); setDocumentDescription(''); setDocumentError('');
      await queryClient.invalidateQueries({ queryKey: ['supplier-profile'] });
      setSuccessOpen(true);
    },
  });

  return (
    <>
      <PageHeader title="Mis documentos" description="Documentacion registrada y requisitos de homologacion." />
      <section className="panel document-requirements">
        <div><strong>Constancia de RUC</strong><span className="required-mark">Obligatorio</span><p>{constancia ? 'Registrada: ' + (constancia.file?.originalName ?? 'archivo') : 'Pendiente de carga.'}</p></div>
        <div><strong>Nota de conformidad</strong><span className="desired-mark">Deseable</span><p>{conformidad ? 'Registrada: ' + (conformidad.file?.originalName ?? 'archivo') : 'Sin registro.'}</p></div>
      </section>
      <section className="panel"><div className="section-heading"><div><h2>Agregar documento</h2><p>Puede agregar documentos a su perfil en cualquier momento.</p></div></div>
        <div className="grid-form compact">
          <label>Tipo<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="CONSTANCIA_RUC">Constancia de RUC (obligatorio)</option><option value="NOTA_CONFORMIDAD">Nota de conformidad (deseable)</option><option value="LOGO">Logo de la empresa</option><option value="OTRO">Otro documento</option></select></label>
          <label>Descripcion breve<input value={documentDescription} onChange={(event) => setDocumentDescription(event.target.value)} placeholder="Identifique brevemente el documento" /></label>
          <label>Archivo (max. 2 MB)<input type="file" onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            if (file && file.size > MAX_FILE_SIZE_BYTES) {
              setSelectedFile(null);
              setDocumentError('El archivo supera el limite maximo de 2 MB. Seleccione otro archivo.');
              event.target.value = '';
              return;
            }
            setDocumentError('');
            setSelectedFile(file);
          }} /></label>
          <button className="button primary" type="button" onClick={() => addDocument.mutate()} disabled={!selectedFile || addDocument.isPending}>{addDocument.isPending ? 'Agregando...' : 'Agregar documento'}</button>
        </div>
        {documentError && <p className="error-message">{documentError}</p>}
        {addDocument.isError && <p className="error-message">{addDocument.error instanceof Error ? addDocument.error.message : 'No se pudo agregar el documento.'}</p>}
      </section>
      <ConfirmDialog
        open={successOpen}
        title="Documento agregado"
        message="El documento se agrego correctamente a su perfil."
        confirmLabel="Aceptar"
        variant="success"
        hideCancel
        onClose={() => setSuccessOpen(false)}
        onConfirm={() => setSuccessOpen(false)}
      />
      <section className="panel">
        <h2>Documentos registrados</h2>
        {documents.length ? <DataTable rows={documents} columns={[
          { key: 'type', header: 'Tipo', render: (row) => String(row.type).replaceAll('_', ' ') },
          { key: 'description', header: 'Descripcion', render: (row) => String(row.description ?? '-') },
          { key: 'file', header: 'Archivo', render: (row) => (row.file as { originalName?: string } | undefined)?.originalName ?? '-' },
          { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={String(row.status)} /> },
          { key: 'download', header: '', render: (row) => <button className="button ghost" type="button" onClick={() => void downloadFile('/files/' + String(row.fileId) + '/download', ((row.file as { originalName?: string } | undefined)?.originalName ?? 'documento'))}>Descargar</button> },
        ]} /> : <p className="muted">Aun no hay documentos registrados.</p>}
      </section>
    </>
  );
}

export function AvailableTendersPage() {
  const { data = [] } = useQuery({ queryKey: ['available-tenders'], queryFn: () => api.get<TenderSummary[]>('/tenders?pageSize=100') });
  return (
    <>
      <PageHeader title="Licitaciones disponibles" description="Solo procesos publicados para proveedores." />
      <DataTable rows={data} columns={[
        { key: 'code', header: 'Codigo', render: (row) => displayTenderCode(row.code) },
        { key: 'title', header: 'Titulo', render: (row) => row.title },
        { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'deadline', header: 'Cierre ofertas (PY)', render: (row) => formatPyDateTime(row.bidDeadline) },
        { key: 'action', header: '', render: (row) => <Link to={'/supplier/tenders/' + row.id}>Ver</Link> },
      ]} />
    </>
  );
}

export function TenderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['supplier-tender', id],
    queryFn: () => api.get<SupplierTenderDetail>('/tenders/' + id),
    enabled: Boolean(id),
  });
  const { data: ownBids = [] } = useQuery({
    queryKey: ['supplier-bids'],
    queryFn: () => api.get<BidSummary[]>('/bids?pageSize=100'),
  });
  const existingBid = ownBids.find((bid) =>
    bid.tenderId === id && ['ENVIADA', 'EVALUADA'].includes(bid.status)
  );

  return (
    <>
      <PageHeader
        title={data?.title ?? 'Detalle de licitacion'}
        description={data ? displayTenderCode(data.code) : ''}
        actions={<div className="row-actions">
          <button className="button ghost" type="button" onClick={() => navigate('/supplier/tenders')}>Volver</button>
          {data && (existingBid
            ? <Link className="button ghost" to={'/supplier/bids/' + existingBid.id}>Oferta ya presentada</Link>
            : <Link className="button primary" to={'/supplier/bids/new?tenderId=' + data.id}>Ofertar</Link>)}
        </div>}
      />
      {!data ? <section className="panel">Cargando licitacion...</section> : <>
        <section className="panel tender-detail">
          <div className="section-heading"><h2>Datos generales</h2><StatusBadge status={data.status} /></div>
          <dl className="detail-grid">
            <dt>Codigo</dt><dd>{displayTenderCode(data.code)}</dd>
            <dt>Sucursal</dt><dd>{data.branch?.name ?? '-'}</dd>
            <dt>Categoria</dt><dd>{data.category?.name ?? '-'}</dd>
            <dt>Area solicitante</dt><dd>{data.requestingArea ? ((data.requestingArea.code ? data.requestingArea.code + ' - ' : '') + data.requestingArea.name) : '-'}</dd>
            <dt>Responsable</dt><dd>{data.responsibleEmail ?? '-'}</dd>
            <dt>Descripcion</dt><dd>{data.description}</dd>
          </dl>
        </section>
        <section className="panel tender-detail">
          <h2>Fechas (horario Paraguay)</h2>
          <dl className="detail-grid">
            <dt>Publicacion</dt><dd>{formatPyDateTime(data.publishedAt)}</dd>
            <dt>Limite de consultas</dt><dd>{formatPyDateTime(data.questionDeadline)}</dd>
            <dt>Limite de respuestas</dt><dd>{formatPyDateTime(data.responseDeadline)}</dd>
            <dt>Limite de ofertas</dt><dd>{formatPyDateTime(data.bidDeadline)}</dd>
          </dl>
        </section>
        <section className="panel tender-detail">
          <h2>Condiciones comerciales</h2>
          <dl className="detail-grid">
            <dt>Moneda</dt><dd>{data.currency === 'USD' ? 'USD' : 'Gs.'}</dd>
            <dt>IVA incluido</dt><dd>{data.vatIncluded ? 'Si' : 'No'}</dd>
            <dt>Forma de pago</dt><dd>{data.paymentMethod === 'CREDITO' ? 'Credito' : 'Contado'}</dd>
            <dt>Condiciones de credito</dt><dd>{data.paymentMethod === 'CREDITO' ? (data.paymentTerms ?? '-') : '-'}</dd>
            <dt>Reemplazo de oferta</dt><dd>{data.allowBidReplacement ? 'Permitido' : 'No permitido'}</dd>
          </dl>
        </section>
        <section className="panel tender-detail">
          <h2>Items requeridos</h2>
          {data.items?.length ? <div className="detail-items-wrap"><table className="detail-items">
            <thead><tr><th>Descripcion</th><th>Cantidad</th><th>Especificaciones tecnicas</th><th>Marca de referencia</th><th>Equivalente</th><th>Garantia minima</th><th>Documento garantia</th></tr></thead>
            <tbody>{data.items.map((item) => <tr key={item.id}>
              <td>{item.description}</td><td>{String(item.quantity)}</td><td>{item.specs ?? '-'}</td><td>{item.referenceBrandModel ?? '-'}</td>
              <td>{item.allowsEquivalent ? 'Si' : 'No'}</td><td>{item.minimumWarranty ?? '-'}</td><td>{item.warrantyDocumentRequired ? 'Si' : 'No'}</td>
            </tr>)}</tbody>
          </table></div> : <p>Sin items registrados.</p>}
        </section>
        <section className="panel tender-detail">
          <h2>Adjuntos</h2>
          {data.documents?.length ? <ul className="attachment-list">{data.documents.map((document) => <li key={document.id}>
            <span>{document.title} ({document.type})</span>
            <button className="button ghost" type="button" onClick={() => void downloadFile('/files/' + document.fileId + '/download', document.title)}>Descargar</button>
          </li>)}</ul> : <p>Sin adjuntos registrados.</p>}
        </section>
      </>}
    </>
  );
}

export function TenderDocumentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data = [] } = useQuery({
    queryKey: ['tender-documents', id],
    queryFn: () => api.get<Array<Record<string, unknown>>>('/tender-documents?tenderId=' + id),
    enabled: Boolean(id),
  });
  return (
    <>
      <PageHeader title="Documentos y addendas" actions={<button className="button ghost" type="button" onClick={() => navigate('/supplier/tenders/' + id)}>Volver</button>} />
      <DataTable rows={data} columns={[
        { key: 'type', header: 'Tipo', render: (row) => String(row.type) },
        { key: 'title', header: 'Titulo', render: (row) => String(row.title) },
        { key: 'version', header: 'Version', render: (row) => String(row.version) },
        { key: 'download', header: '', render: (row) => <button className="button ghost" type="button" onClick={() => void downloadFile('/files/' + String(row.fileId) + '/download', String(row.title))}>Descargar</button> },
      ]} />
    </>
  );
}

export function QuestionsAnswersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, setValue, watch } = useForm<{ tenderId: string; text: string }>({ defaultValues: { tenderId: '', text: '' } });
  const { data = [] } = useQuery({ queryKey: ['questions'], queryFn: () => api.get<Array<Record<string, unknown>>>('/questions') });
  const mutation = useMutation({
    mutationFn: (values: { tenderId: string; text: string }) => api.post('/questions', values),
    onSuccess: async () => { reset(); await queryClient.invalidateQueries({ queryKey: ['questions'] }); },
  });

  return (
    <>
      <PageHeader title="Consultas y respuestas" />
      <section className="panel">
        <form className="grid-form compact" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <input type="hidden" {...register('tenderId', { required: true })} />
          <TenderSelector value={watch('tenderId')} onChange={(id) => setValue('tenderId', id, { shouldValidate: true })} label="Licitacion" required />
          <label className="full">Consulta<textarea className="question-textarea" rows={5} {...register('text', { required: true })} placeholder="Escriba aqui su consulta con el mayor detalle posible" /></label>
          <button className="button primary" type="submit">Enviar</button>
          <button className="button ghost" type="button" onClick={() => { reset(); navigate('/supplier/tenders'); }}>Cancelar</button>
        </form>
      </section>
      <DataTable rows={data} columns={[
        { key: 'tenderId', header: 'Licitacion', render: (row) => {
          const tender = row.tender as { code?: string; title?: string } | undefined;
          return tender?.code ? displayTenderCode(tender.code) + ' - ' + tender.title : '-';
        } },
        { key: 'text', header: 'Pregunta', render: (row) => String(row.text) },
        { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={String(row.status)} /> },
      ]} />
    </>
  );
}

export function CreateBidPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialTenderId = params.get('tenderId') ?? '';
  const [selectedTenderId] = useState(initialTenderId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bidLines, setBidLines] = useState<BidLine[]>([]);
  const form = useForm({ defaultValues: { tenderId: initialTenderId, paymentTerms: '', deliveryTerms: '' } });
  const { data: tender } = useQuery({
    queryKey: ['bid-tender', selectedTenderId],
    queryFn: () => api.get<SupplierTenderDetail>('/tenders/' + selectedTenderId),
    enabled: Boolean(selectedTenderId),
  });

  useEffect(() => {
    if (!initialTenderId) {
      navigate('/supplier/tenders', { replace: true });
    }
  }, [initialTenderId, navigate]);

  const paymentCondition = tender
    ? (tender.paymentMethod === 'CREDITO'
      ? 'Credito - ' + (tender.paymentTerms ?? 'Sin plazo definido')
      : 'Contado')
    : '';

  useEffect(() => {
    if (!tender) return;
    form.setValue('tenderId', tender.id);
    form.setValue('paymentTerms', paymentCondition);
    setBidLines((tender.items ?? []).map((item) => ({
      clientId: item.id,
      tenderItemId: item.id,
      description: item.description,
      requestedQuantity: Number(item.quantity),
      quantity: Number(item.quantity),
      unitPrice: 0,
      total: 0,
      brand: '',
      model: '',
      notes: '',
      pendingApproval: false,
    })));
  }, [tender?.id]);

  function parseGuarani(value: string) {
    const digits = value.replace(/\D/g, '');
    return digits ? Number(digits) : 0;
  }

  function formatGuarani(value: number) {
    return Math.round(Number(value) || 0).toLocaleString('es-PY');
  }

  function updateLine(index: number, field: keyof BidLine, value: string) {
    setBidLines((current) => current.map((line, lineIndex) => {
      if (lineIndex !== index) return line;
      const next = {
        ...line,
        [field]: field === 'quantity' ? Number(value) : value,
      } as BidLine;
      if (field === 'unitPrice') next.unitPrice = parseGuarani(value);
      next.total = Number(next.quantity) * Number(next.unitPrice);
      return next;
    }));
  }

  function addAdditionalItem() {
    setBidLines((current) => [...current, {
      clientId: 'extra-' + Date.now(),
      description: '',
      requestedQuantity: 0,
      quantity: 1,
      unitPrice: 0,
      total: 0,
      brand: '',
      model: '',
      notes: '',
      pendingApproval: true,
    }]);
  }

  function removeAdditionalItem(clientId: string) {
    setBidLines((current) => current.filter((line) => line.clientId !== clientId));
  }

  const grandTotal = bidLines.reduce((sum, line) => sum + Number(line.total), 0);
  const hasInvalidAdditional = bidLines.some((line) => line.pendingApproval && !line.description.trim());
  const canSubmit = Boolean(
    selectedTenderId &&
    bidLines.length > 0 &&
    !hasInvalidAdditional
  );

  const submitBid = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      const created = await api.post<BidSummary>('/bids', {
        tenderId: values.tenderId,
        paymentTerms: paymentCondition,
        deliveryTerms: values.deliveryTerms ? values.deliveryTerms + ' dias' : undefined,
        vatIncludedAccepted: true,
        items: bidLines.map((line) => ({
          tenderItemId: line.tenderItemId,
          description: line.description,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          tax: 0,
          total: Number(line.total),
          brand: line.brand || undefined,
          model: line.model || undefined,
          brandModel: [line.brand, line.model].filter(Boolean).join(' / ') || undefined,
          pendingApproval: line.pendingApproval,
          notes: line.notes || undefined,
        })),
      });
      return api.post<BidSummary>('/bids/' + created.id + '/submit');
    },
    onSuccess: (bid) => navigate('/supplier/receipt', { state: bid }),
  });

  return (
    <>
      <PageHeader title="Crear oferta" description="Los items y condiciones se cargan desde la licitacion seleccionada." />
      <section className="panel">
        <form className="grid-form" onSubmit={form.handleSubmit(() => { if (canSubmit) setConfirmOpen(true); })}>
          <input type="hidden" {...form.register('tenderId', { required: true })} />
          <label>Licitacion<input value={tender ? displayTenderCode(tender.code) + ' - ' + tender.title : 'Cargando...'} readOnly aria-readonly="true" /></label>
          <label>Condicion de pago<input value={paymentCondition} readOnly aria-readonly="true" /></label>
          <label>Plazo de entrega en dias<input type="number" min="1" step="1" {...form.register('deliveryTerms', { required: true })} /></label>
          <label>Moneda<input value={tender?.currency === 'USD' ? 'USD' : 'Gs.'} readOnly aria-readonly="true" /></label>
          <div className="full">
            <div className="section-heading"><div><h2>Items a cotizar</h2><p>Los precios unitarios y totales deben incluir IVA.</p></div></div>
            {bidLines.length ? <div className="detail-items-wrap"><table className="detail-items bid-entry-table">
              <thead><tr><th>Item</th><th>Cantidad</th><th>Precio unitario</th><th>Total</th><th>Marca</th><th>Modelo</th><th>Observaciones</th><th></th></tr></thead>
              <tbody>{bidLines.map((line, index) => <tr key={line.clientId}>
                <td>{line.pendingApproval
                  ? <input value={line.description} placeholder="Descripcion del item adicional" onChange={(event) => updateLine(index, 'description', event.target.value)} required />
                  : <><strong>{line.description}</strong><small>Solicitado: {line.requestedQuantity}</small></>}</td>
                <td><input type="number" min="0.0001" step="0.0001" value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} required /></td>
                <td><input type="text" inputMode="numeric" value={formatGuarani(line.unitPrice)} onChange={(event) => updateLine(index, 'unitPrice', event.target.value)} required /></td>
                <td><input value={formatGuarani(line.total)} readOnly aria-readonly="true" /></td>
                <td><input value={line.brand} onChange={(event) => updateLine(index, 'brand', event.target.value)} /></td>
                <td><input value={line.model} onChange={(event) => updateLine(index, 'model', event.target.value)} /></td>
                <td><input value={line.notes} onChange={(event) => updateLine(index, 'notes', event.target.value)} /></td>
                <td>{line.pendingApproval && <button className="button ghost" type="button" onClick={() => removeAdditionalItem(line.clientId)}>Quitar</button>}</td>
              </tr>)}</tbody>
            </table></div> : <p className="muted">{selectedTenderId ? 'Esta licitacion no tiene items disponibles.' : 'Seleccione una licitacion para cargar sus items.'}</p>}
          </div>

          <section className="full offer-notices">
            <div>
              <p>* Todo item adicional queda pendiente de aprobacion de la empresa solicitante.</p>
              <button className="button ghost" type="button" onClick={addAdditionalItem}>Agregar item</button>
            </div>
          </section>

          <div className="full offer-grand-total"><span>Total de todos los items</span><strong>{formatGuarani(grandTotal)} {tender?.currency === 'USD' ? 'USD' : 'Gs.'}</strong></div>
          <p className="full offer-required-notice">* Todos los items y precios de la oferta incluyen IVA.</p>
          {submitBid.isError && <p className="error-message full">{submitBid.error instanceof Error ? submitBid.error.message : 'No se pudo enviar la oferta.'}</p>}
          <div className="form-actions full">
            <button className="button primary" type="submit" disabled={!canSubmit || submitBid.isPending}><Send size={18} /> Enviar oferta</button>
            <button className="button ghost" type="button" onClick={() => navigate(selectedTenderId ? '/supplier/tenders/' + selectedTenderId : '/supplier/tenders')}>Cancelar</button>
          </div>
        </form>
      </section>
      <ConfirmDialog open={confirmOpen} title="Confirmar envio" message="Confirma que los precios incluyen IVA y que los items adicionales, si existen, quedan pendientes de aprobacion." confirmLabel="Enviar oferta" onClose={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); submitBid.mutate(); }} />
    </>
  );
}

export function MyBidDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['my-bid', id], queryFn: () => api.get<BidDetail>('/bids/' + id), enabled: Boolean(id) });
  return (
    <>
      <PageHeader title="Mi oferta" description={data?.receiptCode ?? ''} actions={<button className="button ghost" type="button" onClick={() => navigate('/supplier/tenders')}>Volver</button>} />
      {!data ? <section className="panel">Cargando oferta...</section> : <>
        <section className="panel tender-detail"><div className="section-heading"><h2>Datos de la oferta</h2><StatusBadge status={data.status} /></div><dl className="detail-grid">
          <dt>Comprobante</dt><dd>{data.receiptCode ?? '-'}</dd>
          <dt>Licitacion</dt><dd>{data.tender ? displayTenderCode(data.tender.code) + ' - ' + data.tender.title : '-'}</dd>
          <dt>Enviada</dt><dd>{formatPyDateTime(data.submittedAt)}</dd>
          <dt>Total</dt><dd>{data.totalAmount ?? '-'} {data.currency ?? ''}</dd>
          <dt>Condicion de pago</dt><dd>{data.paymentTerms ?? '-'}</dd>
          <dt>Plazo de entrega</dt><dd>{data.deliveryTerms ?? '-'}</dd>
          <dt>Precios con IVA</dt><dd>{data.vatIncludedAccepted ? 'Aceptado' : 'No registrado'}</dd>
        </dl></section>
        <section className="panel tender-detail"><h2>Items ofertados</h2>{data.items?.length ? <div className="detail-items-wrap"><table className="detail-items"><thead><tr><th>Item</th><th>Cantidad</th><th>Precio unitario</th><th>Total</th><th>Marca</th><th>Modelo</th><th>Aprobacion</th><th>Notas</th></tr></thead><tbody>{data.items.map((item) => <tr key={item.id}><td>{item.description || '-'}</td><td>{item.quantity}</td><td>{Number(item.unitPrice).toLocaleString('es-PY')}</td><td>{Number(item.total).toLocaleString('es-PY')}</td><td>{item.brand || '-'}</td><td>{item.model || '-'}</td><td>{item.pendingApproval ? 'Pendiente' : 'Incluido en licitacion'}</td><td>{item.notes || '-'}</td></tr>)}</tbody></table></div> : <p>Sin items.</p>}</section>
      </>}
    </>
  );
}

export function SubmissionReceiptPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const bid = location.state as BidDetail | null;
  return (
    <>
      <PageHeader title="Recibo de presentacion" />
      <section className="panel success-panel">
        <CheckCircle size={28} />
        <h2>Oferta enviada correctamente</h2>
        <p>Comprobante: <strong>{bid?.receiptCode ?? '-'}</strong></p>
        <p>Fecha y hora PY: {formatPyDateTime(bid?.submittedAt)}</p>
        <div className="form-actions">
          {bid?.id && <button className="button primary" type="button" onClick={() => navigate('/supplier/bids/' + bid.id)}>Ver oferta</button>}
          <button className="button ghost" type="button" onClick={() => navigate('/supplier/tenders')}>Volver a licitaciones</button>
        </div>
      </section>
    </>
  );
}

export function CommunicationsPage() {
  const { data = [] } = useQuery({ queryKey: ['notifications'], queryFn: () => api.get<Array<Record<string, unknown>>>('/notifications') });
  return (
    <>
      <PageHeader title="Comunicaciones" />
      <DataTable rows={data} columns={[
        { key: 'subject', header: 'Asunto', render: (row) => String(row.subject) },
        { key: 'status', header: 'Estado', render: (row) => String(row.status) },
        { key: 'createdAt', header: 'Fecha y hora PY', render: (row) => formatPyDateTime(String(row.createdAt)) },
      ]} />
    </>
  );
}
