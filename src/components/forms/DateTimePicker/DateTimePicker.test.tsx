import { getLocalTimeZone, now, toCalendarDateTime, today } from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateTimePicker } from './DateTimePicker';

describe('DateTimePicker', () => {
  it('apresenta data e hora no mesmo campo', () => {
    render(<DateTimePicker label="Agendamento" value={'2026-03-09T14:30'} />);

    expect(screen.getByLabelText('Agendamento')).toHaveValue('09/03/2026 14:30');
  });

  it('traz calendario e horas no mesmo painel', () => {
    render(<DateTimePicker label="Agendamento" value={'2026-03-09T14:30'} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Horário' })).toBeInTheDocument();
  });

  it('escolhe a hora no painel preservando a data', () => {
    const mudou = vi.fn();
    render(
      <DateTimePicker label="Agendamento" defaultValue={'2026-03-09T14:30'} onValueChange={mudou} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('option', { name: '08:30' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith('2026-03-09T08:30');
  });

  it('escolhe a data pelo calendario preservando a hora', () => {
    const mudou = vi.fn();
    render(
      <DateTimePicker label="Agendamento" defaultValue={'2026-03-09T14:30'} onValueChange={mudou} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith('2026-03-12T14:30');
  });

  it('aceita data e hora digitadas no mesmo campo', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Agendamento');
    fireEvent.change(campo, { target: { value: '090320261415' } });

    expect(campo).toHaveValue('09/03/2026 14:15');
    expect(mudou).toHaveBeenLastCalledWith('2026-03-09T14:15');
  });

  it('assume meia-noite quando a data vem antes da hora', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    fireEvent.change(screen.getByLabelText('Agendamento'), { target: { value: '09032026' } });

    expect(mudou).toHaveBeenLastCalledWith('2026-03-09T00:00');
  });

  it('desabilita no calendario os dias fora dos limites', () => {
    render(
      <DateTimePicker
        label="Agendamento"
        value={'2026-03-09T14:30'}
        min={'2026-03-05'}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    expect(screen.getByRole('button', { name: '4 de março de 2026' })).toHaveAttribute('aria-disabled', 'true');
  });
  it('apoia a hora em hoje quando ainda nao ha data', () => {
    const mudou = vi.fn();
    const hoje = today(getLocalTimeZone());
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('option', { name: '09:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith(`${hoje.toString()}T09:00`);
  });

  it('nao fixa a hora antes dos quatro digitos', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Agendamento');

    fireEvent.change(campo, { target: { value: '09032026184' } });
    expect(campo).toHaveValue('09/03/2026 18:4');
    // Hora pela metade nao e valor: meia-noite seria uma hora que ninguem digitou.
    expect(mudou).toHaveBeenLastCalledWith(null);

    fireEvent.change(campo, { target: { value: '090320261840' } });
    expect(campo).toHaveValue('09/03/2026 18:40');
    expect(mudou).toHaveBeenLastCalledWith('2026-03-09T18:40');
  });

  it('preenche data e hora correntes pelo Agora', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    // Entre um instante e outro o relogio pode virar de minuto: o valor fica entre os dois, e nao igual ao segundo.
    const minutoCheio = () => toCalendarDateTime(now(getLocalTimeZone())).toString().slice(0, 16);
    const antes = minutoCheio();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agora' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    const depois = minutoCheio();
    const aplicado = String(mudou.mock.lastCall?.[0]);

    // No mesmo formato ISO, a ordem do texto e a do tempo.
    expect(aplicado >= antes && aplicado <= depois).toBe(true);
    expect(aplicado).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  describe('abertura controlável', () => {
    const gatilho = () => screen.getByRole('button', { name: 'Abrir calendário' });

    it('abre de início com defaultOpen', () => {
      render(<DateTimePicker label="Agendamento" defaultOpen />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(gatilho()).toHaveAttribute('aria-expanded', 'true');
    });

    it('avisa a abertura e o fechamento em cada via, sem controle', () => {
      const onOpenChange = vi.fn();
      render(<DateTimePicker label="Agendamento" onOpenChange={onOpenChange} />);
      const campo = screen.getByLabelText('Agendamento');

      fireEvent.click(gatilho());
      fireEvent.click(gatilho());
      fireEvent.keyDown(campo, { key: 'ArrowDown' });
      fireEvent.keyDown(campo, { key: 'Escape' });
      fireEvent.click(gatilho());
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      fireEvent.click(gatilho());
      fireEvent.pointerDown(document.body);
      fireEvent.mouseDown(document.body);
      fireEvent.pointerUp(document.body);
      fireEvent.mouseUp(document.body);
      fireEvent.click(gatilho());
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

      expect(onOpenChange.mock.calls).toEqual([[true], [false], [true], [false], [true], [false], [true], [false], [true], [false]]);
    });

    it('abre e fecha por open e devolve o foco ao botão', () => {
      const { rerender } = render(<DateTimePicker label="Agendamento" open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<DateTimePicker label="Agendamento" open />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(<DateTimePicker label="Agendamento" open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(gatilho()).toHaveFocus();
    });

    it('controlado, só muda quando o produto atualiza open', () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(<DateTimePicker label="Agendamento" onOpenChange={onOpenChange} open={false} />);

      fireEvent.click(gatilho());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<DateTimePicker label="Agendamento" onOpenChange={onOpenChange} open />);
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
