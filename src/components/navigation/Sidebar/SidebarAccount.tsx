import { useEffect, useRef, type ComponentPropsWithRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { useSidebarContext } from './Sidebar.context';
import { isEditableTarget } from './Sidebar.shortcut';
import { SidebarItemScopeContext, useSidebarPanel } from './SidebarPanel.context';
import styles from './SidebarPanel.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

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
  const { accountMode, visible } = useSidebarPanel();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(accountOpen);
  const pendingFocus = useRef(false);

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

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    if ((event.target as Element).closest('a, button')) {
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
        <nav aria-label={label ?? labels.account} className={[styles.accountNav, thinScrollbar].join(' ')} id={accountId} onClick={handleCardClick} ref={cardRef}>
          <ul className={styles.items}>
            <SidebarItemScopeContext value="account">{children}</SidebarItemScopeContext>
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
