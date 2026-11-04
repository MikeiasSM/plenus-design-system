import { act, fireEvent, render, screen } from '@testing-library/react';
import { InputCurrency } from './InputCurrency';

function typeKeys(input: HTMLElement, keys: string) {
  for (const key of keys) {
    fireEvent.change(input, { target: { value: (input as HTMLInputElement).value + key } });
  }
}

describe('InputCurrency', () => {
  it('formats Brazilian currency on blur', () => {
    render(<InputCurrency label="Valor" />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '165789' } });
    expect(input).toHaveValue('165789');

    fireEvent.blur(input);

    expect(input).toHaveValue('R$ 165.789,00');
  });

  it('preserves comma decimals and completes cents on blur', () => {
    render(<InputCurrency label="Valor" />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '165789,5' } });
    fireEvent.blur(input);

    expect(input).toHaveValue('R$ 165.789,50');
  });

  it('removes the currency mask when focused again', () => {
    render(<InputCurrency label="Valor" defaultValue={165789.5} />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.focus(input);

    expect(input).toHaveValue('165789,5');
  });

  it('emits the value as a number', () => {
    const onValueChange = vi.fn();
    render(<InputCurrency label="Valor" onValueChange={onValueChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Valor' }), {
      target: { value: '1234,5' },
    });

    expect(onValueChange).toHaveBeenCalledWith(1234.5);
  });

  it('reflects external value changes while the field is focused', () => {
    const { rerender } = render(
      <InputCurrency label="Valor" value={100} onValueChange={() => undefined} />,
    );

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.focus(input);
    rerender(<InputCurrency label="Valor" value={999} onValueChange={() => undefined} />);

    expect(input).toHaveValue('999');
  });

  it('reads numeric values using the Brazilian decimal convention', () => {
    render(<InputCurrency label="Valor" value={1234.5} onValueChange={() => undefined} />);

    expect(screen.getByRole('textbox', { name: 'Valor' })).toHaveValue('R$ 1.234,50');
  });

  it('reads a typed dot as a thousands separator once the group is complete', () => {
    const onValueChange = vi.fn();
    render(<InputCurrency label="Valor" onValueChange={onValueChange} />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.focus(input);
    typeKeys(input, '1.234,56');

    expect(onValueChange).toHaveBeenLastCalledWith(1234.56);

    fireEvent.blur(input);

    expect(input).toHaveValue('R$ 1.234,56');
  });

  it('reads a typed dot as decimal when no thousands group follows it', () => {
    const onValueChange = vi.fn();
    render(<InputCurrency label="Valor" onValueChange={onValueChange} />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.focus(input);
    typeKeys(input, '12.50');

    expect(input).toHaveValue('12.50');
    expect(onValueChange).toHaveBeenLastCalledWith(12.5);

    fireEvent.blur(input);

    expect(input).toHaveValue('R$ 12,50');
  });

  it('does not group a pasted fraction of zero', () => {
    render(<InputCurrency label="Valor" />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.change(input, { target: { value: '0.500' } });
    fireEvent.blur(input);

    expect(input).toHaveValue('R$ 0,50');
  });

  it('emits null when the field is cleared', () => {
    const onValueChange = vi.fn();
    render(<InputCurrency label="Valor" defaultValue={10} onValueChange={onValueChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Valor' }), { target: { value: '' } });

    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it('shows zero formatted, not empty', () => {
    render(<InputCurrency label="Valor" value={0} onValueChange={() => undefined} />);

    expect(screen.getByRole('textbox', { name: 'Valor' })).toHaveValue('R$ 0,00');
  });

  it('submits the number with a decimal point, not the masked text, and resets to the default value', () => {
    render(
      <form data-testid="form">
        <InputCurrency label="Valor" name="valor" defaultValue={1000} />
      </form>,
    );

    const form = screen.getByTestId('form') as HTMLFormElement;
    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '1.234,56' } });
    fireEvent.blur(input);

    expect(input).toHaveValue('R$ 1.234,56');
    expect(new FormData(form).get('valor')).toBe('1234.56');

    act(() => form.reset());

    expect(new FormData(form).get('valor')).toBe('1000');
    expect(input).toHaveValue('R$ 1.000,00');
  });
});
