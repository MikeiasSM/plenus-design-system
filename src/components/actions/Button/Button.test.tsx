import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Button } from './Button';

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
    // Uma regra só, mais especifica que o hover de cada variante (inclusive o `none` do ghost).
    expect(css.split(geral).length - 1).toBe(1);
    expect(css).not.toContain(".ghost:not(:disabled):not([aria-disabled='true']):hover:focus-visible");
  });

  it('as outras variantes seguem com a sombra no hover', () => {
    for (const variante of ['primary', 'secondary', 'soft', 'danger']) {
      expect(css.slice(css.indexOf(`.${variante} {`), css.indexOf('}', css.indexOf(`.${variante} {`)))).toContain('--button-hover-shadow');
    }
  });
});
