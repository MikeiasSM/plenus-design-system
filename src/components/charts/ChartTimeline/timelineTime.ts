import { extent } from 'd3-array';
import type { ChartTimelineScale, ChartTimelineTime } from './ChartTimeline';

export const HOUR_MS = 3_600_000;
const HOURS_IN_DAY = 24;
const DAY_MS = HOURS_IN_DAY * HOUR_MS;
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Menor distancia entre duas marcas do eixo, e a partir de quanto a marca diaria leva o dia da semana. */
const MIN_TICK_GAP = 40;
const MIN_DAY_TICK_GAP = 44;
const WEEKDAY_TICK_GAP = 70;
const HOUR_STEPS = [1, 3, 6, 12];

export interface TimeTick {
  label: string;
  position: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Posicao no eixo: em `calendar`, milissegundos desde a epoca; em `dayHours`, a hora decimal do dia. */
export function toPosition(time: ChartTimelineTime, scale: ChartTimelineScale) {
  if (!(time instanceof Date)) {
    return time;
  }

  if (scale === 'calendar') {
    return time.getTime();
  }

  return time.getHours() + time.getMinutes() / 60 + time.getSeconds() / 3600 + time.getMilliseconds() / HOUR_MS;
}

/** A posicao como `Date`, para os formatadores do consumidor. Em `dayHours` a data e indiferente: vale a hora. */
export function toDate(position: number, scale: ChartTimelineScale) {
  return scale === 'calendar' ? new Date(position) : new Date(1970, 0, 1, 0, 0, 0, Math.round(position * HOUR_MS));
}

export function durationMs(start: number, end: number, scale: ChartTimelineScale) {
  return Math.round((end - start) * (scale === 'dayHours' ? HOUR_MS : 1));
}

function startOfDay(time: number) {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Dias somados pelo calendario, e nao por 24 horas: o dia de mudanca de horario nao tem 24. */
function addDays(day: number, days: number) {
  const date = new Date(day);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days).getTime();
}

/** Faixa automatica: do primeiro ao ultimo instante, arredondada a hora ou ao dia, com uma unidade no minimo. */
export function autoDomain(positions: readonly number[], scale: ChartTimelineScale): [number, number] {
  const [min, max] = extent(positions.filter(Number.isFinite));

  if (scale === 'dayHours') {
    if (min === undefined || max === undefined) {
      return [0, HOURS_IN_DAY];
    }

    const start = Math.min(Math.max(Math.floor(min), 0), HOURS_IN_DAY - 1);
    return [start, Math.min(Math.max(Math.ceil(max), start + 1), HOURS_IN_DAY)];
  }

  if (min === undefined || max === undefined) {
    const today = startOfDay(Date.now());
    return [today, addDays(today, 1)];
  }

  const start = startOfDay(min);
  const lastDay = startOfDay(max);

  return [start, Math.max(lastDay === max ? max : addDays(lastDay, 1), addDays(start, 1))];
}

function dayMonth(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** Instante no balao e na tabela: `07:12` em horas do dia; `05/10 14:00`, ou so `05/10` a meia-noite, em datas. */
export function formatPosition(position: number, scale: ChartTimelineScale) {
  if (scale === 'dayHours') {
    const minutes = Math.round(position * 60);
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  }

  const date = new Date(position);
  const time = date.getHours() || date.getMinutes() ? ` ${pad(date.getHours())}:${pad(date.getMinutes())}` : '';

  return `${dayMonth(date)}${time}`;
}

function hourTicks([start, end]: readonly [number, number], width: number) {
  const pixelsPerHour = width / Math.max(end - start, Number.EPSILON);
  const step = HOUR_STEPS.find((hours) => hours * pixelsPerHour >= MIN_TICK_GAP) ?? HOURS_IN_DAY;
  const ticks: number[] = [];

  for (let hour = Math.ceil(start / step) * step; hour <= end; hour += step) {
    ticks.push(hour);
  }

  return ticks;
}

/** Marcas em datas: um dia por marca enquanto cabe, depois as segundas-feiras, depois o primeiro de cada mes. */
function dateTicks([start, end]: readonly [number, number], width: number) {
  const pixelsPerDay = (width * DAY_MS) / Math.max(end - start, 1);
  const firstDay = startOfDay(start) < start ? addDays(startOfDay(start), 1) : startOfDay(start);
  const ticks: number[] = [];

  if (pixelsPerDay >= MIN_DAY_TICK_GAP || pixelsPerDay * 7 >= MIN_DAY_TICK_GAP) {
    const daily = pixelsPerDay >= MIN_DAY_TICK_GAP;
    const firstMonday = addDays(firstDay, (8 - new Date(firstDay).getDay()) % 7);

    for (let day = daily ? firstDay : firstMonday; day <= end; day = addDays(day, daily ? 1 : 7)) {
      ticks.push(day);
    }

    return ticks;
  }

  const first = new Date(firstDay);

  for (let month = 0; ; month += 1) {
    const day = new Date(first.getFullYear(), first.getMonth() + month, 1).getTime();

    if (day > end) {
      return ticks;
    }

    if (day >= start) {
      ticks.push(day);
    }
  }
}

export function timeTicks(
  domain: readonly [number, number],
  scale: ChartTimelineScale,
  width: number,
  formatTick?: (time: Date) => string,
): TimeTick[] {
  if (!domain.every(Number.isFinite) || width <= 0) {
    return [];
  }

  if (scale === 'dayHours') {
    return hourTicks(domain, width).map((hour) => ({
      label: formatTick ? formatTick(toDate(hour, scale)) : `${hour}h`,
      position: hour,
    }));
  }

  const withWeekday = (width * DAY_MS) / Math.max(domain[1] - domain[0], 1) >= WEEKDAY_TICK_GAP;

  return dateTicks(domain, width).map((day) => {
    const date = new Date(day);
    const label = withWeekday ? `${WEEKDAYS[date.getDay()]} ${dayMonth(date)}` : dayMonth(date);

    return { label: formatTick ? formatTick(date) : label, position: day };
  });
}
