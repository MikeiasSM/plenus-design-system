const SEPARADOR_DECIMAL = ',';

/** Quantos digitos formam um grupo de milhar. */
const DIGITOS_DO_GRUPO = 3;

/** O que fica de cada lado do ponto, quando ha um so e nenhuma virgula. */
function ladosDoPontoUnico(texto: string) {
  const partes = texto.split('.');

  if (texto.includes(SEPARADOR_DECIMAL) || partes.length !== 2) {
    return null;
  }

  return { inteiro: partes[0].replace(/\D/g, ''), fracao: partes[1].replace(/\D/g, '') };
}

/**
 * O ponto e ambiguo. Em pt-BR ele separa milhar, mas teclado numerico e texto
 * colado de origem inglesa o usam como decimal. Ele so vale como decimal quando
 * e o unico da cadeia, nao ha virgula, e o que vem depois dele nao forma um
 * grupo de milhar, ou o que vem antes e zero. Descarta-lo sem olhar
 * multiplicava o valor por dez ou cem.
 */
function normalizarPonto(texto: string) {
  const lados = ladosDoPontoUnico(texto);
  const decimal = lados !== null && (Number(lados.inteiro) === 0 || lados.fracao.length !== DIGITOS_DO_GRUPO);

  return decimal ? texto.replace('.', SEPARADOR_DECIMAL) : texto.replace(/\./g, '');
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

function sinalDe(texto: string) {
  return texto.trimStart().startsWith('-') ? '-' : '';
}

export function formatarEntradaDecimal(valor: string | number, casasDecimais = 0): string {
  const texto = typeof valor === 'number' ? comoTexto(valor, casasDecimais) : normalizarPonto(valor);
  const sinal = sinalDe(texto);
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

/**
 * O texto do campo enquanto se digita. Um ponto unico com menos de tres digitos
 * depois ainda pode virar milhar na proxima tecla: ele fica como foi digitado,
 * e o valor o le como decimal ate la. Decidido na hora, `1.234` virava `1,23`.
 */
export function formatarEdicaoDecimal(texto: string, casasDecimais = 0): string {
  const lados = ladosDoPontoUnico(texto);

  if (casasDecimais <= 0 || lados === null || Number(lados.inteiro) === 0 || lados.fracao.length >= DIGITOS_DO_GRUPO) {
    return formatarEntradaDecimal(texto, casasDecimais);
  }

  return `${sinalDe(texto)}${lados.inteiro}.${lados.fracao}`;
}
