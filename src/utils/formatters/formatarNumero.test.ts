import { formatarMoeda, formatarNumero, formatarPercentual } from './formatarNumero';

/** O Intl separa simbolo e numero por espaco nao separavel; o teste compara pelo comum. */
function semEspacoEstreito(texto: string) {
  return texto.replace(/ /g, ' ');
}

describe('formatarNumero', () => {
  it('agrupa o milhar na convencao da localidade', () => {
    expect(formatarNumero(1234567.89)).toBe('1.234.567,89');
    expect(formatarNumero(1234567.89, { localidade: 'en-US' })).toBe('1,234,567.89');
  });

  it('fixa as casas decimais quando declaradas', () => {
    expect(formatarNumero(1234.5, { casasDecimais: 2 })).toBe('1.234,50');
    expect(formatarNumero(1234.567, { casasDecimais: 0 })).toBe('1.235');
  });

  it('compacta na forma da localidade, e nao num sufixo proprio', () => {
    expect(semEspacoEstreito(formatarNumero(1200, { compacto: true }))).toBe('1,2 mil');
    expect(formatarNumero(1200000, { compacto: true, localidade: 'en-US' })).toBe('1.2M');
  });

  it('compacta em sigla quando pedida, com o separador da localidade', () => {
    expect(formatarNumero(500000, { compacto: 'sigla' })).toBe('500 k');
    expect(formatarNumero(1500000, { compacto: 'sigla' })).toBe('1,5 M');
    expect(formatarNumero(-2300000000, { compacto: 'sigla' })).toBe('-2,3 B');
    expect(formatarNumero(950, { compacto: 'sigla' })).toBe('950');
    expect(formatarNumero(1234567, { casasDecimais: 2, compacto: 'sigla' })).toBe('1,23 M');
    expect(formatarNumero(1500000, { compacto: 'sigla', localidade: 'en-US' })).toBe('1.5 M');
  });

  it('sobe para a sigla seguinte o que arredonda para mil da anterior', () => {
    expect(formatarNumero(999950, { compacto: 'sigla' })).toBe('1 M');
    expect(formatarNumero(999.7, { compacto: 'sigla' })).toBe('1 k');
  });

  it('nao poe sinal no zero negativo nem no que arredonda para zero', () => {
    expect(formatarNumero(-0)).toBe('0');
    expect(formatarNumero(-0.0001, { casasDecimais: 2 })).toBe('0,00');
    expect(formatarMoeda(-0.001)).toMatch(/^R\$\s0,00$/);
    expect(formatarPercentual(-0.001)).toBe('0%');
  });

  it('devolve vazio para o que nao e numero finito', () => {
    expect(formatarNumero(Number.NaN)).toBe('');
    expect(formatarNumero(Number.POSITIVE_INFINITY)).toBe('');
  });
});

describe('formatarMoeda', () => {
  it('usa a moeda e a localidade informadas', () => {
    expect(semEspacoEstreito(formatarMoeda(1500.5))).toBe('R$ 1.500,50');
    expect(formatarMoeda(1500.5, { localidade: 'en-US', moeda: 'USD' })).toBe('$1,500.50');
  });

  it('deixa a moeda decidir as casas quando nao sao declaradas', () => {
    expect(semEspacoEstreito(formatarMoeda(1500))).toBe('R$ 1.500,00');
    expect(semEspacoEstreito(formatarMoeda(1500, { casasDecimais: 0 }))).toBe('R$ 1.500');
  });

  it('compacta o valor monetario', () => {
    expect(semEspacoEstreito(formatarMoeda(6700000, { compacto: true }))).toBe('R$ 6,7 mi');
    expect(semEspacoEstreito(formatarMoeda(512340, { compacto: 'sigla' }))).toBe('R$ 512 k');
  });

  it('devolve vazio para o que nao e numero finito', () => {
    expect(formatarMoeda(Number.NaN)).toBe('');
  });
});

describe('formatarPercentual', () => {
  it('recebe a fracao, nao o numero ja multiplicado', () => {
    expect(formatarPercentual(0.42)).toBe('42%');
    expect(formatarPercentual(1)).toBe('100%');
  });

  it('arredonda para inteiro por padrao, e abre casas quando pedido', () => {
    expect(formatarPercentual(0.4237)).toBe('42%');
    expect(formatarPercentual(0.4237, { casasDecimais: 1 })).toBe('42,4%');
  });

  it('acompanha a localidade no separador decimal', () => {
    expect(formatarPercentual(0.425, { casasDecimais: 1, localidade: 'en-US' })).toBe('42.5%');
  });

  it('devolve vazio para o que nao e numero finito', () => {
    expect(formatarPercentual(Number.NaN)).toBe('');
  });
});
