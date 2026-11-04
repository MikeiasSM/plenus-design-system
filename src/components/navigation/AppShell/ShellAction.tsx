import type { ComponentPropsWithRef, ElementType } from 'react';

export interface ShellActionProps extends ComponentPropsWithRef<'button'> {
  /** Componente de link da aplicação, para não acoplar o sistema a um roteador. */
  as?: ElementType;
  href?: string;
  /** Propriedades entregues inteiras ao componente de link, para o roteador que não usa `href`. */
  linkProps?: Record<string, unknown>;
}

/** Link da aplicação quando há endereço; botão quando a peça só aciona algo. */
export function ShellAction({ as: Link = 'a', href, linkProps, type = 'button', ...props }: ShellActionProps) {
  if (href === undefined && linkProps === undefined) {
    return <button type={type} {...props} />;
  }

  return <Link href={href} {...linkProps} {...props} />;
}
