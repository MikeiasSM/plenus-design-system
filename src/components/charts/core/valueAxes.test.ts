import { domainOf, mergeDomains } from '../scales';
import { rightAxisVisibility, stackByAxis, valueAxisDomains, type ChartValueAxis } from './valueAxes';

const series = [
  { label: 'Faturamento', values: [600, 1000] },
  { label: 'Conversão', values: [6, 10] },
];

function dominios(eixos: ChartValueAxis[], oculta: (label: string) => boolean = () => false) {
  return valueAxisDomains({
    axes: eixos,
    domainOfSeries: (grupo) => mergeDomains(grupo.map((serie) => domainOf([...serie.values]))),
    isOutOfScale: oculta,
    series,
  });
}

describe('valueAxisDomains', () => {
  it('forma o domínio de cada eixo só pelas séries dele', () => {
    expect(dominios(['left', 'right'])).toEqual([
      { max: 1000, min: 0 },
      { max: 10, min: 0 },
    ]);
  });

  it('espelha o domínio da esquerda quando nenhuma série está à direita', () => {
    const [esquerda, direita] = dominios(['left', 'left']);

    expect(esquerda).toEqual({ max: 1000, min: 0 });
    expect(direita).toBe(esquerda);
  });

  it('mantém a escala da série desligada enquanto o eixo não tem outra visível', () => {
    expect(dominios(['left', 'right'], (label) => label === 'Conversão')[1]).toEqual({ max: 10, min: 0 });
  });
});

describe('stackByAxis', () => {
  it('empilha cada eixo à parte e devolve os segmentos na ordem das séries', () => {
    expect(stackByAxis([600, 6, 400, 4], ['left', 'right', 'left', 'right'])).toEqual([
      [0, 600],
      [0, 6],
      [600, 1000],
      [6, 10],
    ]);
  });
});

describe('visibilidade do eixo direito', () => {
  it('sem escolha do produto, segue o eixo esquerdo quando ha serie a direita', () => {
    expect(rightAxisVisibility(undefined, true, 'onHover')).toBe('onHover');
    expect(rightAxisVisibility(undefined, true, 'visible')).toBe('visible');
  });

  it('sem serie a direita, nao aparece; a escolha do produto vale sempre', () => {
    expect(rightAxisVisibility(undefined, false, 'visible')).toBe('hidden');
    expect(rightAxisVisibility('visible', true, 'onHover')).toBe('visible');
  });
});
