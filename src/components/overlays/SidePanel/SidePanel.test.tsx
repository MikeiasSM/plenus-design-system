import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SidePanel } from './SidePanel';

function stubViewport(narrow: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: narrow, addEventListener: () => {}, removeEventListener: () => {} }));
}

function WithTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">Filtros</button>
      <SidePanel footer={<button type="button">Aplicar</button>} onOpenChange={setOpen} open={open} title="Filtros do painel">
        <input aria-label="Empresa" />
      </SidePanel>
    </>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('SidePanel', () => {
  it('fechado, fica inerte; aberto, é uma região nomeada pelo título, sem fundo inerte nem foco preso', () => {
    const { rerender } = render(<SidePanel open={false} title="Filtros">Corpo</SidePanel>);
    expect(document.querySelector('aside')).toHaveAttribute('inert');

    rerender(<SidePanel open title="Filtros">Corpo</SidePanel>);

    const panel = screen.getByRole('complementary', { name: 'Filtros' });
    expect(panel).not.toHaveAttribute('inert');
    expect(panel).not.toHaveAttribute('aria-modal');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre pelo defaultOpen e fecha sozinho pelo botão de fechar', () => {
    const onOpenChange = vi.fn();
    render(<SidePanel defaultOpen onOpenChange={onOpenChange} title="Filtros">Corpo</SidePanel>);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(document.querySelector('aside')).toHaveAttribute('inert');
  });

  it('no modo controlado, só quem controla fecha', () => {
    const onOpenChange = vi.fn();
    render(<SidePanel onOpenChange={onOpenChange} open title="Filtros">Corpo</SidePanel>);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(document.querySelector('aside')).not.toHaveAttribute('inert');
  });

  it('leva o foco ao painel ao abrir e o devolve a quem abriu ao fechar pelo Escape', () => {
    render(<WithTrigger />);
    const trigger = screen.getByRole('button', { name: 'Filtros' });
    trigger.focus();

    fireEvent.click(trigger);
    expect(screen.getByRole('complementary').firstElementChild).toHaveFocus();

    fireEvent.keyDown(screen.getByLabelText('Empresa'), { key: 'Escape' });

    expect(document.querySelector('aside')).toHaveAttribute('inert');
    expect(trigger).toHaveFocus();
  });

  it('o rodapé fica à vista e a página continua alcançável', () => {
    render(<WithTrigger />);
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));

    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtros' })).not.toHaveAttribute('aria-hidden');
  });

  it('em largura estreita vira gaveta modal, com o lado e o foco do Drawer', () => {
    stubViewport(true);
    render(<WithTrigger />);
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));

    const drawer = screen.getByRole('dialog', { name: 'Filtros do painel' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();

    fireEvent.keyDown(drawer, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
