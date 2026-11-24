import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { Button } from '../../actions/Button';
import { Menu } from '../Menu';
import { Popover } from './Popover';

function Host() {
  const gatilho = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button ref={gatilho} onClick={() => setOpen(true)}>Filtros</Button>
      <Popover open={open} onOpenChange={setOpen} triggerRef={gatilho} aria-label="Filtros">
        <Button onClick={() => setOpen(false)}>Aplicar</Button>
      </Popover>
      <Button>Depois</Button>
    </div>
  );
}

function abrir() {
  const gatilho = screen.getByRole('button', { name: 'Filtros' });
  gatilho.focus();
  fireEvent.click(gatilho);
  return gatilho;
}

describe('Popover', () => {
  it('nao renderiza nada enquanto esta fechado', () => {
    render(<Host />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre ancorado ao gatilho e expoe nome acessivel', () => {
    render(<Host />);
    abrir();

    const popover = screen.getByRole('dialog', { name: 'Filtros' });
    expect(popover).toBeInTheDocument();
    expect(popover.style.position).toBe('absolute');
  });

  it('fecha pelo Escape e devolve o foco ao gatilho', () => {
    render(<Host />);
    const gatilho = abrir();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });

  it('soma os manipuladores de teclado e foco do produto aos do painel, e o Esc continua fechando', () => {
    const onKeyDown = vi.fn();
    const onKeyUp = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onOpenChange = vi.fn();

    function Tela() {
      const gatilho = useRef<HTMLButtonElement>(null);

      return (
        <>
          <Button ref={gatilho}>Filtros</Button>
          <Popover
            aria-label="Filtros"
            onBlur={onBlur}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onOpenChange={onOpenChange}
            open
            triggerRef={gatilho}
          >
            <input aria-label="Termo" />
          </Popover>
        </>
      );
    }

    render(<Tela />);
    const campo = screen.getByRole('textbox', { name: 'Termo' });

    fireEvent.focus(campo);
    fireEvent.keyUp(campo, { key: 'a' });
    fireEvent.blur(campo);
    fireEvent.keyDown(campo, { key: 'Escape' });

    expect(onFocus).toHaveBeenCalled();
    expect(onKeyUp).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('nao e modal: mantem o restante da pagina acessivel', () => {
    render(<Host />);
    abrir();

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Depois' })).toBeInTheDocument();
  });

  it('nao prende o foco: o Tab na borda segue a pagina a partir do gatilho', () => {
    render(<Host />);
    abrir();
    const aplicar = screen.getByRole('button', { name: 'Aplicar' });

    aplicar.focus();
    fireEvent.keyDown(aplicar, { key: 'Tab' });

    expect(screen.getByRole('button', { name: 'Depois' })).toHaveFocus();
  });

  it('deixa o clique do gatilho com o consumidor, sem fechar antes dele', () => {
    const cliques = vi.fn();

    function Alternavel() {
      const gatilho = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(false);

      return (
        <>
          <Button
            ref={gatilho}
            onClick={() => {
              cliques();
              setOpen((aberto) => !aberto);
            }}
          >
            Filtros
          </Button>
          <Popover aria-label="Filtros" onOpenChange={setOpen} open={open} triggerRef={gatilho}>
            <Button>Aplicar</Button>
          </Popover>
        </>
      );
    }

    render(<Alternavel />);

    const gatilho = screen.getByRole('button', { name: 'Filtros' });

    fireEvent.click(gatilho);
    fireEvent.pointerDown(gatilho);
    fireEvent.mouseDown(gatilho);
    fireEvent.pointerUp(gatilho);
    fireEvent.mouseUp(gatilho);
    fireEvent.click(gatilho);

    expect(cliques).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('leva id e data-* ao elemento do painel', () => {
    function ComId() {
      const gatilho = useRef<HTMLButtonElement>(null);

      return (
        <>
          <Button ref={gatilho}>Filtros</Button>
          <Popover aria-label="Filtros" data-origem="grade" id="painel" open triggerRef={gatilho}>
            <Button>Aplicar</Button>
          </Popover>
        </>
      );
    }

    render(<ComId />);

    expect(screen.getByRole('dialog', { name: 'Filtros' })).toHaveAttribute('id', 'painel');
    expect(screen.getByRole('dialog', { name: 'Filtros' })).toHaveAttribute('data-origem', 'grade');
  });

  it('sem controle, abre pelo defaultOpen e fecha sozinho', () => {
    const onOpenChange = vi.fn();

    function Solto() {
      const gatilho = useRef<HTMLButtonElement>(null);

      return (
        <>
          <Button ref={gatilho}>Filtros</Button>
          <Popover aria-label="Filtros" defaultOpen onOpenChange={onOpenChange} triggerRef={gatilho}>
            <Button>Aplicar</Button>
          </Popover>
        </>
      );
    }

    render(<Solto />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('Esc com o foco fora do painel', () => {
    it('fecha, avisa uma vez e deixa o foco onde estava', () => {
      const onOpenChange = vi.fn();

      function Tela() {
        const gatilho = useRef<HTMLButtonElement>(null);
        const [open, setOpen] = useState(true);

        return (
          <>
            <Button ref={gatilho}>Filtros</Button>
            <Popover
              aria-label="Filtros"
              onOpenChange={(proximo) => {
                onOpenChange(proximo);
                setOpen(proximo);
              }}
              open={open}
              triggerRef={gatilho}
            >
              <Button>Aplicar</Button>
            </Popover>
            <input aria-label="Busca" />
          </>
        );
      }

      render(<Tela />);
      const busca = screen.getByRole('textbox', { name: 'Busca' });
      busca.focus();

      fireEvent.keyDown(busca, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(onOpenChange).toHaveBeenCalledOnce();
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(busca).toHaveFocus();
    });

    it('respeita o Esc que outra camada já tratou', () => {
      const onOpenChange = vi.fn();
      const tratar = (event: KeyboardEvent) => event.preventDefault();
      document.addEventListener('keydown', tratar, true);

      function Tela() {
        const gatilho = useRef<HTMLButtonElement>(null);

        return (
          <>
            <Button ref={gatilho}>Filtros</Button>
            <Popover aria-label="Filtros" onOpenChange={onOpenChange} open triggerRef={gatilho}>
              <Button>Aplicar</Button>
            </Popover>
            <input aria-label="Busca" />
          </>
        );
      }

      render(<Tela />);
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Busca' }), { key: 'Escape' });
      document.removeEventListener('keydown', tratar, true);

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('com dois abertos, fecha só o de cima', () => {
      const fora = vi.fn();
      const dentro = vi.fn();

      function Tela() {
        const gatilhoFora = useRef<HTMLButtonElement>(null);
        const gatilhoDentro = useRef<HTMLButtonElement>(null);

        return (
          <>
            <Button ref={gatilhoFora}>Filtros</Button>
            <Popover aria-label="Filtros" onOpenChange={fora} open triggerRef={gatilhoFora}>
              <Button ref={gatilhoDentro}>Mais</Button>
              <Popover aria-label="Mais filtros" onOpenChange={dentro} open triggerRef={gatilhoDentro}>
                <Button>Aplicar</Button>
              </Popover>
            </Popover>
            <input aria-label="Busca" />
          </>
        );
      }

      render(<Tela />);
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Busca' }), { key: 'Escape' });

      expect(dentro).toHaveBeenCalledWith(false);
      expect(fora).not.toHaveBeenCalled();
    });

    it('cede ao menu aberto de dentro do painel, que fecha sozinho', () => {
      const onOpenChange = vi.fn();

      function Tela() {
        const gatilho = useRef<HTMLButtonElement>(null);

        return (
          <>
            <Button ref={gatilho}>Filtros</Button>
            <Popover aria-label="Filtros" onOpenChange={onOpenChange} open triggerRef={gatilho}>
              <Menu items={[{ key: 'editar', label: 'Editar' }]} label="Ações">
                <Button>Ações</Button>
              </Menu>
            </Popover>
          </>
        );
      }

      render(<Tela />);
      fireEvent.click(screen.getByRole('button', { name: 'Ações' }));
      fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Editar' }), { key: 'Escape' });

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });
});
