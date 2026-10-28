import { useState } from 'react';
import {
  Button,
  ComboBox,
  Dialog,
  IconFile,
  IconExclamationTriangle,
  IconInfoCircle,
  IconPlusCircle,
  InputText,
  type DialogRole,
  type DialogSize,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Valores, type Verificacao } from '../estrutura/tipos';
import { RESULTADOS_DO_ACERVO } from '../dadosDeExemplo';

const TAMANHOS = ['sm', 'md', 'lg'] as const;
const LARGURAS: Record<DialogSize, string> = { sm: '400px', md: '560px', lg: '760px' };
const RODAPE = '<>\n  <Button variant="secondary" onClick={fechar}>Cancelar</Button>\n  <Button onClick={confirmar}>Confirmar</Button>\n</>';

function DialogDoPlayground({ valores, registrar }: { valores: Valores; registrar: (evento: string) => void }) {
  const [aberto, setAberto] = useState(false);
  // Sem rodapé e não dispensável, nada fecharia o diálogo, e a página ficaria presa.
  const semSaida = !valores.dismissable && !valores.rodape;

  return (
    <>
      <Button disabled={semSaida} onClick={() => setAberto(true)}>Abrir diálogo</Button>
      <Dialog
        description={String(valores.description) || undefined}
        dismissable={Boolean(valores.dismissable)}
        footer={
          valores.rodape && (
            <>
              <Button onClick={() => setAberto(false)} variant="secondary">Cancelar</Button>
              <Button onClick={() => setAberto(false)}>Confirmar</Button>
            </>
          )
        }
        icon={valores.icone ? <IconInfoCircle /> : undefined}
        onOpenChange={(valor) => {
          registrar(`onOpenChange: ${valor}`);
          setAberto(valor);
        }}
        open={aberto}
        role={valores.role as DialogRole}
        size={valores.size as DialogSize}
        title={String(valores.title)}
      >
        {valores.children || undefined}
      </Dialog>
    </>
  );
}

const playground = definirPlayground({
  inicial: {
    title: 'Publicar relatório',
    description: 'O relatório fica visível para toda a equipe.',
    children: 'Quem tem acesso ao módulo recebe um aviso.',
    size: 'md',
    role: 'dialog',
    icone: false,
    rodape: true,
    dismissable: true,
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'texto', nome: 'children' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'opcoes', nome: 'role', opcoes: ['dialog', 'alertdialog'] },
    { tipo: 'booleano', nome: 'icone' },
    { tipo: 'booleano', nome: 'rodape' },
    { tipo: 'booleano', nome: 'dismissable' },
  ],
  renderizar: (valores, registrar) => <DialogDoPlayground registrar={registrar} valores={valores} />,
  codigo: (valores) =>
    [
      '<Button onClick={abrir}>Abrir diálogo</Button>',
      gerarJsx(
        'Dialog',
        [
          ['open', expr('aberto')],
          ['onOpenChange', expr('setAberto')],
          ['title', valores.title],
          ['description', valores.description || undefined],
          ['size', valores.size, 'md'],
          ['role', valores.role, 'dialog'],
          ['dismissable', valores.dismissable, true],
          ['icon', valores.icone ? expr('<IconInfoCircle />') : undefined],
          ['footer', valores.rodape ? expr(RODAPE) : undefined],
        ],
        valores.children,
      ),
    ].join('\n'),
  verificar: (valores) => {
    const titulo = valores.title.trim();
    const verificacoes: Verificacao[] = [
      titulo
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${titulo}", pelo título, ligado por aria-labelledby.` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O título é o nome do diálogo para o leitor de tela.' },
    ];

    if (valores.description.trim()) {
      verificacoes.push({ nivel: 'ok', titulo: 'Descrição acessível', detalhe: 'Ligada por aria-describedby, ouvida depois do nome.' });
    }

    if (!valores.dismissable) {
      verificacoes.push(
        valores.rodape
          ? { nivel: 'atencao', titulo: 'Não dispensável', detalhe: 'Sem Escape, clique fora nem botão de fechar: a saída é o rodapé.' }
          : { nivel: 'falha', titulo: 'Sem saída', detalhe: 'Não dispensável e sem rodapé, nada fecha o diálogo. A prévia não abre.' },
      );
    }

    if (valores.role === 'alertdialog' && !valores.rodape) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Alerta sem resposta',
        detalhe: 'alertdialog é a confirmação que exige resposta: ponha as ações no rodapé.',
      });
    }

    return verificacoes;
  },
});

function ConfirmacaoDeExclusao() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(true)} variant="danger">Excluir módulo</Button>
      <Dialog
        description="O módulo e todos os seus registros serão removidos."
        footer={
          <>
            <Button onClick={() => setAberto(false)} variant="secondary">Cancelar</Button>
            <Button onClick={() => setAberto(false)} variant="danger">Excluir</Button>
          </>
        }
        icon={<IconExclamationTriangle />}
        onOpenChange={setAberto}
        open={aberto}
        role="alertdialog"
        size="sm"
        title="Excluir módulo"
      >
        Esta ação não pode ser desfeita.
      </Dialog>
    </>
  );
}

function NovaSecao() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(true)} variant="secondary">Nova seção</Button>
      <Dialog
        description="A seção agrupa documentos dentro da coleção."
        footer={
          <>
            <Button onClick={() => setAberto(false)} variant="secondary">Cancelar</Button>
            <Button onClick={() => setAberto(false)}>Criar seção</Button>
          </>
        }
        icon={<IconPlusCircle />}
        onOpenChange={setAberto}
        open={aberto}
        title="Nova seção"
      >
        <div className="stack">
          <InputText label="Nome" />
          <InputText label="Descrição" />
        </div>
      </Dialog>
    </>
  );
}

function SessaoExpirada() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(true)} variant="secondary">Simular sessão expirada</Button>
      <Dialog
        description="Por segurança, entre de novo para continuar."
        dismissable={false}
        footer={<Button onClick={() => setAberto(false)}>Entrar novamente</Button>}
        onOpenChange={setAberto}
        open={aberto}
        size="sm"
        title="Sessão expirada"
      />
    </>
  );
}

function PaletaDeBusca() {
  const [aberta, setAberta] = useState(false);
  const resultados = RESULTADOS_DO_ACERVO.map((resultado) => ({ ...resultado, icon: <IconFile /> }));

  return (
    <>
      <Button onClick={() => setAberta(true)} variant="secondary">Buscar (Ctrl K)</Button>
      <Dialog aria-label="Buscar no acervo" onOpenChange={setAberta} open={aberta}>
        <ComboBox aria-label="Termo da busca" options={resultados} placeholder="Buscar documentos e coleções" />
      </Dialog>
    </>
  );
}

function EdicaoLongaEmDialog() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(true)} variant="secondary">Editar usuário</Button>
      <Dialog onOpenChange={setAberto} open={aberto} size="lg" title="Editar usuário">
        <div className="stack">
          <InputText defaultValue="Ana Prado" label="Nome" />
          <InputText defaultValue="ana@plenustech.com" label="E-mail" />
          <InputText defaultValue="Financeiro" label="Equipe" />
          <InputText defaultValue="Analista" label="Cargo" />
          <InputText defaultValue="(11) 4000-1234" label="Telefone" />
          <InputText defaultValue="São Paulo" label="Cidade" />
        </div>
      </Dialog>
    </>
  );
}

function Variantes() {
  const [tamanho, setTamanho] = useState<DialogSize | null>(null);

  return (
    <div className="demo-row">
      {TAMANHOS.map((opcao) => (
        <Button key={opcao} onClick={() => setTamanho(opcao)} variant="secondary">
          {opcao} · {LARGURAS[opcao]}
        </Button>
      ))}
      <Dialog
        description={`Largura máxima de ${LARGURAS[tamanho ?? 'md']}.`}
        footer={<Button onClick={() => setTamanho(null)}>Fechar</Button>}
        onOpenChange={() => setTamanho(null)}
        open={tamanho !== null}
        size={tamanho ?? 'md'}
        title={`Tamanho ${tamanho ?? 'md'}`}
      >
        A altura acompanha o conteúdo até o limite da tela; daí em diante só o corpo rola.
      </Dialog>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>open</code>, <code>defaultOpen</code> e <code>onOpenChange</code></dt>
      <dd>
        Com <code>open</code>, controlado: Escape, clique fora e o botão de fechar chamam <code>onOpenChange(false)</code>, e quem abriu decide fechar. Com <code>defaultOpen</code>, abre no início e fecha sozinho.
        Fechado, não renderiza nada.
      </dd>
      <dt><code>dismissable=&#123;false&#125;</code></dt>
      <dd>Tira o botão de fechar e ignora Escape e clique fora. A saída precisa estar no rodapé.</dd>
      <dt><code>role=&quot;alertdialog&quot;</code></dt>
      <dd>Para a confirmação que interrompe e exige resposta, como a de uma ação destrutiva.</dd>
      <dt>Sem título</dt>
      <dd>
        Sem <code>title</code>, o <code>aria-label</code> passa a ser obrigatório e dá o nome; sem cabeçalho, não há botão
        de fechar, e a saída é o Esc ou o clique fora. Serve à paleta de busca, em que o campo é o próprio conteúdo.
      </dd>
      <dt><code>icon</code></dt>
      <dd>Opcional, ao lado do título e fora da leitura: quem fala é o título.</dd>
      <dt>Sem corpo</dt>
      <dd>Só cabeçalho e rodapé. A linha sob o cabeçalho aparece apenas quando há corpo embaixo dele.</dd>
      <dt>Conteúdo longo</dt>
      <dd>Cabeçalho e rodapé ficam fixos; só o meio rola.</dd>
      <dt>Celular</dt>
      <dd>Continua um cartão centralizado, e as ações do rodapé dividem a largura.</dd>
      <dt>Servidor</dt>
      <dd>Aberto na renderização do servidor, não quebra: o portal nasce na hidratação.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Confirmação destrutiva',
      descricao: 'alertdialog para a decisão que não se desfaz, com a ação danger no rodapé.',
      Previa: ConfirmacaoDeExclusao,
      codigo:
        '<Button variant="danger" onClick={abrir}>Excluir módulo</Button>\n<Dialog\n  open={aberto}\n  onOpenChange={setAberto}\n  role="alertdialog"\n  size="sm"\n  icon={<IconExclamationTriangle />}\n  title="Excluir módulo"\n  description="O módulo e todos os seus registros serão removidos."\n  footer={<>\n    <Button variant="secondary" onClick={fechar}>Cancelar</Button>\n    <Button variant="danger" onClick={excluir}>Excluir</Button>\n  </>}\n>\n  Esta ação não pode ser desfeita.\n</Dialog>',
    },
    {
      titulo: 'Formulário curto, com ícone',
      descricao: 'O foco entra no primeiro campo e volta ao gatilho ao fechar.',
      Previa: NovaSecao,
      codigo:
        '<Button variant="secondary" onClick={abrir}>Nova seção</Button>\n<Dialog\n  open={aberto}\n  onOpenChange={setAberto}\n  icon={<IconPlusCircle />}\n  title="Nova seção"\n  description="A seção agrupa documentos dentro da coleção."\n  footer={<>\n    <Button variant="secondary" onClick={fechar}>Cancelar</Button>\n    <Button onClick={criar}>Criar seção</Button>\n  </>}\n>\n  <InputText label="Nome" />\n  <InputText label="Descrição" />\n</Dialog>',
    },
    {
      titulo: 'Não dispensável, sem corpo',
      descricao: 'Escape e clique fora não fecham; a única saída é a ação do rodapé.',
      Previa: SessaoExpirada,
      codigo:
        '<Dialog\n  open={expirada}\n  onOpenChange={entrar}\n  dismissable={false}\n  size="sm"\n  title="Sessão expirada"\n  description="Por segurança, entre de novo para continuar."\n  footer={<Button onClick={entrar}>Entrar novamente</Button>}\n/>',
    },
    {
      titulo: 'Paleta de busca, sem título',
      descricao: 'Sem title, o nome vem do aria-label e o diálogo não tem cabeçalho. Esc fecha.',
      Previa: PaletaDeBusca,
      codigo:
        '<Dialog aria-label="Buscar no acervo" open={aberta} onOpenChange={setAberta}>\n  <ComboBox\n    aria-label="Termo da busca"\n    placeholder="Buscar documentos e coleções"\n    options={resultados}\n  />\n</Dialog>',
    },
  ],
  faca: {
    Previa: ConfirmacaoDeExclusao,
    texto: 'Dialog para interromper o fluxo com uma decisão ou um formulário curto.',
  },
  evite: {
    Previa: EdicaoLongaEmDialog,
    texto: 'Editar ou detalhar um item com conteúdo longo num Dialog. Isso é Drawer, que abre ao lado da página.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab', 'Shift+Tab'], acao: 'Percorre os elementos do diálogo; o foco não sai dele.' },
    { teclas: ['Esc'], acao: 'Fecha, exceto com dismissable={false}, e devolve o foco a quem abriu.' },
    { teclas: ['Enter', 'Espaço'], acao: 'No botão de fechar, fecha o diálogo.' },
  ],
  garantias: [
    {
      garantia: 'Nome e descrição',
      como: <>O título por <code>aria-labelledby</code> e a descrição por <code>aria-describedby</code>.</>,
      teste: 'Dialog.test.tsx',
    },
    {
      garantia: 'Modal de verdade',
      como: <><code>aria-modal</code>, e o restante da página escondido da tecnologia assistiva.</>,
      teste: 'Dialog.test.tsx',
    },
    { garantia: 'Foco devolvido', como: 'Ao fechar pelo Escape, o foco volta ao gatilho.', teste: 'Dialog.test.tsx' },
    { garantia: 'Não dispensável', como: 'Sem botão de fechar, e o Escape é ignorado.', teste: 'Dialog.test.tsx' },
    { garantia: 'Papel de alerta', como: <><code>role=&quot;alertdialog&quot;</code> na confirmação que exige resposta.</>, teste: 'Dialog.test.tsx' },
    { garantia: 'Sem título, com nome', como: <>Sem <code>title</code>, o tipo exige <code>aria-label</code>, e o Esc fecha.</>, teste: 'Dialog.test.tsx' },
    { garantia: 'Ícone fora da leitura', como: <>O ícone fica sob <code>aria-hidden</code>; o nome continua o título.</>, teste: 'Dialog.test.tsx' },
    {
      garantia: 'Overlays dentro dele',
      como: 'Menu, Popover, Tooltip e as listas dos campos continuam visíveis ao leitor de tela.',
      teste: 'aninhados.test.tsx',
    },
    { garantia: 'Servidor', como: 'Renderiza sem document; o portal nasce na hidratação.', teste: 'servidor.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref vão ao elemento do diálogo; o className soma ao do sistema.',
  api: [
    { nome: 'open', tipo: 'boolean', descricao: 'Aberto, no modo controlado.' },
    { nome: 'defaultOpen', tipo: 'boolean', padrao: 'false', descricao: 'Aberto no início, no modo não controlado.' },
    { nome: 'onOpenChange', tipo: '(open: boolean) => void', descricao: 'Recebe false no pedido de fechar: Escape, clique fora ou botão de fechar.' },
    { nome: 'onClose', tipo: '() => void', descricao: <>Obsoleto: use <code>onOpenChange</code>.</> },
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível. Sem ele, não há cabeçalho.' },
    { nome: 'aria-label', tipo: 'string', descricao: 'Obrigatória sem title, e recusada com ele: o nome do diálogo sem cabeçalho.' },
    { nome: 'description', tipo: 'string', descricao: 'Texto sob o título, ligado como descrição acessível.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'Corpo, que rola quando passa da altura.' },
    { nome: 'footer', tipo: 'ReactNode', descricao: 'Rodapé fixo, com as ações.' },
    { nome: 'icon', tipo: 'ReactNode', descricao: 'Ícone ao lado do título, fora da leitura.' },
    { nome: 'role', tipo: "'dialog' | 'alertdialog'", padrao: "'dialog'", descricao: 'alertdialog para a confirmação que exige resposta.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Largura máxima de 400, 560 ou 760px.' },
    { nome: 'dismissable', tipo: 'boolean', padrao: 'true', descricao: 'Botão de fechar, Escape e clique fora.' },
  ],
};
