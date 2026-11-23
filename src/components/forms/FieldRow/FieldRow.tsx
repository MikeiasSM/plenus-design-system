import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { Label } from '../Label';
import labelStyles from '../Label/Label.module.css';
import styles from './FieldRow.module.css';

export interface FieldRowWiring {
  /** Referência da explicação, para o controle que a anuncia. Fica indefinida sem `description`. */
  describedBy: string | undefined;
  /** Id do controle, ao qual o rótulo da linha aponta. O rótulo só aponta para ele quando a função o lê. */
  id: string;
  /** Id do rótulo da linha, para o grupo que ele não nomeia por `htmlFor`, como o `SegmentedControl`, o `RadioGroup` e o `CheckboxGroup`: vai ao `aria-labelledby` do grupo. */
  labelId: string;
}

export type FieldRowAlign = 'center' | 'start';

export interface FieldRowProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * Alinhamento vertical do texto e do controle na linha. `start` prende os dois ao topo, para o controle alto, como um
   * `Textarea` ou um grupo de opções.
   */
  align?: FieldRowAlign;
  /** O controle. Uma função recebe a fiação do rótulo e da explicação; o controle que se nomeia pelo conteúdo, como um botão, usa só `describedBy`. */
  children: ReactNode | ((wiring: FieldRowWiring) => ReactNode);
  description?: ReactNode;
  id?: string;
  label: string;
  /** Ao lado do título, fora do rótulo, como um selo. Não entra no nome do controle. */
  labelAddon?: ReactNode;
}

/** Linha de ajuste: rótulo e explicação de um lado, o controle do outro. O controle desce quando a linha estreita. */
export function FieldRow({
  align = 'center',
  children,
  className,
  description,
  id: providedId,
  label,
  labelAddon,
  ...props
}: FieldRowProps) {
  const generatedId = useId();
  const id = providedId ?? `field-row-${generatedId}`;
  const descriptionId = `${id}-description`;
  // O controle que se nomeia pelo conteudo, como um botao, nao le o id: sem ele, o rotulo apontaria para o vazio. A
  // leitura decide no proprio render, e o HTML do servidor ja sai certo; o controle que monta depois continua ligado.
  let idRead = false;
  let labelIdRead = false;
  const wiring: FieldRowWiring = {
    describedBy: description ? descriptionId : undefined,
    get id() {
      idRead = true;
      return id;
    },
    get labelId() {
      labelIdRead = true;
      return `${id}-label`;
    },
  };
  const control = typeof children === 'function' ? children(wiring) : children;
  const labelTarget = typeof children === 'function' ? (idRead ? id : undefined) : providedId;

  const labelId = labelIdRead ? `${id}-label` : undefined;
  // Sem controle a apontar, um `<label>` solto seria um rotulo de nada: o titulo vira texto, com o mesmo desenho.
  const title = labelTarget ? (
    <Label className={styles.label} htmlFor={labelTarget} id={labelId}>
      {label}
    </Label>
  ) : (
    <span className={[labelStyles.label, styles.label].join(' ')} id={labelId}>
      {label}
    </span>
  );

  return (
    <div {...props} className={[styles.row, align === 'start' && styles.start, className].filter(Boolean).join(' ')}>
      <div className={styles.text}>
        {labelAddon ? (
          <div className={styles.heading}>
            {title}
            {labelAddon}
          </div>
        ) : (
          title
        )}
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
