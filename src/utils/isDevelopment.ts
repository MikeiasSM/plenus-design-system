declare const process: { env: { NODE_ENV?: string } };

// O bundler de quem consome substitui a expressão inteira; sem bundler e sem `process`, o aviso apenas não sai.
export function isDevelopment() {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}
