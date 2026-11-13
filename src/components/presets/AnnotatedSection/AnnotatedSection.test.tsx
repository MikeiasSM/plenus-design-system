import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { AnnotatedSection } from './AnnotatedSection';

describe('AnnotatedSection', () => {
  it('nomeia a regiao pelo titulo, em h2 por padrao', () => {
    render(<AnnotatedSection title="Notificacoes">Conteudo</AnnotatedSection>);

    expect(screen.getByRole('region', { name: 'Notificacoes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Notificacoes' })).toBeInTheDocument();
  });

  it('respeita o nivel de titulo informado', () => {
    render(
      <AnnotatedSection headingLevel={3} title="Notificacoes">
        Conteudo
      </AnnotatedSection>,
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Notificacoes' })).toBeInTheDocument();
  });

  it('mostra a explicacao, a acao e o conteudo', () => {
    render(
      <AnnotatedSection action={<button type="button">Gerenciar</button>} description="Quando avisar." title="Notificacoes">
        <p>Campos</p>
      </AnnotatedSection>,
    );

    expect(screen.getByText('Quando avisar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerenciar' })).toBeInTheDocument();
    expect(screen.getByText('Campos')).toBeInTheDocument();
  });

  it('entrega propriedades nativas, className e ref a secao', () => {
    const ref = createRef<HTMLElement>();
    render(
      <AnnotatedSection className="extra" data-teste="sim" ref={ref} title="Notificacoes">
        Conteudo
      </AnnotatedSection>,
    );

    const regiao = screen.getByRole('region', { name: 'Notificacoes' });
    expect(regiao).toHaveAttribute('data-teste', 'sim');
    expect(regiao).toHaveClass('extra');
    expect(ref.current).toBe(regiao);
  });
});
