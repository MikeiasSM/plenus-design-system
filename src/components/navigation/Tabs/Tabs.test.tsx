import { fireEvent, render, screen } from '@testing-library/react';
import { Tabs, type TabItem } from './Tabs';

const abas: TabItem[] = [
  { key: 'geral', label: 'Geral', content: 'Conteudo geral' },
  { key: 'acesso', label: 'Acesso', content: 'Conteudo de acesso' },
  { key: 'antigo', label: 'Antigo', content: 'Indisponivel', disabled: true },
  { key: 'logs', label: 'Logs', content: 'Conteudo de logs' },
];

function montar(props: Partial<React.ComponentProps<typeof Tabs>> = {}) {
  render(<Tabs label="Configuracoes" items={abas} {...props} />);
  return screen.getByRole('tablist', { name: 'Configuracoes' });
}

describe('Tabs', () => {
  it('seleciona a primeira aba habilitada e mostra apenas o painel dela', () => {
    montar();

    expect(screen.getByRole('tab', { name: 'Geral' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo geral');
    expect(screen.queryByText('Conteudo de logs')).not.toBeInTheDocument();
  });

  it('liga a aba ao painel pelos atributos', () => {
    montar();

    const aba = screen.getByRole('tab', { name: 'Geral' });
    const painel = screen.getByRole('tabpanel');
    expect(aba).toHaveAttribute('aria-controls', painel.id);
    expect(painel).toHaveAttribute('aria-labelledby', aba.id);
  });

  it('troca de painel ao clicar', () => {
    montar();
    fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');
  });

  it('ativa ao mover com as setas, pulando desabilitadas', () => {
    const lista = montar();

    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');

    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');
  });

  it('circula nas extremidades e salta com Home e End', () => {
    const lista = montar();

    fireEvent.keyDown(lista, { key: 'ArrowLeft' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');

    fireEvent.keyDown(lista, { key: 'Home' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo geral');

    fireEvent.keyDown(lista, { key: 'End' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');
  });

  it('anuncia a orientacao e troca o eixo das setas na vertical', () => {
    render(<Tabs label="Secoes" items={abas} orientation="vertical" />);
    const lista = screen.getByRole('tablist', { name: 'Secoes' });

    expect(lista).toHaveAttribute('aria-orientation', 'vertical');

    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo geral');

    fireEvent.keyDown(lista, { key: 'ArrowDown' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');
  });

  it('respeita a aba controlada e reporta a escolha', () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <Tabs label="Config" items={abas} selectedKey="acesso" onSelectionChange={onSelectionChange} />,
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');

    fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));
    expect(onSelectionChange).toHaveBeenCalledWith('logs');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');

    rerender(<Tabs label="Config" items={abas} selectedKey="logs" onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');
  });
});
