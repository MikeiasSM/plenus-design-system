import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import styles from './Card.module.css';

export type CardHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface CardProps {
  children: ReactNode;
}

interface CardContextValue {
  registerTitle: () => void;
  titleId: string;
}

const CardContext = createContext<CardContextValue | undefined>(undefined);

function useCardContext(part: string) {
  const context = useContext(CardContext);

  if (!context) {
    throw new Error(part + ' deve ser usado dentro de Card.');
  }

  return context;
}

export function Card({ children }: CardProps) {
  const baseId = useId();
  const [titled, setTitled] = useState(false);
  const titleId = baseId + '-title';

  const context: CardContextValue = {
    registerTitle: useCallback(() => setTitled(true), []),
    titleId,
  };

  return (
    <section aria-labelledby={titled ? titleId : undefined} className={styles.card}>
      <CardContext.Provider value={context}>{children}</CardContext.Provider>
    </section>
  );
}

export interface CardHeaderProps {
  badge?: ReactNode;
  description?: ReactNode;
  headingLevel?: CardHeadingLevel;
  title: string;
  trailing?: ReactNode;
}

function CardHeader({ badge, description, headingLevel = 3, title, trailing }: CardHeaderProps) {
  const { registerTitle, titleId } = useCardContext('Card.Header');
  const Heading = ('h' + headingLevel) as 'h2';

  useEffect(registerTitle, [registerTitle]);

  return (
    <header className={styles.header}>
      <div className={styles.headline}>
        <div className={styles.titleRow}>
          <Heading className={styles.title} id={titleId}>
            {title}
          </Heading>
          {badge}
        </div>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {trailing && <div className={styles.trailing}>{trailing}</div>}
    </header>
  );
}

export interface CardBodyProps {
  children: ReactNode;
  flush?: boolean;
}

function CardBody({ children, flush = false }: CardBodyProps) {
  return <div className={flush ? styles.bodyFlush : styles.body}>{children}</div>;
}

export interface CardFooterProps {
  children: ReactNode;
}

function CardFooter({ children }: CardFooterProps) {
  return <footer className={styles.footer}>{children}</footer>;
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
