import { Avatar, AvatarItem } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const playground = definirPlayground({
  inicial: { title: 'Ana Prado', description: 'Aprovadora', mostrarDescricao: true },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'booleano', nome: 'mostrarDescricao' },
  ],
  renderizar: (valores) => (
    <div style={{ width: 240 }}>
      <AvatarItem
        avatar={<Avatar name={valores.title || '?'} size="sm" />}
        description={valores.mostrarDescricao ? valores.description : undefined}
        title={valores.title}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('AvatarItem', [
      ['avatar', expr(`<Avatar name="${valores.title}" size="sm" />`)],
      ['title', valores.title],
      ['description', valores.mostrarDescricao ? valores.description : undefined],
    ]),
});

function Modos() {
  return (
    <div className="subsection">
      <h3>Texto longo</h3>
      <div style={{ width: 200 }}>
        <AvatarItem
          avatar={<Avatar name="Comércio Aurora" size="sm" />}
          description="financeiro.comercio.aurora@exemplo.com.br"
          title="Comércio Aurora de Materiais e Serviços Ltda."
        />
      </div>
      <p className="note">
        Título e descrição ficam numa linha só e terminam em reticências quando não cabem, como no AvatarItem do Atlassian. A altura da
        linha não muda, o que importa numa célula de tabela; o texto inteiro deve estar disponível em outro lugar da tela.
      </p>
      <VerCodigo
        codigo={`<AvatarItem
  avatar={<Avatar name="Comércio Aurora" size="sm" />}
  title="Comércio Aurora de Materiais e Serviços Ltda."
  description="financeiro.comercio.aurora@exemplo.com.br"
/>`}
      />
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Pessoas numa lista',
      descricao: 'O avatar sm ao lado do nome e do papel, uma linha por pessoa.',
      Previa: () => (
        <div className="stack" style={{ width: '100%' }}>
          <AvatarItem avatar={<Avatar name="Ana Prado" size="sm" />} description="Aprovadora" title="Ana Prado" />
          <AvatarItem avatar={<Avatar name="Bruno Dias" size="sm" />} description="Analista" title="Bruno Dias" />
          <AvatarItem avatar={<Avatar name="Célia Nunes" size="sm" />} title="Célia Nunes" />
        </div>
      ),
      codigo:
        '<AvatarItem avatar={<Avatar name="Ana Prado" size="sm" />} title="Ana Prado" description="Aprovadora" />\n<AvatarItem avatar={<Avatar name="Bruno Dias" size="sm" />} title="Bruno Dias" description="Analista" />\n<AvatarItem avatar={<Avatar name="Célia Nunes" size="sm" />} title="Célia Nunes" />',
    },
    {
      titulo: 'Entidade com avatar maior',
      descricao: 'O avatar é o que o produto passa: aqui, o tamanho md para uma empresa.',
      Previa: () => <AvatarItem avatar={<Avatar name="Comércio Aurora" />} description="12 pedidos em aberto" title="Comércio Aurora" />,
      codigo: '<AvatarItem avatar={<Avatar name="Comércio Aurora" />} title="Comércio Aurora" description="12 pedidos em aberto" />',
    },
  ],
  faca: {
    Previa: () => <AvatarItem avatar={<Avatar name="Ana Prado" size="sm" />} description="Aprovadora" title="Ana Prado" />,
    texto: 'AvatarItem para o par avatar e texto: o espaçamento e o corte do texto longo já vêm resolvidos.',
    codigo: `<AvatarItem
  avatar={<Avatar name="Ana Prado" size="sm" />}
  title="Ana Prado"
  description="Aprovadora"
/>`,
  },
  evite: {
    Previa: () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Avatar name="Ana Prado" size="sm" />
        <span>Ana Prado</span>
      </div>
    ),
    texto: 'Montar a linha à mão, com um espaçamento de cada vez: o texto longo estoura a largura e o alinhamento muda entre telas.',
    codigo: `<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
  <Avatar name="Ana Prado" size="sm" />
  <span>Ana Prado</span>
</div>`,
  },
  Modos,
  teclado: [{ teclas: ['Tab'], acao: 'O item é estático e não tem teclado próprio: o foco passa direto pelo que houver dentro dele.' }],
  garantias: [
    { garantia: 'Conteúdo', como: 'Avatar, título e descrição aparecem; sem descrição, só o título.', teste: 'AvatarItem.test.tsx' },
    { garantia: 'Props nativas', como: <>A raiz repassa ref, <code>className</code> e atributos nativos, sem o <code>title</code> nativo.</>, teste: 'AvatarItem.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div>, menos title, e o ref.',
  api: [
    { nome: 'avatar', tipo: 'ReactNode', descricao: 'Obrigatório. O avatar, normalmente um Avatar, à esquerda do texto.' },
    { nome: 'title', tipo: 'ReactNode', descricao: 'Obrigatório. Texto principal.' },
    { nome: 'description', tipo: 'ReactNode', descricao: 'Texto secundário abaixo do título.' },
  ],
};
