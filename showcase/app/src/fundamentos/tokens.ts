import { useEffect, useState } from 'react';

/** Os arquivos de token do pacote, lidos como texto: a página desenha o que está declarado lá, sem copiar valor. */
const arquivos = import.meta.glob<string>(['../../../../src/tokens/**/*.css', '../../../../src/styles/tokens.css'], {
  eager: true,
  import: 'default',
  query: '?raw',
});

export interface Token {
  /** O valor como foi escrito no CSS, na primeira declaração (o tema claro). */
  declarado: string;
  nome: string;
}

function lerDeclaracoes(css: string) {
  const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');

  return [...semComentarios.matchAll(/(--pl-[\w-]+)\s*:\s*([^;]+);/g)].map(([, nome, valor]): Token => ({
    nome,
    declarado: valor.replace(/\s+/g, ' ').trim(),
  }));
}

export const tokens: readonly Token[] = (() => {
  const vistos = new Set<string>();

  return Object.keys(arquivos)
    .sort()
    .flatMap((caminho) => lerDeclaracoes(arquivos[caminho]))
    .filter(({ nome }) => !vistos.has(nome) && vistos.add(nome));
})();

export const tokensDe = (padrao: RegExp) => tokens.filter(({ nome }) => padrao.test(nome));

/** Muda a cada troca de tema, do Showcase ou do sistema, para os valores resolvidos serem lidos de novo. */
export function useTemaResolvido() {
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    const atualizar = () => setVersao((atual) => atual + 1);
    const observador = new MutationObserver(atualizar);
    const sistema = matchMedia('(prefers-color-scheme: dark)');

    observador.observe(document.documentElement, { attributeFilter: ['data-theme'], attributes: true });
    sistema.addEventListener('change', atualizar);

    return () => {
      observador.disconnect();
      sistema.removeEventListener('change', atualizar);
    };
  }, []);

  return versao;
}

const dois = (valor: number) => valor.toString(16).padStart(2, '0');

let contexto: CanvasRenderingContext2D | null | undefined;

/** Qualquer cor que o navegador entenda, inclusive `color-mix`, vira `#RRGGBB` (ou `rgba` com transparência). */
export function paraHexadecimal(cor: string) {
  contexto ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });

  if (!contexto || !cor) {
    return cor;
  }

  contexto.clearRect(0, 0, 1, 1);
  contexto.fillStyle = cor;
  contexto.fillRect(0, 0, 1, 1);
  const [vermelho, verde, azul, alfa] = contexto.getImageData(0, 0, 1, 1).data;

  return alfa === 255
    ? `#${[vermelho, verde, azul].map(dois).join('').toUpperCase()}`
    : `rgba(${vermelho}, ${verde}, ${azul}, ${Math.round((alfa / 255) * 100) / 100})`;
}
