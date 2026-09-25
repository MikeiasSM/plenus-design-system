import styles from './Chart.module.css';

export type AxisOrientation = 'bottom' | 'left';
export type AxisLabelRotation = 0 | 45 | 90;

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

const AFASTAMENTO = 8;

/**
 * Eixo de um grafico cartesiano. Recebe as marcas ja posicionadas: a conversao
 * de valor em pixel pertence a escala, nao ao desenho.
 */
export function Axis({ hideLine = false, labelRotation = 0, length, orientation, ticks }: AxisProps) {
  const deBaixo = orientation === 'bottom';

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
          textAnchor={deBaixo ? anchorFor(labelRotation) : 'end'}
          transform={
            deBaixo && labelRotation !== 0
              ? `rotate(${-labelRotation} ${marca.position} ${AFASTAMENTO})`
              : undefined
          }
          x={deBaixo ? marca.position : -AFASTAMENTO}
          y={deBaixo ? AFASTAMENTO : marca.position}
        >
          {marca.label}
        </text>
      ))}
    </g>
  );
}

function anchorFor(rotation: AxisLabelRotation) {
  return rotation === 0 ? 'middle' : 'end';
}
