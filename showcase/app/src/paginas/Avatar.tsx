import { Avatar, type AvatarSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TAMANHOS = ['sm', 'md', 'lg'] as const;
const MEDIDAS: Record<AvatarSize, number> = { sm: 32, md: 40, lg: 56 };
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

const playground = definirPlayground({
  inicial: { name: 'Maria Costa', size: 'md', imagem: 'nenhuma' },
  controles: [
    { tipo: 'texto', nome: 'name' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'opcoes', nome: 'imagem', opcoes: IMAGENS },
  ],
  renderizar: (valores, registrar) => (
    <Avatar
      name={valores.name}
      onError={() => registrar('onError')}
      size={valores.size as AvatarSize}
      src={SRC_DA_IMAGEM[valores.imagem as (typeof IMAGENS)[number]]}
    />
  ),
  codigo: (valores) =>
    gerarJsx('Avatar', [
      ['name', valores.name],
      ['size', valores.size, 'md'],
      ['src', valores.imagem === 'nenhuma' ? undefined : expr('pessoa.foto')],
    ]),
  verificar: (valores) => {
    const nome = valores.name.trim();
    const partes = nome.split(/\s+/).filter(Boolean);
    const verificacoes: Verificacao[] = [
      nome
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${nome}", como alt da imagem ou aria-label das iniciais.` }
        : { nivel: 'falha', titulo: 'Sem nome', detalhe: 'O avatar vira "?" e não é anunciado. name é obrigatório.' },
    ];

    if (partes.length > 2) {
      verificacoes.push({ nivel: 'ok', titulo: 'Iniciais', detalhe: 'Só as duas primeiras palavras entram nas iniciais.' });
    }

    if (valores.imagem === 'quebrada') {
      verificacoes.push({ nivel: 'ok', titulo: 'Imagem indisponível', detalhe: 'A falha cai nas iniciais, com o mesmo nome acessível.' });
    }

    return verificacoes;
  },
});

function Variantes() {
  return (
    <div className="demo-row">
      {TAMANHOS.map((tamanho) => (
        <div className="cell-person" key={tamanho}>
          <Avatar name="Maria Costa" size={tamanho} />
          <div>
            <b>{tamanho}</b>
            <span>{MEDIDAS[tamanho]}px</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Sem <code>src</code></dt>
      <dd>
        Mostra as iniciais das duas primeiras palavras do nome, em maiúsculas, num <code>span</code> com{' '}
        <code>role=&quot;img&quot;</code> e o nome em <code>aria-label</code>. Nome de uma palavra só dá uma inicial.
      </dd>
      <dt>Com <code>src</code></dt>
      <dd>Renderiza um <code>img</code> com o nome em <code>alt</code>.</dd>
      <dt>Imagem que falha</dt>
      <dd>
        Cai nas iniciais e repassa o <code>onError</code>. Trocar o <code>src</code> tenta a imagem nova de novo.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Pessoa numa célula',
      descricao: 'O tamanho sm ao lado do nome e do e-mail, como na lista de membros.',
      Previa: () => (
        <div className="stack">
          {equipe.map((pessoa) => (
            <div className="cell-person" key={pessoa.email}>
              <Avatar name={pessoa.nome} size="sm" />
              <div>
                <b>{pessoa.nome}</b>
                <span>{pessoa.email}</span>
              </div>
            </div>
          ))}
        </div>
      ),
      codigo:
        '<div className="cell-person">\n  <Avatar name={pessoa.nome} size="sm" />\n  <div>\n    <b>{pessoa.nome}</b>\n    <span>{pessoa.email}</span>\n  </div>\n</div>',
    },
    {
      titulo: 'Cabeçalho de perfil',
      descricao: 'O lg com foto; se a imagem falhar, as iniciais ocupam o lugar.',
      Previa: () => (
        <div className="cell-person">
          <Avatar name="Rafael Alves" size="lg" src={FOTO} />
          <div>
            <b>Rafael Alves</b>
            <span>Administrador</span>
          </div>
        </div>
      ),
      codigo: '<Avatar name="Rafael Alves" size="lg" src={usuario.foto} />',
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
  ],
  Variantes,
  Modos,
  garantias: [
    { garantia: 'Nome acessível', como: <>As iniciais têm <code>role=&quot;img&quot;</code> e <code>aria-label</code>; a imagem, <code>alt</code>. Os dois com o <code>name</code>.</>, teste: 'Avatar.test.tsx' },
    { garantia: 'Imagem que falha', como: 'Volta às iniciais, sem perder o nome.', teste: 'Avatar.test.tsx' },
  ],
  notaDaApi: 'Além destas, os atributos HTML válidos tanto em <span> quanto em <img>.',
  api: [
    { nome: 'name', tipo: 'string', descricao: 'Obrigatório. Nome acessível e origem das iniciais.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: '32, 40 ou 56px.' },
    { nome: 'src', tipo: 'string', descricao: 'Endereço da imagem. Sem ele, ou se ela falhar, ficam as iniciais.' },
    { nome: 'onError', tipo: '(event) => void', descricao: 'Chamado quando a imagem não carrega, depois da troca pelas iniciais.' },
  ],
};
