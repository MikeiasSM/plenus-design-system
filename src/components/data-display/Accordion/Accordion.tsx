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

export interface AccordionItem {
  content: ReactNode;
  disabled?: boolean;
  /** Id do cabecalho, para um link de ancora apontar a secao. */
  id?: string;
  key: string;
  label: string;
}

export type AccordionIconPosition = 'left' | 'right';
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface AccordionProps extends ComponentPropsWithRef<'div'> {
  defaultExpandedKeys?: readonly string[];
  expandedKeys?: readonly string[];
  items: readonly AccordionItem[];
  multiple?: boolean;
  onExpandedKeysChange?: (keys: readonly string[]) => void;
  /** @deprecated Use `onExpandedKeysChange`. */
  onExpandedChange?: (keys: readonly string[]) => void;
  /** Direita e a convencao da web; esquerda serve a rotulos curtos em coluna estreita. */
  iconPosition?: AccordionIconPosition;
  /** Divisor entre as secoes, com a folga que ele exige. */
  divider?: boolean;
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
  onExpandedChange,
  iconPosition = 'right',
  divider = true,
  headingLevel = 3,
  ...props
}: AccordionProps) {
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
      onExpandedChange?.([...keys]);
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
      className={[styles.accordion, divider && styles.divided, className].filter(Boolean).join(' ')}
    >
      {items.map((item) => {
        const aberto = selection.selectedKeys.has(item.key);

        return (
          <div className={styles.item} key={item.key}>
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
                onKeyDown={(event) => handleKeyDown(event, item.key)}
              >
                <span className={styles.label}>{item.label}</span>
                <IconChevronDown className={[styles.icon, aberto && styles.iconOpen].filter(Boolean).join(' ')} size={16} />
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
