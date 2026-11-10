import type { ComponentPropsWithRef, ReactNode } from 'react';
import styles from './DescriptionList.module.css';

export type DescriptionListLayout = 'stacked' | 'inline';

export interface DescriptionListProps extends ComponentPropsWithRef<'dl'> {
  /** `stacked`, o padrão: o termo em cima e a descrição embaixo. `inline`: o termo à esquerda e a descrição à direita, na mesma linha. */
  layout?: DescriptionListLayout;
}

export interface DescriptionListItemProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** A descrição do termo. */
  children?: ReactNode;
  /** Destaca a linha, como a de um total: linha separadora acima e peso de rótulo. */
  emphasis?: boolean;
  /** O termo descrito. */
  term: ReactNode;
}

/** O layout fica só na raiz e o CSS o leva aos itens: sem contexto, a lista serve também num Server Component. */
function DescriptionListRoot({ className, layout = 'stacked', ...props }: DescriptionListProps) {
  return <dl {...props} className={[styles.root, className].filter(Boolean).join(' ')} data-layout={layout} />;
}

function DescriptionListItem({ children, className, emphasis = false, term, ...props }: DescriptionListItemProps) {
  return (
    <div {...props} className={[styles.item, className].filter(Boolean).join(' ')} data-emphasis={emphasis || undefined}>
      <dt className={styles.term}>{term}</dt>
      <dd className={styles.description}>{children}</dd>
    </div>
  );
}

export const DescriptionList = Object.assign(DescriptionListRoot, { Item: DescriptionListItem });
