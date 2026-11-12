import { formatCurrency, formatNumber, formatPercent } from './formatNumber';

/** O Intl separa simbolo e numero por espaco nao separavel; o teste compara pelo comum. */
function semEspacoEstreito(texto: string) {
  return texto.replace(/ /g, ' ');
}

describe('formatNumber', () => {
  it('agrupa o milhar na convencao da localidade', () => {
    expect(formatNumber(1234567.89)).toBe('1.234.567,89');
    expect(formatNumber(1234567.89, { locale: 'en-US' })).toBe('1,234,567.89');
  });

  it('fixa as casas decimais quando declaradas', () => {
    expect(formatNumber(1234.5, { decimals: 2 })).toBe('1.234,50');
    expect(formatNumber(1234.567, { decimals: 0 })).toBe('1.235');
  });

  it('compacta na forma da localidade, e nao num sufixo proprio', () => {
    expect(semEspacoEstreito(formatNumber(1200, { compact: true }))).toBe('1,2 mil');
    expect(formatNumber(1200000, { compact: true, locale: 'en-US' })).toBe('1.2M');
  });

  it('compacta em sigla quando pedida, com o separador da localidade', () => {
    expect(formatNumber(500000, { compact: 'symbol' })).toBe('500 k');
    expect(formatNumber(1500000, { compact: 'symbol' })).toBe('1,5 M');
    expect(formatNumber(-2300000000, { compact: 'symbol' })).toBe('-2,3 B');
    expect(formatNumber(950, { compact: 'symbol' })).toBe('950');
    expect(formatNumber(1234567, { decimals: 2, compact: 'symbol' })).toBe('1,23 M');
    expect(formatNumber(1500000, { compact: 'symbol', locale: 'en-US' })).toBe('1.5 M');
  });

  it('sobe para a sigla seguinte o que arredonda para mil da anterior', () => {
    expect(formatNumber(999950, { compact: 'symbol' })).toBe('1 M');
    expect(formatNumber(999.7, { compact: 'symbol' })).toBe('1 k');
  });

  it('nao poe sinal no zero negativo nem no que arredonda para zero', () => {
    expect(formatNumber(-0)).toBe('0');
    expect(formatNumber(-0.0001, { decimals: 2 })).toBe('0,00');
    expect(formatCurrency(-0.001)).toMatch(/^R\$\s0,00$/);
    expect(formatPercent(-0.001)).toBe('0%');
  });

  it('devolve vazio para o que nao e numero finito', () => {
    expect(formatNumber(Number.NaN)).toBe('');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('');
  });
});

describe('formatCurrency', () => {
  it('usa a moeda e a localidade informadas', () => {
    expect(semEspacoEstreito(formatCurrency(1500.5))).toBe('R$ 1.500,50');
    expect(formatCurrency(1500.5, { locale: 'en-US', currency: 'USD' })).toBe('$1,500.50');
  });

  it('deixa a moeda decidir as casas quando nao sao declaradas', () => {
    expect(semEspacoEstreito(formatCurrency(1500))).toBe('R$ 1.500,00');
    expect(semEspacoEstreito(formatCurrency(1500, { decimals: 0 }))).toBe('R$ 1.500');
  });

  it('compacta o valor monetario', () => {
    expect(semEspacoEstreito(formatCurrency(6700000, { compact: true }))).toBe('R$ 6,7 mi');
    expect(semEspacoEstreito(formatCurrency(512340, { compact: 'symbol' }))).toBe('R$ 512 k');
  });

  it('devolve vazio para o que nao e numero finito', () => {
    expect(formatCurrency(Number.NaN)).toBe('');
  });
});

describe('formatPercent', () => {
  it('recebe a fracao, nao o numero ja multiplicado', () => {
    expect(formatPercent(0.42)).toBe('42%');
    expect(formatPercent(1)).toBe('100%');
  });

  it('arredonda para inteiro por padrao, e abre casas quando pedido', () => {
    expect(formatPercent(0.4237)).toBe('42%');
    expect(formatPercent(0.4237, { decimals: 1 })).toBe('42,4%');
  });

  it('acompanha a localidade no separador decimal', () => {
    expect(formatPercent(0.425, { decimals: 1, locale: 'en-US' })).toBe('42.5%');
  });

  it('devolve vazio para o que nao e numero finito', () => {
    expect(formatPercent(Number.NaN)).toBe('');
  });
});
