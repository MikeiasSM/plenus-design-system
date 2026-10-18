import { fireEvent, render, screen } from '@testing-library/react';
import { Accordion, type AccordionItem } from './Accordion';
import styles from './Accordion.module.css';

const secoes: AccordionItem[] = [
  { key: 'envio', label: 'Envio', content: 'Regras de envio' },
  { key: 'pagamento', label: 'Pagamento', content: 'Formas de pagamento' },
  { key: 'antigo', label: 'Antigo', content: 'Indisponivel', disabled: true },
  { key: 'suporte', label: 'Suporte', content: 'Canais de suporte' },
];

describe('Accordion', () => {
  it('comeca recolhido e liga gatilho e regiao', () => {
    render(<Accordion items={secoes} />);

    const gatilho = screen.getByRole('button', { name: /Envio/ });
    expect(gatilho).toHaveAttribute('aria-expanded', 'false');

    const regiao = document.getElementById(gatilho.getAttribute('aria-controls') ?? '');
    expect(regiao).toHaveAttribute('aria-labelledby', gatilho.id);
    expect(regiao).not.toBeVisible();
  });

  it('abre ao clicar e mostra o conteudo', () => {
    render(<Accordion items={secoes} />);
    fireEvent.click(screen.getByRole('button', { name: /Envio/ }));

    expect(screen.getByRole('button', { name: /Envio/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Regras de envio')).toBeVisible();
  });

  it('mantem apenas uma secao aberta por padrao', () => {
    render(<Accordion items={secoes} defaultExpandedKeys={['envio']} />);
    fireEvent.click(screen.getByRole('button', { name: /Pagamento/ }));

    expect(screen.getByRole('button', { name: /Envio/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /Pagamento/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('permite varias secoes abertas quando configurado', () => {
    render(<Accordion items={secoes} multiple defaultExpandedKeys={['envio']} />);
    fireEvent.click(screen.getByRole('button', { name: /Pagamento/ }));

    expect(screen.getByRole('button', { name: /Envio/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Pagamento/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('navega entre cabecalhos com as setas, pulando desabilitados', () => {
    render(<Accordion items={secoes} />);
    const envio = screen.getByRole('button', { name: /Envio/ });

    envio.focus();
    fireEvent.keyDown(envio, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: /Pagamento/ })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('button', { name: /Pagamento/ }), { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: /Suporte/ })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('button', { name: /Suporte/ }), { key: 'Home' });
    expect(envio).toHaveFocus();
  });

  it('o chevron aponta para baixo fechado e gira para cima aberto', () => {
    render(<Accordion items={secoes} />);
    const gatilho = screen.getByRole('button', { name: /Envio/ });
    const chevron = () => gatilho.querySelector('svg');

    expect(chevron()).not.toHaveClass(styles.iconOpen!);

    fireEvent.click(gatilho);

    expect(chevron()).toHaveClass(styles.iconOpen!);
  });

  it('aceita o icone a esquerda da pergunta', () => {
    const { container } = render(<Accordion items={secoes} iconPosition="left" />);

    expect(container.querySelector('[class*="iconLeft"]')).not.toBeNull();
  });

  it('dispensa o divisor quando pedido', () => {
    const { container } = render(<Accordion items={secoes} divider={false} />);

    expect(container.querySelector('[class*="divided"]')).toBeNull();
  });

  it('reporta as secoes abertas ao produto', () => {
    const onExpandedChange = vi.fn();
    render(<Accordion items={secoes} multiple onExpandedChange={onExpandedChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));

    expect(onExpandedChange).toHaveBeenCalledWith(['suporte']);
  });

  it('fecha a secao aberta quando ela e clicada de novo, em modo unico', () => {
    render(<Accordion items={secoes} />);

    const gatilho = screen.getAllByRole('button')[0];

    fireEvent.click(gatilho);
    expect(gatilho).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(gatilho);
    expect(gatilho).toHaveAttribute('aria-expanded', 'false');
  });
});
