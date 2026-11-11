import { useEffect, useRef, useState } from 'react';
import { familias } from '../catalogo';
import {
  aplicarTemaNoDocumento,
  CHAVE_DO_TEMA,
  mensagemConfiavel,
  type MensagemDaPrevia,
  type MensagemParaAPrevia,
  type TemaDoDocumento,
} from './janela';
import type { Valores } from './tipos';

function temaGuardado(): TemaDoDocumento {
  try {
    const guardado = localStorage.getItem(CHAVE_DO_TEMA);
    return guardado === 'dark' || guardado === 'light' ? guardado : 'system';
  } catch {
    return 'system';
  }
}

function avisar(mensagem: MensagemDaPrevia) {
  // Fora de um iframe, `parent` e a propria janela: ninguem ouve, e nada quebra.
  if (window.parent !== window) {
    window.parent.postMessage(mensagem, window.location.origin);
  }
}

/**
 * A previa de um playground numa janela propria, para o `matchMedia` e as consultas de midia do componente
 * valerem a largura do iframe. Os valores e o tema chegam da pagina; os eventos e a altura voltam para ela.
 */
export function Previa({ componente }: { componente: string }) {
  const definicao = familias
    .flatMap((familia) => familia.componentes)
    .find((item) => item.nome.toLowerCase() === componente.toLowerCase())?.pagina?.playground;
  const [valores, setValores] = useState<Valores | undefined>(definicao?.inicial);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aplicarTemaNoDocumento(temaGuardado());

    function receber(evento: MessageEvent<MensagemParaAPrevia>) {
      if (!mensagemConfiavel(evento, window.parent) || evento.data?.tipo !== 'estado') {
        return;
      }

      aplicarTemaNoDocumento(evento.data.tema);
      setValores(evento.data.valores);
    }

    window.addEventListener('message', receber);
    avisar({ tipo: 'pronto' });

    return () => window.removeEventListener('message', receber);
  }, []);

  useEffect(() => {
    const alvo = raiz.current;

    if (!alvo) {
      return undefined;
    }

    // A pagina dimensiona o iframe pelo conteudo, para a previa nao cortar nem rolar por dentro.
    const observador = new ResizeObserver(() => avisar({ tipo: 'altura', altura: Math.ceil(alvo.getBoundingClientRect().height) }));
    observador.observe(alvo);

    return () => observador.disconnect();
  }, []);

  if (!definicao || !valores) {
    return <p style={{ padding: 16 }}>Prévia indisponível para este componente.</p>;
  }

  return <div ref={raiz}>{definicao.renderizar(valores, (nome) => avisar({ tipo: 'evento', nome }))}</div>;
}
