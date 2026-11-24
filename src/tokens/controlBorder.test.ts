import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

// Os controles que usam a borda de 3:1. O contraste em si é medido pelo laudo (`npm run check:contraste`), que resolve
// as cores dos dois temas e das paletas; aqui só se garante que cada peça usa o token e que o laudo mede o par.
const CONTROLS = [
  'src/components/forms/InputText/InputText.module.css',
  'src/components/forms/Textarea/Textarea.module.css',
  'src/components/forms/Select/Select.module.css',
  'src/components/forms/ComboBox/ComboBox.module.css',
  'src/components/forms/DatePicker/DatePicker.module.css',
  'src/components/forms/TimePicker/TimePicker.module.css',
  'src/components/forms/InputPassword/InputPassword.module.css',
  'src/components/forms/Checkbox/Checkbox.module.css',
  'src/components/forms/RadioGroup/RadioGroup.module.css',
  'src/components/forms/Switch/Switch.module.css',
  'src/components/forms/FileUpload/FileUpload.module.css',
  'src/components/forms/Field/Field.module.css',
  'src/components/forms/PinInput/PinInput.module.css',
  'src/components/data-display/List/List.module.css',
];

describe('--pl-control-border', () => {
  it('é a borda de cada controle da lista, e o hover deriva dele', () => {
    for (const path of CONTROLS) {
      expect(read(path), path).toContain('var(--pl-control-border)');
    }

    expect(read('src/tokens/semantic/control.css')).toContain('50%, var(--pl-control-border))');
  });

  it('o cartão do RadioGroup e o trilho do Switch desligado não ficam na borda clara', () => {
    expect(read('src/components/forms/RadioGroup/RadioGroup.module.css')).not.toContain('border: 1px solid var(--pl-color-border-strong)');
    expect(read('src/components/forms/Switch/Switch.module.css')).not.toContain('var(--pl-color-border-strong)');
  });

  it('o laudo de contraste mede a borda na superfície e na página, sem exceção', () => {
    const laudo = read('scripts/contraste-tokens.mjs');

    expect(laudo).toContain("['--pl-control-border', '--pl-color-surface', CONTROLE_MINIMO,");
    expect(laudo).toContain("['--pl-control-border', '--pl-color-background', CONTROLE_MINIMO,");
    expect(laudo).not.toContain('|--pl-control-border|');
    expect(laudo).not.toContain('|--pl-color-border-strong|--pl-color-surface');
  });
});
