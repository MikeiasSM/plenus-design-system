import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Button } from '../../actions/Button';
import { Dialog } from './Dialog';
import styles from './Dialog.module.css';

function Host({ dismissable = true }: { dismissable?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Abrir</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        dismissable={dismissable}
        title="Confirmar exclusao"
        description="Esta acao nao pode ser desfeita."
        footer={<Button onClick={() => setOpen(false)}>Cancelar</Button>}
      >
        Corpo do dialogo.
      </Dialog>
    </div>
  );
}

describe('Dialog', () => {
  it('nao renderiza nada enquanto esta fechado', () => {
    render(<Host />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('expoe nome e descricao acessiveis quando aberto', () => {
    render(<Host />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    const dialogo = screen.getByRole('dialog', { name: 'Confirmar exclusao' });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleDescription('Esta acao nao pode ser desfeita.');
  });

  it('fecha pelo Escape e devolve o foco a quem abriu', () => {
    render(<Host />);
    const abrir = screen.getByRole('button', { name: 'Abrir' });
    // Um clique real foca o botao; fireEvent nao, e o restoreFocus depende disso.
    abrir.focus();
    fireEvent.click(abrir);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('fecha pelo botao de fechar', () => {
    render(<Host />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('omite o botao de fechar e ignora o Escape quando nao e dispensavel', () => {
    render(<Host dismissable={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('esconde o restante da pagina da tecnologia assistiva', () => {
    render(<Host />);
    const abrir = screen.getByRole('button', { name: 'Abrir' });
    fireEvent.click(abrir);

    expect(abrir.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('leva id, data-* e classe ao elemento do dialogo', () => {
    render(
      <Dialog className="largo" data-origem="cadastro" id="dialogo-cadastro" open title="Cadastro" />,
    );

    const dialogo = screen.getByRole('dialog', { name: 'Cadastro' });

    expect(dialogo).toHaveAttribute('id', 'dialogo-cadastro');
    expect(dialogo).toHaveAttribute('data-origem', 'cadastro');
    expect(dialogo).toHaveClass('largo');
  });

  it('assume o papel de alerta na confirmacao que exige resposta', () => {
    render(
      <Dialog open role="alertdialog" title="Excluir documento">
        Esta acao nao pode ser desfeita.
      </Dialog>,
    );

    expect(screen.getByRole('alertdialog', { name: 'Excluir documento' })).toHaveAttribute('aria-modal', 'true');
  });

  it('desenha o icone so quando informado, fora da leitura', () => {
    const { rerender } = render(<Dialog open title="Nova secao" />);

    expect(document.querySelector(`.${styles.icon}`)).toBeNull();

    rerender(<Dialog icon={<svg data-testid="icone" />} open title="Nova secao" />);

    expect(screen.getByTestId('icone').closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('dialog', { name: 'Nova secao' })).toBeInTheDocument();
  });

  it('separa o cabecalho por linha so quando ha corpo embaixo dele', () => {
    const { rerender } = render(<Dialog open title="Publicar" />);

    expect(document.querySelector('header')).not.toHaveClass(styles.headerDivided!);

    rerender(
      <Dialog open title="Publicar">
        Corpo
      </Dialog>,
    );

    expect(document.querySelector('header')).toHaveClass(styles.headerDivided!);
  });

  it('controlado, avisa o fechamento mas so fecha quando o produto muda open', () => {
    const onOpenChange = vi.fn();
    render(<Dialog onOpenChange={onOpenChange} open title="Publicar" />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog', { name: 'Publicar' })).toBeInTheDocument();
  });

  it('sem controle, abre pelo defaultOpen e fecha sozinho', () => {
    render(<Dialog defaultOpen title="Publicar" />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ainda chama o obsoleto onClose ao fechar', () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} open title="Publicar" />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  describe('sem titulo', () => {
    it('toma o nome do aria-label e nao desenha cabecalho nem o botao de fechar', () => {
      render(
        <Dialog aria-label="Buscar no sistema" open>
          <input aria-label="Termo" />
        </Dialog>,
      );

      expect(screen.getByRole('dialog', { name: 'Buscar no sistema' })).not.toHaveAttribute('aria-labelledby');
      expect(document.querySelector('header')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();
    });

    it('fecha pelo Esc, que passa a ser a saida pelo teclado', () => {
      const onOpenChange = vi.fn();
      render(
        <Dialog aria-label="Buscar no sistema" onOpenChange={onOpenChange} open>
          <input aria-label="Termo" />
        </Dialog>,
      );

      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Termo' }), { key: 'Escape' });

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('exige o aria-label quando falta o titulo', () => {
      // @ts-expect-error sem titulo, o nome acessivel e obrigatorio
      const semNome = <Dialog open />;
      // @ts-expect-error titulo e aria-label nao se somam: o nome e um so
      const comOsDois = <Dialog aria-label="Busca" open title="Busca" />;

      expect([semNome, comOsDois]).toHaveLength(2);
    });
  });
});
