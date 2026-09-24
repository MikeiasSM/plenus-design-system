import { useMemo } from 'react';
import { getLocalTimeZone, type CalendarDate } from '@internationalized/date';
import { useCalendar, type CalendarLimits } from '../../../hooks/useCalendar';
import styles from './DatePicker.module.css';

export interface CalendarProps extends CalendarLimits {
  autoFocus?: boolean;
  locale?: string;
  onSelect: (date: CalendarDate) => void;
  value?: CalendarDate;
}

export function Calendar({ autoFocus = false, locale = 'pt-BR', onSelect, value, ...limits }: CalendarProps) {
  const calendario = useCalendar({ ...limits, locale, onSelect, value });
  const fuso = getLocalTimeZone();
  const nomeDoMes = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }), [locale]);
  const nomeDoDia = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'long' }), [locale]);
  const diasDaSemana = useMemo(() => {
    const curto = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const longo = new Intl.DateTimeFormat(locale, { weekday: 'long' });

    return calendario.weeks[0].map((dia) => {
      const data = dia.date.toDate(fuso);
      return { curto: curto.format(data).replace('.', ''), longo: longo.format(data) };
    });
  }, [calendario.weeks, fuso, locale]);

  const titulo = nomeDoMes.format(calendario.visibleMonth.toDate(fuso));

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button
          aria-label="Mês anterior"
          className={styles.navigate}
          onClick={() => calendario.goToMonth(-1)}
          type="button"
        >
          <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span aria-live="polite" className={styles.month}>
          {titulo}
        </span>
        <button
          aria-label="Próximo mês"
          className={styles.navigate}
          onClick={() => calendario.goToMonth(1)}
          type="button"
        >
          <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <table
        aria-label={titulo}
        className={styles.grid}
        onKeyDown={calendario.handleKeyDown}
        role="grid"
        tabIndex={0}
        ref={(node) => {
          if (autoFocus) {
            node?.focus();
          }
        }}
      >
        <thead>
          <tr>
            {diasDaSemana.map((dia) => (
              <th abbr={dia.longo} className={styles.weekday} key={dia.longo} scope="col">
                {dia.curto}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calendario.weeks.map((semana) => (
            <tr key={semana[0].date.toString()}>
              {semana.map((dia) => {
                const selecionado = calendario.isSelected(dia.date);
                const focado = dia.date.compare(calendario.focusedDate) === 0;

                return (
                  <td className={styles.dayCell} key={dia.date.toString()}>
                    <button
                      aria-current={calendario.isToday(dia.date) ? 'date' : undefined}
                      aria-label={nomeDoDia.format(dia.date.toDate(fuso))}
                      aria-pressed={selecionado}
                      className={[
                        styles.day,
                        dia.outside && styles.outside,
                        selecionado && styles.selectedDay,
                        focado && styles.focusedDay,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      disabled={dia.unavailable}
                      onClick={() => calendario.select(dia.date)}
                      tabIndex={-1}
                      type="button"
                    >
                      {dia.date.day}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
