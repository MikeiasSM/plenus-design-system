import { render, screen } from '@testing-library/react';
import { Progress } from './Progress';

describe('Progress', () => {
  it('exposes the current value through progressbar semantics', () => {
    render(<Progress label="Envio do arquivo" value={40} />);

    const bar = screen.getByRole('progressbar', { name: 'Envio do arquivo' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('omits the current value when indeterminate', () => {
    render(<Progress label="Processando" />);

    expect(screen.getByRole('progressbar', { name: 'Processando' })).not.toHaveAttribute('aria-valuenow');
  });

  it('clamps values to the declared range', () => {
    render(<Progress label="Envio" value={180} max={100} />);

    expect(screen.getByRole('progressbar', { name: 'Envio' })).toHaveAttribute('aria-valuenow', '100');
  });

  it('can show the percentage next to the track', () => {
    render(<Progress label="Envio" value={30} max={60} showValue />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
