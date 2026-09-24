import { containsTerm, startsWithTerm } from './textSearch';

describe('startsWithTerm', () => {
  it('ignores case and accents', () => {
    expect(startsWithTerm('Cartão', 'cartao')).toBe(true);
    expect(startsWithTerm('Orçamento', 'orc')).toBe(true);
    expect(startsWithTerm('São Paulo', 'sao p')).toBe(true);
  });

  it('matches only from the beginning', () => {
    expect(startsWithTerm('Cartão de crédito', 'credito')).toBe(false);
  });

  it('accepts decomposed input', () => {
    expect(startsWithTerm('Cafe\u0301', 'café')).toBe(true);
  });
});

describe('containsTerm', () => {
  it('finds the term anywhere, ignoring accents', () => {
    expect(containsTerm('Cartão de crédito', 'credito')).toBe(true);
    expect(containsTerm('Ribeirão Preto', 'rao pre')).toBe(true);
  });

  it('rejects what is not there', () => {
    expect(containsTerm('São Paulo', 'rio')).toBe(false);
  });

  it('treats an empty term as a match', () => {
    expect(containsTerm('São Paulo', '')).toBe(true);
  });
});
