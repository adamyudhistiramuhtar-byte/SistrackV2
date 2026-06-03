import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../utils/formatCurrency';

describe('formatCurrency - IMP-014', () => {
  it('should format number to IDR format correctly', () => {
    expect(formatCurrency(15000)).toBe('Rp 15.000');
    expect(formatCurrency(1250000)).toBe('Rp 1.250.000');
  });

  it('should handle zero correctly', () => {
    expect(formatCurrency(0)).toBe('Rp 0');
  });

  it('should handle undefined or null', () => {
    expect(formatCurrency(undefined)).toBe('Rp 0');
    expect(formatCurrency(null)).toBe('Rp 0');
  });
});
