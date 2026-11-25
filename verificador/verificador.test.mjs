import { describe, expect, it } from 'vitest';
import { corrigir, verificar } from './index.mjs';

const regras = {
  tokens: ['--pl-color-border', '--pl-color-text', '--pl-color-text-secondary', '--pl-color-surface', '--pl-shell-gap', '--pl-space-4', '--pl-radius-md', '--pl-sh-1', '--pl-sh-2', '--pl-type-body-size'],
  aliases: { '--pl-text-2': '--pl-color-text-secondary' },
  cores: [
    { nome: '--pl-color-border', valor: '#e9e9e9' },
    { nome: '--pl-color-text', valor: '#26282a' },
    { nome: '--pl-color-surface', valor: '#ffffff' },
  ],
  medidas: { espaco: { '16px': '--pl-space-4' }, raio: { '8px': '--pl-radius-md' }, fonte: [{ nome: '--pl-type-body-size', valor: '14px' }] },
  sombras: ['--pl-sh-1', '--pl-sh-2'],
  pecas: ['Button', 'Checkbox', 'DatePicker', 'DatePickerRange', 'InputText', 'Table'],
  html: { button: 'Button', table: 'Table' },
  entradas: { text: 'InputText', checkbox: 'Checkbox', date: 'DatePicker' },
  descontinuados: { 'AppShell.Panel': 'Sidebar.Panel' },
};

const ESTILOS = "import '@plenustech/design-system/styles.css';\nimport '@plenustech/design-system/reset.css';\n";

function rodar(arquivos) {
  const ler = (arquivo) => arquivos[arquivo];
  const achados = verificar(Object.keys(arquivos), regras, ler);
  return { achados, regras: achados.map((a) => a.regra), corrigido: corrigir(achados, ler) };
}

describe('pl-verificar', () => {
  it('acusa o token que não existe, também como chave de estilo, e sugere o vizinho', () => {
    const { achados } = rodar({ 'src/App.tsx': `${ESTILOS}const s = { ['--pl-shell-height' as string]: '100%', color: 'var(--pl-color-txt)' };` });
    expect(achados.map((a) => [a.regra, a.linha])).toEqual([['token-inexistente', 3], ['token-inexistente', 3]]);
    expect(achados[0].mensagem).toContain('`--pl-shell-gap`');
    expect(achados[1].mensagem).toContain('use `--pl-color-text`');
  });

  it('troca o nome antigo pelo atual', () => {
    const { regras: r, corrigido } = rodar({ 'a.css': '.x { color: var(--pl-text-2); }' });
    expect(r).toEqual(['token-antigo']);
    expect(corrigido.get('a.css')).toBe('.x { color: var(--pl-color-text-secondary); }');
  });

  it('acusa cor fixa e troca a que tem token igual', () => {
    const { achados, corrigido } = rodar({ 'a.css': '.x { border: 1px solid #E9E9E9; background: #fafafa; color: white; }' });
    expect(achados.map((a) => a.regra)).toEqual(['cor-fixa', 'cor-fixa', 'cor-fixa']);
    expect(achados[1].mensagem).toContain('A mais próxima é `--pl-color-surface`');
    expect(corrigido.get('a.css')).toContain('1px solid var(--pl-color-border)');
  });

  it('só troca a cor quando o papel do token combina com a propriedade', () => {
    const { achados, corrigido } = rodar({ 'a.css': '.x { color: #ffffff; background: #ffffff; }' });
    expect(achados[0].mensagem).toContain('o papel desse token é outro');
    expect(achados[0].correcao).toBeUndefined();
    expect(corrigido.get('a.css')).toBe('.x { color: #ffffff; background: var(--pl-color-surface); }');
  });

  it('não confunde texto e dado com cor', () => {
    const { regras: r } = rodar({
      'src/App.tsx': `${ESTILOS}const aviso = 'Seu pedido #4821 saiu para entrega.';\nconst el = <ColorField label="Cor" defaultValue="#ff6600" />;\n// color: #fff`,
    });
    expect(r).toEqual([]);
  });

  it('acusa cor em estilo inline e em bloco de CSS numa template string', () => {
    const { regras: r } = rodar({ 'src/App.tsx': `${ESTILOS}const a = <div style={{ color: '#26282a' }} />;\nconst b = \`\n  color: #111;\n  padding: 16px;\n\`;` });
    expect(r).toEqual(['cor-fixa', 'cor-fixa', 'medida-fixa']);
  });

  it('tira a reserva depois de um token que existe, sem acusar o que há nela', () => {
    const { achados, corrigido } = rodar({
      'a.css': '.x { border-bottom: 1px solid var(--pl-color-border, #e2e2e2); padding: var(--pl-space-4 , 16px); box-shadow: var(--pl-sh-1, 0 1px 2px rgba(0,0,0,.1)); color: var(--pl-color-txt, #111); }',
    });
    expect(achados.map((a) => a.regra)).toEqual(['reserva-desnecessaria', 'reserva-desnecessaria', 'reserva-desnecessaria', 'token-inexistente', 'cor-fixa']);
    expect(achados[0].mensagem).toBe('reserva `#e2e2e2` em `var(--pl-color-border, …)`: o token sempre existe com os estilos da biblioteca, e a cor fixa nela não acompanha o tema escuro. Use `var(--pl-color-border)`.');
    expect(corrigido.get('a.css')).toBe('.x { border-bottom: 1px solid var(--pl-color-border); padding: var(--pl-space-4); box-shadow: var(--pl-sh-1); color: var(--pl-color-txt, #111); }');

    const inline = rodar({ 'src/App.tsx': `${ESTILOS}const a = <div style={{ borderBottom: '1px solid var(--pl-color-border, #e2e2e2)' }} />;` });
    expect(inline.regras).toEqual(['reserva-desnecessaria']);
    expect(inline.corrigido.get('src/App.tsx')).toContain("borderBottom: '1px solid var(--pl-color-border)'");
  });

  it('troca a medida que tem token igual e deixa a que não tem', () => {
    const { regras: r, corrigido } = rodar({ 'a.css': '.x { padding: 16px 13px; width: 16px; border-radius: 8px; }' });
    expect(r).toEqual(['medida-fixa', 'medida-fixa']);
    expect(corrigido.get('a.css')).toBe('.x { padding: var(--pl-space-4) 13px; width: 16px; border-radius: var(--pl-radius-md); }');
  });

  it('acusa sombra fixa e aceita a do token', () => {
    const { regras: r } = rodar({ 'a.css': '.x { box-shadow: 0 1px 2px rgba(0,0,0,.1); } .y { box-shadow: var(--pl-sh-1); } .z { box-shadow: none; }' });
    expect(r).toEqual(['sombra-fixa']);
  });

  it('acusa HTML cru onde há peça, com a peça pelo tipo do input', () => {
    const { achados } = rodar({
      'src/App.tsx': `${ESTILOS}export const A = () => (<form><button onClick={() => x > 1}>Ok</button><input type="checkbox" /><input type="hidden" /><table /></form>);`,
    });
    expect(achados.map((a) => a.mensagem.match(/use `(\w+)`/)[1])).toEqual(['Button', 'Checkbox', 'Table']);
  });

  it('acusa data em campo de texto e período com dois DatePicker', () => {
    const { regras: r } = rodar({
      'src/App.tsx': `${ESTILOS}const a = <InputText label="Data de nascimento" />;\nconst b = <><DatePicker label="Data inicial" /><DatePicker label="Data final" /></>;\nconst c = <><DatePicker label="Admissão" /></>;`,
    });
    expect(r).toEqual(['data-em-texto', 'periodo-com-dois-campos']);
  });

  it('acusa a peça descontinuada', () => {
    const { achados } = rodar({ 'src/App.tsx': `${ESTILOS}const a = <AppShell.Panel />;` });
    expect(achados[0].mensagem).toBe('`AppShell.Panel` foi descontinuado: use `Sidebar.Panel`.');
  });

  it('pede os estilos da biblioteca e acrescenta o reset que falta', () => {
    expect(rodar({ 'src/App.tsx': "import { Button } from '@plenustech/design-system';" }).regras).toEqual(['estilos-ausentes']);

    const { regras: r, corrigido } = rodar({ 'src/main.tsx': "import '@plenustech/design-system/styles.css';\nimport { Button } from '@plenustech/design-system';" });
    expect(r).toEqual(['reset-ausente']);
    expect(corrigido.get('src/main.tsx')).toBe("import '@plenustech/design-system/styles.css';\nimport '@plenustech/design-system/reset.css';\nimport { Button } from '@plenustech/design-system';");
  });

  it('não acusa o que está certo', () => {
    const { regras: r } = rodar({
      'src/main.tsx': ESTILOS,
      'src/App.tsx': "import { Button } from '@plenustech/design-system';\nexport const A = () => <Button style={{ padding: 'var(--pl-space-4)', color: 'var(--pl-color-text)' }}>Ok</Button>;",
      'src/a.css': '.x { gap: var(--pl-space-4); color: currentColor; background: transparent; }',
    });
    expect(r).toEqual([]);
  });
});
