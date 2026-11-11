import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  FileUpload,
  Grid,
  PageHeader,
  Select,
  Stack,
  Steps,
  Table,
  formatCurrency,
  formatDate,
  type FileUploadItem,
} from '@plenustech/design-system';
import { IconCheck2Circle } from '@plenustech/design-system/icons';
import { CAMINHO_DAS_COMPOSICOES } from '../menu';
import { LANCAMENTOS, type ParDoLancamento } from '../dados';
import { Coluna, Pagina } from '../Pagina';

const ETAPAS = [
  { key: 'conta', label: 'Conta e período', titulo: 'Escolha a conta', explicacao: 'Qual conta e qual período vão ser conferidos.' },
  { key: 'extrato', label: 'Extrato', titulo: 'Envie o extrato', explicacao: 'O arquivo OFX traz os lançamentos do banco.' },
  { key: 'conferencia', label: 'Conferência', titulo: 'Confira os lançamentos', explicacao: 'Cada lançamento do banco é ligado a um pedido ou a uma conta.' },
  { key: 'revisao', label: 'Revisão', titulo: 'Revise e conclua', explicacao: 'Veja o resultado antes de fechar o período.' },
];

const CONTAS = ['Banco Horizonte · ag. 1020, c/c 40213-7', 'Coop. Vale Verde · ag. 0745, c/c 88120-3'].map((conta) => ({ label: conta, value: conta }));
const PERIODOS = ['Outubro de 2026', 'Setembro de 2026'].map((periodo) => ({ label: periodo, value: periodo }));

const PARES: Record<ParDoLancamento, { rotulo: string; tom: 'success' | 'warning' | 'neutral' }> = {
  ok: { rotulo: 'Conciliado', tom: 'success' },
  sugerido: { rotulo: 'Par sugerido', tom: 'warning' },
  sem: { rotulo: 'Sem par', tom: 'neutral' },
};

export function Conciliacao() {
  const [etapa, setEtapa] = useState('conta');
  const [conta, setConta] = useState(CONTAS[0].value);
  const [periodo, setPeriodo] = useState(PERIODOS[0].value);
  const [extrato, setExtrato] = useState<FileUploadItem[]>([]);
  const [aceitos, setAceitos] = useState<readonly string[]>([]);
  const [concluida, setConcluida] = useState(false);

  const indice = ETAPAS.findIndex((candidata) => candidata.key === etapa);
  const atual = ETAPAS[indice];
  const ultima = indice === ETAPAS.length - 1;
  const conciliados = LANCAMENTOS.filter((lancamento) => lancamento.par === 'ok' || aceitos.includes(lancamento.id)).length;
  const semPar = LANCAMENTOS.filter((lancamento) => lancamento.par === 'sem').length;

  const cabecalho = (
    <PageHeader maxWidth="760px">
      <PageHeader.Title>Conciliação bancária</PageHeader.Title>
      <PageHeader.Description>Confira o extrato do banco com os pedidos e as contas do sistema.</PageHeader.Description>
    </PageHeader>
  );

  if (concluida) {
    return (
      <Pagina caminho={['Financeiro', 'Conciliação']}>
        {cabecalho}
        <Coluna largura={760}>
          <Card>
            <Card.Body>
              <EmptyState
                actions={
                  <>
                    <Button onClick={() => { setConcluida(false); setEtapa('conta'); setExtrato([]); setAceitos([]); }} variant="secondary">Nova conciliação</Button>
                    <Button onClick={() => { window.location.hash = `${CAMINHO_DAS_COMPOSICOES}/inicio`; }}>Voltar à tela inicial</Button>
                  </>
                }
                description={`${conciliados} lançamentos conciliados. O que ficou sem par está na fila de ajuste.`}
                icon={<IconCheck2Circle />}
                title={`Conciliação de ${periodo.toLowerCase()} concluída`}
              />
            </Card.Body>
          </Card>
        </Coluna>
      </Pagina>
    );
  }

  return (
    <Pagina caminho={['Financeiro', 'Conciliação']}>
      {cabecalho}
      <Coluna largura={760}>
        <Card>
          <Card.Body>
            <Steps current={etapa} items={ETAPAS} label="Etapas da conciliação" onCurrentChange={(chave) => ETAPAS.findIndex((e) => e.key === chave) < indice && setEtapa(chave)} />
          </Card.Body>
          <Card.Header description={atual.explicacao} headingLevel={2} title={atual.titulo} />
          <Card.Body>
            {etapa === 'conta' && (
              <Grid columns={2} minColumnWidth={252}>
                <Select label="Conta bancária" onValueChange={setConta} options={CONTAS} value={conta} />
                <Select label="Período" onValueChange={setPeriodo} options={PERIODOS} value={periodo} />
              </Grid>
            )}
            {etapa === 'extrato' && (
              <FileUpload
                accept=".ofx"
                hint="Arquivo OFX do internet banking."
                items={extrato}
                label="Extrato do banco"
                onFilesSelected={(arquivos) => setExtrato(arquivos.map((arquivo, posicao) => ({ id: String(posicao), name: arquivo.name, size: arquivo.size, status: 'done' })))}
                onRemove={() => setExtrato([])}
              />
            )}
            {etapa === 'conferencia' && (
              <Table label="Lançamentos do extrato" size="sm">
                <Table.Header>
                  <Table.Column id="data" width="90px">Data</Table.Column>
                  <Table.Column id="descricao">Lançamento</Table.Column>
                  <Table.Column id="valor" numeric>Valor</Table.Column>
                  <Table.Column id="par">Par</Table.Column>
                </Table.Header>
                <Table.Body items={LANCAMENTOS}>
                  {(lancamento) => {
                    const aceito = aceitos.includes(lancamento.id);
                    const par = aceito ? PARES.ok : PARES[lancamento.par];

                    return (
                      <Table.Row id={lancamento.id}>
                        <Table.Cell>{formatDate(lancamento.data)}</Table.Cell>
                        <Table.Cell>{lancamento.descricao}</Table.Cell>
                        <Table.Cell>{formatCurrency(lancamento.valor)}</Table.Cell>
                        <Table.Cell>
                          {lancamento.par === 'sugerido' && !aceito ? (
                            <Button onClick={() => setAceitos([...aceitos, lancamento.id])} size="sm" variant="secondary">Aceitar {lancamento.referencia}</Button>
                          ) : (
                            <Badge tone={par.tom}>{par.rotulo}</Badge>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    );
                  }}
                </Table.Body>
              </Table>
            )}
            {etapa === 'revisao' && (
              <Stack>
                <p>
                  {conciliados} de {LANCAMENTOS.length} lançamentos conciliados em {periodo.toLowerCase()}, conta {conta}.
                </p>
                {semPar > 0 && (
                  <Alert title={`${semPar} lançamentos sem par`} tone="info">
                    Ficam na fila de ajuste e não travam a conclusão.
                  </Alert>
                )}
              </Stack>
            )}
          </Card.Body>
          <Card.Footer start={<Button variant="ghost">Salvar e sair</Button>}>
            <Button disabled={indice === 0} onClick={() => setEtapa(ETAPAS[indice - 1].key)} variant="secondary">Voltar</Button>
            <Button
              disabled={etapa === 'extrato' && extrato.length === 0}
              onClick={() => (ultima ? setConcluida(true) : setEtapa(ETAPAS[indice + 1].key))}
            >
              {ultima ? 'Concluir conciliação' : 'Próximo'}
            </Button>
          </Card.Footer>
        </Card>
      </Coluna>
    </Pagina>
  );
}
