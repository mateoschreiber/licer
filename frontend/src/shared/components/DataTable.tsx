import { ReactNode, useEffect, useMemo, useState } from 'react';
import { EmptyState, Pagination } from './UiPrimitives';

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
  pageSize?: number;
  paginate?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  emptyText = 'Sin datos',
  label = 'Listado de resultados',
  pageSize = 12,
  paginate = true,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visibleRows = useMemo(
    () => (paginate ? rows.slice((page - 1) * pageSize, page * pageSize) : rows),
    [page, pageSize, paginate, rows],
  );

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
          {visibleRows.map((row, index) => {
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
      {paginate && pageCount > 1 ? (
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      ) : null}
    </div>
  );
}
