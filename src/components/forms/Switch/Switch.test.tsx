import { fireEvent, render, screen } from '@testing-library/react';
import { Switch } from './Switch';

describe('Switch', () => {
  it('uses switch semantics over a native checkbox', () => {
    render(<Switch label="Notificacoes por e-mail" />);

    const chave = screen.getByRole('switch', { name: 'Notificacoes por e-mail' });
    expect(chave).not.toBeChecked();

    fireEvent.click(chave);

    expect(chave).toBeChecked();
  });

  it('describes hints accessibly', () => {
    render(<Switch label="Modo escuro" hint="Acompanha a preferencia do sistema." />);

    expect(screen.getByRole('switch', { name: 'Modo escuro' }))
      .toHaveAccessibleDescription('Acompanha a preferencia do sistema.');
  });

  it('forwards the disabled state', () => {
    render(<Switch label="Sincronizacao" disabled />);

    expect(screen.getByRole('switch', { name: 'Sincronizacao' })).toBeDisabled();
  });
});
