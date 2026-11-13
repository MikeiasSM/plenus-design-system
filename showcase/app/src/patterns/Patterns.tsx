import type { ReactNode } from 'react';
import { Card, LinkList, Table } from '@plenustech/design-system';
import { familias } from '../catalogo';
import { useVerCodigo } from '../estrutura/VerCodigo';
import { CAMINHO_DOS_PATTERNS, patterns } from './catalogo';
import type { ExemploDoPattern, Pattern } from './tipos';
import './patterns.css';

const COMPONENTES_DO_CATALOGO = new Set(familias.flatMap((familia) => familia.componentes.map((componente) => componente.nome)));

/** `AppShell.Page` leva à página do `AppShell`: o que vem antes do ponto é o componente. */
function paginaDoComponente(nome: string) {
  const base = nome.split('.')[0];

  return COMPONENTES_DO_CATALOGO.has(base) ? `#/${base.toLowerCase()}` : undefined;
}

function IndiceDosPatterns() {
  return (
    <article className="page-content overview">
      <p className="crumb">Patterns</p>
      <div className="page-title">
        <h1>Patterns</h1>
      </div>
      <p className="page-lead">
        Um pattern é a forma recomendada de montar um aspecto comum da interface com os componentes que já existem, como o painel de filtros, o
        menu de ações de uma página ou o controle do usuário. Não é componente: não tem API, não é exportado pelo pacote e muda junto com os
        componentes que combina. O produto copia a montagem e a adapta ao seu caso.
      </p>
      <Card>
        <Card.Body flush>
          <LinkList aria-label="Patterns" layout="grid">
            {patterns.map((pattern) => (
              <LinkList.Item description={pattern.resumo} href={`${CAMINHO_DOS_PATTERNS}/${pattern.id}`} key={pattern.id} title={pattern.nome} />
            ))}
          </LinkList>
        </Card.Body>
      </Card>
    </article>
  );
}

function Lista({ itens }: { itens: readonly ReactNode[] }) {
  return (
    <ul className="pattern-lista">
      {itens.map((item, indice) => (
        <li key={indice}>{item}</li>
      ))}
    </ul>
  );
}

function CartaoDoExemplo({ exemplo }: { exemplo: ExemploDoPattern }) {
  const { bloco, botao } = useVerCodigo(exemplo.codigo, 'example-code');
  const { Componente } = exemplo;

  return (
    <article className="example example-wide">
      <div className={exemplo.altura ? 'example-preview pattern-preview pattern-preview-moldura' : 'example-preview pattern-preview'}>
        {exemplo.altura ? (
          <div className="pattern-moldura" style={{ height: exemplo.altura }}>
            <Componente />
          </div>
        ) : (
          <Componente />
        )}
      </div>
      <div className="example-body">
        <h3>{exemplo.titulo}</h3>
        <p>{exemplo.descricao}</p>
        {botao}
      </div>
      {bloco}
    </article>
  );
}

function TabelaDosComponentes({ pattern }: { pattern: Pattern }) {
  const linhas = pattern.componentes.map((componente) => ({ ...componente, id: componente.nome }));

  return (
    <Card>
      <Card.Body flush>
        <Table label="Componentes do pattern">
          <Table.Header>
            <Table.Column id="nome" width="260px">Componente</Table.Column>
            <Table.Column id="papel">Papel na montagem</Table.Column>
          </Table.Header>
          <Table.Body items={linhas}>
            {(linha) => {
              const href = paginaDoComponente(linha.nome);

              return (
                <Table.Row id={linha.id}>
                  <Table.Cell>{href ? <a href={href}><code>{linha.nome}</code></a> : <code>{linha.nome}</code>}</Table.Cell>
                  <Table.Cell>{linha.papel}</Table.Cell>
                </Table.Row>
              );
            }}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
}

interface Secao {
  conteudo: ReactNode;
  id: string;
  subtitulo?: ReactNode;
  titulo: string;
}

function secoesDe(pattern: Pattern): Secao[] {
  return [
    {
      id: 'problema',
      titulo: 'O problema e quando usar',
      conteudo: (
        <>
          <p className="pattern-texto">{pattern.problema}</p>
          <Lista itens={pattern.quando} />
        </>
      ),
    },
    {
      id: 'componentes',
      titulo: 'Componentes que combina',
      subtitulo: 'O papel de cada um segue o catálogo; o pattern só os põe na ordem e no arranjo certos.',
      conteudo: <TabelaDosComponentes pattern={pattern} />,
    },
    {
      id: 'exemplo',
      titulo: pattern.exemplos.length > 1 ? 'Exemplos e código' : 'Exemplo e código',
      subtitulo: 'Funciona de verdade, e o código é o do próprio exemplo: copie e adapte.',
      conteudo: (
        <>
          <div className="examples">
            {pattern.exemplos.map((exemplo) => (
              <CartaoDoExemplo exemplo={exemplo} key={exemplo.titulo} />
            ))}
          </div>
          {pattern.tela && (
            <p className="note">
              A mesma montagem, numa tela inteira, em <a href={`#/composicoes/${pattern.tela.id}`}>Composições: {pattern.tela.nome}</a>.
            </p>
          )}
        </>
      ),
    },
    {
      id: 'decisoes',
      titulo: 'Acessibilidade e comportamento',
      subtitulo: 'O que a montagem precisa manter, ou deixa de ser a recomendada.',
      conteudo: (
        <div className="subsection-pair">
          <div className="subsection">
            <h3>Acessibilidade</h3>
            <Lista itens={pattern.acessibilidade} />
          </div>
          <div className="subsection">
            <h3>Comportamento</h3>
            <Lista itens={pattern.comportamento} />
          </div>
        </div>
      ),
    },
    {
      id: 'variacoes',
      titulo: 'Variações e o que evitar',
      conteudo: (
        <div className="subsection-pair">
          <div className="subsection">
            <h3>Variações aceitas</h3>
            <Lista itens={pattern.variacoes} />
          </div>
          <div className="subsection">
            <h3>Evite</h3>
            <Lista itens={pattern.evitar} />
          </div>
        </div>
      ),
    },
  ];
}

function PaginaDoPattern({ pattern }: { pattern: Pattern }) {
  const secoes = secoesDe(pattern);
  const caminho = `${CAMINHO_DOS_PATTERNS}/${pattern.id}`;

  return (
    <div className="page">
      <article className="page-content">
        <p className="crumb">
          <a href={CAMINHO_DOS_PATTERNS}>Patterns</a>
        </p>
        <div className="page-title">
          <h1>{pattern.nome}</h1>
        </div>
        <p className="page-lead">{pattern.resumo}</p>
        {secoes.map((secao) => (
          <section aria-labelledby={`secao-${secao.id}`} className="section" id={secao.id} key={secao.id}>
            <h2 id={`secao-${secao.id}`}>{secao.titulo}</h2>
            {secao.subtitulo && <p className="section-sub">{secao.subtitulo}</p>}
            {secao.conteudo}
          </section>
        ))}
      </article>
      <nav aria-label="Nesta página" className="toc">
        <p>Nesta página</p>
        {secoes.map((secao) => (
          <a href={`${caminho}/${secao.id}`} key={secao.id}>
            {secao.titulo}
          </a>
        ))}
      </nav>
    </div>
  );
}

/** O índice, ou a página do pattern escolhido. */
export function Patterns({ pattern: id }: { pattern: string }) {
  const pattern = patterns.find((candidato) => candidato.id === id);

  return pattern ? <PaginaDoPattern key={pattern.id} pattern={pattern} /> : <IndiceDosPatterns />;
}
