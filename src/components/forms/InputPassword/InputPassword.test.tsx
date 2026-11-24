import { fireEvent, render, screen } from '@testing-library/react';
import styles from './InputPassword.module.css';
import { InputPassword } from './InputPassword';

describe('InputPassword', () => {
  it('starts hidden and toggles visibility accessibly', () => {
    render(<InputPassword label="Senha" />);

    const input = screen.getByLabelText('Senha');
    const toggle = screen.getByRole('button', { name: 'Mostrar senha' });

    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).not.toHaveAttribute('aria-pressed');

    fireEvent.click(toggle);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveTextContent('Ocultar');
  });

  it('preserves native password behavior and autocomplete', () => {
    render(<InputPassword label="Nova senha" autoComplete="new-password" />);

    expect(screen.getByLabelText('Nova senha')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('supports errors without publishing the password length', () => {
    render(<InputPassword label="Senha" error="Senha obrigatoria." maxLength={20} />);

    const input = screen.getByLabelText('Senha');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Senha obrigatoria.');
    expect(screen.queryByText(/\/20/)).not.toBeInTheDocument();
  });

  it('hides the password again when the form is submitted', () => {
    render(
      <form>
        <InputPassword label="Senha" defaultValue="segredo" />
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');

    fireEvent.submit(screen.getByLabelText('Senha').closest('form')!);

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
  });

  it('supports hiding the toggle', () => {
    render(<InputPassword label="Senha" showToggle={false} />);

    expect(screen.queryByRole('button', { name: 'Mostrar senha' })).not.toBeInTheDocument();
  });

  it('prevents copying and cutting by default while allowing paste', () => {
    render(<InputPassword label="Senha" />);

    const input = screen.getByLabelText('Senha');
    const copyEvent = new Event('copy', { bubbles: true, cancelable: true });
    const cutEvent = new Event('cut', { bubbles: true, cancelable: true });

    expect(input.dispatchEvent(copyEvent)).toBe(false);
    expect(input.dispatchEvent(cutEvent)).toBe(false);
  });

  it('allows copying when explicitly enabled', () => {
    render(<InputPassword label="Senha" allowCopy />);

    const input = screen.getByLabelText('Senha');
    const copyEvent = new Event('copy', { bubbles: true, cancelable: true });

    expect(input.dispatchEvent(copyEvent)).toBe(true);
  });

  it('validates on blur and exposes the custom message accessibly', () => {
    const onValidationChange = vi.fn();
    render(
      <InputPassword
        label="Senha"
        validate={(password) => password.length < 8 ? 'Use ao menos 8 caracteres.' : undefined}
        onValidationChange={onValidationChange}
      />,
    );

    const input = screen.getByLabelText('Senha');
    fireEvent.blur(input);

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Use ao menos 8 caracteres.')).toBeInTheDocument();
    expect(onValidationChange).toHaveBeenCalledWith('Use ao menos 8 caracteres.');
  });

  it('validates on every change when blur validation is disabled', () => {
    const validate = vi.fn(() => 'Senha invalida.');
    render(<InputPassword label="Senha" validate={validate} validateOnBlur={false} />);

    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'abc' } });

    expect(validate).toHaveBeenCalledWith('abc');
    expect(screen.getByText('Senha invalida.')).toBeInTheDocument();
  });

  it('disables the visibility toggle together with the field', () => {
    render(<InputPassword label="Senha" disabled />);

    expect(screen.getByLabelText('Senha')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toBeDisabled();
  });

  it('entrega o texto por onValueChange, ao lado do onChange nativo', () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(<InputPassword label="Senha" onChange={onChange} onValueChange={onValueChange} />);

    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('segredo');
  });

  it('so reserva o espaco do botao quando ele aparece', () => {
    const { rerender } = render(<InputPassword label="Senha" />);

    expect(screen.getByLabelText('Senha')).toHaveClass(styles.withToggle!);

    rerender(<InputPassword label="Senha" showToggle={false} />);

    expect(screen.getByLabelText('Senha')).not.toHaveClass(styles.withToggle!);
  });

  it('repassa o complemento do rotulo e o aside ao Field, fora do nome e da descricao', () => {
    render(
      <InputPassword
        aside={<button type="button">Gerar</button>}
        hint="Minimo de 8 caracteres."
        label="Senha"
        labelAddon={<a href="#recuperar">Esqueci a senha</a>}
      />,
    );

    const input = screen.getByLabelText('Senha');

    expect(input).toHaveAccessibleName('Senha');
    expect(input).toHaveAccessibleDescription('Minimo de 8 caracteres.');
    expect(screen.getByRole('link', { name: 'Esqueci a senha' }).closest('label')).toBeNull();
    expect(screen.getByRole('button', { name: 'Gerar' })).toBeInTheDocument();
  });
});
