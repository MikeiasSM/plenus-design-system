import { CodeBlock, type CodeSyntax } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const SINTAXES = ['java', 'javascript', 'jsx', 'typescript', 'tsx', 'sql', 'json', 'shell', 'nenhuma'] as const;

const TRECHOS: Record<CodeSyntax, string> = {
  java: `// Confere a chave antes de liberar o download
@Service
public class Licenca {
  private static final int LIMITE = 30;

  public boolean valida(String chave) {
    return chave != null && chave.length() <= LIMITE;
  }
}`,
  javascript: `// Soma os pedidos pagos
const total = pedidos
  .filter((pedido) => pedido.pago)
  .reduce((soma, pedido) => soma + pedido.valor, 0);`,
  jsx: `function Saudacao({ nome }) {
  return <p className="saudacao">Olá, {nome}</p>;
}`,
  typescript: `interface Pedido {
  id: string;
  valor: number;
}

export function total(pedidos: readonly Pedido[]): number {
  return pedidos.reduce((soma, pedido) => soma + pedido.valor, 0);
}`,
  tsx: `export function Acoes({ salvar }: { salvar: () => void }) {
  return <Button variant="primary" onClick={salvar}>Salvar</Button>;
}`,
  sql: `SELECT nome, COUNT(*) AS total
FROM documento
WHERE estado = 'publicado' -- só os visíveis
GROUP BY nome;`,
  json: `{
  "versao": "0.2.1",
  "publico": true,
  "downloads": 1284
}`,
  shell: `#!/bin/sh
for arquivo in dist/*.js; do
  echo "$arquivo" # lista o pacote
done`,
};

function linhasDestacadas(texto: string) {
  return texto
    .split(/[\s,]+/)
    .map(Number)
    .filter((numero) => Number.isInteger(numero) && numero > 0);
}

const playground = definirPlayground({
  inicial: {
    syntax: 'java',
    fileName: 'Licenca.java',
    language: '',
    lineNumbers: true,
    highlightedLines: '7',
    copyable: true,
    wrap: false,
  },
  controles: [
    { tipo: 'opcoes', nome: 'syntax', opcoes: SINTAXES },
    { tipo: 'texto', nome: 'fileName' },
    { tipo: 'texto', nome: 'language' },
    { tipo: 'texto', nome: 'highlightedLines' },
    { tipo: 'booleano', nome: 'lineNumbers' },
    { tipo: 'booleano', nome: 'copyable' },
    { tipo: 'booleano', nome: 'wrap' },
  ],
  renderizar: (valores) => {
    const sintaxe = valores.syntax === 'nenhuma' ? undefined : (valores.syntax as CodeSyntax);

    return (
      <div style={{ width: '100%' }}>
        <CodeBlock
          code={TRECHOS[sintaxe ?? 'java']}
          copyable={valores.copyable}
          fileName={valores.fileName || undefined}
          highlightedLines={linhasDestacadas(valores.highlightedLines)}
          language={valores.language || undefined}
          lineNumbers={valores.lineNumbers}
          syntax={sintaxe}
          wrap={valores.wrap}
        />
      </div>
    );
  },
  codigo: (valores) => {
    const destacadas = linhasDestacadas(valores.highlightedLines);

    return gerarJsx('CodeBlock', [
      ['code', expr('trecho')],
      ['syntax', valores.syntax === 'nenhuma' ? undefined : valores.syntax],
      ['fileName', valores.fileName || undefined],
      ['language', valores.language || undefined],
      ['lineNumbers', valores.lineNumbers, false],
      ['highlightedLines', destacadas.length ? destacadas : undefined],
      ['copyable', valores.copyable, true],
      ['wrap', valores.wrap, false],
    ]);
  },
  verificar: (valores) => {
    const sintaxe = valores.syntax === 'nenhuma' ? undefined : (valores.syntax as CodeSyntax);
    const totalDeLinhas = TRECHOS[sintaxe ?? 'java'].split('\n').length;
    const foraDoTrecho = linhasDestacadas(valores.highlightedLines).filter((linha) => linha > totalDeLinhas);
    const verificacoes: Verificacao[] = [
      valores.wrap
        ? { nivel: 'ok', titulo: 'Linha quebrada', detalhe: 'Nada rola de lado, então o bloco não entra na tabulação.' }
        : { nivel: 'ok', titulo: 'Bloco focável', detalhe: 'A linha longa rola de lado, e o bloco recebe foco para o teclado alcançá-la.' },
    ];

    if (foraDoTrecho.length) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Linha inexistente',
        detalhe: `O trecho tem ${totalDeLinhas} linhas; fica sem destaque: ${foraDoTrecho.join(', ')}.`,
      });
    }

    if (!sintaxe) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Sem realce',
        detalhe: valores.language ? 'O código sai numa cor só, com o rótulo informado.' : 'O código sai numa cor só e o cabeçalho fica sem rótulo.',
      });
    }

    if (valores.copyable) {
      verificacoes.push({ nivel: 'ok', titulo: 'Cópia anunciada', detalhe: '"Código copiado" chega ao leitor de tela por role="status".' });
    }

    return verificacoes;
  },
});

function Variantes() {
  return (
    <div className="demo-grid">
      {(Object.keys(TRECHOS) as CodeSyntax[]).map((sintaxe) => (
        <CodeBlock code={TRECHOS[sintaxe]} copyable={false} key={sintaxe} syntax={sintaxe} />
      ))}
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Numeração e destaque</h3>
        <CodeBlock code={TRECHOS.java} fileName="Licenca.java" highlightedLines={[6, 7]} lineNumbers syntax="java" />
        <p className="note">
          Os números são gerados pelo CSS e não entram na seleção, na cópia nem na leitura. A linha destacada é{' '}
          <code>&lt;mark&gt;</code>, com borda à esquerda: a ênfase não depende só da cor e chega ao leitor de tela.
        </p>
      </div>
      <div className="subsection">
        <h3>Com quebra de linha, sem cabeçalho</h3>
        <CodeBlock code="npm install @plenustech/design-system && npm run build" copyable={false} syntax="shell" wrap />
        <p className="note">
          Sem <code>fileName</code>, sem rótulo e sem cópia, o cabeçalho não aparece. Com <code>wrap</code>, a linha longa quebra
          e o bloco não precisa de foco.
        </p>
      </div>
      <div className="subsection">
        <h3>Linguagem fora do realce</h3>
        <CodeBlock code={'fun soma(a: Int, b: Int) = a + b'} language="Kotlin" />
        <p className="note">
          Sem <code>syntax</code>, o código sai numa cor só; <code>language</code> dá o rótulo que o produto quiser.
        </p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Arquivo de projeto',
      descricao: 'Nome do arquivo, numeração e a linha que importa destacada.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <CodeBlock code={TRECHOS.java} fileName="Licenca.java" highlightedLines={[7]} lineNumbers syntax="java" />
        </div>
      ),
      codigo: '<CodeBlock\n  code={trecho}\n  fileName="Licenca.java"\n  syntax="java"\n  lineNumbers\n  highlightedLines={[7]}\n/>',
    },
    {
      titulo: 'Consulta',
      descricao: 'SQL, com o comentário e o texto realçados.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <CodeBlock code={TRECHOS.sql} syntax="sql" />
        </div>
      ),
      codigo: '<CodeBlock code={consulta} syntax="sql" />',
    },
    {
      titulo: 'Resposta da API',
      descricao: 'JSON, com a chave separada do valor.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <CodeBlock code={TRECHOS.json} fileName="package.json" syntax="json" />
        </div>
      ),
      codigo: '<CodeBlock code={resposta} fileName="package.json" syntax="json" />',
    },
    {
      titulo: 'Script',
      descricao: 'Shell: o # abre comentário só no começo de uma palavra.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <CodeBlock code={TRECHOS.shell} syntax="shell" />
        </div>
      ),
      codigo: '<CodeBlock code={script} syntax="shell" />',
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Passa pelo botão Copiar e, sem wrap, pelo bloco de código.' },
    { teclas: ['Enter', 'Espaço'], acao: 'No botão, copia o código inteiro.' },
    { teclas: ['←', '→'], acao: 'Com o bloco em foco, rolam a linha longa de lado.' },
  ],
  garantias: [
    { garantia: 'Cópia anunciada', como: <>Copia o código inteiro e anuncia &quot;Código copiado&quot; por <code>role=&quot;status&quot;</code>.</>, teste: 'CodeBlock.test.tsx' },
    { garantia: 'Rolagem pelo teclado', como: <>Sem <code>wrap</code>, o <code>pre</code> recebe <code>tabIndex=0</code>.</>, teste: 'CodeBlock.test.tsx' },
    { garantia: 'Destaque semântico', como: <>A linha destacada é <code>&lt;mark&gt;</code>.</>, teste: 'CodeBlock.test.tsx' },
    { garantia: 'Realce sem perda', como: 'O realce não perde nem acrescenta caractere.', teste: 'syntax.test.ts' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div>, exceto children, e o ref, no elemento de fora.',
  api: [
    { nome: 'code', tipo: 'string', descricao: 'Obrigatório. O trecho, copiado inteiro pelo botão.' },
    { nome: 'syntax', tipo: "'java' | 'javascript' | 'jsx' | 'typescript' | 'tsx' | 'sql' | 'json' | 'shell'", descricao: 'Liga o realce e dá o rótulo padrão. Sem ela, uma cor só.' },
    { nome: 'language', tipo: 'string', descricao: 'Rótulo do cabeçalho; vence o nome da sintaxe.' },
    { nome: 'fileName', tipo: 'string', descricao: 'Nome do arquivo no cabeçalho.' },
    { nome: 'lineNumbers', tipo: 'boolean', padrao: 'false', descricao: 'Numeração em coluna própria, fora da seleção.' },
    { nome: 'highlightedLines', tipo: 'readonly number[]', padrao: '[]', descricao: 'Linhas destacadas, contadas a partir de 1.' },
    { nome: 'copyable', tipo: 'boolean', padrao: 'true', descricao: 'Mostra o botão Copiar.' },
    { nome: 'wrap', tipo: 'boolean', padrao: 'false', descricao: 'Quebra a linha longa em vez de rolar de lado.' },
  ],
};
