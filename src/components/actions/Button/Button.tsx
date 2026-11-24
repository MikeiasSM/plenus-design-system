import { forwardRef, useId, type ButtonHTMLAttributes, type ElementType, type KeyboardEvent, type MouseEvent, type Ref } from 'react';
import { blockRepeatedPress } from '../../../utils/press/press';
import { VisuallyHidden } from '../../accessibility/VisuallyHidden';
import { Spinner } from '../../feedback/Spinner';
import styles from './Button.module.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'soft'
  | 'ghost'
  | 'neutral'
  | 'link'
  | 'danger'
  | 'dangerSoft'
  | 'dangerGhost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Componente de link da aplicacao. Com `as`, `href` ou `linkProps` o Button vira
   * link, com o mesmo visual; sem eles continua um `<button>`.
   */
  as?: ElementType;
  /**
   * Por que a acao nao esta disponivel. Com `disabled`, o botao fica com `aria-disabled` em vez do `disabled`
   * nativo: continua na tabulacao, nao responde a clique, Enter nem Espaco, e o motivo o descreve.
   */
  disabledReason?: string;
  /** Destino da navegacao: o Button passa a ser um `<a href>`, que abre em outra aba, copia o endereco e o leitor anuncia como link. */
  href?: string;
  /** Propriedades entregues inteiras ao componente de link, para o roteador que nao usa `href`. */
  linkProps?: Record<string, unknown>;
  variant?: ButtonVariant;
  /** `link` ignora o tamanho: herda a fonte do texto em volta. */
  size?: ButtonSize;
  loading?: boolean;
}

const isPressKey = (key: string) => key === 'Enter' || key === ' ';

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      as: Link,
      children,
      className,
      disabled = false,
      disabledReason,
      href,
      linkProps,
      loading = false,
      onClick,
      onKeyDown,
      onKeyUp,
      size = 'md',
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref,
  ) => {
    const reasonId = `button-reason-${useId()}`;
    const classes = [styles.button, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(' ');

    const asLink = Link !== undefined || href !== undefined || linkProps !== undefined;
    // Desabilitado com motivo, o botao fica focavel para o motivo ser ouvido, e o proprio Button barra a ativacao.
    const explained = disabled && Boolean(disabledReason);
    const describedBy = explained ? [props['aria-describedby'], reasonId].filter(Boolean).join(' ') : props['aria-describedby'];

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      if (loading || explained || (asLink && disabled)) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      onKeyDown?.(event);

      // O Enter ativa no `keydown`; cancelado aqui, nao envia o formulario nem chega ao clique.
      if (explained && isPressKey(event.key)) {
        event.preventDefault();
        return;
      }

      if (!asLink || event.key === 'Enter') {
        blockRepeatedPress(event);
      }
    }

    // O Espaco ativa o botao no `keyup`.
    function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
      onKeyUp?.(event);

      if (explained && event.key === ' ') {
        event.preventDefault();
      }
    }

    // O motivo fica fora do botao, para nao entrar no nome, e montado enquanto houver `disabledReason`.
    const reason = disabledReason ? (
      <VisuallyHidden hidden={!explained || undefined} id={reasonId}>
        {disabledReason}
      </VisuallyHidden>
    ) : null;

    if (asLink) {
      // Desabilitado, o link perde o destino e o componente da aplicacao: sem `href` nao ha navegacao e,
      // sem foco, o teclado o pula, como pula o botao desabilitado. O papel `link` mantem o anuncio.
      // Com motivo, ele volta a tabulacao, para o motivo ser ouvido.
      const Element: ElementType = disabled ? 'a' : (Link ?? 'a');
      const destino = disabled ? {} : { href, ...linkProps };

      return (
        <>
          <Element
            {...props}
            {...destino}
            ref={ref}
            className={classes}
            role={disabled ? 'link' : undefined}
            tabIndex={explained ? (props.tabIndex ?? 0) : props.tabIndex}
            aria-describedby={describedBy}
            aria-disabled={disabled || loading || undefined}
            aria-busy={loading || undefined}
            onAuxClick={loading ? (event: MouseEvent) => event.preventDefault() : undefined}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onKeyUp={onKeyUp}
          >
            {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} />}
            {children}
          </Element>
          {reason}
        </>
      );
    }

    return (
      <>
        <button
          {...props}
          ref={ref as Ref<HTMLButtonElement>}
          className={classes}
          disabled={disabled && !explained}
          aria-describedby={describedBy}
          aria-disabled={loading || explained || undefined}
          aria-busy={loading || undefined}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          type={type}
        >
          {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} />}
          {children}
        </button>
        {reason}
      </>
    );
  },
);
