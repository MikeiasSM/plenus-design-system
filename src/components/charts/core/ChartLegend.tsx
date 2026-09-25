import styles from './Chart.module.css';

export type ChartLegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

export interface ChartLegendEntry {
  color: string;
  hidden?: boolean;
  label: string;
  /** Medida da entrada, alinhada a direita. Serve a legenda em lista do anel. */
  value?: string;
}

export type ChartLegendSwatch = 'square' | 'dot';

interface ChartLegendProps {
  entries: readonly ChartLegendEntry[];
  onToggle?: (label: string) => void;
  position: ChartLegendPosition;
  swatch?: ChartLegendSwatch;
}

/**
 * Legenda do grafico. Quando existe um alvo para o clique, cada entrada vira um
 * botao que liga e desliga a serie, com o estado exposto por `aria-pressed`.
 */
export function ChartLegend({ entries, onToggle, position, swatch = 'square' }: ChartLegendProps) {
  const lateral = position === 'left' || position === 'right';

  return (
    <ul className={`${styles.legend} ${lateral ? styles.legendSide : ''}`}>
      {entries.map((entrada) => {
        const conteudo = (
          <>
            <span
              aria-hidden="true"
              className={`${styles.swatch} ${swatch === 'dot' ? styles.swatchDot : ''}`}
              style={entrada.hidden ? undefined : { background: entrada.color }}
            />
            <span className={styles.legendLabel}>{entrada.label}</span>
            {entrada.value !== undefined && <span className={styles.legendValue}>{entrada.value}</span>}
          </>
        );

        return (
          <li className={styles.legendItem} key={entrada.label}>
            {onToggle ? (
              <button
                aria-pressed={!entrada.hidden}
                className={`${styles.legendButton} ${entrada.hidden ? styles.legendOff : ''}`}
                onClick={() => onToggle(entrada.label)}
                type="button"
              >
                {conteudo}
              </button>
            ) : (
              conteudo
            )}
          </li>
        );
      })}
    </ul>
  );
}
