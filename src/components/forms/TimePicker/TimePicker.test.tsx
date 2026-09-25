import {
  CalendarDate,
  CalendarDateTime,
  Time,
  getLocalTimeZone,
  now,
  toCalendarDateTime,
  today,
} from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { TimePicker } from './TimePicker';

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
