import { formatarDuracao } from './formatarDuracao';

const MINUTO = 60_000;
const HORA = 60 * MINUTO;

describe('formatarDuracao', () => {
  it('escreve horas e minutos, com os minutos em dois digitos depois da hora', () => {
    expect(formatarDuracao(10 * HORA + 16 * MINUTO)).toBe('10h16m');
    expect(formatarDuracao(HORA + 5 * MINUTO)).toBe('1h05m');
  });

  it('omite a parte que vale zero', () => {
    expect(formatarDuracao(48 * MINUTO)).toBe('48m');
    expect(formatarDuracao(12 * HORA)).toBe('12h');
    expect(formatarDuracao(0)).toBe('0m');
  });

  it('arredonda ao minuto, subindo a hora quando os minutos completam sessenta', () => {
    expect(formatarDuracao(59 * MINUTO + 40_000)).toBe('1h');
    expect(formatarDuracao(29_000)).toBe('0m');
  });

  it('devolve vazio para o que nao e uma duracao', () => {
    expect(formatarDuracao(Number.NaN)).toBe('');
    expect(formatarDuracao(-MINUTO)).toBe('');
  });
});
