import { formatarEntradaDecimal } from './formatarEntradaDecimal';

/** O simbolo da moeda em pt-BR, como o `Intl` escreve: US$ para o dolar. Codigo invalido fica como veio. */
function simboloDa(moeda: string) {
  try {
    const partes = new Intl.NumberFormat('pt-BR', { currency: moeda, style: 'currency' }).formatToParts(0);

    return partes.find((parte) => parte.type === 'currency')?.value ?? moeda;
  } catch {
    return moeda;
  }
}

export function formatarEntradaMonetaria(valor: string | number, moeda = 'BRL', casasDecimais = 2): string {
  const normalizado = formatarEntradaDecimal(valor, casasDecimais);
  const sinal = normalizado.startsWith('-') ? '-' : '';
  const [inteiroBruto = '', decimais = ''] = normalizado.replace('-', '').split(',');
  const inteiro = inteiroBruto || '0';
  const inteiroAgrupado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const simbolo = simboloDa(moeda);

  if (casasDecimais <= 0) {
    return `${sinal}${simbolo} ${inteiroAgrupado}`;
  }

  return `${sinal}${simbolo} ${inteiroAgrupado},${decimais.padEnd(casasDecimais, '0')}`;
}
