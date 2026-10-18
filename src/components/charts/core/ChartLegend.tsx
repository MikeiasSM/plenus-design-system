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

/** Onde a legenda horizontal se apoia na largura do grafico. */
export type ChartLegendAlign = 'left' | 'center' | 'right';

const ALINHAMENTO: Record<ChartLegendAlign, string> = {
  left: styles.legendLeft,
  center: styles.legendCenter,
  right: styles.legendRight,
};

interface ChartLegendProps {
  align?: ChartLegendAlign;
  entries: readonly ChartLegendEntry[];
  /** Entrada sob o ponteiro ou o foco, para o grafico destacar o que ela representa; `null` ao sair. */
  onHighlight?: (label: string | null) => void;
  onToggle?: (label: string) => void;
  position: ChartLegendPosition;
  swatch?: ChartLegendSwatch;
}

/**
 * Legenda do grafico. Quando existe um alvo para o clique, cada entrada vira um
 * botao que liga e desliga a serie, com o estado exposto por `aria-pressed`.
 */
export function ChartLegend({
  align = 'center',
  entries,
  onHighlight,
  onToggle,
  position,
  swatch = 'square',
}: ChartLegendProps) {
  const lateral = position === 'left' || position === 'right';

  return (
    <ul className={`${styles.legend} ${lateral ? styles.legendSide : ALINHAMENTO[align]}`}>
      {entries.map((entrada, indice) => {
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
          <li
            className={styles.legendItem}
            key={indice}
            onBlur={onHighlight && (() => onHighlight(null))}
            onFocus={onHighlight && (() => onHighlight(entrada.label))}
            onPointerEnter={onHighlight && (() => onHighlight(entrada.label))}
            onPointerLeave={onHighlight && (() => onHighlight(null))}
          >
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
