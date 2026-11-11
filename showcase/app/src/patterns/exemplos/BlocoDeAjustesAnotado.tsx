import { useState } from 'react';
import { AnnotatedSection, Button, Card, Dialog, FieldRow, IconUndo, InputNumber, Switch, showToast } from '@plenustech/design-system';

const PADRAO = { limite: 10, aviso: true };

export function BlocoDeAjustesAnotado() {
  const [ajustes, setAjustes] = useState(PADRAO);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <>
      {/* Título e explicação no trilho à esquerda; o cartão com as linhas à direita. A ação do bloco vai em action. */}
      <AnnotatedSection
        action={
          <Button onClick={() => setAjustes(PADRAO)} size="sm" variant="ghost">
            <IconUndo />
            Restaurar padrões
          </Button>
        }
        description="O que vale para todos os pedidos do espaço."
        title="Aprovação de pedidos"
      >
        <Card>
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
          </Card.Body>
        </Card>
      </AnnotatedSection>

      <AnnotatedSection description="Apaga o espaço e tudo o que há nele." title="Excluir o espaço">
        <Card>
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
      </AnnotatedSection>
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
    </>
  );
}
