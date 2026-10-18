import type { ComponentType, ReactNode } from 'react';

export type Valores = Record<string, string | number | boolean>;

type NomeDe<V extends Valores> = Extract<keyof V, string>;

/** Um controle do painel do playground, ligado a um dos valores pelo nome. */
export type Controle<V extends Valores = Valores> =
  | { tipo: 'opcoes'; nome: NomeDe<V>; opcoes: readonly string[] }
  | { tipo: 'booleano'; nome: NomeDe<V> }
  | { tipo: 'texto'; nome: NomeDe<V> }
  | { tipo: 'numero'; nome: NomeDe<V>; min?: number; max?: number; passo?: number };

export type NivelDaVerificacao = 'ok' | 'atencao' | 'falha';

export interface Verificacao {
  detalhe: string;
  nivel: NivelDaVerificacao;
  titulo: string;
}

export interface DefinicaoDoPlayground<V extends Valores = Valores> {
  controles: readonly Controle<V>[];
  inicial: V;
  /** Controles abaixo da prévia, para o componente que precisa da largura toda, como uma linha do tempo. */
  largo?: boolean;
  /** O codigo que reproduz a previa, refeito a cada mudanca. */
  codigo(valores: V): string;
  /** `registrar` leva ao painel de eventos cada callback que o componente disparar. */
  renderizar(valores: V, registrar: (evento: string) => void): ReactNode;
  verificar?(valores: V): Verificacao[];
}

export interface Exemplo {
  codigo: string;
  descricao: string;
  /** Ocupa a linha inteira da grade de exemplos. */
  largo?: boolean;
  Previa: ComponentType;
  titulo: string;
}

export interface FacaOuEvite {
  Previa: ComponentType;
  texto: ReactNode;
}

export interface Tecla {
  acao: string;
  teclas: readonly string[];
}

export interface Garantia {
  como: ReactNode;
  garantia: string;
  teste: string;
}

export interface LinhaDaApi {
  descricao: ReactNode;
  nome: string;
  padrao?: string;
  tipo: string;
}

/** Conteudo da pagina de um componente. Cada secao so aparece quando preenchida. */
export interface Pagina {
  api?: readonly LinhaDaApi[];
  evite?: FacaOuEvite;
  exemplos?: readonly Exemplo[];
  faca?: FacaOuEvite;
  garantias?: readonly Garantia[];
  Modos?: ComponentType;
  notaDaApi?: ReactNode;
  playground?: DefinicaoDoPlayground;
  teclado?: readonly Tecla[];
  Variantes?: ComponentType;
}

/** Infere os valores pelo `inicial`, para os nomes dos controles e o `renderizar` saberem os tipos. */
export function definirPlayground<V extends Valores>(definicao: DefinicaoDoPlayground<V>) {
  // Os nomes dos controles vem de `keyof V`, o que torna o tipo invariante: a pagina guarda a forma geral.
  return definicao as unknown as DefinicaoDoPlayground;
}
