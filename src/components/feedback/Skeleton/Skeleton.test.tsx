import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';
import styles from './Skeleton.module.css';

describe('Skeleton', () => {
  it('fica fora da leitura, na forma e medida pedidas', () => {
    const { container } = render(<Skeleton height={40} shape="circle" width="2.5rem" />);
    const skeleton = container.firstElementChild as HTMLElement;

    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveClass(styles.circle!);
    expect(skeleton.style.height).toBe('40px');
    expect(skeleton.style.width).toBe('2.5rem');
  });
});
