/** Montar um `Intl` custa bem mais que formatar com ele: quem formata milhares de valores reaproveita o mesmo. */

const numberFormats = new Map<string, Intl.NumberFormat>();
const dateTimeFormats = new Map<string, Intl.DateTimeFormat>();

function cached<Format>(cache: Map<string, Format>, locale: string, options: object, create: () => Format) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = cache.get(key);

  if (!format) {
    format = create();
    cache.set(key, format);
  }

  return format;
}

export function numberFormat(locale: string, options: Intl.NumberFormatOptions) {
  return cached(numberFormats, locale, options, () => new Intl.NumberFormat(locale, options));
}

export function dateTimeFormat(locale: string, options: Intl.DateTimeFormatOptions) {
  return cached(dateTimeFormats, locale, options, () => new Intl.DateTimeFormat(locale, options));
}
