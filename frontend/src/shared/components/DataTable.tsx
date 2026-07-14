import { ReactNode } from 'react';
import { EmptyState } from './UiPrimitives';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyText?: string;
  label?: string;
}

export function DataTable<T>({
  columns,
  rows,
  emptyText = 'Sin datos',
  label = 'Listado de resultados',
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="table-shell">
        <EmptyState
          title={emptyText}
          description="No hay registros para mostrar con los criterios actuales."
        />
      </div>
    );
  }

  return (
    <div className="table-shell">
      <table aria-label={label}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const id = (row as { id?: unknown }).id;
            return (
              <tr key={typeof id === 'string' ? id : index}>
                {columns.map((column) => (
                  <td key={column.key} data-label={column.header}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
