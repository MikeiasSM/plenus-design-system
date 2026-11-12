import type { PointerEvent, SyntheticEvent } from 'react';
import type { ChartAnchorPoint } from './useMarkNavigation';
import styles from './Chart.module.css';

export type ChartLegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

export interface ChartLegendEntry {
  /** Entrada da marca sob o ponteiro ou o foco no desenho: ela se destaca e as demais recuam. */
  active?: boolean;
  color: string;
  hidden?: boolean;
  label: string;
  /** Medida da entrada, alinhada a direita. Serve a legenda em lista do anel. */
  value?: string;
}

export type ChartLegendSwatch = 'square' | 'dot';

/** Onde a legenda horizontal se apoia na largura do gráfico. */
export type ChartLegendAlign = 'left' | 'center' | 'right';

const ALINHAMENTO: Record<ChartLegendAlign, string> = {
  left: styles.legendLeft,
  center: styles.legendCenter,
  right: styles.legendRight,
};

export interface ChartLegendProps {
  align?: ChartLegendAlign;
  entries: readonly ChartLegendEntry[];
  /** Entrada sob o ponteiro ou o foco, com o ponto da janela onde ancorar o balão, para o gráfico destacar o que ela representa; `null` ao sair. */
  onHighlight?: (label: string | null, anchor?: ChartAnchorPoint) => void;
  /** Ponteiro andando sobre a legenda, para o balão acompanha-lo como acompanha o desenho; `null` ao sair. */
  onPointerAt?: (point: ChartAnchorPoint | null) => void;
  onToggle?: (label: string) => void;
  position: ChartLegendPosition;
  swatch?: ChartLegendSwatch;
}

/** Ponta direita da entrada, a meia altura, com a caixa dela: no foco, que não tem ponteiro, o balão encosta na entrada. */
function anchorOf(event: SyntheticEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();

  return { height: box.height, width: box.width, x: box.right, y: box.top + box.height / 2 };
}

const pointOf = (event: PointerEvent<HTMLElement>) => ({ x: event.clientX, y: event.clientY });

/**
 * Legenda do gráfico. Quando existe um alvo para o clique, cada entrada vira um
 * botão que liga e desliga a série, com o estado exposto por `aria-pressed`.
 */
export function ChartLegend({
  align = 'center',
  entries,
  onHighlight,
  onPointerAt,
  onToggle,
  position,
  swatch = 'square',
}: ChartLegendProps) {
  const lateral = position === 'left' || position === 'right';

  return (
    // A saida e da lista, e não da entrada: o ponteiro que cruza o espaço entre duas entradas mantem o realce.
    <ul
      className={`${styles.legend} ${lateral ? styles.legendSide : ALINHAMENTO[align]}`}
      onPointerLeave={
        onHighlight &&
        (() => {
          onHighlight(null);
          onPointerAt?.(null);
        })
      }
    >
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
            data-active={entrada.active || undefined}
            key={indice}
            onBlur={onHighlight && (() => onHighlight(null))}
            onFocus={onHighlight && ((evento) => onHighlight(entrada.label, anchorOf(evento)))}
            onPointerEnter={onHighlight && ((evento) => onHighlight(entrada.label, pointOf(evento)))}
            onPointerMove={onPointerAt && ((evento) => onPointerAt(pointOf(evento)))}
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
