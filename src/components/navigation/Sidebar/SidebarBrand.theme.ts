export type SidebarBrandTheme = 'light' | 'dark';

/**
 * O tema que vale naquele ponto da árvore, o mesmo da cor primária. A sonda tem `color: light-dark()`, que segue o
 * `color-scheme` mais próximo: `data-theme` aninhado e `prefers-color-scheme` entram sem repetir a regra em JS.
 * Só o tema claro devolve preto.
 */
export function readSidebarBrandTheme(probe: HTMLElement): SidebarBrandTheme {
  return getComputedStyle(probe).color.replace(/\s/g, '') === 'rgb(0,0,0)' ? 'light' : 'dark';
}

/** Avisa quando o tema pode ter mudado: o sistema (`prefers-color-scheme`) ou um `data-theme` em qualquer ponto do documento. */
export function watchSidebarBrandTheme(notify: () => void) {
  const query = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const observer = new MutationObserver(notify);

  query?.addEventListener('change', notify);
  observer.observe(document.documentElement, { attributeFilter: ['data-theme'], attributes: true, subtree: true });

  return () => {
    query?.removeEventListener('change', notify);
    observer.disconnect();
  };
}
