import { useState, type ReactNode } from 'react';
import { AppShell, Button, IconChartBar, IconFile, IconCheck, IconStructure, Sidebar } from '@plenustech/design-system';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

interface MolduraProps {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  registrar?: (evento: string) => void;
  rodape?: ReactNode;
  /** O uso errado do Evite: o pai não dá altura, a moldura cresce com o conteúdo e tudo rola junto. */
  rolaAPaginaInteira?: boolean;
}

const PEDIDOS_EM_SEPARACAO = Array.from({ length: 14 }, (_, indice) => `Pedido ${1042 + indice} · aguardando separação`);

/** Uma moldura pequena: só a navegação mínima da `Sidebar` para dar o que a página ocupar. */
function Moldura({ defaultOpen, onOpenChange, open, registrar, rodape, rolaAPaginaInteira }: MolduraProps) {
  const moldura = (
    <AppShell
      defaultOpen={defaultOpen}
      onOpenChange={(aberto) => {
        registrar?.(`onOpenChange: ${aberto}`);
        onOpenChange?.(aberto);
      }}
      open={open}
    >
      <Sidebar>
        <Sidebar.Rail>
          <Sidebar.RailItem current icon={<IconChartBar size={20} />} label="Vendas" />
          <Sidebar.RailItem icon={<IconStructure size={20} />} label="Início" />
        </Sidebar.Rail>
        <Sidebar.Panel label="Vendas">
          <Sidebar.Item current icon={<IconFile size={18} />} label="Pedidos" />
          <Sidebar.Item icon={<IconFile size={18} />} label="Relatórios" />
        </Sidebar.Panel>
      </Sidebar>
      <AppShell.Page>
        <AppShell.PageBar>
          <span style={{ color: 'var(--pl-color-text-tertiary)', fontSize: 12, fontWeight: 600 }}>
            Vendas › <span style={{ color: 'var(--pl-color-text)' }}>Pedidos</span>
          </span>
        </AppShell.PageBar>
        <AppShell.PageBody>
          <div style={{ padding: 18 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--pl-font-heading)' }}>Pedidos</h3>
            {rolaAPaginaInteira ? (
              <>
                <p style={{ color: 'var(--pl-color-text-secondary)' }}>
                  A página inteira rola: a navegação e a barra saem de vista junto com o conteúdo.
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
        {rodape}
      </AppShell.Page>
    </AppShell>
  );

  return (
    <div
      style={{
        height: 360,
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
  inicial: { defaultOpen: true },
  controles: [{ tipo: 'booleano', nome: 'defaultOpen' }],
  renderizar: (valores, registrar) => (
    <Moldura defaultOpen={Boolean(valores.defaultOpen)} key={String(valores.defaultOpen)} registrar={registrar} />
  ),
  codigo: (valores) =>
    [
      `<AppShell${valores.defaultOpen ? '' : ' defaultOpen={false}'}>`,
      '  <Sidebar>…</Sidebar>',
      '  <AppShell.Page>',
      '    <AppShell.PageBar><Breadcrumb items={caminho} /></AppShell.PageBar>',
      '    <AppShell.PageBody>{conteudo}</AppShell.PageBody>',
      '  </AppShell.Page>',
      '</AppShell>',
    ].join('\n'),
  verificar: () =>
    [
      { nivel: 'ok', titulo: 'Página', detalhe: 'O AppShell.Page é o <main>; só o AppShell.PageBody rola.' },
      { nivel: 'ok', titulo: 'Barra da página', detalhe: 'Com o submenu recolhido, a barra traz o botão de abrir, e o foco troca de botão com o recolher.' },
    ] satisfies Verificacao[],
});

function MolduraComRodape() {
  const [salvo, setSalvo] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  function alterar() {
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      setSalvo(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 600);
  }

  const situacao = salvando ? (
    'Salvando rascunho…'
  ) : salvo ? (
    <>
      <IconCheck size={14} style={{ color: 'var(--pl-color-success)' }} />
      Rascunho salvo às {salvo}
    </>
  ) : (
    'Nenhuma alteração ainda'
  );

  return (
    <Moldura
      rodape={
        <AppShell.PageFooter status={situacao}>
          <Button size="sm" variant="secondary">Cancelar</Button>
          <Button onClick={alterar} size="sm">Salvar cliente</Button>
        </AppShell.PageFooter>
      }
    />
  );
}

function MolduraPadrao() {
  return <Moldura />;
}

/** O Evite: a moldura num pai sem altura, rolando inteira com o conteúdo. */
function MolduraRolandoInteira() {
  return <Moldura defaultOpen={false} rolaAPaginaInteira />;
}

/** A coluna do Faça e do Evite é estreita: recolhido, o submenu não espreme a página. */
function MolduraRecolhida() {
  return <Moldura defaultOpen={false} />;
}

function MolduraControlada() {
  const [aberto, setAberto] = useState(true);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Button onClick={() => setAberto(!aberto)} size="sm" variant="secondary">
        {aberto ? 'Recolher submenu' : 'Abrir submenu'}
      </Button>
      <Moldura onOpenChange={setAberto} open={aberto} />
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>open</code>, <code>defaultOpen</code> e <code>onOpenChange</code></dt>
      <dd>
        O submenu da <code>Sidebar</code>. O <code>AppShell</code> monta por dentro o <code>SidebarProvider</code>, que guarda o estado. Aberto empurra a
        página; recolhido devolve a largura e o botão de abrir aparece na barra da página. Com um <code>SidebarProvider</code> por fora, o{' '}
        <code>AppShell</code> usa o dele e ignora estas propriedades.
      </dd>
      <dt><code>AppShell.PageBar</code></dt>
      <dd>
        Barra de 46px no topo da página. Traz o botão de abrir o submenu recolhido e, abaixo de 900px, o botão que abre a gaveta; o que o produto puser
        nela fica ao lado.
      </dd>
      <dt><code>AppShell.PageBody</code></dt>
      <dd>A única área da página que rola. Mede a largura da folha para as regras de container do produto.</dd>
      <dt><code>AppShell.PageFooter</code></dt>
      <dd>
        Rodapé fixo, sempre à vista, fora da área que rola: a situação à esquerda (<code>status</code>, anunciada ao leitor de tela) e as ações à direita.
        A fronteira com a <code>SaveBar</code> é o momento: a <code>SaveBar</code> aparece quando há alteração por salvar; o rodapé fica sempre lá.
      </dd>
      <dt>Nomes antigos</dt>
      <dd>
        A navegação passou à <code>Sidebar</code>. <code>AppShell.Navigation</code>, <code>.Rail</code>, <code>.RailItem</code>,{' '}
        <code>.RailAccount</code>, <code>.Panel</code>, <code>.PanelGroup</code>, <code>.PanelItem</code> e <code>.Account</code> continuam aceitos como
        aliases obsoletos até a versão menor seguinte.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Moldura com navegação',
      descricao: 'A Sidebar e a página no mesmo AppShell. A navegação completa está na página da Sidebar.',
      largo: true,
      Previa: MolduraPadrao,
      codigo:
        '<AppShell>\n  <Sidebar>\n    <Sidebar.Rail>…</Sidebar.Rail>\n    <Sidebar.Panel label="Vendas">…</Sidebar.Panel>\n  </Sidebar>\n  <AppShell.Page>\n    <AppShell.PageBar>…</AppShell.PageBar>\n    <AppShell.PageBody>…</AppShell.PageBody>\n  </AppShell.Page>\n</AppShell>',
    },
    {
      titulo: 'Rodapé fixo',
      descricao: 'A situação do rascunho à esquerda e as ações à direita. Clique em Salvar cliente para ver a situação mudar.',
      largo: true,
      Previa: MolduraComRodape,
      codigo:
        '<AppShell.Page>\n  <AppShell.PageBody>…</AppShell.PageBody>\n  <AppShell.PageFooter status="Rascunho salvo às 14:32">\n    <Button variant="secondary">Cancelar</Button>\n    <Button>Salvar cliente</Button>\n  </AppShell.PageFooter>\n</AppShell.Page>',
    },
    {
      titulo: 'Estado controlado',
      descricao: 'open e onOpenChange: o produto decide quando o submenu abre ou recolhe.',
      largo: true,
      Previa: MolduraControlada,
      codigo: 'const [aberto, setAberto] = useState(true);\n\n<AppShell open={aberto} onOpenChange={setAberto}>…</AppShell>',
    },
  ],
  faca: {
    Previa: MolduraRecolhida,
    texto: 'AppShell uma vez, na raiz da aplicação, com a Sidebar e a página como filhos.',
    codigo: `<AppShell defaultOpen={false}>
  <Sidebar>
    <Sidebar.Rail brand={<Sidebar.Brand logo={<IconChartBar />} name="Gestor" />}>
      <Sidebar.RailItem current icon={<IconChartBar />} label="Vendas" />
      …
    </Sidebar.Rail>
    <Sidebar.Panel label="Vendas" brand={<Sidebar.Brand description="by Plenustech" name="Gestor" />} account={<MinhaConta />}>
      <Sidebar.Item current icon={<IconFile />} label="Pedidos" />
      …
    </Sidebar.Panel>
  </Sidebar>
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
        Rolar a página inteira. A moldura ocupa a janela: só o <code>AppShell.PageBody</code>, a lista do submenu e os painéis laterais rolam.
      </>
    ),
    codigo: `{/* Pai sem altura: a moldura cresce com o conteúdo e a página inteira rola. */}
<div>
  <AppShell defaultOpen={false}>
    <Sidebar>
      <Sidebar.Rail brand={<Sidebar.Brand logo={<IconChartBar />} name="Gestor" />}>…</Sidebar.Rail>
      <Sidebar.Panel label="Vendas" brand={<Sidebar.Brand description="by Plenustech" name="Gestor" />} account={<MinhaConta />}>…</Sidebar.Panel>
    </Sidebar>
    <AppShell.Page>
      <AppShell.PageBar>…</AppShell.PageBar>
      <AppShell.PageBody>{pedidos}</AppShell.PageBody>
    </AppShell.Page>
  </AppShell>
</div>`,
  },
  Modos,
  teclado: [
    { teclas: ['Tab', 'Shift+Tab'], acao: 'Percorre a navegação e a página; a barra da página traz o botão de abrir o submenu recolhido.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Aciona o botão de abrir o submenu ou a gaveta.' },
  ],
  garantias: [
    {
      garantia: 'Barra da página',
      como: 'Abrir e recolher o submenu trocam o foco entre o botão da barra e o do submenu; no celular, a barra traz o botão do menu.',
      teste: 'AppShell.test.tsx',
    },
    { garantia: 'Estado controlado', como: 'Com open, clicar pede a mudança e o estado segue o valor recebido.', teste: 'AppShell.test.tsx' },
    { garantia: 'Estrutura da página', como: <>O <code>AppShell.Page</code> é o <code>main</code>, com a barra e o corpo.</>, teste: 'AppShell.test.tsx' },
    { garantia: 'Nomes antigos', como: 'As peças da navegação seguem aceitas como aliases obsoletos da Sidebar.', teste: 'AppShell.test.tsx' },
  ],
  notaDaApi: (
    <>
      Peças da moldura: <code>AppShell</code>, <code>.Page</code>, <code>.PageBar</code>, <code>.PageBody</code> e <code>.PageFooter</code>. A navegação é a{' '}
      <code>Sidebar</code>; os nomes antigos dela no <code>AppShell</code> são aliases obsoletos. O ref e as propriedades nativas vão ao elemento raiz de
      cada peça.
    </>
  ),
  api: [
    { nome: 'AppShell · open / defaultOpen / onOpenChange', tipo: 'boolean · boolean · (open: boolean) => void', padrao: 'defaultOpen: true', descricao: 'Submenu aberto, controlado ou não, repassado ao SidebarProvider que o AppShell monta. Ignorado quando já há um SidebarProvider por fora.' },
    { nome: 'AppShell.Page', tipo: "ComponentPropsWithRef<'main'>", descricao: 'Folha da página: ocupa o que sobra ao lado da navegação.' },
    { nome: 'AppShell.PageBar', tipo: "ComponentPropsWithRef<'div'>", descricao: 'Barra de 46px, com o botão de abrir o submenu ou a gaveta e o que o produto puser.' },
    { nome: 'AppShell.PageBody', tipo: "ComponentPropsWithRef<'div'>", descricao: 'Corpo da página, a única área que rola.' },
    { nome: 'AppShell.PageFooter · status', tipo: 'ReactNode', descricao: 'Situação da página, à esquerda, anunciada ao leitor de tela, como a do rascunho salvo sozinho. Os filhos são as ações, à direita.' },
  ],
};
