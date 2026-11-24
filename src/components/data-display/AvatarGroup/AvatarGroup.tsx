import { useEffect, useId, useRef, useState, type ComponentPropsWithRef } from 'react';
import { Avatar, type AvatarSize } from '../Avatar';
import { AvatarItem } from '../AvatarItem';
import { Popover } from '../../overlays/Popover';
import styles from './AvatarGroup.module.css';

/** Uma pessoa do grupo, com os mesmos dados do `Avatar`. */
export interface AvatarGroupPerson {
  /** Iniciais no lugar das que saem do `name`. */
  initials?: string;
  name: string;
  src?: string;
}

/** Os textos do grupo. Cada um é uma função da quantidade, para o produto acertar o plural. */
export interface AvatarGroupLabels {
  /** O total no nome do grupo: "7 pessoas". */
  count: (total: number) => string;
  /** O nome da lista dos que não couberam, no painel: "Mais 4 pessoas". */
  list: (hidden: number) => string;
  /** O nome do "+N" que é só texto: "e mais 4". */
  more: (hidden: number) => string;
  /** O nome do "+N" que abre a lista: "Ver mais 4 pessoas". */
  showMore: (hidden: number) => string;
}

export type AvatarGroupOverflow = 'count' | 'popover';

export interface AvatarGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Nome do grupo. O total de pessoas entra depois dele: "Responsáveis, 7 pessoas". */
  label: string;
  /** Textos no lugar dos de padrão, em português. */
  labels?: Partial<AvatarGroupLabels>;
  /** Quantos círculos cabem, contando o "+N". Sem ele, todos aparecem. */
  max?: number;
  /** `popover` faz do "+N" um botão que abre a lista dos que não couberam; `count`, o padrão, o deixa como texto. */
  overflow?: AvatarGroupOverflow;
  /** As pessoas, na ordem em que aparecem. */
  people: readonly AvatarGroupPerson[];
  size?: AvatarSize;
}

const pessoas = (count: number) => `${count} ${count === 1 ? 'pessoa' : 'pessoas'}`;

const DEFAULT_AVATAR_GROUP_LABELS: AvatarGroupLabels = {
  count: pessoas,
  list: (hidden) => `Mais ${pessoas(hidden)}`,
  more: (hidden) => `e mais ${hidden}`,
  showMore: (hidden) => `Ver mais ${pessoas(hidden)}`,
};

export function AvatarGroup({
  className,
  label,
  labels: customLabels,
  max,
  overflow = 'count',
  people,
  size = 'md',
  ...props
}: AvatarGroupProps) {
  const labels = { ...DEFAULT_AVATAR_GROUP_LABELS, ...customLabels };
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const listId = useId();

  // O "+N" ocupa um dos círculos de `max`: com 4 e sete pessoas, ficam três avatares e "+4".
  const limit = max === undefined ? people.length : Math.max(1, Math.floor(max));
  const visible = people.length > limit ? people.slice(0, limit - 1) : people;
  const hidden = people.slice(visible.length);
  const wasOpen = useRef(false);

  // O `Popover` foca o primeiro controle de dentro, e a lista não tem nenhum: o foco vai ao próprio painel. Ao fechar,
  // o foco que saiu com o painel volta ao botão; o que foi parar em outro lugar, por um clique fora, fica onde está.
  useEffect(() => {
    if (open) {
      panel.current?.focus();
    } else if (wasOpen.current) {
      const active = trigger.current?.ownerDocument.activeElement;
      if (!active || active === trigger.current?.ownerDocument.body) {
        trigger.current?.focus();
      }
    }
    wasOpen.current = open;
  }, [open]);

  const moreClasses = [styles.more, styles[size]].join(' ');

  return (
    <div
      {...props}
      className={[styles.group, styles[size], className].filter(Boolean).join(' ')}
      role="group"
      aria-label={`${label}, ${labels.count(people.length)}`}
    >
      {visible.map((person, index) => (
        <Avatar key={index} initials={person.initials} name={person.name} size={size} src={person.src} />
      ))}
      {hidden.length > 0 &&
        (overflow === 'popover' ? (
          <>
            <button
              ref={trigger}
              type="button"
              className={moreClasses}
              aria-label={labels.showMore(hidden.length)}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={open ? listId : undefined}
              onClick={() => setOpen((current) => !current)}
            >
              <span aria-hidden="true">+{hidden.length}</span>
            </button>
            <Popover
              ref={panel}
              id={listId}
              aria-label={labels.list(hidden.length)}
              className={styles.panel}
              open={open}
              triggerRef={trigger}
              onOpenChange={setOpen}
              tabIndex={-1}
            >
              <ul className={styles.list}>
                {hidden.map((person, index) => (
                  <li key={index}>
                    <AvatarItem
                      avatar={<Avatar initials={person.initials} name={person.name} size="sm" src={person.src} />}
                      title={person.name}
                    />
                  </li>
                ))}
              </ul>
            </Popover>
          </>
        ) : (
          <span className={moreClasses} role="img" aria-label={labels.more(hidden.length)}>
            +{hidden.length}
          </span>
        ))}
    </div>
  );
}
