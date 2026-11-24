import type { ButtonHTMLAttributes, ElementType, ReactNode, Ref } from 'react';
import { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from '../Button';
import { Badge } from '../../data-display/Badge';
import { Tooltip, type TooltipPlacement } from '../../overlays/Tooltip';
import styles from './ButtonIcon.module.css';

/** `xs` so existe no ButtonIcon: um quadrado de 24px, para a acao dentro de uma linha densa ou de um campo. */
export type ButtonIconSize = ButtonSize | 'xs';

export interface ButtonIconProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  /** Componente de link da aplicacao, como no `Button`: com `as`, `href` ou `linkProps` o ButtonIcon vira link. */
  as?: ElementType;
  /** Contagem no canto do botao, como as notificacoes pendentes. Zero ou ausente, sem selo. */
  count?: number;
  /** Nome do botao com o selo. O padrao e `${label}, ${n}`. */
  countLabel?: (count: number) => string;
  /** Por que a acao nao esta disponivel, como no `Button`. A dica mostra o `label` e o motivo. */
  disabledReason?: string;
  /** Destino da navegacao: o ButtonIcon passa a ser um `<a href>`; o `label` segue como nome do link. */
  href?: string;
  icon: ReactNode;
  /** Propriedades entregues inteiras ao componente de link, para o roteador que nao usa `href`. */
  linkProps?: Record<string, unknown>;
  /** Nome do botao: o leitor de tela o ouve, e a dica o mostra a quem passa o ponteiro ou chega pelo teclado. */
  label: string;
  ref?: Ref<HTMLButtonElement | HTMLAnchorElement>;
  size?: ButtonIconSize;
  /** Lado da dica. Numa coluna de acoes, `left` ou `right` nao cobre a linha de cima. */
  tooltipPlacement?: TooltipPlacement;
  /** `secondary` por padrao: um quadrado na cor principal chamaria mais atencao do que uma acao de icone pede. */
  variant?: ButtonVariant;
}

/**
 * O gatilho da dica. A dica repete o nome, e o Tooltip a liga por `aria-describedby`: o leitor ouviria o nome duas
 * vezes. O gatilho descarta a descricao que o Tooltip soma e fica com a do consumidor, mais o motivo do `Button`.
 */
function IconTrigger({ ownDescribedBy, ...props }: ButtonProps & { ownDescribedBy?: string; ref?: Ref<HTMLButtonElement | HTMLAnchorElement> }) {
  return <Button {...props} aria-describedby={ownDescribedBy} />;
}

export function ButtonIcon({
  'aria-describedby': ariaDescribedBy,
  className,
  count,
  countLabel,
  disabledReason,
  icon,
  label,
  size = 'md',
  tooltipPlacement,
  variant = 'secondary',
  ...props
}: ButtonIconProps) {
  const counted = count !== undefined && count > 0;
  const name = counted ? (countLabel ? countLabel(count) : `${label}, ${count}`) : label;
  const tip = props.disabled && disabledReason ? `${label} — ${disabledReason}` : label;

  return (
    <Tooltip content={tip} placement={tooltipPlacement}>
      <IconTrigger
        {...props}
        aria-label={name}
        className={[styles.buttonIcon, styles[size], counted && styles.counted, className].filter(Boolean).join(' ')}
        disabledReason={disabledReason}
        ownDescribedBy={ariaDescribedBy}
        size={size === 'xs' ? 'sm' : size}
        variant={variant}
      >
        {icon}
        {counted && (
          <Badge aria-hidden="true" className={styles.count} variant="count">
            {count}
          </Badge>
        )}
      </IconTrigger>
    </Tooltip>
  );
}
