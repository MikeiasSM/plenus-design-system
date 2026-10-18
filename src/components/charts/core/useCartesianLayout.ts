import { useEffect, useRef, useState } from 'react';
import { cartesianLayout, type CartesianLayoutOptions, type ChartMargins } from './cartesianLayout';
import { useTweenedNumbers } from './useTweenedNumbers';

/** Ponteiro parado sobre o grafico ate os eixos `onHover` entrarem: so atravessar o grafico nao o faz encolher. */
const ATRASO_DA_REVELACAO = 600;
const DURACAO_DA_REVELACAO = 240;

export interface AxisReveal {
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  revealed: boolean;
}

function interpolar(de: ChartMargins, ate: ChartMargins, fator: number): ChartMargins {
  return {
    bottom: de.bottom + (ate.bottom - de.bottom) * fator,
    left: de.left + (ate.left - de.left) * fator,
    right: de.right + (ate.right - de.right) * fator,
    top: de.top + (ate.top - de.top) * fator,
  };
}

/**
 * Layout cartesiano com os eixos `onHover`. Sem eles revelados, o desenho ocupa
 * o espaco todo; revelados, ele encolhe ate as calhas, numa transicao so. Dado
 * ou tamanho que mudam reposicionam na hora: o que anima e a revelacao.
 */
export function useCartesianLayout(options: Omit<CartesianLayoutOptions, 'revealed'>) {
  const dinamico = [options.xAxis, options.yAxis, options.yAxisRight].includes('onHover');
  const [revelado, setRevelado] = useState(false);
  const relogio = useRef<ReturnType<typeof setTimeout>>(undefined);
  const revealed = dinamico && revelado;
  const [progresso = 0] = useTweenedNumbers([revealed ? 1 : 0], { duration: DURACAO_DA_REVELACAO });

  useEffect(() => () => clearTimeout(relogio.current), []);

  const recolhido = cartesianLayout({ ...options, revealed: false });
  const aberto = dinamico ? cartesianLayout({ ...options, revealed: true }) : recolhido;
  const margins = interpolar(recolhido.margins, aberto.margins, progresso);

  const axisReveal: AxisReveal = {
    onPointerEnter: () => {
      if (dinamico) {
        clearTimeout(relogio.current);
        relogio.current = setTimeout(() => setRevelado(true), ATRASO_DA_REVELACAO);
      }
    },
    onPointerLeave: () => {
      clearTimeout(relogio.current);
      setRevelado(false);
    },
    revealed,
  };

  return {
    axisReveal,
    margins,
    plot: {
      height: Math.max(options.height - margins.top - margins.bottom, 0),
      width: Math.max(options.width - margins.left - margins.right, 0),
    },
    rotation: (revealed ? aberto : recolhido).rotation,
  };
}
