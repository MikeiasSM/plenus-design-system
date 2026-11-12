import { truncateToWidth, type LabelFont } from './measureText';
import styles from './Chart.module.css';

export interface AxisTitleProps {
  font: LabelFont;
  /** Comprimento do eixo: o título mais largo que ele e cortado com reticências. */
  length: number;
  rotation: 0 | -90 | 90;
  text: string;
  /** Centro do texto, na origem da área de desenho. */
  x: number;
  y: number;
}

/**
 * Título de um eixo cartesiano. Fica fora da árvore de acessibilidade, como os
 * rótulos do eixo: o nome do gráfico e o título dele, e não se repete aqui.
 */
export function AxisTitle({ font, length, rotation, text, x, y }: AxisTitleProps) {
  return (
    <text
      aria-hidden="true"
      className={styles.axisTitle}
      dominantBaseline="middle"
      textAnchor="middle"
      transform={`translate(${x} ${y}) rotate(${rotation})`}
    >
      {truncateToWidth(text, font, length, font.labelWeight)}
    </text>
  );
}
