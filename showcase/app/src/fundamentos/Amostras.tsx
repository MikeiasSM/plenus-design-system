import { useEffect, useRef, useState } from 'react';
import { Badge } from '@plenustech/design-system';
import { paraHexadecimal, useTemaResolvido, type Token } from './tokens';

/** O único token novo da 0.6.0; os demais já saíram em versões de correção da 0.5. */
const NOVO_NA_VERSAO_060 = '--pl-color-primary-selected';

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
      {nome === NOVO_NA_VERSAO_060 && <Badge tone="info">0.6.0</Badge>}
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
