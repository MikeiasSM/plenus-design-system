import type { ChangeEvent } from 'react';
import { formatInputMask, maskedCaret, type InputMask } from '../../../utils/formatters/formatInputMask';

/**
 * Formata o texto que o navegador acabou de gravar no campo e recoloca o cursor onde a pessoa estava.
 * Devolve o valor cru. `previousText` e o texto antes da edição.
 */
export function maskTypedText(event: ChangeEvent<HTMLInputElement>, mask: InputMask, previousText: string) {
  const input = event.target;
  const typed = input.value;
  const caret = input.selectionStart;
  const { text, raw } = formatInputMask(typed, mask);

  if (text !== typed) {
    input.value = text;
  }

  if (caret !== null) {
    // Tecla Delete sobre um literal não muda o texto; sem avancar, o cursor ficaria preso antes dele.
    const inputType = (event.nativeEvent as InputEvent).inputType;
    const skippedLiteral = inputType === 'deleteContentForward' && text === previousText;
    const next = skippedLiteral ? caret + previousText.length - typed.length : maskedCaret(typed, caret, mask, text);

    input.setSelectionRange(next, next);
  }

  return raw;
}
