import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Accordion } from './data-display/Accordion';
import { Breadcrumb } from './navigation/Breadcrumb';
import { Card } from './data-display/Card';
import { Field } from './forms/Field';
import { List } from './data-display/List';
import { Pagination } from './navigation/Pagination';
import { RadioGroup } from './forms/RadioGroup';
import { Radio } from './forms/RadioGroup/Radio';
import { Table } from './data-display/Table';
import { Tabs } from './navigation/Tabs';

const abas = [{ key: 'um', label: 'Um', content: 'Conteudo' }];

describe('passagem de propriedades nativas', () => {
  it('soma o className em vez de substituir o do componente', () => {
    render(
      <Card className="meu-cartao" data-testid="cartao">
        <span>Corpo</span>
      </Card>,
    );

    const cartao = screen.getByTestId('cartao');

    expect(cartao).toHaveClass('meu-cartao');
    expect(cartao.className.split(' ').length).toBeGreaterThan(1);
  });

  it('aceita id, data-* e ref nos contêineres', () => {
    const referencia = createRef<HTMLDivElement>();

    render(
      <>
        <Accordion data-testid="acordeao" id="secoes" items={[]} />
        <Tabs data-testid="abas" items={abas} label="Abas" ref={referencia} />
        <List data-testid="lista" items={[]} label="Lista">
          <List.Options />
        </List>
        <Pagination data-testid="paginas" onPageChange={() => undefined} page={1} pageCount={3} />
      </>,
    );

    expect(screen.getByTestId('acordeao')).toHaveAttribute('id', 'secoes');
    expect(screen.getByTestId('abas')).toBeInTheDocument();
    expect(screen.getByTestId('lista')).toBeInTheDocument();
    expect(screen.getByTestId('paginas')).toBeInTheDocument();
    expect(referencia.current).toBeInstanceOf(HTMLDivElement);
  });

  it('aceita nos demais: Breadcrumb, RadioGroup, Table e Field', () => {
    render(
      <>
        <Breadcrumb data-testid="trilha" items={[{ label: 'Inicio' }]} />
        <RadioGroup data-testid="grupo" label="Escolha" name="e">
          <Radio label="Um" value="um" />
        </RadioGroup>
        <Table data-testid="tabela" label="Tabela" rows={[]}>
          <Table.Header>
            <Table.Column id="a">A</Table.Column>
          </Table.Header>
          <Table.Body items={[]}>{() => (
              <Table.Row id="x">
                <Table.Cell>A</Table.Cell>
              </Table.Row>
            )}</Table.Body>
        </Table>
        <Field data-testid="campo" label="Campo">
          {({ id }) => <input id={id} />}
        </Field>
      </>,
    );

    for (const id of ['trilha', 'grupo', 'tabela', 'campo']) {
      expect(screen.getByTestId(id), id).toBeInTheDocument();
    }
  });
});
