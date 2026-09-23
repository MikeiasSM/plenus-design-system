import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Button } from '../../actions/Button';
import { Dialog } from './Dialog';

function Host({ dismissable = true }: { dismissable?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Abrir</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        dismissable={dismissable}
        title="Confirmar exclusao"
        description="Esta acao nao pode ser desfeita."
        footer={<Button onClick={() => setOpen(false)}>Cancelar</Button>}
      >
        Corpo do dialogo.
      </Dialog>
    </div>
  );
}

describe('Dialog', () => {
  it('nao renderiza nada enquanto esta fechado', () => {
    render(<Host />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('expoe nome e descricao acessiveis quando aberto', () => {
    render(<Host />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    const dialogo = screen.getByRole('dialog', { name: 'Confirmar exclusao' });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleDescription('Esta acao nao pode ser desfeita.');
  });

  it('fecha pelo Escape e devolve o foco a quem abriu', () => {
    render(<Host />);
    const abrir = screen.getByRole('button', { name: 'Abrir' });
    // Um clique real foca o botao; fireEvent nao, e o restoreFocus depende disso.
    abrir.focus();
    fireEvent.click(abrir);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('fecha pelo botao de fechar', () => {
    render(<Host />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('omite o botao de fechar e ignora o Escape quando nao e dispensavel', () => {
    render(<Host dismissable={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('esconde o restante da pagina da tecnologia assistiva', () => {
    render(<Host />);
    const abrir = screen.getByRole('button', { name: 'Abrir' });
    fireEvent.click(abrir);

    expect(abrir.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
