import { useEffect } from 'react';
import { isDevelopment } from '../utils/isDevelopment';

export function useAvisoDeGrupoSemNome(
  componente: string,
  { ariaLabel, ariaLabelledby, label }: { ariaLabel?: string; ariaLabelledby?: string; label?: string },
) {
  const semNome = !label && !ariaLabel && !ariaLabelledby;

  useEffect(() => {
    if (semNome && isDevelopment()) {
      console.warn(`${componente}: o grupo precisa de nome; passe \`label\`, \`aria-label\` ou \`aria-labelledby\`.`);
    }
  }, [componente, semNome]);
}
