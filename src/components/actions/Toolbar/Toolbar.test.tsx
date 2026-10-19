import { createRef, useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../Button';
import { Toolbar, type ToolbarOrientation } from './Toolbar';

function BarraDoBloco({ desabilitado, orientation }: { desabilitado?: string; orientation?: ToolbarOrientation }) {
  return (
    <Toolbar label="Bloco" orientation={orientation}>
      <Toolbar.Group>
        <Button disabled={desabilitado === 'Negrito'}>Negrito</Button>
        <Button disabled={desabilitado === 'Itálico'}>Itálico</Button>
      </Toolbar.Group>
      <Toolbar.Group label="Alinhamento">
        <Button>Esquerda</Button>
        <Button>Centro</Button>
      </Toolbar.Group>
    </Toolbar>
  );
}

const botao = (nome: string) => screen.getByRole('button', { name: nome });
const tecla = (key: string) => fireEvent.keyDown(document.activeElement!, { key });

describe('Toolbar', () => {
  it('e uma barra nomeada, com grupos e uma so parada de Tab', () => {
    render(<BarraDoBloco />);

    expect(screen.getByRole('toolbar', { name: 'Bloco' })).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByRole('group', { name: 'Alinhamento' })).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((item) => item.tabIndex)).toEqual([0, -1, -1, -1]);
  });

  it('percorre os itens pelas setas da orientacao, em circulo, com Home e End', () => {
    render(<BarraDoBloco />);
    botao('Negrito').focus();

    tecla('ArrowRight');
    expect(botao('Itálico')).toHaveFocus();
    tecla('ArrowDown');
    expect(botao('Itálico')).toHaveFocus();
    tecla('End');
    expect(botao('Centro')).toHaveFocus();
    tecla('ArrowRight');
    expect(botao('Negrito')).toHaveFocus();
    tecla('ArrowLeft');
    expect(botao('Centro')).toHaveFocus();
    tecla('Home');
    expect(botao('Negrito')).toHaveFocus();
  });

  it('na vertical, as setas para cima e para baixo', () => {
    render(<BarraDoBloco orientation="vertical" />);
    botao('Negrito').focus();

    tecla('ArrowDown');
    expect(botao('Itálico')).toHaveFocus();
    tecla('ArrowRight');
    expect(botao('Itálico')).toHaveFocus();
    tecla('ArrowUp');
    expect(botao('Negrito')).toHaveFocus();
  });

  it('a parada de Tab acompanha o ultimo item focado', () => {
    render(<BarraDoBloco />);
    botao('Negrito').focus();

    tecla('End');

    expect(botao('Centro')).toHaveAttribute('tabindex', '0');
    expect(botao('Negrito')).toHaveAttribute('tabindex', '-1');
  });

  it('pula o item desabilitado', () => {
    render(<BarraDoBloco desabilitado="Itálico" />);
    botao('Negrito').focus();

    tecla('ArrowRight');

    expect(botao('Esquerda')).toHaveFocus();
  });

  it('o item ativo que se desabilita passa a parada de Tab adiante', async () => {
    const { rerender } = render(<BarraDoBloco />);

    rerender(<BarraDoBloco desabilitado="Negrito" />);
    await act(async () => undefined);

    expect(botao('Itálico')).toHaveAttribute('tabindex', '0');
  });

  it('deixa a seta para quem ja a tratou e para os campos de texto', () => {
    render(
      <Toolbar label="Busca">
        <Button onKeyDown={(event) => event.preventDefault()}>Arrastar</Button>
        <input aria-label="Termo" />
        <Button>Buscar</Button>
      </Toolbar>,
    );

    botao('Arrastar').focus();
    tecla('ArrowRight');
    expect(botao('Arrastar')).toHaveFocus();

    screen.getByRole('textbox', { name: 'Termo' }).focus();
    tecla('ArrowRight');
    expect(screen.getByRole('textbox', { name: 'Termo' })).toHaveFocus();
  });

  it('focar a barra leva ao item ativo', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Toolbar label="Bloco" ref={ref}>
        <Button>Negrito</Button>
        <Button>Itálico</Button>
      </Toolbar>,
    );
    botao('Negrito').focus();
    tecla('ArrowRight');
    act(() => botao('Itálico').blur());

    act(() => ref.current!.focus());

    expect(botao('Itálico')).toHaveFocus();
  });

  it('ancorada, vai ao body como camada de cima e nao tira o foco de quem o tem', () => {
    function Editor() {
      const paragrafo = useRef<HTMLTextAreaElement>(null);
      const [selecionado, setSelecionado] = useState(false);

      return (
        <>
          <textarea aria-label="Parágrafo" onFocus={() => setSelecionado(true)} ref={paragrafo} />
          {selecionado && (
            <Toolbar anchorRef={paragrafo} label="Bloco" placement="top start">
              <Button>Negrito</Button>
            </Toolbar>
          )}
        </>
      );
    }
    const { container } = render(<Editor />);
    const paragrafo = screen.getByRole('textbox', { name: 'Parágrafo' });

    act(() => paragrafo.focus());

    const barra = screen.getByRole('toolbar', { name: 'Bloco' });
    expect(paragrafo).toHaveFocus();
    expect(container).not.toContainElement(barra);
    expect(barra).toHaveAttribute('data-react-aria-top-layer', 'true');
    expect(barra.style.position).toBe('absolute');
  });

  describe('ancorada, acompanha a âncora', () => {
    const observados = new Map<Element, () => void>();

    class Observador {
      constructor(private readonly avisar: () => void) {}
      observe(elemento: Element) {
        observados.set(elemento, this.avisar);
      }
      disconnect() {}
      unobserve() {}
    }

    beforeEach(() => {
      observados.clear();
      Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: Observador });
    });

    afterEach(() => {
      Reflect.deleteProperty(globalThis, 'ResizeObserver');
      document.querySelectorAll('[data-rolagem]').forEach((rolagem) => rolagem.remove());
    });

    function bloco(medida: { top: number; height: number }) {
      const elemento = document.createElement('div');
      elemento.getBoundingClientRect = () => DOMRect.fromRect({ x: 40, y: medida.top, width: 300, height: medida.height });
      return elemento;
    }

    function montar(ancora: HTMLElement) {
      const rolagem = document.createElement('div');
      rolagem.dataset.rolagem = '';
      rolagem.style.overflow = 'auto';
      rolagem.append(ancora);
      document.body.append(rolagem);
      const ref = { current: ancora };
      const barra = () => (
        <Toolbar anchorRef={ref} label="Bloco" placement="bottom start">
          <Button>Negrito</Button>
        </Toolbar>
      );
      const { rerender } = render(barra());

      return { ref, rolagem, refazer: () => rerender(barra()) };
    }

    const topoDaBarra = () => screen.getByRole('toolbar', { name: 'Bloco' }).style.top;

    it('refaz a posição quando rola um contêiner da âncora', () => {
      const medida = { top: 200, height: 40 };
      const { rolagem } = montar(bloco(medida));
      const antes = topoDaBarra();

      medida.top = 80;
      fireEvent.scroll(rolagem);

      expect(topoDaBarra()).not.toBe(antes);
    });

    it('refaz a posição quando a âncora muda de tamanho, também a âncora trocada depois de montar', () => {
      const primeira = { top: 200, height: 40 };
      const segunda = { top: 300, height: 40 };
      const ancora = bloco(primeira);
      const { ref, refazer } = montar(ancora);
      let antes = topoDaBarra();

      primeira.height = 120;
      act(() => observados.get(ancora)!());
      expect(topoDaBarra()).not.toBe(antes);

      const trocada = bloco(segunda);
      ancora.after(trocada);
      ref.current = trocada;
      refazer();
      antes = topoDaBarra();

      segunda.height = 160;
      act(() => observados.get(trocada)?.());
      expect(topoDaBarra()).not.toBe(antes);
    });
  });
});
