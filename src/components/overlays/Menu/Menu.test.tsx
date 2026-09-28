import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
});
