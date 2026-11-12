import { blockRepeatedPress, isRepeatedClick } from './press';

function tecla(key: string, repeat: boolean) {
  return { key, preventDefault: vi.fn(), repeat };
}

describe('press', () => {
  it('bloqueia Enter e Espaço repetidos e deixa passar os demais', () => {
    const enter = tecla('Enter', true);
    const espaco = tecla(' ', true);
    const seta = tecla('ArrowDown', true);

    expect(blockRepeatedPress(enter)).toBe(true);
    expect(blockRepeatedPress(espaco)).toBe(true);
    expect(blockRepeatedPress(seta)).toBe(false);
    expect(enter.preventDefault).toHaveBeenCalled();
    expect(seta.preventDefault).not.toHaveBeenCalled();
  });

  it('deixa passar a primeira tecla', () => {
    const enter = tecla('Enter', false);

    expect(blockRepeatedPress(enter)).toBe(false);
    expect(enter.preventDefault).not.toHaveBeenCalled();
  });

  it('reconhece o clique que repete o gesto', () => {
    expect(isRepeatedClick({ detail: 2 })).toBe(true);
    expect(isRepeatedClick({ detail: 1 })).toBe(false);
    expect(isRepeatedClick({ detail: 0 })).toBe(false);
  });
});
