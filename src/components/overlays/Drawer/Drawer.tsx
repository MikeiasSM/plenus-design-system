import type { DialogBaseProps, DialogTitledProps } from '../Dialog/Dialog';
import { DialogFrame } from '../Dialog/DialogFrame';
import styles from './Drawer.module.css';

export type DrawerSide = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg';

export interface DrawerProps extends DialogBaseProps, Omit<DialogTitledProps, 'icon'> {
  side?: DrawerSide;
  size?: DrawerSize;
}

/** Painel modal preso a lateral da tela, com a mesma mecanica do `Dialog`: foco preso, Esc fecha, a pagina nao rola. */
export function Drawer({ side = 'right', size = 'md', ...props }: DrawerProps) {
  return (
    <DialogFrame
      {...props}
      surfaceClassName={[styles.drawer, styles[size]].join(' ')}
      underlayClassName={[styles.underlay, styles[side]].join(' ')}
    />
  );
}
