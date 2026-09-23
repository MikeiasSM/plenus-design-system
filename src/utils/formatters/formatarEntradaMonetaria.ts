import { formatarEntradaDecimal } from './formatarEntradaDecimal';

export function formatarEntradaMonetaria(valor: string | number, moeda = 'BRL', casasDecimais = 2): string {
  const normalizado = formatarEntradaDecimal(valor, casasDecimais);
  const sinal = normalizado.startsWith('-') ? '-' : '';
  const [inteiroBruto = '', decimais = ''] = normalizado.replace('-', '').split(',');
  const inteiro = inteiroBruto || '0';
  const inteiroAgrupado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const simbolo = moeda === 'BRL' ? 'R$' : moeda;

  if (casasDecimais <= 0) {
    return `${sinal}${simbolo} ${inteiroAgrupado}`;
  }

  return `${sinal}${simbolo} ${inteiroAgrupado},${decimais.padEnd(casasDecimais, '0')}`;
}
