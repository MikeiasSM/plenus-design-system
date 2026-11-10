import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';

describe('Text', () => {
  it('rende um span com o papel body e o tom padrão', () => {
    render(<Text>Conciliação</Text>);

    const texto = screen.getByText('Conciliação');
    expect(texto.tagName).toBe('SPAN');
    expect(texto).toHaveAttribute('data-variant', 'body');
    expect(texto).toHaveAttribute('data-tone', 'default');
    expect(texto).not.toHaveAttribute('data-truncate');
    expect(texto).not.toHaveAttribute('data-numeric');
  });

  it('entrega papel, tom, truncamento e algarismos tabulares ao elemento', () => {
    render(
      <Text numeric tone="tertiary" truncate variant="caption">
        R$ 1.200,00
      </Text>,
    );

    const texto = screen.getByText('R$ 1.200,00');
    expect(texto).toHaveAttribute('data-variant', 'caption');
    expect(texto).toHaveAttribute('data-tone', 'tertiary');
    expect(texto).toHaveAttribute('data-truncate', 'true');
    expect(texto).toHaveAttribute('data-numeric', 'true');
  });

  it('troca o elemento por as', () => {
    render(<Text as="p">Parágrafo</Text>);

    expect(screen.getByText('Parágrafo').tagName).toBe('P');
  });

  it('encaminha ref, className e propriedades nativas ao elemento', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Text className="meu-texto" data-teste="texto" id="t" ref={ref} title="Dica">
        Texto
      </Text>,
    );

    const texto = screen.getByText('Texto');
    expect(ref.current).toBe(texto);
    expect(texto).toHaveClass('meu-texto');
    expect(texto).toHaveAttribute('data-teste', 'texto');
    expect(texto).toHaveAttribute('id', 't');
    expect(texto).toHaveAttribute('title', 'Dica');
  });

  // O jsdom não aplica o CSS do módulo: a regra é conferida na folha. A margem lateral fica com o contexto, como a
  // margin-inline-start: auto que o Card.Footer dá ao filho único para levá-lo à direita.
  it('zera só a margem de bloco, sem tocar na lateral', () => {
    const folha = readFileSync(resolve(process.cwd(), 'src/components/typography/Text/Text.module.css'), 'utf8');
    const raiz = folha.slice(folha.indexOf('.root {'), folha.indexOf('}', folha.indexOf('.root {')));
    const declaracoes = raiz.replace(/\/\*[\s\S]*?\*\//g, '');

    expect(declaracoes).toMatch(/margin-block:\s*0;/);
    expect(declaracoes).not.toMatch(/margin(-inline(-start|-end)?|-left|-right)?\s*:/);
  });
});
