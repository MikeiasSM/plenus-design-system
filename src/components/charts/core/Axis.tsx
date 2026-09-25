import type { AxisLabelRotation } from './cartesianLayout';
import { CHART_LABEL_OFFSET } from './spacing';
import styles from './Chart.module.css';

export type AxisOrientation = 'bottom' | 'left' | 'right';

export interface AxisTick {
  label: string;
  position: number;
}

export interface AxisProps {
  hideLine?: boolean;
  labelRotation?: AxisLabelRotation;
  length: number;
  orientation: AxisOrientation;
  ticks: readonly AxisTick[];
}

const ANCORA: Record<AxisOrientation, 'start' | 'end' | 'middle'> = {
  bottom: 'middle',
  left: 'end',
  right: 'start',
};

/**
 * Eixo de um grafico cartesiano. Recebe as marcas ja posicionadas: a conversao
 * de valor em pixel pertence a escala, nao ao desenho.
 */
export function Axis({ hideLine = false, labelRotation = 0, length, orientation, ticks }: AxisProps) {
  const deBaixo = orientation === 'bottom';
  const afastamento = orientation === 'left' ? -CHART_LABEL_OFFSET : CHART_LABEL_OFFSET;

  return (
    <g aria-hidden="true" className={styles.axis}>
      {!hideLine && (
        <line
          className={styles.axisLine}
          x1={0}
          x2={deBaixo ? length : 0}
          y1={0}
          y2={deBaixo ? 0 : length}
        />
      )}
      {ticks.map((marca) => (
        <text
          className={styles.axisLabel}
          dominantBaseline={deBaixo ? 'hanging' : 'middle'}
          key={marca.label + marca.position}
          textAnchor={deBaixo && labelRotation !== 0 ? 'end' : ANCORA[orientation]}
          transform={
            deBaixo && labelRotation !== 0
              ? `rotate(${-labelRotation} ${marca.position} ${CHART_LABEL_OFFSET})`
              : undefined
          }
          x={deBaixo ? marca.position : afastamento}
          y={deBaixo ? CHART_LABEL_OFFSET : marca.position}
        >
          {marca.label}
        </text>
      ))}
    </g>
  );
}
