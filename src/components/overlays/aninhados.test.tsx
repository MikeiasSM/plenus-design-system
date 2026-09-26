import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../actions/Button';
import { Dialog } from './Dialog';
import { Menu } from './Menu';
import { Tooltip } from './Tooltip';

const acoes = [{ key: 'editar', label: 'Editar' }];

describe('overlays aninhados em Dialog', () => {
  it('declara-se camada de cima, para o Dialog nao os esconder do leitor de tela', () => {
    render(
      <Dialog onClose={() => undefined} open title="Cadastro">
        <Menu items={acoes} label="Acoes">
          <Button>Acoes</Button>
        </Menu>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Acoes' }));

    const menu = screen.getByRole('menu');

    expect(menu).toHaveAttribute('data-react-aria-top-layer', 'true');
    expect(menu.closest('[aria-hidden="true"]')).toBeNull();
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
});
