#!/usr/bin/env node
import { existsSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import { carregarRegras, corrigir, listarArquivos, verificar } from './index.mjs';

const ajuda = `pl-verificar: confere o uso de @plenustech/design-system no código do produto.

Uso: npx pl-verificar [pastas ou arquivos...] [--fix] [--json]

  sem caminho  lê ./src (ou a pasta atual, se não houver src)
  --fix        aplica as trocas exatas (token antigo, cor e medida com token igual, reserva desnecessária em var(), reset.css) e mostra o que sobrou
  --json       saída em JSON, um achado por item

Sai com código 1 quando há erro.`;

const argumentos = process.argv.slice(2);
if (argumentos.includes('--help') || argumentos.includes('-h')) {
  console.log(ajuda);
  process.exit(0);
}

const caminhos = argumentos.filter((a) => !a.startsWith('--'));
if (caminhos.length === 0) caminhos.push(existsSync('src') ? 'src' : '.');

const regras = carregarRegras();
const arquivos = listarArquivos(caminhos);
let achados = verificar(arquivos, regras);
let corrigidos = 0;

if (argumentos.includes('--fix')) {
  const novos = corrigir(achados);
  for (const [arquivo, texto] of novos) writeFileSync(arquivo, texto);
  const antes = achados.length;
  achados = verificar(arquivos, regras);
  corrigidos = antes - achados.length;
}

if (argumentos.includes('--json')) {
  console.log(JSON.stringify(achados.map(({ correcao, ...achado }) => ({ ...achado, arquivo: relative('.', achado.arquivo), corrigivel: !!correcao })), null, 2));
} else {
  for (const { arquivo, linha, coluna, regra, mensagem } of achados) console.log(`${relative('.', arquivo)}:${linha}:${coluna}  ${regra}  ${mensagem}`);
  const corrigiveis = achados.filter((a) => a.correcao).length;
  const partes = [`${achados.length} erro(s) em ${arquivos.length} arquivo(s)`];
  if (corrigidos) partes.push(`${corrigidos} corrigido(s)`);
  if (corrigiveis) partes.push(`${corrigiveis} corrigível(is) com --fix`);
  const proximo = corrigiveis
    ? 'Rode `npx pl-verificar --fix`, corrija à mão o que sobrar e rode de novo: a entrega só vale com zero erros.'
    : 'Corrija à mão seguindo cada mensagem e rode `npx pl-verificar` de novo: a entrega só vale com zero erros.';
  console.log(achados.length ? `\npl-verificar: ${partes.join('; ')}.\n${proximo}` : `pl-verificar: nenhum erro em ${arquivos.length} arquivo(s)${corrigidos ? `; ${corrigidos} corrigido(s)` : ''}.`);
}

process.exit(achados.length ? 1 : 0);
