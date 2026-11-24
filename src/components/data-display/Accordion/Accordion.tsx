import {
  useEffect,
  useId,
  useMemo,
  useRef,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import styles from './Accordion.module.css';
import { IconChevronDown } from '../../icons';
import { VisuallyHidden } from '../../accessibility/VisuallyHidden';
import { blockRepeatedPress } from '../../../utils/press/press';

export interface AccordionItem {
  content: ReactNode;
  disabled?: boolean;
  /**
   * Conteudo ao fim do cabecalho, antes do indicador, como uma contagem ou um selo. Decorativo (`aria-hidden`) e nunca
   * interativo, porque fica dentro do botao: o que ele diz entra no nome por `endLabel`.
   */
  end?: ReactNode;
  /** Texto que entra no nome do cabecalho pelo que o `end` mostra, como "3 pendentes". */
  endLabel?: string;
  /** Icone antes do rotulo, decorativo (`aria-hidden`). */
  icon?: ReactNode;
  /** Id do cabecalho, para um link de ancora apontar a secao. */
  id?: string;
  key: string;
  label: string;
  /** Texto pequeno acima do rotulo, com a inicial maiuscula, como a etapa ou a categoria. Entra no nome do cabecalho. */
  overline?: ReactNode;
}

export type AccordionIconPosition = 'left' | 'right';
export type AccordionIndicator = 'chevron' | 'plus';
export type AccordionAppearance = 'plain' | 'divided' | 'separated';
export type AccordionHeaderStyle = 'default' | 'compact';
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface AccordionProps extends ComponentPropsWithRef<'div'> {
  defaultExpandedKeys?: readonly string[];
  expandedKeys?: readonly string[];
  items: readonly AccordionItem[];
  multiple?: boolean;
  onExpandedKeysChange?: (keys: readonly string[]) => void;
  /** Direita e a convencao da web; esquerda serve a rotulos curtos em coluna estreita. */
  iconPosition?: AccordionIconPosition;
  /**
   * `plain` sem contorno; `divided`, um contorno com divisor entre as secoes; `separated`, um cartao por secao, com
   * vao entre eles. Sem ela, vale o `divider`.
   */
  appearance?: AccordionAppearance;
  /** Divisor entre as secoes, com a folga que ele exige. O mesmo que `appearance="divided"`; `false`, `plain`. */
  divider?: boolean;
  /** `compact`: cabecalho menor e denso, em texto de legenda e cor secundaria, para listas longas de secoes. */
  headerStyle?: AccordionHeaderStyle;
  /** `chevron` gira ao abrir; `plus` vira o sinal de menos. */
  indicator?: AccordionIndicator;
  /** Nivel do titulo de cada secao, na hierarquia da pagina em que o acordeao esta. */
  headingLevel?: AccordionHeadingLevel;
}

interface PainelProps extends ComponentPropsWithRef<'div'> {
  aberto: boolean;
  /** Sem ele, o painel fechado fica fora da busca da pagina. */
  abrir?: () => void;
}

/**
 * Painel fechado com `hidden="until-found"`: o Ctrl+F do navegador acha o texto dele, e o evento `beforematch`
 * abre a secao. O atributo entra depois da montagem, porque o React so conhece o `hidden` booleano.
 */
function Painel({ aberto, abrir, ...props }: PainelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const painel = ref.current;

    if (!painel || aberto || !abrir) {
      return;
    }

    painel.setAttribute('hidden', 'until-found');
    painel.addEventListener('beforematch', abrir);

    return () => painel.removeEventListener('beforematch', abrir);
  }, [aberto, abrir]);

  return <div {...props} hidden={!aberto} ref={ref} />;
}

export function Accordion({
  className,
  defaultExpandedKeys,
  expandedKeys,
  items,
  multiple = false,
  onExpandedKeysChange,
  iconPosition = 'right',
  appearance,
  divider = true,
  headerStyle = 'default',
  headingLevel = 3,
  indicator = 'chevron',
  ...props
}: AccordionProps) {
  const aparencia = appearance ?? (divider ? 'divided' : 'plain');
  const baseId = `accordion-${useId()}`;
  const Titulo = `h${headingLevel}` as const;
  const nodes = useRef(new Map<string, HTMLElement>());
  const collection = useMemo<SelectionItem[]>(
    () => items.map((item) => ({ key: item.key, disabled: item.disabled, textValue: item.label })),
    [items],
  );
  const selection = useSelection({
    // Uma secao aberta fecha ao ser clicada de novo, e nenhuma aberta e um
    // estado valido do acordeao — ao contrario de uma aba, que sempre tem uma.
    allowEmpty: true,
    items: collection,
    mode: multiple ? 'multiple' : 'single',
    defaultSelectedKeys: expandedKeys === undefined ? defaultExpandedKeys : undefined,
    selectedKeys: expandedKeys,
    onSelectionChange: (keys) => {
      onExpandedKeysChange?.([...keys]);
    },
  });

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, key: string) {
    let destino: string | undefined;

    if (event.key === 'ArrowDown') {
      destino = proxima(collection, key, 1);
    } else if (event.key === 'ArrowUp') {
      destino = proxima(collection, key, -1);
    } else if (event.key === 'Home') {
      destino = collection.find((item) => !item.disabled)?.key;
    } else if (event.key === 'End') {
      destino = [...collection].reverse().find((item) => !item.disabled)?.key;
    }

    if (destino) {
      event.preventDefault();
      nodes.current.get(destino)?.focus();
    }
  }

  return (
    <div
      {...props}
      className={[
        styles.accordion,
        aparencia === 'divided' && styles.divided,
        aparencia === 'separated' && styles.separated,
        headerStyle === 'compact' && styles.compact,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item) => {
        const aberto = selection.selectedKeys.has(item.key);

        return (
          <div className={styles.item} data-expanded={aberto || undefined} key={item.key}>
            <Titulo className={styles.heading} id={item.id}>
              <button
                ref={(node) => {
                  if (node) {
                    nodes.current.set(item.key, node);
                  } else {
                    nodes.current.delete(item.key);
                  }
                }}
                className={[styles.trigger, iconPosition === 'left' && styles.iconLeft].filter(Boolean).join(' ')}
                type="button"
                id={`${baseId}-${item.key}`}
                aria-controls={`${baseId}-${item.key}-panel`}
                aria-expanded={aberto}
                disabled={item.disabled}
                onClick={() => selection.select(item.key)}
                onKeyDown={(event) => {
                  if (!blockRepeatedPress(event)) {
                    handleKeyDown(event, item.key);
                  }
                }}
              >
                {item.icon && (
                  <span aria-hidden="true" className={styles.itemIcon}>
                    {item.icon}
                  </span>
                )}
                <span className={styles.label}>
                  {/* Os espacos entre as partes separam as palavras no nome do botao; entre itens flex, nao aparecem. */}
                  {item.overline && (
                    <>
                      <span className={styles.overline}>{item.overline}</span>{' '}
                    </>
                  )}
                  {item.overline ? <span>{item.label}</span> : item.label}
                </span>
                {item.end && (
                  <span aria-hidden="true" className={styles.end}>
                    {item.end}
                  </span>
                )}
                {item.endLabel && (
                  <>
                    {' '}
                    <VisuallyHidden>{item.endLabel}</VisuallyHidden>
                  </>
                )}
                {indicator === 'plus' ? (
                  <IndicadorMais aberto={aberto} />
                ) : (
                  <IconChevronDown className={[styles.icon, aberto && styles.iconOpen].filter(Boolean).join(' ')} size={16} />
                )}
              </button>
            </Titulo>
            <Painel
              aberto={aberto}
              abrir={item.disabled ? undefined : () => selection.select(item.key)}
              aria-labelledby={`${baseId}-${item.key}`}
              className={styles.panel}
              id={`${baseId}-${item.key}-panel`}
              role="region"
            >
              {item.content}
            </Painel>
          </div>
        );
      })}
    </div>
  );
}

/* O traco vertical recolhe ao abrir, e o sinal de mais vira o de menos: um desenho so, para a transicao. */
function IndicadorMais({ aberto }: { aberto: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={[styles.icon, styles.plus, aberto && styles.plusOpen].filter(Boolean).join(' ')}
      data-indicator="plus"
      fill="none"
      focusable="false"
      height={16}
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={1.5}
      viewBox="0 0 16 16"
      width={16}
    >
      <path d="M3 8h10" />
      <path className={styles.plusVertical} d="M8 3v10" />
    </svg>
  );
}

function proxima(items: readonly SelectionItem[], from: string, passo: 1 | -1) {
  const total = items.length;
  const inicio = items.findIndex((item) => item.key === from);

  for (let i = 1; i <= total; i += 1) {
    const item = items[(inicio + passo * i + total * total) % total];
    if (!item.disabled) {
      return item.key;
    }
  }

  return from;
}
