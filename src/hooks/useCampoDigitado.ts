import { useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type RefObject } from 'react';

type Avaliacao<T> = { valor: T } | { mensagem: string };

interface Opcoes<T> {
  agora: () => T;
  atual: T | undefined;
  avaliar: (texto: string) => Avaliacao<T>;
  deslocar: (valor: T, passo: 1 | -1, texto: string, cursor: number) => { cursor: number; valor: T };
  erro?: string;
  filtrar: (entrada: string) => string;
  gravar: (valor: T | null) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  ler: (texto: string) => T | undefined;
  mascarar: (entrada: string) => string;
  onInvalid?: (texto: string) => void;
  paraTexto: (valor?: T) => string;
  permitido: (valor: T) => boolean;
  separadores: string;
}

export function useCampoDigitado<T extends { toString: () => string }>({
  agora,
  atual,
  avaliar,
  deslocar,
  erro,
  filtrar,
  gravar,
  inputRef,
  ler,
  mascarar,
  onInvalid,
  paraTexto,
  permitido,
  separadores,
}: Opcoes<T>) {
  const [texto, setTexto] = useState('');
  const [digitando, setDigitando] = useState(false);
  const [mensagem, setMensagem] = useState<string>();
  const cursorRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (cursorRef.current !== null) {
      inputRef.current?.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  });

  function limpar() {
    setDigitando(false);
    setMensagem(undefined);
  }

  function aplicar(valor: T, cursor?: number) {
    if (!permitido(valor)) {
      return;
    }

    const escrito = paraTexto(valor);

    cursorRef.current = cursor ?? escrito.length;
    setTexto(escrito);
    limpar();

    if (valor.toString() !== atual?.toString()) {
      gravar(valor);
    }
  }

  function mudar(entrada: string) {
    const mascarado = mascarar(filtrar(entrada));

    setDigitando(true);
    setTexto(mascarado);

    if (mascarado.trim() === '') {
      setMensagem(undefined);
      gravar(null);
      return;
    }

    const lido = ler(mascarado);

    if (lido) {
      setMensagem(undefined);
      gravar(lido);
    }
  }

  function confirmar() {
    if (!digitando) {
      return;
    }

    if (texto.trim() === '') {
      limpar();
      return;
    }

    const avaliado = avaliar(texto);

    if ('mensagem' in avaliado) {
      setMensagem(avaliado.mensagem);
      onInvalid?.(texto);
      return;
    }

    setTexto(paraTexto(avaliado.valor));
    limpar();

    if (avaliado.valor.toString() !== atual?.toString()) {
      gravar(avaliado.valor);
    }
  }

  function tratarTecla(event: KeyboardEvent<HTMLInputElement>) {
    const { altKey, ctrlKey, key, metaKey } = event;

    if (event.defaultPrevented || altKey || ctrlKey || metaKey) {
      return;
    }

    if (key === 'Enter') {
      confirmar();
    } else if (key === 'h' || key === 'H') {
      event.preventDefault();
      aplicar(agora());
    } else if (key === '+' || key === '-') {
      event.preventDefault();

      const base = digitando ? (texto.trim() === '' ? undefined : (ler(texto) ?? atual)) : atual;
      const proximo = deslocar(
        base ?? agora(),
        key === '+' ? 1 : -1,
        event.currentTarget.value,
        event.currentTarget.selectionStart ?? event.currentTarget.value.length,
      );

      aplicar(proximo.valor, proximo.cursor);
    } else if (key.length === 1 && !(key >= '0' && key <= '9') && !separadores.includes(key)) {
      event.preventDefault();
    }
  }

  function sair(event: FocusEvent<HTMLInputElement>, onBlur?: (event: FocusEvent<HTMLInputElement>) => void) {
    confirmar();
    onBlur?.(event);
  }

  return {
    confirmar,
    erro: erro ?? mensagem,
    exibido: digitando ? texto : paraTexto(atual),
    limpar,
    mudar,
    sair,
    tratarTecla,
  };
}
