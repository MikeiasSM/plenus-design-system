import { useState } from 'react';
import { Accordion, Button, type AccordionIconPosition, type AccordionItem } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const POSICOES = ['right', 'left'] as const;

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

const playground = definirPlayground({
  inicial: { multiple: false, iconPosition: 'right', divider: true, desabilitada: false },
  controles: [
    { tipo: 'booleano', nome: 'multiple' },
    { tipo: 'opcoes', nome: 'iconPosition', opcoes: POSICOES },
    { tipo: 'booleano', nome: 'divider' },
    { tipo: 'booleano', nome: 'desabilitada' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <Accordion
        divider={valores.divider}
        iconPosition={valores.iconPosition as AccordionIconPosition}
        items={politicas.map((item) => (item.key === 'suporte' ? { ...item, disabled: valores.desabilitada } : item))}
        key={String(valores.multiple)}
        multiple={valores.multiple}
        onExpandedChange={(chaves) => registrar(`onExpandedChange: [${chaves.join(', ')}]`)}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Accordion', [
      ['items', expr('secoes')],
      ['multiple', valores.multiple, false],
      ['iconPosition', valores.iconPosition, 'right'],
      ['divider', valores.divider, true],
      ['onExpandedChange', expr('setAbertas')],
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
      <Accordion expandedKeys={abertas} items={politicas} multiple onExpandedChange={setAbertas} />
    </div>
  );
}

function Variantes() {
  return (
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
          </div>
        )),
      )}
    </div>
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
      <dd><code>expandedKeys</code> com <code>onExpandedChange</code>: o produto decide quais ficam abertas.</dd>
      <dt>Item <code>disabled</code></dt>
      <dd>O gatilho fica desabilitado e as setas o pulam.</dd>
      <dt>Painel fechado</dt>
      <dd>Fica com <code>hidden</code>: some da tela e da leitura.</dd>
      <dt>Cabeçalho</dt>
      <dd>Cada gatilho fica dentro de um <code>h3</code>, para a seção aparecer na navegação por títulos.</dd>
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
      titulo: 'Abrir todas',
      descricao: 'Controlado: um botão fora do acordeão abre e recolhe todas as seções.',
      Previa: AbrirTodas,
      codigo:
        "const [abertas, setAbertas] = useState<readonly string[]>([]);\n\n<Button onClick={() => setAbertas(politicas.map((item) => item.key))}>\n  Abrir todas\n</Button>\n<Accordion\n  items={politicas}\n  multiple\n  expandedKeys={abertas}\n  onExpandedChange={setAbertas}\n/>",
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
    { garantia: 'Painel fechado oculto', como: <><code>hidden</code> no painel recolhido.</>, teste: 'Accordion.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref, no elemento de fora.',
  api: [
    { nome: 'items', tipo: 'readonly AccordionItem[]', descricao: <>Obrigatório. Cada item tem <code>key</code>, <code>label</code>, <code>content</code> e <code>disabled</code> opcional.</> },
    { nome: 'multiple', tipo: 'boolean', padrao: 'false', descricao: 'Permite várias seções abertas.' },
    { nome: 'defaultExpandedKeys', tipo: 'readonly string[]', descricao: 'Abertas no início, no modo não controlado.' },
    { nome: 'expandedKeys', tipo: 'readonly string[]', descricao: 'Abertas, no modo controlado.' },
    { nome: 'onExpandedChange', tipo: '(keys: readonly string[]) => void', descricao: 'Recebe as chaves abertas a cada mudança.' },
    { nome: 'iconPosition', tipo: "'left' | 'right'", padrao: "'right'", descricao: 'Lado do chevron, que gira ao abrir.' },
    { nome: 'divider', tipo: 'boolean', padrao: 'true', descricao: 'Divisor entre as seções, com a folga que ele exige.' },
  ],
};
