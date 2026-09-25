import styles from './Chart.module.css';

export type GridOrientation = 'horizontal' | 'vertical';

export interface GridProps {
  baseline?: number;
  length: number;
  lines: readonly number[];
  orientation: GridOrientation;
}

/**
 * Linhas de referencia do grafico. A linha da base recebe destaque proprio:
 * ela separa valores positivos de negativos e nao e apenas mais uma marca.
 */
export function Grid({ baseline, length, lines, orientation }: GridProps) {
  const horizontal = orientation === 'horizontal';

  return (
    <g aria-hidden="true">
      {lines.map((posicao) => (
        <line
          className={posicao === baseline ? styles.gridBaseline : styles.gridLine}
          key={posicao}
          x1={horizontal ? 0 : posicao}
          x2={horizontal ? length : posicao}
          y1={horizontal ? posicao : 0}
          y2={horizontal ? posicao : length}
        />
      ))}
    </g>
  );
}
