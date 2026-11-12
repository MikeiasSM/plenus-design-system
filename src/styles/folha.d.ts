/**
 * Declaração das folhas de estilo publicadas. Sem ela, um consumidor com
 * `noUncheckedSideEffectImports` reprova ao importar o CSS por subcaminho:
 * o TypeScript exige que o módulo resolva, e `.css` não resolve sozinho.
 */
declare module '@plenustech/design-system/styles.css';
declare module '@plenustech/design-system/reset.css';
declare module '@plenustech/design-system/styles/*.css';
