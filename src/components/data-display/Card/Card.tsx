import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import styles from './Card.module.css';

export type CardHeadingLevel = 2 | 3 | 4 | 5 | 6;

/** `sm` encolhe o respiro e poe a descricao em largura inteira abaixo do titulo, que para na terceira linha. */
export type CardSize = 'sm' | 'md';

/** O que o `trailing` faz quando o titulo, numa linha so, nao cabe ao lado dele. */
export type CardTrailingWhenNarrow = 'keep' | 'wrap' | 'hide';

export interface CardProps extends ComponentPropsWithRef<'section'> {
  children: ReactNode;
  size?: CardSize;
}

interface CardContextValue {
  registerTitle: () => () => void;
  size: CardSize;
  titled: boolean;
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

/** Id do titulo do cabecalho, enquanto ele existir, para quem compoe sobre o Card nomear algo por ele. */
export function useCardTitle() {
  const { titled, titleId } = useCardContext('useCardTitle');

  return titled ? titleId : undefined;
}

const join = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

export function Card({ 'aria-labelledby': ariaLabelledBy, children, className, size = 'md', ...props }: CardProps) {
  const baseId = useId();
  const [titled, setTitled] = useState(false);
  const titleId = baseId + '-title';

  // O titulo que sai da tela desfaz o registro; senao o cartao apontava para um id que nao existe mais.
  const context: CardContextValue = {
    registerTitle: useCallback(() => {
      setTitled(true);
      return () => setTitled(false);
    }, []),
    size,
    titled,
    titleId,
  };

  return (
    <section
      {...props}
      aria-labelledby={ariaLabelledBy ?? (titled ? titleId : undefined)}
      className={join(styles.card, size === 'sm' && styles.sm, className)}
    >
      <CardContext.Provider value={context}>{children}</CardContext.Provider>
    </section>
  );
}

export interface CardHeaderProps extends Omit<ComponentPropsWithRef<'header'>, 'title'> {
  badge?: ReactNode;
  description?: ReactNode;
  headingLevel?: CardHeadingLevel;
  title: string;
  trailing?: ReactNode;
  trailingWhenNarrow?: CardTrailingWhenNarrow;
}

/**
 * Se o `trailing` desceu de linha. Ele continua no fluxo mesmo oculto, sem altura, para a quebra seguir
 * medindo a largura dele; fora do fluxo, o titulo voltaria a caber e ele reapareceria.
 */
function useTrailingWrapped(enabled: boolean) {
  const titleRow = useRef<HTMLDivElement>(null);
  const trailing = useRef<HTMLDivElement>(null);
  const [wrapped, setWrapped] = useState(false);

  useLayoutEffect(() => {
    const row = titleRow.current;
    const end = trailing.current;

    if (!enabled || !row || !end) {
      setWrapped(false);
      return;
    }

    const measure = () => setWrapped(end.offsetTop > row.offsetTop);
    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(row.parentElement ?? row);

    return () => observer.disconnect();
  }, [enabled]);

  return { titleRow, trailing, wrapped };
}

function CardHeader({
  badge,
  className,
  description,
  headingLevel = 3,
  title,
  trailing,
  trailingWhenNarrow = 'keep',
  ...props
}: CardHeaderProps) {
  const { registerTitle, size, titleId } = useCardContext('Card.Header');
  const Heading = ('h' + headingLevel) as 'h2';
  const flowing = size === 'sm' || trailingWhenNarrow !== 'keep';
  const narrow = useTrailingWrapped(Boolean(trailing) && trailingWhenNarrow === 'hide');

  useEffect(registerTitle, [registerTitle]);

  return (
    <header
      {...props}
      className={join(styles.header, flowing && styles.flowing, trailingWhenNarrow === 'keep' && styles.keep, className)}
    >
      <div className={styles.titleRow} ref={narrow.titleRow}>
        <Heading className={styles.title} id={titleId}>
          {title}
        </Heading>
        {badge}
      </div>
      {description && <p className={styles.description}>{description}</p>}
      {trailing && (
        <div className={join(styles.trailing, narrow.wrapped && styles.trailingHidden)} ref={narrow.trailing}>
          {trailing}
        </div>
      )}
    </header>
  );
}

export interface CardBodyProps extends ComponentPropsWithRef<'div'> {
  children: ReactNode;
  flush?: boolean;
}

function CardBody({ className, flush = false, ...props }: CardBodyProps) {
  return <div {...props} className={join(flush ? styles.bodyFlush : styles.body, className)} />;
}

export interface CardFooterProps extends ComponentPropsWithRef<'footer'> {
  children: ReactNode;
}

function CardFooter({ className, ...props }: CardFooterProps) {
  return <footer {...props} className={join(styles.footer, className)} />;
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
