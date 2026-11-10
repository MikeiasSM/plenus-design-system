import { useState, type ReactNode } from 'react';
import {
  AppShell,
  Avatar,
  IconChartBar,
  IconClock,
  IconFile,
  IconFilter,
  IconSliders,
  IconStar,
  IconStructure,
  type AppShellAccountMode,
  type AppShellNestedMode,
} from '@plenustech/design-system';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const MODOS_DO_TERCEIRO_NIVEL = ['expand', 'stack'] as const;
const MODOS_DA_CONTA = ['inline', 'cover'] as const;

interface Modulo {
  icone: ReactNode;
  itens: readonly string[];
  nome: string;
}

const MODULOS: readonly Modulo[] = [
  { nome: 'Início', icone: <IconStructure size={20} />, itens: [] },
  { nome: 'Vendas', icone: <IconChartBar size={20} />, itens: ['Visão geral', 'Pedidos', 'Painéis', 'Relatórios'] },
  { nome: 'Clientes', icone: <IconFile size={20} />, itens: ['Base de clientes', 'Segmentos'] },
  { nome: 'Financeiro', icone: <IconFilter size={20} />, itens: ['Contas', 'Conciliação'] },
];

const PAINEIS = ['Geral', 'Por vendedor', 'Por região'];

interface MolduraProps {
  accountMode?: AppShellAccountMode;
  defaultOpen?: boolean;
  initialModule?: string;
  nestedMode?: AppShellNestedMode;
  registrar?: (evento: string) => void;
  /** O uso errado do Evite: o pai não dá altura, a moldura cresce com o conteúdo e tudo rola junto. */
  rolaAPaginaInteira?: boolean;
}

const PEDIDOS_EM_SEPARACAO = Array.from({ length: 14 }, (_, indice) => `Pedido ${1042 + indice} · aguardando separação`);

function Marca() {
  return (
    <span
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 36,
        height: 36,
        borderRadius: 'var(--pl-radius-md)',
        background: 'var(--pl-color-primary)',
        color: 'var(--pl-color-on-primary)',
      }}
    >
      <IconChartBar size={20} />
    </span>
  );
}

function MarcaDoSubmenu() {
  return (
    <span style={{ display: 'grid', lineHeight: 1.15 }}>
      <strong style={{ fontFamily: 'var(--pl-font-heading)', fontSize: 17 }}>Gestor</strong>
      <span style={{ color: 'var(--pl-color-text-tertiary)', fontSize: 11 }}>by Plenustech</span>
    </span>
  );
}

/** Uma aplicação pequena: módulos, itens, terceiro nível e conta. A navegação é estado local; a biblioteca não faz roteamento. */
function Moldura({
  accountMode,
  defaultOpen,
  initialModule = 'Vendas',
  nestedMode,
  registrar,
  rolaAPaginaInteira,
}: MolduraProps) {
  const [moduloAtual, setModuloAtual] = useState(initialModule);
  const [itemAtual, setItemAtual] = useState('Pedidos');
  const modulo = MODULOS.find((m) => m.nome === moduloAtual) ?? MODULOS[1];

  function irPara(item: string) {
    setItemAtual(item);
    registrar?.(`navegar: ${modulo.nome} › ${item}`);
  }

  const moldura = (
    <AppShell defaultOpen={defaultOpen} onOpenChange={(aberto) => registrar?.(`onOpenChange: ${aberto}`)}>
      <AppShell.Navigation>
        <AppShell.Rail
          brand={<Marca />}
          footer={
            <>
              <AppShell.RailItem icon={<IconSliders size={20} />} label="Configurações" />
              <AppShell.RailAccount label="Conta: Suporte, Roman Mecânica">
                <Avatar name="Roman Mecânica" size="sm" />
              </AppShell.RailAccount>
            </>
          }
        >
          {MODULOS.map((m) => (
            <AppShell.RailItem
              current={m.nome === modulo.nome}
              icon={m.icone}
              key={m.nome}
              label={m.nome}
              onClick={() => {
                setModuloAtual(m.nome);
                setItemAtual(m.itens[0] ?? m.nome);
              }}
            />
          ))}
        </AppShell.Rail>
        <AppShell.Panel
            account={
              <AppShell.Account avatar={<Avatar name="Roman Mecânica" />} description="Roman Mecânica Ltda" name="Suporte">
                <AppShell.PanelItem icon={<IconStar size={18} />} label="Favoritos" />
                <AppShell.PanelItem icon={<IconClock size={18} />} label="Atividade recente" />
                <AppShell.PanelItem icon={<IconSliders size={18} />} label="Preferências" />
              </AppShell.Account>
            }
            accountMode={accountMode}
            brand={<MarcaDoSubmenu />}
            label={modulo.nome}
            nestedMode={nestedMode}
          >
            {modulo.itens.map((item) =>
              item === 'Painéis' ? (
                <AppShell.PanelItem defaultExpanded={nestedMode === 'stack' ? undefined : true} icon={<IconChartBar size={18} />} key={item} label={item}>
                  {PAINEIS.map((painel) => (
                    <AppShell.PanelItem current={itemAtual === painel} key={painel} label={painel} onClick={() => irPara(painel)} />
                  ))}
                </AppShell.PanelItem>
              ) : (
                <AppShell.PanelItem current={itemAtual === item} icon={<IconFile size={18} />} key={item} label={item} onClick={() => irPara(item)} />
              ),
            )}
          </AppShell.Panel>
      </AppShell.Navigation>
      <AppShell.Page>
        <AppShell.PageBar>
          <span style={{ color: 'var(--pl-color-text-tertiary)', fontSize: 12, fontWeight: 600 }}>
            {modulo.nome} › <span style={{ color: 'var(--pl-color-text)' }}>{itemAtual}</span>
          </span>
        </AppShell.PageBar>
        <AppShell.PageBody>
          <div style={{ padding: 18 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--pl-font-heading)' }}>{itemAtual}</h3>
            {rolaAPaginaInteira ? (
              <>
                <p style={{ color: 'var(--pl-color-text-secondary)' }}>
                  A página inteira rola: o trilho, o submenu e a barra saem de vista junto com o conteúdo.
                </p>
                {PEDIDOS_EM_SEPARACAO.map((pedido) => (
                  <p key={pedido} style={{ margin: '8px 0' }}>{pedido}</p>
                ))}
              </>
            ) : (
              <p style={{ color: 'var(--pl-color-text-secondary)' }}>Só este corpo rola. A moldura ocupa o espaço que o pai lhe dá.</p>
            )}
          </div>
        </AppShell.PageBody>
      </AppShell.Page>
    </AppShell>
  );

  return (
    <div
      style={{
        height: 480,
        overflow: rolaAPaginaInteira ? 'auto' : 'hidden',
        border: '1px solid var(--pl-color-border)',
        borderRadius: 'var(--pl-radius-md)',
      }}
      tabIndex={rolaAPaginaInteira ? 0 : undefined}
    >
      {/* Sem altura, o pai deixa a moldura crescer com o conteúdo, como numa página sem altura definida. */}
      {rolaAPaginaInteira ? <div>{moldura}</div> : moldura}
    </div>
  );
}

const playground = definirPlayground({
  inicial: { nestedMode: 'expand', accountMode: 'inline', defaultOpen: true },
  controles: [
    { tipo: 'opcoes', nome: 'nestedMode', opcoes: MODOS_DO_TERCEIRO_NIVEL },
    { tipo: 'opcoes', nome: 'accountMode', opcoes: MODOS_DA_CONTA },
    { tipo: 'booleano', nome: 'defaultOpen' },
  ],
  renderizar: (valores, registrar) => (
    <Moldura
      accountMode={valores.accountMode as AppShellAccountMode}
      defaultOpen={Boolean(valores.defaultOpen)}
      key={`${valores.nestedMode}-${valores.accountMode}-${valores.defaultOpen}`}
      nestedMode={valores.nestedMode as AppShellNestedMode}
      registrar={registrar}
    />
  ),
  codigo: (valores) =>
    [
      `<AppShell${valores.defaultOpen ? '' : ' defaultOpen={false}'}>`,
      '  <AppShell.Navigation>',
      '    <AppShell.Rail brand={<Marca />} footer={<AppShell.RailAccount label="Conta: Suporte"><Avatar name="Suporte" size="sm" /></AppShell.RailAccount>}>',
      '      <AppShell.RailItem current icon={<IconChartBar />} label="Vendas" href="/vendas" as={Link} />',
      '    </AppShell.Rail>',
      '    <AppShell.Panel',
      '      label="Vendas"',
      '      brand={<Marca />}',
      ...(valores.nestedMode === 'stack' ? ['      nestedMode="stack"'] : []),
      ...(valores.accountMode === 'cover' ? ['      accountMode="cover"'] : []),
      '      account={<AppShell.Account avatar={<Avatar name="Suporte" />} name="Suporte" description="Empresa">',
      '        <AppShell.PanelItem icon={<IconStar />} label="Favoritos" />',
      '      </AppShell.Account>}',
      '    >',
      '      <AppShell.PanelItem current icon={<IconFile />} label="Pedidos" href="/pedidos" as={Link} />',
      '      <AppShell.PanelItem icon={<IconChartBar />} label="Painéis">',
      '        <AppShell.PanelItem label="Geral" href="/paineis" as={Link} />',
      '      </AppShell.PanelItem>',
      '    </AppShell.Panel>',
      '  </AppShell.Navigation>',
      '  <AppShell.Page>',
      '    <AppShell.PageBar><Breadcrumb items={caminho} /></AppShell.PageBar>',
      '    <AppShell.PageBody>{conteudo}</AppShell.PageBody>',
      '  </AppShell.Page>',
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

function MolduraPadrao() {
  return <Moldura />;
}

/** A coluna do Faça e do Evite é estreita: recolhido, o submenu não espreme a página. */
function MolduraRecolhida() {
  return <Moldura defaultOpen={false} />;
}

function MolduraEmPilha() {
  return <Moldura nestedMode="stack" />;
}

function MolduraComContaCobrindo() {
  return <Moldura accountMode="cover" />;
}

/** O Evite: a moldura num pai sem altura, rolando inteira com o conteúdo. */
function MolduraRolandoInteira() {
  return <Moldura defaultOpen={false} rolaAPaginaInteira />;
}

function ModuloSemSubmenu() {
  return <Moldura initialModule="Início" />;
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>open</code>, <code>defaultOpen</code> e <code>onOpenChange</code></dt>
      <dd>
        O submenu. Aberto empurra a página; recolhido devolve a largura e o botão de abrir aparece na barra da página.
        O módulo atual no trilho alterna o submenu.
      </dd>
      <dt>Conta</dt>
      <dd>
        Abre dentro do submenu, pelo bloco do rodapé. Com o submenu recolhido, o avatar do trilho abre o submenu já na conta.
      </dd>
      <dt>Celular</dt>
      <dd>
        Abaixo de 900px, o trilho e o submenu passam juntos a uma gaveta com a interação do <code>Drawer</code>.
        A prévia acima mede a janela do navegador: estreite a janela para ver a gaveta.
      </dd>
      <dt><code>nestedMode</code></dt>
      <dd>
        <code>expand</code> abre os filhos no lugar, com recuo e linha-guia; <code>stack</code> troca a lista pelo nível de baixo, com o caminho de volta.
        Mais fundo que três níveis, o restante vai para o <code>TabsNav</code> na página.
      </dd>
      <dt><code>accountMode</code></dt>
      <dd><code>inline</code> cresce acima do rodapé e encolhe a lista; <code>cover</code> ocupa o lugar da lista.</dd>
      <dt>Módulo sem submenu</dt>
      <dd>O <code>AppShell.Panel</code> vem sem itens: a página encosta no trilho, e o submenu fica só como lugar da conta.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Moldura completa',
      descricao: 'Trilho de módulos, submenu com terceiro nível expandido no lugar, conta e página. Clique no módulo atual para recolher.',
      largo: true,
      Previa: MolduraPadrao,
      codigo:
        '<AppShell>\n  <AppShell.Navigation>\n    <AppShell.Rail brand={<Marca />} footer={<AppShell.RailAccount label="Conta: Suporte"><Avatar name="Suporte" size="sm" /></AppShell.RailAccount>}>\n      <AppShell.RailItem current as={Link} href="/vendas" icon={<IconChartBar />} label="Vendas" />\n    </AppShell.Rail>\n    <AppShell.Panel label="Vendas" brand={<Marca />} account={<MinhaConta />}>\n      <AppShell.PanelItem current as={Link} href="/pedidos" icon={<IconFile />} label="Pedidos" />\n      <AppShell.PanelItem icon={<IconChartBar />} label="Painéis">\n        <AppShell.PanelItem as={Link} href="/paineis/geral" label="Geral" />\n      </AppShell.PanelItem>\n    </AppShell.Panel>\n  </AppShell.Navigation>\n  <AppShell.Page>\n    <AppShell.PageBar>…</AppShell.PageBar>\n    <AppShell.PageBody>…</AppShell.PageBody>\n  </AppShell.Page>\n</AppShell>',
    },
    {
      titulo: 'Terceiro nível em pilha',
      descricao: 'nestedMode="stack": o painel troca pelo nível de baixo, com o nome do módulo como caminho de volta.',
      largo: true,
      Previa: MolduraEmPilha,
      codigo: '<AppShell.Panel label="Vendas" nestedMode="stack">\n  <AppShell.PanelItem label="Painéis">\n    <AppShell.PanelItem as={Link} href="/paineis/geral" label="Geral" />\n  </AppShell.PanelItem>\n</AppShell.Panel>',
    },
    {
      titulo: 'Conta cobrindo a lista',
      descricao: 'accountMode="cover": o cartão da conta ocupa o lugar da lista do módulo, com o cabeçalho da conta.',
      largo: true,
      Previa: MolduraComContaCobrindo,
      codigo: '<AppShell.Panel label="Vendas" accountMode="cover" account={<MinhaConta />}>…</AppShell.Panel>',
    },
    {
      titulo: 'Módulo sem submenu',
      descricao: 'O AppShell.Panel sem itens: a página encosta no trilho, não há botão de abrir o submenu, e o avatar do trilho abre a conta.',
      largo: true,
      Previa: ModuloSemSubmenu,
      codigo: '<AppShell.Panel account={<MinhaConta />} label="Início" />',
    },
  ],
  faca: {
    Previa: MolduraRecolhida,
    texto: 'AppShell uma vez, na raiz da aplicação, com os módulos, os links e a conta vindos do produto.',
    codigo: `<AppShell defaultOpen={false}>
  <AppShell.Navigation>
    <AppShell.Rail brand={<Marca />}>
      <AppShell.RailItem current icon={<IconChartBar />} label="Vendas" />
      …
    </AppShell.Rail>
    <AppShell.Panel label="Vendas" brand={<Marca />} account={<MinhaConta />}>
      <AppShell.PanelItem current icon={<IconFile />} label="Pedidos" />
      …
    </AppShell.Panel>
  </AppShell.Navigation>
  <AppShell.Page>
    <AppShell.PageBar>…</AppShell.PageBar>
    <AppShell.PageBody>…</AppShell.PageBody>
  </AppShell.Page>
</AppShell>`,
  },
  evite: {
    Previa: MolduraRolandoInteira,
    texto: (
      <>
        Rolar a página inteira. A moldura ocupa a janela: só o <code>AppShell.PageBody</code>, a lista do submenu e os
        painéis laterais rolam.
      </>
    ),
    codigo: `{/* Pai sem altura: a moldura cresce com o conteúdo e a página inteira rola. */}
<div>
  <AppShell defaultOpen={false}>
    <AppShell.Navigation>
      <AppShell.Rail brand={<Marca />}>…</AppShell.Rail>
      <AppShell.Panel label="Vendas" brand={<Marca />} account={<MinhaConta />}>…</AppShell.Panel>
    </AppShell.Navigation>
    <AppShell.Page>
      <AppShell.PageBar>…</AppShell.PageBar>
      <AppShell.PageBody>{pedidos}</AppShell.PageBody>
    </AppShell.Page>
  </AppShell>
</div>`,
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
      teste: 'AppShell.test.tsx',
    },
    {
      garantia: 'Recolher',
      como: 'aria-expanded e aria-controls no botão; recolhido, o submenu fica inerte e o foco passa ao botão de abrir, e volta.',
      teste: 'AppShell.test.tsx',
    },
    { garantia: 'Terceiro nível', como: 'Expandido no lugar com aria-expanded/aria-controls, ou em pilha com foco no caminho de volta.', teste: 'AppShell.test.tsx' },
    {
      garantia: 'Conta',
      como: 'Abre acima do rodapé; Escape ou escolher uma opção fecha e devolve o foco ao bloco. O avatar do trilho só existe com o submenu recolhido.',
      teste: 'AppShell.test.tsx',
    },
    { garantia: 'Celular', como: 'Gaveta modal com a mecânica do Drawer; escolher um item ou um módulo sem submenu a fecha.', teste: 'AppShell.test.tsx' },
  ],
  notaDaApi: (
    <>
      Peças: <code>AppShell.Navigation</code>, <code>.Rail</code>, <code>.RailItem</code>, <code>.RailAccount</code>, <code>.Panel</code>,{' '}
      <code>.PanelGroup</code>, <code>.PanelItem</code>, <code>.Account</code>, <code>.Page</code>, <code>.PageBar</code> e <code>.PageBody</code>. Os links
      seguem o <code>Breadcrumb</code>: <code>as</code>, <code>href</code> e <code>linkProps</code>. O ref e as propriedades nativas vão ao elemento
      raiz de cada peça.
    </>
  ),
  api: [
    { nome: 'AppShell · open / defaultOpen / onOpenChange', tipo: 'boolean · boolean · (open: boolean) => void', padrao: 'true', descricao: 'Submenu aberto.' },
    { nome: 'Navigation · menuLabel', tipo: 'string', padrao: "'Menu'", descricao: 'Nome da gaveta no celular.' },
    { nome: 'Rail · brand / footer / label', tipo: 'ReactNode · ReactNode · string', padrao: "label: 'Módulos'", descricao: 'Marca no topo, grupo fixo no pé e nome da navegação.' },
    { nome: 'RailItem · icon / label / current', tipo: 'ReactNode · string · boolean', descricao: 'Módulo: nome acessível e dica; atual alterna o submenu ao clicar.' },
    { nome: 'RailAccount · label / children', tipo: 'string · ReactNode', descricao: 'Avatar no trilho, só com o submenu recolhido. label nomeia o botão, em texto oculto, e é a dica; o avatar fica fora da leitura. O ponto de aviso é do produto.' },
    { nome: 'Panel · label / brand / account', tipo: 'string · ReactNode · ReactNode', descricao: 'Nome do módulo, marca do cabeçalho e a conta do rodapé.' },
    { nome: 'Panel · nestedMode', tipo: "AppShellNestedMode: 'expand' | 'stack'", padrao: "'expand'", descricao: 'Forma do terceiro nível.' },
    { nome: 'Panel · accountMode', tipo: "AppShellAccountMode: 'inline' | 'cover'", padrao: "'inline'", descricao: 'Onde a conta abre.' },
    { nome: 'PanelGroup · label', tipo: 'string', descricao: 'Título que reúne itens.' },
    {
      nome: 'PanelItem · label / icon / current / external / trailing',
      tipo: 'string · ReactNode · boolean · boolean · ReactNode',
      descricao: 'Item do submenu. Com children, abre o terceiro nível; external abre em outra aba.',
    },
    { nome: 'PanelItem · expanded / defaultExpanded / onExpandedChange', tipo: 'boolean · boolean · (expanded: boolean) => void', descricao: 'Filhos abertos. Na pilha, defaultExpanded entra no nível no início.' },
    { nome: 'Account · avatar / name / description / label', tipo: 'ReactNode · string · string · string', padrao: "label: 'Conta'", descricao: 'Bloco da conta no rodapé; os filhos são as opções (PanelItem).' },
    { nome: 'Page, PageBar, PageBody', tipo: 'main · div · div', descricao: 'Folha da página, barra de 46px (com o botão de abrir o submenu ou a gaveta) e o corpo, que rola.' },
  ],
};
