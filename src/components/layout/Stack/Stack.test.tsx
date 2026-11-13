import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { regrasDaFolha } from '../../../test/folha';
import { Stack } from './Stack';

describe('Stack', () => {
  it('empilha os filhos na vertical, com espaco 4, por padrao', () => {
    render(
      <Stack data-testid="pilha">
        <span>Um</span>
        <span>Dois</span>
      </Stack>,
    );

    const pilha = screen.getByTestId('pilha');
    expect(pilha.tagName).toBe('DIV');
    expect(pilha).toHaveAttribute('data-direction', 'vertical');
    expect(pilha).toHaveAttribute('data-gap', '4');
    expect(pilha).not.toHaveAttribute('data-wrap');
    expect(screen.getByText('Um')).toBeInTheDocument();
    expect(screen.getByText('Dois')).toBeInTheDocument();
  });

  it('expoe direcao, espaco, alinhamento, distribuicao e quebra', () => {
    render(<Stack align="center" data-testid="pilha" direction="horizontal" gap={2} justify="between" wrap />);

    const pilha = screen.getByTestId('pilha');
    expect(pilha).toHaveAttribute('data-direction', 'horizontal');
    expect(pilha).toHaveAttribute('data-gap', '2');
    expect(pilha).toHaveAttribute('data-align', 'center');
    expect(pilha).toHaveAttribute('data-justify', 'between');
    expect(pilha).toHaveAttribute('data-wrap');
  });

  it('troca o elemento pela propriedade as', () => {
    render(
      <Stack as="ul" aria-label="Itens">
        <li>Item</li>
      </Stack>,
    );

    expect(screen.getByRole('list', { name: 'Itens' }).tagName).toBe('UL');
  });

  it('entrega propriedades nativas, className e ref a raiz', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Stack className="extra" data-testid="pilha" id="minha" ref={ref} />);

    const pilha = screen.getByTestId('pilha');
    expect(pilha).toHaveClass('extra');
    expect(pilha).toHaveAttribute('id', 'minha');
    expect(ref.current).toBe(pilha);
  });

  describe('na folha de estilo', () => {
    const regras = regrasDaFolha('src/components/layout/Stack/Stack.module.css');

    it('empilha na vertical com o espaco 4 sem atributo nenhum', () => {
      expect(regras.get('.root')).toEqual({ display: 'flex', 'flex-direction': 'column', gap: 'var(--pl-space-4)' });
    });

    it('tem uma regra para cada direcao, espaco, alinhamento, distribuicao e quebra', () => {
      expect(regras.get(".root[data-direction='horizontal']")).toEqual({ 'flex-direction': 'row' });
      expect(regras.get('.root[data-wrap]')).toEqual({ 'flex-wrap': 'wrap' });
      [1, 2, 3, 5, 6, 7].forEach((passo) => expect(regras.get(`.root[data-gap='${passo}']`)).toEqual({ gap: `var(--pl-space-${passo})` }));
      Object.entries({ start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline' }).forEach(
        ([valor, css]) => expect(regras.get(`.root[data-align='${valor}']`)).toEqual({ 'align-items': css }),
      );
      Object.entries({ start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' }).forEach(([valor, css]) =>
        expect(regras.get(`.root[data-justify='${valor}']`)).toEqual({ 'justify-content': css }),
      );
    });

    // Sem especificidade, para a largura minima que o proprio filho declara, como a do ButtonTile, vencer.
    it('deixa os filhos encolherem abaixo do conteudo, sem estouro', () => {
      expect(regras.get(':where(.root > *)')).toEqual({ 'min-width': '0' });
    });
  });
});
