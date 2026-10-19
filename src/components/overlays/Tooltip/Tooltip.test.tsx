import { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../../actions/Button';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('aparece no foco e descreve o gatilho', () => {
    render(<Tooltip content="Salva e mantem na tela"><Button>Salvar</Button></Tooltip>);

    const gatilho = screen.getByRole('button', { name: 'Salvar' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.focus(gatilho);

    expect(screen.getByRole('tooltip')).toHaveTextContent('Salva e mantem na tela');
    expect(gatilho).toHaveAccessibleDescription('Salva e mantem na tela');
  });

  it('some no blur e no Escape', () => {
    render(<Tooltip content="Ajuda"><Button>Salvar</Button></Tooltip>);
    const gatilho = screen.getByRole('button', { name: 'Salvar' });

    fireEvent.focus(gatilho);
    fireEvent.blur(gatilho);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.focus(gatilho);
    fireEvent.keyDown(gatilho, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('espera o atraso antes de aparecer no hover', () => {
    vi.useFakeTimers();
    render(<Tooltip content="Ajuda" delay={400}><Button>Salvar</Button></Tooltip>);
    const gatilho = screen.getByRole('button', { name: 'Salvar' });

    fireEvent.mouseEnter(gatilho);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('preserva os manipuladores do proprio gatilho', () => {
    const onFocus = vi.fn();
    render(<Tooltip content="Ajuda"><Button onFocus={onFocus}>Salvar</Button></Tooltip>);

    fireEvent.focus(screen.getByRole('button', { name: 'Salvar' }));

    expect(onFocus).toHaveBeenCalled();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('continua aberto enquanto o ponteiro atravessa ate o balao, como pede a WCAG 1.4.13', () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Explicacao" delay={0}>
        <button type="button">Alvo</button>
      </Tooltip>,
    );

    const alvo = screen.getByRole('button', { name: 'Alvo' });

    fireEvent.mouseEnter(alvo);
    act(() => vi.runAllTimers());
    fireEvent.mouseLeave(alvo);
    fireEvent.mouseEnter(screen.getByRole('tooltip'));
    act(() => vi.runAllTimers());

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole('tooltip'));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('avisa cada pedido de abrir e fechar, também sem controlar', () => {
    const mudou = vi.fn();
    render(<Tooltip content="Ajuda" onOpenChange={mudou}><Button>Salvar</Button></Tooltip>);
    const gatilho = screen.getByRole('button', { name: 'Salvar' });

    fireEvent.focus(gatilho);
    expect(mudou).toHaveBeenLastCalledWith(true);

    fireEvent.blur(gatilho);
    expect(mudou).toHaveBeenLastCalledWith(false);
  });

  it('controlado, abre pelo produto e o Escape só pede para fechar', () => {
    const mudou = vi.fn();
    render(<Tooltip content="Valor inválido" onOpenChange={mudou} open><Button>Célula</Button></Tooltip>);
    const gatilho = screen.getByRole('button', { name: 'Célula' });

    expect(gatilho).toHaveAccessibleDescription('Valor inválido');

    fireEvent.keyDown(gatilho, { key: 'Escape' });

    expect(mudou).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  describe('com âncora fora do filho', () => {
    function Celula({ onOpenChange, open }: { onOpenChange?: (open: boolean) => void; open: boolean }) {
      const celula = useRef<HTMLSpanElement>(null);

      return (
        <>
          <span aria-describedby={open ? 'dica-da-celula' : undefined} data-testid="celula" ref={celula} tabIndex={0}>
            abc
          </span>
          <Tooltip anchorRef={celula} content="Esperava um número" id="dica-da-celula" onOpenChange={onOpenChange} open={open} />
        </>
      );
    }

    it('aparece quando o produto abre, e a descrição liga pelo id que ele passou', () => {
      const { rerender } = render(<Celula open={false} />);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      rerender(<Celula open />);

      expect(screen.getByRole('tooltip')).toHaveAttribute('id', 'dica-da-celula');
      expect(screen.getByTestId('celula')).toHaveAccessibleDescription('Esperava um número');
    });

    it('o Escape em qualquer ponto pede para fechar, sem decidir por conta própria', () => {
      const mudou = vi.fn();
      render(<Celula onOpenChange={mudou} open />);

      fireEvent.keyDown(document.body, { key: 'Escape' });

      expect(mudou).toHaveBeenCalledWith(false);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });
});
