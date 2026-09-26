import { formatarEntradaData, lerEntradaData } from './formatarEntradaData';

describe('formatarEntradaData', () => {
  it('aplica a mascara conforme a digitacao avanca', () => {
    expect(formatarEntradaData('0')).toBe('0');
    expect(formatarEntradaData('09')).toBe('09');
    expect(formatarEntradaData('0903')).toBe('09/03');
    expect(formatarEntradaData('09032026')).toBe('09/03/2026');
  });

  it('descarta o que passa do ano e o que nao e digito', () => {
    expect(formatarEntradaData('09/03/2026999')).toBe('09/03/2026');
    expect(formatarEntradaData('09-03-2026')).toBe('09/03/2026');
  });
});

describe('lerEntradaData', () => {
  it('aceita barra, traco, ponto e espaco', () => {
    expect(lerEntradaData('09/03/2026')?.toString()).toBe('2026-03-09');
    expect(lerEntradaData('09-03-2026')?.toString()).toBe('2026-03-09');
    expect(lerEntradaData('09.03.2026')?.toString()).toBe('2026-03-09');
    expect(lerEntradaData('09 03 2026')?.toString()).toBe('2026-03-09');
  });

  it('recusa data inexistente', () => {
    expect(lerEntradaData('31/02/2026')).toBeUndefined();
    expect(lerEntradaData('32/01/2026')).toBeUndefined();
    expect(lerEntradaData('09/13/2026')).toBeUndefined();
  });

  it('recusa entrada incompleta', () => {
    expect(lerEntradaData('09/03')).toBeUndefined();
    expect(lerEntradaData('')).toBeUndefined();
    expect(lerEntradaData('nao e data')).toBeUndefined();
  });

  it('entende data colada sem zero a esquerda', () => {
    expect(formatarEntradaData('1/3/2026')).toBe('01/03/2026');
    expect(formatarEntradaData('9/12/2026')).toBe('09/12/2026');
    expect(formatarEntradaData('09/03/2026')).toBe('09/03/2026');
  });

  it('reordena a data colada em ISO', () => {
    expect(formatarEntradaData('2026-03-09')).toBe('09/03/2026');
    expect(formatarEntradaData('2026-3-9')).toBe('09/03/2026');
  });

  it('nao confunde a digitacao comum com data colada', () => {
    expect(formatarEntradaData('09032026')).toBe('09/03/2026');
    expect(formatarEntradaData('090')).toBe('09/0');
  });
});
