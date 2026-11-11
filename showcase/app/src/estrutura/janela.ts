import type { Valores } from './tipos';

/** Onde a escolha de tema do Showcase fica guardada; a previa em janela le a mesma. */
export const CHAVE_DO_TEMA = 'plenus-showcase-tema';

/** A rota do iframe: `#/previa/<Componente>`. Fica fora do menu e da busca. */
export const ROTA_DA_PREVIA = 'previa';

/** O tema de `data-theme`; `system` e o documento sem o atributo. */
export type TemaDoDocumento = 'light' | 'dark' | 'system';

/** Mensagens entre a pagina e a previa em janela, sempre na mesma origem. */
export type MensagemParaAPrevia = { tipo: 'estado'; tema: TemaDoDocumento; valores: Valores };
export type MensagemDaPrevia =
  | { tipo: 'pronto' }
  | { tipo: 'evento'; nome: string }
  | { tipo: 'altura'; altura: number };

export function lerTemaDoDocumento(): TemaDoDocumento {
  const tema = document.documentElement.dataset.theme;
  return tema === 'dark' || tema === 'light' ? tema : 'system';
}

export function aplicarTemaNoDocumento(tema: TemaDoDocumento) {
  if (tema === 'system') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = tema;
  }
}

/** So vale a mensagem que veio da origem do Showcase e da janela esperada. */
export function mensagemConfiavel(evento: MessageEvent, origem: Window | null) {
  return evento.origin === window.location.origin && evento.source === origem && origem !== null;
}
