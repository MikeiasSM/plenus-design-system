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
import { DateTimePicker } from './DateTimePicker';

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
  it('apoia a hora em hoje quando ainda nao ha data', () => {
    const mudou = vi.fn();
    const hoje = today(getLocalTimeZone());
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('option', { name: '09:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith(new CalendarDateTime(hoje.year, hoje.month, hoje.day, 9, 0));
  });

  it('nao fixa a hora antes dos quatro digitos', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Agendamento');

    fireEvent.change(campo, { target: { value: '09032026184' } });
    expect(campo).toHaveValue('09/03/2026 18:4');
    expect(mudou).toHaveBeenLastCalledWith(new CalendarDateTime(2026, 3, 9, 0, 0));

    fireEvent.change(campo, { target: { value: '090320261840' } });
    expect(campo).toHaveValue('09/03/2026 18:40');
    expect(mudou).toHaveBeenLastCalledWith(new CalendarDateTime(2026, 3, 9, 18, 40));
  });

  it('preenche data e hora correntes pelo Agora', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agora' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    const agora = toCalendarDateTime(now(getLocalTimeZone()));
    const aplicado = mudou.mock.lastCall?.[0] as CalendarDateTime;

    expect(aplicado.day).toBe(agora.day);
    expect(aplicado.hour).toBe(agora.hour);
    expect(aplicado.minute).toBe(agora.minute);
    expect(aplicado.second).toBe(0);
  });
});
