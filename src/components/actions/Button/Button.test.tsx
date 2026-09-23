import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children and uses button semantics', () => {
    render(<Button>Salvar</Button>);

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('supports variants and sizes', () => {
    render(
      <Button variant="secondary" size="lg">
        Continuar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Continuar' });
    expect(button.className).toContain('secondary');
    expect(button.className).toContain('lg');
  });

  it('defaults to a non-submitting button type', () => {
    render(<Button>Cancelar</Button>);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute('type', 'button');
  });

  it('forwards disabled state', () => {
    render(<Button disabled>Indisponivel</Button>);

    expect(screen.getByRole('button', { name: 'Indisponivel' })).toBeDisabled();
  });

  it('marks loading buttons as busy without removing them from the tab order', () => {
    render(<Button loading>Salvando</Button>);

    const button = screen.getByRole('button', { name: 'Salvando' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();

    button.focus();
    expect(button).toHaveFocus();
  });

  it('ignores clicks while loading', () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>Salvando</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Salvando' }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('calls the click handler when enabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Confirmar</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
