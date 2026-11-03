import type { ComponentPropsWithRef, ReactNode } from 'react';
import styles from './ShellIconButton.module.css';

export interface ShellIconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'aria-label' | 'children'> {
  icon: ReactNode;
  label: string;
}

/** Botão só com ícone das barras do AppShell: recolher e abrir o submenu, abrir o menu. */
export function ShellIconButton({ className, icon, label, type = 'button', ...props }: ShellIconButtonProps) {
  return (
    <button {...props} aria-label={label} className={[styles.button, className].filter(Boolean).join(' ')} type={type}>
      {icon}
    </button>
  );
}
