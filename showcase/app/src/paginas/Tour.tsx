import { useRef, useState } from 'react';
import { Badge, Button, Kbd, Tour, TourProvider, useTour, type TourStep, type TourStorage } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Valores } from '../estrutura/tipos';

function useAlvos() {
  return {
    filtros: useRef<HTMLButtonElement>(null),
    exportar: useRef<HTMLButtonElement>(null),
    novo: useRef<HTMLButtonElement>(null),
  };
}

type Alvos = ReturnType<typeof useAlvos>;

function Barra({ alvos, extra }: { alvos: Alvos; extra?: React.ReactNode }) {
  return (
    <div className="demo-row" style={{ alignItems: 'center', width: '100%' }}>
      <Button ref={alvos.filtros} variant="secondary">Filtros</Button>
      <Button ref={alvos.exportar} variant="ghost">Exportar</Button>
      <span style={{ flex: 1 }} />
      <Button ref={alvos.novo}>Novo pedido</Button>
      {extra}
    </div>
  );
}

function passosDe(alvos: Alvos, acao: boolean): TourStep[] {
  return [
    {
      id: 'boas-vindas',
      title: 'Conheça a tela de pedidos',
      content: (
        <>
          Em três passos: onde filtrar, como exportar e como criar um pedido. Saia quando quiser com <Kbd>Esc</Kbd>.
        </>
      ),
    },
    { id: 'filtros', target: alvos.filtros, title: 'Filtre a lista', content: 'O botão Filtros escolhe a situação e o período.' },
    acao
      ? { id: 'novo', target: alvos.novo, advanceOn: 'click', title: 'Crie um pedido', content: 'Use o botão Novo pedido para abrir o formulário.' }
      : { id: 'exportar', target: alvos.exportar, title: 'Exporte o resultado', content: 'O botão Exportar baixa a lista filtrada em planilha.' },
  ];
}

function TourDoPlayground({ valores, registrar }: { valores: Valores; registrar: (evento: string) => void }) {
  const alvos = useAlvos();
  const [aberto, setAberto] = useState(false);

  return (
    <TourProvider onEvent={(evento) => registrar(`onEvent: ${JSON.stringify(evento)}`)}>
      <Barra alvos={alvos} extra={<Button onClick={() => setAberto(true)} size="sm" variant="secondary">Iniciar tour</Button>} />
      <Tour
        id="pedidos"
        modal={Boolean(valores.modal)}
        onEnd={(detalhe) => registrar(`onEnd: ${JSON.stringify(detalhe)}`)}
        onOpenChange={setAberto}
        open={aberto}
        steps={passosDe(alvos, Boolean(valores.advanceOn))}
        targetMissing={valores.targetMissing as 'skip' | 'end'}
      />
    </TourProvider>
  );
}

const playground = definirPlayground({
  inicial: { modal: true, advanceOn: false, targetMissing: 'skip' },
  controles: [
    { tipo: 'booleano', nome: 'modal' },
    { tipo: 'booleano', nome: 'advanceOn' },
    { tipo: 'opcoes', nome: 'targetMissing', opcoes: ['skip', 'end'] },
  ],
  renderizar: (valores, registrar) => <TourDoPlayground registrar={registrar} valores={valores} />,
  codigo: (valores) =>
    [
      'const passos: TourStep[] = [',
      "  { id: 'boas-vindas', title: 'Conheça a tela de pedidos', content: '…' },",
      "  { id: 'filtros', target: filtrosRef, title: 'Filtre a lista', content: '…' },",
      valores.advanceOn
        ? "  { id: 'novo', target: novoRef, advanceOn: 'click', title: 'Crie um pedido', content: '…' },"
        : "  { id: 'exportar', target: exportarRef, title: 'Exporte o resultado', content: '…' },",
      '];',
      '',
      gerarJsx('Tour', [
        ['id', 'pedidos'],
        ['steps', expr('passos')],
        ['open', expr('aberto')],
        ['onOpenChange', expr('setAberto')],
        ['modal', valores.modal, true],
        ['targetMissing', valores.targetMissing, 'skip'],
      ]),
    ].join('\n'),
  verificar: (valores) => [
    valores.modal
      ? { nivel: 'ok', titulo: 'Modal', detalhe: 'O resto da página fica oculto à tecnologia assistiva e o painel nunca cobre o foco.' }
      : { nivel: 'atencao', titulo: 'Não modal', detalhe: 'A página continua usável: escolha do produto, para o passo em que a pessoa precisa mexer na tela.' },
  ],
});

/** O "já visto" deste exemplo vive na memória; no produto, no servidor, por usuário. */
function criarArmazenamento(): TourStorage & { vistos: Set<string> } {
  const vistos = new Set<string>();
  return {
    vistos,
    hasSeen: (id, versao) => vistos.has(`${id}@${versao}`),
    markSeen: (id, versao) => {
      vistos.add(`${id}@${versao}`);
    },
  };
}

function BotaoDeAjuda({ visto }: { visto: boolean }) {
  const tour = useTour();
  return (
    <span style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
      <Button onClick={() => tour.start('pedidos')} size="sm" variant="secondary">Tour da tela</Button>
      {visto && <Badge>Visto</Badge>}
    </span>
  );
}

function ComBotaoDeAjuda() {
  const alvos = useAlvos();
  const [armazenamento] = useState(criarArmazenamento);
  const [, atualizar] = useState(0);

  return (
    <TourProvider onEvent={(evento) => evento.type === 'end' && atualizar((n) => n + 1)} storage={armazenamento}>
      <Barra alvos={alvos} extra={<BotaoDeAjuda visto={armazenamento.vistos.has('pedidos@1')} />} />
      <Tour id="pedidos" steps={passosDe(alvos, false)} />
    </TourProvider>
  );
}

function ComAcao() {
  const alvos = useAlvos();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Barra alvos={alvos} extra={<Button onClick={() => setAberto(true)} size="sm" variant="secondary">Iniciar tour</Button>} />
      <Tour id="pedidos-acao" onOpenChange={setAberto} open={aberto} steps={passosDe(alvos, true)} />
    </>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Quando abre</dt>
      <dd>
        Nunca sozinho. Por <code>open</code>, <code>defaultOpen</code> ou <code>useTour().start(id)</code>, de preferência num
        botão de ajuda: tours abertos pela pessoa chegam ao fim com mais frequência que os que abrem no login.
      </dd>
      <dt>Modal</dt>
      <dd>
        O padrão. O resto da página fica oculto à tecnologia assistiva, o Tab circula no painel e o clique não chega à página, nem
        pelo recorte. <code>modal={'{false}'}</code> deixa a página usável e só contorna o alvo.
      </dd>
      <dt>Passo que espera a ação</dt>
      <dd>
        Com <code>advanceOn: &apos;click&apos;</code>, é sempre não modal: o foco vai ao alvo, que ganha a descrição do passo, e só o
        recorte recebe o clique. O tour segue quando a pessoa usa o alvo.
      </dd>
      <dt>Alvo ausente</dt>
      <dd>
        O passo espera o alvo até <code>targetTimeout</code> (1500 ms) e, sem ele, é saltado, e o contador passa a contar só os
        passos mostrados. Com <code>targetMissing=&quot;end&quot;</code>, o tour encerra com <code>reason: &apos;target-missing&apos;</code>, sem marcar como visto.
      </dd>
      <dt>Janela estreita</dt>
      <dd>Abaixo de 480px, o painel vira uma folha presa ao pé da tela, sem seta.</dd>
      <dt>Um por vez</dt>
      <dd>Com outro tour aberto, o <code>start</code> é ignorado e o tour pedido por <code>open</code> não abre e avisa <code>onOpenChange(false)</code>.</dd>
      <dt>Já visto</dt>
      <dd>
        A biblioteca não guarda nada. O <code>storage</code> do <code>TourProvider</code> recebe <code>markSeen(id, version, reason)</code> no
        fim e responde <code>hasSeen</code>; guardado no servidor, vale em qualquer aparelho. Suba <code>version</code> quando a tela mudar.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Botão de ajuda',
      descricao: 'O produto oferece o tour num botão e guarda o "já visto" pelo storage do TourProvider.',
      largo: true,
      Previa: ComBotaoDeAjuda,
      codigo:
        "<TourProvider storage={{ hasSeen: api.tourVisto, markSeen: api.marcarTour }} onEvent={analytics.track}>\n  <Button onClick={() => tour.start('pedidos')}>Tour da tela</Button>\n  <Tour id=\"pedidos\" steps={passos} />\n</TourProvider>\n\n// No botão: const tour = useTour();",
    },
    {
      titulo: 'Passo que espera a ação',
      descricao: 'O último passo termina quando a pessoa usa o Novo pedido.',
      largo: true,
      Previa: ComAcao,
      codigo: "{ id: 'novo', target: novoRef, advanceOn: 'click', title: 'Crie um pedido', content: 'Use o botão Novo pedido para abrir o formulário.' }",
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab', 'Shift+Tab'], acao: 'Percorre o painel; no passo modal, circula dentro dele.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Aciona Voltar, Avançar, Concluir ou Fechar.' },
    { teclas: ['Esc'], acao: 'Encerra o tour inteiro e devolve o foco a quem o tinha.' },
  ],
  garantias: [
    { garantia: 'Nome e descrição', como: 'Cada passo é role="dialog", nomeado pelo título e descrito pelo texto e pelo "Passo N de M".', teste: 'Tour.test.tsx' },
    { garantia: 'Modal', como: 'aria-modal, resto da página oculto à tecnologia assistiva e foco no painel.', teste: 'Tour.test.tsx' },
    { garantia: 'Foco devolvido', como: 'No fim, o foco volta a quem o tinha antes do tour.', teste: 'Tour.test.tsx' },
    { garantia: 'Encerrar', como: 'Esc e Fechar encerram o tour inteiro, com reason "dismissed".', teste: 'Tour.test.tsx' },
    { garantia: 'Passo de ação', como: 'Não modal, foco e descrição no alvo, que conclui o passo pelo clique.', teste: 'Tour.test.tsx' },
    { garantia: 'Alvo ausente', como: 'Espera o alvo, salta o passo no prazo e conta só os passos mostrados.', teste: 'Tour.test.tsx' },
    { garantia: 'Um por vez', como: 'Com um tour aberto, o start de outro é ignorado.', teste: 'Tour.test.tsx' },
  ],
  api: [
    { nome: 'id', tipo: 'string', descricao: 'Obrigatória. Identifica o tour no useTour, nos eventos e no storage.' },
    { nome: 'steps', tipo: 'readonly TourStep[]', descricao: 'Obrigatória. Os passos, em ordem. Até 5, de preferência 3.' },
    { nome: 'TourStep', tipo: '{ id, title, content, target?, placement?, media?, advanceOn? }', descricao: 'title é o nome do passo; content diz o que é o alvo; target é ref, elemento, seletor ou função; sem target, o passo fica no centro; media vem antes do título; advanceOn: "click" espera o uso do alvo.' },
    { nome: 'version', tipo: 'number', padrao: '1', descricao: 'Sobe quando a tela muda e o tour precisa ser visto de novo.' },
    { nome: 'open / defaultOpen / onOpenChange', tipo: 'boolean · boolean · (open: boolean) => void', descricao: 'Abertura controlada ou não. Sem elas, o tour abre por useTour().start(id).' },
    { nome: 'step / onStepChange', tipo: 'number · (index: number) => void', descricao: 'Índice do passo em steps, no modo controlado.' },
    { nome: 'onEnd', tipo: "({ reason, stepId }) => void", descricao: "reason: 'completed', 'dismissed' ou 'target-missing'." },
    { nome: 'modal', tipo: 'boolean', padrao: 'true', descricao: 'Com false, a página continua usável durante o tour.' },
    { nome: 'targetMissing / targetTimeout', tipo: "'skip' | 'end' · number", padrao: "'skip' · 1500", descricao: 'O que fazer com o alvo que não aparece no prazo, em ms.' },
    { nome: 'labels', tipo: 'Partial<TourLabels>', descricao: 'back, next, done, close e progress(atual, total).' },
    { nome: 'portalContainer', tipo: 'HTMLElement | null', descricao: 'Elemento que recebe o tour, como nos outros overlays.' },
    { nome: 'TourProvider · storage / onEvent', tipo: 'TourStorage · (event: TourEvent) => void', descricao: 'O "já visto" do produto (hasSeen e markSeen) e os eventos de todos os tours: start, step, skip e end.' },
    { nome: 'useTour()', tipo: '{ activeId, start, stop, hasSeen }', descricao: 'Abre e encerra pelo id e consulta o storage.' },
  ],
};
