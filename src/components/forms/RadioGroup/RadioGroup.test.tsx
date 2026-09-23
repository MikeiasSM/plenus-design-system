import { fireEvent, render, screen } from '@testing-library/react';
import { RadioGroup } from './RadioGroup';
import { Radio } from './Radio';

describe('RadioGroup', () => {
  it('names the group and shares a single name across options', () => {
    render(
      <RadioGroup label="Forma de pagamento" defaultValue="pix">
        <Radio label="Pix" value="pix" />
        <Radio label="Boleto" value="boleto" />
      </RadioGroup>,
    );

    expect(screen.getByRole('radiogroup', { name: /Forma de pagamento/ })).toBeInTheDocument();

    const pix = screen.getByRole('radio', { name: 'Pix' }) as HTMLInputElement;
    const boleto = screen.getByRole('radio', { name: 'Boleto' }) as HTMLInputElement;

    expect(pix).toBeChecked();
    expect(pix.name).toBe(boleto.name);
  });

  it('reports the chosen value to the product', () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup label="Forma de pagamento" value="pix" onValueChange={onValueChange}>
        <Radio label="Pix" value="pix" />
        <Radio label="Boleto" value="boleto" />
      </RadioGroup>,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Boleto' }));

    expect(onValueChange).toHaveBeenCalledWith('boleto');
  });

  it('propagates the group disabled state and describes errors', () => {
    render(
      <RadioGroup label="Forma de pagamento" error="Escolha uma opcao." disabled>
        <Radio label="Pix" value="pix" />
      </RadioGroup>,
    );

    expect(screen.getByRole('radio', { name: 'Pix' })).toBeDisabled();
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Escolha uma opcao.');
  });

  it('fails loudly when a Radio is rendered outside a group', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Radio label="Pix" value="pix" />)).toThrow(/dentro de RadioGroup/);

    erro.mockRestore();
  });
});
