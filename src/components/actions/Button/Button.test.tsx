import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Button, type ButtonProps } from './Button';

describe('Button', () => {
  it('renders its children and uses button semantics', () => {
    render(<Button>Salvar</Button>);

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('supports variants and sizes', () => {
    render(
      <Button variant="secondary" size="lg">
        Continuar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Continuar' });
    expect(button.className).toContain('secondary');
    expect(button.className).toContain('lg');
  });

  it('applies the dangerSoft variant', () => {
    render(<Button variant="dangerSoft">Excluir</Button>);

    expect(screen.getByRole('button', { name: 'Excluir' }).className).toContain('dangerSoft');
  });

  it('defaults to a non-submitting button type', () => {
    render(<Button>Cancelar</Button>);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute('type', 'button');
  });

  it('forwards disabled state', () => {
    render(<Button disabled>Indisponivel</Button>);

    expect(screen.getByRole('button', { name: 'Indisponivel' })).toBeDisabled();
  });

  it('marks loading buttons as busy without removing them from the tab order', () => {
    render(<Button loading>Salvando</Button>);

    const button = screen.getByRole('button', { name: 'Salvando' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();

    button.focus();
    expect(button).toHaveFocus();
  });

  it('ignores clicks while loading', () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>Salvando</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Salvando' }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('calls the click handler when enabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Confirmar</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});

describe('icone do Button num espaco apertado', () => {
  const ler = (caminho: string) => readFileSync(resolve(process.cwd(), caminho), 'utf8');
  const bloco = (css: string, seletor: string) => css.slice(css.indexOf(`${seletor} {`), css.indexOf('}', css.indexOf(`${seletor} {`)));

  it('o svg do botao nao encolhe, qualquer que seja o reset do hospedeiro', () => {
    const regra = bloco(ler('src/components/actions/Button/Button.module.css'), '.button > svg');

    expect(regra).toContain('flex-shrink: 0;');
    expect(regra).toContain('max-width: none;');
  });

  it('o reset so poe teto percentual em imagem e video', () => {
    const tetos = [...ler('src/styles/reset.css').matchAll(/([^{}]+)\{[^}]*max-width:\s*100%/g)].map((m) => m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim());

    expect(tetos).toEqual(['img, video']);
  });
});

describe('hover do Button ghost', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/components/actions/Button/Button.module.css'), 'utf8');

  const bloco = (seletor: string) => {
    const inicio = css.indexOf(`${seletor} {`);

    expect(inicio).toBeGreaterThanOrEqual(0);
    return css.slice(inicio, css.indexOf('}', inicio));
  };

  it('nao tem sombra no hover, em nenhum tema: so tinge o fundo', () => {
    expect(bloco('.ghost')).not.toContain('--button-hover-shadow');
    expect(bloco(".ghost:not(:disabled):not([aria-disabled='true']):hover")).toMatch(/box-shadow: none;/);
  });

  it('com foco visivel e o ponteiro em cima, guarda o anel de foco em todas as variantes', () => {
    const geral = ".button:not(:disabled):not([aria-disabled='true']):hover:focus-visible";

    expect(bloco(geral)).toContain('box-shadow: var(--pl-control-focus-halo), 0 0 0 1px var(--pl-color-primary-strong);');
    // Uma regra so, mais especifica que o hover de cada variante (inclusive o `none` do ghost).
    expect(css.split(geral).length - 1).toBe(1);
    expect(css).not.toContain(".ghost:not(:disabled):not([aria-disabled='true']):hover:focus-visible");
  });

  it('declara o que o <a> herdaria diferente do <button>: como link, o visual e o mesmo', () => {
    const base = bloco('.button');

    expect(base).toContain('box-sizing: border-box;');
    expect(base).toContain('text-align: center;');
    expect(base).toContain('text-decoration: none;');
  });

  it('pressionado com o teclado, nenhuma variante apaga o anel de foco', () => {
    for (const [, regra] of css.matchAll(/:active \{([^}]*)\}/g)) {
      expect(regra).not.toContain('box-shadow');
    }
  });

  it('as outras variantes seguem com a sombra no hover', () => {
    for (const variante of ['primary', 'secondary', 'soft', 'danger']) {
      expect(css.slice(css.indexOf(`.${variante} {`), css.indexOf('}', css.indexOf(`.${variante} {`)))).toContain('--button-hover-shadow');
    }
  });
});

describe('Button como link', () => {
  it('com href renderiza um link com o destino, as variantes e os tamanhos do botao', () => {
    render(<Button href="/pedidos/novo" size="lg" variant="secondary">Novo pedido</Button>);

    const link = screen.getByRole('link', { name: 'Novo pedido' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/pedidos/novo');
    expect(link).not.toHaveAttribute('type');
    expect(link.className).toContain('secondary');
    expect(link.className).toContain('lg');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('com as entrega o link ao componente da aplicacao, com href e linkProps', () => {
    function Rota({ to, ...props }: { to?: string; children?: ReactNode }) {
      return <a {...props} data-rota={to} href={to} />;
    }
    render(<Button as={Rota} linkProps={{ to: '/pedidos' }}>Ver tudo</Button>);

    const link = screen.getByRole('link', { name: 'Ver tudo' });
    expect(link).toHaveAttribute('data-rota', '/pedidos');
    expect(link.className).toContain('primary');
  });

  it('desabilitado perde o destino, fica anunciado como link desabilitado e nao responde ao clique', () => {
    const onClick = vi.fn();
    render(<Button disabled href="/pedidos" onClick={onClick}>Ver tudo</Button>);

    const link = screen.getByRole('link', { name: 'Ver tudo' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('desabilitado, nao entrega o link ao componente da aplicacao', () => {
    render(<Button as="span" disabled linkProps={{ to: '/x' }}>Ver tudo</Button>);

    const link = screen.getByRole('link', { name: 'Ver tudo' });
    expect(link.tagName).toBe('A');
    expect(link).not.toHaveAttribute('to');
  });

  it('carregando mantem o destino, marca ocupado e nao navega nem chama o clique', () => {
    const onClick = vi.fn();
    render(<Button href="/pedidos" loading onClick={onClick}>Ver tudo</Button>);

    const link = screen.getByRole('link', { name: 'Ver tudo' });
    expect(link).toHaveAttribute('href', '/pedidos');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('aria-busy', 'true');
    expect(fireEvent.click(link)).toBe(false);
    expect(fireEvent(link, new MouseEvent('auxclick', { bubbles: true, cancelable: true }))).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('chama o clique e leva a ref ao elemento do link', () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const ref = createRef<HTMLAnchorElement>();
    render(<Button href="/pedidos" onClick={onClick} ref={ref}>Ver tudo</Button>);

    fireEvent.click(screen.getByRole('link', { name: 'Ver tudo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(screen.getByRole('link', { name: 'Ver tudo' }));
  });

  it('sem href nem as continua um botao, e a ref de botao segue valendo', () => {
    const ref = createRef<HTMLButtonElement>();
    const callbackRef = (_elemento: HTMLButtonElement | null) => undefined;
    render(<Button ref={ref}>Salvar</Button>);
    render(<Button ref={callbackRef}>Outro</Button>);

    expect(screen.getByRole('button', { name: 'Salvar' })).toBe(ref.current);
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('type', 'button');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('Button: cliques repetidos', () => {
  describe('tecla segurada', () => {
    it('cancela o Enter e o Espaço repetidos, que o navegador converteria em cliques', () => {
      render(<Button>Salvar</Button>);
      const button = screen.getByRole('button', { name: 'Salvar' });

      expect(fireEvent.keyDown(button, { key: 'Enter', repeat: true })).toBe(false);
      expect(fireEvent.keyDown(button, { key: ' ', repeat: true })).toBe(false);
      expect(fireEvent.keyDown(button, { key: 'Enter' })).toBe(true);
    });

    it('repassa a tecla ao onKeyDown do consumidor', () => {
      const onKeyDown = vi.fn();
      render(<Button onKeyDown={onKeyDown}>Salvar</Button>);

      fireEvent.keyDown(screen.getByRole('button', { name: 'Salvar' }), { key: 'Enter', repeat: true });

      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('como link, cancela o Enter repetido, que repetiria a navegação, e deixa o Espaço com o navegador', () => {
      const onKeyDown = vi.fn();
      render(<Button href="/pedidos" onKeyDown={onKeyDown}>Ver tudo</Button>);
      const link = screen.getByRole('link', { name: 'Ver tudo' });

      expect(fireEvent.keyDown(link, { key: 'Enter', repeat: true })).toBe(false);
      expect(fireEvent.keyDown(link, { key: 'Enter' })).toBe(true);
      expect(fireEvent.keyDown(link, { key: ' ', repeat: true })).toBe(true);
      expect(onKeyDown).toHaveBeenCalledTimes(3);
    });
  });

  it('o onClick que devolve uma Promise não trava o botão: quem liga loading é o produto', () => {
    const onClick = vi.fn(() => new Promise<void>(() => {}));
    render(<Button onClick={onClick}>Salvar</Button>);
    const button = screen.getByRole('button', { name: 'Salvar' });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(2);
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button).not.toHaveAttribute('aria-disabled');
  });

  it('o onClick tem o tipo nativo do botão', () => {
    expectTypeOf<ButtonProps['onClick']>().toEqualTypeOf<ButtonHTMLAttributes<HTMLButtonElement>['onClick']>();
  });
});
