import { CalendarDate } from '@internationalized/date';
import {
  buildMonth,
  buildPeriods,
  clamp,
  endOfPeriod,
  isUnavailable,
  moveFocus,
  movePeriodFocus,
  sameDay,
  startOfPage,
  startOfPeriod,
} from './calendar';

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

describe('periodos', () => {
  it('leva ao primeiro e ao ultimo dia do mes e do ano', () => {
    expect(startOfPeriod(marco, 'month').toString()).toBe('2026-03-01');
    expect(startOfPeriod(marco, 'year').toString()).toBe('2026-01-01');
    expect(endOfPeriod(marco, 'month').toString()).toBe('2026-03-31');
    expect(endOfPeriod(marco, 'year').toString()).toBe('2026-12-31');
    expect(startOfPeriod(marco).toString()).toBe('2026-03-09');
  });

  it('o periodo que toca a faixa continua disponivel', () => {
    const limites = { min: new CalendarDate(2026, 3, 15), max: new CalendarDate(2026, 8, 10) };

    expect(isUnavailable(new CalendarDate(2026, 3, 1), limites, 'month')).toBe(false);
    expect(isUnavailable(new CalendarDate(2026, 2, 1), limites, 'month')).toBe(true);
    expect(isUnavailable(new CalendarDate(2026, 8, 1), limites, 'month')).toBe(false);
    expect(isUnavailable(new CalendarDate(2026, 9, 1), limites, 'month')).toBe(true);
    expect(isUnavailable(new CalendarDate(2025, 1, 1), limites, 'year')).toBe(true);
    expect(isUnavailable(new CalendarDate(2026, 1, 1), limites, 'year')).toBe(false);
  });

  it('o predicado recebe o primeiro dia do periodo', () => {
    const recebidos: string[] = [];

    isUnavailable(marco, { isDateUnavailable: (data) => (recebidos.push(data.toString()), false) }, 'month');

    expect(recebidos).toEqual(['2026-03-01']);
  });

  it('monta doze meses ou doze anos em quatro linhas de tres', () => {
    const meses = buildPeriods(new CalendarDate(2026, 1, 1), 'month');
    const anos = buildPeriods(new CalendarDate(2020, 1, 1), 'year');

    expect(meses.map((linha) => linha.length)).toEqual([3, 3, 3, 3]);
    expect(meses[1][0].date.toString()).toBe('2026-04-01');
    expect(anos[3][2].date.toString()).toBe('2031-01-01');
  });

  it('separa o recusado pelo predicado do que esta fora da faixa', () => {
    const [primeira] = buildPeriods(new CalendarDate(2026, 1, 1), 'month', {
      min: new CalendarDate(2026, 2, 1),
      isDateUnavailable: (data) => data.month === 3,
    });

    expect(primeira.map((mes) => [mes.unavailable, mes.excluded])).toEqual([
      [true, false],
      [false, false],
      [true, true],
    ]);
  });

  it('a pagina de anos comeca na decada e anda de doze em doze', () => {
    const pagina = startOfPage(new CalendarDate(2026, 5, 1), 'year');

    expect(pagina.toString()).toBe('2020-01-01');
    expect(startOfPage(new CalendarDate(2032, 1, 1), 'year', pagina).toString()).toBe('2032-01-01');
    expect(startOfPage(new CalendarDate(2019, 1, 1), 'year', pagina).toString()).toBe('2008-01-01');
  });
});

describe('teclado da grade de periodos', () => {
  const ano = new CalendarDate(2026, 1, 1);
  const junho = new CalendarDate(2026, 6, 1);

  it('anda um para os lados e tres para cima e para baixo', () => {
    expect(movePeriodFocus(junho, 'ArrowRight', 'month', ano, {})?.toString()).toBe('2026-07-01');
    expect(movePeriodFocus(junho, 'ArrowUp', 'month', ano, {})?.toString()).toBe('2026-03-01');
    expect(movePeriodFocus(junho, 'ArrowDown', 'month', ano, {})?.toString()).toBe('2026-09-01');
  });

  it('Home e End vao ao comeco e ao fim da linha', () => {
    expect(movePeriodFocus(junho, 'Home', 'month', ano, {})?.toString()).toBe('2026-04-01');
    expect(movePeriodFocus(junho, 'End', 'month', ano, {})?.toString()).toBe('2026-06-01');

    const pagina = new CalendarDate(2020, 1, 1);
    expect(movePeriodFocus(new CalendarDate(2027, 1, 1), 'Home', 'year', pagina, {})?.toString()).toBe('2026-01-01');
    expect(movePeriodFocus(new CalendarDate(2027, 1, 1), 'End', 'year', pagina, {})?.toString()).toBe('2028-01-01');
  });

  it('passa da borda para o ano vizinho', () => {
    expect(movePeriodFocus(new CalendarDate(2026, 12, 1), 'ArrowRight', 'month', ano, {})?.toString()).toBe('2027-01-01');
    expect(movePeriodFocus(new CalendarDate(2026, 2, 1), 'ArrowUp', 'month', ano, {})?.toString()).toBe('2025-11-01');
  });

  it('nao passa dos limites', () => {
    const limites = { max: new CalendarDate(2026, 7, 20) };

    expect(movePeriodFocus(junho, 'ArrowDown', 'month', ano, limites)?.toString()).toBe('2026-07-01');
    expect(movePeriodFocus(junho, 'a', 'month', ano, limites)).toBeUndefined();
  });
});
