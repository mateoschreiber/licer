import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { TenderSummary } from '../types';
import { displayTenderCode } from '../utils/format';

interface TenderSelectorProps {
  value: string;
  onChange: (id: string, tender?: TenderSummary) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export function TenderSelector({
  value,
  onChange,
  label = 'Licitación',
  required = false,
  placeholder = 'Buscar por código o título',
}: TenderSelectorProps) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ['tender-selector-options'],
    queryFn: () => api.get<TenderSummary[]>('/tenders?pageSize=100'),
  });

  useEffect(() => {
    if (!value) return;
    const selected = data.find((tender) => tender.id === value);
    if (selected) setText(displayTenderCode(selected.code));
  }, [data, value]);

  const matches = useMemo(() => {
    const term = text.trim().toLowerCase();
    if (!term) return [];
    return data
      .filter(
        (tender) =>
          tender.id.toLowerCase().includes(term) ||
          tender.code.toLowerCase().includes(term) ||
          displayTenderCode(tender.code).toLowerCase().includes(term) ||
          tender.title.toLowerCase().includes(term),
      )
      .slice(0, 10);
  }, [data, text]);

  function select(tender: TenderSummary) {
    setText(displayTenderCode(tender.code));
    setOpen(false);
    onChange(tender.id, tender);
  }

  return (
    <label>
      {label}
      <div className="autocomplete-field">
        <input
          value={text}
          required={required}
          placeholder={placeholder}
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
            {matches.map((tender) => (
              <li key={tender.id}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    select(tender);
                  }}
                >
                  <strong>{displayTenderCode(tender.code)}</strong> - {tender.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
}
