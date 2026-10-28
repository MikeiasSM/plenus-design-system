/**
 * Nomes em portugues da 0.3, aceitos ate a versao menor seguinte. Cada um traduz as
 * proprias opcoes e chama o formatador em ingles.
 */
import { formatDate, formatTime } from './formatDate';
import { formatDuration } from './formatDuration';
import { formatFileSize } from './formatFileSize';
import { formatCurrency, formatNumber, formatPercent } from './formatNumber';

/** @deprecated Use `CompactNotation`; `'sigla'` virou `'symbol'`. */
export type Compacto = boolean | 'sigla';

/** @deprecated Use `FormatNumberOptions`. */
export interface OpcoesDeNumero {
  casasDecimais?: number;
  compacto?: Compacto;
  localidade?: string;
}

/** @deprecated Use `FormatCurrencyOptions`. */
export interface OpcoesDeMoeda extends OpcoesDeNumero {
  moeda?: string;
}

/** @deprecated Use `FormatPercentOptions`. */
export interface OpcoesDePercentual {
  casasDecimais?: number;
  localidade?: string;
}

/** @deprecated Use `FormatDateOptions`. */
export interface OpcoesDeData {
  formato?: 'curto' | 'longo' | 'numerico';
  localidade?: string;
}

/** @deprecated Use `FormatTimeOptions`. */
export interface OpcoesDeHora {
  localidade?: string;
  segundos?: boolean;
}

/** @deprecated Use `FormatFileSizeOptions`. */
export interface OpcoesDeTamanhoDeArquivo {
  casasDecimais?: number;
  localidade?: string;
}

const FORMATS = { curto: 'short', longo: 'long', numerico: 'numeric' } as const;

function numberOptions({ casasDecimais, compacto, localidade }: OpcoesDeNumero) {
  return { compact: compacto === 'sigla' ? ('symbol' as const) : compacto, decimals: casasDecimais, locale: localidade };
}

/** @deprecated Use `formatNumber`. */
export function formatarNumero(valor: number, opcoes: OpcoesDeNumero = {}) {
  return formatNumber(valor, numberOptions(opcoes));
}

/** @deprecated Use `formatCurrency`. */
export function formatarMoeda(valor: number, opcoes: OpcoesDeMoeda = {}) {
  return formatCurrency(valor, { ...numberOptions(opcoes), currency: opcoes.moeda });
}

/** @deprecated Use `formatPercent`. */
export function formatarPercentual(valor: number, { casasDecimais, localidade }: OpcoesDePercentual = {}) {
  return formatPercent(valor, { decimals: casasDecimais, locale: localidade });
}

/** @deprecated Use `formatDate`. */
export function formatarData(valor: Date | string, { formato, localidade }: OpcoesDeData = {}) {
  return formatDate(valor, { format: formato && FORMATS[formato], locale: localidade });
}

/** @deprecated Use `formatTime`. */
export function formatarHora(valor: Date | string, { localidade, segundos }: OpcoesDeHora = {}) {
  return formatTime(valor, { locale: localidade, seconds: segundos });
}

/** @deprecated Use `formatDuration`. */
export function formatarDuracao(milissegundos: number) {
  return formatDuration(milissegundos);
}

/** @deprecated Use `formatFileSize`. */
export function formatarTamanhoDeArquivo(bytes: number, { casasDecimais, localidade }: OpcoesDeTamanhoDeArquivo = {}) {
  return formatFileSize(bytes, { decimals: casasDecimais, locale: localidade });
}
