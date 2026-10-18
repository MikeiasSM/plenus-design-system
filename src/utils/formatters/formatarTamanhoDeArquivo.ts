export interface OpcoesDeTamanhoDeArquivo {
  /** Sem declarar, ate uma casa: `24,6 MB` e `512 KB`. Bytes saem sempre inteiros. */
  casasDecimais?: number;
  localidade?: string;
}

const UNIDADES = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
const BASE = 1024;

/** Tamanho de arquivo em base 1024, com os separadores da localidade: `950 B`, `512 KB`, `1,2 GB`. */
export function formatarTamanhoDeArquivo(
  bytes: number,
  { casasDecimais, localidade = 'pt-BR' }: OpcoesDeTamanhoDeArquivo = {},
) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '';
  }

  let indice = bytes < BASE ? 0 : Math.min(Math.floor(Math.log(bytes) / Math.log(BASE)), UNIDADES.length - 1);
  const digitos = (unidade: number) => (unidade === 0 ? 0 : (casasDecimais ?? 1));
  const arredondar = (valor: number, casas: number) => Math.round(valor * 10 ** casas) / 10 ** casas;

  // O que arredonda para 1024 da unidade sobe para a seguinte: `1.048.575` bytes e `1 MB`, nao `1.024 KB`.
  if (indice < UNIDADES.length - 1 && arredondar(bytes / BASE ** indice, digitos(indice)) >= BASE) {
    indice += 1;
  }

  const casas = digitos(indice);
  const numero = new Intl.NumberFormat(localidade, {
    maximumFractionDigits: casas,
    minimumFractionDigits: casasDecimais === undefined ? 0 : casas,
  }).format(bytes / BASE ** indice);

  return `${numero} ${UNIDADES[indice]}`;
}
