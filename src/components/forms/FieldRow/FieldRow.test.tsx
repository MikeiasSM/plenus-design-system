import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { Button } from '../../actions/Button';
import { InputNumber } from '../InputNumber';
import { CheckboxGroup } from '../CheckboxGroup';
import { Checkbox } from '../Checkbox';
import { Radio, RadioGroup } from '../RadioGroup';
import { SegmentedControl } from '../SegmentedControl';
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

  it('nao deixa o rotulo apontar para um controle que nao existe', () => {
    render(
      <FieldRow description="Os pedidos seguem sem aprovacao." label="Pedidos na fila">
        {({ describedBy }) => <Button aria-describedby={describedBy}>Desligar aprovacao</Button>}
      </FieldRow>,
    );

    expect(screen.getByText('Pedidos na fila').closest('label')).not.toHaveAttribute('for');
  });

  it('volta a apontar para o controle quando ele aparece', () => {
    const { rerender } = render(<FieldRow label="Limite">{() => <span>Carregando</span>}</FieldRow>);

    expect(screen.getByText('Limite').closest('label')).not.toHaveAttribute('for');

    rerender(<FieldRow label="Limite">{({ id }) => <input id={id} />}</FieldRow>);

    expect(screen.getByRole('textbox', { name: 'Limite' })).toBeInTheDocument();
  });

  it('ja sai do servidor sem apontar para um controle que nao existe', () => {
    const html = renderToString(
      <FieldRow label="Pedidos na fila">{({ describedBy }) => <Button aria-describedby={describedBy}>Desligar</Button>}</FieldRow>,
    );

    expect(html).not.toContain('for=');
  });

  it('continua apontando para o controle que monta depois, sem a linha renderizar de novo', async () => {
    function Carregando({ id }: { id: string }) {
      const [pronto, setPronto] = useState(false);

      useEffect(() => setPronto(true), []);
      return pronto ? <input id={id} /> : <span>Carregando</span>;
    }

    render(<FieldRow label="Carteira">{({ id }) => <Carregando id={id} />}</FieldRow>);

    expect(await screen.findByRole('textbox', { name: 'Carteira' })).toBeInTheDocument();
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

  it('nomeia o SegmentedControl pelo rotulo da linha, uma vez so, e o rotulo nao aponta para a div', () => {
    render(
      <FieldRow description="Quando o resumo chega." label="Frequencia">
        {({ describedBy, labelId }) => (
          <SegmentedControl
            aria-describedby={describedBy}
            aria-labelledby={labelId}
            items={[
              { label: 'Dia', value: 'dia' },
              { label: 'Semana', value: 'semana' },
            ]}
          />
        )}
      </FieldRow>,
    );

    const grupo = screen.getByRole('radiogroup', { name: 'Frequencia' });

    expect(grupo).not.toHaveAttribute('aria-label');
    expect(grupo).toHaveAccessibleDescription('Quando o resumo chega.');
    expect(screen.getByText('Frequencia').closest('label')).not.toHaveAttribute('for');
    expect(screen.getAllByText('Frequencia')).toHaveLength(1);
  });

  it('nomeia o RadioGroup e o CheckboxGroup pelo rotulo da linha, sem legenda repetida', () => {
    render(
      <>
        <FieldRow label="Plano">
          {({ labelId }) => (
            <RadioGroup aria-labelledby={labelId}>
              <Radio label="Mensal" value="m" />
            </RadioGroup>
          )}
        </FieldRow>
        <FieldRow label="Avisos">
          {({ labelId }) => (
            <CheckboxGroup aria-labelledby={labelId}>
              <Checkbox label="E-mail" value="email" />
            </CheckboxGroup>
          )}
        </FieldRow>
      </>,
    );

    expect(screen.getByRole('radiogroup', { name: 'Plano' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Avisos' })).toBeInTheDocument();
    expect(screen.getAllByText('Plano')).toHaveLength(1);
    expect(screen.getAllByText('Avisos')).toHaveLength(1);
  });

  it('so poe id no rotulo quando a funcao le o labelId', () => {
    render(<FieldRow label="Nome">{({ id }) => <input id={id} />}</FieldRow>);

    expect(screen.getByText('Nome').closest('label')).not.toHaveAttribute('id');
  });

  it('avisa em desenvolvimento o grupo sem nome nenhum', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<SegmentedControl items={[{ label: 'Dia', value: 'dia' }]} />);

    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('SegmentedControl'));
    aviso.mockRestore();
  });
});
