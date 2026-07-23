import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../shared/api/client';
import { confirmAction } from '../../shared/components/FeedbackHost';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';

interface CatalogItem {
  id: string;
  name: string;
}

function CatalogManagementPage({
  title,
  endpoint,
  singular,
}: {
  title: string;
  endpoint: string;
  singular: string;
}) {
  const client = useQueryClient();
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ name: string }>();
  const { data = [] } = useQuery({
    queryKey: [endpoint],
    queryFn: () => api.get<CatalogItem[]>(endpoint),
  });
  const save = useMutation({
    mutationFn: (values: { name: string }) =>
      editing ? api.patch(endpoint + '/' + editing.id, values) : api.post(endpoint, values),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [endpoint] });
      closeForm();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(endpoint + '/' + id),
    onSuccess: () => client.invalidateQueries({ queryKey: [endpoint] }),
  });
  function closeForm() {
    setEditing(null);
    setShowForm(false);
    reset();
  }
  function startCreate() {
    setEditing(null);
    reset();
    setShowForm(true);
  }
  function startEdit(item: CatalogItem) {
    setEditing(item);
    reset({ name: item.name });
    setShowForm(true);
  }
  return (
    <>
      <PageHeader
        title={title}
        actions={
          <div className="header-actions">
            <button className="button primary" type="button" onClick={startCreate}>
              <Plus size={16} /> Agregar {singular.toLowerCase()}
            </button>
            <Link className="button ghost" to="/internal/tenders">
              Volver a licitaciones
            </Link>
          </div>
        }
      />
      {showForm && (
        <section className="panel form-panel">
          <div className="section-heading">
            <h2>
              {editing ? 'Editar ' + singular.toLowerCase() : 'Nueva ' + singular.toLowerCase()}
            </h2>
            <button className="button ghost" type="button" onClick={closeForm}>
              <X size={16} /> Cancelar
            </button>
          </div>
          <form className="inline-form" onSubmit={handleSubmit((values) => save.mutate(values))}>
            <label>
              Nombre
              <input {...register('name', { required: true })} />
            </label>
            <button className="button primary" type="submit" disabled={save.isPending}>
              <Check size={16} /> Guardar
            </button>
          </form>
        </section>
      )}
      {save.error && (
        <p className="error-message">
          No se pudo guardar. Verifique que el nombre no este repetido.
        </p>
      )}
      {remove.error && <p className="error-message">No se puede eliminar una opcion en uso.</p>}
      <DataTable
        rows={data}
        columns={[
          { key: 'name', header: 'Nombre', render: (row) => row.name },
          {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
              <div className="row-actions">
                <button className="button ghost" type="button" onClick={() => startEdit(row)}>
                  <Pencil size={16} /> Editar
                </button>
                <button
                  className="button danger"
                  type="button"
                  onClick={() => {
                    void confirmAction({
                      title: 'Eliminar ' + singular.toLowerCase(),
                      message: 'Esta opción dejará de estar disponible.',
                      confirmLabel: 'Eliminar',
                      tone: 'danger',
                    }).then((confirmed) => confirmed && remove.mutate(row.id));
                  }}
                  disabled={remove.isPending}
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}

export function TenderCategoriesPage() {
  return (
    <CatalogManagementPage
      title="Modificar categorías"
      endpoint="/tender-categories"
      singular="Categoría"
    />
  );
}

export function TenderBranchesPage() {
  return (
    <CatalogManagementPage
      title="Modificar sucursales"
      endpoint="/tender-branches"
      singular="Sucursal"
    />
  );
}
