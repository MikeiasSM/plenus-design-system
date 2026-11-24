import { fireEvent, render, screen, within } from '@testing-library/react';
import { AvatarGroup } from './AvatarGroup';
import styles from './AvatarGroup.module.css';

const PESSOAS = [
  { name: 'Ana Souza', src: '/ana.jpg' },
  { name: 'Bruno Lima' },
  { name: 'Carla Dias', initials: 'CD' },
  { name: 'Diego Ramos' },
  { name: 'Elisa Moura' },
  { name: 'Fábio Nunes' },
  { name: 'Gabriela Reis' },
];

describe('AvatarGroup', () => {
  it('e um grupo com o nome e o total de pessoas', () => {
    render(<AvatarGroup label="Responsáveis" people={PESSOAS} />);

    expect(screen.getByRole('group', { name: 'Responsáveis, 7 pessoas' })).toBeInTheDocument();
  });

  it('usa o singular com uma pessoa', () => {
    render(<AvatarGroup label="Responsáveis" people={[{ name: 'Ana Souza' }]} />);

    expect(screen.getByRole('group', { name: 'Responsáveis, 1 pessoa' })).toBeInTheDocument();
  });

  it('sem max, mostra todos, na ordem da lista, cada um com o proprio nome', () => {
    render(<AvatarGroup label="Responsáveis" people={PESSOAS} />);

    const nomes = within(screen.getByRole('group')).getAllByRole('img').map((avatar) => avatar.getAttribute('aria-label') ?? avatar.getAttribute('alt'));
    expect(nomes).toEqual(PESSOAS.map((pessoa) => pessoa.name));
  });

  it('repassa foto e iniciais ao Avatar', () => {
    render(<AvatarGroup label="Responsáveis" people={PESSOAS} />);

    expect(screen.getByRole('img', { name: 'Ana Souza' })).toHaveAttribute('src', '/ana.jpg');
    expect(screen.getByRole('img', { name: 'Carla Dias' })).toHaveTextContent('CD');
  });

  it('max conta o "+N": com 4 e sete pessoas, tres avatares e "+4"', () => {
    render(<AvatarGroup label="Responsáveis" max={4} people={PESSOAS} />);

    const grupo = screen.getByRole('group');
    const imagens = within(grupo).getAllByRole('img');
    expect(imagens).toHaveLength(4);
    expect(imagens.slice(0, 3).map((avatar) => avatar.getAttribute('aria-label') ?? avatar.getAttribute('alt'))).toEqual([
      'Ana Souza',
      'Bruno Lima',
      'Carla Dias',
    ]);
    expect(within(grupo).getByRole('img', { name: 'e mais 4' })).toHaveTextContent('+4');
  });

  it('sem passar de max, nao ha "+N"', () => {
    render(<AvatarGroup label="Responsáveis" max={7} people={PESSOAS} />);

    expect(screen.getAllByRole('img')).toHaveLength(7);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('sem overflow, o "+N" e texto, fora da ordem do Tab', () => {
    render(<AvatarGroup label="Visualizaram" max={3} people={PESSOAS} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'e mais 5' })).not.toHaveAttribute('tabindex');
  });

  it('com overflow="popover", o "+N" e um botao que abre a lista dos que nao couberam', () => {
    render(<AvatarGroup label="Responsáveis" max={4} overflow="popover" people={PESSOAS} />);

    const botao = screen.getByRole('button', { name: 'Ver mais 4 pessoas' });
    expect(botao).toHaveAttribute('aria-haspopup', 'dialog');
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(botao).toHaveTextContent('+4');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(botao);

    const painel = screen.getByRole('dialog', { name: 'Mais 4 pessoas' });
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(botao).toHaveAttribute('aria-controls', painel.id);
    const itens = within(painel).getAllByRole('listitem');
    expect(itens.map((item) => item.textContent)).toEqual(['DRDiego Ramos', 'EMElisa Moura', 'FNFábio Nunes', 'GRGabriela Reis']);
    // O nome ja esta escrito ao lado: o avatar da lista e decorativo.
    expect(within(painel).queryByRole('img')).not.toBeInTheDocument();
  });

  it('o foco entra no painel e o Esc o fecha, devolvendo o foco ao botao', () => {
    render(<AvatarGroup label="Responsáveis" max={4} overflow="popover" people={PESSOAS} />);

    const botao = screen.getByRole('button', { name: 'Ver mais 4 pessoas' });
    botao.focus();
    fireEvent.click(botao);

    const painel = screen.getByRole('dialog');
    expect(painel).toHaveFocus();

    fireEvent.keyDown(painel, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(botao).toHaveFocus();
  });

  it('fechado por um clique fora, nao puxa o foco de volta ao botao', () => {
    render(
      <>
        <AvatarGroup label="Responsáveis" max={4} overflow="popover" people={PESSOAS} />
        <input aria-label="Busca" />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver mais 4 pessoas' }));
    const busca = screen.getByRole('textbox', { name: 'Busca' });
    fireEvent.mouseDown(busca, { detail: 1 });
    busca.focus();
    fireEvent.mouseUp(busca, { detail: 1 });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(busca).toHaveFocus();
  });

  it('clicar de novo no botao fecha o painel', () => {
    render(<AvatarGroup label="Responsáveis" max={4} overflow="popover" people={PESSOAS} />);

    const botao = screen.getByRole('button', { name: 'Ver mais 4 pessoas' });
    fireEvent.click(botao);
    fireEvent.click(botao);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('labels troca os textos, com a quantidade', () => {
    render(
      <AvatarGroup
        label="Viewers"
        labels={{
          count: (total) => `${total} people`,
          list: (hidden) => `${hidden} more people`,
          showMore: (hidden) => `Show ${hidden} more`,
        }}
        max={4}
        overflow="popover"
        people={PESSOAS}
      />,
    );

    expect(screen.getByRole('group', { name: 'Viewers, 7 people' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show 4 more' }));
    expect(screen.getByRole('dialog', { name: '4 more people' })).toBeInTheDocument();
  });

  it('max de 1 mostra so o "+N"', () => {
    render(<AvatarGroup label="Responsáveis" max={1} people={PESSOAS} />);

    expect(within(screen.getByRole('group')).getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'e mais 7' })).toBeInTheDocument();
  });

  it('aplica o tamanho ao grupo, aos avatares e ao "+N"', () => {
    render(<AvatarGroup label="Responsáveis" max={3} people={PESSOAS} size="lg" />);

    expect(screen.getByRole('group')).toHaveClass(styles.lg!);
    expect(screen.getByRole('img', { name: 'Bruno Lima' }).className).toContain('_lg_');
    expect(screen.getByRole('img', { name: 'e mais 5' })).toHaveClass(styles.lg!);
  });

  it('repassa className e atributos a raiz', () => {
    render(<AvatarGroup className="extra" data-teste="sim" label="Responsáveis" people={PESSOAS} />);

    const grupo = screen.getByRole('group');
    expect(grupo).toHaveClass('extra');
    expect(grupo).toHaveAttribute('data-teste', 'sim');
  });
});
