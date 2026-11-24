import { act, fireEvent, render, screen } from '@testing-library/react';
import { Drawer } from './Drawer';
import styles from './Drawer.module.css';

describe('Drawer', () => {
  it('e um dialogo modal nomeado pelo titulo, com corpo e rodape', () => {
    render(
      <Drawer description="Ajuste quem ve o painel." footer={<button type="button">Salvar</button>} open title="Acesso">
        Corpo da gaveta.
      </Drawer>,
    );

    const gaveta = screen.getByRole('dialog', { name: 'Acesso' });
    expect(gaveta).toHaveAttribute('aria-modal', 'true');
    expect(gaveta).toHaveAccessibleDescription('Ajuste quem ve o painel.');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('fecha pelo Escape e pelo botao de fechar', () => {
    const onOpenChange = vi.fn();
    render(<Drawer onOpenChange={onOpenChange} open title="Acesso" />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onOpenChange.mock.calls).toEqual([[false], [false]]);
  });

  it('sem controle, abre pelo defaultOpen e fecha sozinho', () => {
    const onOpenChange = vi.fn();
    render(<Drawer defaultOpen onOpenChange={onOpenChange} title="Acesso" />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('onBeforeClose impede o fechamento', () => {
    const onBeforeClose = vi.fn(() => false);
    render(<Drawer defaultOpen onBeforeClose={onBeforeClose} title="Filtros" />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onBeforeClose).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('a resposta antiga de onBeforeClose não fecha o Drawer reaberto', async () => {
    let responder: (permitir: boolean) => void = () => {};
    const onBeforeClose = vi.fn(() => new Promise<boolean>((resolve) => (responder = resolve)));
    const { rerender } = render(<Drawer onBeforeClose={onBeforeClose} open title="Filtros" />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    const antiga = responder;
    rerender(<Drawer onBeforeClose={onBeforeClose} open={false} title="Filtros" />);
    rerender(<Drawer onBeforeClose={onBeforeClose} open title="Filtros" />);
    await act(async () => antiga(true));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sai do lado pedido, a direita por padrao', () => {
    const { rerender } = render(<Drawer open title="Acesso" />);
    expect(screen.getByRole('dialog').parentElement).toHaveClass(styles.right!);

    rerender(<Drawer open side="left" title="Acesso" />);
    expect(screen.getByRole('dialog').parentElement).toHaveClass(styles.left!);
  });

  it('sem titulo, toma o nome do aria-label, sem cabecalho nem botao de fechar, e o Esc fecha', () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer aria-label="Menu" onOpenChange={onOpenChange} open>
        <button type="button">Item</button>
      </Drawer>,
    );

    expect(screen.getByRole('dialog', { name: 'Menu' })).not.toHaveAttribute('aria-labelledby');
    expect(document.querySelector('header')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Item' }), { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('exige o aria-label quando falta o titulo', () => {
    // @ts-expect-error sem titulo, o nome acessivel e obrigatorio
    render(<Drawer open />);
  });

  it('com flush, o corpo perde o respiro interno', () => {
    const { rerender } = render(<Drawer open title="Acesso">Corpo</Drawer>);
    expect(screen.getByText('Corpo').className).toContain('body');
    expect(screen.getByText('Corpo').className).not.toContain('bodyFlush');

    rerender(<Drawer flush open title="Acesso">Corpo</Drawer>);
    expect(screen.getByText('Corpo').className).toContain('bodyFlush');
  });

  it('com description, soma o aria-describedby do produto ao da descricao', () => {
    const { rerender } = render(
      <Drawer aria-describedby="nota" description="Ajuste quem ve o painel." open title="Acesso">
        Corpo
      </Drawer>,
    );

    const descricao = screen.getByText('Ajuste quem ve o painel.');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', `${descricao.id} nota`);

    rerender(
      <Drawer aria-describedby="nota" open title="Acesso">
        Corpo
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'nota');
  });

  it('soma o onKeyDown e o onFocus do produto aos da gaveta, e o Esc continua fechando', () => {
    const onKeyDown = vi.fn();
    const onFocus = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Drawer onFocus={onFocus} onKeyDown={onKeyDown} onOpenChange={onOpenChange} open title="Filtros">
        <input aria-label="Nome" />
      </Drawer>,
    );
    const campo = screen.getByRole('textbox', { name: 'Nome' });

    fireEvent.focus(campo);
    fireEvent.keyDown(campo, { key: 'Escape' });

    expect(onFocus).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('aceita titulo e descricao como no, sem perder o nome nem a descricao', () => {
    render(<Drawer description={<>Ajuste <strong>quem</strong> ve.</>} open title={<>Acesso de <em>Ana</em></>} />);

    expect(screen.getByRole('dialog', { name: 'Acesso de Ana' })).toHaveAccessibleDescription('Ajuste quem ve.');
  });

  it('na base, sobe da borda de baixo e continua um dialogo modal que fecha pelo botao', () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer onOpenChange={onOpenChange} open side="bottom" size="lg" title="Pizza Calabresa Grande">
        Detalhe do item.
      </Drawer>,
    );

    const painel = screen.getByRole('dialog', { name: 'Pizza Calabresa Grande' });
    expect(painel).toHaveAttribute('aria-modal', 'true');
    expect(painel).toHaveClass(styles.lg!);
    expect(painel.parentElement).toHaveClass(styles.bottom!);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('na base, sem title, e nomeado pelo aria-label e nao desenha o botao Fechar', () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer
        aria-label="Detalhe do Produto A"
        footer={<button type="button" onClick={() => onOpenChange(false)}>Fechar detalhe</button>}
        onOpenChange={onOpenChange}
        open
        side="bottom"
      >
        Detalhe do item.
      </Drawer>,
    );

    const painel = screen.getByRole('dialog', { name: 'Detalhe do Produto A' });
    expect(painel).toHaveAttribute('aria-modal', 'true');
    expect(painel.parentElement).toHaveClass(styles.bottom!);
    // Sem title nao ha cabecalho: a saida que o leitor de tela alcanca e o botao que o produto pos.
    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar detalhe' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('na base, o rodape leva a classe que estende o fundo dele pela area segura', () => {
    render(
      <Drawer footer={<button type="button">Salvar</button>} open side="bottom" title="Relatório mensal">
        Corpo.
      </Drawer>,
    );

    expect(screen.getByRole('button', { name: 'Salvar' }).parentElement).toHaveClass(styles.footer!);
  });
});
