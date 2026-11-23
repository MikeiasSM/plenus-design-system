import { useEffect, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { useSidebarContext } from './Sidebar.context';
import { isEditableTarget } from './Sidebar.shortcut';
import { SidebarLevelContext, useSidebarPanel, useSidebarStack } from './SidebarPanel.context';
import styles from './SidebarPanel.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

/** Os controles que abrem e fecham níveis: o item de um ramo e o voltar da pilha. */
const BRANCH_CONTROLS = '[data-part="branch"] > [data-part="item"], [data-part="back"]';

export interface SidebarAccountProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** O avatar do usuário. */
  avatar: ReactNode;
  /** As opções da conta, do produto: `Sidebar.Item`. */
  children: ReactNode;
  /** Segunda linha do bloco, como a empresa. */
  description?: string;
  /** Nome da navegação das opções. */
  label?: string;
  name: string;
}

/** Rodapé do submenu: o bloco da conta e as opções, que abrem acima dele. Vai em `Sidebar.Panel`, na propriedade `account`. */
export function SidebarAccount({
  avatar,
  children,
  className,
  description,
  label,
  name,
  onKeyDown,
  ...props
}: SidebarAccountProps) {
  const { accountId, accountOpen, icons, labels, setAccountOpen } = useSidebarContext();
  const { accountMode, nestedMode, visible } = useSidebarPanel();
  const [path, setPath] = useState<readonly string[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(accountOpen);
  const pendingFocus = useRef(false);
  const accountLabel = label ?? labels.account;

  // A conta tem a própria pilha, que recomeça das opções a cada vez que abre.
  if (!accountOpen && path.length > 0) {
    setPath([]);
  }

  const stack = useSidebarStack({
    acceptDefaults: true,
    change: setPath,
    followCurrent: false,
    path: nestedMode === 'stack' ? path : [],
    scope: 'account',
    start: setPath,
  });

  useEffect(() => {
    if (accountOpen !== wasOpen.current) {
      pendingFocus.current = accountOpen;
    }
    if (pendingFocus.current && visible) {
      if (!isEditableTarget(document.activeElement)) {
        cardRef.current?.querySelector<HTMLElement>('a, button')?.focus();
      }
      pendingFocus.current = false;
    }
    wasOpen.current = accountOpen;
  }, [accountOpen, visible]);

  function closeAndReturnFocus() {
    setAccountOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);

    if (event.key === 'Escape' && accountOpen) {
      event.stopPropagation();
      closeAndReturnFocus();
    }
  }

  // Escolher uma opção fecha a conta; abrir um ramo ou voltar dele só muda o nível.
  function handleCardClick(event: MouseEvent<HTMLElement>) {
    const control = (event.target as Element).closest('a, button');

    if (control && !control.matches(BRANCH_CONTROLS)) {
      closeAndReturnFocus();
    }
  }

  return (
    <div
      {...props}
      className={[styles.account, className].filter(Boolean).join(' ')}
      data-mode={accountMode}
      data-open={accountOpen}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.accountCard} inert={!accountOpen}>
        <nav aria-label={accountLabel} className={[styles.accountNav, thinScrollbar].join(' ')} id={accountId} onClick={handleCardClick} ref={cardRef}>
          <ul className={styles.items} data-part="list">
            <SidebarLevelContext value={{ ancestors: [], label: accountLabel, stack }}>{children}</SidebarLevelContext>
          </ul>
        </nav>
      </div>
      <button
        aria-controls={accountId}
        aria-expanded={accountOpen}
        className={styles.accountTrigger}
        onClick={() => setAccountOpen(!accountOpen)}
        ref={triggerRef}
        type="button"
      >
        <span className={styles.accountAvatar}>{avatar}</span>
        <AccountIdentity description={description} name={name} />
        <span className={styles.accountChevron}>{icons.account}</span>
      </button>
    </div>
  );
}

function AccountIdentity({ description, name }: { description?: string; name: string }) {
  return (
    <span className={styles.identity}>
      <strong>{name}</strong>
      {description && <span>{description}</span>}
    </span>
  );
}
