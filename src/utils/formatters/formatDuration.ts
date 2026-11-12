const MINUTE = 60_000;

/**
 * Duracao em horas e minutos, arredondada ao minuto: `10h16m`, `1h05m`, `48m`, `12h`. Recebe milissegundos.
 * Duracao em dias fica com quem a exibe: um prazo de projeto e lido em dias, uma jornada nao.
 */
export function formatDuration(milliseconds: number) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return '';
  }

  const minutes = Math.round(milliseconds / MINUTE);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest}m`;
  }

  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}m`;
}
