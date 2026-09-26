import { formatarData, formatarHora } from './formatarData';

describe('formatarData', () => {
  it('usa a convencao brasileira por padrao', () => {
    expect(formatarData('2026-03-09')).toBe('09/03/2026');
  });

  it('interpreta a data ISO no fuso local, sem recuar um dia', () => {
    expect(formatarData('2026-01-01')).toBe('01/01/2026');
  });

  it('aceita a cadeia completa que sai de toISOString', () => {
    // Antes, o corte por hifen engolia o `T` e devolvia vazio.
    expect(formatarData('2026-03-09T10:00:00.000Z')).not.toBe('');
    expect(formatarData('2026-03-09T10:00:00.000-03:00')).toBe('09/03/2026');
  });

  it('aceita os formatos curto e longo', () => {
    expect(formatarData('2026-03-09', { formato: 'curto' })).toContain('2026');
    expect(formatarData('2026-03-09', { formato: 'longo' })).toContain('março');
  });

  it('respeita a localidade informada', () => {
    expect(formatarData('2026-03-09', { localidade: 'en-US' })).toBe('03/09/2026');
  });

  it('devolve vazio para entrada invalida', () => {
    expect(formatarData('sem data')).toBe('');
  });
});

describe('formatarHora', () => {
  it('formata em 24 horas', () => {
    expect(formatarHora('14:35')).toBe('14:35');
  });

  it('inclui os segundos quando pedido', () => {
    expect(formatarHora('14:35:09', { segundos: true })).toBe('14:35:09');
  });

  it('aceita uma data completa', () => {
    expect(formatarHora(new Date(2026, 2, 9, 8, 5))).toBe('08:05');
  });

  it('devolve vazio para entrada invalida', () => {
    expect(formatarHora('sem hora')).toBe('');
  });
});
