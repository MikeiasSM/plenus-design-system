import { useMemo } from 'react';
import { linearScale, type NumericRange } from '../scales';
import { useTweenedNumbers } from './useTweenedNumbers';

/**
 * Escalas dos dois eixos de valor. As alvo fixam as marcas, que sem elas exibiriam valores quebrados na transição;
 * as animadas posicionam o desenho, e os dois dominios caminham numa animação só, chegando juntos.
 */
export function useValueScales([leftDomain, rightDomain]: readonly [NumericRange, NumericRange], from: number, to: number) {
  const targetLeft = useMemo(() => linearScale({ domain: leftDomain, nice: false, range: [from, to] }), [from, leftDomain, to]);
  const targetRight = useMemo(() => linearScale({ domain: rightDomain, nice: false, range: [from, to] }), [from, rightDomain, to]);

  const [minLeft, maxLeft, minRight, maxRight] = useTweenedNumbers([...targetLeft.domain(), ...targetRight.domain()]);

  const left = useMemo(() => linearScale({ domain: { max: maxLeft, min: minLeft }, nice: false, range: [from, to] }), [from, maxLeft, minLeft, to]);
  const right = useMemo(() => linearScale({ domain: { max: maxRight, min: minRight }, nice: false, range: [from, to] }), [from, maxRight, minRight, to]);

  return { left, right, targetLeft, targetRight };
}
