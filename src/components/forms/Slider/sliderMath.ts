/** Casas decimais de um número, para o passo de 0,1 não acumular o erro do ponto flutuante. */
function decimalsOf(value: number) {
  if (!Number.isFinite(value) || Number.isInteger(value)) {
    return 0;
  }

  const [base, exponent] = String(value).split('e');
  const fraction = base.split('.')[1]?.length ?? 0;

  return Math.max(0, fraction - Number(exponent ?? 0));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Leva o valor ao passo mais próximo, contado a partir do mínimo, e o prende entre os extremos. */
export function snapToStep(value: number, min: number, max: number, step: number) {
  if (!(step > 0)) {
    return clamp(value, min, max);
  }

  const snapped = Math.round((value - min) / step) * step + min;
  const decimals = Math.max(decimalsOf(step), decimalsOf(min));

  return clamp(Number(snapped.toFixed(decimals)), min, max);
}

/** Posição do valor no trilho, de 0 a 1. */
export function fractionOf(value: number, min: number, max: number) {
  return max > min ? clamp((value - min) / (max - min), 0, 1) : 0;
}

/**
 * Prende o polegar entre os extremos e o vizinho, sem cruzar. O primeiro fica até o segundo menos a distância mínima,
 * e o segundo, a partir do primeiro mais ela.
 */
export function constrainThumb(values: readonly number[], index: number, value: number, min: number, max: number, minDistance: number) {
  let next = clamp(value, min, max);

  if (values.length > 1) {
    next = index === 0 ? Math.min(next, values[1] - minDistance) : Math.max(next, values[0] + minDistance);
  }

  return next;
}

export function sameValues(a: readonly number[], b: readonly number[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
