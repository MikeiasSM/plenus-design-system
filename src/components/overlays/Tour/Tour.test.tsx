import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Tour, type TourProps, type TourStep } from './Tour';
import { TourProvider, useTour, type TourEvent, type TourStorage } from './TourProvider';

const PASSOS: TourStep[] = [
  { id: 'boas-vindas', title: 'Conheça a tela', content: 'Em três passos.' },
  { id: 'filtros', target: '#filtros', title: 'Filtre a lista', content: 'O botão Filtros escolhe a situação.' },
  { id: 'novo', target: '#novo', title: 'Crie um pedido', content: 'O botão Novo pedido abre o formulário.' },
];

function Tela({ semFiltros = false, ...props }: Partial<TourProps> & { semFiltros?: boolean }) {
  return (
    <div>
      <button type="button">Antes</button>
      {!semFiltros && <button id="filtros" type="button">Filtros</button>}
      <button id="novo" type="button">Novo pedido</button>
      <Tour defaultOpen id="pedidos" steps={PASSOS} {...props} />
    </div>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Tour', () => {
  it('não renderiza nada fechado', () => {
    render(<Tela defaultOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre no primeiro passo como diálogo modal nomeado pelo título, com o texto e o progresso na descrição', () => {
    render(<Tela />);

    const passo = screen.getByRole('dialog', { name: 'Conheça a tela' });
    expect(passo).toHaveAttribute('aria-modal', 'true');
    expect(passo).toHaveAccessibleDescription('Em três passos. Passo 1 de 3');
    expect(passo).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Voltar' })).not.toBeInTheDocument();
  });

  it('esconde a página da tecnologia assistiva no passo modal', () => {
    render(<Tela />);

    expect(screen.getByRole('button', { name: 'Antes', hidden: true }).closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('avança, volta e conclui, e devolve o foco a quem o tinha', () => {
    const onEnd = vi.fn();
    const onOpenChange = vi.fn();
    function ComGatilho() {
      const [aberto, setAberto] = useState(false);
      return (
        <div>
          <button onClick={() => setAberto(true)} type="button">Tour da tela</button>
          <button id="filtros" type="button">Filtros</button>
          <button id="novo" type="button">Novo pedido</button>
          <Tour
            id="pedidos"
            onEnd={onEnd}
            onOpenChange={(valor) => {
              onOpenChange(valor);
              setAberto(valor);
            }}
            open={aberto}
            steps={PASSOS.slice(0, 2)}
          />
        </div>
      );
    }
    render(<ComGatilho />);
    const gatilho = screen.getByRole('button', { name: 'Tour da tela' });
    gatilho.focus();
    fireEvent.click(gatilho);

    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    expect(screen.getByRole('dialog', { name: 'Filtre a lista' })).toHaveAccessibleDescription('O botão Filtros escolhe a situação. Passo 2 de 2');

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByRole('dialog', { name: 'Conheça a tela' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onEnd).toHaveBeenCalledWith({ reason: 'completed', stepId: 'filtros' });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(gatilho).toHaveFocus();
  });

  it('o Esc e o Fechar encerram o tour inteiro com reason "dismissed"', () => {
    const onEnd = vi.fn();
    const { unmount } = render(<Tela onEnd={onEnd} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onEnd).toHaveBeenLastCalledWith({ reason: 'dismissed', stepId: 'boas-vindas' });
    unmount();

    render(<Tela onEnd={onEnd} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar tour' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onEnd).toHaveBeenLastCalledWith({ reason: 'dismissed', stepId: 'boas-vindas' });
  });

  it('salta o passo cujo alvo não aparece no prazo, e o contador conta só os passos mostrados', () => {
    vi.useFakeTimers();
    const onEvent = vi.fn();
    render(
      <TourProvider onEvent={onEvent}>
        <Tela semFiltros />
      </TourProvider>,
    );

    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Em três passos. Passo 1 de 3');
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.getByRole('dialog', { name: 'Crie um pedido' })).toHaveAccessibleDescription('O botão Novo pedido abre o formulário. Passo 2 de 2');
    expect(onEvent).toHaveBeenCalledWith({ type: 'skip', tourId: 'pedidos', version: 1, stepId: 'filtros', reason: 'target-missing' });
  });

  it('com targetMissing="end", encerra sem marcar como visto', () => {
    vi.useFakeTimers();
    const storage: TourStorage = { hasSeen: vi.fn(() => false), markSeen: vi.fn() };
    const onEnd = vi.fn();
    render(
      <TourProvider storage={storage}>
        <Tela onEnd={onEnd} semFiltros targetMissing="end" />
      </TourProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onEnd).toHaveBeenCalledWith({ reason: 'target-missing', stepId: 'filtros' });
    expect(storage.markSeen).not.toHaveBeenCalled();
  });

  it('espera o alvo que aparece depois, dentro do prazo', () => {
    vi.useFakeTimers();
    function Atrasado() {
      const [mostrar, setMostrar] = useState(false);
      return (
        <div>
          <button onClick={() => setMostrar(true)} type="button">Mostrar</button>
          {mostrar && <button id="filtros" type="button">Filtros</button>}
          <Tour defaultOpen id="pedidos" step={1} steps={PASSOS.slice(0, 2)} />
        </div>
      );
    }
    render(<Atrasado />);
    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('data-ready');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar', hidden: true }));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('dialog', { name: 'Filtre a lista' })).toHaveAttribute('data-ready');
  });

  it('no passo de ação, não é modal, leva o foco ao alvo, descreve-o e conclui pelo clique nele', () => {
    const onEnd = vi.fn();
    const passos: TourStep[] = [{ id: 'novo', target: '#novo', title: 'Crie um pedido', content: 'Use o botão Novo pedido.', advanceOn: 'click' }];
    render(<Tela onEnd={onEnd} steps={passos} />);

    const passo = screen.getByRole('dialog', { name: 'Crie um pedido' });
    const alvo = screen.getByRole('button', { name: 'Novo pedido' });
    expect(passo).not.toHaveAttribute('aria-modal');
    expect(screen.queryByRole('button', { name: 'Avançar' })).not.toBeInTheDocument();
    expect(alvo).toHaveFocus();
    expect(alvo).toHaveAccessibleDescription('Use o botão Novo pedido. Passo 1 de 1');

    fireEvent.click(alvo);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onEnd).toHaveBeenCalledWith({ reason: 'completed', stepId: 'novo' });
    expect(alvo).not.toHaveAttribute('aria-describedby');
    expect(alvo).toHaveFocus();
  });

  it('com modal={false}, a página continua acessível', () => {
    render(<Tela modal={false} />);

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
    expect(screen.getByRole('button', { name: 'Antes' })).toBeInTheDocument();
  });

  it('troca os rótulos por labels', () => {
    render(<Tela labels={{ next: 'Próximo', close: 'Sair do tour', progress: (atual, total) => `${atual}/${total}` }} />);

    expect(screen.getByRole('button', { name: 'Próximo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair do tour' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Em três passos. 1/3');
  });

  it('avisa em desenvolvimento acima de 5 passos', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const passos = Array.from({ length: 6 }, (_, indice) => ({ id: `p${indice}`, title: `Passo ${indice}`, content: '...' }));
    render(<Tour defaultOpen id="longo" steps={passos} />);

    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('tem 6 passos'));
    aviso.mockRestore();
  });

  it('avisa em desenvolvimento o passo sem title', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Tour defaultOpen id="sem-titulo" steps={[{ id: 'p', title: '', content: '...' }]} />);

    expect(aviso).toHaveBeenCalledWith('Tour: "sem-titulo" tem passo sem `title`. O título dá nome ao diálogo do passo, e sem ele o diálogo fica sem nome acessível.');
    aviso.mockRestore();
  });
});

describe('TourProvider e useTour', () => {
  function Ajuda({ id = 'pedidos' }: { id?: string }) {
    const tour = useTour();
    return (
      <>
        <button onClick={() => tour.start(id)} type="button">Ajuda {id}</button>
        <button onClick={() => tour.stop()} type="button">Parar</button>
        <span data-testid="ativo">{tour.activeId ?? 'nenhum'}</span>
      </>
    );
  }

  it('abre pelo start, emite os eventos e marca como visto no fim', () => {
    const eventos: TourEvent[] = [];
    const storage: TourStorage = { hasSeen: vi.fn(() => false), markSeen: vi.fn() };
    render(
      <TourProvider onEvent={(evento) => eventos.push(evento)} storage={storage}>
        <Ajuda />
        <Tour id="pedidos" steps={PASSOS.slice(0, 1)} version={2} />
      </TourProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ajuda pedidos' }));
    expect(screen.getByTestId('ativo')).toHaveTextContent('pedidos');
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));

    expect(eventos).toEqual([
      { type: 'start', tourId: 'pedidos', version: 2 },
      { type: 'step', tourId: 'pedidos', version: 2, stepId: 'boas-vindas', index: 0, total: 1 },
      { type: 'end', tourId: 'pedidos', version: 2, stepId: 'boas-vindas', reason: 'completed' },
    ]);
    expect(storage.markSeen).toHaveBeenCalledWith('pedidos', 2, 'completed');
    expect(screen.getByTestId('ativo')).toHaveTextContent('nenhum');
  });

  it('abre um tour por vez: o segundo start é ignorado', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <TourProvider>
        <Ajuda />
        <Ajuda id="outro" />
        <Tour id="pedidos" modal={false} steps={PASSOS.slice(0, 1)} />
        <Tour id="outro" modal={false} steps={[{ id: 'x', title: 'Outro tour', content: '...' }]} />
      </TourProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ajuda pedidos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajuda outro' }));

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Conheça a tela' })).toBeInTheDocument();
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('apenas um tour fica aberto por vez'));
    aviso.mockRestore();
  });

  it('stop encerra o tour aberto com reason "dismissed"', () => {
    const onEnd = vi.fn();
    render(
      <TourProvider>
        <Ajuda />
        <Tour id="pedidos" modal={false} onEnd={onEnd} steps={PASSOS.slice(0, 1)} />
      </TourProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ajuda pedidos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onEnd).toHaveBeenCalledWith({ reason: 'dismissed', stepId: 'boas-vindas' });
  });

  it('hasSeen consulta o storage com a versão do tour montado; sem storage, false', async () => {
    const storage: TourStorage = { hasSeen: vi.fn(async () => true), markSeen: vi.fn() };
    let consultar: ((id: string) => Promise<boolean>) | undefined;
    function Consulta() {
      consultar = useTour().hasSeen;
      return null;
    }
    const { unmount } = render(
      <TourProvider storage={storage}>
        <Consulta />
        <Tour id="pedidos" steps={PASSOS} version={3} />
      </TourProvider>,
    );

    await expect(consultar!('pedidos')).resolves.toBe(true);
    expect(storage.hasSeen).toHaveBeenCalledWith('pedidos', 3);
    unmount();

    render(<Consulta />);
    await expect(consultar!('pedidos')).resolves.toBe(false);
  });
});
