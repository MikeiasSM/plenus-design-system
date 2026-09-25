import { bottomLabelRotation, cartesianLayout, chartHeight, valueLabelsFor } from './cartesianLayout';
import { labelFontOf } from './measureText';

const fonte = labelFontOf(null);

function layout(parcial: Partial<Parameters<typeof cartesianLayout>[0]> = {}) {
  return cartesianLayout({
    bottomLabels: ['jan', 'fev', 'mar'],
    font: fonte,
    height: 260,
    labelAngle: 0,
    leftLabels: ['0', '50', '100'],
    rightLabels: ['0', '50', '100'],
    topRoom: 0,
    width: 600,
    xAxis: 'visible',
    yAxis: 'visible',
    yAxisRight: 'hidden',
    ...parcial,
  });
}

describe('calhas do eixo', () => {
  it('reserva a esquerda conforme o rotulo mais largo, e nao uma constante', () => {
    const curto = layout({ leftLabels: ['1', '2'] });
    const longo = layout({ leftLabels: ['1', 'R$ 1.480.900,00'] });

    expect(longo.margins.left).toBeGreaterThan(curto.margins.left);
    expect(longo.plot.width).toBeLessThan(curto.plot.width);
  });

  it('devolve a area ao desenho quando o eixo e desabilitado', () => {
    const comEixo = layout({ leftLabels: ['R$ 1.480.900,00'] });
    const semEixo = layout({ leftLabels: ['R$ 1.480.900,00'], yAxis: 'hidden' });

    expect(semEixo.plot.width).toBeGreaterThan(comEixo.plot.width);
  });

  it('mantem a calha no modo dinamico, para o desenho nao se mexer sob o ponteiro', () => {
    const fixo = layout({ leftLabels: ['R$ 1.480.900,00'] });
    const dinamico = layout({ leftLabels: ['R$ 1.480.900,00'], yAxis: 'onHover' });

    expect(dinamico.margins.left).toBe(fixo.margins.left);
    expect(dinamico.plot.width).toBe(fixo.plot.width);
  });

  it('abre calha a direita somente quando o eixo da direita aparece', () => {
    const semDireita = layout();
    const comDireita = layout({ yAxisRight: 'visible', rightLabels: ['R$ 1.480.900,00'] });

    expect(comDireita.margins.right).toBeGreaterThan(semDireita.margins.right);
  });

  it('reserva o topo pedido pelos rotulos de valor', () => {
    expect(layout({ topRoom: 40 }).margins.top).toBe(40);
  });
});

describe('angulo dos rotulos de baixo', () => {
  it('mantem os rotulos deitados quando eles cabem no passo', () => {
    expect(bottomLabelRotation(['jan', 'fev'], fonte, 80)).toBe(0);
  });

  it('gira a 45 graus quando nao cabem deitados mas a diagonal ainda separa', () => {
    expect(bottomLabelRotation(['Janeiro de 2026'], fonte, 50)).toBe(45);
  });

  it('gira a 90 graus quando nem a diagonal separa duas linhas de base', () => {
    expect(bottomLabelRotation(['Janeiro de 2026'], fonte, 14)).toBe(90);
  });

  it('nao gira sem rotulos nem sem espaco medido', () => {
    expect(bottomLabelRotation([], fonte, 40)).toBe(0);
    expect(bottomLabelRotation(['Janeiro'], fonte, 0)).toBe(0);
  });

  it('calcula o angulo sozinho, e respeita o que o consumidor impuser', () => {
    const muitasCategorias = Array.from({ length: 40 }, (_, indice) => `Categoria ${indice}`);

    expect(layout({ bottomLabels: muitasCategorias, labelAngle: 'auto' }).rotation).toBe(90);
    expect(layout({ bottomLabels: muitasCategorias, labelAngle: 0 }).rotation).toBe(0);
  });

  it('reserva embaixo a caixa do texto ja girado', () => {
    const rotulos = ['Janeiro de 2026', 'Fevereiro de 2026'];
    const deitado = layout({ bottomLabels: rotulos, labelAngle: 0 });
    const inclinado = layout({ bottomLabels: rotulos, labelAngle: 45 });
    const empe = layout({ bottomLabels: rotulos, labelAngle: 90 });

    expect(inclinado.margins.bottom).toBeGreaterThan(deitado.margins.bottom);
    expect(empe.margins.bottom).toBeGreaterThan(inclinado.margins.bottom);
  });

  it('dispensa a faixa de baixo quando o eixo x e desabilitado', () => {
    expect(layout({ xAxis: 'hidden' }).margins.bottom).toBe(0);
  });
});

describe('altura do desenho', () => {
  it('usa o numero declarado, ignorando a medida do contêiner', () => {
    expect(chartHeight(260, 400)).toEqual({ fillHeight: false, value: 260 });
  });

  it('assume a altura do contêiner quando o consumidor entrega a decisao a ele', () => {
    expect(chartHeight('fill', 400)).toEqual({ fillHeight: true, value: 400 });
  });
});

describe('rotulos de medida', () => {
  it('formata as marcas do dominio com o formatador do consumidor', () => {
    const rotulos = valueLabelsFor({ min: 0, max: 100 }, 260, (valor) => `${valor}%`);

    expect(rotulos[0]).toBe('0%');
    expect(rotulos.at(-1)).toBe('100%');
  });
});
