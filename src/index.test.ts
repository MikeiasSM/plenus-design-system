import './index';

describe('Design System foundation', () => {
  it('loads the global style entrypoint', () => {
    expect(document.body).toBeInTheDocument();
  });
});
