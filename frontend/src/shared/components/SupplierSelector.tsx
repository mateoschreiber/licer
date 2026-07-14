import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

interface SupplierOption {
  id: string;
  ruc: string;
  legalName: string;
  tradeName?: string | null;
}

interface SupplierSelectorProps {
  value: string;
  onChange: (id: string, supplier?: SupplierOption) => void;
  label?: string;
}

export function SupplierSelector({
  value,
  onChange,
  label = 'Proveedor vinculado',
}: SupplierSelectorProps) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ['supplier-selector-options'],
    queryFn: () => api.get<SupplierOption[]>('/suppliers?pageSize=100'),
  });

  useEffect(() => {
    if (!value) {
      setText('');
      return;
    }
    const supplier = data.find((item) => item.id === value);
    if (supplier) setText(supplier.ruc + ' - ' + supplier.legalName);
  }, [data, value]);

  const matches = useMemo(() => {
    const term = text.trim().toLowerCase();
    if (!term) return [];
    return data
      .filter(
        (supplier) =>
          supplier.ruc.toLowerCase().includes(term) ||
          supplier.legalName.toLowerCase().includes(term) ||
          supplier.tradeName?.toLowerCase().includes(term),
      )
      .slice(0, 10);
  }, [data, text]);

  function select(supplier: SupplierOption) {
    setText(supplier.ruc + ' - ' + supplier.legalName);
    setOpen(false);
    onChange(supplier.id, supplier);
  }

  return (
    <label>
      {label}
      <div className="autocomplete-field">
        <input
          value={text}
          placeholder="Buscar por RUC o nombre"
          autoComplete="off"
          onFocus={() => setOpen(Boolean(text.trim()))}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            onChange('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && matches[0]) {
              event.preventDefault();
              select(matches[0]);
            }
          }}
        />
        {open && matches.length > 0 && (
          <ul className="autocomplete-menu">
            {matches.map((supplier) => (
              <li key={supplier.id}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    select(supplier);
                  }}
                >
                  <strong>{supplier.ruc}</strong> - {supplier.legalName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
}
