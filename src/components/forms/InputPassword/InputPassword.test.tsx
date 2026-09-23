import { fireEvent, render, screen } from '@testing-library/react';
import { InputPassword } from './InputPassword';

describe('InputPassword', () => {
  it('starts hidden and toggles visibility accessibly', () => {
    render(<InputPassword label="Senha" />);

    const input = screen.getByLabelText('Senha');
    const toggle = screen.getByRole('button', { name: 'Mostrar senha' });

    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('preserves native password behavior and autocomplete', () => {
    render(<InputPassword label="Nova senha" autoComplete="new-password" />);

    expect(screen.getByLabelText('Nova senha')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('supports errors and character count', () => {
    render(<InputPassword label="Senha" error="Senha obrigatoria." maxLength={20} showCharacterCount />);

    const input = screen.getByLabelText('Senha');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Senha obrigatoria. 0/20');
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
});
