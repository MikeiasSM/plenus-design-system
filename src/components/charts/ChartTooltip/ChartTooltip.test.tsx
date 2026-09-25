import { fireEvent, render, screen } from '@testing-library/react';
import { ChartTooltip, type ChartTooltipRow } from './ChartTooltip';

const distribuicao: ChartTooltipRow[] = [
  { color: 'var(--pl-chart-series-1)', emphasis: true, label: 'Prazo', values: [418, 164352.89] },
  { color: 'var(--pl-chart-series-2)', label: 'C/ Sicredi 930-0', values: [30, 11837.73] },
  { color: 'var(--pl-chart-series-3)', label: 'Outros', values: [22, 8632.09] },
];

/**
 * O jsdom nao implementa `PointerEvent`, entao `fireEvent.pointerMove` chega sem
 * coordenada alguma. O evento e montado a mao para que ela chegue.
 */
function mover(x: number, y: number) {
  fireEvent(
    screen.getByTestId('desenho'),
    Object.assign(new Event('pointermove', { bubbles: true }), { clientX: x, clientY: y }),
  );
}

function abrir() {
  mover(120, 90);
}

/** O jsdom nao tem layout: a medida do balao precisa vir de fora. */
function fixarMedidaDoBalao(largura: number, altura: number) {
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ height: altura, width: largura }),
  });
}

function balao() {
  return document.querySelector('[aria-hidden="true"]');
}

function celulas() {
  return [...(balao()?.querySelectorAll('span') ?? [])].map((no) => no.textContent);
}

function montar(props: Partial<Parameters<typeof ChartTooltip>[0]> = {}) {
  return render(
    <ChartTooltip rows={distribuicao} title="Distribuição" {...props}>
      <div data-testid="desenho">gráfico</div>
    </ChartTooltip>,
  );
}

describe('ChartTooltip', () => {
  afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'getBoundingClientRect'));

  it('aparece no ponteiro e sai quando ele deixa a area', () => {
    montar();
    expect(balao()).toBeNull();

    abrir();
    expect(screen.getByText('Distribuição')).toBeInTheDocument();

    fireEvent.pointerLeave(screen.getByTestId('desenho').parentElement as Element);
    expect(balao()).toBeNull();
  });

  it('sai na rolagem e no teclado, que deixariam o balao preso a um lugar vazio', () => {
    const { unmount } = montar();
    abrir();
    fireEvent.scroll(window);
    expect(balao()).toBeNull();

    unmount();
    montar();
    abrir();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(balao()).toBeNull();
  });

  it('nao abre sem linha alguma, porque nao haveria o que ler', () => {
    montar({ rows: [] });
    abrir();

    expect(balao()).toBeNull();
  });

  it('calcula o percentual de cada linha sobre a ultima coluna, e nao sobre a primeira', () => {
    montar();
    abrir();

    // 164.352,89 de 184.822,71 da 88,92%. Pela coluna de quantidade daria 88,94%.
    expect(celulas()).toContain('88,92%');
    expect(celulas()).toContain('6,40%');
  });

  it('aceita outro calculo no lugar do percentual', () => {
    montar({
      computed: { column: 0, compute: (valor) => valor * 2, format: (valor) => `${valor}` },
    });
    abrir();

    expect(celulas()).toContain('836');
  });

  it('dispensa a coluna calculada quando ela nao serve', () => {
    montar({ computed: 'none' });
    abrir();

    expect(celulas().some((texto) => texto?.endsWith('%'))).toBe(false);
  });

  it('totaliza cada coluna pelo operador dela, que nem sempre e soma', () => {
    montar({
      columns: [{ total: 'average' }, { format: (valor) => valor.toFixed(2) }],
      showTotal: true,
    });
    abrir();

    // Media de 418, 30 e 22; soma dos valores.
    expect(celulas()).toContain('156.66666666666666');
    expect(celulas()).toContain('184822.71');
  });

  it('nao totaliza a coluna que pediu para ficar de fora', () => {
    montar({ columns: [{ total: 'none' }, {}], showTotal: true });
    abrir();

    expect(celulas()).toContain('Total');
    expect(celulas()).not.toContain('470');
  });

  it('dispensa a coluna calculada quando a linha nao tem valor algum', () => {
    montar({ rows: [{ label: 'Servicos', values: [] }, { label: 'Produtos', values: [] }] });
    abrir();

    expect(celulas()).toContain('Servicos');
    expect(celulas().some((texto) => texto?.endsWith('%'))).toBe(false);
  });

  it('abre adiante do ponteiro, para o cursor nao cobrir o texto', () => {
    montar();
    abrir();

    expect(balao()).toHaveStyle({ left: '136px', top: '106px' });
  });

  it('vira para o lado oposto quando nao cabe ate a borda da janela', () => {
    fixarMedidaDoBalao(200, 300);
    montar();
    mover(1000, 700);

    // 1024 x 768 no jsdom: adiante o balao passaria dos dois limites.
    expect(balao()).toHaveStyle({ left: '784px', top: '384px' });
  });

  it('sai da arvore de acessibilidade, porque a leitura acessivel e o titulo da marca', () => {
    montar();
    abrir();

    expect(screen.queryByText('Distribuição', { ignore: '[aria-hidden="true"], [aria-hidden="true"] *' })).toBeNull();
  });
});
