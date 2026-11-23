import { useState } from 'react';
import {
  Badge,
  Button,
  IconCalendar,
  IconChartBar,
  IconClock,
  SegmentedControl,
  Select,
  type SegmentedControlSize,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const PERIODOS = [
  { label: 'Dia', value: 'dia' },
  { label: 'Semana', value: 'semana' },
  { label: 'Mês', value: 'mes' },
  { label: 'Trimestre', value: 'trimestre' },
  { label: 'Semestre', value: 'semestre' },
  { label: 'Ano', value: 'ano' },
  { label: 'Personalizado', value: 'personalizado' },
];

const VISOES = [
  { icon: <IconChartBar />, label: 'Ver em gráfico', value: 'grafico' },
  { icon: <IconCalendar />, label: 'Ver em calendário', value: 'calendario' },
  { icon: <IconClock />, label: 'Ver em linha do tempo', value: 'linha' },
];

const TAMANHOS = ['sm', 'md', 'lg'] as const;

function periodos(quantidade: number, ultimoDesabilitado: boolean) {
  return PERIODOS.slice(0, quantidade).map((periodo, indice) =>
    ultimoDesabilitado && indice === quantidade - 1 ? { ...periodo, disabled: true } : periodo,
  );
}

const playground = definirPlayground({
  inicial: { label: 'Período', size: 'md', opcoes: 3, ultimoDesabilitado: false, disabled: false },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'numero', nome: 'opcoes', min: 2, max: 7 },
    { tipo: 'booleano', nome: 'ultimoDesabilitado' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <SegmentedControl
      defaultValue="dia"
      disabled={valores.disabled}
      items={periodos(valores.opcoes, valores.ultimoDesabilitado)}
      label={valores.label}
      onValueChange={(valor) => registrar('onValueChange: ' + valor)}
      size={valores.size as SegmentedControlSize}
    />
  ),
  codigo: (valores) => {
    const itens = periodos(valores.opcoes, valores.ultimoDesabilitado)
      .map((item) => `  { label: '${item.label}', value: '${item.value}'${'disabled' in item ? ', disabled: true' : ''} },`)
      .join('\n');

    return `const periodos = [\n${itens}\n];\n\n${gerarJsx('SegmentedControl', [
      ['label', valores.label],
      ['items', expr('periodos')],
      ['size', valores.size, 'md'],
      ['disabled', valores.disabled, false],
      ['defaultValue', 'dia'],
      ['onValueChange', expr('setPeriodo')],
    ])}`;
  },
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Grupo nomeado', detalhe: `"${valores.label.trim()}", em aria-label do radiogroup.` }
        : { nivel: 'falha', titulo: 'Grupo sem nome', detalhe: 'O label não aparece na tela, mas é o que o leitor de tela anuncia ao entrar no grupo.' },
    ];

    if (valores.opcoes > 5) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: `${valores.opcoes} opções`,
        detalhe: 'Mais de cinco opções, ou opções longas, pedem um Select.',
      });
    }

    if (valores.disabled) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Desabilitado', detalhe: 'Todos os segmentos saem da tabulação. Diga perto dele por quê.' });
    }

    return verificacoes;
  },
});

function PeriodoDoPainel() {
  const [periodo, setPeriodo] = useState('semana');

  return (
    <div className="stack">
      <SegmentedControl items={PERIODOS.slice(0, 4)} label="Período" onValueChange={setPeriodo} value={periodo} />
      <p className="note">O painel mostra: {PERIODOS.find((item) => item.value === periodo)?.label}</p>
    </div>
  );
}

const CODIGO_DAS_VARIANTES = `<SegmentedControl label="Período" items={periodos} size="sm" />
<SegmentedControl label="Período" items={periodos} size="md" />
<SegmentedControl label="Período" items={periodos} size="lg" />

<SegmentedControl label="Forma de exibição" items={visoes} />
<SegmentedControl label="Forma de exibição" items={visoes} iconOnly />

<SegmentedControl
  label="Período"
  items={[
    { label: 'Dia', value: 'dia' },
    { label: 'Semana', value: 'semana', disabled: true },
  ]}
/>
<SegmentedControl label="Período" items={periodos} disabled />`;

function Variantes() {
  return (
    <>
      <div className="matrix">
        <div className="matrix-row matrix-head">
          <span>size</span>
          <span>texto</span>
          <span>ícone e texto</span>
          <span>iconOnly</span>
          <span>item desabilitado</span>
          <span>disabled</span>
        </div>
        {TAMANHOS.map((tamanho) => (
          <div className="matrix-row" key={tamanho}>
            <code>{tamanho}</code>
            <span>
              <SegmentedControl defaultValue="dia" items={PERIODOS.slice(0, 2)} label="Período" size={tamanho} />
            </span>
            <span>
              <SegmentedControl defaultValue="grafico" items={VISOES.slice(0, 2)} label="Forma de exibição" size={tamanho} />
            </span>
            <span>
              <SegmentedControl defaultValue="grafico" iconOnly items={VISOES} label="Forma de exibição" size={tamanho} />
            </span>
            <span>
              <SegmentedControl
                defaultValue="dia"
                items={[PERIODOS[0], { ...PERIODOS[1], disabled: true }]}
                label="Período"
                size={tamanho}
              />
            </span>
            <span>
              <SegmentedControl defaultValue="dia" disabled items={PERIODOS.slice(0, 2)} label="Período" size={tamanho} />
            </span>
          </div>
        ))}
      </div>
      <VerCodigo codigo={CODIGO_DAS_VARIANTES} />
    </>
  );
}

const SITUACOES_COM_CONTAGEM = [
  { label: 'Abertos', value: 'abertos', trailing: <Badge size="sm">12</Badge>, description: 'Chamados sem resposta' },
  { label: 'Atrasados', value: 'atrasados', trailing: <Badge size="sm" tone="danger">3</Badge>, description: 'Passaram do prazo' },
  { label: 'Fechados', value: 'fechados', trailing: <Badge size="sm">240</Badge> },
];

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((mes) => ({
  label: mes,
  value: mes.toLowerCase(),
}));

function Modos() {
  return (
    <dl className="modes">
      <dt><code>value</code> ou <code>defaultValue</code></dt>
      <dd>
        Controlado com <code>value</code> e <code>onValueChange</code>; não controlado com <code>defaultValue</code>.
      </dd>
      <dt><code>iconOnly</code></dt>
      <dd>
        Mostra só os ícones. O <code>label</code> de cada item continua sendo o nome do segmento e aparece como dica no
        foco e no ponteiro, pelo <code>Tooltip</code>.
      </dd>
      <dt><code>name</code></dt>
      <dd>Por baixo são rádios nativos: com <code>name</code>, a escolha vai ao formulário.</dd>
      <dt><code>disabled</code></dt>
      <dd>No grupo, desabilita todos os segmentos; no item, só aquele.</dd>
      <dt><code>trailing</code> e <code>description</code></dt>
      <dd>
        No item: <code>trailing</code> aparece depois do rótulo, fora do nome; <code>description</code> é texto oculto que
        descreve o rádio por <code>aria-describedby</code>.
      </dd>
      <dt>Estado do segmento</dt>
      <dd>
        O segmento leva <code>data-selected</code> quando escolhido e <code>data-disabled</code> quando desabilitado, e soma a{' '}
        <code>className</code> do item.
      </dd>
      <dt>Rolagem</dt>
      <dd>Quando o trilho não cabe, o escolhido entra na vista ao montar e ao mudar, sem rolar a página.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Período de um painel',
      descricao: 'O segmento muda um valor, e o produto redesenha o que a tela mostra.',
      Previa: PeriodoDoPainel,
      codigo:
        "<SegmentedControl\n  label=\"Período\"\n  items={[\n    { label: 'Dia', value: 'dia' },\n    { label: 'Semana', value: 'semana' },\n    { label: 'Mês', value: 'mes' },\n    { label: 'Trimestre', value: 'trimestre' },\n  ]}\n  value={periodo}\n  onValueChange={setPeriodo}\n/>",
    },
    {
      titulo: 'Só com ícones',
      descricao: 'Passe o ponteiro ou chegue pelo teclado: o nome de cada segmento aparece como dica.',
      Previa: () => <SegmentedControl defaultValue="grafico" iconOnly items={VISOES} label="Forma de exibição" />,
      codigo:
        "<SegmentedControl\n  label=\"Forma de exibição\"\n  iconOnly\n  items={[\n    { icon: <IconChartBar />, label: 'Ver em gráfico', value: 'grafico' },\n    { icon: <IconCalendar />, label: 'Ver em calendário', value: 'calendario' },\n    { icon: <IconClock />, label: 'Ver em linha do tempo', value: 'linha' },\n  ]}\n  defaultValue=\"grafico\"\n/>",
    },
    {
      titulo: 'Numa barra de ferramentas',
      descricao: 'Cada tamanho tem a altura do Button correspondente, para alinhar na mesma linha.',
      Previa: () => (
        <div className="demo-row">
          <SegmentedControl
            defaultValue="todos"
            items={[
              { label: 'Todos', value: 'todos' },
              { label: 'Ativos', value: 'ativos' },
              { label: 'Inativos', value: 'inativos' },
            ]}
            label="Situação"
            size="sm"
          />
          <Button size="sm" variant="secondary">Exportar</Button>
        </div>
      ),
      codigo:
        "<SegmentedControl\n  label=\"Situação\"\n  size=\"sm\"\n  items={[\n    { label: 'Todos', value: 'todos' },\n    { label: 'Ativos', value: 'ativos' },\n    { label: 'Inativos', value: 'inativos' },\n  ]}\n  defaultValue=\"todos\"\n/>\n<Button size=\"sm\" variant=\"secondary\">Exportar</Button>",
    },
    {
      titulo: 'Com contagem e descrição',
      descricao: 'O selo depois do rótulo é decorativo; a descrição oculta completa o que o rótulo curto não diz.',
      Previa: () => <SegmentedControl defaultValue="abertos" items={SITUACOES_COM_CONTAGEM} label="Situação" />,
      codigo: `<SegmentedControl
  label="Situação"
  items={[
    { label: 'Abertos', value: 'abertos', trailing: <Badge size="sm">12</Badge>, description: 'Chamados sem resposta' },
    { label: 'Atrasados', value: 'atrasados', trailing: <Badge size="sm" tone="danger">3</Badge>, description: 'Passaram do prazo' },
    { label: 'Fechados', value: 'fechados', trailing: <Badge size="sm">240</Badge> },
  ]}
  defaultValue="abertos"
/>`,
    },
    {
      titulo: 'Trilho que rola',
      descricao: 'Num espaço estreito, o mês escolhido entra na vista ao montar e a cada troca, sem rolar a página.',
      Previa: () => (
        <div style={{ maxWidth: 240 }}>
          <SegmentedControl defaultValue="out" items={MESES} label="Mês" size="sm" />
        </div>
      ),
      codigo: '<SegmentedControl label="Mês" size="sm" items={meses} defaultValue="out" />',
    },
  ],
  faca: {
    Previa: () => <SegmentedControl defaultValue="dia" items={PERIODOS.slice(0, 3)} label="Período" />,
    texto: 'Poucas opções curtas que mudam o que a tela mostra, como o período de um painel.',
    codigo: '<SegmentedControl label="Período" items={periodos} defaultValue="dia" />',
  },
  evite: {
    Previa: () => (
      <div className="stack">
        <SegmentedControl defaultValue="dia" items={PERIODOS} label="Período" size="sm" />
        <Select defaultValue="dia" label="Período" options={PERIODOS} />
      </div>
    ),
    texto: 'Mais de cinco opções, ou opções longas, num trilho que não cabe. A escolha é um Select, como o de baixo. Para trocar um painel de conteúdo, Tabs.',
    codigo:
      '<SegmentedControl label="Período" items={periodos} size="sm" defaultValue="dia" />\n<Select label="Período" options={periodos} defaultValue="dia" />',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Entra no grupo pelo segmento escolhido e sai dele de uma vez.' },
    { teclas: ['←', '→', '↑', '↓'], acao: 'Move para o segmento vizinho e o escolhe, pulando os desabilitados.' },
  ],
  garantias: [
    { garantia: 'Pressão', como: <>O segmento mostra <code>:active</code> em qualquer ponteiro, e o hover só onde o ponteiro paira.</>, teste: 'mobile.test.ts' },
    {
      garantia: 'Grupo nomeado',
      como: <><code>role="radiogroup"</code> com o <code>label</code> em <code>aria-label</code>.</>,
      teste: 'SegmentedControl.test.tsx',
    },
    { garantia: 'Rádios nativos', como: 'Cada segmento é um rádio, nomeado pelo texto do item.', teste: 'SegmentedControl.test.tsx' },
    {
      garantia: 'Nome sem texto visível',
      como: <>Com <code>iconOnly</code>, o texto do item fica visualmente oculto e vira dica no foco.</>,
      teste: 'SegmentedControl.test.tsx',
    },
    { garantia: 'Formulário', como: <>O valor escolhido vai no envio pelo <code>name</code>.</>, teste: 'SegmentedControl.test.tsx' },
  ],
  notaDaApi: 'As demais propriedades nativas de <div> e o ref vão ao contêiner do grupo.',
  api: [
    {
      nome: 'items',
      tipo: '{ label: string; value: string; icon?: ReactNode; disabled?: boolean; trailing?: ReactNode; description?: string; className?: string }[]',
      descricao: 'Os segmentos. O label é o nome, mesmo com iconOnly; trailing fica fora do nome, e description descreve o rádio.',
    },
    { nome: 'label', tipo: 'string', descricao: 'Nome do grupo, para o leitor de tela. Opcional quando há aria-labelledby ou aria-label.' },
    { nome: 'value', tipo: 'string', descricao: 'Valor escolhido, no modo controlado.' },
    { nome: 'defaultValue', tipo: 'string', descricao: 'Valor inicial, no modo não controlado.' },
    { nome: 'onValueChange', tipo: '(value: string) => void', descricao: 'Avisa o segmento escolhido.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Altura do Button do mesmo tamanho.' },
    { nome: 'iconOnly', tipo: 'boolean', padrao: 'false', descricao: 'Mostra só os ícones; o label vira dica.' },
    { nome: 'name', tipo: 'string', padrao: 'gerado', descricao: 'Nome nativo dos rádios, usado no envio do formulário.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita todos os segmentos.' },
  ],
};
