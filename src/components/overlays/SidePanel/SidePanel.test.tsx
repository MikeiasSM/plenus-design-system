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

function transbordar() {
  vi.stubGlobal('ResizeObserver', class {
    constructor(private aviso: () => void) {}
    observe() {
      this.aviso();
    }
    disconnect() {}
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 400 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 100 });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
});

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

  it('fechado por fora, por um botão de dentro, devolve o foco a quem abriu', () => {
    function Controlled() {
      const [open, setOpen] = useState(false);

      return (
        <>
          <button onClick={() => setOpen(true)} type="button">Filtros</button>
          <SidePanel footer={<button onClick={() => setOpen(false)} type="button">Aplicar filtros</button>} onOpenChange={setOpen} open={open} title="Filtros do painel">
            Corpo
          </SidePanel>
        </>
      );
    }
    render(<Controlled />);
    const trigger = screen.getByRole('button', { name: 'Filtros' });
    trigger.focus();
    fireEvent.click(trigger);

    const apply = screen.getByRole('button', { name: 'Aplicar filtros' });
    apply.focus();
    fireEvent.click(apply);

    expect(document.querySelector('aside')).toHaveAttribute('inert');
    expect(trigger).toHaveFocus();
  });

  it('fechado por fora com o foco fora do painel, não move o foco', () => {
    render(<WithTrigger />);
    const trigger = screen.getByRole('button', { name: 'Filtros' });
    fireEvent.click(trigger);
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(outside).toHaveFocus();
    outside.remove();
  });

  it('o Escape que fecha o painel marca o evento como tratado', () => {
    const seen: boolean[] = [];
    const listen = (event: Event) => seen.push(event.defaultPrevented);
    document.addEventListener('keydown', listen);
    render(<SidePanel defaultOpen title="Filtros"><input aria-label="Empresa" /></SidePanel>);

    fireEvent.keyDown(screen.getByLabelText('Empresa'), { key: 'Escape' });

    document.removeEventListener('keydown', listen);
    expect(seen).toEqual([true]);
  });

  it('o rodapé fica à vista e a página continua alcançável', () => {
    render(<WithTrigger />);
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));

    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtros' })).not.toHaveAttribute('aria-hidden');
  });

  it.each([false, true])('repassa id, className, data-* e aria-* ao elemento do painel, com a janela estreita = %s', (narrow) => {
    stubViewport(narrow);
    render(<SidePanel aria-describedby="ajuda" className="meu-painel" data-rad-id="filtros" id="painel" open title="Filtros">Corpo</SidePanel>);

    const painel = screen.getByRole(narrow ? 'dialog' : 'complementary', { name: 'Filtros' });
    expect(painel).toHaveAttribute('id', 'painel');
    expect(painel).toHaveAttribute('data-rad-id', 'filtros');
    expect(painel).toHaveAttribute('aria-describedby', 'ajuda');
    expect(painel).toHaveClass('meu-painel');
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

  describe('corpo que rola', () => {
    it('fica focável e nomeado quando transborda', () => {
      transbordar();
      render(<SidePanel open title="Filtros">Texto longo.</SidePanel>);

      expect(screen.getByRole('region', { name: 'Conteúdo de Filtros' })).toHaveAttribute('tabindex', '0');
    });

    it('não ganha tabindex quando cabe nem quando há algo focável dentro', () => {
      const { unmount } = render(<SidePanel open title="Filtros">Texto curto.</SidePanel>);
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
      unmount();

      transbordar();
      render(<SidePanel open title="Filtros"><input aria-label="Empresa" /></SidePanel>);
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });
  });
});
