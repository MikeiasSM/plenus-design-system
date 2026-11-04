import { useEffect, useRef, useState } from 'react';
import { Badge } from '@plenustech/design-system';
import { paraHexadecimal, useTemaResolvido, type Token } from './tokens';

/** O que a 0.6.0 acrescentou aos tokens. */
export const ehNovoNaVersao060 = (nome: string) =>
  ['--pl-shell-gap', '--pl-color-primary-selected'].includes(nome) || /^--pl-(type-micro|z)-/.test(nome);

export function SeloDeNovo({ nome }: { nome: string }) {
  return ehNovoNaVersao060(nome) ? <Badge tone="info">0.6.0</Badge> : null;
}

/** O quadrado de uma cor, com o valor que o tema atual resolve para ela. */
function AmostraDeCor({ nome }: { nome: string }) {
  const tema = useTemaResolvido();
  const cor = useRef<HTMLSpanElement>(null);
  const [valor, setValor] = useState('');

  useEffect(() => {
    if (cor.current) {
      setValor(paraHexadecimal(getComputedStyle(cor.current).backgroundColor));
    }
  }, [nome, tema]);

  return (
    <li className="amostra">
      <span className="amostra-xadrez">
        <span className="amostra-cor" ref={cor} style={{ background: `var(${nome})` }} />
      </span>
      <code>{nome}</code>
      <span className="amostra-valor">{valor}</span>
      <SeloDeNovo nome={nome} />
    </li>
  );
}

export function GradeDeCores({ tokens }: { tokens: readonly Token[] }) {
  return (
    <ul className="amostras">
      {tokens.map(({ nome }) => (
        <AmostraDeCor key={nome} nome={nome} />
      ))}
    </ul>
  );
}
