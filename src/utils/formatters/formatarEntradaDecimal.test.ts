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

  it('le o ponto como decimal quando ele nao forma grupo de milhar', () => {
    // Teclado numerico e texto colado de origem inglesa mandam ponto. Descartar
    // sem olhar multiplicava o valor por dez ou por cem.
    expect(formatarEntradaDecimal('12.5', 2)).toBe('12,5');
    expect(formatarEntradaDecimal('12.50', 2)).toBe('12,50');
    expect(formatarEntradaDecimal('12.50', 0)).toBe('12');
    expect(formatarEntradaDecimal('0.99', 2)).toBe('0,99');
  });

  it('le o ponto como milhar quando ele forma grupo, que e a convencao daqui', () => {
    expect(formatarEntradaDecimal('1.234', 2)).toBe('1234');
    expect(formatarEntradaDecimal('1.234.567', 2)).toBe('1234567');
  });

  it('arredonda o numero que vem pronto, em vez de trunca-lo', () => {
    expect(formatarEntradaDecimal(12.345, 2)).toBe('12,35');
    expect(formatarEntradaDecimal(19.999, 2)).toBe('20');
    expect(formatarEntradaDecimal(12.344, 2)).toBe('12,34');
  });

  it('nao deixa notacao exponencial virar digito', () => {
    expect(formatarEntradaDecimal(1e-7, 2)).toBe('0');
    expect(formatarEntradaDecimal(1e21, 0)).toBe('1000000000000000000000');
  });

  it('trunca o que ainda esta sendo digitado, que e outra coisa', () => {
    expect(formatarEntradaDecimal('165789,507', 2)).toBe('165789,50');
  });

  it('preserva o sinal negativo', () => {
    expect(formatarEntradaDecimal('-50', 2)).toBe('-50');
    expect(formatarEntradaDecimal(-12.34, 2)).toBe('-12,34');
  });
});
