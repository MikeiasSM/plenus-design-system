import { Alert, Button, EmptyState, IconClose, InputText, type AlertTone } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TONS = ['info', 'success', 'warning', 'danger'] as const;

const EXEMPLOS_DE_TOM: Record<AlertTone, { titulo: string; texto: string }> = {
  info: { titulo: 'Sincronização agendada', texto: 'Executa todos os dias às 3h.' },
  success: { titulo: 'Registro salvo', texto: 'As alterações já estão disponíveis.' },
  warning: { titulo: 'Espaço quase esgotado', texto: 'Restam 8% do armazenamento.' },
  danger: { titulo: 'Falha no envio', texto: 'Tente novamente em alguns instantes.' },
};

function urgente(tom: AlertTone) {
  return tom === 'danger' || tom === 'warning';
}

const playground = definirPlayground({
  inicial: { tone: 'danger', title: 'Falha no envio', children: 'Tente novamente em alguns instantes.' },
  controles: [
    { tipo: 'opcoes', nome: 'tone', opcoes: TONS },
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'children' },
  ],
  renderizar: (valores) => (
    <div style={{ width: '100%' }}>
      <Alert title={valores.title || undefined} tone={valores.tone as AlertTone}>
        {valores.children || undefined}
      </Alert>
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Alert', [
      ['tone', valores.tone, 'info'],
      ['title', valores.title || undefined],
    ], valores.children),
  verificar: (valores) => {
    const tom = valores.tone as AlertTone;
    const verificacoes: Verificacao[] = [
      urgente(tom)
        ? { nivel: 'ok', titulo: 'Anúncio assertivo', detalhe: 'role="alert": o leitor de tela interrompe para ler.' }
        : { nivel: 'ok', titulo: 'Anúncio educado', detalhe: 'role="status": o leitor de tela espera a fala atual terminar.' },
    ];

    if (!valores.title.trim() && !valores.children.trim()) {
      verificacoes.push({ nivel: 'falha', titulo: 'Alerta vazio', detalhe: 'Sem title nem children, não há o que anunciar.' });
    }

    return verificacoes;
  },
});

function Variantes() {
  return (
    <div className="stack">
      {TONS.map((tom) => (
        <Alert key={tom} title={EXEMPLOS_DE_TOM[tom].titulo} tone={tom}>
          {EXEMPLOS_DE_TOM[tom].texto}
        </Alert>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>warning</code>, <code>danger</code></dt>
      <dd>Saem com <code>role=&quot;alert&quot;</code> e são anunciados de forma assertiva, assim que aparecem.</dd>
      <dt><code>info</code>, <code>success</code></dt>
      <dd>Saem com <code>role=&quot;status&quot;</code> e são anunciados de forma educada.</dd>
      <dt><code>role</code></dt>
      <dd>O <code>role</code> informado vence o do tom, como <code>alertdialog</code> numa confirmação.</dd>
      <dt>Só <code>title</code> ou só <code>children</code></dt>
      <dd>Cada parte é opcional; a que faltar não ocupa espaço.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Falha ao salvar',
      descricao: 'Junto do formulário de que fala, até a situação mudar.',
      Previa: () => (
        <div className="stack" style={{ width: '100%' }}>
          <Alert title="Não foi possível salvar" tone="danger">
            A conexão com o servidor falhou. Suas alterações continuam no formulário.
          </Alert>
          <InputText defaultValue="Faturamento" label="Nome do módulo" />
        </div>
      ),
      codigo:
        '<Alert tone="danger" title="Não foi possível salvar">\n  A conexão com o servidor falhou. Suas alterações continuam no formulário.\n</Alert>\n<InputText label="Nome do módulo" defaultValue="Faturamento" />',
    },
    {
      titulo: 'Aviso de limite',
      descricao: 'Uma situação que continua: o aviso fica enquanto ela durar.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Alert title="Espaço quase esgotado" tone="warning">
            Restam 8% do armazenamento. Arquivos novos podem falhar ao enviar.
          </Alert>
        </div>
      ),
      codigo:
        '<Alert tone="warning" title="Espaço quase esgotado">\n  Restam 8% do armazenamento. Arquivos novos podem falhar ao enviar.\n</Alert>',
    },
    {
      titulo: 'Informação curta',
      descricao: 'Sem título, só o texto.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Alert>A sincronização roda todos os dias às 3h.</Alert>
        </div>
      ),
      codigo: '<Alert>A sincronização roda todos os dias às 3h.</Alert>',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Alert title="Não foi possível salvar" tone="danger">Tente novamente em alguns instantes.</Alert>
      </div>
    ),
    texto: 'Alert para a falha de uma operação, junto do conteúdo de que fala, como ao salvar um formulário.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <EmptyState
          actions={<Button variant="secondary">Tentar de novo</Button>}
          icon={<IconClose />}
          size="sm"
          title="Não foi possível carregar os registros"
          tone="danger"
        />
      </div>
    ),
    texto: 'Alert no lugar de uma lista que não carregou. Ali o conteúdo faltou: é EmptyState em tom de erro.',
  },
  Variantes,
  Modos,
  garantias: [
    {
      garantia: 'Anúncio pela urgência',
      como: <><code>role=&quot;alert&quot;</code> em aviso e erro; <code>role=&quot;status&quot;</code> em informação e sucesso.</>,
      teste: 'Alert.test.tsx',
    },
    { garantia: 'Papel do consumidor', como: <>O <code>role</code> informado substitui o do tom.</>, teste: 'detalhes.test.tsx' },
  ],
  notaDaApi: 'Além destas, todas as propriedades nativas de <div>.',
  api: [
    { nome: 'tone', tipo: "'info' | 'success' | 'warning' | 'danger'", padrao: "'info'", descricao: 'Cor e urgência do anúncio.' },
    { nome: 'title', tipo: 'string', descricao: 'Título em destaque. Substitui o atributo nativo title.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'Corpo da mensagem.' },
  ],
};
