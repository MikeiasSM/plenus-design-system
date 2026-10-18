import { pointLabelPlacement } from './pointLabels';

const nenhumaOculta = () => false;

describe('posicao do rotulo do ponto', () => {
  it('nas pontas alinha para dentro, para nao cobrir os numeros do eixo', () => {
    const pontos = [[{ x: 0, y: 50 }, { x: 50, y: 40 }, { x: 100, y: 30 }]];

    expect(pointLabelPlacement(pontos, 0, 0, 16, nenhumaOculta)).toMatchObject({ dx: 6, textAnchor: 'start' });
    expect(pointLabelPlacement(pontos, 0, 1, 16, nenhumaOculta)).toMatchObject({ dx: 0, textAnchor: 'middle' });
    expect(pointLabelPlacement(pontos, 0, 2, 16, nenhumaOculta)).toMatchObject({ dx: -6, textAnchor: 'end' });
  });

  it('desce o rotulo da serie de baixo quando ele alcancaria o ponto da de cima, e so ele', () => {
    const pontos = [
      [null, { x: 50, y: 100 }, null],
      [null, { x: 50, y: 80 }, null],
    ];

    expect(pointLabelPlacement(pontos, 0, 1, 16, nenhumaOculta).below).toBe(true);
    expect(pointLabelPlacement(pontos, 1, 1, 16, nenhumaOculta).below).toBe(false);
  });

  it('mantem acima quando as series estao longe, ou quando a outra esta desligada', () => {
    const longe = [[{ x: 0, y: 200 }], [{ x: 0, y: 80 }]];
    const perto = [[{ x: 0, y: 100 }], [{ x: 0, y: 90 }]];

    expect(pointLabelPlacement(longe, 0, 0, 16, nenhumaOculta).below).toBe(false);
    expect(pointLabelPlacement(perto, 0, 0, 16, (serie) => serie === 1).below).toBe(false);
  });
});
