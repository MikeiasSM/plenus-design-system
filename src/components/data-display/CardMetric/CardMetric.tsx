import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { IconExclamationCircle } from '../../icons';
import { Card, useCardTitle } from '../Card/Card';
import { CardMetricBar } from './CardMetricBar';
import { CardMetricBody } from './CardMetricBody';
import { CardMetricChart } from './CardMetricChart';
import { CardMetricContext } from './CardMetricContext';
import { CardMetricTrend } from './CardMetricTrend';
import { CardMetricValue } from './CardMetricValue';
import styles from './CardMetric.module.css';

export interface CardMetricProps extends ComponentPropsWithRef<'section'> {
  children: ReactNode;
  /** Abre o detalhe. Com ele, um botao cobre o cartao, abaixo dos controles que o produto poe dentro. */
  onActivate?: () => void;
  /** Nome do botao de ativacao. Padrao: "Abrir detalhes de" e o titulo do `Card.Header`. */
  activateLabel?: string;
  loading?: boolean;
  /** Dados validos na tela enquanto os novos chegam, como na troca de filtro. */
  updating?: boolean;
  /** Mensagem curta. Presente, ela aparece no corpo do cartao e as partes saem. */
  error?: string;
}

/**
 * Moldura de um indicador sobre o `Card` compacto: ativacao, estados e o contexto que as partes leem. O produto
 * monta o cartao com o `Card.Header` e as partes `Body`, `Value`, `Trend`, `Bar` e `Chart`.
 */
export function CardMetric({
  activateLabel,
  children,
  className,
  error,
  loading = false,
  onActivate,
  updating = false,
  ...props
}: CardMetricProps) {
  const busy = loading || updating;

  return (
    <Card
      {...props}
      aria-busy={busy || undefined}
      className={[styles.frame, onActivate && styles.activatable, updating && styles.updating, className]
        .filter(Boolean)
        .join(' ')}
      size="sm"
    >
      <CardMetricContext.Provider value={{ error, loading, onActivate }}>
        {onActivate && <ActivateButton label={activateLabel} onActivate={onActivate} />}
        {children}
        {error && (
          <CardMetricBody>
            <p className={styles.error} role="alert">
              <IconExclamationCircle aria-hidden="true" size={16} />
              {error}
            </p>
          </CardMetricBody>
        )}
        {/* Presente desde o início: a região viva só anuncia o texto que muda dentro dela. */}
        <span className={styles.visuallyHidden} role="status">
          {updating ? 'Atualizando' : ''}
        </span>
      </CardMetricContext.Provider>
    </Card>
  );
}

function ActivateButton({ label, onActivate }: { label?: string; onActivate: () => void }) {
  const prefixId = useId();
  const titleId = useCardTitle();
  const named = label === undefined && titleId !== undefined;

  return (
    <>
      {named && (
        <span hidden id={prefixId}>
          Abrir detalhes de
        </span>
      )}
      <button
        aria-label={named ? undefined : (label ?? 'Abrir detalhes')}
        aria-labelledby={named ? `${prefixId} ${titleId}` : undefined}
        className={styles.activate}
        onClick={onActivate}
        type="button"
      />
    </>
  );
}

CardMetric.Body = CardMetricBody;
CardMetric.Value = CardMetricValue;
CardMetric.Trend = CardMetricTrend;
CardMetric.Bar = CardMetricBar;
CardMetric.Chart = CardMetricChart;
