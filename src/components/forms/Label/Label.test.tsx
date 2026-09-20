import { render, screen } from '@testing-library/react';
import { Label } from './Label';

describe('Label', () => {
  it('associates with a form control through htmlFor', () => {
    render(
      <>
        <Label htmlFor="email">E-mail</Label>
        <input id="email" />
      </>,
    );

    expect(screen.getByText('E-mail')).toHaveAttribute('for', 'email');
  });

  it('shows a required indicator without exposing it as the label name', () => {
    render(
      <>
        <Label htmlFor="name" required>
          Nome
        </Label>
        <input id="name" />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Nome' })).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports custom classes and native label attributes', () => {
    render(
      <Label className="custom-label" data-testid="custom-label">
        Personalizado
      </Label>,
    );

    expect(screen.getByTestId('custom-label')).toHaveClass('custom-label');
  });
});
