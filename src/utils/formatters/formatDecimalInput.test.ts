import { formatDecimalDraft, formatDecimalInput } from './formatDecimalInput';

describe('formatDecimalInput', () => {
  it('mantem o valor inteiro quando nao ha casas decimais', () => {
    expect(formatDecimalInput('165789', 0)).toBe('165789');
    expect(formatDecimalInput('165789,50', 0)).toBe('165789');
  });

  it('preserva a virgula como separador durante a digitacao', () => {
    expect(formatDecimalInput('165789,', 2)).toBe('165789,');
    expect(formatDecimalInput('165789,5', 2)).toBe('165789,5');
    expect(formatDecimalInput('165789,50', 2)).toBe('165789,50');
  });

  it('limita as casas decimais', () => {
    expect(formatDecimalInput('165789,507', 2)).toBe('165789,50');
  });

  it('remove caracteres nao suportados e separadores excedentes', () => {
    expect(formatDecimalInput('R$ 1.234,56', 2)).toBe('1234,56');
    expect(formatDecimalInput('12,34,56', 2)).toBe('12,34');
  });

  it('converte o ponto decimal de valores numericos', () => {
    expect(formatDecimalInput(12.34, 2)).toBe('12,34');
    expect(formatDecimalInput(1234.5, 2)).toBe('1234,5');
    expect(formatDecimalInput(12.34, 0)).toBe('12');
  });

  it('le o ponto como decimal quando ele nao forma grupo de milhar', () => {
    // Teclado numerico e texto colado de origem inglesa mandam ponto. Descartar
    // sem olhar multiplicava o valor por dez ou por cem.
    expect(formatDecimalInput('12.5', 2)).toBe('12,5');
    expect(formatDecimalInput('12.50', 2)).toBe('12,50');
    expect(formatDecimalInput('12.50', 0)).toBe('12');
    expect(formatDecimalInput('0.99', 2)).toBe('0,99');
  });

  it('le o ponto como milhar quando ele forma grupo, que e a convencao daqui', () => {
    expect(formatDecimalInput('1.234', 2)).toBe('1234');
    expect(formatDecimalInput('1.234.567', 2)).toBe('1234567');
  });

  it('le como decimal o ponto que vem depois de zero, que nao separa milhar', () => {
    expect(formatDecimalInput('0.125', 3)).toBe('0,125');
    expect(formatDecimalInput('0.500', 2)).toBe('0,50');
    expect(formatDecimalInput('.500', 2)).toBe(',50');
  });

  it('arredonda o numero que vem pronto, em vez de trunca-lo', () => {
    expect(formatDecimalInput(12.345, 2)).toBe('12,35');
    expect(formatDecimalInput(19.999, 2)).toBe('20');
    expect(formatDecimalInput(12.344, 2)).toBe('12,34');
  });

  it('nao deixa notacao exponencial virar digito', () => {
    expect(formatDecimalInput(1e-7, 2)).toBe('0');
    expect(formatDecimalInput(1e21, 0)).toBe('1000000000000000000000');
  });

  it('trunca o que ainda esta sendo digitado, que e outra coisa', () => {
    expect(formatDecimalInput('165789,507', 2)).toBe('165789,50');
  });

  it('preserva o sinal negativo', () => {
    expect(formatDecimalInput('-50', 2)).toBe('-50');
    expect(formatDecimalInput(-12.34, 2)).toBe('-12,34');
  });
});

describe('formatDecimalDraft', () => {
  it('mantem como digitado o ponto que a proxima tecla ainda pode fazer milhar', () => {
    expect(formatDecimalDraft('1.', 2)).toBe('1.');
    expect(formatDecimalDraft('1.2', 2)).toBe('1.2');
    expect(formatDecimalDraft('1.23', 1)).toBe('1.23');
    expect(formatDecimalDraft('-1.2', 2)).toBe('-1.2');
  });

  it('entrega o valor quando o papel do ponto ja esta decidido', () => {
    expect(formatDecimalDraft('1.234', 2)).toBe('1234');
    expect(formatDecimalDraft('1.2,5', 2)).toBe('12,5');
    expect(formatDecimalDraft('0.5', 2)).toBe('0,5');
    expect(formatDecimalDraft('12.5055', 2)).toBe('12,50');
  });

  it('nao guarda ponto no modo inteiro, onde ele nunca e decimal', () => {
    expect(formatDecimalDraft('1.', 0)).toBe('1');
  });
});
