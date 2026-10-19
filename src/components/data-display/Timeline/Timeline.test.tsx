import { render, screen } from '@testing-library/react';
import { Timeline } from './Timeline';
import styles from './Timeline.module.css';

const items = [
  { date: '10/10/2026', key: 'rascunho', label: 'Rascunho' },
  { description: 'Com a revisora', key: 'revisao', label: 'Aguardando revisão' },
  { key: 'publicado', label: 'Publicado' },
];

describe('Timeline', () => {
  it('e uma lista ordenada nomeada que diz ao leitor de tela o estado de cada item', () => {
    render(<Timeline current="revisao" items={items} label="Fluxo de publicação" />);

    const [rascunho, revisao, publicado] = screen.getAllByRole('listitem');

    expect(screen.getByRole('list', { name: 'Fluxo de publicação' }).tagName).toBe('OL');
    expect(rascunho).toHaveTextContent('Rascunho, concluído');
    expect(rascunho).not.toHaveAttribute('aria-current');
    expect(revisao).toHaveAttribute('aria-current', 'step');
    expect(revisao).toHaveTextContent('Aguardando revisão, atual');
    expect(publicado).not.toHaveTextContent(/concluído|atual/);
  });

  it('sem estado atual conhecido, todos os itens ficam por vir', () => {
    render(<Timeline current="arquivado" items={items} label="Fluxo de publicação" />);

    expect(screen.queryByText(/concluído|atual/)).not.toBeInTheDocument();
    expect(document.querySelector('[aria-current]')).toBeNull();
  });

  it('fica no tamanho md por padrao e, com size="sm", compacta sem mudar a leitura', () => {
    const { rerender } = render(<Timeline current="revisao" items={items} label="Fluxo de publicação" />);
    const lista = screen.getByRole('list', { name: 'Fluxo de publicação' });
    expect(lista).not.toHaveClass(styles.sm!);

    rerender(<Timeline className="extra" current="revisao" items={items} label="Fluxo de publicação" size="sm" />);

    expect(lista).toHaveClass(styles.timeline!, styles.sm!, 'extra');
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('Aguardando revisão, atual');
  });
});
