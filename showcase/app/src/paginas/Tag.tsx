import { useState } from 'react';
import { Badge, Button, Tag, type TagSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TAMANHOS = ['sm', 'md'] as const;
const FILTROS = ['Situação: ativo', 'Perfil: editor', 'Criado em 2026'];
const PAPEIS = ['leitor', 'editor', 'administrador'];

interface TagDoPlaygroundProps {
  alternavel: boolean;
  disabled: boolean;
  removivel: boolean;
  registrar: (evento: string) => void;
  selecionadaNoInicio: boolean;
  size: TagSize;
  texto: string;
}

function TagDoPlayground({ alternavel, disabled, removivel, registrar, selecionadaNoInicio, size, texto }: TagDoPlaygroundProps) {
  const [selecionada, setSelecionada] = useState(selecionadaNoInicio);

  function alternar(valor: boolean) {
    setSelecionada(valor);
    registrar(`onSelectedChange: ${valor}`);
  }

  return (
    <Tag
      disabled={disabled}
      onRemove={removivel ? () => registrar('onRemove') : undefined}
      onSelectedChange={alternavel ? alternar : undefined}
      selected={alternavel ? selecionada : undefined}
      size={size}
    >
      {texto}
    </Tag>
  );
}

const playground = definirPlayground({
  inicial: { children: 'Situação: ativo', size: 'md', removivel: true, alternavel: false, selected: false, disabled: false },
  controles: [
    { tipo: 'texto', nome: 'children' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'removivel' },
    { tipo: 'booleano', nome: 'alternavel' },
    { tipo: 'booleano', nome: 'selected' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <TagDoPlayground
      alternavel={valores.alternavel}
      disabled={valores.disabled}
      key={String(valores.selected)}
      registrar={registrar}
      removivel={valores.removivel}
      selecionadaNoInicio={valores.selected}
      size={valores.size as TagSize}
      texto={valores.children}
    />
  ),
  codigo: (valores) =>
    gerarJsx(
      'Tag',
      [
        ['size', valores.size, 'md'],
        ['selected', valores.alternavel ? expr('selecionada') : undefined],
        ['onSelectedChange', valores.alternavel ? expr('setSelecionada') : undefined],
        ['onRemove', valores.removivel ? expr('remover') : undefined],
        ['disabled', valores.disabled, false],
      ],
      valores.children,
    ),
  verificar: (valores) => {
    const texto = valores.children.trim();
    const verificacoes: Verificacao[] = [];

    if (!texto) {
      verificacoes.push({ nivel: 'falha', titulo: 'Sem texto', detalhe: 'O botão de remover se chamaria só "Remover", sem dizer o quê.' });
    } else if (valores.removivel) {
      verificacoes.push({ nivel: 'ok', titulo: 'Nome do remover', detalhe: `"Remover ${texto}", distinto das outras etiquetas.` });
    }

    if (!valores.removivel && !valores.alternavel) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Etiqueta sem controle',
        detalhe: 'Sem remover nem alternar, o papel é do Badge, que rotula estado e categoria.',
      });
    }

    if (valores.alternavel) {
      verificacoes.push({ nivel: 'ok', titulo: 'Botão de alternar', detalhe: 'aria-pressed, e o visto ao lado do texto quando ligada.' });
    }

    if (valores.disabled) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Desabilitada', detalhe: 'Não alterna nem remove, e os botões saem da tabulação.' });
    }

    return verificacoes;
  },
});

function FiltrosAtivos() {
  const [filtros, setFiltros] = useState(FILTROS);

  return (
    <div className="demo-row">
      {filtros.map((filtro) => (
        <Tag key={filtro} onRemove={() => setFiltros((atuais) => atuais.filter((atual) => atual !== filtro))}>
          {filtro}
        </Tag>
      ))}
      {filtros.length === 0 && (
        <Button onClick={() => setFiltros(FILTROS)} size="sm" variant="ghost">
          Restaurar filtros
        </Button>
      )}
    </div>
  );
}

function EscolhaDePapeis() {
  const [papeis, setPapeis] = useState(['editor']);

  return (
    <div className="demo-row">
      {PAPEIS.map((papel) => (
        <Tag
          key={papel}
          onSelectedChange={(escolhido) =>
            setPapeis((atuais) => (escolhido ? [...atuais, papel] : atuais.filter((atual) => atual !== papel)))
          }
          selected={papeis.includes(papel)}
        >
          {papel}
        </Tag>
      ))}
    </div>
  );
}

function Variantes() {
  return (
    <div className="matrix">
      <div className="matrix-row matrix-head">
        <span>size</span>
        <span>texto</span>
        <span>removível</span>
        <span>de alternar</span>
        <span>selecionada</span>
        <span>disabled</span>
      </div>
      {TAMANHOS.map((tamanho) => (
        <div className="matrix-row" key={tamanho}>
          <code>{tamanho}</code>
          <span>
            <Tag size={tamanho}>Editor</Tag>
          </span>
          <span>
            <Tag onRemove={() => undefined} size={tamanho}>Editor</Tag>
          </span>
          <span>
            <Tag onSelectedChange={() => undefined} selected={false} size={tamanho}>Editor</Tag>
          </span>
          <span>
            <Tag onSelectedChange={() => undefined} selected size={tamanho}>Editor</Tag>
          </span>
          <span>
            <Tag disabled onRemove={() => undefined} size={tamanho}>Editor</Tag>
          </span>
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>onRemove</code></dt>
      <dd>
        Acrescenta o botão de remover, nomeado &quot;Remover&quot; seguido do texto da etiqueta por{' '}
        <code>aria-labelledby</code>. Quem tira a etiqueta da tela é o produto, ao receber o aviso.
      </dd>
      <dt><code>selected</code>, <code>defaultSelected</code> ou <code>onSelectedChange</code></dt>
      <dd>
        Transforma o texto num botão de alternar, com <code>aria-pressed</code> e o visto ao lado do texto quando ligada: o
        estado não depende só da cor. Com <code>selected</code> o valor é controlado; com <code>defaultSelected</code> a
        etiqueta alterna sozinha. <code>onSelectedChange</code> recebe o novo estado.
      </dd>
      <dt>Os dois juntos</dt>
      <dd>Os botões ficam lado a lado, sem botão dentro de botão.</dd>
      <dt><code>disabled</code></dt>
      <dd>Desabilita os dois botões: a etiqueta não alterna nem remove.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Filtros ativos de uma busca',
      descricao: 'Remova uma etiqueta: ela sai da lista. Sem nenhuma, um botão restaura os filtros.',
      Previa: FiltrosAtivos,
      codigo:
        '{filtros.map((filtro) => (\n  <Tag key={filtro} onRemove={() => remover(filtro)}>\n    {filtro}\n  </Tag>\n))}',
    },
    {
      titulo: 'Papéis de alternar',
      descricao: 'Cada etiqueta liga e desliga um papel, independente das outras.',
      Previa: EscolhaDePapeis,
      codigo:
        '{papeis.map((papel) => (\n  <Tag\n    key={papel}\n    selected={escolhidos.includes(papel)}\n    onSelectedChange={(ligado) => alternar(papel, ligado)}\n  >\n    {papel}\n  </Tag>\n))}',
    },
  ],
  faca: {
    Previa: () => (
      <>
        <Tag onRemove={() => undefined}>Situação: ativo</Tag>
        <Tag onSelectedChange={() => undefined} selected>editor</Tag>
      </>
    ),
    texto: 'Tag para o que é operado: removida, como o filtro ativo, ou ligada e desligada, como o papel escolhido.',
  },
  evite: {
    Previa: () => (
      <>
        <Tag>Ativo</Tag>
        <Badge dot tone="success">Ativo</Badge>
      </>
    ),
    texto: 'Tag sem controle para rotular um estado. Isso é papel do Badge, à direita.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Passa pelo botão de alternar e pelo de remover, nessa ordem.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Alterna a etiqueta ou a remove, conforme o botão em foco.' },
  ],
  garantias: [
    { garantia: 'Remover nomeado', como: '"Remover" seguido do texto da etiqueta, distinto entre etiquetas.', teste: 'Tag.test.tsx' },
    { garantia: 'Estado de alternar', como: <><code>aria-pressed</code> no botão do texto.</>, teste: 'Tag.test.tsx' },
    { garantia: 'Desabilitada', como: 'Os botões nativos ficam desabilitados e não disparam os avisos.', teste: 'Tag.test.tsx' },
    { garantia: 'Só texto', como: 'Sem onRemove, selected, defaultSelected nem onSelectedChange, não há botão algum.', teste: 'Tag.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <span>, exceto children, que é obrigatório.',
  api: [
    { nome: 'children', tipo: 'ReactNode', descricao: 'Obrigatório. O texto da etiqueta, que também nomeia o remover.' },
    { nome: 'onRemove', tipo: '() => void', descricao: 'Mostra o botão de remover.' },
    { nome: 'selected', tipo: 'boolean', descricao: 'Ligada, no modo controlado. Com ele, o texto vira botão de alternar.' },
    { nome: 'defaultSelected', tipo: 'boolean', descricao: 'Ligada no início, no modo não controlado. Também torna o texto alternável.' },
    { nome: 'onSelectedChange', tipo: '(selected: boolean) => void', descricao: 'Recebe o novo estado ao alternar. Sozinho, já torna o texto alternável.' },
    { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Tamanho da etiqueta.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Impede alternar e remover.' },
  ],
};
