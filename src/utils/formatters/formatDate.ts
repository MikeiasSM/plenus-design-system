export interface FormatDateOptions {
  format?: 'long' | 'numeric' | 'short';
  locale?: string;
}

export interface FormatTimeOptions {
  locale?: string;
  seconds?: boolean;
}

const STYLES: Record<NonNullable<FormatDateOptions['format']>, Intl.DateTimeFormatOptions> = {
  numeric: { day: '2-digit', month: '2-digit', year: 'numeric' },
  short: { day: '2-digit', month: 'short', year: 'numeric' },
  long: { day: '2-digit', month: 'long', year: 'numeric' },
};

/** Data sem hora, que precisa ser lida no fuso local. */
const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Data sem hora entra pelo fuso local: lida como UTC, ela recua um dia em
 * qualquer fuso negativo. Qualquer outra cadeia — a comecar pelo que sai de
 * `toISOString()` — vai inteira para o `Date`, que sabe ler o deslocamento.
 */
function toDate(value: Date | string) {
  if (value instanceof Date) {
    return value;
  }

  if (PLAIN_DATE.test(value)) {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

export function formatDate(value: Date | string, { format = 'numeric', locale = 'pt-BR' }: FormatDateOptions = {}) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, STYLES[format]).format(date);
}

export function formatTime(value: Date | string, { locale = 'pt-BR', seconds = false }: FormatTimeOptions = {}) {
  const date = typeof value === 'string' && /^\d{2}:\d{2}/.test(value) ? new Date(`1970-01-01T${value}`) : toDate(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: seconds ? '2-digit' : undefined,
    hourCycle: 'h23',
  }).format(date);
}
