import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useFocusNeighborOnRemove } from '../../../hooks/useFocusNeighborOnRemove';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import { formatNumber } from '../../../utils/formatters';
import { VisuallyHidden } from '../../accessibility/VisuallyHidden';
import { IconChevronDown, IconClose } from '../../icons';
import { Menu, type MenuItem } from '../../overlays/Menu';
import { hiddenTabs } from './overflow';
import styles from './Tabs.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

export interface TabItem {
  /**
   * Mostra o × dentro da aba e deixa o Delete fechá-la. Fechar só avisa `onClose` das `Tabs`: a aba some quando sai de
   * `items`.
   */
  closable?: boolean;
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

/** `scroll`: a faixa rola na horizontal. `menu`: as abas que não cabem vão para o botão "Mais (N)", no fim da faixa. */
export type TabsOverflow = 'scroll' | 'menu';

export interface TabsLabels {
  /** Descrição das abas que fecham. */
  closeHint: string;
  /** Texto do botão que abre o menu das abas que não cabem. */
  more: (count: number) => string;
  /** Nome do menu das abas que não cabem. */
  moreMenu: string;
}

const DEFAULT_LABELS: TabsLabels = {
  closeHint: 'Delete para fechar',
  more: (count) => `Mais (${formatNumber(count)})`,
  moreMenu: 'Mais abas',
};

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
  labels?: Partial<TabsLabels>;
  /** Pedido de fechar a aba, pelo × ou pelo Delete. Quem remove é quem usa: a aba some quando sai de `items`. */
  onClose?: (key: string) => void;
  onSelectedKeyChange?: (key: string) => void;
  orientation?: TabsOrientation;
  /**
   * O que fazer com as abas que não cabem na largura. Sem ele, nada muda. Vale só na horizontal e sem `fitted`: na
   * vertical a lista cresce para baixo, e com `fitted` as abas dividem a largura.
   */
  overflow?: TabsOverflow;
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
  labels: rotulosParciais,
  onClose,
  onSelectedKeyChange,
  orientation = 'horizontal',
  overflow,
  ref,
  selectedKey,
  ...props
}: TabsProps) {
  const labels = { ...DEFAULT_LABELS, ...rotulosParciais };
  const baseId = `tabs-${useId()}`;
  const closeHintId = `${baseId}-close-hint`;
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(rootRef, ref);
  const stripRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const modo = orientation === 'horizontal' && !fitted ? overflow : undefined;
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

  const [ocultasMedidas, setOcultas] = useState<readonly string[]>([]);
  const ocultas = useMemo(
    () => new Set(modo === 'menu' ? ocultasMedidas.filter((key) => key !== ativa) : []),
    [modo, ocultasMedidas, ativa],
  );
  const larguras = useRef(new Map<string, number>());
  const [, remedir] = useReducer((n: number) => n + 1, 0);

  // A largura da faixa ou das abas mudou: mede de novo.
  useEffect(() => {
    const strip = stripRef.current;
    const list = listRef.current;

    if (modo !== 'menu' || !strip || !list || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => remedir());
    observer.observe(strip);
    observer.observe(list);
    return () => observer.disconnect();
  }, [modo]);

  // Antes de pintar, decide quais abas vão para o menu. Mede só as visíveis; a oculta guarda a última largura.
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const list = listRef.current;

    if (modo !== 'menu' || !strip || !list) {
      return;
    }

    for (const item of items) {
      const node = nodes.current.get(item.key);
      if (node && !node.hidden) {
        larguras.current.set(item.key, node.offsetWidth);
      }
    }

    const estiloDaLista = getComputedStyle(list);
    const px = (valor: string) => Number.parseFloat(valor) || 0;
    // O trilho do segmentado tem borda e respiro, que não são das abas.
    const moldura =
      px(estiloDaLista.paddingLeft) +
      px(estiloDaLista.paddingRight) +
      px(estiloDaLista.borderLeftWidth) +
      px(estiloDaLista.borderRightWidth);
    const proximas = hiddenTabs({
      available: strip.clientWidth - moldura,
      gap: px(estiloDaLista.columnGap),
      keys: items.map((item) => item.key),
      moreWidth: moreRef.current?.offsetWidth ?? 0,
      selected: ativa,
      widths: items.map((item) => larguras.current.get(item.key) ?? 0),
    });

    setOcultas((atuais) => (atuais.join('\n') === proximas.join('\n') ? atuais : proximas));
  });

  // Em "scroll", a faixa rola até a aba escolhida, sem mexer na página.
  useEffect(() => {
    const list = listRef.current;
    const node = ativa === undefined ? undefined : nodes.current.get(ativa);

    if (modo !== 'scroll' || !list || !node) {
      return;
    }

    const faixa = list.getBoundingClientRect();
    const aba = node.getBoundingClientRect();

    if (aba.left < faixa.left) {
      list.scrollLeft -= faixa.left - aba.left;
    } else if (aba.right > faixa.right) {
      list.scrollLeft += aba.right - faixa.right;
    }
  }, [modo, ativa]);

  // O foco segue a aba focada pelo teclado. A aba que acabou de sair do menu ainda pode estar oculta no render em
  // que foi escolhida; o foco espera ela aparecer.
  const focoAnterior = useRef(selection.focusedKey);
  const focoPendente = useRef<string | null>(null);
  const semFoco = useRef(false);

  useEffect(() => {
    if (selection.focusedKey !== focoAnterior.current) {
      focoAnterior.current = selection.focusedKey;
      if (selection.focusedKey && !semFoco.current) {
        focoPendente.current = selection.focusedKey;
      }
      semFoco.current = false;
    }

    const chave = focoPendente.current;
    const node = chave === null ? undefined : nodes.current.get(chave);

    if (!node) {
      focoPendente.current = null;
    } else if (!node.hidden) {
      node.focus();
      focoPendente.current = null;
    }
  });

  // A aba escolhida que fecha passa a escolha à vizinha, à direita ou, na última, à esquerda.
  const anteriores = useRef(items);

  useLayoutEffect(() => {
    const antes = anteriores.current;
    anteriores.current = items;

    if (antes === items || ativa === undefined || items.some((item) => item.key === ativa)) {
      return;
    }

    const indice = antes.findIndex((item) => item.key === ativa);

    if (indice < 0 || !antes[indice].closable) {
      return;
    }

    const disponiveis = new Set(items.filter((item) => !item.disabled).map((item) => item.key));
    const vizinha =
      antes.slice(indice + 1).find((item) => disponiveis.has(item.key)) ??
      antes
        .slice(0, indice)
        .reverse()
        .find((item) => disponiveis.has(item.key));

    if (vizinha) {
      // Com o foco fora das abas, quem fechou foi outro controle: a escolha muda, o foco fica onde está.
      const ativo = document.activeElement;
      semFoco.current = !(ativo === null || ativo === document.body || rootRef.current?.contains(ativo));
      selection.select(vizinha.key);
    }
  });

  // Ativacao automatica: mover o foco troca a aba, conforme o padrao do APG
  // para paineis que carregam instantaneamente.
  function mover(proxima: string | undefined) {
    if (proxima) {
      selection.select(proxima);
    }
  }

  function chaveDoAlvo(alvo: EventTarget) {
    for (const [key, node] of nodes.current) {
      if (node === alvo) {
        return key;
      }
    }
    return undefined;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const atual = chaveDoAlvo(event.target) ?? selection.focusedKey ?? ativa;
    const avancar = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const voltar = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    // As setas, Home e End andam só pelas abas da faixa; as do menu se alcançam pelo botão "Mais".
    const navegaveis = collection.filter((item) => !ocultas.has(item.key));

    if (event.key === avancar) {
      event.preventDefault();
      mover(proximaChave(navegaveis, atual, 1));
    } else if (event.key === voltar) {
      event.preventDefault();
      mover(proximaChave(navegaveis, atual, -1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      mover(navegaveis.find((item) => !item.disabled)?.key);
    } else if (event.key === 'End') {
      event.preventDefault();
      mover([...navegaveis].reverse().find((item) => !item.disabled)?.key);
    } else if (event.key === 'Delete') {
      const alvo = items.find((item) => item.key === chaveDoAlvo(event.target));
      if (alvo?.closable && !alvo.disabled) {
        event.preventDefault();
        onClose?.(alvo.key);
      }
    }
  }

  function escolherDoMenu(key: string) {
    focoPendente.current = key;
    selection.select(key);
  }

  const temOcultas = ocultas.size > 0;
  const temFechaveis = items.some((item) => item.closable);
  const itensDoMenu: MenuItem[] = items
    .filter((item) => ocultas.has(item.key))
    .map((item) => ({
      key: item.key,
      label: item.label,
      detail: item.count === undefined ? undefined : formatNumber(item.count),
      disabled: item.disabled,
      onSelect: () => escolherDoMenu(item.key),
    }));

  const lista = (
    <div
      ref={listRef}
      className={[styles.list, orientation === 'horizontal' && thinScrollbar].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => (
        <Aba
          key={item.key}
          ativa={ativa === item.key}
          baseId={baseId}
          closeHintId={closeHintId}
          hidden={ocultas.has(item.key)}
          item={item}
          nodes={nodes}
          onClose={onClose}
          onSelect={() => selection.select(item.key)}
          posicao={temOcultas ? { index: index + 1, total: items.length } : undefined}
          tabIndex={parada === item.key ? 0 : -1}
        />
      ))}
    </div>
  );

  const faixa =
    modo === 'menu' ? (
      <div ref={stripRef} className={styles.strip}>
        {lista}
        {temOcultas ? (
          <Menu items={itensDoMenu} label={labels.moreMenu} placement="bottom end">
            <button ref={moreRef} className={[styles.tab, styles.more].join(' ')} type="button">
              {labels.more(ocultas.size)}
              <IconChevronDown className={styles.moreIcon} />
            </button>
          </Menu>
        ) : (
          // Fora da vista, só para medir: a faixa reserva a largura do botão antes de ele aparecer.
          <button
            ref={moreRef}
            aria-hidden="true"
            className={[styles.tab, styles.more, styles.moreIdle].join(' ')}
            tabIndex={-1}
            type="button"
          >
            {labels.more(0)}
            <IconChevronDown className={styles.moreIcon} />
          </button>
        )}
      </div>
    ) : (
      lista
    );

  return (
    <div
      {...props}
      ref={mergedRef}
      className={[
        styles.tabs,
        styles[orientation],
        appearance === 'segmented' && styles.segmented,
        fitted && styles.fitted,
        fillHeight && styles.fillHeight,
        modo === 'scroll' && styles.scroll,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {temAcoes(actions) || modo === 'menu' ? (
        <div className={styles.bar}>
          {faixa}
          {temAcoes(actions) && <div className={styles.actions}>{actions}</div>}
        </div>
      ) : (
        lista
      )}
      {temFechaveis && (
        <span hidden id={closeHintId}>
          {labels.closeHint}
        </span>
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

interface AbaProps {
  ativa: boolean;
  baseId: string;
  closeHintId: string;
  hidden: boolean;
  item: TabItem;
  nodes: RefObject<Map<string, HTMLElement>>;
  onClose?: (key: string) => void;
  onSelect: () => void;
  /** Com abas no menu, a posição de cada uma conta também as ocultas. */
  posicao?: { index: number; total: number };
  tabIndex: number;
}

function Aba({ ativa, baseId, closeHintId, hidden, item, nodes, onClose, onSelect, posicao, tabIndex }: AbaProps) {
  const ref = useRef<HTMLButtonElement>(null);

  // A aba que some com o foco passa o foco à vizinha visível: à direita ou, na última, à esquerda.
  useFocusNeighborOnRemove(ref);

  function fechar(event: MouseEvent<HTMLSpanElement>) {
    // O × não escolhe a aba.
    event.stopPropagation();
    onClose?.(item.key);
  }

  const rotulo = <TabLabel count={item.count} label={item.label} />;

  return (
    <button
      ref={(node) => {
        ref.current = node;
        if (node) {
          nodes.current.set(item.key, node);
        } else {
          nodes.current.delete(item.key);
        }
      }}
      className={[styles.tab, ativa && styles.active].filter(Boolean).join(' ')}
      data-muted={item.muted || undefined}
      // Marca das vizinhas que recebem o foco quando uma aba some; a oculta no menu não entra.
      data-removes={hidden ? undefined : ''}
      type="button"
      role="tab"
      id={`${baseId}-${item.key}`}
      aria-controls={ativa ? `${baseId}-${item.key}-panel` : undefined}
      aria-describedby={item.closable ? closeHintId : undefined}
      aria-posinset={posicao?.index}
      aria-selected={ativa}
      aria-setsize={posicao?.total}
      disabled={item.disabled}
      hidden={hidden}
      tabIndex={tabIndex}
      onClick={onSelect}
    >
      {item.closable ? (
        <span className={styles.closable}>
          {rotulo}
          {/* Só para o ponteiro: o teclado fecha com Delete, e o × fica fora da ordem do Tab e da árvore. */}
          <span aria-hidden="true" className={styles.close} data-close="" onClick={fechar}>
            <IconClose />
          </span>
        </span>
      ) : (
        rotulo
      )}
    </button>
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
