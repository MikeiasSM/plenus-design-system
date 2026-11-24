import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

  describe('layout', () => {
    it('por padrao empilhado, sem a classe da forma em linha', () => {
      render(<Steps current="servidor" items={items} label="Etapas" />);

      expect(screen.getByRole('navigation').className).not.toMatch(/inline/);
    });

    it('em linha, mantem a semantica: lista, etapa atual e concluidas com visto', () => {
      render(<Steps current="servidor" items={items} label="Etapas" layout="inline" />);

      const nav = screen.getByRole('navigation', { name: 'Etapas' });
      expect(nav.className).toMatch(/inline/);
      expect(screen.getByText('Servidor').closest('[aria-current]')).toHaveAttribute('aria-current', 'step');
      const [conta, , teste] = screen.getAllByRole('listitem');
      expect(conta).toHaveTextContent('Conta, concluída');
      expect(conta.querySelector('[aria-hidden="true"] svg')).toBeInTheDocument();
      expect(teste.querySelector('[aria-hidden="true"]')).toHaveTextContent('3');
    });

    it('em linha, o marcador tem 22px e a linha, 1px', () => {
      const css = readFileSync(resolve(process.cwd(), 'src/components/navigation/Steps/Steps.module.css'), 'utf8');
      const bloco = (seletor: string) => {
        const inicio = css.indexOf(`${seletor} {`);
        expect(inicio).toBeGreaterThanOrEqual(0);
        return css.slice(inicio, css.indexOf('}', inicio));
      };

      expect(bloco('.inline')).toContain('--steps-marker: 22px;');
      expect(bloco('.inline .step:not(:last-child)::after')).toContain('height: 1px;');
    });
  });

  describe('showPosition', () => {
    it('mostra "Etapa 2 de 3" antes das etapas, como texto, sem controle', () => {
      render(<Steps current="servidor" items={items} label="Etapas" showPosition />);

      const posicao = screen.getByText('Etapa 2 de 3');
      expect(posicao.tagName).toBe('P');
      expect(posicao.nextElementSibling).toBe(screen.getByRole('list'));
      expect(posicao).not.toHaveAttribute('role');
      expect(posicao).not.toHaveAttribute('aria-live');
    });

    it('sem showPosition, nao mostra a posicao', () => {
      render(<Steps current="servidor" items={items} label="Etapas" />);

      expect(screen.queryByText(/Etapa \d/)).not.toBeInTheDocument();
    });

    it('formatPosition troca o texto e acompanha a etapa atual', () => {
      const formatPosition = vi.fn((atual: number, total: number) => `Passo ${atual}/${total}`);
      render(<Steps defaultCurrent="conta" formatPosition={formatPosition} items={items} label="Etapas" onCurrentChange={() => undefined} showPosition />);

      expect(screen.getByText('Passo 1/3')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Teste/ }));
      expect(screen.getByText('Passo 3/3')).toBeInTheDocument();
      expect(formatPosition).toHaveBeenLastCalledWith(3, 3);
    });
  });
});

