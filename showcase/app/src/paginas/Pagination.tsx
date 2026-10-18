import { useState } from 'react';
import { Pagination } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

function PaginacaoDoPlayground({
  disabled,
  pageCount,
  registrar,
  siblings,
}: {
  disabled: boolean;
  pageCount: number;
  registrar: (evento: string) => void;
  siblings: number;
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
      siblings={siblings}
    />
  );
}

const playground = definirPlayground({
  inicial: { pageCount: 20, siblings: 1, disabled: false },
  controles: [
    { tipo: 'numero', nome: 'pageCount', min: 0, max: 200 },
    { tipo: 'numero', nome: 'siblings', min: 0, max: 4 },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <PaginacaoDoPlayground
      disabled={valores.disabled}
      pageCount={valores.pageCount}
      registrar={registrar}
      siblings={valores.siblings}
    />
  ),
  codigo: (valores) =>
    gerarJsx('Pagination', [
      ['page', expr('pagina')],
      ['pageCount', valores.pageCount],
      ['siblings', valores.siblings, 1],
      ['disabled', valores.disabled, false],
      ['onPageChange', expr('setPagina')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      { nivel: 'ok', titulo: 'Botões nomeados', detalhe: '"Página N", "Página anterior" e "Próxima página"; a atual com aria-current.' },
    ];

    if (valores.pageCount <= 1) {
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
      como: 'Cada botão nomeado: "Página 6", "Página anterior", "Próxima página".',
      teste: 'Pagination.test.tsx',
    },
    {
      garantia: 'Foco preservado',
      como: <>Borda e <code>disabled</code> usam <code>aria-disabled</code>; o botão não sai da tabulação.</>,
      teste: 'Pagination.test.tsx',
    },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <nav> e o ref.',
  api: [
    { nome: 'page', tipo: 'number', descricao: 'Obrigatória. Página atual, a partir de 1.' },
    { nome: 'pageCount', tipo: 'number', descricao: 'Obrigatória. Total de páginas.' },
    { nome: 'onPageChange', tipo: '(page: number) => void', descricao: 'Obrigatória. Recebe a página escolhida.' },
    { nome: 'siblings', tipo: 'number', padrao: '1', descricao: 'Páginas mostradas de cada lado da atual.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Suspende a troca; os botões continuam focáveis.' },
    { nome: 'label', tipo: 'string', padrao: "'Paginação'", descricao: 'Nome da região de navegação.' },
  ],
};
