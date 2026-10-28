import { createRef, useRef, useState, type ComponentPropsWithRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../actions/Button';
import { ComboBox } from '../forms/ComboBox';
import { DatePicker } from '../forms/DatePicker';
import { DateTimePicker } from '../forms/DateTimePicker';
import { Select } from '../forms/Select';
import { TimePicker } from '../forms/TimePicker';
import { Dialog } from './Dialog';
import { Menu } from './Menu';
import { Popover } from './Popover';
import { Tooltip } from './Tooltip';

const acoes = [{ key: 'editar', label: 'Editar' }];
const tipos = [
  { value: 'nota', label: 'Nota' },
  { value: 'recibo', label: 'Recibo' },
];

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
      <Dialog open title="Cadastro">
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
        <Dialog open title="Cadastro">
          <Button onClick={() => setAberto(true)} ref={gatilho}>
            Filtros
          </Button>
          <Popover aria-label="Painel de filtros" onOpenChange={setAberto} open={aberto} triggerRef={gatilho}>
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

  it('vale para a lista do Select', async () => {
    render(
      <Dialog open title="Cadastro">
        <Select label="Tipo" options={tipos} />
      </Dialog>,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Tipo' }));
    await esperarOObservador();

    expect(screen.getByRole('listbox').closest('[aria-hidden="true"]')).toBeNull();
  });

  it('vale para a lista do ComboBox, e escolher nela nao fecha o Dialog', async () => {
    const fechar = vi.fn();

    render(
      <Dialog onOpenChange={fechar} open title="Cadastro">
        <ComboBox label="Tipo" options={tipos} />
      </Dialog>,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Tipo' }));
    await esperarOObservador();

    const opcao = screen.getByRole('option', { name: 'Recibo' });

    expect(opcao.closest('[aria-hidden="true"]')).toBeNull();

    fireEvent.pointerDown(opcao, { button: 0 });
    fireEvent.pointerUp(opcao, { button: 0 });
    fireEvent.click(opcao);

    expect(fechar).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox', { name: 'Tipo' })).toHaveValue('Recibo');
  });

  it.each([
    ['DatePicker', DatePicker, 'Abrir calendário'],
    ['DateTimePicker', DateTimePicker, 'Abrir calendário'],
    ['TimePicker', TimePicker, 'Abrir seletor de hora'],
  ])('vale para o painel do %s, que recebe o foco', async (_nome, Campo, abrir) => {
    render(
      <Dialog open title="Cadastro">
        <Campo label="Quando" />
      </Dialog>,
    );

    const gatilho = screen.getByRole('button', { name: abrir });

    gatilho.focus();
    fireEvent.click(gatilho);
    await esperarOObservador();

    const painel = screen.getByRole('dialog', { name: /de Quando$/ });

    expect(painel.closest('[aria-hidden="true"]')).toBeNull();
    expect(painel).toContainElement(document.activeElement as HTMLElement);
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
