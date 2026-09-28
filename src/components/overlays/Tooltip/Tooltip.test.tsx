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
});
