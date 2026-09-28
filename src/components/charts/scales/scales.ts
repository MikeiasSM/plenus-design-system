import { scaleBand, scaleLinear, scalePoint, scaleSqrt } from 'd3-scale';
import { extent, max, min } from 'd3-array';

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

/**
 * Pilha divergente: positivos sobem do zero e negativos descem dele, cada sinal com o proprio acumulado.
 * Na soma corrida, `+10` e `-5` desenhavam o negativo por cima do positivo.
 */
export function stackDiverging(contributions: readonly number[]): [number, number][] {
  let positivos = 0;
  let negativos = 0;

  return contributions.map((valor) => {
    const parcela = Number.isFinite(valor) ? valor : 0;

    if (parcela < 0) {
      const inicio = negativos;
      negativos += parcela;
      return [inicio, negativos];
    }

    const inicio = positivos;
    positivos += parcela;
    return [inicio, positivos];
  });
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

/** Parte da faixa abaixo do zero; sem amplitude, nao ha o que alinhar. */
function parteNegativa({ min: menor, max: maior }: NumericRange) {
  return maior > menor ? -menor / (maior - menor) : undefined;
}

/** Estende a faixa do lado que falta para o zero ficar na altura pedida, em fracao do eixo. */
function levarZeroA(faixa: NumericRange, parte: number, altura: number): NumericRange {
  if (parte > altura) {
    return { min: faixa.min, max: (-faixa.min * (1 - altura)) / altura };
  }

  if (parte < altura) {
    return { min: (-faixa.max * altura) / (1 - altura), max: faixa.max };
  }

  return faixa;
}

/**
 * Estende dois dominios que contem o zero para que ele caia na mesma altura nos
 * dois eixos. Cada um cresce so do lado que precisa, e a folga sai igual nos dois.
 */
export function alignZeros(a: NumericRange, b: NumericRange): [NumericRange, NumericRange] {
  const parteA = parteNegativa(a);
  const parteB = parteNegativa(b);

  if (parteA === undefined || parteB === undefined) {
    return [a, b];
  }

  const altura = Math.max(parteA, parteB) / (1 + Math.abs(parteA - parteB));

  return [levarZeroA(a, parteA, altura), levarZeroA(b, parteB, altura)];
}

function guardFlat({ min: menor, max: maior }: NumericRange): [number, number] {
  return menor === maior ? [menor, menor + 1] : [menor, maior];
}

export function linearScale({ clamp = false, domain, nice = true, range }: ContinuousScaleOptions) {
  const escala = scaleLinear().domain(guardFlat(domain)).range(range).clamp(clamp);

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
