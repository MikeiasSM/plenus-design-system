import { createContext, useContext, type ReactNode } from 'react';

const PortalContainerContext = createContext<HTMLElement | null>(null);

export interface PortalProviderProps {
  children: ReactNode;
  /** Elemento que recebe os overlays da subárvore. `null` mantém o `document.body`. */
  container: HTMLElement | null;
}

/** Manda os overlays em portal da subárvore para `container`, onde herdam o tema, o `data-palette` e o shadow root. */
export function PortalProvider({ children, container }: PortalProviderProps) {
  return <PortalContainerContext value={container}>{children}</PortalContainerContext>;
}

/** Destino do portal: a prop do componente, depois o `PortalProvider` mais próximo, depois o `document.body`. */
export function usePortalContainer(portalContainer?: HTMLElement | null): HTMLElement | null {
  const chosen = useChosenPortalContainer(portalContainer);

  return chosen ?? (typeof document === 'undefined' ? null : document.body);
}

/** Destino só quando o produto o escolheu, pela prop ou pelo `PortalProvider`. Para quem não usa portal sem essa escolha. */
export function useChosenPortalContainer(portalContainer?: HTMLElement | null): HTMLElement | null {
  const providerContainer = useContext(PortalContainerContext);

  return portalContainer ?? providerContainer;
}
