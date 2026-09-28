import {
  alignZeros,
  bandScale,
  domainOf,
  linearScale,
  mergeDomains,
  pointScale,
  radiusScale,
  stackDiverging,
  ticksFor,
  type NumericRange,
} from './scales';

describe('dominio', () => {
  it('inclui o zero por padrao, para a barra nao exagerar a diferenca', () => {
    expect(domainOf([120, 140, 160])).toEqual({ min: 0, max: 160 });
  });

  it('dispensa o zero quando pedido', () => {
    expect(domainOf([120, 140, 160], { includeZero: false })).toEqual({ min: 120, max: 160 });
  });

  it('acomoda valores negativos nos dois lados', () => {
    expect(domainOf([-50, 30])).toEqual({ min: -50, max: 30 });
  });

  it('ignora valores nao finitos e colecao vazia', () => {
    expect(domainOf([10, Number.NaN, Number.POSITIVE_INFINITY])).toEqual({ min: 0, max: 10 });
    expect(domainOf([])).toEqual({ min: 0, max: 0 });
  });

  it('une series para que compartilhem um unico eixo', () => {
    expect(mergeDomains([domainOf([10, 40]), domainOf([-5, 90])])).toEqual({ min: -5, max: 90 });
  });
});

describe('zeros alinhados', () => {
  const alturaDoZero = (faixa: NumericRange) => -faixa.min / (faixa.max - faixa.min);

  it('leva o zero a mesma altura nos dois eixos, crescendo cada um so do lado que precisa', () => {
    const [esquerda, direita] = alignZeros({ min: -50, max: 100 }, { min: 0, max: 40 });

    expect(alturaDoZero(esquerda)).toBeCloseTo(alturaDoZero(direita));
    expect(esquerda.min).toBe(-50);
    expect(direita.max).toBe(40);
  });

  it('poe o zero no meio quando um eixo e todo negativo e o outro todo positivo', () => {
    expect(alignZeros({ min: -10, max: 0 }, { min: 0, max: 40 })).toEqual([
      { min: -10, max: 10 },
      { min: -40, max: 40 },
    ]);
  });

  it('mantem os dominios que ja tem o zero na mesma altura', () => {
    expect(alignZeros({ min: 0, max: 1000 }, { min: 0, max: 10 })).toEqual([
      { min: 0, max: 1000 },
      { min: 0, max: 10 },
    ]);
  });
});

describe('pilha divergente', () => {
  it('sobe os positivos e desce os negativos, cada sinal a partir do zero', () => {
    expect(stackDiverging([10, -5, 3, -2])).toEqual([
      [0, 10],
      [0, -5],
      [10, 13],
      [-5, -7],
    ]);
  });

  it('nao empilha o invalido', () => {
    expect(stackDiverging([10, NaN, 5])).toEqual([
      [0, 10],
      [10, 10],
      [10, 15],
    ]);
  });
});

describe('escala linear', () => {
  it('mapeia o dominio na faixa de pixels', () => {
    const escala = linearScale({ domain: { min: 0, max: 100 }, range: [0, 200], nice: false });

    expect(escala(0)).toBe(0);
    expect(escala(50)).toBe(100);
    expect(escala(100)).toBe(200);
  });

  it('arredonda os limites quando pedido', () => {
    const escala = linearScale({ domain: { min: 0, max: 97 }, range: [0, 100] });

    expect(escala.domain()[1]).toBe(100);
  });

  it('nao colapsa quando todos os valores sao iguais', () => {
    const escala = linearScale({ domain: { min: 5, max: 5 }, range: [0, 100], nice: false });

    expect(escala(5)).toBe(0);
    expect(Number.isFinite(escala(6))).toBe(true);
  });

  it('prende o valor a faixa quando pedido', () => {
    const escala = linearScale({ domain: { min: 0, max: 10 }, range: [0, 100], clamp: true, nice: false });

    expect(escala(20)).toBe(100);
  });
});

describe('escalas categoricas', () => {
  it('reparte a faixa em bandas de largura igual', () => {
    const escala = bandScale({ domain: ['a', 'b', 'c'], range: [0, 300], padding: 0 });

    expect(escala.bandwidth()).toBe(100);
    expect(escala('a')).toBe(0);
    expect(escala('c')).toBe(200);
  });

  it('separa as bandas conforme o espacamento', () => {
    const escala = bandScale({ domain: ['a', 'b'], range: [0, 100], padding: 0.5 });

    expect(escala.bandwidth()).toBeLessThan(50);
  });

  it('posiciona pontos sem largura, para linhas', () => {
    const escala = pointScale({ domain: ['a', 'b', 'c'], range: [0, 200], padding: 0 });

    expect(escala('a')).toBe(0);
    expect(escala('c')).toBe(200);
  });
});

describe('escala de raio', () => {
  it('parte do zero, para que valor nulo nao desenhe bolha alguma', () => {
    const escala = radiusScale(100, [0, 20]);

    expect(escala(0)).toBe(0);
    expect(escala(100)).toBe(20);
  });

  it('cresce pela raiz, para a area acompanhar o dado e nao o raio', () => {
    const escala = radiusScale(100, [0, 20]);

    expect(escala(25)).toBe(10);
  });

  it('nao divide por zero quando nenhum ponto tem valor', () => {
    expect(radiusScale(0, [4, 18])(0)).toBe(4);
  });
});

describe('marcas do eixo', () => {
  it('decide a quantidade pelo espaco disponivel', () => {
    const escala = linearScale({ domain: { min: 0, max: 100 }, range: [0, 640] });

    expect(ticksFor(escala, 640).length).toBeGreaterThan(ticksFor(escala, 120).length);
  });

  it('respeita a contagem informada', () => {
    const escala = linearScale({ domain: { min: 0, max: 100 }, range: [0, 640] });

    expect(ticksFor(escala, 640, 3).length).toBeLessThanOrEqual(4);
  });

  it('em escala categorica as marcas sao o proprio dominio', () => {
    expect(bandScale({ domain: ['a', 'b'], range: [0, 10] }).domain()).toEqual(['a', 'b']);
  });
});
