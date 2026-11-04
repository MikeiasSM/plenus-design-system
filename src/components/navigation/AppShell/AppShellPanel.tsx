import {
  Children,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { ButtonIcon } from '../../actions/ButtonIcon';
import { useOpenState } from '../../../hooks/useOpenState';
import { IconChevronLeft, IconChevronRight, IconClose, IconExternalLink, IconSidebar } from '../../icons';
import { useAppShell } from './AppShell.context';
import {
  AppShellItemScopeContext,
  AppShellPanelContext,
  useAppShellItemScope,
  useAppShellPanel,
  type AppShellAccountMode,
  type AppShellNestedMode,
} from './AppShellPanel.context';
import { ShellAction, type ShellActionProps } from './ShellAction';
import styles from './AppShellPanel.module.css';

export interface AppShellPanelProps extends Omit<ComponentPropsWithRef<'div'>, 'aria-label'> {
  /** A conta do usuário no rodapé: um `AppShell.Account`. */
  account?: ReactNode;
  /**
   * Onde a conta abre. `inline` cresce acima do rodapé e encolhe a lista do módulo;
   * `cover` ocupa o lugar da lista.
   */
  accountMode?: AppShellAccountMode;
  /** A marca do produto, no cabeçalho, na altura da marca do trilho. */
  brand?: ReactNode;
  /** Nome do módulo: nomeia a navegação e é o caminho de volta na pilha. */
  label: string;
  /** Terceiro nível: `expand` abre os filhos no lugar; `stack` troca a lista pelo nível de baixo. */
  nestedMode?: AppShellNestedMode;
}

/** Submenu do módulo, direto na base, entre o trilho e a página. Sem filhos, serve só de lugar da conta. */
export function AppShellPanel({
  account,
  accountMode = 'inline',
  brand,
  children,
  className,
  label,
  nestedMode = 'expand',
  ...props
}: AppShellPanelProps) {
  const { accountOpen, collapsePanel, collapseRef, isPanelVisible, narrow, panelId, setMenuOpen, setPanelKind, submenuOpen } = useAppShell();
  const [enteredId, setEnteredId] = useState<string | null>(null);
  const [shownLabel, setShownLabel] = useState(label);
  const hasItems = Children.toArray(children).length > 0;
  const visible = isPanelVisible(hasItems ? 'items' : 'account');

  useEffect(() => {
    setPanelKind(hasItems ? 'items' : 'account');
    return () => setPanelKind('none');
  }, [hasItems, setPanelKind]);

  // Outro módulo, outra lista: o nível de baixo que estava aberto na pilha não vale mais.
  if (label !== shownLabel) {
    setShownLabel(label);
    setEnteredId(null);
  }

  return (
    <AppShellPanelContext value={{ accountMode, enteredId, label, nestedMode, setEnteredId }}>
      <div
        {...props}
        className={[styles.panel, className].filter(Boolean).join(' ')}
        data-visible={visible}
        id={panelId}
        inert={!visible}
      >
        <div className={styles.inner}>
          {hasItems && (
            <div className={styles.head}>
              <div className={styles.brand}>{brand}</div>
              {narrow ? (
                <ButtonIcon icon={<IconClose />} label="Fechar menu" onClick={() => setMenuOpen(false)} size="sm" variant="ghost" />
              ) : (
                <ButtonIcon
                  aria-controls={panelId}
                  aria-expanded={submenuOpen}
                  icon={<IconSidebar />}
                  label="Recolher submenu"
                  onClick={collapsePanel}
                  ref={collapseRef}
                  size="sm"
                  variant="ghost"
                />
              )}
            </div>
          )}
          {hasItems && (
            <nav aria-label={label} className={styles.list} data-covered={accountMode === 'cover' && accountOpen}>
              <ul className={styles.items}>{children}</ul>
            </nav>
          )}
          {account}
        </div>
      </div>
    </AppShellPanelContext>
  );
}

export interface AppShellPanelGroupProps extends ComponentPropsWithRef<'li'> {
  label: string;
}

/** Título que reúne itens afins. */
export function AppShellPanelGroup({ children, className, label, ...props }: AppShellPanelGroupProps) {
  const { enteredId } = useAppShellPanel();
  const scope = useAppShellItemScope();
  const titleId = useId();

  return (
    <li {...props} className={[styles.group, className].filter(Boolean).join(' ')}>
      <span className={styles.groupTitle} hidden={scope === 'list' && enteredId !== null} id={titleId}>
        {label}
      </span>
      <ul aria-labelledby={titleId} className={styles.items}>
        {children}
      </ul>
    </li>
  );
}

export interface AppShellPanelItemProps extends Omit<ShellActionProps, 'aria-label' | 'children'> {
  /** Os itens do terceiro nível. Com eles, o item abre os filhos em vez de navegar. */
  children?: ReactNode;
  /** Item da página atual. */
  current?: boolean;
  /** Filhos abertos no início, no modo não controlado. Na pilha, entra no nível no início. */
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
}

export function AppShellPanelItem({ children, ...props }: AppShellPanelItemProps) {
  const { nestedMode } = useAppShellPanel();

  if (children === undefined) {
    return <AppShellPanelLeaf {...props} />;
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

function ItemContent({ icon, label, trailing }: Pick<AppShellPanelItemProps, 'icon' | 'label' | 'trailing'>) {
  return (
    <>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}</span>
      {trailing}
    </>
  );
}

function AppShellPanelLeaf({
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
}: AppShellPanelItemProps) {
  const { narrow, setMenuOpen } = useAppShell();
  const { enteredId } = useAppShellPanel();
  const scope = useAppShellItemScope();
  const isLink = props.href !== undefined || props.linkProps !== undefined;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (narrow && !event.defaultPrevented) {
      setMenuOpen(false);
    }
  }

  if (scope === 'list' && enteredId !== null) {
    return null;
  }

  return (
    <li>
      <ShellAction
        {...props}
        {...(external && isLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        aria-current={current ? 'page' : undefined}
        className={joinClasses(styles.item, className)}
        onClick={handleClick}
      >
        <ItemContent icon={icon} label={label} trailing={trailing} />
        {external && <IconExternalLink className={styles.external} size={15} />}
      </ShellAction>
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
}: AppShellPanelItemProps) {
  const [expanded, setExpanded] = useOpenState({
    defaultOpen: defaultExpanded,
    onOpenChange: onExpandedChange,
    open: controlledExpanded,
  });
  const listId = useId();

  return (
    <li className={styles.branch} data-expanded={expanded}>
      <ShellAction
        {...props}
        aria-controls={listId}
        aria-expanded={expanded}
        className={joinClasses(styles.item, className)}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            setExpanded(!expanded);
          }
        }}
      >
        <ItemContent icon={icon} label={label} trailing={trailing} />
        <IconChevronRight className={styles.chevron} size={15} />
      </ShellAction>
      <div className={styles.nestedWrap} inert={!expanded}>
        <ul className={styles.nested} id={listId}>
          <AppShellItemScopeContext value="nested">{children}</AppShellItemScopeContext>
        </ul>
      </div>
    </li>
  );
}

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
  trailing,
  ...props
}: AppShellPanelItemProps) {
  const { enteredId, label: panelLabel, setEnteredId } = useAppShellPanel();
  const scope = useAppShellItemScope();
  const id = useId();
  const entered = enteredId === id;
  const wasEntered = useRef(entered);
  const itemRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (defaultExpanded) {
      wasEntered.current = true;
      setEnteredId(id);
    }
  }, []);

  useEffect(() => {
    if (entered !== wasEntered.current) {
      (entered ? backRef : itemRef).current?.focus();
      wasEntered.current = entered;
    }
  }, [entered]);

  if (scope === 'list' && enteredId !== null && !entered) {
    return null;
  }

  if (entered) {
    return (
      <li className={styles.stacked}>
        <button className={styles.back} onClick={() => setEnteredId(null)} ref={backRef} type="button">
          <IconChevronLeft size={14} />
          {panelLabel}
        </button>
        <span className={styles.groupTitle}>{label}</span>
        <ul className={styles.items}>
          <AppShellItemScopeContext value="nested">{children}</AppShellItemScopeContext>
        </ul>
      </li>
    );
  }

  return (
    <li className={styles.branch}>
      <ShellAction
        {...props}
        className={joinClasses(styles.item, className)}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            setEnteredId(id);
          }
        }}
        ref={itemRef}
      >
        <ItemContent icon={icon} label={label} trailing={trailing} />
        <IconChevronRight className={styles.chevron} size={15} />
      </ShellAction>
      <ul className={styles.nested} hidden>
        <AppShellItemScopeContext value="nested">{children}</AppShellItemScopeContext>
      </ul>
    </li>
  );
}
