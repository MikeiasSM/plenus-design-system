import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  it('announces urgent tones assertively', () => {
    render(<Alert tone="danger" title="Falha no envio">Tente novamente.</Alert>);

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Falha no envio');
    expect(alerta).toHaveTextContent('Tente novamente.');
  });

  it('announces informative tones politely', () => {
    render(<Alert tone="info">Sincronizacao concluida.</Alert>);

    expect(screen.getByRole('status')).toHaveTextContent('Sincronizacao concluida.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('treats warnings as urgent and successes as polite', () => {
    const { rerender } = render(<Alert tone="warning">Espaco quase esgotado.</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<Alert tone="success">Registro salvo.</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
