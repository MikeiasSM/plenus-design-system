import { render } from '@testing-library/react';
import { Axis, type AxisTick } from './Axis';
import { Grid } from './Grid';

const marcas: AxisTick[] = [
  { label: '0', position: 0 },
  { label: '50', position: 120 },
  { label: '100', position: 240 },
];

function desenhar(no: React.ReactNode) {
  const { container } = render(<svg>{no}</svg>);
  return container.querySelector('svg') as SVGSVGElement;
}

describe('Axis', () => {
  it('desenha uma marca por valor, com o rotulo recebido', () => {
    const svg = desenhar(<Axis length={240} orientation="bottom" ticks={marcas} />);
    const rotulos = [...svg.querySelectorAll('text')].map((no) => no.textContent);

    expect(rotulos).toEqual(['0', '50', '100']);
  });

  it('posiciona as marcas ao longo do eixo de baixo', () => {
    const svg = desenhar(<Axis length={240} orientation="bottom" ticks={marcas} />);
    const textos = svg.querySelectorAll('text');

    expect(textos[0]).toHaveAttribute('x', '0');
    expect(textos[2]).toHaveAttribute('x', '240');
  });

  it('afasta e alinha os rotulos do eixo da esquerda', () => {
    const svg = desenhar(<Axis length={240} orientation="left" ticks={marcas} />);
    const texto = svg.querySelector('text');

    expect(texto).toHaveAttribute('text-anchor', 'end');
    expect(texto).toHaveAttribute('y', '0');
  });

  it('gira os rotulos quando pedido, ancorando ao fim', () => {
    const svg = desenhar(<Axis labelRotation={45} length={240} orientation="bottom" ticks={marcas} />);
    const texto = svg.querySelectorAll('text')[1];

    expect(texto).toHaveAttribute('transform', 'rotate(-45 120 8)');
    expect(texto).toHaveAttribute('text-anchor', 'end');
  });

  it('dispensa a linha do eixo quando a grade ja a fornece', () => {
    const comLinha = desenhar(<Axis length={240} orientation="left" ticks={marcas} />);
    const semLinha = desenhar(<Axis hideLine length={240} orientation="left" ticks={marcas} />);

    expect(comLinha.querySelectorAll('line')).toHaveLength(1);
    expect(semLinha.querySelectorAll('line')).toHaveLength(0);
  });

  it('fica fora da arvore de acessibilidade, que a tabela alternativa atende', () => {
    const svg = desenhar(<Axis length={240} orientation="bottom" ticks={marcas} />);

    expect(svg.querySelector('g')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Grid', () => {
  it('desenha uma linha por marca, no comprimento informado', () => {
    const svg = desenhar(<Grid length={400} lines={[0, 60, 120]} orientation="horizontal" />);
    const linhas = svg.querySelectorAll('line');

    expect(linhas).toHaveLength(3);
    expect(linhas[1]).toHaveAttribute('y1', '60');
    expect(linhas[1]).toHaveAttribute('x2', '400');
  });

  it('vira as linhas no sentido vertical', () => {
    const svg = desenhar(<Grid length={300} lines={[40]} orientation="vertical" />);
    const linha = svg.querySelector('line');

    expect(linha).toHaveAttribute('x1', '40');
    expect(linha).toHaveAttribute('y2', '300');
  });

  it('destaca a linha da base, que separa positivos de negativos', () => {
    const svg = desenhar(<Grid baseline={120} length={400} lines={[0, 60, 120]} orientation="horizontal" />);
    const linhas = [...svg.querySelectorAll('line')];

    expect(linhas[2].getAttribute('class')).toContain('gridBaseline');
    expect(linhas[0].getAttribute('class')).toContain('gridLine');
  });
});
