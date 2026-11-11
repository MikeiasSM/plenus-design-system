import { forwardRef, type ButtonHTMLAttributes, type ElementType, type MouseEvent, type Ref } from 'react';
import { Spinner } from '../../feedback/Spinner';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'dangerSoft' | 'dangerGhost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Componente de link da aplicacao, como no Breadcrumb. Com `as`, `href` ou `linkProps` o Button vira
   * link, com o mesmo visual; sem eles continua um `<button>`.
   */
  as?: ElementType;
  /** Destino da navegacao: o Button passa a ser um `<a href>`, que abre em outra aba, copia o endereco e o leitor anuncia como link. */
  href?: string;
  /** Propriedades entregues inteiras ao componente de link, para o roteador que nao usa `href`. */
  linkProps?: Record<string, unknown>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      as: Link,
      children,
      className,
      disabled = false,
      href,
      linkProps,
      loading = false,
      onClick,
      size = 'md',
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref,
  ) => {
    const classes = [styles.button, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(' ');

    const asLink = Link !== undefined || href !== undefined || linkProps !== undefined;

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      if (loading || (asLink && disabled)) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    }

    if (asLink) {
      // Desabilitado, o link perde o destino e o componente da aplicacao: sem `href` nao ha navegacao e,
      // sem foco, o teclado o pula, como pula o botao desabilitado. O papel `link` mantem o anuncio.
      const Element: ElementType = disabled ? 'a' : (Link ?? 'a');
      const destino = disabled ? {} : { href, ...linkProps };

      return (
        <Element
          {...props}
          {...destino}
          ref={ref}
          className={classes}
          role={disabled ? 'link' : undefined}
          aria-disabled={disabled || loading || undefined}
          aria-busy={loading || undefined}
          onAuxClick={loading ? (event: MouseEvent) => event.preventDefault() : undefined}
          onClick={handleClick}
        >
          {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} />}
          {children}
        </Element>
      );
    }

    return (
      <button
        {...props}
        ref={ref as Ref<HTMLButtonElement>}
        className={classes}
        disabled={disabled}
        aria-disabled={loading || undefined}
        aria-busy={loading || undefined}
        onClick={handleClick}
        type={type}
      >
        {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} />}
        {children}
      </button>
    );
  },
);
