import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { regrasDaFolha } from '../../../test/folha';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('associates its label with the native control', () => {
    render(<Checkbox label="Aceito os termos" />);

    const caixa = screen.getByRole('checkbox', { name: 'Aceito os termos' });
    fireEvent.click(caixa);

    expect(caixa).toBeChecked();
  });

  it('exposes the indeterminate state on the DOM node', () => {
    render(<Checkbox label="Selecionar todos" indeterminate />);

    const caixa = screen.getByRole('checkbox', { name: 'Selecionar todos' }) as HTMLInputElement;
    expect(caixa.indeterminate).toBe(true);
  });

  it('describes hints and marks errors accessibly', () => {
    const { rerender } = render(<Checkbox label="Receber avisos" hint="Enviamos no maximo um por semana." />);
    expect(screen.getByRole('checkbox', { name: 'Receber avisos' })).toHaveAccessibleDescription('Enviamos no maximo um por semana.');

    rerender(<Checkbox label="Receber avisos" error="Campo obrigatorio." />);
    const caixa = screen.getByRole('checkbox', { name: 'Receber avisos' });
    expect(caixa).toHaveAttribute('aria-invalid', 'true');
    expect(caixa).toHaveAccessibleDescription('Campo obrigatorio.');
  });

  it('keeps the invalid state the consumer declares', () => {
    render(<Checkbox aria-invalid label="Aceito os termos" />);

    expect(screen.getByRole('checkbox', { name: 'Aceito os termos' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('takes its name from aria-label when there is no visible label', () => {
    render(<Checkbox aria-label="Administrador: publicar" />);

    expect(screen.getByRole('checkbox', { name: 'Administrador: publicar' })).toBeInTheDocument();
  });

  it('announces the error that appears after the first render', () => {
    const { rerender } = render(<Checkbox label="Terms" />);

    rerender(<Checkbox error="Required." label="Terms" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Required.');
  });
  it('reports the checked state through onCheckedChange alongside the native onChange', () => {
    const onChange = vi.fn();
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Recorrente" onChange={onChange} onCheckedChange={onCheckedChange} />);

    fireEvent.click(screen.getByLabelText('Recorrente'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe('Checkbox: estilo da marca', () => {
  const caminho = 'src/components/forms/Checkbox/Checkbox.module.css';
  const regras = regrasDaFolha(caminho);

  it('pinta o visto e o traco na cor do texto sobre o primario, e nao em branco fixo', () => {
    const folha = readFileSync(resolve(process.cwd(), caminho), 'utf8');

    expect(folha).not.toContain("stroke='white'");
    expect(folha).toMatch(/\.input:checked::before \{\s*mask-image: url\("data:image\/svg\+xml[^"]*M5 13l4 4L19 7/);
    expect(folha).toMatch(/\.input:indeterminate::before \{\s*mask-image: url\("data:image\/svg\+xml[^"]*M6 12h12/);
    expect(regras.get('.input:checked::before, .input:indeterminate::before')).toMatchObject({
      'background-color': 'var(--pl-color-on-primary)',
      content: "''",
    });
    expect(regras.get('.input')?.position).toBe('relative');
  });

  it('desabilitada, so a caixa desmarcada perde o primario', () => {
    expect(regras.get('.input:disabled')).not.toHaveProperty('background-color');
    expect(regras.get('.input:disabled:not(:checked):not(:indeterminate)')).toMatchObject({
      'background-color': 'var(--pl-color-surface-muted)',
    });
  });
});
