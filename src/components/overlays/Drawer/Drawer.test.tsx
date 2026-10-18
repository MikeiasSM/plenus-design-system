import { fireEvent, render, screen } from '@testing-library/react';
import { Drawer } from './Drawer';
import styles from './Drawer.module.css';

describe('Drawer', () => {
  it('e um dialogo modal nomeado pelo titulo, com corpo e rodape', () => {
    render(
      <Drawer description="Ajuste quem ve o painel." footer={<button type="button">Salvar</button>} onClose={vi.fn()} open title="Acesso">
        Corpo da gaveta.
      </Drawer>,
    );

    const gaveta = screen.getByRole('dialog', { name: 'Acesso' });
    expect(gaveta).toHaveAttribute('aria-modal', 'true');
    expect(gaveta).toHaveAccessibleDescription('Ajuste quem ve o painel.');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('fecha pelo Escape e pelo botao de fechar', () => {
    const onClose = vi.fn();
    render(<Drawer onClose={onClose} open title="Acesso" />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('sai do lado pedido, a direita por padrao', () => {
    const { rerender } = render(<Drawer onClose={vi.fn()} open title="Acesso" />);
    expect(screen.getByRole('dialog').parentElement).toHaveClass(styles.right!);

    rerender(<Drawer onClose={vi.fn()} open side="left" title="Acesso" />);
    expect(screen.getByRole('dialog').parentElement).toHaveClass(styles.left!);
  });
});
