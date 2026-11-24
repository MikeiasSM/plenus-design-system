import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentPropsWithoutRef } from 'react';
import { TabsNav, type TabsNavItem } from './TabsNav';

const abas: TabsNavItem[] = [
  { key: 'usuarios', label: 'Usuários', href: '/sistema/usuarios' },
  { key: 'papeis', label: 'Papéis', href: '/sistema/papeis' },
  { key: 'tokens', label: 'Tokens', href: '/sistema/tokens' },
];

describe('TabsNav', () => {
  it('é navegação nomeada, com um link por aba', () => {
    render(<TabsNav current="papeis" items={abas} label="Sistema" />);

    const navegacao = screen.getByRole('navigation', { name: 'Sistema' });
    expect(navegacao.querySelectorAll('a')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Tokens' })).toHaveAttribute('href', '/sistema/tokens');
  });

  it('marca só a aba atual com aria-current="page", sem papel de aba', () => {
    render(<TabsNav current="papeis" items={abas} label="Sistema" />);

    expect(screen.getByRole('link', { name: 'Papéis' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Usuários' })).not.toHaveAttribute('aria-current');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('usa o link do roteador e entrega a ele as propriedades do item', () => {
    function LinkDoRoteador({ to, ...props }: ComponentPropsWithoutRef<'a'> & { to?: string }) {
      return <a {...props} data-to={to} href={to} />;
    }

    render(
      <TabsNav
        as={LinkDoRoteador}
        current="usuarios"
        items={[{ key: 'usuarios', label: 'Usuários', linkProps: { to: '/sistema/usuarios' } }]}
        label="Sistema"
      />,
    );

    const link = screen.getByRole('link', { name: 'Usuários' });
    expect(link).toHaveAttribute('data-to', '/sistema/usuarios');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('soma a className do linkProps as classes da aba, sem apaga-las', () => {
    render(
      <TabsNav
        current="usuarios"
        items={[{ key: 'usuarios', label: 'Usuários', href: '/u', linkProps: { className: 'minha-classe' } }]}
        label="Sistema"
      />,
    );

    const link = screen.getByRole('link', { name: 'Usuários' });
    expect(link).toHaveClass('minha-classe');
    expect(link.className).toMatch(/tab/);
    expect(link.className).toMatch(/active/);
  });

  it('o aria-current do linkProps nao apaga o da aba atual, e vale nas outras', () => {
    render(
      <TabsNav
        current="usuarios"
        items={[
          { key: 'usuarios', label: 'Usuários', href: '/u', linkProps: { 'aria-current': 'false' } },
          { key: 'papeis', label: 'Papéis', href: '/p', linkProps: { 'aria-current': 'location' } },
        ]}
        label="Sistema"
      />,
    );

    expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Papéis' })).toHaveAttribute('aria-current', 'location');
  });

  it('o icone fica antes do rotulo, fora do nome, e a contagem entra no nome', () => {
    render(
      <TabsNav
        current="usuarios"
        items={[
          { key: 'usuarios', label: 'Usuários', href: '/u', icon: <svg data-testid="icone" />, count: 12 },
          { key: 'papeis', label: 'Papéis', href: '/p', icon: <svg /> },
        ]}
        label="Sistema"
      />,
    );

    const link = screen.getByRole('link', { name: 'Usuários, 12' });
    const icone = screen.getByTestId('icone').parentElement;
    expect(icone).toHaveAttribute('aria-hidden', 'true');
    expect(link.firstElementChild?.firstElementChild).toBe(icone);
    expect(screen.getByRole('link', { name: 'Papéis' })).toBeInTheDocument();
  });

  it('as actions ficam fora da lista de links, dentro da navegacao', () => {
    render(<TabsNav actions={<button type="button">Convidar</button>} current="papeis" items={abas} label="Sistema" />);

    const lista = screen.getByRole('list');
    const acao = screen.getByRole('button', { name: 'Convidar' });
    expect(lista).not.toContainElement(acao);
    expect(screen.getByRole('navigation', { name: 'Sistema' })).toContainElement(acao);
  });

  it('sem actions, a lista fica direto na navegacao, como antes', () => {
    render(<TabsNav current="papeis" items={abas} label="Sistema" />);

    expect(screen.getByRole('list').parentElement).toBe(screen.getByRole('navigation'));
  });

  it('segmentado continua navegacao, com aria-current="page" e sem papel de aba', () => {
    render(<TabsNav appearance="segmented" current="papeis" items={abas} label="Sistema" />);

    expect(screen.getByRole('navigation').className).toMatch(/segmented/);
    expect(screen.getByRole('link', { name: 'Papéis' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  describe('followScroll', () => {
    const secoes: TabsNavItem[] = [
      { key: 'geral', label: 'Geral', href: '#geral' },
      { key: 'avisos', label: 'Avisos', href: '#avisos' },
      { key: 'acesso', label: 'Acesso', href: '#acesso' },
    ];

    // Onde cada elemento está na tela: a borda de baixo da barra e o topo de cada seção, que o teste muda à vontade.
    let posicoes: { barra: number; secoes: Record<string, number> };
    let quadros: FrameRequestCallback[];

    function montarSecoes(topos: Record<string, number>, onde: HTMLElement = document.body) {
      posicoes.secoes = topos;
      for (const id of Object.keys(topos)) {
        const secao = document.createElement('section');
        secao.id = id;
        onde.appendChild(secao);
      }
    }

    function rodarQuadros() {
      const pendentes = quadros;
      quadros = [];
      act(() => pendentes.forEach((quadro) => quadro(0)));
    }

    function definirRolagem(elemento: Element, medidas: { clientHeight: number; scrollHeight: number; scrollTop: number }) {
      for (const [nome, valor] of Object.entries(medidas)) {
        Object.defineProperty(elemento, nome, { configurable: true, value: valor, writable: true });
      }
    }

    beforeEach(() => {
      posicoes = { barra: 0, secoes: {} };
      quadros = [];
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((quadro) => quadros.push(quadro));
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        if (this.tagName === 'NAV') {
          return { bottom: posicoes.barra, top: posicoes.barra - 48 } as DOMRect;
        }
        const top = posicoes.secoes[this.id] ?? 0;
        return { bottom: top + 200, top } as DOMRect;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      document.querySelectorAll('section, [data-rola]').forEach((elemento) => elemento.remove());
      for (const nome of ['clientHeight', 'scrollHeight', 'scrollTop']) {
        delete (document.documentElement as unknown as Record<string, unknown>)[nome];
      }
    });

    it('marca a secao atual com aria-current="location", nao "page"', () => {
      render(<TabsNav current="avisos" followScroll items={secoes} label="Seções" />);

      expect(screen.getByRole('link', { name: 'Avisos' })).toHaveAttribute('aria-current', 'location');
    });

    it('a secao so vira a atual quando o topo chega a borda de baixo da barra, e nao ao topo dela', () => {
      // A barra está presa a 56px e tem 48px: a borda de baixo fica em 104.
      posicoes.barra = 104;
      montarSecoes({ geral: -400, avisos: 80, acesso: 600 });
      const onCurrentChange = vi.fn();

      render(<TabsNav current="geral" followScroll items={secoes} label="Seções" onCurrentChange={onCurrentChange} stickyOffset={56} />);

      expect(onCurrentChange).toHaveBeenCalledWith('avisos');
    });

    it('a secao que ainda passa por baixo da barra nao e a atual', () => {
      posicoes.barra = 104;
      montarSecoes({ geral: -400, avisos: 120, acesso: 600 });
      const onCurrentChange = vi.fn();

      render(<TabsNav current="geral" followScroll items={secoes} label="Seções" onCurrentChange={onCurrentChange} stickyOffset={56} />);

      expect(onCurrentChange).not.toHaveBeenCalled();
    });

    it('mede de novo no quadro seguinte a rolagem e ao redimensionamento, uma vez por quadro', () => {
      posicoes.barra = 48;
      montarSecoes({ geral: 48, avisos: 400, acesso: 900 });
      const onCurrentChange = vi.fn();
      render(<TabsNav current="geral" followScroll items={secoes} label="Seções" onCurrentChange={onCurrentChange} />);

      posicoes.secoes = { geral: -600, avisos: 10, acesso: 300 };
      fireEvent.scroll(document);
      fireEvent.scroll(document);
      expect(quadros).toHaveLength(1);
      expect(onCurrentChange).not.toHaveBeenCalled();
      rodarQuadros();
      expect(onCurrentChange).toHaveBeenLastCalledWith('avisos');

      posicoes.secoes = { geral: -1200, avisos: -500, acesso: 20 };
      fireEvent(window, new Event('resize'));
      rodarQuadros();
      expect(onCurrentChange).toHaveBeenLastCalledWith('acesso');
    });

    it('ignora a rolagem da propria faixa de abas e a de elementos fora do caminho da barra', () => {
      render(<TabsNav current="geral" followScroll items={secoes} label="Seções" />);
      const outra = document.createElement('div');
      outra.dataset.rola = '';
      document.body.appendChild(outra);

      fireEvent.scroll(screen.getByRole('list'));
      fireEvent.scroll(outra);

      expect(quadros).toHaveLength(0);
    });

    it('desliga os ouvintes ao desmontar e ao desligar followScroll', () => {
      const remover = vi.spyOn(window, 'removeEventListener');
      const { rerender, unmount } = render(<TabsNav current="geral" followScroll items={secoes} label="Seções" />);

      rerender(<TabsNav current="geral" items={secoes} label="Seções" />);
      expect(remover).toHaveBeenCalledWith('scroll', expect.any(Function), { capture: true });
      expect(remover).toHaveBeenCalledWith('resize', expect.any(Function));

      remover.mockClear();
      rerender(<TabsNav current="geral" followScroll items={secoes} label="Seções" />);
      unmount();
      expect(remover).toHaveBeenCalledWith('scroll', expect.any(Function), { capture: true });

      fireEvent.scroll(document);
      expect(quadros).toHaveLength(0);
    });

    it('no fim da rolagem, a ultima secao e a atual, mesmo curta demais para chegar a barra', () => {
      posicoes.barra = 48;
      montarSecoes({ geral: -900, avisos: -100, acesso: 500 });
      definirRolagem(document.documentElement, { clientHeight: 800, scrollHeight: 2000, scrollTop: 1200 });
      const onCurrentChange = vi.fn();

      render(<TabsNav current="geral" followScroll items={secoes} label="Seções" onCurrentChange={onCurrentChange} />);

      expect(onCurrentChange).toHaveBeenLastCalledWith('acesso');
    });

    it('dentro de um conteiner que rola, mede pela barra e ouve a rolagem dele', () => {
      // Como no AppShell: o corpo da página rola por dentro, abaixo de uma barra de 46px, e a TabsNav fica presa no
      // topo dele, com stickyOffset 0. A borda de baixo dela, na tela, fica em 46 + 48.
      const corpo = document.createElement('div');
      corpo.dataset.rola = '';
      corpo.style.overflowY = 'auto';
      document.body.appendChild(corpo);
      const raiz = document.createElement('div');
      corpo.appendChild(raiz);
      posicoes.barra = 94;
      montarSecoes({ geral: 94, avisos: 500, acesso: 1000 }, corpo);
      definirRolagem(corpo, { clientHeight: 600, scrollHeight: 1800, scrollTop: 0 });
      const onCurrentChange = vi.fn();

      render(<TabsNav current="geral" followScroll items={secoes} label="Seções" onCurrentChange={onCurrentChange} />, { container: raiz });
      expect(onCurrentChange).not.toHaveBeenCalled();

      posicoes.secoes = { geral: -300, avisos: 90, acesso: 600 };
      definirRolagem(corpo, { clientHeight: 600, scrollHeight: 1800, scrollTop: 400 });
      fireEvent.scroll(corpo);
      rodarQuadros();
      expect(onCurrentChange).toHaveBeenLastCalledWith('avisos');

      // No fim da rolagem do contêiner, e não da janela, a última vira a atual.
      definirRolagem(corpo, { clientHeight: 600, scrollHeight: 1800, scrollTop: 1200 });
      fireEvent.scroll(corpo);
      rodarQuadros();
      expect(onCurrentChange).toHaveBeenLastCalledWith('acesso');
    });

    it('com items em linha, nao recomeca a cada render nem avisa de novo a mesma secao', () => {
      posicoes.barra = 48;
      montarSecoes({ geral: -400, avisos: 20, acesso: 600 });
      const adicionar = vi.spyOn(window, 'addEventListener');
      const onCurrentChange = vi.fn();
      const montar = () => (
        <TabsNav current="geral" followScroll items={secoes.map((secao) => ({ ...secao }))} label="Seções" onCurrentChange={onCurrentChange} />
      );

      const { rerender } = render(montar());
      rerender(montar());
      rerender(montar());

      expect(adicionar.mock.calls.filter(([tipo]) => tipo === 'scroll')).toHaveLength(1);
      expect(onCurrentChange).toHaveBeenCalledTimes(1);

      fireEvent.scroll(document);
      rodarQuadros();
      expect(onCurrentChange).toHaveBeenCalledTimes(1);
    });

    it('na montagem, nao avisa a secao que ja e a atual', () => {
      posicoes.barra = 48;
      montarSecoes({ geral: -400, avisos: 20, acesso: 600 });
      const onCurrentChange = vi.fn();

      render(<TabsNav current="avisos" followScroll items={secoes} label="Seções" onCurrentChange={onCurrentChange} />);

      expect(onCurrentChange).not.toHaveBeenCalled();
    });

    it('o top do sticky vem do stickyOffset, e o top de style vence', () => {
      const { rerender } = render(<TabsNav current="geral" followScroll items={secoes} label="Seções" stickyOffset={56} />);
      expect(screen.getByRole('navigation')).toHaveStyle({ top: '56px' });

      rerender(<TabsNav current="geral" followScroll items={secoes} label="Seções" stickyOffset={56} style={{ top: 'var(--topo)' }} />);
      expect(screen.getByRole('navigation').style.top).toBe('var(--topo)');
    });

    it('o clique na aba reserva a barra no destino, com o top e a altura dela, e chama o onClick do item', () => {
      montarSecoes({ geral: 0, avisos: 400, acesso: 900 });
      const onClick = vi.fn();
      render(
        <TabsNav
          current="geral"
          followScroll
          items={secoes.map((secao) => (secao.key === 'avisos' ? { ...secao, linkProps: { onClick } } : secao))}
          label="Seções"
          stickyOffset={56}
        />,
      );
      Object.defineProperty(screen.getByRole('navigation'), 'offsetHeight', { configurable: true, value: 48 });

      fireEvent.click(screen.getByRole('link', { name: 'Avisos' }));

      expect(document.getElementById('avisos')).toHaveStyle({ scrollMarginTop: '104px' });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('centraliza a aba atual na faixa, sem animacao com movimento reduzido', () => {
      const scrollTo = vi.fn();
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo });
      vi.spyOn(window, 'matchMedia').mockImplementation(
        (consulta) => ({ matches: consulta.includes('reduce'), media: consulta }) as MediaQueryList,
      );

      try {
        const { rerender } = render(<TabsNav current="geral" followScroll items={secoes} label="Seções" />);
        rerender(<TabsNav current="acesso" followScroll items={secoes} label="Seções" />);

        expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'auto' }));
      } finally {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollTo;
      }
    });

    it('sem followScroll, nao observa a rolagem', () => {
      montarSecoes({ geral: -400, avisos: -10, acesso: 600 });
      const onCurrentChange = vi.fn();

      render(<TabsNav current="geral" items={secoes} label="Seções" onCurrentChange={onCurrentChange} />);
      fireEvent.scroll(document);

      expect(onCurrentChange).not.toHaveBeenCalled();
      expect(quadros).toHaveLength(0);
    });
  });
});
