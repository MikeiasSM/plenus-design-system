import { fireEvent, render, screen } from '@testing-library/react';
import { RadioGroup } from './RadioGroup';
import { Radio } from './Radio';
import styles from './RadioGroup.module.css';

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

  it('e vertical por padrao e, com orientation horizontal, poe as opcoes lado a lado com quebra de linha', () => {
    render(
      <>
        <RadioGroup label="Padrao">
          <Radio label="A" value="a" />
        </RadioGroup>
        <RadioGroup label="Lado a lado" orientation="horizontal">
          <Radio label="B" value="b" />
          <Radio label="C" value="c" />
        </RadioGroup>
      </>,
    );

    const padrao = screen.getByRole('radio', { name: 'A' }).closest('div[class*="options"]')!;
    const horizontal = screen.getByRole('radio', { name: 'B' }).closest('div[class*="options"]')!;
    expect(padrao.className).toContain('vertical');
    expect(horizontal.className).toContain('horizontal');
    expect(horizontal.className).not.toContain('vertical');
  });

  it('com orientation horizontal o grupo continua um radiogroup e a escolha segue trocando a opcao marcada', () => {
    render(
      <RadioGroup label="Tipo de pessoa" defaultValue="fisica" orientation="horizontal">
        <Radio label="Fisica" value="fisica" />
        <Radio label="Juridica" value="juridica" />
      </RadioGroup>,
    );

    expect(screen.getByRole('radiogroup', { name: /Tipo de pessoa/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Juridica' }));
    expect(screen.getByRole('radio', { name: 'Juridica' })).toBeChecked();
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

  it('describes each option by its description, keeping the name to the label', () => {
    render(
      <RadioGroup hint="Pode mudar depois." label="Plano">
        <Radio description="Cobrança todo mês." label="Mensal" value="mensal" />
        <Radio label="Anual" value="anual" />
      </RadioGroup>,
    );

    const mensal = screen.getByRole('radio', { name: 'Mensal' });

    expect(mensal).toHaveAccessibleDescription('Cobrança todo mês.');
    expect(screen.getByRole('radio', { name: 'Anual' })).not.toHaveAttribute('aria-describedby');

    fireEvent.click(screen.getByText('Cobrança todo mês.'));

    expect(mensal).toBeChecked();
  });

  it('card: each option is a card that stays a native radio, clickable as a whole', () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup label="Plano" onValueChange={onValueChange} variant="card">
        <Radio description="Cobrança todo mês." label="Mensal" value="mensal" />
        <Radio description="Dois meses de desconto." label="Anual" value="anual" />
      </RadioGroup>,
    );

    const anual = screen.getByRole('radio', { name: 'Anual' });
    const cartao = anual.closest('label')!;

    expect(anual).toHaveAttribute('type', 'radio');
    expect(cartao).toHaveClass(styles.card!);
    expect(cartao.parentElement).toHaveClass(styles.cardOptions!);
    expect(cartao.querySelectorAll('a, button, [tabindex]')).toHaveLength(0);

    fireEvent.click(cartao);

    expect(anual).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith('anual');
  });

  it('without variant, draws the options as before', () => {
    render(
      <RadioGroup label="Plano">
        <Radio label="Mensal" value="mensal" />
      </RadioGroup>,
    );

    const rotulo = screen.getByRole('radio', { name: 'Mensal' }).closest('label')!;

    expect(rotulo.className).toBe(styles.control);
    expect(rotulo.parentElement!.className).not.toContain(styles.cardOptions!);
  });

  it('labelAddon sits next to the legend text and stays out of the group name', () => {
    render(
      <RadioGroup label="Forma de pagamento" labelAddon={<button type="button">Saiba mais</button>} required>
        <Radio label="Pix" value="pix" />
      </RadioGroup>,
    );

    const grupo = screen.getByRole('radiogroup', { name: 'Forma de pagamento' });
    const ajuda = screen.getByRole('button', { name: 'Saiba mais' });

    expect(ajuda.closest('legend')).toBe(grupo.querySelector('legend'));
    expect(grupo).toHaveAttribute('aria-labelledby');
  });

  it('labelAddon keeps the name the consumer gives the group', () => {
    render(
      <>
        <span id="fora">Pagamento</span>
        <RadioGroup aria-labelledby="fora" label="Forma de pagamento" labelAddon={<span>Opcional</span>}>
          <Radio label="Pix" value="pix" />
        </RadioGroup>
      </>,
    );

    expect(screen.getByRole('radiogroup', { name: 'Pagamento' })).toBeInTheDocument();
  });
});
