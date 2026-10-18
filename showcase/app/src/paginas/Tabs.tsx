import { useState } from 'react';
import { SegmentedControl, Tabs, type TabItem, type TabsOrientation } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const ORIENTACOES = ['horizontal', 'vertical'] as const;

const ABAS_DO_MODULO: TabItem[] = [
  { key: 'geral', label: 'Geral', content: 'Nome, descrição e responsável pelo módulo.' },
  { key: 'acesso', label: 'Acesso', content: 'Perfis e permissões que enxergam este módulo.' },
  { key: 'legado', label: 'Legado', content: 'Indisponível', disabled: true },
  { key: 'logs', label: 'Logs', content: 'Histórico de alterações dos últimos 90 dias.' },
];

const ABAS_DA_CONTA: TabItem[] = [
  { key: 'perfil', label: 'Perfil', content: 'Nome, foto e dados de contato.' },
  { key: 'notificacoes', label: 'Notificações', content: 'Quais avisos chegam por e-mail e quais ficam no sistema.' },
  { key: 'seguranca', label: 'Segurança', content: 'Senha, sessões ativas e verificação em duas etapas.' },
  { key: 'faturamento', label: 'Faturamento', content: 'Plano contratado, notas e forma de pagamento.' },
];

const playground = definirPlayground({
  inicial: { label: 'Configurações do módulo', orientation: 'horizontal', desabilitada: true },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'orientation', opcoes: ORIENTACOES },
    { tipo: 'booleano', nome: 'desabilitada' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <Tabs
        items={ABAS_DO_MODULO.map((aba) => (aba.key === 'legado' ? { ...aba, disabled: valores.desabilitada } : aba))}
        label={valores.label}
        onSelectionChange={(chave) => registrar(`onSelectionChange: ${chave}`)}
        orientation={valores.orientation as TabsOrientation}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Tabs', [
      ['label', valores.label],
      ['items', expr('abas')],
      ['orientation', valores.orientation, 'horizontal'],
      ['onSelectionChange', expr('setAba')],
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
      <Tabs items={ABAS_DO_MODULO} label="Configurações do módulo" onSelectionChange={setAba} selectedKey={aba} />
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
      </div>
      <div className="subsection">
        <h3><code>vertical</code></h3>
        <Tabs items={ABAS_DA_CONTA} label="Preferências da conta" orientation="vertical" />
        <p className="note">
          A lista vira coluna ao lado do painel e as setas passam a ser cima e baixo. Vale a partir de cerca de seis seções,
          ou antes se algum rótulo passar de duas palavras.
        </p>
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
        Com <code>selectedKey</code>, a aba só muda quando o valor muda; <code>onSelectionChange</code> reporta a escolha.
      </dd>
      <dt>Aba desabilitada</dt>
      <dd>
        <code>disabled</code> no item: as setas a pulam. Se a escolhida não existir ou estiver desabilitada, a primeira
        habilitada fica como parada de Tab.
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
        "const [aba, setAba] = useState('acesso');\n\n<Tabs\n  label=\"Configurações do módulo\"\n  items={abas}\n  selectedKey={aba}\n  onSelectionChange={setAba}\n/>",
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
  },
  evite: {
    Previa: () => (
      <SegmentedControl
        defaultValue="semana"
        items={[
          { label: 'Dia', value: 'dia' },
          { label: 'Semana', value: 'semana' },
          { label: 'Mês', value: 'mes' },
        ]}
        label="Período"
      />
    ),
    texto: 'Tabs para mudar o período de um mesmo gráfico. Ali muda um valor, não o painel: é SegmentedControl.',
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
    { nome: 'items', tipo: 'readonly TabItem[]', descricao: <>Cada aba: <code>key</code>, <code>label</code>, <code>content</code> e <code>disabled</code>.</> },
    { nome: 'label', tipo: 'string', descricao: 'Obrigatório. Nome do tablist.' },
    { nome: 'selectedKey', tipo: 'string', descricao: 'Aba atual, no modo controlado.' },
    { nome: 'defaultSelectedKey', tipo: 'string', padrao: 'primeira habilitada', descricao: 'Aba inicial, no modo não controlado.' },
    { nome: 'onSelectionChange', tipo: '(key: string) => void', descricao: 'Recebe a chave da aba escolhida.' },
    { nome: 'orientation', tipo: "'horizontal' | 'vertical'", padrao: "'horizontal'", descricao: 'Direção da lista e eixo das setas.' },
  ],
};
