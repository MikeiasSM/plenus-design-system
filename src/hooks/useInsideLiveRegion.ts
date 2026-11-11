import { createContext, useContext } from 'react';

/**
 * Marca a subárvore que já está dentro de uma região viva, como a situação do rodapé fixo da página. Quem traz a
 * própria região, como a `SaveStatus`, deixa de criá-la ali: com duas regiões aninhadas, a mesma mudança pode ser lida
 * duas vezes, conforme o leitor de tela.
 */
export const LiveRegionContext = createContext(false);

/** `true` quando o componente já está dentro de uma região viva e não deve criar outra. */
export function useInsideLiveRegion() {
  return useContext(LiveRegionContext);
}
