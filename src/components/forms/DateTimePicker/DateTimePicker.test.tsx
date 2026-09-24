import { CalendarDate, CalendarDateTime, Time, getLocalTimeZone, today } from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateTimePicker } from './DateTimePicker';
import { TimePicker } from '../TimePicker';

describe('DateTimePicker', () => {
  it('apresenta data e hora no mesmo campo', () => {
    render(<DateTimePicker label="Agendamento" value={new CalendarDateTime(2026, 3, 9, 14, 30)} />);

    expect(screen.getByLabelText('Agendamento')).toHaveValue('09/03/2026 14:30');
  });

  it('traz calendario e horas no mesmo painel', () => {
    render(<DateTimePicker label="Agendamento" value={new CalendarDateTime(2026, 3, 9, 14, 30)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Horário' })).toBeInTheDocument();
  });

  it('escolhe a hora no painel preservando a data', () => {
    const mudou = vi.fn();
    render(
      <DateTimePicker label="Agendamento" defaultValue={new CalendarDateTime(2026, 3, 9, 14, 30)} onValueChange={mudou} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('option', { name: '08:30' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith(new CalendarDateTime(2026, 3, 9, 8, 30));
  });

  it('escolhe a data pelo calendario preservando a hora', () => {
    const mudou = vi.fn();
    render(
      <DateTimePicker label="Agendamento" defaultValue={new CalendarDateTime(2026, 3, 9, 14, 30)} onValueChange={mudou} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith(new CalendarDateTime(2026, 3, 12, 14, 30));
  });

  it('aceita data e hora digitadas no mesmo campo', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Agendamento');
    fireEvent.change(campo, { target: { value: '090320261415' } });

    expect(campo).toHaveValue('09/03/2026 14:15');
    expect(mudou).toHaveBeenLastCalledWith(new CalendarDateTime(2026, 3, 9, 14, 15));
  });

  it('assume meia-noite quando a data vem antes da hora', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    fireEvent.change(screen.getByLabelText('Agendamento'), { target: { value: '09032026' } });

    expect(mudou).toHaveBeenLastCalledWith(new CalendarDateTime(2026, 3, 9, 0, 0));
  });

  it('respeita os limites de data', () => {
    render(
      <DateTimePicker
        label="Agendamento"
        value={new CalendarDateTime(2026, 3, 9, 14, 30)}
        min={new CalendarDate(2026, 3, 5)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    expect(screen.getByRole('button', { name: '4 de março de 2026' })).toBeDisabled();
  });
});

describe('TimePicker', () => {
  it('aplica a mascara e reporta a hora digitada', () => {
    const mudou = vi.fn();
    render(<TimePicker label="Inicio" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Inicio');

    fireEvent.change(campo, { target: { value: '0945' } });
    expect(campo).toHaveValue('09:45');
    expect(mudou).toHaveBeenLastCalledWith(new Time(9, 45));

    fireEvent.change(campo, { target: { value: '' } });
    expect(mudou).toHaveBeenLastCalledWith(undefined);
  });

  it('escolhe hora e minuto no painel proprio, sem o seletor nativo', () => {
    const mudou = vi.fn();
    render(<TimePicker label="Inicio" defaultValue={new Time(9, 45)} onValueChange={mudou} />);

    expect(screen.getByLabelText('Inicio')).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Abrir seletor de hora' }));
    fireEvent.click(screen.getByRole('option', { name: '14:30' }));

    expect(mudou).toHaveBeenLastCalledWith(new Time(14, 30));
  });

  it('desabilita as horas fora da faixa', () => {
    render(<TimePicker label="Inicio" min={new Time(8, 0)} max={new Time(18, 0)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir seletor de hora' }));

    expect(screen.queryByRole('option', { name: '07:30' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: '08:00' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '18:00' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '18:30' })).not.toBeInTheDocument();
  });

  it('expoe erro de forma acessivel', () => {
    render(<TimePicker label="Inicio" error="Informe a hora." />);

    const campo = screen.getByLabelText('Inicio');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Informe a hora.');
  });

  it('apoia a hora em hoje quando ainda nao ha data', () => {
    const mudou = vi.fn();
    const hoje = today(getLocalTimeZone());
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('option', { name: '09:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith(new CalendarDateTime(hoje.year, hoje.month, hoje.day, 9, 0));
  });

  it('oferece o dia inteiro, da meia-noite a ultima meia hora', () => {
    render(<TimePicker label="Inicio" />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir seletor de hora' }));

    const horarios = screen.getAllByRole('option');
    expect(horarios).toHaveLength(48);
    expect(horarios[0]).toHaveTextContent('00:00');
    expect(horarios.at(-1)).toHaveTextContent('23:30');
    expect(screen.getByRole('option', { name: '23:00' })).toBeInTheDocument();
  });

  it('aceita a hora digitada no proprio painel', () => {
    const mudou = vi.fn();
    render(<TimePicker label="Inicio" onValueChange={mudou} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir seletor de hora' }));
    fireEvent.change(screen.getByLabelText('Horário em horas e minutos'), { target: { value: '2147' } });

    expect(mudou).toHaveBeenLastCalledWith(new Time(21, 47));
  });
});
