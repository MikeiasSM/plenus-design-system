/**
 * Declaracao das folhas de estilo publicadas. Sem ela, um consumidor com
 * `noUncheckedSideEffectImports` reprova ao importar o CSS por subcaminho:
 * o TypeScript exige que o modulo resolva, e `.css` nao resolve sozinho.
 */
declare module '@plenustech/design-system/styles.css';
declare module '@plenustech/design-system/reset.css';
