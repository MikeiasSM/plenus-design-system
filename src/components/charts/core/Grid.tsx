import styles from './Chart.module.css';

export type GridOrientation = 'horizontal' | 'vertical';

export interface GridProps {
  baseline?: number;
  length: number;
  lines: readonly number[];
  orientation: GridOrientation;
}

/** Centro do pixel que contem a posicao: a linha de 1 px cai inteira num pixel e mantem a cor do token. */
const alinharAoMeioPixel = (posicao: number) => Math.floor(posicao) + 0.5;

/**
 * Linhas de referencia do grafico. A linha da base recebe destaque proprio:
 * ela separa valores positivos de negativos e nao e apenas mais uma marca.
 */
export function Grid({ baseline, length, lines, orientation }: GridProps) {
  const horizontal = orientation === 'horizontal';

  return (
    <g aria-hidden="true">
      {lines.map((posicao, indice) => {
        const alinhada = alinharAoMeioPixel(posicao);

        return (
          <line
            className={posicao === baseline ? styles.gridBaseline : styles.gridLine}
            key={indice}
            x1={horizontal ? 0 : alinhada}
            x2={horizontal ? length : alinhada}
            y1={horizontal ? alinhada : 0}
            y2={horizontal ? alinhada : length}
          />
        );
      })}
    </g>
  );
}
