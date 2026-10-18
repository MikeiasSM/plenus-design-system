import { useEffect, useState } from 'react';
import { Avatar, Button, Skeleton, type SkeletonShape } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const FORMAS = ['line', 'circle', 'block'] as const;

/** Só dígitos vira pixel, como o componente faz com número; o resto passa como medida CSS. */
function medida(texto: string) {
  if (!texto.trim()) {
    return undefined;
  }

  return /^\d+$/.test(texto.trim()) ? Number(texto) : texto;
}

const playground = definirPlayground({
  inicial: { shape: 'line', width: '60%', height: '', ariaBusy: true },
  controles: [
    { tipo: 'opcoes', nome: 'shape', opcoes: FORMAS },
    { tipo: 'texto', nome: 'width' },
    { tipo: 'texto', nome: 'height' },
    { tipo: 'booleano', nome: 'ariaBusy' },
  ],
  renderizar: (valores) => (
    <div aria-busy={valores.ariaBusy || undefined} style={{ width: '100%' }}>
      <Skeleton height={medida(valores.height)} shape={valores.shape as SkeletonShape} width={medida(valores.width)} />
    </div>
  ),
  codigo: (valores) => {
    const esqueleto = gerarJsx('Skeleton', [
      ['shape', valores.shape, 'line'],
      ['width', medida(valores.width)],
      ['height', medida(valores.height)],
    ]);

    return valores.ariaBusy ? `<div aria-busy="true">\n  ${esqueleto.replace(/\n/g, '\n  ')}\n</div>` : esqueleto;
  },
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      { nivel: 'ok', titulo: 'Fora da leitura', detalhe: 'O Skeleton sai sempre com aria-hidden.' },
      valores.ariaBusy
        ? { nivel: 'ok', titulo: 'Carregamento anunciado', detalhe: 'O contêiner marca aria-busy enquanto o conteúdo não chega.' }
        : {
            nivel: 'falha',
            titulo: 'Carregamento mudo',
            detalhe: 'Quem envolve os esqueletos anuncia o carregamento, com aria-busy ou uma mensagem de status.',
          },
    ];

    return verificacoes;
  },
});

function Cartao() {
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!carregando) {
      return;
    }

    const espera = setTimeout(() => setCarregando(false), 1500);
    return () => clearTimeout(espera);
  }, [carregando]);

  return (
    <div className="stack" style={{ width: '100%' }}>
      <div aria-busy={carregando || undefined} className="demo-box stack">
        {carregando ? (
          <>
            <div className="demo-row">
              <Skeleton shape="circle" />
              <div className="stack" style={{ flex: 1, gap: 8 }}>
                <Skeleton width="40%" />
                <Skeleton width="65%" />
              </div>
            </div>
            <Skeleton shape="block" />
          </>
        ) : (
          <>
            <div className="cell-person">
              <Avatar name="Ana Prado" />
              <div>
                <b>Ana Prado</b>
                <span>ana@plenustech.com</span>
              </div>
            </div>
            <p style={{ margin: 0 }}>Administradora desde março, responsável pelos módulos de faturamento e cobrança.</p>
          </>
        )}
      </div>
      <div>
        <Button disabled={carregando} onClick={() => setCarregando(true)} size="sm" variant="secondary">
          Recarregar
        </Button>
      </div>
    </div>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      {FORMAS.map((forma) => (
        <div className="demo-box stack" key={forma}>
          <Skeleton shape={forma} />
          <code>{forma}</code>
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Medida padrão</dt>
      <dd>
        Sem <code>width</code> e <code>height</code>, cada forma tem a sua: a linha ocupa a largura na altura de um texto,
        o círculo tem o tamanho de um avatar, o bloco a altura de uma área de conteúdo.
      </dd>
      <dt>Medida</dt>
      <dd>Número vira pixel; texto passa como medida CSS, como <code>60%</code> ou <code>2.5rem</code>.</dd>
      <dt>Movimento reduzido</dt>
      <dd>Com <code>prefers-reduced-motion</code>, o brilho para.</dd>
      <dt>Na <code>Table</code></dt>
      <dd>É a mesma barra que a tabela mostra enquanto carrega, com a mensagem de status só para o leitor de tela.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Cartão carregando',
      descricao: 'A forma do que vai chegar: avatar, duas linhas e o corpo. Depois de 1,5s, o conteúdo.',
      Previa: Cartao,
      codigo:
        '<div aria-busy={carregando}>\n  {carregando ? (\n    <>\n      <Skeleton shape="circle" />\n      <Skeleton width="40%" />\n      <Skeleton width="65%" />\n      <Skeleton shape="block" />\n    </>\n  ) : (\n    <Perfil pessoa={pessoa} />\n  )}\n</div>',
    },
    {
      titulo: 'Parágrafo',
      descricao: 'Linhas de larguras diferentes lembram texto corrido.',
      Previa: () => (
        <div aria-busy="true" className="stack" style={{ width: '100%', gap: 8 }}>
          <Skeleton />
          <Skeleton />
          <Skeleton width="80%" />
        </div>
      ),
      codigo: '<div aria-busy="true">\n  <Skeleton />\n  <Skeleton />\n  <Skeleton width="80%" />\n</div>',
    },
  ],
  Variantes,
  Modos,
  garantias: [
    {
      garantia: 'Decorativo',
      como: <>Sempre com <code>aria-hidden</code>; quem envolve anuncia o carregamento.</>,
      teste: 'Skeleton.test.tsx',
    },
    { garantia: 'Forma e medida', como: <><code>shape</code>, <code>width</code> e <code>height</code> chegam ao elemento.</>, teste: 'Skeleton.test.tsx' },
  ],
  notaDaApi: 'Além destas, todas as propriedades nativas de <span>; o style informado vence width e height.',
  api: [
    { nome: 'shape', tipo: "'line' | 'circle' | 'block'", padrao: "'line'", descricao: 'Linha de texto, avatar ou bloco.' },
    { nome: 'width', tipo: 'number | string', descricao: 'Número em pixels ou medida CSS.' },
    { nome: 'height', tipo: 'number | string', descricao: 'Sem ela, a altura da forma.' },
  ],
};
