/**
 * Realce de sintaxe por regras lexicas, sem analisador de linguagem: reconhece o
 * que ajuda a ler o trecho — palavra reservada, texto, numero, comentario,
 * anotacao, chamada e propriedade — e deixa o resto sem cor.
 */

export type CodeSyntax = 'java' | 'javascript' | 'typescript' | 'sql' | 'json' | 'shell';

export type CodeTokenKind = 'annotation' | 'comment' | 'function' | 'keyword' | 'number' | 'property' | 'string';

export interface CodeToken {
  kind?: CodeTokenKind;
  text: string;
}

type Rule = readonly [CodeTokenKind, RegExp];

interface Grammar {
  kinds: readonly CodeTokenKind[];
  pattern: RegExp;
}

export const SYNTAX_LABELS: Readonly<Record<CodeSyntax, string>> = {
  java: 'Java',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  sql: 'SQL',
  json: 'JSON',
  shell: 'Shell',
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

const JAVASCRIPT_RULES: readonly Rule[] = [
  ['comment', LINE_COMMENT],
  ['comment', BLOCK_COMMENT],
  ['string', /`(?:\\[\s\S]|[^`\\])*`?/],
  ['string', DOUBLE_QUOTED],
  ['string', SINGLE_QUOTED],
  ['number', NUMBER],
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
  javascript: [...JAVASCRIPT_RULES, ['keyword', words(JAVASCRIPT_WORDS)], ['function', CALL]],
  typescript: [
    ...JAVASCRIPT_RULES,
    ['annotation', ANNOTATION],
    ['keyword', words(JAVASCRIPT_WORDS + TYPESCRIPT_WORDS)],
    ['function', CALL],
  ],
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
};

/** O SQL e lido sem distincao de caixa: `select` e `SELECT` sao a mesma palavra. */
const CASE_INSENSITIVE: ReadonlySet<CodeSyntax> = new Set(['sql']);

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

    tokens.push({ kind: kinds[match.slice(1).findIndex((group) => group !== undefined)], text: match[0] });
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
