import { fireEvent, render, screen } from '@testing-library/react';
import { Steps } from './Steps';

const items = [
  { key: 'conta', label: 'Conta' },
  { description: 'Servidor e porta', key: 'servidor', label: 'Servidor' },
  { key: 'teste', label: 'Teste' },
];

describe('Steps', () => {
  it('marca a etapa atual e anuncia as anteriores como concluidas', () => {
    render(<Steps current="servidor" items={items} label="Etapas do e-mail" />);

    expect(screen.getByRole('navigation', { name: 'Etapas do e-mail' })).toBeInTheDocument();
    expect(screen.getByText('Servidor').closest('[aria-current]')).toHaveAttribute('aria-current', 'step');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Conta, concluída');
    expect(screen.getAllByRole('listitem')[2]).not.toHaveTextContent('concluída');
  });

  it('so vira botao quando a navegacao e livre', () => {
    const onCurrentChange = vi.fn();
    const { rerender } = render(<Steps current="conta" items={items} label="Etapas" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<Steps current="conta" items={items} label="Etapas" onCurrentChange={onCurrentChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Teste/ }));

    expect(onCurrentChange).toHaveBeenCalledWith('teste');
    expect(screen.getByRole('button', { name: /Conta/ })).toHaveAttribute('aria-current', 'step');
  });

  it('sem controle, comeca pelo defaultCurrent e avanca no clique', () => {
    const onCurrentChange = vi.fn();
    render(<Steps defaultCurrent="servidor" items={items} label="Etapas" onCurrentChange={onCurrentChange} />);
    expect(screen.getByRole('button', { name: /Servidor/ })).toHaveAttribute('aria-current', 'step');

    fireEvent.click(screen.getByRole('button', { name: /Teste/ }));

    expect(onCurrentChange).toHaveBeenCalledWith('teste');
    expect(screen.getByRole('button', { name: /Teste/ })).toHaveAttribute('aria-current', 'step');
  });

  it('sem current nem defaultCurrent, comeca pela primeira etapa', () => {
    render(<Steps items={items} label="Etapas" />);

    expect(screen.getByText('Conta').closest('[aria-current]')).toHaveAttribute('aria-current', 'step');
  });

  it('ainda chama o obsoleto onStepChange', () => {
    const onStepChange = vi.fn();
    render(<Steps current="conta" items={items} label="Etapas" onStepChange={onStepChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Teste/ }));

    expect(onStepChange).toHaveBeenCalledWith('teste');
  });
});
