import { Badge, Card, type BadgeTone } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TONS = ['neutral', 'ok', 'warn', 'info', 'danger', 'primary'] as const;

const playground = definirPlayground({
  inicial: { tone: 'ok', children: 'Ativo', dot: true, outline: false },
  controles: [
    { tipo: 'opcoes', nome: 'tone', opcoes: TONS },
    { tipo: 'texto', nome: 'children' },
    { tipo: 'booleano', nome: 'dot' },
    { tipo: 'booleano', nome: 'outline' },
  ],
  renderizar: (valores) => (
    <Badge dot={valores.dot} outline={valores.outline} tone={valores.tone as BadgeTone}>
      {valores.children}
    </Badge>
  ),
  codigo: (valores) =>
    gerarJsx(
      'Badge',
      [
        ['tone', valores.tone, 'neutral'],
        ['dot', valores.dot, false],
        ['outline', valores.outline, false],
      ],
      valores.children,
    ),
  verificar: (valores) => {
    const texto = valores.children.trim();
    const verificacoes: Verificacao[] = [
      texto
        ? { nivel: 'ok', titulo: 'Texto do estado', detalhe: `"${texto}" diz o estado; o tom só reforça.` }
        : { nivel: 'falha', titulo: 'Sem texto', detalhe: 'O ponto é decorativo e a cor sozinha não é lida. O Badge precisa do texto.' },
    ];

    if (valores.dot) {
      verificacoes.push({ nivel: 'ok', titulo: 'Ponto decorativo', detalhe: 'aria-hidden: o leitor de tela ouve só o texto.' });
    }

    return verificacoes;
  },
});

function Variantes() {
  return (
    <div className="matrix">
      <div className="matrix-row matrix-head">
        <span>tone</span>
        <span>padrão</span>
        <span>dot</span>
        <span>outline</span>
        <span>outline e dot</span>
        <span>contagem</span>
      </div>
      {TONS.map((tom) => (
        <div className="matrix-row" key={tom}>
          <code>{tom}</code>
          <span>
            <Badge tone={tom}>Status</Badge>
          </span>
          <span>
            <Badge dot tone={tom}>Status</Badge>
          </span>
          <span>
            <Badge outline tone={tom}>Status</Badge>
          </span>
          <span>
            <Badge dot outline tone={tom}>Status</Badge>
          </span>
          <span>
            <Badge tone={tom}>12</Badge>
          </span>
        </div>
      ))}
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Situação de um registro',
      descricao: 'O tom acompanha o significado: ok para concluído, warn para pendente, danger para falha.',
      Previa: () => (
        <>
          <Badge dot tone="ok">Ativo</Badge>
          <Badge dot tone="warn">Convidado</Badge>
          <Badge dot tone="danger">Bloqueado</Badge>
        </>
      ),
      codigo: '<Badge tone="ok" dot>\n  Ativo\n</Badge>\n<Badge tone="warn" dot>\n  Convidado\n</Badge>\n<Badge tone="danger" dot>\n  Bloqueado\n</Badge>',
    },
    {
      titulo: 'Contagem no cabeçalho do cartão',
      descricao: 'No badge do Card.Header, ao lado do título.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Card>
            <Card.Header badge={<Badge>12</Badge>} description="Gerencie quem tem acesso." title="Membros" />
          </Card>
        </div>
      ),
      codigo: '<Card>\n  <Card.Header\n    title="Membros"\n    description="Gerencie quem tem acesso."\n    badge={<Badge>12</Badge>}\n  />\n</Card>',
    },
    {
      titulo: 'Resultado de execução',
      descricao: 'O outline pesa menos, para listas longas de resultados.',
      Previa: () => (
        <>
          <Badge outline tone="ok">Concluído</Badge>
          <Badge outline tone="danger">Falhou</Badge>
          <Badge>Sem status</Badge>
        </>
      ),
      codigo: '<Badge tone="ok" outline>\n  Concluído\n</Badge>\n<Badge tone="danger" outline>\n  Falhou\n</Badge>\n<Badge>Sem status</Badge>',
    },
  ],
  faca: {
    Previa: () => (
      <>
        <Badge dot tone="ok">Ativo</Badge>
        <Badge tone="info">Financeiro</Badge>
      </>
    ),
    texto: 'Badge para rotular um estado ou uma categoria. Ele não responde a nada.',
  },
  evite: {
    Previa: () => <Badge tone="primary">Situação: ativo ✕</Badge>,
    texto: 'Badge imitando filtro removível: o ✕ não faz nada. O que se remove ou se liga e desliga é Tag.',
  },
  Variantes,
  garantias: [
    { garantia: 'Ponto decorativo', como: <>O <code>dot</code> sai com <code>aria-hidden</code>; o estado é dito pelo texto.</>, teste: 'Badge.test.tsx' },
    { garantia: 'Atributos nativos', como: <>Repassados ao <code>span</code>.</>, teste: 'Badge.test.tsx' },
  ],
  notaDaApi: 'Além destas, todas as propriedades nativas de <span>.',
  api: [
    { nome: 'tone', tipo: "'ok' | 'warn' | 'info' | 'danger' | 'primary' | 'neutral'", padrao: "'neutral'", descricao: 'Tom semântico.' },
    { nome: 'dot', tipo: 'boolean', padrao: 'false', descricao: 'Ponto decorativo antes do texto.' },
    { nome: 'outline', tipo: 'boolean', padrao: 'false', descricao: 'Contorno em vez de fundo preenchido.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'O texto do estado ou da categoria.' },
  ],
};
