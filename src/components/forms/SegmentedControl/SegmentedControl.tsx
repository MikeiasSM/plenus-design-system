import { Fragment, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useAvisoDeGrupoSemNome } from '../../../hooks/useAvisoDeGrupoSemNome';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { Tooltip } from '../../overlays/Tooltip';
import styles from './SegmentedControl.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

export interface SegmentedControlItem {
  /** Classe somada à do segmento, o `label` que envolve o rádio. */
  className?: string;
  /** Texto oculto ligado ao rádio por `aria-describedby`, para o que o rótulo curto não diz. */
  description?: string;
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  /** Conteúdo visível depois do rótulo, como uma contagem. É decorativo: fica fora do nome, com `aria-hidden`. */
  trailing?: ReactNode;
  value: string;
}

export type SegmentedControlSize = 'sm' | 'md' | 'lg';

export interface SegmentedControlProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange'> {
  defaultValue?: string;
  disabled?: boolean;
  /** Mostra so os icones; o `label` de cada item continua sendo o nome e aparece como dica. */
  iconOnly?: boolean;
  items: readonly SegmentedControlItem[];
  /** Nome do grupo, para o leitor de tela. Opcional quando o grupo já é nomeado por `aria-labelledby` ou `aria-label`. */
  label?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  size?: SegmentedControlSize;
  value?: string;
}

/** Escolha unica em poucos segmentos lado a lado. Por baixo sao radios nativos: setas, Tab e formulario vem do navegador. */
export function SegmentedControl({
  className,
  defaultValue,
  disabled = false,
  iconOnly = false,
  items,
  label,
  name: providedName,
  onValueChange,
  ref: refDoConsumidor,
  size = 'md',
  value,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...props
}: SegmentedControlProps) {
  useAvisoDeGrupoSemNome('SegmentedControl', { ariaLabel, ariaLabelledby, label });
  const baseId = useId();
  const generatedName = `segmented-control-${baseId}`;
  const name = providedName ?? generatedName;
  const controlled = value !== undefined;
  // Os radios seguem nativos; o estado so acompanha a escolha, para o `data-selected` e para trazer o escolhido a vista.
  const [internalValue, setInternalValue] = useState(defaultValue);
  const atual = controlled ? value : internalValue;
  const ref = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, refDoConsumidor);

  // O escolhido entra na vista ao montar e ao mudar. Ajusta so a rolagem do proprio controle: `scrollIntoView`
  // rolaria tambem a pagina e os ancestrais.
  useLayoutEffect(() => {
    const controle = ref.current;
    const escolhido = controle?.querySelector<HTMLElement>('[data-selected]');

    if (!controle || !escolhido) {
      return;
    }

    const caixa = controle.getBoundingClientRect();
    const segmento = escolhido.getBoundingClientRect();
    const inicio = caixa.left + controle.clientLeft;
    const fim = inicio + controle.clientWidth;

    if (segmento.left < inicio) {
      controle.scrollLeft -= inicio - segmento.left;
    } else if (segmento.right > fim) {
      controle.scrollLeft += segmento.right - fim;
    }
  }, [atual]);

  return (
    <div
      {...props}
      aria-label={ariaLabelledby ? undefined : (label ?? ariaLabel)}
      aria-labelledby={ariaLabelledby}
      className={[styles.control, styles[size], thinScrollbar, className].filter(Boolean).join(' ')}
      ref={mergedRef}
      role="radiogroup"
    >
      {items.map((item, index) => {
        const desabilitado = disabled || item.disabled;
        const descricaoId = item.description ? `${baseId}-${index}-descricao` : undefined;
        const segment = (
          <label
            className={[styles.segment, iconOnly && styles.iconOnly, item.className].filter(Boolean).join(' ')}
            data-disabled={desabilitado || undefined}
            data-selected={atual === item.value || undefined}
          >
            <input
              aria-describedby={descricaoId}
              checked={controlled ? value === item.value : undefined}
              className={styles.input}
              defaultChecked={controlled ? undefined : defaultValue === item.value}
              disabled={desabilitado}
              name={name}
              onChange={() => {
                if (!controlled) {
                  setInternalValue(item.value);
                }
                onValueChange?.(item.value);
              }}
              type="radio"
              value={item.value}
            />
            {item.icon && (
              <span aria-hidden="true" className={styles.icon}>
                {item.icon}
              </span>
            )}
            <span className={iconOnly ? styles.hiddenText : undefined}>{item.label}</span>
            {item.trailing !== undefined && item.trailing !== null && (
              <span aria-hidden="true" className={styles.trailing}>
                {item.trailing}
              </span>
            )}
          </label>
        );

        // A descricao fica fora do `label`: dentro dele, entraria no nome do radio.
        return (
          <Fragment key={item.value}>
            {iconOnly ? <Tooltip content={item.label}>{segment}</Tooltip> : segment}
            {descricaoId && (
              <span className={styles.hiddenText} id={descricaoId}>
                {item.description}
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
