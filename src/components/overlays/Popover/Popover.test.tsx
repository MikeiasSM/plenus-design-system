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
});
