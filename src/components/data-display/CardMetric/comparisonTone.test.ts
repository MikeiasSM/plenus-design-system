import { comparisonTone } from './comparisonTone';

describe('comparisonTone', () => {
  it.each([
    [0.124, 'higherIsBetter', 'up', 'success'],
    [-0.031, 'higherIsBetter', 'down', 'danger'],
    [0.124, 'lowerIsBetter', 'up', 'danger'],
    [-0.031, 'lowerIsBetter', 'down', 'success'],
    [0.124, 'neutral', 'up', 'neutral'],
    [0, 'higherIsBetter', 'flat', 'neutral'],
  ] as const)('variacao %s com %s sobe a seta %s no tom %s', (change, polarity, direction, tone) => {
    expect(comparisonTone({ change, label: 'vs. mês anterior', polarity })).toEqual({ direction, tone });
  });

  it('deixa o produto forcar a cor e a seta', () => {
    expect(comparisonTone({ change: 0.1, direction: 'flat', label: 'meta', tone: 'danger' })).toEqual({
      direction: 'flat',
      tone: 'danger',
    });
  });
});
