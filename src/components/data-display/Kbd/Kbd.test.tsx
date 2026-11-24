import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Kbd } from './Kbd';
import { formatShortcut } from './keys';
import styles from './Kbd.module.css';

function falado(elemento: Element) {
  // O texto que sobra sem o que tem aria-hidden, com os espacos juntados.
  const copia = elemento.cloneNode(true) as Element;
  copia.querySelectorAll('[aria-hidden="true"]').forEach((oculto) => oculto.remove());
  return copia.textContent?.replace(/\s+/g, ' ').trim();
}

function visto(elemento: Element) {
  // O texto na tela, sem o que so o leitor ouve.
  const copia = elemento.cloneNode(true) as Element;
  copia.querySelectorAll(`.${styles.hidden}`).forEach((oculto) => oculto.remove());
  return copia.textContent;
}

describe('Kbd', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uma tecla so, num kbd dentro de outro', () => {
    const { container } = render(<Kbd>Esc</Kbd>);
    const externo = container.firstElementChild!;

    expect(externo.tagName).toBe('KBD');
    expect(externo.querySelectorAll('kbd')).toHaveLength(1);
    expect(visto(externo)).toBe('Esc');
    expect(falado(externo)).toBe('Escape');
  });

  it('na combinacao, o mais e visual e o leitor ouve as teclas separadas por espaco', () => {
    const { container } = render(<Kbd keys={['Mod', 'Shift', 'P']} />);
    const externo = container.firstElementChild!;

    expect(externo.querySelectorAll('kbd')).toHaveLength(3);
    expect(visto(externo)).toBe('Ctrl+Shift+P');
    expect(falado(externo)).toBe('Control Shift P');
  });

  it('Mod vale Ctrl por padrao, mesmo no macOS', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
    const { container } = render(<Kbd keys={['Mod', 'K']} />);

    expect(visto(container.firstElementChild!)).toBe('Ctrl+K');
  });

  it('no macOS, simbolos sem o mais, com o nome falado', () => {
    const { container } = render(<Kbd keys={['Mod', 'Shift', 'P']} platform="mac" />);
    const externo = container.firstElementChild!;

    expect(visto(externo)).toBe('⌘⇧P');
    expect(falado(externo)).toBe('Command Shift P');
  });

  it('auto descobre o macOS no navegador e mostra Ctrl no servidor', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');

    expect(renderToString(<Kbd keys={['Mod', 'K']} platform="auto" />)).toContain('Ctrl');

    const { container } = render(<Kbd keys={['Mod', 'K']} platform="auto" />);
    expect(container.firstElementChild).toHaveAttribute('data-platform', 'mac');
    expect(falado(container.firstElementChild!)).toBe('Command K');
  });

  it('nomes falados em portugues, trocados por labels', () => {
    const { container, rerender } = render(<Kbd keys={['Alt', 'ArrowUp']} />);

    expect(falado(container.firstElementChild!)).toBe('Alt Seta para cima');

    rerender(<Kbd keys={['Alt', 'ArrowUp']} labels={{ ArrowUp: 'Up arrow' }} />);
    expect(falado(container.firstElementChild!)).toBe('Alt Up arrow');
  });

  it('Espaco aparece pelo nome, e o nome segue labels', () => {
    const { container, rerender } = render(<Kbd keys={['Shift', 'Space']} />);

    expect(visto(container.firstElementChild!)).toBe('Shift+Espaço');

    rerender(<Kbd keys={['Shift', 'Space']} labels={{ Space: 'Space' }} />);
    expect(visto(container.firstElementChild!)).toBe('Shift+Space');
  });

  it('letra em maiuscula, tecla desconhecida como veio, e conteudo que nao e texto passa direto', () => {
    const { container, rerender } = render(<Kbd keys={['ctrl', 'f5', 'Fn']} />);

    expect(visto(container.firstElementChild!)).toBe('Ctrl+F5+Fn');

    rerender(
      <Kbd>
        <span data-testid="icone">↑</span>
      </Kbd>,
    );
    expect(container.querySelector('[data-testid="icone"]')).toBeInTheDocument();
  });

  it('repassa os atributos nativos ao kbd de fora', () => {
    const { container } = render(<Kbd className="extra" id="atalho" keys={['Mod', 'K']} />);

    expect(container.firstElementChild).toHaveAttribute('id', 'atalho');
    expect(container.firstElementChild).toHaveClass('extra');
  });

  it('herda a cor do texto e acompanha o tamanho dele, com regra de alto contraste', () => {
    const css = readFileSync(resolve(__dirname, 'Kbd.module.css'), 'utf8');

    expect(css).toMatch(/color-mix\(in srgb, currentColor 28%, transparent\)/);
    expect(css).toMatch(/font-size: 0\.8em/);
    expect(css).toMatch(/forced-colors: active/);
  });
});

describe('formatShortcut', () => {
  it('Ctrl+Shift+P fora do macOS e simbolos colados no macOS', () => {
    expect(formatShortcut(['Mod', 'Shift', 'P'])).toBe('Ctrl+Shift+P');
    expect(formatShortcut(['Mod', 'Shift', 'P'], 'mac')).toBe('⌘⇧P');
    expect(formatShortcut(['Alt', 'Enter'], 'mac')).toBe('⌥↵');
  });

  it('auto le a plataforma na chamada', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
    expect(formatShortcut(['Mod', 'K'], 'auto')).toBe('Ctrl+K');
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
    expect(formatShortcut(['Mod', 'K'], 'auto')).toBe('⌘K');
    vi.restoreAllMocks();
  });
});
