import { formatFileSize } from './formatFileSize';

describe('formatFileSize', () => {
  it('escolhe a unidade em base 1024, com ate uma casa', () => {
    expect(formatFileSize(950)).toBe('950 B');
    expect(formatFileSize(512 * 1024)).toBe('512 KB');
    expect(formatFileSize(24.6 * 1024 ** 2)).toBe('24,6 MB');
    expect(formatFileSize(1.2 * 1024 ** 3)).toBe('1,2 GB');
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('sobe para a unidade seguinte o que arredonda para 1024 da anterior', () => {
    expect(formatFileSize(1023)).toBe('1.023 B');
    expect(formatFileSize(1024 ** 2 - 1)).toBe('1 MB');
  });

  it('acompanha a localidade e fixa as casas quando declaradas', () => {
    expect(formatFileSize(24.6 * 1024 ** 2, { locale: 'en-US' })).toBe('24.6 MB');
    expect(formatFileSize(5 * 1024 ** 2, { decimals: 2 })).toBe('5,00 MB');
    expect(formatFileSize(950, { decimals: 2 })).toBe('950 B');
  });

  it('devolve vazio para o que nao e um tamanho', () => {
    expect(formatFileSize(Number.NaN)).toBe('');
    expect(formatFileSize(-1)).toBe('');
  });
});
