import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ElementType,
  type ReactNode,
} from 'react';
import styles from './Card.module.css';

export type CardHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** `sm` encolhe o respiro e poe a descricao abaixo do titulo, que para na terceira linha. */
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

export interface CardHeaderProps extends Omit<ComponentPropsWithRef<'header'>, 'children' | 'title'> {
  /** Componente de link da aplicacao para o titulo, como no `Breadcrumb`: com `as`, `href` ou `linkProps`, o titulo vira link. */
  as?: ElementType;
  badge?: ReactNode;
  description?: ReactNode;
  headingLevel?: CardHeadingLevel;
  /** Destino do titulo: so o titulo vira link, e o cartao continua sem clique. */
  href?: string;
  /** Icone decorativo num ladrilho tonal, a esquerda do titulo; fica fora do nome. */
  icon?: ReactNode;
  /** Propriedades entregues inteiras ao componente de link, para o roteador que nao usa `href`. */
  linkProps?: Record<string, unknown>;
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
    observer.observe(end.parentElement ?? end);

    return () => observer.disconnect();
  }, [enabled]);

  return { titleRow, trailing, wrapped };
}

function CardHeader({
  as,
  badge,
  className,
  description,
  headingLevel = 3,
  href,
  icon,
  linkProps,
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

  const trailingBox = trailing && (
    <div className={join(styles.trailing, narrow.wrapped && styles.trailingHidden)} ref={narrow.trailing}>
      {trailing}
    </div>
  );
  const Link = as ?? 'a';
  const linked = as !== undefined || href !== undefined || linkProps !== undefined;
  const titleRow = (
    <div className={styles.titleRow} ref={narrow.titleRow}>
      <Heading className={styles.title} id={titleId}>
        {linked ? (
          <Link className={styles.titleLink} href={href} {...linkProps}>
            {title}
          </Link>
        ) : (
          title
        )}
      </Heading>
      {badge && <span className={styles.badge}>{badge}</span>}
    </div>
  );
  // O ladrilho fica ao lado da linha do titulo, e a descricao continua na largura inteira, abaixo dos dois.
  const leadRow =
    icon != null && icon !== false ? (
      <div className={styles.lead}>
        <span aria-hidden="true" className={styles.icon}>
          {icon}
        </span>
        {titleRow}
      </div>
    ) : (
      titleRow
    );
  const descriptionBox = description && <p className={styles.description}>{description}</p>;

  return (
    <header
      {...props}
      className={join(
        styles.header,
        flowing && styles.flowing,
        trailingWhenNarrow === 'keep' && styles.keep,
        size === 'sm' && styles.headerSm,
        className,
      )}
    >
      {flowing ? (
        <>
          <div className={styles.text}>
            {leadRow}
            {descriptionBox}
          </div>
          {trailingBox}
        </>
      ) : (
        <>
          {leadRow}
          {descriptionBox}
          {trailingBox}
        </>
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
  /** O que fica no rodapé; com `start`, vai à direita e pode faltar. */
  children?: ReactNode;
  /** Conteúdo à esquerda do rodapé, como uma ação secundária ou a situação; os filhos ficam à direita. */
  start?: ReactNode;
}

function CardFooter({ children, className, start, ...props }: CardFooterProps) {
  // Com `start`, a esquerda e a direita viram dois blocos: o da esquerda toma o espaço que sobra e o dos filhos fica
  // no fim da linha, e só existe quando há filho a mostrar. Sem ele, os filhos continuam diretos no rodapé, como antes.
  const temFilhos = Children.toArray(children).length > 0;
  const temStart = start != null && start !== false;

  return (
    <footer {...props} className={join(styles.footer, temStart && styles.footerWrap, className)}>
      {temStart ? (
        <>
          <div className={styles.footerStart}>{start}</div>
          {temFilhos && <div className={styles.footerEnd}>{children}</div>}
        </>
      ) : (
        children
      )}
    </footer>
  );
}

export type CardMediaRatio = '1:1' | '4:3' | '16:9';
export type CardMediaPlacement = 'top' | 'end';

export interface CardMediaProps extends Omit<ComponentPropsWithRef<'img'>, 'children' | 'src' | 'alt'> {
  /** Texto alternativo. Vazio quando a imagem só ilustra o que o texto ao lado já diz. */
  alt: string;
  /** `top`: largura toda, antes do cabecalho. `end`: ao fim da linha, ao lado do conteudo, como num item de lista. */
  placement?: CardMediaPlacement;
  ratio?: CardMediaRatio;
  /** Sem endereco, ou se a imagem nao carregar, o `Card.Media` nao ocupa espaco: o cartao fica como sem imagem. */
  src?: string | null;
}

/** Imagem do cartao. Cobre a area sem distorcer; sem imagem, some sem deixar buraco. */
function CardMedia({ alt, className, onError, placement = 'top', ratio = placement === 'end' ? '1:1' : '16:9', src, ...props }: CardMediaProps) {
  useCardContext('Card.Media');
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return null;
  }

  return (
    <img
      decoding="async"
      loading="lazy"
      {...props}
      alt={alt}
      className={join(styles.media, placement === 'end' ? styles.mediaEnd : styles.mediaTop, styles['ratio' + ratio.replace(':', 'x')], className)}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      src={src}
    />
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Media = CardMedia;
