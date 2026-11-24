import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputCode } from './InputCode';

describe('InputCode', () => {
  it('is one field named "Código de 6 dígitos", with numeric keyboard and one-time-code', () => {
    render(<InputCode />);
    const input = screen.getByRole('textbox', { name: 'Código de 6 dígitos' });

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
  });

  it('keeps only digits, up to the length, and completes', async () => {
    const onComplete = vi.fn();
    render(<InputCode onComplete={onComplete} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '4a8 1-9027');

    expect(input).toHaveValue('481902');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('481902');
  });

  it('accepts the whole code pasted with spaces', () => {
    const onComplete = vi.fn();
    render(<InputCode onComplete={onComplete} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '481 902' } });

    expect(onComplete).toHaveBeenCalledWith('481902');
  });

  it('draws the boxes out of the accessibility tree', () => {
    const { container } = render(<InputCode defaultValue="48" />);
    const boxes = container.querySelector('[aria-hidden="true"]')!;

    expect(boxes.children).toHaveLength(6);
    expect(boxes.children[0]).toHaveTextContent('4');
    expect(boxes.children[2]).toHaveTextContent('');
  });

  it('shows the error in text below and marks the field invalid', () => {
    render(<InputCode error="Código errado. Confira e tente de novo." />);

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Código errado. Confira e tente de novo.');
  });

  it('follows the length in the name and the boxes', () => {
    render(<InputCode length={4} />);

    expect(screen.getByRole('textbox', { name: 'Código de 4 dígitos' })).toBeInTheDocument();
  });
});
