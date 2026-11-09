import type { ComponentPropsWithRef } from 'react';
import { SidebarIndex } from './SidebarIndex';
import styles from './Sidebar.module.css';

export type SidebarProps = ComponentPropsWithRef<'div'>;
export type SidebarMainProps = ComponentPropsWithRef<'div'>;
export type SidebarAsideProps = ComponentPropsWithRef<'aside'>;

/** Conteúdo principal com uma coluna lateral ou com o índice da página; mede a própria largura. */
function SidebarRoot({ children, className, ...props }: SidebarProps) {
  return (
    <div {...props} className={[styles.sidebar, className].filter(Boolean).join(' ')}>
      <div className={styles.layout}>{children}</div>
    </div>
  );
}

function Main({ className, ...props }: SidebarMainProps) {
  return <div {...props} className={[styles.main, className].filter(Boolean).join(' ')} />;
}

function Aside({ className, ...props }: SidebarAsideProps) {
  return <aside {...props} className={[styles.aside, className].filter(Boolean).join(' ')} />;
}

export const Sidebar = Object.assign(SidebarRoot, { Aside, Index: SidebarIndex, Main });
