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
import { formatNumber } from '../../../utils/formatters';
import { VisuallyHidden } from '../../accessibility/VisuallyHidden';
import styles from './Tabs.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

export interface TabItem {
  content: ReactNode;
  /** Quantidade mostrada num selo depois do rótulo. Entra no nome da aba: "Rótulo, N". */
  count?: number;
  disabled?: boolean;
  key: string;
  label: string;
  /** Aba de menor peso, em texto terciário. Continua focável e selecionável. */
  muted?: boolean;
}

export type TabsOrientation = 'horizontal' | 'vertical';

/** `underline` é a faixa com o traço sob a aba ativa; `segmented`, o trilho com a aba ativa em superfície. */
export type TabsAppearance = 'underline' | 'segmented';

export interface TabsProps extends ComponentPropsWithRef<'div'> {
  /** Ações ao lado das abas, como um botão ou um filtro. Ficam fora do `tablist`, num envoltório com a linha da faixa. */
  actions?: ReactNode;
  appearance?: TabsAppearance;
  defaultSelectedKey?: string;
  /** O painel ocupa a altura que sobra nas abas e rola por dentro. As abas precisam de altura, dada por quem as usa. */
  fillHeight?: boolean;
  /** As abas dividem a largura em partes iguais, em vez de ficar do tamanho do rotulo. */
  fitted?: boolean;
  items: readonly TabItem[];
  label: string;
  onSelectedKeyChange?: (key: string) => void;
  orientation?: TabsOrientation;
  selectedKey?: string;
}

export function Tabs({
  actions,
  appearance = 'underline',
  className,
  defaultSelectedKey,
  fillHeight = false,
  fitted = false,
  items,
  label,
  onSelectedKeyChange,
  orientation = 'horizontal',
  selectedKey,
  ...props
}: TabsProps) {
  const baseId = `tabs-${useId()}`;
  const nodes = useRef(new Map<string, HTMLElement>());
  const collection = useMemo<SelectionItem[]>(
    () => items.map((item) => ({ key: item.key, disabled: item.disabled, textValue: item.label })),
    [items],
  );
  const primeira = collection.find((item) => !item.disabled)?.key;
  const selection = useSelection({
    items: collection,
    mode: 'single',
    defaultSelectedKeys: selectedKey === undefined ? [defaultSelectedKey ?? primeira ?? ''] : undefined,
    selectedKeys: selectedKey === undefined ? undefined : [selectedKey],
    onSelectionChange: (keys) => {
      const [escolhida] = keys;
      if (escolhida !== undefined) {
        onSelectedKeyChange?.(escolhida);
      }
    },
  });
  const [ativa] = selection.selectedKeys;
  const painel = items.find((item) => item.key === ativa);
  // A lista sempre tem uma parada de Tab: com a escolhida inexistente ou desabilitada, nenhuma aba era alcancavel.
  const parada = collection.some((item) => item.key === ativa && !item.disabled) ? ativa : primeira;

  useEffect(() => {
    if (selection.focusedKey) {
      nodes.current.get(selection.focusedKey)?.focus();
    }
  }, [selection.focusedKey]);

  // Ativacao automatica: mover o foco troca a aba, conforme o padrao do APG
  // para paineis que carregam instantaneamente.
  function mover(proxima: string | undefined) {
    if (proxima) {
      selection.select(proxima);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const atual = selection.focusedKey ?? ativa;
    const avancar = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const voltar = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

    if (event.key === avancar) {
      event.preventDefault();
      mover(proximaChave(collection, atual, 1));
    } else if (event.key === voltar) {
      event.preventDefault();
      mover(proximaChave(collection, atual, -1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      mover(collection.find((item) => !item.disabled)?.key);
    } else if (event.key === 'End') {
      event.preventDefault();
      mover([...collection].reverse().find((item) => !item.disabled)?.key);
    }
  }

  const lista = (
    <div
      className={[styles.list, orientation === 'horizontal' && thinScrollbar].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => (
        <button
          key={item.key}
          ref={(node) => {
            if (node) {
              nodes.current.set(item.key, node);
            } else {
              nodes.current.delete(item.key);
            }
          }}
          className={[styles.tab, ativa === item.key && styles.active].filter(Boolean).join(' ')}
          data-muted={item.muted || undefined}
          type="button"
          role="tab"
          id={`${baseId}-${item.key}`}
          aria-controls={ativa === item.key ? `${baseId}-${item.key}-panel` : undefined}
          aria-selected={ativa === item.key}
          disabled={item.disabled}
          tabIndex={parada === item.key ? 0 : -1}
          onClick={() => selection.select(item.key)}
        >
          <TabLabel count={item.count} label={item.label} />
        </button>
      ))}
    </div>
  );

  return (
    <div
      {...props}
      className={[
        styles.tabs,
        styles[orientation],
        appearance === 'segmented' && styles.segmented,
        fitted && styles.fitted,
        fillHeight && styles.fillHeight,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {temAcoes(actions) ? (
        <div className={styles.bar}>
          {lista}
          <div className={styles.actions}>{actions}</div>
        </div>
      ) : (
        lista
      )}
      {painel && (
        <div
          className={[styles.panel, fillHeight && thinScrollbar].filter(Boolean).join(' ')}
          role="tabpanel"
          id={`${baseId}-${painel.key}-panel`}
          aria-labelledby={`${baseId}-${painel.key}`}
          tabIndex={0}
        >
          {painel.content}
        </div>
      )}
    </div>
  );
}

/** Sem `actions`, a lista fica direto na raiz, como antes. */
export function temAcoes(actions: ReactNode) {
  return actions !== undefined && actions !== null && actions !== false;
}

/**
 * Conteúdo da aba, de `Tabs` e `TabsNav`. Sem ícone nem contagem é só o rótulo, sem envoltório. Com contagem, o nome
 * vem inteiro de um texto oculto, "Rótulo, N", e o rótulo e o selo visíveis ficam fora da árvore de acessibilidade:
 * somados, o texto oculto fora do fluxo ganharia um espaço antes da vírgula.
 */
export function TabLabel({ count, icon, label }: { count?: number; icon?: ReactNode; label: string }) {
  if (count === undefined && icon === undefined) {
    return label;
  }

  return (
    <span className={styles.tabContent}>
      {icon !== undefined && (
        <span aria-hidden="true" className={styles.tabIcon}>
          {icon}
        </span>
      )}
      {count === undefined ? (
        label
      ) : (
        <>
          <VisuallyHidden>{`${label}, ${formatNumber(count)}`}</VisuallyHidden>
          <span aria-hidden="true">{label}</span>
          <span aria-hidden="true" className={styles.count}>
            {formatNumber(count)}
          </span>
        </>
      )}
    </span>
  );
}

// Percorre em circulo, como o APG define para abas.
function proximaChave(items: readonly SelectionItem[], from: string | undefined, passo: 1 | -1) {
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
