import { formatCurrencyInput } from './formatCurrencyInput';

describe('formatCurrencyInput', () => {
  it('formats integer input as Brazilian currency', () => {
    expect(formatCurrencyInput('165789')).toBe('R$ 165.789,00');
  });

  it('preserves and completes decimal input', () => {
    expect(formatCurrencyInput('165789,5')).toBe('R$ 165.789,50');
    expect(formatCurrencyInput('165789,50')).toBe('R$ 165.789,50');
  });

  it('supports another currency label without changing decimal rules', () => {
    expect(formatCurrencyInput('1234,5', 'USD')).toBe('USD 1.234,50');
  });

  it('formats empty input as zero', () => {
    expect(formatCurrencyInput('')).toBe('R$ 0,00');
  });
});
