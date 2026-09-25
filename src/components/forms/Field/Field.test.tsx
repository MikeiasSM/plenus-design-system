import { render, screen } from '@testing-library/react';
import { Field } from './Field';

function campo(props: Partial<Parameters<typeof Field>[0]> = {}) {
  return render(
    <Field label="CPF" {...props}>
      {({ describedBy, id, invalid }) => (
        <input aria-describedby={describedBy} aria-invalid={invalid || undefined} id={id} />
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
});
