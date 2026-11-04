import type { ComponentType, ReactNode } from 'react';
import { ClientesBase } from './telas/ClientesBase';
import { Conciliacao } from './telas/Conciliacao';
import { ConfiguracaoSecao } from './telas/ConfiguracaoSecao';
import { Configuracoes } from './telas/Configuracoes';
import { Contas } from './telas/Contas';
import { Depositos } from './telas/Depositos';
import { Inicio } from './telas/Inicio';
import { NovoCliente } from './telas/NovoCliente';
import { NovoPedido } from './telas/NovoPedido';
import { Pedido } from './telas/Pedido';
import { Pedidos } from './telas/Pedidos';
import { Produtos } from './telas/Produtos';

export interface Tela {
  Componente: ComponentType;
  /** Os componentes da biblioteca que a tela monta. */
  componentes: readonly string[];
  codigo: string;
  id: string;
  /** A rota do item do submenu que marca a tela atual. */
  item: string;
  modulo: string;
  nome: string;
  nota: ReactNode;
  resumo: string;
}

const configuracao = (arranjo: 'anotado' | 'empilhado' | 'indice') => function Arranjo() {
  return <ConfiguracaoSecao arranjo={arranjo} />;
};

const SECAO_DE_CONFIGURACAO = ['AppShell', 'PageHeader', 'Card', 'FieldRow', 'InputNumber', 'Switch', 'Table', 'Avatar', 'ButtonIcon', 'Button'];

export const telas: readonly Tela[] = [
  {
    id: 'inicio',
    nome: 'Tela inicial',
    resumo: 'O que pede ação hoje, o ritmo dos pedidos e o resumo do negócio, em duas colunas.',
    modulo: 'inicio',
    item: 'inicio',
    Componente: Inicio,
    componentes: ['AppShell', 'PageHeader', 'Card', 'CardMetric', 'ChartBar', 'Table', 'Badge', 'Button'],
    nota: (
      <>
        Largura larga, 1120px, com o cabeçalho acompanhando a coluna. Tudo em cartão: o cabeçalho do cartão leva título e explicação. A grade
        passa a uma coluna quando a <strong>folha</strong> fica abaixo de 820px; a medida é de container query, não da janela.
      </>
    ),
    codigo: `<AppShell.Page>
  <AppShell.PageBar><Breadcrumb items={caminho} /></AppShell.PageBar>
  <AppShell.PageBody>
    <PageHeader maxWidth="1120px">
      <PageHeader.Title>Bom dia, Suporte</PageHeader.Title>
      <PageHeader.Description>2 pendências são urgentes hoje.</PageHeader.Description>
    </PageHeader>
    <div className="duas-colunas">
      <Card>
        <Card.Header title="O que pede ação hoje" description="…" />
        <Card.Body flush><Table label="Pendências">…</Table></Card.Body>
      </Card>
      <CardMetric>…</CardMetric>
    </div>
  </AppShell.PageBody>
</AppShell.Page>`,
  },
  {
    id: 'pedidos',
    nome: 'Lista com tabela e filtros',
    resumo: 'Índice com grade: visões salvas, busca, filtros no painel lateral e tabela com seleção, ordenação e paginação.',
    modulo: 'vendas',
    item: 'pedidos',
    Componente: Pedidos,
    componentes: ['AppShell', 'PageHeader', 'Card', 'Tabs', 'InputText', 'Button', 'SidePanel', 'Select', 'Table', 'Pagination', 'EmptyState', 'Badge'],
    nota: (
      <>
        Índice usa a largura total. O <code>SidePanel</code> é irmão da página dentro do <code>AppShell</code>, não peça dele: abre ao lado,
        empurra a página, que continua usável, e vira gaveta em tela estreita. O filtro ativo aparece como contagem no botão.
      </>
    ),
    codigo: `<AppShell>
  <AppShell.Navigation>…</AppShell.Navigation>
  <AppShell.Page>
    <AppShell.PageBar>…</AppShell.PageBar>
    <AppShell.PageBody>
      <PageHeader>…</PageHeader>
      <Card>
        <Card.Body flush>
          <Tabs label="Visões salvas" items={visoes} />
        </Card.Body>
      </Card>
    </AppShell.PageBody>
  </AppShell.Page>
  <SidePanel title="Filtros" open={aberto} onOpenChange={setAberto}>
    <Select label="Situação" … />
  </SidePanel>
</AppShell>`,
  },
  {
    id: 'pedido',
    nome: 'Detalhe de registro',
    resumo: 'Cabeçalho com voltar, selos de situação, contexto e ações; itens, andamento e dados do cliente em cartões.',
    modulo: 'vendas',
    item: 'pedido',
    Componente: Pedido,
    componentes: ['AppShell', 'PageHeader', 'Card', 'Table', 'Timeline', 'Textarea', 'Menu', 'Badge', 'Button'],
    nota: (
      <>
        Largura larga. A ação principal vai por último no cabeçalho, com até duas secundárias antes dela; o excedente cabe num{' '}
        <code>Menu</code>. O voltar é um link da aplicação, nomeado por <code>label</code>.
      </>
    ),
    codigo: `<PageHeader maxWidth="1120px">
  <PageHeader.Back href="/pedidos" label="Voltar para Pedidos" />
  <PageHeader.Title>Pedido #48211</PageHeader.Title>
  <PageHeader.Badges><Badge tone="warning">Aguardando aprovação</Badge></PageHeader.Badges>
  <PageHeader.Context>…</PageHeader.Context>
  <PageHeader.Actions>
    <Menu label="Mais ações" items={maisAcoes}>…</Menu>
    <Button variant="secondary">Editar</Button>
    <Button>Aprovar pedido</Button>
  </PageHeader.Actions>
</PageHeader>`,
  },
  {
    id: 'novo-pedido',
    nome: 'Formulário com SaveBar',
    resumo: 'Formulário em página: cartões por assunto e a barra de não salvo, aberta enquanto houver alteração pendente.',
    modulo: 'vendas',
    item: 'novo-pedido',
    Componente: NovoPedido,
    componentes: ['AppShell', 'PageHeader', 'SaveBar', 'Card', 'Select', 'InputNumber', 'Table', 'ButtonIcon', 'Textarea'],
    nota: (
      <>
        Formulário inteiro usa <code>SaveBar</code> no lugar do salvar por cartão. Ela é a primeira coisa do corpo da página, para se prender
        ao topo da área que rola. Quem decide se está aberta é a tela, que sabe se há alteração pendente.
      </>
    ),
    codigo: `<AppShell.PageBody>
  <SaveBar
    open={alterado}
    saving={salvando}
    onDiscard={() => setRascunho(salvo)}
    onSave={salvar}
  />
  <PageHeader maxWidth="1120px">…</PageHeader>
  <form>
    <Card>…</Card>
  </form>
</AppShell.PageBody>`,
  },
  {
    id: 'clientes-base',
    nome: 'Painel de dados com filtros',
    resumo: 'Métricas e gráficos da Base de Clientes, com os filtros no painel lateral.',
    modulo: 'clientes',
    item: 'clientes-base',
    Componente: ClientesBase,
    componentes: ['AppShell', 'PageHeader', 'SidePanel', 'Select', 'CardMetric', 'Card', 'ChartBar', 'ChartDonut', 'Badge'],
    nota: (
      <>
        Painel de dados usa a largura total. A ação que abre os filtros é a principal do cabeçalho, e o período escolhido volta como selo. Com o painel lateral aberto, a folha cede
        largura e a grade de cartões reorganiza pelas regras de container.
      </>
    ),
    codigo: `<AppShell>
  <AppShell.Navigation>…</AppShell.Navigation>
  <AppShell.Page>…<CardMetric>…</CardMetric>…<ChartBar orientation="horizontal" />…</AppShell.Page>
  <SidePanel title="Filtros" footer={<Button>Aplicar filtros</Button>}>
    <Select label="Empresa" … />
    <Select label="Período" … />
  </SidePanel>
</AppShell>`,
  },
  {
    id: 'novo-cliente',
    nome: 'Formulário anotado',
    resumo: 'Cadastro longo por assunto: título e explicação no trilho à esquerda, o cartão à direita.',
    modulo: 'clientes',
    item: 'novo-cliente',
    Componente: NovoCliente,
    componentes: ['AppShell', 'PageHeader', 'SaveBar', 'Card', 'SegmentedControl', 'InputText', 'InputCurrency', 'Select', 'Switch', 'Textarea'],
    nota: (
      <>
        O arranjo anotado é o primeiro na prioridade e o padrão na dúvida. Abaixo de 820px de folha, o trilho vira título acima do cartão.
        O rascunho aparece na <code>SaveBar</code>, com os rótulos trocados para Cancelar e Salvar cliente.
      </>
    ),
    codigo: `<div className="anotado-linha">
  <div className="anotado-nota">
    <h2>Identificação</h2>
    <p>Como o cliente aparece nos pedidos e nas notas fiscais.</p>
  </div>
  <Card aria-label="Identificação">
    <Card.Body>
      <InputText label="CNPJ" required />
    </Card.Body>
  </Card>
</div>`,
  },
  {
    id: 'depositos',
    nome: 'Índice sem grade',
    resumo: 'Lista curta que cabe em cartões, com troca para tabela.',
    modulo: 'estoque',
    item: 'depositos',
    Componente: Depositos,
    componentes: ['AppShell', 'PageHeader', 'SegmentedControl', 'Card', 'Progress', 'Badge', 'Table'],
    nota: (
      <>
        Poucos registros e nenhuma ordenação pedem cartões; a tabela fica a um clique. A troca de forma de exibição vive no cabeçalho, ao lado da
        ação principal.
      </>
    ),
    codigo: `<PageHeader.Actions>
  <SegmentedControl label="Forma de exibição" items={formas} value={forma} onValueChange={setForma} />
  <Button>Novo depósito</Button>
</PageHeader.Actions>`,
  },
  {
    id: 'produtos',
    nome: 'Formulário rápido em diálogo',
    resumo: 'Tabela de produtos com criação sem sair da lista: o diálogo pede só os campos essenciais.',
    modulo: 'estoque',
    item: 'produtos',
    Componente: Produtos,
    componentes: ['AppShell', 'PageHeader', 'Alert', 'Card', 'Table', 'Dialog', 'InputText', 'InputCurrency', 'InputNumber', 'Select', 'Badge'],
    nota: (
      <>
        Quando o cadastro cabe em três campos, o <code>Dialog</code> evita a viagem a uma página. O item criado entra no topo e leva o selo Novo.
      </>
    ),
    codigo: `<Dialog title="Novo produto" open={aberto} onOpenChange={setAberto} footer={acoes}>
  <InputText label="Descrição" required />
  <Select label="Unidade" options={unidades} />
  <InputCurrency label="Preço" />
</Dialog>`,
  },
  {
    id: 'conciliacao',
    nome: 'Assistente em etapas',
    resumo: 'Conciliação bancária em quatro etapas, com o caminho de volta pelas etapas já feitas.',
    modulo: 'financeiro',
    item: 'conciliacao',
    Componente: Conciliacao,
    componentes: ['AppShell', 'PageHeader', 'Card', 'Steps', 'Select', 'FileUpload', 'Table', 'Alert', 'EmptyState', 'Button'],
    nota: (
      <>
        Etapa usa a coluna estreita, 760px. <code>Steps</code> só deixa voltar a etapas concluídas; avançar é pelo botão Próximo, que fica
        desabilitado enquanto a etapa não tem o que precisa. Ao concluir, um estado vazio de sucesso fecha o fluxo.
      </>
    ),
    codigo: `<Card>
  <Card.Body>
    <Steps label="Etapas" items={etapas} current={etapa} onCurrentChange={voltarPara} />
  </Card.Body>
  <Card.Header title={atual.titulo} description={atual.explicacao} />
  <Card.Body>{conteudoDaEtapa}</Card.Body>
  <Card.Footer>
    <Button variant="secondary">Voltar</Button>
    <Button>Próximo</Button>
  </Card.Footer>
</Card>`,
  },
  {
    id: 'contas',
    nome: 'Estado vazio da primeira vez',
    resumo: 'A lista sem registros ensina o que fazer: ação principal, alternativa e os passos seguintes.',
    modulo: 'financeiro',
    item: 'contas',
    Componente: Contas,
    componentes: ['AppShell', 'PageHeader', 'Card', 'EmptyState', 'Steps', 'Table', 'Badge', 'Button'],
    nota: (
      <>
        O vazio da primeira vez não é erro: <code>EmptyState</code> com título que diz o que falta, descrição que diz o ganho e duas ações, a
        secundária antes da principal. Registrar a conta troca o vazio pela tabela.
      </>
    ),
    codigo: `<Card>
  <Card.Body>
    <EmptyState
      icon={<IconBank />}
      title="Nenhuma conta bancária registrada"
      description="Com uma conta registrada, …"
      actions={<><Button variant="secondary">Importar</Button><Button>Registrar a primeira conta</Button></>}
    />
  </Card.Body>
</Card>`,
  },
  {
    id: 'configuracoes',
    nome: 'Índice de configurações',
    resumo: 'Grupos em cartão, cada item com nome e estado; o estado que pede ação aparece em tom de perigo.',
    modulo: 'configuracoes',
    item: 'configuracoes',
    Componente: Configuracoes,
    componentes: ['AppShell', 'PageHeader', 'InputText', 'Card', 'Table', 'Badge', 'EmptyState'],
    nota: (
      <>
        Largura larga. A busca ocupa o lado direito do cabeçalho em <code>PageHeader.Search</code>; o campo é do produto e leva o próprio nome
        acessível. O estado urgente (certificado vencendo) usa o tom de perigo.
      </>
    ),
    codigo: `<PageHeader maxWidth="1120px">
  <PageHeader.Title>Configurações</PageHeader.Title>
  <PageHeader.Search>
    <InputText aria-label="Buscar configuração" icon={<IconSearch />} type="search" />
  </PageHeader.Search>
</PageHeader>`,
  },
  {
    id: 'configuracao-anotada',
    nome: 'Seção de configuração, anotada',
    resumo: 'Arranjo anotado (trilho), 1120px: o primeiro na prioridade. Título e explicação à esquerda, o cartão linha a linha.',
    modulo: 'configuracoes',
    item: 'configuracao-anotada',
    Componente: configuracao('anotado'),
    componentes: SECAO_DE_CONFIGURACAO,
    nota: (
      <>
        Na dúvida, o anotado. Cada cartão de ajustes tem Descartar e Salvar, ativos só com alteração pendente, e a situação (“Alterações não
        salvas”, “Salvo agora”). A ação destrutiva fica num cartão próprio, no fim, com botão no tom de perigo.
      </>
    ),
    codigo: `<Card>
  <Card.Body>
    <FieldRow label="Desconto máximo (%)" description="Acima dele, o pedido é recusado.">
      {({ id, describedBy }) => <InputNumber id={id} aria-describedby={describedBy} />}
    </FieldRow>
  </Card.Body>
  <Card.Footer>
    <span>Alterações não salvas</span>
    <Button variant="secondary" disabled={!alterado}>Descartar</Button>
    <Button disabled={!alterado}>Salvar</Button>
  </Card.Footer>
</Card>`,
  },
  {
    id: 'configuracao-empilhada',
    nome: 'Seção de configuração, empilhada',
    resumo: 'Arranjo empilhado, 760px: cartões em coluna, cada um com o próprio título.',
    modulo: 'configuracoes',
    item: 'configuracao-anotada',
    Componente: configuracao('empilhado'),
    componentes: SECAO_DE_CONFIGURACAO,
    nota: (
      <>
        Coluna estreita, de ajuste. O título e a explicação passam para o <code>Card.Header</code>, com a ação local no <code>trailing</code>. O
        cabeçalho da página acompanha os 760px.
      </>
    ),
    codigo: `<PageHeader maxWidth="760px">…</PageHeader>
<Card>
  <Card.Header title="Quem aprova" description="…" trailing={<Button size="sm" variant="ghost">Adicionar aprovador</Button>} />
  <Card.Body flush><Table label="Aprovadores">…</Table></Card.Body>
</Card>`,
  },
  {
    id: 'configuracao-com-indice',
    nome: 'Seção de configuração, com índice',
    resumo: 'Arranjo com índice, 1000px: cartões em coluna e a lista Nesta página ao lado, acompanhando a rolagem.',
    modulo: 'configuracoes',
    item: 'configuracao-anotada',
    Componente: configuracao('indice'),
    componentes: [...SECAO_DE_CONFIGURACAO, 'nav "Nesta página"'],
    nota: (
      <>
        Vale para a seção longa. O índice lateral some abaixo de 820px de folha e a lista vira coluna única. A seção atual é a última cujo topo já
        passou da borda da área que rola.
      </>
    ),
    codigo: `<div className="com-indice">
  <div className="coluna-de-cartoes">{secoes}</div>
  <nav aria-label="Nesta página">
    <a aria-current="true" href="#secao-limites">Limites</a>
  </nav>
</div>`,
  },
];
