import type { ComponentPropsWithRef } from 'react';
import { ColumnsIndex } from './ColumnsIndex';
import styles from './Columns.module.css';

export type ColumnsProps = ComponentPropsWithRef<'div'>;
export type ColumnsMainProps = ComponentPropsWithRef<'div'>;
export type ColumnsAsideProps = ComponentPropsWithRef<'aside'>;

/** Conteúdo principal com uma coluna lateral ou com o índice da página; mede a própria largura. */
function ColumnsRoot({ children, className, ...props }: ColumnsProps) {
  return (
    <div {...props} className={[styles.columns, className].filter(Boolean).join(' ')}>
      <div className={styles.layout}>{children}</div>
    </div>
  );
}

function Main({ className, ...props }: ColumnsMainProps) {
  return <div {...props} className={[styles.main, className].filter(Boolean).join(' ')} />;
}

function Aside({ className, ...props }: ColumnsAsideProps) {
  return <aside {...props} className={[styles.aside, className].filter(Boolean).join(' ')} />;
}

export const Columns = Object.assign(ColumnsRoot, { Aside, Index: ColumnsIndex, Main });
