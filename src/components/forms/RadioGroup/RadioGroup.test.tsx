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

  it('keeps the consumer description next to its own', () => {
    render(
      <>
        <span id="fora">Aparece na fatura</span>
        <RadioGroup aria-describedby="fora" hint="Escolha uma." label="Forma de pagamento">
          <Radio label="Pix" value="pix" />
        </RadioGroup>
      </>,
    );

    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Aparece na fatura Escolha uma.');
  });

  it('does not share the message id between groups with the same name', () => {
    render(
      <>
        <RadioGroup hint="Primeiro" label="A" name="forma">
          <Radio label="Pix" value="pix" />
        </RadioGroup>
        <RadioGroup hint="Segundo" label="B" name="forma">
          <Radio label="Boleto" value="boleto" />
        </RadioGroup>
      </>,
    );

    const [primeiro, segundo] = screen.getAllByRole('radiogroup');

    expect(primeiro).toHaveAccessibleDescription('Primeiro');
    expect(segundo).toHaveAccessibleDescription('Segundo');
  });

  it('blocks an empty required group on submit and marks the error', () => {
    render(
      <form data-testid="formulario">
        <RadioGroup error="Escolha uma opcao." label="Forma de pagamento" required>
          <Radio label="Pix" value="pix" />
          <Radio label="Boleto" value="boleto" />
        </RadioGroup>
      </form>,
    );

    expect((screen.getByTestId('formulario') as HTMLFormElement).checkValidity()).toBe(false);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');

    fireEvent.click(screen.getByRole('radio', { name: 'Pix' }));

    expect((screen.getByTestId('formulario') as HTMLFormElement).checkValidity()).toBe(true);
  });
});
