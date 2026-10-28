import { formatDecimalInput } from './formatDecimalInput';

/** O simbolo da moeda em pt-BR, como o `Intl` escreve: US$ para o dolar. Codigo invalido fica como veio. */
function symbolOf(currency: string) {
  try {
    const parts = new Intl.NumberFormat('pt-BR', { currency, style: 'currency' }).formatToParts(0);

    return parts.find((part) => part.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}

export function formatCurrencyInput(value: string | number, currency = 'BRL', decimals = 2): string {
  const normalized = formatDecimalInput(value, decimals);
  const sign = normalized.startsWith('-') ? '-' : '';
  const [rawInteger = '', fraction = ''] = normalized.replace('-', '').split(',');
  const integer = rawInteger || '0';
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const symbol = symbolOf(currency);

  if (decimals <= 0) {
    return `${sign}${symbol} ${grouped}`;
  }

  return `${sign}${symbol} ${grouped},${fraction.padEnd(decimals, '0')}`;
}
