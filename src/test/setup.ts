import '@testing-library/jest-dom/vitest';

// O jsdom não tem canvas e avisa a cada chamada; a medida de texto já cai na estimativa sem ele.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}
