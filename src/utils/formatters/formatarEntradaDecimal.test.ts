import { formatarEntradaDecimal } from './formatarEntradaDecimal';

describe('formatarEntradaDecimal', () => {
  it('mantem o valor inteiro quando nao ha casas decimais', () => {
    expect(formatarEntradaDecimal('165789', 0)).toBe('165789');
    expect(formatarEntradaDecimal('165789,50', 0)).toBe('165789');
  });

  it('preserva a virgula como separador durante a digitacao', () => {
    expect(formatarEntradaDecimal('165789,', 2)).toBe('165789,');
    expect(formatarEntradaDecimal('165789,5', 2)).toBe('165789,5');
    expect(formatarEntradaDecimal('165789,50', 2)).toBe('165789,50');
  });

  it('limita as casas decimais', () => {
    expect(formatarEntradaDecimal('165789,507', 2)).toBe('165789,50');
  });

  it('remove caracteres nao suportados e separadores excedentes', () => {
    expect(formatarEntradaDecimal('R$ 1.234,56', 2)).toBe('1234,56');
    expect(formatarEntradaDecimal('12,34,56', 2)).toBe('12,34');
  });

  it('converte o ponto decimal de valores numericos', () => {
    expect(formatarEntradaDecimal(12.34, 2)).toBe('12,34');
    expect(formatarEntradaDecimal(1234.5, 2)).toBe('1234,5');
    expect(formatarEntradaDecimal(12.34, 0)).toBe('12');
  });

  it('preserva o sinal negativo', () => {
    expect(formatarEntradaDecimal('-50', 2)).toBe('-50');
    expect(formatarEntradaDecimal(-12.34, 2)).toBe('-12,34');
  });
});
