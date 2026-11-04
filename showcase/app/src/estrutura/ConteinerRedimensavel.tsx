import type { ReactNode } from 'react';

/** Caixa que o leitor redimensiona pelo canto, para ver o gráfico retirar partes à medida que o espaço falta. */
export function ConteinerRedimensavel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: '1px dashed var(--pl-color-border-strong)',
        height: 240,
        maxWidth: '100%',
        minHeight: 90,
        minWidth: 90,
        overflow: 'hidden',
        padding: 8,
        resize: 'both',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}
