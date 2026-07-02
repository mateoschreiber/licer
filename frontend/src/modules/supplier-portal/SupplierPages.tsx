import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, FileText, Send } from 'lucide-react';
import { api, downloadFile } from '../../shared/api/client';
import { BidSummary, TenderSummary } from '../../shared/types';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { DataTable } from '../../shared/components/DataTable';
import { FileUploader } from '../../shared/components/FileUploader';
import { PageHeader } from '../../shared/components/PageHeader';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { Timeline } from '../../shared/components/Timeline';

interface SupplierRegisterForm {
  ruc: string;
  legalName: string;
  tradeName?: string;
  contactName: string;
  contactEmail: string;
  password: string;
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
          <label>
            RUC
            <input {...register('ruc', { required: true })} />
          </label>
          <label>
            Razon social
            <input {...register('legalName', { required: true })} />
          </label>
          <label>
            Nombre comercial
            <input {...register('tradeName')} />
          </label>
          <label>
            Contacto
            <input {...register('contactName', { required: true })} />
          </label>
          <label>
            Email
            <input type="email" {...register('contactEmail', { required: true })} />
          </label>
          <label>
            Password
            <input type="password" {...register('password', { required: true })} />
          </label>
          <button className="button primary" type="submit" disabled={formState.isSubmitting}>
            Solicitar registro
          </button>
        </form>
      </section>
    </main>
  );
}

export function SupplierProfilePage() {
  const { data } = useQuery({
    queryKey: ['supplier-profile'],
    queryFn: () => api.get<Record<string, unknown>>('/suppliers/me'),
  });

  return (
    <>
      <PageHeader title="Mi perfil" description="Datos legales y estado de homologacion." />
      <section className="panel">
        <dl className="detail-grid">
          <dt>RUC</dt>
          <dd>{String(data?.ruc ?? '-')}</dd>
          <dt>Razon social</dt>
          <dd>{String(data?.legalName ?? '-')}</dd>
          <dt>Estado</dt>
          <dd>{data?.status ? <StatusBadge status={String(data.status)} /> : '-'}</dd>
          <dt>Email</dt>
          <dd>{String(data?.contactEmail ?? '-')}</dd>
        </dl>
      </section>
    </>
  );
}

export function SupplierDocumentsPage() {
  return (
    <>
      <PageHeader title="Mis documentos" description="Carga documental de proveedor." />
      <section className="panel">
        <FileUploader label="Seleccionar documentos" onFiles={() => undefined} />
        <p className="muted">La API de metadata de archivos queda preparada para integrar storage privado.</p>
      </section>
    </>
  );
}

export function AvailableTendersPage() {
  const { data = [] } = useQuery({
    queryKey: ['available-tenders'],
    queryFn: () => api.get<TenderSummary[]>('/tenders'),
  });

  return (
    <>
      <PageHeader title="Licitaciones disponibles" description="Solo procesos publicados para proveedores." />
      <DataTable
        rows={data}
        columns={[
          { key: 'code', header: 'Codigo', render: (row) => row.code },
          { key: 'title', header: 'Titulo', render: (row) => row.title },
          { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'deadline',
            header: 'Cierre ofertas',
            render: (row) => new Date(row.bidDeadline).toLocaleString(),
          },
          {
            key: 'action',
            header: '',
            render: (row) => <Link to={`/supplier/tenders/${row.id}`}>Ver</Link>,
          },
        ]}
      />
    </>
  );
}

export function TenderDetailPage() {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ['tender', id],
    queryFn: () => api.get<TenderSummary & { description: string }>(`/tenders/${id}`),
    enabled: Boolean(id),
  });

  return (
    <>
      <PageHeader
        title={data?.title ?? 'Detalle de licitacion'}
        description={data?.code}
        actions={<Link className="button primary" to={`/supplier/bids/new?tenderId=${id}`}>Ofertar</Link>}
      />
      <section className="panel">
        <p>{data?.description}</p>
        <Timeline
          items={[
            { label: 'Publicacion', date: data?.bidDeadline, detail: 'Plazo visible para control de envio.' },
            { label: 'Cierre ofertas', date: data?.bidDeadline },
          ]}
        />
      </section>
    </>
  );
}

export function TenderDocumentsPage() {
  const { id } = useParams();
  const { data = [] } = useQuery({
    queryKey: ['tender-documents', id],
    queryFn: () => api.get<Array<Record<string, unknown>>>(`/tender-documents?tenderId=${id}`),
    enabled: Boolean(id),
  });

  return (
    <>
      <PageHeader title="Documentos y addendas" />
      <DataTable
        rows={data}
        columns={[
          { key: 'type', header: 'Tipo', render: (row) => String(row.type) },
          { key: 'title', header: 'Titulo', render: (row) => String(row.title) },
          { key: 'version', header: 'Version', render: (row) => String(row.version) },
          {
            key: 'download',
            header: '',
            render: (row) => (
              <button
                className="button ghost"
                type="button"
                onClick={() => void downloadFile(`/files/${String(row.fileId)}/download`, String(row.title))}
              >
                Descargar
              </button>
            ),
          },
        ]}
      />
    </>
  );
}

export function QuestionsAnswersPage() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<{ tenderId: string; text: string }>();
  const { data = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => api.get<Array<Record<string, unknown>>>('/questions'),
  });
  const mutation = useMutation({
    mutationFn: (values: { tenderId: string; text: string }) => api.post('/questions', values),
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  return (
    <>
      <PageHeader title="Consultas y respuestas" />
      <section className="panel">
        <form className="grid-form compact" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <label>
            Licitacion ID
            <input {...register('tenderId', { required: true })} />
          </label>
          <label>
            Consulta
            <input {...register('text', { required: true })} />
          </label>
          <button className="button primary" type="submit">Enviar</button>
        </form>
      </section>
      <DataTable
        rows={data}
        columns={[
          { key: 'tenderId', header: 'Licitacion', render: (row) => String(row.tenderId) },
          { key: 'text', header: 'Pregunta', render: (row) => String(row.text) },
          { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
      />
    </>
  );
}

export function CreateBidPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const form = useForm({
    defaultValues: {
      tenderId: params.get('tenderId') ?? '',
      paymentTerms: '',
      deliveryTerms: '',
      quantity: 1,
      unitPrice: 0,
      tax: 0,
      total: 0,
    },
  });
  const values = form.watch();

  const submitBid = useMutation({
    mutationFn: async () => {
      const created = await api.post<BidSummary>('/bids', {
        tenderId: values.tenderId,
        paymentTerms: values.paymentTerms,
        deliveryTerms: values.deliveryTerms,
        items: [
          {
            quantity: Number(values.quantity),
            unitPrice: Number(values.unitPrice),
            tax: Number(values.tax),
            total: Number(values.total),
          },
        ],
      });
      return api.post<BidSummary>(`/bids/${created.id}/submit`);
    },
    onSuccess: (bid) => navigate('/supplier/receipt', { state: bid }),
  });

  return (
    <>
      <PageHeader title="Crear oferta" description="La empresa vera la oferta desde el envio." />
      <section className="panel">
        <form className="grid-form" onSubmit={form.handleSubmit(() => setConfirmOpen(true))}>
          <label>
            Licitacion ID
            <input {...form.register('tenderId', { required: true })} />
          </label>
          <label>
            Condicion de pago
            <input {...form.register('paymentTerms')} />
          </label>
          <label>
            Plazo de entrega
            <input {...form.register('deliveryTerms')} />
          </label>
          <label>
            Cantidad
            <input type="number" {...form.register('quantity', { valueAsNumber: true })} />
          </label>
          <label>
            Precio unitario
            <input type="number" {...form.register('unitPrice', { valueAsNumber: true })} />
          </label>
          <label>
            Total
            <input type="number" {...form.register('total', { valueAsNumber: true })} />
          </label>
          <button className="button primary" type="submit">
            <Send size={18} /> Enviar oferta
          </button>
        </form>
      </section>
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar envio"
        message="Al enviar, los usuarios internos autorizados podran ver los datos, valores y documentos de esta oferta inmediatamente."
        confirmLabel="Enviar oferta"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          submitBid.mutate();
        }}
      />
    </>
  );
}

export function MyBidDetailPage() {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ['my-bid', id],
    queryFn: () => api.get<BidSummary>(`/bids/${id}`),
    enabled: Boolean(id),
  });

  return (
    <>
      <PageHeader title="Mi oferta" description={data?.id} />
      <section className="panel">
        <StatusBadge status={data?.status ?? 'BORRADOR'} />
        <p className="muted">Solo se muestran datos propios de esta oferta.</p>
      </section>
    </>
  );
}

export function SubmissionReceiptPage() {
  return (
    <>
      <PageHeader title="Recibo de presentacion" />
      <section className="panel success-panel">
        <CheckCircle size={28} />
        <p>Oferta enviada. El recibo queda disponible en el detalle de la oferta.</p>
      </section>
    </>
  );
}

export function CommunicationsPage() {
  const { data = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Array<Record<string, unknown>>>('/notifications'),
  });

  return (
    <>
      <PageHeader title="Comunicaciones" />
      <DataTable
        rows={data}
        columns={[
          { key: 'subject', header: 'Asunto', render: (row) => String(row.subject) },
          { key: 'status', header: 'Estado', render: (row) => String(row.status) },
          { key: 'createdAt', header: 'Fecha', render: (row) => String(row.createdAt) },
        ]}
      />
    </>
  );
}
