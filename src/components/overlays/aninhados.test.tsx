import { createRef, useRef, useState, type ComponentPropsWithRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../actions/Button';
import { Dialog } from './Dialog';
import { Menu } from './Menu';
import { Popover } from './Popover';
import { Tooltip } from './Tooltip';

const acoes = [{ key: 'editar', label: 'Editar' }];

// O React avisa uma vez por tipo de elemento; um tipo so destes testes nao herda o aviso ja dado.
function GatilhoDoMenu(props: ComponentPropsWithRef<'button'>) {
  return <button type="button" {...props} />;
}

function AlvoDoTooltip(props: ComponentPropsWithRef<'button'>) {
  return <button type="button" {...props} />;
}

// O `ariaHideOutside` esconde o que entra depois do Dialog num MutationObserver, que roda em microtarefa:
// conferir antes dele passava tambem com o overlay escondido.
async function esperarOObservador() {
  await act(async () => undefined);
}

describe('overlays aninhados em Dialog', () => {
  it('declara-se camada de cima, para o Dialog nao os esconder do leitor de tela', async () => {
    render(
      <Dialog onClose={() => undefined} open title="Cadastro">
        <Menu items={acoes} label="Acoes">
          <Button>Acoes</Button>
        </Menu>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Acoes' }));
    await esperarOObservador();

    const menu = screen.getByRole('menu');

    expect(menu).toHaveAttribute('data-react-aria-top-layer', 'true');
    expect(menu.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('vale tambem para o Popover', async () => {
    function Tela() {
      const gatilho = useRef<HTMLButtonElement>(null);
      const [aberto, setAberto] = useState(false);

      return (
        <Dialog onClose={() => undefined} open title="Cadastro">
          <Button onClick={() => setAberto(true)} ref={gatilho}>
            Filtros
          </Button>
          <Popover aria-label="Painel de filtros" onClose={() => setAberto(false)} open={aberto} triggerRef={gatilho}>
            <Button>Aplicar</Button>
          </Popover>
        </Dialog>
      );
    }

    render(<Tela />);

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    await esperarOObservador();

    expect(screen.getByRole('dialog', { name: 'Painel de filtros' }).closest('[aria-hidden="true"]')).toBeNull();
  });
});

describe('gatilho do Menu', () => {
  it('preserva o ref, o onClick e o onKeyDown de quem o escreveu', () => {
    const referencia = createRef<HTMLButtonElement>();
    const cliques: string[] = [];

    render(
      <Menu items={acoes} label="Acoes">
        <Button onClick={() => cliques.push('consumidor')} ref={referencia}>
          Acoes
        </Button>
      </Menu>,
    );

    expect(referencia.current).toBeInstanceOf(HTMLButtonElement);

    fireEvent.click(screen.getByRole('button', { name: 'Acoes' }));

    expect(cliques).toEqual(['consumidor']);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('le o ref do gatilho pelas propriedades, sem o aviso do React 19', () => {
    const aviso = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <Menu items={acoes} label="Acoes">
        <GatilhoDoMenu ref={createRef<HTMLButtonElement>()}>Acoes</GatilhoDoMenu>
      </Menu>,
    );

    expect(aviso).not.toHaveBeenCalled();
    aviso.mockRestore();
  });
});

describe('Tooltip', () => {
  it('soma a propria descricao a que o filho ja tinha, em vez de substitui-la', () => {
    render(
      <>
        <span id="anterior">Descricao de fora</span>
        <Tooltip content="Explicacao" delay={0}>
          <button aria-describedby="anterior" type="button">
            Alvo
          </button>
        </Tooltip>
      </>,
    );

    const alvo = screen.getByRole('button', { name: 'Alvo' });

    fireEvent.focus(alvo);

    expect(alvo.getAttribute('aria-describedby')).toMatch(/^anterior /);
  });

  it('entrega o ref do filho a quem o pediu', () => {
    const referencia = createRef<HTMLButtonElement>();

    render(
      <Tooltip content="Explicacao">
        <button ref={referencia} type="button">
          Alvo
        </button>
      </Tooltip>,
    );

    expect(referencia.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('le o ref do filho pelas propriedades, sem o aviso do React 19', () => {
    const aviso = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <Tooltip content="Explicacao">
        <AlvoDoTooltip ref={createRef<HTMLButtonElement>()}>Alvo</AlvoDoTooltip>
      </Tooltip>,
    );

    expect(aviso).not.toHaveBeenCalled();
    aviso.mockRestore();
  });
});
