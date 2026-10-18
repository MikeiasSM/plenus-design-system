import { tokenize, tokenizeLines, type CodeSyntax, type CodeToken } from './syntax';

function coloridos(code: string, syntax: CodeSyntax): [string, string][] {
  return tokenize(code, syntax)
    .filter((token): token is Required<CodeToken> => token.kind !== undefined)
    .map((token) => [token.kind, token.text]);
}

describe('realce de sintaxe', () => {
  it('reconhece em Java a palavra reservada, o texto, o numero, a anotacao e a chamada', () => {
    expect(coloridos('@Override public int soma() { return total(42) + "x".length(); }', 'java')).toEqual([
      ['annotation', '@Override'],
      ['keyword', 'public'],
      ['keyword', 'int'],
      ['function', 'soma'],
      ['keyword', 'return'],
      ['function', 'total'],
      ['number', '42'],
      ['string', '"x"'],
      ['function', 'length'],
    ]);
  });

  it('nao procura palavra reservada dentro de texto nem de comentario', () => {
    expect(coloridos('String s = "if else"; // return null', 'java')).toEqual([
      ['string', '"if else"'],
      ['comment', '// return null'],
    ]);
  });

  it('o texto sem fechamento termina na linha, sem engolir a seguinte', () => {
    expect(coloridos('"aberto\nint x;', 'java')).toEqual([
      ['string', '"aberto'],
      ['keyword', 'int'],
    ]);
  });

  it('le o SQL sem distinguir caixa', () => {
    expect(coloridos("select * FROM conta where nome = 'Ana'", 'sql')).toEqual([
      ['keyword', 'select'],
      ['keyword', 'FROM'],
      ['keyword', 'where'],
      ['string', "'Ana'"],
    ]);
  });

  it('separa no JSON a chave do valor', () => {
    expect(coloridos('{ "ativo": true, "nome": "Ana", "total": -1.5 }', 'json')).toEqual([
      ['property', '"ativo"'],
      ['keyword', 'true'],
      ['property', '"nome"'],
      ['string', '"Ana"'],
      ['property', '"total"'],
      ['number', '-1.5'],
    ]);
  });

  it('no shell, # so abre comentario no comeco de uma palavra', () => {
    expect(coloridos('echo $# a#b # fim', 'shell')).toEqual([
      ['property', '$#'],
      ['comment', '# fim'],
    ]);
  });

  it('o TypeScript soma as palavras dele as do JavaScript', () => {
    expect(coloridos('const x: string = `t`', 'typescript')).toEqual([
      ['keyword', 'const'],
      ['keyword', 'string'],
      ['string', '`t`'],
    ]);
  });

  it('nao perde nem acrescenta caractere', () => {
    const trecho = 'class A {\n  /* um\n  dois */\n  int x = 0x1F; // fim\n}';

    expect(tokenize(trecho, 'java').map((token) => token.text).join('')).toBe(trecho);
  });
});

describe('linhas do trecho', () => {
  it('parte o comentario de bloco nas linhas que ele atravessa, mantendo o papel', () => {
    expect(tokenizeLines('/* um\ndois */ x', 'java')).toEqual([
      [{ kind: 'comment', text: '/* um' }],
      [{ kind: 'comment', text: 'dois */' }, { text: ' x' }],
    ]);
  });

  it('mantem a linha vazia, para a numeracao nao pular', () => {
    expect(tokenizeLines('a\n\nb')).toEqual([[{ text: 'a' }], [], [{ text: 'b' }]]);
  });
});
