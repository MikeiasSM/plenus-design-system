import { useRef, useState } from 'react';
import { Button, Checkbox, InputText, Popover, type PopoverPlacement } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Valores, type Verificacao } from '../estrutura/tipos';

const POSICOES = ['top', 'top start', 'top end', 'bottom', 'bottom start', 'bottom end', 'left', 'right'] as const;

function PainelDeFiltros({ fechar }: { fechar: () => void }) {
  return (
    <div className="stack">
      <Checkbox defaultChecked label="Somente ativos" />
      <Checkbox label="Com pendência" />
      <Button onClick={fechar} size="sm">Aplicar</Button>
    </div>
  );
}

function PopoverDoPlayground({ valores, registrar }: { valores: Valores; registrar: (evento: string) => void }) {
  const gatilho = useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(!aberto)} ref={gatilho} variant="secondary">Filtros</Button>
      <Popover
        aria-label={String(valores['aria-label']) || undefined}
        offset={Number(valores.offset)}
        onOpenChange={(valor) => {
          registrar(`onOpenChange: ${valor}`);
          setAberto(valor);
        }}
        open={aberto}
        placement={valores.placement as PopoverPlacement}
        triggerRef={gatilho}
      >
        <PainelDeFiltros fechar={() => setAberto(false)} />
      </Popover>
    </>
  );
}

const playground = definirPlayground({
  inicial: { placement: 'bottom start', offset: 8, 'aria-label': 'Filtros' },
  controles: [
    { tipo: 'opcoes', nome: 'placement', opcoes: POSICOES },
    { tipo: 'numero', nome: 'offset', min: 0, max: 32, passo: 2 },
    { tipo: 'texto', nome: 'aria-label' },
  ],
  renderizar: (valores, registrar) => <PopoverDoPlayground registrar={registrar} valores={valores} />,
  codigo: (valores) =>
    [
      '<Button ref={gatilho} variant="secondary" onClick={alternar}>\n  Filtros\n</Button>',
      gerarJsx(
        'Popover',
        [
          ['open', expr('aberto')],
          ['onOpenChange', expr('setAberto')],
          ['triggerRef', expr('gatilho')],
          ['placement', valores.placement, 'bottom start'],
          ['offset', valores.offset, 8],
          ['aria-label', valores['aria-label'] || undefined],
        ],
        '<Checkbox defaultChecked label="Somente ativos" />\n<Checkbox label="Com pendência" />\n<Button size="sm" onClick={fechar}>Aplicar</Button>',
      ),
    ].join('\n'),
  verificar: (valores) => {
    const nome = valores['aria-label'].trim();
    const verificacoes: Verificacao[] = [
      nome
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${nome}", pelo aria-label do painel.` }
        : {
            nivel: 'falha',
            titulo: 'Painel sem nome',
            detalhe: 'O Popover é role="dialog": nomeie com aria-label ou aria-labelledby.',
          },
    ];

    return verificacoes;
  },
});

function Filtros() {
  const gatilho = useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(!aberto)} ref={gatilho} variant="secondary">Filtros</Button>
      <Popover aria-label="Filtros" onOpenChange={setAberto} open={aberto} triggerRef={gatilho}>
        <PainelDeFiltros fechar={() => setAberto(false)} />
      </Popover>
    </>
  );
}

function Resumo() {
  const gatilho = useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(!aberto)} ref={gatilho} variant="ghost">Resumo do pedido</Button>
      <Popover aria-labelledby="resumo-titulo" onOpenChange={setAberto} open={aberto} placement="bottom" triggerRef={gatilho}>
        <div className="stack">
          <strong id="resumo-titulo">Pedido 4821</strong>
          <span>3 itens · R$ 1.240,00</span>
          <Button onClick={() => setAberto(false)} size="sm" variant="secondary">Fechar</Button>
        </div>
      </Popover>
    </>
  );
}

function Renomear() {
  const gatilho = useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('Relatório mensal');

  return (
    <>
      <Button onClick={() => setAberto(!aberto)} ref={gatilho} variant="secondary">{nome}</Button>
      <Popover aria-label="Renomear" onOpenChange={setAberto} open={aberto} triggerRef={gatilho}>
        <form
          className="stack"
          onSubmit={(evento) => {
            evento.preventDefault();
            setNome(String(new FormData(evento.currentTarget).get('nome')) || nome);
            setAberto(false);
          }}
        >
          <InputText defaultValue={nome} label="Nome" name="nome" size="sm" />
          <Button size="sm" type="submit">Salvar</Button>
        </form>
      </Popover>
    </>
  );
}

function NaPosicao({ placement }: { placement: PopoverPlacement }) {
  const gatilho = useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(!aberto)} ref={gatilho} size="sm" variant="secondary">{placement}</Button>
      <Popover aria-label={placement} onOpenChange={setAberto} open={aberto} placement={placement} triggerRef={gatilho}>
        placement=&quot;{placement}&quot;
      </Popover>
    </>
  );
}

function Variantes() {
  return (
    <>
      <div className="demo-row">
        {POSICOES.map((posicao) => (
          <NaPosicao key={posicao} placement={posicao} />
        ))}
      </div>
      <p className="note">Quando falta espaço do lado pedido, o painel inverte e acompanha a rolagem.</p>
    </>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>open</code>, <code>defaultOpen</code> e <code>onOpenChange</code></dt>
      <dd>
        Com <code>open</code>, controlado: Escape e clique fora chamam <code>onOpenChange(false)</code>. Com <code>defaultOpen</code>, abre no início e fecha sozinho. O clique no gatilho não conta como fora: é de
        quem escreveu o gatilho, que decide se alterna.
      </dd>
      <dt>Não modal</dt>
      <dd>
        O restante da página continua acessível. O foco entra no painel ao abrir, mas não fica preso: o Tab na borda segue a
        página a partir do gatilho.
      </dd>
      <dt>Nome</dt>
      <dd>
        O painel é <code>role=&quot;dialog&quot;</code> e se nomeia com <code>aria-label</code> ou <code>aria-labelledby</code>,
        que vêm das propriedades nativas.
      </dd>
      <dt>Painel sob um campo</dt>
      <dd>
        Não é Popover: o foco sairia do campo em que se digita. Resultados e sugestões são o <code>ComboBox</code>, com a
        opção composta e os grupos. Fora de uma lista, o painel fica no fluxo, logo abaixo do campo, apontado por{' '}
        <code>aria-controls</code>, e o que precisa ser ouvido sai por <code>role=&quot;status&quot;</code>.
      </dd>
      <dt>Dentro de um Dialog</dt>
      <dd>Declara-se camada de cima e continua visível ao leitor de tela.</dd>
      <dt>Servidor</dt>
      <dd>Aberto na renderização do servidor, não quebra: o portal nasce na hidratação.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Filtros',
      descricao: 'O gatilho alterna o painel; Aplicar fecha. A página atrás continua livre.',
      Previa: Filtros,
      codigo:
        'const gatilho = useRef<HTMLButtonElement>(null);\n\n<Button ref={gatilho} variant="secondary" onClick={() => setAberto(!aberto)}>\n  Filtros\n</Button>\n<Popover open={aberto} onOpenChange={setAberto} triggerRef={gatilho} aria-label="Filtros">\n  <Checkbox defaultChecked label="Somente ativos" />\n  <Checkbox label="Com pendência" />\n  <Button size="sm" onClick={fechar}>Aplicar</Button>\n</Popover>',
    },
    {
      titulo: 'Nomeado pelo título interno',
      descricao: 'aria-labelledby aponta o título que o painel já mostra.',
      Previa: Resumo,
      codigo:
        '<Popover\n  open={aberto}\n  onOpenChange={setAberto}\n  triggerRef={gatilho}\n  placement="bottom"\n  aria-labelledby="resumo-titulo"\n>\n  <strong id="resumo-titulo">Pedido 4821</strong>\n  <span>3 itens · R$ 1.240,00</span>\n</Popover>',
    },
    {
      titulo: 'Edição rápida',
      descricao: 'O foco entra no campo ao abrir; Enter salva e Escape desiste, devolvendo o foco ao gatilho.',
      Previa: Renomear,
      codigo:
        '<Popover open={aberto} onOpenChange={setAberto} triggerRef={gatilho} aria-label="Renomear">\n  <form onSubmit={salvar}>\n    <InputText defaultValue={nome} label="Nome" name="nome" size="sm" />\n    <Button size="sm" type="submit">Salvar</Button>\n  </form>\n</Popover>',
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab', 'Shift+Tab'], acao: 'Percorre o painel; na borda, segue a página a partir do gatilho.' },
    { teclas: ['Esc'], acao: 'Fecha e devolve o foco ao gatilho.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <><code>role=&quot;dialog&quot;</code>, nomeado pelo <code>aria-label</code> do consumidor.</>, teste: 'Popover.test.tsx' },
    { garantia: 'Foco devolvido', como: 'O Escape fecha e devolve o foco ao gatilho.', teste: 'Popover.test.tsx' },
    { garantia: 'Não modal', como: <>Sem <code>aria-modal</code>; o restante da página segue acessível.</>, teste: 'Popover.test.tsx' },
    { garantia: 'Foco livre', como: 'O Tab na borda segue para o elemento depois do gatilho.', teste: 'Popover.test.tsx' },
    { garantia: 'Gatilho do consumidor', como: 'O clique no gatilho não fecha antes dele: quem alterna é o consumidor.', teste: 'Popover.test.tsx' },
    { garantia: 'Dentro de Dialog', como: 'Camada de cima, visível ao leitor de tela.', teste: 'aninhados.test.tsx' },
    { garantia: 'Servidor', como: 'Renderiza sem document; o portal nasce na hidratação.', teste: 'servidor.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref vão ao painel, como aria-label e id; o className soma ao do sistema.',
  api: [
    { nome: 'open', tipo: 'boolean', descricao: 'Aberto, no modo controlado.' },
    { nome: 'defaultOpen', tipo: 'boolean', padrao: 'false', descricao: 'Aberto no início, no modo não controlado.' },
    { nome: 'onOpenChange', tipo: '(open: boolean) => void', descricao: 'Recebe false no pedido de fechar: Escape ou clique fora.' },
    { nome: 'onClose', tipo: '() => void', descricao: <>Obsoleto: use <code>onOpenChange</code>.</> },
    { nome: 'triggerRef', tipo: 'RefObject<HTMLElement | null>', descricao: 'Obrigatória. O elemento em que o painel se ancora.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'Obrigatória. Conteúdo do painel.' },
    {
      nome: 'placement',
      tipo: "'top' | 'top start' | 'top end' | 'bottom' | 'bottom start' | 'bottom end' | 'left' | 'right'",
      padrao: "'bottom start'",
      descricao: 'Lado e alinhamento em relação ao gatilho.',
    },
    { nome: 'offset', tipo: 'number', padrao: '8', descricao: 'Distância do gatilho, em px.' },
  ],
};
