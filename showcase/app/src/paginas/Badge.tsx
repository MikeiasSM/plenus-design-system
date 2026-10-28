import { Badge, Card, type BadgeTone, type BadgeVariant } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TONS = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
const VARIANTES = ['status', 'brand'] as const;

/** As linhas da matriz: cada tom, e a variante da marca, que ignora o tom. */
const LINHAS = [
  ...TONS.map((tom) => ({ rotulo: tom, props: { tone: tom } })),
  { rotulo: 'variant="brand"', props: { variant: 'brand' as const } },
];

const playground = definirPlayground({
  inicial: { tone: 'success', variant: 'status', children: 'Ativo', dot: true, outline: false },
  controles: [
    { tipo: 'opcoes', nome: 'tone', opcoes: TONS },
    { tipo: 'opcoes', nome: 'variant', opcoes: VARIANTES },
    { tipo: 'texto', nome: 'children' },
    { tipo: 'booleano', nome: 'dot' },
    { tipo: 'booleano', nome: 'outline' },
  ],
  renderizar: (valores) => (
    <Badge
      dot={valores.dot}
      outline={valores.outline}
      tone={valores.tone as BadgeTone}
      variant={valores.variant as BadgeVariant}
    >
      {valores.children}
    </Badge>
  ),
  codigo: (valores) =>
    gerarJsx(
      'Badge',
      [
        ['tone', valores.tone, 'neutral'],
        ['variant', valores.variant, 'status'],
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
      {LINHAS.map(({ rotulo, props }) => (
        <div className="matrix-row" key={rotulo}>
          <code>{rotulo}</code>
          <span>
            <Badge {...props}>Status</Badge>
          </span>
          <span>
            <Badge dot {...props}>Status</Badge>
          </span>
          <span>
            <Badge outline {...props}>Status</Badge>
          </span>
          <span>
            <Badge dot outline {...props}>Status</Badge>
          </span>
          <span>
            <Badge {...props}>12</Badge>
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
          <Badge dot tone="success">Ativo</Badge>
          <Badge dot tone="warning">Convidado</Badge>
          <Badge dot tone="danger">Bloqueado</Badge>
        </>
      ),
      codigo: '<Badge tone="success" dot>\n  Ativo\n</Badge>\n<Badge tone="warning" dot>\n  Convidado\n</Badge>\n<Badge tone="danger" dot>\n  Bloqueado\n</Badge>',
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
          <Badge outline tone="success">Concluído</Badge>
          <Badge outline tone="danger">Falhou</Badge>
          <Badge>Sem status</Badge>
        </>
      ),
      codigo: '<Badge tone="success" outline>\n  Concluído\n</Badge>\n<Badge tone="danger" outline>\n  Falhou\n</Badge>\n<Badge>Sem status</Badge>',
    },
  ],
  faca: {
    Previa: () => (
      <>
        <Badge dot tone="success">Ativo</Badge>
        <Badge tone="info">Financeiro</Badge>
      </>
    ),
    texto: 'Badge para rotular um estado ou uma categoria. Ele não responde a nada.',
  },
  evite: {
    Previa: () => <Badge variant="brand">Situação: ativo ✕</Badge>,
    texto: 'Badge imitando filtro removível: o ✕ não faz nada. O que se remove ou se liga e desliga é Tag.',
  },
  Variantes,
  garantias: [
    { garantia: 'Ponto decorativo', como: <>O <code>dot</code> sai com <code>aria-hidden</code>; o estado é dito pelo texto.</>, teste: 'Badge.test.tsx' },
    { garantia: 'Atributos nativos', como: <>Repassados ao <code>span</code>.</>, teste: 'Badge.test.tsx' },
  ],
  notaDaApi: 'Além destas, todas as propriedades nativas de <span>.',
  api: [
    { nome: 'tone', tipo: "'neutral' | 'info' | 'success' | 'warning' | 'danger'", padrao: "'neutral'", descricao: <>Tom do estado. Obsoletos: <code>ok</code>, <code>warn</code> e <code>primary</code>; use <code>success</code>, <code>warning</code> e <code>variant="brand"</code>.</> },
    { nome: 'variant', tipo: "'status' | 'brand'", padrao: "'status'", descricao: 'brand pinta na cor da marca e ignora o tone: destaque, não estado.' },
    { nome: 'dot', tipo: 'boolean', padrao: 'false', descricao: 'Ponto decorativo antes do texto.' },
    { nome: 'outline', tipo: 'boolean', padrao: 'false', descricao: 'Contorno em vez de fundo preenchido.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'O texto do estado ou da categoria.' },
  ],
};
