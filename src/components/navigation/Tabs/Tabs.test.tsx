import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
    const onSelectedKeyChange = vi.fn();
    const { rerender } = render(
      <Tabs label="Config" items={abas} selectedKey="acesso" onSelectedKeyChange={onSelectedKeyChange} />,
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');

    fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));
    expect(onSelectedKeyChange).toHaveBeenCalledWith('logs');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');

    rerender(<Tabs label="Config" items={abas} selectedKey="logs" onSelectedKeyChange={onSelectedKeyChange} />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');
  });

  it('comeca pelo defaultSelectedKey e troca sem controle', () => {
    montar({ defaultSelectedKey: 'acesso' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');

    fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');
  });

  it('mantem uma aba alcancavel pelo Tab quando a escolhida nao existe ou esta desabilitada', () => {
    const abas = [
      { content: 'Um', disabled: true, key: 'um', label: 'Um' },
      { content: 'Dois', key: 'dois', label: 'Dois' },
    ];
    const { rerender } = render(<Tabs defaultSelectedKey="um" items={abas} label="Secoes" />);

    expect(screen.getByRole('tab', { name: 'Dois' })).toHaveAttribute('tabindex', '0');

    rerender(<Tabs items={abas} label="Secoes" selectedKey="sumiu" />);

    expect(screen.getByRole('tab', { name: 'Dois' })).toHaveAttribute('tabindex', '0');
  });

  it('na vertical com fillHeight, o painel estica ate a altura da raiz para rolar', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/navigation/Tabs/Tabs.module.css'), 'utf8');
    const inicio = css.indexOf('.vertical.fillHeight .panel {');

    expect(inicio).toBeGreaterThanOrEqual(0);
    expect(css.slice(inicio, css.indexOf('}', inicio))).toContain('align-self: stretch;');
  });

  describe('count', () => {
    it('mostra o selo e poe a contagem no nome da aba, depois de uma virgula', () => {
      render(<Tabs items={[{ ...abas[0], count: 1250 }, abas[1]]} label="Config" />);

      const aba = screen.getByRole('tab', { name: 'Geral, 1.250' });
      const visiveis = aba.querySelectorAll('[aria-hidden="true"]');
      expect(visiveis[0]).toHaveTextContent('Geral');
      expect(visiveis[1]).toHaveTextContent('1.250');
      expect(screen.getByRole('tab', { name: 'Acesso' })).toBeInTheDocument();
    });

    it('sem count, a aba e so o rotulo, sem envoltorio', () => {
      render(<Tabs items={abas} label="Config" />);

      expect(screen.getByRole('tab', { name: 'Geral' }).innerHTML).toBe('Geral');
    });
  });

  describe('actions', () => {
    it('ficam fora do tablist, num envoltorio irmao da lista', () => {
      render(<Tabs actions={<button type="button">Nova aba</button>} items={abas} label="Config" />);

      const lista = screen.getByRole('tablist');
      const acao = screen.getByRole('button', { name: 'Nova aba' });
      expect(lista).not.toContainElement(acao);
      expect(lista.parentElement).toContainElement(acao);
      expect(lista.parentElement).not.toHaveAttribute('role');
    });

    it('nao entram nas setas das abas', () => {
      render(<Tabs actions={<button type="button">Nova aba</button>} items={abas} label="Config" />);

      fireEvent.keyDown(screen.getByRole('button', { name: 'Nova aba' }), { key: 'ArrowRight' });
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo geral');
    });

    it('sem actions, a lista fica direto na raiz, como antes', () => {
      const { container } = render(<Tabs items={abas} label="Config" />);

      expect(screen.getByRole('tablist').parentElement).toBe(container.firstElementChild);
    });
  });

  describe('muted', () => {
    it('marca a aba com data-muted, que continua focavel e selecionavel', () => {
      const lista = montar({ items: [abas[0], { ...abas[1], muted: true }, abas[3]] });

      const apagada = screen.getByRole('tab', { name: 'Acesso' });
      expect(apagada).toHaveAttribute('data-muted', 'true');
      expect(apagada).not.toBeDisabled();
      expect(screen.getByRole('tab', { name: 'Geral' })).not.toHaveAttribute('data-muted');

      fireEvent.keyDown(lista, { key: 'ArrowRight' });
      expect(apagada).toHaveAttribute('aria-selected', 'true');
      expect(apagada).toHaveFocus();
      expect(apagada).toHaveAttribute('tabindex', '0');
    });
  });

  describe('appearance', () => {
    it('segmentado mantem a semantica de abas, com tablist, tabpanel e as setas', () => {
      const { container } = render(<Tabs appearance="segmented" items={abas} label="Config" />);
      const lista = screen.getByRole('tablist', { name: 'Config' });

      expect(container.firstElementChild?.className).toMatch(/segmented/);
      fireEvent.keyDown(lista, { key: 'ArrowRight' });
      expect(screen.getByRole('tab', { name: 'Acesso' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');
    });

    it('sem appearance, a raiz nao leva a classe do segmentado', () => {
      const { container } = render(<Tabs items={abas} label="Config" />);

      expect(container.firstElementChild?.className).not.toMatch(/segmented/);
    });
  });
});
