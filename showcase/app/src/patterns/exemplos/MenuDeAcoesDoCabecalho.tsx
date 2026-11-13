import { useRef, useState } from 'react';
import { Badge, Button, ButtonIcon, Dialog, IconMore, IconPencil, Menu, PageHeader, showToast } from '@plenustech/design-system';

type Situacao = 'aguardando' | 'aprovado' | 'cancelado';

const SELOS: Record<Situacao, { rotulo: string; tom: 'warning' | 'success' | 'danger' }> = {
  aguardando: { rotulo: 'Aguardando aprovação', tom: 'warning' },
  aprovado: { rotulo: 'Aprovado', tom: 'success' },
  cancelado: { rotulo: 'Cancelado', tom: 'danger' },
};

/** O destino da edição. No produto, é a rota da tela de edição; aqui, a própria seção do exemplo. */
const DESTINO_DA_EDICAO = '#/patterns/menu-de-acoes-do-cabecalho/exemplo';

export function MenuDeAcoesDoCabecalho() {
  const [situacao, setSituacao] = useState<Situacao>('aguardando');
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const editar = useRef<HTMLAnchorElement>(null);
  const aberto = situacao !== 'cancelado';

  return (
    <>
      <PageHeader>
        <PageHeader.Title>Pedido #1042</PageHeader.Title>
        <PageHeader.Badges>
          <Badge tone={SELOS[situacao].tom}>{SELOS[situacao].rotulo}</Badge>
        </PageHeader.Badges>
        <PageHeader.Description>Revise os itens antes de aprovar.</PageHeader.Description>
        <PageHeader.Actions>
          {/* O que passa de duas secundárias fica no menu; o gatilho é um botão só de ícone, com nome. */}
          <Menu
            items={[
              // O retorno de uma operação é um aviso, e não um texto trocado na página.
              { key: 'duplicar', label: 'Duplicar pedido', onSelect: () => showToast({ title: 'Pedido duplicado', tone: 'success' }) },
              { key: 'exportar', label: 'Exportar em PDF', onSelect: () => showToast({ title: 'PDF gerado', tone: 'success' }) },
              // A ação que destrói pede confirmação antes de valer.
              { key: 'cancelar', label: 'Cancelar pedido', tone: 'danger', disabled: !aberto, onSelect: () => setConfirmandoCancelamento(true) },
            ]}
            label="Mais ações"
          >
            <ButtonIcon icon={<IconMore />} label="Mais ações" />
          </Menu>
          {/* Ação que leva a outra página é link, não botão: abre em outra aba e tem o endereço copiável. */}
          <Button href={DESTINO_DA_EDICAO} ref={editar} variant="secondary">
            <IconPencil />
            Editar
          </Button>
          {/* A principal, por último. Depois de aprovar, ela fica desabilitada, e o foco passa à ação ao lado. */}
          <Button
            disabled={situacao !== 'aguardando'}
            onClick={() => {
              setSituacao('aprovado');
              editar.current?.focus();
            }}
          >
            Aprovar pedido
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      <Dialog
        description="O pedido sai da fila de aprovação e não pode ser reaberto."
        footer={
          <>
            <Button onClick={() => setConfirmandoCancelamento(false)} variant="secondary">Manter pedido</Button>
            <Button
              onClick={() => {
                setSituacao('cancelado');
                setConfirmandoCancelamento(false);
              }}
              variant="danger"
            >
              Cancelar pedido
            </Button>
          </>
        }
        onOpenChange={setConfirmandoCancelamento}
        open={confirmandoCancelamento}
        role="alertdialog"
        size="sm"
        title="Cancelar o pedido #1042?"
      />
    </>
  );
}
