export function formatDecimalInput(value: string, decimalScale = 0): string {
  const sanitized = value.replace(/[^\d,]/g, '');
  const [integerPart = '', ...decimalParts] = sanitized.split(',');
  const integer = integerPart.replace(/\D/g, '');

  if (decimalScale <= 0) {
    return integer;
  }

  const decimal = decimalParts.join('').replace(/\D/g, '').slice(0, decimalScale);
  return sanitized.includes(',') ? `${integer},${decimal}` : integer;
}
