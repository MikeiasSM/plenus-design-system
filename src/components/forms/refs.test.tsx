import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Checkbox } from './Checkbox';
import { InputCurrency } from './InputCurrency';
import { InputNumber } from './InputNumber';
import { InputPassword } from './InputPassword';
import { InputText } from './InputText';
import { RadioGroup } from './RadioGroup';
import { Radio } from './RadioGroup/Radio';
import { Switch } from './Switch';
import { Textarea } from './Textarea';

describe('ref dos campos', () => {
  it('entrega o elemento nativo a quem pediu, sem perder o ref interno', () => {
    const referencias = {
      texto: createRef<HTMLInputElement>(),
      numero: createRef<HTMLInputElement>(),
      moeda: createRef<HTMLInputElement>(),
      senha: createRef<HTMLInputElement>(),
      area: createRef<HTMLTextAreaElement>(),
      caixa: createRef<HTMLInputElement>(),
      chave: createRef<HTMLInputElement>(),
      opcao: createRef<HTMLInputElement>(),
    };

    render(
      <>
        <InputText label="Texto" ref={referencias.texto} />
        <InputNumber label="Numero" ref={referencias.numero} />
        <InputCurrency label="Moeda" ref={referencias.moeda} />
        <InputPassword label="Senha" ref={referencias.senha} />
        <Textarea label="Area" ref={referencias.area} />
        <Checkbox label="Caixa" ref={referencias.caixa} />
        <Switch label="Chave" ref={referencias.chave} />
        <RadioGroup label="Escolha" name="escolha">
          <Radio label="Opcao" ref={referencias.opcao} value="a" />
        </RadioGroup>
      </>,
    );

    for (const [nome, referencia] of Object.entries(referencias)) {
      expect(referencia.current, nome).toBeInstanceOf(HTMLElement);
    }
  });

  it('mantem a contagem de caracteres, que usa o ref interno', () => {
    const referencia = createRef<HTMLInputElement>();

    render(
      <InputText defaultValue="abc" label="Texto" maxLength={10} ref={referencia} showCharacterCount />,
    );

    expect(referencia.current).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('nao descarta o onChange do Radio', () => {
    const vistos: string[] = [];

    render(
      <RadioGroup label="Escolha" name="escolha">
        <Radio label="Opcao" onChange={() => vistos.push('consumidor')} value="a" />
      </RadioGroup>,
    );

    screen.getByLabelText('Opcao').click();

    expect(vistos).toEqual(['consumidor']);
  });
});
