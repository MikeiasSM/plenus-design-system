import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { MenuItem, MenuSection } from '../../overlays/Menu';
import buttonStyles from '../Button/Button.module.css';
import { SplitButton, type SplitButtonProps } from './SplitButton';
import styles from './SplitButton.module.css';

const itens: (MenuItem | MenuSection)[] = [
  { key: 'rascunho', label: 'Salvar como rascunho' },
  { key: 'copia', label: 'Salvar uma cópia', shortcut: 'Ctrl+Shift+S' },
  { key: 'modelo', label: 'Salvar como modelo', disabled: true },
];

function montar(props: Partial<SplitButtonProps> = {}) {
  const onAction = vi.fn();
  const onMenuAction = vi.fn();
  const utils = render(<SplitButton items={itens} label="Salvar" onAction={onAction} onMenuAction={onMenuAction} {...props} />);
  const principal = screen.getByRole('button', { name: props.label ?? 'Salvar' });
  const mais = screen.getByRole('button', { name: /^(Mais opções|Outras)/ });
  return { ...utils, mais, onAction, onMenuAction, principal };
}

describe('SplitButton', () => {
  describe('nomes', () => {
    it('agrupa os dois botões com o nome da ação', () => {
      const { mais, principal } = montar();
      const grupo = screen.getByRole('group', { name: 'Salvar' });

      expect(within(grupo).getAllByRole('button')).toEqual([principal, mais]);
    });

    it('dá ao botão do menu o nome padrão, com o label em minúsculas, e o anuncia como menu recolhido', () => {
      const { mais } = montar({ label: 'Exportar PDF' });

      expect(mais).toHaveAccessibleName('Mais opções de exportar pdf');
      expect(mais).toHaveAttribute('aria-haspopup', 'menu');
      expect(mais).toHaveAttribute('aria-expanded', 'false');
    });

    it('aceita o nome do menu em menuLabel, também no próprio menu', () => {
      const { mais } = montar({ menuLabel: 'Outras formas de salvar' });

      expect(mais).toHaveAccessibleName('Outras formas de salvar');
      fireEvent.click(mais);

      expect(screen.getByRole('menu', { name: 'Outras formas de salvar' })).toBeInTheDocument();
    });
  });

  describe('ações', () => {
    it('chama onAction na ação principal, sem abrir o menu', () => {
      const { onAction, onMenuAction, principal } = montar();

      fireEvent.click(principal);

      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onMenuAction).not.toHaveBeenCalled();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('chama onMenuAction com o key do item, depois do onSelect do próprio item', () => {
      const ordem: string[] = [];
      const onMenuAction = vi.fn(() => ordem.push('onMenuAction'));
      const { mais, onAction } = montar({
        items: [{ key: 'csv', label: 'Exportar em CSV', onSelect: () => ordem.push('onSelect') }],
        onMenuAction,
      });

      fireEvent.click(mais);
      fireEvent.click(screen.getByRole('menuitem', { name: 'Exportar em CSV' }));

      expect(onMenuAction).toHaveBeenCalledWith('csv');
      expect(ordem).toEqual(['onSelect', 'onMenuAction']);
      expect(onAction).not.toHaveBeenCalled();
    });

    it('avisa também os itens dentro de grupos e de submenus', () => {
      const { mais, onMenuAction } = montar({
        items: [
          { key: 'a', items: [{ key: 'pdf', label: 'Em PDF' }] },
          { key: 'b', items: [{ key: 'outros', label: 'Outros formatos', items: [{ key: 'odt', label: 'Em ODT' }] }] },
        ],
      });

      fireEvent.click(mais);
      fireEvent.click(screen.getByRole('menuitem', { name: 'Em PDF' }));
      expect(onMenuAction).toHaveBeenLastCalledWith('pdf');

      fireEvent.click(mais);
      const menu = screen.getByRole('menu');
      fireEvent.keyDown(menu, { key: 'ArrowDown' });
      fireEvent.keyDown(menu, { key: 'ArrowRight' });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Em ODT' }));
      expect(onMenuAction).toHaveBeenLastCalledWith('odt');
    });

    it('mantém o rótulo da ação principal depois de uma escolha no menu', () => {
      const { mais, onAction, onMenuAction, principal } = montar();

      fireEvent.click(mais);
      fireEvent.click(screen.getByRole('menuitem', { name: /Salvar uma cópia/ }));
      fireEvent.click(principal);

      expect(principal).toHaveTextContent(/^Salvar$/);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onMenuAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('menu pelo teclado', () => {
    it('abre com a seta para baixo no primeiro item e com a seta para cima no último habilitado', () => {
      const { mais } = montar();

      fireEvent.keyDown(mais, { key: 'ArrowDown' });
      expect(screen.getByRole('menuitem', { name: 'Salvar como rascunho' })).toHaveFocus();
      expect(mais).toHaveAttribute('aria-expanded', 'true');

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
      fireEvent.keyDown(mais, { key: 'ArrowUp' });
      expect(screen.getByRole('menuitem', { name: /Salvar uma cópia/ })).toHaveFocus();
    });

    it('percorre os itens pulando o desabilitado, escolhe e devolve o foco ao botão do menu', () => {
      const { mais, onMenuAction } = montar();

      fireEvent.keyDown(mais, { key: 'ArrowDown' });
      const menu = screen.getByRole('menu', { name: 'Mais opções de salvar' });
      fireEvent.keyDown(menu, { key: 'ArrowDown' });
      const copia = screen.getByRole('menuitem', { name: /Salvar uma cópia/ });
      expect(copia).toHaveFocus();

      // O último item está desabilitado: a seta não passa dele, e o End para no último habilitado.
      fireEvent.keyDown(menu, { key: 'ArrowDown' });
      expect(copia).toHaveFocus();

      fireEvent.keyDown(menu, { key: 'Home' });
      expect(screen.getByRole('menuitem', { name: 'Salvar como rascunho' })).toHaveFocus();

      fireEvent.keyDown(menu, { key: 'End' });
      expect(copia).toHaveFocus();
      // O Enter no `<button role="menuitem">` vira clique no navegador.
      fireEvent.click(copia);

      expect(onMenuAction).toHaveBeenCalledWith('copia');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(mais).toHaveFocus();
    });

    it('fecha pelo Escape sem escolher e devolve o foco', () => {
      const { mais, onAction, onMenuAction } = montar();

      fireEvent.keyDown(mais, { key: 'ArrowDown' });
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(mais).toHaveFocus();
      expect(onAction).not.toHaveBeenCalled();
      expect(onMenuAction).not.toHaveBeenCalled();
    });

    it('mostra o atalho e o anuncia em aria-keyshortcuts', () => {
      const { mais } = montar();

      fireEvent.click(mais);

      expect(screen.getByRole('menuitem', { name: /Salvar uma cópia/ })).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+S');
    });
  });

  describe('desabilitado', () => {
    it('trava as duas partes', () => {
      const { mais, onAction, principal } = montar({ disabled: true });

      expect(principal).toBeDisabled();
      expect(mais).toBeDisabled();

      fireEvent.click(principal);
      fireEvent.click(mais);

      expect(onAction).not.toHaveBeenCalled();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('fecha o menu aberto quando passa a desabilitado, e não o reabre ao voltar', () => {
      const { mais, rerender } = montar();

      fireEvent.click(mais);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      rerender(<SplitButton disabled items={itens} label="Salvar" />);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      rerender(<SplitButton items={itens} label="Salvar" />);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('um item desabilitado no menu não trava a ação principal nem é escolhido', () => {
      const { mais, onAction, onMenuAction, principal } = montar();

      fireEvent.click(mais);
      const modelo = screen.getByRole('menuitem', { name: 'Salvar como modelo' });
      expect(modelo).toBeDisabled();
      fireEvent.click(modelo);
      expect(onMenuAction).not.toHaveBeenCalled();

      expect(principal).toBeEnabled();
      fireEvent.click(principal);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('mantém o tom de perigo do item', () => {
      const { mais } = montar({ items: [{ key: 'excluir', label: 'Excluir rascunho', tone: 'danger' }] });

      fireEvent.click(mais);

      expect(screen.getByRole('menuitem', { name: 'Excluir rascunho' }).className).toMatch(/danger/);
    });
  });

  describe('variantes', () => {
    it.each(['primary', 'secondary'] as const)('aplica %s ao grupo e às duas partes', (variante) => {
      const { mais, principal } = montar({ variant: variante });

      expect(screen.getByRole('group')).toHaveClass(styles.splitButton, styles[variante]);
      expect(principal).toHaveClass(buttonStyles[variante], styles.main);
      expect(mais).toHaveClass(buttonStyles[variante], styles.more);
    });

    it('usa primary e md por padrão', () => {
      const { mais, principal } = montar();

      expect(screen.getByRole('group')).toHaveClass(styles.primary);
      expect(principal).toHaveClass(buttonStyles.primary, buttonStyles.md);
      expect(mais).toHaveClass(buttonStyles.md);
    });

    it.each(['sm', 'md', 'lg'] as const)('passa o tamanho %s às duas partes', (tamanho) => {
      const { mais, principal } = montar({ size: tamanho });

      expect(principal).toHaveClass(buttonStyles[tamanho]);
      expect(mais).toHaveClass(buttonStyles[tamanho]);
    });

    it('repassa className e atributos ao grupo', () => {
      montar({ className: 'extra', id: 'salvar' });

      expect(screen.getByRole('group')).toHaveClass('extra');
      expect(screen.getByRole('group')).toHaveAttribute('id', 'salvar');
    });

    it('fecha os cantos de dentro, separa o primário por um fio e o secundário pela borda dividida', () => {
      const css = readFileSync(resolve(__dirname, 'SplitButton.module.css'), 'utf8');

      expect(css).toMatch(/\.splitButton \.main \{[^}]*border-top-right-radius: 0;[^}]*border-bottom-right-radius: 0;/);
      expect(css).toMatch(/\.splitButton \.more \{[^}]*border-top-left-radius: 0;[^}]*border-bottom-left-radius: 0;/);
      expect(css).toMatch(/\.primary \.more::before \{[^}]*width: 1px;[^}]*color-mix\(in srgb, var\(--pl-color-on-primary\) 25%, transparent\)/);
      expect(css).toMatch(/\.secondary \.more \{[^}]*margin-left: -1px;/);
    });
  });
});
