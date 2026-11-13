import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';
import { disarmClickShield } from '../utils/press/clickShield';

beforeEach(() => disarmClickShield());

// O jsdom nao tem canvas e avisa a cada chamada; a medida de texto ja cai na estimativa sem ele.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}
