/**
 * Copia o texto pela Clipboard API e diz se deu certo. Nunca rejeita: a permissão negada, o iframe sem
 * `clipboard-write` e a página sem a API (como em HTTP) devolvem `false`, para quem chama avisar a falha.
 */
export async function copyText(text: string): Promise<boolean> {
  const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;

  if (!clipboard?.writeText) {
    return false;
  }

  try {
    await clipboard.writeText(text);

    return true;
  } catch {
    return false;
  }
}

/** Seleciona o texto do elemento, para a pessoa copiar pelo teclado quando a cópia automática falha. */
export function selectContents(element: Element | null) {
  const selection = typeof window === 'undefined' ? null : window.getSelection();

  if (!element || !selection) {
    return;
  }

  const range = document.createRange();

  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}
