import { Button, ButtonIcon, IconSearch, Tooltip, type TooltipPlacement } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const POSICOES = ['top', 'bottom', 'left', 'right'] as const;

const playground = definirPlayground({
  inicial: { content: 'Salva sem fechar a tela', placement: 'top', delay: 500, gatilho: 'Salvar' },
  controles: [
    { tipo: 'texto', nome: 'content' },
    { tipo: 'opcoes', nome: 'placement', opcoes: POSICOES },
    { tipo: 'numero', nome: 'delay', min: 0, max: 2000, passo: 100 },
    { tipo: 'texto', nome: 'gatilho' },
  ],
  renderizar: (valores) => (
    <Tooltip content={valores.content} delay={valores.delay} placement={valores.placement as TooltipPlacement}>
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
    { teclas: ['Esc'], acao: 'Esconde o balão; o foco continua no gatilho.' },
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
    {
      garantia: 'Descrição somada',
      como: <>Soma o próprio id ao <code>aria-describedby</code> que o gatilho já tinha, e entrega o ref do filho.</>,
      teste: 'aninhados.test.tsx',
    },
  ],
  notaDaApi: 'O balão não recebe id nem data-*, por decisão: a raiz é o gatilho, que é do consumidor.',
  api: [
    { nome: 'children', tipo: 'ReactElement', descricao: 'Obrigatória. O gatilho: um único elemento focável.' },
    { nome: 'content', tipo: 'ReactNode', descricao: 'Obrigatória. Texto do balão, que descreve o gatilho.' },
    { nome: 'placement', tipo: "'top' | 'bottom' | 'left' | 'right'", padrao: "'top'", descricao: 'Lado do gatilho em que o balão aparece.' },
    { nome: 'delay', tipo: 'number', padrao: '500', descricao: 'Espera, em ms, antes de aparecer no ponteiro. O foco não espera.' },
  ],
};
