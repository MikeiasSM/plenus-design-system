import { formatarTamanhoDeArquivo } from './formatarTamanhoDeArquivo';

describe('formatarTamanhoDeArquivo', () => {
  it('escolhe a unidade em base 1024, com ate uma casa', () => {
    expect(formatarTamanhoDeArquivo(950)).toBe('950 B');
    expect(formatarTamanhoDeArquivo(512 * 1024)).toBe('512 KB');
    expect(formatarTamanhoDeArquivo(24.6 * 1024 ** 2)).toBe('24,6 MB');
    expect(formatarTamanhoDeArquivo(1.2 * 1024 ** 3)).toBe('1,2 GB');
    expect(formatarTamanhoDeArquivo(0)).toBe('0 B');
  });

  it('sobe para a unidade seguinte o que arredonda para 1024 da anterior', () => {
    expect(formatarTamanhoDeArquivo(1023)).toBe('1.023 B');
    expect(formatarTamanhoDeArquivo(1024 ** 2 - 1)).toBe('1 MB');
  });

  it('acompanha a localidade e fixa as casas quando declaradas', () => {
    expect(formatarTamanhoDeArquivo(24.6 * 1024 ** 2, { localidade: 'en-US' })).toBe('24.6 MB');
    expect(formatarTamanhoDeArquivo(5 * 1024 ** 2, { casasDecimais: 2 })).toBe('5,00 MB');
    expect(formatarTamanhoDeArquivo(950, { casasDecimais: 2 })).toBe('950 B');
  });

  it('devolve vazio para o que nao e um tamanho', () => {
    expect(formatarTamanhoDeArquivo(Number.NaN)).toBe('');
    expect(formatarTamanhoDeArquivo(-1)).toBe('');
  });
});
