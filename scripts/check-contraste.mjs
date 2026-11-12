import { PALETAS, PARES, ACEITAS, declaracoesPorTema, resolver, resolverValor, contraste } from './contraste-tokens.mjs';

const naoMedidos = [];
const reprovados = [];
const linhas = [];

for (const [nomeDoTema, tokens] of PALETAS.flatMap((paleta) => {
  const temas = declaracoesPorTema(paleta);

  return [
    [`${paleta} claro`, temas.claro],
    [`${paleta} escuro`, temas.escuro],
  ];
})) {
  for (const [frente, fundo, minimo, papel] of PARES) {
    const corFrente = resolver(tokens, frente);
    const corFundo = fundo.startsWith('--') ? resolver(tokens, fundo) : resolverValor(tokens, fundo, new Set());
    const medida = corFrente && corFundo ? contraste(corFrente, corFundo) : undefined;

    if (medida === undefined) {
      naoMedidos.push(`${nomeDoTema}: ${papel} (${frente} sobre ${fundo})`);
      continue;
    }

    const chave = `${nomeDoTema}|${frente}|${fundo}`;
    const passa = medida >= minimo;
    const aceita = ACEITAS.has(chave);

    linhas.push(
      `  ${nomeDoTema.padEnd(14)} ${papel.padEnd(22)} ${medida.toFixed(2).padStart(6)}:1  ` +
        `minimo ${minimo}  ${passa ? 'ok' : aceita ? 'excecao aceita' : 'REPROVADO'}`,
    );

    if (!passa && !aceita) {
      reprovados.push(`${papel} no tema ${nomeDoTema}: ${medida.toFixed(2)}:1, minimo ${minimo}`);
    }
  }
}

console.log('Laudo de contraste dos tokens\n');
console.log(linhas.join('\n'));

if (naoMedidos.length > 0) {
  console.log('\nNao medidos, por nao resolverem em cor literal:');
  console.log(naoMedidos.map((item) => `  - ${item}`).join('\n'));
}

if (reprovados.length > 0) {
  console.error('\nReprovacoes nao declaradas:');
  console.error(reprovados.map((item) => `  - ${item}`).join('\n'));
  console.error('\nCorrija o token ou registre a excecao na lista ACEITAS deste script.');
  process.exit(1);
}

console.log('\nNenhuma reprovacao alem das declaradas.');
