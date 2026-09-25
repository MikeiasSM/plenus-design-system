import { scaleBand, scaleLinear, scaleLog, scalePoint, scaleSqrt, scaleTime } from 'd3-scale';
import { extent, max, min } from 'd3-array';

export type ScaleKind = 'linear' | 'log' | 'time' | 'band' | 'point';

export interface NumericRange {
  max: number;
  min: number;
}

export interface ContinuousScaleOptions {
  clamp?: boolean;
  domain: NumericRange;
  nice?: boolean;
  range: [number, number];
}

export interface CategoricalScaleOptions {
  domain: readonly string[];
  padding?: number;
  range: [number, number];
}

/**
 * Faixa que cobre os valores, com o zero incluido por padrao. Uma barra que
 * nao parte do zero exagera a diferenca entre os valores.
 */
export function domainOf(values: readonly number[], { includeZero = true } = {}): NumericRange {
  const finitos = values.filter(Number.isFinite);

  if (finitos.length === 0) {
    return { min: 0, max: 0 };
  }

  const [menor = 0, maior = 0] = extent(finitos);

  return {
    min: includeZero ? Math.min(menor, 0) : menor,
    max: includeZero ? Math.max(maior, 0) : maior,
  };
}

/** Une varias series na mesma faixa, para que compartilhem um unico eixo. */
export function mergeDomains(domains: readonly NumericRange[]): NumericRange {
  if (domains.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: min(domains, (faixa) => faixa.min) ?? 0,
    max: max(domains, (faixa) => faixa.max) ?? 0,
  };
}

function guardFlat({ min: menor, max: maior }: NumericRange): [number, number] {
  return menor === maior ? [menor, menor + 1] : [menor, maior];
}

export function linearScale({ clamp = false, domain, nice = true, range }: ContinuousScaleOptions) {
  const escala = scaleLinear().domain(guardFlat(domain)).range(range).clamp(clamp);

  return nice ? escala.nice() : escala;
}

/**
 * Escala logaritmica. Nao existe log de zero ou de negativo, entao o dominio
 * e recortado para o primeiro valor positivo.
 */
export function logScale({ clamp = false, domain, nice = true, range }: ContinuousScaleOptions) {
  const menor = domain.min > 0 ? domain.min : 1;
  const maior = domain.max > menor ? domain.max : menor * 10;
  const escala = scaleLog().domain([menor, maior]).range(range).clamp(clamp);

  return nice ? escala.nice() : escala;
}

export function timeScale({ clamp = false, domain, nice = true, range }: ContinuousScaleOptions) {
  const escala = scaleTime()
    .domain(guardFlat(domain).map((valor) => new Date(valor)))
    .range(range)
    .clamp(clamp);

  return nice ? escala.nice() : escala;
}

/** Faixas de largura igual, uma por categoria. Serve barras. */
export function bandScale({ domain, padding = 0.2, range }: CategoricalScaleOptions) {
  return scaleBand().domain([...domain]).range(range).paddingInner(padding).paddingOuter(padding / 2);
}

/** Pontos sem largura, um por categoria. Serve linhas e dispersao. */
export function pointScale({ domain, padding = 0.5, range }: CategoricalScaleOptions) {
  return scalePoint().domain([...domain]).range(range).padding(padding);
}

/**
 * Raio pela raiz do valor, para que a area da bolha acompanhe o dado em vez do
 * raio. Mapeando o valor direto ao raio, a area cresceria com o quadrado dele e
 * exageraria a diferenca.
 */
export function radiusScale(maxValue: number, range: [number, number]) {
  return scaleSqrt().domain([0, maxValue > 0 ? maxValue : 1]).range(range);
}

/**
 * Marcas de um eixo continuo. Sem contagem informada, o eixo decide pelo
 * espaco que tem, para nao amontoar rotulos em area estreita. Em escala
 * categorica as marcas sao o proprio dominio.
 */
export function ticksFor(scale: { ticks: (count?: number) => number[] }, length: number, count?: number) {
  return scale.ticks(count ?? Math.max(2, Math.min(10, Math.floor(length / 64))));
}
