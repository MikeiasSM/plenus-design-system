import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its content with a neutral tone by default', () => {
    render(<Badge>Neutro</Badge>);

    expect(screen.getByText('Neutro')).toBeInTheDocument();
  });

  it('supports semantic tones', () => {
    render(<Badge tone="danger">Erro</Badge>);

    expect(screen.getByText('Erro').className).toContain('danger');
  });

  it('renders a decorative dot when requested', () => {
    render(<Badge dot>Ativo</Badge>);

    expect(screen.getByText('Ativo').querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('supports outline presentation', () => {
    render(
      <Badge tone="ok" outline>
        Concluido
      </Badge>,
    );

    expect(screen.getByText('Concluido').className).toContain('outline');
  });

  it('forwards native span attributes', () => {
    render(<Badge data-testid="badge">Status</Badge>);

    expect(screen.getByTestId('badge')).toHaveAttribute('data-testid', 'badge');
  });
});
