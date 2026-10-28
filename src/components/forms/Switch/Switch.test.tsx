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

  it('keeps the invalid state the consumer declares', () => {
    render(<Switch aria-invalid label="Sincronizacao" />);

    expect(screen.getByRole('switch', { name: 'Sincronizacao' })).toHaveAttribute('aria-invalid', 'true');
  });
  it('reports the checked state through onCheckedChange alongside the native onChange', () => {
    const onChange = vi.fn();
    const onCheckedChange = vi.fn();
    render(<Switch defaultChecked label="Notificar" onChange={onChange} onCheckedChange={onCheckedChange} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });
});
