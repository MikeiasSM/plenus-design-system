import { act, fireEvent, render, screen } from '@testing-library/react';
import { InputNumber } from './InputNumber';

function typeKeys(input: HTMLElement, keys: string) {
  for (const key of keys) {
    fireEvent.change(input, { target: { value: (input as HTMLInputElement).value + key } });
  }
}

describe('InputNumber', () => {
  it('accepts integer values only by default', () => {
    render(<InputNumber label="Quantidade" />);

    const input = screen.getByRole('textbox', { name: 'Quantidade' });
    fireEvent.change(input, { target: { value: '12,50' } });

    expect(input).toHaveValue('12');
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('blocks decimal separators in integer mode', () => {
    render(<InputNumber label="Quantidade" />);

    const input = screen.getByRole('textbox', { name: 'Quantidade' });
    const commaEvent = new KeyboardEvent('keydown', { key: ',', bubbles: true, cancelable: true });
    const dotEvent = new KeyboardEvent('keydown', { key: '.', bubbles: true, cancelable: true });

    expect(input.dispatchEvent(commaEvent)).toBe(false);
    expect(input.dispatchEvent(dotEvent)).toBe(false);
    // O hifen entra no padrão: o formatador aceita negativo, e o padrão barrava
    // no envio o que o campo deixava digitar.
    expect(input).toHaveAttribute('pattern', '-?[0-9]*');
  });

  it('preserves the comma and limits decimal places', () => {
    render(<InputNumber label="Percentual" decimalScale={2} />);

    const input = screen.getByRole('textbox', { name: 'Percentual' });
    fireEvent.change(input, { target: { value: '165789,507' } });

    expect(input).toHaveValue('165789,50');
    expect(input).toHaveAttribute('inputmode', 'decimal');
  });

  it('emits the value as a number', () => {
    const onValueChange = vi.fn();
    render(<InputNumber label="Valor" decimalScale={2} onValueChange={onValueChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Valor' }), {
      target: { value: '1234,5' },
    });

    expect(onValueChange).toHaveBeenCalledWith(1234.5);
  });

  it('reads numeric values using the Brazilian decimal convention', () => {
    render(<InputNumber label="Quantidade" decimalScale={2} value={12.34} onValueChange={() => undefined} />);

    expect(screen.getByRole('textbox', { name: 'Quantidade' })).toHaveValue('12,34');
  });

  it('supports controlled values', () => {
    const { rerender } = render(
      <InputNumber label="Controlado" decimalScale={2} value={165789} onValueChange={() => undefined} />,
    );

    expect(screen.getByRole('textbox', { name: 'Controlado' })).toHaveValue('165789');

    rerender(
      <InputNumber label="Controlado" decimalScale={2} value={165789.5} onValueChange={() => undefined} />,
    );

    expect(screen.getByRole('textbox', { name: 'Controlado' })).toHaveValue('165789,5');
  });

  it('keeps typed thousands separators from turning into decimals', () => {
    const onValueChange = vi.fn();
    render(<InputNumber label="Valor" decimalScale={2} onValueChange={onValueChange} />);

    typeKeys(screen.getByRole('textbox', { name: 'Valor' }), '1.234.567');

    expect(onValueChange).toHaveBeenLastCalledWith(1234567);
  });

  it('settles an undecided dot as the decimal comma on blur', () => {
    render(<InputNumber label="Valor" decimalScale={2} />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    typeKeys(input, '12.5');

    expect(input).toHaveValue('12.5');

    fireEvent.blur(input);

    expect(input).toHaveValue('12,5');
  });

  it('reads a pasted pt-BR text as a number', () => {
    const onValueChange = vi.fn();
    render(<InputNumber label="Valor" decimalScale={2} onValueChange={onValueChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Valor' }), { target: { value: '1.234.567,89' } });

    expect(onValueChange).toHaveBeenLastCalledWith(1234567.89);
  });

  it('emits null when the field is cleared', () => {
    const onValueChange = vi.fn();
    render(<InputNumber label="Valor" defaultValue={10} onValueChange={onValueChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Valor' }), { target: { value: '' } });

    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it('emits null while the text has no valid number yet', () => {
    const onValueChange = vi.fn();
    render(<InputNumber label="Valor" defaultValue={5} onValueChange={onValueChange} />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.change(input, { target: { value: '-' } });

    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(input).toHaveValue('-');

    fireEvent.change(input, { target: { value: '-7' } });

    expect(onValueChange).toHaveBeenLastCalledWith(-7);
  });

  it('keeps a trailing comma while typing', () => {
    const onValueChange = vi.fn();
    render(<InputNumber label="Valor" decimalScale={2} value={null} onValueChange={onValueChange} />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.change(input, { target: { value: '12,' } });

    expect(onValueChange).toHaveBeenLastCalledWith(12);
  });

  it('shows the controlled value again when the consumer refuses the change', () => {
    render(<InputNumber label="Valor" value={10} onValueChange={() => undefined} />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.change(input, { target: { value: '105' } });

    expect(input).toHaveValue('10');
  });

  it('shows an empty controlled null', () => {
    render(<InputNumber label="Valor" value={null} onValueChange={() => undefined} />);

    expect(screen.getByRole('textbox', { name: 'Valor' })).toHaveValue('');
  });

  it('starts from the default value and follows typing when uncontrolled', () => {
    render(<InputNumber label="Valor" decimalScale={2} defaultValue={1.5} />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    expect(input).toHaveValue('1,5');

    fireEvent.change(input, { target: { value: '2,25' } });

    expect(input).toHaveValue('2,25');
  });

  it('submits the number with a decimal point and resets to the default value', () => {
    render(
      <form data-testid="form">
        <InputNumber label="Valor" name="valor" decimalScale={2} defaultValue={10.5} />
      </form>,
    );

    const form = screen.getByTestId('form') as HTMLFormElement;
    fireEvent.change(screen.getByRole('textbox', { name: 'Valor' }), { target: { value: '1.234,5' } });

    expect(new FormData(form).get('valor')).toBe('1234.5');

    act(() => form.reset());

    expect(new FormData(form).get('valor')).toBe('10.5');
    expect(screen.getByRole('textbox', { name: 'Valor' })).toHaveValue('10,5');
  });

  it('submits an empty text when there is no value', () => {
    render(
      <form data-testid="form">
        <InputNumber label="Valor" name="valor" />
      </form>,
    );

    expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('valor')).toBe('');
  });
});
