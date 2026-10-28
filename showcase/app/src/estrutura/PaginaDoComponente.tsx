import { useState, type ReactNode } from 'react';
import { Badge, Button, Card, CodeBlock, EmptyState, Table } from '@plenustech/design-system';
import type { ComponenteDoCatalogo } from '../catalogo';
import { Playground } from './Playground';
import type { Exemplo, FacaOuEvite, Garantia, LinhaDaApi, Pagina, Tecla } from './tipos';

interface Secao {
  conteudo: ReactNode;
  id: string;
  subtitulo: string;
  titulo: string;
}

function CartaoDeExemplo({ exemplo }: { exemplo: Exemplo }) {
  const [aberto, setAberto] = useState(false);
  const { Previa } = exemplo;

  return (
    <article className={exemplo.largo ? 'example example-wide' : 'example'}>
      <div className="example-preview">
        <Previa />
      </div>
      <div className="example-body">
        <h3>{exemplo.titulo}</h3>
        <p>{exemplo.descricao}</p>
        <Button aria-expanded={aberto} onClick={() => setAberto(!aberto)} size="sm" variant="ghost">
          {aberto ? 'Ocultar código' : 'Ver código'}
        </Button>
      </div>
      {aberto && <CodeBlock className="example-code" code={exemplo.codigo} syntax="tsx" />}
    </article>
  );
}

function Quadro({ item, tipo }: { item: FacaOuEvite; tipo: 'faca' | 'evite' }) {
  const { Previa } = item;

  return (
    <article className="dodont">
      <header className={`dodont-head dodont-${tipo}`}>{tipo === 'faca' ? 'Faça' : 'Evite'}</header>
      <div className="dodont-preview">
        <Previa />
      </div>
      <p className="dodont-text">{item.texto}</p>
    </article>
  );
}

function TabelaDoTeclado({ teclas }: { teclas: readonly Tecla[] }) {
  const linhas = teclas.map((tecla, indice) => ({ ...tecla, id: String(indice) }));

  return (
    <Card>
      <Card.Body flush>
        <Table label="Teclado">
          <Table.Header>
            <Table.Column id="tecla" width="200px">Tecla</Table.Column>
            <Table.Column id="acao">Ação</Table.Column>
          </Table.Header>
          <Table.Body items={linhas}>
            {(linha) => (
              <Table.Row id={linha.id}>
                <Table.Cell>
                  {linha.teclas.map((tecla) => (
                    <kbd className="key" key={tecla}>{tecla}</kbd>
                  ))}
                </Table.Cell>
                <Table.Cell>{linha.acao}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
}

function TabelaDeGarantias({ garantias }: { garantias: readonly Garantia[] }) {
  const linhas = garantias.map((garantia, indice) => ({ ...garantia, id: String(indice) }));

  return (
    <Card>
      <Card.Body flush>
        <Table label="Garantias de acessibilidade">
          <Table.Header>
            <Table.Column id="garantia" width="200px">Garantia</Table.Column>
            <Table.Column id="como">Como</Table.Column>
            <Table.Column hideBelow="sm" id="teste" width="200px">Teste</Table.Column>
          </Table.Header>
          <Table.Body items={linhas}>
            {(linha) => (
              <Table.Row id={linha.id}>
                <Table.Cell>{linha.garantia}</Table.Cell>
                <Table.Cell>{linha.como}</Table.Cell>
                <Table.Cell>
                  <code>{linha.teste}</code>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
}

function TabelaDaApi({ linhas }: { linhas: readonly LinhaDaApi[] }) {
  const itens = linhas.map((linha) => ({ ...linha, id: linha.nome }));

  return (
    <Card>
      <Card.Body flush>
        <Table label="Propriedades">
          <Table.Header>
            <Table.Column id="nome">Propriedade</Table.Column>
            <Table.Column id="tipo">Tipo</Table.Column>
            <Table.Column hideBelow="sm" id="padrao">Padrão</Table.Column>
            <Table.Column id="descricao">Descrição</Table.Column>
          </Table.Header>
          <Table.Body items={itens}>
            {(linha) => (
              <Table.Row id={linha.id}>
                <Table.Cell>
                  <code>{linha.nome}</code>
                </Table.Cell>
                <Table.Cell>
                  <code className="api-type">{linha.tipo}</code>
                </Table.Cell>
                <Table.Cell>{linha.padrao ? <code>{linha.padrao}</code> : '—'}</Table.Cell>
                <Table.Cell>{linha.descricao}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
}

function secoesDa(pagina: Pagina): Secao[] {
  const secoes: Secao[] = [];
  const { Modos, Variantes } = pagina;

  if (pagina.playground) {
    secoes.push({
      conteudo: <Playground definicao={pagina.playground} />,
      id: 'playground',
      subtitulo: 'Mude as propriedades e use o componente de verdade: o código, os eventos e as verificações acompanham.',
      titulo: 'Playground',
    });
  }

  if (pagina.exemplos?.length || pagina.faca) {
    secoes.push({
      conteudo: (
        <>
          {pagina.exemplos?.length ? (
            <div className="examples">
              {pagina.exemplos.map((exemplo) => (
                <CartaoDeExemplo exemplo={exemplo} key={exemplo.titulo} />
              ))}
            </div>
          ) : null}
          {pagina.faca && pagina.evite && (
            <div className="dodonts">
              <Quadro item={pagina.faca} tipo="faca" />
              <Quadro item={pagina.evite} tipo="evite" />
            </div>
          )}
        </>
      ),
      id: 'uso',
      subtitulo: 'Situações reais, cada uma com o código pronto para copiar.',
      titulo: 'Exemplos de uso',
    });
  }

  if (Variantes) {
    secoes.push({
      conteudo: <Variantes />,
      id: 'variantes',
      subtitulo: 'As combinações lado a lado, no componente real.',
      titulo: 'Variantes',
    });
  }

  if (Modos) {
    secoes.push({
      conteudo: <Modos />,
      id: 'modos',
      subtitulo: 'Estados, modos de uso e composições.',
      titulo: 'Modos e estados',
    });
  }

  if (pagina.teclado?.length || pagina.garantias?.length) {
    secoes.push({
      conteudo: (
        <div className="stack">
          {pagina.teclado?.length ? <TabelaDoTeclado teclas={pagina.teclado} /> : null}
          {pagina.garantias?.length ? <TabelaDeGarantias garantias={pagina.garantias} /> : null}
        </div>
      ),
      id: 'acessibilidade',
      subtitulo: 'O que o componente garante sozinho, e o teste que cobre cada garantia.',
      titulo: 'Acessibilidade',
    });
  }

  if (pagina.api?.length) {
    secoes.push({
      conteudo: <TabelaDaApi linhas={pagina.api} />,
      id: 'api',
      subtitulo: '',
      titulo: 'API',
    });
  }

  return secoes;
}

export function PaginaDoComponente({ componente, familia }: { componente: ComponenteDoCatalogo; familia: string }) {
  const secoes = componente.pagina ? secoesDa(componente.pagina) : [];
  const caminho = `#/${componente.nome.toLowerCase()}`;

  return (
    <div className="page">
      <article className="page-content">
        <p className="crumb">{familia}</p>
        <div className="page-title">
          <h1>{componente.nome}</h1>
          {componente.previsto ? <Badge>Previsto</Badge> : <Badge tone="success">Disponível</Badge>}
        </div>
        <p className="page-lead">{componente.papel}</p>
        {!componente.previsto && (
          <CodeBlock
            className="page-import"
            code={`import { ${componente.importa ?? componente.nome} } from '@plenustech/design-system';`}
            language="Importação"
            syntax="typescript"
          />
        )}

        {secoes.length === 0 && (
          <EmptyState
            description={componente.previsto ? 'Previsto no catálogo, ainda não implementado.' : 'Esta página ainda não foi escrita.'}
            size="sm"
            title="Sem demonstração"
          />
        )}

        {secoes.map((secao) => (
          <section aria-labelledby={`secao-${secao.id}`} className="section" id={secao.id} key={secao.id}>
            <h2 id={`secao-${secao.id}`}>{secao.titulo}</h2>
            {secao.subtitulo && <p className="section-sub">{secao.subtitulo}</p>}
            {secao.id === 'api' && componente.pagina?.notaDaApi && (
              <p className="section-sub">{componente.pagina.notaDaApi}</p>
            )}
            {secao.conteudo}
          </section>
        ))}
      </article>

      {secoes.length > 1 && (
        <nav aria-label="Nesta página" className="toc">
          <p>Nesta página</p>
          {secoes.map((secao) => (
            <a href={`${caminho}/${secao.id}`} key={secao.id}>
              {secao.titulo}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
