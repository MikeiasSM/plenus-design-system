import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Gera a documentacao de consulta rapida que viaja no pacote, em `dist/docs/`:
 *
 * - `index.md`, o indice curto: as regras que valem para toda tela, as trocas que mais erram, cada peca numa linha e
 *   os nomes de todos os tokens. Quem le e quem programa com a biblioteca, pessoa ou agente de codigo.
 * - `tokens.json`, os tokens no formato DTCG, com o valor no tema claro e no escuro.
 *
 * Tudo sai do catalogo, dos tokens e do `package.json`: nada aqui e escrito a mao fora deste script.
 */

const raiz = resolve(import.meta.dirname, '..');
const saida = resolve(raiz, 'dist/docs');
const ler = (caminho) => readFileSync(resolve(raiz, caminho), 'utf8');
const { name: pacote, version } = JSON.parse(ler('package.json'));

// ---------------------------------------------------------------------------------------------------------------------
// Tokens

const pastasDeTokens = ['primitive', 'semantic'];

/** Declaracoes `--pl-*` de um bloco de seletor, na ordem. */
function blocos(css) {
  const semComentario = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...semComentario.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, seletor, corpo]) => ({
    seletor: seletor.trim().replace(/\s+/g, ' '),
    declaracoes: [...corpo.matchAll(/(--pl-[\w-]+)\s*:\s*([^;]+);/g)].map(([, nome, valor]) => [nome, valor.trim().replace(/\s+/g, ' ')]),
  }));
}

function tipo(nome, valor) {
  if (/^(#|rgba?\(|hsla?\(|color-mix\(|light-dark\()/.test(valor) || /-(color|palette|chart|code|scrollbar|neutral|brand|status)-/.test(`${nome}-`)) {
    return 'color';
  }
  if (/^-?[\d.]+(px|rem|em|%)$/.test(valor)) return 'dimension';
  if (/^[\d.]+m?s$/.test(valor)) return 'duration';
  if (/^cubic-bezier\(/.test(valor)) return 'cubicBezier';
  if (/^\d{3}$/.test(valor)) return 'fontWeight';
  if (/font-(body|heading|mono)$/.test(nome)) return 'fontFamily';
  if (/shadow|elevation/.test(nome)) return 'shadow';
  return undefined;
}

/** Papel do token, onde a documentacao o descreve em tabela. */
const papeis = new Map();
for (const arquivo of readdirSync(resolve(raiz, 'docs')).filter((f) => /^TOKENS.*\.md$/.test(f))) {
  for (const [, nome, papel] of ler(`docs/${arquivo}`).matchAll(/^\| `(--pl-[\w-]+)` \| ([^|]+) \|/gm)) {
    papeis.set(nome, papel.trim());
  }
}

const tokens = {};
const nomesPorGrupo = new Map();

for (const pasta of pastasDeTokens) {
  for (const arquivo of readdirSync(resolve(raiz, 'src/tokens', pasta)).filter((f) => f.endsWith('.css')).sort()) {
    const grupo = `${pasta}/${arquivo.replace(/\.css$/, '')}`;
    const itens = {};

    for (const { seletor, declaracoes } of blocos(ler(`src/tokens/${pasta}/${arquivo}`))) {
      const escuro = seletor === '[data-theme="dark"]';
      const claro = !escuro && !seletor.includes('data-theme="dark"') && !seletor.includes(':not([data-theme])');

      for (const [nome, valor] of declaracoes) {
        const item = (itens[nome] ??= {});
        if (claro && item.$value === undefined) item.$value = valor;
        if (escuro) item.dark = valor;
      }
    }

    for (const [nome, item] of Object.entries(itens)) {
      if (item.$value === undefined) continue;
      const $type = tipo(nome, item.$value);
      tokens[grupo] ??= {};
      tokens[grupo][nome] = {
        $value: item.$value,
        ...($type && { $type }),
        ...(papeis.has(nome) && { $description: papeis.get(nome) }),
        ...(item.dark !== undefined && item.dark !== item.$value && { $extensions: { 'tema-escuro': item.dark } }),
      };
    }

    nomesPorGrupo.set(grupo, Object.keys(tokens[grupo] ?? {}));
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Componentes, do catalogo

const catalogo = ler('docs/COMPONENTS-CATALOG.md');
const secoes = [];
let atual;

for (const linha of catalogo.split(/\r?\n/)) {
  const titulo = linha.match(/^## \d+\. (.+)$/);
  if (titulo) {
    atual = { titulo: titulo[1], pecas: [] };
    secoes.push(atual);
    continue;
  }
  // A celula do nome pode juntar pecas: "`RadioGroup` com `Radio`".
  const peca = linha.match(/^\| (`[^|]*`[^|]*?) \| (.+?) \| Disponível \|$/);
  if (peca && atual) atual.pecas.push([peca[1], peca[2]]);
}

// ---------------------------------------------------------------------------------------------------------------------
// Regras do verificador (`pl-verificar`)

const nomesDasPecas = new Set(secoes.flatMap(({ pecas }) => pecas.flatMap(([nome]) => nome.match(/[A-Z]\w+/g) ?? [])));
const todos = Object.assign({}, ...Object.values(tokens));
const publicos = new Set(Object.keys(todos));

// Variaveis de componente que o catalogo documenta como ajuste do produto tambem sao publicas.
const definidasNoCss = new Set(ler('dist/design-system.css').match(/--pl-[\w-]+(?=\s*:)/g));
for (const [nome] of ler('docs/COMPONENTS-CATALOG.md').matchAll(/--pl-[\w-]+/g)) if (definidasNoCss.has(nome)) publicos.add(nome);

/** Nomes antigos, que a biblioteca ainda aceita como alias do token atual. */
const aliases = Object.fromEntries(
  [...ler('src/styles/tokens.css').matchAll(/(--pl-[\w-]+)\s*:\s*var\((--pl-[\w-]+)\)\s*;/g)].filter(([, antigo]) => !publicos.has(antigo)).map(([, antigo, atual]) => [antigo, atual]),
);

function resolver(valor, visitados = new Set()) {
  return valor.replace(/var\((--pl-[\w-]+)\)/g, (trecho, nome) => {
    if (visitados.has(nome) || !todos[nome]) return trecho;
    return resolver(todos[nome].$value, new Set([...visitados, nome]));
  });
}

function normalizarCor(valor) {
  const v = valor.trim().toLowerCase().replace(/\s+/g, '');
  const curto = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  return curto ? `#${curto[1]}${curto[1]}${curto[2]}${curto[2]}${curto[3]}${curto[3]}` : v;
}

const valorClaro = (nome) => resolver(todos[nome].$value);
const comPrefixo = (prefixo) => [...publicos].filter((nome) => nome.startsWith(prefixo) && todos[nome]);

const regras = {
  $description: `Regras do pl-verificar para ${pacote} ${version}. Gerado no build; nao edite.`,
  tokens: [...publicos].sort(),
  aliases,
  cores: comPrefixo('--pl-color-')
    .map((nome) => ({ nome, valor: normalizarCor(valorClaro(nome)) }))
    .filter(({ valor }) => /^(#[0-9a-f]{6,8}|rgba?\([\d.,]+\))$/.test(valor)),
  medidas: {
    espaco: Object.fromEntries(comPrefixo('--pl-space-').map((nome) => [valorClaro(nome), nome])),
    raio: Object.fromEntries(comPrefixo('--pl-radius-').map((nome) => [valorClaro(nome), nome])),
    fonte: comPrefixo('--pl-type-').filter((nome) => nome.endsWith('-size')).map((nome) => ({ nome, valor: valorClaro(nome) })),
  },
  sombras: comPrefixo('--pl-sh-').sort(),
  pecas: [...nomesDasPecas].sort(),
  html: {
    button: 'Button',
    select: 'Select (ou ComboBox, com busca)',
    textarea: 'Textarea',
    table: 'Table',
    dialog: 'Dialog',
    progress: 'Progress',
    meter: 'Meter',
  },
  entradas: {
    text: 'InputText',
    email: 'InputText',
    search: 'InputText',
    tel: 'InputText',
    url: 'InputText',
    number: 'InputNumber',
    password: 'InputPassword',
    checkbox: 'Checkbox',
    radio: 'RadioGroup com Radio',
    range: 'Slider',
    date: 'DatePicker',
    file: 'FileUpload',
    color: 'ColorField',
  },
  descontinuados: {},
};

for (const peca of [...Object.values(regras.html), ...Object.values(regras.entradas)]) {
  const nome = peca.match(/^\w+/)[0];
  if (!nomesDasPecas.has(nome)) throw new Error(`regras.json: a troca aponta para ${nome}, que o catalogo nao tem`);
}

function* arquivosTsx(pasta) {
  for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) yield* arquivosTsx(caminho);
    else if (/\.tsx?$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name)) yield caminho;
  }
}

// Membros descontinuados de peca composta: `export const X = Object.assign(Raiz, { /** @deprecated Use `Y`. */ Membro: ... })`.
for (const arquivo of arquivosTsx(resolve(raiz, 'src/components'))) {
  const codigo = readFileSync(arquivo, 'utf8');
  for (const [, dono, corpo] of codigo.matchAll(/export const (\w+) = Object\.assign\(\w+, \{([\s\S]*?)\}\);/g)) {
    for (const [, troca, membro] of corpo.matchAll(/\/\*\* @deprecated Use `([\w.]+)`[^*]*\*\/\s*(\w+):/g)) {
      regras.descontinuados[`${dono}.${membro}`] = troca;
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Indice

const raizDoPacote = `node_modules/${pacote}`;
const linhas = [
  `# ${pacote} ${version}: índice`,
  '',
  `Consulta rápida para programar com a biblioteca. O detalhe de cada peça está em \`${raizDoPacote}/docs/COMPONENTS-CATALOG.md\`, pelo nome da peça, e a API exata está nos tipos, em \`${raizDoPacote}/dist/types/\`. Os tokens, com valor no claro e no escuro, estão em \`${raizDoPacote}/dist/docs/tokens.json\`.`,
  '',
  'Este índice descreve o uso previsto da biblioteca e o que cada peça faz. As decisões de uso são do produto: limites de framework, de operação ou do próprio produto podem pedir outro caminho.',
  '',
  '> **Conferência recomendada:** `npx pl-verificar`, na pasta do projeto, aponta onde o código se afasta do uso previsto e indica a alternativa da biblioteca. `npx pl-verificar --fix` aplica as trocas exatas. Os achados são sugestões; a exceção que o produto decide fica registrada com `pl-verificar-ignorar` na linha ou em `pl-verificar.config.json`.',
  '',
  '## Uso previsto em toda tela',
  '',
  '1. Os estilos são importados uma vez, no ponto de entrada, nesta ordem:',
  '',
  '   ```ts',
  `   import '${pacote}/styles.css';`,
  `   import '${pacote}/reset.css';`,
  '   ```',
  '',
  '   O `styles.css` traz os componentes e os tokens. O `reset.css` dá à página o fundo, a cor do texto e a fonte do tema; sem ele, o texto solto fora dos componentes fica com a fonte e a cor do navegador.',
  '2. O tema escuro vale com `data-theme="dark"` no `<html>`; sem `data-theme`, segue o sistema. O seletor de tema do produto usa o `useColorScheme`.',
  '3. Tudo vem de um só ponto: `import { Button, InputText } from \'' + pacote + '\'`. Ícones vêm de `\'' + pacote + '/icons\'`.',
  '4. Onde a biblioteca tem peça, ela já traz rótulo, foco, estados e tema: botão, campo, tabela, diálogo, lista, abas, aviso. O elemento nativo equivalente não traz.',
  '5. Cor, espaço, raio, tipografia e sombra têm tokens `--pl-*`, listados abaixo; nome fora da lista não existe na biblioteca. Não há `--pl-font-size-*`: o tamanho do texto é `--pl-type-<papel>-size`.',
  '6. Os textos de interface da biblioteca estão em português do Brasil.',
  '7. O `npx pl-verificar` lê `src`, ou as pastas passadas como argumento. Aponta token que não existe, cor e medida fixas, reserva dispensável em `var()`, elemento nativo onde há peça, data em campo de texto, estilos não importados e peça descontinuada, sempre com a alternativa da biblioteca. Sai com código 0; com `--strict`, sai com código 1 quando há sugestões, para uso em integração contínua.',
  '',
  '## Escolhas que mais se confundem',
  '',
  '- Data, inclusive a de nascimento ou de vencimento, é o papel do `DatePicker`, que valida e devolve a data; o `InputText` com máscara e o `<input type="date">` devolvem texto.',
  '- Período de datas (de, até; início, fim) é o papel do `DatePickerRange`, que garante o fim depois do início, em vez de dois `DatePicker`.',
  '- O papel tipográfico do `Text` é `variant` (`body`, `label`, `caption`, `micro`, `title`, `code`), e não `role`.',
  '- A conta no rodapé do submenu vai em `Sidebar.Panel account={<Sidebar.Account …/>}`.',
  '- Campo com rótulo, ajuda e erro: o campo da biblioteca recebe `label`, `hint` e `error` e faz a amarração entre eles, que o `<label>` montado à parte não faz.',
  '- Envio de arquivo com progresso e remoção é o papel do `FileUpload`, que já traz a lista dos arquivos.',
  '- Cor de marca que o `createPalette` recusa por sumir na superfície: `nearestPaletteColor(cor)` devolve o tom aceito mais próximo; quando a cor exata é decisão do produto, `createPalette(cor, { acceptFaintFill: true })`.',
  '- Registros com ação em cada item (contatos, pedidos, notificações) cabem numa `Table`, quando há colunas, ou num `Card` por registro. A `List` serve à escolha de itens e não comporta botão dentro do item; a `SortableList` serve à ordenação.',
  '',
  '## Peças',
  '',
];

for (const { titulo, pecas } of secoes) {
  if (pecas.length === 0) continue;
  linhas.push(`### ${titulo}`, '');
  for (const [nome, papel] of pecas) linhas.push(`- ${nome}: ${papel}`);
  linhas.push('');
}

linhas.push('## Tokens', '', 'Os primitivos de cor (`primitive/brand`, `primitive/neutral`, `primitive/status`) alimentam os semânticos. Só o semântico acompanha o tema escuro e a paleta própria.', '');
for (const [grupo, nomes] of nomesPorGrupo) {
  if (nomes.length) linhas.push(`- ${grupo}: ${nomes.map((n) => `\`${n}\``).join(', ')}`);
}
linhas.push('');

mkdirSync(saida, { recursive: true });
writeFileSync(join(saida, 'index.md'), linhas.join('\n'));
writeFileSync(join(saida, 'regras.json'), `${JSON.stringify(regras, null, 2)}\n`);
writeFileSync(join(saida, 'tokens.json'), `${JSON.stringify({ $description: `Tokens de ${pacote} ${version}. $value vale no tema claro; $extensions["tema-escuro"], no escuro.`, ...tokens }, null, 2)}\n`);

const total = Object.values(tokens).reduce((soma, grupo) => soma + Object.keys(grupo).length, 0);
console.log(`docs para agentes: ${secoes.reduce((s, x) => s + x.pecas.length, 0)} peças, ${total} tokens`);
