import type { CSSProperties } from 'react';
import { Avatar, type AvatarSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const TAMANHOS = ['xs', 'sm', 'md', 'lg'] as const;
const MEDIDAS: Record<AvatarSize, number> = { xs: 24, sm: 32, md: 40, lg: 56 };
const IMAGENS = ['nenhuma', 'válida', 'quebrada'] as const;

const FOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#7c9cbf"/>' +
      '<circle cx="32" cy="25" r="12" fill="#e9eef5"/><path d="M10 64c2-14 11-21 22-21s20 7 22 21z" fill="#e9eef5"/></svg>',
  );
const SRC_DA_IMAGEM: Record<(typeof IMAGENS)[number], string | undefined> = {
  nenhuma: undefined,
  válida: FOTO,
  quebrada: '/sem-foto.jpg',
};

const equipe = [
  { nome: 'Ana Prado', email: 'ana@plenustech.com' },
  { nome: 'Bruno Dias', email: 'bruno@plenustech.com' },
  { nome: 'Célia Nunes', email: 'celia@plenustech.com' },
];

const CORES_DO_PRODUTO = {
  '--pl-avatar-bg': 'var(--pl-color-success-container)',
  '--pl-avatar-fg': 'var(--pl-color-on-success-container)',
} as CSSProperties;

const playground = definirPlayground({
  inicial: { name: 'Maria Costa', initials: '', size: 'md', imagem: 'nenhuma', decorative: false },
  controles: [
    { tipo: 'texto', nome: 'name' },
    { tipo: 'texto', nome: 'initials' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'opcoes', nome: 'imagem', opcoes: IMAGENS },
    { tipo: 'booleano', nome: 'decorative' },
  ],
  renderizar: (valores, registrar) => (
    <Avatar
      decorative={Boolean(valores.decorative)}
      initials={valores.initials || undefined}
      name={valores.name}
      onError={() => registrar('onError')}
      size={valores.size as AvatarSize}
      src={SRC_DA_IMAGEM[valores.imagem as (typeof IMAGENS)[number]]}
    />
  ),
  codigo: (valores) =>
    gerarJsx('Avatar', [
      ['name', valores.name],
      ['initials', valores.initials || undefined],
      ['size', valores.size, 'md'],
      ['src', valores.imagem === 'nenhuma' ? undefined : expr('pessoa.foto')],
      ['decorative', Boolean(valores.decorative), false],
    ]),
  verificar: (valores) => {
    const nome = valores.name.trim();
    const partes = nome.split(/\s+/).filter(Boolean);
    const verificacoes: Verificacao[] = [
      valores.decorative
        ? {
            nivel: 'ok',
            titulo: 'Decorativo',
            detalhe: 'Fora da árvore de acessibilidade: alt="" na foto e aria-hidden nas iniciais. O nome precisa estar escrito ao lado.',
          }
        : nome
          ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${nome}", como alt da imagem ou aria-label das iniciais.` }
          : { nivel: 'falha', titulo: 'Sem nome', detalhe: 'O avatar vira "?" e não é anunciado. name é obrigatório.' },
    ];

    if (valores.initials) {
      verificacoes.push({ nivel: 'ok', titulo: 'Iniciais próprias', detalhe: 'O texto muda; o nome acessível continua sendo o name.' });
    } else if (partes.length > 2) {
      verificacoes.push({ nivel: 'ok', titulo: 'Iniciais', detalhe: 'Só as duas primeiras palavras entram nas iniciais.' });
    }

    if (valores.imagem === 'quebrada') {
      verificacoes.push({ nivel: 'ok', titulo: 'Imagem indisponível', detalhe: 'A falha cai nas iniciais, com o mesmo nome acessível.' });
    }

    return verificacoes;
  },
});

const CODIGO_DAS_VARIANTES = `<Avatar name="Maria Costa" size="xs" />
<Avatar name="Maria Costa" size="sm" />
<Avatar name="Maria Costa" size="md" />
<Avatar name="Maria Costa" size="lg" />`;

function Variantes() {
  return (
    <>
      <div className="demo-row">
        {TAMANHOS.map((tamanho) => (
          <div className="cell-person" key={tamanho}>
            <Avatar decorative name="Maria Costa" size={tamanho} />
            <div>
              <b>{tamanho}</b>
              <span>{MEDIDAS[tamanho]}px</span>
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
      <dt>Sem <code>src</code></dt>
      <dd>
        Mostra as iniciais das duas primeiras palavras do nome, em maiúsculas, num <code>span</code> com{' '}
        <code>role=&quot;img&quot;</code> e o nome em <code>aria-label</code>. Nome de uma palavra só dá uma inicial. O
        fundo é só das iniciais.
      </dd>
      <dt>Com <code>src</code></dt>
      <dd>
        Renderiza um <code>img</code> com o nome em <code>alt</code>, sem fundo, com um contorno sutil para dentro que
        separa a foto clara da superfície.
      </dd>
      <dt>Imagem que falha</dt>
      <dd>
        Cai nas iniciais e repassa o <code>onError</code>. Trocar o <code>src</code> tenta a imagem nova de novo.
      </dd>
      <dt>
        <code>decorative</code>
      </dt>
      <dd>
        Sai da árvore de acessibilidade: <code>alt=&quot;&quot;</code> na foto e <code>aria-hidden</code> nas iniciais.
        Serve quando o nome já está escrito ao lado; o <code>AvatarItem</code> faz isso sozinho.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Pessoa numa célula',
      descricao: 'O tamanho sm ao lado do nome e do e-mail, como na lista de membros. O nome já está escrito: o avatar é decorativo.',
      Previa: () => (
        <div className="stack">
          {equipe.map((pessoa) => (
            <div className="cell-person" key={pessoa.email}>
              <Avatar decorative name={pessoa.nome} size="sm" />
              <div>
                <b>{pessoa.nome}</b>
                <span>{pessoa.email}</span>
              </div>
            </div>
          ))}
        </div>
      ),
      codigo:
        '<div className="cell-person">\n  <Avatar decorative name={pessoa.nome} size="sm" />\n  <div>\n    <b>{pessoa.nome}</b>\n    <span>{pessoa.email}</span>\n  </div>\n</div>',
    },
    {
      titulo: 'Cabeçalho de perfil',
      descricao: 'O lg com foto; se a imagem falhar, as iniciais ocupam o lugar.',
      Previa: () => (
        <div className="cell-person">
          <Avatar decorative name="Rafael Alves" size="lg" src={FOTO} />
          <div>
            <b>Rafael Alves</b>
            <span>Administrador</span>
          </div>
        </div>
      ),
      codigo: '<Avatar decorative name="Rafael Alves" size="lg" src={usuario.foto} />',
    },
    {
      titulo: 'Entidade',
      descricao: 'Uma empresa ou um módulo também tem avatar; nome de uma palavra dá uma inicial.',
      Previa: () => (
        <>
          <Avatar name="Plenustech" />
          <Avatar name="Comércio Aurora" />
        </>
      ),
      codigo: '<Avatar name="Plenustech" />\n<Avatar name="Comércio Aurora" />',
    },
    {
      titulo: 'Iniciais próprias e cores do produto',
      descricao:
        'initials troca as iniciais tiradas do nome, como a sigla de uma entidade. --pl-avatar-bg e --pl-avatar-fg, definidas em qualquer ancestral, trocam o fundo e o texto das iniciais.',
      Previa: () => (
        <div className="demo-row" style={CORES_DO_PRODUTO}>
          <Avatar initials="CA" name="Cooperativa Agrícola do Vale" />
          <Avatar initials="LT" name="Laboratório Técnico" size="xs" />
        </div>
      ),
      codigo:
        '<div style={{ "--pl-avatar-bg": "var(--pl-color-success-container)", "--pl-avatar-fg": "var(--pl-color-on-success-container)" }}>\n  <Avatar initials="CA" name="Cooperativa Agrícola do Vale" />\n</div>',
    },
  ],
  Variantes,
  Modos,
  garantias: [
    { garantia: 'Nome acessível', como: <>As iniciais têm <code>role=&quot;img&quot;</code> e <code>aria-label</code>; a imagem, <code>alt</code>. Os dois com o <code>name</code>.</>, teste: 'Avatar.test.tsx' },
    { garantia: 'Decorativo', como: <><code>decorative</code> tira o avatar da árvore de acessibilidade: <code>alt=&quot;&quot;</code> na foto, <code>aria-hidden</code> nas iniciais.</>, teste: 'Avatar.test.tsx' },
    { garantia: 'Imagem que falha', como: 'Volta às iniciais, sem perder o nome.', teste: 'Avatar.test.tsx' },
  ],
  notaDaApi: 'Além destas, os atributos HTML válidos tanto em <span> quanto em <img>.',
  api: [
    { nome: 'name', tipo: 'string', descricao: 'Obrigatório. Nome acessível e origem das iniciais.' },
    { nome: 'initials', tipo: 'string', descricao: 'Iniciais no lugar das tiradas do name. O nome acessível continua sendo o name.' },
    { nome: 'size', tipo: "'xs' | 'sm' | 'md' | 'lg'", padrao: "'md'", descricao: '24, 32, 40 ou 56px. O xs usa a fonte micro.' },
    { nome: 'src', tipo: 'string', descricao: 'Endereço da imagem. Sem ele, ou se ela falhar, ficam as iniciais.' },
    { nome: 'decorative', tipo: 'boolean', padrao: 'false', descricao: 'Tira o avatar da árvore de acessibilidade, para quando o nome está escrito ao lado.' },
    { nome: 'onError', tipo: '(event) => void', descricao: 'Chamado quando a imagem não carrega, depois da troca pelas iniciais.' },
    { nome: '--pl-avatar-bg / --pl-avatar-fg', tipo: 'variável CSS', descricao: 'Fundo e texto das iniciais, lidos com o valor do sistema de reserva. A foto não tem fundo.' },
  ],
};
