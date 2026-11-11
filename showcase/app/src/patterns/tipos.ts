import type { ComponentType, ReactNode } from 'react';

/** O componente que o pattern combina e o papel dele na montagem. */
export interface ComponenteDoPattern {
  nome: string;
  papel: ReactNode;
}

/** Um exemplo funcionando: o componente roda na página e o código mostrado é o próprio arquivo dele. */
export interface ExemploDoPattern {
  codigo: string;
  Componente: ComponentType;
  descricao: ReactNode;
  /** Altura da moldura, quando o exemplo é uma folha de página e precisa de um pai com altura. Sem ela, o exemplo flui. */
  altura?: number;
  titulo: string;
}

/** A página de um pattern: a forma recomendada de montar um aspecto comum com os componentes que já existem. */
export interface Pattern {
  acessibilidade: readonly ReactNode[];
  /** O que a montagem mantém no comportamento, além da acessibilidade. */
  comportamento: readonly ReactNode[];
  componentes: readonly ComponenteDoPattern[];
  evitar: readonly ReactNode[];
  exemplos: readonly ExemploDoPattern[];
  id: string;
  nome: string;
  problema: ReactNode;
  resumo: string;
  /** A tela das composições que ilustra o pattern. */
  tela?: { id: string; nome: string };
  quando: readonly ReactNode[];
  variacoes: readonly ReactNode[];
}

/** O arquivo de um exemplo, lido como texto: o código para copiar é o que roda, sem segunda cópia. */
export function codigoDe(fonte: string) {
  return fonte.replace(/\r\n/g, '\n').trimEnd();
}
