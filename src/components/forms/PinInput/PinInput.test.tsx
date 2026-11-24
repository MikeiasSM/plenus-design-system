import { createRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import styles from './PinInput.module.css';
import { PinInput } from './PinInput';

function caixas(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(`.${styles.box}`));
}

function textoDasCaixas(container: HTMLElement) {
  return caixas(container)
    .map((caixa) => caixa.textContent)
    .join('');
}

describe('PinInput', () => {
  it('e um campo so, com rotulo e ajuda, e as caixas ficam fora da arvore acessivel', () => {
    const { container } = render(<PinInput hint="Enviado por mensagem." label="Codigo de verificacao" />);
    const campo = screen.getByRole('textbox', { name: 'Codigo de verificacao' });

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(campo).toHaveAccessibleDescription('Enviado por mensagem.');
    expect(campo).toHaveAttribute('autocomplete', 'one-time-code');
    expect(campo).toHaveAttribute('inputmode', 'numeric');
    expect(campo).not.toHaveAttribute('maxlength');
    expect(caixas(container)).toHaveLength(6);
    caixas(container).forEach((caixa) => expect(caixa).toHaveAttribute('aria-hidden', 'true'));
  });

  it('desenha nas caixas o que se digita, e a caixa da vez acompanha', async () => {
    const usuario = userEvent.setup();
    const { container } = render(<PinInput label="Codigo" length={4} />);
    const campo = screen.getByRole('textbox', { name: 'Codigo' });

    expect(caixas(container)[0]).toHaveClass(styles.current);

    await usuario.type(campo, '48');

    expect(campo).toHaveValue('48');
    expect(textoDasCaixas(container)).toBe('48');
    expect(caixas(container)[2]).toHaveClass(styles.current);
  });

  it('cola de uma vez, sem o separador, e corta o excesso', async () => {
    const usuario = userEvent.setup();
    const onChange = vi.fn();
    render(<PinInput label="Codigo" onChange={onChange} />);
    const campo = screen.getByRole('textbox', { name: 'Codigo' });

    await usuario.click(campo);
    await usuario.paste('482-913');

    expect(campo).toHaveValue('482913');
    expect(onChange).toHaveBeenLastCalledWith('482913');

    await usuario.clear(campo);
    await usuario.paste(' 1 2 3 4 5 6 7 8 ');

    expect(campo).toHaveValue('123456');
  });

  it('no numerico, descarta letras sem avisar a mudanca', async () => {
    const usuario = userEvent.setup();
    const onChange = vi.fn();
    render(<PinInput label="Codigo" onChange={onChange} />);
    const campo = screen.getByRole('textbox', { name: 'Codigo' });

    await usuario.type(campo, '1a');

    expect(campo).toHaveValue('1');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('no alfanumerico, aceita letras em maiusculas e descarta o resto', async () => {
    const usuario = userEvent.setup();
    const { container } = render(<PinInput label="Codigo de retirada" type="alphanumeric" />);
    const campo = screen.getByRole('textbox', { name: 'Codigo de retirada' });

    expect(campo).toHaveAttribute('autocomplete', 'off');
    expect(campo).toHaveAttribute('inputmode', 'text');

    await usuario.click(campo);
    await usuario.paste('k7q-2é_x9');

    expect(campo).toHaveValue('K7Q2X9');
    expect(textoDasCaixas(container)).toBe('K7Q2X9');
  });

  it('chama onComplete uma vez quando enche, e de novo so depois de esvaziar e encher', async () => {
    const usuario = userEvent.setup();
    const onComplete = vi.fn();
    render(<PinInput label="Codigo" length={4} onComplete={onComplete} />);
    const campo = screen.getByRole('textbox', { name: 'Codigo' });

    await usuario.type(campo, '123');
    expect(onComplete).not.toHaveBeenCalled();

    await usuario.type(campo, '45');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
    expect(campo).toHaveValue('1234');

    await usuario.type(campo, '{Backspace}9');
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenLastCalledWith('1239');
  });

  it('apaga com Backspace a partir do fim', async () => {
    const usuario = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<PinInput defaultValue="4829" label="Codigo" length={4} onChange={onChange} />);
    const campo = screen.getByRole('textbox', { name: 'Codigo' });

    await usuario.type(campo, '{Backspace}{Backspace}');

    expect(campo).toHaveValue('48');
    expect(onChange).toHaveBeenLastCalledWith('48');
    expect(textoDasCaixas(container)).toBe('48');
  });

  it('mantem o cursor no fim ao focar e ao clicar', () => {
    render(<PinInput defaultValue="4829" label="Codigo" />);
    const campo = screen.getByRole<HTMLInputElement>('textbox', { name: 'Codigo' });

    campo.setSelectionRange(1, 1);
    fireEvent.focus(campo);
    expect(campo.selectionStart).toBe(4);

    campo.setSelectionRange(0, 2);
    fireEvent.select(campo);
    expect([campo.selectionStart, campo.selectionEnd]).toEqual([4, 4]);

    campo.setSelectionRange(2, 2);
    fireEvent.click(campo);
    expect(campo.selectionStart).toBe(4);
  });

  it('com mask, as caixas mostram pontos e o valor continua o codigo', () => {
    const { container } = render(<PinInput defaultValue="1234" label="Codigo" mask />);

    expect(screen.getByRole('textbox', { name: 'Codigo' })).toHaveValue('1234');
    expect(textoDasCaixas(container)).toBe('••••');
  });

  it('com groups, desenha o traco entre os grupos sem mudar o valor', async () => {
    const usuario = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<PinInput groups={[3, 3]} label="Codigo" onChange={onChange} />);
    const separadores = container.querySelectorAll(`.${styles.separator}`);

    expect(separadores).toHaveLength(1);
    expect(separadores[0]).toHaveAttribute('aria-hidden', 'true');
    expect(separadores[0].previousElementSibling).toBe(caixas(container)[2]);

    await usuario.click(screen.getByRole('textbox', { name: 'Codigo' }));
    await usuario.paste('482913');

    expect(onChange).toHaveBeenLastCalledWith('482913');
  });

  it('ignora o grupo que passa do comprimento', () => {
    const { container } = render(<PinInput groups={[2, 2, 9]} label="Codigo" length={4} />);

    expect(container.querySelectorAll(`.${styles.separator}`)).toHaveLength(1);
    expect(caixas(container)).toHaveLength(4);
  });

  it('liga o erro ao campo e pinta as caixas de perigo', () => {
    const { container } = render(<PinInput error="Codigo incorreto." label="Codigo" required />);
    const campo = screen.getByRole('textbox', { name: /Codigo/ });

    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toBeRequired();
    expect(campo).toHaveAccessibleDescription('Codigo incorreto.');
    expect(screen.getByRole('alert')).toHaveTextContent('Codigo incorreto.');
    expect(container.querySelector(`.${styles.root}`)).toHaveClass(styles.invalid);
  });

  it('desabilitado, nao aceita digitacao', async () => {
    const usuario = userEvent.setup();
    const { container } = render(<PinInput disabled label="Codigo" />);
    const campo = screen.getByRole('textbox', { name: 'Codigo' });

    await usuario.type(campo, '12');

    expect(campo).toBeDisabled();
    expect(campo).toHaveValue('');
    expect(container.querySelector(`.${styles.root}`)).toHaveClass(styles.disabled);
  });

  it('controlado, mostra o value filtrado e so muda pelo dono', async () => {
    const usuario = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<PinInput label="Codigo" onChange={onChange} value="12-34" />);
    const campo = screen.getByRole('textbox', { name: 'Codigo' });

    expect(campo).toHaveValue('1234');

    await usuario.type(campo, '5');

    expect(onChange).toHaveBeenLastCalledWith('12345');
    expect(campo).toHaveValue('1234');

    rerender(<PinInput label="Codigo" onChange={onChange} value="" />);
    expect(campo).toHaveValue('');
  });

  it('controlado com estado, acompanha a digitacao e chama onComplete uma vez', async () => {
    const usuario = userEvent.setup();
    const onComplete = vi.fn();

    function Controlado() {
      const [codigo, setCodigo] = useState('');

      return <PinInput label="Codigo" length={4} onChange={setCodigo} onComplete={onComplete} value={codigo} />;
    }

    render(<Controlado />);
    const campo = screen.getByRole('textbox', { name: 'Codigo' });

    await usuario.type(campo, '123456');

    expect(campo).toHaveValue('1234');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('nao controlado, parte do defaultValue filtrado e vai ao envio pelo name', () => {
    render(
      <form data-testid="formulario">
        <PinInput defaultValue="48a2" label="Codigo" name="codigo" />
      </form>,
    );

    expect(screen.getByRole('textbox', { name: 'Codigo' })).toHaveValue('482');
    expect(new FormData(screen.getByTestId('formulario') as HTMLFormElement).get('codigo')).toBe('482');
  });

  it('entrega o input ao ref', () => {
    const referencia = createRef<HTMLInputElement>();
    render(<PinInput label="Codigo" ref={referencia} />);

    expect(referencia.current).toBe(screen.getByRole('textbox', { name: 'Codigo' }));
  });

  it('sem rotulo, tem o nome padrao com o tamanho e o tipo do codigo', () => {
    const { rerender } = render(<PinInput length={4} />);

    expect(screen.getByRole('textbox', { name: 'Código de 4 dígitos' })).toBeInTheDocument();

    rerender(<PinInput length={8} type="alphanumeric" />);
    expect(screen.getByRole('textbox', { name: 'Código de 8 caracteres' })).toBeInTheDocument();

    rerender(<PinInput aria-label="Código de retirada" />);
    expect(screen.getByRole('textbox', { name: 'Código de retirada' })).toBeInTheDocument();
  });

  it('com rotulo, nao ganha aria-label', () => {
    render(<PinInput label="Codigo" />);

    expect(screen.getByRole('textbox', { name: 'Codigo' })).not.toHaveAttribute('aria-label');
  });
});
