import {
  clearSelection,
  emptySelection,
  firstKey,
  lastKey,
  matchKey,
  nextKey,
  previousKey,
  select,
  selectRange,
  selectionStatus,
  toggleAll,
  type SelectionItem,
} from './selection';

const items: SelectionItem[] = [
  { key: 'pix', textValue: 'Pix' },
  { key: 'boleto', textValue: 'Boleto', disabled: true },
  { key: 'cartao', textValue: 'Cartao' },
  { key: 'credito', textValue: 'Credito' },
];

describe('navegacao', () => {
  it('encontra a primeira e a ultima opcao habilitada', () => {
    expect(firstKey(items)).toBe('pix');
    expect(lastKey(items)).toBe('credito');
    expect(firstKey([{ key: 'a', disabled: true }])).toBeUndefined();
  });

  it('pula as opcoes desabilitadas ao avancar e ao voltar', () => {
    expect(nextKey(items, 'pix')).toBe('cartao');
    expect(previousKey(items, 'cartao')).toBe('pix');
  });

  it('nao circula nas extremidades', () => {
    expect(nextKey(items, 'credito')).toBeUndefined();
    expect(previousKey(items, 'pix')).toBeUndefined();
  });

  it('parte do inicio ou do fim quando nao ha foco', () => {
    expect(nextKey(items, undefined)).toBe('pix');
    expect(previousKey(items, undefined)).toBe('credito');
  });

  it('avanca a partir de uma opcao desabilitada sem voltar ao inicio', () => {
    expect(nextKey(items, 'boleto')).toBe('cartao');
    expect(previousKey(items, 'boleto')).toBe('pix');
  });
});

describe('typeahead', () => {
  it('encontra pelo inicio do texto, ignorando caixa', () => {
    expect(matchKey(items, 'car', undefined)).toBe('cartao');
    expect(matchKey(items, 'PIX', undefined)).toBe('pix');
  });

  it('avanca para a proxima correspondencia e circula', () => {
    expect(matchKey(items, 'c', 'cartao')).toBe('credito');
    expect(matchKey(items, 'c', 'credito')).toBe('cartao');
  });

  it('ignora opcoes desabilitadas e buscas vazias', () => {
    expect(matchKey(items, 'bol', undefined)).toBeUndefined();
    expect(matchKey(items, '   ', undefined)).toBeUndefined();
  });

  it('usa a chave quando nao ha texto declarado', () => {
    expect(matchKey([{ key: 'alfa' }], 'al', undefined)).toBe('alfa');
  });

  it('encontra sem acento o texto acentuado', () => {
    const acentuados: SelectionItem[] = [
      { key: 'sp', textValue: 'São Paulo' },
      { key: 'orcamento', textValue: 'Orçamento' },
    ];

    expect(matchKey(acentuados, 'sao', undefined)).toBe('sp');
    expect(matchKey(acentuados, 'orc', undefined)).toBe('orcamento');
  });
});

describe('selecao', () => {
  it('substitui a escolha no modo simples', () => {
    const primeiro = select(emptySelection, 'pix', 'single');
    const segundo = select(primeiro, 'cartao', 'single');

    expect([...segundo.selectedKeys]).toEqual(['cartao']);
    expect(segundo.focusedKey).toBe('cartao');
  });

  it('acumula e alterna no modo multiplo', () => {
    const comPix = select(emptySelection, 'pix', 'multiple');
    const comCartao = select(comPix, 'cartao', 'multiple');
    const semPix = select(comCartao, 'pix', 'multiple');

    expect([...comCartao.selectedKeys].sort()).toEqual(['cartao', 'pix']);
    expect([...semPix.selectedKeys]).toEqual(['cartao']);
  });

  it('nao altera nada quando a selecao esta desligada', () => {
    expect(select(emptySelection, 'pix', 'none')).toBe(emptySelection);
  });

  it('preserva o estado anterior, sem mutacao', () => {
    const anterior = select(emptySelection, 'pix', 'multiple');
    select(anterior, 'cartao', 'multiple');

    expect([...anterior.selectedKeys]).toEqual(['pix']);
  });

  it('limpa a escolha mantendo o foco', () => {
    const escolhido = select(emptySelection, 'pix', 'single');

    expect(clearSelection(escolhido)).toEqual({ focusedKey: 'pix', selectedKeys: new Set() });
  });
});

describe('faixa e marcar todos', () => {
  it('seleciona da ancora ate o alvo, pulando desabilitados', () => {
    const ancorado = select(emptySelection, 'pix', 'multiple');

    expect(selectRange(ancorado, 'credito', items).selectedKeys).toEqual(new Set(['pix', 'cartao', 'credito']));
  });

  it('seleciona a faixa tambem de baixo para cima', () => {
    const ancorado = select(emptySelection, 'credito', 'multiple');

    expect(selectRange(ancorado, 'pix', items).selectedKeys).toEqual(new Set(['credito', 'cartao', 'pix']));
  });

  it('acumula sobre o que ja estava escolhido', () => {
    const anterior = { anchorKey: 'cartao', focusedKey: 'cartao', selectedKeys: new Set(['boleto']) };

    expect(selectRange(anterior, 'credito', items).selectedKeys).toEqual(new Set(['boleto', 'cartao', 'credito']));
  });

  it('informa se a escolha esta vazia, parcial ou completa', () => {
    expect(selectionStatus(emptySelection, items)).toBe('none');
    expect(selectionStatus({ selectedKeys: new Set(['pix']) }, items)).toBe('partial');
    expect(selectionStatus({ selectedKeys: new Set(['pix', 'cartao', 'credito']) }, items)).toBe('all');
  });

  it('marca todos os habilitados e desmarca quando ja estao todos', () => {
    const todos = toggleAll(emptySelection, items);

    expect(todos.selectedKeys).toEqual(new Set(['pix', 'cartao', 'credito']));
    expect(toggleAll(todos, items).selectedKeys).toEqual(new Set());
  });
});
