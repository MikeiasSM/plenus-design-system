import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type Declaracoes = Record<string, string>;

/**
 * As regras de uma folha CSS do repositório, por seletor, com as declarações de cada uma. O jsdom não aplica o CSS dos
 * módulos: o teste que depende de estilo confere a regra na folha. Vale a primeira regra de cada seletor, a de fora de
 * `@media` e `@container`, que vêm depois na folha.
 */
export function regrasDaFolha(caminho: string) {
  const folha = readFileSync(resolve(process.cwd(), caminho), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const regras = new Map<string, Declaracoes>();

  for (const [, seletor, corpo] of folha.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const chave = seletor.trim().replace(/\s+/g, ' ');

    if (regras.has(chave)) {
      continue;
    }

    const declaracoes: Declaracoes = {};

    for (const declaracao of corpo.split(';')) {
      const separador = declaracao.indexOf(':');

      if (separador > 0) {
        declaracoes[declaracao.slice(0, separador).trim()] = declaracao.slice(separador + 1).trim().replace(/\s+/g, ' ');
      }
    }

    regras.set(chave, declaracoes);
  }

  return regras;
}
