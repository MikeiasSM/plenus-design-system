import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { regrasDaFolha } from '../../../test/folha';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('rende um span que continua na árvore de acessibilidade', () => {
    render(
      <button type="button">
        <VisuallyHidden>Excluir lançamento</VisuallyHidden>
      </button>,
    );

    expect(screen.getByText('Excluir lançamento').tagName).toBe('SPAN');
    expect(screen.getByRole('button', { name: 'Excluir lançamento' })).toBeInTheDocument();
  });

  it('troca o elemento por as', () => {
    render(<VisuallyHidden as="div">Aviso</VisuallyHidden>);

    expect(screen.getByText('Aviso').tagName).toBe('DIV');
  });

  it('encaminha ref, className e propriedades nativas ao elemento', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <VisuallyHidden className="oculto" data-teste="v" id="x" ref={ref}>
        Texto
      </VisuallyHidden>,
    );

    const elemento = screen.getByText('Texto');
    expect(ref.current).toBe(elemento);
    expect(elemento).toHaveClass('oculto');
    expect(elemento).toHaveAttribute('data-teste', 'v');
    expect(elemento).toHaveAttribute('id', 'x');
  });

  // A regra inteira, declaração a declaração: a união da do useVisuallyHidden do React Aria com a do VisuallyHidden do Radix.
  it('tira o conteúdo da vista com a regra completa do React Aria e do Radix', () => {
    const raiz = regrasDaFolha('src/components/typography/VisuallyHidden/VisuallyHidden.module.css').get('.root');

    expect(raiz).toEqual({
      border: '0',
      clip: 'rect(0 0 0 0)',
      'clip-path': 'inset(50%)',
      height: '1px',
      margin: '-1px',
      overflow: 'hidden',
      'overflow-wrap': 'normal',
      padding: '0',
      position: 'absolute',
      'white-space': 'nowrap',
      width: '1px',
    });
  });
});
