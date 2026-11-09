import { useState } from 'react';
import { Button, CodeBlock } from '@plenustech/design-system';

/**
 * O botao que abre e fecha o codigo de uma demonstracao, e o bloco desse codigo. Volta os dois separados para quem
 * precisa deles em lugares diferentes, como o cartao de exemplo, que poe o botao no corpo e o codigo embaixo.
 */
export function useVerCodigo(codigo: string, classeDoBloco?: string) {
  const [aberto, setAberto] = useState(false);

  const botao = (
    <Button aria-expanded={aberto} onClick={() => setAberto(!aberto)} size="sm" variant="ghost">
      {aberto ? 'Ocultar código' : 'Ver código'}
    </Button>
  );
  const bloco = aberto ? <CodeBlock className={classeDoBloco} code={codigo} syntax="tsx" /> : null;

  return { bloco, botao };
}

/** O codigo de uma demonstracao de Modos ou Variantes, fechado ate o clique, logo abaixo dela. */
export function VerCodigo({ codigo }: { codigo: string }) {
  const { bloco, botao } = useVerCodigo(codigo, 'ver-codigo-bloco');

  return (
    <div className="ver-codigo">
      {botao}
      {bloco}
    </div>
  );
}
