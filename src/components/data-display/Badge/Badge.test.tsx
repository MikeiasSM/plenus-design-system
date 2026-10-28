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
      <Badge tone="success" outline>
        Concluido
      </Badge>,
    );

    expect(screen.getByText('Concluido').className).toContain('outline');
  });

  it('forwards native span attributes', () => {
    render(<Badge data-testid="badge">Status</Badge>);

    expect(screen.getByTestId('badge')).toHaveAttribute('data-testid', 'badge');
  });

  it('paints in the brand color with variant brand, regardless of tone', () => {
    render(<Badge variant="brand">Destaque</Badge>);

    expect(screen.getByText('Destaque').className).toContain('brand');
  });

  it('still accepts the deprecated tones, mapped to the current ones', () => {
    render(
      <>
        <Badge tone="ok">Ok</Badge>
        <Badge tone="warn">Atenção</Badge>
        <Badge tone="primary">Marca</Badge>
      </>,
    );

    expect(screen.getByText('Ok').className).toContain('success');
    expect(screen.getByText('Atenção').className).toContain('warning');
    expect(screen.getByText('Marca').className).toContain('brand');
  });
});
