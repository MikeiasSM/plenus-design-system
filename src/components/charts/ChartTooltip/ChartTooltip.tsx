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
import { formatarPercentual } from '../../../utils/formatters';
import styles from './ChartTooltip.module.css';

export interface ChartTooltipRow {
  color?: string;
  /** Realca a linha, como a serie sob o ponteiro entre as demais. */
  emphasis?: boolean;
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
  /** Coluna que serve de base. A ultima por padrao, que e a de valor. */
  column?: number;
  /** Valor da linha, a partir do valor dela e do total da coluna base. */
  compute?: (value: number, total: number) => number;
  format?: (value: number) => string;
}

export interface ChartTooltipProps {
  children: ReactNode;
  columns?: readonly ChartTooltipColumn[];
  /** Coluna ao fim. Percentual sobre a base por padrao; `none` a dispensa. */
  computed?: ChartTooltipComputed | 'none';
  rows: readonly ChartTooltipRow[];
  showTotal?: boolean;
  subtitle?: string;
  title?: string;
  totalLabel?: string;
}

interface Ponto {
  x: number;
  y: number;
}

/** Distancia entre o ponteiro e o balao, para o cursor nao cobrir o texto. */
const AFASTAMENTO = 16;

/** Folga minima ate a borda da janela. */
const MARGEM = 8;

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

/**
 * Canto do balao a partir do ponteiro. Ele abre para baixo e para a direita
 * enquanto couber, e vira para o lado oposto ao encostar na borda.
 */
function encaixar({ x, y }: Ponto, largura: number, altura: number): Ponto {
  const cabeADireita = x + AFASTAMENTO + largura <= window.innerWidth - MARGEM;
  const cabeAbaixo = y + AFASTAMENTO + altura <= window.innerHeight - MARGEM;

  return {
    x: cabeADireita ? x + AFASTAMENTO : Math.max(x - AFASTAMENTO - largura, MARGEM),
    y: cabeAbaixo ? y + AFASTAMENTO : Math.max(y - AFASTAMENTO - altura, MARGEM),
  };
}

/**
 * Leitura das medidas sob o ponteiro, em portal sobre a pagina. Ele acompanha o
 * cursor enquanto este percorre a area e sai a qualquer outra interacao.
 *
 * Nao conhece grafico algum: recebe linhas e colunas, e quem as monta e quem o
 * usa. E decorativo para leitor de tela — a leitura acessivel de cada marca
 * continua no `<title>` que os graficos ja trazem.
 */
export function ChartTooltip({
  children,
  columns,
  computed,
  rows,
  showTotal = false,
  subtitle,
  title,
  totalLabel = 'Total',
}: ChartTooltipProps) {
  const [ponteiro, setPonteiro] = useState<Ponto | null>(null);
  const visivel = ponteiro !== null && rows.length > 0;

  // Sai por qualquer motivo que nao seja o ponteiro andando pela area: rolagem,
  // tecla ou a janela mudando de tamanho deixam o balao preso a um lugar que o
  // desenho ja nao ocupa.
  useEffect(() => {
    if (!visivel) {
      return;
    }

    const esconder = () => setPonteiro(null);

    window.addEventListener('scroll', esconder, true);
    window.addEventListener('resize', esconder);
    window.addEventListener('keydown', esconder);

    return () => {
      window.removeEventListener('scroll', esconder, true);
      window.removeEventListener('resize', esconder);
      window.removeEventListener('keydown', esconder);
    };
  }, [visivel]);

  const acompanhar = (evento: PointerEvent<HTMLDivElement>) =>
    setPonteiro({ x: evento.clientX, y: evento.clientY });

  return (
    <div
      className={styles.area}
      onPointerLeave={() => setPonteiro(null)}
      onPointerMove={acompanhar}
    >
      {children}

      {visivel &&
        createPortal(
          <Balao
            columns={columns}
            computed={computed}
            ponteiro={ponteiro}
            rows={rows}
            showTotal={showTotal}
            subtitle={subtitle}
            title={title}
            totalLabel={totalLabel}
          />,
          document.body,
        )}
    </div>
  );
}

type BalaoProps = Omit<ChartTooltipProps, 'children'> & { ponteiro: Ponto };

function Balao({
  columns,
  computed,
  ponteiro,
  rows,
  showTotal,
  subtitle,
  title,
  totalLabel,
}: BalaoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState({ altura: 0, largura: 0 });

  // A medida entra antes da pintura, entao o balao ja nasce no lugar certo.
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

  const calculada = computed === 'none' ? undefined : computed ?? {};
  const colunaBase = calculada?.column ?? colunas.length - 1;
  const baseDoTotal = somar(rows.map((linha) => linha.values[colunaBase] ?? 0));
  const calcular = calculada?.compute ?? ((valor: number, total: number) => (total === 0 ? 0 : valor / total));
  const formatarCalculada = calculada?.format ?? ((valor: number) => formatarPercentual(valor, { casasDecimais: 2 }));

  const { x, y } = encaixar(ponteiro, medida.largura, medida.altura);
  const celulas = `1fr ${'auto '.repeat(colunas.length + (calculada ? 1 : 0))}`.trim();

  return (
    <div aria-hidden="true" className={styles.tooltip} ref={ref} style={{ left: x, top: y }}>
      {title !== undefined && <p className={styles.title}>{title}</p>}
      {subtitle !== undefined && <p className={styles.subtitle}>{subtitle}</p>}

      <div className={styles.grid} style={{ gridTemplateColumns: celulas }}>
        {rows.map((linha) => (
          <Fragment key={linha.label}>
            <span className={`${styles.label} ${linha.emphasis ? styles.emphasis : ''}`}>
              {linha.color !== undefined && (
                <span className={styles.swatch} style={{ background: linha.color }} />
              )}
              {linha.label}
            </span>

            {colunas.map((coluna, indice) => (
              <span className={`${styles.value} ${linha.emphasis ? styles.emphasis : ''}`} key={indice}>
                {(coluna.format ?? String)(linha.values[indice] ?? 0)}
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
                  : (coluna.format ?? String)(
                      totalizar(coluna.total ?? 'sum', rows.map((linha) => linha.values[indice] ?? 0)),
                    )}
              </span>
            ))}

            {calculada && (
              <span className={`${styles.computed} ${styles.totalValue}`}>
                {formatarCalculada(calcular(baseDoTotal, baseDoTotal))}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
