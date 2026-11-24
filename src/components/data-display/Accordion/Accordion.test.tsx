import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
    const onExpandedKeysChange = vi.fn();
    render(<Accordion items={secoes} multiple onExpandedKeysChange={onExpandedKeysChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));

    expect(onExpandedKeysChange).toHaveBeenCalledWith(['suporte']);
  });

  it('abre pelo defaultExpandedKeys e, controlado, so muda quando o produto muda expandedKeys', () => {
    const { rerender } = render(<Accordion defaultExpandedKeys={['envio']} items={secoes} />);
    expect(screen.getByRole('button', { name: /Envio/ })).toHaveAttribute('aria-expanded', 'true');

    const onExpandedKeysChange = vi.fn();
    rerender(<Accordion expandedKeys={['pagamento']} items={secoes} onExpandedKeysChange={onExpandedKeysChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));

    expect(onExpandedKeysChange).toHaveBeenCalledWith(['suporte']);
    expect(screen.getByRole('button', { name: /Pagamento/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('fecha a secao aberta quando ela e clicada de novo, em modo unico', () => {
    render(<Accordion items={secoes} />);

    const gatilho = screen.getAllByRole('button')[0];

    fireEvent.click(gatilho);
    expect(gatilho).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(gatilho);
    expect(gatilho).toHaveAttribute('aria-expanded', 'false');
  });

  it('usa o nivel de titulo pedido e o id de ancora no cabecalho', () => {
    render(<Accordion headingLevel={2} items={[{ ...secoes[0], id: 'regras-de-envio' }, secoes[1]]} />);

    const titulo = screen.getByRole('heading', { level: 2, name: 'Envio' });
    expect(titulo).toHaveAttribute('id', 'regras-de-envio');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
  });

  it('deixa o painel fechado na busca da pagina, e abre a secao quando a busca o encontra', () => {
    render(<Accordion items={secoes} />);
    const painel = document.getElementById(screen.getByRole('button', { name: 'Pagamento' }).getAttribute('aria-controls')!)!;

    expect(painel).toHaveAttribute('hidden', 'until-found');

    fireEvent(painel, new Event('beforematch'));

    expect(screen.getByRole('button', { name: 'Pagamento' })).toHaveAttribute('aria-expanded', 'true');
    expect(painel).not.toHaveAttribute('hidden');
  });

  it('a secao desabilitada fica fora da busca da pagina', () => {
    render(<Accordion items={secoes} />);
    const painel = document.getElementById(screen.getByRole('button', { name: 'Antigo' }).getAttribute('aria-controls')!)!;

    expect(painel).toHaveAttribute('hidden', '');
  });

  it('marca o item aberto com data-expanded', () => {
    render(<Accordion defaultExpandedKeys={['envio']} items={secoes} />);

    const item = (nome: string) => screen.getByRole('button', { name: nome }).closest(`.${styles.item}`);
    expect(item('Envio')).toHaveAttribute('data-expanded');
    expect(item('Pagamento')).not.toHaveAttribute('data-expanded');

    fireEvent.click(screen.getByRole('button', { name: 'Pagamento' }));
    expect(item('Pagamento')).toHaveAttribute('data-expanded');
    expect(item('Envio')).not.toHaveAttribute('data-expanded');
  });

  it('o indicador plus vira o sinal de menos ao abrir, sem chevron', () => {
    render(<Accordion indicator="plus" items={secoes} />);
    const gatilho = screen.getByRole('button', { name: 'Envio' });
    const indicador = () => gatilho.querySelector('[data-indicator="plus"]');

    expect(indicador()).toHaveAttribute('aria-hidden', 'true');
    expect(indicador()).not.toHaveClass(styles.plusOpen!);

    fireEvent.click(gatilho);

    expect(indicador()).toHaveClass(styles.plusOpen!);
    expect(gatilho.querySelectorAll('svg')).toHaveLength(1);
  });

  it('escolhe a aparencia, e sem ela vale o divider', () => {
    const { container, rerender } = render(<Accordion items={secoes} />);
    const raiz = () => container.firstElementChild!;
    expect(raiz()).toHaveClass(styles.divided!);

    rerender(<Accordion appearance="separated" items={secoes} />);
    expect(raiz()).toHaveClass(styles.separated!);
    expect(raiz()).not.toHaveClass(styles.divided!);

    rerender(<Accordion appearance="plain" items={secoes} />);
    expect(raiz()).not.toHaveClass(styles.divided!);
    expect(raiz()).not.toHaveClass(styles.separated!);

    rerender(<Accordion appearance="divided" divider={false} items={secoes} />);
    expect(raiz()).toHaveClass(styles.divided!);
  });

  it('o cabecalho compacto nao usa caixa alta nem espacamento entre letras', () => {
    const { container } = render(<Accordion headerStyle="compact" items={secoes} />);
    const css = readFileSync(resolve(process.cwd(), 'src/components/data-display/Accordion/Accordion.module.css'), 'utf8');

    expect(container.firstElementChild).toHaveClass(styles.compact!);
    expect(css).not.toMatch(/text-transform|letter-spacing/);
    expect(screen.getByRole('button', { name: 'Envio' })).toHaveTextContent('Envio');
  });

  it('o icone e o fim sao decorativos, a linha de cima e o endLabel entram no nome', () => {
    render(
      <Accordion
        items={[
          {
            key: 'envio',
            label: 'Envio',
            content: 'Regras de envio',
            icon: <svg data-testid="icone" />,
            overline: 'Etapa 2',
            end: <span data-testid="fim">3</span>,
            endLabel: '3 pendentes',
          },
        ]}
      />,
    );

    const gatilho = screen.getByRole('button', { name: 'Etapa 2 Envio 3 pendentes' });
    expect(screen.getByTestId('icone').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('fim').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('heading', { name: 'Etapa 2 Envio 3 pendentes' })).toContainElement(gatilho);
  });

  it('com o indicador a esquerda, as fendas mantem a ordem de leitura', () => {
    render(
      <Accordion
        iconPosition="left"
        items={[{ key: 'envio', label: 'Envio', content: 'Regras', icon: <svg data-testid="icone" />, end: 'fim' }]}
      />,
    );

    const filhos = Array.from(screen.getByRole('button').children);
    expect(filhos[0]).toContainElement(screen.getByTestId('icone'));
    expect(filhos[filhos.length - 1]).toHaveClass(styles.icon!);
  });

  it('le as variaveis de superficie com o valor do sistema de reserva, sem declara-las', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/data-display/Accordion/Accordion.module.css'), 'utf8');

    expect(css).toContain('var(--accordion-header-surface, var(--pl-color-surface))');
    expect(css).toContain('var(--accordion-panel-surface, var(--pl-color-surface))');
    expect(css).not.toMatch(/--accordion-(header|panel)-surface\s*:/);
  });
});
