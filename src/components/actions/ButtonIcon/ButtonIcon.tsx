import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Button, type ButtonSize, type ButtonVariant } from '../Button';
import { Tooltip } from '../../overlays/Tooltip';
import styles from './ButtonIcon.module.css';

export interface ButtonIconProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  icon: ReactNode;
  /** Nome do botao: o leitor de tela o ouve, e a dica o mostra a quem passa o ponteiro ou chega pelo teclado. */
  label: string;
  ref?: Ref<HTMLButtonElement>;
  size?: ButtonSize;
  /** `secondary` por padrao: um quadrado na cor principal chamaria mais atencao do que uma acao de icone pede. */
  variant?: ButtonVariant;
}

export function ButtonIcon({ className, icon, label, size = 'md', variant = 'secondary', ...props }: ButtonIconProps) {
  return (
    <Tooltip content={label}>
      <Button
        {...props}
        aria-label={label}
        className={[styles.buttonIcon, styles[size], className].filter(Boolean).join(' ')}
        size={size}
        variant={variant}
      >
        {icon}
      </Button>
    </Tooltip>
  );
}
