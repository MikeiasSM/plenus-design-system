import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { formatDuration } from '../../../utils/formatters/formatDuration';
import {
  ChartTimeline,
  type ChartTimelineProps,
  type ChartTimelineRow,
  type ChartTimelineSegment,
  type ChartTimelineSeries,
} from './ChartTimeline';
import styles from './ChartTimeline.module.css';

const series: ChartTimelineSeries[] = [
  { label: 'Horário da jornada', color: 'var(--pl-color-border)' },
  { label: 'Dentro da jornada' },
  { label: 'Antes da jornada', intent: 'warning' },
  { label: 'Batida isolada', intent: 'neutral' },
];

const rows: ChartTimelineRow[] = [
  { key: 'd2', label: 'Sex 02/10' },
  { key: 'd3', label: 'Sáb 03/10' },
  { key: 'd5', label: 'Seg 05/10' },
];

const segments: ChartTimelineSegment[] = [
  { row: 'd2', series: 'Antes da jornada', start: 6 + 50 / 60, end: 8 },
  { row: 'd2', series: 'Dentro da jornada', start: 8, end: 12 },
  { row: 'd2', series: 'Dentro da jornada', start: 13, end: 17 },
  { row: 'd5', series: 'Dentro da jornada', start: 8, end: 12 },
];

const HOUR = 3_600_000;

function journey(props: Partial<ChartTimelineProps> = {}) {
  return (
    <ChartTimeline
      domain={[0, 24]}
      rows={rows}
      rowBands={[{ row: 'd2', series: 'Horário da jornada', start: 8, end: 12 }]}
      segments={segments}
      series={series}
      timeScale="dayHours"
      title="Jornada de trabalho"
      {...props}
    />
  );
}

function setWidth(width = 640) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: width });
}

function drawnSegments() {
  return [...document.querySelectorAll('svg g[aria-label]')];
}

function labels() {
  return drawnSegments().map((segment) => segment.getAttribute('aria-label'));
}

function barTop(segment: Element) {
  return Number(/^M[-\d.]+,([-\d.]+)/.exec(segment.querySelector('path')?.getAttribute('d') ?? '')?.[1]);
}

function tooltip() {
  return document.querySelector('[class*="tooltip"]');
}

function hover(element: Element) {
  fireEvent.pointerMove(element, { clientX: 10, clientY: 10 });
  fireEvent.mouseEnter(element);
}

describe('ChartTimeline', () => {
  beforeEach(() => setWidth());
  afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth'));

  it('e imagem nomeada pelo titulo, com cada intervalo descrito por linha, serie, inicio, fim e duracao', () => {
    render(journey());

    expect(screen.getByRole('img', { name: 'Jornada de trabalho' })).toBeInTheDocument();
    expect(labels()).toContain('Sex 02/10, Antes da jornada, 06:50 a 08:00, 1h10m');
    expect(drawnSegments()).toHaveLength(4);
  });

  it('abre a paleta com a cor de tema, sem repintar as séries que têm cor ou intenção', () => {
    render(journey({ accent: '#6E2A92' }));
    const fillOf = (series: string) =>
      drawnSegments().find((segment) => segment.getAttribute('aria-label')?.includes(series))?.querySelector('path')?.getAttribute('fill');

    expect(fillOf('Dentro da jornada')).toBe('#6E2A92');
    expect(fillOf('Antes da jornada')).toBe('var(--pl-chart-warning)');
  });

  it('com onSegmentClick vira grupo, e cada intervalo e um botao', () => {
    render(journey({ onSegmentClick: () => undefined }));

    const group = screen.getByRole('group', { name: 'Jornada de trabalho' });

    expect(within(group).getAllByRole('button')).toHaveLength(4);
    const name = 'Sex 02/10, Antes da jornada, 06:50 a 08:00, 1h10m';

    expect(within(group).getByRole('button', { name })).toBeInTheDocument();
  });

  it('entra no teclado por um ponto so e percorre os intervalos pelas setas, Home e End', () => {
    render(journey({ onSegmentClick: () => undefined }));
    const buttons = within(screen.getByRole('group')).getAllByRole('button');
    const [before, morning, afternoon, monday] = buttons;

    expect(buttons.filter((button) => button.getAttribute('tabindex') === '0')).toEqual([before]);

    act(() => before.focus());
    fireEvent.keyDown(before, { key: 'ArrowRight' });
    expect(morning).toHaveFocus();

    fireEvent.keyDown(morning, { key: 'End' });
    expect(afternoon).toHaveFocus();
    expect(afternoon).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(afternoon, { key: 'Home' });
    expect(before).toHaveFocus();

    // A linha sem intervalo fica de fora; desce para o intervalo mais proximo no tempo da seguinte.
    fireEvent.keyDown(before, { key: 'ArrowDown' });
    expect(monday).toHaveFocus();

    fireEvent.keyDown(monday, { key: 'ArrowUp' });
    expect(morning).toHaveFocus();
  });

  it('dispara onSegmentClick no clique, no Enter e no Espaco, com o intervalo e a linha', () => {
    const onSegmentClick = vi.fn();
    render(journey({ onSegmentClick }));
    const [before] = within(screen.getByRole('group')).getAllByRole('button');

    fireEvent.click(before);
    fireEvent.keyDown(before, { key: 'Enter' });
    fireEvent.keyDown(before, { key: ' ' });

    expect(onSegmentClick).toHaveBeenCalledTimes(3);
    expect(onSegmentClick).toHaveBeenLastCalledWith(segments[0], rows[0]);
  });

  it('marca o foco com o anel', () => {
    render(journey({ onSegmentClick: () => undefined }));
    const [before] = within(screen.getByRole('group')).getAllByRole('button');

    act(() => before.focus());
    expect(document.querySelector(`.${styles.focusRing}`)).toBeInTheDocument();

    act(() => before.blur());
    expect(document.querySelector(`.${styles.focusRing}`)).toBeNull();
  });

  it('desliga a serie pela legenda, no desenho, no resumo e na tabela', () => {
    const onHiddenSeriesChange = vi.fn();
    const rowSummary = vi.fn((_row: ChartTimelineRow, visible: readonly ChartTimelineSegment[]) => ({
      title: formatDuration(visible.reduce((total, segment) => total + (+segment.end - +segment.start) * HOUR, 0)),
    }));
    render(journey({ onHiddenSeriesChange, rowSummary }));

    expect(screen.getByText('9h10m')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Antes da jornada' }));

    expect(screen.getByRole('button', { name: 'Antes da jornada' })).toHaveAttribute('aria-pressed', 'false');
    expect(onHiddenSeriesChange).toHaveBeenLastCalledWith(['Antes da jornada']);
    expect(labels().some((label) => label?.includes('Antes da jornada'))).toBe(false);
    expect(screen.getByText('8h')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver como tabela' }));
    expect(screen.getByRole('table')).not.toHaveTextContent('Antes da jornada');
  });

  it('obedece as series ocultas informadas pelo produto', () => {
    render(journey({ hiddenSeries: ['Dentro da jornada'] }));

    expect(drawnSegments()).toHaveLength(1);
  });

  it('troca o desenho pela tabela, com uma secao por linha e faixas e instantes em linhas proprias', () => {
    render(
      journey({
        markers: [{ row: 'd3', series: 'Batida isolada', time: 21.5, label: 'Batida sem par' }],
        rowSummary: () => ({ title: '9h10m', subtitle: '1h10m fora' }),
      }),
    );
    const toggle = screen.getByRole('button', { name: 'Ver como tabela' });

    fireEvent.click(toggle);

    const table = screen.getByRole('table');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('img')).toBeNull();
    expect(table.querySelectorAll('th[scope="rowgroup"]')).toHaveLength(3);
    expect(table).toHaveTextContent('Sex 02/10 9h10m, 1h10m fora');
    expect(table).toHaveTextContent('Horário da jornada (referência)08:0012:004h');
    expect(table).toHaveTextContent('Batida isolada: Batida sem par21:30—instante');
    expect(within(table).queryByText('Progresso')).toBeNull();

    fireEvent.click(toggle);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('mostra a coluna de progresso quando algum intervalo tem progresso', () => {
    render(journey({ segments: [{ ...segments[1], progress: 0.4 }] }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver como tabela' }));

    expect(within(screen.getByRole('table')).getByText('Progresso')).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('40%');
  });

  it('mostra no balao a serie, o periodo e a duracao do intervalo, e os totais da linha sob o ponteiro', () => {
    const { rerender } = render(journey());
    const before = drawnSegments().find((segment) => segment.getAttribute('aria-label')?.includes('Antes'))!;

    hover(before);
    expect(tooltip()).toHaveTextContent('Sex 02/10');
    expect(tooltip()).toHaveTextContent('06:50–08:00');
    expect(tooltip()).toHaveTextContent('1h10m');

    fireEvent.mouseLeave(before);
    hover(document.querySelectorAll(`.${styles.hoverArea}`)[0]);
    expect(tooltip()).toHaveTextContent('Dentro da jornada8h');
    expect(tooltip()).toHaveTextContent('Total9h10m');

    rerender(journey({ showTooltip: false }));
    hover(before);
    expect(tooltip()).toBeNull();
  });

  it('formata o balao a parte quando pedido', () => {
    render(journey({ formatTooltipValue: (duration) => `${duration / 60_000} min` }));
    hover(drawnSegments()[0]);

    expect(tooltip()).toHaveTextContent('70 min');
    expect(labels()).toContain('Sex 02/10, Antes da jornada, 06:50 a 08:00, 1h10m');
  });

  it('esmaece as outras series sob o ponteiro quando pedido', () => {
    render(journey({ highlightOnHover: true }));
    const [before, morning] = drawnSegments();

    fireEvent.mouseEnter(before);

    expect(morning).toHaveClass(styles.dimmed!);
    expect(before).not.toHaveClass(styles.dimmed!);
  });

  it('escreve o rotulo na barra so quando cabe, corta quando visivel e omite quando escondido', () => {
    const segmentWith = (label: string) =>
      drawnSegments().find((segment) => segment.getAttribute('aria-label')?.includes(label));
    const textIn = (label: string) => segmentWith(label)?.querySelector('text')?.textContent;
    const { rerender } = render(journey());

    expect(textIn('08:00 a 12:00')).toBe('4h');
    expect(textIn('06:50')).toBeUndefined();

    rerender(journey({ showSegmentLabels: 'visible' }));
    expect(textIn('06:50')).toMatch(/…$/);

    rerender(journey({ showSegmentLabels: 'hidden' }));
    expect(document.querySelectorAll('svg g[aria-label] text')).toHaveLength(0);

    rerender(journey({ segmentLabel: 'label', segments: [{ ...segments[1], label: 'Turno' }] }));
    expect(textIn('Turno')).toBe('Turno');
  });

  it('corta no fim do eixo o intervalo que cruza a meia-noite, marca a ponta e mantem a duracao inteira', () => {
    render(journey({ segments: [{ row: 'd2', series: 'Dentro da jornada', start: 22, end: 6 }] }));
    const [night] = drawnSegments();

    expect(night).toHaveAttribute(
      'aria-label',
      'Sex 02/10, Dentro da jornada, 22:00 a 06:00, 8h, continua depois do eixo',
    );
    expect(night.querySelector(`.${styles.clipMark}`)).toBeInTheDocument();
  });

  it('empilha em sub-faixas os intervalos que se cruzam, ou sobrepoe em overlay', () => {
    const crossing = [
      { row: 'd2', series: 'Dentro da jornada', start: 8, end: 12 },
      { row: 'd2', series: 'Antes da jornada', start: 10, end: 14 },
    ];
    const { rerender } = render(journey({ segments: crossing }));
    const [first, second] = drawnSegments();

    expect(barTop(second)).toBeGreaterThan(barTop(first));

    rerender(journey({ overlap: 'overlay', segments: crossing }));
    const [a, b] = drawnSegments();
    expect(barTop(a)).toBe(barTop(b));
  });

  it('converte estados em intervalos, juntando os iguais seguidos ou uma celula por leitura', () => {
    const states = [
      { row: 'd2', state: 'Dentro da jornada', time: 8 },
      { row: 'd2', state: 'Dentro da jornada', time: 9 },
      { row: 'd2', state: 'Antes da jornada', time: 10 },
    ];
    const { rerender } = render(journey({ segments: undefined, states, statesEnd: 11 }));

    expect(labels()).toEqual([
      'Sex 02/10, Dentro da jornada, 08:00 a 10:00, 2h',
      'Sex 02/10, Antes da jornada, 10:00 a 11:00, 1h',
    ]);

    rerender(journey({ mergeConsecutive: false, segments: undefined, states }));
    expect(labels()).toEqual([
      'Sex 02/10, Dentro da jornada, 08:00 a 09:00, 1h',
      'Sex 02/10, Dentro da jornada, 09:00 a 10:00, 1h',
      'Sex 02/10, Antes da jornada, 10:00 a 24:00, 14h',
    ]);
  });

  it('recolhe e expande o grupo pelo cabecalho, guardando a escolha ou obedecendo ao produto', () => {
    const grouped = rows.map((row, index) => ({ ...row, group: index === 0 ? undefined : 'semana' }));
    const onCollapsedGroupsChange = vi.fn();
    const groups = [{ key: 'semana', label: 'Semana' }];
    const { rerender } = render(journey({ groups, onCollapsedGroupsChange, rows: grouped }));
    const header = () => screen.getByRole('button', { name: /Semana/ });

    expect(header()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(header());

    expect(header()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Seg 05/10')).toBeNull();
    expect(onCollapsedGroupsChange).toHaveBeenLastCalledWith(['semana']);

    rerender(journey({ collapsedGroups: ['semana'], groups, rows: grouped }));
    fireEvent.click(header());
    expect(header()).toHaveAttribute('aria-expanded', 'false');

    rerender(journey({ collapsibleGroups: false, groups, rows: grouped }));
    expect(screen.queryByRole('button', { name: /Semana/ })).toBeNull();
    expect(screen.getByText('Seg 05/10')).toBeInTheDocument();
  });

  it('anuncia a linha sem dado e, sem dado algum, o grafico inteiro', () => {
    const { rerender } = render(journey());

    expect(document.querySelector(`.${styles.emptyRowText}`)).toHaveTextContent('Sem registro');

    rerender(journey({ rowBands: [], segments: [] }));
    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ver como tabela' })).toBeNull();
  });

  it('nao desenha instante invalido', () => {
    render(
      journey({
        markers: [{ row: 'd2', series: 'Batida isolada', time: Number.NaN }],
        segments: [
          { row: 'd2', series: 'Dentro da jornada', start: Number.NaN, end: 12 },
          { row: 'd2', series: 'Dentro da jornada', start: new Date(Number.NaN), end: 12 },
          segments[1],
        ],
      }),
    );

    expect(drawnSegments()).toHaveLength(1);
    expect([...document.querySelectorAll('path, rect')].some((node) => node.outerHTML.includes('NaN'))).toBe(false);
  });

  it('aceita linhas com o mesmo rotulo, identificadas pela chave', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const repeated = [
      { key: 'a', label: 'Dia' },
      { key: 'b', label: 'Dia' },
    ];

    render(journey({ rows: repeated, segments: [{ ...segments[1], row: 'b' }] }));

    expect(screen.getAllByText('Dia')).toHaveLength(2);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('em largura estreita rola o desenho de lado e leva o resumo para baixo do rotulo, ou o retira', () => {
    setWidth(300);
    const rowSummary = () => ({ title: '9h10m', subtitle: '1h10m fora' });
    const { rerender } = render(journey({ rowSummary }));

    const region = screen.getByRole('region', { name: 'Jornada de trabalho, área rolável de lado' });

    expect(region).toHaveAttribute('tabindex', '0');
    expect(document.querySelector('svg')).toHaveAttribute('width', '360');
    expect(document.querySelector(`.${styles.labelSummary}`)).toHaveTextContent('9h10m · 1h10m fora');

    rerender(journey({ compactSummary: 'hidden', rowSummary }));
    expect(screen.queryByText(/9h10m/)).toBeNull();
  });

  it('desenha o eixo em horas, com o formato do consumidor, e o esconde quando pedido', () => {
    const ticks = () => [...document.querySelectorAll(`.${styles.axisLabel}`)].map((tick) => tick.textContent);
    const { rerender } = render(journey());

    expect(ticks()).toEqual(['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h', '24h']);

    rerender(journey({ formatTick: (time) => `${time.getHours()}:00` }));
    expect(ticks()).toContain('6:00');

    rerender(journey({ xAxis: 'onHover' }));
    expect(document.querySelector(`.${styles.axisOnHover}`)).toBeInTheDocument();

    rerender(journey({ xAxis: 'hidden' }));
    expect(ticks()).toEqual([]);
  });

  it('em datas, descreve os instantes com dia e hora', () => {
    render(
      <ChartTimeline
        rows={[{ key: 'ana', label: 'Ana Lima' }]}
        segments={[{ row: 'ana', series: 'Diurno', start: new Date(2026, 9, 12, 7), end: new Date(2026, 9, 12, 19) }]}
        series={[{ label: 'Diurno' }]}
        title="Escala"
      />,
    );

    expect(labels()).toEqual(['Ana Lima, Diurno, 12/10 07:00 a 12/10 19:00, 12h']);
  });
});
