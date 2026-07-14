import { useEffect, useState } from 'react';
import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

interface PhoneInputProps { value?: string | null; country?: string | null; onChange: (value: string) => void; onCountryChange?: (country: string) => void; id?: string; }
const displayNames = new Intl.DisplayNames(['es'], { type: 'region' });
const countries = getCountries().map((code) => ({ code, prefix: '+' + getCountryCallingCode(code), label: displayNames.of(code) ?? code })).sort((a, b) => a.label.localeCompare(b.label, 'es'));
function validCountry(value?: string | null): CountryCode { return countries.some((item) => item.code === value) ? value as CountryCode : 'PY'; }
function nationalNumber(value: string | null | undefined, country: CountryCode) { const digits = String(value ?? '').replace(/\D/g, ''); const prefix = getCountryCallingCode(country); return digits.startsWith(prefix) ? digits.slice(prefix.length) : digits; }
export function PhoneInput({ value, country, onChange, onCountryChange, id }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('PY'); const [number, setNumber] = useState('');
  const prefix = '+' + getCountryCallingCode(selectedCountry); const maxLength = Math.max(1, 15 - prefix.length + 1);
  useEffect(() => { const next = validCountry(country); setSelectedCountry(next); setNumber(nationalNumber(value, next)); }, [value, country]);
  function changeCountry(next: CountryCode) { setSelectedCountry(next); onCountryChange?.(next); onChange('+' + getCountryCallingCode(next) + number.replace(/\D/g, '')); }
  function changeNumber(next: string) { const digits = next.replace(/\D/g, '').slice(0, maxLength); setNumber(digits); onChange(prefix + digits); }
  return <div className="phone-input"><select aria-label="Pais y prefijo" value={selectedCountry} onChange={(event) => changeCountry(event.target.value as CountryCode)}>{countries.map((item) => <option key={item.code} value={item.code}>{item.label} ({item.prefix})</option>)}</select><span className="phone-prefix" aria-hidden="true">{prefix}</span><input id={id} type="tel" inputMode="tel" autoComplete="tel-national" value={number} maxLength={maxLength} onChange={(event) => changeNumber(event.target.value)} placeholder="Numero" /></div>;
}
