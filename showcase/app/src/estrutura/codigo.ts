/** Trecho de codigo que vai entre chaves, como `onClick={salvar}`, e nao entre aspas. */
export interface Expressao {
  expressao: string;
}

export function expr(expressao: string): Expressao {
  return { expressao };
}

/** Nome, valor e, quando houver, o padrao do componente: valor igual ao padrao fica de fora do codigo. */
export type Atributo = readonly [nome: string, valor: unknown, padrao?: unknown];

function escrever([nome, valor, padrao]: Atributo) {
  if (valor === undefined || valor === padrao) {
    return undefined;
  }

  if (valor === true) {
    return nome;
  }

  if (typeof valor === 'string') {
    return `${nome}="${valor}"`;
  }

  if (typeof valor === 'object' && valor !== null && 'expressao' in valor) {
    return `${nome}={${(valor as Expressao).expressao}}`;
  }

  return `${nome}={${JSON.stringify(valor)}}`;
}

function recuar(texto: string) {
  return texto
    .split('\n')
    .map((linha) => (linha ? `  ${linha}` : linha))
    .join('\n');
}

/** JSX de um componente, com um atributo por linha quando nao cabe numa so. */
export function gerarJsx(componente: string, atributos: readonly Atributo[], filhos?: string) {
  const escritos = atributos.map(escrever).filter((atributo): atributo is string => atributo !== undefined);
  const emLinha = escritos.length ? ` ${escritos.join(' ')}` : '';
  const quebrado = escritos.length > 2 || emLinha.length + componente.length > 60;
  const abertura = quebrado ? `<${componente}\n${recuar(escritos.join('\n'))}\n` : `<${componente}${emLinha}`;

  if (!filhos) {
    return `${abertura}${quebrado ? '' : ' '}/>`;
  }

  return `${abertura}>\n${recuar(filhos)}\n</${componente}>`;
}
