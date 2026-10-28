import {
  formatarData,
  formatarHora,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  formatarTamanhoDeArquivo,
} from './deprecated';
import { formatCurrency, formatDate, formatFileSize, formatNumber, formatPercent, formatTime } from './index';

describe('nomes obsoletos em portugues', () => {
  it('traduzem as opcoes antigas e entregam o mesmo texto dos nomes em ingles', () => {
    expect(formatarNumero(1500000, { casasDecimais: 1, compacto: 'sigla' })).toBe(
      formatNumber(1500000, { compact: 'symbol', decimals: 1 }),
    );
    expect(formatarMoeda(1234.5, { localidade: 'en-US', moeda: 'USD' })).toBe(
      formatCurrency(1234.5, { currency: 'USD', locale: 'en-US' }),
    );
    expect(formatarPercentual(0.4234, { casasDecimais: 1 })).toBe(formatPercent(0.4234, { decimals: 1 }));
    expect(formatarData('2026-03-05', { formato: 'longo' })).toBe(formatDate('2026-03-05', { format: 'long' }));
    expect(formatarHora('09:05:07', { segundos: true })).toBe(formatTime('09:05:07', { seconds: true }));
    expect(formatarTamanhoDeArquivo(1536, { casasDecimais: 2 })).toBe(formatFileSize(1536, { decimals: 2 }));
  });

  it('mantem os padroes de quando nada e informado', () => {
    expect(formatarNumero(1234.5)).toBe('1.234,5');
    expect(formatarPercentual(0.42)).toBe('42%');
  });
});
