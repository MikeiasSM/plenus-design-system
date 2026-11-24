import type { ComponentPropsWithRef, ReactNode } from 'react';
import styles from './Alert.module.css';

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  /** Ícone antes do texto, decorativo: o tom e o texto já dizem a situação. Não há ícone padrão por tom. */
  icon?: ReactNode | false;
  /** Ação ligada à mensagem, como um botão. Fica ao lado do texto quando há largura e abaixo dele quando não há. */
  action?: ReactNode;
}

/* `neutral` é só informação de contexto, sem urgência: não entra como região viva, e o leitor de tela o lê no fluxo. */
function liveRole(tone: AlertTone) {
  if (tone === 'danger' || tone === 'warning') {
    return 'alert';
  }

  return tone === 'neutral' ? undefined : 'status';
}

export function Alert({ action, children, className, icon, title, tone = 'info', ...props }: AlertProps) {
  const hasIcon = icon !== undefined && icon !== false && icon !== null;
  const hasAction = action !== undefined && action !== null && action !== false;
  const classes = [styles.alert, styles[tone], (hasIcon || hasAction) && styles.withSlots, hasAction && styles.withAction, className]
    .filter(Boolean)
    .join(' ');
  const text = (
    <>
      {title && <strong className={styles.title}>{title}</strong>}
      {children && <div className={styles.body}>{children}</div>}
    </>
  );

  return (
    <div role={liveRole(tone)} {...props} className={classes}>
      {hasIcon || hasAction ? (
        <>
          {hasIcon && (
            <span aria-hidden="true" className={styles.icon}>
              {icon}
            </span>
          )}
          <div className={styles.content}>
            <div className={styles.text}>{text}</div>
            {hasAction && <div className={styles.action}>{action}</div>}
          </div>
        </>
      ) : (
        text
      )}
    </div>
  );
}
