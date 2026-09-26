import { CalendarDate, CalendarDateTime, Time } from '@internationalized/date';
import { render, screen } from '@testing-library/react';
import { ComboBox } from './ComboBox';
import { DatePicker } from './DatePicker';
import { DateTimePicker } from './DateTimePicker';
import { Select } from './Select';
import { TimePicker } from './TimePicker';

const opcoes = [
  { label: 'Ativo', value: 'ativo' },
  { label: 'Inativo', value: 'inativo' },
];

function enviado() {
  const formulario = screen.getByTestId('formulario') as HTMLFormElement;

  return Object.fromEntries(new FormData(formulario).entries());
}

describe('participacao no formulario', () => {
  it('leva o valor de cada campo ao FormData', () => {
    render(
      <form data-testid="formulario">
        <Select label="Status" name="status" options={opcoes} value="ativo" />
        <ComboBox label="Cidade" name="cidade" options={opcoes} value="inativo" />
        <DatePicker label="Vencimento" name="vencimento" value={new CalendarDate(2026, 3, 9)} />
        <TimePicker label="Início" name="inicio" value={new Time(9, 30)} />
        <DateTimePicker
          label="Agendamento"
          name="agendamento"
          value={new CalendarDateTime(2026, 3, 9, 18, 40)}
        />
      </form>,
    );

    expect(enviado()).toEqual({
      status: 'ativo',
      cidade: 'inativo',
      vencimento: '2026-03-09',
      inicio: '09:30',
      agendamento: '2026-03-09T18:40:00',
    });
  });

  it('nao acrescenta campo algum quando o nome nao e informado', () => {
    render(
      <form data-testid="formulario">
        <Select label="Status" options={opcoes} value="ativo" />
      </form>,
    );

    expect(enviado()).toEqual({});
  });

  it('envia vazio quando o campo esta vazio, em vez de sumir do envio', () => {
    render(
      <form data-testid="formulario">
        <DatePicker label="Vencimento" name="vencimento" value={null} />
      </form>,
    );

    expect(enviado()).toEqual({ vencimento: '' });
  });
});
