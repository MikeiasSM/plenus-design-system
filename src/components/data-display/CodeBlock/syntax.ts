/**
 * Realce de sintaxe por regras lexicas, sem analisador de linguagem: reconhece o
 * que ajuda a ler o trecho — palavra reservada, texto, numero, comentario,
 * anotacao, chamada, propriedade, tag e atributo — e deixa o resto sem cor.
 */

export type CodeSyntax = 'java' | 'javascript' | 'jsx' | 'typescript' | 'tsx' | 'sql' | 'json' | 'shell' | 'delphi';

export type CodeTokenKind =
  | 'annotation'
  | 'attribute'
  | 'comment'
  | 'function'
  | 'keyword'
  | 'number'
  | 'property'
  | 'string'
  | 'tag';

export interface CodeToken {
  kind?: CodeTokenKind;
  text: string;
}

/** Regra sem papel reconhece um trecho para que nenhuma outra o pinte, como o texto entre tags. */
type Rule = readonly [CodeTokenKind | undefined, RegExp];

interface Grammar {
  kinds: readonly (CodeTokenKind | undefined)[];
  pattern: RegExp;
}

export const SYNTAX_LABELS: Readonly<Record<CodeSyntax, string>> = {
  java: 'Java',
  javascript: 'JavaScript',
  jsx: 'JSX',
  typescript: 'TypeScript',
  tsx: 'TSX',
  sql: 'SQL',
  json: 'JSON',
  shell: 'Shell',
  delphi: 'Delphi',
};

function words(list: string): RegExp {
  return new RegExp(`\\b(?:${list.trim().split(/\s+/).join('|')})\\b`);
}

const BLOCK_COMMENT = /\/\*[\s\S]*?(?:\*\/|$)/;
const LINE_COMMENT = /\/\/.*/;
const DOUBLE_QUOTED = /"(?:\\.|[^"\\\n])*"?/;
const SINGLE_QUOTED = /'(?:\\.|[^'\\\n])*'?/;
const NUMBER = /\b(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)[lLfFdDn]?\b/;
const CALL = /\b[A-Za-z_$][\w$]*(?=\s*\()/;
const ANNOTATION = /@[A-Za-z_]\w*/;

const JAVA_KEYWORDS = words(`
  abstract assert boolean break byte case catch char class const continue default do double else enum extends
  final finally float for goto if implements import instanceof int interface long native new package private
  protected public record return sealed short static strictfp super switch synchronized this throw throws
  transient try var void volatile while yield true false null
`);

const JAVASCRIPT_WORDS = `
  async await break case catch class const continue debugger default delete do else export extends finally for
  from function get if import in instanceof let new of return set static super switch this throw try typeof var
  void while with yield true false null undefined
`;

const TYPESCRIPT_WORDS = `
  abstract any as asserts bigint boolean declare enum implements infer interface is keyof namespace never number
  object private protected public readonly satisfies string symbol type unique unknown
`;

const SQL_KEYWORDS = words(`
  add all alter and as asc begin between by case check column commit constraint create cross database default
  delete desc distinct drop else end exists foreign from full grant group having if in index inner insert into
  is join key left like limit not null offset on or order outer primary procedure references returning revoke
  right rollback schema select set table then transaction trigger true false union unique update values view
  when where with
`);

const SHELL_KEYWORDS = words(`
  case declare do done elif else esac exit export fi for function if in local readonly return select then until
  while
`);

const DELPHI_KEYWORDS = words(`
  absolute abstract and array as asm begin case class const constructor default deprecated destructor dispinterface
  div do downto dynamic else end except exports external false file finalization finally for forward function goto
  helper if implementation implements in inherited initialization inline interface is label library message mod nil
  not object of on operator or out overload override packed platform private procedure program property protected
  public published raise read record reintroduce repeat resourcestring sealed self set shl shr static stdcall strict
  string then threadvar to true try type unit until uses var virtual while with write xor
`);

const JAVASCRIPT_RULES: readonly Rule[] = [
  ['comment', LINE_COMMENT],
  ['comment', BLOCK_COMMENT],
  ['string', /`(?:\\[\s\S]|[^`\\])*`?/],
  ['string', DOUBLE_QUOTED],
  ['string', SINGLE_QUOTED],
  ['number', NUMBER],
];

const JAVASCRIPT: readonly Rule[] = [...JAVASCRIPT_RULES, ['keyword', words(JAVASCRIPT_WORDS)], ['function', CALL]];

const TYPESCRIPT: readonly Rule[] = [
  ...JAVASCRIPT_RULES,
  ['annotation', ANNOTATION],
  ['keyword', words(JAVASCRIPT_WORDS + TYPESCRIPT_WORDS)],
  ['function', CALL],
];

/**
 * Vem antes das regras da linguagem. O `<` colado a um nome e o generico de `useState<string>`, e nao uma tag; o
 * texto entre `>` e `<` e conteudo, e o numero dentro dele nao e literal.
 */
const JSX_RULES: readonly Rule[] = [
  [undefined, /(?<=>)[^<>{}\n]+(?=<)/],
  ['tag', /(?<=<\/|(?:^|[^\w$)\]])<)[A-Za-z][\w.]*/],
  ['attribute', /\b[A-Za-z_][\w-]*(?==[{"'])/],
];

const RULES: Readonly<Record<CodeSyntax, readonly Rule[]>> = {
  java: [
    ['comment', LINE_COMMENT],
    ['comment', BLOCK_COMMENT],
    ['string', /"""[\s\S]*?(?:"""|$)/],
    ['string', DOUBLE_QUOTED],
    ['string', /'(?:\\.|[^'\\\n])'/],
    ['annotation', ANNOTATION],
    ['number', NUMBER],
    ['keyword', JAVA_KEYWORDS],
    ['function', CALL],
  ],
  javascript: JAVASCRIPT,
  jsx: [...JSX_RULES, ...JAVASCRIPT],
  typescript: TYPESCRIPT,
  tsx: [...JSX_RULES, ...TYPESCRIPT],
  sql: [
    ['comment', /--.*/],
    ['comment', BLOCK_COMMENT],
    ['string', /'(?:''|[^'])*'?/],
    ['number', NUMBER],
    ['keyword', SQL_KEYWORDS],
    ['function', CALL],
  ],
  json: [
    ['property', /"(?:\\.|[^"\\\n])*"(?=\s*:)/],
    ['string', DOUBLE_QUOTED],
    ['number', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
    ['keyword', /\b(?:true|false|null)\b/],
  ],
  shell: [
    ['comment', /(?<![^\s;])#.*/],
    ['string', DOUBLE_QUOTED],
    ['string', SINGLE_QUOTED],
    ['property', /\$(?:\{[^}\n]*\}|\w+|[@*#?$!])/],
    ['keyword', SHELL_KEYWORDS],
    ['number', NUMBER],
  ],
  // A diretiva de compilacao usa a forma do comentario, com `$` na abertura: vem antes dele e sai como anotacao.
  delphi: [
    ['annotation', /\{\$[^}]*\}?|\(\*\$[\s\S]*?(?:\*\)|$)/],
    ['comment', LINE_COMMENT],
    ['comment', /\{[\s\S]*?(?:\}|$)/],
    ['comment', /\(\*[\s\S]*?(?:\*\)|$)/],
    ['string', /'(?:''|[^'\n])*'?/],
    ['string', /#(?:\$[\da-fA-F]+|\d+)/],
    ['number', /\$[\da-fA-F]+\b|%[01]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
    ['keyword', DELPHI_KEYWORDS],
    ['function', CALL],
  ],
};

/** SQL e Delphi sao lidos sem distincao de caixa: `select` e `SELECT`, `begin` e `Begin` sao a mesma palavra. */
const CASE_INSENSITIVE: ReadonlySet<CodeSyntax> = new Set(['sql', 'delphi']);

const grammars = new Map<CodeSyntax, Grammar>();

function grammarOf(syntax: CodeSyntax): Grammar {
  const cached = grammars.get(syntax);

  if (cached) {
    return cached;
  }

  const rules = RULES[syntax];
  const flags = CASE_INSENSITIVE.has(syntax) ? 'gi' : 'g';
  const grammar = {
    kinds: rules.map(([kind]) => kind),
    pattern: new RegExp(rules.map(([, rule]) => `(${rule.source})`).join('|'), flags),
  };

  grammars.set(syntax, grammar);

  return grammar;
}

export function tokenize(code: string, syntax: CodeSyntax): CodeToken[] {
  const { kinds, pattern } = grammarOf(syntax);
  const tokens: CodeToken[] = [];
  let end = 0;

  for (const match of code.matchAll(pattern)) {
    if (match.index > end) {
      tokens.push({ text: code.slice(end, match.index) });
    }

    const kind = kinds[match.slice(1).findIndex((group) => group !== undefined)];

    tokens.push(kind ? { kind, text: match[0] } : { text: match[0] });
    end = match.index + match[0].length;
  }

  if (end < code.length) {
    tokens.push({ text: code.slice(end) });
  }

  return tokens;
}

/** As linhas do trecho, cada uma com os seus pedacos: o comentario de bloco que atravessa linhas e partido nelas. */
export function tokenizeLines(code: string, syntax?: CodeSyntax): CodeToken[][] {
  const lines: CodeToken[][] = [[]];

  for (const token of syntax ? tokenize(code, syntax) : [{ text: code }]) {
    token.text.split('\n').forEach((part, index) => {
      if (index > 0) {
        lines.push([]);
      }

      if (part) {
        lines[lines.length - 1].push({ ...token, text: part });
      }
    });
  }

  return lines;
}
