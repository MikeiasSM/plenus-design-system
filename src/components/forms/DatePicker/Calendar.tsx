import { useEffect, useMemo, useRef, type FocusEvent } from 'react';
import { getLocalTimeZone, type CalendarDate } from '@internationalized/date';
import { useCalendar, usePeriodCalendar, type CalendarLimits } from '../../../hooks/useCalendar';
import { blockRepeatedPress } from '../../../utils/press/press';
import { sameDay, type CalendarGranularity } from '../../../hooks/useCalendar/calendar';
import styles from './DatePicker.module.css';
import { IconChevronLeft, IconChevronRight } from '../../icons';

export interface CalendarProps extends CalendarLimits {
  autoFocus?: boolean;
  /** Com `month` ou `year`, a grade mostra doze meses ou doze anos, e o valor e o primeiro dia do periodo. */
  granularity?: CalendarGranularity;
  locale?: string;
  onSelect: (date: CalendarDate) => void;
  /** Fim do intervalo que começa em `value`: os dois extremos ficam marcados e os dias entre eles, realçados. */
  rangeEnd?: CalendarDate;
  value?: CalendarDate;
}

/** O miolo do calendario, sem borda nem fundo: o mesmo no painel dos seletores e no `Calendar` solto na pagina. */
export function Calendar({ granularity = 'day', ...props }: CalendarProps) {
  return granularity === 'day' ? <DayCalendar {...props} /> : <PeriodCalendar granularity={granularity} {...props} />;
}

function DayCalendar({ autoFocus = false, locale = 'pt-BR', onSelect, rangeEnd, value, ...limits }: Omit<CalendarProps, 'granularity'>) {
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
          onKeyDown={blockRepeatedPress}
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
          onKeyDown={blockRepeatedPress}
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
                const selecionado = calendario.isSelected(dia.date) || sameDay(dia.date, rangeEnd);
                const noIntervalo =
                  value && rangeEnd && dia.date.compare(value) > 0 && dia.date.compare(rangeEnd) < 0;
                const focado = dia.date.toString() === chaveEmFoco;

                return (
                  <td className={styles.dayCell} key={dia.date.toString()}>
                    {/* Dia indisponivel continua focavel, como o teclado o alcanca; quem recusa a escolha e o motor. */}
                    <button
                      aria-current={calendario.isToday(dia.date) ? 'date' : undefined}
                      aria-disabled={dia.unavailable || undefined}
                      aria-label={nomeDoDia.format(dia.date.toDate(fuso)) + (dia.excluded ? ', indisponível' : '')}
                      aria-pressed={selecionado}
                      className={[
                        styles.day,
                        dia.outside && styles.outside,
                        dia.excluded && styles.excluded,
                        noIntervalo && styles.rangeDay,
                        selecionado && styles.selectedDay,
                      ]
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

function PeriodCalendar({
  autoFocus = false,
  granularity,
  locale = 'pt-BR',
  onSelect,
  rangeEnd,
  value,
  ...limits
}: Omit<CalendarProps, 'granularity'> & { granularity: 'month' | 'year' }) {
  const calendario = usePeriodCalendar({ ...limits, granularity, onSelect, value });
  const fuso = getLocalTimeZone();
  const nomeCurto = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'short' }), [locale]);
  const nomeLongo = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }), [locale]);
  const meses = granularity === 'month';
  const primeiro = calendario.page.year;
  const titulo = meses ? String(primeiro) : `${primeiro} a ${primeiro + 11}`;
  const periodoEmFoco = useRef<HTMLButtonElement>(null);
  const gradeComFoco = useRef(false);
  const chaveEmFoco = calendario.focusedDate.toString();

  useEffect(() => {
    if (autoFocus) {
      periodoEmFoco.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (gradeComFoco.current) {
      periodoEmFoco.current?.focus();
    }
  }, [chaveEmFoco]);

  function handleBlur(event: FocusEvent<HTMLTableElement>) {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
      gradeComFoco.current = false;
    }
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button
          aria-label={meses ? 'Ano anterior' : 'Anos anteriores'}
          className={styles.navigate}
          onClick={() => calendario.goToPage(-1)}
          onKeyDown={blockRepeatedPress}
          type="button"
        >
          <IconChevronLeft size={14} />
        </button>
        <span aria-live="polite" className={styles.month}>
          {titulo}
        </span>
        <button
          aria-label={meses ? 'Próximo ano' : 'Próximos anos'}
          className={styles.navigate}
          onClick={() => calendario.goToPage(1)}
          onKeyDown={blockRepeatedPress}
          type="button"
        >
          <IconChevronRight size={14} />
        </button>
      </div>
      <table
        aria-label={(meses ? 'Meses de ' : 'Anos de ') + titulo}
        className={styles.grid}
        onBlur={handleBlur}
        onFocus={() => (gradeComFoco.current = true)}
        onKeyDown={calendario.handleKeyDown}
        role="grid"
      >
        <tbody>
          {calendario.periods.map((linha) => (
            <tr key={linha[0].date.toString()}>
              {linha.map((periodo) => {
                const selecionado = calendario.isSelected(periodo.date) || sameDay(periodo.date, rangeEnd);
                const noIntervalo =
                  value && rangeEnd && periodo.date.compare(value) > 0 && periodo.date.compare(rangeEnd) < 0;
                const focado = periodo.date.toString() === chaveEmFoco;
                const data = periodo.date.toDate(fuso);
                const nome = meses ? nomeLongo.format(data) : String(periodo.date.year);

                return (
                  <td className={styles.dayCell} key={periodo.date.toString()}>
                    <button
                      aria-current={calendario.isCurrent(periodo.date) ? 'date' : undefined}
                      aria-disabled={periodo.unavailable || undefined}
                      aria-label={nome + (periodo.excluded ? ', indisponível' : '')}
                      aria-pressed={selecionado}
                      className={[
                        styles.day,
                        styles.period,
                        periodo.excluded && styles.excluded,
                        noIntervalo && styles.rangeDay,
                        selecionado && styles.selectedDay,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => calendario.select(periodo.date)}
                      ref={focado ? periodoEmFoco : undefined}
                      tabIndex={focado ? 0 : -1}
                      type="button"
                    >
                      {meses ? nomeCurto.format(data).replace('.', '') : periodo.date.year}
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
