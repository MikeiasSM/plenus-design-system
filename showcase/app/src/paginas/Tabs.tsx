import { useState } from 'react';
import { Button, IconPlus, Tabs, type TabItem, type TabsOrientation } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const ORIENTACOES = ['horizontal', 'vertical'] as const;
const APARENCIAS = ['underline', 'segmented'] as const;

const ABAS_DO_MODULO: TabItem[] = [
  { key: 'geral', label: 'Geral', content: 'Nome, descrição e responsável pelo módulo.' },
  { key: 'acesso', label: 'Acesso', content: 'Perfis e permissões que enxergam este módulo.' },
  { key: 'legado', label: 'Legado', content: 'Indisponível', disabled: true },
  { key: 'logs', label: 'Logs', content: 'Histórico de alterações dos últimos 90 dias.' },
];

const ABAS_DO_PERIODO: TabItem[] = [
  { key: 'dia', label: 'Dia', content: 'Pedidos por dia, no mesmo gráfico.' },
  { key: 'semana', label: 'Semana', content: 'Pedidos por semana, no mesmo gráfico.' },
  { key: 'mes', label: 'Mês', content: 'Pedidos por mês, no mesmo gráfico.' },
];

const ABAS_DA_CONTA: TabItem[] = [
  { key: 'perfil', label: 'Perfil', content: 'Nome, foto e dados de contato.' },
  { key: 'notificacoes', label: 'Notificações', content: 'Quais avisos chegam por e-mail e quais ficam no sistema.' },
  { key: 'seguranca', label: 'Segurança', content: 'Senha, sessões ativas e verificação em duas etapas.' },
  { key: 'faturamento', label: 'Faturamento', content: 'Plano contratado, notas e forma de pagamento.' },
];

const ABAS_DA_FILA: TabItem[] = [
  { key: 'abertos', label: 'Em aberto', count: 24, content: 'Chamados que esperam a primeira resposta.' },
  { key: 'andamento', label: 'Em andamento', count: 7, content: 'Chamados com alguém responsável.' },
  { key: 'resolvidos', label: 'Resolvidos', count: 1380, content: 'Chamados fechados nos últimos 30 dias.' },
  { key: 'arquivados', label: 'Arquivados', muted: true, content: 'Chamados antigos, fora da fila.' },
];

const playground = definirPlayground({
  inicial: { label: 'Configurações do módulo', orientation: 'horizontal', appearance: 'underline', desabilitada: true },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'orientation', opcoes: ORIENTACOES },
    { tipo: 'opcoes', nome: 'appearance', opcoes: APARENCIAS },
    { tipo: 'booleano', nome: 'desabilitada' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <Tabs
        appearance={valores.appearance as (typeof APARENCIAS)[number]}
        items={ABAS_DO_MODULO.map((aba) => (aba.key === 'legado' ? { ...aba, disabled: valores.desabilitada } : aba))}
        label={valores.label}
        onSelectedKeyChange={(chave) => registrar(`onSelectedKeyChange: ${chave}`)}
        orientation={valores.orientation as TabsOrientation}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Tabs', [
      ['label', valores.label],
      ['items', expr('abas')],
      ['orientation', valores.orientation, 'horizontal'],
      ['appearance', valores.appearance, 'underline'],
      ['onSelectedKeyChange', expr('setAba')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Lista nomeada', detalhe: `role="tablist" com aria-label "${valores.label.trim()}".` }
        : { nivel: 'falha', titulo: 'Lista sem nome', detalhe: 'label é obrigatório: nomeia o tablist para o leitor de tela.' },
      {
        nivel: 'ok',
        titulo: 'Eixo das setas',
        detalhe:
          valores.orientation === 'vertical'
            ? 'aria-orientation="vertical": cima e baixo trocam a aba.'
            : 'aria-orientation="horizontal": esquerda e direita trocam a aba.',
      },
    ];

    if (valores.desabilitada) {
      verificacoes.push({ nivel: 'ok', titulo: 'Aba desabilitada', detalhe: 'As setas a pulam; a lista mantém uma parada de Tab.' });
    }

    return verificacoes;
  },
});

function Controladas() {
  const [aba, setAba] = useState('acesso');

  return (
    <div className="stack" style={{ width: '100%' }}>
      <Tabs items={ABAS_DO_MODULO} label="Configurações do módulo" onSelectedKeyChange={setAba} selectedKey={aba} />
      <p className="note">
        Aba atual: <code>{aba}</code>
      </p>
    </div>
  );
}

function Variantes() {
  return (
    <div>
      <div className="subsection">
        <h3><code>horizontal</code></h3>
        <Tabs items={ABAS_DO_MODULO} label="Configurações do módulo" />
        <VerCodigo codigo={'<Tabs label="Configurações do módulo" items={abas} />'} />
      </div>
      <div className="subsection">
        <h3><code>vertical</code></h3>
        <Tabs items={ABAS_DA_CONTA} label="Preferências da conta" orientation="vertical" />
        <p className="note">
          A lista vira coluna ao lado do painel e as setas passam a ser cima e baixo. Vale a partir de cerca de seis seções,
          ou antes se algum rótulo passar de duas palavras.
        </p>
        <VerCodigo
          codigo={`<Tabs
  label="Preferências da conta"
  items={abas}
  orientation="vertical"
/>`}
        />
      </div>
      <div className="subsection">
        <h3><code>appearance="segmented"</code></h3>
        <Tabs appearance="segmented" items={ABAS_DO_MODULO} label="Configurações do módulo" />
        <p className="note">
          O trilho do <code>SegmentedControl</code>, com a mesma semântica de abas: <code>tablist</code>, <code>tabpanel</code> e
          as setas.
        </p>
        <VerCodigo codigo={'<Tabs appearance="segmented" label="Configurações do módulo" items={abas} />'} />
      </div>
      <div className="subsection">
        <h3><code>fillHeight</code> na vertical</h3>
        <div style={{ height: 180 }}>
          <Tabs
            fillHeight
            items={ABAS_DA_CONTA.map((aba) => ({
              ...aba,
              content: Array.from({ length: 8 }, (_, indice) => <p key={indice}>{aba.content}</p>),
            }))}
            label="Preferências da conta"
            orientation="vertical"
            style={{ height: '100%' }}
          />
        </div>
        <p className="note">O painel ocupa a altura dada às abas e rola por dentro; a lista fica no lugar.</p>
        <VerCodigo
          codigo={`<Tabs
  fillHeight
  orientation="vertical"
  label="Preferências da conta"
  items={abas}
  style={{ height: 180 }}
/>`}
        />
      </div>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Não controlado</dt>
      <dd>
        Começa em <code>defaultSelectedKey</code> ou, sem ela, na primeira aba habilitada.
      </dd>
      <dt>Controlado</dt>
      <dd>
        Com <code>selectedKey</code>, a aba só muda quando o valor muda; <code>onSelectedKeyChange</code> reporta a escolha.
      </dd>
      <dt>Aba desabilitada</dt>
      <dd>
        <code>disabled</code> no item: as setas a pulam. Se a escolhida não existir ou estiver desabilitada, a primeira
        habilitada fica como parada de Tab.
      </dd>
      <dt>Aba apagada</dt>
      <dd>
        <code>muted</code> no item: texto terciário e <code>data-muted</code>, para uma aba de menor peso. Continua focável e
        selecionável. No segmentado fica no secundário, que tem contraste sobre o trilho.
      </dd>
      <dt>Ativação automática</dt>
      <dd>Mover o foco com as setas troca o painel na hora, conforme o padrão do APG para painéis que carregam instantaneamente.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Configurações de um módulo',
      descricao: 'Painéis irmãos, com uma aba indisponível pulada pelas setas.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Tabs items={ABAS_DO_MODULO} label="Configurações do módulo" />
        </div>
      ),
      codigo:
        "<Tabs\n  label=\"Configurações do módulo\"\n  items={[\n    { key: 'geral', label: 'Geral', content: <Geral /> },\n    { key: 'acesso', label: 'Acesso', content: <Acesso /> },\n    { key: 'legado', label: 'Legado', content: null, disabled: true },\n    { key: 'logs', label: 'Logs', content: <Logs /> },\n  ]}\n/>",
    },
    {
      titulo: 'Controlada',
      descricao: 'A aba vive no estado da página, para a rota ou outro componente lerem.',
      Previa: Controladas,
      codigo:
        "const [aba, setAba] = useState('acesso');\n\n<Tabs\n  label=\"Configurações do módulo\"\n  items={abas}\n  selectedKey={aba}\n  onSelectedKeyChange={setAba}\n/>",
    },
    {
      titulo: 'Fila com contagens e ações',
      descricao:
        'O selo da contagem entra no nome da aba, como "Em aberto, 24". A aba apagada continua no teclado. A ação fica fora do tablist.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Tabs
            actions={
              <Button size="sm" variant="secondary">
                <IconPlus /> Novo chamado
              </Button>
            }
            items={ABAS_DA_FILA}
            label="Fila de chamados"
          />
        </div>
      ),
      codigo: `<Tabs
  label="Fila de chamados"
  actions={<Button size="sm" variant="secondary">Novo chamado</Button>}
  items={[
    { key: 'abertos', label: 'Em aberto', count: 24, content: <Abertos /> },
    { key: 'andamento', label: 'Em andamento', count: 7, content: <Andamento /> },
    { key: 'resolvidos', label: 'Resolvidos', count: 1380, content: <Resolvidos /> },
    { key: 'arquivados', label: 'Arquivados', muted: true, content: <Arquivados /> },
  ]}
/>`,
    },
    {
      titulo: 'Segmentado, com contagens',
      descricao: 'O trilho do SegmentedControl, trocando painéis.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Tabs appearance="segmented" items={ABAS_DA_FILA} label="Fila de chamados" />
        </div>
      ),
      codigo: '<Tabs appearance="segmented" label="Fila de chamados" items={abas} />',
    },
    {
      titulo: 'Preferências da conta',
      descricao: 'Na vertical, a lista fica ao lado do painel.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Tabs items={ABAS_DA_CONTA} label="Preferências da conta" orientation="vertical" />
        </div>
      ),
      codigo: '<Tabs\n  label="Preferências da conta"\n  items={abas}\n  orientation="vertical"\n/>',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Tabs items={ABAS_DA_CONTA.slice(0, 3)} label="Preferências da conta" />
      </div>
    ),
    texto: 'Tabs quando cada aba troca o conteúdo que ela controla: painéis diferentes, lado a lado.',
    codigo: `<Tabs
  label="Preferências da conta"
  items={[
    { key: 'perfil', label: 'Perfil', content: <Perfil /> },
    { key: 'notificacoes', label: 'Notificações', content: <Notificacoes /> },
    { key: 'seguranca', label: 'Segurança', content: <Seguranca /> },
  ]}
/>`,
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Tabs defaultSelectedKey="semana" items={ABAS_DO_PERIODO} label="Período" />
      </div>
    ),
    texto: 'Tabs para mudar o período de um mesmo gráfico. Ali muda um valor, não o painel: é SegmentedControl.',
    codigo: `<Tabs
  label="Período"
  items={[
    { key: 'dia', label: 'Dia', content: <GraficoDePedidos periodo="dia" /> },
    { key: 'semana', label: 'Semana', content: <GraficoDePedidos periodo="semana" /> },
    { key: 'mes', label: 'Mês', content: <GraficoDePedidos periodo="mes" /> },
  ]}
  defaultSelectedKey="semana"
/>`,
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Entra na aba atual; o próximo Tab vai ao painel.' },
    { teclas: ['→', '←'], acao: 'Na horizontal, vai à aba seguinte ou anterior, em círculo, pulando as desabilitadas.' },
    { teclas: ['↓', '↑'], acao: 'O mesmo, na vertical.' },
    { teclas: ['Home', 'End'], acao: 'Vai à primeira ou à última aba habilitada.' },
  ],
  garantias: [
    { garantia: 'Pressão', como: <>A aba mostra <code>:active</code> em qualquer ponteiro, e o hover só onde o ponteiro paira.</>, teste: 'mobile.test.ts' },
    {
      garantia: 'Aba ligada ao painel',
      como: <><code>aria-controls</code> só aponta para o painel que existe; o painel leva <code>aria-labelledby</code>.</>,
      teste: 'detalhes.test.tsx',
    },
    { garantia: 'Setas, Home e End', como: 'Ativação automática, em círculo, pulando desabilitadas.', teste: 'Tabs.test.tsx' },
    { garantia: 'Orientação anunciada', como: <><code>aria-orientation</code> e o eixo das setas acompanham <code>orientation</code>.</>, teste: 'Tabs.test.tsx' },
    { garantia: 'Parada de Tab', como: 'Sempre uma aba alcançável, mesmo com a escolhida desabilitada ou ausente.', teste: 'Tabs.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref, no elemento de fora.',
  api: [
    {
      nome: 'items',
      tipo: 'readonly TabItem[]',
      descricao: <>Cada aba: <code>key</code>, <code>label</code>, <code>content</code>, <code>disabled</code>, <code>count</code> e <code>muted</code>.</>,
    },
    { nome: 'label', tipo: 'string', descricao: 'Obrigatório. Nome do tablist.' },
    { nome: 'selectedKey', tipo: 'string', descricao: 'Aba atual, no modo controlado.' },
    { nome: 'defaultSelectedKey', tipo: 'string', padrao: 'primeira habilitada', descricao: 'Aba inicial, no modo não controlado.' },
    { nome: 'onSelectedKeyChange', tipo: '(key: string) => void', descricao: 'Recebe a chave da aba escolhida.' },
    { nome: 'orientation', tipo: "'horizontal' | 'vertical'", padrao: "'horizontal'", descricao: 'Direção da lista e eixo das setas.' },
    { nome: 'appearance', tipo: "'underline' | 'segmented'", padrao: "'underline'", descricao: 'Faixa com traço sob a ativa, ou trilho segmentado.' },
    { nome: 'actions', tipo: 'ReactNode', descricao: <>Ações ao lado das abas, fora do <code>tablist</code>.</> },
    { nome: 'fillHeight', tipo: 'boolean', padrao: 'false', descricao: 'O painel ocupa a altura que sobra e rola, também na vertical.' },
    { nome: 'items[].count', tipo: 'number', descricao: 'Selo depois do rótulo; entra no nome como "Rótulo, N".' },
    { nome: 'items[].muted', tipo: 'boolean', descricao: <>Aba de menor peso, com <code>data-muted</code>; continua no teclado.</> },
  ],
};
