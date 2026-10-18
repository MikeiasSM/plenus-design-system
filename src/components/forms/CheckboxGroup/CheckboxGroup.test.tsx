import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from '../Checkbox';
import { CheckboxGroup } from './CheckboxGroup';

function Canais({ onValueChange }: { onValueChange?: (values: string[]) => void }) {
  const [canais, setCanais] = useState<string[]>(['web']);

  return (
    <CheckboxGroup
      label="Canais"
      onValueChange={(values) => {
        onValueChange?.(values);
        setCanais(values);
      }}
      value={canais}
    >
      <Checkbox label="Web" value="web" />
      <Checkbox label="E-mail" value="email" />
    </CheckboxGroup>
  );
}

describe('CheckboxGroup', () => {
  it('names the group by its legend and shares the name across the boxes', () => {
    render(
      <CheckboxGroup defaultValue={['web']} label="Canais">
        <Checkbox label="Web" value="web" />
        <Checkbox label="E-mail" value="email" />
      </CheckboxGroup>,
    );

    expect(screen.getByRole('group', { name: 'Canais' })).toBeInTheDocument();

    const web = screen.getByRole('checkbox', { name: 'Web' }) as HTMLInputElement;
    const email = screen.getByRole('checkbox', { name: 'E-mail' }) as HTMLInputElement;

    expect(web).toBeChecked();
    expect(email).not.toBeChecked();
    expect(web.name).toBe(email.name);
  });

  it('controlled, reports the whole set and follows the received value', () => {
    const onValueChange = vi.fn();
    render(<Canais onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'E-mail' }));

    expect(onValueChange).toHaveBeenLastCalledWith(['web', 'email']);
    expect(screen.getByRole('checkbox', { name: 'E-mail' })).toBeChecked();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Web' }));

    expect(onValueChange).toHaveBeenLastCalledWith(['email']);
    expect(screen.getByRole('checkbox', { name: 'Web' })).not.toBeChecked();
  });

  it('controlled without updating, keeps the boxes as the product says', () => {
    render(
      <CheckboxGroup label="Canais" value={[]}>
        <Checkbox label="Web" value="web" />
      </CheckboxGroup>,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Web' }));

    expect(screen.getByRole('checkbox', { name: 'Web' })).not.toBeChecked();
  });

  it('still runs the onChange of each box', () => {
    const onChange = vi.fn();
    render(
      <CheckboxGroup label="Canais">
        <Checkbox label="Web" onChange={onChange} value="web" />
      </CheckboxGroup>,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Web' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('checkbox', { name: 'Web' })).toBeChecked();
  });

  it('propagates disabled, unless the box decides for itself', () => {
    render(
      <CheckboxGroup disabled label="Canais">
        <Checkbox label="Web" value="web" />
        <Checkbox disabled={false} label="E-mail" value="email" />
      </CheckboxGroup>,
    );

    expect(screen.getByRole('checkbox', { name: 'Web' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'E-mail' })).toBeEnabled();
  });

  it('describes the group, announces the error and marks every box invalid', () => {
    const { rerender } = render(
      <CheckboxGroup hint="Escolha por onde avisar." label="Canais">
        <Checkbox label="Web" value="web" />
      </CheckboxGroup>,
    );

    expect(screen.getByRole('group')).toHaveAccessibleDescription('Escolha por onde avisar.');

    rerender(
      <CheckboxGroup error="Escolha ao menos um canal." hint="Escolha por onde avisar." label="Canais">
        <Checkbox label="Web" value="web" />
      </CheckboxGroup>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Escolha ao menos um canal.');
    expect(screen.getByRole('group')).toHaveAccessibleDescription('Escolha ao menos um canal.');
    expect(screen.getByRole('checkbox', { name: 'Web' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('keeps the consumer description next to its own', () => {
    render(
      <>
        <span id="fora">Vale para todos os avisos</span>
        <CheckboxGroup aria-describedby="fora" hint="Escolha por onde avisar." label="Canais">
          <Checkbox label="Web" value="web" />
        </CheckboxGroup>
      </>,
    );

    expect(screen.getByRole('group')).toHaveAccessibleDescription('Vale para todos os avisos Escolha por onde avisar.');
  });

  it('required asks for at least one box, not for all of them', () => {
    render(
      <form data-testid="formulario">
        <CheckboxGroup label="Canais" name="canais" required>
          <Checkbox label="Web" value="web" />
          <Checkbox label="E-mail" value="email" />
        </CheckboxGroup>
      </form>,
    );
    const formulario = screen.getByTestId('formulario') as HTMLFormElement;

    expect(formulario.checkValidity()).toBe(false);

    fireEvent.click(screen.getByRole('checkbox', { name: 'E-mail' }));

    expect(formulario.checkValidity()).toBe(true);
    expect(new FormData(formulario).getAll('canais')).toEqual(['email']);
  });

  it('uncontrolled, goes back to the initial value when the form resets', () => {
    render(
      <form data-testid="formulario">
        <CheckboxGroup defaultValue={['web']} label="Canais">
          <Checkbox label="Web" value="web" />
          <Checkbox label="E-mail" value="email" />
        </CheckboxGroup>
      </form>,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Web' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'E-mail' }));

    act(() => (screen.getByTestId('formulario') as HTMLFormElement).reset());

    expect(screen.getByRole('checkbox', { name: 'Web' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'E-mail' })).not.toBeChecked();
  });

  it('leaves a box without value on its own', () => {
    render(
      <CheckboxGroup label="Canais" value={[]}>
        <Checkbox label="Selecionar todos" />
      </CheckboxGroup>,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todos' }));

    expect(screen.getByRole('checkbox', { name: 'Selecionar todos' })).toBeChecked();
  });
});
