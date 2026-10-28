import { act, fireEvent, render, screen } from '@testing-library/react';
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import { ChartGauge, type ChartGaugeProps, type ChartGaugeSegment } from './ChartGauge';
import styles from './ChartGauge.module.css';

const percent = (value: number) => `${formatNumber(value)}%`;
const currency = (value: number) => formatCurrency(value, { compact: true });
const exactCurrency = (value: number) => formatCurrency(value, { decimals: 0 });

const slaSegments: ChartGaugeSegment[] = [
  { to: 80, intent: 'negative', label: 'Crítico' },
  { to: 90, intent: 'warning', label: 'Atenção' },
  { intent: 'positive', label: 'Bom' },
];

const goalSegments: ChartGaugeSegment[] = [
  { to: 0.7, intent: 'negative', label: 'Crítica' },
  { to: 1, intent: 'warning', label: 'Atenção' },
  { intent: 'positive', label: 'Atingida' },
];

function sla(props: Partial<ChartGaugeProps> = {}) {
  return (
    <ChartGauge
      delta={{ format: (v) => `${formatNumber(v, { decimals: 1 })} p.p.`, label: 'vs. setembro', value: 3.2 }}
      formatValue={percent}
      max={100}
      segments={slaSegments}
      target={{ value: 95 }}
      title="SLA de atendimento"
      value={87.4}
      {...props}
    />
  );
}

function revenue(props: Partial<ChartGaugeProps> = {}) {
  return (
    <ChartGauge
      formatTooltipValue={exactCurrency}
      formatValue={currency}
      segmentUnit="percentOfTarget"
      segments={goalSegments}
      target={{ value: 2_000_000 }}
      title="Faturamento de outubro"
      value={1_840_000}
      {...props}
    />
  );
}

const byClass = (name: string) => [...document.querySelectorAll(`.${name}`)];
const fillPath = () => document.querySelector(`.${styles.fill}`)?.getAttribute('d') ?? null;
const centerTexts = () => [...document.querySelectorAll(`.${styles.center} text`)].map((node) => node.textContent);
const firstPoint = (path: string | null) => (path ?? '').match(/^M(-?[\d.e-]+),(-?[\d.e-]+)/)!.slice(1).map(Number);

describe('ChartGauge', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 360 });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 240 });
  });
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('e um medidor nomeado pelo titulo, com o valor, a faixa, a meta e a variacao, sem parada de Tab', () => {
    render(sla());
    const meter = screen.getByRole('meter', { name: 'SLA de atendimento' });

    expect(meter).toHaveAttribute('aria-valuenow', '87.4');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuetext', '87,4%, faixa Atenção, meta 95%, variação +3,2 p.p. vs. setembro');
    expect(meter).not.toHaveAttribute('tabindex');
  });

  it('troca a frase montada pela do consumidor', () => {
    render(sla({ ariaValueText: 'Dentro do combinado' }));

    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'Dentro do combinado');
  });

  it('satura fora da escala: o valor ARIA fica preso e o texto e o centro avisam o real', () => {
    render(sla({ delta: undefined, target: undefined, value: 112 }));
    const meter = screen.getByRole('meter');

    expect(meter).toHaveAttribute('aria-valuenow', '100');
    expect(meter).toHaveAttribute('aria-valuetext', '112%, acima do máximo de 100%, faixa Bom');
    expect(centerTexts()).toEqual(['112%', '▲ acima do máximo']);
  });

  it('desenha uma faixa por limite e, com colorBySegment, pinta o arco pela faixa do valor', () => {
    const { rerender } = render(sla());

    expect(byClass(styles.segment)).toHaveLength(3);
    expect(document.querySelector(`.${styles.fill}`)).toHaveAttribute('fill', 'var(--pl-chart-series-1)');

    rerender(sla({ colorBySegment: true }));
    expect(document.querySelector(`.${styles.fill}`)).toHaveAttribute('fill', 'var(--pl-chart-warning)');
  });

  it('parte do zero quando a escala o cruza, e marca a origem', () => {
    render(
      <ChartGauge endAngle={120} max={100} min={-100} startAngle={-120} title="NPS do trimestre" trackRadius={0} value={42} />,
    );
    const [x] = firstPoint(fillPath());

    expect(Math.abs(x)).toBeLessThan(1e-6);
    expect(byClass(styles.originMark)).toHaveLength(1);
  });

  it('marca a meta no arco, com o rotulo e o valor dela', () => {
    render(sla({ target: { label: 'SLO', value: 95 } }));

    expect(byClass(styles.targetLine)).toHaveLength(1);
    expect(screen.getByText('SLO 95%')).toBeInTheDocument();
  });

  it('mostra no centro o valor, o rotulo e a variacao com seta', () => {
    render(sla({ centerLabel: 'chamados no prazo' }));

    expect(centerTexts()).toEqual(['87,4%', 'chamados no prazo', '▲ +3,2 p.p. vs. setembro']);
  });

  it('so le contra a meta quando pedido: o SLA nao ganha atingimento', () => {
    render(sla({ centerLabel: undefined, delta: undefined }));

    expect(centerTexts()).toEqual(['87,4%']);
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).not.toContain('da meta');
  });

  it('na meta monetaria em percentual, mostra o atingimento e diz as duas leituras', () => {
    render(revenue({ valueDisplay: 'percentOfTarget' }));
    const meter = screen.getByRole('meter');

    expect(meter).toHaveAttribute('aria-valuemax', '2400000');
    expect(meter).toHaveAttribute(
      'aria-valuetext',
      `92% da meta, ${exactCurrency(1_840_000)} de ${exactCurrency(2_000_000)}, faixa Atenção`,
    );
    expect(centerTexts()).toEqual(['92%', `${currency(1_840_000)} de ${currency(2_000_000)}`]);
  });

  it('na meta monetaria em moeda, mostra o valor e o atingimento como segunda leitura', () => {
    render(revenue({ valueDisplay: 'value' }));

    expect(screen.getByRole('meter')).toHaveAttribute(
      'aria-valuetext',
      `${exactCurrency(1_840_000)}, 92% da meta de ${exactCurrency(2_000_000)}, faixa Atenção`,
    );
    expect(centerTexts()).toEqual([currency(1_840_000), `92% de ${currency(2_000_000)}`]);
  });

  it('le as faixas em fracao da meta, na unidade que a exibicao escolhe', () => {
    const { rerender } = render(revenue({ legend: 'bottom', valueDisplay: 'percentOfTarget' }));

    expect(screen.getByRole('list')).toHaveTextContent('0% a 70%');
    expect(screen.getByRole('list')).toHaveTextContent('100% a 120%');

    rerender(revenue({ legend: 'bottom', valueDisplay: 'value' }));
    expect(screen.getByRole('list')).toHaveTextContent(`${currency(1_400_000)} a ${currency(2_000_000)}`.replace(/\s/g, ' '));
  });

  it('mostra o atingido no balao so na leitura contra a meta', () => {
    const { unmount } = render(revenue({ valueDisplay: 'percentOfTarget', segments: [] }));
    const hit = document.querySelector(`.${styles.hits} circle`)!;

    fireEvent.pointerMove(hit, { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(hit);
    expect(document.querySelector('[class*="tooltip"]')).toHaveTextContent('Atingido92%');
    unmount();

    render(sla({ segments: [] }));
    const slaHit = document.querySelector(`.${styles.hits} circle`)!;
    fireEvent.pointerMove(slaHit, { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(slaHit);
    expect(document.querySelector('[class*="tooltip"]')).not.toHaveTextContent('Atingido');
  });

  it('mostra no balao da faixa o intervalo dela e se o valor esta ali', () => {
    render(sla());
    const [, attention] = document.querySelectorAll(`.${styles.hits} path`);

    fireEvent.pointerMove(attention, { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(attention);

    const tooltip = document.querySelector('[class*="tooltip"]');
    expect(tooltip).toHaveTextContent('Atenção');
    expect(tooltip).toHaveTextContent('80% a 90% · o valor está aqui');
    expect(byClass(styles.segmentDimmed)).toHaveLength(2);
  });

  it('limita o raio das pontas a metade da espessura', () => {
    render(sla({ thickness: 10, trackRadius: 50 }));
    const track = document.querySelector(`.${styles.track}`)!.getAttribute('d')!;

    expect(track).toMatch(/A5,5,/);
    expect(track).not.toMatch(/A50,50,/);
  });

  it('carregando, e imagem ocupada, sem valor, faixas nem meta', () => {
    render(sla({ loading: true }));
    const image = screen.getByRole('img', { name: 'SLA de atendimento: carregando' });

    expect(image).toHaveAttribute('aria-busy', 'true');
    expect(image).not.toHaveAttribute('aria-valuenow');
    expect(byClass(styles.segment)).toHaveLength(0);
    expect(byClass(styles.targetLine)).toHaveLength(0);
    expect(centerTexts()).toEqual(['Carregando…']);
  });

  it('sem dado, e imagem que diz a ausencia, com a escala ainda legivel', () => {
    render(sla({ value: null }));

    expect(screen.getByRole('img', { name: 'SLA de atendimento: sem dados no período' })).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    expect(byClass(styles.segment)).toHaveLength(3);
    expect(document.querySelector(`.${styles.fill}`)).toBeNull();
    expect(centerTexts()).toEqual(['—', 'Sem dados no período']);
  });

  it('trata numero invalido como ausente, sem virar geometria', () => {
    render(
      sla({
        delta: { value: Number.NaN },
        max: Number.NaN,
        segments: [{ to: Number.NaN, label: 'Quebrada' }, { label: 'Toda' }],
        target: { value: Number.NaN },
        value: Number.NaN,
      }),
    );

    expect(screen.getByRole('img', { name: /sem dados/ })).toBeInTheDocument();
    expect(byClass(styles.segment)).toHaveLength(1);
    expect(byClass(styles.targetLine)).toHaveLength(0);
    expect([...document.querySelectorAll('path')].some((path) => path.getAttribute('d')?.includes('NaN'))).toBe(false);
  });

  describe('animacao do valor', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it('vai direto ao valor com movimento reduzido', () => {
      vi.stubGlobal('matchMedia', () => ({ matches: true }));
      const { rerender, unmount } = render(sla({ value: 30 }));
      rerender(sla({ value: 80 }));
      const animated = fillPath();
      unmount();

      render(sla({ value: 80 }));
      expect(animated).toBe(fillPath());
    });

    it('caminha da posicao anterior ate a nova quando o movimento e aceito', () => {
      const frames: FrameRequestCallback[] = [];
      let now = 0;
      vi.stubGlobal('matchMedia', () => ({ matches: false }));
      vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((step) => {
        frames.push(step);
        return frames.length;
      });
      vi.spyOn(performance, 'now').mockImplementation(() => now);

      const { rerender } = render(sla({ value: 30 }));
      const before = fillPath();
      rerender(sla({ value: 80 }));
      now = 100;
      act(() => frames.at(-1)?.(now));
      const middle = fillPath();
      now = 1000;
      act(() => frames.at(-1)?.(now));

      expect(middle).not.toBe(before);
      expect(middle).not.toBe(fillPath());
      expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '80');
    });
  });
});
