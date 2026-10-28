import { formatDateInput, parseDateInput } from './formatDateInput';
import { formatDateTimeInput, formatTimeInput, parseDateTimeInput, parseTimeInput } from './formatTimeInput';

describe('formatDateInput', () => {
  it('aplica a mascara conforme a digitacao avanca', () => {
    expect(formatDateInput('0')).toBe('0');
    expect(formatDateInput('09')).toBe('09');
    expect(formatDateInput('0903')).toBe('09/03');
    expect(formatDateInput('09032026')).toBe('09/03/2026');
  });

  it('descarta o que passa do ano e o que nao e digito', () => {
    expect(formatDateInput('09/03/2026999')).toBe('09/03/2026');
    expect(formatDateInput('09-03-2026')).toBe('09/03/2026');
  });
});

describe('parseDateInput', () => {
  it('aceita barra, traco, ponto e espaco', () => {
    expect(parseDateInput('09/03/2026')?.toString()).toBe('2026-03-09');
    expect(parseDateInput('09-03-2026')?.toString()).toBe('2026-03-09');
    expect(parseDateInput('09.03.2026')?.toString()).toBe('2026-03-09');
    expect(parseDateInput('09 03 2026')?.toString()).toBe('2026-03-09');
  });

  it('recusa data inexistente', () => {
    expect(parseDateInput('31/02/2026')).toBeUndefined();
    expect(parseDateInput('32/01/2026')).toBeUndefined();
    expect(parseDateInput('09/13/2026')).toBeUndefined();
  });

  it('recusa entrada incompleta', () => {
    expect(parseDateInput('09/03')).toBeUndefined();
    expect(parseDateInput('')).toBeUndefined();
    expect(parseDateInput('nao e data')).toBeUndefined();
  });

  it('fecha a parte no separador digitado, sem empurrar digito para a vizinha', () => {
    expect(formatDateInput('1/')).toBe('1/');
    expect(formatDateInput('1/3/2026')).toBe('1/3/2026');
    expect(parseDateInput('1/3/2026')?.toString()).toBe('2026-03-01');
    expect(formatDateInput('9/12/2026')).toBe('9/12/2026');
  });

  it('deixa o dia ser reescrito no meio da data', () => {
    expect(formatDateInput('1/03/2026')).toBe('1/03/2026');
    expect(formatDateInput('15/03/2026')).toBe('15/03/2026');
    expect(formatDateInput('095/03/2026')).toBe('09/03/2026');
  });

  it('reordena a data colada em ISO', () => {
    expect(formatDateInput('2026-03-09')).toBe('09/03/2026');
    expect(formatDateInput('2026-3-9')).toBe('09/03/2026');
  });

  it('nao confunde a digitacao comum com data colada', () => {
    expect(formatDateInput('09032026')).toBe('09/03/2026');
    expect(formatDateInput('090')).toBe('09/0');
  });
});

describe('formatTimeInput e formatDateTimeInput', () => {
  it('fecha a hora no dois-pontos digitado', () => {
    expect(formatTimeInput('9:')).toBe('9:');
    expect(formatTimeInput('9:30')).toBe('9:30');
    expect(parseTimeInput('9:30')?.toString()).toBe('09:30:00');
    expect(formatTimeInput('0930')).toBe('09:30');
  });

  it('entende data e hora coladas sem zero a esquerda', () => {
    expect(formatDateTimeInput('1/3/2026 18:40')).toBe('1/3/2026 18:40');
    expect(parseDateTimeInput('1/3/2026 18:40')?.toString()).toBe('2026-03-01T18:40:00');
    expect(formatDateTimeInput('090320261840')).toBe('09/03/2026 18:40');
  });
});
