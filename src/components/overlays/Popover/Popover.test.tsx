import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { Button } from '../../actions/Button';
import { Popover } from './Popover';

function Host() {
  const gatilho = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button ref={gatilho} onClick={() => setOpen(true)}>Filtros</Button>
      <Popover open={open} onClose={() => setOpen(false)} triggerRef={gatilho} aria-label="Filtros">
        <Button onClick={() => setOpen(false)}>Aplicar</Button>
      </Popover>
      <Button>Depois</Button>
    </div>
  );
}

function abrir() {
  const gatilho = screen.getByRole('button', { name: 'Filtros' });
  gatilho.focus();
  fireEvent.click(gatilho);
  return gatilho;
}

describe('Popover', () => {
  it('nao renderiza nada enquanto esta fechado', () => {
    render(<Host />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre ancorado ao gatilho e expoe nome acessivel', () => {
    render(<Host />);
    abrir();

    const popover = screen.getByRole('dialog', { name: 'Filtros' });
    expect(popover).toBeInTheDocument();
    expect(popover.style.position).toBe('absolute');
  });

  it('fecha pelo Escape e devolve o foco ao gatilho', () => {
    render(<Host />);
    const gatilho = abrir();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });

  it('nao e modal: mantem o restante da pagina acessivel', () => {
    render(<Host />);
    abrir();

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Depois' })).toBeInTheDocument();
  });

  it('nao prende o foco: o Tab na borda segue a pagina a partir do gatilho', () => {
    render(<Host />);
    abrir();
    const aplicar = screen.getByRole('button', { name: 'Aplicar' });

    aplicar.focus();
    fireEvent.keyDown(aplicar, { key: 'Tab' });

    expect(screen.getByRole('button', { name: 'Depois' })).toHaveFocus();
  });

  it('deixa o clique do gatilho com o consumidor, sem fechar antes dele', () => {
    const cliques = vi.fn();

    function Alternavel() {
      const gatilho = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(false);

      return (
        <>
          <Button
            ref={gatilho}
            onClick={() => {
              cliques();
              setOpen((aberto) => !aberto);
            }}
          >
            Filtros
          </Button>
          <Popover aria-label="Filtros" onClose={() => setOpen(false)} open={open} triggerRef={gatilho}>
            <Button>Aplicar</Button>
          </Popover>
        </>
      );
    }

    render(<Alternavel />);

    const gatilho = screen.getByRole('button', { name: 'Filtros' });

    fireEvent.click(gatilho);
    fireEvent.pointerDown(gatilho);
    fireEvent.mouseDown(gatilho);
    fireEvent.pointerUp(gatilho);
    fireEvent.mouseUp(gatilho);
    fireEvent.click(gatilho);

    expect(cliques).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
