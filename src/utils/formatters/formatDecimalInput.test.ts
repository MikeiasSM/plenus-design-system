import { formatDecimalInput } from './formatDecimalInput';

describe('formatDecimalInput', () => {
  it('keeps integer input when decimal scale is zero', () => {
    expect(formatDecimalInput('165789', 0)).toBe('165789');
    expect(formatDecimalInput('165789,50', 0)).toBe('165789');
  });

  it('preserves the comma as the decimal separator during typing', () => {
    expect(formatDecimalInput('165789,', 2)).toBe('165789,');
    expect(formatDecimalInput('165789,5', 2)).toBe('165789,5');
    expect(formatDecimalInput('165789,50', 2)).toBe('165789,50');
  });

  it('limits decimal places', () => {
    expect(formatDecimalInput('165789,507', 2)).toBe('165789,50');
  });

  it('removes unsupported characters and extra separators', () => {
    expect(formatDecimalInput('R$ 1.234,56', 2)).toBe('1234,56');
    expect(formatDecimalInput('12,34,56', 2)).toBe('12,34');
  });
});
