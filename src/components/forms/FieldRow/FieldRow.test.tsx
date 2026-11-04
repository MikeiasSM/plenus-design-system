import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../../actions/Button';
import { InputNumber } from '../InputNumber';
import { Select } from '../Select';
import { Switch } from '../Switch';
import { FieldRow } from './FieldRow';

describe('FieldRow', () => {
  it('nomeia o controle pelo rotulo da linha e o descreve pela explicacao', () => {
    render(
      <FieldRow description="Avisa quando o pedido muda de situacao." label="Avisar por e-mail">
        {({ describedBy, id }) => <Switch aria-describedby={describedBy} id={id} />}
      </FieldRow>,
    );

    const chave = screen.getByRole('switch', { name: 'Avisar por e-mail' });

    expect(chave).toHaveAccessibleDescription('Avisa quando o pedido muda de situacao.');
    fireEvent.click(screen.getByText('Avisar por e-mail'));
    expect(chave).toBeChecked();
  });

  it('funciona com um campo numerico e com um seletor', () => {
    render(
      <>
        <FieldRow description="Em porcentagem." label="Desconto maximo">
          {({ describedBy, id }) => <InputNumber aria-describedby={describedBy} id={id} />}
        </FieldRow>
        <FieldRow description="Quando o resumo chega." label="Frequencia">
          {({ describedBy, id }) => <Select aria-describedby={describedBy} id={id} options={[{ label: 'Semanal', value: 's' }]} />}
        </FieldRow>
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Desconto maximo' })).toHaveAccessibleDescription('Em porcentagem.');
    expect(screen.getByRole('combobox', { name: 'Frequencia' })).toHaveAccessibleDescription('Quando o resumo chega.');
  });

  it('deixa o botao com o proprio nome e so lhe da a explicacao', () => {
    render(
      <FieldRow description="Os pedidos seguem sem aprovacao." label="Pedidos na fila">
        {({ describedBy }) => <Button aria-describedby={describedBy}>Desligar aprovacao</Button>}
      </FieldRow>,
    );

    expect(screen.getByRole('button', { name: 'Desligar aprovacao' })).toHaveAccessibleDescription(
      'Os pedidos seguem sem aprovacao.',
    );
  });

  it('nao aponta para uma explicacao que nao existe', () => {
    render(<FieldRow label="Nome">{({ describedBy, id }) => <input aria-describedby={describedBy} id={id} />}</FieldRow>);

    expect(screen.getByRole('textbox', { name: 'Nome' })).not.toHaveAttribute('aria-describedby');
  });

  it('respeita o id informado', () => {
    render(
      <FieldRow id="limite" label="Limite">
        {({ id }) => <input id={id} />}
      </FieldRow>,
    );

    expect(screen.getByLabelText('Limite')).toHaveAttribute('id', 'limite');
  });
});
