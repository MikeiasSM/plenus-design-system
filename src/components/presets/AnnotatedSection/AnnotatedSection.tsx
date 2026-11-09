import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import styles from './AnnotatedSection.module.css';

export interface AnnotatedSectionProps extends Omit<ComponentPropsWithRef<'section'>, 'title'> {
  /** Ação opcional, abaixo da explicação. */
  action?: ReactNode;
  children: ReactNode;
  /** Explicação abaixo do título. */
  description?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  title: string;
}

/** Seção com título e explicação num trilho à esquerda e o conteúdo à direita; em uma coluna, o trilho fica acima. */
export function AnnotatedSection({
  action,
  children,
  className,
  description,
  headingLevel = 2,
  title,
  ...props
}: AnnotatedSectionProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;

  return (
    <section {...props} aria-labelledby={titleId} className={[styles.annotatedSection, className].filter(Boolean).join(' ')}>
      <div className={styles.layout}>
        <div className={styles.note}>
          <Heading className={styles.title} id={titleId}>
            {title}
          </Heading>
          {description && <p className={styles.description}>{description}</p>}
          {action && <div className={styles.action}>{action}</div>}
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </section>
  );
}
