import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { ActivityFeed } from './ActivityFeed';

describe('ActivityFeed', () => {
  it('lista os itens numa lista ordenada, na ordem recebida', () => {
    render(
      <ActivityFeed aria-label="Atividade">
        <ActivityFeed.Item time="há 1 h">Segundo</ActivityFeed.Item>
        <ActivityFeed.Item time="ontem">Primeiro</ActivityFeed.Item>
      </ActivityFeed>,
    );

    const itens = screen.getAllByRole('listitem');

    expect(screen.getByRole('list', { name: 'Atividade' }).tagName).toBe('OL');
    expect(itens[0]).toHaveTextContent('Segundo');
    expect(itens[1]).toHaveTextContent('Primeiro');
  });

  it('mostra o momento em time quando ha dateTime e em texto simples quando nao ha', () => {
    render(
      <ActivityFeed>
        <ActivityFeed.Item dateTime="2026-11-09T10:00" time="há 12 min">A</ActivityFeed.Item>
        <ActivityFeed.Item time="ontem">B</ActivityFeed.Item>
      </ActivityFeed>,
    );

    expect(screen.getByText('há 12 min').tagName).toBe('TIME');
    expect(screen.getByText('há 12 min')).toHaveAttribute('datetime', '2026-11-09T10:00');
    expect(screen.getByText('ontem').tagName).toBe('SPAN');
  });

  it('cita o comentario e marca o item que o tem', () => {
    render(
      <ActivityFeed>
        <ActivityFeed.Item comment="Pode liberar." time="há 1 h">Com comentário</ActivityFeed.Item>
        <ActivityFeed.Item time="ontem">Sem comentário</ActivityFeed.Item>
      </ActivityFeed>,
    );

    const [comComentario, semComentario] = screen.getAllByRole('listitem');

    expect(comComentario.querySelector('blockquote')).toHaveTextContent('Pode liberar.');
    expect(comComentario).toHaveAttribute('data-comment');
    expect(semComentario).not.toHaveAttribute('data-comment');
    expect(semComentario.querySelector('blockquote')).toBeNull();
  });

  it('esconde o marcador do leitor de tela', () => {
    render(
      <ActivityFeed>
        <ActivityFeed.Item time="ontem">A</ActivityFeed.Item>
      </ActivityFeed>,
    );

    expect(screen.getByRole('listitem').querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('repassa ref, className e propriedades nativas ao ol e ao li', () => {
    const listRef = createRef<HTMLOListElement>();
    const itemRef = createRef<HTMLLIElement>();

    render(
      <ActivityFeed className="externa" data-teste="lista" ref={listRef}>
        <ActivityFeed.Item className="interna" data-teste="item" ref={itemRef} time="ontem">A</ActivityFeed.Item>
      </ActivityFeed>,
    );

    expect(listRef.current).toBe(screen.getByRole('list'));
    expect(listRef.current).toHaveClass('externa');
    expect(listRef.current).toHaveAttribute('data-teste', 'lista');
    expect(itemRef.current).toBe(screen.getByRole('listitem'));
    expect(itemRef.current).toHaveClass('interna');
    expect(itemRef.current).toHaveAttribute('data-teste', 'item');
  });
});
