import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox'> {
  /**
   * Nome acessível. Sem ele o ícone e decorativo e sai da árvore de
   * acessibilidade — que e o caso sempre que houver texto ao lado dizendo a
   * mesma coisa.
   */
  label?: string;
  /** Sem medida declarada, o ícone acompanha o tamanho do texto ao redor. */
  size?: number | string;
}

interface DesenhoProps extends IconProps {
  children: ReactNode;
}

/**
 * Base dos ícones do Design System. **Interna**: ela fecha o conjunto, para que
 * a aplicação use a biblioteca oficial em vez de desenhar o próprio caminho,
 * conforme `ARCHITECTURE.md` secao 12.
 *
 * A cor vem de `currentColor`, então o ícone herda a cor do texto em que esta.
 */
export function Icon({ children, label, size = '1em', ...props }: DesenhoProps) {
  const nome = label ?? props['aria-label'];

  return (
    <svg
      aria-hidden={nome ? undefined : true}
      aria-label={nome}
      fill="currentColor"
      focusable="false"
      height={size}
      role={nome ? 'img' : undefined}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}
