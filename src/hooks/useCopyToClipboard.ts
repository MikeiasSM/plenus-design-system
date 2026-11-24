import { useEffect, useState } from 'react';
import { copyText } from '../utils/clipboard/clipboard';

export type CopyStatus = 'copied' | 'failed' | 'idle';

interface CopyState {
  /** Conta as tentativas: muda a cada cópia, mesmo quando o estado se repete. */
  count: number;
  status: CopyStatus;
}

/**
 * Cópia com retorno: `copied` dura `feedbackMs` e recomeça a cada cópia, mesmo repetida antes do fim; `failed`
 * fica até a próxima tentativa, para o aviso de falha não sumir antes de ser lido. `count` serve de chave para
 * a região de status anunciar de novo um texto igual.
 */
export function useCopyToClipboard(feedbackMs: number) {
  const [state, setState] = useState<CopyState>({ count: 0, status: 'idle' });

  useEffect(() => {
    if (state.status !== 'copied') {
      return;
    }

    const timer = setTimeout(() => setState((current) => ({ ...current, status: 'idle' })), feedbackMs);

    return () => clearTimeout(timer);
  }, [feedbackMs, state]);

  async function copy(text: string) {
    const copied = await copyText(text);

    setState((current) => ({ count: current.count + 1, status: copied ? 'copied' : 'failed' }));

    return copied;
  }

  return { copy, count: state.count, status: state.status };
}
