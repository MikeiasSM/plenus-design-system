import { render, screen } from '@testing-library/react';
import { Field } from './Field';
import styles from './Field.module.css';

function campo(props: Partial<Parameters<typeof Field>[0]> = {}) {
  return render(
    <Field label="CPF" {...props}>
      {({ className, describedBy, id, invalid }) => (
        <input aria-describedby={describedBy} aria-invalid={invalid || undefined} className={className} id={id} />
      )}
    </Field>,
  );
}

describe('Field', () => {
  it('liga o rotulo ao controle sem que quem o usa precise inventar um id', () => {
    campo();

    expect(screen.getByLabelText('CPF')).toBeInTheDocument();
  });

  it('respeita o id informado, para o consumidor manter o proprio', () => {
    campo({ id: 'documento' });

    expect(screen.getByLabelText('CPF')).toHaveAttribute('id', 'documento');
  });

  it('descreve o controle pela ajuda', () => {
    campo({ hint: 'Somente numeros' });

    expect(screen.getByLabelText('CPF')).toHaveAccessibleDescription('Somente numeros');
  });

  it('troca a ajuda pelo erro e marca o controle como invalido', () => {
    campo({ error: 'CPF invalido', hint: 'Somente numeros' });

    const controle = screen.getByLabelText('CPF');

    expect(controle).toHaveAccessibleDescription('CPF invalido');
    expect(controle).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Somente numeros')).toBeNull();
  });

  it('preserva a descricao que o consumidor ja tinha, em vez de substitui-la', () => {
    render(
      <Field aria-describedby="fora" hint="Somente numeros" label="CPF">
        {({ describedBy, id }) => <input aria-describedby={describedBy} id={id} />}
      </Field>,
    );

    render(<span id="fora">Vindo de fora</span>);

    expect(screen.getByLabelText('CPF').getAttribute('aria-describedby')).toMatch(/^fora /);
  });

  it('conta os caracteres contra o limite quando pedido', () => {
    campo({ characterCount: 7, maxLength: 11, showCharacterCount: true });

    expect(screen.getByText('7/11')).toBeInTheDocument();
    expect(screen.getByLabelText('CPF')).toHaveAccessibleDescription('7/11');
  });

  it('dispensa o rotulo, para o campo que se nomeia por conta propria', () => {
    render(
      <Field>
        {({ id }) => <input aria-label="Busca" id={id} />}
      </Field>,
    );

    expect(screen.getByLabelText('Busca')).toBeInTheDocument();
    expect(screen.queryByText('CPF')).toBeNull();
  });

  it('anuncia o erro que aparece depois, e nao a ajuda', () => {
    const campo = (erro?: string) => (
      <Field error={erro} hint="Somente numeros" label="CPF">
        {({ describedBy, id }) => <input aria-describedby={describedBy} id={id} />}
      </Field>
    );
    const { rerender } = render(campo());

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(campo('CPF invalido.'));

    expect(screen.getByRole('alert')).toHaveTextContent('CPF invalido.');
  });

  it('entrega ao controle o visual dos campos, no tamanho pedido e com o erro', () => {
    campo({ error: 'CPF invalido.', size: 'sm' });

    expect(screen.getByRole('textbox', { name: 'CPF' })).toHaveClass(styles.control!, styles.sm!, styles.invalid!);
  });

  it('entrega o tamanho grande', () => {
    campo({ size: 'lg' });

    expect(screen.getByRole('textbox', { name: 'CPF' })).toHaveClass(styles.control!, styles.lg!);
  });

  it('poe o complemento ao lado do rotulo, fora dele e fora do nome do campo', () => {
    campo({ labelAddon: <button type="button">Ajuda</button> });

    const controle = screen.getByRole('textbox', { name: 'CPF' });
    const ajuda = screen.getByRole('button', { name: 'Ajuda' });

    expect(ajuda.closest('label')).toBeNull();
    expect(ajuda.parentElement).toBe(screen.getByText('CPF').closest('label')!.parentElement);
    expect(controle).not.toHaveAccessibleDescription(expect.stringContaining('Ajuda'));
  });

  it('mostra o complemento mesmo sem rotulo', () => {
    render(<Field labelAddon={<span>Opcional</span>}>{({ id }) => <input aria-label="Busca" id={id} />}</Field>);

    expect(screen.getByText('Opcional')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Busca' })).toBeInTheDocument();
  });

  it('sem complemento, o rotulo continua filho direto do campo', () => {
    const { container } = campo();

    expect(screen.getByText('CPF').closest('label')!.parentElement).toBe(container.firstElementChild);
  });

  it('poe o aside na linha do controle, com a mensagem abaixo dos dois e fora da descricao', () => {
    campo({ aside: <button type="button">Buscar CEP</button>, error: 'CPF invalido.', hint: 'Somente numeros' });

    const controle = screen.getByRole('textbox', { name: 'CPF' });
    const botao = screen.getByRole('button', { name: 'Buscar CEP' });
    const linha = controle.parentElement!.parentElement!;

    expect(linha).toContainElement(botao);
    expect(linha).not.toContainElement(screen.getByRole('alert'));
    expect(controle).toHaveAccessibleDescription('CPF invalido.');
    expect(linha.nextElementSibling).toBe(screen.getByRole('alert'));
  });
});
