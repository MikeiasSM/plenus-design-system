import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../../actions/Button';
import { Menu, type MenuItem } from './Menu';

const editar = vi.fn();
const duplicar = vi.fn();

const itens: MenuItem[] = [
  { key: 'editar', label: 'Editar', onSelect: editar },
  { key: 'duplicar', label: 'Duplicar', onSelect: duplicar },
  { key: 'arquivar', label: 'Arquivar', disabled: true },
  { key: 'excluir', label: 'Excluir' },
];

function montar() {
  render(<Menu label="Acoes do modulo" items={itens}><Button>Acoes</Button></Menu>);
  return screen.getByRole('button', { name: 'Acoes' });
}

describe('Menu', () => {
  beforeEach(() => vi.clearAllMocks());

  it('anuncia o popup no gatilho e abre ao clicar', () => {
    const gatilho = montar();
    expect(gatilho).toHaveAttribute('aria-haspopup', 'menu');
    expect(gatilho).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(gatilho);

    expect(screen.getByRole('menu', { name: 'Acoes do modulo' })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(4);
    expect(gatilho).toHaveAttribute('aria-expanded', 'true');
  });

  it('foca a primeira opcao ao abrir e navega com as setas pulando desabilitados', () => {
    fireEvent.click(montar());

    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();

    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Duplicar' })).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveFocus();
  });

  it('abre na ultima opcao com seta para cima', () => {
    fireEvent.keyDown(montar(), { key: 'ArrowUp' });

    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveFocus();
  });

  it('aciona a opcao e fecha', () => {
    fireEvent.click(montar());
    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicar' }));

    expect(duplicar).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('busca por digitacao', () => {
    fireEvent.click(montar());
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'e' });

    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveFocus();
  });

  it('fecha pelo Escape e devolve o foco ao gatilho', () => {
    const gatilho = montar();
    gatilho.focus();
    fireEvent.click(gatilho);

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });

  it('devolve o foco ao gatilho antes do onSelect, para o que ele abrir guardar o gatilho', () => {
    let emFoco: Element | null = null;

    render(
      <Menu items={[{ key: 'novo', label: 'Novo', onSelect: () => (emFoco = document.activeElement) }]} label="Acoes">
        <Button>Acoes</Button>
      </Menu>,
    );

    const gatilho = screen.getByRole('button', { name: 'Acoes' });

    fireEvent.click(gatilho);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Novo' }));

    // O Dialog aberto pelo onSelect guardava o item do menu, que sai da tela, e devolvia o foco ao body.
    expect(emFoco).toBe(gatilho);
  });

  it('nao tira o foco do campo que o onSelect acabou de mostrar', () => {
    function Tela() {
      const [editando, setEditando] = useState(false);

      return (
        <>
          <Menu items={[{ key: 'renomear', label: 'Renomear', onSelect: () => setEditando(true) }]} label="Acoes">
            <Button>Acoes</Button>
          </Menu>
          {editando && <input aria-label="Nome" autoFocus />}
        </>
      );
    }

    render(<Tela />);

    fireEvent.click(screen.getByRole('button', { name: 'Acoes' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Renomear' }));

    expect(screen.getByLabelText('Nome')).toHaveFocus();
  });

  it('abre pela escolha inicial e avisa cada mudanca', () => {
    const mudou = vi.fn();

    render(
      <Menu defaultOpen items={itens} label="Acoes do modulo" onOpenChange={mudou}>
        <Button>Acoes</Button>
      </Menu>,
    );

    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

    expect(mudou).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('respeita a abertura controlada, sem decidir por conta propria', () => {
    const mudou = vi.fn();

    render(
      <Menu items={itens} label="Acoes do modulo" onOpenChange={mudou} open>
        <Button>Acoes</Button>
      </Menu>,
    );

    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicar' }));

    expect(mudou).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acoes' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('deixa o foco no campo clicado fora do menu', () => {
    render(
      <>
        <Menu items={itens} label="Acoes do modulo">
          <Button>Acoes</Button>
        </Menu>
        <input aria-label="Busca" />
      </>,
    );

    const busca = screen.getByLabelText('Busca');

    fireEvent.click(screen.getByRole('button', { name: 'Acoes' }));
    fireEvent.pointerDown(busca);
    fireEvent.mouseDown(busca);
    busca.focus();
    fireEvent.pointerUp(busca);
    fireEvent.mouseUp(busca);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(busca).toHaveFocus();
  });

  it('agrupa itens em secoes com titulo, e o teclado percorre todos como uma lista so', () => {
    render(
      <Menu
        items={[
          { key: 'transformar', title: 'Transformar em', items: [
            { checked: true, key: 'paragrafo', label: 'Parágrafo' },
            { checked: false, key: 'titulo', label: 'Título' },
          ] },
          { key: 'opcoes', items: [
            { key: 'duplicar', label: 'Duplicar', shortcut: 'Ctrl+D' },
            { key: 'remover', label: 'Remover bloco', tone: 'danger' },
          ] },
        ]}
        label="Bloco"
      >
        <Button>Bloco</Button>
      </Menu>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Bloco' }));

    expect(screen.getByRole('group', { name: 'Transformar em' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemcheckbox', { name: 'Parágrafo' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemcheckbox', { name: 'Título' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('menuitem', { name: 'Duplicar' })).toHaveAttribute('aria-keyshortcuts', 'Control+D');

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'End' });
    expect(screen.getByRole('menuitem', { name: 'Remover bloco' })).toHaveFocus();
  });

  it('anuncia o atalho pelos nomes de tecla da ARIA e mantém o texto escrito à vista', () => {
    render(
      <Menu
        items={[
          { key: 'duplicar', label: 'Duplicar', shortcut: 'Ctrl+Shift+D' },
          { key: 'buscar', label: 'Buscar', shortcut: '⌘K', shortcutKeys: 'Meta+K Control+K' },
        ]}
        label="Bloco"
      >
        <Button>Bloco</Button>
      </Menu>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Bloco' }));

    const duplicar = screen.getByRole('menuitem', { name: 'Duplicar' });
    expect(duplicar).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+D');
    expect(duplicar).toHaveTextContent('Ctrl+Shift+D');
    expect(screen.getByRole('menuitem', { name: 'Buscar' })).toHaveAttribute('aria-keyshortcuts', 'Meta+K Control+K');
  });

  describe('submenu', () => {
    const exportar = vi.fn();
    const comSubmenu: MenuItem[] = [
      { key: 'editar', label: 'Editar' },
      {
        key: 'exportar',
        label: 'Exportar',
        items: [
          { key: 'csv', label: 'CSV', onSelect: exportar },
          { key: 'pdf', label: 'PDF' },
        ],
      },
    ];

    function abrir() {
      render(<Menu label="Acoes" items={comSubmenu}><Button>Acoes</Button></Menu>);
      fireEvent.click(screen.getByRole('button', { name: 'Acoes' }));
      return screen.getByRole('menuitem', { name: 'Exportar' });
    }

    it('abre com a seta para a direita no primeiro item e volta ao pai com a seta para a esquerda', () => {
      const pai = abrir();
      expect(pai).toHaveAttribute('aria-haspopup', 'menu');
      expect(pai).toHaveAttribute('aria-expanded', 'false');

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
      fireEvent.keyDown(pai, { key: 'ArrowRight' });

      expect(pai).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menuitem', { name: 'CSV' })).toHaveFocus();

      fireEvent.keyDown(screen.getByRole('menuitem', { name: 'CSV' }), { key: 'ArrowLeft' });

      expect(screen.queryByRole('menu', { name: 'Exportar' })).not.toBeInTheDocument();
      expect(screen.getByRole('menu', { name: 'Acoes' })).toBeInTheDocument();
      expect(pai).toHaveFocus();
    });

    it('fecha so o submenu com Esc e o menu inteiro ao escolher', () => {
      const pai = abrir();
      fireEvent.click(pai);
      fireEvent.keyDown(screen.getByRole('menuitem', { name: 'CSV' }), { key: 'Escape' });

      expect(screen.getByRole('menu', { name: 'Acoes' })).toBeInTheDocument();
      expect(pai).toHaveFocus();

      fireEvent.click(pai);
      fireEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));

      expect(exportar).toHaveBeenCalledOnce();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Acoes' })).toHaveFocus();
    });

    it('abre ao passar o ponteiro, depois de uma espera, e fecha ao passar a outro item', () => {
      vi.useFakeTimers();
      const pai = abrir();

      fireEvent.pointerEnter(pai);
      expect(screen.queryByRole('menu', { name: 'Exportar' })).not.toBeInTheDocument();
      act(() => vi.advanceTimersByTime(200));
      expect(screen.getByRole('menu', { name: 'Exportar' })).toBeInTheDocument();

      fireEvent.pointerEnter(screen.getByRole('menuitem', { name: 'Editar' }));
      fireEvent.pointerEnter(screen.getByRole('menu', { name: 'Exportar' }));
      act(() => vi.advanceTimersByTime(200));
      expect(screen.getByRole('menu', { name: 'Exportar' })).toBeInTheDocument();

      fireEvent.pointerEnter(screen.getByRole('menuitem', { name: 'Editar' }));
      act(() => vi.advanceTimersByTime(200));
      expect(screen.queryByRole('menu', { name: 'Exportar' })).not.toBeInTheDocument();
      vi.useRealTimers();
    });
  });
});
