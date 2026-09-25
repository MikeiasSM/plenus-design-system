import { useMemo, useState } from 'react';
import {
  CartesianFrame,
  barSlots,
  cartesianLayout,
  chartHeight,
  linePath,
  roundedBarPath,
  useChartMetrics,
  useSeriesToggle,
  useTweenedNumbers,
  valueLabelRoom,
  valueLabelsFor,
  type AxisLabelAngle,
  type AxisTick,
  type AxisVisibility,
  type ChartCurve,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartPoint,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance } from '../palette';
import { bandScale, domainOf, linearScale, mergeDomains, ticksFor } from '../scales';
import styles from './ChartCombo.module.css';

export type ChartComboKind = 'bar' | 'line';

/**
 * Eixo de valor a que a serie pertence. A escolha e sempre do produto: o
 * grafico nunca parte a escala por conta propria.
 */
export type ChartComboAxis = 'left' | 'right';

export interface ChartComboSeries extends SeriesAppearance {
  axis?: ChartComboAxis;
  kind: ChartComboKind;
  label: string;
  values: readonly (number | null)[];
}

export interface ChartComboProps {
  accent?: string;
  categories: readonly string[];
  curve?: ChartCurve;
  defaultHiddenSeries?: readonly string[];
  emptyMessage?: string;
  formatRightValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  hiddenSeries?: readonly string[];
  labelAngle?: AxisLabelAngle;
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  series: readonly ChartComboSeries[];
  showDataLabels?: boolean;
  showDots?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
}

function eixoDa(serie: ChartComboSeries): ChartComboAxis {
  return serie.axis ?? 'left';
}

/** Dominio de um eixo: so as series visiveis que pertencem a ele. */
function dominioDoEixo(
  series: readonly ChartComboSeries[],
  axis: ChartComboAxis,
  oculta: (label: string) => boolean,
) {
  return mergeDomains(
    series
      .filter((serie) => eixoDa(serie) === axis && !oculta(serie.label))
      .map((serie) => domainOf(serie.values.filter((valor) => valor !== null))),
  );
}

/**
 * Barras e linhas sobre o mesmo eixo de categorias. Uma serie declara a que
 * eixo de valor pertence; sem nenhuma a direita, o dominio e unico e o eixo
 * direito espelha o esquerdo.
 */
export function ChartCombo({
  accent,
  categories,
  curve = 'smooth',
  defaultHiddenSeries,
  emptyMessage = 'Sem dados no período',
  formatRightValue,
  formatValue = (valor) => String(valor),
  height = 260,
  hiddenSeries,
  labelAngle = 'auto',
  legend = 'bottom',
  legendAlign,
  onHiddenSeriesChange,
  series,
  showDataLabels = false,
  showDots = false,
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight,
}: ChartComboProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, toggle } = useSeriesToggle({ defaultHiddenSeries, hiddenSeries, onHiddenSeriesChange });
  const [faixaEmFoco, setFaixaEmFoco] = useState<number | null>(null);

  const formatarDireita = formatRightValue ?? formatValue;
  const temEixoDireito = series.some((serie) => eixoDa(serie) === 'right');

  // A cor sai da lista inteira, e nao das visiveis: desligar uma serie nao pode
  // repintar as demais.
  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  // Presenca de cada serie, entre zero e um. E ela que reparte a faixa, entao a
  // barra desligada encolhe enquanto as demais ocupam o lugar dela.
  const presencas = useTweenedNumbers(series.map((serie) => (isHidden(serie.label) ? 0 : 1)));

  const dominioEsquerda = useMemo(
    () => dominioDoEixo(series, 'left', isHidden),
    [isHidden, series],
  );

  const dominioDireita = useMemo(
    () => (temEixoDireito ? dominioDoEixo(series, 'right', isHidden) : dominioEsquerda),
    [dominioEsquerda, isHidden, series, temEixoDireito],
  );

  // Uma segunda escala sem eixo para le-la e o duplo eixo que engana. Havendo
  // serie a direita, o eixo aparece sem ninguem pedir.
  const visibilidadeDireita = yAxisRight ?? (temEixoDireito ? 'visible' : 'hidden');

  const { margins, plot, rotation } = cartesianLayout({
    bottomLabels: categories,
    font,
    height: alturaDoDesenho,
    labelAngle,
    leftLabels: valueLabelsFor(dominioEsquerda, alturaDoDesenho, formatValue),
    rightLabels: valueLabelsFor(dominioDireita, alturaDoDesenho, formatarDireita),
    topRoom: showDataLabels ? valueLabelRoom(font) : 0,
    width,
    xAxis,
    yAxis,
    yAxisRight: visibilidadeDireita,
  });

  // Barras e linhas compartilham a escala de faixas: a linha passa pelo centro
  // da faixa, que e onde a marca do eixo de categoria tambem fica.
  const escalaCategorias = useMemo(
    () => bandScale({ domain: categories, range: [0, plot.width] }),
    [categories, plot.width],
  );

  // A escala alvo fixa as marcas; a animada posiciona o desenho. Sem separar as
  // duas, as marcas exibiriam valores quebrados durante a transicao.
  const alvoEsquerda = useMemo(
    () => linearScale({ domain: dominioEsquerda, range: [plot.height, 0] }),
    [dominioEsquerda, plot.height],
  );

  const alvoDireita = useMemo(
    () => linearScale({ domain: dominioDireita, range: [plot.height, 0] }),
    [dominioDireita, plot.height],
  );

  // Os dois dominios caminham numa animacao so, e por isso chegam juntos.
  const [minEsquerda, maxEsquerda, minDireita, maxDireita] = useTweenedNumbers([
    ...alvoEsquerda.domain(),
    ...alvoDireita.domain(),
  ]);

  const escalaEsquerda = useMemo(
    () =>
      linearScale({ domain: { min: minEsquerda, max: maxEsquerda }, nice: false, range: [plot.height, 0] }),
    [maxEsquerda, minEsquerda, plot.height],
  );

  const escalaDireita = useMemo(
    () => linearScale({ domain: { min: minDireita, max: maxDireita }, nice: false, range: [plot.height, 0] }),
    [maxDireita, minDireita, plot.height],
  );

  const escalaDa = (serie: ChartComboSeries) =>
    eixoDa(serie) === 'right' ? escalaDireita : escalaEsquerda;
  const formatoDa = (serie: ChartComboSeries) =>
    eixoDa(serie) === 'right' ? formatarDireita : formatValue;

  const marcasEsquerda = ticksFor(alvoEsquerda, plot.height);
  const marcasDireita = ticksFor(alvoDireita, plot.height);

  const vao = escalaCategorias.bandwidth();

  // So as barras repartem a faixa: a linha passa pelo centro dela, e por isso
  // entra na conta com presenca zero.
  const faixas = barSlots(
    vao,
    series.map((serie, indice) => (serie.kind === 'bar' ? presencas[indice] ?? 0 : 0)),
  );

  const marcasCategoria: AxisTick[] = categories.map((categoria) => ({
    label: categoria,
    position: (escalaCategorias(categoria) ?? 0) + vao / 2,
  }));

  const marcasDeValor = (
    valores: readonly number[],
    escala: (valor: number) => number,
    formatar: (valor: number) => string,
  ): AxisTick[] => valores.map((valor) => ({ label: formatar(valor), position: escala(valor) }));

  return (
    <CartesianFrame
      containerRef={ref}
      empty={series.length === 0 || categories.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      grid={[
        {
          baseline: escalaEsquerda(0),
          lines: marcasEsquerda.map((valor) => escalaEsquerda(valor)),
          orientation: 'horizontal',
        },
      ]}
      height={alturaDoDesenho}
      legend={series.map((serie, indice) => ({
        color: cores[indice],
        hidden: isHidden(serie.label),
        label: serie.label,
      }))}
      legendAlign={legendAlign}
      legendPosition={legend}
      margins={margins}
      onToggleSeries={toggle}
      plot={plot}
      title={title}
      width={width}
      xAxis={{ labelRotation: rotation, ticks: marcasCategoria, visibility: xAxis }}
      yAxis={{
        hideLine: true,
        ticks: marcasDeValor(marcasEsquerda, escalaEsquerda, formatValue),
        visibility: yAxis,
      }}
      yAxisRight={{
        hideLine: true,
        ticks: marcasDeValor(marcasDireita, escalaDireita, formatarDireita),
        visibility: visibilidadeDireita,
      }}
    >
      {faixaEmFoco !== null && (
        <rect
          className={styles.cursor}
          height={plot.height}
          width={vao}
          x={escalaCategorias(categories[faixaEmFoco]) ?? 0}
          y={0}
        />
      )}

      {series.map((serie, indiceSerie) => {
        if (serie.kind !== 'bar') {
          return null;
        }

        const oculta = isHidden(serie.label);
        const escala = escalaDa(serie);
        const formatar = formatoDa(serie);
        const base = escala(0);

        return (
          <g
            aria-hidden={oculta || undefined}
            className={`${styles.series} ${oculta ? styles.seriesOff : ''}`}
            key={serie.label}
          >
            {categories.map((categoria, indiceCategoria) => {
              const valor = serie.values[indiceCategoria];

              if (valor === null || valor === undefined) {
                return null;
              }

              const ponta = escala(valor);

              return (
                <path
                  className={styles.bar}
                  d={roundedBarPath(
                    (escalaCategorias(categoria) ?? 0) + faixas[indiceSerie].offset,
                    Math.min(base, ponta),
                    faixas[indiceSerie].thickness,
                    Math.abs(ponta - base),
                    [raioDoCanto, raioDoCanto, raioDoCanto, raioDoCanto],
                  )}
                  fill={cores[indiceSerie]}
                  key={categoria}
                  onMouseEnter={() => setFaixaEmFoco(indiceCategoria)}
                  onMouseLeave={() => setFaixaEmFoco(null)}
                >
                  <title>{`${serie.label}, ${categoria}: ${formatar(valor)}`}</title>
                </path>
              );
            })}

            {showDataLabels &&
              categories.map((categoria, indiceCategoria) => {
                const valor = serie.values[indiceCategoria];

                if (valor === null || valor === undefined) {
                  return null;
                }

                return (
                  <text
                    className={styles.valueLabel}
                    key={categoria}
                    textAnchor="middle"
                    x={
                      (escalaCategorias(categoria) ?? 0) +
                      faixas[indiceSerie].offset +
                      faixas[indiceSerie].thickness / 2
                    }
                    y={escala(valor) - 6}
                  >
                    {formatar(valor)}
                  </text>
                );
              })}
          </g>
        );
      })}

      {series.map((serie, indiceSerie) => {
        if (serie.kind !== 'line') {
          return null;
        }

        const oculta = isHidden(serie.label);
        const escala = escalaDa(serie);
        const formatar = formatoDa(serie);
        const pontos = categories.map<ChartPoint | null>((categoria, indice) => {
          const valor = serie.values[indice];

          if (valor === null || valor === undefined) {
            return null;
          }

          return { x: (escalaCategorias(categoria) ?? 0) + vao / 2, y: escala(valor) };
        });

        return (
          <g
            aria-hidden={oculta || undefined}
            className={`${styles.series} ${oculta ? styles.seriesOff : ''}`}
            key={serie.label}
          >
            <path
              className={styles.line}
              d={linePath(pontos, curve)}
              fill="none"
              stroke={cores[indiceSerie]}
            />

            {pontos.map((ponto, indice) =>
              ponto === null ? null : (
                <circle
                  className={showDots ? styles.dotVisible : styles.dot}
                  cx={ponto.x}
                  cy={ponto.y}
                  fill={cores[indiceSerie]}
                  key={categories[indice]}
                  r={4}
                >
                  <title>{`${serie.label}, ${categories[indice]}: ${formatar(serie.values[indice] ?? 0)}`}</title>
                </circle>
              ),
            )}

            {showDataLabels &&
              pontos.map((ponto, indice) =>
                ponto === null ? null : (
                  <text
                    className={styles.valueLabel}
                    key={categories[indice]}
                    textAnchor="middle"
                    x={ponto.x}
                    y={ponto.y - 10}
                  >
                    {formatar(serie.values[indice] ?? 0)}
                  </text>
                ),
              )}
          </g>
        );
      })}
    </CartesianFrame>
  );
}
