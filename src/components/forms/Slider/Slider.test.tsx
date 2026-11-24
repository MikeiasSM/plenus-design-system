import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Slider } from './Slider';

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

function areaDo(polegar: HTMLElement) {
  return polegar.parentElement as HTMLElement;
}

describe('Slider', () => {
  afterEach(() => vi.restoreAllMocks());

  it('nomeia o polegar pelo rotulo e expoe o valor no padrao de slider', () => {
    render(<Slider defaultValue={30} label="Volume" />);

    const polegar = screen.getByRole('slider', { name: 'Volume' });

    expect(polegar).toHaveAttribute('aria-valuenow', '30');
    expect(polegar).toHaveAttribute('aria-valuemin', '0');
    expect(polegar).toHaveAttribute('aria-valuemax', '100');
    expect(polegar).toHaveAttribute('aria-orientation', 'horizontal');
    expect(polegar).toHaveAttribute('tabindex', '0');
  });

  it('formata o aria-valuetext e o valor ao lado do rotulo', () => {
    render(<Slider defaultValue={300} format={{ style: 'currency', currency: 'BRL' }} label="Preço" max={2000} />);

    const polegar = screen.getByRole('slider', { name: 'Preço' });

    const texto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(300);

    expect(polegar).toHaveAttribute('aria-valuetext', texto);
    // O espaco depois do simbolo e o nao separavel do `Intl`: o normalizador padrao o trocaria.
    expect(screen.getByText(texto, { normalizer: (valor) => valor })).toHaveAttribute('aria-hidden', 'true');
  });

  it('formata pela unidade do Intl', () => {
    render(<Slider defaultValue={15} format={{ style: 'unit', unit: 'kilometer' }} label="Raio" max={50} step={5} />);

    expect(screen.getByRole('slider', { name: 'Raio' })).toHaveAttribute('aria-valuetext', '15 km');
  });

  it('anda pelo teclado: setas um passo, PageUp e PageDown o passo grande, Home e End nos extremos', () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(<Slider defaultValue={50} label="Volume" onValueChange={onValueChange} onValueCommit={onValueCommit} step={2} />);

    const polegar = screen.getByRole('slider', { name: 'Volume' });

    fireEvent.keyDown(polegar, { key: 'ArrowRight' });
    expect(polegar).toHaveAttribute('aria-valuenow', '52');
    fireEvent.keyDown(polegar, { key: 'ArrowDown' });
    expect(polegar).toHaveAttribute('aria-valuenow', '50');
    fireEvent.keyDown(polegar, { key: 'PageUp' });
    expect(polegar).toHaveAttribute('aria-valuenow', '70');
    fireEvent.keyDown(polegar, { key: 'PageDown' });
    expect(polegar).toHaveAttribute('aria-valuenow', '50');
    fireEvent.keyDown(polegar, { key: 'End' });
    expect(polegar).toHaveAttribute('aria-valuenow', '100');
    fireEvent.keyDown(polegar, { key: 'ArrowRight' });
    expect(polegar).toHaveAttribute('aria-valuenow', '100');
    fireEvent.keyDown(polegar, { key: 'Home' });
    expect(polegar).toHaveAttribute('aria-valuenow', '0');

    expect(onValueChange.mock.calls.map(([valor]) => valor)).toEqual([52, 50, 70, 50, 100, 0]);
    // No teclado, cada tecla e definitiva.
    expect(onValueCommit.mock.calls.map(([valor]) => valor)).toEqual([52, 50, 70, 50, 100, 0]);
  });

  it('usa o largeStep declarado e impede a rolagem da pagina', () => {
    render(<Slider defaultValue={0} label="Volume" largeStep={25} />);

    const polegar = screen.getByRole('slider', { name: 'Volume' });
    const evento = new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true, cancelable: true });

    act(() => {
      polegar.dispatchEvent(evento);
    });

    expect(evento.defaultPrevented).toBe(true);
    expect(polegar).toHaveAttribute('aria-valuenow', '25');
  });

  it('nao acumula o erro do ponto flutuante no passo decimal', () => {
    render(<Slider defaultValue={0} label="Taxa" max={1} step={0.1} />);

    const polegar = screen.getByRole('slider', { name: 'Taxa' });

    fireEvent.keyDown(polegar, { key: 'ArrowRight' });
    fireEvent.keyDown(polegar, { key: 'ArrowRight' });
    fireEvent.keyDown(polegar, { key: 'ArrowRight' });

    expect(polegar).toHaveAttribute('aria-valuenow', '0.3');
  });

  it('leva o polegar ao ponto clicado do trilho, ja no passo, e confirma ao soltar', () => {
    trilhoDe100px();
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(<Slider defaultValue={0} label="Volume" onValueChange={onValueChange} onValueCommit={onValueCommit} step={10} />);

    const polegar = screen.getByRole('slider', { name: 'Volume' });
    const area = areaDo(polegar);

    fireEvent.pointerDown(area, { clientX: 63, pointerId: 1, pointerType: 'mouse', button: 0 });

    expect(polegar).toHaveAttribute('aria-valuenow', '60');
    expect(polegar).toHaveFocus();
    expect(onValueCommit).not.toHaveBeenCalled();

    fireEvent.pointerMove(area, { clientX: 81, pointerId: 1 });
    expect(polegar).toHaveAttribute('aria-valuenow', '80');
    expect(polegar).toHaveAttribute('data-dragging');

    fireEvent.pointerUp(area, { clientX: 81, pointerId: 1 });

    expect(onValueChange.mock.calls.map(([valor]) => valor)).toEqual([60, 80]);
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenCalledWith(80);
    expect(polegar).not.toHaveAttribute('data-dragging');
  });

  it('prende o arrasto entre os extremos', () => {
    trilhoDe100px();
    render(<Slider defaultValue={50} label="Volume" />);

    const polegar = screen.getByRole('slider', { name: 'Volume' });
    const area = areaDo(polegar);

    fireEvent.pointerDown(polegar, { clientX: 50, pointerId: 1, pointerType: 'mouse', button: 0 });
    fireEvent.pointerMove(area, { clientX: 180, pointerId: 1 });
    expect(polegar).toHaveAttribute('aria-valuenow', '100');
    fireEvent.pointerMove(area, { clientX: -40, pointerId: 1 });
    expect(polegar).toHaveAttribute('aria-valuenow', '0');
  });

  it('nao confirma quando o gesto termina no mesmo valor', () => {
    trilhoDe100px();
    const onValueCommit = vi.fn();
    render(<Slider defaultValue={50} label="Volume" onValueCommit={onValueCommit} />);

    const polegar = screen.getByRole('slider', { name: 'Volume' });

    fireEvent.pointerDown(polegar, { clientX: 50, pointerId: 1, pointerType: 'mouse', button: 0 });
    fireEvent.pointerUp(areaDo(polegar), { clientX: 50, pointerId: 1 });

    expect(onValueCommit).not.toHaveBeenCalled();
  });

  it('ignora o botao direito do mouse', () => {
    trilhoDe100px();
    render(<Slider defaultValue={0} label="Volume" />);

    const polegar = screen.getByRole('slider', { name: 'Volume' });

    fireEvent.pointerDown(areaDo(polegar), { clientX: 70, pointerId: 1, pointerType: 'mouse', button: 2 });

    expect(polegar).toHaveAttribute('aria-valuenow', '0');
  });

  it('controlado, mostra o valor de fora e avisa sem mudar sozinho', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Slider label="Volume" onValueChange={onValueChange} value={40} />);

    const polegar = screen.getByRole('slider', { name: 'Volume' });

    fireEvent.keyDown(polegar, { key: 'ArrowRight' });

    expect(onValueChange).toHaveBeenCalledWith(41);
    expect(polegar).toHaveAttribute('aria-valuenow', '40');

    rerender(<Slider label="Volume" onValueChange={onValueChange} value={41} />);
    expect(polegar).toHaveAttribute('aria-valuenow', '41');
  });

  it('controlado pelo estado de quem usa', () => {
    function Controlado() {
      const [valor, setValor] = useState(10);

      return (
        <>
          <Slider label="Volume" onValueChange={setValor} value={valor} />
          <output data-testid="fora">{valor}</output>
        </>
      );
    }

    render(<Controlado />);
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Volume' }), { key: 'PageUp' });

    expect(screen.getByTestId('fora')).toHaveTextContent('20');
  });

  it('prende ao intervalo o valor controlado que vem de fora dele', () => {
    render(<Slider label="Volume" max={50} value={80} />);

    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveAttribute('aria-valuenow', '50');
  });

  it('nao controlado, comeca no minimo sem defaultValue', () => {
    render(<Slider label="Volume" min={10} />);

    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveAttribute('aria-valuenow', '10');
  });

  it('liga ajuda e erro pelo Field', () => {
    const { rerender } = render(<Slider hint="De 0 a 100." label="Volume" />);

    const polegar = screen.getByRole('slider', { name: 'Volume' });

    expect(polegar).toHaveAccessibleDescription('De 0 a 100.');
    expect(polegar).not.toHaveAttribute('aria-invalid');

    rerender(<Slider error="Escolha um volume." label="Volume" />);

    expect(polegar).toHaveAccessibleDescription('Escolha um volume.');
    expect(polegar).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha um volume.');
  });

  it('o rotulo do Field aponta para o polegar', () => {
    render(<Slider id="volume" label="Volume" />);

    expect(screen.getByText('Volume').closest('label')).toHaveAttribute('for', 'volume');
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveAttribute('id', 'volume');
  });

  it('desabilitado, sai da ordem do Tab e ignora teclado e ponteiro', () => {
    trilhoDe100px();
    const onValueChange = vi.fn();
    render(<Slider defaultValue={20} disabled label="Volume" onValueChange={onValueChange} />);

    const polegar = screen.getByRole('slider', { name: 'Volume' });

    expect(polegar).toHaveAttribute('aria-disabled', 'true');
    expect(polegar).not.toHaveAttribute('tabindex');

    fireEvent.keyDown(polegar, { key: 'ArrowRight' });
    fireEvent.pointerDown(areaDo(polegar), { clientX: 90, pointerId: 1, pointerType: 'mouse', button: 0 });

    expect(polegar).toHaveAttribute('aria-valuenow', '20');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('nomeia por aria-label sem rotulo visivel', () => {
    render(<Slider aria-label="Zoom" />);

    expect(screen.getByRole('slider', { name: 'Zoom' })).toBeInTheDocument();
  });

  it('mostra as marcas, numero formatado ou rotulo proprio, fora do leitor de tela', () => {
    const { container } = render(
      <Slider format={{ style: 'unit', unit: 'kilometer' }} label="Raio" marks={[0, { value: 25, label: 'Meio' }, 50]} max={50} />,
    );

    expect(container.querySelector('[data-edge="start"]')).toHaveTextContent('0 km');
    expect(screen.getByText('Meio')).toBeInTheDocument();
    expect(screen.getByText('50 km').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[data-edge="end"]')).toHaveTextContent('50 km');
  });

  it('envia o valor no formulario e volta ao inicial no reset', () => {
    render(
      <form data-testid="formulario">
        <Slider defaultValue={30} label="Volume" name="volume" />
      </form>,
    );

    const formulario = screen.getByTestId('formulario') as HTMLFormElement;
    const polegar = screen.getByRole('slider', { name: 'Volume' });

    fireEvent.keyDown(polegar, { key: 'ArrowRight' });
    expect(new FormData(formulario).get('volume')).toBe('31');

    act(() => formulario.reset());

    expect(polegar).toHaveAttribute('aria-valuenow', '30');
    expect(new FormData(formulario).get('volume')).toBe('30');
  });

  it('entrega o ref a area do trilho', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Slider label="Volume" ref={ref} />);

    expect(ref.current).toBe(areaDo(screen.getByRole('slider', { name: 'Volume' })));
  });
});
