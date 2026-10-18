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
});
