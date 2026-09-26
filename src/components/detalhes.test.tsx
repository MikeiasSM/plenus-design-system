import { render, screen } from '@testing-library/react';
import { Alert } from './feedback/Alert';
import { IconClose } from './icons';
import { Tabs } from './navigation/Tabs';

const abas = [
  { key: 'um', label: 'Um', content: 'Conteudo um' },
  { key: 'dois', label: 'Dois', content: 'Conteudo dois' },
];

describe('detalhes de acessibilidade', () => {
  it('so aponta aria-controls para o painel que existe', () => {
    render(<Tabs items={abas} label="Abas" />);

    const [ativa, inativa] = screen.getAllByRole('tab');

    expect(ativa).toHaveAttribute('aria-controls');
    expect(document.getElementById(ativa.getAttribute('aria-controls')!)).toBeInTheDocument();
    expect(inativa).not.toHaveAttribute('aria-controls');
  });

  it('nomeia o icone pelo aria-label vindo de fora, em vez de o esconder', () => {
    render(<IconClose aria-label="Fechar" />);

    const icone = screen.getByRole('img', { name: 'Fechar' });

    expect(icone).not.toHaveAttribute('aria-hidden');
  });

  it('respeita o role que o consumidor informa no Alert', () => {
    render(
      <Alert role="alertdialog" tone="danger">
        Falhou
      </Alert>,
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
