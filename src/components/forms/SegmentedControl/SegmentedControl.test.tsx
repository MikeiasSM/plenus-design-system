import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { IconSearch } from '../../icons';
import { SegmentedControl } from './SegmentedControl';

const periodos = [
  { label: 'Dia', value: 'dia' },
  { label: 'Semana', value: 'semana' },
  { disabled: true, label: 'Mes', value: 'mes' },
];

describe('SegmentedControl', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('e um grupo de radios nomeado, com o valor inicial marcado', () => {
    render(<SegmentedControl defaultValue="semana" items={periodos} label="Periodo" />);

    expect(screen.getByRole('radiogroup', { name: 'Periodo' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Semana' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Mes' })).toBeDisabled();
  });

  it('controlado, avisa a escolha e segue o valor recebido', () => {
    const onValueChange = vi.fn();
    function Periodo() {
      const [value, setValue] = useState('dia');
      return (
        <SegmentedControl
          items={periodos}
          label="Periodo"
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
          value={value}
        />
      );
    }
    render(<Periodo />);

    fireEvent.click(screen.getByRole('radio', { name: 'Semana' }));

    expect(onValueChange).toHaveBeenCalledWith('semana');
    expect(screen.getByRole('radio', { name: 'Semana' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dia' })).not.toBeChecked();
  });

  it('so com icones, o label continua sendo o nome e aparece como dica no foco', () => {
    vi.useFakeTimers();
    render(
      <SegmentedControl
        iconOnly
        items={[
          { icon: <IconSearch />, label: 'Ver em lista', value: 'lista' },
          { icon: <IconSearch />, label: 'Ver em cartoes', value: 'cartoes' },
        ]}
        label="Visao"
      />,
    );

    act(() => {
      fireEvent.focus(screen.getByRole('radio', { name: 'Ver em cartoes' }));
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent('Ver em cartoes');
  });

  it('envia o valor escolhido no formulario pelo name', () => {
    render(
      <form data-testid="form">
        <SegmentedControl defaultValue="dia" items={periodos} label="Periodo" name="periodo" />
      </form>,
    );

    const dados = new FormData(screen.getByTestId('form') as HTMLFormElement);
    expect(dados.get('periodo')).toBe('dia');
  });
});
