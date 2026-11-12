import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { Label } from '../Label';
import styles from './FieldRow.module.css';

export interface FieldRowWiring {
  /** Referência da explicação, para o controle que a anuncia. Fica indefinida sem `description`. */
  describedBy: string | undefined;
  /** Id do controle, ao qual o rótulo da linha aponta. O rótulo só aponta para ele quando a função o lê. */
  id: string;
}

export interface FieldRowProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** O controle. Uma função recebe a fiação do rótulo e da explicação; o controle que se nomeia pelo conteúdo, como um botão, usa só `describedBy`. */
  children: ReactNode | ((wiring: FieldRowWiring) => ReactNode);
  description?: ReactNode;
  id?: string;
  label: string;
}

/** Linha de ajuste: rótulo e explicação de um lado, o controle do outro. O controle desce quando a linha estreita. */
export function FieldRow({ children, className, description, id: providedId, label, ...props }: FieldRowProps) {
  const generatedId = useId();
  const id = providedId ?? `field-row-${generatedId}`;
  const descriptionId = `${id}-description`;
  // O controle que se nomeia pelo conteúdo, como um botão, não le o id: sem ele, o rótulo apontaria para o vazio. A
  // leitura decide no próprio render, e o HTML do servidor já sai certo; o controle que monta depois continua ligado.
  let idRead = false;
  const wiring: FieldRowWiring = {
    describedBy: description ? descriptionId : undefined,
    get id() {
      idRead = true;
      return id;
    },
  };
  const control = typeof children === 'function' ? children(wiring) : children;
  const labelTarget = typeof children === 'function' ? (idRead ? id : undefined) : providedId;

  return (
    <div {...props} className={[styles.row, className].filter(Boolean).join(' ')}>
      <div className={styles.text}>
        <Label className={styles.label} htmlFor={labelTarget}>
          {label}
        </Label>
        {description && (
          <p className={styles.description} id={descriptionId}>
            {description}
          </p>
        )}
      </div>
      <div className={styles.control}>{control}</div>
    </div>
  );
}
