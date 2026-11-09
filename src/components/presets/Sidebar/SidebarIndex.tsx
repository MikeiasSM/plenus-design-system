import { useEffect, useId, useRef, useState, type ComponentPropsWithRef, type MouseEvent } from 'react';
import styles from './Sidebar.module.css';

export interface SidebarIndexItem {
  id: string;
  label: string;
}

export interface SidebarIndexProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  items: readonly SidebarIndexItem[];
  /** Nome visível do índice. */
  label?: string;
}

// A seção à vista é a última cujo topo passou desta folga abaixo do topo do índice, preso no alto da área que rola.
const REFERENCE_OFFSET = 64;

export function SidebarIndex({ className, items, label = 'Nesta página', ...props }: SidebarIndexProps) {
  const labelId = useId();
  const labelRef = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(items[0]?.id);

  // O corpo da página é quem rola, não a janela: por isso o scroll é ouvido em captura no documento.
  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      const reference = (labelRef.current?.getBoundingClientRect().top ?? 0) + REFERENCE_OFFSET;
      const passed = items.filter(({ id }) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= reference);
      setCurrent((passed.at(-1) ?? items[0])?.id);
    }

    function scheduleUpdate() {
      frame ||= requestAnimationFrame(update);
    }

    update();
    document.addEventListener('scroll', scheduleUpdate, { capture: true, passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      document.removeEventListener('scroll', scheduleUpdate, { capture: true });
      window.removeEventListener('resize', scheduleUpdate);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  function goToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    const target = document.getElementById(id);

    if (!target) {
      return;
    }

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    setCurrent(id);

    // Fora da ordem do Tab, a seção só recebe o foco por script com tabindex -1.
    if (target.tabIndex < 0) {
      target.tabIndex = -1;
    }
    target.focus({ preventScroll: true });
  }

  return (
    <nav {...props} aria-labelledby={labelId} className={[styles.index, className].filter(Boolean).join(' ')}>
      <span className={styles.indexLabel} id={labelId} ref={labelRef}>
        {label}
      </span>
      <ul className={styles.indexList}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              aria-current={item.id === current ? 'true' : undefined}
              className={styles.indexLink}
              href={'#' + item.id}
              onClick={(event) => goToSection(event, item.id)}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
