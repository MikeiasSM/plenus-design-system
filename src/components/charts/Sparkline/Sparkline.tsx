import { useContext, type ComponentPropsWithRef } from 'react';
import { CardMetricContext } from '../../data-display/CardMetric/CardMetricContext';
import { Skeleton } from '../../feedback/Skeleton';
import { bandScale, domainOf, linearScale, pointScale, type NumericRange } from '../scales';
import { sparklineName, type SparklineLabels } from './sparklineTrend';
import styles from './Sparkline.module.css';

export type SparklineVariant = 'line' | 'bar';

export interface SparklineProps
  extends Omit<ComponentPropsWithRef<'svg'>, 'children' | 'format' | 'height' | 'role' | 'width'> {
  /** Os valores, na ordem do tempo. Um valor que nao e numero abre um vao na linha e fica sem barra. */
  data: readonly number[];
  variant?: SparklineVariant;
  /** Abre o nome acessivel, antes da tendencia: "Vendas nos ultimos 30 dias". */
  label?: string;
  /** Textos da tendencia no nome acessivel. */
  labels?: Partial<SparklineLabels>;
  /** Opcoes do `Intl.NumberFormat` para o primeiro e o ultimo valor do nome. Compacto, por padrao. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** Altura em pixels. */
  height?: number;
  /** Largura em pixels ou qualquer medida CSS. Sem ela, a largura do conteiner. */
  width?: number | string;
}

/** Largura do desenho em unidades do `viewBox`; o SVG estica so na horizontal, ate a largura real. */
const LARGURA = 100;
/** Raio do ponto final. A linha recua dele em cima e embaixo para o ponto nao ser cortado. */
const RAIO_DO_PONTO = 2.5;

/** Faixa da linha. Uma serie constante fica no meio da altura, e nao colada ao chao. */
function dominioDaLinha(valores: readonly number[]): NumericRange {
  const { max, min } = domainOf(valores, { includeZero: false });

  return min === max ? { max: max + 1, min: min - 1 } : { max, min };
}

/** Trechos da linha entre os vaos. Um trecho de um ponto vira um traco de comprimento zero, que a ponta redonda faz ponto. */
function caminhoDaLinha(data: readonly number[], x: (indice: number) => number, y: (valor: number) => number) {
  let caminho = '';
  let trecho: string[] = [];
  const fechar = () => {
    if (trecho.length === 1) {
      caminho += `M${trecho[0]}L${trecho[0]}`;
    } else if (trecho.length > 1) {
      caminho += `M${trecho.join('L')}`;
    }

    trecho = [];
  };

  data.forEach((valor, indice) => {
    if (Number.isFinite(valor)) {
      trecho.push(`${x(indice)},${y(valor)}`);
    } else {
      fechar();
    }
  });
  fechar();

  return caminho;
}

/**
 * Tendencia compacta, sem eixo, grade nem balao, ao lado de um numero. E uma imagem: o nome acessivel diz a
 * tendencia do primeiro ao ultimo valor, sem leitura ponto a ponto. Dentro do `CardMetric`, acompanha os estados
 * da moldura: carregando vira esqueleto; com erro, sai.
 */
export function Sparkline({
  'aria-label': ariaLabel,
  className,
  data,
  format,
  height = 24,
  label,
  labels,
  locale,
  style,
  variant = 'line',
  width = '100%',
  ...props
}: SparklineProps) {
  const moldura = useContext(CardMetricContext);

  if (moldura?.error) {
    return null;
  }

  if (moldura?.loading) {
    return <Skeleton height={height} shape="block" width={width} />;
  }

  const nome = ariaLabel ?? sparklineName(data, { format, label, labels, locale });
  const validos = data.filter(Number.isFinite);
  const indices = data.map((_, indice) => String(indice));

  return (
    <svg
      {...props}
      aria-label={nome}
      className={[styles.sparkline, className].filter(Boolean).join(' ')}
      data-variant={variant}
      height={height}
      preserveAspectRatio="none"
      role="img"
      style={{ width, ...style }}
      viewBox={`0 0 ${LARGURA} ${height}`}
    >
      {validos.length > 0 && (variant === 'bar' ? <Barras data={data} height={height} indices={indices} /> : <Linha data={data} height={height} indices={indices} />)}
    </svg>
  );
}

interface DesenhoProps {
  data: readonly number[];
  height: number;
  indices: readonly string[];
}

function Linha({ data, height, indices }: DesenhoProps) {
  const x = pointScale({ domain: indices, padding: 0, range: [0, LARGURA] });
  const y = linearScale({
    domain: dominioDaLinha(data.filter(Number.isFinite)),
    nice: false,
    range: [height - RAIO_DO_PONTO, RAIO_DO_PONTO],
  });
  const xDe = (indice: number) => x(String(indice)) ?? 0;
  let ultimo = data.length - 1;

  while (ultimo > 0 && !Number.isFinite(data[ultimo])) {
    ultimo -= 1;
  }

  const fim = `${xDe(ultimo)},${y(data[ultimo])}`;

  return (
    <g className={styles.reveal}>
      <path className={styles.line} d={caminhoDaLinha(data, xDe, y)} vectorEffect="non-scaling-stroke" />
      <path className={styles.lastPoint} d={`M${fim}L${fim}`} vectorEffect="non-scaling-stroke" />
    </g>
  );
}

/** As barras partem do zero: barra que nao parte dele exagera a diferenca entre os valores. */
function Barras({ data, height, indices }: DesenhoProps) {
  const x = bandScale({ domain: indices, padding: 0.2, range: [0, LARGURA] });
  const y = linearScale({ domain: domainOf(data), nice: false, range: [height, 0] });
  const base = y(0);

  return (
    <g className={styles.reveal}>
      {data.map((valor, indice) => {
        if (!Number.isFinite(valor)) {
          return null;
        }

        const topo = y(valor);

        return (
          <rect
            className={styles.bar}
            height={Math.abs(base - topo)}
            key={indice}
            width={x.bandwidth()}
            x={x(String(indice))}
            y={Math.min(base, topo)}
          />
        );
      })}
    </g>
  );
}
