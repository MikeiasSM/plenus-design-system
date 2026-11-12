import { useState, type ReactNode } from 'react';
import {
  AppShell,
  Avatar,
  Badge,
  IconChartBar,
  IconClock,
  IconFile,
  IconFilter,
  IconSliders,
  IconStar,
  IconStructure,
  Sidebar,
  SidebarProvider,
  type SidebarAccountMode,
  type SidebarNestedMode,
  type SidebarSide,
} from '@plenustech/design-system';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const MODOS_DO_TERCEIRO_NIVEL = ['expand', 'stack'] as const;
const MODOS_DA_CONTA = ['inline', 'cover'] as const;
const LADOS = ['left', 'right'] as const;

interface GrupoDoModulo {
  itens: readonly string[];
  titulo: string;
}

interface Modulo {
  grupos: readonly GrupoDoModulo[];
  icone: ReactNode;
  nome: string;
}

const MODULOS: readonly Modulo[] = [
  { nome: 'Início', icone: <IconStructure size={20} />, grupos: [] },
  {
    nome: 'Vendas',
    icone: <IconChartBar size={20} />,
    grupos: [
      { titulo: 'Operação', itens: ['Visão geral', 'Pedidos', 'Painéis'] },
      { titulo: 'Apoio', itens: ['Relatórios', 'Documentação'] },
    ],
  },
  { nome: 'Clientes', icone: <IconFile size={20} />, grupos: [{ titulo: 'Cadastros', itens: ['Base de clientes', 'Segmentos'] }] },
  { nome: 'Financeiro', icone: <IconFilter size={20} />, grupos: [{ titulo: 'Contas', itens: ['Contas', 'Conciliação'] }] },
];

const PAINEIS = ['Geral', 'Por vendedor', 'Por região'];

interface AplicacaoProps {
  accountMode?: SidebarAccountMode;
  defaultOpen?: boolean;
  initialModule?: string;
  nestedMode?: SidebarNestedMode;
  registrar?: (evento: string) => void;
  side?: SidebarSide;
}

/** Uma aplicação pequena: módulos, grupos, itens, terceiro nível e conta. A navegação é estado local; a biblioteca não faz roteamento. */
function Aplicacao({ accountMode, defaultOpen, initialModule = 'Vendas', nestedMode, registrar, side }: AplicacaoProps) {
  const [moduloAtual, setModuloAtual] = useState(initialModule);
  const [itemAtual, setItemAtual] = useState('Pedidos');
  const modulo = MODULOS.find((m) => m.nome === moduloAtual) ?? MODULOS[1];

  function irPara(item: string) {
    setItemAtual(item);
    registrar?.(`navegar: ${modulo.nome} › ${item}`);
  }

  function renderizarItem(item: string) {
    if (item === 'Painéis') {
      return (
        <Sidebar.Item defaultExpanded={nestedMode === 'stack' ? undefined : true} icon={<IconChartBar size={18} />} key={item} label={item}>
          {PAINEIS.map((painel) => (
            <Sidebar.Item current={itemAtual === painel} key={painel} label={painel} onClick={() => irPara(painel)} />
          ))}
        </Sidebar.Item>
      );
    }

    if (item === 'Documentação') {
      return <Sidebar.Item external href="https://exemplo.com/ajuda" icon={<IconFile size={18} />} key={item} label={item} />;
    }

    return (
      <Sidebar.Item
        current={itemAtual === item}
        icon={<IconFile size={18} />}
        key={item}
        label={item}
        onClick={() => irPara(item)}
        trailing={item === 'Pedidos' ? <Badge size="sm">12</Badge> : undefined}
      />
    );
  }

  return (
    <div style={{ height: 480, overflow: 'hidden', border: '1px solid var(--pl-color-border)', borderRadius: 'var(--pl-radius-md)' }}>
      <AppShell defaultOpen={defaultOpen} onOpenChange={(aberto) => registrar?.(`onOpenChange: ${aberto}`)} side={side}>
        <Sidebar>
          <Sidebar.Rail
            brand={<Sidebar.Brand logo={<IconChartBar size={20} />} name="Gestor" />}
            footer={
              <>
                <Sidebar.RailItem icon={<IconSliders size={20} />} label="Configurações" />
                <Sidebar.RailAccount label="Conta: Suporte, Roman Mecânica">
                  <Avatar name="Roman Mecânica" size="sm" />
                </Sidebar.RailAccount>
              </>
            }
          >
            {MODULOS.map((m) => (
              <Sidebar.RailItem
                current={m.nome === modulo.nome}
                icon={m.icone}
                key={m.nome}
                label={m.nome}
                onClick={() => {
                  setModuloAtual(m.nome);
                  setItemAtual(m.grupos[0]?.itens[0] ?? m.nome);
                }}
              />
            ))}
          </Sidebar.Rail>
          <Sidebar.Panel
            account={
              <Sidebar.Account avatar={<Avatar name="Roman Mecânica" />} description="Roman Mecânica Ltda" name="Suporte">
                <Sidebar.Item icon={<IconStar size={18} />} label="Favoritos" />
                <Sidebar.Item icon={<IconClock size={18} />} label="Atividade recente" />
                <Sidebar.Item icon={<IconSliders size={18} />} label="Preferências" />
              </Sidebar.Account>
            }
            accountMode={accountMode}
            brand={<Sidebar.Brand description="by Plenustech" name="Gestor" />}
            label={modulo.nome}
            nestedMode={nestedMode}
          >
            {modulo.grupos.map((grupo) => (
              <Sidebar.Group key={grupo.titulo} label={grupo.titulo}>
                {grupo.itens.map(renderizarItem)}
              </Sidebar.Group>
            ))}
          </Sidebar.Panel>
        </Sidebar>
        <AppShell.Page>
          <AppShell.PageBar>
            <span style={{ color: 'var(--pl-color-text-tertiary)', fontSize: 12, fontWeight: 600 }}>
              {modulo.nome} › <span style={{ color: 'var(--pl-color-text)' }}>{itemAtual}</span>
            </span>
          </AppShell.PageBar>
          <AppShell.PageBody>
            <div style={{ padding: 18 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--pl-font-heading)' }}>{itemAtual}</h3>
              <p style={{ color: 'var(--pl-color-text-secondary)' }}>A navegação ao lado é a Sidebar; este corpo é da página.</p>
            </div>
          </AppShell.PageBody>
        </AppShell.Page>
      </AppShell>
    </div>
  );
}

/** O trilho e o submenu mínimos das molduras próprias: dois módulos e uma lista. */
function NavegacaoMinima() {
  return (
    <Sidebar>
      <Sidebar.Rail brand={<Sidebar.Brand logo={<IconChartBar size={20} />} name="Gestor" />}>
        <Sidebar.RailItem current icon={<IconChartBar size={20} />} label="Vendas" />
        <Sidebar.RailItem icon={<IconFile size={20} />} label="Clientes" />
      </Sidebar.Rail>
      <Sidebar.Panel brand={<Sidebar.Brand description="by Plenustech" name="Gestor" />} label="Vendas">
        <Sidebar.Group label="Operação">
          <Sidebar.Item current icon={<IconFile size={18} />} label="Pedidos" />
          <Sidebar.Item icon={<IconFile size={18} />} label="Relatórios" />
        </Sidebar.Group>
      </Sidebar.Panel>
    </Sidebar>
  );
}

const quadroDaPrevia = { height: 360, overflow: 'hidden', border: '1px solid var(--pl-color-border)', borderRadius: 'var(--pl-radius-md)' } as const;

/** Uma moldura própria, sem o AppShell: o SidebarProvider guarda o estado e a barra do produto leva o Sidebar.Trigger. */
function MolduraPropria() {
  return (
    <div style={quadroDaPrevia}>
      <SidebarProvider>
        <div style={{ display: 'flex', height: '100%', padding: 'var(--pl-shell-gap)', boxSizing: 'border-box', background: 'var(--pl-color-background)' }}>
          <NavegacaoMinima />
          <div style={{ flex: 1, minWidth: 0, background: 'var(--pl-color-surface)', border: '1px solid var(--pl-color-border)', borderRadius: 'var(--pl-radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, padding: '0 8px', borderBottom: '1px solid var(--pl-color-border)' }}>
              <Sidebar.Trigger />
              <strong style={{ fontSize: 13 }}>Pedidos</strong>
            </div>
            <p style={{ margin: 0, padding: 18, color: 'var(--pl-color-text-secondary)' }}>A moldura e a barra são do produto; o estado é do SidebarProvider.</p>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

/** Um logotipo fictício do "Gestor", em SVG: a versão de cada tema muda só a cor do traço. */
function LogotipoDoGestor({ cor }: { cor: string }) {
  return (
    <svg fill="none" height="24" viewBox="0 0 104 24" width="104">
      <rect fill={cor} height="20" rx="5" width="20" x="2" y="2" />
      <path d="M8 12h8M12 8v8" stroke="var(--pl-color-surface)" strokeLinecap="round" strokeWidth="2" />
      <text fill={cor} fontFamily="var(--pl-font-heading)" fontSize="17" fontWeight="700" x="29" y="18">
        Gestor
      </text>
    </svg>
  );
}

const logotipo = { dark: <LogotipoDoGestor cor="#E8EAED" />, light: <LogotipoDoGestor cor="#1F2933" /> };

/** O mesmo trilho e submenu em dois temas lado a lado: o logotipo de cada tema vem do `data-theme` mais próximo. */
function MarcaComLogotipo() {
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      {(['light', 'dark'] as const).map((tema) => (
        <div data-theme={tema} key={tema} style={{ ...quadroDaPrevia, height: 220, background: 'var(--pl-color-background)', color: 'var(--pl-color-text)' }}>
          <SidebarProvider>
            <div style={{ display: 'flex', height: '100%', padding: 'var(--pl-shell-gap)', boxSizing: 'border-box' }}>
              <Sidebar>
                <Sidebar.Rail brand={<Sidebar.Brand logo={<IconChartBar size={20} />} name="Gestor" wordmark={logotipo} />}>
                  <Sidebar.RailItem current icon={<IconChartBar size={20} />} label="Vendas" />
                </Sidebar.Rail>
                <Sidebar.Panel brand={<Sidebar.Brand logo={<IconChartBar size={20} />} name="Gestor" wordmark={logotipo} />} label="Vendas">
                  <Sidebar.Item current icon={<IconFile size={18} />} label="Pedidos" />
                </Sidebar.Panel>
              </Sidebar>
            </div>
          </SidebarProvider>
        </div>
      ))}
    </div>
  );
}

/** O Evite: a Sidebar como coluna de conteúdo, dentro do corpo de uma página. */
function SidebarComoColuna() {
  return (
    <div style={quadroDaPrevia}>
      <SidebarProvider>
        <div style={{ display: 'flex', gap: 12, height: '100%', padding: 12, boxSizing: 'border-box' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--pl-font-heading)' }}>Pedidos</h3>
            <p style={{ color: 'var(--pl-color-text-secondary)' }}>Conteúdo da página, dividido em colunas.</p>
          </div>
          <Sidebar>
            <Sidebar.Panel label="Filtros">
              <Sidebar.Group label="Situação">
                <Sidebar.Item label="Abertos" />
                <Sidebar.Item label="Fechados" />
              </Sidebar.Group>
            </Sidebar.Panel>
          </Sidebar>
        </div>
      </SidebarProvider>
    </div>
  );
}

const playground = definirPlayground({
  emJanela: true,
  inicial: { nestedMode: 'expand', accountMode: 'inline', defaultOpen: true, side: 'left' },
  controles: [
    { tipo: 'opcoes', nome: 'nestedMode', opcoes: MODOS_DO_TERCEIRO_NIVEL },
    { tipo: 'opcoes', nome: 'accountMode', opcoes: MODOS_DA_CONTA },
    { tipo: 'opcoes', nome: 'side', opcoes: LADOS },
    { tipo: 'booleano', nome: 'defaultOpen' },
  ],
  renderizar: (valores, registrar) => (
    <Aplicacao
      accountMode={valores.accountMode as SidebarAccountMode}
      defaultOpen={Boolean(valores.defaultOpen)}
      key={`${valores.nestedMode}-${valores.accountMode}-${valores.defaultOpen}-${valores.side}`}
      nestedMode={valores.nestedMode as SidebarNestedMode}
      registrar={registrar}
      side={valores.side as SidebarSide}
    />
  ),
  codigo: (valores) =>
    [
      `<AppShell${valores.defaultOpen ? '' : ' defaultOpen={false}'}${valores.side === 'right' ? ' side="right"' : ''}>`,
      '  <Sidebar>',
      '    <Sidebar.Rail brand={<Sidebar.Brand logo={<IconChartBar size={20} />} name="Gestor" />} footer={<Sidebar.RailAccount label="Conta: Suporte"><Avatar name="Suporte" size="sm" /></Sidebar.RailAccount>}>',
      '      <Sidebar.RailItem current icon={<IconChartBar />} label="Vendas" href="/vendas" as={Link} />',
      '    </Sidebar.Rail>',
      '    <Sidebar.Panel',
      '      label="Vendas"',
      '      brand={<Sidebar.Brand description="by Plenustech" name="Gestor" />}',
      ...(valores.nestedMode === 'stack' ? ['      nestedMode="stack"'] : []),
      ...(valores.accountMode === 'cover' ? ['      accountMode="cover"'] : []),
      '      account={<Sidebar.Account avatar={<Avatar name="Suporte" />} name="Suporte" description="Empresa">',
      '        <Sidebar.Item icon={<IconStar />} label="Favoritos" />',
      '      </Sidebar.Account>}',
      '    >',
      '      <Sidebar.Group label="Operação">',
      '        <Sidebar.Item current icon={<IconFile />} label="Pedidos" href="/pedidos" as={Link} trailing={<Badge size="sm">12</Badge>} />',
      '        <Sidebar.Item icon={<IconChartBar />} label="Painéis">',
      '          <Sidebar.Item label="Geral" href="/paineis" as={Link} />',
      '        </Sidebar.Item>',
      '      </Sidebar.Group>',
      '    </Sidebar.Panel>',
      '  </Sidebar>',
      '  <AppShell.Page>…</AppShell.Page>',
      '</AppShell>',
    ].join('\n'),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      { nivel: 'ok', titulo: 'Navegações nomeadas', detalhe: 'O trilho é <nav> "Módulos"; o submenu, <nav> com o nome do módulo; a conta, <nav> "Conta".' },
      { nivel: 'ok', titulo: 'Página atual', detalhe: 'aria-current="page" no módulo e no item atuais.' },
      { nivel: 'ok', titulo: 'Recolher', detalhe: 'aria-expanded e aria-controls no botão; recolhido, o submenu fica inerte e o foco vai ao botão de abrir.' },
    ];

    if (valores.nestedMode === 'stack') {
      verificacoes.push({ nivel: 'ok', titulo: 'Pilha', detalhe: 'Entrar leva o foco ao caminho de volta; voltar o devolve ao item.' });
    }

    return verificacoes;
  },
});

function AplicacaoPadrao() {
  return <Aplicacao />;
}

/** A coluna do Faça e do Evite é estreita: recolhido, o submenu não espreme a página. */
function AplicacaoRecolhida() {
  return <Aplicacao defaultOpen={false} />;
}

function AplicacaoEmPilha() {
  return <Aplicacao nestedMode="stack" />;
}

function AplicacaoComContaCobrindo() {
  return <Aplicacao accountMode="cover" />;
}

function ModuloSemSubmenu() {
  return <Aplicacao initialModule="Início" />;
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Trilho</dt>
      <dd>
        Os módulos, só com ícone e dica, com a marca no topo e um grupo fixo no pé: um item de sistema, como Configurações, e o{' '}
        <code>Sidebar.RailAccount</code>.
      </dd>
      <dt>Submenu</dt>
      <dd>
        A lista do módulo, em grupos com título (<code>Sidebar.Group</code>). Cada item (<code>Sidebar.Item</code>) leva ícone, o atual marcado, um
        complemento ao fim da linha, como uma contagem em <code>trailing</code>, ou <code>external</code> para o link que sai da aplicação.
      </dd>
      <dt>Recolher e abrir</dt>
      <dd>
        <code>defaultOpen</code>, no <code>AppShell</code> ou no <code>SidebarProvider</code>, define o início. Aberto empurra a página; recolhido devolve a largura e o botão de abrir
        aparece na barra da página. O módulo atual no trilho também alterna o submenu.
      </dd>
      <dt><code>nestedMode</code></dt>
      <dd>
        <code>expand</code> abre os filhos no lugar, com recuo e linha-guia; <code>stack</code> troca a lista pelo nível de baixo, com o caminho de volta.
        Mais fundo que três níveis, o restante vai para o <code>TabsNav</code> na página.
      </dd>
      <dt>Conta e <code>accountMode</code></dt>
      <dd>
        Abre dentro do submenu, pelo bloco do rodapé. <code>inline</code> abre um cartão por cima da lista, que não encolhe nem se move, e clicar fora dele, dentro do submenu,
        fecha a conta; <code>cover</code> ocupa o lugar da lista com as opções, no mesmo desenho dos itens do submenu, em grupos com título. Com o submenu recolhido, o avatar do trilho abre o submenu já na conta.
      </dd>
      <dt>Módulo sem submenu</dt>
      <dd>O <code>Sidebar.Panel</code> vem sem itens: a página encosta no trilho, e o submenu fica só como lugar da conta.</dd>
      <dt>Gaveta no celular</dt>
      <dd>
        Abaixo de 900px (ou do <code>narrowBelow</code>), o trilho e o submenu passam juntos a uma gaveta com a interação do <code>Drawer</code>, aberta pelo botão da barra da página (<code>Sidebar.Trigger</code>).
        A prévia acima mede a janela do navegador, e não a própria largura: estreite a janela para ver a gaveta.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Navegação completa',
      descricao:
        'Trilho com marca e rodapé, submenu em grupos, contagem, link externo, terceiro nível expandido no lugar e conta. Clique no módulo atual para recolher.',
      largo: true,
      Previa: AplicacaoPadrao,
      codigo:
        '<AppShell>\n  <Sidebar>\n    <Sidebar.Rail brand={<Sidebar.Brand logo={<IconChartBar size={20} />} name="Gestor" />} footer={<Sidebar.RailAccount label="Conta: Suporte"><Avatar name="Suporte" size="sm" /></Sidebar.RailAccount>}>\n      <Sidebar.RailItem current as={Link} href="/vendas" icon={<IconChartBar />} label="Vendas" />\n    </Sidebar.Rail>\n    <Sidebar.Panel label="Vendas" brand={<Sidebar.Brand description="by Plenustech" name="Gestor" />} account={<MinhaConta />}>\n      <Sidebar.Group label="Operação">\n        <Sidebar.Item current as={Link} href="/pedidos" icon={<IconFile />} label="Pedidos" trailing={<Badge size="sm">12</Badge>} />\n        <Sidebar.Item icon={<IconChartBar />} label="Painéis">\n          <Sidebar.Item as={Link} href="/paineis/geral" label="Geral" />\n        </Sidebar.Item>\n      </Sidebar.Group>\n      <Sidebar.Group label="Apoio">\n        <Sidebar.Item external href="https://exemplo.com/ajuda" icon={<IconFile />} label="Documentação" />\n      </Sidebar.Group>\n    </Sidebar.Panel>\n  </Sidebar>\n  <AppShell.Page>…</AppShell.Page>\n</AppShell>',
    },
    {
      titulo: 'Terceiro nível em pilha',
      descricao: 'nestedMode="stack": o painel troca pelo nível de baixo, com o nome do módulo como caminho de volta.',
      largo: true,
      Previa: AplicacaoEmPilha,
      codigo: '<Sidebar.Panel label="Vendas" nestedMode="stack">\n  <Sidebar.Item label="Painéis">\n    <Sidebar.Item as={Link} href="/paineis/geral" label="Geral" />\n  </Sidebar.Item>\n</Sidebar.Panel>',
    },
    {
      titulo: 'Conta cobrindo a lista',
      descricao: 'accountMode="cover": o cartão da conta ocupa o lugar da lista do módulo, com o cabeçalho da conta.',
      largo: true,
      Previa: AplicacaoComContaCobrindo,
      codigo: '<Sidebar.Panel label="Vendas" accountMode="cover" account={<MinhaConta />}>…</Sidebar.Panel>',
    },
    {
      titulo: 'Moldura própria',
      descricao:
        'Sem o AppShell: o SidebarProvider guarda o estado, e a barra do produto leva o Sidebar.Trigger, que abre o submenu recolhido (ou a gaveta no celular).',
      largo: true,
      Previa: MolduraPropria,
      codigo: `<SidebarProvider>
  <div style={{ display: 'flex', height: '100%' }}>
    <Sidebar>
      <Sidebar.Rail brand={<Sidebar.Brand logo={<IconChartBar size={20} />} name="Gestor" />}>
        <Sidebar.RailItem current icon={<IconChartBar />} label="Vendas" />
        <Sidebar.RailItem icon={<IconFile />} label="Clientes" />
      </Sidebar.Rail>
      <Sidebar.Panel label="Vendas" brand={<Sidebar.Brand description="by Plenustech" name="Gestor" />}>
        <Sidebar.Group label="Operação">
          <Sidebar.Item current icon={<IconFile />} label="Pedidos" />
          <Sidebar.Item icon={<IconFile />} label="Relatórios" />
        </Sidebar.Group>
      </Sidebar.Panel>
    </Sidebar>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 46 }}>
        <Sidebar.Trigger />
        Pedidos
      </div>
      {conteudo}
    </div>
  </div>
</SidebarProvider>`,
    },
    {
      titulo: 'Marca com logotipo',
      descricao:
        'Sidebar.Brand com wordmark: no submenu, o logotipo toma o lugar do nome e da descrição, com uma versão para cada tema; o nome segue para o leitor de tela. No trilho fica só o símbolo (logo), no quadrado da cor principal ou puro com logoFrame={false}. Com href, a marca leva ao início da aplicação.',
      largo: true,
      Previa: MarcaComLogotipo,
      codigo: `const marca = (
  <Sidebar.Brand
    logo={<IconChartBar />}
    name="Gestor"
    wordmark={{
      light: <img alt="" src="/gestor-claro.svg" />,
      dark: <img alt="" src="/gestor-escuro.svg" />,
    }}
  />
);

<div data-theme="dark">
  <Sidebar>
    <Sidebar.Rail brand={marca}>…</Sidebar.Rail>
    <Sidebar.Panel brand={marca} label="Vendas">…</Sidebar.Panel>
  </Sidebar>
</div>`,
    },
    {
      titulo: 'Módulo sem submenu',
      descricao: 'O Sidebar.Panel sem itens: a página encosta no trilho, não há botão de abrir o submenu, e o avatar do trilho abre a conta.',
      largo: true,
      Previa: ModuloSemSubmenu,
      codigo: '<Sidebar.Panel account={<MinhaConta />} label="Início" />',
    },
  ],
  faca: {
    Previa: AplicacaoRecolhida,
    texto: 'Sidebar dentro do AppShell, com os módulos, os links e a conta vindos do produto.',
    codigo: `<AppShell defaultOpen={false}>
  <Sidebar>
    <Sidebar.Rail
      brand={<Sidebar.Brand logo={<IconChartBar size={20} />} name="Gestor" />}
      footer={
        <>
          <Sidebar.RailItem icon={<IconSliders />} label="Configurações" />
          <Sidebar.RailAccount label="Conta: Suporte, Roman Mecânica">
            <Avatar name="Roman Mecânica" size="sm" />
          </Sidebar.RailAccount>
        </>
      }
    >
      <Sidebar.RailItem current icon={<IconChartBar />} label="Vendas" />
      …
    </Sidebar.Rail>
    <Sidebar.Panel label="Vendas" brand={<Sidebar.Brand description="by Plenustech" name="Gestor" />} account={<MinhaConta />}>
      <Sidebar.Group label="Operação">
        <Sidebar.Item
          current
          icon={<IconFile />}
          label="Pedidos"
          trailing={<Badge size="sm">12</Badge>}
        />
        …
      </Sidebar.Group>
    </Sidebar.Panel>
  </Sidebar>
  <AppShell.Page>
    <AppShell.PageBar>…</AppShell.PageBar>
    <AppShell.PageBody>…</AppShell.PageBody>
  </AppShell.Page>
</AppShell>`,
  },
  evite: {
    Previa: SidebarComoColuna,
    texto: (
      <>
        Usar a <code>Sidebar</code> para dividir o conteúdo da página em colunas: ela é a navegação da aplicação. Para arranjar o conteúdo, o
        componente é o <code>Columns</code>.
      </>
    ),
    codigo: `<SidebarProvider>
  <div style={{ display: 'flex', gap: 12 }}>
    <div style={{ flex: 1 }}>{pedidos}</div>
    <Sidebar>
      <Sidebar.Panel label="Filtros">
        <Sidebar.Group label="Situação">
          <Sidebar.Item label="Abertos" />
          <Sidebar.Item label="Fechados" />
        </Sidebar.Group>
      </Sidebar.Panel>
    </Sidebar>
  </div>
</SidebarProvider>`,
  },
  Modos,
  teclado: [
    { teclas: ['Tab', 'Shift+Tab'], acao: 'Percorre trilho, submenu, conta e página; o submenu recolhido não recebe foco.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Aciona o módulo, o item, o recolher ou o bloco da conta.' },
    { teclas: ['Esc'], acao: 'Fecha a conta aberta, devolvendo o foco ao bloco; no celular, fecha a gaveta.' },
  ],
  garantias: [
    {
      garantia: 'Navegações nomeadas',
      como: <>Trilho e submenu em <code>nav</code> com nome; <code>aria-current=&quot;page&quot;</code> no módulo e no item atuais.</>,
      teste: 'Sidebar.test.tsx',
    },
    {
      garantia: 'Link da aplicação e externo',
      como: 'O link é o componente recebido em as; o externo abre em outra aba, com rel noopener noreferrer.',
      teste: 'Sidebar.test.tsx',
    },
    {
      garantia: 'Alternar pelo módulo atual',
      como: 'Clicar no módulo atual alterna o submenu sem navegar; os demais módulos navegam.',
      teste: 'Sidebar.test.tsx',
    },
    { garantia: 'Terceiro nível', como: 'Expandido no lugar com aria-expanded/aria-controls, ou em pilha com foco no caminho de volta.', teste: 'Sidebar.test.tsx' },
    {
      garantia: 'Conta',
      como: 'Abre acima do rodapé; Escape ou escolher uma opção fecha e devolve o foco ao bloco. O avatar do trilho só existe com o submenu recolhido.',
      teste: 'Sidebar.test.tsx',
    },
    { garantia: 'Celular', como: 'Gaveta modal com a mecânica do Drawer; escolher um item ou um módulo sem submenu a fecha.', teste: 'Sidebar.test.tsx' },
    {
      garantia: 'Recolher e abrir',
      como: 'O botão de recolher do submenu e o de abrir da barra da página trocam o foco entre si; recolhido, o submenu fica inerte.',
      teste: 'AppShell.test.tsx',
    },
  ],
  notaDaApi: (
    <>
      Peças: <code>Sidebar</code>, <code>.Rail</code>, <code>.RailItem</code>, <code>.RailAccount</code>, <code>.Brand</code>, <code>.Panel</code>, <code>.Group</code>,{' '}
      <code>.Item</code>, <code>.Account</code> e <code>.Trigger</code>. O estado fica no <code>SidebarProvider</code>, que o <code>AppShell</code> monta por dentro; quem monta a própria moldura o usa direto. <code>useSidebar()</code> lê e muda esse estado de qualquer ponto dentro dele e devolve <code>open</code>, <code>setOpen</code>, <code>openMobile</code>, <code>setOpenMobile</code>, <code>isMobile</code> e <code>toggleSidebar</code>; <code>setOpen</code> não mexe no foco. Fora de um <code>SidebarProvider</code> ou do <code>AppShell</code>, a <code>Sidebar</code> e o <code>useSidebar</code> lançam um erro claro. Os links seguem o <code>Breadcrumb</code>: <code>as</code>,{' '}
      <code>href</code> e <code>linkProps</code>. O ref e as propriedades nativas vão ao elemento raiz de cada peça, menos na <code>Sidebar</code> e no <code>SidebarProvider</code>.
    </>
  ),
  api: [
    { nome: 'SidebarProvider · open / defaultOpen / onOpenChange', tipo: 'boolean · boolean · (open: boolean) => void', padrao: 'defaultOpen: true', descricao: 'Submenu aberto, controlado ou não. Não desenha nada: só reparte o estado com o que estiver dentro.' },
    { nome: 'SidebarProvider · menuOpen / defaultMenuOpen / onMenuOpenChange', tipo: 'boolean · boolean · (open: boolean) => void', padrao: 'defaultMenuOpen: false', descricao: 'Gaveta do celular, controlada ou não, no mesmo padrão do submenu.' },
    { nome: 'SidebarProvider · accountOpen / defaultAccountOpen / onAccountOpenChange', tipo: 'boolean · boolean · (open: boolean) => void', padrao: 'defaultAccountOpen: false', descricao: 'Conta aberta, controlada ou não. Abrir a conta abre também o submenu, ou a gaveta na largura estreita; recolher o submenu a fecha.' },
    { nome: 'SidebarProvider · narrowBelow', tipo: 'number', padrao: '900', descricao: 'Largura, em pixels, abaixo da qual a navegação vira gaveta. O AppShell e o Sidebar.Trigger seguem o mesmo valor.' },
    { nome: 'SidebarProvider · side', tipo: "SidebarSide: 'left' | 'right'", padrao: "'left'", descricao: 'Lado da página em que ficam o trilho e o submenu. À direita, a gaveta abre pela direita e as dicas e a barra do item atual espelham; o recuo e a guia do subnível seguem no início do texto.' },
    { nome: 'SidebarProvider · labels', tipo: 'Partial<SidebarLabels>', padrao: 'português', descricao: 'Nomes acessíveis dos botões: openMenu, openSubmenu, closeMenu e collapseSubmenu. Só os passados trocam o padrão.' },
    { nome: 'SidebarProvider · icons', tipo: 'Partial<SidebarIcons>', padrao: 'os atuais', descricao: 'Ícones de open, collapse, close, back, external e account. Só os passados trocam o padrão.' },
    { nome: 'SidebarProvider · tooltipDelay', tipo: 'number', padrao: '150', descricao: 'Espera, em milissegundos, das dicas do trilho e da marca.' },
    { nome: 'SidebarProvider · shortcut', tipo: 'string | false', padrao: 'desligado', descricao: 'Atalho como "mod+b" (Ctrl+B ou Cmd+B), que alterna o submenu ou, em largura estreita, a gaveta. Aceita outra letra, como "mod+k". Ignorado com o foco num input, textarea ou contenteditable.' },
    {
      nome: 'Sidebar.Trigger',
      tipo: "Omit<ButtonIconProps, 'icon' | 'label'>",
      descricao: 'Botão de abrir: a gaveta na largura estreita, o submenu recolhido na larga. Não aparece quando não há o que abrir. Aceita as propriedades do ButtonIcon, menos o ícone e o nome; o onClick roda antes, e preventDefault nele cancela a abertura.',
    },
    { nome: 'useSidebar()', tipo: 'UseSidebarResult', descricao: 'Devolve open, setOpen, openMobile, setOpenMobile, isMobile e toggleSidebar. Na largura estreita, toggleSidebar alterna a gaveta; na larga, o submenu.' },
    { nome: 'Sidebar · menuLabel', tipo: 'string', padrao: "'Menu'", descricao: 'Nome da gaveta no celular.' },
    { nome: 'Sidebar.Rail · brand / footer / label', tipo: 'ReactNode · ReactNode · string', padrao: "label: 'Módulos'", descricao: 'Marca no topo, grupo fixo no pé e nome da navegação.' },
    {
      nome: 'Sidebar.Brand · name / logo / logoFrame / description / wordmark',
      tipo: 'string · ReactNode · boolean · ReactNode · { light: ReactNode; dark?: ReactNode }',
      padrao: 'logoFrame: true',
      descricao:
        'Marca do produto, no brand do Rail e do Panel. No trilho, só o logo (em quadrado na cor principal, ou puro com logoFrame false), nomeado por name; sem logo, nada. No submenu, o name e a description, ou o wordmark de cada tema (sem dark, o light vale nos dois), com o name oculto para o leitor de tela.',
    },
    { nome: 'Sidebar.Brand · as / href / linkProps', tipo: 'ElementType · string · Record<string, unknown>', descricao: 'Como no Sidebar.Item: com eles, a marca é um link para o início da aplicação, nos dois lugares.' },
    { nome: 'Sidebar.RailItem · icon / label / current', tipo: 'ReactNode · string · boolean', descricao: 'Módulo: nome acessível e dica; atual alterna o submenu ao clicar.' },
    { nome: 'Sidebar.RailAccount · label / children', tipo: 'string · ReactNode', descricao: 'Avatar no trilho, só com o submenu recolhido. label nomeia o botão, em texto oculto, e é a dica; o avatar fica fora da leitura. O ponto de aviso é do produto.' },
    { nome: 'Sidebar.Panel · label / brand / account', tipo: 'string · ReactNode · ReactNode', descricao: 'Nome do módulo, marca do cabeçalho e a conta do rodapé.' },
    { nome: 'Sidebar.Panel · nestedMode', tipo: "SidebarNestedMode: 'expand' | 'stack'", padrao: "'expand'", descricao: 'Forma do terceiro nível.' },
    { nome: 'Sidebar.Panel · width', tipo: 'number | string', padrao: '256', descricao: 'Largura do submenu aberto: pixels ou medida CSS, como "18rem". Use o mesmo valor em todos os painéis.' },
    { nome: 'Sidebar.Panel · accountMode', tipo: "SidebarAccountMode: 'inline' | 'cover'", padrao: "'inline'", descricao: 'Onde a conta abre.' },
    { nome: 'Sidebar.Group · label', tipo: 'string', descricao: 'Título que reúne itens.' },
    {
      nome: 'Sidebar.Item · label / icon / current / external / trailing',
      tipo: 'string · ReactNode · boolean · boolean · ReactNode',
      descricao: 'Item do submenu. Com children, abre o terceiro nível; external abre em outra aba; trailing é o complemento ao fim da linha.',
    },
    { nome: 'Sidebar.Item · expanded / defaultExpanded / onExpandedChange', tipo: 'boolean · boolean · (expanded: boolean) => void', descricao: 'Filhos abertos. Na pilha, defaultExpanded entra no nível no início.' },
    { nome: 'Sidebar.Account · avatar / name / description / label', tipo: 'ReactNode · string · string · string', padrao: "label: 'Conta'", descricao: 'Bloco da conta no rodapé; os filhos são as opções (Sidebar.Item).' },
  ],
};
