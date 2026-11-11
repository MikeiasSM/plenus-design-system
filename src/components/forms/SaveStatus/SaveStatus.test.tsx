import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { regrasDaFolha } from '../../../test/folha';
import { AppShell } from '../../navigation/AppShell';
import { SaveStatus, type SaveStatusValue } from './SaveStatus';

describe('SaveStatus', () => {
  it('mostra o texto do produto numa regiao de status polida', () => {
    render(<SaveStatus status="saved">Rascunho salvo as 10:42</SaveStatus>);

    const regiao = screen.getByRole('status');
    expect(regiao).toHaveTextContent('Rascunho salvo as 10:42');
    expect(regiao).toHaveAttribute('aria-live', 'polite');
  });

  it('anuncia a mudanca de texto na mesma regiao, que fica montada sem texto', () => {
    const { rerender } = render(<SaveStatus />);
    const regiao = screen.getByRole('status');

    expect(regiao).toBeEmptyDOMElement();

    rerender(<SaveStatus status="dirty">Alteracoes nao salvas</SaveStatus>);
    expect(screen.getByRole('status')).toBe(regiao);
    expect(regiao).toHaveTextContent('Alteracoes nao salvas');
  });

  it('dentro da situacao do rodape da pagina, nao cria uma segunda regiao', () => {
    const { rerender } = render(<AppShell.PageFooter status={<SaveStatus data-testid="situacao">Nenhuma alteracao ainda</SaveStatus>} />);

    const regiao = screen.getByRole('status');
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(regiao).toContainElement(screen.getByTestId('situacao'));
    expect(screen.getByTestId('situacao')).not.toHaveAttribute('aria-live');

    rerender(
      <AppShell.PageFooter
        status={
          <SaveStatus data-testid="situacao" status="saved">
            Rascunho salvo as 10:42
          </SaveStatus>
        }
      />,
    );
    expect(screen.getByRole('status')).toBe(regiao);
    expect(regiao).toHaveTextContent('Rascunho salvo as 10:42');
  });

  it('expoe a situacao na raiz e usa idle por padrao', () => {
    const { rerender } = render(<SaveStatus data-testid="situacao">Texto</SaveStatus>);

    expect(screen.getByTestId('situacao')).toHaveAttribute('data-status', 'idle');

    rerender(
      <SaveStatus data-testid="situacao" status="error">
        Texto
      </SaveStatus>,
    );
    expect(screen.getByTestId('situacao')).toHaveAttribute('data-status', 'error');
  });

  it('em saving, mostra o spinner, decorativo', () => {
    const { container } = render(<SaveStatus status="saving">Salvando rascunho…</SaveStatus>);

    const indicador = container.querySelector('[class*="spinner"]');
    expect(indicador).toBeInTheDocument();
    expect(indicador).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('em saved e error, mostra um icone decorativo; em idle e dirty, nenhum indicador', () => {
    const comIndicador: Record<SaveStatusValue, boolean> = { idle: false, dirty: false, saving: true, saved: true, error: true };

    (Object.keys(comIndicador) as SaveStatusValue[]).forEach((status) => {
      const { container, unmount } = render(<SaveStatus status={status}>Texto</SaveStatus>);
      const regiao = screen.getByRole('status');

      expect(regiao.children.length).toBe(comIndicador[status] ? 1 : 0);

      if (status === 'saved' || status === 'error') {
        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      }

      unmount();
    });
  });

  it('entrega propriedades nativas, className e ref a raiz', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <SaveStatus className="extra" data-testid="situacao" id="minha" ref={ref}>
        Texto
      </SaveStatus>,
    );

    const raiz = screen.getByTestId('situacao');
    expect(raiz).toHaveClass('extra');
    expect(raiz).toHaveAttribute('id', 'minha');
    expect(ref.current).toBe(raiz);
  });

  describe('na folha de estilo', () => {
    const regras = regrasDaFolha('src/components/forms/SaveStatus/SaveStatus.module.css');

    it('o texto e caption e terciario', () => {
      expect(regras.get('.root')).toMatchObject({
        color: 'var(--pl-color-text-tertiary)',
        'font-size': 'var(--pl-type-caption-size)',
        'line-height': 'var(--pl-type-caption-line-height)',
      });
    });

    it('o icone de salvo tem o tom de sucesso e o de erro, o de perigo', () => {
      expect(regras.get('.saved')).toMatchObject({ color: 'var(--pl-color-success)' });
      expect(regras.get('.error')).toMatchObject({ color: 'var(--pl-color-danger)' });
    });
  });
});
