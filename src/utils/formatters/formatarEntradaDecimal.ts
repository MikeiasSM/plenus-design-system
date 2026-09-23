const SEPARADOR_DECIMAL = ',';

export function formatarEntradaDecimal(valor: string | number, casasDecimais = 0): string {
  const texto = typeof valor === 'number' ? String(valor).replace('.', SEPARADOR_DECIMAL) : valor;
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
