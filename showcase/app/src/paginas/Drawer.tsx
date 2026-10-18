import { useState } from 'react';
import {
  Button,
  Checkbox,
  Drawer,
  InputText,
  SegmentedControl,
  type DrawerSide,
  type DrawerSize,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Valores, type Verificacao } from '../estrutura/tipos';

const LADOS = ['right', 'left'] as const;
const TAMANHOS = ['sm', 'md', 'lg'] as const;
const LARGURAS: Record<DrawerSize, string> = { sm: '360px', md: '480px', lg: '640px' };
const RODAPE = '<>\n  <Button variant="secondary" onClick={fechar}>Cancelar</Button>\n  <Button onClick={salvar}>Salvar</Button>\n</>';
const SITUACOES = [
  { label: 'Ativo', value: 'ativo' },
  { label: 'Inativo', value: 'inativo' },
];
const HISTORICO = [
  '18/10 · Ana Prado alterou o e-mail.',
  '17/10 · Bruno Lima mudou a equipe para Financeiro.',
  '15/10 · Ana Prado ativou o acesso ao módulo de relatórios.',
  '12/10 · Carla Souza redefiniu a senha.',
  '09/10 · Bruno Lima trocou o cargo para Analista.',
  '05/10 · Ana Prado incluiu o telefone.',
  '01/10 · Carla Souza criou o usuário.',
];

function FormularioDoUsuario() {
  return (
    <div className="stack">
      <InputText defaultValue="Ana Prado" label="Nome" />
      <InputText defaultValue="ana@plenustech.com" label="E-mail" />
      <SegmentedControl defaultValue="ativo" items={SITUACOES} label="Situação" />
    </div>
  );
}

function DrawerDoPlayground({ valores, registrar }: { valores: Valores; registrar: (evento: string) => void }) {
  const [aberto, setAberto] = useState(false);
  // Sem rodapé e não dispensável, nada fecharia a gaveta, e a página ficaria presa.
  const semSaida = !valores.dismissable && !valores.rodape;

  return (
    <>
      <Button disabled={semSaida} onClick={() => setAberto(true)} variant="secondary">Editar usuário</Button>
      <Drawer
        description={String(valores.description) || undefined}
        dismissable={Boolean(valores.dismissable)}
        footer={
          valores.rodape && (
            <>
              <Button onClick={() => setAberto(false)} variant="secondary">Cancelar</Button>
              <Button onClick={() => setAberto(false)}>Salvar</Button>
            </>
          )
        }
        onClose={() => {
          registrar('onClose');
          setAberto(false);
        }}
        open={aberto}
        side={valores.side as DrawerSide}
        size={valores.size as DrawerSize}
        title={String(valores.title)}
      >
        <FormularioDoUsuario />
      </Drawer>
    </>
  );
}

const playground = definirPlayground({
  inicial: {
    title: 'Editar usuário',
    description: 'As mudanças valem no próximo acesso.',
    side: 'right',
    size: 'md',
    rodape: true,
    dismissable: true,
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'opcoes', nome: 'side', opcoes: LADOS },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'rodape' },
    { tipo: 'booleano', nome: 'dismissable' },
  ],
  renderizar: (valores, registrar) => <DrawerDoPlayground registrar={registrar} valores={valores} />,
  codigo: (valores) =>
    [
      '<Button variant="secondary" onClick={abrir}>Editar usuário</Button>',
      gerarJsx(
        'Drawer',
        [
          ['open', expr('aberto')],
          ['onClose', expr('fechar')],
          ['title', valores.title],
          ['description', valores.description || undefined],
          ['side', valores.side, 'right'],
          ['size', valores.size, 'md'],
          ['dismissable', valores.dismissable, true],
          ['footer', valores.rodape ? expr(RODAPE) : undefined],
        ],
        '<InputText defaultValue="Ana Prado" label="Nome" />\n<InputText defaultValue="ana@plenustech.com" label="E-mail" />\n<SegmentedControl defaultValue="ativo" items={situacoes} label="Situação" />',
      ),
    ].join('\n'),
  verificar: (valores) => {
    const titulo = valores.title.trim();
    const verificacoes: Verificacao[] = [
      titulo
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${titulo}", pelo título, ligado por aria-labelledby.` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O título é o nome da gaveta para o leitor de tela.' },
    ];

    if (valores.description.trim()) {
      verificacoes.push({ nivel: 'ok', titulo: 'Descrição acessível', detalhe: 'Ligada por aria-describedby, ouvida depois do nome.' });
    }

    if (!valores.dismissable) {
      verificacoes.push(
        valores.rodape
          ? { nivel: 'atencao', titulo: 'Não dispensável', detalhe: 'Sem Escape, clique fora nem botão de fechar: a saída é o rodapé.' }
          : { nivel: 'falha', titulo: 'Sem saída', detalhe: 'Não dispensável e sem rodapé, nada fecha a gaveta. A prévia não abre.' },
      );
    }

    return verificacoes;
  },
});

function EdicaoDeUsuario() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(true)} variant="secondary">Editar usuário</Button>
      <Drawer
        description="As mudanças valem no próximo acesso."
        footer={
          <>
            <Button onClick={() => setAberto(false)} variant="secondary">Cancelar</Button>
            <Button onClick={() => setAberto(false)}>Salvar</Button>
          </>
        }
        onClose={() => setAberto(false)}
        open={aberto}
        title="Editar usuário"
      >
        <FormularioDoUsuario />
      </Drawer>
    </>
  );
}

function Filtros() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(true)} variant="secondary">Filtros</Button>
      <Drawer
        footer={<Button onClick={() => setAberto(false)}>Aplicar filtros</Button>}
        onClose={() => setAberto(false)}
        open={aberto}
        side="left"
        size="sm"
        title="Filtros"
      >
        <div className="stack">
          <Checkbox defaultChecked label="Somente ativos" />
          <Checkbox label="Com pendência" />
          <Checkbox label="Criados este mês" />
        </div>
      </Drawer>
    </>
  );
}

function Historico() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(true)} variant="secondary">Ver histórico</Button>
      <Drawer
        description="Alterações dos últimos 30 dias."
        onClose={() => setAberto(false)}
        open={aberto}
        size="lg"
        title="Histórico de Ana Prado"
      >
        <div className="stack">
          {[...HISTORICO, ...HISTORICO, ...HISTORICO].map((linha, indice) => (
            <p key={indice} style={{ margin: 0 }}>{linha}</p>
          ))}
        </div>
      </Drawer>
    </>
  );
}

function ConfirmacaoEmDrawer() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(true)} variant="danger">Excluir usuário</Button>
      <Drawer
        footer={<Button onClick={() => setAberto(false)} variant="danger">Excluir</Button>}
        onClose={() => setAberto(false)}
        open={aberto}
        size="sm"
        title="Excluir usuário?"
      >
        Esta ação não pode ser desfeita.
      </Drawer>
    </>
  );
}

function Variantes() {
  const [aberta, setAberta] = useState<{ side: DrawerSide; size: DrawerSize } | null>(null);

  return (
    <div className="stack">
      <div className="subsection">
        <h3>size</h3>
        <div className="demo-row">
          {TAMANHOS.map((tamanho) => (
            <Button key={tamanho} onClick={() => setAberta({ side: 'right', size: tamanho })} variant="secondary">
              {tamanho} · {LARGURAS[tamanho]}
            </Button>
          ))}
        </div>
      </div>
      <div className="subsection">
        <h3>side</h3>
        <div className="demo-row">
          {LADOS.map((lado) => (
            <Button key={lado} onClick={() => setAberta({ side: lado, size: 'md' })} variant="secondary">
              {lado}
            </Button>
          ))}
        </div>
      </div>
      <Drawer
        description={aberta ? `Largura máxima de ${LARGURAS[aberta.size]}, presa à ${aberta.side === 'left' ? 'esquerda' : 'direita'}.` : undefined}
        onClose={() => setAberta(null)}
        open={aberta !== null}
        side={aberta?.side}
        size={aberta?.size}
        title={aberta ? `side="${aberta.side}" · size="${aberta.size}"` : ''}
      >
        Altura toda da tela, sem raio. No celular, a gaveta ocupa a largura.
      </Drawer>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>open</code> e <code>onClose</code></dt>
      <dd>
        Sempre controlado. Escape, clique fora e o botão de fechar chamam <code>onClose</code>; quem abriu decide fechar.
        Fechado, não renderiza nada.
      </dd>
      <dt><code>dismissable=&#123;false&#125;</code></dt>
      <dd>Tira o botão de fechar e ignora Escape e clique fora. A saída precisa estar no rodapé.</dd>
      <dt>Conteúdo longo</dt>
      <dd>Cabeçalho e rodapé ficam fixos; só o meio rola.</dd>
      <dt>Celular</dt>
      <dd>A gaveta ocupa a largura da tela, em qualquer <code>size</code>.</dd>
      <dt>Mecânica do Dialog</dt>
      <dd>
        Foco preso e devolvido, fundo inerte e rolagem travada vêm do mesmo núcleo do Dialog. Sem <code>icon</code> nem{' '}
        <code>role</code>: o ícone ao lado do título e a confirmação que exige resposta são do Dialog.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Editar um item sem sair da página',
      descricao: 'Formulário ao lado da lista, com as ações no rodapé fixo.',
      Previa: EdicaoDeUsuario,
      codigo:
        '<Drawer\n  open={aberto}\n  onClose={fechar}\n  title="Editar usuário"\n  description="As mudanças valem no próximo acesso."\n  footer={<>\n    <Button variant="secondary" onClick={fechar}>Cancelar</Button>\n    <Button onClick={salvar}>Salvar</Button>\n  </>}\n>\n  <InputText defaultValue="Ana Prado" label="Nome" />\n  <InputText defaultValue="ana@plenustech.com" label="E-mail" />\n  <SegmentedControl defaultValue="ativo" items={situacoes} label="Situação" />\n</Drawer>',
    },
    {
      titulo: 'Filtros à esquerda',
      descricao: 'side="left" e size="sm" para um painel estreito que sai do lado da navegação.',
      Previa: Filtros,
      codigo:
        '<Drawer\n  open={aberto}\n  onClose={fechar}\n  side="left"\n  size="sm"\n  title="Filtros"\n  footer={<Button onClick={aplicar}>Aplicar filtros</Button>}\n>\n  <Checkbox defaultChecked label="Somente ativos" />\n  <Checkbox label="Com pendência" />\n  <Checkbox label="Criados este mês" />\n</Drawer>',
    },
    {
      titulo: 'Detalhe longo',
      descricao: 'Sem rodapé: o corpo rola e o cabeçalho, com o fechar, fica à vista.',
      Previa: Historico,
      codigo:
        '<Drawer\n  open={aberto}\n  onClose={fechar}\n  size="lg"\n  title="Histórico de Ana Prado"\n  description="Alterações dos últimos 30 dias."\n>\n  {historico.map((linha) => (\n    <p key={linha.id}>{linha.texto}</p>\n  ))}\n</Drawer>',
    },
  ],
  faca: {
    Previa: EdicaoDeUsuario,
    texto: 'Drawer para editar ou detalhar um item ao lado da página, inclusive com conteúdo longo.',
  },
  evite: {
    Previa: ConfirmacaoEmDrawer,
    texto: (
      <>
        Uma decisão curta numa gaveta. Confirmação é Dialog, com <code>role=&quot;alertdialog&quot;</code>. E um painel que
        fica ao lado sem bloquear a página não é Drawer: é layout da aplicação.
      </>
    ),
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab', 'Shift+Tab'], acao: 'Percorre os elementos da gaveta; o foco não sai dela.' },
    { teclas: ['Esc'], acao: 'Fecha, exceto com dismissable={false}, e devolve o foco a quem abriu.' },
  ],
  garantias: [
    {
      garantia: 'Diálogo modal nomeado',
      como: <><code>role=&quot;dialog&quot;</code> e <code>aria-modal</code>, com nome e descrição vindos do título e da descrição.</>,
      teste: 'Drawer.test.tsx',
    },
    { garantia: 'Fechar', como: 'Escape e o botão de fechar chamam onClose.', teste: 'Drawer.test.tsx' },
    { garantia: 'Lado', como: 'Sai da direita por padrão, ou da esquerda com side="left".', teste: 'Drawer.test.tsx' },
    {
      garantia: 'Foco e fundo',
      como: 'Foco devolvido ao gatilho e página escondida da tecnologia assistiva, pela mecânica que divide com o Dialog.',
      teste: 'Dialog.test.tsx',
    },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref vão ao elemento da gaveta; o className soma ao do sistema.',
  api: [
    { nome: 'open', tipo: 'boolean', descricao: 'Obrigatória. Abre a gaveta.' },
    { nome: 'onClose', tipo: '() => void', descricao: 'Obrigatória. Pedido de fechar: Escape, clique fora ou botão de fechar.' },
    { nome: 'title', tipo: 'string', descricao: 'Obrigatória. Título visível e nome acessível.' },
    { nome: 'description', tipo: 'string', descricao: 'Texto sob o título, ligado como descrição acessível.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'Corpo, que rola quando passa da altura.' },
    { nome: 'footer', tipo: 'ReactNode', descricao: 'Rodapé fixo, com as ações.' },
    { nome: 'side', tipo: "'left' | 'right'", padrao: "'right'", descricao: 'Lado da tela de onde a gaveta sai.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Largura máxima de 360, 480 ou 640px.' },
    { nome: 'dismissable', tipo: 'boolean', padrao: 'true', descricao: 'Botão de fechar, Escape e clique fora.' },
  ],
};
