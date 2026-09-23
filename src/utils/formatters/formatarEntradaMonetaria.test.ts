import { formatarEntradaMonetaria } from './formatarEntradaMonetaria';

describe('formatarEntradaMonetaria', () => {
  it('formata valores inteiros como moeda brasileira', () => {
    expect(formatarEntradaMonetaria('165789')).toBe('R$ 165.789,00');
  });

  it('preserva e completa os centavos', () => {
    expect(formatarEntradaMonetaria('165789,5')).toBe('R$ 165.789,50');
    expect(formatarEntradaMonetaria('165789,50')).toBe('R$ 165.789,50');
  });

  it('aceita outra moeda sem alterar a regra decimal', () => {
    expect(formatarEntradaMonetaria('1234,5', 'USD')).toBe('USD 1.234,50');
  });

  it('formata a entrada vazia como zero', () => {
    expect(formatarEntradaMonetaria('')).toBe('R$ 0,00');
  });

  it('omite os centavos quando nao ha casas decimais', () => {
    expect(formatarEntradaMonetaria('1234', 'BRL', 0)).toBe('R$ 1.234');
  });

  it('converte o ponto decimal de valores numericos', () => {
    expect(formatarEntradaMonetaria(1234.5)).toBe('R$ 1.234,50');
  });

  it('preserva o sinal negativo', () => {
    expect(formatarEntradaMonetaria('-50')).toBe('-R$ 50,00');
  });
});
