import { describe, expect, it } from 'vitest';
import { displayTenderCode, formatMoney, formatPyDate } from './format';

describe('format utilities', () => {
  it('formats tender codes for display without changing other codes', () => {
    expect(displayTenderCode('PK-2026-001')).toBe('026-001');
    expect(displayTenderCode('LIC-001')).toBe('LIC-001');
    expect(displayTenderCode()).toBe('-');
  });

  it('formats monetary values by currency', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('USD 1,234.50');
    expect(formatMoney(1234.5, 'PYG')).toContain('1.235');
  });

  it('returns a placeholder for invalid dates', () => {
    expect(formatPyDate('invalid-date')).toBe('-');
  });
});
