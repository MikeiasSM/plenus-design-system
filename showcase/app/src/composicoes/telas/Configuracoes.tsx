import { useState } from 'react';
import { Badge, Card, EmptyState, InputText, PageHeader, Table } from '@plenustech/design-system';
import { IconSearch } from '@plenustech/design-system/icons';
import { CAMINHO_DAS_COMPOSICOES } from '../menu';
import { GRUPOS_DE_CONFIGURACAO } from '../dados';
import { Coluna, Pagina } from '../Pagina';

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function Configuracoes() {
  const [busca, setBusca] = useState('');
  const termo = normalizar(busca.trim());

  const grupos = GRUPOS_DE_CONFIGURACAO.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter(([nome, estado]) => !termo || normalizar(`${nome} ${estado}`).includes(termo)),
  })).filter((grupo) => grupo.itens.length > 0);

  return (
    <Pagina caminho={['Configurações', 'Visão geral']}>
      <PageHeader maxWidth="1120px">
        <PageHeader.Title>Configurações</PageHeader.Title>
        <PageHeader.Description>Ajustes da empresa, das vendas, do financeiro e do sistema.</PageHeader.Description>
        <PageHeader.Search>
          <InputText
            aria-label="Buscar configuração"
            icon={<IconSearch />}
            onValueChange={setBusca}
            placeholder="Buscar: boleto, limite, certificado…"
            type="search"
            value={busca}
          />
        </PageHeader.Search>
      </PageHeader>
      <Coluna className="grade grade-uma" largura={1120}>
        {grupos.map((grupo) => (
          <Card key={grupo.nome}>
            <Card.Header headingLevel={2} title={grupo.nome} />
            <Card.Body flush>
              <Table label={grupo.nome} size="sm">
                <Table.Header>
                  <Table.Column id="nome" width="40%">Configuração</Table.Column>
                  <Table.Column id="estado">Estado</Table.Column>
                </Table.Header>
                <Table.Body items={grupo.itens.map(([nome, estado, alerta]) => ({ id: nome, nome, estado, alerta }))}>
                  {(item) => (
                    <Table.Row id={item.id}>
                      <Table.Cell>
                        <a
                          className="ligacao-da-linha"
                          href={`${CAMINHO_DAS_COMPOSICOES}/${item.nome === 'Descontos e aprovação' ? 'configuracao-anotada' : 'configuracoes'}`}
                        >
                          {item.nome}
                        </a>
                      </Table.Cell>
                      <Table.Cell>{item.alerta ? <Badge tone="danger">{item.estado}</Badge> : item.estado}</Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </Card.Body>
          </Card>
        ))}
        {grupos.length === 0 && <EmptyState description="Tente outro termo." size="sm" title="Nenhuma configuração com esse nome" />}
      </Coluna>
    </Pagina>
  );
}
