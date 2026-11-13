import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

function arquivos(dir: string, extensao: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);

    return statSync(caminho).isDirectory() ? arquivos(caminho, extensao) : caminho.endsWith(extensao) && !caminho.includes('.test.') ? [caminho] : [];
  });
}

const raiz = resolve(process.cwd(), 'src');
const ler = (caminho: string) => readFileSync(resolve(raiz, caminho), 'utf8');
const rolam = arquivos(resolve(raiz, 'components'), '.module.css').filter((caminho) => /overflow(-[xy])?:\s*(auto|scroll)\b/.test(readFileSync(caminho, 'utf8')));
const SEM_BARRA = ['components/navigation/Sidebar/Sidebar.module.css'];

describe('barra de rolagem dos contêineres', () => {
  it('a classe usa barra fina, polegar transparente em repouso e a cor do token no ponteiro e no foco dentro', () => {
    const css = ler('utils/scrollbar/scrollbar.module.css');

    expect(css).toMatch(/\.thin \{\s*scrollbar-width: thin;\s*scrollbar-color: transparent transparent;/);
    expect(css).toMatch(/\.thin:focus-within \{\s*scrollbar-color: var\(--pl-scrollbar-thumb\) transparent;/);
    expect(css).toMatch(/@media \(hover: hover\) \{\s*\.thin:hover \{\s*scrollbar-color: var\(--pl-scrollbar-thumb\) transparent;/);
    expect(css).not.toContain('::-webkit-scrollbar');
  });

  it('o token é recalculado em cada escopo de tema', () => {
    expect(ler('tokens/semantic/scroll.css')).toMatch(/:root,\s*\[data-theme\] \{\s*--pl-scrollbar-thumb: color-mix\(in srgb, var\(--pl-color-text\) 18%, transparent\)/);
    expect(ler('styles/tokens.css')).toContain("@import '../tokens/semantic/scroll.css';");
  });

  it('a cor e a largura da barra ficam só na classe comum', () => {
    const avulsas = arquivos(resolve(raiz, 'components'), '.module.css').filter((caminho) => /scrollbar-color|scrollbar-width:(?!\s*none)/.test(readFileSync(caminho, 'utf8')));

    expect(avulsas.map((caminho) => relative(raiz, caminho).split(sep).join('/'))).toEqual([]);
  });

  it.each(rolam.map((caminho) => [relative(raiz, caminho).split(sep).join('/'), caminho] as const))('%s: o componente que rola usa a classe da barra', (nome, caminho) => {
    if (SEM_BARRA.includes(nome)) {
      return;
    }

    const usa = arquivos(dirname(caminho), '.tsx').some((tsx) => readFileSync(tsx, 'utf8').includes('utils/scrollbar/scrollbar'));

    expect(usa).toBe(true);
  });
});
