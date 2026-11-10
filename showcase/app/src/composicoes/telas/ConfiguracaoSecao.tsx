import { useState, type ReactNode } from 'react';
import {
  AnnotatedSection,
  Avatar,
  AvatarItem,
  Badge,
  Button,
  ButtonIcon,
  Card,
  Columns,
  FieldRow,
  IconClose,
  IconPlus,
  InputNumber,
  PageHeader,
  Stack,
  Switch,
  Table,
  Text,
  VisuallyHidden,
} from '@plenustech/design-system';
import { APROVADORES } from '../dados';
import { Coluna, Pagina, type LarguraDaColuna } from '../Pagina';

export type Arranjo = 'anotado' | 'empilhado' | 'indice';

const LARGURAS: Record<Arranjo, LarguraDaColuna> = { anotado: 1120, empilhado: 760, indice: 1000 };

interface RodapeProps {
  alterado: boolean;
  descartar: () => void;
  salvar: () => void;
  salvo: boolean;
}

/** Salvar por cartão: descartar e salvar ficam ativos só com alteração pendente, e a situação diz em que pé está. */
function RodapeDeSalvar({ alterado, descartar, salvar, salvo }: RodapeProps) {
  return (
    <Card.Footer>
      <Text as="div" className="rodape-espaco" tone="tertiary" variant="caption">{alterado ? 'Alterações não salvas' : salvo ? 'Salvo agora' : 'Sem alterações'}</Text>
      <Button disabled={!alterado} onClick={descartar} size="sm" variant="secondary">Descartar</Button>
      <Button disabled={!alterado} onClick={salvar} size="sm">Salvar</Button>
    </Card.Footer>
  );
}

function useAjustes<T>(inicial: T) {
  const [salvoEm, setSalvoEm] = useState(inicial);
  const [valores, setValores] = useState(inicial);
  const [acabouDeSalvar, setAcabouDeSalvar] = useState(false);
  const alterado = JSON.stringify(valores) !== JSON.stringify(salvoEm);

  return {
    alterado,
    alterar: (parcial: Partial<T>) => {
      setAcabouDeSalvar(false);
      setValores({ ...valores, ...parcial });
    },
    descartar: () => setValores(salvoEm),
    salvar: () => {
      setSalvoEm(valores);
      setAcabouDeSalvar(true);
    },
    salvo: acabouDeSalvar,
    valores,
  };
}

function Limites() {
  const ajustes = useAjustes({ semAprovacao: 5 as number | null, maximo: 15 as number | null, porCarteira: true });
  const { alterar, valores } = ajustes;

  return (
    <>
      <Card.Body>
        <FieldRow description="Até este valor, o pedido segue direto para separação." label="Desconto sem aprovação (%)">
          {({ describedBy, id }) => (
            <InputNumber aria-describedby={describedBy} id={id} onValueChange={(semAprovacao) => alterar({ semAprovacao })} value={valores.semAprovacao} />
          )}
        </FieldRow>
        <FieldRow description="Acima dele, o pedido é recusado mesmo com aprovação." label="Desconto máximo (%)">
          {({ describedBy, id }) => (
            <InputNumber aria-describedby={describedBy} id={id} onValueChange={(maximo) => alterar({ maximo })} value={valores.maximo} />
          )}
        </FieldRow>
        <FieldRow description="Cada carteira define os próprios limites; estes viram o padrão." label="Limites por carteira">
          {({ describedBy, id }) => (
            <Switch aria-describedby={describedBy} checked={valores.porCarteira} id={id} onCheckedChange={(porCarteira) => alterar({ porCarteira })} />
          )}
        </FieldRow>
      </Card.Body>
      <RodapeDeSalvar {...ajustes} />
    </>
  );
}

function QuemAprova() {
  const [aprovadores, setAprovadores] = useState(APROVADORES);

  return (
    <Card.Body flush>
      <Table label="Aprovadores">
        <Table.Header>
          <Table.Column id="nome">Aprovador</Table.Column>
          <Table.Column id="limite" numeric>Libera até</Table.Column>
          <Table.Column align="end" id="remover"><VisuallyHidden>Remover</VisuallyHidden></Table.Column>
        </Table.Header>
        <Table.Body items={aprovadores}>
          {(aprovador) => (
            <Table.Row id={aprovador.id}>
              <Table.Cell>
                <AvatarItem avatar={<Avatar name={aprovador.nome} size="sm" />} description={aprovador.papel} title={aprovador.nome} />
              </Table.Cell>
              <Table.Cell>{aprovador.limite}%</Table.Cell>
              <Table.Cell>
                <ButtonIcon
                  icon={<IconClose />}
                  label={`Remover ${aprovador.nome}`}
                  onClick={() => setAprovadores(aprovadores.filter((candidato) => candidato.id !== aprovador.id))}
                  size="sm"
                  variant="ghost"
                />
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </Card.Body>
  );
}

function Avisos() {
  const ajustes = useAjustes({ aprovador: true, vendedor: true, resumo: false });
  const { alterar, valores } = ajustes;
  const linha = (chave: keyof typeof valores, rotulo: string, descricao: string) => (
    <FieldRow description={descricao} label={rotulo}>
      {({ describedBy, id }) => (
        <Switch aria-describedby={describedBy} checked={valores[chave]} id={id} onCheckedChange={(ligado) => alterar({ [chave]: ligado })} />
      )}
    </FieldRow>
  );

  return (
    <>
      <Card.Body>
        {linha('aprovador', 'Avisar o aprovador por e-mail', 'Assim que o pedido entra na fila.')}
        {linha('vendedor', 'Avisar o vendedor da decisão', 'Aprovado ou recusado, com o comentário do aprovador.')}
        {linha('resumo', 'Resumo diário para a gerência', 'Às 18h, os pedidos aprovados e recusados no dia.')}
      </Card.Body>
      <RodapeDeSalvar {...ajustes} />
    </>
  );
}

function DesligarAprovacao() {
  return (
    <Card.Body>
      <FieldRow description="Os 14 pedidos aguardando seguem para separação com o desconto que têm." label="Pedidos na fila">
        {({ describedBy }) => <Button aria-describedby={describedBy} variant="danger">Desligar aprovação</Button>}
      </FieldRow>
    </Card.Body>
  );
}

interface Secao {
  acao?: string;
  corpo: ReactNode;
  explicacao: string;
  id: string;
  titulo: string;
}

const SECOES: readonly Secao[] = [
  { id: 'limites', titulo: 'Limites', explicacao: 'Até onde o vendedor concede sozinho, e o teto com aprovação.', corpo: <Limites /> },
  { id: 'aprovadores', titulo: 'Quem aprova', explicacao: 'Os aprovadores e até quanto cada um libera.', acao: 'Adicionar aprovador', corpo: <QuemAprova /> },
  { id: 'avisos', titulo: 'Avisos', explicacao: 'Quem fica sabendo de cada pedido em aprovação.', corpo: <Avisos /> },
  { id: 'perigo', titulo: 'Desligar a aprovação', explicacao: 'Para todas as carteiras, até ser ligada de novo.', corpo: <DesligarAprovacao /> },
];

function BotaoDaAcao({ rotulo }: { rotulo: string }) {
  return (
    <Button size="sm" variant="ghost">
      <IconPlus />
      {rotulo}
    </Button>
  );
}

function CartaoComTitulo({ secao }: { secao: Secao }) {
  return (
    <Card id={`secao-${secao.id}`}>
      <Card.Header
        description={secao.explicacao}
        headingLevel={2}
        title={secao.titulo}
        trailing={secao.acao ? <BotaoDaAcao rotulo={secao.acao} /> : undefined}
      />
      {secao.corpo}
    </Card>
  );
}

function Secoes({ arranjo }: { arranjo: Arranjo }) {
  if (arranjo === 'anotado') {
    return SECOES.map((secao) => (
      <AnnotatedSection
        action={secao.acao ? <BotaoDaAcao rotulo={secao.acao} /> : undefined}
        description={secao.explicacao}
        key={secao.id}
        title={secao.titulo}
      >
        <Card>{secao.corpo}</Card>
      </AnnotatedSection>
    ));
  }

  const empilhadas = (
    <Stack>
      {SECOES.map((secao) => (
        <CartaoComTitulo key={secao.id} secao={secao} />
      ))}
    </Stack>
  );

  return arranjo === 'indice' ? (
    <Columns>
      <Columns.Main>{empilhadas}</Columns.Main>
      <Columns.Index items={SECOES.map(({ id, titulo }) => ({ id: `secao-${id}`, label: titulo }))} />
    </Columns>
  ) : (
    empilhadas
  );
}

export function ConfiguracaoSecao({ arranjo }: { arranjo: Arranjo }) {
  return (
    <Pagina caminho={['Configurações', 'Descontos e aprovação']}>
      <PageHeader maxWidth={`${LARGURAS[arranjo]}px`}>
        <PageHeader.Title>Descontos e aprovação</PageHeader.Title>
        <PageHeader.Badges>
          <Badge tone="success">Aprovação ligada</Badge>
        </PageHeader.Badges>
        <PageHeader.Description>Até onde o vendedor concede sozinho, e quem aprova acima disso.</PageHeader.Description>
      </PageHeader>
      <Coluna largura={LARGURAS[arranjo]}>
        <Secoes arranjo={arranjo} />
      </Coluna>
    </Pagina>
  );
}
