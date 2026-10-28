import { formatCurrencyInput } from './formatCurrencyInput';

describe('formatCurrencyInput', () => {
  it('formata valores inteiros como moeda brasileira', () => {
    expect(formatCurrencyInput('165789')).toBe('R$ 165.789,00');
  });

  it('preserva e completa os centavos', () => {
    expect(formatCurrencyInput('165789,5')).toBe('R$ 165.789,50');
    expect(formatCurrencyInput('165789,50')).toBe('R$ 165.789,50');
  });

  it('aceita outra moeda sem alterar a regra decimal, com o simbolo dela', () => {
    expect(formatCurrencyInput('1234,5', 'USD')).toBe('US$ 1.234,50');
    expect(formatCurrencyInput('1234,5', 'XYZ1')).toBe('XYZ1 1.234,50');
  });

  it('formata a entrada vazia como zero', () => {
    expect(formatCurrencyInput('')).toBe('R$ 0,00');
  });

  it('omite os centavos quando nao ha casas decimais', () => {
    expect(formatCurrencyInput('1234', 'BRL', 0)).toBe('R$ 1.234');
  });

  it('converte o ponto decimal de valores numericos', () => {
    expect(formatCurrencyInput(1234.5)).toBe('R$ 1.234,50');
  });

  it('preserva o sinal negativo', () => {
    expect(formatCurrencyInput('-50')).toBe('-R$ 50,00');
  });
});
