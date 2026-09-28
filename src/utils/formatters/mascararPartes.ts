/**
 * Mascara de partes com limite de digitos, como dia/mes/ano. O separador digitado fecha a parte antes
 * de encher, e ninguem empurra digito para a vizinha; sem ele, o excesso passa para a parte seguinte.
 */
export function mascararPartes(valor: string, limites: readonly number[], separadores: readonly string[]) {
  const trechos = valor.replace(/^\D+/, '').split(/\D+/);
  const partes: string[] = [];

  trechos.forEach((trecho, indice) => {
    const fechado = indice < trechos.length - 1;
    let resto = trecho;

    do {
      if (partes.length === limites.length) {
        return;
      }

      const limite = limites[partes.length];
      partes.push(resto.slice(0, limite));
      resto = fechado ? '' : resto.slice(limite);
    } while (resto);
  });

  return partes.map((parte, indice) => (indice === 0 ? parte : separadores[indice - 1] + parte)).join('');
}
