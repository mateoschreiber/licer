import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, FilePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api, apiRequest, previewFile } from '../../shared/api/client';
import { API_URL } from '../../config/api';
import { useAuth } from '../../shared/auth/AuthProvider';
import { BidSummary, TenderSummary } from '../../shared/types';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { DataTable } from '../../shared/components/DataTable';
import { EvaluationMatrix } from '../../shared/components/EvaluationMatrix';
import { PageHeader } from '../../shared/components/PageHeader';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { Timeline } from '../../shared/components/Timeline';
import { TenderSelector } from '../../shared/components/TenderSelector';
import { SupplierSelector } from '../../shared/components/SupplierSelector';
import { PhoneInput } from '../../shared/components/PhoneInput';
import { displayTenderCode, formatMoney, formatPyDate, formatPyDateTime } from '../../shared/utils/format';

type Row = Record<string, unknown>;

interface RolePermissionRow {
  permission?: {
    id?: string;
    code?: string;
    description?: string | null;
  };
}

interface RoleRow extends Row {
  id: string;
  name: string;
  description?: string | null;
  permissions?: RolePermissionRow[];
}

interface UserRoleRow {
  role?: {
    id?: string;
    name?: string;
  };
}

interface UserRow extends Row {
  id: string;
  email: string;
  username: string;
  name: string;
  status: string;
  supplierId?: string | null;
  roles?: UserRoleRow[];
}

interface UserFormValues {
  email: string;
  username: string;
  name: string;
  password: string;
  status: string;
  supplierId: string;
  roleIds: string[];
}

interface RoleFormValues {
  name: string;
  description: string;
  permissionIds: string[];
}

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
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<UserRow[]>('/users'),
  });
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<RoleRow[]>('/roles'),
  });
  const userForm = useForm<UserFormValues>({
    defaultValues: { status: 'ACTIVE', roleIds: [], supplierId: '' },
  });
  const roleForm = useForm<RoleFormValues>({
    defaultValues: { permissionIds: [] },
  });

  const permissionOptions = Array.from(
    roles.reduce((permissions, role) => {
      role.permissions?.forEach((entry) => {
        const permission = entry.permission;
        if (permission?.id && permission.code) {
          permissions.set(permission.id, permission);
        }
      });
      return permissions;
    }, new Map<string, { id?: string; code?: string; description?: string | null }>()),
  ).map(([, permission]) => permission);

  const saveUser = useMutation({
    mutationFn: (values: UserFormValues) => {
      const roleIds = Array.isArray(values.roleIds)
        ? values.roleIds
        : [values.roleIds].filter(Boolean);
      const payload = {
        email: values.email,
        username: values.username,
        name: values.name,
        status: values.status,
        supplierId: values.supplierId || undefined,
        roleIds,
        ...(values.password ? { password: values.password } : {}),
      };

      return editingUser
        ? api.patch(`/users/${editingUser.id}`, payload)
        : api.post('/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      userForm.reset({ status: 'ACTIVE', roleIds: [], supplierId: '', email: '', name: '', password: '' });
    },
  });

  const quickUserStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/users/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const saveRole = useMutation({
    mutationFn: (values: RoleFormValues) => {
      const permissionIds = Array.isArray(values.permissionIds)
        ? values.permissionIds
        : [values.permissionIds].filter(Boolean);
      const payload = {
        name: values.name,
        description: values.description || undefined,
        permissionIds,
      };
      return editingRole
        ? api.patch(`/roles/${editingRole.id}`, payload)
        : api.post('/roles', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingRole(null);
      roleForm.reset({ name: '', description: '', permissionIds: [] });
    },
  });

  function roleNames(user: UserRow) {
    return user.roles?.map((item) => item.role?.name).filter(Boolean).join(', ') || '-';
  }

  function startUserCreate() {
    setEditingUser(null);
    userForm.reset({ status: 'ACTIVE', roleIds: [], supplierId: '', email: '', name: '', password: '' });
  }

  function startUserEdit(user: UserRow) {
    setEditingUser(user);
    userForm.reset({
      email: user.email,
      username: user.username,
      name: user.name,
      password: '',
      status: user.status,
      supplierId: user.supplierId ?? '',
      roleIds: user.roles?.map((item) => item.role?.id).filter(Boolean) as string[] ?? [],
    });
  }

  function startRoleCreate() {
    setEditingRole(null);
    roleForm.reset({ name: '', description: '', permissionIds: [] });
  }

  function startRoleEdit(role: RoleRow) {
    setEditingRole(role);
    roleForm.reset({
      name: role.name,
      description: role.description ?? '',
      permissionIds: role.permissions?.map((item) => item.permission?.id).filter(Boolean) as string[] ?? [],
    });
  }

  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  return (
    <>
      <PageHeader title="Usuarios y roles" description="Administracion de usuarios internos, estados y roles." />
      <div className="section-tabs" role="tablist">
        <button className={activeTab === 'users' ? 'tab-button active' : 'tab-button'} type="button" onClick={() => setActiveTab('users')}>Usuarios</button>
        <button className={activeTab === 'roles' ? 'tab-button active' : 'tab-button'} type="button" onClick={() => setActiveTab('roles')}>Roles</button>
      </div>
      {activeTab === 'users' ? <section className="admin-crud-grid">
        <div className="panel admin-list-panel"><div className="section-heading"><div><h2>Usuarios</h2><p>Seleccione un usuario para modificarlo.</p></div><button className="button primary" type="button" onClick={startUserCreate}><Plus size={16} /> Nuevo usuario</button></div>
          <DataTable rows={users} columns={[
            { key: 'email', header: 'Email', render: (row) => String(row.email) },
            { key: 'username', header: 'Usuario', render: (row) => String(row.username) },
            { key: 'name', header: 'Nombre', render: (row) => String(row.name) },
            { key: 'roles', header: 'Roles', render: (row) => roleNames(row as UserRow) },
            { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={String(row.status)} /> },
            { key: 'actions', header: 'Acciones', render: (row) => { const user=row as UserRow; return <div className="row-actions"><button className="button ghost" type="button" onClick={() => startUserEdit(user)}><Pencil size={16} /> Editar</button><button className="button ghost" type="button" onClick={() => quickUserStatus.mutate({id:user.id,status:user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'})}>{user.status === 'ACTIVE' ? <><X size={16} /> Inactivar</> : <><Check size={16} /> Activar</>}</button></div>; } },
          ]} />
        </div>
        <section className="panel admin-form-panel"><div className="section-heading"><div><h2>{editingUser ? 'Editar usuario' : 'Crear usuario'}</h2><p>{editingUser ? editingUser.email : 'Complete los datos de alta.'}</p></div></div>
          <form className="stack-form" onSubmit={userForm.handleSubmit((values) => saveUser.mutate(values))}>
            <label>Email<input type="email" {...userForm.register('email', { required: true })} /></label><label>Usuario<input {...userForm.register('username', { required: true, minLength: 3 })} /></label><label>Nombre<input {...userForm.register('name', { required: true })} /></label><label>{editingUser ? 'Nueva clave (opcional)' : 'Clave inicial'}<input type="password" minLength={8} {...userForm.register('password', { required: !editingUser })} /></label><label>Estado<select {...userForm.register('status')}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="BLOCKED">Bloqueado</option></select></label><input type="hidden" {...userForm.register('supplierId')} /><SupplierSelector value={userForm.watch('supplierId') ?? ''} onChange={(id) => userForm.setValue('supplierId', id)} /><label>Roles<select multiple size={Math.min(Math.max(roles.length,4),8)} {...userForm.register('roleIds',{required:true})}>{roles.map((role)=><option key={role.id} value={role.id}>{role.name}</option>)}</select></label><div className="form-actions"><button className="button primary" type="submit" disabled={saveUser.isPending}><Check size={16} /> {editingUser ? 'Guardar usuario' : 'Crear usuario'}</button>{editingUser && <button className="button ghost" type="button" onClick={startUserCreate}><X size={16} /> Cancelar</button>}</div>
          </form>
        </section>
      </section> : <section className="admin-crud-grid">
        <div className="panel admin-list-panel"><div className="section-heading"><div><h2>Roles</h2><p>Administre los permisos por rol.</p></div><button className="button primary" type="button" onClick={startRoleCreate}><Plus size={16} /> Nuevo rol</button></div>
          <DataTable rows={roles} columns={[{key:'name',header:'Rol',render:(row)=>String(row.name)},{key:'description',header:'Descripcion',render:(row)=>String(row.description ?? '')},{key:'permissions',header:'Permisos',render:(row)=>String((row as RoleRow).permissions?.length ?? 0)},{key:'actions',header:'Acciones',render:(row)=><button className="button ghost" type="button" onClick={()=>startRoleEdit(row as RoleRow)}><Pencil size={16} /> Editar</button>}]} />
        </div>
        <section className="panel admin-form-panel"><div className="section-heading"><div><h2>{editingRole ? 'Editar rol' : 'Crear rol'}</h2><p>{editingRole ? editingRole.name : 'Defina nombre y permisos.'}</p></div></div>
          <form className="stack-form" onSubmit={roleForm.handleSubmit((values)=>saveRole.mutate(values))}><label>Nombre del rol<input {...roleForm.register('name',{required:true})} /></label><label>Descripcion<input {...roleForm.register('description')} /></label><label>Permisos<select multiple size={Math.min(Math.max(permissionOptions.length,6),12)} {...roleForm.register('permissionIds',{required:true})}>{permissionOptions.map((permission)=><option key={permission.id} value={permission.id}>{permission.code}</option>)}</select></label><div className="form-actions"><button className="button primary" type="submit" disabled={saveRole.isPending || permissionOptions.length === 0}><Check size={16} /> {editingRole ? 'Guardar rol' : 'Crear rol'}</button>{editingRole && <button className="button ghost" type="button" onClick={startRoleCreate}><X size={16} /> Cancelar</button>}</div></form>
        </section>
      </section>}
    </>
  );
}

export function SuppliersManagementPage() {
  const { data = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => api.get<Row[]>('/suppliers') });
  return <><PageHeader title="Gestion de proveedores" actions={<Link className="button primary" to="/supplier/register"><Plus size={16} /> Anadir proveedor</Link>} /><DataTable rows={data} columns={[
    { key: 'ruc', header: 'RUC', render: (row) => String(row.ruc) },
    { key: 'legalName', header: 'Razon social', render: (row) => String(row.legalName) },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={String(row.status)} /> },
    { key: 'actions', header: 'Acciones', render: (row) => <Link className="button ghost" to={`/internal/suppliers/${String(row.id)}`}>Ver detalles</Link> },
  ]} /></>;
}

interface SupplierAdminDetail extends Row {
  id: string; ruc: string; legalName: string; billingEmail: string; billingAddress: string;
  tradeName?: string | null; contactName?: string | null; contactEmail?: string | null;
  legalRepresentative?: string | null; legalRepresentativeFirstName?: string | null; legalRepresentativeLastName?: string | null; legalRepresentativeDocumentId?: string | null; relevantContacts?: string | null; clientRelationshipDuration?: string | null;
  phone?: string | null; phoneCountry?: string | null; address?: string | null; status: string;
  documents?: Array<{ id: string; type: string; description?: string | null; fileId: string; status: string; file?: { originalName?: string } }>;
}

interface SupplierAdminForm {
  ruc: string; legalName: string; tradeName: string; billingEmail: string; billingAddress: string;
  contactName: string; contactEmail: string; legalRepresentative?: string; legalRepresentativeFirstName: string; legalRepresentativeLastName: string; legalRepresentativeDocumentId: string; relevantContacts: string;
  clientRelationshipDuration: string; phone: string; phoneCountry: string; address: string; status: string;
}

export function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('CONSTANCIA_RUC');
  const [documentDescription, setDocumentDescription] = useState('');
  const { data } = useQuery({ queryKey: ['supplier-detail', id], queryFn: () => api.get<SupplierAdminDetail>('/suppliers/' + id), enabled: Boolean(id) });
  const form = useForm<SupplierAdminForm>();
  useEffect(() => {
    if (!data) return;
    form.reset({
      ruc: data.ruc, legalName: data.legalName, tradeName: data.tradeName ?? '',
      billingEmail: data.billingEmail, billingAddress: data.billingAddress,
      contactName: data.contactName ?? '', contactEmail: data.contactEmail ?? '',
      legalRepresentativeFirstName: data.legalRepresentativeFirstName ?? (data.legalRepresentative ?? '').trim().split(/\s+/)[0] ?? '', legalRepresentativeLastName: data.legalRepresentativeLastName ?? (data.legalRepresentative ?? '').trim().split(/\s+/).slice(1).join(' '), legalRepresentativeDocumentId: data.legalRepresentativeDocumentId ?? '', relevantContacts: data.relevantContacts ?? '',
      clientRelationshipDuration: data.clientRelationshipDuration ?? '', phone: data.phone ?? '', phoneCountry: data.phoneCountry ?? 'PY',
      address: data.address ?? '', status: data.status,
    });
  }, [data?.id]);
  const save = useMutation({
    mutationFn: (values: SupplierAdminForm) => api.patch('/suppliers/' + id, values),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['supplier-detail', id] }); await queryClient.invalidateQueries({ queryKey: ['suppliers'] }); window.alert('Cambios guardados correctamente.'); },
  });
  const addDocument = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Seleccione un archivo');
      const body = new FormData(); body.append('file', selectedFile);
      const uploaded = await apiRequest<{ id: string }>('/files/upload', { method: 'POST', body });
      return api.post('/suppliers/' + id + '/documents', { fileId: uploaded.id, type: documentType, description: documentDescription || undefined });
    },
    onSuccess: async () => {
      setSelectedFile(null); setDocumentDescription('');
      await queryClient.invalidateQueries({ queryKey: ['supplier-detail', id] });
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
  const approveDocument = useMutation({ mutationFn: (documentId: string) => api.patch('/suppliers/' + id + '/documents/' + documentId, { status: 'APROBADO' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplier-detail', id] }) });
  const deleteDocument = useMutation({ mutationFn: (documentId: string) => api.delete('/suppliers/' + id + '/documents/' + documentId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplier-detail', id] }) });
  const deleteSupplier = useMutation({ mutationFn: () => api.delete('/suppliers/' + id), onSuccess: () => navigate('/internal/suppliers') });

  return (
    <>
      <PageHeader title={data ? data.legalName : 'Detalle proveedor'} description={data ? data.ruc : ''} actions={<div className="row-actions"><button className="button ghost" type="button" onClick={() => navigate('/internal/suppliers')}>Volver</button><button className="button danger" type="button" onClick={() => { if (confirm('Eliminar proveedor y bloquear sus usuarios?')) deleteSupplier.mutate(); }}><Trash2 size={16} /> Eliminar</button></div>} />
      {!data ? <section className="panel">Cargando proveedor...</section> : <>{!isAdmin ? <section className="panel"><p>Solo el administrador puede modificar datos y documentos de proveedores.</p></section> : <>
        <section className="panel"><div className="section-heading"><div><h2>Editar datos del proveedor</h2><p>Campos de facturacion y contactos registrados.</p></div></div>
          <form className="grid-form" onSubmit={form.handleSubmit((values) => { if (window.confirm('Guardar los cambios del proveedor?')) save.mutate(values); })}>
            <label>RUC<input inputMode="numeric" autoComplete="off" {...form.register('ruc', { required: true })} /></label><label>Razon social<input autoComplete="organization" {...form.register('legalName', { required: true })} /></label>
            <label>Correo de facturacion<input type="email" {...form.register('billingEmail', { required: true })} /></label><label>Direccion de facturacion<input {...form.register('billingAddress', { required: true })} /></label>
            <label>Nombre comercial<input {...form.register('tradeName')} /></label><label>Nombre del representante legal<input autoComplete="given-name" {...form.register('legalRepresentativeFirstName')} /></label>
            <label>Apellido del representante legal<input autoComplete="family-name" {...form.register('legalRepresentativeLastName')} /></label><label>Cedula de identidad del representante<input inputMode="numeric" autoComplete="off" {...form.register('legalRepresentativeDocumentId')} /></label>
            <label>Correo de contacto<input type="email" autoComplete="email" {...form.register('contactEmail')} /></label><label>Telefono<input type="hidden" {...form.register('phone')} /><PhoneInput value={form.watch('phone')} country={form.watch('phoneCountry') ?? 'PY'} onChange={(phone) => form.setValue('phone', phone, { shouldDirty: true })} onCountryChange={(country) => form.setValue('phoneCountry', country, { shouldDirty: true })} /></label>
            <label>Tiempo de trabajo con la empresa licitante<input {...form.register('clientRelationshipDuration')} placeholder="Ej.: 2 anos" /></label><label>Estado<select {...form.register('status')}><option value="PENDIENTE">Pendiente</option><option value="ACTIVO">Activo</option><option value="BLOQUEADO">Bloqueado</option></select></label>
            
            <div className="form-actions full"><button className="button primary" type="submit" disabled={save.isPending}><Pencil size={16} /> Guardar cambios</button></div>
          </form>
          {save.isError && <p className="error-message">{save.error instanceof Error ? save.error.message : 'No se pudo guardar el proveedor.'}</p>}
        </section>
        <section className="panel"><div className="section-heading"><div><h2>Agregar documento</h2><p>Constancia de RUC: obligatoria. Nota de conformidad: deseable. Logo: foto de perfil.</p></div></div>
          <div className="grid-form compact">
            <label>Tipo<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="CONSTANCIA_RUC">Constancia de RUC (obligatorio)</option><option value="NOTA_CONFORMIDAD">Nota de conformidad (deseable)</option><option value="LOGO">Logo de la empresa</option><option value="OTRO">Otro documento</option></select></label>
            <label>Descripcion breve<input value={documentDescription} onChange={(event) => setDocumentDescription(event.target.value)} placeholder="Identifique brevemente el documento" /></label>
            <label>Archivo (max. 2 MB)<input type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /></label>
            <button className="button primary" type="button" onClick={() => addDocument.mutate()} disabled={!selectedFile || addDocument.isPending}>Agregar documento</button>
          </div>
          {addDocument.isError && <p className="error-message">{addDocument.error instanceof Error ? addDocument.error.message : 'No se pudo agregar el documento.'}</p>}
        </section>
      </>}
      <section className="panel"><h2>Documentos registrados</h2>{data.documents?.length ? <DataTable rows={data.documents} columns={[
        { key: 'type', header: 'Tipo', render: (row) => String(row.type).replaceAll('_', ' ') },
        { key: 'description', header: 'Descripcion', render: (row) => String(row.description ?? '-') },
        { key: 'file', header: 'Archivo', render: (row) => (row.file as { originalName?: string } | undefined)?.originalName ?? '-' },
        { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={String(row.status)} /> },
        { key: 'actions', header: 'Acciones', render: (row) => <div className="row-actions"><button className="button ghost" type="button" onClick={() => void previewFile('/files/' + String(row.fileId) + '/download')}>Previsualizar</button>{String(row.status) !== 'APROBADO' && <button className="button primary" type="button" onClick={() => approveDocument.mutate(String(row.id))}><Check size={16} /> Aprobar</button>}<button className="button danger" type="button" onClick={() => { if (confirm('Eliminar documento?')) deleteDocument.mutate(String(row.id)); }}><Trash2 size={16} /> Eliminar</button></div> },
      ]} /> : <p className="muted">Sin documentos registrados.</p>}</section></>}
    </>
  );
}

interface TenderDetailData extends TenderSummary {
  description: string; publishedAt?: string; responseDeadline?: string; responsibleEmail?: string;
  vatIncluded?: boolean; paymentMethod?: string; paymentTerms?: string;
  category?: { name: string } | null; branch?: { name: string } | null;
  requestingArea?: { code?: string; name: string } | null;
  items?: Array<{ id: string; description: string; quantity: string | number; specs?: string | null; referenceBrandModel?: string | null; allowsEquivalent?: boolean; minimumWarranty?: string | null; warrantyDocumentRequired?: boolean }>;
  documents?: Array<{ id: string; title: string; type: string; version: number; fileId: string }>;
}

function TenderAttachmentPreview({ document }: { document: { id: string; title: string; type: string; fileId: string } }) {
  const [previewUrl, setPreviewUrl] = useState('');
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(document.title);
  useEffect(() => {
    if (!isImage) return;
    let objectUrl = '';
    const controller = new AbortController();
    const token = window.localStorage.getItem('access_token');
    fetch(API_URL + '/files/' + document.fileId + '/download', { headers: token ? { Authorization: 'Bearer ' + token } : {}, credentials: 'include', signal: controller.signal })
      .then((response) => response.ok ? response.blob() : Promise.reject())
      .then((blob) => { objectUrl = URL.createObjectURL(blob); setPreviewUrl(objectUrl); })
      .catch(() => undefined);
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [document.fileId, isImage]);
  return <li className="attachment-preview">{previewUrl ? <img src={previewUrl} alt={document.title} /> : <span>{document.title}</span>}<small>{document.title} ({document.type})</small></li>;
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
        actions={<div className="toolbar-actions"><Link className="button primary" to="/internal/tenders/new"><FilePlus size={18} /> Crear licitacion</Link><Link className="button ghost" to="/internal/tenders/categories">Modificar categorias</Link><Link className="button ghost" to="/internal/tenders/branches">Modificar sucursales</Link></div>}
      />
      <DataTable
        rows={data}
        columns={[
          { key: 'code', header: 'Codigo', render: (row) => displayTenderCode(row.code) },
          { key: 'title', header: 'Titulo', render: (row) => row.title },
          { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'deadline', header: 'Cierre', render: (row) => formatPyDate(row.bidDeadline) },
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
  categoryId: string;
  branchId: string;
  responsibleEmail: string;
  responseDeadline: string;
  currency: string;
  vatIncluded: boolean;
  paymentMethod: string;
  paymentTerms: string;
  customCreditDays: string;
  publishedAt: string;
  questionDeadline: string;
  bidDeadline: string;
}

interface TenderLineItem {
  lot: string;
  description: string;
  unit: string;
  quantity: number;
  specs: string;
  referenceBrandModel: string;
  allowsEquivalent: boolean;
  minimumWarranty: string;
  warrantyDocumentRequired: boolean;
}

const emptyTenderItem: TenderLineItem = {
  lot: '',
  description: '',
  unit: 'unidad',
  quantity: 1,
  specs: '', referenceBrandModel: '', allowsEquivalent: false, minimumWarranty: '', warrantyDocumentRequired: false,
};

function getDefaultDates() {
  const now = new Date();
  const today = toDateTimeLocal(now);
  const plus15 = toDateTimeLocal(new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000));
  const plus30 = toDateTimeLocal(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
  return { today, plus15, plus30 };
}

function toDateTimeLocal(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function TenderCreateEditPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);
  const defaults = getDefaultDates();
  const { register, handleSubmit, formState, watch, setValue } = useForm<TenderForm>({
    defaultValues: {
      publishedAt: defaults.today,
      questionDeadline: defaults.plus15,
      bidDeadline: defaults.plus30,
      currency: 'PYG',
      vatIncluded: true,
      paymentMethod: 'CONTADO',
      paymentTerms: '30 dias',
    },
  });
  const [questionEdited, setQuestionEdited] = useState(false);
  const [bidEdited, setBidEdited] = useState(false);
  const [items, setItems] = useState<TenderLineItem[]>([{ ...emptyTenderItem }]);
  const [planFiles, setPlanFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [savedTender, setSavedTender] = useState<TenderSummary | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['tender-categories'], queryFn: () => api.get<Array<{ id: string; name: string }>>('/tender-categories') });
  const { data: branches = [] } = useQuery({ queryKey: ['tender-branches'], queryFn: () => api.get<Array<{ id: string; name: string }>>('/tender-branches') });

  const { data: areas = [] } = useQuery({
    queryKey: ['requesting-areas'],
    queryFn: () => api.get<Array<{ id: string; code: string; name: string; status: string }>>('/requesting-areas'),
  });

  const activeAreas = areas.filter((a) => a.status === 'ACTIVA');

  const publishedAt = watch('publishedAt');
  const paymentTerms = watch('paymentTerms');

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
    setSubmitError('');
    const validItems = items.filter((item) => item.description.trim() && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      setSubmitError('Agregue al menos un item con descripcion y cantidad valida.');
      return;
    }
    try {
    const tender = await api.post<TenderSummary>('/tenders', {
      title: values.title,
      description: values.description,
      requestingAreaId: values.requestingAreaId || undefined,
      categoryId: values.categoryId || undefined,
      branchId: values.branchId || undefined,
      responsibleEmail: values.responsibleEmail || undefined,
      responseDeadline: values.responseDeadline ? new Date(values.responseDeadline).toISOString() : undefined,
      currency: values.currency,
      vatIncluded: values.vatIncluded,
      paymentMethod: values.paymentMethod,
      paymentTerms: values.paymentMethod === 'CREDITO' ? (values.paymentTerms === 'PERSONALIZADO' ? (values.customCreditDays ? values.customCreditDays + ' dias' : undefined) : values.paymentTerms) : undefined,
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
    await Promise.all(validItems.map((item) => api.post(`/tenders/${tender.id}/items`, {
      lot: item.lot || undefined,
      description: item.description,
      unit: item.unit || 'unidad',
      quantity: Number(item.quantity),
      specs: item.specs || undefined,
      referenceBrandModel: item.referenceBrandModel || undefined,
      allowsEquivalent: item.allowsEquivalent,
      minimumWarranty: item.minimumWarranty || undefined,
      warrantyDocumentRequired: item.warrantyDocumentRequired,
    })));
    const uploadDocuments = async (files: File[], type: 'TECNICO' | 'ANEXO') => {
      for (const file of files) {
        const data = new FormData(); data.append('file', file);
        const uploaded = await apiRequest<{ id: string }>('/files/upload', { method: 'POST', body: data });
        await api.post('/tender-documents', { tenderId: tender.id, type, title: file.name, fileId: uploaded.id });
      }
    };
    await uploadDocuments(planFiles, 'ANEXO');
    setSavedTender(tender);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar la licitacion. Revise los datos e intente nuevamente.');
    }
  }

  function updateItem(index: number, field: keyof TenderLineItem, value: string | boolean) {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index
        ? { ...item, [field]: field === 'quantity' ? Number(value) : value }
        : item
    )));
  }

  function addItem() {
    setItems((current) => [...current, { ...emptyTenderItem }]);
  }

  function removeItem(index: number) {
    setItems((current) => current.length === 1
      ? [{ ...emptyTenderItem }]
      : current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <>
      <PageHeader title="Crear licitacion" description="Formato estandar con datos generales, fechas e items del proceso." />
      <section className="panel">
        <form className="grid-form" onSubmit={handleSubmit(onSubmit, () => setSubmitError('Complete todos los campos obligatorios antes de guardar.'))}>
          <label>Codigo<input value="Se genera automaticamente" disabled /></label>
          <label>Titulo<input {...register('title', { required: true })} /></label>
          <label>Sucursal<select {...register('branchId', { required: true })}><option value="">Seleccionar...</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
          <label>Fecha base
            <input type="date" {...register('publishedAt', { required: true })} />
            <small>Autocompletado, editable</small>
          </label>
          <label>Categoria<select {...register('categoryId', { required: true })}><option value="">Seleccionar...</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>Responsable (correo)<input type="email" {...register('responsibleEmail', { required: true })} /></label>
          <label>Area solicitante
            <select {...register('requestingAreaId', { required: true })}>
              <option value="">Seleccionar...</option>
              {activeAreas.map((area) => (
                <option key={area.id} value={area.id}>{area.code ? `${area.code} - ` : ''}{area.name}</option>
              ))}
            </select>
          </label>
          <label>Limite consultas
            <input type="date" {...register('questionDeadline', { required: true, onChange: () => setQuestionEdited(true) })} />
            <small>Autocompletado (+15 dias), editable</small>
          </label>
          <label>Limite respuestas<input type="date" {...register('responseDeadline', { required: true })} /></label>
          <label>Limite ofertas
            <input type="date" {...register('bidDeadline', { required: true, onChange: () => setBidEdited(true) })} />
            <small>Autocompletado (+30 dias), editable</small>
          </label>
          <label className="full">Descripcion<textarea {...register('description', { required: true })} /></label>
          <div className="full line-items">
            <div className="section-heading">
              <div>
                <h2>Items de la licitacion</h2>
                <p>Agregue cada item con sus especificaciones y condiciones requeridas.</p>
              </div>
              <button className="button ghost" type="button" onClick={addItem}>
                <Plus size={16} /> Agregar item
              </button>
            </div>
            <div className="line-items-table">
              <div className="line-items-head">
                <span>Descripcion</span>
                <span>Cantidad</span>
                <span>Especificaciones tecnicas</span>
                <span>Marcas de referencia</span>
                <span>Permite equivalente</span>
                <span>Garantia minima</span>
                <span>Documento garantia</span>
              </div>
              {items.map((item, index) => (
                <div className="line-items-row" key={index}>
                  <input value={item.description} onChange={(event) => updateItem(index, 'description', event.target.value)} placeholder="Producto o servicio" required={index === 0} />
                  <input type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} />
                  <input value={item.specs} onChange={(event) => updateItem(index, 'specs', event.target.value)} placeholder="Especificaciones" />
                  <input value={item.referenceBrandModel} onChange={(event) => updateItem(index, 'referenceBrandModel', event.target.value)} placeholder="Marca / modelo" />
                  <label className="item-check"><input type="checkbox" checked={item.allowsEquivalent} onChange={(event) => updateItem(index, 'allowsEquivalent', event.target.checked)} /><span>Si</span></label>
                  <input value={item.minimumWarranty} onChange={(event) => updateItem(index, 'minimumWarranty', event.target.value)} placeholder="Ej.: 6 meses" />
                  <label className="item-check"><input type="checkbox" checked={item.warrantyDocumentRequired} onChange={(event) => updateItem(index, 'warrantyDocumentRequired', event.target.checked)} /><span>Si</span></label>
                  {isAdmin && <button className="item-remove" type="button" onClick={() => removeItem(index)} title="Quitar item"><Trash2 size={16} /></button>}
                </div>
              ))}
            </div>
          </div>
          <div className="full commercial-conditions"><h2>Condiciones comerciales</h2><div className="commercial-row"><fieldset className="currency-options"><legend>Moneda</legend><label><input type="radio" value="PYG" {...register('currency')} /> Gs.</label><label><input type="radio" value="USD" {...register('currency')} /> USD</label></fieldset><label className="commercial-check"><input type="checkbox" defaultChecked {...register('vatIncluded')} /><span>IVA incluido</span></label><label>Forma de pago<select {...register('paymentMethod')}><option value="CONTADO">Contado</option><option value="CREDITO">Credito</option></select></label>{watch('paymentMethod') === 'CREDITO' && <><label>Condiciones de cr\u00e9dito (desde la emisi\u00f3n de la factura)<select {...register('paymentTerms')}><option value="7 dias">7 dias</option><option value="15 dias">15 dias</option><option value="30 dias">30 dias</option><option value="PERSONALIZADO">Personalizado</option></select></label>{paymentTerms === 'PERSONALIZADO' && <label>Dias personalizados<input type="number" min="1" {...register('customCreditDays')} /></label>}</>}</div></div>
          <div className="full"><h2>Adjuntos</h2><label>Fotos / planos de referencia (max. 2 MB por archivo)<input type="file" multiple accept="image/*,.pdf" onChange={(event) => setPlanFiles(Array.from(event.target.files || []))} /></label>{planFiles.length > 0 && <small className="selected-files">{planFiles.length} archivo(s) seleccionado(s): {planFiles.map((file) => file.name).join(', ')}</small>}</div>
          {submitError && <p className="error-message full" role="alert">{submitError}</p>}
          <div className="form-actions full">
            <button className="button primary" type="submit" disabled={formState.isSubmitting}>{formState.isSubmitting ? 'Guardando...' : 'Guardar'}</button>
            <button className="button ghost" type="button" onClick={() => navigate('/internal/tenders')}>Cancelar</button>
          </div>
        </form>
      </section>
      {savedTender && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="save-success-title">
        <section className="modal success-modal">
          <div className="modal-title success-title"><Check size={22} /><h2 id="save-success-title">Licitacion guardada</h2></div>
          <p>La licitacion <strong>{displayTenderCode(savedTender.code)}</strong> fue guardada correctamente.</p>
          <div className="modal-actions"><button className="button primary" type="button" onClick={() => navigate('/internal/tenders')}>Aceptar</button></div>
        </section>
      </div>}
    </>
  );
}

function escapePrintHtml(value: unknown) {
  return String(value ?? '-').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}

function previewTenderA4(data: TenderDetailData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { window.alert('El navegador bloqueo la ventana de previsualizacion. Habilite las ventanas emergentes e intente nuevamente.'); return; }
  const detail = (label: string, value: unknown) => `<tr><th>${escapePrintHtml(label)}</th><td>${escapePrintHtml(value)}</td></tr>`;
  const itemRows = data.items?.length
    ? data.items.map((item, index) => `<tr><td>${index + 1}</td><td>${escapePrintHtml(item.description)}</td><td>${escapePrintHtml(item.quantity)}</td><td>${escapePrintHtml(item.specs ?? '-')}</td><td>${escapePrintHtml(item.referenceBrandModel ?? '-')}</td></tr>`).join('')
    : '<tr><td colspan="5">Sin items registrados.</td></tr>';
  const attachmentRows = data.documents?.length
    ? data.documents.map((document, index) => `<tr><td>${index + 1}</td><td>${escapePrintHtml(document.title)}</td><td>${escapePrintHtml(document.type)}</td><td>Version ${escapePrintHtml(document.version)}</td></tr>`).join('')
    : '<tr><td colspan="4">Sin adjuntos registrados.</td></tr>';
  printWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapePrintHtml(displayTenderCode(data.code))} - ${escapePrintHtml(data.title)}</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:10pt Arial,sans-serif;color:#17231e}h1{font-size:20pt;margin:0 0 3px}h2{font-size:12pt;color:#146c5c;border-bottom:1px solid #bdd7cf;padding-bottom:4px;margin:19px 0 8px}.sub{color:#52706a;margin:0}.meta{margin:18px 0;border:1px solid #d7e1dc;border-collapse:collapse;width:100%}.meta th,.meta td{padding:6px 8px;border:1px solid #d7e1dc;text-align:left}.meta th{width:31%;background:#f0f6f3}table{border-collapse:collapse;width:100%;margin-top:8px}thead{background:#146c5c;color:#fff}th,td{border:1px solid #d7e1dc;padding:6px;text-align:left;vertical-align:top}.footer{border-top:1px solid #d7e1dc;margin-top:18px;padding-top:6px;color:#52706a;font-size:8pt}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><h1>Expediente de licitacion</h1><p class="sub">${escapePrintHtml(displayTenderCode(data.code))} · ${escapePrintHtml(data.title)}</p><h2>Datos generales</h2><table class="meta">${detail('Sucursal', data.branch?.name)}${detail('Categoria', data.category?.name)}${detail('Area solicitante', data.requestingArea ? `${data.requestingArea.code ? data.requestingArea.code + ' - ' : ''}${data.requestingArea.name}` : '-')}${detail('Responsable', data.responsibleEmail)}${detail('Estado', data.status)}${detail('Descripcion', data.description)}</table><h2>Fechas y condiciones</h2><table class="meta">${detail('Fecha base', formatPyDate(data.publishedAt))}${detail('Limite de consultas', formatPyDate(data.questionDeadline))}${detail('Limite de respuestas', formatPyDate(data.responseDeadline))}${detail('Limite de ofertas', formatPyDate(data.bidDeadline))}${detail('Moneda', data.currency === 'USD' ? 'USD' : 'Guaranies (Gs.)')}${detail('IVA incluido', data.vatIncluded ? 'Si' : 'No')}${detail('Forma de pago', data.paymentMethod === 'CREDITO' ? 'Credito' : 'Contado')}${detail('Condiciones de credito', data.paymentMethod === 'CREDITO' ? data.paymentTerms : '-')}</table><h2>Items solicitados</h2><table><thead><tr><th>#</th><th>Descripcion</th><th>Cantidad</th><th>Especificaciones</th><th>Marca / modelo de referencia</th></tr></thead><tbody>${itemRows}</tbody></table><h2>Adjuntos</h2><table><thead><tr><th>#</th><th>Archivo</th><th>Tipo</th><th>Referencia</th></tr></thead><tbody>${attachmentRows}</tbody></table><p class="footer">Documento generado desde LICI el ${escapePrintHtml(formatPyDateTime(new Date()))}. Los adjuntos quedan identificados como parte integrante del expediente.</p></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 250);
}

export function TenderDetailInternalPage() {
  const { id } = useParams(); const navigate = useNavigate(); const { hasRole } = useAuth(); const isAdmin = hasRole(['ADMIN']); const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['internal-tender', id], queryFn: () => api.get<TenderDetailData>('/tenders/' + id), enabled: Boolean(id) });
  const publish = useMutation({ mutationFn: () => api.post('/tenders/' + id + '/publish'), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['internal-tender', id] }) });
  const removeTender = useMutation({ mutationFn: () => api.delete('/tenders/' + id), onSuccess: () => navigate('/internal/tenders') });
  return <><PageHeader title={data?.title ?? 'Licitacion'} description={data ? displayTenderCode(data.code) : ''} actions={<div className="row-actions"><button className="button ghost" type="button" onClick={() => data && previewTenderA4(data)}>Previsualizar</button><button className="button ghost" type="button" onClick={() => navigate('/internal/tenders')}>Volver</button>{data?.status === 'BORRADOR' && <button className="button primary" type="button" onClick={() => { if (confirm('Confirma publicar esta licitacion? Esta accion la hara visible para proveedores autorizados.')) publish.mutate(); }}>Publicar</button>}<Link className="button ghost" to="/internal/awards">Ir a decision</Link>{isAdmin && <button className="button danger" type="button" onClick={() => { if (confirm('Confirma eliminar esta licitacion? Se ocultara del portal y se conservara su trazabilidad.')) removeTender.mutate(); }} disabled={removeTender.isPending}><Trash2 size={16} /> Eliminar</button>}</div>} />
    {!data ? <section className="panel">Cargando licitacion...</section> : <>
      <section className="panel tender-detail"><div className="section-heading"><h2>Datos generales</h2>{data.status && <StatusBadge status={data.status} />}</div><dl className="detail-grid"><dt>Codigo</dt><dd>{displayTenderCode(data.code)}</dd><dt>Sucursal</dt><dd>{data.branch?.name ?? '-'}</dd><dt>Categoria</dt><dd>{data.category?.name ?? '-'}</dd><dt>Area solicitante</dt><dd>{data.requestingArea ? ((data.requestingArea.code ? data.requestingArea.code + ' - ' : '') + data.requestingArea.name) : '-'}</dd><dt>Responsable</dt><dd>{data.responsibleEmail ?? '-'}</dd><dt>Descripcion</dt><dd>{data.description}</dd></dl></section>
      <section className="panel tender-detail"><h2>Fechas</h2><dl className="detail-grid"><dt>Fecha base</dt><dd>{formatPyDate(data.publishedAt)}</dd><dt>Limite de consultas</dt><dd>{formatPyDate(data.questionDeadline)}</dd><dt>Limite de respuestas</dt><dd>{formatPyDate(data.responseDeadline)}</dd><dt>Limite de ofertas</dt><dd>{formatPyDate(data.bidDeadline)}</dd></dl></section>
      <section className="panel tender-detail"><h2>Condiciones comerciales</h2><dl className="detail-grid"><dt>Moneda</dt><dd>{data.currency === 'USD' ? 'USD' : 'Gs.'}</dd><dt>IVA incluido</dt><dd>{data.vatIncluded ? 'Si' : 'No'}</dd><dt>Forma de pago</dt><dd>{data.paymentMethod === 'CREDITO' ? 'Credito' : 'Contado'}</dd><dt>Condiciones de credito</dt><dd>{data.paymentMethod === 'CREDITO' ? (data.paymentTerms ?? '-') : '-'}</dd></dl></section>
      <section className="panel tender-detail"><h2>Items</h2>{data.items?.length ? <div className="detail-items-wrap"><table className="detail-items"><thead><tr><th>Descripcion</th><th>Cantidad</th><th>Especificaciones tecnicas</th><th>Marca de referencia</th><th>Equivalente</th><th>Garantia minima</th><th>Documento garantia</th></tr></thead><tbody>{data.items.map((item) => <tr key={item.id}><td>{item.description}</td><td>{String(item.quantity)}</td><td>{item.specs ?? '-'}</td><td>{item.referenceBrandModel ?? '-'}</td><td>{item.allowsEquivalent ? 'Si' : 'No'}</td><td>{item.minimumWarranty ?? '-'}</td><td>{item.warrantyDocumentRequired ? 'Si' : 'No'}</td></tr>)}</tbody></table></div> : <p>Sin items registrados.</p>}</section>
      <section className="panel tender-detail"><div className="section-heading"><h2>Adjuntos</h2></div>{data.documents?.length ? <ul className="attachment-list attachment-gallery">{data.documents.map((doc) => <TenderAttachmentPreview key={doc.id} document={doc} />)}</ul> : <p>Sin adjuntos registrados.</p>}</section>
    </>}
  </>;
}

export function DocumentsAddendasPage() {
  const queryClient = useQueryClient();
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const { register, handleSubmit, setValue, watch, reset } = useForm<{ tenderId: string; type: string; title: string; fileId: string }>();
  const { data = [] } = useQuery({
    queryKey: ['internal-documents'],
    queryFn: () => api.get<Row[]>('/tender-documents'),
  });
  const create = useMutation({
    mutationFn: (values: { tenderId: string; type: string; title: string; fileId: string }) => api.post('/tender-documents', values),
    onSuccess: () => { reset(); return queryClient.invalidateQueries({ queryKey: ['internal-documents'] }); },
  });
  async function selectDocumentFile(file?: File) {
    if (!file) return;
    setUploadingDocument(true);
    try {
      const body = new FormData(); body.append('file', file);
      const uploaded = await apiRequest<{ id: string }>('/files/upload', { method: 'POST', body });
      setValue('fileId', uploaded.id, { shouldValidate: true });
      setValue('title', file.name, { shouldValidate: true });
    } finally {
      setUploadingDocument(false);
    }
  }

  return (
    <>
      <PageHeader title="Documentos y addendas" />
      <section className="panel">
        <form className="grid-form compact" onSubmit={handleSubmit((values) => create.mutate(values))}>
          <input type="hidden" {...register('tenderId', { required: true })} /><TenderSelector value={watch('tenderId') ?? ''} onChange={(id) => setValue('tenderId', id, { shouldValidate: true })} label="Licitacion" required />
          <label>Tipo<input {...register('type', { required: true })} placeholder="BASE / ADDENDA" /></label>
          <label>Codigo<input value="Se genera automaticamente" disabled /></label>
          <label>Titulo<input {...register('title', { required: true })} /></label>
          <input type="hidden" {...register('fileId', { required: true })} /><label>Archivo (max. 2 MB)<input type="file" onChange={(event) => void selectDocumentFile(event.target.files?.[0])} /></label>
          <button className="button primary" type="submit" disabled={uploadingDocument}>{uploadingDocument ? 'Cargando...' : 'Agregar'}</button><button className="button ghost" type="button" onClick={() => reset()}>Cancelar</button>
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
  const { data = [] } = useQuery({ queryKey: ['internal-questions'], queryFn: () => api.get<Row[]>('/questions') });
  return <><PageHeader title="Bandeja de consultas" /><DataTable rows={data} columns={[
    { key: 'tenderId', header: 'Licitacion', render: (row) => { const tender = row.tender as { code?: string; title?: string } | undefined; return tender?.code ? displayTenderCode(tender.code) + ' - ' + tender.title : '-'; } },
    { key: 'text', header: 'Pregunta', render: (row) => String(row.text) },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={String(row.status)} /> },
    { key: 'action', header: 'Acciones', render: (row) => <Link className="button ghost compact-button" to={'/internal/questions/' + String(row.id)}>Abrir</Link> },
  ]} /></>;
}

interface QuestionTicket { id: string; text: string; status: string; createdAt: string; tender?: { code: string; title: string }; supplier?: { legalName: string; ruc: string }; answer?: { text: string; publishedAt?: string; author?: { name?: string } } | null; }
export function QuestionDetailInternalPage() {
  const { id } = useParams(); const navigate = useNavigate(); const queryClient = useQueryClient(); const form = useForm<{ text: string }>({ defaultValues: { text: '' } });
  const { data } = useQuery({ queryKey: ['internal-question', id], queryFn: () => api.get<QuestionTicket>('/questions/' + id), enabled: Boolean(id) });
  const answer = useMutation({ mutationFn: (values: { text: string }) => api.post('/questions/' + id + '/answer', values), onSuccess: async () => { form.reset(); await queryClient.invalidateQueries({ queryKey: ['internal-question', id] }); await queryClient.invalidateQueries({ queryKey: ['internal-questions'] }); } });
  return <><PageHeader title="Consulta" description={data?.tender ? displayTenderCode(data.tender.code) + ' - ' + data.tender.title : ''} actions={<button className="button ghost" type="button" onClick={() => navigate('/internal/questions')}>Volver</button>} />{!data ? <section className="panel">Cargando consulta...</section> : <section className="panel ticket"><div className="ticket-head"><div><strong>{data.supplier ? data.supplier.legalName + ' · ' + data.supplier.ruc : 'Proveedor'}</strong><small>{formatPyDateTime(data.createdAt)}</small></div><div><StatusBadge status={data.status} />{data.status === 'RESPONDIDA' && <span className="ticket-closed">Cerrado</span>}</div></div><div className="ticket-message supplier-message"><strong>Consulta del proveedor</strong><p>{data.text}</p></div>{data.answer ? <div className="ticket-message company-message"><strong>Respuesta de la empresa{data.answer.author?.name ? ' · ' + data.answer.author.name : ''}</strong><p>{data.answer.text}</p><small>{formatPyDateTime(data.answer.publishedAt)}</small></div> : <form className="ticket-reply" onSubmit={form.handleSubmit((values) => answer.mutate(values))}><label>Responder<textarea rows={5} {...form.register('text', { required: true })} placeholder="Escriba la respuesta para el proveedor" /></label><button className="button primary" type="submit" disabled={answer.isPending}><Check size={16} /> Enviar respuesta y cerrar</button></form>}{answer.isError && <p className="error-message">No se pudo enviar la respuesta.</p>}</section>}</>;
}

export function BidsInboxPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [bidToDelete, setBidToDelete] = useState<BidSummary | null>(null);
  const { data = [] } = useQuery({
    queryKey: ['internal-bids'],
    queryFn: () => api.get<BidSummary[]>('/bids'),
  });
  const removeBid = useMutation({
    mutationFn: (id: string) => api.delete('/bids/' + id),
    onSuccess: async () => {
      setBidToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ['internal-bids'] });
    },
  });

  return (
    <>
      <PageHeader title="Ofertas recibidas" description="Las ofertas enviadas son visibles inmediatamente para usuarios autorizados." />
      <DataTable rows={data} columns={[
        { key: 'tenderId', header: 'Licitacion', render: (row) => row.tender?.code ? displayTenderCode(row.tender.code) : '-' },
        { key: 'supplierId', header: 'Proveedor', render: (row) => row.supplier ? row.supplier.ruc + ' - ' + row.supplier.legalName : '-' },
        { key: 'receiptCode', header: 'Oferta', render: (row) => row.receiptCode ?? '-' },
        { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'submittedAt', header: 'Enviada (PY)', render: (row) => formatPyDateTime(row.submittedAt) },
        { key: 'action', header: '', render: (row) => <div className="row-actions">
          <Link className="button ghost compact-button" to={'/internal/bids/' + row.id}>Ver</Link>
          {hasRole(['ADMIN']) && <button className="button danger compact-button" type="button" onClick={() => setBidToDelete(row)}><Trash2 size={15} /> Eliminar</button>}
        </div> },
      ]} />
      {removeBid.isError && <p className="error-message">{removeBid.error instanceof Error ? removeBid.error.message : 'No se pudo eliminar la oferta.'}</p>}
      <ConfirmDialog
        open={Boolean(bidToDelete)}
        title="Eliminar oferta"
        message="La oferta dejara de estar disponible y el proveedor podra volver a ofertar en esta licitacion. Desea continuar?"
        confirmLabel="Eliminar"
        onClose={() => setBidToDelete(null)}
        onConfirm={() => { if (bidToDelete) removeBid.mutate(bidToDelete.id); }}
      />
    </>
  );
}

interface InternalBidDetail extends BidSummary {
  receiptCode?: string | null;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  currency?: string;
  vatIncludedAccepted?: boolean;
  supplier?: { id: string; ruc: string; legalName: string; tradeName?: string | null };
  items?: Array<{ id: string; description?: string | null; quantity: string | number; unitPrice: string | number; total: string | number; brand?: string | null; model?: string | null; pendingApproval?: boolean; notes?: string | null }>;
}

function previewBidA4(data: InternalBidDetail) {
  const win = window.open('', '_blank'); if (!win) { window.alert('Habilite las ventanas emergentes para previsualizar la oferta.'); return; }
  const esc = (value: unknown) => String(value ?? '-').replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' })[char] ?? char);
  const rows = data.items?.map((item, index) => `<tr><td>${index + 1}</td><td>${esc(item.description)}</td><td>${esc(item.quantity)}</td><td>${esc(formatMoney(item.unitPrice, data.currency))}</td><td>${esc(formatMoney(item.total, data.currency))}</td><td>${esc(item.brand ?? '-')}</td><td>${esc(item.model ?? '-')}</td></tr>`).join('') ?? '<tr><td colspan="7">Sin items.</td></tr>';
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Oferta ${esc(data.receiptCode)}</title><style>@page{size:A4;margin:16mm}body{font:10pt Arial;color:#17231e}h1{margin:0;color:#146c5c;font-size:20pt}h2{font-size:12pt;border-bottom:1px solid #bdd7cf;padding-bottom:4px;margin-top:20px}table{border-collapse:collapse;width:100%;margin-top:8px}th,td{border:1px solid #d7e1dc;padding:6px;text-align:left;vertical-align:top}th{background:#edf4f1}.items thead th{background:#146c5c;color:#fff}.sub{color:#52706a}.foot{margin-top:18px;font-size:8pt;color:#52706a}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><h1>Oferta presentada</h1><p class="sub">${esc(data.receiptCode)} · ${esc(data.tender?.code ? displayTenderCode(data.tender.code) : '-')}</p><h2>Resumen</h2><table><tr><th>Proveedor</th><td>${esc(data.supplier ? data.supplier.ruc + ' - ' + data.supplier.legalName : '-')}</td></tr><tr><th>Licitacion</th><td>${esc(data.tender ? displayTenderCode(data.tender.code) + ' - ' + data.tender.title : '-')}</td></tr><tr><th>Fecha de envio</th><td>${esc(formatPyDateTime(data.submittedAt))}</td></tr><tr><th>Total</th><td>${esc(formatMoney(data.totalAmount, data.currency))}</td></tr><tr><th>Pago</th><td>${esc(data.paymentTerms)}</td></tr><tr><th>Entrega</th><td>${esc(data.deliveryTerms)}</td></tr></table><h2>Items ofertados</h2><table class="items"><thead><tr><th>#</th><th>Item</th><th>Cantidad</th><th>Precio unitario</th><th>Total</th><th>Marca</th><th>Modelo</th></tr></thead><tbody>${rows}</tbody></table><p class="foot">Documento generado el ${esc(formatPyDateTime(new Date()))}.</p></body></html>`); win.document.close(); win.focus(); window.setTimeout(() => win.print(), 250);
}

export function BidDetailInternalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['internal-bid', id],
    queryFn: () => api.get<InternalBidDetail>('/bids/' + id),
    enabled: Boolean(id),
  });

  return (
    <>
      <PageHeader title="Detalle interno de oferta" description={data?.receiptCode ?? ''} actions={<div className="row-actions"><button className="button ghost" type="button" onClick={() => data && previewBidA4(data)}>Previsualizar</button><button className="button ghost" type="button" onClick={() => navigate('/internal/bids')}>Volver</button></div>} />
      {!data ? <section className="panel">Cargando oferta...</section> : <>
        <section className="panel tender-detail"><div className="section-heading"><h2>Datos de la oferta</h2><StatusBadge status={data.status} /></div><dl className="detail-grid">
          <dt>Oferta</dt><dd>{data.receiptCode ?? '-'}</dd>
          <dt>Licitacion</dt><dd>{data.tender ? displayTenderCode(data.tender.code) + ' - ' + data.tender.title : '-'}</dd>
          <dt>Proveedor</dt><dd>{data.supplier ? data.supplier.ruc + ' - ' + data.supplier.legalName : '-'}</dd>
          <dt>Enviada (PY)</dt><dd>{formatPyDateTime(data.submittedAt)}</dd>
          <dt>Total</dt><dd>{formatMoney(data.totalAmount, data.currency)}</dd>
          <dt>Condicion de pago</dt><dd>{data.paymentTerms ?? '-'}</dd>
          <dt>Plazo de entrega</dt><dd>{data.deliveryTerms ?? '-'}</dd>
          <dt>Precios con IVA</dt><dd>{data.vatIncludedAccepted ? 'Aceptado' : 'No registrado'}</dd>
        </dl></section>
        <section className="panel tender-detail"><h2>Items ofertados</h2>{data.items?.length ? <div className="detail-items-wrap"><table className="detail-items"><thead><tr><th>Item</th><th>Cantidad</th><th>Precio unitario</th><th>Total</th><th>Marca</th><th>Modelo</th><th>Aprobacion</th><th>Notas</th></tr></thead><tbody>{data.items.map((item) => <tr key={item.id}><td>{item.description ?? '-'}</td><td>{String(item.quantity)}</td><td>{formatMoney(item.unitPrice, data.currency)}</td><td>{formatMoney(item.total, data.currency)}</td><td>{item.brand ?? '-'}</td><td>{item.model ?? '-'}</td><td>{item.pendingApproval ? 'Pendiente' : 'Incluido en licitacion'}</td><td>{item.notes ?? '-'}</td></tr>)}</tbody></table></div> : <p>Sin items.</p>}</section>
      </>}
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
        <TenderSelector value={tenderId} onChange={(id) => setTenderId(id)} label="Licitacion" />
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
        { key: 'tender', header: 'Licitacion', render: (row) => row.tender?.code ? displayTenderCode(row.tender.code) : '-' },
        { key: 'supplier', header: 'Proveedor', render: (row) => row.supplierId },
        { key: 'total', header: 'Total', render: (row) => formatMoney(row.totalAmount as string | number | null | undefined, row.tender?.currency as string | undefined) },
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

interface DecisionSuggestion {
  kind: 'tender' | 'supplier' | 'bid'; id: string; label: string; code?: string; ruc?: string;
  tenderId?: string; tenderCode?: string; supplierId?: string; supplierRuc?: string; receiptCode?: string | null; amount?: number;
}

export function AwardCancelDesertPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, reset, setValue, watch } = useForm<{ tenderId: string; supplierId: string; bidId?: string; amount?: number; reason: string; mode: string }>();
  const [identifier, setIdentifier] = useState('');
  const [tenderDisplay, setTenderDisplay] = useState('');
  const [supplierDisplay, setSupplierDisplay] = useState('');
  const [bidDisplay, setBidDisplay] = useState('');
  const [resolveResult, setResolveResult] = useState<AwardResolveResponse | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<DecisionSuggestion[]>([]);
  const [suggestionField, setSuggestionField] = useState('');
  const decisionCurrency = resolveResult?.bid?.currency ?? resolveResult?.tender?.currency ?? 'PYG';
  const decisionAmount = watch('amount');
  const formattedDecisionAmount = decisionCurrency === 'USD' ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(decisionAmount) || 0) : new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(Math.round(Number(decisionAmount) || 0));

  async function loadSuggestions(value: string, field: string) {
    setSuggestionField(field);
    if (value.trim().length < 2) { setSuggestions([]); return; }
    const type = field === 'tender' ? 'tender' : field === 'supplier' ? 'supplier' : field === 'bid' ? 'bid' : 'all';
    try { setSuggestions(await api.get<DecisionSuggestion[]>('/awards/suggestions?q=' + encodeURIComponent(value.trim()) + '&type=' + type)); } catch { setSuggestions([]); }
  }
  function selectSuggestion(item: DecisionSuggestion) {
    if (item.kind === 'tender') { setValue('tenderId', item.id); const code = item.code ? displayTenderCode(item.code) : item.label; setTenderDisplay(code); setIdentifier(code); }
    if (item.kind === 'supplier') { setValue('supplierId', item.id); const ruc = item.ruc ?? item.label; setSupplierDisplay(ruc); setIdentifier(ruc); }
    if (item.kind === 'bid') { setValue('bidId', item.id); if (item.tenderId) setValue('tenderId', item.tenderId); const code = item.tenderCode ? displayTenderCode(item.tenderCode) : item.label; setTenderDisplay(code); if (item.supplierId) setValue('supplierId', item.supplierId); if (item.supplierRuc) setSupplierDisplay(item.supplierRuc); const receipt = item.receiptCode ?? item.label.split(' - ')[0]; setBidDisplay(receipt); if (item.amount !== undefined) setValue('amount', item.amount); setIdentifier(code); }
    setSuggestions([]); setSuggestionField('');
  }
  function suggestionMenu(field: string) {
    return suggestionField === field && suggestions.length > 0 ? <ul className="autocomplete-menu">{suggestions.map((item) => <li key={item.kind + item.id}><button type="button" onMouseDown={(event) => { event.preventDefault(); selectSuggestion(item); }}>{item.kind === 'tender' && item.code ? displayTenderCode(item.code) + ' - ' + item.label.replace(/^.*? - /, '') : item.kind === 'bid' && item.tenderCode ? item.label.replace(item.tenderCode, displayTenderCode(item.tenderCode)) : item.label}</button></li>)}</ul> : null;
  }

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
      setTenderDisplay('');
      setSupplierDisplay('');
      setBidDisplay('');
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
          setTenderDisplay(displayTenderCode(result.tender.code));
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

  function selectEligibleBid(bid: { id: string; totalAmount: string; supplier?: { id: string }; tender?: { id: string; code: string } }) {
    setValue('bidId', bid.id);
    if (bid.totalAmount) setValue('amount', Number(bid.totalAmount));
    if (bid.supplier?.id) setValue('supplierId', bid.supplier.id);
    if (bid.tender?.id) { setValue('tenderId', bid.tender.id); setTenderDisplay(displayTenderCode(bid.tender.code)); }
  }

  return (
    <>
      <PageHeader title="Adjudicar, cancelar o declarar desierta" />
      <section className="panel">
        <div className="search-field">
          <label>Buscar por ID/Codigo/RUC/Nombre</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="autocomplete-field"><input
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); void loadSuggestions(e.target.value, 'global'); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleResolve(); } }}
              placeholder="Ej: tenderCode, bidId, supplierRUC..."
            />{suggestionMenu('global')}</div>
            <button className="button primary" type="button" onClick={() => void handleResolve()} disabled={resolveLoading}>
              <Search size={16} /> Buscar
            </button>
          </div>
        </div>

        {resolveResult?.mode === 'single' && (
          <div className="resolve-preview">
            {resolveResult.tender && (
              <div className="preview-row"><strong>Licitacion:</strong> {displayTenderCode(resolveResult.tender.code)} - {resolveResult.tender.title}</div>
            )}
            {resolveResult.supplier && (
              <div className="preview-row"><strong>Proveedor:</strong> {resolveResult.supplier.legalName} (RUC: {resolveResult.supplier.ruc})</div>
            )}
            {resolveResult.bid && (
              <div className="preview-row"><strong>Oferta:</strong> {resolveResult.bid.id} - {resolveResult.bid.status} - {formatMoney(resolveResult.bid.totalAmount, resolveResult.bid.currency)}</div>
            )}
            {resolveResult.eligibleBids && resolveResult.eligibleBids.length > 0 && (
              <div>
                <strong>Ofertas elegibles:</strong>
                <ul className="bid-list">
                  {resolveResult.eligibleBids.map((b) => (
                    <li key={b.id} style={{ cursor: 'pointer' }} onClick={() => selectEligibleBid(b)}>
                      {b.tender && `${displayTenderCode(b.tender.code)} | `}
                      {b.supplier && `${b.supplier.legalName} | `}
                      {b.id.slice(0, 8)}... | {b.status} | {formatMoney(b.totalAmount, b.currency)}
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
          <label>Licitacion ID<input type="hidden" {...register('tenderId', { required: true })} /><div className="autocomplete-field"><input value={tenderDisplay} placeholder="Ej: 026-001" onChange={(event) => { setTenderDisplay(event.target.value); setValue('tenderId', ''); void loadSuggestions(event.target.value, 'tender'); }} />{suggestionMenu('tender')}</div></label>
          <label>Proveedor ID<input type="hidden" {...register('supplierId')} /><div className="autocomplete-field"><input value={supplierDisplay} placeholder="Ej: 80012345-6" onChange={(event) => { setSupplierDisplay(event.target.value); setValue('supplierId', ''); void loadSuggestions(event.target.value, 'supplier'); }} />{suggestionMenu('supplier')}</div></label>
          <label>Oferta ID<input type="hidden" {...register('bidId')} /><div className="autocomplete-field"><input value={bidDisplay} placeholder="Ej: REC-..." onChange={(event) => { setBidDisplay(event.target.value); setValue('bidId', ''); void loadSuggestions(event.target.value, 'bid'); }} />{suggestionMenu('bid')}</div></label>
          <label>Monto ({decisionCurrency === 'USD' ? 'USD' : 'Gs.'})<input type="text" inputMode={decisionCurrency === 'USD' ? 'decimal' : 'numeric'} value={formattedDecisionAmount} onChange={(event) => { const raw = decisionCurrency === 'USD' ? event.target.value.replace(/,/g, '') : event.target.value.replace(/\D/g, ''); setValue('amount', Number(raw) || 0, { shouldDirty: true }); }} aria-label={decisionCurrency === 'USD' ? 'Monto en USD' : 'Monto en guaranies'} /></label>
          <label className="full">Motivo<textarea {...register('reason', { required: true })} /></label>
          <div className="form-actions"><button className="button danger" type="submit">Registrar decision</button><button className="button ghost" type="button" onClick={() => navigate(-1)}>Cancelar</button></div>
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
        <TenderSelector value={tenderId} onChange={(id) => setTenderId(id)} label="Licitacion" />
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
  const [editingArea, setEditingArea] = useState<Row | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { data = [] } = useQuery({ queryKey: ['requesting-areas'], queryFn: () => api.get<Row[]>('/requesting-areas') });
  const { register, handleSubmit, reset, setValue } = useForm<{ name: string; code: string; description: string }>();
  const create = useMutation({ mutationFn: (values: { name: string; description: string }) => api.post('/requesting-areas', values), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['requesting-areas'] }); closeForm(); } });
  const update = useMutation({ mutationFn: ({id,values}:{id:string;values:{name:string;code:string;description:string}}) => api.patch('/requesting-areas/'+id,values), onSuccess: () => { queryClient.invalidateQueries({queryKey:['requesting-areas']}); closeForm(); } });
  const toggleStatus = useMutation({ mutationFn: ({id,status}:{id:string;status:string}) => api.patch('/requesting-areas/'+id,{status}), onSuccess:()=>queryClient.invalidateQueries({queryKey:['requesting-areas']}) });
  const remove = useMutation({ mutationFn:(id:string)=>api.delete('/requesting-areas/'+id),onSuccess:()=>queryClient.invalidateQueries({queryKey:['requesting-areas']}) });
  function closeForm(){setEditingArea(null);setShowForm(false);reset();}
  function startCreate(){setEditingArea(null);reset();setShowForm(true);}
  function startEdit(row:Row){setEditingArea(row);setValue('code',String(row.code??''));setValue('name',String(row.name??''));setValue('description',String(row.description??''));setShowForm(true);}
  return <><PageHeader title="Areas solicitantes" description="Administre las areas que solicitan licitaciones." actions={<button className="button primary" type="button" onClick={startCreate}><Plus size={16} /> Agregar area</button>} />
    {showForm && <section className="panel form-panel"><div className="section-heading"><div><h2>{editingArea ? 'Editar area' : 'Nueva area solicitante'}</h2></div><button className="button ghost" type="button" onClick={closeForm}><X size={16} /> Cancelar</button></div><form className="grid-form compact" onSubmit={handleSubmit((values)=>editingArea ? update.mutate({id:String(editingArea.id),values}) : create.mutate(values))}>{editingArea && <label>Codigo auditable<input {...register('code')} /></label>}<label>Nombre<input {...register('name',{required:true})} /></label><label className="full">Descripcion<input {...register('description')} /></label><button className="button primary" type="submit">{editingArea ? <><Check size={16} /> Guardar cambios</> : <><Plus size={16} /> Crear area</>}</button></form></section>}
    <DataTable rows={data} columns={[{key:'code',header:'Codigo',render:(row)=>String(row.code??'-')},{key:'name',header:'Nombre',render:(row)=>String(row.name)},{key:'description',header:'Descripcion',render:(row)=>String(row.description??'-')},{key:'status',header:'Estado',render:(row)=><StatusBadge status={String(row.status)} />},{key:'actions',header:'Acciones',render:(row)=><div className="row-actions"><button className="button ghost" type="button" onClick={()=>startEdit(row)}><Pencil size={16} /> Editar</button><button className="button ghost" type="button" onClick={()=>toggleStatus.mutate({id:String(row.id),status:row.status==='ACTIVA'?'INACTIVA':'ACTIVA'})}>{row.status==='ACTIVA'?<><X size={16} /> Inactivar</>:<><Check size={16} /> Activar</>}</button><button className="button danger" type="button" onClick={()=>{if(confirm('Anular area solicitante?'))remove.mutate(String(row.id));}}><Trash2 size={16} /> Anular</button></div>}]} />
  </>;
}

interface CatalogItem { id: string; name: string; }
function CatalogManagementPage({ title, endpoint, singular }: { title: string; endpoint: string; singular: string }) {
  const client=useQueryClient(); const [editing,setEditing]=useState<CatalogItem|null>(null); const [showForm,setShowForm]=useState(false);
  const {register,handleSubmit,reset}=useForm<{name:string}>(); const {data=[]}=useQuery({queryKey:[endpoint],queryFn:()=>api.get<CatalogItem[]>(endpoint)});
  const save=useMutation({mutationFn:(values:{name:string})=>editing?api.patch(endpoint+'/'+editing.id,values):api.post(endpoint,values),onSuccess:()=>{client.invalidateQueries({queryKey:[endpoint]});closeForm();}});
  const remove=useMutation({mutationFn:(id:string)=>api.delete(endpoint+'/'+id),onSuccess:()=>client.invalidateQueries({queryKey:[endpoint]})});
  function closeForm(){setEditing(null);setShowForm(false);reset();} function startCreate(){setEditing(null);reset();setShowForm(true);} function startEdit(item:CatalogItem){setEditing(item);reset({name:item.name});setShowForm(true);}
  return <><PageHeader title={title} actions={<div className="header-actions"><button className="button primary" type="button" onClick={startCreate}><Plus size={16} /> Agregar {singular.toLowerCase()}</button><Link className="button ghost" to="/internal/tenders">Volver a licitaciones</Link></div>} />
    {showForm && <section className="panel form-panel"><div className="section-heading"><h2>{editing ? 'Editar ' + singular.toLowerCase() : 'Nueva ' + singular.toLowerCase()}</h2><button className="button ghost" type="button" onClick={closeForm}><X size={16} /> Cancelar</button></div><form className="inline-form" onSubmit={handleSubmit((values)=>save.mutate(values))}><label>Nombre<input {...register('name',{required:true})} /></label><button className="button primary" type="submit" disabled={save.isPending}><Check size={16} /> Guardar</button></form></section>}
    {save.error && <p className="error-message">No se pudo guardar. Verifique que el nombre no este repetido.</p>}{remove.error && <p className="error-message">No se puede eliminar una opcion en uso.</p>}
    <DataTable rows={data} columns={[{key:'name',header:'Nombre',render:(row)=>row.name},{key:'actions',header:'Acciones',render:(row)=><div className="row-actions"><button className="button ghost" type="button" onClick={()=>startEdit(row)}><Pencil size={16} /> Editar</button><button className="button danger" type="button" onClick={()=>{if(confirm('Eliminar '+singular.toLowerCase()+'?'))remove.mutate(row.id);}} disabled={remove.isPending}><Trash2 size={16} /> Eliminar</button></div>}]} />
  </>;
}
export function TenderCategoriesPage(){return <CatalogManagementPage title="Modificar categorias" endpoint="/tender-categories" singular="Categoria" />;}
export function TenderBranchesPage(){return <CatalogManagementPage title="Modificar sucursales" endpoint="/tender-branches" singular="Sucursal" />;}
