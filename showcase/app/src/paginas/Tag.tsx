import { useState, type CSSProperties } from 'react';
import { Badge, Button, Tag, type TagSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const TAMANHOS = ['sm', 'md'] as const;
const APARENCIAS = ['outline', 'filled'] as const;
type TagAppearance = (typeof APARENCIAS)[number];
const FILTROS = ['Situação: ativo', 'Perfil: editor', 'Criado em 2026'];
const PAPEIS = ['leitor', 'editor', 'administrador'];
const RAIO_DO_PRODUTO = { '--pl-tag-radius': 'var(--pl-radius-full)' } as CSSProperties;

interface TagDoPlaygroundProps {
  alternavel: boolean;
  appearance: TagAppearance;
  disabled: boolean;
  removivel: boolean;
  registrar: (evento: string) => void;
  selecionadaNoInicio: boolean;
  size: TagSize;
  texto: string;
}

function TagDoPlayground({ alternavel, appearance, disabled, removivel, registrar, selecionadaNoInicio, size, texto }: TagDoPlaygroundProps) {
  const [selecionada, setSelecionada] = useState(selecionadaNoInicio);

  function alternar(valor: boolean) {
    setSelecionada(valor);
    registrar(`onSelectedChange: ${valor}`);
  }

  return (
    <Tag
      appearance={appearance}
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
  inicial: { children: 'Situação: ativo', size: 'md', appearance: 'outline', removivel: true, alternavel: false, selected: false, disabled: false },
  controles: [
    { tipo: 'texto', nome: 'children' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'opcoes', nome: 'appearance', opcoes: APARENCIAS },
    { tipo: 'booleano', nome: 'removivel' },
    { tipo: 'booleano', nome: 'alternavel' },
    { tipo: 'booleano', nome: 'selected' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <TagDoPlayground
      alternavel={valores.alternavel}
      appearance={valores.appearance as TagAppearance}
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
        ['appearance', valores.appearance, 'outline'],
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

const CODIGO_DAS_VARIANTES = `<Tag size="sm">Editor</Tag>
<Tag size="md">Editor</Tag>
<Tag appearance="filled">Editor</Tag>

<Tag onRemove={remover}>Editor</Tag>

<Tag selected={false} onSelectedChange={alternar}>Editor</Tag>
<Tag selected onSelectedChange={alternar}>Editor</Tag>

<Tag disabled onRemove={remover}>Editor</Tag>`;

function Variantes() {
  return (
    <>
      <div className="matrix">
        <div className="matrix-row matrix-head">
          <span>size · appearance</span>
          <span>texto</span>
          <span>removível</span>
          <span>de alternar</span>
          <span>selecionada</span>
          <span>disabled</span>
        </div>
        {APARENCIAS.flatMap((aparencia) =>
          TAMANHOS.map((tamanho) => (
            <div className="matrix-row" key={`${aparencia}-${tamanho}`}>
              <code>
                {tamanho} · {aparencia}
              </code>
              <span>
                <Tag appearance={aparencia} size={tamanho}>
                  Editor
                </Tag>
              </span>
              <span>
                <Tag appearance={aparencia} onRemove={() => undefined} size={tamanho}>
                  Editor
                </Tag>
              </span>
              <span>
                <Tag appearance={aparencia} onSelectedChange={() => undefined} selected={false} size={tamanho}>
                  Editor
                </Tag>
              </span>
              <span>
                <Tag appearance={aparencia} onSelectedChange={() => undefined} selected size={tamanho}>
                  Editor
                </Tag>
              </span>
              <span>
                <Tag appearance={aparencia} disabled onRemove={() => undefined} size={tamanho}>
                  Editor
                </Tag>
              </span>
            </div>
          )),
        )}
      </div>
      <VerCodigo codigo={CODIGO_DAS_VARIANTES} />
    </>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>onRemove</code></dt>
      <dd>
        Acrescenta o botão de remover, nomeado pelo <code>removeLabel</code> (&quot;Remover&quot;, por padrão) seguido do
        texto da etiqueta. O botão fica acima da área de clique do alternar. Quem tira a etiqueta da tela é o produto, ao
        receber o aviso.
      </dd>
      <dt><code>selected</code>, <code>defaultSelected</code> ou <code>onSelectedChange</code></dt>
      <dd>
        Transforma o texto num botão de alternar, com <code>aria-pressed</code> e o visto ao lado do texto quando ligada: o
        estado não depende só da cor. Com <code>selected</code> o valor é controlado; com <code>defaultSelected</code> a
        etiqueta alterna sozinha. <code>onSelectedChange</code> recebe o novo estado.
      </dd>
      <dt>Os dois juntos</dt>
      <dd>
        Os botões ficam lado a lado, sem botão dentro de botão. A área de clique do alternar cobre a pílula inteira, com o
        respiro, e o de remover fica acima dela.
      </dd>
      <dt><code>appearance=&quot;filled&quot;</code></dt>
      <dd>Fundo neutro sem contorno e texto principal, para etiquetas sobre uma superfície com contorno, como um cartão.</dd>
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
      titulo: 'Preenchidas, com outro verbo e o raio do produto',
      descricao:
        'appearance="filled" tira o contorno e põe o fundo neutro. removeLabel troca o verbo do nome do remover. --pl-tag-radius, --pl-tag-bg e --pl-tag-shadow, definidas em qualquer ancestral, trocam o raio, o fundo e a sombra.',
      Previa: () => (
        <div className="demo-row" style={RAIO_DO_PRODUTO}>
          <Tag appearance="filled" onRemove={() => undefined} removeLabel="Tirar">
            Região: Sul
          </Tag>
          <Tag appearance="filled" defaultSelected onSelectedChange={() => undefined}>
            Somente ativos
          </Tag>
        </div>
      ),
      codigo:
        '<div style={{ "--pl-tag-radius": "var(--pl-radius-full)" }}>\n  <Tag appearance="filled" removeLabel="Tirar" onRemove={remover}>\n    Região: Sul\n  </Tag>\n</div>',
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
    codigo: `<Tag onRemove={remover}>Situação: ativo</Tag>
<Tag selected onSelectedChange={alternar}>editor</Tag>`,
  },
  evite: {
    Previa: () => (
      <>
        <Tag>Ativo</Tag>
        <Badge dot tone="success">Ativo</Badge>
      </>
    ),
    texto: 'Tag sem controle para rotular um estado. Isso é papel do Badge, à direita.',
    codigo: `<Tag>Ativo</Tag>
<Badge dot tone="success">Ativo</Badge>`,
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Passa pelo botão de alternar e pelo de remover, nessa ordem.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Alterna a etiqueta ou a remove, conforme o botão em foco.' },
  ],
  garantias: [
    { garantia: 'Remover nomeado', como: 'O removeLabel, "Remover" por padrão, seguido do texto da etiqueta, distinto entre etiquetas.', teste: 'Tag.test.tsx' },
    { garantia: 'Atributos de estado', como: <><code>data-selected</code> na raiz quando ligada e <code>data-disabled</code> quando desabilitada.</>, teste: 'Tag.test.tsx' },
    { garantia: 'Área de clique', como: 'O alternar cobre a pílula inteira, com o botão de remover acima dele.', teste: 'Tag.test.tsx' },
    { garantia: 'Estado de alternar', como: <><code>aria-pressed</code> no botão do texto.</>, teste: 'Tag.test.tsx' },
    { garantia: 'Desabilitada', como: 'Os botões nativos ficam desabilitados e não disparam os avisos.', teste: 'Tag.test.tsx' },
    { garantia: 'Só texto', como: 'Sem onRemove, selected, defaultSelected nem onSelectedChange, não há botão algum.', teste: 'Tag.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <span>, exceto children, que é obrigatório.',
  api: [
    { nome: 'children', tipo: 'ReactNode', descricao: 'Obrigatório. O texto da etiqueta, que também nomeia o remover.' },
    { nome: 'onRemove', tipo: '() => void', descricao: 'Mostra o botão de remover.' },
    { nome: 'removeLabel', tipo: 'string', padrao: "'Remover'", descricao: 'Verbo do botão de remover, antes do texto da etiqueta no nome dele.' },
    { nome: 'appearance', tipo: "'outline' | 'filled'", padrao: "'outline'", descricao: 'Contorno sobre a superfície, ou fundo neutro sem contorno.' },
    { nome: 'selected', tipo: 'boolean', descricao: 'Ligada, no modo controlado. Com ele, o texto vira botão de alternar.' },
    { nome: 'defaultSelected', tipo: 'boolean', descricao: 'Ligada no início, no modo não controlado. Também torna o texto alternável.' },
    { nome: 'onSelectedChange', tipo: '(selected: boolean) => void', descricao: 'Recebe o novo estado ao alternar. Sozinho, já torna o texto alternável.' },
    { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Tamanho da etiqueta.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Impede alternar e remover.' },
    { nome: 'data-selected / data-disabled', tipo: 'atributo', descricao: 'Na raiz: ligada, na etiqueta de alternar, e desabilitada.' },
    { nome: '--pl-tag-radius / --pl-tag-bg / --pl-tag-shadow', tipo: 'variável CSS', descricao: 'Raio, fundo e sombra, lidos com o valor do sistema de reserva. A etiqueta ligada mantém o fundo de selecionada.' },
  ],
};
