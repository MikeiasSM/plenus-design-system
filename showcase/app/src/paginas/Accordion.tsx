import { useState } from 'react';
import { Accordion, Badge, Button, IconFile, type AccordionIconPosition, type AccordionItem } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const POSICOES = ['right', 'left'] as const;
const INDICADORES = ['chevron', 'plus'] as const;
const APARENCIAS = ['divided', 'plain', 'separated'] as const;
const CABECALHOS = ['default', 'compact'] as const;

const politicas: AccordionItem[] = [
  { key: 'envio', label: 'Regras de envio', content: 'Prazos, transportadoras e restrições por região.' },
  { key: 'pagamento', label: 'Formas de pagamento', content: 'Pix, boleto e cartão, com as regras de cada um.' },
  { key: 'suporte', label: 'Canais de suporte', content: 'Telefone, chat e e-mail, com horários de atendimento.' },
];

const perguntas: AccordionItem[] = [
  { key: 'prazo', label: 'Qual o prazo de entrega?', content: 'De três a cinco dias úteis para as capitais.' },
  { key: 'troca', label: 'Como solicitar troca?', content: 'Pelo painel do pedido, em até sete dias do recebimento.' },
  { key: 'nota', label: 'Onde fica a nota fiscal?', content: 'Anexada ao e-mail de confirmação e no histórico do pedido.' },
];

const documentos: AccordionItem[] = [
  {
    key: 'contrato',
    label: 'Contrato assinado',
    overline: 'Etapa 1',
    icon: <IconFile />,
    end: <Badge tone="success">Completo</Badge>,
    endLabel: 'completo',
    content: 'O contrato e os anexos, com a data de cada assinatura.',
  },
  {
    key: 'comprovantes',
    label: 'Comprovantes de endereço',
    overline: 'Etapa 2',
    icon: <IconFile />,
    end: <Badge tone="warning">2 pendentes</Badge>,
    endLabel: '2 pendentes',
    content: 'Conta de consumo ou declaração, emitida nos últimos três meses.',
  },
  {
    key: 'cadastro',
    label: 'Ficha cadastral',
    overline: 'Etapa 3',
    icon: <IconFile />,
    content: 'Os dados de contato e o endereço de entrega.',
  },
];

const playground = definirPlayground({
  inicial: {
    multiple: false,
    iconPosition: 'right',
    indicator: 'chevron',
    appearance: 'divided',
    headerStyle: 'default',
    fendas: false,
    desabilitada: false,
  },
  controles: [
    { tipo: 'booleano', nome: 'multiple' },
    { tipo: 'opcoes', nome: 'iconPosition', opcoes: POSICOES },
    { tipo: 'opcoes', nome: 'indicator', opcoes: INDICADORES },
    { tipo: 'opcoes', nome: 'appearance', opcoes: APARENCIAS },
    { tipo: 'opcoes', nome: 'headerStyle', opcoes: CABECALHOS },
    { tipo: 'booleano', nome: 'fendas' },
    { tipo: 'booleano', nome: 'desabilitada' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <Accordion
        appearance={valores.appearance as (typeof APARENCIAS)[number]}
        headerStyle={valores.headerStyle as (typeof CABECALHOS)[number]}
        iconPosition={valores.iconPosition as AccordionIconPosition}
        indicator={valores.indicator as (typeof INDICADORES)[number]}
        items={(valores.fendas ? documentos : politicas).map((item, indice) =>
          indice === 2 ? { ...item, disabled: valores.desabilitada } : item,
        )}
        key={String(valores.multiple)}
        multiple={valores.multiple}
        onExpandedKeysChange={(chaves) => registrar(`onExpandedKeysChange: [${chaves.join(', ')}]`)}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Accordion', [
      ['items', expr('secoes')],
      ['multiple', valores.multiple, false],
      ['iconPosition', valores.iconPosition, 'right'],
      ['indicator', valores.indicator, 'chevron'],
      ['appearance', valores.appearance, 'divided'],
      ['headerStyle', valores.headerStyle, 'default'],
      ['onExpandedKeysChange', expr('setAbertas')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      { nivel: 'ok', titulo: 'Gatilho e painel ligados', detalhe: 'aria-expanded e aria-controls no botão; o painel é região nomeada por ele.' },
      valores.multiple
        ? { nivel: 'ok', titulo: 'Várias abertas', detalhe: 'Cada seção abre e fecha sem mexer nas outras.' }
        : { nivel: 'ok', titulo: 'Uma por vez', detalhe: 'Abrir uma fecha a anterior; clicar de novo na aberta a fecha.' },
    ];

    if (valores.iconPosition === 'left') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Ícone à esquerda', detalhe: 'Serve a rótulos curtos em coluna estreita; a convenção da web é a direita.' });
    }

    if (valores.fendas) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Fendas do item',
        detalhe: 'icon e end são decorativos; overline e endLabel entram no nome do cabeçalho, como "Etapa 2 Comprovantes de endereço 2 pendentes".',
      });
    }

    if (valores.headerStyle === 'compact') {
      verificacoes.push({ nivel: 'ok', titulo: 'Cabeçalho compacto', detalhe: 'Texto de legenda com a inicial maiúscula, sem caixa alta nem espaçamento entre letras.' });
    }

    if (valores.desabilitada) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Seção desabilitada', detalhe: 'Sai da tabulação e as setas a pulam. Diga por que ela não está disponível.' });
    }

    return verificacoes;
  },
});

function AbrirTodas() {
  const [abertas, setAbertas] = useState<readonly string[]>([]);
  const todasAbertas = abertas.length === politicas.length;

  return (
    <div className="stack" style={{ width: '100%' }}>
      <div>
        <Button onClick={() => setAbertas(todasAbertas ? [] : politicas.map((item) => item.key))} size="sm" variant="secondary">
          {todasAbertas ? 'Recolher todas' : 'Abrir todas'}
        </Button>
      </div>
      <Accordion expandedKeys={abertas} items={politicas} multiple onExpandedKeysChange={setAbertas} />
    </div>
  );
}

function Variantes() {
  return (
    <>
      <div className="demo-grid">
        {POSICOES.map((posicao) =>
          [true, false].map((divisor) => (
            <div className="subsection" key={`${posicao}-${divisor}`}>
              <h3>
                iconPosition=&quot;{posicao}&quot;, {divisor ? 'com divisor' : 'sem divisor'}
              </h3>
              <Accordion
                defaultExpandedKeys={['prazo']}
                divider={divisor}
                iconPosition={posicao}
                items={perguntas}
              />
              <VerCodigo
                codigo={`<Accordion
  items={perguntas}
  defaultExpandedKeys={['prazo']}
  iconPosition="${posicao}"${divisor ? '' : '\n  divider={false}'}
/>`}
              />
            </div>
          )),
        )}
      </div>
      <div className="demo-grid">
        {APARENCIAS.map((aparencia) => (
          <div className="subsection" key={aparencia}>
            <h3>appearance=&quot;{aparencia}&quot;, indicator=&quot;plus&quot;</h3>
            <Accordion appearance={aparencia} defaultExpandedKeys={['prazo']} indicator="plus" items={perguntas} />
            <VerCodigo codigo={`<Accordion items={perguntas} appearance="${aparencia}" indicator="plus" />`} />
          </div>
        ))}
        <div className="subsection">
          <h3>headerStyle=&quot;compact&quot;</h3>
          <Accordion defaultExpandedKeys={['prazo']} headerStyle="compact" items={perguntas} />
          <VerCodigo codigo={'<Accordion items={perguntas} headerStyle="compact" />'} />
        </div>
      </div>
    </>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Uma por vez</dt>
      <dd>O padrão. Abrir uma seção fecha a outra, e nenhuma aberta também é um estado válido.</dd>
      <dt><code>multiple</code></dt>
      <dd>Várias seções abertas em paralelo.</dd>
      <dt>Não controlado</dt>
      <dd><code>defaultExpandedKeys</code> dá as seções abertas no início, e o componente guarda o resto.</dd>
      <dt>Controlado</dt>
      <dd><code>expandedKeys</code> com <code>onExpandedKeysChange</code>: o produto decide quais ficam abertas.</dd>
      <dt>Item <code>disabled</code></dt>
      <dd>O gatilho fica desabilitado e as setas o pulam.</dd>
      <dt>Painel fechado</dt>
      <dd>Fica com <code>hidden</code>: some da tela e da leitura.</dd>
      <dt>Cabeçalho</dt>
      <dd>Cada gatilho fica dentro de um <code>h3</code>, para a seção aparecer na navegação por títulos.</dd>
      <dt><code>appearance</code></dt>
      <dd>
        <code>divided</code>, o padrão, é um contorno com divisor entre as seções; <code>plain</code> não tem contorno;{' '}
        <code>separated</code> é um cartão por seção, com vão entre eles. Sem ela, vale o <code>divider</code> de antes.
      </dd>
      <dt><code>headerStyle=&quot;compact&quot;</code></dt>
      <dd>Cabeçalho menor e denso, em texto de legenda, peso de rótulo e cor secundária, com a inicial maiúscula.</dd>
      <dt>Fendas do item</dt>
      <dd>
        <code>icon</code> antes do rótulo e <code>end</code> antes do indicador são decorativos; <code>overline</code>, o
        texto pequeno acima do rótulo, e <code>endLabel</code>, o que o <code>end</code> diz, entram no nome do cabeçalho.
        O <code>end</code> fica dentro do botão e nunca é interativo.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Políticas da loja',
      descricao: 'Uma seção por vez, com a primeira aberta.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Accordion defaultExpandedKeys={['envio']} items={politicas} />
        </div>
      ),
      codigo: "<Accordion defaultExpandedKeys={['envio']} items={politicas} />",
    },
    {
      titulo: 'Perguntas frequentes',
      descricao: 'Ícone à esquerda e sem divisor, para rótulos curtos numa coluna estreita.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Accordion divider={false} iconPosition="left" items={perguntas} />
        </div>
      ),
      codigo: '<Accordion\n  items={perguntas}\n  iconPosition="left"\n  divider={false}\n/>',
    },
    {
      titulo: 'Documentos por etapa',
      descricao: 'Cartões separados, com a etapa acima do rótulo, um ícone e a situação ao fim, que entra no nome do cabeçalho por endLabel.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Accordion appearance="separated" indicator="plus" items={documentos} />
        </div>
      ),
      codigo:
        "<Accordion\n  appearance=\"separated\"\n  indicator=\"plus\"\n  items={[\n    {\n      key: 'comprovantes',\n      label: 'Comprovantes de endereço',\n      overline: 'Etapa 2',\n      icon: <IconFile />,\n      end: <Badge tone=\"warning\">2 pendentes</Badge>,\n      endLabel: '2 pendentes',\n      content: …,\n    },\n  ]}\n/>",
    },
    {
      titulo: 'Abrir todas',
      descricao: 'Controlado: um botão fora do acordeão abre e recolhe todas as seções.',
      Previa: AbrirTodas,
      codigo:
        "const [abertas, setAbertas] = useState<readonly string[]>([]);\n\n<Button onClick={() => setAbertas(politicas.map((item) => item.key))}>\n  Abrir todas\n</Button>\n<Accordion\n  items={politicas}\n  multiple\n  expandedKeys={abertas}\n  onExpandedKeysChange={setAbertas}\n/>",
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Passa pelos cabeçalhos e pelo conteúdo focável das seções abertas.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Abre ou fecha a seção do cabeçalho em foco.' },
    { teclas: ['↓', '↑'], acao: 'Move o foco ao cabeçalho seguinte ou anterior, em círculo, pulando os desabilitados.' },
    { teclas: ['Home', 'End'], acao: 'Leva o foco ao primeiro ou ao último cabeçalho habilitado.' },
  ],
  garantias: [
    { garantia: 'Gatilho e painel', como: <>Botão com <code>aria-expanded</code> e <code>aria-controls</code>; painel com <code>role=&quot;region&quot;</code> nomeado pelo botão.</>, teste: 'Accordion.test.tsx' },
    { garantia: 'Navegação por setas', como: 'Entre cabeçalhos, pulando os desabilitados.', teste: 'Accordion.test.tsx' },
    { garantia: 'Nome do cabeçalho', como: <><code>overline</code> e <code>endLabel</code> entram no nome; <code>icon</code> e <code>end</code> saem com <code>aria-hidden</code>.</>, teste: 'Accordion.test.tsx' },
    { garantia: 'Estado no item', como: <><code>data-expanded</code> no item aberto.</>, teste: 'Accordion.test.tsx' },
    { garantia: 'Painel fechado oculto', como: <><code>hidden</code> no painel recolhido.</>, teste: 'Accordion.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref, no elemento de fora.',
  api: [
    { nome: 'items', tipo: 'readonly AccordionItem[]', descricao: <>Obrigatório. Cada item tem <code>key</code>, <code>label</code>, <code>content</code> e, opcionais, <code>disabled</code>, <code>id</code>, <code>icon</code>, <code>overline</code>, <code>end</code> e <code>endLabel</code>.</> },
    { nome: 'multiple', tipo: 'boolean', padrao: 'false', descricao: 'Permite várias seções abertas.' },
    { nome: 'defaultExpandedKeys', tipo: 'readonly string[]', descricao: 'Abertas no início, no modo não controlado.' },
    { nome: 'expandedKeys', tipo: 'readonly string[]', descricao: 'Abertas, no modo controlado.' },
    { nome: 'onExpandedKeysChange', tipo: '(keys: readonly string[]) => void', descricao: 'Recebe as chaves abertas a cada mudança.' },
    { nome: 'iconPosition', tipo: "'left' | 'right'", padrao: "'right'", descricao: 'Lado do chevron, que gira ao abrir.' },
    { nome: 'indicator', tipo: "'chevron' | 'plus'", padrao: "'chevron'", descricao: 'O chevron gira ao abrir; o mais vira o sinal de menos.' },
    { nome: 'appearance', tipo: "'plain' | 'divided' | 'separated'", descricao: 'Sem contorno, contorno com divisor ou um cartão por seção. Sem ela, vale o divider.' },
    { nome: 'headerStyle', tipo: "'default' | 'compact'", padrao: "'default'", descricao: 'Cabeçalho compacto: legenda, peso de rótulo, cor secundária, sem caixa alta.' },
    { nome: 'divider', tipo: 'boolean', padrao: 'true', descricao: 'Divisor entre as seções, com a folga que ele exige. O mesmo que appearance="divided"; false é plain.' },
    { nome: 'data-expanded', tipo: 'atributo', descricao: 'No item da seção aberta.' },
    { nome: '--accordion-header-surface / --accordion-panel-surface', tipo: 'variável CSS', descricao: 'Fundo do cabeçalho e do painel, lidos com o valor do sistema de reserva.' },
  ],
};
