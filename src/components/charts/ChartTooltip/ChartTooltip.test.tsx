import { fireEvent, render, screen } from '@testing-library/react';
import { Dialog } from '../../overlays/Dialog';
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
    expect(celulas()).toContain('156,667');
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

  it('com a caixa, que termina no ponto, encosta a direita dela a 8px, alinhado ao topo', () => {
    fixarMedidaDoBalao(200, 300);
    montar({ anchor: { height: 24, width: 100, x: 200, y: 62 } });

    expect(balao()).toHaveStyle({ left: '208px', top: '50px' });
  });

  it('com a caixa, vai para a esquerda dela quando nao cabe a direita, sem cobri-la', () => {
    fixarMedidaDoBalao(200, 300);
    montar({ anchor: { height: 24, width: 100, x: 900, y: 62 } });

    expect(balao()).toHaveStyle({ left: '592px', top: '50px' });
  });

  it('com a caixa, desce abaixo dela, alinhado a esquerda, quando nao cabe dos lados', () => {
    fixarMedidaDoBalao(400, 100);
    montar({ anchor: { height: 24, width: 700, x: 850, y: 62 } });

    expect(balao()).toHaveStyle({ left: '150px', top: '82px' });
  });

  it('com a caixa, sobe acima dela quando nao cabe nem abaixo', () => {
    fixarMedidaDoBalao(400, 100);
    montar({ anchor: { height: 24, width: 700, x: 850, y: 692 } });

    expect(balao()).toHaveStyle({ left: '150px', top: '572px' });
  });

  it('com a caixa, nao deixa o balao passar da borda de cima', () => {
    fixarMedidaDoBalao(200, 300);
    montar({ anchor: { height: 24, width: 100, x: 200, y: 14 } });

    expect(balao()).toHaveStyle({ top: '8px' });
  });

  it('com a caixa maior que a janela, o balao fica dentro dela', () => {
    fixarMedidaDoBalao(200, 300);
    montar({ anchor: { height: 768, width: 1024, x: 1024, y: 384 } });

    expect(balao()).toHaveStyle({ left: '8px', top: '460px' });
  });

  it('so com o ponto, mantem o afastamento do ponteiro', () => {
    montar({ anchor: { x: 120, y: 90 } });

    expect(balao()).toHaveStyle({ left: '136px', top: '106px' });
  });

  it('sai da arvore de acessibilidade, porque a leitura acessivel e o titulo da marca', () => {
    montar();
    abrir();

    expect(screen.queryByText('Distribuição', { ignore: '[aria-hidden="true"], [aria-hidden="true"] *' })).toBeNull();
  });

  it('fecha o balao ancorado no Escape, sem tirar o foco da marca', () => {
    render(
      <ChartTooltip anchor={{ x: 120, y: 90 }} rows={distribuicao} title="Distribuição">
        <button type="button">marca</button>
      </ChartTooltip>,
    );
    screen.getByRole('button').focus();
    expect(balao()).not.toBeNull();

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });

    expect(balao()).toBeNull();
    expect(screen.getByRole('button')).toHaveFocus();
  });

  it('reabre o balao quando a ancora muda para outra marca', () => {
    const { rerender } = montar({ anchor: { x: 120, y: 90 } });
    fireEvent.keyDown(screen.getByTestId('desenho'), { key: 'Escape' });
    expect(balao()).toBeNull();

    rerender(
      <ChartTooltip anchor={{ x: 300, y: 90 }} rows={distribuicao} title="Distribuição">
        <div data-testid="desenho">gráfico</div>
      </ChartTooltip>,
    );

    expect(balao()).not.toBeNull();
  });

  it('no dialogo, o primeiro Escape fecha so o balao e o segundo segue para o dialogo', () => {
    const aoMudar = vi.fn();
    render(
      <Dialog defaultOpen onOpenChange={aoMudar} title="Grafico">
        <ChartTooltip anchor={{ x: 120, y: 90 }} rows={distribuicao} title="Distribuição">
          <button type="button">marca</button>
        </ChartTooltip>
      </Dialog>,
    );
    const marca = screen.getByRole('button', { name: 'marca' });
    marca.focus();

    expect(screen.getByText('Distribuição')).toBeInTheDocument();
    fireEvent.keyDown(marca, { key: 'Escape' });
    expect(screen.queryByText('Distribuição')).toBeNull();
    expect(aoMudar).not.toHaveBeenCalled();

    fireEvent.keyDown(marca, { key: 'Escape' });
    expect(aoMudar).toHaveBeenCalledWith(false);
  });

  it('com o foco fora do grafico, o Escape e de quem tem o foco e o balao ancorado fica', () => {
    const aoTeclar = vi.fn();
    document.addEventListener('keydown', aoTeclar);
    render(
      <>
        <ChartTooltip anchor={{ x: 120, y: 90 }} rows={distribuicao} title="Distribuição">
          <div>gráfico</div>
        </ChartTooltip>
        <button type="button">menu</button>
      </>,
    );

    fireEvent.keyDown(screen.getByRole('button', { name: 'menu' }), { key: 'Escape' });

    expect(aoTeclar).toHaveBeenCalledTimes(1);
    expect(balao()).not.toBeNull();
    document.removeEventListener('keydown', aoTeclar);
  });

  it('sem balao ancorado, o Escape segue normalmente', () => {
    const aoTeclar = vi.fn();
    document.addEventListener('keydown', aoTeclar);
    montar();

    fireEvent.keyDown(screen.getByTestId('desenho'), { key: 'Escape' });

    expect(aoTeclar).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', aoTeclar);
  });

  it('decide o lado pela largura util do documento, sem a barra de rolagem', () => {
    fixarMedidaDoBalao(200, 100);
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1007 });
    montar();
    mover(800, 50);

    // 800 + 16 + 200 = 1016 cabe em 1024 (innerWidth), mas nao em 1007 - 8.
    expect(balao()).toHaveStyle({ left: '584px' });
    Reflect.deleteProperty(document.documentElement, 'clientWidth');
  });
});
