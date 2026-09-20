import { fireEvent, render, screen } from '@testing-library/react';
import { CurrencyInput } from './CurrencyInput';

describe('CurrencyInput', () => {
  it('formats Brazilian currency on blur', () => {
    render(<CurrencyInput label="Valor" />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.change(input, { target: { value: '165789' } });
    expect(input).toHaveValue('165789');

    fireEvent.blur(input);

    expect(input).toHaveValue('R$ 165.789,00');
  });

  it('preserves comma decimals and completes cents on blur', () => {
    render(<CurrencyInput label="Valor" />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.change(input, { target: { value: '165789,5' } });
    fireEvent.blur(input);

    expect(input).toHaveValue('R$ 165.789,50');
  });

  it('removes the currency mask when focused again', () => {
    render(<CurrencyInput label="Valor" defaultValue="165789,50" />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.focus(input);

    expect(input).toHaveValue('165789,50');
  });

  it('emits the raw value to the product', () => {
    const onValueChange = vi.fn();
    render(<CurrencyInput label="Valor" onValueChange={onValueChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Valor' }), {
      target: { value: '1234,5' },
    });

    expect(onValueChange).toHaveBeenCalledWith('1234,5');
  });
});
