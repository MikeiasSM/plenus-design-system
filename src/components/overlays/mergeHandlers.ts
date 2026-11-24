type Handler = (event: never) => void;

/**
 * Soma os manipuladores de evento do produto aos que o overlay recebe do react-aria (`overlayProps`), em vez de
 * deixar estes apagarem aqueles no espalhamento. Os dois rodam, o do produto antes, como no `mergeProps` do
 * react-aria. Devolve só os manipuladores do overlay, já somados, para espalhar depois das propriedades do produto.
 */
export function mergeHandlers<T extends object>(consumer: object, own: T): T {
  const merged: Record<string, unknown> = { ...(own as Record<string, unknown>) };
  const fromConsumer = consumer as Record<string, unknown>;

  for (const key of Object.keys(own)) {
    const ours = (own as Record<string, unknown>)[key];
    const theirs = fromConsumer[key];

    if (!/^on[A-Z]/.test(key) || typeof theirs !== 'function') {
      continue;
    }

    merged[key] =
      typeof ours === 'function'
        ? (event: never) => {
            (theirs as Handler)(event);
            (ours as Handler)(event);
          }
        : theirs;
  }

  return merged as T;
}
