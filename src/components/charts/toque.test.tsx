import { fireEvent, render, screen, within } from '@testing-library/react';
import { ChartBar } from './ChartBar';
import { ChartHeatmap } from './ChartHeatmap';
import { ChartLine } from './ChartLine';
import { ChartPie } from './ChartPie';
import { ChartTimeline } from './ChartTimeline';

const fatias = [
  { label: 'Alfa', value: 30 },
  { label: 'Beta', value: 70 },
];

/** O jsdom não tem PointerEvent: sem ele, `pointerType` e `isPrimary` não chegam ao gestor. */
class PointerEventDoJsdom extends MouseEvent {
  readonly isPrimary: boolean;
  readonly pointerType: string;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.isPrimary = init.isPrimary ?? false;
    this.pointerType = init.pointerType ?? '';
  }
}

beforeAll(() => {
  vi.stubGlobal('PointerEvent', PointerEventDoJsdom);
});
afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 320 });
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
});

const dedo = { clientX: 40, clientY: 40, isPrimary: true, pointerType: 'touch' };

/** Um toque completo: o dedo desce, sobe e o navegador entrega o clique. */
function tocar(alvo: Element, aoDescer = dedo) {
  fireEvent.pointerDown(alvo, aoDescer);
  fireEvent.pointerUp(alvo, aoDescer);
  fireEvent.click(alvo);
}

const fatia = (nome: string) => screen.getByLabelText(new RegExp(`^${nome}:`));
const ultimo = (aviso: ReturnType<typeof vi.fn>) => aviso.mock.calls.at(-1)?.[0];

describe('toque nas marcas', () => {
  it('tocar numa marca fixa o realce, e o dedo que sai não o solta', () => {
    const onHover = vi.fn();
    render(<ChartPie onHover={onHover} slices={fatias} title="Receita" />);

    tocar(fatia('Alfa'));
    fireEvent.pointerLeave(fatia('Alfa'), dedo);

    expect(ultimo(onHover)).toEqual(expect.objectContaining({ label: 'Alfa' }));
    expect(fatia('Beta').getAttribute('class')).toMatch(/Dim/);
  });

  it('tocar em outra marca troca a fixada', () => {
    const onHover = vi.fn();
    render(<ChartPie onHover={onHover} slices={fatias} title="Receita" />);

    tocar(fatia('Alfa'));
    tocar(fatia('Beta'));

    expect(ultimo(onHover)).toEqual(expect.objectContaining({ label: 'Beta' }));
  });

  it('tocar fora do desenho solta a marca', () => {
    const onHover = vi.fn();
    render(<ChartPie onHover={onHover} slices={fatias} title="Receita" />);

    tocar(fatia('Alfa'));
    fireEvent.pointerDown(document.body, dedo);

    expect(ultimo(onHover)).toBeNull();
  });

  it('tocar na legenda, que é outro controle, solta a marca', () => {
    const onHover = vi.fn();
    render(<ChartPie onHover={onHover} slices={fatias} title="Receita" />);

    tocar(fatia('Alfa'));
    fireEvent.pointerDown(screen.getByRole('button', { name: /^Beta/ }), dedo);

    expect(ultimo(onHover)).toBeNull();
  });

  it('o gesto que o navegador toma para rolar não fixa nada', () => {
    const onHover = vi.fn();
    render(<ChartPie onHover={onHover} slices={fatias} title="Receita" />);

    fireEvent.pointerDown(fatia('Alfa'), dedo);
    fireEvent.pointerCancel(fatia('Alfa'), dedo);
    fireEvent.pointerUp(fatia('Alfa'), dedo);

    expect(onHover).not.toHaveBeenCalled();
  });

  it('o dedo que anda além da folga entre descer e subir é rolagem, não toque', () => {
    const onHover = vi.fn();
    render(<ChartPie onHover={onHover} slices={fatias} title="Receita" />);

    fireEvent.pointerDown(fatia('Alfa'), dedo);
    fireEvent.pointerMove(fatia('Alfa'), { ...dedo, clientY: 90 });
    fireEvent.pointerUp(fatia('Alfa'), { ...dedo, clientY: 90 });

    expect(onHover).not.toHaveBeenCalled();
  });

  it('rolar a página solta a marca fixada', () => {
    const onHover = vi.fn();
    render(<ChartPie onHover={onHover} slices={fatias} title="Receita" />);

    tocar(fatia('Alfa'));
    fireEvent.scroll(window);

    expect(ultimo(onHover)).toBeNull();
  });

  it('mouse e caneta seguem o ponteiro de sempre, sem fixar', () => {
    const onHover = vi.fn();
    render(<ChartPie onHover={onHover} slices={fatias} title="Receita" />);

    tocar(fatia('Alfa'), { ...dedo, pointerType: 'mouse' });

    expect(onHover).not.toHaveBeenCalled();
  });
});

describe('toque e onMarkClick', () => {
  it('o primeiro toque só fixa, e o toque na marca já fixada ativa', () => {
    const onMarkClick = vi.fn();
    render(<ChartBar categories={['jan', 'fev']} onMarkClick={onMarkClick} series={[{ label: 'Receita', values: [1, 2] }]} title="Receita" />);
    const [primeira, segunda] = within(screen.getByRole('group')).getAllByRole('button');

    tocar(primeira);
    expect(onMarkClick).not.toHaveBeenCalled();

    tocar(primeira);
    expect(onMarkClick).toHaveBeenCalledTimes(1);
    expect(onMarkClick).toHaveBeenCalledWith(expect.objectContaining({ category: 'jan', series: 'Receita' }));

    tocar(segunda);
    expect(onMarkClick).toHaveBeenCalledTimes(1);
  });

  it('o dedo na marca não a foca, e o toque avisa onHover uma vez só', () => {
    const onHover = vi.fn();
    render(<ChartBar categories={['jan']} onHover={onHover} onMarkClick={vi.fn()} series={[{ label: 'Receita', values: [1] }]} title="Receita" />);
    const barra = within(screen.getByRole('group')).getByRole('button');

    expect(fireEvent.pointerDown(barra, dedo)).toBe(false);
    fireEvent.pointerUp(barra, dedo);

    expect(onHover).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['ChartHeatmap', (aoAtivar: () => void) => <ChartHeatmap cells={[{ value: 1, x: 'Seg', y: 'Manhã' }]} onMarkClick={aoAtivar} title="Turnos" />],
    ['ChartTimeline', (aoAtivar: () => void) => (
      <ChartTimeline onMarkClick={aoAtivar} rows={[{ key: 'a', label: 'Ana' }]} segments={[{ end: 4, row: 'a', series: 'T', start: 1 }]} series={[{ label: 'T' }]} title="Escala" />
    )],
  ])('no %s, o primeiro toque na marca também só fixa', (_, grafico) => {
    const onMarkClick = vi.fn();
    render(grafico(onMarkClick));
    const marca = within(screen.getByRole('group')).getByRole('button');

    tocar(marca);
    expect(onMarkClick).not.toHaveBeenCalled();

    tocar(marca);
    expect(onMarkClick).toHaveBeenCalledTimes(1);
  });

  it('no ChartLine, o primeiro toque na faixa do ponto só fixa', () => {
    const onMarkClick = vi.fn();
    const { container } = render(
      <ChartLine categories={['jan', 'fev']} onMarkClick={onMarkClick} series={[{ label: 'Receita', values: [1, 2] }]} title="Receita" />,
    );
    const faixa = container.querySelector('[data-band="0"]')!;

    tocar(faixa);
    expect(onMarkClick).not.toHaveBeenCalled();

    tocar(faixa);
    expect(onMarkClick).toHaveBeenCalledTimes(1);
  });

  it('o clique do mouse ou do teclado ativa de primeira', () => {
    const onMarkClick = vi.fn();
    render(<ChartBar categories={['jan']} onMarkClick={onMarkClick} series={[{ label: 'Receita', values: [1] }]} title="Receita" />);

    fireEvent.click(within(screen.getByRole('group')).getByRole('button'));

    expect(onMarkClick).toHaveBeenCalledTimes(1);
  });
});
