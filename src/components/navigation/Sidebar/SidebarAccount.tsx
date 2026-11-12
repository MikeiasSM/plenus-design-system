import { useEffect, useRef, type ComponentPropsWithRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { IconChevronUp } from '../../icons';
import { useSidebarContext } from './Sidebar.context';
import { SidebarItemScopeContext, useSidebarPanel } from './SidebarPanel.context';
import styles from './SidebarPanel.module.css';

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
  label = 'Conta',
  name,
  onKeyDown,
  ...props
}: SidebarAccountProps) {
  const { accountId, accountOpen, setAccountOpen } = useSidebarContext();
  const { accountMode } = useSidebarPanel();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(accountOpen);

  useEffect(() => {
    if (accountOpen && !wasOpen.current) {
      cardRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    }
    wasOpen.current = accountOpen;
  }, [accountOpen]);

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
        <nav aria-label={label} className={styles.accountNav} id={accountId} onClick={handleCardClick} ref={cardRef}>
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
        {avatar}
        <AccountIdentity description={description} name={name} />
        <IconChevronUp className={styles.accountChevron} size={15} />
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
