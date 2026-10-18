import { formatarMoeda, formatarNumero } from '../../../utils/formatters';
import { deltaText, gaugeCenter, gaugeReading, gaugeValueText, type CenterLine } from './gaugeReading';
import { gaugeSegments, segmentAt } from './gaugeScale';

const percent = (valor: number) => `${formatarNumero(valor)}%`;
const currency = (valor: number) => formatarMoeda(valor, { compacto: true });
const exactCurrency = (valor: number) => formatarMoeda(valor, { casasDecimais: 0 });
const texts = (lines: readonly CenterLine[]) => lines.map((line) => line.text);

describe('gaugeReading', () => {
  it('liga a leitura contra a meta so quando uma das propriedades pede percentOfTarget', () => {
    const options = { base: 95, formatValue: percent };

    expect(gaugeReading({ ...options, segmentUnit: 'value', valueDisplay: 'value' }).againstTarget).toBe(false);
    expect(gaugeReading({ ...options, segmentUnit: 'percentOfTarget', valueDisplay: 'value' }).againstTarget).toBe(true);
    expect(gaugeReading({ ...options, segmentUnit: 'value', valueDisplay: 'percentOfTarget' }).showsPercent).toBe(true);
  });

  it('volta ao valor quando nao ha meta', () => {
    const reading = gaugeReading({ base: null, formatValue: percent, segmentUnit: 'percentOfTarget', valueDisplay: 'percentOfTarget' });

    expect(reading.againstTarget).toBe(false);
    expect(reading.showsPercent).toBe(false);
  });
});

describe('deltaText', () => {
  it('escreve o sinal e entrega o modulo ao formato', () => {
    const format = (variacao: number) => `${formatarNumero(variacao, { casasDecimais: 1 })} p.p.`;

    expect(deltaText({ format, value: 3.2 })).toBe('+3,2 p.p.');
    expect(deltaText({ format, value: -3.2 })).toBe('−3,2 p.p.');
    expect(deltaText({ value: 0 })).toBe('±0');
  });
});

describe('gaugeValueText', () => {
  const domain = { min: 0, max: 100 };
  const segments = gaugeSegments([{ to: 80, label: 'Crítico' }, { to: 90, label: 'Atenção' }, { label: 'Bom' }], domain, { unit: 1 });
  const reading = gaugeReading({ base: 95, formatValue: percent, segmentUnit: 'value', valueDisplay: 'value' });

  it('diz o valor, a faixa, a meta e a variacao', () => {
    const text = gaugeValueText({
      delta: { format: (v) => `${formatarNumero(v, { casasDecimais: 1 })} p.p.`, label: 'vs. setembro', value: 3.2 },
      domain,
      reading,
      segment: segmentAt(segments, 87.4),
      target: { value: 95 },
      value: 87.4,
    });

    expect(text).toBe('87,4%, faixa Atenção, meta 95%, variação +3,2 p.p. vs. setembro');
  });

  it('diz o valor real e o limite quando o valor sai da escala', () => {
    const text = gaugeValueText({ domain, reading, segment: segmentAt(segments, 100), value: 112 });

    expect(text).toBe('112%, acima do máximo de 100%, faixa Bom');
  });

  it('nomeia a meta pelo rotulo dela quando nao e Meta', () => {
    const text = gaugeValueText({ domain, reading, target: { label: 'SLO', value: 95 }, value: 50 });

    expect(text).toBe('50%, SLO 95%');
  });
});

describe('gaugeCenter', () => {
  const domain = { min: 0, max: 2_400_000 };
  const common = { compact: false, domain, emptyMessage: 'Sem dados', showCenter: true, status: 'value' as const };

  it('mostra o atingimento e a outra leitura na exibicao em percentual', () => {
    const reading = gaugeReading({ base: 2_000_000, formatTooltipValue: exactCurrency, formatValue: currency, segmentUnit: 'value', valueDisplay: 'percentOfTarget' });
    const center = gaugeCenter({ ...common, reading, value: 1_840_000 });

    expect(center.value).toBe('92%');
    expect(texts(center.lines)).toEqual([`${currency(1_840_000)} de ${currency(2_000_000)}`]);
  });

  it('avisa o fora da escala e, no compacto, o aviso vence o rotulo', () => {
    const reading = gaugeReading({ base: null, formatValue: percent, segmentUnit: 'value', valueDisplay: 'value' });
    const outside = { ...common, centerLabel: 'média', domain: { min: 0, max: 100 }, reading, value: 112 };

    expect(texts(gaugeCenter(outside).lines)).toEqual(['acima do máximo', 'média']);
    expect(texts(gaugeCenter({ ...outside, compact: true }).lines)).toEqual(['acima']);
  });
});
