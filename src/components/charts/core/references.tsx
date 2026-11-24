import type { ChartLegendEntry } from './ChartLegend';
import type { ChartTableProps } from './ChartTable';
import type { LabelFont } from './measureText';
import type { ChartPlot } from './cartesianLayout';
import styles from './Chart.module.css';

/** Tom de status da referencia: pinta a faixa e o tracado da linha. */
export type ChartReferenceTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Valor de referencia no eixo dos valores, como uma meta ou um limite. */
export interface ChartReferenceLine {
  label: string;
  tone?: ChartReferenceTone;
  type: 'line';
  value: number;
}

/** Intervalo de referencia no eixo dos valores, como uma faixa aceitavel. */
export interface ChartReferenceBand {
  from: number;
  label: string;
  to: number;
  tone?: ChartReferenceTone;
  type: 'band';
}

export type ChartReference = ChartReferenceLine | ChartReferenceBand;

/** Onde um valor fica em relacao a referencia. */
export type ChartReferencePosition = 'acima' | 'dentro' | 'abaixo' | 'igual';

const CLASSE_DO_TOM: Record<ChartReferenceTone, string | undefined> = {
  neutral: undefined,
  info: styles.referenceInfo,
  success: styles.referenceSuccess,
  warning: styles.referenceWarning,
  danger: styles.referenceDanger,
};

/** Classe da referencia, com a cor do tom em `--pl-reference-color`. */
export function referenceToneClass(tone: ChartReferenceTone = 'neutral') {
  return [styles.reference, CLASSE_DO_TOM[tone]].filter(Boolean).join(' ');
}

/** So as referencias desenhaveis: numero invalido nao vira geometria, e a faixa invertida se acerta. */
export function validReferences(references: readonly ChartReference[] | undefined): ChartReference[] {
  return (references ?? []).flatMap<ChartReference>((referencia) => {
    if (referencia.type === 'line') {
      return Number.isFinite(referencia.value) ? [referencia] : [];
    }

    if (!Number.isFinite(referencia.from) || !Number.isFinite(referencia.to)) {
      return [];
    }

    return [{ ...referencia, from: Math.min(referencia.from, referencia.to), to: Math.max(referencia.from, referencia.to) }];
  });
}

/** Valores que o eixo precisa alcancar: uma meta fora da vista nao serve. */
export function referenceValues(references: readonly ChartReference[]): number[] {
  return references.flatMap((referencia) => (referencia.type === 'line' ? [referencia.value] : [referencia.from, referencia.to]));
}

/** O valor da referencia por extenso: `80`, ou `60 a 95` na faixa. */
export function referenceValueText(referencia: ChartReference, format: (value: number) => string) {
  return referencia.type === 'line' ? format(referencia.value) : `${format(referencia.from)} a ${format(referencia.to)}`;
}

/** Entradas da legenda, depois das series: nao ligam nem desligam nada. */
export function referenceLegend(references: readonly ChartReference[], format: (value: number) => string): ChartLegendEntry[] {
  return references.map((referencia) => ({
    color: '',
    label: `${referencia.label}: ${referenceValueText(referencia, format)}`,
    reference: { kind: referencia.type, tone: referencia.tone ?? 'neutral' },
  }));
}

function lista(partes: readonly string[]) {
  if (typeof Intl !== 'undefined' && 'ListFormat' in Intl) {
    return new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' }).format(partes);
  }

  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}` : (partes[0] ?? '');
}

/** Complemento do nome acessivel do grafico: `com Meta de 80 e Faixa aceitável de 60 a 95`. */
export function referenceName(references: readonly ChartReference[], format: (value: number) => string) {
  if (references.length === 0) {
    return undefined;
  }

  return `com ${lista(references.map((referencia) => `${referencia.label} de ${referenceValueText(referencia, format)}`))}`;
}

/** Acima, dentro ou abaixo da faixa; acima, igual ou abaixo da linha. */
export function referencePosition(referencia: ChartReference, value: number): ChartReferencePosition {
  if (referencia.type === 'line') {
    return value > referencia.value ? 'acima' : value < referencia.value ? 'abaixo' : 'igual';
  }

  return value > referencia.to ? 'acima' : value < referencia.from ? 'abaixo' : 'dentro';
}

/** Valores comparados a referencia em cada categoria: uma serie, ou o total da pilha. */
export interface ReferenceComparison {
  label: string;
  values: readonly (number | null | undefined)[];
}

/**
 * O que se compara a referencia: as series do eixo esquerdo, que e o da referencia, ou o total da pilha quando as
 * series empilham num eixo so. A tabela mostra o dado inteiro, entao a legenda nao filtra a comparacao.
 */
export function referenceComparisons(
  series: readonly { axis?: 'left' | 'right'; label: string; values: readonly (number | null | undefined)[] }[],
  categoryCount: number,
  stacked = false,
): ReferenceComparison[] {
  const daEsquerda = series.filter((serie) => (serie.axis ?? 'left') === 'left');

  if (stacked && daEsquerda.length > 1) {
    return [
      {
        label: 'Total',
        values: Array.from({ length: categoryCount }, (_, indice) => {
          const validos = daEsquerda.map((serie) => serie.values[indice]).filter((valor): valor is number => typeof valor === 'number' && Number.isFinite(valor));

          return validos.length === 0 ? null : validos.reduce((soma, valor) => soma + valor, 0);
        }),
      },
    ];
  }

  return daEsquerda.map((serie) => ({ label: serie.label, values: serie.values }));
}

/**
 * Soma a tabela da categoria uma coluna por referencia, com a posicao de cada valor comparado. Uma comparacao so
 * escreve a posicao sozinha; mais de uma, a posicao de cada uma pelo nome.
 */
export function withReferenceColumns(
  table: Pick<ChartTableProps, 'columns' | 'rows'>,
  references: readonly ChartReference[],
  compared: readonly ReferenceComparison[],
  format: (value: number) => string,
): Pick<ChartTableProps, 'columns' | 'rows'> {
  if (references.length === 0) {
    return table;
  }

  return {
    columns: [...table.columns, ...references.map((referencia) => `${referencia.label} (${referenceValueText(referencia, format)})`)],
    rows: table.rows.map((linha, indice) => ({
      ...linha,
      cells: [
        ...linha.cells,
        ...references.map((referencia) => {
          const posicoes = compared.flatMap((comparacao) => {
            const valor = comparacao.values[indice];

            return typeof valor === 'number' && Number.isFinite(valor) ? [{ label: comparacao.label, posicao: referencePosition(referencia, valor) }] : [];
          });

          if (compared.length === 1) {
            return posicoes[0]?.posicao ?? '';
          }

          return posicoes.map(({ label, posicao }) => `${label} ${posicao}`).join(', ');
        }),
      ],
    })),
  };
}

export interface ChartReferencesProps {
  font: LabelFont;
  format: (value: number) => string;
  /** `back` desenha as faixas, atras das marcas; `front`, as linhas e os rotulos, por cima. */
  layer: 'back' | 'front';
  /** `vertical` quando o valor sobe no eixo vertical; na barra horizontal, o valor corre na horizontal. */
  orientation?: 'vertical' | 'horizontal';
  plot: ChartPlot;
  references: readonly ChartReference[];
  /** Escala do eixo dos valores, a mesma das marcas, para a referencia acompanhar a animacao. */
  scale: (value: number) => number;
}

/** Afastamento entre o rotulo da linha e a borda da area ou o tracado. */
const FOLGA = 4;

/** Linhas e faixas de referencia, presas ao eixo dos valores e sem interacao. */
export function ChartReferences({ font, format, layer, orientation = 'vertical', plot, references, scale }: ChartReferencesProps) {
  if (references.length === 0) {
    return null;
  }

  const vertical = orientation === 'vertical';

  if (layer === 'back') {
    return (
      <g aria-hidden="true" className={styles.references}>
        {references.map((referencia, indice) => {
          if (referencia.type !== 'band') {
            return null;
          }

          const inicio = scale(referencia.from);
          const fim = scale(referencia.to);
          const menor = Math.min(inicio, fim);
          const tamanho = Math.abs(fim - inicio);

          return (
            <rect
              className={`${referenceToneClass(referencia.tone)} ${styles.referenceBand}`}
              height={vertical ? tamanho : plot.height}
              key={indice}
              width={vertical ? plot.width : tamanho}
              x={vertical ? 0 : menor}
              y={vertical ? menor : 0}
            />
          );
        })}
      </g>
    );
  }

  return (
    <g aria-hidden="true" className={styles.references}>
      {references.map((referencia, indice) => {
        if (referencia.type !== 'line') {
          return null;
        }

        const posicao = scale(referencia.value);
        const texto = `${referencia.label} ${format(referencia.value)}`;
        // Na vertical, o rotulo fica sobre a linha, na ponta direita; colado ao topo, desce para baixo dela.
        const abaixo = posicao - FOLGA - font.size < 0;
        // Na horizontal, fica no alto, do lado da linha que tem mais espaco.
        const aEsquerda = posicao > plot.width / 2;

        return (
          <g className={referenceToneClass(referencia.tone)} key={indice}>
            <line
              className={styles.referenceLine}
              x1={vertical ? 0 : posicao}
              x2={vertical ? plot.width : posicao}
              y1={vertical ? posicao : 0}
              y2={vertical ? posicao : plot.height}
            />
            <text
              className={styles.referenceLabel}
              dominantBaseline={vertical ? (abaixo ? 'hanging' : 'auto') : 'hanging'}
              textAnchor={vertical || aEsquerda ? 'end' : 'start'}
              x={vertical ? plot.width - FOLGA : posicao + (aEsquerda ? -FOLGA : FOLGA)}
              y={vertical ? posicao + (abaixo ? FOLGA : -FOLGA) : FOLGA}
            >
              {texto}
            </text>
          </g>
        );
      })}
    </g>
  );
}
