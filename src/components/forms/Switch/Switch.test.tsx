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

  it('describes itself by the description, keeping the name to the label text', () => {
    render(<Switch description="Avisos fora do horário comercial." hint="Vale para esta conta." label="Notificações" />);

    const chave = screen.getByRole('switch', { name: 'Notificações' });

    expect(chave).toHaveAccessibleDescription('Avisos fora do horário comercial. Vale para esta conta.');

    fireEvent.click(screen.getByText('Avisos fora do horário comercial.'));

    expect(chave).toBeChecked();
  });

  it('puts the labelAddon next to the label, outside the name and the click', () => {
    render(<Switch label="Sincronização" labelAddon={<button type="button">Saiba mais</button>} />);

    const chave = screen.getByRole('switch', { name: 'Sincronização' });
    const ajuda = screen.getByRole('button', { name: 'Saiba mais' });

    expect(ajuda.closest('label')).toBeNull();

    fireEvent.click(ajuda);

    expect(chave).not.toBeChecked();
  });

  it('without label, leaves the labelAddon out and keeps the description outside the label element', () => {
    render(<Switch aria-label="Sincronização" description="A cada hora." labelAddon={<span>Novo</span>} />);

    expect(screen.queryByText('Novo')).toBeNull();
    expect(screen.getByRole('switch', { name: 'Sincronização' })).toHaveAccessibleDescription('A cada hora.');
    expect(screen.getByText('A cada hora.').closest('label')).toBeNull();
  });
});
