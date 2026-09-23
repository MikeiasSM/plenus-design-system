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
});
