import { useEffect, useMemo, useRef, type FocusEvent } from 'react';
import { getLocalTimeZone, type CalendarDate } from '@internationalized/date';
import { useCalendar, type CalendarLimits } from '../../../hooks/useCalendar';
import styles from './DatePicker.module.css';
import { IconChevronLeft, IconChevronRight } from '../../icons';

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
  const diaEmFoco = useRef<HTMLButtonElement>(null);
  const gradeComFoco = useRef(false);
  const chaveEmFoco = calendario.focusedDate.toString();

  useEffect(() => {
    if (autoFocus) {
      diaEmFoco.current?.focus();
    }
  }, []);

  // O foco do teclado anda com o dia, mas so se ja estava na grade: o clique no mes seguinte nao o puxa para ca.
  useEffect(() => {
    if (gradeComFoco.current) {
      diaEmFoco.current?.focus();
    }
  }, [chaveEmFoco]);

  // Sem destino, o foco saiu com o dia que deixou a grade na troca de mes, e nao da grade.
  function handleBlur(event: FocusEvent<HTMLTableElement>) {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
      gradeComFoco.current = false;
    }
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button
          aria-label="Mês anterior"
          className={styles.navigate}
          onClick={() => calendario.goToMonth(-1)}
          type="button"
        >
          <IconChevronLeft size={14} />
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
          <IconChevronRight size={14} />
        </button>
      </div>
      <table
        aria-label={titulo}
        className={styles.grid}
        onBlur={handleBlur}
        onFocus={() => (gradeComFoco.current = true)}
        onKeyDown={calendario.handleKeyDown}
        role="grid"
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
                const focado = dia.date.toString() === chaveEmFoco;

                return (
                  <td className={styles.dayCell} key={dia.date.toString()}>
                    {/* Dia indisponivel continua focavel, como o teclado o alcanca; quem recusa a escolha e o motor. */}
                    <button
                      aria-current={calendario.isToday(dia.date) ? 'date' : undefined}
                      aria-disabled={dia.unavailable || undefined}
                      aria-label={nomeDoDia.format(dia.date.toDate(fuso))}
                      aria-pressed={selecionado}
                      className={[styles.day, dia.outside && styles.outside, selecionado && styles.selectedDay]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => calendario.select(dia.date)}
                      ref={focado ? diaEmFoco : undefined}
                      tabIndex={focado ? 0 : -1}
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
