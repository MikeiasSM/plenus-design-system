import { useId, useState, type ButtonHTMLAttributes, type ComponentPropsWithRef, type MouseEvent, type ReactNode, type Ref } from 'react';
import { withoutRepeat } from '../../../utils/press/press';
import { VisuallyHidden } from '../../accessibility/VisuallyHidden';
import { Tooltip } from '../../overlays/Tooltip';
import styles from './ButtonTile.module.css';

export type ButtonTileSize = 'sm' | 'md';

export interface ButtonTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'aria-pressed' | 'children'> {
  defaultSelected?: boolean;
  /** Mostrada como dica no foco e no ponteiro, e ligada ao botão por `aria-describedby`. */
  description?: string;
  /** Esconde o rótulo: ele segue como nome do botão e aparece na dica, antes da descrição. */
  hideLabel?: boolean;
  icon: ReactNode;
  /** Texto visível e nome do botão. */
  label: string;
  onSelectedChange?: (selected: boolean) => void;
  ref?: Ref<HTMLButtonElement>;
  /** Com `selected`, `defaultSelected` ou `onSelectedChange`, o ladrilho alterna e anuncia `aria-pressed`. Sem eles, é um botão comum. */
  selected?: boolean;
  size?: ButtonTileSize;
}

/**
 * Gatilho da dica com o rótulo escondido. A dica começa pelo nome, e o Tooltip a liga por `aria-describedby`: o
 * leitor ouviria o nome duas vezes. O gatilho descarta essa descrição e fica com a do consumidor e a da `description`.
 */
function HiddenLabelTrigger({ ownDescribedBy, ...props }: ComponentPropsWithRef<'button'> & { ownDescribedBy?: string }) {
  return <button {...props} aria-describedby={ownDescribedBy} />;
}

export function ButtonTile({
  'aria-describedby': ariaDescribedBy,
  className,
  defaultSelected,
  description,
  hideLabel = false,
  icon,
  label,
  onClick,
  onKeyDown,
  onSelectedChange,
  selected,
  size = 'md',
  type = 'button',
  ...props
}: ButtonTileProps) {
  const [internalSelected, setInternalSelected] = useState(defaultSelected ?? false);
  const toggleable = selected !== undefined || defaultSelected !== undefined || onSelectedChange !== undefined;
  const currentSelected = selected ?? internalSelected;
  const descriptionId = `tile-description-${useId()}`;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (!toggleable) {
      return;
    }
    if (selected === undefined) {
      setInternalSelected(!currentSelected);
    }
    onSelectedChange?.(!currentSelected);
  }

  const buttonProps = {
    ...props,
    'aria-pressed': toggleable ? currentSelected : undefined,
    className: [styles.tile, styles[size], className].filter(Boolean).join(' '),
    onClick: handleClick,
    onKeyDown: withoutRepeat(onKeyDown),
    type,
  };
  const content = (
    <>
      <span aria-hidden="true" className={styles.icon}>
        {icon}
      </span>
      {hideLabel ? <VisuallyHidden>{label}</VisuallyHidden> : <span className={styles.label}>{label}</span>}
    </>
  );

  if (hideLabel) {
    const ownDescribedBy = [ariaDescribedBy, description && descriptionId].filter(Boolean).join(' ') || undefined;

    return (
      <>
        <Tooltip content={description ? `${label} — ${description}` : label}>
          <HiddenLabelTrigger {...buttonProps} ownDescribedBy={ownDescribedBy}>
            {content}
          </HiddenLabelTrigger>
        </Tooltip>
        {description && (
          <VisuallyHidden hidden id={descriptionId}>
            {description}
          </VisuallyHidden>
        )}
      </>
    );
  }

  const tile = (
    <button {...buttonProps} aria-describedby={ariaDescribedBy}>
      {content}
    </button>
  );

  return description ? <Tooltip content={description}>{tile}</Tooltip> : tile;
}
