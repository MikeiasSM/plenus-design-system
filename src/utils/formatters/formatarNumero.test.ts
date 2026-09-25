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
