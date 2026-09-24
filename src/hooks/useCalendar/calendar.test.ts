import { CalendarDate } from '@internationalized/date';
import { buildMonth, clamp, isUnavailable, moveFocus, sameDay } from './calendar';

const marco = new CalendarDate(2026, 3, 9);

describe('grade do mes', () => {
  it('monta semanas completas de sete dias comecando no domingo', () => {
    const semanas = buildMonth(marco, 'pt-BR');

    expect(semanas.every((semana) => semana.length === 7)).toBe(true);
    expect(semanas[0][0].date.toString()).toBe('2026-03-01');
  });

  it('marca como externos os dias de outro mes', () => {
    const semanas = buildMonth(new CalendarDate(2026, 4, 15), 'pt-BR');
    const primeiro = semanas[0][0];

    expect(primeiro.outside).toBe(true);
    expect(primeiro.date.month).toBe(3);
  });

  it('marca os indisponiveis pelo limite e pelo predicado', () => {
    const semanas = buildMonth(marco, 'pt-BR', {
      min: new CalendarDate(2026, 3, 5),
      isDateUnavailable: (data) => data.day === 10,
    });
    const dias = semanas.flat();

    expect(dias.find((dia) => dia.date.toString() === '2026-03-04')?.unavailable).toBe(true);
    expect(dias.find((dia) => dia.date.toString() === '2026-03-10')?.unavailable).toBe(true);
    expect(dias.find((dia) => dia.date.toString() === '2026-03-11')?.unavailable).toBe(false);
  });
});

describe('limites', () => {
  it('reconhece o que esta fora da faixa', () => {
    const limites = { min: new CalendarDate(2026, 3, 5), max: new CalendarDate(2026, 3, 20) };

    expect(isUnavailable(new CalendarDate(2026, 3, 4), limites)).toBe(true);
    expect(isUnavailable(new CalendarDate(2026, 3, 21), limites)).toBe(true);
    expect(isUnavailable(new CalendarDate(2026, 3, 9), limites)).toBe(false);
  });

  it('traz de volta para a faixa', () => {
    const limites = { min: new CalendarDate(2026, 3, 5), max: new CalendarDate(2026, 3, 20) };

    expect(clamp(new CalendarDate(2026, 1, 1), limites).toString()).toBe('2026-03-05');
    expect(clamp(new CalendarDate(2026, 12, 1), limites).toString()).toBe('2026-03-20');
  });
});

describe('navegacao pelo teclado', () => {
  it('anda por dia, semana, mes e ano', () => {
    expect(moveFocus(marco, 'ArrowRight', false, {})?.toString()).toBe('2026-03-10');
    expect(moveFocus(marco, 'ArrowUp', false, {})?.toString()).toBe('2026-03-02');
    expect(moveFocus(marco, 'PageDown', false, {})?.toString()).toBe('2026-04-09');
    expect(moveFocus(marco, 'PageUp', true, {})?.toString()).toBe('2025-03-09');
  });

  it('vai aos extremos do mes', () => {
    expect(moveFocus(marco, 'Home', false, {})?.toString()).toBe('2026-03-01');
    expect(moveFocus(marco, 'End', false, {})?.toString()).toBe('2026-03-31');
  });

  it('nao ultrapassa os limites', () => {
    const limites = { min: new CalendarDate(2026, 3, 9) };

    expect(moveFocus(marco, 'ArrowLeft', false, limites)?.toString()).toBe('2026-03-09');
  });

  it('ignora teclas sem significado', () => {
    expect(moveFocus(marco, 'a', false, {})).toBeUndefined();
  });
});

describe('comparacao', () => {
  it('compara apenas o dia', () => {
    expect(sameDay(marco, new CalendarDate(2026, 3, 9))).toBe(true);
    expect(sameDay(marco, new CalendarDate(2026, 3, 10))).toBe(false);
    expect(sameDay(undefined, marco)).toBe(false);
  });
});
