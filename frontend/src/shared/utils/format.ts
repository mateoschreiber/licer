export function displayTenderCode(code?: string | null) {
  if (!code) return '-';
  const parts = code.split('-');
  return parts.length === 3 && parts[0] === 'PK'
    ? parts[1].slice(-3) + '-' + parts[2]
    : code;
}

const pyDate = new Intl.DateTimeFormat('es-PY', {
  timeZone: 'America/Asuncion',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const pyDateTime = new Intl.DateTimeFormat('es-PY', {
  timeZone: 'America/Asuncion',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatPyDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : pyDate.format(date);
}

export function formatPyDateTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : pyDateTime.format(date) + ' h';
}


export function formatMoney(value?: string | number | null, currency?: string | null) {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(amount)) return '-';
  if (String(currency).toUpperCase() === 'USD') {
    return 'USD ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }
  return 'Gs. ' + new Intl.NumberFormat('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount));
}
