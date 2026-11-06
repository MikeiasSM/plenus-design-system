import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

/**
 * Instala o tarball de `npm pack` em apps minimos, fora do repositorio, e confere o consumo real: Vite com React
 * aberto em Chrome (com axe, no claro e no escuro, e o tema por subarvore), Next com Server Components e CommonJS.
 * As dependencias dos apps ficam so nos apps temporarios. Exige `npm run build` feito antes.
 */

const raiz = resolve(import.meta.dirname, '..');
const base = resolve(process.env.CONSUMO_DIR ?? 'F:/temp/agente-testes-pacote');
const pacote = '@plenustech/design-system';
const resultados = [];
const violacoesAxe = [];
let tarball = '';

function executar(comando, args, pasta) {
  const resposta = spawnSync(comando, args, { cwd: pasta, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });

  if (resposta.status !== 0) {
    throw new Error(`${comando} ${args.join(' ')} falhou:\n${(resposta.stdout + resposta.stderr).slice(-2500)}`);
  }

  return resposta.stdout;
}

function criarApp(nome, arquivos, dependencias) {
  const pasta = join(base, nome);

  rmSync(join(pasta, 'node_modules', '@plenustech'), { recursive: true, force: true });
  rmSync(join(pasta, 'package-lock.json'), { force: true });
  mkdirSync(pasta, { recursive: true });

  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    const destino = join(pasta, caminho);

    mkdirSync(join(destino, '..'), { recursive: true });
    writeFileSync(destino, conteudo);
  }

  writeFileSync(join(pasta, 'package.json'), JSON.stringify({ name: `consumo-${nome}`, private: true, type: 'module' }));
  executar('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', `"${tarball}"`, ...dependencias], pasta);

  return pasta;
}

const mainVite = `
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { AppShell, Button, ChartBar, Dialog, Select } from '${pacote}';
import '${pacote}/reset.css';
import '${pacote}/styles.css';

function App() {
  const [aberto, setAberto] = useState(false);

  return (
    <AppShell>
      <AppShell.Navigation>
        <AppShell.Rail label="Modulos">
          <AppShell.RailItem current href="/vendas" icon="V" label="Vendas" />
        </AppShell.Rail>
        <AppShell.Panel brand="Gestor" label="Vendas">
          <AppShell.PanelItem current href="/pedidos" label="Pedidos" />
        </AppShell.Panel>
      </AppShell.Navigation>
      <AppShell.Page>
        <AppShell.PageBar>Pedidos</AppShell.PageBar>
        <AppShell.PageBody>
          <div id="subarvore" data-theme="dark">
            <Button>Dentro do escuro</Button>
          </div>
          <Button onClick={() => setAberto(true)}>Abrir dialogo</Button>
          <Select label="Forma de pagamento" options={[{ value: 'pix', label: 'Pix' }, { value: 'cartao', label: 'Cartao' }]} />
          <ChartBar
            categories={['08/2026', '09/2026']}
            series={[{ label: 'Receita', values: [300, 210], intent: 'positive' }]}
            title="Receita por mes"
          />
          <Dialog open={aberto} onOpenChange={setAberto} title="Confirmar" description="Descricao do dialogo.">
            Corpo do dialogo.
          </Dialog>
        </AppShell.PageBody>
      </AppShell.Page>
    </AppShell>
  );
}

createRoot(document.getElementById('raiz')).render(<App />);
`;

const tiposMime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.map': 'application/json' };

function servirPasta(pasta) {
  const servidor = createServer((req, res) => {
    const caminho = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const arquivo = join(pasta, caminho);

    if (!existsSync(arquivo)) {
      res.writeHead(404).end();
      return;
    }

    res.writeHead(200, { 'content-type': tiposMime[extname(arquivo)] ?? 'application/octet-stream' });
    res.end(readFileSync(arquivo));
  });

  return new Promise((ok) => servidor.listen(0, '127.0.0.1', () => ok(servidor)));
}

function caminhoDoChrome() {
  const candidatos = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];
  const achado = candidatos.find((c) => c && existsSync(c));

  if (!achado) {
    throw new Error('Chrome nao encontrado; defina CHROME_PATH');
  }

  return achado;
}

/** Le, no navegador, o que o tema muda: color-scheme e tokens resolvidos na raiz e na subarvore escura. */
function lerTemaNoNavegador() {
  const lido = (el) => {
    const estilo = getComputedStyle(el);
    const sonda = el.appendChild(document.createElement('i'));

    // Um token com `light-dark()` so se resolve numa propriedade de cor, nao no valor da variavel.
    sonda.style.color = 'var(--pl-color-primary)';
    const primariaResolvida = getComputedStyle(sonda).color;

    sonda.remove();

    return {
      scheme: estilo.colorScheme,
      superficie: estilo.getPropertyValue('--pl-color-surface').trim(),
      texto: estilo.getPropertyValue('--pl-color-text').trim(),
      primaria: primariaResolvida,
    };
  };

  document.documentElement.dataset.theme = 'light';

  return { raiz: lido(document.documentElement), subarvore: lido(document.getElementById('subarvore')) };
}

async function consumoVite() {
  const pasta = criarApp(
    'vite',
    {
      'index.html':
        '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Consumo</title></head><body><div id="raiz"></div><script type="module" src="/main.jsx"></script></body></html>',
      'main.jsx': mainVite,
      'vite.config.js': "import react from '@vitejs/plugin-react';\nexport default { plugins: [react()] };\n",
    },
    ['react@19', 'react-dom@19', 'vite@6', '@vitejs/plugin-react@4', 'puppeteer-core', 'axe-core'],
  );

  executar('npx', ['vite', 'build'], pasta);

  const requireDoApp = createRequire(join(pasta, 'package.json'));
  const puppeteer = requireDoApp('puppeteer-core');
  const caminhoAxe = requireDoApp.resolve('axe-core/axe.min.js');
  const servidor = await servirPasta(join(pasta, 'dist'));
  const navegador = await puppeteer.launch({ executablePath: caminhoDoChrome(), headless: true, args: ['--no-sandbox'] });
  const problemas = [];

  try {
    const pagina = await navegador.newPage();

    await pagina.setViewport({ width: 1280, height: 800 });

    pagina.on('pageerror', (erro) => problemas.push(`erro na pagina: ${erro.message}`));
    pagina.on('console', (msg) => msg.type() === 'error' && problemas.push(`console.error: ${msg.text()}`));
    await pagina.goto(`http://127.0.0.1:${servidor.address().port}/`, { waitUntil: 'networkidle0' });
    await pagina.addScriptTag({ path: caminhoAxe });

    const montado = await pagina.evaluate(() => ({
      botao: !!document.querySelector('#subarvore button'),
      select: !!document.querySelector('[role=combobox]'),
      grafico: !!document.querySelector('svg'),
      shell: !!document.querySelector('nav'),
    }));

    for (const [parte, presente] of Object.entries(montado)) {
      if (!presente) problemas.push(`${parte} nao foi montado`);
    }

    const tema = await pagina.evaluate(lerTemaNoNavegador);

    if (tema.raiz.scheme !== 'light') problemas.push(`color-scheme da raiz clara: ${tema.raiz.scheme}`);
    if (tema.subarvore.scheme !== 'dark') problemas.push(`color-scheme da subarvore escura: ${tema.subarvore.scheme}`);
    if (tema.subarvore.superficie === tema.raiz.superficie) problemas.push('--pl-color-surface igual no claro e no escuro');
    if (tema.subarvore.texto === tema.raiz.texto) problemas.push('--pl-color-text igual no claro e no escuro');
    if (tema.subarvore.primaria === tema.raiz.primaria) {
      problemas.push('--pl-color-primary (light-dark) nao mudou na subarvore escura');
    }

    const varrer = async (cenario) => {
      const { violations } = await pagina.evaluate(() => axe.run(document, { resultTypes: ['violations'] }));

      for (const v of violations) {
        violacoesAxe.push({ cenario, regra: v.id, impacto: v.impact, ocorrencias: v.nodes.length, alvo: v.nodes[0].target.join(' ') });
      }
    };

    for (const escolhido of ['light', 'dark']) {
      await pagina.reload({ waitUntil: 'networkidle0' });
      await pagina.addScriptTag({ path: caminhoAxe });
      await pagina.evaluate((t) => { document.documentElement.dataset.theme = t; }, escolhido);
      await varrer(`pagina, tema ${escolhido}`);
      await pagina.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Abrir dialogo').click());
      await pagina.waitForSelector('[role=dialog]');
      await varrer(`dialogo aberto, tema ${escolhido}`);
    }

    return {
      problemas,
      detalhe: `montou ${Object.keys(montado).join(', ')}; tema por subarvore confere; ${violacoesAxe.length} violacao(oes) do axe`,
    };
  } finally {
    await navegador.close();
    servidor.close();
  }
}

const mainViteComponentes = `
import { createRoot } from 'react-dom/client';
import { Button, Select } from '${pacote}';
import '${pacote}/styles/base.css';
import '${pacote}/styles/Button.css';
import '${pacote}/styles/Select.css';

createRoot(document.getElementById('raiz')).render(
  <>
    <Button>Salvar</Button>
    <Select label="Forma de pagamento" options={[{ value: 'pix', label: 'Pix' }]} />
  </>,
);
`;

/** Base e folhas por componente num app Vite: so o que a tela usa vai para o CSS, e o botao e o select saem estilizados. */
async function consumoViteComponentes() {
  const pasta = criarApp(
    'vite-componentes',
    {
      'index.html':
        '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Consumo</title></head><body><div id="raiz"></div><script type="module" src="/main.jsx"></script></body></html>',
      'main.jsx': mainViteComponentes,
      'vite.config.js': "import react from '@vitejs/plugin-react';\nexport default { plugins: [react()] };\n",
    },
    ['react@19', 'react-dom@19', 'vite@6', '@vitejs/plugin-react@4', 'puppeteer-core'],
  );

  executar('npx', ['vite', 'build'], pasta);

  const css = readdirSync(join(pasta, 'dist/assets')).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(pasta, 'dist/assets', f), 'utf8')).join('');
  const inteira = readFileSync(join(pasta, 'node_modules', pacote, 'dist/design-system.css'), 'utf8');
  const problemas = [];

  if (css.length >= inteira.length / 2) problemas.push(`o CSS da tela (${css.length} bytes) nao ficou bem menor que a folha inteira (${inteira.length})`);
  if (!css.includes('--pl-color-primary')) problemas.push('os tokens da base nao chegaram ao CSS');
  if (css.includes('_bar_')) problemas.push('CSS de um componente que a tela nao usa foi junto');

  const requireDoApp = createRequire(join(pasta, 'package.json'));
  const servidor = await servirPasta(join(pasta, 'dist'));
  const navegador = await requireDoApp('puppeteer-core').launch({ executablePath: caminhoDoChrome(), headless: true, args: ['--no-sandbox'] });

  try {
    const pagina = await navegador.newPage();

    await pagina.goto(`http://127.0.0.1:${servidor.address().port}/`, { waitUntil: 'networkidle0' });

    const estilos = await pagina.evaluate(() => ({
      botao: getComputedStyle(document.querySelector('button')).backgroundColor,
      select: getComputedStyle(document.querySelector('[role=combobox]')).display,
    }));

    if (estilos.botao === 'rgba(0, 0, 0, 0)') problemas.push('o Button ficou sem o fundo da folha dele');
    if (estilos.select !== 'flex') problemas.push(`o Select ficou sem a folha dele (display ${estilos.select})`);
  } finally {
    await navegador.close();
    servidor.close();
  }

  return { problemas, detalhe: `base e folhas por componente: ${css.length} bytes de CSS contra ${inteira.length} da folha inteira; Button e Select estilizados` };
}

function consumoNext() {
  const pasta = criarApp(
    'next',
    {
      'app/layout.jsx': `import '${pacote}/reset.css';\nimport '${pacote}/styles.css';\nexport const metadata = { title: 'Consumo' };\nexport default function Layout({ children }) {\n  return <html lang="pt-BR"><body>{children}</body></html>;\n}\n`,
      'app/page.jsx': `import { Badge } from '${pacote}';\nimport { Cliente } from './cliente';\nexport default function Page() {\n  return <main><Badge>Servidor</Badge><Cliente /></main>;\n}\n`,
      'app/cliente.jsx': `'use client';\nimport { useState } from 'react';\nimport { Button } from '${pacote}';\nexport function Cliente() {\n  const [n, setN] = useState(0);\n  return <Button onClick={() => setN(n + 1)}>Cliente {n}</Button>;\n}\n`,
    },
    ['next@latest', 'react@19', 'react-dom@19'],
  );

  rmSync(join(pasta, '.next'), { recursive: true, force: true });
  executar('npx', ['next', 'build'], pasta);

  const html = readFileSync(join(pasta, '.next/server/app/index.html'), 'utf8');
  const problemas = ['Servidor', 'Cliente'].filter((texto) => !html.includes(texto)).map((t) => `"${t}" ausente do HTML pre-renderizado`);

  return { problemas, detalhe: 'next build passou; Badge no servidor e Button no cliente pre-renderizados' };
}

function consumoCommonJs() {
  const pasta = criarApp(
    'cjs',
    {
      'teste.cjs': `
const assert = require('node:assert');
const lib = require('${pacote}');
const icones = require('${pacote}/icons');
assert.ok(Object.keys(lib).length > 100, 'poucas exportacoes: ' + Object.keys(lib).length);
for (const nome of ['Button', 'Dialog', 'Select', 'AppShell', 'ChartBar', 'Table', 'DataGrid']) {
  assert.ok(nome in lib, nome + ' ausente');
}
assert.ok(Object.keys(icones).length > 0, 'icones vazios');
import('${pacote}').then((esm) => {
  assert.deepStrictEqual(Object.keys(esm).filter((k) => k !== 'default').sort(), Object.keys(lib).sort());
  console.log(Object.keys(lib).length + ' exportacoes; ' + Object.keys(icones).length + ' icones; ESM e CommonJS iguais');
});
`,
    },
    ['react@19', 'react-dom@19'],
  );

  return { problemas: [], detalhe: executar('node', ['teste.cjs'], pasta).trim() };
}

async function rodar(nome, consumo) {
  try {
    const { problemas, detalhe } = await consumo();

    resultados.push({ nome, ok: problemas.length === 0, texto: problemas.length ? problemas.join('; ') : detalhe });
  } catch (erro) {
    resultados.push({ nome, ok: false, texto: erro.message });
  }
}

if (!existsSync(resolve(raiz, 'dist/index.js'))) {
  console.error('dist/ ausente: rode `npm run build` antes.');
  process.exit(1);
}

mkdirSync(base, { recursive: true });

for (const antigo of readdirSync(base).filter((f) => f.endsWith('.tgz'))) {
  rmSync(join(base, antigo));
}

const nomeDoTarball = executar('npm', ['pack', '--ignore-scripts', '--pack-destination', `"${base}"`, '--silent'], raiz)
  .trim()
  .split('\n')
  .pop();

tarball = join(base, nomeDoTarball.trim());

await rodar('Vite com React (Chrome)', consumoVite);
await rodar('Vite com folhas por componente (Chrome)', consumoViteComponentes);
await rodar('Next com Server Components', consumoNext);
await rodar('CommonJS', consumoCommonJs);

for (const r of resultados) {
  console.log(`${r.ok ? 'OK    ' : 'FALHOU'} ${r.nome}: ${r.texto}`);
}

if (violacoesAxe.length > 0) {
  console.log('\nViolacoes do axe (informativas, nao reprovam):');

  for (const v of violacoesAxe) {
    console.log(`  [${v.cenario}] ${v.regra} (${v.impacto}) x${v.ocorrencias}: ${v.alvo}`);
  }
}

process.exit(resultados.every((r) => r.ok) ? 0 : 1);
