import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { formatNumber, formatPercent } from '../../../utils/formatters';
import { usePortalContainer } from '../../overlays/Portal/PortalContext';
import type { ChartAnchorPoint } from '../core/useMarkNavigation';
import styles from './ChartTooltip.module.css';

export interface ChartTooltipRow {
  color?: string;
  /** Realca a linha, como a série sob o ponteiro entre as demais. */
  emphasis?: boolean;
  /** Formato dos valores desta linha, quando difere do da coluna, como a série do eixo da direita. */
  format?: (value: number) => string;
  label: string;
  values: readonly number[];
}

/** Como a linha de total resume uma coluna. A soma raramente serve a todas. */
export type ChartTooltipTotal = 'sum' | 'average' | 'none' | ((values: readonly number[]) => number);

export interface ChartTooltipColumn {
  format?: (value: number) => string;
  total?: ChartTooltipTotal;
}

export interface ChartTooltipComputed {
  /** Coluna que serve de base. A ultima por padrão, que e a de valor. */
  column?: number;
  /** Valor da linha, a partir do valor dela e do total da coluna base. */
  compute?: (value: number, total: number) => number;
  format?: (value: number) => string;
  /** `false` deixa a linha de total sem ela, como o percentual de uma soma com negativos. */
  total?: boolean;
}

export interface ChartTooltipProps {
  /** Âncora fixa do balão, em coordenadas da janela, como a marca em foco pelo teclado ou a entrada da legenda. Vale sobre o ponteiro. */
  anchor?: ChartAnchorPoint;
  children: ReactNode;
  columns?: readonly ChartTooltipColumn[];
  /** Coluna ao fim. Percentual sobre a base por padrão; `none` a dispensa. */
  computed?: ChartTooltipComputed | 'none';
  /** Conteúdo próprio do balão, no lugar da grade de `rows`, para leituras que não são tabela. */
  content?: ReactNode;
  /** Largura maxima do balão, em pixels. 360 por padrão; nunca passa da janela. */
  maxWidth?: number;
  /** Elemento que recebe o balão. Sem ele vale o `PortalProvider` mais próximo e, sem este, o `document.body`. */
  portalContainer?: HTMLElement | null;
  rows?: readonly ChartTooltipRow[];
  showTotal?: boolean;
  subtitle?: string;
  title?: string;
  totalLabel?: string;
}

interface Ponto {
  touch?: boolean;
  x: number;
  y: number;
}

/** Distância entre o ponteiro e o balão, para o cursor não cobrir o texto. */
export const TOOLTIP_OFFSET = 16;

/** Com o dedo, o balão sobe acima do toque: a mao cobre o que estiver abaixo e a direita dele. */
const TOOLTIP_OFFSET_TOUCH = 48;

/** Folga mínima até a borda da janela. */
const MARGEM = 8;

/** Distância entre o balão e a caixa do elemento a que ele se encosta. */
const ESPACO_DA_CAIXA = 8;

/** Largura util do documento, sem a barra de rolagem que ocupa espaço: e nela que o balão cabe ou não. */
function larguraDaJanela() {
  return document.documentElement.clientWidth || window.innerWidth;
}

function somar(valores: readonly number[]) {
  return valores.reduce((total, valor) => total + valor, 0);
}

function totalizar(operador: ChartTooltipTotal, valores: readonly number[]) {
  if (typeof operador === 'function') {
    return operador(valores);
  }

  if (operador === 'average') {
    return valores.length === 0 ? 0 : somar(valores) / valores.length;
  }

  return somar(valores);
}

type Lado = 'direita' | 'esquerda';

interface Encaixe extends Ponto {
  lado?: Lado;
}

/** O lado em que o balão já abriu vale enquanto couber: trocar a cada marca, só porque a largura mudou, desorienta. */
function escolherLado(preferido: Lado | undefined, cabe: Record<Lado, boolean>): Lado {
  if (preferido && cabe[preferido]) {
    return preferido;
  }

  return cabe.direita ? 'direita' : 'esquerda';
}

/**
 * Canto do balão a partir do ponteiro. Ele abre para baixo e para a direita
 * enquanto couber, e vira para o lado oposto ao encostar na borda.
 */
function encaixar({ touch, x, y }: Ponto, largura: number, altura: number, preferido?: Lado): Encaixe {
  const afastamento = touch ? TOOLTIP_OFFSET_TOUCH : TOOLTIP_OFFSET;
  const lado = escolherLado(preferido, {
    direita: x + TOOLTIP_OFFSET + largura <= larguraDaJanela() - MARGEM,
    esquerda: x - TOOLTIP_OFFSET - largura >= MARGEM,
  });
  const cabeAbaixo = y + afastamento + altura <= window.innerHeight - MARGEM;
  const cabeAcima = y - afastamento - altura >= MARGEM;
  const abaixo = touch ? !cabeAcima && cabeAbaixo : cabeAbaixo;

  return {
    lado,
    x: lado === 'direita' ? x + TOOLTIP_OFFSET : Math.max(x - TOOLTIP_OFFSET - largura, MARGEM),
    y: abaixo ? y + afastamento : Math.max(y - afastamento - altura, MARGEM),
  };
}

function dentroDaJanela(valor: number, tamanho: number, limite: number) {
  return Math.max(MARGEM, Math.min(valor, limite - MARGEM - tamanho));
}

/**
 * Canto do balão a partir da caixa do elemento, que termina em `x` e tem `y` a meia altura. Ele encosta a
 * direita da caixa, alinhado ao topo; sem espaço, vai para a esquerda; sem espaço dos dois lados, desce abaixo
 * da caixa, alinhado a esquerda, ou sobe acima dela.
 */
function encostar({ height, width, x, y }: Required<ChartAnchorPoint>, largura: number, altura: number, preferido?: Lado): Encaixe {
  const topo = y - height / 2;
  const aDireita = x + ESPACO_DA_CAIXA;
  const aEsquerda = x - width - ESPACO_DA_CAIXA - largura;
  const alinhadoAoTopo = dentroDaJanela(topo, altura, window.innerHeight);
  const cabe = { direita: aDireita + largura <= larguraDaJanela() - MARGEM, esquerda: aEsquerda >= MARGEM };

  if (cabe.direita || cabe.esquerda) {
    const lado = escolherLado(preferido, cabe);

    return { lado, x: lado === 'direita' ? aDireita : aEsquerda, y: alinhadoAoTopo };
  }

  const abaixo = topo + height + ESPACO_DA_CAIXA;
  const acima = topo - ESPACO_DA_CAIXA - altura;
  const cabeAbaixo = abaixo + altura <= window.innerHeight - MARGEM;

  return {
    x: dentroDaJanela(x - width, largura, larguraDaJanela()),
    y: cabeAbaixo ? abaixo : acima >= MARGEM ? acima : dentroDaJanela(abaixo, altura, window.innerHeight),
  };
}

/**
 * Leitura das medidas sob o ponteiro, em portal sobre a página. Ele acompanha o
 * cursor enquanto este percorre a area e sai a qualquer outra interação.
 *
 * Não conhece grafico algum: recebe linhas e colunas, e quem as monta e quem o
 * usa. E decorativo para leitor de tela: o desenho e `role="img"`, apresentado
 * como imagem única, e a leitura medida a medida cabe a visao em tabela.
 */
export function ChartTooltip({
  anchor,
  children,
  columns,
  computed,
  content,
  maxWidth,
  portalContainer,
  rows = [],
  showTotal = false,
  subtitle,
  title,
  totalLabel = 'Total',
}: ChartTooltipProps) {
  const container = usePortalContainer(portalContainer);
  const areaRef = useRef<HTMLDivElement>(null);
  const [ponteiro, setPonteiro] = useState<Ponto | null>(null);
  const [ancoraDispensada, setAncoraDispensada] = useState<ChartAnchorPoint | null>(null);
  const ancora = anchor !== undefined && anchor !== ancoraDispensada ? anchor : null;
  const ponto = ancora ?? ponteiro;
  const visivel = ponto !== null && (content !== undefined || rows.length > 0);

  // Sai por qualquer motivo que não seja o ponteiro andando pela area: rolagem,
  // tecla ou a janela mudando de tamanho deixam o balão preso a um lugar que o
  // desenho já não ocupa.
  useEffect(() => {
    if (!visivel) {
      return;
    }

    const esconder = () => {
      setPonteiro(null);
      setAncoraDispensada(ancora);
    };
    const soltarPonteiro = () => setPonteiro(null);
    // Com o foco no grafico, na marca ou na legenda, o Escape fecha o balão ancorado e não segue adiante.
    // Fora dele, o Escape e de quem tem o foco, como um menu aberto ou um atalho do produto.
    const fecharAncora = (evento: KeyboardEvent) => {
      const grafico = areaRef.current?.closest('figure') ?? areaRef.current;

      if (evento.key === 'Escape' && ancora !== null && grafico?.contains(evento.target as Node)) {
        evento.stopPropagation();
        esconder();
      }
    };

    window.addEventListener('scroll', esconder, true);
    window.addEventListener('resize', esconder);
    window.addEventListener('keydown', fecharAncora, true);
    window.addEventListener('keydown', soltarPonteiro);

    return () => {
      window.removeEventListener('scroll', esconder, true);
      window.removeEventListener('resize', esconder);
      window.removeEventListener('keydown', fecharAncora, true);
      window.removeEventListener('keydown', soltarPonteiro);
    };
  }, [ancora, visivel]);

  const acompanhar = (evento: PointerEvent<HTMLDivElement>) =>
    setPonteiro({ touch: evento.pointerType === 'touch', x: evento.clientX, y: evento.clientY });

  return (
    <div
      className={styles.area}
      // O dedo sai do desenho ao levantar, e e ai que o toque fixa o balão: quem o solta e o grafico, sem linhas.
      onPointerLeave={(evento) => evento.pointerType !== 'touch' && setPonteiro(null)}
      onPointerMove={acompanhar}
      onPointerUp={(evento) => evento.pointerType === 'touch' && acompanhar(evento)}
      ref={areaRef}
    >
      {children}

      {visivel &&
        container &&
        createPortal(
          <Balao
            columns={columns}
            computed={computed}
            content={content}
            maxWidth={maxWidth}
            ponteiro={ponto}
            rows={rows}
            showTotal={showTotal}
            subtitle={subtitle}
            title={title}
            totalLabel={totalLabel}
          />,
          container,
        )}
    </div>
  );
}

type BalaoProps = Omit<ChartTooltipProps, 'children' | 'rows'> & { ponteiro: ChartAnchorPoint; rows: readonly ChartTooltipRow[] };

function Balao({
  columns,
  computed,
  content,
  maxWidth,
  ponteiro,
  rows,
  showTotal,
  subtitle,
  title,
  totalLabel,
}: BalaoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState({ altura: 0, largura: 0 });
  const ladoAberto = useRef<Lado | undefined>(undefined);

  // A medida entra antes da pintura, então o balão já nasce no lugar certo.
  useLayoutEffect(() => {
    const no = ref.current;

    if (!no) {
      return;
    }

    const { height, width } = no.getBoundingClientRect();

    if (height !== medida.altura || width !== medida.largura) {
      setMedida({ altura: height, largura: width });
    }
  });

  const quantidadeDeColunas = rows.reduce((maior, linha) => Math.max(maior, linha.values.length), 0);
  const colunas: readonly ChartTooltipColumn[] =
    columns ?? Array.from({ length: quantidadeDeColunas }, () => ({}));

  // Sem coluna de onde derivar, não ha o que calcular: linhas só com rótulo
  // renderizariam um percentual tirado do nada.
  const calculada = computed === 'none' || colunas.length === 0 ? undefined : computed ?? {};
  const colunaBase = calculada?.column ?? colunas.length - 1;
  const baseDoTotal = somar(rows.map((linha) => linha.values[colunaBase] ?? 0));
  const calcular = calculada?.compute ?? ((valor: number, total: number) => (total === 0 ? 0 : valor / total));
  const formatarCalculada = calculada?.format ?? ((valor: number) => formatPercent(valor, { decimals: 2 }));

  const { height, width } = ponteiro;
  // Sem medida ainda, o lado não e decidido: o primeiro desenho, de largura zero, caberia em qualquer um.
  const preferido = medida.largura > 0 ? ladoAberto.current : undefined;
  const { lado, x, y } =
    height !== undefined && width !== undefined
      ? encostar({ ...ponteiro, height, width }, medida.largura, medida.altura, preferido)
      : encaixar(ponteiro, medida.largura, medida.altura, preferido);

  if (medida.largura > 0 && lado) {
    ladoAberto.current = lado;
  }
  const celulas = `1fr ${'auto '.repeat(colunas.length + (calculada ? 1 : 0))}`.trim();

  return (
    <div
      aria-hidden="true"
      className={styles.tooltip}
      ref={ref}
      style={{ left: x, maxWidth: maxWidth === undefined ? undefined : `min(${maxWidth}px, calc(100% - 16px))`, top: y }}
    >
      {title !== undefined && <p className={styles.title}>{title}</p>}
      {subtitle !== undefined && <p className={styles.subtitle}>{subtitle}</p>}

      {content !== undefined ? (
        <div className={styles.body}>{content}</div>
      ) : (
        <div className={styles.grid} style={{ gridTemplateColumns: celulas }}>
          {rows.map((linha, indiceDaLinha) => (
            <Fragment key={indiceDaLinha}>
              <span className={`${styles.label} ${linha.emphasis ? styles.emphasis : ''}`}>
                {linha.color !== undefined && (
                  <span className={styles.swatch} style={{ background: linha.color }} />
                )}
                <span className={styles.labelText}>{linha.label}</span>
              </span>

              {colunas.map((coluna, indice) => (
                <span className={`${styles.value} ${linha.emphasis ? styles.emphasis : ''}`} key={indice}>
                  {(linha.format ?? coluna.format ?? formatNumber)(linha.values[indice] ?? 0)}
                </span>
              ))}

              {calculada && (
                <span className={`${styles.computed} ${linha.emphasis ? styles.emphasis : ''}`}>
                  {formatarCalculada(calcular(linha.values[colunaBase] ?? 0, baseDoTotal))}
                </span>
              )}
            </Fragment>
          ))}

          {showTotal && (
            <>
              <span className={styles.rule} />
              <span className={`${styles.label} ${styles.totalLabel}`}>{totalLabel}</span>

              {colunas.map((coluna, indice) => (
                <span className={`${styles.value} ${styles.totalValue}`} key={indice}>
                  {coluna.total === 'none'
                    ? ''
                    : (coluna.format ?? formatNumber)(
                        totalizar(coluna.total ?? 'sum', rows.map((linha) => linha.values[indice] ?? 0)),
                      )}
                </span>
              ))}

              {calculada && (
                <span className={`${styles.computed} ${styles.totalValue}`}>
                  {calculada.total === false ? '' : formatarCalculada(calcular(baseDoTotal, baseDoTotal))}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
