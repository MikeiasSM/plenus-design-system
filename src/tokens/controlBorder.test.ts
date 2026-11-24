import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrast } from '../utils/palette/color';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

// Os controles que o roadmap 0.8.0, item 1, passa para a borda de 3:1.
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
  'src/components/forms/FileUpload/FileUpload.module.css',
  'src/components/forms/Field/Field.module.css',
  'src/components/data-display/List/List.module.css',
];

describe('--pl-control-border', () => {
  const color = read('src/tokens/semantic/color.css');
  const values = [...color.matchAll(/--pl-control-border:\s*(#[0-9A-F]{6});/gi)].map((match) => match[1]);

  it('is declared in the light theme and in both dark blocks', () => {
    expect(values).toHaveLength(3);
  });

  it('reaches 3:1 on the surface and on the page, in both themes', () => {
    const [light, dark] = values;

    expect(contrast(light, '#FFFFFF')).toBeGreaterThanOrEqual(3);
    expect(contrast(light, '#F6F7F8')).toBeGreaterThanOrEqual(3);
    expect(contrast(dark, '#1B1D20')).toBeGreaterThanOrEqual(3);
    expect(contrast(dark, '#141517')).toBeGreaterThanOrEqual(3);
  });

  it('is the border of every control on the list, and the hover derives from it', () => {
    for (const path of CONTROLS) {
      expect(read(path)).toContain('var(--pl-control-border)');
    }

    expect(read('src/tokens/semantic/control.css')).toContain('50%, var(--pl-control-border))');
  });

  it('leaves the field border out of the accepted exceptions', () => {
    expect(read('scripts/contraste-tokens.mjs')).not.toContain('|--pl-color-border-strong|--pl-color-surface');
  });
});
