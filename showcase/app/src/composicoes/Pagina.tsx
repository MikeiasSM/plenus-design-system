import type { CSSProperties, ReactNode } from 'react';
import { AppShell, Badge, Breadcrumb, Card } from '@plenustech/design-system';
import { SITUACOES, type SituacaoDoPedido } from './dados';

/** Larguras da coluna de conteúdo, de APPSHELL.md: total, larga (1120), do índice (1000) e estreita (760). */
export type LarguraDaColuna = 'total' | 760 | 1000 | 1120;

export function larguraCss(largura: LarguraDaColuna) {
  return largura === 'total' ? undefined : `${largura}px`;
}

interface PaginaProps {
  caminho: readonly string[];
  children: ReactNode;
}

/** A folha da página: a barra com o caminho e o corpo, a única área que rola. */
export function Pagina({ caminho, children }: PaginaProps) {
  return (
    <AppShell.Page>
      <AppShell.PageBar>
        <Breadcrumb items={caminho.map((label) => ({ label }))} />
      </AppShell.PageBar>
      <AppShell.PageBody>{children}</AppShell.PageBody>
    </AppShell.Page>
  );
}

interface ColunaProps {
  children: ReactNode;
  className?: string;
  largura: LarguraDaColuna;
}

/** A coluna do conteúdo, centrada na largura da folha. O cabeçalho da página recebe a mesma largura. */
export function Coluna({ children, className, largura }: ColunaProps) {
  return (
    <div className={['coluna', className].filter(Boolean).join(' ')} style={{ '--largura': larguraCss(largura) ?? '100%' } as CSSProperties}>
      {children}
    </div>
  );
}

export function SeloDaSituacao({ situacao }: { situacao: SituacaoDoPedido }) {
  const { rotulo, tom } = SITUACOES[situacao];

  return <Badge tone={tom}>{rotulo}</Badge>;
}

interface AnotacaoProps {
  acao?: ReactNode;
  children: ReactNode;
  explicacao: string;
  titulo: string;
}

/** O arranjo anotado: título e explicação num trilho à esquerda, o cartão à direita. */
export function Anotacao({ acao, children, explicacao, titulo }: AnotacaoProps) {
  return (
    <div className="anotado-linha">
      <div className="anotado-nota">
        <h2>{titulo}</h2>
        <p>{explicacao}</p>
        {acao}
      </div>
      <Card aria-label={titulo}>
        {children}
      </Card>
    </div>
  );
}
