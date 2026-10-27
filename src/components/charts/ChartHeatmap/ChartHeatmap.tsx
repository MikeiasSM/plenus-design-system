import { useMemo, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { formatarNumero } from '../../../utils/formatters';
import {
  CartesianFrame,
  ColorLegend,
  chartHeight,
  markShown,
  measureLabel,
  useCartesianLayout,
  useChartMetrics,
  useSeriesToggle,
  type AxisTick,
  type AxisVisibility,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartRootProps,
  type MarkVisibility,
} from '../core';
import { bandScale, buildColorScale, type ChartColorScale } from '../scales';
import styles from './ChartHeatmap.module.css';

export interface ChartHeatmapCell {
  value: number | null;
  x: string;
  y: string;
}

/** A cor mede o valor: sequencial, divergente ou por faixas. */
export type ChartHeatmapColorScale = Extract<ChartColorScale, { type: 'sequential' | 'diverging' | 'classes' }>;

export type ChartHeatmapLegendPosition = 'top' | 'bottom' | 'right' | 'none';

export interface ChartHeatmapProps extends ChartRootProps {
  cells: readonly ChartHeatmapCell[];
  colorScale?: ChartHeatmapColorScale;
  emptyMessage?: string;
  /** Formato dos valores no balao. Sem ele, vale o `formatValue`. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  legend?: ChartHeatmapLegendPosition;
  legendAlign?: ChartLegendAlign;
  noDataLabel?: string;
  /** Torna as celulas botoes, percorridos pelas setas. */
  onCellClick?: (cell: ChartHeatmapCell) => void;
  /** Celula sob o ponteiro ou o foco, ou `null` ao sair dela. */
  onHoverCell?: (cell: ChartHeatmapCell | null) => void;
  showTooltip?: boolean;
  /** Valor escrito na celula, quando cabe nela. */
  showValues?: MarkVisibility;
  title: string;
  /** Nome da medida, na legenda e no balao. */
  valueLabel?: string;
  xAxis?: AxisVisibility;
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

const CELL_GAP = 2;
const LABEL_PADDING = 4;
const NO_DATA_FILL = 'var(--pl-chart-no-data)';
const HIDDEN_FILL = 'var(--pl-color-surface-subtle)';

const firstSeen = (values: readonly string[]) => [...new Set(values)];
const sameCell = (a: Position | null, b: Position) => a !== null && a.column === b.column && a.row === b.row;

/** Destino das setas, de `Home` e de `End`, preso as bordas da grade. */
function moveFrom(position: Position, key: string, columns: number, rows: number): Position | null {
  const clamp = (value: number, size: number) => Math.min(Math.max(value, 0), size - 1);

  switch (key) {
    case 'ArrowRight':
      return { ...position, column: clamp(position.column + 1, columns) };
    case 'ArrowLeft':
      return { ...position, column: clamp(position.column - 1, columns) };
    case 'ArrowDown':
      return { ...position, row: clamp(position.row + 1, rows) };
    case 'ArrowUp':
      return { ...position, row: clamp(position.row - 1, rows) };
    case 'Home':
      return { ...position, column: 0 };
    case 'End':
      return { ...position, column: columns - 1 };
    default:
      return null;
  }
}

/** Matriz de calor: a cor de cada celula mede o valor no cruzamento de uma categoria com outra. */
export function ChartHeatmap({
  cells,
  colorScale = { type: 'sequential' },
  emptyMessage = 'Sem dados no período',
  formatTooltipValue,
  formatValue = formatarNumero,
  height = 320,
  legend = 'bottom',
  legendAlign = 'center',
  noDataLabel = 'Sem dado',
  onCellClick,
  onHoverCell,
  showTooltip = true,
  showValues = 'visible',
  title,
  valueLabel = 'Valor',
  xAxis = 'visible',
  xCategories,
  yAxis = 'visible',
  yCategories,
  ...root
}: ChartHeatmapProps) {
  const { font, height: alturaMedida, radius, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const [emFoco, setEmFoco] = useState<Position | null>(null);
  const [parada, setParada] = useState<Position>({ column: 0, row: 0 });
  const [faixaEmDestaque, setFaixaEmDestaque] = useState<string | null>(null);
  const faixas = useSeriesToggle({});
  const interativo = onCellClick !== undefined;

  const colunas = useMemo(() => xCategories ?? firstSeen(cells.map((cell) => cell.x)), [cells, xCategories]);
  const linhas = useMemo(() => yCategories ?? firstSeen(cells.map((cell) => cell.y)), [cells, yCategories]);

  const { escala, grade, semDado } = useMemo(() => {
    const coluna = new Map(colunas.map((label, index) => [label, index]));
    const linha = new Map(linhas.map((label, index) => [label, index]));
    const matriz: (ChartHeatmapCell | undefined)[][] = linhas.map(() => colunas.map(() => undefined));

    cells.forEach((cell) => {
      const c = coluna.get(cell.x);
      const r = linha.get(cell.y);
      if (c !== undefined && r !== undefined) {
        matriz[r][c] = { ...cell, value: Number.isFinite(cell.value) ? cell.value : null };
      }
    });

    const valores = matriz.flat().flatMap((cell) => (cell?.value == null ? [] : [cell.value]));
    const vazias = matriz.flat().filter((cell) => cell?.value == null).length;

    return { escala: buildColorScale(colorScale, valores, formatValue), grade: matriz, semDado: vazias };
  }, [cells, colorScale, colunas, formatValue, linhas]);

  const { axisReveal, margins, plot, rotation } = useCartesianLayout({
    bottomLabels: colunas,
    font,
    height: alturaDoDesenho,
    labelAngle: 'auto',
    leftLabels: linhas,
    rightLabels: [],
    topRoom: 0,
    width,
    xAxis,
    yAxis,
    yAxisRight: 'hidden',
  });

  const escalaX = bandScale({ domain: colunas, padding: 0, range: [0, plot.width] });
  const escalaY = bandScale({ domain: linhas, padding: 0, range: [0, plot.height] });
  const larguraDaCelula = Math.max(escalaX.bandwidth() - CELL_GAP, 0);
  const alturaDaCelula = Math.max(escalaY.bandwidth() - CELL_GAP, 0);
  const canto = Math.min(radius, larguraDaCelula / 4, alturaDaCelula / 4);

  const datumOf = (cell: ChartHeatmapCell | undefined) => ({ category: null, value: cell?.value ?? null });
  const celulaEm = (position: Position | null) => (position === null ? undefined : grade[position.row]?.[position.column]);
  const celulaEmFoco = celulaEm(emFoco);

  function descrever(position: Position) {
    const cell = celulaEm(position);
    const valor = cell?.value == null ? noDataLabel : formatValue(cell.value);
    return `${colunas[position.column]}, ${linhas[position.row]}: ${valor}`;
  }

  function focar(position: Position | null) {
    setEmFoco(position);
    onHoverCell?.(position === null ? null : (celulaEm(position) ?? { value: null, x: colunas[position.column], y: linhas[position.row] }));
  }

  function posicaoDe(event: SyntheticEvent): Position | null {
    const marca = (event.target as Element).getAttribute('data-cell');
    if (marca === null) {
      return null;
    }
    const [row, column] = marca.split(':').map(Number);
    return { column, row };
  }

  function ativar(position: Position) {
    onCellClick?.(celulaEm(position) ?? { value: null, x: colunas[position.column], y: linhas[position.row] });
  }

  function aoTeclar(event: KeyboardEvent<SVGGElement>) {
    const atual = posicaoDe(event);
    if (atual === null) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      ativar(atual);
      return;
    }

    const destino = moveFrom(atual, event.key, colunas.length, linhas.length);
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
      noData={semDado > 0 ? { color: NO_DATA_FILL, count: semDado, label: noDataLabel } : undefined}
      onHighlight={setFaixaEmDestaque}
      onToggle={faixas.toggle}
      position={legend === 'none' ? 'bottom' : legend}
      valueLabel={valueLabel}
    />
  );

  return (
    <CartesianFrame
      axisReveal={axisReveal}
      canvasRole={interativo ? 'group' : 'img'}
      containerRef={ref}
      empty={colunas.length === 0 || linhas.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legendContent={legenda}
      legendPosition={legend}
      margins={margins}
      plot={plot}
      root={root}
      title={title}
      tooltip={
        showTooltip
          ? {
              columns: [{ format: formatTooltipValue ?? formatValue }],
              computed: 'none',
              rows:
                celulaEmFoco?.value == null
                  ? []
                  : [{ color: escala.fillOf(datumOf(celulaEmFoco)), label: valueLabel, values: [celulaEmFoco.value] }],
              subtitle: emFoco === null ? undefined : linhas[emFoco.row],
              title: emFoco === null ? undefined : colunas[emFoco.column],
            }
          : undefined
      }
      width={width}
      xAxis={{ hideLine: true, labelRotation: rotation, ticks: marcasX, visibility: xAxis }}
      yAxis={{ hideLine: true, ticks: marcasY, visibility: yAxis }}
    >
      <g
        onBlur={() => focar(null)}
        onClick={(event) => {
          const position = posicaoDe(event);
          if (interativo && position !== null) {
            setParada(position);
            ativar(position);
          }
        }}
        onFocus={(event) => {
          const position = posicaoDe(event);
          if (position !== null) {
            setParada(position);
            focar(position);
          }
        }}
        onKeyDown={interativo ? aoTeclar : undefined}
        onMouseLeave={() => focar(null)}
        onMouseOver={(event) => focar(posicaoDe(event))}
      >
        {grade.map((linha, row) =>
          linha.map((cell, column) => {
            const position = { column, row };
            const datum = datumOf(cell);
            const chave = cell?.value == null ? undefined : escala.keyOf(datum);
            const oculta = chave !== undefined && faixas.isHidden(chave);
            const apagada = faixaEmDestaque !== null && chave !== faixaEmDestaque;
            const x = (escalaX(colunas[column]) ?? 0) + CELL_GAP / 2;
            const y = (escalaY(linhas[row]) ?? 0) + CELL_GAP / 2;
            const texto = cell?.value == null ? '' : formatValue(cell.value);
            const cabe =
              texto !== '' &&
              measureLabel(texto, font) + LABEL_PADDING * 2 <= larguraDaCelula &&
              font.size + LABEL_PADDING <= alturaDaCelula;
            const emFocoAgora = sameCell(emFoco, position);

            return (
              <g key={`${row}:${column}`}>
                <rect
                  aria-label={descrever(position)}
                  className={[styles.cell, interativo && styles.clickable, apagada && styles.dimmed, emFocoAgora && styles.focused]
                    .filter(Boolean)
                    .join(' ')}
                  data-cell={`${row}:${column}`}
                  fill={oculta ? HIDDEN_FILL : (escala.fillOf(datum) ?? NO_DATA_FILL)}
                  height={alturaDaCelula}
                  role={interativo ? 'button' : undefined}
                  rx={canto}
                  tabIndex={interativo ? (sameCell(parada, position) ? 0 : -1) : undefined}
                  width={larguraDaCelula}
                  x={x}
                  y={y}
                />
                {cabe && !oculta && markShown(showValues, emFocoAgora) && (
                  <text
                    className={styles.valueLabel}
                    dominantBaseline="central"
                    fill={escala.textColorOf(datum)}
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
      </g>
    </CartesianFrame>
  );
}
