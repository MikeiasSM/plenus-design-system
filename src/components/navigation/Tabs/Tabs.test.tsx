import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Tabs, type TabItem } from './Tabs';

const abas: TabItem[] = [
  { key: 'geral', label: 'Geral', content: 'Conteudo geral' },
  { key: 'acesso', label: 'Acesso', content: 'Conteudo de acesso' },
  { key: 'antigo', label: 'Antigo', content: 'Indisponivel', disabled: true },
  { key: 'logs', label: 'Logs', content: 'Conteudo de logs' },
];

function montar(props: Partial<React.ComponentProps<typeof Tabs>> = {}) {
  render(<Tabs label="Configuracoes" items={abas} {...props} />);
  return screen.getByRole('tablist', { name: 'Configuracoes' });
}

describe('Tabs', () => {
  it('seleciona a primeira aba habilitada e mostra apenas o painel dela', () => {
    montar();

    expect(screen.getByRole('tab', { name: 'Geral' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo geral');
    expect(screen.queryByText('Conteudo de logs')).not.toBeInTheDocument();
  });

  it('liga a aba ao painel pelos atributos', () => {
    montar();

    const aba = screen.getByRole('tab', { name: 'Geral' });
    const painel = screen.getByRole('tabpanel');
    expect(aba).toHaveAttribute('aria-controls', painel.id);
    expect(painel).toHaveAttribute('aria-labelledby', aba.id);
  });

  it('troca de painel ao clicar', () => {
    montar();
    fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');
  });

  it('ativa ao mover com as setas, pulando desabilitadas', () => {
    const lista = montar();

    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');

    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');
  });

  it('circula nas extremidades e salta com Home e End', () => {
    const lista = montar();

    fireEvent.keyDown(lista, { key: 'ArrowLeft' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');

    fireEvent.keyDown(lista, { key: 'Home' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo geral');

    fireEvent.keyDown(lista, { key: 'End' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');
  });

  it('anuncia a orientacao e troca o eixo das setas na vertical', () => {
    render(<Tabs label="Secoes" items={abas} orientation="vertical" />);
    const lista = screen.getByRole('tablist', { name: 'Secoes' });

    expect(lista).toHaveAttribute('aria-orientation', 'vertical');

    fireEvent.keyDown(lista, { key: 'ArrowRight' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo geral');

    fireEvent.keyDown(lista, { key: 'ArrowDown' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');
  });

  it('respeita a aba controlada e reporta a escolha', () => {
    const onSelectedKeyChange = vi.fn();
    const { rerender } = render(
      <Tabs label="Config" items={abas} selectedKey="acesso" onSelectedKeyChange={onSelectedKeyChange} />,
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');

    fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));
    expect(onSelectedKeyChange).toHaveBeenCalledWith('logs');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');

    rerender(<Tabs label="Config" items={abas} selectedKey="logs" onSelectedKeyChange={onSelectedKeyChange} />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');
  });

  it('comeca pelo defaultSelectedKey e troca sem controle', () => {
    montar({ defaultSelectedKey: 'acesso' });
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');

    fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de logs');
  });

  it('mantem uma aba alcancavel pelo Tab quando a escolhida nao existe ou esta desabilitada', () => {
    const abas = [
      { content: 'Um', disabled: true, key: 'um', label: 'Um' },
      { content: 'Dois', key: 'dois', label: 'Dois' },
    ];
    const { rerender } = render(<Tabs defaultSelectedKey="um" items={abas} label="Secoes" />);

    expect(screen.getByRole('tab', { name: 'Dois' })).toHaveAttribute('tabindex', '0');

    rerender(<Tabs items={abas} label="Secoes" selectedKey="sumiu" />);

    expect(screen.getByRole('tab', { name: 'Dois' })).toHaveAttribute('tabindex', '0');
  });

  it('na vertical com fillHeight, o painel estica ate a altura da raiz para rolar', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/navigation/Tabs/Tabs.module.css'), 'utf8');
    const inicio = css.indexOf('.vertical.fillHeight .panel {');

    expect(inicio).toBeGreaterThanOrEqual(0);
    expect(css.slice(inicio, css.indexOf('}', inicio))).toContain('align-self: stretch;');
  });

  describe('count', () => {
    it('mostra o selo e poe a contagem no nome da aba, depois de uma virgula', () => {
      render(<Tabs items={[{ ...abas[0], count: 1250 }, abas[1]]} label="Config" />);

      const aba = screen.getByRole('tab', { name: 'Geral, 1.250' });
      const visiveis = aba.querySelectorAll('[aria-hidden="true"]');
      expect(visiveis[0]).toHaveTextContent('Geral');
      expect(visiveis[1]).toHaveTextContent('1.250');
      expect(screen.getByRole('tab', { name: 'Acesso' })).toBeInTheDocument();
    });

    it('sem count, a aba e so o rotulo, sem envoltorio', () => {
      render(<Tabs items={abas} label="Config" />);

      expect(screen.getByRole('tab', { name: 'Geral' }).innerHTML).toBe('Geral');
    });
  });

  describe('actions', () => {
    it('ficam fora do tablist, num envoltorio irmao da lista', () => {
      render(<Tabs actions={<button type="button">Nova aba</button>} items={abas} label="Config" />);

      const lista = screen.getByRole('tablist');
      const acao = screen.getByRole('button', { name: 'Nova aba' });
      expect(lista).not.toContainElement(acao);
      expect(lista.parentElement).toContainElement(acao);
      expect(lista.parentElement).not.toHaveAttribute('role');
    });

    it('nao entram nas setas das abas', () => {
      render(<Tabs actions={<button type="button">Nova aba</button>} items={abas} label="Config" />);

      fireEvent.keyDown(screen.getByRole('button', { name: 'Nova aba' }), { key: 'ArrowRight' });
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo geral');
    });

    it('sem actions, a lista fica direto na raiz, como antes', () => {
      const { container } = render(<Tabs items={abas} label="Config" />);

      expect(screen.getByRole('tablist').parentElement).toBe(container.firstElementChild);
    });
  });

  describe('muted', () => {
    it('marca a aba com data-muted, que continua focavel e selecionavel', () => {
      const lista = montar({ items: [abas[0], { ...abas[1], muted: true }, abas[3]] });

      const apagada = screen.getByRole('tab', { name: 'Acesso' });
      expect(apagada).toHaveAttribute('data-muted', 'true');
      expect(apagada).not.toBeDisabled();
      expect(screen.getByRole('tab', { name: 'Geral' })).not.toHaveAttribute('data-muted');

      fireEvent.keyDown(lista, { key: 'ArrowRight' });
      expect(apagada).toHaveAttribute('aria-selected', 'true');
      expect(apagada).toHaveFocus();
      expect(apagada).toHaveAttribute('tabindex', '0');
    });
  });

  describe('appearance', () => {
    it('segmentado mantem a semantica de abas, com tablist, tabpanel e as setas', () => {
      const { container } = render(<Tabs appearance="segmented" items={abas} label="Config" />);
      const lista = screen.getByRole('tablist', { name: 'Config' });

      expect(container.firstElementChild?.className).toMatch(/segmented/);
      fireEvent.keyDown(lista, { key: 'ArrowRight' });
      expect(screen.getByRole('tab', { name: 'Acesso' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo de acesso');
    });

    it('sem appearance, a raiz nao leva a classe do segmentado', () => {
      const { container } = render(<Tabs items={abas} label="Config" />);

      expect(container.firstElementChild?.className).not.toMatch(/segmented/);
    });
  });
});

const registros: TabItem[] = ['Pedido 1', 'Pedido 2', 'Pedido 3', 'Pedido 4', 'Pedido 5', 'Pedido 6'].map((rotulo, indice) => ({
  key: `p${indice + 1}`,
  label: rotulo,
  content: `Conteudo do ${rotulo}`,
}));

/** O jsdom nao faz layout: cada aba mede 100, o botao "Mais" 80 e a faixa (o pai do tablist) a largura pedida. */
function medir(larguraDaFaixa: number) {
  const offset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  const client = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');

  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      if (this.getAttribute('role') === 'tab') {
        return 100;
      }
      return this.textContent?.startsWith('Mais') ? 80 : 0;
    },
  });
  Object.defineProperty(Element.prototype, 'clientWidth', {
    configurable: true,
    get(this: Element) {
      return this.querySelector(':scope > [role="tablist"]') ? larguraDaFaixa : 0;
    },
  });

  return () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offset!);
    Object.defineProperty(Element.prototype, 'clientWidth', client!);
  };
}

describe('overflow="menu"', () => {
  let restaurar: () => void;

  beforeEach(() => {
    restaurar = medir(450);
  });

  afterEach(() => restaurar());

  it('as abas que nao cabem vao para o botao "Mais (N)", fora do tablist', () => {
    render(<Tabs items={registros} label="Registros abertos" overflow="menu" />);

    expect(screen.getAllByRole('tab').map((aba) => aba.textContent)).toEqual(['Pedido 1', 'Pedido 2', 'Pedido 3']);
    const mais = screen.getByRole('button', { name: 'Mais (3)' });
    expect(mais).toHaveAttribute('aria-haspopup', 'menu');
    expect(screen.getByRole('tablist')).not.toContainElement(mais);
  });

  it('a posicao de cada aba conta tambem as do menu', () => {
    render(<Tabs items={registros} label="Registros abertos" overflow="menu" />);

    const aba = screen.getByRole('tab', { name: 'Pedido 2' });
    expect(aba).toHaveAttribute('aria-posinset', '2');
    expect(aba).toHaveAttribute('aria-setsize', '6');
  });

  it('o menu lista as ocultas, e escolher uma a traz para a faixa no lugar da ultima visivel, com o foco', () => {
    const onSelectedKeyChange = vi.fn();
    render(<Tabs items={registros} label="Registros abertos" onSelectedKeyChange={onSelectedKeyChange} overflow="menu" />);

    fireEvent.click(screen.getByRole('button', { name: 'Mais (3)' }));
    const menu = screen.getByRole('menu', { name: 'Mais abas' });
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Pedido 4',
      'Pedido 5',
      'Pedido 6',
    ]);

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Pedido 5' }));

    expect(onSelectedKeyChange).toHaveBeenCalledWith('p5');
    expect(screen.getAllByRole('tab').map((aba) => aba.textContent)).toEqual(['Pedido 1', 'Pedido 2', 'Pedido 5']);
    expect(screen.getByRole('tab', { name: 'Pedido 5' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Pedido 5' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo do Pedido 5');
    expect(screen.getByRole('button', { name: 'Mais (3)' })).toBeInTheDocument();
  });

  it('a aba escolhida fica sempre a vista, mesmo comecando entre as que nao cabem', () => {
    render(<Tabs defaultSelectedKey="p6" items={registros} label="Registros abertos" overflow="menu" />);

    expect(screen.getByRole('tab', { name: 'Pedido 6' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab').map((aba) => aba.textContent)).toEqual(['Pedido 1', 'Pedido 2', 'Pedido 6']);
  });

  it('as setas, Home e End andam so pelas abas da faixa', () => {
    render(<Tabs items={registros} label="Registros abertos" overflow="menu" />);

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Pedido 1' }), { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Pedido 3' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Pedido 3' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Pedido 1' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Pedido 1' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'Pedido 3' })).toHaveAttribute('aria-selected', 'true');
  });

  it('cabendo todas, nao ha botao', () => {
    restaurar();
    restaurar = medir(1000);
    render(<Tabs items={registros} label="Registros abertos" overflow="menu" />);

    expect(screen.getAllByRole('tab')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: /Mais/ })).not.toBeInTheDocument();
  });

  it('o texto do botao e o nome do menu vem de labels', () => {
    render(
      <Tabs
        items={registros}
        label="Registros abertos"
        labels={{ more: (n) => `Mais (${n}) abas`, moreMenu: 'Outras abas' }}
        overflow="menu"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mais (3) abas' }));
    expect(screen.getByRole('menu', { name: 'Outras abas' })).toBeInTheDocument();
  });

  it('sem overflow, nada muda: todas as abas ficam na faixa, sem botao', () => {
    const { container } = render(<Tabs items={registros} label="Registros abertos" />);

    expect(screen.getAllByRole('tab')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: /Mais/ })).not.toBeInTheDocument();
    expect(screen.getByRole('tablist').parentElement).toBe(container.firstElementChild);
  });

  it('na vertical e com fitted, overflow nao se aplica', () => {
    const { unmount } = render(<Tabs items={registros} label="Registros" orientation="vertical" overflow="menu" />);
    expect(screen.getAllByRole('tab')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: /Mais/ })).not.toBeInTheDocument();
    unmount();

    render(<Tabs fitted items={registros} label="Registros" overflow="menu" />);
    expect(screen.getAllByRole('tab')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: /Mais/ })).not.toBeInTheDocument();
  });

  it('com actions, o botao fica antes delas, e as acoes fora do tablist', () => {
    render(<Tabs actions={<button type="button">Novo</button>} items={registros} label="Registros" overflow="menu" />);

    const mais = screen.getByRole('button', { name: 'Mais (3)' });
    const novo = screen.getByRole('button', { name: 'Novo' });
    expect(mais.compareDocumentPosition(novo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('tablist')).not.toContainElement(novo);
  });
});

describe('overflow="scroll"', () => {
  it('a faixa rola ate a aba escolhida, sem botao "Mais"', () => {
    const retangulo = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if (this.getAttribute('role') === 'tablist') {
        return { left: 0, right: 300 } as DOMRect;
      }
      if (this.getAttribute('aria-selected') === 'true') {
        return { left: 500, right: 600 } as DOMRect;
      }
      return { left: 0, right: 0 } as DOMRect;
    };

    try {
      const { container } = render(<Tabs defaultSelectedKey="p6" items={registros} label="Registros" overflow="scroll" />);

      expect(screen.getByRole('tablist').scrollLeft).toBe(300);
      expect(container.firstElementChild?.className).toMatch(/scroll/);
      expect(screen.getAllByRole('tab')).toHaveLength(6);
      expect(screen.queryByRole('button', { name: /Mais/ })).not.toBeInTheDocument();
    } finally {
      Element.prototype.getBoundingClientRect = retangulo;
    }
  });
});

describe('closable', () => {
  const fechaveis = registros.slice(0, 4).map((aba) => ({ ...aba, closable: true }));

  /** Remove a aba de `items` no `onClose`, como faz quem usa. */
  function Abertos({ inicial }: { inicial: string }) {
    const [abas, setAbas] = useState(fechaveis);

    return (
      <Tabs
        defaultSelectedKey={inicial}
        items={abas}
        label="Registros"
        onClose={(key) => setAbas((atuais) => atuais.filter((aba) => aba.key !== key))}
      />
    );
  }

  it('o x fica dentro da aba, fora da arvore e do Tab, e o nome da aba continua o rotulo', () => {
    render(<Tabs items={fechaveis} label="Registros" onClose={() => {}} />);

    const aba = screen.getByRole('tab', { name: 'Pedido 1' });
    const fechar = aba.querySelector('[data-close]');
    expect(fechar).toHaveAttribute('aria-hidden', 'true');
    expect(fechar?.tagName).toBe('SPAN');
    expect(fechar).not.toHaveAttribute('tabindex');
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('a aba ganha a descricao "Delete para fechar", que vem de labels', () => {
    const { rerender } = render(<Tabs items={[...fechaveis, registros[4]]} label="Registros" onClose={() => {}} />);

    expect(screen.getByRole('tab', { name: 'Pedido 1' })).toHaveAccessibleDescription('Delete para fechar');
    expect(screen.getByRole('tab', { name: 'Pedido 5' })).not.toHaveAttribute('aria-describedby');

    rerender(<Tabs items={fechaveis} label="Registros" labels={{ closeHint: 'Del para fechar' }} onClose={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Pedido 1' })).toHaveAccessibleDescription('Del para fechar');
  });

  it('clicar no x pede o fechamento e nao escolhe a aba', () => {
    const onClose = vi.fn();
    const onSelectedKeyChange = vi.fn();
    render(<Tabs items={fechaveis} label="Registros" onClose={onClose} onSelectedKeyChange={onSelectedKeyChange} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Pedido 3' }).querySelector('[data-close]')!);

    expect(onClose).toHaveBeenCalledWith('p3');
    expect(onSelectedKeyChange).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: 'Pedido 1' })).toHaveAttribute('aria-selected', 'true');
  });

  it('Delete fecha a aba focada; numa aba sem closable, nada', () => {
    const onClose = vi.fn();
    render(<Tabs items={[...fechaveis, registros[4]]} label="Registros" onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Pedido 2' }), { key: 'Delete' });
    expect(onClose).toHaveBeenCalledWith('p2');

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Pedido 5' }), { key: 'Delete' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('quem remove e quem usa: sem tirar de items, a aba fica', () => {
    render(<Tabs items={fechaveis} label="Registros" onClose={() => {}} />);

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Pedido 2' }), { key: 'Delete' });
    expect(screen.getByRole('tab', { name: 'Pedido 2' })).toBeInTheDocument();
  });

  it('fechada pelo Delete, o foco e a escolha vao a vizinha da direita', () => {
    render(<Abertos inicial="p2" />);
    const aba = screen.getByRole('tab', { name: 'Pedido 2' });
    act(() => aba.focus());

    fireEvent.keyDown(aba, { key: 'Delete' });

    expect(screen.queryByRole('tab', { name: 'Pedido 2' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pedido 3' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Pedido 3' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteudo do Pedido 3');
  });

  it('na ultima aba, o foco vai a da esquerda', () => {
    render(<Abertos inicial="p4" />);
    const aba = screen.getByRole('tab', { name: 'Pedido 4' });
    act(() => aba.focus());

    fireEvent.keyDown(aba, { key: 'Delete' });

    expect(screen.getByRole('tab', { name: 'Pedido 3' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Pedido 3' })).toHaveAttribute('aria-selected', 'true');
  });

  it('fechar outra aba pelo x mantem a escolhida', () => {
    render(<Abertos inicial="p1" />);

    fireEvent.click(screen.getByRole('tab', { name: 'Pedido 3' }).querySelector('[data-close]')!);

    expect(screen.queryByRole('tab', { name: 'Pedido 3' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pedido 1' })).toHaveAttribute('aria-selected', 'true');
  });

  it('com o foco fora das abas, a escolha passa a vizinha e o foco fica onde esta', () => {
    const { rerender } = render(<Tabs defaultSelectedKey="p2" items={fechaveis} label="Registros" />);
    const fora = document.createElement('button');
    document.body.append(fora);
    act(() => fora.focus());

    rerender(<Tabs defaultSelectedKey="p2" items={fechaveis.filter((aba) => aba.key !== 'p2')} label="Registros" />);

    expect(screen.getByRole('tab', { name: 'Pedido 3' })).toHaveAttribute('aria-selected', 'true');
    expect(fora).toHaveFocus();
    fora.remove();
  });

  it('no modo controlado, avisa a vizinha por onSelectedKeyChange', () => {
    const onSelectedKeyChange = vi.fn();
    const { rerender } = render(
      <Tabs items={fechaveis} label="Registros" onSelectedKeyChange={onSelectedKeyChange} selectedKey="p2" />,
    );

    rerender(
      <Tabs
        items={fechaveis.filter((aba) => aba.key !== 'p2')}
        label="Registros"
        onSelectedKeyChange={onSelectedKeyChange}
        selectedKey="p2"
      />,
    );

    expect(onSelectedKeyChange).toHaveBeenCalledWith('p3');
  });

  it('a aba sem closable que sai de items nao muda a escolha, como antes', () => {
    const onSelectedKeyChange = vi.fn();
    const { rerender } = render(
      <Tabs items={registros} label="Registros" onSelectedKeyChange={onSelectedKeyChange} selectedKey="p2" />,
    );

    rerender(
      <Tabs
        items={registros.filter((aba) => aba.key !== 'p2')}
        label="Registros"
        onSelectedKeyChange={onSelectedKeyChange}
        selectedKey="p2"
      />,
    );

    expect(onSelectedKeyChange).not.toHaveBeenCalled();
  });

  it('vale no segmentado e com o menu de transbordo', () => {
    const restaurar = medir(450);

    try {
      const onClose = vi.fn();
      render(
        <Tabs
          appearance="segmented"
          items={registros.map((aba) => ({ ...aba, closable: true }))}
          label="Registros"
          onClose={onClose}
          overflow="menu"
        />,
      );

      fireEvent.keyDown(screen.getByRole('tab', { name: 'Pedido 1' }), { key: 'Delete' });
      expect(onClose).toHaveBeenCalledWith('p1');
      expect(screen.getByRole('button', { name: 'Mais (3)' })).toBeInTheDocument();
    } finally {
      restaurar();
    }
  });
});
