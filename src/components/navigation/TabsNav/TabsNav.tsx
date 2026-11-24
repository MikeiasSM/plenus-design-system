import { useEffect, useRef, type ComponentPropsWithRef, type ElementType, type ReactNode, type RefObject } from 'react';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { TabLabel, temAcoes, type TabsAppearance } from '../Tabs/Tabs';
import tabsStyles from '../Tabs/Tabs.module.css';
import styles from './TabsNav.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

export interface TabsNavItem {
  /** Quantidade mostrada num selo depois do rótulo. Entra no nome do link: "Rótulo, N". */
  count?: number;
  href?: string;
  /** Ícone decorativo antes do rótulo, fora do nome acessível. */
  icon?: ReactNode;
  key: string;
  label: string;
  /** Propriedades entregues ao componente de link, para o roteador que não usa `href`. A `className` soma às da biblioteca. */
  linkProps?: Record<string, unknown>;
}

export interface TabsNavProps extends Omit<ComponentPropsWithRef<'nav'>, 'aria-label'> {
  /** Ações ao lado das abas, como um botão. Ficam fora da lista, num envoltório com a linha da faixa. */
  actions?: ReactNode;
  appearance?: TabsAppearance;
  /** Componente de link da aplicação, para não acoplar o sistema a um roteador. */
  as?: ElementType;
  /** Chave da aba do endereço atual. Com `followScroll`, a da seção visível. */
  current: string;
  /** As abas dividem a largura em partes iguais, em vez de ficar do tamanho do rótulo. */
  fitted?: boolean;
  /**
   * As abas são seções da mesma página (`href="#id"`). A barra fica presa ao topo, segue a seção visível, avisa por
   * `onCurrentChange` e traz a aba atual para o meio da barra. A aba atual leva `aria-current="location"`.
   */
  followScroll?: boolean;
  items: readonly TabsNavItem[];
  label: string;
  /** Com `followScroll`, a chave da seção que ficou visível com a rolagem. */
  onCurrentChange?: (key: string) => void;
  /** Com `followScroll`, a altura do que fica preso acima da barra, em pixels, para a seção não passar por baixo dela. */
  stickyOffset?: number;
}

const sectionOf = (item: TabsNavItem) =>
  item.href?.startsWith('#') ? document.getElementById(decodeURIComponent(item.href.slice(1))) : null;

/** O ancestral que rola na vertical, ou o documento: é nele que a barra fica presa e que se mede o fim da rolagem. */
function scrollerOf(elemento: HTMLElement): HTMLElement {
  for (let pai = elemento.parentElement; pai; pai = pai.parentElement) {
    const { overflowY } = window.getComputedStyle(pai);
    if (/auto|scroll|overlay/.test(overflowY) && pai.scrollHeight > pai.clientHeight) {
      return pai;
    }
  }

  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/**
 * A seção atual: a última, na ordem das abas, cujo topo já chegou à borda de baixo da barra. A conta é feita contra a
 * própria barra, e não contra a janela, para valer igual com a página rolando ou dentro de um contêiner que rola, com
 * qualquer coisa presa acima. No fim da rolagem, a última seção é a atual, mesmo curta demais para chegar à barra.
 */
function useScrollSpy(
  enabled: boolean,
  items: readonly TabsNavItem[],
  barraRef: RefObject<HTMLElement | null>,
  current: string | undefined,
  onChange: (key: string) => void,
) {
  const avisar = useRef(onChange);
  avisar.current = onChange;
  const itens = useRef(items);
  itens.current = items;
  const atualRef = useRef(current);
  atualRef.current = current;

  // Os itens costumam vir em linha, novos a cada render; o efeito só recomeça quando mudam as seções observadas.
  const chave = items.map((item) => `${item.key} ${item.href ?? ''}`).join('|');

  useEffect(() => {
    const barra = barraRef.current;

    if (!enabled || !barra || typeof window === 'undefined') {
      return;
    }

    let ultima = atualRef.current;
    let quadro = 0;

    const medir = () => {
      quadro = 0;
      const lista = itens.current;
      const linha = barra.getBoundingClientRect().bottom;
      let atual = lista[0]?.key;
      let ultimaComSecao: string | undefined;

      for (const item of lista) {
        const secao = sectionOf(item);
        if (!secao) {
          continue;
        }
        ultimaComSecao = item.key;
        if (secao.getBoundingClientRect().top - linha <= 1) {
          atual = item.key;
        }
      }

      const rolagem = scrollerOf(barra);
      const fim = rolagem.scrollHeight - rolagem.clientHeight;
      if (ultimaComSecao !== undefined && fim > 1 && rolagem.scrollTop >= fim - 1) {
        atual = ultimaComSecao;
      }

      // Só avisa a mudança de fato: nem a chave que já é a atual, nem a mesma de novo a cada quadro.
      if (atual === undefined || atual === ultima) {
        return;
      }
      ultima = atual;
      if (atual !== atualRef.current) {
        avisar.current(atual);
      }
    };

    const agendar = (evento: Event) => {
      // Só interessa a rolagem de quem contém a barra: a da própria faixa de abas, ou de outra lista na página, não
      // muda a seção visível.
      const alvo = evento.target;
      if (alvo instanceof Node && alvo !== document && !alvo.contains(barra)) {
        return;
      }
      if (!quadro) {
        quadro = window.requestAnimationFrame(medir);
      }
    };

    medir();
    window.addEventListener('scroll', agendar, { capture: true, passive: true });
    window.addEventListener('resize', agendar);

    return () => {
      window.cancelAnimationFrame(quadro);
      window.removeEventListener('scroll', agendar, { capture: true });
      window.removeEventListener('resize', agendar);
    };
  }, [enabled, chave, barraRef]);
}

/** Abas que são endereços: cada uma é um link, e a da página atual leva `aria-current="page"`. */
export function TabsNav({
  actions,
  appearance = 'underline',
  as: Link = 'a',
  className,
  current,
  fitted = false,
  followScroll = false,
  items,
  label,
  onCurrentChange,
  ref,
  stickyOffset = 0,
  style,
  ...props
}: TabsNavProps) {
  const segmentado = appearance === 'segmented';
  const barraRef = useRef<HTMLElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const navRef = useMergedRefs(barraRef, ref);

  useScrollSpy(followScroll, items, barraRef, current, (chave) => onCurrentChange?.(chave));

  // A aba atual vem para o meio da barra, sem mexer na rolagem da página e sem animação para quem pede menos movimento.
  useEffect(() => {
    const barra = listaRef.current;
    const aba = barra?.querySelector<HTMLElement>(`.${styles.current}`);

    if (!followScroll || !barra || !aba || typeof barra.scrollTo !== 'function') {
      return;
    }

    const calmo = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    barra.scrollTo({
      behavior: calmo ? 'auto' : 'smooth',
      left: aba.offsetLeft - (barra.clientWidth - aba.offsetWidth) / 2,
    });
  }, [current, followScroll]);

  const lista = (
    <ul className={[styles.list, segmentado && tabsStyles.rail, thinScrollbar].filter(Boolean).join(' ')} ref={listaRef}>
      {items.map((item) => {
        const atual = item.key === current;
        // A classe e o `aria-current` do item somam aos da biblioteca: o link continua com o desenho da aba, e a
        // aba atual continua anunciada como a página.
        const { 'aria-current': ariaCurrent, className: classeDoItem, ...linkProps } = item.linkProps ?? {};

        return (
          <li className={styles.item} key={item.key}>
            <Link
              href={item.href}
              {...linkProps}
              aria-current={atual ? (followScroll ? 'location' : 'page') : ariaCurrent}
              className={[
                `${styles.link} ${tabsStyles.tab}`,
                atual && `${styles.current} ${tabsStyles.active}`,
                typeof classeDoItem === 'string' && classeDoItem,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <TabLabel count={item.count} icon={item.icon} label={item.label} />
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav
      {...props}
      aria-label={label}
      ref={navRef}
      className={[
        styles.tabsNav,
        segmentado && tabsStyles.segmented,
        fitted && styles.fitted,
        fitted && segmentado && tabsStyles.fitted,
        followScroll && styles.follow,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={followScroll ? { ...style, top: stickyOffset } : style}
    >
      {temAcoes(actions) ? (
        <div className={[tabsStyles.bar, styles.bar].join(' ')}>
          {lista}
          <div className={tabsStyles.actions}>{actions}</div>
        </div>
      ) : (
        lista
      )}
    </nav>
  );
}
