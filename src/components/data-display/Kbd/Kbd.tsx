import { Fragment, useSyncExternalStore, type ComponentPropsWithRef, type ReactNode } from 'react';
import { detectMac, resolveKey, type KbdLabels, type KbdPlatform } from './keys';
import styles from './Kbd.module.css';

export interface KbdProps extends Omit<ComponentPropsWithRef<'kbd'>, 'children'> {
  /** Uma tecla so. Texto passa pelos mesmos nomes de `keys`; outro conteudo aparece como veio. */
  children?: ReactNode;
  /** Combinacao, na ordem em que se aperta, como `['Mod', 'K']`. Vale sobre `children`. */
  keys?: readonly string[];
  /** Os nomes falados das teclas, para trocar os de padrao. */
  labels?: KbdLabels;
  /** `other`, o padrao, mostra Ctrl; `mac` mostra os simbolos; `auto` descobre a plataforma depois de montar. */
  platform?: KbdPlatform;
}

const subscribe = () => () => {};

/** No servidor e na hidratacao vale `other`; no navegador, a plataforma de verdade. */
function usePlatform(platform: KbdPlatform) {
  const mac = useSyncExternalStore(subscribe, detectMac, () => false);

  return platform === 'auto' ? (mac ? 'mac' : 'other') : platform;
}

/** Mostra uma tecla ou uma combinacao. So mostra: nao registra atalho nem escuta o teclado. */
export function Kbd({ children, className, keys, labels, platform = 'other', ...props }: KbdProps) {
  const resolved = usePlatform(platform);
  const list = keys ?? (typeof children === 'string' ? [children] : null);
  const mac = resolved === 'mac';

  return (
    <kbd {...props} className={[styles.kbd, className].filter(Boolean).join(' ')} data-platform={resolved}>
      {list
        ? list.map((key, index) => {
            const { shown, spoken } = resolveKey(key, resolved, labels);

            return (
              <Fragment key={index}>
                {index > 0 && (
                  <>
                    {!mac && (
                      <span aria-hidden="true" className={styles.separator}>
                        +
                      </span>
                    )}
                    {/* O leitor de tela ouve as teclas separadas por espaco, nunca o sinal de mais. */}
                    <span className={styles.hidden}> </span>
                  </>
                )}
                <kbd className={styles.key}>
                  {spoken ? (
                    <>
                      <span aria-hidden="true">{shown}</span>
                      <span className={styles.hidden}>{spoken}</span>
                    </>
                  ) : (
                    shown
                  )}
                </kbd>
              </Fragment>
            );
          })
        : <kbd className={styles.key}>{children}</kbd>}
    </kbd>
  );
}
