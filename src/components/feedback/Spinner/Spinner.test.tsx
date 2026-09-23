import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('stays decorative when it carries no label', () => {
    const { container } = render(<Spinner />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('announces itself when given a label', () => {
    render(<Spinner label="Carregando" />);

    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
  });
});
