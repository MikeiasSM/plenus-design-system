import { formatDecimalInput } from './formatDecimalInput';

export function formatCurrencyInput(value: string, currency = 'BRL', decimalScale = 2): string {
  const normalized = formatDecimalInput(value, decimalScale);
  const [integerPart = '0', decimalPart = ''] = normalized.split(',');
  const integer = integerPart || '0';
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimals = decimalPart.padEnd(decimalScale, '0');
  const symbol = currency === 'BRL' ? 'R$' : currency;

  return `${symbol} ${groupedInteger},${decimals}`;
}
