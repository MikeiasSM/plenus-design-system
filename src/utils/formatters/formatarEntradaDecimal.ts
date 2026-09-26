const SEPARADOR_DECIMAL = ',';

/** Quantos digitos formam um grupo de milhar. */
const DIGITOS_DO_GRUPO = 3;

/**
 * O ponto e ambiguo. Em pt-BR ele separa milhar, mas teclado numerico e texto
 * colado de origem inglesa o usam como decimal. Ele so vale como decimal quando
 * e o unico da cadeia, nao ha virgula, e o que vem depois dele nao forma um
 * grupo de milhar. Descarta-lo sem olhar multiplicava o valor por dez ou cem.
 */
function normalizarPonto(texto: string) {
  if (texto.includes(SEPARADOR_DECIMAL)) {
    return texto.replace(/\./g, '');
  }

  const partes = texto.split('.');

  if (partes.length !== 2 || partes[1].replace(/\D/g, '').length === DIGITOS_DO_GRUPO) {
    return texto.replace(/\./g, '');
  }

  return partes.join(SEPARADOR_DECIMAL);
}

/**
 * Numero que vem de fora **arredonda** nas casas pedidas, em vez de truncar, e
 * sai sem notacao exponencial. Truncar e o certo para o que se digita, porque
 * ali o valor ainda esta pela metade; para um valor pronto, e perda.
 */
function comoTexto(valor: number, casasDecimais: number) {
  if (!Number.isFinite(valor)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: Math.max(casasDecimais, 0),
    useGrouping: false,
  })
    .format(valor)
    .replace('.', SEPARADOR_DECIMAL);
}

export function formatarEntradaDecimal(valor: string | number, casasDecimais = 0): string {
  const texto = typeof valor === 'number' ? comoTexto(valor, casasDecimais) : normalizarPonto(valor);
  const sinal = texto.trimStart().startsWith('-') ? '-' : '';
  const limpo = texto.replace(/[^\d,]/g, '');
  const [inteiroBruto = '', ...resto] = limpo.split(SEPARADOR_DECIMAL);
  const inteiro = inteiroBruto.replace(/\D/g, '');

  if (casasDecimais <= 0) {
    return `${sinal}${inteiro}`;
  }

  if (!limpo.includes(SEPARADOR_DECIMAL)) {
    return `${sinal}${inteiro}`;
  }

  const decimais = resto.join('').replace(/\D/g, '').slice(0, casasDecimais);
  return `${sinal}${inteiro}${SEPARADOR_DECIMAL}${decimais}`;
}
