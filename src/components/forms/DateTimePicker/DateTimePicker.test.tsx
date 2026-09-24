import { CalendarDate, CalendarDateTime, Time } from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateTimePicker } from './DateTimePicker';
import { TimePicker } from '../TimePicker';

describe('DateTimePicker', () => {
  it('apresenta data e hora com rotulos proprios', () => {
    render(<DateTimePicker label="Agendamento" value={new CalendarDateTime(2026, 3, 9, 14, 30)} />);

    expect(screen.getByLabelText('Agendamento')).toHaveValue('09/03/2026');
    expect(screen.getByLabelText('Hora')).toHaveValue('14:30');
  });

  it('escolhe a data pelo calendario preservando a hora', () => {
    const mudou = vi.fn();
    render(
      <DateTimePicker label="Agendamento" defaultValue={new CalendarDateTime(2026, 3, 9, 14, 30)} onValueChange={mudou} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));

    expect(mudou).toHaveBeenLastCalledWith(new CalendarDateTime(2026, 3, 12, 14, 30));
  });

  it('troca a hora preservando a data', () => {
    const mudou = vi.fn();
    render(
      <DateTimePicker label="Agendamento" defaultValue={new CalendarDateTime(2026, 3, 9, 14, 30)} onValueChange={mudou} />,
    );

    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '08:15' } });

    expect(mudou).toHaveBeenLastCalledWith(new CalendarDateTime(2026, 3, 9, 8, 15));
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
  it('reporta a hora digitada e aceita vazio', () => {
    const mudou = vi.fn();
    render(<TimePicker label="Inicio" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Inicio');

    fireEvent.change(campo, { target: { value: '09:45' } });
    expect(mudou).toHaveBeenLastCalledWith(new Time(9, 45));

    fireEvent.change(campo, { target: { value: '' } });
    expect(mudou).toHaveBeenLastCalledWith(undefined);
  });

  it('declara os limites ao navegador', () => {
    render(<TimePicker label="Inicio" min={new Time(8, 0)} max={new Time(18, 0)} />);

    const campo = screen.getByLabelText('Inicio');
    expect(campo).toHaveAttribute('min', '08:00');
    expect(campo).toHaveAttribute('max', '18:00');
  });

  it('expoe erro de forma acessivel', () => {
    render(<TimePicker label="Inicio" error="Informe a hora." />);

    const campo = screen.getByLabelText('Inicio');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Informe a hora.');
  });
});
