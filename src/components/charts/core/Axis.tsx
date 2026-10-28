import type { AxisLabelRotation } from './cartesianLayout';
import { CHART_LABEL_OFFSET } from './spacing';
import styles from './Chart.module.css';

export type AxisOrientation = 'bottom' | 'top' | 'left' | 'right';

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
  top: 'middle',
};

const LINHA_DE_BASE: Record<AxisOrientation, 'hanging' | 'auto' | 'middle'> = {
  bottom: 'hanging',
  left: 'middle',
  right: 'middle',
  top: 'auto',
};

/**
 * Eixo de um grafico cartesiano. Recebe as marcas ja posicionadas: a conversao
 * de valor em pixel pertence a escala, nao ao desenho.
 */
export function Axis({ hideLine = false, labelRotation = 0, length, orientation, ticks }: AxisProps) {
  const horizontal = orientation === 'bottom' || orientation === 'top';
  const afastamento = orientation === 'left' || orientation === 'top' ? -CHART_LABEL_OFFSET : CHART_LABEL_OFFSET;
  const girado = horizontal && labelRotation !== 0;

  return (
    <g aria-hidden="true" className={styles.axis}>
      {!hideLine && (
        <line
          className={styles.axisLine}
          x1={0}
          x2={horizontal ? length : 0}
          y1={0}
          y2={horizontal ? 0 : length}
        />
      )}
      {ticks.map((marca, indice) => (
        <text
          className={styles.axisLabel}
          dominantBaseline={LINHA_DE_BASE[orientation]}
          key={indice}
          textAnchor={girado ? (orientation === 'top' ? 'start' : 'end') : ANCORA[orientation]}
          transform={girado ? `rotate(${-labelRotation} ${marca.position} ${afastamento})` : undefined}
          x={horizontal ? marca.position : afastamento}
          y={horizontal ? afastamento : marca.position}
        >
          {marca.label}
        </text>
      ))}
    </g>
  );
}
