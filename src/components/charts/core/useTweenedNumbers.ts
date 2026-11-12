import { useEffect, useRef, useState } from 'react';

/**
 * Duracao do movimento dos dados. Ela e mais longa que os tokens de `speed`,
 * que medem resposta a um gesto: aqui o olho precisa acompanhar uma barra
 * mudando de altura, nao apenas notar que algo respondeu.
 */
const DURACAO = 320;

/**
 * Sem `matchMedia` nao ha navegador para animar, e sem preferencia conhecida o
 * salto e a escolha segura. Isso tambem mantem o resultado deterministico fora
 * do navegador, onde nao existe quadro a quadro.
 */
function podeAnimar() {
  return typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Desacelera no fim, para o valor chegar ao alvo sem parecer que bateu nele. */
function suavizar(t: number) {
  return 1 - (1 - t) ** 3;
}

/**
 * Numeros que caminham ate o alvo em vez de saltar. Animar o dominio de uma
 * escala move o grafico inteiro — barras, curvas, grade e marcas do eixo — com
 * uma unica animacao, em vez de uma por marca.
 *
 * Quando a quantidade de numeros muda nao existe par para interpolar, e o valor
 * assume o alvo de imediato.
 */
export interface TweenOptions {
  duration?: number;
  /** Ponto de partida do primeiro quadro, para o grafico entrar em vez de surgir pronto. */
  from?: readonly number[];
}

export function useTweenedNumbers(target: readonly number[], { duration = DURACAO, from }: TweenOptions = {}) {
  const [valores, setValores] = useState(from ?? target);
  const atual = useRef(from ?? target);

  // A chave resume os numeros: o efeito reage ao valor, e nao a identidade do
  // array, que e outra a cada render.
  const chave = target.join(',');

  useEffect(() => {
    const inicio = atual.current;

    const assumir = (proximos: readonly number[]) => {
      atual.current = proximos;
      setValores(proximos);
    };

    if (inicio.length !== target.length || duration <= 0 || !podeAnimar()) {
      assumir(target);
      return;
    }

    const comeco = performance.now();
    let quadro = 0;

    const passo = () => {
      const decorrido = Math.min((performance.now() - comeco) / duration, 1);
      const fator = suavizar(decorrido);

      assumir(inicio.map((valor, indice) => valor + (target[indice] - valor) * fator));

      if (decorrido < 1) {
        quadro = requestAnimationFrame(passo);
      }
    };

    quadro = requestAnimationFrame(passo);

    return () => cancelAnimationFrame(quadro);
  }, [chave, duration]);

  return valores;
}
