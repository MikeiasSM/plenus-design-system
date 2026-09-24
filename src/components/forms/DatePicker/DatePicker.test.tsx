import { CalendarDate } from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { DatePicker } from './DatePicker';

function montar(props: Partial<React.ComponentProps<typeof DatePicker>> = {}) {
  render(<DatePicker label="Vencimento" {...props} />);
  return screen.getByLabelText('Vencimento');
}

describe('DatePicker', () => {
  it('comeca fechado e anuncia que abre um dialogo', () => {
    montar();

    const gatilho = screen.getByRole('button', { name: 'Abrir calendário' });
    expect(gatilho).toHaveAttribute('aria-haspopup', 'dialog');
    expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exibe o valor recebido na convencao brasileira', () => {
    const campo = montar({ value: new CalendarDate(2026, 3, 9) });

    expect(campo).toHaveValue('09/03/2026');
  });

  it('aplica a mascara e reporta a data digitada', () => {
    const mudou = vi.fn();
    const campo = montar({ onValueChange: mudou });

    fireEvent.change(campo, { target: { value: '09032026' } });

    expect(campo).toHaveValue('09/03/2026');
    expect(mudou).toHaveBeenLastCalledWith(new CalendarDate(2026, 3, 9));
  });

  it('nao reporta enquanto a data digitada nao existe', () => {
    const mudou = vi.fn();
    const campo = montar({ onValueChange: mudou });

    fireEvent.change(campo, { target: { value: '3102' } });

    expect(mudou).not.toHaveBeenCalled();
  });

  it('abre o calendario pela seta para baixo e escolhe um dia', () => {
    const mudou = vi.fn();
    const campo = montar({ value: new CalendarDate(2026, 3, 9), onValueChange: mudou });

    fireEvent.keyDown(campo, { key: 'ArrowDown' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));

    expect(mudou).toHaveBeenLastCalledWith(new CalendarDate(2026, 3, 12));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navega entre os meses pelo cabecalho', () => {
    montar({ value: new CalendarDate(2026, 3, 9) });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    expect(screen.getByRole('grid')).toHaveAccessibleName(/março de 2026/i);

    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(screen.getByRole('grid')).toHaveAccessibleName(/abril de 2026/i);
  });

  it('desabilita os dias fora da faixa permitida', () => {
    montar({ value: new CalendarDate(2026, 3, 9), min: new CalendarDate(2026, 3, 5) });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    expect(screen.getByRole('button', { name: '4 de março de 2026' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '5 de março de 2026' })).toBeEnabled();
  });

  it('marca o dia escolhido e fecha com Escape devolvendo o foco', () => {
    montar({ value: new CalendarDate(2026, 3, 9) });

    const gatilho = screen.getByRole('button', { name: 'Abrir calendário' });
    fireEvent.click(gatilho);

    expect(screen.getByRole('button', { name: '9 de março de 2026' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });

  it('anda pelo teclado dentro da grade e confirma com Enter', () => {
    const mudou = vi.fn();
    montar({ value: new CalendarDate(2026, 3, 9), onValueChange: mudou });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    const grade = screen.getByRole('grid');
    fireEvent.keyDown(grade, { key: 'ArrowRight' });
    fireEvent.keyDown(grade, { key: 'Enter' });

    expect(mudou).toHaveBeenLastCalledWith(new CalendarDate(2026, 3, 10));
  });
});
