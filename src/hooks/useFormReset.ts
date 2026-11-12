import { useEffect, useRef } from 'react';

/**
 * Restaura o valor inicial quando o formulario e reiniciado. Campo que guarda o
 * texto exibido em estado do React nao volta sozinho: o `reset` mexe no DOM, e
 * o estado continua onde estava.
 */
export function useFormReset<T extends HTMLElement>(restaurar: () => void) {
  const ref = useRef<T>(null);
  const acao = useRef(restaurar);

  acao.current = restaurar;

  useEffect(() => {
    const formulario = ref.current?.closest('form');

    if (!formulario) {
      return;
    }

    const ouvir = () => acao.current();

    formulario.addEventListener('reset', ouvir);

    return () => formulario.removeEventListener('reset', ouvir);
  }, []);

  return ref;
}
