import { useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardMetric,
  ChartBar,
  ChartDonut,
  Grid,
  IconFilter,
  PageHeader,
  Select,
  SidePanel,
  Stack,
  Tag,
  VisuallyHidden,
  formatNumber,
  formatPercent,
} from '@plenustech/design-system';
import { IconDownload } from '@plenustech/design-system/icons';
import {
  CLIENTES_POR_BAIRRO,
  CLIENTES_POR_CONCEITO,
  CLIENTES_POR_ESTADO,
  CLIENTES_POR_TIPO,
} from '../dados';
import { Coluna, Pagina } from '../Pagina';

const PERIODOS = ['Últimos 7 dias', 'Último mês', 'Últimos 3 meses', 'Ano atual'];
const EMPRESAS = ['01 · Roman Mecânica de Caminhões Ltda', '02 · Roman Peças e Serviços'];
const PERIODO_PADRAO = PERIODOS[1];
const ATIVOS = 1984;

const formatarInteiro = (valor: number) => formatNumber(valor);

interface MetricaProps {
  descricao: string;
  titulo: string;
  valor: number;
}

function Metrica({ descricao, titulo, valor }: MetricaProps) {
  return (
    <CardMetric>
      <Card.Header description={descricao} headingLevel={2} title={titulo} />
      <CardMetric.Body>
        <CardMetric.Value formatValue={formatarInteiro} value={valor} />
      </CardMetric.Body>
    </CardMetric>
  );
}

interface BarrasProps {
  altura: number;
  dados: readonly (readonly [string, number])[];
  descricao: string;
  titulo: string;
}

function Barras({ altura, dados, descricao, titulo }: BarrasProps) {
  return (
    <Card>
      <Card.Header description={descricao} headingLevel={2} title={titulo} />
      <Card.Body>
        <ChartBar
          categories={dados.map(([nome]) => nome)}
          formatValue={formatarInteiro}
          height={altura}
          hideTitle
          legend="none"
          orientation="horizontal"
          series={[{ label: 'Clientes', values: dados.map(([, quantidade]) => quantidade) }]}
          title={titulo}
        />
      </Card.Body>
    </Card>
  );
}

export function ClientesBase() {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [empresa, setEmpresa] = useState(EMPRESAS[0]);
  const [periodo, setPeriodo] = useState(PERIODO_PADRAO);
  const gatilho = useRef<HTMLButtonElement>(null);
  const empresaAlterada = empresa !== EMPRESAS[0];
  const periodoAlterado = periodo !== PERIODO_PADRAO;
  const filtrosAlterados = Number(empresaAlterada) + Number(periodoAlterado);

  return (
    <>
      <Pagina caminho={['Clientes', 'Base de clientes']}>
        <PageHeader>
          <PageHeader.Title>Base de clientes</PageHeader.Title>
          <PageHeader.Description>
            Acompanhe a base de clientes, a qualidade dos cadastros e a distribuição por território e perfil.
          </PageHeader.Description>
          <PageHeader.Actions>
            <Button variant="secondary"><IconDownload />Exportar</Button>
            <Button aria-expanded={filtrosAbertos} onClick={() => setFiltrosAbertos(!filtrosAbertos)} ref={gatilho} variant="secondary">
              <IconFilter />
              Filtros
              {filtrosAlterados > 0 && (
                <>
                  <Badge tone="info">{filtrosAlterados}</Badge>
                  <VisuallyHidden>{' aplicados'}</VisuallyHidden>
                </>
              )}
            </Button>
          </PageHeader.Actions>
        </PageHeader>
        <Coluna largura="total">
          <Stack>
            {/* Só o que saiu do padrão volta como Tag; remover devolve o padrão, e o foco vai ao botão Filtros. */}
            {filtrosAlterados > 0 && (
              <Stack align="center" direction="horizontal" gap={2} wrap>
                {empresaAlterada && (
                  <Tag
                    onRemove={() => {
                      setEmpresa(EMPRESAS[0]);
                      gatilho.current?.focus();
                    }}
                  >
                    Empresa: {empresa}
                  </Tag>
                )}
                {periodoAlterado && (
                  <Tag
                    onRemove={() => {
                      setPeriodo(PERIODO_PADRAO);
                      gatilho.current?.focus();
                    }}
                  >
                    Período: {periodo}
                  </Tag>
                )}
              </Stack>
            )}
            <Grid columns={4} minColumnWidth={180}>
              <Metrica descricao="Cadastros de cliente ativos hoje." titulo="Clientes ativos" valor={ATIVOS} />
              <Metrica descricao="Cadastros criados no período, inclusive os importados em lote." titulo="Novos clientes" valor={18} />
              <Metrica descricao={`Sem documento, endereço completo ou telefone: ${formatPercent(238 / ATIVOS, { decimals: 1 })} dos ativos.`} titulo="Cadastros incompletos" valor={238} />
              <Metrica descricao={`Clientes ativos sem rota definida: ${formatPercent(1210 / ATIVOS, { decimals: 1 })} do total.`} titulo="Sem rota" valor={1210} />
            </Grid>
            {/* A coluna de gráfico mede duas de indicador e o espaço entre elas: os gráficos ficam 2 a 2 quando os indicadores ficam 4 em linha. */}
            <Grid columns={2} minColumnWidth="calc(2 * 180px + var(--pl-space-4))">
              <Barras altura={260} dados={CLIENTES_POR_ESTADO} descricao="Clientes ativos por estado." titulo="Clientes por estado" />
              <Barras altura={260} dados={CLIENTES_POR_BAIRRO} descricao="Em Santa Aurora. Outros 94 bairros somam 410 clientes." titulo="Clientes por bairro" />
              <Card>
                <Card.Header description="Produtor rural tem precedência sobre o tipo." headingLevel={2} title="Clientes por tipo de pessoa" />
                <Card.Body>
                  <ChartDonut
                    centerLabel="Total"
                    formatValue={formatarInteiro}
                    height={220}
                    hideTitle
                    slices={CLIENTES_POR_TIPO}
                    title="Clientes por tipo de pessoa"
                  />
                </Card.Body>
              </Card>
              <Barras altura={220} dados={CLIENTES_POR_CONCEITO} descricao="Clientes ativos pelo conceito do cadastro." titulo="Clientes por conceito" />
            </Grid>
          </Stack>
        </Coluna>
      </Pagina>
      <SidePanel
        footer={
          <>
            <Button
              onClick={() => {
                setEmpresa(EMPRESAS[0]);
                setPeriodo(PERIODO_PADRAO);
              }}
              variant="secondary"
            >
              Limpar
            </Button>
            <Button
              onClick={() => {
                setFiltrosAbertos(false);
                gatilho.current?.focus();
              }}
            >
              Concluir
            </Button>
          </>
        }
        onOpenChange={setFiltrosAbertos}
        open={filtrosAbertos}
        title="Filtros"
      >
        <Stack>
          <Select
            label="Empresa"
            onValueChange={setEmpresa}
            options={EMPRESAS.map((nome) => ({ label: nome, value: nome }))}
            required
            value={empresa}
          />
          <Select
            label="Período"
            onValueChange={setPeriodo}
            options={PERIODOS.map((nome) => ({ label: nome, value: nome }))}
            required
            value={periodo}
          />
        </Stack>
      </SidePanel>
    </>
  );
}
