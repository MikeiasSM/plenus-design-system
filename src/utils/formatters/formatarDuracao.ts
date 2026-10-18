const MINUTO = 60_000;

/**
 * Duracao em horas e minutos, arredondada ao minuto: `10h16m`, `1h05m`, `48m`, `12h`. Recebe milissegundos.
 * Duracao em dias fica com quem a exibe: um prazo de projeto e lido em dias, uma jornada nao.
 */
export function formatarDuracao(milissegundos: number) {
  if (!Number.isFinite(milissegundos) || milissegundos < 0) {
    return '';
  }

  const minutos = Math.round(milissegundos / MINUTO);
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) {
    return `${resto}m`;
  }

  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, '0')}m`;
}
