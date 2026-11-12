import { CalendarDate } from '@internationalized/date';
import { completeDateInput, completeDateTimeInput, completeTimeInput, keepDateChars, keepDigits } from './completeInput';

const hoje = new CalendarDate(2026, 11, 12);
const data = (texto: string) => completeDateInput(texto, hoje)?.toString();
const hora = (texto: string) => {
  const lida = completeTimeInput(texto);
  return lida && lida.hour + ':' + lida.minute;
};

describe('completeDateInput', () => {
  it.each([
    ['1', '2026-11-01'],
    ['15', '2026-11-15'],
    ['215', '2026-05-21'],
    ['112', '2026-02-11'],
    ['2105', '2026-05-21'],
    ['260326', '2026-03-26'],
    ['260350', '2050-03-26'],
    ['21052026', '2026-05-21'],
    ['21/05/2026', '2026-05-21'],
  ])('completa %s em %s', (digitado, esperado) => {
    expect(data(digitado)).toBe(esperado);
  });

  it.each(['', '12345', '1234567', '32', '3102', '0000', '0', '00', '13/13'])('recusa %s', (digitado) => {
    expect(data(digitado)).toBeUndefined();
  });

  it('le so os digitos, sem os separadores', () => {
    expect(data('1/12')).toBe('2026-02-11');
    expect(data('1/1/2026')).toBeUndefined();
  });
});

describe('completeTimeInput', () => {
  it.each([
    ['8', '8:0'],
    ['14', '14:0'],
    ['830', '8:30'],
    ['1430', '14:30'],
    ['14:30', '14:30'],
    ['8:30', '8:30'],
  ])('completa %s em %s', (digitado, esperado) => {
    expect(hora(digitado)).toBe(esperado);
  });

  it.each(['', '25', '1275', '12345', '99'])('recusa %s', (digitado) => {
    expect(hora(digitado)).toBeUndefined();
  });
});

describe('completeDateTimeInput', () => {
  const lido = (texto: string) => {
    const r = completeDateTimeInput(texto, hoje);
    return r.value?.toString() ?? r.invalid;
  };

  it('completa data e hora separadas pelo espaco', () => {
    expect(lido('21/05/2026 8')).toBe('2026-05-21T08:00:00');
    expect(lido('21/05/2026 1430')).toBe('2026-05-21T14:30:00');
    expect(lido('21/05/2026 14:30')).toBe('2026-05-21T14:30:00');
  });

  it('completa a data sem hora em meia-noite', () => {
    expect(lido('215')).toBe('2026-05-21T00:00:00');
    expect(lido('21/05/2026 ')).toBe('2026-05-21T00:00:00');
  });

  it('aponta a parte invalida', () => {
    expect(lido('32/05/2026 08:00')).toBe('date');
    expect(lido('21/05/2026 25')).toBe('time');
  });
});

describe('keepDigits', () => {
  it('guarda so os digitos', () => {
    expect(keepDigits('1a2-3/4 5')).toBe('12345');
    expect(keepDigits('21/05/2026 1a4:30')).toBe('210520261430');
  });
});

describe('keepDateChars', () => {
  it('preserva a data colada em ISO, que a mascara reordena', () => {
    expect(keepDateChars('2026-03-09')).toBe('2026-03-09');
    expect(keepDateChars('09-03-2026')).toBe('09032026');
    expect(keepDateChars('1/12')).toBe('112');
  });
});
