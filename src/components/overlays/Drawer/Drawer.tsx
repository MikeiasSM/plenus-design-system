import type { DialogBaseProps, DialogTitledProps, DialogUntitledProps } from '../Dialog/Dialog';
import { DialogFrame } from '../Dialog/DialogFrame';
import styles from './Drawer.module.css';

export type DrawerSide = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg';

type DrawerTitledProps = Omit<DialogTitledProps, 'icon'>;
type DrawerUntitledProps = Omit<DialogUntitledProps, 'icon'>;

export type DrawerProps = DialogBaseProps &
  (DrawerTitledProps | DrawerUntitledProps) & {
    /** Corpo sem o respiro interno, para o conteúdo que desenha a própria margem, como uma lista ou uma tabela. */
    flush?: boolean;
    side?: DrawerSide;
    size?: DrawerSize;
  };

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
