import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ColorPicker } from './ColorPicker';

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
      fireEvent.focus(screen.getByRole('radio', { name: 'Vermelho' }));
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

  it('disables every swatch', () => {
    render(<ColorPicker defaultOption={{}} disabled label="Cor do texto" options={cores} />);

    screen.getAllByRole('radio').forEach((amostra) => expect(amostra).toBeDisabled());
  });
});
