import { useEffect, useId, useRef, useState } from 'react';
import { Button, ButtonIcon, IconSearch, Tooltip, type TooltipPlacement } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const POSICOES = ['top', 'bottom', 'left', 'right'] as const;
const ABERTURAS = ['não controlado', 'true', 'false'] as const;

const aberturaDe = (open: string) => (open === 'não controlado' ? undefined : open === 'true');

const playground = definirPlayground({
  inicial: { content: 'Salva sem fechar a tela', placement: 'top', delay: 500, open: 'não controlado', gatilho: 'Salvar' },
  controles: [
    { tipo: 'texto', nome: 'content' },
    { tipo: 'opcoes', nome: 'placement', opcoes: POSICOES },
    { tipo: 'numero', nome: 'delay', min: 0, max: 2000, passo: 100 },
    { tipo: 'opcoes', nome: 'open', opcoes: ABERTURAS },
    { tipo: 'texto', nome: 'gatilho' },
  ],
  renderizar: (valores, registrar) => (
    <Tooltip
      content={valores.content}
      delay={valores.delay}
      onOpenChange={(aberto) => registrar(`onOpenChange: ${aberto}`)}
      open={aberturaDe(valores.open)}
      placement={valores.placement as TooltipPlacement}
    >
      <Button>{valores.gatilho}</Button>
    </Tooltip>
  ),
  codigo: (valores) =>
    gerarJsx(
      'Tooltip',
      [
        ['content', valores.content],
        ['placement', valores.placement, 'top'],
        ['delay', valores.delay, 500],
        ['open', aberturaDe(valores.open)],
        ['onOpenChange', valores.open === 'não controlado' ? undefined : expr('setAberto')],
      ],
      `<Button>${valores.gatilho}</Button>`,
    ),
  verificar: (valores) => {
    const conteudo = valores.content.trim();
    const gatilho = valores.gatilho.trim();
    const verificacoes: Verificacao[] = [];

    if (!gatilho) {
      verificacoes.push({
        nivel: 'falha',
        titulo: 'Gatilho sem nome',
        detalhe: 'O Tooltip descreve, não nomeia. Botão só de ícone é ButtonIcon, que exige label.',
      });
    }

    if (!conteudo) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Balão vazio', detalhe: 'Sem content, o balão aparece sem texto.' });
    } else if (conteudo.toLowerCase() === gatilho.toLowerCase()) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Repete o nome',
        detalhe: 'O balão vira descrição do gatilho: o leitor de tela ouviria o mesmo texto duas vezes.',
      });
    } else {
      verificacoes.push({ nivel: 'ok', titulo: 'Descrição acessível', detalhe: 'Enquanto visível, o balão descreve o gatilho por aria-describedby.' });
    }

    return verificacoes;
  },
});

// A célula é do editor, que precisa da própria referência nela; o cursor dentro dela abre a dica.
function CelulaInvalida() {
  const celula = useRef<HTMLSpanElement>(null);
  const [aberta, setAberta] = useState(false);
  const id = useId();

  useEffect(() => {
    function acompanharCursor() {
      const no = document.getSelection()?.anchorNode;
      setAberta(Boolean(no && celula.current?.contains(no)));
    }

    document.addEventListener('selectionchange', acompanharCursor);
    return () => document.removeEventListener('selectionchange', acompanharCursor);
  }, []);

  return (
    <>
      <div className="demo-box" contentEditable style={{ width: '100%' }} suppressContentEditableWarning>
        Quantidade:{' '}
        <span
          aria-describedby={aberta ? id : undefined}
          ref={celula}
          style={{ textDecoration: 'underline wavy var(--pl-color-danger)' }}
        >
          doze
        </span>{' '}
        unidades.
      </div>
      <Tooltip anchorRef={celula} content="Esperava um número" id={id} onOpenChange={setAberta} open={aberta} />
    </>
  );
}

function Variantes() {
  return (
    <>
      <div className="demo-row">
        {POSICOES.map((posicao) => (
          <Tooltip content={`placement="${posicao}"`} key={posicao} placement={posicao}>
            <Button variant="secondary">{posicao}</Button>
          </Tooltip>
        ))}
      </div>
      <p className="note">Passe o ponteiro ou chegue pelo Tab. Sem espaço do lado pedido, o balão inverte.</p>
    </>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Foco</dt>
      <dd>Aparece na hora, quando o gatilho recebe o foco, e some no blur.</dd>
      <dt>Ponteiro</dt>
      <dd>
        Aparece depois de <code>delay</code>, meio segundo por padrão. Ao sair do gatilho, espera o ponteiro atravessar até o
        balão, que pode ser alcançado sem sumir, como pede a WCAG 1.4.13.
      </dd>
      <dt>Escape</dt>
      <dd>Dispensa o balão sem tirar o foco do gatilho.</dd>
      <dt>Não controlado</dt>
      <dd>
        O padrão. O Tooltip guarda a própria abertura e <code>onOpenChange</code> avisa cada pedido: ponteiro, foco, blur e
        Escape.
      </dd>
      <dt>Controlado</dt>
      <dd>
        Com <code>open</code>, o balão aparece e some só pelo consumidor; os mesmos eventos viram pedidos por{' '}
        <code>onOpenChange</code>, inclusive o Escape.
      </dd>
      <dt>Âncora fora do filho</dt>
      <dd>
        Com <code>anchorRef</code>, o Tooltip não tem filho e não clona nada: serve ao elemento que precisa da própria
        referência, como a célula de um editor. A abertura é sempre do produto, por <code>open</code>, e o Escape em
        qualquer ponto da página pede para fechar. A ligação da descrição também fica com o produto: ele passa o{' '}
        <code>id</code> do balão e o põe no <code>aria-describedby</code> da âncora enquanto <code>open</code>.
      </dd>
      <dt>Gatilho</dt>
      <dd>
        Um único elemento focável. O Tooltip soma os próprios manipuladores e a própria descrição aos dele, e entrega o{' '}
        <code>ref</code> a quem o pediu.
      </dd>
      <dt>Dentro de um Dialog</dt>
      <dd>Declara-se camada de cima e continua visível ao leitor de tela.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Explicar uma ação',
      descricao: 'Uma frase curta que diz o que o botão faz além do nome.',
      Previa: () => (
        <>
          <Tooltip content="Salva sem fechar a tela">
            <Button>Salvar</Button>
          </Tooltip>
          <Tooltip content="Descarta as alterações" placement="bottom">
            <Button variant="secondary">Cancelar</Button>
          </Tooltip>
        </>
      ),
      codigo:
        '<Tooltip content="Salva sem fechar a tela">\n  <Button>Salvar</Button>\n</Tooltip>\n<Tooltip content="Descarta as alterações" placement="bottom">\n  <Button variant="secondary">Cancelar</Button>\n</Tooltip>',
    },
    {
      titulo: 'Âncora fora do filho',
      descricao:
        'A célula inválida é do editor. Ponha o cursor nela: o produto abre a dica, liga o aria-describedby e a fecha no Escape.',
      Previa: CelulaInvalida,
      codigo: [
        'const celula = useRef<HTMLSpanElement>(null);',
        'const id = useId();',
        '',
        '<span ref={celula} aria-describedby={aberta ? id : undefined}>doze</span>',
        '<Tooltip',
        '  anchorRef={celula}',
        '  id={id}',
        '  open={aberta}',
        '  onOpenChange={setAberta}',
        '  content="Esperava um número"',
        '/>',
      ].join('\n'),
    },
    {
      titulo: 'Botão só de ícone',
      descricao: 'O ButtonIcon já traz o Tooltip: o label é o nome e vira a dica.',
      Previa: () => <ButtonIcon icon={<IconSearch />} label="Buscar" />,
      codigo: '<ButtonIcon icon={<IconSearch />} label="Buscar" />',
    },
  ],
  faca: {
    Previa: () => (
      <Tooltip content="Salva sem fechar a tela">
        <Button>Salvar</Button>
      </Tooltip>
    ),
    texto: 'Uma frase curta que descreve um elemento.',
  },
  evite: {
    Previa: () => (
      <Tooltip content="Receita R$ 12.400 · Despesa R$ 8.150 · Saldo R$ 4.250 · Margem 34%">
        <Button variant="secondary">Março</Button>
      </Tooltip>
    ),
    texto: 'Várias medidas num balão. Leitura de medidas sob o ponteiro, em grade, é o ChartTooltip.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Ao chegar no gatilho, mostra o balão na hora; ao sair, esconde.' },
    { teclas: ['Esc'], acao: 'Esconde o balão; o foco continua no gatilho. Controlado ou com anchorRef, pede o fechamento.' },
  ],
  garantias: [
    {
      garantia: 'Descrição acessível',
      como: <>Visível, o balão é <code>role=&quot;tooltip&quot;</code> e descreve o gatilho por <code>aria-describedby</code>.</>,
      teste: 'Tooltip.test.tsx',
    },
    { garantia: 'Dispensável', como: 'Some no blur e no Escape.', teste: 'Tooltip.test.tsx' },
    { garantia: 'Atraso no ponteiro', como: 'Só aparece depois de delay.', teste: 'Tooltip.test.tsx' },
    { garantia: 'Alcançável (WCAG 1.4.13)', como: 'Continua aberto enquanto o ponteiro atravessa até o balão.', teste: 'Tooltip.test.tsx' },
    { garantia: 'Gatilho preservado', como: 'Mantém os manipuladores do próprio gatilho.', teste: 'Tooltip.test.tsx' },
    { garantia: 'Abertura controlada', como: 'Com open, o balão só pede a mudança, também no Escape.', teste: 'Tooltip.test.tsx' },
    {
      garantia: 'Âncora fora do filho',
      como: 'Com anchorRef, abre pelo produto, descreve a âncora pelo id que ele liga e pede o fechamento no Escape.',
      teste: 'Tooltip.test.tsx',
    },
    {
      garantia: 'Descrição somada',
      como: <>Soma o próprio id ao <code>aria-describedby</code> que o gatilho já tinha, e entrega o ref do filho.</>,
      teste: 'aninhados.test.tsx',
    },
  ],
  notaDaApi:
    'O balão não recebe data-*, por decisão: a raiz é o gatilho, que é do consumidor. Recebe id só com anchorRef, para o produto ligar o aria-describedby.',
  api: [
    { nome: 'children', tipo: 'ReactElement', descricao: 'Obrigatória sem anchorRef. O gatilho: um único elemento focável.' },
    { nome: 'content', tipo: 'ReactNode', descricao: 'Obrigatória. Texto do balão, que descreve o gatilho.' },
    { nome: 'placement', tipo: "'top' | 'bottom' | 'left' | 'right'", padrao: "'top'", descricao: 'Lado do gatilho em que o balão aparece.' },
    { nome: 'delay', tipo: 'number', padrao: '500', descricao: 'Espera, em ms, antes de aparecer no ponteiro. O foco não espera.' },
    { nome: 'open', tipo: 'boolean', descricao: 'Controla a abertura; sem ele, o Tooltip guarda o próprio estado. Obrigatória com anchorRef.' },
    { nome: 'onOpenChange', tipo: '(open: boolean) => void', descricao: 'Avisa cada pedido de abrir ou fechar.' },
    {
      nome: 'anchorRef',
      tipo: 'RefObject<HTMLElement | null>',
      descricao: 'Âncora fora do filho, no lugar de children. O Tooltip não clona nem escuta a âncora; o produto abre por open.',
    },
    { nome: 'id', tipo: 'string', descricao: 'Obrigatória com anchorRef. Id do balão, que o produto põe no aria-describedby da âncora.' },
  ],
};
