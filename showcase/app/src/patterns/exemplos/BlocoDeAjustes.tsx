import { useState } from 'react';
import { Button, Card, Dialog, FieldRow, IconUndo, InputNumber, Stack, Switch, showToast } from '@plenustech/design-system';

const PADRAO = { limite: 10, aviso: true, resumo: false };

export function BlocoDeAjustes() {
  const [ajustes, setAjustes] = useState(PADRAO);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <Stack>
      <Card>
        {/* A ação do bloco vai no trailing do cabeçalho, e o título nomeia a região. */}
        <Card.Header
          description="O que vale para todos os pedidos do espaço."
          headingLevel={2}
          title="Aprovação de pedidos"
          trailing={
            <Button onClick={() => setAjustes(PADRAO)} size="sm" variant="ghost">
              <IconUndo />
              Restaurar padrões
            </Button>
          }
        />
        <Card.Body flush>
          <FieldRow description="Até este valor, o pedido segue sem aprovação." label="Desconto sem aprovação">
            {({ describedBy, id }) => (
              <InputNumber
                aria-describedby={describedBy}
                id={id}
                onValueChange={(limite) => setAjustes({ ...ajustes, limite: limite ?? 0 })}
                unit="%"
                value={ajustes.limite}
              />
            )}
          </FieldRow>
          <FieldRow description="Assim que o pedido entra na fila de aprovação." label="Avisar o aprovador por e-mail">
            {({ describedBy, id }) => (
              <Switch aria-describedby={describedBy} checked={ajustes.aviso} id={id} onCheckedChange={(aviso) => setAjustes({ ...ajustes, aviso })} />
            )}
          </FieldRow>
          <FieldRow description="Às 18h, os pedidos aprovados e recusados no dia." label="Resumo diário para a gerência">
            {({ describedBy, id }) => (
              <Switch aria-describedby={describedBy} checked={ajustes.resumo} id={id} onCheckedChange={(resumo) => setAjustes({ ...ajustes, resumo })} />
            )}
          </FieldRow>
        </Card.Body>
      </Card>

      {/* O cartão de perigo vai por último, separado dos ajustes comuns, e a ação pede confirmação. */}
      <Card>
        <Card.Header description="Apaga o espaço e tudo o que há nele." headingLevel={2} title="Excluir o espaço" />
        <Card.Body flush>
          <FieldRow description="A exclusão não pode ser desfeita." label="Espaço de trabalho">
            {({ describedBy }) => (
              <Button aria-describedby={describedBy} onClick={() => setConfirmando(true)} variant="danger">
                Excluir espaço
              </Button>
            )}
          </FieldRow>
        </Card.Body>
      </Card>
      <Dialog
        description="Todos os pedidos e ajustes do espaço serão apagados."
        footer={
          <>
            <Button onClick={() => setConfirmando(false)} variant="secondary">Cancelar</Button>
            <Button
              onClick={() => {
                setConfirmando(false);
                // No produto, a exclusão leva para fora do espaço. Aqui, o aviso confirma, e o foco volta ao botão que abriu.
                showToast({ title: 'Espaço excluído', tone: 'success' });
              }}
              variant="danger"
            >
              Excluir espaço
            </Button>
          </>
        }
        onOpenChange={setConfirmando}
        open={confirmando}
        role="alertdialog"
        size="sm"
        title="Excluir o espaço?"
      />
    </Stack>
  );
}
