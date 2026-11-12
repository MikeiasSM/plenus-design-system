/**
 * Mascara de entrada: um padrão, em que `0` e um digito, `a` uma letra e `*` uma letra ou digito, e todo
 * outro caractere e literal; ou uma função que recebe o texto e devolve o texto formatado.
 */
export type InputMask = string | ((text: string) => string);

export interface MaskedInput {
  text: string;
  /** Padrão: só os caracteres que preenchem posições. Função: as letras e os digitos do texto. */
  raw: string;
}

const SLOTS: Record<string, RegExp> = {
  '0': /[0-9]/,
  a: /\p{L}/u,
  '*': /[\p{L}\p{N}]/u,
};
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/gu;

interface PatternResult extends MaskedInput {
  /** Literais que terminam o texto digitado e ainda não entraram no resultado. */
  typedLiterals: number;
}

function formatPattern(text: string, pattern: string): PatternResult {
  const literals = [...pattern];
  let formatted = '';
  let raw = '';
  let pending = '';
  let position = 0;
  let typedLiterals = 0;

  for (const char of text) {
    if (literals[position] === char && !SLOTS[char]) {
      pending += char;
      position += 1;
      typedLiterals += 1;
      continue;
    }

    while (position < literals.length && !SLOTS[literals[position]]) {
      pending += literals[position];
      position += 1;
    }

    if (position < literals.length && SLOTS[literals[position]].test(char)) {
      formatted += pending + char;
      raw += char;
      pending = '';
      position += 1;
      typedLiterals = 0;
    }
  }

  return { text: formatted, raw, typedLiterals };
}

/** Os literais só entram quando o próximo caractere chega: apagar o ultimo digito apaga também o separador. */
export function formatInputMask(text: string, mask: InputMask): MaskedInput {
  if (typeof mask === 'string') {
    const { text: formatted, raw } = formatPattern(text, mask);

    return { text: formatted, raw };
  }

  const formatted = mask(text);

  return { text: formatted, raw: formatted.match(LETTER_OR_DIGIT)?.join('') ?? '' };
}

/**
 * Onde fica o cursor depois de formatar. No padrão, logo apos o ultimo caractere aceito antes do cursor, e
 * depois dos literais que a pessoa deixou colados nele; na função, apos o mesmo numero de letras e digitos, que resiste a separadores que se deslocam.
 */
export function maskedCaret(typed: string, caret: number, mask: InputMask, formatted: string) {
  const before = typed.slice(0, caret);

  if (typeof mask === 'string') {
    const { text, typedLiterals } = formatPattern(before, mask);

    return text.length + Math.min(typedLiterals, formatted.length - text.length);
  }

  let remaining = before.match(LETTER_OR_DIGIT)?.length ?? 0;

  if (remaining === 0) {
    return 0;
  }

  for (let index = 0; index < formatted.length; index += 1) {
    if (formatted.slice(index, index + 1).match(LETTER_OR_DIGIT)) {
      remaining -= 1;
    }

    if (remaining === 0) {
      return index + 1;
    }
  }

  return formatted.length;
}
