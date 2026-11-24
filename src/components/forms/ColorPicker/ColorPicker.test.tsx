import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ColorPicker } from './ColorPicker';
import { regrasDaFolha } from '../../../test/folha';

const cores = [
  { color: '#C0392B', label: 'Vermelho', value: 'vermelho' },
  { color: '#2C6DB5', label: 'Azul', value: 'azul' },
];

describe('ColorPicker', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is a named group of radios, each named by its label', () => {
    render(<ColorPicker defaultValue="azul" label="Cor do texto" options={cores} />);

    expect(screen.getByRole('radiogroup', { name: 'Cor do texto' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Azul' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Vermelho' })).not.toBeChecked();
  });

  it('controlled, reports the choice and follows the received value', () => {
    const onValueChange = vi.fn();
    function CorDoTexto() {
      const [cor, setCor] = useState<string | null>('vermelho');
      return (
        <ColorPicker
          defaultOption={{}}
          label="Cor do texto"
          onValueChange={(next) => {
            onValueChange(next);
            setCor(next);
          }}
          options={cores}
          value={cor}
        />
      );
    }
    render(<CorDoTexto />);

    fireEvent.click(screen.getByRole('radio', { name: 'Azul' }));

    expect(onValueChange).toHaveBeenLastCalledWith('azul');
    expect(screen.getByRole('radio', { name: 'Azul' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Vermelho' })).not.toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'Padrão' }));

    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('radio', { name: 'Padrão' })).toBeChecked();
  });

  it('the default option comes first, with its own name, and stands for null', () => {
    render(<ColorPicker defaultOption={{ label: 'Automática' }} defaultValue={null} label="Cor do texto" options={cores} />);

    const [primeira] = screen.getAllByRole('radio');

    expect(primeira).toHaveAccessibleName('Automática');
    expect(primeira).toBeChecked();
  });

  it('shows the name of the swatch as a tooltip on focus', () => {
    vi.useFakeTimers();
    render(<ColorPicker label="Cor do texto" options={cores} />);

    act(() => {
      fireEvent.keyDown(document.body, { key: 'Tab' });
      screen.getByRole('radio', { name: 'Vermelho' }).focus();
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent('Vermelho');
  });

  it('sends the chosen value in the form, empty for the default option', () => {
    const { unmount } = render(
      <form data-testid="form">
        <ColorPicker defaultValue="azul" label="Cor do texto" name="cor" options={cores} />
      </form>,
    );

    expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('cor')).toBe('azul');

    unmount();
    render(
      <form data-testid="form">
        <ColorPicker defaultOption={{}} label="Cor do texto" name="cor" options={cores} value={null} />
      </form>,
    );

    expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('cor')).toBe('');
  });

  it('com form, a escolha vai ao formulário desse id, e não ao que envolve o grupo', () => {
    render(
      <>
        <form data-testid="fora" id="outro-formulario" />
        <form data-testid="em-volta">
          <ColorPicker defaultValue="azul" form="outro-formulario" label="Cor do texto" name="cor" options={cores} />
        </form>
      </>,
    );

    expect(new FormData(screen.getByTestId('em-volta') as HTMLFormElement).get('cor')).toBeNull();
    expect(new FormData(screen.getByTestId('fora') as HTMLFormElement).get('cor')).toBe('azul');
  });

  it('disables every swatch', () => {
    render(<ColorPicker defaultOption={{}} disabled label="Cor do texto" options={cores} />);

    screen.getAllByRole('radio').forEach((amostra) => expect(amostra).toBeDisabled());
  });
});

describe('ColorPicker: variaveis de aparencia', () => {
  const regras = regrasDaFolha('src/components/forms/ColorPicker/ColorPicker.module.css');

  it('le o tamanho da amostra em --pl-color-picker-size, com o tamanho de cada medida como padrao', () => {
    expect(regras.get('.swatch')).toMatchObject({
      width: 'var(--pl-color-picker-size, var(--color-picker-size))',
      height: 'var(--pl-color-picker-size, var(--color-picker-size))',
    });
    expect(regras.get('.sm')).toMatchObject({ '--color-picker-size': '20px' });
    expect(regras.get('.md')).toMatchObject({ '--color-picker-size': '28px' });
    expect(regras.get('.lg')).toMatchObject({ '--color-picker-size': '36px' });
  });

  it('le o espaco entre as amostras em --pl-color-picker-gap, com o espaco de cada medida como padrao', () => {
    expect(regras.get('.sm')).toMatchObject({ gap: 'var(--pl-color-picker-gap, var(--pl-space-2))' });
    expect(regras.get('.md')).toMatchObject({ gap: 'var(--pl-color-picker-gap, var(--pl-space-3))' });
    expect(regras.get('.lg')).toMatchObject({ gap: 'var(--pl-color-picker-gap, var(--pl-space-3))' });
  });

  it('nunca declara as variaveis publicas: o produto as define em qualquer ancestral', () => {
    for (const declaracoes of regras.values()) {
      expect(Object.keys(declaracoes)).not.toContain('--pl-color-picker-size');
      expect(Object.keys(declaracoes)).not.toContain('--pl-color-picker-gap');
    }
  });
});
