import { useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../actions/Button';
import { Dialog } from './Dialog';
import { Drawer } from './Drawer';
import { Menu } from './Menu';
import { Popover } from './Popover';

function ComDialog({ onPagina, Moldura = Dialog }: { Moldura?: typeof Dialog; onPagina: () => void }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button onClick={() => setAberto(true)}>Abrir</Button>
      <Button onClick={onPagina}>Atrás</Button>
      <Moldura
        footer={<Button onClick={() => setAberto(false)}>Excluir</Button>}
        onOpenChange={setAberto}
        open={aberto}
        role="alertdialog"
        title="Excluir"
      />
    </>
  );
}

describe('o clique que fecha não atravessa para a página', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['Dialog', Dialog],
    ['Drawer', Drawer],
  ])('%s: o segundo clique do clique duplo na ação do rodapé não chega ao que está atrás', (_nome, Moldura) => {
    const onPagina = vi.fn();
    render(<ComDialog Moldura={Moldura as typeof Dialog} onPagina={onPagina} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }), { detail: 1 });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Atrás', hidden: true }), { detail: 2 });

    expect(onPagina).not.toHaveBeenCalled();
  });

  it('o clique seguinte, simples, passa para a página', () => {
    const onPagina = vi.fn();
    render(<ComDialog onPagina={onPagina} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }), { detail: 1 });

    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }), { detail: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }), { detail: 2 });

    expect(onPagina).toHaveBeenCalledTimes(2);
  });

  it('depois de meio segundo o clique duplo volta a passar', () => {
    vi.useFakeTimers();
    const onPagina = vi.fn();
    render(<ComDialog onPagina={onPagina} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }), { detail: 1 });

    act(() => vi.advanceTimersByTime(600));
    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }), { detail: 2 });

    expect(onPagina).toHaveBeenCalledTimes(1);
  });

  it('Dialog: o clique duplo no gatilho não o abre e fecha', () => {
    const onOpenChange = vi.fn();
    render(<Dialog onOpenChange={onOpenChange} open title="Editar" />);

    fireEvent.mouseDown(document.body, { detail: 2 });
    fireEvent.mouseUp(document.body, { detail: 2 });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Dialog: o clique simples fora segue fechando', () => {
    const onOpenChange = vi.fn();
    render(<Dialog onOpenChange={onOpenChange} open title="Editar" />);

    fireEvent.mouseDown(document.body, { detail: 1 });
    fireEvent.mouseUp(document.body, { detail: 1 });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('Menu: o segundo clique do clique duplo no item não chega à página', () => {
    const onPagina = vi.fn();
    render(
      <>
        <Menu items={[{ key: 'a', label: 'Arquivar' }]} label="Ações">
          <Button>Ações</Button>
        </Menu>
        <Button onClick={onPagina}>Linha</Button>
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ações' }));

    fireEvent.click(screen.getByRole('menuitem', { name: 'Arquivar' }), { detail: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Linha' }), { detail: 2 });

    expect(onPagina).not.toHaveBeenCalled();
  });

  it('Menu: o clique duplo no gatilho não abre e fecha', () => {
    render(
      <Menu items={[{ key: 'a', label: 'Arquivar' }]} label="Ações">
        <Button>Ações</Button>
      </Menu>,
    );
    const gatilho = screen.getByRole('button', { name: 'Ações' });

    fireEvent.click(gatilho, { detail: 1 });
    fireEvent.click(gatilho, { detail: 2 });

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('Popover: o segundo clique do clique duplo na ação de dentro não chega à página', () => {
    const onPagina = vi.fn();

    function Exemplo() {
      const gatilho = useRef<HTMLButtonElement>(null);
      const [aberto, setAberto] = useState(true);

      return (
        <>
          <button ref={gatilho} type="button">
            Filtros
          </button>
          <button onClick={onPagina} type="button">
            Linha
          </button>
          <Popover onOpenChange={setAberto} open={aberto} triggerRef={gatilho}>
            <Button onClick={() => setAberto(false)}>Aplicar</Button>
          </Popover>
        </>
      );
    }

    render(<Exemplo />);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }), { detail: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Linha' }), { detail: 2 });

    expect(onPagina).not.toHaveBeenCalled();
  });
});
