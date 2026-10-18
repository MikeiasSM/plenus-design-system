import { render, screen } from '@testing-library/react';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('e um link para a ancora do conteudo, com o texto padrao', () => {
    render(<SkipLink href="#conteudo" />);

    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo');
  });
});
