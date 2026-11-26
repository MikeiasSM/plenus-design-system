import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { ButtonIcon } from '../../actions/ButtonIcon';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useOpenState } from '../../../hooks/useOpenState';
import { IconChevronRight } from '../../icons';
import { useSidebarContext } from './Sidebar.context';
import {
  samePath,
  SidebarLevelContext,
  SidebarPanelContext,
  useSidebarLevel,
  useSidebarPanel,
  useSidebarStack,
  type SidebarAccountMode,
  type SidebarNestedMode,
} from './SidebarPanel.context';
import { SidebarBrandContext } from './SidebarBrand.context';
import { SidebarAction, type SidebarActionProps } from './SidebarAction';
import { SidebarAccount } from './SidebarAccount';
import frameStyles from './Sidebar.module.css';
import styles from './SidebarPanel.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

/** O caminho de quem não está na pilha: sempre vazio, para nada sumir no `expand`. */
const NO_PATH: readonly string[] = [];

export interface SidebarPanelProps extends Omit<ComponentPropsWithRef<'div'>, 'aria-label'> {
  /** A conta do usuário no rodapé: um `Sidebar.Account`. */
  account?: ReactNode;
  /**
   * Onde a conta abre. `inline` abre um cartão por cima da lista do módulo, sem encolhê-la;
   * `cover` ocupa o lugar da lista com as opções.
   */
  accountMode?: SidebarAccountMode;
  /** A marca do produto, no cabeçalho, na altura da marca do trilho. */
  brand?: ReactNode;
  /** Caminho da pilha no início, no modo não controlado: os `value` dos ramos, do mais alto ao mais fundo. */
  defaultEnteredPath?: readonly string[];
  /**
   * Caminho da pilha, no modo controlado: os `value` dos ramos em que se entrou, do mais alto ao mais fundo. Exige `value`
   * em cada `Sidebar.Item` com filhos. Só vale com `nestedMode="stack"`.
   */
  enteredPath?: readonly string[];
  /** Na pilha, leva o caminho ao pai do item `current` sempre que ele muda, e também na montagem. */
  followCurrent?: boolean;
  /** Conteúdo entre a marca e a lista, fora da rolagem, como um campo de busca. */
  header?: ReactNode;
  /** Nome do módulo: nomeia a navegação e é o caminho de volta na pilha. */
  label: string;
  /** Terceiro nível: `expand` abre os filhos no lugar; `stack` troca a lista pelo nível de baixo. */
  nestedMode?: SidebarNestedMode;
  /** Avisa cada mudança do caminho da pilha: entrar, voltar ou seguir o item atual. */
  onEnteredPathChange?: (path: string[]) => void;
  /**
   * Largura do submenu aberto: número em pixels ou medida CSS em texto, como `"18rem"`. Na gaveta do celular, limitada à
   * largura da tela. Todos os painéis do produto devem usar o mesmo valor.
   */
  width?: number | string;
}

/** Submenu do módulo, direto na base, entre o trilho e a página. Sem filhos, serve só de lugar da conta. */
export function SidebarPanel({
  account: accountProp,
  accountMode = 'inline',
  brand,
  children,
  className,
  defaultEnteredPath,
  enteredPath,
  followCurrent = false,
  header,
  label,
  nestedMode = 'expand',
  onEnteredPathChange,
  style,
  width,
  ...props
}: SidebarPanelProps) {
  const { accountId, accountOpen, collapsePanel, setAccountOpen, collapseRef, icons, isPanelVisible, labels, narrow, panelId, setMenuOpen, setPanelKind, side, submenuOpen } = useSidebarContext();
  const [internalPath, setInternalPath] = useState<readonly string[]>(() => defaultEnteredPath ?? NO_PATH);
  const [shownLabel, setShownLabel] = useState(label);
  const previousLabel = useRef(label);
  const controlled = enteredPath !== undefined;
  const rawPath = enteredPath ?? internalPath;
  // A conta posta entre os filhos vai para o rodapé, como pela propriedade `account`: dentro da lista seria um item inválido.
  const childList = Children.toArray(children);
  const accountChild = childList.find((child) => isValidElement(child) && child.type === SidebarAccount);
  const items = accountChild === undefined ? children : childList.filter((child) => child !== accountChild);
  const account = accountProp ?? accountChild;
  const hasItems = Children.toArray(items).length > 0;
  const visible = isPanelVisible(hasItems ? 'items' : 'account');

  function changePath(next: string[]) {
    if (samePath(next, rawPath)) {
      return;
    }
    if (!controlled) {
      setInternalPath(next);
    }
    onEnteredPathChange?.(next);
  }

  const stack = useSidebarStack({
    acceptDefaults: !controlled,
    change: changePath,
    followCurrent,
    path: nestedMode === 'stack' ? rawPath : NO_PATH,
    scope: label,
    start: setInternalPath,
  });

  useEffect(() => {
    setPanelKind(hasItems ? 'items' : 'account');
    return () => setPanelKind('none');
  }, [hasItems, setPanelKind]);

  // Outro módulo, outra lista: o nível de baixo que estava aberto na pilha não vale mais. No modo controlado, o caminho é do produto.
  if (label !== shownLabel) {
    setShownLabel(label);
    if (!controlled) {
      setInternalPath(NO_PATH);
    }
  }

  // A conta que cobre a lista é a do módulo anterior: trocar de módulo a fecha, para a lista nova aparecer.
  useEffect(() => {
    if (previousLabel.current !== label && accountMode === 'cover' && accountOpen) {
      setAccountOpen(false);
    }
    previousLabel.current = label;
  }, [label]);

  function handleInnerClick(event: MouseEvent<HTMLDivElement>) {
    if (accountOpen && accountMode === 'inline' && !(event.target as Element).closest(`.${styles.account}`)) {
      setAccountOpen(false);
      event.currentTarget.querySelector<HTMLElement>(`[aria-controls="${accountId}"]`)?.focus();
    }
  }

  return (
    <SidebarPanelContext value={{ accountMode, label, nestedMode, visible }}>
      <div
        {...props}
        className={[styles.panel, narrow && styles.narrow, className].filter(Boolean).join(' ')}
        data-side={side}
        data-visible={visible}
        id={panelId}
        inert={!visible}
        style={width === undefined ? style : ({ ...style, '--sidebar-panel-width': typeof width === 'number' ? `${width}px` : width } as CSSProperties)}
      >
        <div className={styles.inner} onClick={handleInnerClick}>
          {hasItems && (
            <nav aria-label={label} className={styles.navigation} data-covered={accountMode === 'cover' && accountOpen}>
              <div className={styles.head}>
                <div className={styles.brand}>
                  <SidebarBrandContext value="panel">{brand}</SidebarBrandContext>
                </div>
                {narrow ? (
                  <ButtonIcon
                    className={frameStyles.frameButton}
                    icon={icons.close}
                    label={labels.closeMenu}
                    onClick={() => setMenuOpen(false)}
                    size="sm"
                    variant="ghost"
                  />
                ) : (
                  <ButtonIcon
                    aria-controls={panelId}
                    aria-expanded={submenuOpen}
                    className={frameStyles.frameButton}
                    icon={icons.collapse}
                    label={labels.collapseSubmenu}
                    onClick={collapsePanel}
                    ref={collapseRef}
                    size="sm"
                    variant="ghost"
                  />
                )}
              </div>
              {header !== undefined && header !== null && <div className={styles.header}>{header}</div>}
              <div className={[styles.list, thinScrollbar].join(' ')}>
                <ul className={styles.items} data-part="list">
                  <SidebarLevelContext value={{ ancestors: NO_PATH, label, stack }}>{items}</SidebarLevelContext>
                </ul>
              </div>
            </nav>
          )}
          {accountMode === 'inline' && accountOpen && <div aria-hidden="true" className={styles.accountShield} />}
          {account}
        </div>
      </div>
    </SidebarPanelContext>
  );
}

export interface SidebarGroupProps extends ComponentPropsWithRef<'li'> {
  label: string;
}

/** Título que reúne itens afins. */
export function SidebarGroup({ children, className, label, ...props }: SidebarGroupProps) {
  const { ancestors, stack } = useSidebarLevel();
  const titleId = useId();

  return (
    <li {...props} className={[styles.group, className].filter(Boolean).join(' ')} data-part="group">
      <span className={styles.groupTitle} data-part="group-title" hidden={stack.path.length > ancestors.length} id={titleId}>
        {label}
      </span>
      <ul aria-labelledby={titleId} className={styles.items}>
        {children}
      </ul>
    </li>
  );
}

export interface SidebarItemProps extends Omit<SidebarActionProps, 'aria-label' | 'children' | 'value'> {
  /** Os itens do terceiro nível. Com eles, o item abre os filhos em vez de navegar. */
  children?: ReactNode;
  /** Item da página atual. */
  current?: boolean;
  /** Filhos abertos no início, no modo não controlado. Na pilha, entra no nível no início, com os níveis de cima. */
  defaultExpanded?: boolean;
  /** Filhos abertos, no modo controlado. Não vale na pilha, onde o estado é do submenu. */
  expanded?: boolean;
  /** Link que sai da aplicação: abre em outra aba e leva o ícone ao fim. */
  external?: boolean;
  icon?: ReactNode;
  label: string;
  onExpandedChange?: (expanded: boolean) => void;
  /** Complemento ao fim da linha, como uma contagem. */
  trailing?: ReactNode;
  /**
   * Identidade estável do item, que o caminho da pilha (`enteredPath`) usa como texto (`String(value)`). Também vai ao
   * elemento, como antes; o tipo é o do `value` de um botão.
   */
  value?: string | number | readonly string[];
}

export function SidebarItem({ children, ...props }: SidebarItemProps) {
  const { nestedMode } = useSidebarPanel();

  if (children === undefined) {
    return <SidebarLeaf {...props} />;
  }

  return nestedMode === 'stack' ? (
    <StackedBranch {...props}>{children}</StackedBranch>
  ) : (
    <ExpandedBranch {...props}>{children}</ExpandedBranch>
  );
}

function joinClasses(...names: (string | false | undefined)[]) {
  return names.filter(Boolean).join(' ');
}

function ItemContent({ icon, label, trailing }: Pick<SidebarItemProps, 'icon' | 'label' | 'trailing'>) {
  return (
    <>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}</span>
      {trailing}
    </>
  );
}

function SidebarLeaf({
  className,
  current = false,
  defaultExpanded: _defaultExpanded,
  expanded: _expanded,
  external = false,
  icon,
  label,
  onClick,
  onExpandedChange: _onExpandedChange,
  trailing,
  ...props
}: SidebarItemProps) {
  const { icons, narrow, setMenuOpen } = useSidebarContext();
  const { ancestors, stack } = useSidebarLevel();
  const isLink = props.href !== undefined || props.linkProps !== undefined;

  useEffect(() => {
    if (current) {
      stack.follow([...ancestors]);
    }
  }, [current, ancestors.join('\n')]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (narrow && !event.defaultPrevented) {
      setMenuOpen(false);
    }
  }

  if (stack.path.length > ancestors.length) {
    return null;
  }

  return (
    <li>
      <SidebarAction
        {...props}
        {...(external && isLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        aria-current={current ? 'page' : props['aria-current']}
        className={joinClasses(styles.item, className)}
        data-part="item"
        onClick={handleClick}
      >
        <ItemContent icon={icon} label={label} trailing={trailing} />
        {external && <span className={styles.external}>{icons.external}</span>}
      </SidebarAction>
    </li>
  );
}

function ExpandedBranch({
  children,
  className,
  current: _current,
  defaultExpanded,
  expanded: controlledExpanded,
  external: _external,
  icon,
  label,
  onClick,
  onExpandedChange,
  trailing,
  ...props
}: SidebarItemProps) {
  const [expanded, setExpanded] = useOpenState({
    defaultOpen: defaultExpanded,
    onOpenChange: onExpandedChange,
    open: controlledExpanded,
  });
  const listId = useId();

  return (
    <li className={styles.branch} data-expanded={expanded} data-part="branch">
      <SidebarAction
        {...props}
        aria-controls={listId}
        aria-expanded={expanded}
        className={joinClasses(styles.item, className)}
        data-part="item"
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            setExpanded(!expanded);
          }
        }}
      >
        <ItemContent icon={icon} label={label} trailing={trailing} />
        <IconChevronRight className={styles.chevron} size={15} />
      </SidebarAction>
      <div className={styles.nestedWrap} inert={!expanded}>
        <ul className={styles.nested} id={listId}>
          {children}
        </ul>
      </div>
    </li>
  );
}

/**
 * Ramo da pilha, na profundidade d (a quantidade de ramos acima dele). No caminho e por último: o voltar, o título e os filhos.
 * No caminho, com o caminho seguindo mais fundo: só os filhos, de passagem. Fora do caminho, com o caminho mais fundo que d:
 * escondido. Senão, o item, com os filhos guardados. O `li` mantém a mesma forma nos quatro estados, para os filhos não
 * remontarem: assim os ramos de baixo guardam a identidade, e o item atual escondido continua a ser visto.
 */
function StackedBranch({
  children,
  className,
  current: _current,
  defaultExpanded,
  expanded: _expanded,
  external: _external,
  icon,
  label,
  onClick,
  onExpandedChange: _onExpandedChange,
  ref,
  trailing,
  value,
  ...props
}: SidebarItemProps) {
  const { icons } = useSidebarContext();
  const { ancestors, label: parentLabel, stack } = useSidebarLevel();
  const generatedId = useId();
  const id = value === undefined ? generatedId : String(value);
  const depth = ancestors.length;
  const chain = [...ancestors, id];
  const onPath = stack.path[depth] === id && ancestors.every((ancestor, index) => stack.path[index] === ancestor);
  const state = onPath ? (stack.path.length === depth + 1 ? 'entered' : 'through') : stack.path.length > depth ? 'off' : 'closed';
  const itemRef = useRef<HTMLButtonElement>(null);
  const mergedItemRef = useMergedRefs(itemRef, ref);
  const backRef = useRef<HTMLButtonElement>(null);
  const shut = state === 'closed' || state === 'off';

  useLayoutEffect(() => {
    if (defaultExpanded) {
      stack.offerDefault(chain);
    }
  }, []);

  // O foco vai aonde o clique pediu, quando o caminho chegar lá: ao voltar ao entrar, ao próprio item ao sair.
  useEffect(() => {
    const pending = stack.focus.current;

    if (pending?.id === id && samePath(pending.path, stack.path)) {
      (pending.target === 'back' ? backRef : itemRef).current?.focus();
      stack.focus.current = null;
    }
  });

  return (
    <li className={state === 'entered' ? styles.stacked : state === 'through' ? undefined : styles.branch} data-part="branch" hidden={state === 'off'}>
      {shut ? (
        <SidebarAction
          {...props}
          className={joinClasses(styles.item, className)}
          data-part="item"
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) {
              stack.navigate(chain, { id, target: 'back' });
            }
          }}
          ref={mergedItemRef}
          value={value}
        >
          <ItemContent icon={icon} label={label} trailing={trailing} />
          <IconChevronRight className={styles.chevron} size={15} />
        </SidebarAction>
      ) : state === 'entered' ? (
        <button className={styles.back} data-part="back" onClick={() => stack.navigate([...ancestors], { id, target: 'item' })} ref={backRef} type="button">
          <span className={styles.backIcon}>{icons.back}</span>
          {parentLabel}
        </button>
      ) : null}
      {state === 'entered' && (
        <span className={styles.groupTitle} data-part="group-title">
          {label}
        </span>
      )}
      <ul className={shut ? styles.nested : styles.items} hidden={shut}>
        <SidebarLevelContext value={{ ancestors: chain, label, stack }}>{children}</SidebarLevelContext>
      </ul>
    </li>
  );
}
