import { fireEvent, render, screen } from '@testing-library/react';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders a multiline control associated with its label', () => {
    render(<Textarea id="notes" label="Observacoes" />);

    const textarea = screen.getByRole('textbox', { name: 'Observacoes' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('id', 'notes');
  });

  it('marks errors accessibly through the shared field', () => {
    render(<Textarea label="Observacoes" error="Campo obrigatorio." />);

    const textarea = screen.getByRole('textbox', { name: 'Observacoes' });
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription('Campo obrigatorio.');
  });

  it('counts characters as the user types', () => {
    render(<Textarea label="Observacoes" maxLength={120} showCharacterCount />);

    const textarea = screen.getByRole('textbox', { name: 'Observacoes' });
    fireEvent.change(textarea, { target: { value: 'Alinhamento' } });

    expect(screen.getByText('11/120')).toBeInTheDocument();
  });

  it('exposes the requested number of rows', () => {
    render(<Textarea label="Observacoes" rows={8} />);

    expect(screen.getByRole('textbox', { name: 'Observacoes' })).toHaveAttribute('rows', '8');
  });
});
