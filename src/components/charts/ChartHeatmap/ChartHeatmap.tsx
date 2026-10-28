import { useEffect, useId, useMemo, useState, type KeyboardEvent, type MouseEvent, type SyntheticEvent } from 'react';
import { formatNumber } from '../../../utils/formatters';
import {
  CartesianFrame,
  ColorLegend,
  NO_DATA_FILL,
  NO_DATA_HATCH,
  NoDataHatch,
  bottomLabelRotation,
  cartesianLayout,
  chartHeight,
  isDevelopment,
  markShown,
  measureLabel,
  useCartesianLayout,
  useChartMetrics,
  useSeriesToggle,
  type AxisLabelAngle,
  type AxisPosition,
  type AxisTick,
  type AxisVisibility,
  type ChartHeight,
  type ChartLegendAlign,
  type CartesianLayoutOptions,
  type ChartRootProps,
  type MarkVisibility,
  type NoDataStyle,
} from '../core';
import { bandScale, buildColorScale, type ChartColorScale } from '../scales';
import { ChartHeatmapTable } from './ChartHeatmapTable';
import styles from './ChartHeatmap.module.css';

export interface ChartHeatmapCell {
  value: number | null;
  x: string;
  y: string;
}

/** A cor mede o valor: sequencial, divergente ou por faixas. */
export type ChartHeatmapColorScale = Extract<ChartColorScale, { type: 'sequential' | 'diverging' | 'classes' }>;

export type ChartHeatmapLegendPosition = 'top' | 'bottom' | 'right' | 'none';

export type ChartHeatmapHighlight = 'cell' | 'rowColumn';

export interface ChartHeatmapProps extends ChartRootProps {
  /** Uma por cruzamento. `value: null` e sem dado; o cruzamento sem celula fica em branco. */
  cells: readonly ChartHeatmapCell[];
  colorScale?: ChartHeatmapColorScale;
  emptyMessage?: string;
  /** Formato dos valores no balao. Sem ele, vale o `formatValue`. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  /** Sob o ponteiro ou o foco: so a celula, ou tambem o contorno da linha e da coluna dela. */
  highlight?: ChartHeatmapHighlight;
  legend?: ChartHeatmapLegendPosition;
  legendAlign?: ChartLegendAlign;
  noDataLabel?: string;
  noDataStyle?: NoDataStyle;
  /** Torna as celulas botoes, percorridos pelas setas. */
  onCellClick?: (cell: ChartHeatmapCell) => void;
  /** Celula sob o ponteiro ou o foco, ou `null` ao sair dela. */
  onHoverCell?: (cell: ChartHeatmapCell | null) => void;
  showTooltip?: boolean;
  /** Valor escrito na celula, quando cabe nela. */
  showValues?: MarkVisibility;
  /** Celulas quadradas, como na matriz de correlacao. */
  squareCells?: boolean;
  title: string;
  /** Nome da medida, na legenda e no balao. */
  valueLabel?: string;
  xAxis?: AxisVisibility;
  /** Rotulos das colunas embaixo, como no grafico, ou em cima, como na tabela. */
  xAxisPosition?: AxisPosition;
  /** Ordem das colunas. Sem ela, a ordem em que aparecem nas celulas. */
  xCategories?: readonly string[];
  yAxis?: AxisVisibility;
  /** Ordem das linhas, de cima para baixo. Sem ela, a ordem em que aparecem nas celulas. */
  yCategories?: readonly string[];
}

interface Position {
  column: number;
  row: number;
}

type Grade = readonly (readonly (ChartHeatmapCell | undefined)[])[];

const CELL_GAP = 2;
const DENSE_CELL_GAP = 1;
const DENSE_CELL_SIZE = 14;
const LABEL_PADDING = 4;
const HIDDEN_FILL = 'var(--pl-color-surface-subtle)';

const DIRECAO: Record<string, Position> = {
  ArrowDown: { column: 0, row: 1 },
  ArrowLeft: { column: -1, row: 0 },
  ArrowRight: { column: 1, row: 0 },
  ArrowUp: { column: 0, row: -1 },
};

const firstSeen = (values: readonly string[]) => [...new Set(values)];
const sameCell = (a: Position | null, b: Position) => a !== null && a.column === b.column && a.row === b.row;
const presente = (grade: Grade, position: Position) => grade[position.row]?.[position.column] !== undefined;
const step = (from: Position, by: Position) => ({ column: from.column + by.column, row: from.row + by.row });
const inside = (grade: Grade, position: Position) =>
  position.row >= 0 && position.row < grade.length && position.column >= 0 && position.column < (grade[0]?.length ?? 0);

function presentes(grade: Grade) {
  return grade.flatMap((linha, row) => linha.flatMap((cell, column) => (cell === undefined ? [] : [{ column, row }])));
}

/** Destino das setas, de `Home` e de `End`, saltando os cruzamentos em branco e preso as bordas da grade. */
function moveFrom(grade: Grade, position: Position, key: string, toCorner: boolean): Position | null {
  const direcao = DIRECAO[key];

  if (direcao) {
    let next = step(position, direcao);
    while (inside(grade, next) && !presente(grade, next)) {
      next = step(next, direcao);
    }
    return inside(grade, next) ? next : position;
  }

  if (key !== 'Home' && key !== 'End') {
    return null;
  }

  const alvos = presentes(grade).filter((candidate) => toCorner || candidate.row === position.row);
  return (key === 'Home' ? alvos[0] : alvos.at(-1)) ?? null;
}

/** Contagem e intensidade honestas: sem `domain`, a sequencial de valores nao negativos parte de zero. */
function fromZero(config: ChartHeatmapColorScale, values: readonly number[]): ChartHeatmapColorScale {
  if (config.type !== 'sequential' || config.domain || config.log || values.length === 0 || values.some((value) => value < 0)) {
    return config;
  }

  return { ...config, domain: [0, Math.max(...values)] };
}

/** Matriz de calor: a cor de cada celula mede o valor no cruzamento de uma categoria com outra. */
/**
 * Com celula quadrada, a coluna desenhada e o lado do quadrado, mais estreito que a largura util quando a altura
 * manda. O angulo sai dessa coluna; girar o rotulo come altura, entao a coluna e medida de novo com ele.
 */
function anguloDaColunaQuadrada(opcoes: Omit<CartesianLayoutOptions, 'labelAngle'>, linhas: number): AxisLabelAngle {
  const colunas = Math.max(opcoes.bottomLabels.length, 1);
  const lado = (angulo: AxisLabelAngle) => {
    const { plot } = cartesianLayout({ ...opcoes, labelAngle: angulo });
    return Math.min(plot.width / colunas, plot.height / Math.max(linhas, 1));
  };
  const primeiro = bottomLabelRotation(opcoes.bottomLabels, opcoes.font, lado('auto'));

  return bottomLabelRotation(opcoes.bottomLabels, opcoes.font, lado(primeiro));
}

export function ChartHeatmap({
  cells,
  colorScale = { type: 'sequential' },
  emptyMessage = 'Sem dados no período',
  formatTooltipValue,
  formatValue = formatNumber,
  height = 320,
  highlight = 'cell',
  legend = 'bottom',
  legendAlign = 'center',
  noDataLabel = 'Sem dado',
  noDataStyle = 'hatch',
  onCellClick,
  onHoverCell,
  showTooltip = true,
  showValues = 'visible',
  squareCells = false,
  title,
  valueLabel = 'Valor',
  xAxis = 'visible',
  xAxisPosition = 'bottom',
  xCategories,
  yAxis = 'visible',
  yCategories,
  ...root
}: ChartHeatmapProps) {
  const { font, height: alturaMedida, radius, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const [emFoco, setEmFoco] = useState<Position | null>(null);
  const [ancora, setAncora] = useState<{ x: number; y: number }>();
  const [parada, setParada] = useState<Position>({ column: 0, row: 0 });
  const [faixaEmDestaque, setFaixaEmDestaque] = useState<string | null>(null);
  const faixas = useSeriesToggle({});
  const hatchId = `${useId().replace(/[^\w-]/g, '')}-hatch`;
  const interativo = onCellClick !== undefined;

  const colunas = useMemo(() => xCategories ?? firstSeen(cells.map((cell) => cell.x)), [cells, xCategories]);
  const linhas = useMemo(() => yCategories ?? firstSeen(cells.map((cell) => cell.y)), [cells, yCategories]);

  const { aviso, escala, grade, semDado } = useMemo(() => {
    const coluna = new Map(colunas.map((label, index) => [label, index]));
    const linha = new Map(linhas.map((label, index) => [label, index]));
    const matriz: (ChartHeatmapCell | undefined)[][] = linhas.map(() => colunas.map(() => undefined));
    const foraDaOrdem: string[] = [];
    const repetidas: string[] = [];

    cells.forEach((cell) => {
      const c = coluna.get(cell.x);
      const r = linha.get(cell.y);
      if (c === undefined || r === undefined) {
        foraDaOrdem.push(`${cell.x} × ${cell.y}`);
        return;
      }
      if (matriz[r][c] !== undefined) {
        repetidas.push(`${cell.x} × ${cell.y}`);
      }
      matriz[r][c] = { ...cell, value: Number.isFinite(cell.value) ? cell.value : null };
    });

    const valores = matriz.flat().flatMap((cell) => (cell?.value == null ? [] : [cell.value]));
    const vazias = matriz.flat().filter((cell) => cell !== undefined && cell.value === null).length;
    const avisos = [
      foraDaOrdem.length > 0 && `${foraDaOrdem.length} célula(s) fora de xCategories ou yCategories, fora do desenho: ${foraDaOrdem.join(', ')}.`,
      repetidas.length > 0 && `${repetidas.length} célula(s) repetida(s), valendo a última: ${repetidas.join(', ')}.`,
    ].filter(Boolean);

    return {
      aviso: avisos.join(' '),
      escala: buildColorScale(fromZero(colorScale, valores), valores, formatValue),
      grade: matriz,
      semDado: vazias,
    };
  }, [cells, colorScale, colunas, formatValue, linhas]);

  useEffect(() => {
    if (aviso && isDevelopment()) {
      console.warn(`ChartHeatmap "${title}": ${aviso}`);
    }
  }, [aviso, title]);

  const opcoesDoLayout = {
    bottomLabels: colunas,
    font,
    height: alturaDoDesenho,
    leftLabels: linhas,
    rightLabels: [],
    topRoom: 0,
    width,
    xAxis,
    xAxisPosition,
    yAxis,
    yAxisRight: 'hidden',
  } as const;
  const { axisReveal, margins, plot, rotation } = useCartesianLayout({
    ...opcoesDoLayout,
    labelAngle: squareCells ? anguloDaColunaQuadrada(opcoesDoLayout, linhas.length) : 'auto',
  });

  const lado = squareCells
    ? Math.min(plot.width / Math.max(colunas.length, 1), plot.height / Math.max(linhas.length, 1))
    : undefined;
  const area = lado === undefined ? plot : { height: lado * linhas.length, width: lado * colunas.length };
  const escalaX = bandScale({ domain: colunas, padding: 0, range: [0, area.width] });
  const escalaY = bandScale({ domain: linhas, padding: 0, range: [0, area.height] });
  const vao = Math.min(escalaX.bandwidth(), escalaY.bandwidth()) < DENSE_CELL_SIZE ? DENSE_CELL_GAP : CELL_GAP;
  const larguraDaCelula = Math.max(escalaX.bandwidth() - vao, 0);
  const alturaDaCelula = Math.max(escalaY.bandwidth() - vao, 0);
  const canto = Math.min(radius, larguraDaCelula / 4, alturaDaCelula / 4);
  const semDadoFill = noDataStyle === 'hatch' ? `url(#${hatchId})` : NO_DATA_FILL;
  const semDadoAmostra = noDataStyle === 'hatch' ? NO_DATA_HATCH : NO_DATA_FILL;

  const datumOf = (cell: ChartHeatmapCell | undefined) => ({ category: null, value: cell?.value ?? null });
  const celulaEm = (position: Position | null) => (position === null ? undefined : grade[position.row]?.[position.column]);
  const celulaEmFoco = celulaEm(emFoco);
  const paradaValida = presente(grade, parada) ? parada : presentes(grade)[0];

  function descrever(position: Position) {
    const cell = celulaEm(position);
    const valor = cell?.value == null ? noDataLabel : formatValue(cell.value);
    return `${colunas[position.column]}, ${linhas[position.row]}: ${valor}`;
  }

  function focar(position: Position | null) {
    setEmFoco(position);
    onHoverCell?.(celulaEm(position) ?? null);
  }

  function posicaoDe(event: SyntheticEvent): Position | null {
    const marca = (event.target as Element).getAttribute('data-cell');
    if (marca === null) {
      return null;
    }
    const [row, column] = marca.split(':').map(Number);
    return { column, row };
  }

  function posicaoNoPonteiro(event: MouseEvent<SVGGElement>): Position | null {
    const caixa = event.currentTarget.getBoundingClientRect();
    const position = {
      column: Math.floor((event.clientX - caixa.left) / escalaX.step()),
      row: Math.floor((event.clientY - caixa.top) / escalaY.step()),
    };
    return presente(grade, position) ? position : null;
  }

  function aoMoverPonteiro(event: MouseEvent<SVGGElement>) {
    const position = posicaoNoPonteiro(event);
    setAncora(undefined);
    if (position === null ? emFoco !== null : !sameCell(emFoco, position)) {
      focar(position);
    }
  }

  function aoTeclar(event: KeyboardEvent<SVGGElement>) {
    const atual = posicaoDe(event);
    if (atual === null) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onCellClick?.(celulaEm(atual)!);
      return;
    }

    const destino = moveFrom(grade, atual, event.key, event.ctrlKey);
    if (destino === null) {
      return;
    }

    event.preventDefault();
    setParada(destino);
    event.currentTarget.querySelector<SVGElement>(`[data-cell="${destino.row}:${destino.column}"]`)?.focus();
  }

  const marcasX: AxisTick[] = colunas.map((label) => ({ label, position: (escalaX(label) ?? 0) + escalaX.bandwidth() / 2 }));
  const marcasY: AxisTick[] = linhas.map((label) => ({ label, position: (escalaY(label) ?? 0) + escalaY.bandwidth() / 2 }));
  const contagem = new Map<string, number>();
  grade.flat().forEach((cell) => {
    const chave = cell?.value == null ? undefined : escala.keyOf(datumOf(cell));
    if (chave !== undefined) {
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }
  });

  const legenda = (
    <ColorLegend
      align={legendAlign}
      entries={escala.entries.map((entry) => ({ ...entry, count: contagem.get(entry.key) ?? 0, hidden: faixas.isHidden(entry.key) }))}
      formatValue={formatValue}
      gradient={escala.gradient}
      indicator={celulaEmFoco?.value == null ? undefined : escala.gradient?.position(celulaEmFoco.value)}
      noData={semDado > 0 ? { color: semDadoAmostra, count: semDado, label: noDataLabel } : undefined}
      onHighlight={setFaixaEmDestaque}
      onToggle={faixas.toggle}
      position={legend === 'none' ? 'bottom' : legend}
      valueLabel={valueLabel}
    />
  );

  const linhaDoBalao =
    celulaEmFoco === undefined
      ? undefined
      : celulaEmFoco.value === null
        ? { color: semDadoAmostra, label: noDataLabel, values: [] }
        : { color: escala.fillOf(datumOf(celulaEmFoco)), label: valueLabel, values: [celulaEmFoco.value] };

  return (
    <CartesianFrame
      axisReveal={axisReveal}
      canvasRole={interativo ? 'group' : 'img'}
      containerRef={ref}
      empty={colunas.length === 0 || linhas.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={lado === undefined ? alturaDoDesenho : margins.top + area.height + margins.bottom}
      legendContent={legenda}
      legendPosition={legend}
      margins={margins}
      plot={area}
      root={root}
      table={
        <ChartHeatmapTable
          columns={colunas}
          formatValue={formatValue}
          grade={grade}
          noDataLabel={noDataLabel}
          rows={linhas}
          title={title}
        />
      }
      title={title}
      tooltip={
        showTooltip
          ? {
              anchor: ancora,
              columns: celulaEmFoco?.value == null ? [] : [{ format: formatTooltipValue ?? formatValue }],
              computed: 'none',
              rows: linhaDoBalao === undefined ? [] : [linhaDoBalao],
              subtitle: emFoco === null ? undefined : linhas[emFoco.row],
              title: emFoco === null ? undefined : colunas[emFoco.column],
            }
          : undefined
      }
      width={width}
      xAxis={{ hideLine: true, labelRotation: rotation, position: xAxisPosition, ticks: marcasX, visibility: xAxis }}
      yAxis={{ hideLine: true, ticks: marcasY, visibility: yAxis }}
    >
      <g
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setAncora(undefined);
            focar(null);
          }
        }}
        onClick={(event) => {
          const position = posicaoDe(event);
          if (interativo && position !== null) {
            setParada(position);
            onCellClick?.(celulaEm(position)!);
          }
        }}
        onFocus={(event) => {
          const position = posicaoDe(event);
          if (position !== null) {
            const caixa = (event.target as Element).getBoundingClientRect();
            setAncora({ x: caixa.left + caixa.width / 2, y: caixa.top + caixa.height / 2 });
            setParada(position);
            focar(position);
          }
        }}
        onKeyDown={interativo ? aoTeclar : undefined}
        onMouseLeave={() => focar(null)}
        onMouseMove={aoMoverPonteiro}
      >
        <defs>
          <NoDataHatch id={hatchId} />
        </defs>
        <rect fill="transparent" height={area.height} width={area.width} />
        {grade.map((linha, row) =>
          linha.map((cell, column) => {
            if (cell === undefined) {
              return null;
            }

            const position = { column, row };
            const datum = datumOf(cell);
            const chave = cell.value === null ? undefined : escala.keyOf(datum);
            const oculta = chave !== undefined && faixas.isHidden(chave);
            const apagada = faixaEmDestaque !== null && chave !== faixaEmDestaque;
            const x = (escalaX(colunas[column]) ?? 0) + vao / 2;
            const y = (escalaY(linhas[row]) ?? 0) + vao / 2;
            const texto = cell.value === null ? '' : formatValue(cell.value);
            const cabe =
              texto !== '' &&
              measureLabel(texto, font) + LABEL_PADDING * 2 <= larguraDaCelula &&
              font.size + LABEL_PADDING <= alturaDaCelula;
            const emFocoAgora = sameCell(emFoco, position);
            const corDoTexto = escala.textColorOf(datum);

            return (
              <g key={`${row}:${column}`}>
                <rect
                  aria-label={descrever(position)}
                  className={[styles.cell, interativo && styles.clickable, apagada && styles.dimmed, emFocoAgora && styles.focused]
                    .filter(Boolean)
                    .join(' ')}
                  data-cell={`${row}:${column}`}
                  fill={oculta ? HIDDEN_FILL : (escala.fillOf(datum) ?? semDadoFill)}
                  height={alturaDaCelula}
                  role={interativo ? 'button' : undefined}
                  rx={canto}
                  tabIndex={interativo ? (sameCell(paradaValida ?? null, position) ? 0 : -1) : undefined}
                  width={larguraDaCelula}
                  x={x}
                  y={y}
                />
                {cabe && !oculta && markShown(showValues, emFocoAgora) && (
                  <text
                    className={corDoTexto === undefined ? `${styles.valueLabel} ${styles.valueLabelHalo}` : styles.valueLabel}
                    dominantBaseline="central"
                    fill={corDoTexto}
                    textAnchor="middle"
                    x={x + larguraDaCelula / 2}
                    y={y + alturaDaCelula / 2}
                  >
                    {texto}
                  </text>
                )}
              </g>
            );
          }),
        )}
        {highlight === 'rowColumn' && emFoco !== null && (
          <g aria-hidden="true" className={styles.crosshair}>
            <rect height={escalaY.bandwidth()} rx={canto} width={area.width} x={0} y={escalaY(linhas[emFoco.row]) ?? 0} />
            <rect height={area.height} rx={canto} width={escalaX.bandwidth()} x={escalaX(colunas[emFoco.column]) ?? 0} y={0} />
          </g>
        )}
      </g>
    </CartesianFrame>
  );
}
