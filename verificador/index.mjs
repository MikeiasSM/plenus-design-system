import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Verificador de uso da biblioteca, sem dependencias. Le o codigo do produto (TS, JS, JSX e CSS) e aponta onde ele se
 * afasta do uso previsto, com a alternativa da biblioteca: token que nao existe, cor, medida e sombra fixas, elemento
 * nativo onde ha peca, data em campo de texto, periodo com dois `DatePicker`, peca descontinuada e estilos nao
 * importados. Os achados sao sugestoes: seguir cada uma e decisao do produto.
 *
 * As regras vem de `dist/docs/regras.json`, gerado no build a partir dos tokens e do catalogo.
 */

const PACOTE = '@plenustech/design-system';
const EXTENSOES_DE_CODIGO = /\.(tsx?|jsx?|mjs|cjs)$/;
const EXTENSOES_DE_CSS = /\.(css|scss|sass|less)$/;
const PASTAS_IGNORADAS = new Set(['node_modules', 'dist', 'build', 'coverage', '.git', '.next', '.turbo']);

const COR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\([^)]*\)/g;
const PROPRIEDADE_DE_COR = /color|background|border|fill|stroke|outline|shadow|caret|accent|column-rule|text-decoration/;
const CORES_COM_NOME = {
  white: '#ffffff', black: '#000000', red: '#ff0000', green: '#008000', blue: '#0000ff', gray: '#808080', grey: '#808080',
  yellow: '#ffff00', orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', silver: '#c0c0c0', navy: '#000080',
  teal: '#008080', maroon: '#800000', olive: '#808000', lime: '#00ff00', aqua: '#00ffff', fuchsia: '#ff00ff',
  lightgray: '#d3d3d3', lightgrey: '#d3d3d3', darkgray: '#a9a9a9', darkgrey: '#a9a9a9', whitesmoke: '#f5f5f5',
};
const PROPRIEDADE_DE_ESPACO = /^(padding|margin|gap|row-gap|column-gap)(-|$)/;
/** Chaves e atributos cujo valor e dado, e nao estilo: a cor escolhida num `ColorField`, por exemplo. */
const CONTEXTO_DE_DADO = /^(value|defaultValue|placeholder|swatches|initialValue|id|key|href|title|label|alt|children)$/;

// ---------------------------------------------------------------------------------------------------------------------
// Leitura

export function carregarRegras(caminho = new URL('../dist/docs/regras.json', import.meta.url)) {
  return JSON.parse(readFileSync(caminho, 'utf8'));
}

/** Le `pl-verificar.config.json` da pasta, quando existe: `{ "desligar": [verificacoes], "ignorar": [caminhos] }`. */
export function carregarConfiguracao(pasta = '.') {
  const caminho = join(pasta, 'pl-verificar.config.json');
  if (!existsSync(caminho)) return {};
  const configuracao = JSON.parse(readFileSync(caminho, 'utf8'));
  const desconhecidas = (configuracao.desligar ?? []).filter((nome) => !VERIFICACOES.includes(nome));
  if (desconhecidas.length) {
    throw new Error(`pl-verificar.config.json: verificação desconhecida em "desligar": ${desconhecidas.join(', ')}. Verificações disponíveis: ${VERIFICACOES.join(', ')}.`);
  }
  return configuracao;
}

const normalizarCaminho = (caminho) => caminho.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');

export function listarArquivos(caminhos, ignorar = []) {
  const ignorados = ignorar.map(normalizarCaminho);
  const arquivos = [];
  const visitar = (caminho) => {
    if (!existsSync(caminho)) return;
    const normalizado = normalizarCaminho(caminho);
    if (ignorados.some((i) => normalizado === i || normalizado.startsWith(`${i}/`))) return;
    if (statSync(caminho).isDirectory()) {
      for (const entrada of readdirSync(caminho)) if (!PASTAS_IGNORADAS.has(entrada)) visitar(join(caminho, entrada));
    } else if (EXTENSOES_DE_CODIGO.test(caminho) || EXTENSOES_DE_CSS.test(caminho)) {
      if (!/\.(test|spec|stories)\.[jt]sx?$/.test(caminho) && !/\.d\.ts$/.test(caminho)) arquivos.push(caminho);
    }
  };
  for (const caminho of caminhos) visitar(caminho);
  return arquivos;
}

/** Apaga comentarios (e, numa segunda copia, o conteudo das strings) sem mudar posicoes, e lista as strings. */
function mascarar(texto, css) {
  const semComentario = texto.split('');
  const semString = texto.split('');
  const literais = [];
  const apagar = (copias, de, ate) => {
    for (const copia of copias) for (let k = de; k < ate; k++) if (copia[k] !== '\n') copia[k] = ' ';
  };

  let i = 0;
  while (i < texto.length) {
    const c = texto[i];
    const d = texto[i + 1];
    if (!css && c === '/' && d === '/' && texto[i - 1] !== ':') {
      const fim = texto.indexOf('\n', i);
      const ate = fim < 0 ? texto.length : fim;
      apagar([semComentario, semString], i, ate);
      i = ate;
    } else if (c === '/' && d === '*') {
      const fim = texto.indexOf('*/', i + 2);
      const ate = fim < 0 ? texto.length : fim + 2;
      apagar([semComentario, semString], i, ate);
      i = ate;
    } else if (!css && (c === '"' || c === "'" || c === '`')) {
      let j = i + 1;
      while (j < texto.length && texto[j] !== c && (c === '`' || texto[j] !== '\n')) j += texto[j] === '\\' ? 2 : 1;
      if (texto[j] !== c) {
        // Apostrofo em texto de JSX, e nao string.
        i++;
        continue;
      }
      literais.push({ inicio: i + 1, fim: j, conteudo: texto.slice(i + 1, j) });
      apagar([semString], i + 1, j);
      i = j + 1;
    } else {
      i++;
    }
  }

  return { codigo: semComentario.join(''), semStrings: semString.join(''), literais };
}

function posicao(texto, indice) {
  const antes = texto.slice(0, indice).split('\n');
  return { linha: antes.length, coluna: antes.at(-1).length + 1 };
}

// ---------------------------------------------------------------------------------------------------------------------
// Cores e medidas

function paraRgba(valor) {
  const v = valor.trim().toLowerCase();
  const hex = v.match(/^#([0-9a-f]+)$/);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map((x) => x + x).join('');
    const canais = h.match(/../g).map((x) => parseInt(x, 16));
    return [canais[0], canais[1], canais[2], canais.length > 3 ? canais[3] / 255 : 1];
  }
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
  if (rgb) {
    const alfa = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : Number(rgb[4]);
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), alfa];
  }
  return undefined;
}

function corMaisProxima(valor, cores) {
  const alvo = paraRgba(valor);
  if (!alvo) return undefined;
  let melhor;
  for (const cor of cores) {
    const rgba = paraRgba(cor.valor);
    if (!rgba) continue;
    const distancia = Math.hypot(alvo[0] - rgba[0], alvo[1] - rgba[1], alvo[2] - rgba[2]) + Math.abs(alvo[3] - rgba[3]) * 255;
    if (!melhor || distancia < melhor.distancia) melhor = { ...cor, distancia };
  }
  return melhor;
}

function distanciaDeEdicao(a, b) {
  const linha = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const atual = linha[j];
      linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = atual;
    }
  }
  return linha[b.length];
}

function sugerirToken(nome, regras) {
  if (/^--pl-font-size/.test(nome)) return 'O tamanho do texto usa `--pl-type-<papel>-size`, como `--pl-type-body-size`';
  let melhor;
  for (const token of regras.tokens) {
    const distancia = distanciaDeEdicao(nome, token);
    if (!melhor || distancia < melhor.distancia) melhor = { token, distancia };
  }
  if (melhor && melhor.distancia <= Math.max(2, Math.floor(nome.length * 0.25))) return `Token de nome próximo: \`${melhor.token}\``;
  const grupo = nome.split('-').slice(0, 4).join('-');
  const vizinhos = regras.tokens.filter((token) => token.startsWith(grupo)).slice(0, 6);
  if (vizinhos.length) return `Tokens do mesmo grupo: ${vizinhos.map((t) => `\`${t}\``).join(', ')}`;
  return 'O prefixo `--pl-` é reservado à biblioteca; para variáveis do produto, recomenda-se outro prefixo. Os tokens do tema estão listados em `dist/docs/tokens.json`';
}

/**
 * A troca automatica de cor so vale quando o papel do token combina com a propriedade: `#fff` no texto nao vira o token
 * de superficie so porque o valor no tema claro e o mesmo, ja que no escuro eles se separam.
 */
/** Cada `var(--pl-x, reserva)` do valor, com as posicoes do fim do nome, da virgula e do parentese que fecha. */
function reservasDeToken(valor) {
  const reservas = [];
  for (const { 0: trecho, 1: nome, index } of valor.matchAll(/var\(\s*(--pl-[\w-]+)\s*,/g)) {
    let profundidade = 1;
    let i = index + trecho.length;
    for (; i < valor.length && profundidade > 0; i++) {
      if (valor[i] === '(') profundidade++;
      else if (valor[i] === ')') profundidade--;
    }
    if (profundidade !== 0) continue;
    const fimDoNome = index + trecho.indexOf(nome) + nome.length;
    reservas.push({ nome, fimDoNome, virgula: index + trecho.length - 1, fecha: i - 1 });
  }
  // Uma reserva dentro de outra ja sai com a de fora.
  return reservas.filter((r) => !reservas.some((o) => o !== r && o.virgula < r.virgula && r.fecha < o.fecha));
}

function papelCombina(prop, token) {
  if (/^(color|caret-color|fill)$/.test(prop)) return /-text|-on-/.test(token);
  if (/^background/.test(prop)) return /surface|background|container/.test(token);
  if (/^(border|outline)/.test(prop)) return /border|line/.test(token);
  return false;
}

const kebab = (propriedade) => propriedade.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);

function pareceCss(texto) {
  const t = texto.trim();
  if (!t || /[^\x20-\x7e]/.test(t)) return false;
  return t
    .split(/[\s,]+/)
    .filter(Boolean)
    .every((parte) => /^(#[0-9a-fA-F]{3,8}|-?[\d.]+[a-z%]*|!important|[a-z-]+(\(.*)?|.*\)|\/|var\(--[\w-]+\)?|--[\w-]+)$/.test(parte));
}

// ---------------------------------------------------------------------------------------------------------------------
// Verificacao

/** Nomes das verificacoes, os mesmos do campo `regra` de cada achado. */
export const VERIFICACOES = [
  'token-antigo', 'token-inexistente', 'reserva-desnecessaria', 'sombra-fixa', 'cor-fixa', 'medida-fixa', 'descontinuado',
  'html-cru', 'data-em-texto', 'periodo-com-dois-campos', 'estilos-ausentes', 'reset-ausente',
];

const MARCA_DE_EXCECAO = /pl-verificar-ignorar\b([ \t]+[\w-]+(?:[ \t]*,[ \t]*[\w-]+)*)?/;

/**
 * Excecoes marcadas no proprio arquivo: `pl-verificar-ignorar`, num comentario, vale para a linha dele e, quando o
 * comentario esta sozinho na linha, tambem para a seguinte. Seguido de nomes de verificacao separados por virgula,
 * vale so para elas; o texto depois deles e livre.
 */
function excecoesDoArquivo(texto) {
  const excecoes = new Map();
  const juntar = (numero, alcance) => {
    const atual = excecoes.get(numero);
    if (atual === '*' || alcance === '*') excecoes.set(numero, '*');
    else excecoes.set(numero, new Set([...(atual ?? []), ...alcance]));
  };
  texto.split('\n').forEach((linha, i) => {
    const marca = linha.match(MARCA_DE_EXCECAO);
    if (!marca) return;
    const nomes = (marca[1] ?? '').split(',').map((n) => n.trim()).filter(Boolean);
    const alcance = nomes.length && nomes.every((n) => VERIFICACOES.includes(n)) ? new Set(nomes) : '*';
    juntar(i + 1, alcance);
    if (/^\s*(\/\/|\/\*|\{\s*\/\*|\*)/.test(linha)) juntar(i + 2, alcance);
  });
  return excecoes;
}

/**
 * Verifica uma lista de arquivos. Cada achado traz arquivo, linha, coluna, regra, mensagem e, quando ha troca exata, a
 * correcao (`{ inicio, fim, texto }` no arquivo). O achado que o produto excetuou sai com `excecao`: `'linha'`, pela
 * marca no arquivo, ou `'configuracao'`, pela verificacao desligada em `opcoes.desligar`.
 */
export function verificar(arquivos, regras = carregarRegras(), ler = (arquivo) => readFileSync(arquivo, 'utf8'), opcoes = {}) {
  const tokens = new Set(regras.tokens);
  const corPorValor = new Map();
  for (const cor of regras.cores) if (!corPorValor.has(cor.valor)) corPorValor.set(cor.valor, cor.nome);
  const desligadas = new Set(opcoes.desligar ?? []);
  const excecoesPorArquivo = new Map();

  const achados = [];
  const projeto = { usaLib: undefined, estilos: undefined, reset: false };
  const registrar = (achado) => {
    const alcance = excecoesPorArquivo.get(achado.arquivo)?.get(achado.linha);
    const excecao = desligadas.has(achado.regra) ? 'configuracao' : alcance === '*' || alcance?.has(achado.regra) ? 'linha' : undefined;
    achados.push(excecao ? { ...achado, excecao } : achado);
  };

  for (const arquivo of arquivos) {
    const texto = ler(arquivo);
    excecoesPorArquivo.set(arquivo, excecoesDoArquivo(texto));
    const css = EXTENSOES_DE_CSS.test(arquivo);
    const { codigo, semStrings, literais } = mascarar(texto, css);

    const achar = (indice, regra, mensagem, correcao) => registrar({ arquivo, ...posicao(texto, indice), regra, mensagem, ...(correcao && { correcao }) });

    const verificarToken = (nome, indice) => {
      if (regras.aliases[nome]) {
        achar(indice, 'token-antigo', `Nome antigo de token: \`${nome}\`. Nome atual: \`${regras.aliases[nome]}\`.`, { inicio: indice, fim: indice + nome.length, texto: regras.aliases[nome] });
      } else if (!tokens.has(nome)) {
        achar(indice, 'token-inexistente', `O token \`${nome}\` não existe na biblioteca. ${sugerirToken(nome, regras)}.`);
      }
    };

    /** Uma declaracao de estilo: `propriedade: valor`, com o valor a partir de `inicio` no arquivo. */
    const verificarDeclaracao = (propriedade, valor, inicio) => {
      const prop = kebab(propriedade);

      // A reserva depois de um token que existe sobra: sai inteira, e o que ha nela nao passa pelas outras regras.
      for (const reserva of reservasDeToken(valor)) {
        if (!tokens.has(reserva.nome) && !regras.aliases[reserva.nome]) continue;
        const conteudo = valor.slice(reserva.virgula + 1, reserva.fecha).trim();
        const cor = new RegExp(COR.source).test(conteudo) ? '; a cor fixa da reserva também não acompanha o tema escuro' : '';
        achar(inicio + reserva.virgula, 'reserva-desnecessaria', `Reserva dispensável \`${conteudo}\` em \`var(${reserva.nome}, …)\`: o token está sempre definido com os estilos da biblioteca${cor}. Forma equivalente: \`var(${reserva.nome})\`.`, {
          inicio: inicio + reserva.fimDoNome,
          fim: inicio + reserva.fecha,
          texto: '',
        });
        valor = valor.slice(0, reserva.virgula) + ' '.repeat(reserva.fecha - reserva.virgula) + valor.slice(reserva.fecha);
      }

      // A sombra fixa e um achado so: a cor dentro dela sai com a troca pelo token de sombra.
      if ((prop === 'box-shadow' || prop === 'text-shadow') && !/^\s*(none|inherit|initial|unset)\s*$/.test(valor) && !/var\(--pl-sh-/.test(valor) && /\d/.test(valor)) {
        achar(inicio, 'sombra-fixa', `Sombra fixa. Tokens de sombra disponíveis: ${regras.sombras.map((s) => `\`var(${s})\``).join(', ')}.`);
        return;
      }

      for (const { 0: trecho, index } of valor.matchAll(COR)) {
        const exato = corPorValor.get(paraRgba(trecho) ? normalizarCor(trecho) : trecho);
        if (exato && !papelCombina(prop, exato)) {
          achar(inicio + index, 'cor-fixa', `Cor fixa \`${trecho}\`. O valor coincide com \`${exato}\`, token de outro papel; recomenda-se o token \`--pl-color-*\` do papel correspondente, que acompanha o tema escuro.`);
        } else if (exato) {
          achar(inicio + index, 'cor-fixa', `Cor fixa \`${trecho}\`. Token equivalente: \`var(${exato})\`.`, { inicio: inicio + index, fim: inicio + index + trecho.length, texto: `var(${exato})` });
        } else {
          const proxima = corMaisProxima(trecho, regras.cores);
          const dica = proxima ? ` Token mais próximo: \`${proxima.nome}\` (${proxima.valor}).` : '';
          achar(inicio + index, 'cor-fixa', `Cor fixa \`${trecho}\`, que não acompanha o tema escuro. Recomenda-se um token \`--pl-color-*\`.${dica}`);
        }
      }

      if (PROPRIEDADE_DE_COR.test(prop)) {
        for (const { 0: palavra, index } of valor.matchAll(/(?<![\w-])[a-z]+(?![\w-(])/g)) {
          const hex = CORES_COM_NOME[palavra];
          if (!hex) continue;
          const proxima = corMaisProxima(hex, regras.cores);
          achar(inicio + index, 'cor-fixa', `Cor fixa \`${palavra}\`, que não acompanha o tema escuro. Recomenda-se um token \`--pl-color-*\`.${proxima ? ` Token mais próximo: \`${proxima.nome}\`.` : ''}`);
        }
      }

      const medidas = PROPRIEDADE_DE_ESPACO.test(prop) ? regras.medidas.espaco : /^border(-[a-z]+)*-radius$/.test(prop) ? regras.medidas.raio : undefined;
      if (medidas) {
        for (const { 0: medida, index } of valor.matchAll(/(?<![\w.-])\d+(\.\d+)?px\b/g)) {
          const token = medidas[medida];
          if (token) achar(inicio + index, 'medida-fixa', `Medida fixa \`${medida}\`. Token equivalente: \`var(${token})\`.`, { inicio: inicio + index, fim: inicio + index + medida.length, texto: `var(${token})` });
        }
      }

      if (prop === 'font-size') {
        for (const { 0: medida, index } of valor.matchAll(/(?<![\w.-])\d+(\.\d+)?px\b/g)) {
          const candidatos = regras.medidas.fonte.filter((f) => f.valor === medida).map((f) => `\`var(${f.nome})\``);
          if (candidatos.length) achar(inicio + index, 'medida-fixa', `Tamanho de texto fixo \`${medida}\`. Tokens equivalentes, conforme o papel do texto: ${candidatos.join(' ou ')}; o \`Text\` com \`variant\` também atende.`);
        }
      }

    };

    if (css) {
      for (const { 0: trecho, 1: nome, index } of codigo.matchAll(/(--pl-[\w-]+)/g)) {
        const definicao = /^\s*:/.test(codigo.slice(index + trecho.length));
        if (definicao && tokens.has(nome)) continue;
        verificarToken(nome, index);
      }
      for (const { 1: propriedade, 2: valor, index, 0: trecho } of codigo.matchAll(/(?<=[{;\s])([a-z-]+)\s*:\s*([^;{}]+)(?=[;}])/g)) {
        verificarDeclaracao(propriedade, valor, index + trecho.length - valor.length);
      }
      for (const { 1: folha, index } of codigo.matchAll(new RegExp(`@import\\s+(?:url\\()?['"]?${PACOTE}/(styles|reset)\\.css`, 'g'))) {
        if (folha === 'styles') projeto.estilos ??= { arquivo, indice: index, css: true };
        else projeto.reset = true;
      }
      continue;
    }

    // Codigo: tokens em qualquer lugar, e o resto nas strings que sao estilo.
    for (const { 0: nome, index } of codigo.matchAll(/--pl-[\w-]+/g)) verificarToken(nome, index);

    for (const literal of literais) {
      const antes = codigo.slice(Math.max(0, literal.inicio - 80), literal.inicio - 1);
      const contexto = antes.match(/([\w$]+)['"]?\s*(?::|=\{?)\s*$/)?.[1];
      if (contexto && CONTEXTO_DE_DADO.test(contexto)) continue;

      if (/^\s*([\w-]+\s*:\s*[^;]+;\s*)+$/.test(literal.conteudo)) {
        // Bloco de CSS numa template string.
        for (const { 1: propriedade, 2: valor, index, 0: trecho } of literal.conteudo.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) {
          verificarDeclaracao(propriedade, valor, literal.inicio + index + trecho.length - 1 - valor.length);
        }
      } else if (pareceCss(literal.conteudo)) {
        verificarDeclaracao(contexto ?? '', literal.conteudo, literal.inicio);
      }
    }

    if (/\.[jt]sx$/.test(arquivo)) verificarJsx(texto, codigo, semStrings, regras, achar);

    for (const { 1: dono, 2: membro, index } of semStrings.matchAll(/\b(\w+)\.(\w+)\b/g)) {
      const troca = regras.descontinuados[`${dono}.${membro}`];
      if (troca) achar(index, 'descontinuado', `\`${dono}.${membro}\` está descontinuado. Substituto: \`${troca}\`.`);
    }

    for (const { 0: trecho, 1: caminho, index } of codigo.matchAll(/\bimport\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"];?/g)) {
      if (caminho === PACOTE || caminho.startsWith(`${PACOTE}/`)) projeto.usaLib ??= { arquivo, indice: index };
      if (caminho === `${PACOTE}/styles.css`) projeto.estilos ??= { arquivo, indice: index, fim: index + trecho.length, texto };
      if (caminho === `${PACOTE}/reset.css`) projeto.reset = true;
    }
  }

  // Projeto: os estilos da biblioteca importados uma vez, com o reset.
  if (projeto.usaLib && !projeto.estilos) {
    const { arquivo, indice } = projeto.usaLib;
    registrar({
      arquivo, ...posicao(ler(arquivo), indice), regra: 'estilos-ausentes',
      mensagem: `Estilos da biblioteca não importados. Importação prevista no ponto de entrada: \`import '${PACOTE}/styles.css';\` seguido de \`import '${PACOTE}/reset.css';\`.`,
    });
  } else if (projeto.estilos && !projeto.reset) {
    const { arquivo, indice, fim, css } = projeto.estilos;
    registrar({
      arquivo, ...posicao(ler(arquivo), indice), regra: 'reset-ausente',
      mensagem: `\`${PACOTE}/reset.css\` não importado após o \`styles.css\`. Sem ele, a página mantém o fundo, a cor e a fonte do navegador, e o tema escuro não alcança o texto fora dos componentes.`,
      ...(!css && { correcao: { inicio: fim, fim, texto: `\nimport '${PACOTE}/reset.css';` } }),
    });
  }

  return achados.sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha || a.coluna - b.coluna);
}

function normalizarCor(valor) {
  const rgba = paraRgba(valor);
  if (!rgba) return valor.trim().toLowerCase();
  if (valor.trim().startsWith('#') && rgba[3] === 1) return `#${rgba.slice(0, 3).map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  return valor.trim().toLowerCase().replace(/\s+/g, '');
}

/** Fim da abertura de uma tag JSX a partir do nome, respeitando chaves e strings. */
function fimDaTag(codigo, inicio) {
  let profundidade = 0;
  let aspas;
  for (let i = inicio; i < codigo.length; i++) {
    const c = codigo[i];
    if (aspas) {
      if (c === aspas) aspas = undefined;
    } else if (c === '"' || c === "'" || c === '`') aspas = c;
    else if (c === '{') profundidade++;
    else if (c === '}') profundidade--;
    else if (c === '>' && profundidade === 0) return i;
  }
  return codigo.length;
}

function verificarJsx(texto, codigo, semStrings, regras, achar) {
  for (const { 1: tag, index } of semStrings.matchAll(/<(button|input|select|textarea|table|dialog|progress|meter)(?=[\s/>])/g)) {
    const atributos = codigo.slice(index, fimDaTag(codigo, index));
    let peca = regras.html[tag];
    if (tag === 'input') {
      const tipo = atributos.match(/\btype\s*=\s*\{?\s*["'`](\w+)/)?.[1] ?? 'text';
      if (tipo === 'hidden') continue;
      peca = regras.entradas[tipo] ?? (tipo === 'submit' || tipo === 'reset' || tipo === 'button' ? 'Button' : 'InputText');
    }
    achar(index + 1, 'html-cru', `Elemento nativo \`<${tag}>\`. Peça equivalente da biblioteca: \`${peca}\`, com rótulo, foco, estados e tema.`);
  }

  for (const { index } of semStrings.matchAll(/<InputText(?=[\s/>])/g)) {
    const atributos = codigo.slice(index, fimDaTag(codigo, index));
    const textos = [...atributos.matchAll(/\b(label|placeholder|aria-label|hint|mask)\s*=\s*\{?\s*["'`]([^"'`]*)/g)].map((m) => m[2]).join(' ');
    if (/\bdata\b|nascimento|vencimento|dd\s*\/\s*mm|\d{2}\/\d{2}\/\d{4}/i.test(textos)) {
      achar(index + 1, 'data-em-texto', 'Data em `InputText`. Peça equivalente da biblioteca: `DatePicker`, que valida, abre o calendário e devolve a data em vez de texto com máscara.');
    }
  }

  const datas = [...semStrings.matchAll(/<DatePicker(?=[\s/>])/g)].map(({ index }) => ({ index, atributos: codigo.slice(index, fimDaTag(codigo, index)) }));
  if (datas.length >= 2) {
    const tudo = datas.map((d) => d.atributos).join(' ');
    if (/in[ií]cio|inicial|start|from|\bde\b|desde/i.test(tudo) && /\bfim\b|final|\bend\b|\bto\b|\bat[ée]\b/i.test(tudo)) {
      achar(datas[1].index + 1, 'periodo-com-dois-campos', 'Período montado com dois `DatePicker`. Peça equivalente da biblioteca: `DatePickerRange`, que garante o fim depois do início e escolhe as duas datas no mesmo calendário.');
    }
  }
}

/** Aplica as correcoes exatas, menos as dos achados excetuados. Devolve o texto novo de cada arquivo alterado. */
export function corrigir(achados, ler = (arquivo) => readFileSync(arquivo, 'utf8')) {
  const porArquivo = new Map();
  for (const achado of achados) if (achado.correcao && !achado.excecao) porArquivo.set(achado.arquivo, [...(porArquivo.get(achado.arquivo) ?? []), achado.correcao]);

  const novos = new Map();
  for (const [arquivo, correcoes] of porArquivo) {
    let texto = ler(arquivo);
    let limite = Infinity;
    for (const { inicio, fim, texto: troca } of correcoes.sort((a, b) => b.inicio - a.inicio)) {
      if (fim > limite) continue;
      texto = texto.slice(0, inicio) + troca + texto.slice(fim);
      limite = inicio;
    }
    novos.set(arquivo, texto);
  }
  return novos;
}
