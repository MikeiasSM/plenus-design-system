import { fireEvent, render, screen } from '@testing-library/react';
import { ChartRadial, type ChartRadialTrack } from './ChartRadial';

const metas: ChartRadialTrack[] = [
  { label: 'Vendas', max: 100, value: 72 },
  { label: 'Serviços', max: 100, value: 45 },
];

function fixarTamanho(largura = 320, altura = 280) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: altura });
}

function pistas() {
  return [...document.querySelectorAll('path')].filter((no) =>
    no.getAttribute('class')?.includes('track'),
  );
}

function arcos() {
  return [...document.querySelectorAll('path')].filter((no) =>
    no.getAttribute('class')?.includes('fill'),
  );
}

describe('ChartRadial', () => {
  beforeEach(() => fixarTamanho());
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartRadial title="Metas do trimestre" tracks={metas} />);

    expect(screen.getByRole('img', { name: 'Metas do trimestre' })).toBeInTheDocument();
  });

  it('desenha uma pista de fundo e um arco de preenchimento por anel', () => {
    render(<ChartRadial title="Metas" tracks={metas} />);

    expect(pistas()).toHaveLength(2);
    expect(arcos()).toHaveLength(2);
  });

  it('mede o arco contra a meta do anel, e nao contra o maior valor', () => {
    const { rerender } = render(
      <ChartRadial title="Metas" tracks={[{ label: 'Vendas', max: 100, value: 50 }]} />,
    );
    const metade = arcos()[0].getAttribute('d');

    rerender(<ChartRadial title="Metas" tracks={[{ label: 'Vendas', max: 200, value: 50 }]} />);

    expect(arcos()[0].getAttribute('d')).not.toBe(metade);
  });

  it('exibe o valor do primeiro anel no centro, com o rotulo abaixo', () => {
    render(<ChartRadial formatValue={(valor) => `${valor}%`} title="Metas" tracks={metas} />);
    const centro = [...document.querySelectorAll('text')].map((no) => no.textContent);

    expect(centro).toEqual(['72%', 'Vendas']);
  });

  it('mostra a legenda a partir de dois aneis', () => {
    const { rerender } = render(<ChartRadial title="Metas" tracks={metas} />);
    expect(screen.getByRole('button', { name: /Serviços/ })).toBeInTheDocument();

    rerender(<ChartRadial title="Metas" tracks={[metas[0]]} />);
    expect(screen.queryByRole('button', { name: /Vendas/ })).not.toBeInTheDocument();
  });

  it('desliga o anel pela legenda, esvaziando o arco e mantendo a pista', () => {
    render(<ChartRadial title="Metas" tracks={metas} />);

    fireEvent.click(screen.getByRole('button', { name: /Serviços/ }));

    expect(pistas()).toHaveLength(2);
    expect(arcos()).toHaveLength(1);
  });

  it('anuncia a ausencia de dados em vez de desenhar aneis vazios', () => {
    render(<ChartRadial title="Metas" tracks={[]} />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
  });
});
