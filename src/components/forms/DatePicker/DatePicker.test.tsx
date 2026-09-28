import { getLocalTimeZone, today } from '@internationalized/date';
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
    const campo = montar({ value: '2026-03-09' });

    expect(campo).toHaveValue('09/03/2026');
  });

  it('aplica a mascara e reporta a data digitada', () => {
    const mudou = vi.fn();
    const campo = montar({ onValueChange: mudou });

    fireEvent.change(campo, { target: { value: '09032026' } });

    expect(campo).toHaveValue('09/03/2026');
    expect(mudou).toHaveBeenLastCalledWith('2026-03-09');
  });

  it('reporta ausencia enquanto a data digitada nao existe', () => {
    const mudou = vi.fn();
    const campo = montar({ onValueChange: mudou });

    fireEvent.change(campo, { target: { value: '3102' } });

    // O valor acompanha o texto: enquanto ele nao e uma data, nao ha data.
    expect(mudou).toHaveBeenLastCalledWith(null);
  });

  it('recusa por digitacao a data que o calendario ja recusa', () => {
    const mudou = vi.fn();
    const campo = montar({ max: '2026-03-31', onValueChange: mudou });

    fireEvent.change(campo, { target: { value: '09032026' } });
    expect(mudou).toHaveBeenLastCalledWith('2026-03-09');

    fireEvent.change(campo, { target: { value: '09092030' } });
    expect(mudou).toHaveBeenLastCalledWith(null);
  });

  it('abre o calendario pela seta para baixo e escolhe um dia', () => {
    const mudou = vi.fn();
    const campo = montar({ value: '2026-03-09', onValueChange: mudou });

    fireEvent.keyDown(campo, { key: 'ArrowDown' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith('2026-03-12');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navega entre os meses pelo cabecalho', () => {
    montar({ value: '2026-03-09' });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    expect(screen.getByRole('grid')).toHaveAccessibleName(/março de 2026/i);

    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(screen.getByRole('grid')).toHaveAccessibleName(/abril de 2026/i);
  });

  it('desabilita os dias fora da faixa permitida', () => {
    montar({ value: '2026-03-09', min: '2026-03-05' });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    expect(screen.getByRole('button', { name: '4 de março de 2026' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: '5 de março de 2026' })).not.toHaveAttribute('aria-disabled');
  });

  it('marca o dia escolhido e fecha com Escape devolvendo o foco', () => {
    montar({ value: '2026-03-09' });

    const gatilho = screen.getByRole('button', { name: 'Abrir calendário' });
    fireEvent.click(gatilho);

    expect(screen.getByRole('button', { name: '9 de março de 2026' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });

  it('anda pelo teclado dentro da grade e confirma com Enter', () => {
    const mudou = vi.fn();
    montar({ value: '2026-03-09', onValueChange: mudou });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    const grade = screen.getByRole('grid');
    fireEvent.keyDown(grade, { key: 'ArrowRight' });
    fireEvent.keyDown(grade, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith('2026-03-10');
  });

  it('nao aplica nada antes de confirmar', () => {
    const mudou = vi.fn();
    montar({ value: '2026-03-09', onValueChange: mudou });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));

    expect(mudou).not.toHaveBeenCalled();
  });

  it('descarta a escolha ao cancelar', () => {
    const mudou = vi.fn();
    montar({ value: '2026-03-09', onValueChange: mudou });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(mudou).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Vencimento')).toHaveValue('09/03/2026');
  });

  it('leva o calendario para hoje sem aplicar', () => {
    const mudou = vi.fn();
    const hoje = today(getLocalTimeZone());
    montar({ value: '2026-03-09', onValueChange: mudou });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));
    expect(mudou).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(mudou).toHaveBeenLastCalledWith(hoje.toString());
  });
});
