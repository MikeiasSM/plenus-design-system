import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { regrasDaFolha } from '../../../test/folha';
import { DescriptionList } from './DescriptionList';

describe('DescriptionList', () => {
  it('rende cada par como div com dt e dd dentro de uma dl', () => {
    const { container } = render(
      <DescriptionList>
        <DescriptionList.Item term="Cliente">Ana Prado</DescriptionList.Item>
        <DescriptionList.Item term="Entrega">12/11</DescriptionList.Item>
      </DescriptionList>,
    );

    const lista = container.querySelector('dl');
    expect(lista).not.toBeNull();
    const pares = Array.from(lista!.children);
    expect(pares).toHaveLength(2);
    pares.forEach((par) => {
      expect(par.tagName).toBe('DIV');
      expect(par.children[0].tagName).toBe('DT');
      expect(par.children[1].tagName).toBe('DD');
    });
    expect(screen.getByText('Cliente').tagName).toBe('DT');
    expect(screen.getByText('Ana Prado').tagName).toBe('DD');
  });

  it('usa stacked por padrao e guarda o layout so na raiz', () => {
    const { container, rerender } = render(
      <DescriptionList>
        <DescriptionList.Item term="Total">R$ 10</DescriptionList.Item>
      </DescriptionList>,
    );
    expect(container.querySelector('dl')).toHaveAttribute('data-layout', 'stacked');
    expect(container.querySelector('dl > div')).not.toHaveAttribute('data-layout');

    rerender(
      <DescriptionList layout="inline">
        <DescriptionList.Item term="Total">R$ 10</DescriptionList.Item>
      </DescriptionList>,
    );
    expect(container.querySelector('dl')).toHaveAttribute('data-layout', 'inline');
    expect(container.querySelector('dl > div')).not.toHaveAttribute('data-layout');
  });

  // O item não sabe o layout; quem o decide é o seletor a partir da raiz, só nos filhos diretos, para não vazar para
  // uma lista aninhada na descrição.
  it('leva o layout da raiz aos itens pelo CSS, sem vazar para lista aninhada', () => {
    const seletores = Array.from(regrasDaFolha('src/components/data-display/DescriptionList/DescriptionList.module.css').keys());

    expect(seletores).toContain(".root[data-layout='inline'] > .item");
    expect(seletores).toContain(".root[data-layout='stacked'] > .item > .term");
    expect(seletores).toContain(".root[data-layout='inline'] > .item > .description");
    expect(seletores.filter((seletor) => seletor.includes('.item[data-layout'))).toEqual([]);
  });

  it('marca o destaque so quando emphasis e verdadeiro', () => {
    const { container } = render(
      <DescriptionList layout="inline">
        <DescriptionList.Item term="Subtotal">R$ 8</DescriptionList.Item>
        <DescriptionList.Item emphasis term="Total">R$ 10</DescriptionList.Item>
      </DescriptionList>,
    );

    const pares = container.querySelectorAll('dl > div');
    expect(pares[0]).not.toHaveAttribute('data-emphasis');
    expect(pares[1]).toHaveAttribute('data-emphasis');
  });

  it('encaminha ref, className e propriedades nativas na lista e no item', () => {
    const listaRef = createRef<HTMLDListElement>();
    const itemRef = createRef<HTMLDivElement>();
    const { container } = render(
      <DescriptionList aria-label="Resumo" className="minha-lista" ref={listaRef}>
        <DescriptionList.Item className="meu-item" data-teste="item" ref={itemRef} term="Termo">
          Descrição
        </DescriptionList.Item>
      </DescriptionList>,
    );

    expect(listaRef.current).toBe(container.querySelector('dl'));
    expect(listaRef.current).toHaveClass('minha-lista');
    expect(listaRef.current).toHaveAttribute('aria-label', 'Resumo');
    expect(itemRef.current).toBe(container.querySelector('dl > div'));
    expect(itemRef.current).toHaveClass('meu-item');
    expect(itemRef.current).toHaveAttribute('data-teste', 'item');
  });
});
