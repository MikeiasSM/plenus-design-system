import { Button, Kbd, Tooltip, formatShortcut, type KbdPlatform } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const PLATAFORMAS = ['other', 'mac', 'auto'] as const;

/** "Mod + Shift + P" vira ['Mod', 'Shift', 'P']. */
function teclasDe(texto: string) {
  return texto
    .split(/\s*\+\s*|\s+/)
    .map((tecla) => tecla.trim())
    .filter(Boolean);
}

const playground = definirPlayground({
  inicial: { keys: 'Mod + Shift + P', platform: 'other' },
  controles: [
    { tipo: 'texto', nome: 'keys' },
    { tipo: 'opcoes', nome: 'platform', opcoes: PLATAFORMAS },
  ],
  renderizar: (valores) => (
    <p>
      Abra os comandos com <Kbd keys={teclasDe(valores.keys)} platform={valores.platform as KbdPlatform} />.
    </p>
  ),
  codigo: (valores) =>
    gerarJsx('Kbd', [
      ['keys', expr(`[${teclasDe(valores.keys).map((tecla) => `'${tecla}'`).join(', ')}]`)],
      ['platform', valores.platform, 'other'],
    ]),
  verificar: (valores) => {
    const teclas = teclasDe(valores.keys);
    const verificacoes: Verificacao[] = [
      teclas.length === 0
        ? { nivel: 'falha', titulo: 'Sem tecla', detalhe: 'Com keys vazio, nada aparece.' }
        : { nivel: 'ok', titulo: 'Leitura', detalhe: `O + é só visual: o leitor de tela ouve ${teclas.length === 1 ? 'a tecla' : `as ${teclas.length} teclas separadas por espaço`}.` },
    ];

    if (valores.platform === 'auto') {
      verificacoes.push({ nivel: 'ok', titulo: 'Plataforma no navegador', detalhe: 'No servidor sai Ctrl; depois de montar, ⌘ no macOS.' });
    }

    return verificacoes;
  },
});

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'No texto',
      descricao: 'A tecla acompanha o tamanho e a cor do texto em volta.',
      Previa: () => (
        <p>
          Feche a janela com <Kbd>Esc</Kbd> e busque em qualquer tela com <Kbd keys={['Mod', 'K']} />.
        </p>
      ),
      codigo: "Feche a janela com <Kbd>Esc</Kbd> e busque com <Kbd keys={['Mod', 'K']} />.",
    },
    {
      titulo: 'Na dica',
      descricao: 'Sobre o fundo escuro da dica, a borda e o fundo da tecla saem da cor do texto dela.',
      Previa: () => (
        <Tooltip
          content={
            <>
              Desfaz a última alteração <Kbd keys={['Mod', 'Z']} />
            </>
          }
        >
          <Button variant="secondary">Desfazer</Button>
        </Tooltip>
      ),
      codigo: "<Tooltip content={<>Desfaz a última alteração <Kbd keys={['Mod', 'Z']} /></>}>\n  <Button variant=\"secondary\">Desfazer</Button>\n</Tooltip>",
    },
    {
      titulo: 'No botão',
      descricao: 'Dentro do botão primário, a tecla fica na cor do rótulo.',
      Previa: () => (
        <Button>
          Salvar <Kbd keys={['Mod', 'S']} />
        </Button>
      ),
      codigo: "<Button>\n  Salvar <Kbd keys={['Mod', 'S']} />\n</Button>",
    },
    {
      titulo: 'No macOS',
      descricao: 'Com platform="mac", ou "auto" num Mac, Mod vira ⌘ e as teclas ficam lado a lado, sem o +.',
      Previa: () => (
        <p>
          <Kbd keys={['Mod', 'Shift', 'P']} platform="mac" /> e <Kbd keys={['Alt', 'Enter']} platform="mac" />
        </p>
      ),
      codigo: "<Kbd keys={['Mod', 'Shift', 'P']} platform=\"mac\" />\n<Kbd keys={['Alt', 'Enter']} platform=\"mac\" />",
    },
    {
      titulo: 'Atalho como texto',
      descricao: 'Onde só cabe uma string, como o shortcut do Menu, formatShortcut devolve o mesmo atalho.',
      Previa: () => (
        <p>
          <code>{formatShortcut(['Mod', 'Shift', 'D'])}</code> e <code>{formatShortcut(['Mod', 'Shift', 'D'], 'mac')}</code>
        </p>
      ),
      codigo: "formatShortcut(['Mod', 'Shift', 'D']); // 'Ctrl+Shift+D'\nformatShortcut(['Mod', 'Shift', 'D'], 'mac'); // '⌘⇧D'",
    },
  ],
  faca: {
    Previa: () => (
      <p>
        Busque com <Kbd keys={['Mod', 'K']} />.
      </p>
    ),
    texto: 'Kbd para mostrar o atalho que a tela já tem. O produto registra o atalho; o Kbd só o mostra.',
    codigo: "Busque com <Kbd keys={['Mod', 'K']} />.",
  },
  evite: {
    Previa: () => (
      <p>
        Busque com <Kbd>Ctrl + K</Kbd>.
      </p>
    ),
    texto: 'A combinação inteira numa tecla só: o leitor ouve "mais" e o Mac não ganha o ⌘. Combinação vai em keys.',
    codigo: '<Kbd>Ctrl + K</Kbd>',
  },
  garantias: [
    { garantia: 'Sem "mais" na leitura', como: <>O <code>+</code> tem <code>aria-hidden</code>, e entre as teclas vai um espaço oculto.</>, teste: 'Kbd.test.tsx' },
    { garantia: 'Símbolo com nome', como: <>⌘, ⇧, ⌥, ↵ e as setas ficam ocultos, com o nome falado em texto oculto.</>, teste: 'Kbd.test.tsx' },
    { garantia: 'Servidor sem divergência', como: <><code>platform="auto"</code> sai como Ctrl no servidor e troca depois de montar.</>, teste: 'Kbd.test.tsx' },
    { garantia: 'Alto contraste', como: <>Em <code>forced-colors</code>, a borda fica na cor do texto que o sistema escolheu.</>, teste: 'Kbd.test.tsx' },
  ],
  notaDaApi: 'Além destas, todas as propriedades nativas de <kbd>. Também sai formatShortcut(keys, platform), que devolve o atalho como texto.',
  api: [
    { nome: 'keys', tipo: 'readonly string[]', descricao: 'Combinação, na ordem em que se aperta. Mod, Ctrl, Shift, Alt, Enter, Esc, Space e as setas ganham símbolo e nome falado; letras saem em maiúscula; o resto, como veio.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'Uma tecla só. Texto passa pelos mesmos nomes de keys.' },
    { nome: 'platform', tipo: "'auto' | 'mac' | 'other'", padrao: "'other'", descricao: 'other mostra Ctrl; mac mostra os símbolos, sem o +; auto descobre a plataforma no navegador.' },
    { nome: 'labels', tipo: 'Partial<Record<KbdKeyName, string>>', descricao: 'Troca os nomes falados, em português por padrão ("Seta para cima", "Espaço").' },
  ],
};
