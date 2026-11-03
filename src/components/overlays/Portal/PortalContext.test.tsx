import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { Dialog } from '../Dialog';
import { Menu } from '../Menu';
import { Popover } from '../Popover';
import { Tooltip } from '../Tooltip';
import { Select } from '../../forms/Select';
import { PortalProvider } from './PortalContext';

function PopoverOpen({ portalContainer }: { portalContainer?: HTMLElement | null }) {
  const gatilho = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={gatilho} type="button">Gatilho</button>
      <Popover aria-label="Painel" defaultOpen portalContainer={portalContainer} triggerRef={gatilho}>
        Conteudo
      </Popover>
    </>
  );
}

const destinos: HTMLElement[] = [];

function criarDestino() {
  const destino = document.createElement('div');
  document.body.append(destino);
  destinos.push(destino);
  return destino;
}

describe('destino do portal', () => {
  afterEach(() => {
    destinos.splice(0).forEach((destino) => destino.remove());
  });

  it('sem configuracao os overlays vao ao body', () => {
    render(<PopoverOpen />);

    expect(screen.getByRole('dialog').parentElement).toBe(document.body);
  });

  it('o PortalProvider leva Dialog e Popover ao destino', () => {
    const destino = criarDestino();
    render(
      <PortalProvider container={destino}>
        <Dialog aria-label="Modal" defaultOpen>Corpo</Dialog>
        <PopoverOpen />
      </PortalProvider>,
    );

    expect(destino).toContainElement(screen.getByRole('dialog', { name: 'Modal' }));
    expect(destino).toContainElement(screen.getByRole('dialog', { name: 'Painel' }));
  });

  it('a prop do componente vale sobre o provider', () => {
    const doProvider = criarDestino();
    const daProp = criarDestino();
    render(
      <PortalProvider container={doProvider}>
        <PopoverOpen portalContainer={daProp} />
      </PortalProvider>,
    );

    expect(daProp).toContainElement(screen.getByRole('dialog'));
    expect(doProvider).toBeEmptyDOMElement();
  });

  it('provider sem elemento ainda mantem o body', () => {
    render(
      <PortalProvider container={null}>
        <PopoverOpen />
      </PortalProvider>,
    );

    expect(screen.getByRole('dialog').parentElement).toBe(document.body);
  });

  it('Menu, Tooltip e o painel do Select seguem o provider', () => {
    const destino = criarDestino();
    render(
      <PortalProvider container={destino}>
        <Menu defaultOpen items={[{ key: 'a', label: 'Abrir' }]} label="Acoes">
          <button type="button">Menu</button>
        </Menu>
        <Tooltip content="Dica" defaultOpen>
          <button type="button">Com dica</button>
        </Tooltip>
        <Select aria-label="Opcao" options={[{ label: 'Um', value: '1' }]} />
      </PortalProvider>,
    );

    fireEvent.click(screen.getByRole('combobox'));

    expect(destino).toContainElement(screen.getByRole('menu'));
    expect(destino).toContainElement(screen.getByRole('tooltip'));
    expect(destino).toContainElement(screen.getByRole('listbox'));
  });

  it('o submenu herda o destino da prop do Menu', () => {
    const destino = criarDestino();
    render(
      <Menu
        defaultOpen
        items={[{ key: 'exportar', label: 'Exportar', items: [{ key: 'csv', label: 'CSV' }] }]}
        label="Acoes"
        portalContainer={destino}
      >
        <button type="button">Menu</button>
      </Menu>,
    );

    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Exportar' }), { key: 'ArrowRight' });

    expect(destino).toContainElement(screen.getByRole('menu', { name: 'Exportar' }));
  });
});
