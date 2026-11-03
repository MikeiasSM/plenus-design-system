import { useState } from 'react';

interface OpenStateOptions {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

/**
 * Abertura controlável de um painel: `open` controla, `defaultOpen` inicia, e toda
 * mudança pedida é avisada por `onOpenChange` uma vez, sem repetir o estado atual.
 */
export function useOpenState({ defaultOpen = false, onOpenChange, open: controlledOpen }: OpenStateOptions) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;

  function setOpen(next: boolean) {
    if (next === open) {
      return;
    }

    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  }

  return [open, setOpen] as const;
}
