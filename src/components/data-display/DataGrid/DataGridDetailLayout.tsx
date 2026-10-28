import type { ReactNode } from 'react';
import { ButtonIcon } from '../../actions/ButtonIcon';
import { IconClose } from '../../icons';
import { Dialog } from '../../overlays/Dialog';
import { DataGridLevelContext } from './dataGridContext';
import styles from './DataGrid.module.css';

export type DataGridAsidePlacement = 'start' | 'end' | 'dialog';

export interface DataGridDetailLayoutProps {
  /** Conteúdo lateral, como um gráfico. Sem ele, o principal ocupa o espaço todo. */
  aside?: ReactNode;
  asidePlacement?: DataGridAsidePlacement;
  /** Parte da largura do lateral, em porcentagem; o principal fica com o resto. */
  asideSize?: number;
  /** Nome do lateral, no cabeçalho dele e para o leitor de tela. */
  asideTitle: string;
  children: ReactNode;
  /** Obrigatória: sem ela, o lateral em diálogo não teria como fechar. */
  onAsideClose: () => void;
}

/** Organiza o espaço do detalhe sem saber o que há no lateral: a grade não conhece gráficos. */
export function DataGridDetailLayout({
  aside,
  asidePlacement = 'end',
  asideSize = 40,
  asideTitle,
  children,
  onAsideClose,
}: DataGridDetailLayoutProps) {
  const shown = aside !== undefined && aside !== null && aside !== false;
  const inline = shown && asidePlacement !== 'dialog';

  /* O conteúdo fica sempre no mesmo lugar da árvore: abrir o lateral não remonta a grade que está nele. */
  return (
    <div className={[styles.detailLayout, asidePlacement === 'start' && styles.asideFirst].filter(Boolean).join(' ')}>
      <div className={styles.detailMain} style={{ flexBasis: inline ? `calc(${100 - asideSize}% - var(--pl-space-3))` : '100%' }}>
        {children}
      </div>
      {inline && (
        <section aria-label={asideTitle} className={styles.aside} style={{ flexBasis: `${asideSize}%` }}>
          <div className={styles.asideHead}>
            <span>{asideTitle}</span>
            <ButtonIcon icon={<IconClose size={14} />} label="Fechar" size="sm" variant="ghost" onClick={onAsideClose} />
          </div>
          {aside}
        </section>
      )}
      {shown && asidePlacement === 'dialog' && (
        <Dialog open size="lg" title={asideTitle} onOpenChange={(open) => !open && onAsideClose()}>
          <DataGridLevelContext.Provider value={null}>{aside}</DataGridLevelContext.Provider>
        </Dialog>
      )}
    </div>
  );
}
