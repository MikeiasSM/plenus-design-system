#!/usr/bin/env node
import { existsSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import { carregarConfiguracao, carregarRegras, corrigir, listarArquivos, verificar, VERIFICACOES } from './index.mjs';

const ajuda = `pl-verificar: aponta onde o código do produto se afasta do uso previsto de @plenustech/design-system
e indica a alternativa da biblioteca. Os achados são sugestões; seguir cada uma é decisão do produto.

Uso: npx pl-verificar [pastas ou arquivos...] [--fix] [--json] [--strict]

  sem caminho  lê ./src (ou a pasta atual, se não houver src)
  --fix        aplica as trocas exatas (token antigo, cor e medida com token igual, reserva dispensável em var(),
               reset.css) e lista as sugestões restantes
  --json       saída em JSON, um achado por item
  --strict     sai com código 1 quando há sugestões, para uso em integração contínua

Exceções do produto:
  pl-verificar-ignorar        num comentário, excetua a linha do comentário e a seguinte; seguido de nomes de
                              verificação separados por vírgula, excetua só essas
  pl-verificar.config.json    na pasta atual: { "desligar": [verificações], "ignorar": [caminhos] }

Verificações: ${VERIFICACOES.join(', ')}.

Sem --strict, o comando sai com código 0.`;

const argumentos = process.argv.slice(2);
if (argumentos.includes('--help') || argumentos.includes('-h')) {
  console.log(ajuda);
  process.exit(0);
}

const caminhos = argumentos.filter((a) => !a.startsWith('--'));
if (caminhos.length === 0) caminhos.push(existsSync('src') ? 'src' : '.');

let configuracao;
try {
  configuracao = carregarConfiguracao();
} catch (erro) {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exit(2);
}

const regras = carregarRegras();
const arquivos = listarArquivos(caminhos, configuracao.ignorar);
const opcoes = { desligar: configuracao.desligar };
let achados = verificar(arquivos, regras, undefined, opcoes);
let corrigidos = 0;

if (argumentos.includes('--fix')) {
  const novos = corrigir(achados);
  for (const [arquivo, texto] of novos) writeFileSync(arquivo, texto);
  const antes = achados.filter((a) => !a.excecao).length;
  achados = verificar(arquivos, regras, undefined, opcoes);
  corrigidos = antes - achados.filter((a) => !a.excecao).length;
}

const sugestoes = achados.filter((a) => !a.excecao);
const excetuados = achados.length - sugestoes.length;

if (argumentos.includes('--json')) {
  console.log(JSON.stringify(achados.map(({ correcao, ...achado }) => ({ ...achado, arquivo: relative('.', achado.arquivo), corrigivel: !!correcao })), null, 2));
} else {
  for (const { arquivo, linha, coluna, regra, mensagem } of sugestoes) console.log(`${relative('.', arquivo)}:${linha}:${coluna}  ${regra}  ${mensagem}`);
  const corrigiveis = sugestoes.filter((a) => a.correcao).length;
  const partes = [`${sugestoes.length} sugestão(ões) em ${arquivos.length} arquivo(s)`];
  if (corrigidos) partes.push(`${corrigidos} aplicada(s) com --fix`);
  if (corrigiveis) partes.push(`${corrigiveis} com troca exata, aplicável com --fix`);
  if (excetuados) partes.push(`${excetuados} excetuada(s) pelo produto`);
  if (!sugestoes.length) partes[0] = `nenhuma sugestão em ${arquivos.length} arquivo(s)`;
  console.log(`${sugestoes.length ? '\n' : ''}pl-verificar: ${partes.join('; ')}.`);
}

process.exit(argumentos.includes('--strict') && sugestoes.length ? 1 : 0);
