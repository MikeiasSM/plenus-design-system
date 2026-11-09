import type { CSSProperties, ReactNode } from 'react';
import { AppShell, Badge, Breadcrumb } from '@plenustech/design-system';
import { SITUACOES, type SituacaoDoPedido } from './dados';

/** Larguras da coluna de conteúdo: total, larga (1120), do índice (1000) e estreita (760). */
export type LarguraDaColuna = 'total' | 760 | 1000 | 1120;

export function larguraCss(largura: LarguraDaColuna) {
  return largura === 'total' ? undefined : `${largura}px`;
}

interface PaginaProps {
  caminho: readonly string[];
  children: ReactNode;
  /** O rodapé fixo, depois do corpo. */
  rodape?: ReactNode;
}

/** A folha da página: a barra com o caminho, o corpo, a única área que rola, e o rodapé, quando há. */
export function Pagina({ caminho, children, rodape }: PaginaProps) {
  return (
    <AppShell.Page>
      <AppShell.PageBar>
        <Breadcrumb items={caminho.map((label) => ({ label }))} />
      </AppShell.PageBar>
      <AppShell.PageBody>{children}</AppShell.PageBody>
      {rodape}
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
