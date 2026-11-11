import type { ReactNode } from 'react';
import { AppShell, Badge, Breadcrumb, Container } from '@plenustech/design-system';
import type { Situacao } from './dados';

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
  largura: LarguraDaColuna;
}

/** A coluna do conteúdo, centrada na largura da folha. O cabeçalho da página recebe a mesma largura. O respiro vertical é daqui: o `Container` só cuida do lateral. */
export function Coluna({ children, largura }: ColunaProps) {
  return (
    <Container maxWidth={larguraCss(largura)} style={{ paddingBlock: 'var(--pl-space-5)' }}>
      {children}
    </Container>
  );
}

/** O único caminho da situação ao tom do selo: a tela passa a `Situacao` que `dados.ts` guarda e não decide tom. */
export function SeloDaSituacao({ situacao: { rotulo, tom } }: { situacao: Situacao }) {
  return <Badge tone={tom}>{rotulo}</Badge>;
}
