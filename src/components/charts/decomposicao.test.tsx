import { render, screen } from '@testing-library/react';
import { ChartBar } from './ChartBar';
import { ChartDonut } from './ChartDonut';
import { ChartGauge } from './ChartGauge';
import { ChartPie } from './ChartPie';
import { ChartSankey } from './ChartSankey';

function fixarTamanho(largura: number, altura = 260) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: altura });
}

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
});

const textos = () => [...document.querySelectorAll('svg text')].map((no) => no.textContent);

const categorias = ['jan', 'fev', 'mar'];
const series = [
  { label: 'Receita', values: [10, 20, 30] },
  { label: 'Custo', values: [5, 15, 25] },
];

/** O que o `ChartBar` ainda mostra, na ordem em que as partes saem. */
function partesDoBar(largura: number) {
  fixarTamanho(largura);
  const { unmount } = render(
    <ChartBar categories={categorias} legend="right" series={series} title="Receita" xAxisTitle="Mês" yAxisTitle="Valor" />,
  );
  const partes = {
    legenda: screen.queryByRole('button', { name: /Receita/ }) !== null,
    titulos: textos().includes('Mês') && textos().includes('Valor'),
    rotulosDeValor: textos().includes('20'),
    eixoDeCategorias: textos().includes('jan'),
  };
  const marcas = document.querySelectorAll('path[aria-label]').length;

  unmount();

  return { marcas, partes };
}

describe('decomposição por encaixe', () => {
  it('com espaço, o gráfico traz todas as partes', () => {
    expect(partesDoBar(640).partes).toEqual({ eixoDeCategorias: true, legenda: true, rotulosDeValor: true, titulos: true });
  });

  it('sem espaço, as partes saem na ordem da família e nunca fora dela', () => {
    const ordem = ['legenda', 'titulos', 'rotulosDeValor', 'eixoDeCategorias'] as const;
    const larguras = [640, 340, 300, 270, 240, 210, 180, 150, 120, 90, 60];
    const medidas = larguras.map((largura) => partesDoBar(largura).partes);

    medidas.forEach((partes) => {
      ordem.forEach((parte, indice) => {
        if (!partes[parte]) {
          expect(ordem.slice(0, indice).every((anterior) => !partes[anterior])).toBe(true);
        }
      });
    });
    expect(medidas.some((partes) => !partes.legenda && partes.eixoDeCategorias)).toBe(true);
    expect(medidas.at(-1)).toMatchObject({ legenda: false, rotulosDeValor: false, titulos: false });
  });

  it('a leitura continua pelo aria-label de cada marca, mesmo sem nada em volta', () => {
    const { marcas, partes } = partesDoBar(60);

    expect(partes.legenda).toBe(false);
    expect(marcas).toBe(6);
  });

  it('a pizza perde a legenda e guarda a forma', () => {
    fixarTamanho(640);
    const { unmount } = render(<ChartPie legend="right" slices={[{ label: 'Alfa', value: 1 }, { label: 'Beta', value: 2 }]} title="Receita" />);
    expect(screen.getByRole('button', { name: /Alfa/ })).toBeInTheDocument();
    unmount();

    fixarTamanho(100);
    render(<ChartPie legend="right" slices={[{ label: 'Alfa', value: 1 }, { label: 'Beta', value: 2 }]} title="Receita" />);

    expect(screen.queryByRole('button', { name: /Alfa/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Alfa:/)).toBeInTheDocument();
  });

  it('o anel perde o texto do centro quando o furo não o comporta, depois da legenda', () => {
    const fatias = [{ label: 'Alfa', value: 1234567 }, { label: 'Beta', value: 2 }];
    fixarTamanho(640);
    const { unmount } = render(<ChartDonut legend="right" slices={fatias} title="Receita" />);
    expect(textos()).toContain('1.234.569');
    unmount();

    fixarTamanho(110);
    render(<ChartDonut legend="right" slices={fatias} title="Receita" />);

    expect(textos()).not.toContain('1.234.569');
    expect(screen.queryByRole('button', { name: /Alfa/ })).not.toBeInTheDocument();
  });

  it('o medidor perde as marcas e os rótulos da escala e fica com o arco e o valor', () => {
    const medidor = <ChartGauge max={100} min={0} title="Meta" value={64} />;
    fixarTamanho(640, 220);
    const { unmount } = render(medidor);
    const comEscala = textos().length;
    unmount();

    fixarTamanho(80, 80);
    render(medidor);

    expect(textos().length).toBeLessThan(comEscala);
    expect(textos().join(' ')).toContain('64');
  });

  it('o fluxo perde os rótulos dos nós e guarda as formas', () => {
    const fluxo = <ChartSankey flows={[{ source: 'Receita', target: 'Resultado', value: 5 }]} title="Fluxo" />;
    fixarTamanho(640);
    const { unmount } = render(fluxo);
    expect(textos()).toContain('Receita');
    unmount();

    fixarTamanho(100);
    render(fluxo);

    expect(textos()).not.toContain('Receita');
    expect(document.querySelectorAll('path[aria-label]').length).toBeGreaterThan(0);
  });
});
