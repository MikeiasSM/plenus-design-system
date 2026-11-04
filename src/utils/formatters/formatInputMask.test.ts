import { formatInputMask, maskedCaret } from './formatInputMask';

const CPF = '000.000.000-00';

describe('formatInputMask com padrao', () => {
  it('insere os literais conforme os digitos chegam', () => {
    expect(formatInputMask('1', CPF).text).toBe('1');
    expect(formatInputMask('1234', CPF).text).toBe('123.4');
    expect(formatInputMask('12345678909', CPF).text).toBe('123.456.789-09');
  });

  it('nao deixa literal pendurado ao apagar o ultimo digito', () => {
    expect(formatInputMask('123.', CPF).text).toBe('123');
    expect(formatInputMask('123.4', CPF).text).toBe('123.4');
  });

  it('descarta o que a posicao nao aceita e o excesso', () => {
    expect(formatInputMask('12a3b', CPF).text).toBe('123');
    expect(formatInputMask('123456789091234', CPF).text).toBe('123.456.789-09');
  });

  it('reconhece texto colado ja formatado ou com literais proprios', () => {
    expect(formatInputMask('123.456.789-09', CPF).text).toBe('123.456.789-09');
    expect(formatInputMask('(11) 91234-5678', '(00) 00000-0000').text).toBe('(11) 91234-5678');
    expect(formatInputMask('11912345678', '(00) 00000-0000').text).toBe('(11) 91234-5678');
  });

  it('trata como literal o digito do padrao e o consome quando colado', () => {
    expect(formatInputMask('11912345678', '+55 (00) 00000-0000').text).toBe('+55 (11) 91234-5678');
    expect(formatInputMask('+55 11 91234-5678', '+55 (00) 00000-0000').text).toBe('+55 (11) 91234-5678');
  });

  it('aceita letras e letras ou digitos', () => {
    expect(formatInputMask('abc1234', 'aaa-0*00').text).toBe('abc-1234');
    expect(formatInputMask('abc1x3y4', 'aaa-0*00').text).toBe('abc-1x34');
  });

  it('devolve so o que preencheu posicoes como valor cru', () => {
    expect(formatInputMask('(11) 91234-5678', '+55 (00) 00000-0000').raw).toBe('11912345678');
  });
});

describe('formatInputMask com funcao', () => {
  const upper = (text: string) => text.toUpperCase().replace(/[^A-Z0-9]/g, '');

  it('usa o texto devolvido e tira o cru das letras e dos digitos', () => {
    expect(formatInputMask('ab-12', (text) => upper(text).replace(/^(..)/, '$1-'))).toEqual({
      text: 'AB-12',
      raw: 'AB12',
    });
  });
});

describe('maskedCaret', () => {
  it('no padrao, fica logo apos o ultimo caractere aceito antes do cursor', () => {
    expect(maskedCaret('1234', 4, CPF, '123.4')).toBe(5);
    expect(maskedCaret('1923456', 2, CPF, '192.345.6')).toBe(2);
    expect(maskedCaret('123a', 4, CPF, '123')).toBe(3);
  });

  it('no padrao, fica depois do literal que antecede o cursor quando ele permanece', () => {
    expect(maskedCaret('123.56', 4, CPF, '123.56')).toBe(4);
    expect(maskedCaret('123.', 4, CPF, '123')).toBe(3);
    expect(maskedCaret('123.x56', 5, CPF, '123.56')).toBe(4);
  });

  it('na funcao, acompanha o numero de letras e digitos', () => {
    const thousands = (text: string) => text.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    expect(maskedCaret('1.2934', 4, thousands, '12.934')).toBe(4);
    expect(maskedCaret('x', 0, thousands, '')).toBe(0);
  });
});
