import { createContext, useContext } from 'react';

export interface CardMetricState {
  error?: string;
  loading: boolean;
  onActivate?: () => void;
}

export const CardMetricContext = createContext<CardMetricState | undefined>(undefined);

export function useCardMetric(part: string) {
  const context = useContext(CardMetricContext);

  if (!context) {
    throw new Error(part + ' deve ser usado dentro de CardMetric.');
  }

  return context;
}
