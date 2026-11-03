import { truncateToWidth, type LabelFont } from './measureText';
import styles from './Chart.module.css';

export interface AxisTitleProps {
  font: LabelFont;
  /** Comprimento do eixo: o titulo mais largo que ele e cortado com reticencias. */
  length: number;
  rotation: 0 | -90 | 90;
  text: string;
  /** Centro do texto, na origem da area de desenho. */
  x: number;
  y: number;
}

/**
 * Titulo de um eixo cartesiano. Fica fora da arvore de acessibilidade, como os
 * rotulos do eixo: o nome do grafico e o titulo dele, e nao se repete aqui.
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
