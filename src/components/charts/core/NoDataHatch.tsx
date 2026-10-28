import styles from './Chart.module.css';

export type NoDataStyle = 'hatch' | 'neutral';

export const NO_DATA_FILL = 'var(--pl-chart-no-data)';
export const NO_DATA_HATCH =
  'repeating-linear-gradient(45deg, var(--pl-chart-no-data-hatch) 0 1.5px, var(--pl-chart-no-data) 1.5px 4px)';

/** Hachura da ausencia de dado, para nao parecer o menor valor da escala. */
export function NoDataHatch({ id }: { id: string }) {
  return (
    <pattern height={6} id={id} patternTransform="rotate(45)" patternUnits="userSpaceOnUse" width={6}>
      <rect className={styles.hatchBackground} height={6} width={6} />
      <line className={styles.hatchLine} x1={0} x2={0} y1={0} y2={6} />
    </pattern>
  );
}
