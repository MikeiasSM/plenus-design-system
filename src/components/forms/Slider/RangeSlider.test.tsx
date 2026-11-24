import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { RangeSlider, type SliderRange } from './RangeSlider';

// O jsdom nao tem `PointerEvent`: sem ele, o `fireEvent` perde a posicao, o botao e o tipo do ponteiro.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventDeTeste extends MouseEvent {
    pointerId: number;
    pointerType: string;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }

  window.PointerEvent = PointerEventDeTeste as unknown as typeof PointerEvent;
}

// O trilho mede 100px a partir da borda: no intervalo de 0 a 100, a posicao em pixels e o valor.
function trilhoDe100px() {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    bottom: 20,
    height: 20,
    left: 0,
    right: 100,
    top: 0,
    width: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

function polegares(nome = 'Faixa') {
  return {
    inicio: screen.getByRole('slider', { name: `${nome}, mínimo` }),
    fim: screen.getByRole('slider', { name: `${nome}, máximo` }),
    area: screen.getByRole('group', { name: nome }),
  };
}

const mouse = { pointerId: 1, pointerType: 'mouse', button: 0 };

describe('RangeSlider', () => {
  afterEach(() => vi.restoreAllMocks());

  it('nomeia cada polegar pelo rotulo com mínimo e máximo, num grupo com o rotulo', () => {
    render(<RangeSlider defaultValue={[20, 80]} label="Faixa" />);

    const { inicio, fim } = polegares();

    expect(inicio).toHaveAttribute('aria-valuenow', '20');
    expect(fim).toHaveAttribute('aria-valuenow', '80');
    // Cada polegar anuncia ate onde pode ir: o vizinho e o limite.
    expect(inicio).toHaveAttribute('aria-valuemin', '0');
    expect(inicio).toHaveAttribute('aria-valuemax', '80');
    expect(fim).toHaveAttribute('aria-valuemin', '20');
    expect(fim).toHaveAttribute('aria-valuemax', '100');
  });

  it('formata o aria-valuetext de cada polegar e a faixa ao lado do rotulo', () => {
    const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    render(<RangeSlider defaultValue={[300, 1200]} format={{ style: 'currency', currency: 'BRL' }} label="Preço" max={2000} step={50} />);

    const { inicio, fim } = polegares('Preço');

    expect(inicio).toHaveAttribute('aria-valuetext', brl.format(300));
    expect(fim).toHaveAttribute('aria-valuetext', brl.format(1200));
    // O espaco depois do simbolo e o nao separavel do `Intl`: o normalizador padrao o trocaria.
    expect(screen.getByText(`${brl.format(300)} a ${brl.format(1200)}`, { normalizer: (valor) => valor })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('troca os textos pelos labels', () => {
    render(<RangeSlider defaultValue={[1, 2]} label="Range" labels={{ end: 'max', separator: ' – ', start: 'min' }} />);

    expect(screen.getByRole('slider', { name: 'Range, min' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Range, max' })).toBeInTheDocument();
    expect(screen.getByText('1 – 2')).toBeInTheDocument();
  });

  it('nao deixa os polegares se cruzarem pelo teclado', () => {
    render(<RangeSlider defaultValue={[40, 50]} label="Faixa" />);

    const { inicio, fim } = polegares();

    fireEvent.keyDown(inicio, { key: 'PageUp' });
    expect(inicio).toHaveAttribute('aria-valuenow', '50');
    fireEvent.keyDown(inicio, { key: 'End' });
    expect(inicio).toHaveAttribute('aria-valuenow', '50');
    fireEvent.keyDown(fim, { key: 'Home' });
    expect(fim).toHaveAttribute('aria-valuenow', '50');
    fireEvent.keyDown(fim, { key: 'ArrowRight' });
    expect(fim).toHaveAttribute('aria-valuenow', '51');
  });

  it('mantem a distancia minima entre os polegares', () => {
    render(<RangeSlider defaultValue={[20, 40]} label="Faixa" minDistance={10} />);

    const { inicio, fim } = polegares();

    fireEvent.keyDown(inicio, { key: 'End' });
    expect(inicio).toHaveAttribute('aria-valuenow', '30');
    expect(inicio).toHaveAttribute('aria-valuemax', '30');
    fireEvent.keyDown(fim, { key: 'Home' });
    expect(fim).toHaveAttribute('aria-valuenow', '40');
    expect(fim).toHaveAttribute('aria-valuemin', '40');
  });

  it('nao deixa os polegares se cruzarem no arrasto', () => {
    trilhoDe100px();
    render(<RangeSlider defaultValue={[20, 60]} label="Faixa" />);

    const { inicio, fim, area } = polegares();

    fireEvent.pointerDown(inicio, { ...mouse, clientX: 20 });
    fireEvent.pointerMove(area, { clientX: 90, pointerId: 1 });
    fireEvent.pointerUp(area, { clientX: 90, pointerId: 1 });

    expect(inicio).toHaveAttribute('aria-valuenow', '60');
    expect(fim).toHaveAttribute('aria-valuenow', '60');
  });

  it('o clique no trilho leva o polegar mais proximo', () => {
    trilhoDe100px();
    const onValueChange = vi.fn();
    render(<RangeSlider defaultValue={[20, 60]} label="Faixa" onValueChange={onValueChange} />);

    const { inicio, fim, area } = polegares();

    fireEvent.pointerDown(area, { ...mouse, clientX: 5 });
    fireEvent.pointerUp(area, { clientX: 5, pointerId: 1 });
    expect(inicio).toHaveAttribute('aria-valuenow', '5');
    expect(inicio).toHaveFocus();

    fireEvent.pointerDown(area, { ...mouse, clientX: 90 });
    fireEvent.pointerUp(area, { clientX: 90, pointerId: 1 });
    expect(fim).toHaveAttribute('aria-valuenow', '90');
    expect(fim).toHaveFocus();

    expect(onValueChange.mock.calls.map(([valor]) => valor)).toEqual([
      [5, 60],
      [5, 90],
    ]);
  });

  it('com os polegares juntos, o clique escolhe o lado', () => {
    trilhoDe100px();
    render(<RangeSlider defaultValue={[50, 50]} label="Faixa" />);

    const { inicio, fim, area } = polegares();

    fireEvent.pointerDown(area, { ...mouse, clientX: 30 });
    fireEvent.pointerUp(area, { clientX: 30, pointerId: 1 });
    expect(inicio).toHaveAttribute('aria-valuenow', '30');
    expect(fim).toHaveAttribute('aria-valuenow', '50');
  });

  it('com os polegares juntos, o primeiro movimento decide qual sai', () => {
    trilhoDe100px();
    render(<RangeSlider defaultValue={[100, 100]} label="Faixa" />);

    const { inicio, fim, area } = polegares();

    // O segundo fica por cima, e no maximo ele nao poderia ir a esquerda sem passar pelo primeiro.
    fireEvent.pointerDown(fim, { ...mouse, clientX: 100 });
    fireEvent.pointerMove(area, { clientX: 70, pointerId: 1 });
    fireEvent.pointerUp(area, { clientX: 70, pointerId: 1 });

    expect(inicio).toHaveAttribute('aria-valuenow', '70');
    expect(fim).toHaveAttribute('aria-valuenow', '100');
    expect(inicio).toHaveFocus();
  });

  it('arrastar entre os polegares move a faixa inteira, com a mesma largura, ate o extremo', () => {
    trilhoDe100px();
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(<RangeSlider defaultValue={[20, 50]} label="Faixa" onValueChange={onValueChange} onValueCommit={onValueCommit} step={5} />);

    const { inicio, fim, area } = polegares();

    fireEvent.pointerDown(area, { ...mouse, clientX: 30 });
    expect(area).toHaveAttribute('data-grabbing');
    expect(inicio).toHaveAttribute('aria-valuenow', '20');

    fireEvent.pointerMove(area, { clientX: 41, pointerId: 1 });
    expect(inicio).toHaveAttribute('aria-valuenow', '30');
    expect(fim).toHaveAttribute('aria-valuenow', '60');

    fireEvent.pointerMove(area, { clientX: 200, pointerId: 1 });
    expect(inicio).toHaveAttribute('aria-valuenow', '70');
    expect(fim).toHaveAttribute('aria-valuenow', '100');

    fireEvent.pointerMove(area, { clientX: -200, pointerId: 1 });
    expect(inicio).toHaveAttribute('aria-valuenow', '0');
    expect(fim).toHaveAttribute('aria-valuenow', '30');

    fireEvent.pointerUp(area, { clientX: -200, pointerId: 1 });

    expect(area).not.toHaveAttribute('data-grabbing');
    expect(onValueChange).toHaveBeenLastCalledWith([0, 30]);
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenCalledWith([0, 30]);
  });

  it('clicar entre os polegares sem arrastar nao muda nada', () => {
    trilhoDe100px();
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(<RangeSlider defaultValue={[20, 60]} label="Faixa" onValueChange={onValueChange} onValueCommit={onValueCommit} />);

    const { inicio, fim, area } = polegares();

    fireEvent.pointerDown(area, { ...mouse, clientX: 45 });
    fireEvent.pointerUp(area, { clientX: 45, pointerId: 1 });

    expect(inicio).toHaveAttribute('aria-valuenow', '20');
    expect(fim).toHaveAttribute('aria-valuenow', '60');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueCommit).not.toHaveBeenCalled();
  });

  it('mostra a mao sobre a faixa, fora de um gesto', () => {
    trilhoDe100px();
    render(<RangeSlider defaultValue={[20, 60]} label="Faixa" />);

    const { area } = polegares();

    fireEvent.pointerMove(area, { clientX: 40 });
    expect(area).toHaveAttribute('data-band-hover');
    fireEvent.pointerMove(area, { clientX: 80 });
    expect(area).not.toHaveAttribute('data-band-hover');
  });

  it('controlado pelo estado de quem usa', () => {
    function Controlado() {
      const [faixa, setFaixa] = useState<SliderRange>([10, 20]);

      return (
        <>
          <RangeSlider label="Faixa" onValueChange={setFaixa} value={faixa} />
          <output data-testid="fora">{faixa.join('-')}</output>
        </>
      );
    }

    render(<Controlado />);
    fireEvent.keyDown(polegares().fim, { key: 'PageUp' });

    expect(screen.getByTestId('fora')).toHaveTextContent('10-30');
  });

  it('controlado sem atualizar, fica no valor de fora', () => {
    const onValueChange = vi.fn();
    render(<RangeSlider label="Faixa" onValueChange={onValueChange} value={[10, 20]} />);

    fireEvent.keyDown(polegares().inicio, { key: 'ArrowRight' });

    expect(onValueChange).toHaveBeenCalledWith([11, 20]);
    expect(polegares().inicio).toHaveAttribute('aria-valuenow', '10');
  });

  it('nao controlado, vai de min a max sem defaultValue', () => {
    render(<RangeSlider label="Faixa" max={10} min={2} />);

    expect(polegares().inicio).toHaveAttribute('aria-valuenow', '2');
    expect(polegares().fim).toHaveAttribute('aria-valuenow', '10');
  });

  it('liga ajuda e erro pelo Field nos dois polegares', () => {
    render(<RangeSlider error="Faixa fora do permitido." label="Faixa" />);

    const { inicio, fim } = polegares();

    expect(inicio).toHaveAccessibleDescription('Faixa fora do permitido.');
    expect(fim).toHaveAccessibleDescription('Faixa fora do permitido.');
    expect(inicio).toHaveAttribute('aria-invalid', 'true');
  });

  it('nomeia por aria-labelledby, somando mínimo e máximo', () => {
    render(
      <>
        <span id="titulo">Preço</span>
        <RangeSlider aria-labelledby="titulo" />
      </>,
    );

    expect(screen.getByRole('slider', { name: 'Preço mínimo' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Preço máximo' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Preço' })).toBeInTheDocument();
  });

  it('envia o inicio e o fim no formulario', () => {
    render(
      <form data-testid="formulario">
        <RangeSlider defaultValue={[10, 40]} endName="ate" label="Faixa" startName="de" />
      </form>,
    );

    const dados = new FormData(screen.getByTestId('formulario') as HTMLFormElement);

    expect(dados.get('de')).toBe('10');
    expect(dados.get('ate')).toBe('40');
  });
});
