import { formatDuration } from './formatDuration';

const MINUTO = 60_000;
const HORA = 60 * MINUTO;

describe('formatDuration', () => {
  it('escreve horas e minutos, com os minutos em dois digitos depois da hora', () => {
    expect(formatDuration(10 * HORA + 16 * MINUTO)).toBe('10h16m');
    expect(formatDuration(HORA + 5 * MINUTO)).toBe('1h05m');
  });

  it('omite a parte que vale zero', () => {
    expect(formatDuration(48 * MINUTO)).toBe('48m');
    expect(formatDuration(12 * HORA)).toBe('12h');
    expect(formatDuration(0)).toBe('0m');
  });

  it('arredonda ao minuto, subindo a hora quando os minutos completam sessenta', () => {
    expect(formatDuration(59 * MINUTO + 40_000)).toBe('1h');
    expect(formatDuration(29_000)).toBe('0m');
  });

  it('devolve vazio para o que nao e uma duracao', () => {
    expect(formatDuration(Number.NaN)).toBe('');
    expect(formatDuration(-MINUTO)).toBe('');
  });
});
