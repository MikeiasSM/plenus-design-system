const DECIMAL_SEPARATOR = ',';

/** Quantos digitos formam um grupo de milhar. */
const GROUP_DIGITS = 3;

/** O que fica de cada lado do ponto, quando ha um so e nenhuma virgula. */
function sidesOfSingleDot(text: string) {
  const parts = text.split('.');

  if (text.includes(DECIMAL_SEPARATOR) || parts.length !== 2) {
    return null;
  }

  return { fraction: parts[1].replace(/\D/g, ''), integer: parts[0].replace(/\D/g, '') };
}

/**
 * O ponto separa milhar em pt-BR e e decimal no teclado numerico e no texto colado: vale como decimal so quando e o
 * unico, sem virgula, e o que vem depois nao forma grupo de milhar ou o que vem antes e zero.
 */
function normalizeDot(text: string) {
  const sides = sidesOfSingleDot(text);
  const decimal = sides !== null && (Number(sides.integer) === 0 || sides.fraction.length !== GROUP_DIGITS);

  return decimal ? text.replace('.', DECIMAL_SEPARATOR) : text.replace(/\./g, '');
}

/**
 * Numero que vem de fora **arredonda** nas casas pedidas, em vez de truncar, e
 * sai sem notacao exponencial. Truncar e o certo para o que se digita, porque
 * ali o valor ainda esta pela metade; para um valor pronto, e perda.
 */
function asText(value: number, decimals: number) {
  if (!Number.isFinite(value)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: Math.max(decimals, 0),
    useGrouping: false,
  })
    .format(value)
    .replace('.', DECIMAL_SEPARATOR);
}

function signOf(text: string) {
  return text.trimStart().startsWith('-') ? '-' : '';
}

export function formatDecimalInput(value: string | number, decimals = 0): string {
  const text = typeof value === 'number' ? asText(value, decimals) : normalizeDot(value);
  const sign = signOf(text);
  const clean = text.replace(/[^\d,]/g, '');
  const [rawInteger = '', ...rest] = clean.split(DECIMAL_SEPARATOR);
  const integer = rawInteger.replace(/\D/g, '');

  if (decimals <= 0) {
    return `${sign}${integer}`;
  }

  if (!clean.includes(DECIMAL_SEPARATOR)) {
    return `${sign}${integer}`;
  }

  const fraction = rest.join('').replace(/\D/g, '').slice(0, decimals);
  return `${sign}${integer}${DECIMAL_SEPARATOR}${fraction}`;
}

/**
 * O texto do campo enquanto se digita: o ponto que ainda pode virar milhar na proxima tecla fica como foi digitado, e
 * o valor o le como decimal ate la. Decidido na hora, `1.234` virava `1,23`.
 */
export function formatDecimalDraft(text: string, decimals = 0): string {
  const sides = sidesOfSingleDot(text);

  if (decimals <= 0 || sides === null || Number(sides.integer) === 0 || sides.fraction.length >= GROUP_DIGITS) {
    return formatDecimalInput(text, decimals);
  }

  return `${signOf(text)}${sides.integer}.${sides.fraction}`;
}
