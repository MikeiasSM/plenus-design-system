import { hiddenTabs } from './overflow';

const keys = ['a', 'b', 'c', 'd', 'e'];
const widths = [100, 100, 100, 100, 100];

describe('hiddenTabs', () => {
  it('cabendo todas, nenhuma vai para o menu, sem reservar o botao', () => {
    expect(hiddenTabs({ available: 500, gap: 0, keys, moreWidth: 80, widths })).toEqual([]);
  });

  it('sem caber, ficam as primeiras ao lado do botao e as outras vao para o menu', () => {
    expect(hiddenTabs({ available: 400, gap: 0, keys, moreWidth: 80, widths })).toEqual(['d', 'e']);
  });

  it('conta o espaco entre as abas e antes do botao', () => {
    // Tres abas com 4 de espaco somam 308, dentro dos 316 que sobram ao lado do botao.
    expect(hiddenTabs({ available: 400, gap: 4, keys, moreWidth: 80, widths })).toEqual(['d', 'e']);
    // Com 10 de espaco, somam 320, alem dos 310: cabem duas.
    expect(hiddenTabs({ available: 400, gap: 10, keys, moreWidth: 80, widths })).toEqual(['c', 'd', 'e']);
  });

  it('a escolhida no fim toma o lugar da ultima visivel', () => {
    expect(hiddenTabs({ available: 400, gap: 0, keys, moreWidth: 80, selected: 'e', widths })).toEqual(['c', 'd']);
  });

  it('a escolhida larga tira quantas visiveis precisar', () => {
    expect(
      hiddenTabs({ available: 400, gap: 0, keys, moreWidth: 80, selected: 'e', widths: [100, 100, 100, 100, 200] }),
    ).toEqual(['b', 'c', 'd']);
  });

  it('a escolhida fica mesmo sem caber sozinha', () => {
    expect(hiddenTabs({ available: 100, gap: 0, keys, moreWidth: 80, selected: 'c', widths })).toEqual([
      'a',
      'b',
      'd',
      'e',
    ]);
  });
});
