import { CalendarDate, Time } from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { DatePicker } from './DatePicker';
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
