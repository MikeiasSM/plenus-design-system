import { useState } from 'react';
import { afterEach, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Calendar, type CalendarProps } from '.';
import type { DateRange } from '../DatePickerRange';

const dia = (nome: string) => screen.getByRole('button', { name: nome });

function montar(props: Partial<CalendarProps> = {}) {
  render(<Calendar aria-label="Data da entrega" {...(props as CalendarProps)} />);
  return screen.getByRole('group', { name: 'Data da entrega' });
}

describe('Calendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 24, 12) });
  });

  afterEach(() => vi.useRealTimers());

  it('e um grupo nomeado com a grade do mes, sem painel em volta', () => {
    const grupo = montar();

    expect(grupo).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAccessibleName(/novembro de 2026/i);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(dia('24 de novembro de 2026')).toHaveAttribute('aria-current', 'date');
  });

  it('sem controle, guarda o dia escolhido e avisa em ISO', () => {
    const onChange = vi.fn();
    montar({ defaultValue: '2026-11-10', onChange });

    expect(dia('10 de novembro de 2026')).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(dia('26 de novembro de 2026'));

    expect(onChange).toHaveBeenLastCalledWith('2026-11-26');
    expect(dia('26 de novembro de 2026')).toHaveAttribute('aria-pressed', 'true');
    expect(dia('10 de novembro de 2026')).toHaveAttribute('aria-pressed', 'false');
  });

  it('controlado, so muda quando o produto atualiza o valor', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Calendar aria-label="Data" onChange={onChange} value="2026-11-10" />);

    fireEvent.click(dia('12 de novembro de 2026'));

    expect(onChange).toHaveBeenLastCalledWith('2026-11-12');
    expect(dia('10 de novembro de 2026')).toHaveAttribute('aria-pressed', 'true');

    rerender(<Calendar aria-label="Data" onChange={onChange} value="2026-12-03" />);
    expect(screen.getByRole('grid')).toHaveAccessibleName(/dezembro de 2026/i);
    expect(dia('3 de dezembro de 2026')).toHaveAttribute('aria-pressed', 'true');

    rerender(<Calendar aria-label="Data" onChange={onChange} value={null} />);
    expect(dia('3 de dezembro de 2026')).toHaveAttribute('aria-pressed', 'false');
  });

  it('o dia indisponivel se risca, se anuncia e nao se escolhe', () => {
    const onChange = vi.fn();
    montar({ isDateUnavailable: (data) => data === '2026-11-28', onChange, value: '2026-11-26' });

    const fechado = dia('28 de novembro de 2026, indisponível');

    expect(fechado).toHaveAttribute('aria-disabled', 'true');
    expect(fechado).toHaveClass(/excluded/);

    fireEvent.click(fechado);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fora de minValue e maxValue, o dia so se apaga e nao se escolhe', () => {
    const onChange = vi.fn();
    montar({ maxValue: '2026-11-27', minValue: '2026-11-24', onChange });

    const antes = dia('23 de novembro de 2026');

    expect(antes).toHaveAttribute('aria-disabled', 'true');
    expect(antes).not.toHaveClass(/excluded/);
    expect(dia('28 de novembro de 2026')).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(antes);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('escolhe pelo teclado e troca o mes pelas setas do cabecalho', () => {
    const onChange = vi.fn();
    montar({ defaultValue: '2026-11-30', onChange });

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' });
    expect(screen.getByRole('grid')).toHaveAccessibleName(/dezembro de 2026/i);

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('2026-12-01');

    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(screen.getByRole('grid')).toHaveAccessibleName(/janeiro de 2027/i);
  });

  describe('intervalo', () => {
    it('o primeiro clique marca o inicio e o segundo fecha o intervalo', () => {
      const onChange = vi.fn();
      montar({ onChange, selectionMode: 'range' });

      fireEvent.click(dia('17 de novembro de 2026'));

      expect(onChange).not.toHaveBeenCalled();
      expect(dia('17 de novembro de 2026')).toHaveAttribute('aria-pressed', 'true');

      fireEvent.click(dia('10 de novembro de 2026'));

      expect(onChange).toHaveBeenLastCalledWith({ start: '2026-11-10', end: '2026-11-17' });
      expect(dia('13 de novembro de 2026')).toHaveClass(/rangeDay/);
      expect(dia('10 de novembro de 2026')).toHaveAttribute('aria-pressed', 'true');
      expect(dia('17 de novembro de 2026')).toHaveAttribute('aria-pressed', 'true');
    });

    it('um novo clique recomeca o intervalo', () => {
      const onChange = vi.fn();
      montar({ defaultValue: { start: '2026-11-10', end: '2026-11-17' }, onChange, selectionMode: 'range' });

      expect(dia('12 de novembro de 2026')).toHaveClass(/rangeDay/);

      fireEvent.click(dia('20 de novembro de 2026'));

      expect(dia('12 de novembro de 2026')).not.toHaveClass(/rangeDay/);
      expect(dia('10 de novembro de 2026')).toHaveAttribute('aria-pressed', 'false');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('controlado, mostra o intervalo do produto', () => {
      function Controlado() {
        const [periodo, setPeriodo] = useState<DateRange | null>({ start: '2026-11-02', end: '2026-11-04' });

        return (
          <>
            <Calendar aria-label="Período" onChange={setPeriodo} selectionMode="range" value={periodo} />
            <output>{periodo ? `${periodo.start}/${periodo.end}` : 'vazio'}</output>
          </>
        );
      }

      render(<Controlado />);

      expect(dia('3 de novembro de 2026')).toHaveClass(/rangeDay/);

      fireEvent.click(dia('20 de novembro de 2026'));
      fireEvent.click(dia('25 de novembro de 2026'));

      expect(screen.getByRole('status')).toHaveTextContent('2026-11-20/2026-11-25');
      expect(dia('22 de novembro de 2026')).toHaveClass(/rangeDay/);
    });

    it('o dia indisponivel nao fecha o intervalo', () => {
      const onChange = vi.fn();
      montar({ isDateUnavailable: (data) => data === '2026-11-20', onChange, selectionMode: 'range' });

      fireEvent.click(dia('18 de novembro de 2026'));
      fireEvent.click(dia('20 de novembro de 2026, indisponível'));

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
