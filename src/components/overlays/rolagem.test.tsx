import { useRef, useState, type ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../actions/Button';
import { ComboBox } from '../forms/ComboBox';
import { DatePicker } from '../forms/DatePicker';
import { Select } from '../forms/Select';
import { Menu } from './Menu';
import { Popover } from './Popover';
import { Tooltip } from './Tooltip';

const tipos = [
  { value: 'nota', label: 'Nota' },
  { value: 'recibo', label: 'Recibo' },
];

function Conteiner({ children }: { children: ReactNode }) {
  return <div data-testid="conteiner">{children}</div>;
}

function rolar(alvo: Element | Window | Document) {
  act(() => {
    alvo.dispatchEvent(new Event('scroll', { bubbles: false }));
  });
}

function PopoverAberto() {
  const gatilho = useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = useState(true);

  return (
    <>
      <Button ref={gatilho}>Filtros</Button>
      <Popover aria-label="Painel" onOpenChange={setAberto} open={aberto} triggerRef={gatilho}>
        <Button>Aplicar</Button>
      </Popover>
    </>
  );
}

describe('painéis fecham quando o gatilho rola', () => {
  const aoMudar = vi.fn();

  it('Select fecha ao rolar o ancestral e não ao rolar a própria lista', () => {
    render(
      <Conteiner>
        <Select label="Tipo" options={tipos} />
      </Conteiner>,
    );
    fireEvent.click(screen.getByRole('combobox', { name: 'Tipo' }));

    rolar(screen.getByRole('listbox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    rolar(screen.getByTestId('conteiner'));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Select fecha ao rolar a janela e devolve o foco ao gatilho', () => {
    render(<Select label="Tipo" options={tipos} />);
    const gatilho = screen.getByRole('combobox', { name: 'Tipo' });

    fireEvent.click(gatilho);
    rolar(window);

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(gatilho).toHaveFocus();
  });

  it('ComboBox fecha ao rolar o ancestral', () => {
    render(
      <Conteiner>
        <ComboBox label="Tipo" options={tipos} />
      </Conteiner>,
    );
    fireEvent.click(screen.getByRole('combobox', { name: 'Tipo' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    rolar(screen.getByTestId('conteiner'));

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Menu fecha ao rolar o ancestral e devolve o foco ao gatilho', () => {
    render(
      <Conteiner>
        <Menu items={[{ key: 'editar', label: 'Editar' }]} label="Ações">
          <Button>Ações</Button>
        </Menu>
      </Conteiner>,
    );
    const gatilho = screen.getByRole('button', { name: 'Ações' });

    fireEvent.click(gatilho);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    rolar(screen.getByTestId('conteiner'));

    expect(screen.queryByRole('menu')).toBeNull();
    expect(gatilho).toHaveFocus();
  });

  it('submenu fecha sozinho quando o menu pai rola', () => {
    render(
      <Menu
        items={[{ key: 'exportar', label: 'Exportar', items: [{ key: 'csv', label: 'CSV' }] }]}
        label="Ações"
        onOpenChange={aoMudar}
      >
        <Button>Ações</Button>
      </Menu>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ações' }));
    const pai = screen.getByRole('menuitem', { name: 'Exportar' });
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    fireEvent.keyDown(pai, { key: 'ArrowRight' });
    expect(screen.getByRole('menu', { name: 'Exportar' })).toBeInTheDocument();

    rolar(screen.getByRole('menu', { name: 'Ações' }));

    expect(screen.queryByRole('menu', { name: 'Exportar' })).toBeNull();
    expect(screen.getByRole('menu', { name: 'Ações' })).toBeInTheDocument();
    expect(pai).toHaveFocus();
    expect(aoMudar).not.toHaveBeenCalledWith(false);
  });

  it('Popover fecha ao rolar o ancestral', () => {
    render(
      <Conteiner>
        <PopoverAberto />
      </Conteiner>,
    );
    expect(screen.getByRole('dialog', { name: 'Painel' })).toBeInTheDocument();

    rolar(screen.getByTestId('conteiner'));

    expect(screen.queryByRole('dialog', { name: 'Painel' })).toBeNull();
  });

  it('DatePicker fecha ao rolar o ancestral e devolve o foco ao botão', () => {
    render(
      <Conteiner>
        <DatePicker label="Quando" />
      </Conteiner>,
    );
    const gatilho = screen.getByRole('button', { name: 'Abrir calendário' });

    fireEvent.click(gatilho);
    expect(screen.getByRole('dialog', { name: /de Quando$/ })).toBeInTheDocument();

    rolar(screen.getByTestId('conteiner'));

    expect(screen.queryByRole('dialog', { name: /de Quando$/ })).toBeNull();
    expect(gatilho).toHaveFocus();
  });

  it('Tooltip some ao rolar o ancestral', () => {
    render(
      <Conteiner>
        <Tooltip content="Explicação">
          <button type="button">Alvo</button>
        </Tooltip>
      </Conteiner>,
    );
    fireEvent.keyDown(document.body, { key: 'Tab' });
    act(() => screen.getByRole('button', { name: 'Alvo' }).focus());
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    rolar(screen.getByTestId('conteiner'));

    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
