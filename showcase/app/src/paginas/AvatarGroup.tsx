import type { CSSProperties } from 'react';
import { AvatarGroup, type AvatarGroupOverflow, type AvatarSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const TAMANHOS = ['xs', 'sm', 'md', 'lg'] as const;
const SOBREPOSICAO: Record<AvatarSize, number> = { xs: 6, sm: 8, md: 10, lg: 14 };
const OVERFLOWS = ['count', 'popover'] as const;

const FOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#7c9cbf"/>' +
      '<circle cx="32" cy="25" r="12" fill="#e9eef5"/><path d="M10 64c2-14 11-21 22-21s20 7 22 21z" fill="#e9eef5"/></svg>',
  );

const EQUIPE = [
  { name: 'Ana Souza', src: FOTO },
  { name: 'Bruno Lima' },
  { name: 'Carla Dias' },
  { name: 'Diego Ramos' },
  { name: 'Elisa Moura' },
  { name: 'Fábio Nunes' },
  { name: 'Gabriela Reis' },
];

const SOBRE_O_FUNDO = { '--pl-avatar-group-ring': 'var(--pl-color-surface-muted)' } as CSSProperties;

const playground = definirPlayground({
  inicial: { label: 'Responsáveis', pessoas: 7, max: 4, overflow: 'popover', size: 'md' },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'numero', nome: 'pessoas', min: 1, max: EQUIPE.length },
    { tipo: 'numero', nome: 'max', min: 1, max: 8 },
    { tipo: 'opcoes', nome: 'overflow', opcoes: OVERFLOWS },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
  ],
  renderizar: (valores) => (
    <AvatarGroup
      label={valores.label}
      max={valores.max}
      overflow={valores.overflow as AvatarGroupOverflow}
      people={EQUIPE.slice(0, valores.pessoas)}
      size={valores.size as AvatarSize}
    />
  ),
  codigo: (valores) =>
    gerarJsx('AvatarGroup', [
      ['label', valores.label],
      ['people', expr('responsaveis')],
      ['max', valores.max],
      ['overflow', valores.overflow, 'count'],
      ['size', valores.size, 'md'],
    ]),
  verificar: (valores) => {
    const total = valores.pessoas;
    const sobra = total > valores.max ? total - Math.max(1, valores.max) + 1 : 0;
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome do grupo', detalhe: `"${valores.label.trim()}, ${total} ${total === 1 ? 'pessoa' : 'pessoas'}", com o total.` }
        : { nivel: 'falha', titulo: 'Sem nome', detalhe: 'O grupo fica sem dizer quem são essas pessoas. label é obrigatório.' },
    ];

    if (sobra === 0) {
      verificacoes.push({ nivel: 'ok', titulo: 'Todos à vista', detalhe: 'Cabem todos em max: não há "+N".' });
    } else if (valores.overflow === 'popover') {
      verificacoes.push({ nivel: 'ok', titulo: 'Lista dos que não couberam', detalhe: `Botão "Ver mais ${sobra} ${sobra === 1 ? 'pessoa' : 'pessoas'}", que abre a lista com os nomes.` });
    } else {
      verificacoes.push({ nivel: 'ok', titulo: 'Só a contagem', detalhe: `"+${sobra}" é texto, lido como "e mais ${sobra}", fora da ordem do Tab. Os nomes de quem sobrou não aparecem.` });
    }

    return verificacoes;
  },
});

const CODIGO_DAS_VARIANTES = `<AvatarGroup label="Responsáveis" max={4} people={equipe} size="xs" />
<AvatarGroup label="Responsáveis" max={4} people={equipe} size="sm" />
<AvatarGroup label="Responsáveis" max={4} people={equipe} size="md" />
<AvatarGroup label="Responsáveis" max={4} people={equipe} size="lg" />`;

function Variantes() {
  return (
    <>
      <div className="stack">
        {TAMANHOS.map((tamanho) => (
          <div className="cell-person" key={tamanho}>
            <AvatarGroup label={`Responsáveis, tamanho ${tamanho}`} max={4} people={EQUIPE} size={tamanho} />
            <div>
              <b>{tamanho}</b>
              <span>sobreposição de {SOBREPOSICAO[tamanho]}px</span>
            </div>
          </div>
        ))}
      </div>
      <VerCodigo codigo={CODIGO_DAS_VARIANTES} />
    </>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>
        <code>max</code>
      </dt>
      <dd>
        Conta os círculos, com o &quot;+N&quot;: com <code>max={'{4}'}</code> e sete pessoas, aparecem três avatares e
        &quot;+4&quot;, e a linha nunca passa de quatro círculos. Sem <code>max</code>, todos aparecem.
      </dd>
      <dt>
        <code>overflow=&quot;count&quot;</code>
      </dt>
      <dd>
        O padrão. O &quot;+N&quot; é texto, com <code>role=&quot;img&quot;</code> e o nome &quot;e mais 4&quot;, fora
        da ordem do Tab.
      </dd>
      <dt>
        <code>overflow=&quot;popover&quot;</code>
      </dt>
      <dd>
        O &quot;+N&quot; vira o botão &quot;Ver mais 4 pessoas&quot;, que abre um <code>Popover</code> com a lista dos
        que não couberam, cada um com avatar e nome. O foco entra no painel; o Esc o fecha e devolve o foco ao botão.
      </dd>
      <dt>Ordem</dt>
      <dd>
        A da lista. Destacar quem está online ou quem é o dono fica com o produto, que ordena antes de passar.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Responsáveis com a lista completa',
      descricao: 'O "+N" abre a lista de quem não coube, com os nomes escritos.',
      Previa: () => <AvatarGroup label="Responsáveis" max={4} overflow="popover" people={EQUIPE} />,
      codigo: '<AvatarGroup label="Responsáveis" max={4} overflow="popover" people={responsaveis} />',
    },
    {
      titulo: 'Só a contagem',
      descricao: 'Quem visualizou um registro: os nomes de quem sobrou não importam ali, só quantos são.',
      Previa: () => <AvatarGroup label="Visualizaram" max={3} people={EQUIPE} size="sm" />,
      codigo: '<AvatarGroup label="Visualizaram" max={3} people={vistos} size="sm" />',
    },
    {
      titulo: 'Sobre outro fundo',
      descricao: 'O anel tem a cor da superfície. Sobre outro fundo, --pl-avatar-group-ring, em qualquer ancestral, troca a cor.',
      Previa: () => (
        <div style={{ ...SOBRE_O_FUNDO, background: 'var(--pl-color-surface-muted)', padding: 16, borderRadius: 8 }}>
          <AvatarGroup label="Editando agora" people={EQUIPE.slice(0, 3)} size="sm" />
        </div>
      ),
      codigo:
        '<div style={{ "--pl-avatar-group-ring": "var(--pl-color-surface-muted)" }}>\n  <AvatarGroup label="Editando agora" people={editores} size="sm" />\n</div>',
    },
    {
      titulo: 'Outro idioma',
      descricao: 'labels troca os textos; cada um é uma função da quantidade, para acertar o plural.',
      Previa: () => (
        <AvatarGroup
          label="Owners"
          labels={{
            count: (total) => `${total} ${total === 1 ? 'person' : 'people'}`,
            list: (hidden) => `${hidden} more ${hidden === 1 ? 'person' : 'people'}`,
            more: (hidden) => `and ${hidden} more`,
            showMore: (hidden) => `Show ${hidden} more`,
          }}
          max={4}
          overflow="popover"
          people={EQUIPE}
        />
      ),
      codigo:
        "<AvatarGroup\n  label=\"Owners\"\n  labels={{\n    count: (total) => `${total} ${total === 1 ? 'person' : 'people'}`,\n    list: (hidden) => `${hidden} more ${hidden === 1 ? 'person' : 'people'}`,\n    more: (hidden) => `and ${hidden} more`,\n    showMore: (hidden) => `Show ${hidden} more`,\n  }}\n  max={4}\n  overflow=\"popover\"\n  people={owners}\n/>",
    },
  ],
  Variantes,
  Modos,
  garantias: [
    { garantia: 'Nome do grupo', como: <><code>role=&quot;group&quot;</code> com o <code>label</code> e o total: &quot;Responsáveis, 7 pessoas&quot;. Cada avatar visível mantém o nome próprio.</>, teste: 'AvatarGroup.test.tsx' },
    { garantia: '"+N" sem parada à toa', como: <>Sem <code>overflow=&quot;popover&quot;</code>, é texto com o nome &quot;e mais N&quot;, fora da ordem do Tab.</>, teste: 'AvatarGroup.test.tsx' },
    { garantia: 'Lista dos que não couberam', como: <>Botão com <code>aria-haspopup=&quot;dialog&quot;</code> e <code>aria-expanded</code>; o foco entra no painel, e o Esc o devolve ao botão.</>, teste: 'AvatarGroup.test.tsx' },
  ],
  notaDaApi: 'Além destas, os atributos HTML válidos em <div>.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Obrigatório. Nome do grupo; o total de pessoas entra depois dele.' },
    { nome: 'people', tipo: '{ name: string; src?: string; initials?: string }[]', descricao: 'Obrigatório. As pessoas, na ordem em que aparecem, com os mesmos dados do Avatar.' },
    { nome: 'max', tipo: 'number', descricao: 'Quantos círculos cabem, contando o "+N". Sem ele, todos aparecem.' },
    { nome: 'overflow', tipo: "'count' | 'popover'", padrao: "'count'", descricao: 'popover faz do "+N" um botão que abre a lista dos que não couberam.' },
    { nome: 'size', tipo: "'xs' | 'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Os tamanhos do Avatar. A sobreposição é um quarto do tamanho.' },
    { nome: 'labels', tipo: 'Partial<AvatarGroupLabels>', descricao: 'count, more, showMore e list: funções da quantidade, que devolvem "7 pessoas", "e mais 4", "Ver mais 4 pessoas" e "Mais 4 pessoas".' },
    { nome: '--pl-avatar-group-ring', tipo: 'variável CSS', descricao: 'Cor do anel entre os círculos, lida com a cor da superfície de reserva.' },
  ],
};
