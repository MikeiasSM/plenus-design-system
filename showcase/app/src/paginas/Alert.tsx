import { Alert, Button, IconExclamationTriangle, IconInfoCircle, InputText, type AlertTone } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const TONS = ['neutral', 'info', 'success', 'warning', 'danger'] as const;

const EXEMPLOS_DE_TOM: Record<AlertTone, { titulo: string; texto: string }> = {
  neutral: { titulo: 'Sobre os prazos', texto: 'Os prazos contam em dias úteis.' },
  info: { titulo: 'Sincronização agendada', texto: 'Executa todos os dias às 3h.' },
  success: { titulo: 'Registro salvo', texto: 'As alterações já estão disponíveis.' },
  warning: { titulo: 'Espaço quase esgotado', texto: 'Restam 8% do armazenamento.' },
  danger: { titulo: 'Falha no envio', texto: 'Tente novamente em alguns instantes.' },
};

function urgente(tom: AlertTone) {
  return tom === 'danger' || tom === 'warning';
}

const playground = definirPlayground({
  inicial: { tone: 'danger', title: 'Falha no envio', children: 'Tente novamente em alguns instantes.', icone: false, acao: false },
  controles: [
    { tipo: 'opcoes', nome: 'tone', opcoes: TONS },
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'children' },
    { tipo: 'booleano', nome: 'icone' },
    { tipo: 'booleano', nome: 'acao' },
  ],
  renderizar: (valores) => (
    <div style={{ width: '100%' }}>
      <Alert
        action={
          valores.acao ? (
            <Button size="sm" type="button" variant="secondary">
              Tentar de novo
            </Button>
          ) : undefined
        }
        icon={valores.icone ? <IconInfoCircle /> : undefined}
        title={valores.title || undefined}
        tone={valores.tone as AlertTone}
      >
        {valores.children || undefined}
      </Alert>
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Alert', [
      ['tone', valores.tone, 'info'],
      ['title', valores.title || undefined],
      ['icon', valores.icone ? expr('<IconInfoCircle />') : undefined],
      ['action', valores.acao ? expr('<Button size="sm" variant="secondary">Tentar de novo</Button>') : undefined],
    ], valores.children),
  verificar: (valores) => {
    const tom = valores.tone as AlertTone;
    const verificacoes: Verificacao[] = [
      urgente(tom)
        ? { nivel: 'ok', titulo: 'Anúncio assertivo', detalhe: 'role="alert": o leitor de tela interrompe para ler.' }
        : tom === 'neutral'
          ? { nivel: 'ok', titulo: 'Sem anúncio', detalhe: 'Sem papel vivo: o leitor de tela lê a mensagem no fluxo da página, sem interromper.' }
          : { nivel: 'ok', titulo: 'Anúncio educado', detalhe: 'role="status": o leitor de tela espera a fala atual terminar.' },
    ];

    if (valores.icone) {
      verificacoes.push({ nivel: 'ok', titulo: 'Ícone decorativo', detalhe: 'aria-hidden: o tom e o texto já dizem a situação.' });
    }

    if (valores.acao) {
      verificacoes.push({ nivel: 'ok', titulo: 'Ação dentro da mensagem', detalhe: 'Ao lado do texto com largura, abaixo dele sem; a ordem do foco segue a da leitura.' });
    }

    if (!valores.title.trim() && !valores.children.trim()) {
      verificacoes.push({ nivel: 'falha', titulo: 'Alerta vazio', detalhe: 'Sem title nem children, não há o que anunciar.' });
    }

    return verificacoes;
  },
});

const CODIGO_DAS_VARIANTES = `<Alert tone="neutral" title="Sobre os prazos">Os prazos contam em dias úteis.</Alert>
<Alert tone="info" title="Sincronização agendada">Executa todos os dias às 3h.</Alert>
<Alert tone="success" title="Registro salvo">As alterações já estão disponíveis.</Alert>
<Alert tone="warning" title="Espaço quase esgotado">Restam 8% do armazenamento.</Alert>
<Alert tone="danger" title="Falha no envio">Tente novamente em alguns instantes.</Alert>`;

function Variantes() {
  return (
    <>
      <div className="stack">
        {TONS.map((tom) => (
          <Alert key={tom} title={EXEMPLOS_DE_TOM[tom].titulo} tone={tom}>
            {EXEMPLOS_DE_TOM[tom].texto}
          </Alert>
        ))}
      </div>
      <VerCodigo codigo={CODIGO_DAS_VARIANTES} />
    </>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>warning</code>, <code>danger</code></dt>
      <dd>Saem com <code>role=&quot;alert&quot;</code> e são anunciados de forma assertiva, assim que aparecem.</dd>
      <dt><code>info</code>, <code>success</code></dt>
      <dd>Saem com <code>role=&quot;status&quot;</code> e são anunciados de forma educada.</dd>
      <dt><code>neutral</code></dt>
      <dd>
        Contexto sem urgência, em fundo neutro e texto secundário. Sai sem papel vivo: o leitor de tela o lê no fluxo da
        página, e nada é anunciado quando ele aparece.
      </dd>
      <dt><code>icon</code></dt>
      <dd>Ícone antes do texto, decorativo. Não há ícone padrão por tom; <code>false</code> equivale a não passar.</dd>
      <dt><code>action</code></dt>
      <dd>
        Ação ligada à mensagem. Fica ao lado do texto quando a própria mensagem tem 480px ou mais, medidos por container
        query, e abaixo dele quando é mais estreita.
      </dd>
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
      titulo: 'Com ícone e ação',
      descricao: 'A ação fica ao lado do texto quando há largura e desce para baixo dele na mensagem estreita, à direita.',
      Previa: () => (
        <div className="stack" style={{ width: '100%' }}>
          <Alert
            action={
              <Button size="sm" type="button" variant="secondary">
                Liberar espaço
              </Button>
            }
            icon={<IconExclamationTriangle />}
            title="Espaço quase esgotado"
            tone="warning"
          >
            Restam 8% do armazenamento.
          </Alert>
          <div style={{ width: 320 }}>
            <Alert
              action={
                <Button size="sm" type="button" variant="secondary">
                  Liberar espaço
                </Button>
              }
              icon={<IconExclamationTriangle />}
              title="Espaço quase esgotado"
              tone="warning"
            >
              Restam 8% do armazenamento.
            </Alert>
          </div>
        </div>
      ),
      codigo:
        '<Alert\n  tone="warning"\n  icon={<IconExclamationTriangle />}\n  title="Espaço quase esgotado"\n  action={<Button size="sm" variant="secondary">Liberar espaço</Button>}\n>\n  Restam 8% do armazenamento.\n</Alert>',
    },
    {
      titulo: 'Contexto neutro',
      descricao: 'Uma explicação sem urgência, junto do conteúdo. Não é anunciada ao aparecer.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Alert icon={<IconInfoCircle />} title={<>Prazos em <strong>dias úteis</strong></>} tone="neutral">
            Sábados, domingos e feriados não contam.
          </Alert>
        </div>
      ),
      codigo:
        '<Alert tone="neutral" icon={<IconInfoCircle />} title={<>Prazos em <strong>dias úteis</strong></>}>\n  Sábados, domingos e feriados não contam.\n</Alert>',
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
    codigo: '<Alert tone="danger" title="Não foi possível salvar">Tente novamente em alguns instantes.</Alert>',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Alert title="Não foi possível carregar os registros" tone="danger">Tente novamente em alguns instantes.</Alert>
      </div>
    ),
    texto: 'Alert no lugar de uma lista que não carregou. Ali o conteúdo faltou: é EmptyState em tom de erro.',
    codigo: '<Alert tone="danger" title="Não foi possível carregar os registros">Tente novamente em alguns instantes.</Alert>',
  },
  Variantes,
  Modos,
  garantias: [
    {
      garantia: 'Anúncio pela urgência',
      como: <><code>role=&quot;alert&quot;</code> em aviso e erro; <code>role=&quot;status&quot;</code> em informação e sucesso; nenhum papel vivo no neutro.</>,
      teste: 'Alert.test.tsx',
    },
    { garantia: 'Ícone decorativo', como: <>O <code>icon</code> sai com <code>aria-hidden</code>.</>, teste: 'Alert.test.tsx' },
    { garantia: 'Papel do consumidor', como: <>O <code>role</code> informado substitui o do tom.</>, teste: 'detalhes.test.tsx' },
  ],
  notaDaApi: 'Além destas, todas as propriedades nativas de <div>.',
  api: [
    { nome: 'tone', tipo: "'neutral' | 'info' | 'success' | 'warning' | 'danger'", padrao: "'info'", descricao: 'Cor e urgência do anúncio. O neutral não tem papel vivo.' },
    { nome: 'title', tipo: 'ReactNode', descricao: 'Título em destaque. Substitui o atributo nativo title.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'Corpo da mensagem.' },
    { nome: 'icon', tipo: 'ReactNode | false', descricao: 'Ícone decorativo antes do texto. Sem padrão por tom.' },
    { nome: 'action', tipo: 'ReactNode', descricao: 'Ação ligada à mensagem: ao lado do texto com 480px ou mais, abaixo dele com menos.' },
  ],
};
