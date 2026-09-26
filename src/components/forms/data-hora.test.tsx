import { CalendarDate, CalendarDateTime, Time } from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { DatePicker } from './DatePicker';
import { lerEntradaDataHora } from './DateTimePicker/DateTimePicker';
import { TimePicker } from './TimePicker';
import { gerarHorarios } from './TimePicker/TimeSlots';

describe('valor controlado vazio', () => {
  it('limpa a data quando o produto devolve null', () => {
    const { rerender } = render(
      <DatePicker label="Vencimento" value={new CalendarDate(2026, 8, 15)} />,
    );

    expect(screen.getByLabelText('Vencimento')).toHaveValue('15/08/2026');

    rerender(<DatePicker label="Vencimento" value={null} />);

    expect(screen.getByLabelText('Vencimento')).toHaveValue('');
  });

  it('limpa a hora quando o produto devolve null', () => {
    const { rerender } = render(<TimePicker label="Início" value={new Time(9, 30)} />);

    expect(screen.getByLabelText('Início')).toHaveValue('09:30');

    rerender(<TimePicker label="Início" value={null} />);

    expect(screen.getByLabelText('Início')).toHaveValue('');
  });
});

describe('lista de horarios', () => {
  it('nao trava com passo nao positivo', () => {
    expect(gerarHorarios(0)).toEqual([]);
    expect(gerarHorarios(-15)).toEqual([]);
  });

  it('gera do primeiro ao ultimo que couber no passo', () => {
    expect(gerarHorarios(30, new Time(9, 0), new Time(10, 0))).toHaveLength(3);
  });
});

describe('calendario', () => {
  it('abre no mes da data escolhida, e nao no mes corrente', () => {
    render(<DatePicker label="Vencimento" value={new CalendarDate(2027, 8, 15)} />);

    fireEvent.click(screen.getByRole('button', { name: /calend/i }));

    expect(screen.getByText(/agosto de 2027/i)).toBeInTheDocument();
  });
});

describe('leitura de data e hora digitadas', () => {
  it('assume meia-noite quando nao se digitou hora alguma', () => {
    expect(lerEntradaDataHora('09/03/2026')).toEqual(new CalendarDateTime(2026, 3, 9, 0, 0));
  });

  it('nao tem valor enquanto a hora esta pela metade', () => {
    expect(lerEntradaDataHora('09/03/2026 18:4')).toBeUndefined();
  });

  it('nao transforma hora impossivel em meia-noite', () => {
    expect(lerEntradaDataHora('09/03/2026 25:99')).toBeUndefined();
    expect(lerEntradaDataHora('09/03/2026 24:00')).toBeUndefined();
  });

  it('le a data e hora inteiras', () => {
    expect(lerEntradaDataHora('09/03/2026 18:40')).toEqual(new CalendarDateTime(2026, 3, 9, 18, 40));
  });
});
