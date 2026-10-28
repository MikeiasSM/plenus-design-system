import { useState } from 'react';
import { Pagination } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

function PaginacaoDoPlayground({
  disabled,
  pageCount,
  pageSize,
  registrar,
  siblings,
  totalItems,
}: {
  disabled: boolean;
  pageCount: number;
  pageSize?: number;
  registrar: (evento: string) => void;
  siblings: number;
  totalItems?: number;
}) {
  const [pagina, setPagina] = useState(1);

  return (
    <Pagination
      disabled={disabled}
      onPageChange={(escolhida) => {
        registrar(`onPageChange: ${escolhida}`);
        setPagina(escolhida);
      }}
      page={pagina}
      pageCount={pageCount}
      pageSize={pageSize}
      siblings={siblings}
      totalItems={totalItems}
    />
  );
}

/** Com `totalItems`, o total de páginas sai dele, como no produto; sem ele, do controle `pageCount`. */
function paginasDo(valores: { pageCount: number; pageSize: number; totalItems: number }) {
  return valores.totalItems > 0 ? Math.ceil(valores.totalItems / Math.max(valores.pageSize, 1)) : valores.pageCount;
}

const playground = definirPlayground({
  inicial: { pageCount: 20, totalItems: 0, pageSize: 25, siblings: 1, disabled: false },
  controles: [
    { tipo: 'numero', nome: 'pageCount', min: 0, max: 200 },
    { tipo: 'numero', nome: 'totalItems', min: 0, max: 10000 },
    { tipo: 'numero', nome: 'pageSize', min: 1, max: 500 },
    { tipo: 'numero', nome: 'siblings', min: 0, max: 4 },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <PaginacaoDoPlayground
      disabled={valores.disabled}
      pageCount={paginasDo(valores)}
      pageSize={valores.totalItems > 0 ? valores.pageSize : undefined}
      registrar={registrar}
      siblings={valores.siblings}
      totalItems={valores.totalItems > 0 ? valores.totalItems : undefined}
    />
  ),
  codigo: (valores) =>
    gerarJsx('Pagination', [
      ['page', expr('pagina')],
      ['pageCount', valores.totalItems > 0 ? expr('Math.ceil(totalItems / pageSize)') : valores.pageCount],
      ['totalItems', valores.totalItems > 0 ? valores.totalItems : undefined],
      ['pageSize', valores.totalItems > 0 ? valores.pageSize : undefined],
      ['siblings', valores.siblings, 1],
      ['disabled', valores.disabled, false],
      ['onPageChange', expr('setPagina')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      { nivel: 'ok', titulo: 'Botões nomeados', detalhe: '"Página N", "Página anterior" e "Próxima página"; a atual com aria-current.' },
    ];

    if (valores.totalItems > 0) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Intervalo anunciado',
        detalhe: 'Região viva com role="status": a troca de página anuncia "Itens 26 a 50 de 52", sem o travessão.',
      });
    }

    if (paginasDo(valores) <= 1) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Nada a paginar', detalhe: 'Com uma página ou menos, o componente não renderiza nada.' });
    }

    if (valores.disabled) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Suspensa sem perder o foco',
        detalhe: 'aria-disabled, e não disabled: os botões continuam focáveis enquanto a página carrega.',
      });
    }

    return verificacoes;
  },
});

function Carregando() {
  const [pagina, setPagina] = useState(3);
  const [carregando, setCarregando] = useState(false);

  function irPara(escolhida: number) {
    setCarregando(true);
    setTimeout(() => {
      setPagina(escolhida);
      setCarregando(false);
    }, 800);
  }

  return <Pagination disabled={carregando} onPageChange={irPara} page={pagina} pageCount={12} />;
}

function Longo() {
  const [pagina, setPagina] = useState(1);
  return <Pagination onPageChange={setPagina} page={pagina} pageCount={20} />;
}

function ComIntervalo() {
  const [pagina, setPagina] = useState(25);
  return <Pagination onPageChange={setPagina} page={pagina} pageCount={88} pageSize={50} totalItems={4380} />;
}

function RodapeDeTabela() {
  return <Pagination pageSizeOptions={[25, 50, 100]} showFirstLast totalItems={4380} />;
}

function Variantes() {
  return (
    <div>
      {[0, 1, 2].map((vizinhos) => (
        <div className="subsection" key={vizinhos}>
          <h3>
            <code>siblings={vizinhos}</code>
          </h3>
          <Pagination onPageChange={() => undefined} page={10} pageCount={20} siblings={vizinhos} />
        </div>
      ))}
      <p className="note">
        Primeira e última página ficam sempre visíveis. A faixa tem sempre as mesmas vagas: perto da ponta a janela encosta
        nela em vez de encolher, e a reticência nunca esconde uma página só.
      </p>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Conjunto curto</dt>
      <dd>
        Quando todas as páginas cabem nas vagas — sete, com <code>siblings=1</code> —, a reticência some, porque não
        economizaria espaço.
      </dd>
      <dt>Uma página</dt>
      <dd>Com <code>pageCount</code> até 1, não renderiza nada.</dd>
      <dt>Bordas</dt>
      <dd>
        Na primeira e na última página, o passo correspondente leva <code>aria-disabled</code> e ignora o clique, mas
        continua focável: o foco de quem acabou de usá-lo não se perde.
      </dd>
      <dt><code>disabled</code></dt>
      <dd>Suspende a troca de página, como enquanto a pedida carrega. Os botões continuam focáveis.</dd>
      <dt><code>totalItems</code> e <code>pageSize</code></dt>
      <dd>
        Juntos, mostram à esquerda o intervalo da página atual, como <code>1.201–1.250 de 4.380</code>. O texto é região
        viva: a troca de página o anuncia uma vez, numa forma falada sem o travessão. <code>formatRange</code> troca o
        texto, e o que ele devolver é também o que se anuncia.
      </dd>
      <dt><code>pageSizeOptions</code></dt>
      <dd>
        Mostra o seletor de itens por página. Ao trocar o tamanho, a página passa à que contém o primeiro item da atual,
        e o componente chama <code>onPageSizeChange</code> e, se a página mudou, <code>onPageChange</code>. Com o seletor,
        o componente fica na tela mesmo com uma página só, para a pessoa voltar a um tamanho menor. O{' '}
        <code>disabled</code> não suspende o seletor.
      </dd>
      <dt><code>pageCount</code> ausente</dt>
      <dd>Sai de <code>totalItems</code> e do tamanho da página.</dd>
      <dt><code>page</code> fora da faixa</dt>
      <dd>É limitada entre 1 e <code>pageCount</code>.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Conjunto longo',
      descricao: 'Vinte páginas: reticência dos lados conforme a atual se move.',
      Previa: Longo,
      codigo: '<Pagination\n  page={pagina}\n  pageCount={20}\n  onPageChange={setPagina}\n/>',
    },
    {
      titulo: 'Conjunto curto',
      descricao: 'Cinco páginas cabem inteiras, sem reticência.',
      Previa: () => <Pagination onPageChange={() => undefined} page={2} pageCount={5} />,
      codigo: '<Pagination page={2} pageCount={5} onPageChange={setPagina} />',
    },
    {
      titulo: 'Com o intervalo e o total',
      descricao: 'Com totalItems e pageSize, o componente calcula e mostra as linhas da página atual.',
      Previa: ComIntervalo,
      largo: true,
      codigo:
        '<Pagination\n  page={pagina}\n  pageCount={Math.ceil(total / 50)}\n  pageSize={50}\n  totalItems={total}\n  onPageChange={setPagina}\n/>',
    },
    {
      titulo: 'Rodapé de tabela',
      descricao:
        'Seletor de itens por página e passos para as pontas. Sem controle, o total de páginas sai do total de itens e do tamanho.',
      Previa: RodapeDeTabela,
      largo: true,
      codigo:
        '<Pagination\n  totalItems={total}\n  pageSizeOptions={[25, 50, 100]}\n  showFirstLast\n  onPageChange={setPagina}\n  onPageSizeChange={setTamanho}\n/>',
    },
    {
      titulo: 'Enquanto a página carrega',
      descricao: 'Clique numa página: a troca fica suspensa por 0,8s, sem tirar o foco do botão.',
      Previa: Carregando,
      codigo:
        '<Pagination\n  page={pagina}\n  pageCount={12}\n  disabled={carregando}\n  onPageChange={carregarPagina}\n/>',
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre os passos e as páginas; os passos na borda continuam focáveis.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Vai à página ou dá o passo, exceto na borda ou em disabled.' },
  ],
  garantias: [
    {
      garantia: 'Página atual',
      como: <>Botão da atual com <code>aria-current=&quot;page&quot;</code>.</>,
      teste: 'Pagination.test.tsx',
    },
    {
      garantia: 'Nomes completos',
      como: 'Cada botão nomeado: "Página 6", "Página anterior", "Próxima página", "Primeira página", "Última página".',
      teste: 'Pagination.test.tsx',
    },
    {
      garantia: 'Foco preservado',
      como: <>Borda e <code>disabled</code> usam <code>aria-disabled</code>; o botão não sai da tabulação.</>,
      teste: 'Pagination.test.tsx',
    },
    {
      garantia: 'Intervalo anunciado',
      como: <>Uma só região <code>role=&quot;status&quot;</code>, com a forma falada “Itens 26 a 50 de 52”.</>,
      teste: 'Pagination.test.tsx',
    },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <nav> e o ref.',
  api: [
    { nome: 'page', tipo: 'number', descricao: 'Página atual, a partir de 1, no modo controlado.' },
    { nome: 'defaultPage', tipo: 'number', padrao: '1', descricao: 'Página inicial, no modo não controlado.' },
    { nome: 'pageCount', tipo: 'number', descricao: 'Total de páginas. Sem ela, sai de totalItems e pageSize.' },
    { nome: 'onPageChange', tipo: '(page: number) => void', descricao: 'Recebe a página escolhida.' },
    { nome: 'siblings', tipo: 'number', padrao: '1', descricao: 'Páginas mostradas de cada lado da atual.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Suspende a troca; os botões continuam focáveis.' },
    { nome: 'label', tipo: 'string', padrao: "'Paginação'", descricao: 'Nome da região de navegação.' },
    { nome: 'totalItems', tipo: 'number', descricao: 'Total de itens. Com pageSize, mostra o intervalo da página.' },
    { nome: 'pageSize', tipo: 'number', descricao: 'Itens por página, no modo controlado. Com totalItems, mostra o intervalo.' },
    {
      nome: 'defaultPageSize',
      tipo: 'number',
      padrao: 'pageSizeOptions[0]',
      descricao: 'Itens por página iniciais, no modo não controlado.',
    },
    { nome: 'pageSizeOptions', tipo: 'readonly number[]', descricao: 'Tamanhos oferecidos; mostra o seletor.' },
    {
      nome: 'onPageSizeChange',
      tipo: '(pageSize: number) => void',
      descricao: 'Recebe o tamanho escolhido; a página muda junto pelo onPageChange.',
    },
    { nome: 'showFirstLast', tipo: 'boolean', padrao: 'false', descricao: 'Mostra os passos para a primeira e a última página.' },
    {
      nome: 'formatRange',
      tipo: '(range: { start: number; end: number; total: number }) => string',
      padrao: "'1.201–1.250 de 4.380'",
      descricao: 'Troca o texto do intervalo; o devolvido é também o anunciado.',
    },
  ],
};
