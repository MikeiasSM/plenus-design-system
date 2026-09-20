import { fireEvent, render, screen } from '@testing-library/react';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  it('accepts integer values only by default', () => {
    render(<NumberInput label="Quantidade" />);

    const input = screen.getByRole('textbox', { name: 'Quantidade' });
    fireEvent.change(input, { target: { value: '12,50' } });

    expect(input).toHaveValue('12');
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('blocks decimal separators in integer mode', () => {
    render(<NumberInput label="Quantidade" />);

    const input = screen.getByRole('textbox', { name: 'Quantidade' });
    const commaEvent = new KeyboardEvent('keydown', { key: ',', bubbles: true, cancelable: true });
    const dotEvent = new KeyboardEvent('keydown', { key: '.', bubbles: true, cancelable: true });

    expect(input.dispatchEvent(commaEvent)).toBe(false);
    expect(input.dispatchEvent(dotEvent)).toBe(false);
    expect(input).toHaveAttribute('pattern', '[0-9]*');
  });

  it('preserves the comma and limits decimal places', () => {
    render(<NumberInput label="Percentual" decimalScale={2} />);

    const input = screen.getByRole('textbox', { name: 'Percentual' });
    fireEvent.change(input, { target: { value: '165789,507' } });

    expect(input).toHaveValue('165789,50');
    expect(input).toHaveAttribute('inputmode', 'decimal');
  });

  it('emits the normalized value', () => {
    const onValueChange = vi.fn();
    render(<NumberInput label="Valor" decimalScale={2} onValueChange={onValueChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Valor' }), {
      target: { value: '1234,5' },
    });

    expect(onValueChange).toHaveBeenCalledWith('1234,5');
  });

  it('supports controlled values', () => {
    const { rerender } = render(
      <NumberInput label="Controlado" decimalScale={2} value="165789" onValueChange={() => undefined} />,
    );

    expect(screen.getByRole('textbox', { name: 'Controlado' })).toHaveValue('165789');

    rerender(
      <NumberInput label="Controlado" decimalScale={2} value="165789,50" onValueChange={() => undefined} />,
    );

    expect(screen.getByRole('textbox', { name: 'Controlado' })).toHaveValue('165789,50');
  });
});
