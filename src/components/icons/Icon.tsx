import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox'> {
  /**
   * Nome acessivel. Sem ele o icone e decorativo e sai da arvore de
   * acessibilidade — que e o caso sempre que houver texto ao lado dizendo a
   * mesma coisa.
   */
  label?: string;
  /** Sem medida declarada, o icone acompanha o tamanho do texto ao redor. */
  size?: number | string;
}

interface DesenhoProps extends IconProps {
  children: ReactNode;
}

/**
 * Base dos icones do Design System. **Interna**: ela fecha o conjunto, para que
 * a aplicacao use a biblioteca oficial em vez de desenhar o proprio caminho,
 * conforme `ARCHITECTURE.md` secao 12.
 *
 * A cor vem de `currentColor`, entao o icone herda a cor do texto em que esta.
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
