import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Card } from '../../data-display/Card';
import { CardMetric } from '../../data-display/CardMetric';
import { Sparkline } from './Sparkline';
import { sparklineName, sparklineTrend } from './sparklineTrend';

const vendas = [18200, 18900, 19400, 19100, 20400];

/** A forma compacta do Intl separa o numero de "mil" por um espaco nao separavel. */
const comEspaco = (texto: string) => texto.replace(/ /g, ' ');
const nomeado = (esperado: string) => (nome: string) => comEspaco(nome) === esperado;

describe('sparklineTrend', () => {
  it('mede do primeiro ao ultimo valor valido', () => {
    expect(sparklineTrend([Number.NaN, 100, 140, 112, Number.POSITIVE_INFINITY])).toEqual({
      direction: 'up',
      first: 100,
      last: 112,
      ratio: 0.12,
    });
  });

  it('chama de estavel a variacao que arredonda para 0%', () => {
    expect(sparklineTrend([1000, 1004])?.direction).toBe('stable');
    expect(sparklineTrend([1000, 980])?.direction).toBe('down');
  });

  it('sem primeiro valor diferente de zero, decide pelo sinal e fica sem variacao relativa', () => {
    expect(sparklineTrend([0, 5])).toEqual({ direction: 'up', first: 0, last: 5, ratio: undefined });
    expect(sparklineTrend([0, 0])?.direction).toBe('stable');
  });

  it('sem valor valido, nao ha tendencia', () => {
    expect(sparklineTrend([])).toBeUndefined();
    expect(sparklineTrend([Number.NaN])).toBeUndefined();
  });
});

describe('sparklineName', () => {
  it('compoe o rotulo, a tendencia e a faixa, com os valores compactos da localidade', () => {
    expect(comEspaco(sparklineName([18200, 20400], { label: 'Vendas nos últimos 30 dias' }))).toBe(
      'Vendas nos últimos 30 dias: sobe 12%, de 18,2 mil a 20,4 mil',
    );
  });

  it('diz que cai, com a variacao sem sinal', () => {
    expect(sparklineName([640, 560], { label: 'Pedidos' })).toBe('Pedidos: cai 13%, de 640 a 560');
  });

  it('diz estavel sem porcentagem', () => {
    expect(comEspaco(sparklineName([1000, 1002]))).toBe('estável, de 1 mil a 1 mil');
  });

  it('sem variacao relativa, fica so a direcao', () => {
    expect(sparklineName([0, 5], { label: 'Chamados' })).toBe('Chamados: sobe, de 0 a 5');
  });

  it('com um valor so, o nome traz o valor', () => {
    expect(sparklineName([42], { label: 'Pedidos' })).toBe('Pedidos: 42');
  });

  it('sem dados, avisa', () => {
    expect(sparklineName([], { label: 'Pedidos' })).toBe('Pedidos: sem dados');
  });

  it('aceita o formato do Intl, a localidade e os textos', () => {
    expect(
      sparklineName([1200, 1500], {
        format: { currency: 'USD', maximumFractionDigits: 0, style: 'currency' },
        label: 'Sales',
        labels: { range: (first, last) => `from ${first} to ${last}`, up: 'up' },
        locale: 'en-US',
      }),
    ).toBe('Sales: up 25%, from $1,200 to $1,500');
  });
});

describe('Sparkline', () => {
  it('e uma imagem nomeada pelo rotulo e pela tendencia', () => {
    render(<Sparkline data={vendas} label="Vendas nos últimos 30 dias" />);

    expect(screen.getByRole('img', { name: nomeado('Vendas nos últimos 30 dias: sobe 12%, de 18,2 mil a 20,4 mil') })).toBeInTheDocument();
  });

  it('o aria-label informado vence o nome calculado', () => {
    render(<Sparkline aria-label="Tendência das vendas" data={vendas} />);

    expect(screen.getByRole('img', { name: 'Tendência das vendas' })).toBeInTheDocument();
  });

  it('nao tem leitura ponto a ponto: nenhum filho com nome ou foco', () => {
    const { container } = render(<Sparkline data={vendas} label="Vendas" />);

    expect(container.querySelectorAll('[aria-label]')).toHaveLength(1);
    expect(container.querySelectorAll('[tabindex], title, text')).toHaveLength(0);
  });

  it('tem 24px de altura e a largura do conteiner por padrao', () => {
    render(<Sparkline data={vendas} label="Vendas" />);
    const imagem = screen.getByRole('img');

    expect(imagem).toHaveAttribute('height', '24');
    expect(imagem).toHaveStyle({ width: '100%' });
    expect(imagem).toHaveAttribute('viewBox', '0 0 100 24');
    expect(imagem).toHaveAttribute('preserveAspectRatio', 'none');
  });

  it('aceita altura e largura', () => {
    render(<Sparkline data={vendas} height={32} label="Vendas" width={96} />);
    const imagem = screen.getByRole('img');

    expect(imagem).toHaveAttribute('height', '32');
    expect(imagem).toHaveStyle({ width: '96px' });
  });

  it('desenha a linha e marca o ultimo ponto, sem esticar o traco', () => {
    const { container } = render(<Sparkline data={vendas} label="Vendas" />);
    const caminhos = container.querySelectorAll('path');

    expect(caminhos).toHaveLength(2);
    expect(caminhos[0].getAttribute('d')?.match(/[ML]/g)).toHaveLength(vendas.length);
    caminhos.forEach((caminho) => expect(caminho).toHaveAttribute('vector-effect', 'non-scaling-stroke'));
    // O ultimo ponto fica na ponta direita e no alto, porque e o maior valor.
    expect(caminhos[1]).toHaveAttribute('d', 'M100,2.5L100,2.5');
  });

  it('abre um vao na linha onde o valor nao e numero, e o ultimo ponto e o ultimo valido', () => {
    const { container } = render(<Sparkline data={[1, 2, Number.NaN, 3, 4, Number.NaN]} label="Vendas" />);
    const [linha, ponto] = container.querySelectorAll('path');

    expect(linha.getAttribute('d')?.match(/M/g)).toHaveLength(2);
    expect(ponto.getAttribute('d')).toBe('M80,2.5L80,2.5');
  });

  it('uma serie constante fica no meio da altura', () => {
    const { container } = render(<Sparkline data={[5, 5, 5]} label="Vendas" />);

    expect(container.querySelectorAll('path')[1]).toHaveAttribute('d', 'M100,12L100,12');
  });

  it('em barras, uma por valor valido, partindo do zero', () => {
    const { container } = render(<Sparkline data={[10, 20, Number.NaN, 40]} label="Pedidos" variant="bar" />);
    const barras = [...container.querySelectorAll('rect')];

    expect(barras).toHaveLength(3);
    expect(container.querySelectorAll('path')).toHaveLength(0);
    barras.forEach((barra) => expect(Number(barra.getAttribute('y')) + Number(barra.getAttribute('height'))).toBeCloseTo(24));
    expect(Number(barras[2].getAttribute('height'))).toBeCloseTo(24);
    expect(Number(barras[0].getAttribute('height'))).toBeCloseTo(6);
  });

  it('em barras, o negativo desce do zero', () => {
    const { container } = render(<Sparkline data={[10, -10]} variant="bar" />);
    const [positiva, negativa] = [...container.querySelectorAll('rect')];

    expect(Number(positiva.getAttribute('y')) + Number(positiva.getAttribute('height'))).toBeCloseTo(12);
    expect(Number(negativa.getAttribute('y'))).toBeCloseTo(12);
  });

  it('sem dados, continua uma imagem nomeada e nao desenha nada', () => {
    const { container } = render(<Sparkline data={[]} label="Vendas" />);

    expect(screen.getByRole('img', { name: 'Vendas: sem dados' })).toBeInTheDocument();
    expect(container.querySelectorAll('path, rect')).toHaveLength(0);
  });

  it('dentro do CardMetric, acompanha a moldura sem mudar a API dela', () => {
    const cartao = (estado: { error?: string; loading?: boolean }) => (
      <CardMetric {...estado}>
        <Card.Header title="Vendas" />
        <CardMetric.Body orientation="horizontal">
          <CardMetric.Value value={20400} />
          <Sparkline data={vendas} label="Vendas nos últimos 30 dias" />
        </CardMetric.Body>
      </CardMetric>
    );
    const { container, rerender } = render(cartao({}));

    expect(screen.getByRole('img', { name: /^Vendas nos últimos 30 dias: sobe/ })).toBeInTheDocument();

    rerender(cartao({ loading: true }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();

    rerender(cartao({ error: 'Falhou.' }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou.');
  });
});

describe('Sparkline.module.css', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/components/charts/Sparkline/Sparkline.module.css'), 'utf8');

  it('usa a cor da primeira serie e o traco de 1,75px', () => {
    expect(css).toMatch(/color: var\(--pl-chart-series-1\)/);
    expect(css).toMatch(/stroke-width: 1\.75px/);
  });

  it('desliga a animacao no movimento reduzido', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.reveal\s*\{\s*animation: none;/);
  });

  it('usa CanvasText nas cores forcadas', () => {
    expect(css).toMatch(/@media \(forced-colors: active\)[\s\S]*color: CanvasText;/);
  });
});
