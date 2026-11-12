export interface FormatFileSizeOptions {
  /** Sem declarar, ate uma casa: `24,6 MB` e `512 KB`. Bytes saem sempre inteiros. */
  decimals?: number;
  locale?: string;
}

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
const BASE = 1024;

/** Tamanho de arquivo em base 1024, com os separadores da localidade: `950 B`, `512 KB`, `1,2 GB`. */
export function formatFileSize(bytes: number, { decimals, locale = 'pt-BR' }: FormatFileSizeOptions = {}) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '';
  }

  let unit = bytes < BASE ? 0 : Math.min(Math.floor(Math.log(bytes) / Math.log(BASE)), UNITS.length - 1);
  const digitsOf = (index: number) => (index === 0 ? 0 : (decimals ?? 1));
  const round = (value: number, places: number) => Math.round(value * 10 ** places) / 10 ** places;

  // O que arredonda para 1024 da unidade sobe para a seguinte: `1.048.575` bytes e `1 MB`, nao `1.024 KB`.
  if (unit < UNITS.length - 1 && round(bytes / BASE ** unit, digitsOf(unit)) >= BASE) {
    unit += 1;
  }

  const digits = digitsOf(unit);
  const number = new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: decimals === undefined ? 0 : digits,
  }).format(bytes / BASE ** unit);

  return `${number} ${UNITS[unit]}`;
}
