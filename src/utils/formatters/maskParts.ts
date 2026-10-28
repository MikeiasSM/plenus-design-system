/**
 * Mascara de partes com limite de digitos, como dia/mes/ano. O separador digitado fecha a parte antes
 * de encher, e ninguem empurra digito para a vizinha; sem ele, o excesso passa para a parte seguinte.
 */
export function maskParts(value: string, limits: readonly number[], separators: readonly string[]) {
  const chunks = value.replace(/^\D+/, '').split(/\D+/);
  const parts: string[] = [];

  chunks.forEach((chunk, index) => {
    const closed = index < chunks.length - 1;
    let rest = chunk;

    do {
      if (parts.length === limits.length) {
        return;
      }

      const limit = limits[parts.length];
      parts.push(rest.slice(0, limit));
      rest = closed ? '' : rest.slice(limit);
    } while (rest);
  });

  return parts.map((part, index) => (index === 0 ? part : separators[index - 1] + part)).join('');
}
