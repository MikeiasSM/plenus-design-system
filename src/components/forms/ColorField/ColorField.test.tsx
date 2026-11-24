import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorField, normalizeHex } from './ColorField';

afterEach(() => {
  delete (window as unknown as { EyeDropper?: unknown }).EyeDropper;
});

describe('normalizeHex', () => {
  it('accepts short and long codes, with or without #', () => {
    expect(normalizeHex('#e85d1f')).toBe('#E85D1F');
    expect(normalizeHex('abc')).toBe('#AABBCC');
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('laranja')).toBeNull();
  });
});

describe('ColorField', () => {
  it('reports the normalized color only when the code is valid', async () => {
    const onValueChange = vi.fn();
    render(<ColorField label="Cor da marca" onValueChange={onValueChange} />);

    await userEvent.type(screen.getByLabelText('Cor da marca'), 'e85d1');
    expect(onValueChange).not.toHaveBeenCalledWith(expect.stringMatching(/^#/));

    await userEvent.type(screen.getByLabelText('Cor da marca'), 'f');
    expect(onValueChange).toHaveBeenLastCalledWith('#E85D1F');
  });

  it('takes the short code only when leaving the field, expanded', async () => {
    const onValueChange = vi.fn();
    render(<ColorField label="Cor da marca" onValueChange={onValueChange} />);
    const input = screen.getByLabelText('Cor da marca');

    await userEvent.type(input, 'e85');
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenLastCalledWith('#EE8855');
    expect(input).toHaveValue('#EE8855');
  });

  it('shows the format error only after leaving the field', async () => {
    render(<ColorField label="Cor da marca" />);
    const input = screen.getByLabelText('Cor da marca');

    await userEvent.type(input, '12');
    expect(screen.queryByText(/Use o código hexadecimal/)).toBeNull();

    fireEvent.blur(input);
    expect(screen.getByText('Use o código hexadecimal, como #E85D1F.')).toBeInTheDocument();
  });

  it('fills the field from a suggested swatch', async () => {
    const onValueChange = vi.fn();
    render(
      <ColorField
        label="Cor da marca"
        onValueChange={onValueChange}
        suggestions={[
          { color: '#E85D1F', label: 'Laranja do logo' },
          { color: '#2E2A26', label: 'Grafite do logo' },
        ]}
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: 'Grafite do logo' }));

    expect(onValueChange).toHaveBeenLastCalledWith('#2E2A26');
    expect(screen.getByLabelText('Cor da marca')).toHaveValue('#2E2A26');
    expect(screen.getByRole('radiogroup', { name: 'Cores sugeridas para Cor da marca' })).toBeInTheDocument();
  });

  it('hides the eyedropper where the browser has none', () => {
    render(<ColorField label="Cor da marca" />);

    expect(screen.queryByRole('button', { name: 'Pegar uma cor da tela' })).toBeNull();
  });

  it('uses the eyedropper where it exists', async () => {
    (window as unknown as { EyeDropper: unknown }).EyeDropper = class {
      open() {
        return Promise.resolve({ sRGBHex: '#49619c' });
      }
    };
    const onValueChange = vi.fn();
    render(<ColorField label="Cor da marca" onValueChange={onValueChange} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Pegar uma cor da tela' }));

    expect(onValueChange).toHaveBeenLastCalledWith('#49619C');
  });

  it('avisa null quando o código deixa de ser válido', async () => {
    const onValueChange = vi.fn();
    render(<ColorField label="Cor da marca" onValueChange={onValueChange} />);
    const input = screen.getByLabelText('Cor da marca');

    await userEvent.type(input, 'e85d1f');
    expect(onValueChange).toHaveBeenLastCalledWith('#E85D1F');

    await userEvent.type(input, '{Backspace}');
    expect(input).toHaveValue('e85d1');
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it('no modo controlado, limpar para null apaga também o rascunho inválido', async () => {
    const { rerender } = render(<ColorField label="Cor da marca" onValueChange={() => {}} value={null} />);
    const input = screen.getByLabelText('Cor da marca');

    await userEvent.type(input, 'e8');
    expect(input).toHaveValue('e8');

    rerender(<ColorField label="Cor da marca" onValueChange={() => {}} value={null} />);
    expect(input).toHaveValue('');
  });

  it('no modo controlado, a digitação não volta ao valor enquanto o código não vale', async () => {
    function Formulario() {
      const [cor, setCor] = useState<string | null>('#E85D1F');

      return (
        <>
          <ColorField label="Cor da marca" onValueChange={setCor} value={cor} />
          <output>{String(cor)}</output>
          <button onClick={() => setCor(null)} type="button">
            Limpar
          </button>
        </>
      );
    }

    render(<Formulario />);
    const input = screen.getByLabelText('Cor da marca');

    await userEvent.type(input, '{Backspace}{Backspace}');
    expect(input).toHaveValue('#E85D');
    expect(screen.getByRole('status')).toHaveTextContent('null');

    await userEvent.type(input, '2a');
    expect(screen.getByRole('status')).toHaveTextContent('#E85D2A');

    await userEvent.click(screen.getByRole('button', { name: 'Limpar' }));
    expect(input).toHaveValue('');
  });

  it.each([
    ['readOnly', { readOnly: true }],
    ['disabled', { disabled: true }],
  ])('com %s, nem as amostras nem o conta-gotas mudam a cor', async (_, estado) => {
    (window as unknown as { EyeDropper: unknown }).EyeDropper = class {
      open() {
        return Promise.resolve({ sRGBHex: '#49619c' });
      }
    };
    const onValueChange = vi.fn();
    render(
      <ColorField
        {...estado}
        defaultValue="#E85D1F"
        label="Cor da marca"
        onValueChange={onValueChange}
        suggestions={[
          { color: '#E85D1F', label: 'Laranja do logo' },
          { color: '#2E2A26', label: 'Grafite do logo' },
        ]}
      />,
    );

    const contaGotas = await screen.findByRole('button', { name: 'Pegar uma cor da tela' });
    expect(contaGotas).toBeDisabled();
    await userEvent.click(contaGotas);
    fireEvent.click(screen.getByRole('radio', { name: 'Grafite do logo' }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Cor da marca')).toHaveValue('#E85D1F');
    expect(screen.getByRole('radio', { name: 'Laranja do logo' })).toBeChecked();
  });

  it('não recria o campo quando o conta-gotas aparece, e o autoFocus fica', async () => {
    (window as unknown as { EyeDropper: unknown }).EyeDropper = class {
      open() {
        return Promise.resolve({ sRGBHex: '#49619c' });
      }
    };
    const campos = new Set<HTMLInputElement>();
    render(
      <ColorField autoFocus label="Cor da marca" ref={(campo) => void (campo && campos.add(campo))} />,
    );

    await screen.findByRole('button', { name: 'Pegar uma cor da tela' });

    expect(campos.size).toBe(1);
    expect(screen.getByLabelText('Cor da marca')).toHaveFocus();
  });

  it('as amostras e o conta-gotas acompanham o size do campo', async () => {
    (window as unknown as { EyeDropper: unknown }).EyeDropper = class {
      open() {
        return Promise.resolve({ sRGBHex: '#49619c' });
      }
    };
    render(<ColorField label="Cor da marca" size="lg" suggestions={[{ color: '#E85D1F', label: 'Laranja do logo' }]} />);

    const contaGotas = await screen.findByRole('button', { name: 'Pegar uma cor da tela' });
    expect(contaGotas.className).toMatch(/md/);
    expect(screen.getByRole('radiogroup').className).toMatch(/lg/);
  });

  it('mostra o formato esperado e só envia o texto no formulário', async () => {
    render(
      <form data-testid="formulario">
        <ColorField label="Cor da marca" name="cor" suggestions={[{ color: '#E85D1F', label: 'Laranja do logo' }]} />
      </form>,
    );

    expect(screen.getByLabelText('Cor da marca')).toHaveAttribute('placeholder', '#RRGGBB');

    await userEvent.click(screen.getByRole('radio', { name: 'Laranja do logo' }));

    const dados = new FormData(screen.getByTestId('formulario') as HTMLFormElement);
    expect([...dados.entries()]).toEqual([['cor', '#E85D1F']]);
  });
});
