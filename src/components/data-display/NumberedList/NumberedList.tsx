import { createContext, useContext, type ComponentPropsWithRef, type ReactNode } from 'react';
import styles from './NumberedList.module.css';

export type NumberedListLayout = 'list' | 'grid';

export interface NumberedListProps extends ComponentPropsWithRef<'ol'> {
  /** `list`, o padrão: passos um abaixo do outro. `grid`: ladrilhos numa grade que se ajusta à largura. */
  layout?: NumberedListLayout;
}

export interface NumberedListItemProps extends Omit<ComponentPropsWithRef<'li'>, 'title' | 'children'> {
  /** Explicação abaixo do título. */
  description?: ReactNode;
  title: ReactNode;
}

const NumberedListContext = createContext<NumberedListLayout>('list');

function NumberedListRoot({ className, layout = 'list', ...props }: NumberedListProps) {
  return (
    <NumberedListContext value={layout}>
      <ol {...props} className={[styles.root, className].filter(Boolean).join(' ')} data-layout={layout} />
    </NumberedListContext>
  );
}

function NumberedListItem({ className, description, title, ...props }: NumberedListItemProps) {
  const layout = useContext(NumberedListContext);

  return (
    <li {...props} className={[styles.item, className].filter(Boolean).join(' ')} data-layout={layout}>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
    </li>
  );
}

export const NumberedList = Object.assign(NumberedListRoot, { Item: NumberedListItem });
