import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its content with a neutral tone by default', () => {
    render(<Badge>Neutro</Badge>);

    expect(screen.getByText('Neutro')).toBeInTheDocument();
  });

  it('supports semantic tones', () => {
    render(<Badge tone="danger">Erro</Badge>);

    expect(screen.getByText('Erro').className).toContain('danger');
  });

  it('renders a decorative dot when requested', () => {
    render(<Badge dot>Ativo</Badge>);

    expect(screen.getByText('Ativo').querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('supports outline presentation', () => {
    render(
      <Badge tone="success" outline>
        Concluido
      </Badge>,
    );

    expect(screen.getByText('Concluido').className).toContain('outline');
  });

  it('uses the medium size by default and the small one on request', () => {
    render(
      <>
        <Badge>Padrao</Badge>
        <Badge size="sm">Pequeno</Badge>
      </>,
    );

    expect(screen.getByText('Padrao').className).toContain('md');
    expect(screen.getByText('Pequeno').className).toContain('sm');
    expect(screen.getByText('Pequeno').className).not.toContain('md');
  });

  it('keeps the dot and the outline in the small size', () => {
    render(
      <Badge dot outline size="sm">
        Beta
      </Badge>,
    );

    const badge = screen.getByText('Beta');

    expect(badge.className).toContain('outline');
    expect(badge.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('forwards native span attributes', () => {
    render(<Badge data-testid="badge">Status</Badge>);

    expect(screen.getByTestId('badge')).toHaveAttribute('data-testid', 'badge');
  });

  it('paints in the brand color with variant brand, regardless of tone', () => {
    render(<Badge variant="brand">Destaque</Badge>);

    expect(screen.getByText('Destaque').className).toContain('brand');
  });
});

describe('Badge variant count', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/components/data-display/Badge/Badge.module.css'), 'utf8').replace(/\r\n/g, '\n');
  const block = (selector: string) => css.slice(css.indexOf(`${selector} {`), css.indexOf('}', css.indexOf(`${selector} {`)));

  it('renders the count with no role, ignoring tone, size, dot and outline', () => {
    render(
      <Badge dot outline size="sm" tone="danger" variant="count">
        {7}
      </Badge>,
    );

    const badge = screen.getByText('7');
    expect(badge.className).toContain('count');
    expect(badge.className).not.toContain('danger');
    expect(badge.className).not.toContain('outline');
    expect(badge).not.toHaveAttribute('role');
    expect(badge.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('shows 99+ above 99 and keeps text children as they are', () => {
    render(
      <>
        <Badge variant="count">{100}</Badge>
        <Badge variant="count">Novo</Badge>
      </>,
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
    expect(screen.getByText('Novo')).toBeInTheDocument();
  });

  it('is an 18px circle in the brand color, with tabular figures and a ring in the surface color', () => {
    const rule = block('.count');

    expect(rule).toContain('--badge-surface: var(--pl-color-primary);');
    expect(rule).toContain('--badge-tone: var(--pl-color-on-primary);');
    expect(rule).toContain('min-width: 18px;');
    expect(rule).toContain('height: 18px;');
    expect(rule).toContain('border-radius: var(--pl-radius-full);');
    expect(rule).toContain('font-variant-numeric: tabular-nums;');
    expect(rule).toContain('box-shadow: 0 0 0 2px var(--pl-color-surface);');
  });

  it('reads --pl-badge-surface with the tone surface as fallback, without declaring it', () => {
    expect(block('.badge')).toContain('background: var(--pl-badge-surface, var(--badge-surface));');
    expect(css).not.toMatch(/--pl-badge-surface\s*:/);
  });
});
