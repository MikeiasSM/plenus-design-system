import { buildMapScale, classThresholds, rampColor, rampFrom, SEQUENTIAL_TOKENS } from './mapScales';

const format = (value: number) => String(value);
const datum = (value: number | null, category: string | null = null) => ({ category, value });

describe('escalas do mapa', () => {
  it('pinta a sequencial do primeiro ao ultimo token, e mistura os vizinhos entre eles', () => {
    const scale = buildMapScale({ type: 'sequential' }, [0, 50, 100], format);

    expect(scale.fillOf(datum(0))).toBe('var(--pl-chart-sequential-1)');
    expect(scale.fillOf(datum(100))).toBe('var(--pl-chart-sequential-7)');
    expect(scale.fillOf(datum(50))).toBe('var(--pl-chart-sequential-4)');
    expect(scale.fillOf(datum(25))).toBe(
      'color-mix(in oklab, var(--pl-chart-sequential-3) 50%, var(--pl-chart-sequential-2))',
    );
    expect(scale.fillOf(datum(null))).toBeUndefined();
    expect(scale.gradient?.ticks.map((tick) => tick.value)).toEqual([0, 100]);
  });

  it('na logaritmica, distribui a cor pela ordem de grandeza', () => {
    const scale = buildMapScale({ log: true, type: 'sequential' }, [1, 10, 100], format);

    expect(scale.gradient?.position(10)).toBeCloseTo(0.5);
    expect(scale.gradient?.log).toBe(true);
    expect(scale.gradient?.position(0)).toBe(0);
  });

  it('na divergente, o centro e o meio e o dominio e simetrico', () => {
    const scale = buildMapScale({ center: 0, type: 'diverging' }, [-5, 20], format);

    expect(scale.fillOf(datum(0))).toBe('var(--pl-chart-diverging-center)');
    expect(scale.fillOf(datum(20))).toBe('var(--pl-chart-diverging-positive-3)');
    expect(scale.gradient?.position(-20)).toBe(0);
    expect(scale.gradient?.ticks.map((tick) => tick.value)).toEqual([-20, 0, 20]);
  });

  it('nas classes por limites fixos, rotula cada faixa e a acha pelo valor', () => {
    const scale = buildMapScale({ thresholds: [20, 40, 60, 80], type: 'classes' }, [10, 50, 90], format);

    expect(scale.entries.map((entry) => entry.label)).toEqual([
      'Menos de 20',
      '20 a 40',
      '40 a 60',
      '60 a 80',
      '80 ou mais',
    ]);
    expect(scale.keyOf(datum(50))).toBe('2');
    expect(scale.labelOf(datum(90))).toBe('80 ou mais');
    expect(scale.entries[0].color).toBe(SEQUENTIAL_TOKENS[0]);
    expect(scale.entries[4].color).toBe(SEQUENTIAL_TOKENS[6]);
  });

  it('por quantis ou intervalos iguais, as faixas diminuem com poucos valores distintos', () => {
    expect(classThresholds('quantile', [1, 1, 1, 5, 5, 9], 7)).toEqual([5]);
    expect(classThresholds('equalInterval', [0, 100], 4)).toEqual([50]);
    expect(classThresholds('equalInterval', [0, 25, 50, 75, 100], 4)).toEqual([25, 50, 75]);
    // O limite no menor valor deixaria a primeira faixa vazia.
    expect(classThresholds('quantile', [0, 0, 0, 0, 10], 5).every((cut) => cut > 0)).toBe(true);
  });

  it('com um valor so, uma cor e uma entrada', () => {
    const scale = buildMapScale({ method: 'quantile', type: 'classes' }, [7, 7, 7], format);

    expect(scale.entries).toEqual([{ color: SEQUENTIAL_TOKENS[4], key: '0', label: '7' }]);
    expect(buildMapScale({ type: 'sequential' }, [7], format).entries).toHaveLength(1);
  });

  it('sem valor algum, tudo fica sem dado e a legenda nao inventa faixa', () => {
    const scale = buildMapScale({ method: 'quantile', type: 'classes' }, [], format);

    expect(scale.entries).toEqual([]);
    expect(scale.fillOf(datum(3))).toBeUndefined();
  });

  it('na categorica, a cor sai da categoria e a regiao sem ela fica sem dado', () => {
    const scale = buildMapScale(
      { categories: [{ id: 'n', label: 'Norte' }, { id: 's', label: 'Sul', intent: 'positive' }], type: 'categorical' },
      [],
      format,
    );

    expect(scale.fillOf(datum(null, 'n'))).toBe('var(--pl-chart-series-1)');
    expect(scale.fillOf(datum(null, 's'))).toBe('var(--pl-chart-positive)');
    expect(scale.fillOf(datum(null, 'x'))).toBeUndefined();
    expect(scale.numeric).toBe(false);
  });

  it('troca o azul pela cor informada, do mais claro ao mais escuro', () => {
    const ramp = rampFrom('#6E2A92');
    const classes = buildMapScale({ color: '#6E2A92', method: 'equalInterval', type: 'classes' }, [0, 25, 50, 75, 100], format);

    expect(ramp).toHaveLength(7);
    expect(ramp[4]).toBe('#6E2A92');
    expect(classes.entries.map((entry) => entry.color)).toEqual([ramp[0], ramp[2], ramp[3], ramp[5], ramp[6]]);
    expect(buildMapScale({ color: '#6E2A92', type: 'sequential' }, [0, 100], format).gradient?.stops).toEqual(ramp);
  });

  it('abre as categorias com a cor de tema', () => {
    const scale = buildMapScale({ categories: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], type: 'categorical' }, [], format, '#6E2A92');

    expect(scale.entries.map((entry) => entry.color)).toEqual(['#6E2A92', 'var(--pl-chart-series-1)']);
  });

  it('mistura sem ultrapassar as pontas da rampa', () => {
    expect(rampColor(['a', 'b', 'c'], -1)).toBe('a');
    expect(rampColor(['a', 'b', 'c'], 2)).toBe('c');
    expect(rampColor(['a', 'b', 'c'], 0.75)).toBe('color-mix(in oklab, c 50%, b)');
  });
});
