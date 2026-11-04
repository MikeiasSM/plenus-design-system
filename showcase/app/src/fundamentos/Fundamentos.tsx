import type { ReactNode } from 'react';
import { Card, Table } from '@plenustech/design-system';
import { GradeDeCores, SeloDeNovo } from './Amostras';
import { tokens, tokensDe, type Token } from './tokens';
import './fundamentos.css';

interface Secao {
  conteudo: ReactNode;
  id: string;
  subtitulo: ReactNode;
  titulo: string;
}

const porNumero = (a: Token, b: Token) => a.nome.localeCompare(b.nome, undefined, { numeric: true });

const CORES_SEMANTICAS = [
  { titulo: 'Fundo, superfícies, borda e texto', padrao: /^--pl-color-(background|surface|border|text|ink|on-ink|scrim)/ },
  { titulo: 'Primária', padrao: /^--pl-color-(primary|on-primary)/ },
  { titulo: 'Sucesso, atenção, perigo e informação', padrao: /^--pl-color-(success|warning|danger|info|on-(success|warning|danger|info))/ },
];

const PAPEIS_TIPOGRAFICOS = tokensDe(/^--pl-type-[\w-]+-size$/).map(({ nome }) => nome.replace(/^--pl-type-|-size$/g, ''));

const usaFonteDeTitulo = (papel: string) => /^(display|headline|title)/.test(papel);

const camadas = tokensDe(/^--pl-z-/).sort((a, b) => Number(a.declarado) - Number(b.declarado) || a.nome.localeCompare(b.nome));

const ESTRATEGIA = [
  ['Tokens', 'Fonte dos valores visuais: primitivos e semânticos, em src/tokens, reunidos por src/styles/tokens.css.'],
  ['CSS global', 'Reset, normalização e regras do documento, em src/styles/reset.css e base.css. Nada específico de componente.'],
  ['Componentes', 'Um par Componente.tsx e Componente.module.css por componente, que consome tokens e não define cor, fonte, espaço ou raio próprios.'],
  ['CSS Modules', 'O escopo isola cada componente; alterar um não afeta outro implicitamente.'],
  ['Produtos', 'A composição de páginas fica nas aplicações que consomem o pacote, nunca no CSS global.'],
] as const;

function Cores() {
  return (
    <>
      {CORES_SEMANTICAS.map(({ padrao, titulo }) => (
        <div className="fundamentos-grupo" key={titulo}>
          <h3>{titulo}</h3>
          <GradeDeCores tokens={tokensDe(padrao)} />
        </div>
      ))}
      <div className="fundamentos-grupo">
        <h3>Paleta ativa</h3>
        <p className="section-sub">
          A rampa que alimenta a cor primária; <code>data-palette</code> troca a paleta em qualquer subárvore.
        </p>
        <GradeDeCores tokens={tokensDe(/^--pl-palette-/)} />
      </div>
      <div className="fundamentos-grupo">
        <h3>Séries dos gráficos</h3>
        <GradeDeCores tokens={tokensDe(/^--pl-chart-series-\d$/)} />
      </div>
      <div className="fundamentos-grupo">
        <h3>Primitivos</h3>
        <GradeDeCores tokens={tokensDe(/^--pl-(brand|neutral|status)-/)} />
      </div>
    </>
  );
}

function Tipografia() {
  return (
    <>
      <div className="fundamentos-grupo">
        <h3>Famílias</h3>
        <ul className="fundamentos-familias">
          {tokensDe(/^--pl-font-(heading|body|mono)$/).map(({ declarado, nome }) => (
            <li key={nome}>
              <code>{nome}</code>
              <span style={{ fontFamily: `var(${nome})`, fontSize: 'var(--pl-type-title-size)' }}>Pedido #48211 entregue em 7 de novembro</span>
              <small>{declarado}</small>
            </li>
          ))}
        </ul>
      </div>
      <div className="fundamentos-grupo">
        <h3>Escala</h3>
        <ul className="fundamentos-escala">
          {PAPEIS_TIPOGRAFICOS.map((papel) => {
            const valor = (campo: string) => tokens.find(({ nome }) => nome === `--pl-type-${papel}-${campo}`)?.declarado;

            return (
              <li key={papel}>
                <span>
                  <code>--pl-type-{papel}-*</code>
                  <SeloDeNovo nome={`--pl-type-${papel}-size`} />
                  <small>
                    {valor('size')} / {valor('line-height')} · {valor('weight')}
                  </small>
                </span>
                <span
                  style={{
                    fontFamily: papel === 'code' ? 'var(--pl-font-mono)' : usaFonteDeTitulo(papel) ? 'var(--pl-font-heading)' : 'var(--pl-font-body)',
                    fontSize: `var(--pl-type-${papel}-size)`,
                    fontWeight: `var(--pl-type-${papel}-weight)`,
                    lineHeight: `var(--pl-type-${papel}-line-height)`,
                  }}
                >
                  Base de Clientes e Pedidos
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

function Espacamento() {
  const medidas = [...tokensDe(/^--pl-space-\d$/).sort(porNumero), ...tokensDe(/^--pl-shell-gap$/)];

  return (
    <ul className="fundamentos-medidas">
      {medidas.map(({ declarado, nome }) => (
        <li key={nome}>
          <code>{nome}</code>
          <span className="fundamentos-barra" style={{ width: `var(${nome})` }} />
          <small>{declarado}</small>
          <SeloDeNovo nome={nome} />
        </li>
      ))}
    </ul>
  );
}

function RaiosESombras() {
  return (
    <div className="fundamentos-formas">
      {tokensDe(/^--pl-radius-/).map(({ declarado, nome }) => (
        <figure key={nome}>
          <span className="fundamentos-forma" style={{ borderRadius: `var(${nome})` }} />
          <figcaption>
            <code>{nome}</code>
            <small>{declarado.split(/\s/)[0]}</small>
          </figcaption>
        </figure>
      ))}
      {tokensDe(/^--pl-sh-\d$/).sort(porNumero).map(({ nome }) => (
        <figure key={nome}>
          <span className="fundamentos-forma" style={{ boxShadow: `var(${nome})` }} />
          <figcaption>
            <code>{nome}</code>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function Camadas() {
  return (
    <Card>
      <Card.Body flush>
        <Table label="Camadas fixas da biblioteca">
          <Table.Header>
            <Table.Column id="token">Token</Table.Column>
            <Table.Column id="valor" numeric width="120px">z-index</Table.Column>
          </Table.Header>
          <Table.Body items={camadas.map(({ declarado, nome }) => ({ id: nome, nome, declarado }))}>
            {(camada) => (
              <Table.Row id={camada.id}>
                <Table.Cell>
                  <code>{camada.nome}</code> <SeloDeNovo nome={camada.nome} />
                </Table.Cell>
                <Table.Cell>{camada.declarado}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
}

function EstrategiaDeCss() {
  return (
    <ol className="fundamentos-camadas">
      {ESTRATEGIA.map(([nome, descricao], indice) => (
        <li key={nome}>
          <span aria-hidden="true">{indice + 1}</span>
          <strong>{nome}</strong>
          <p>{descricao}</p>
        </li>
      ))}
    </ol>
  );
}

const SECOES: readonly Secao[] = [
  {
    id: 'cores',
    titulo: 'Cores',
    subtitulo: (
      <>
        Cada quadrado usa o próprio token; o valor é o que o tema atual resolve. Troque o tema no topo para ver os dois. Escalas e regras de
        uso: <code>TOKENS-REFERENCE-COLORS.md</code>.
      </>
    ),
    conteudo: <Cores />,
  },
  {
    id: 'tipografia',
    titulo: 'Tipografia',
    subtitulo: (
      <>
        Famílias, tamanhos, alturas de linha e pesos vêm dos tokens <code>--pl-type-*</code>. Papéis e regras:{' '}
        <code>TOKENS-REFERENCE-TYPOGRAPHY.md</code>.
      </>
    ),
    conteudo: <Tipografia />,
  },
  {
    id: 'espacamento',
    titulo: 'Espaçamento',
    subtitulo: (
      <>
        Escala de base 4px. O <code>--pl-shell-gap</code> é a única medida fora dela: separa as folhas do <code>AppShell</code>. Regra em{' '}
        <code>TOKENS.md</code> §5.
      </>
    ),
    conteudo: <Espacamento />,
  },
  {
    id: 'raios-e-sombras',
    titulo: 'Raios e sombras',
    subtitulo: (
      <>
        O raio médio é a base do sistema. As três elevações sobem de sutil a modal. Regra em <code>TOKENS.md</code> §7.
      </>
    ),
    conteudo: <RaiosESombras />,
  },
  {
    id: 'camadas',
    titulo: 'Camadas',
    subtitulo: (
      <>
        A ordem das camadas fixas é token: um produto com escala própria redefine estes valores no <code>:root</code> para encaixar a
        biblioteca. Os painéis posicionados pelo React Aria não dependem dele. Regra em <code>TOKENS.md</code> §7.
      </>
    ),
    conteudo: <Camadas />,
  },
  {
    id: 'estrategia-de-css',
    titulo: 'Estratégia de CSS',
    subtitulo: (
      <>
        Cada camada tem uma responsabilidade e só enxerga as de cima. A decisão está em <code>ARCHITECTURE.md</code> §4.
      </>
    ),
    conteudo: <EstrategiaDeCss />,
  },
];

export function Fundamentos() {
  return (
    <div className="page">
      <article className="page-content">
        <p className="crumb">Plenustech Design System</p>
        <div className="page-title">
          <h1>Fundamentos</h1>
        </div>
        <p className="page-lead">
          A base do sistema visual, desenhada a partir dos tokens do pacote: os nomes e os valores são lidos de <code>src/tokens</code> e de{' '}
          <code>src/styles/tokens.css</code>. O conteúdo normativo continua em <code>TOKENS.md</code> e nos dois documentos de referência; esta
          página os ilustra e aponta para eles.
        </p>
        {SECOES.map((secao) => (
          <section aria-labelledby={`secao-${secao.id}`} className="section" id={secao.id} key={secao.id}>
            <h2 id={`secao-${secao.id}`}>{secao.titulo}</h2>
            <p className="section-sub">{secao.subtitulo}</p>
            {secao.conteudo}
          </section>
        ))}
      </article>
      <nav aria-label="Nesta página" className="toc">
        <p>Nesta página</p>
        {SECOES.map((secao) => (
          <a href={`#/fundamentos/${secao.id}`} key={secao.id}>
            {secao.titulo}
          </a>
        ))}
      </nav>
    </div>
  );
}
