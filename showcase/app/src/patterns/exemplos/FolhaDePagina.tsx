import { useRef, useState } from 'react';
import {
  AppShell,
  Breadcrumb,
  Button,
  Card,
  Container,
  IconFile,
  IconStructure,
  InputText,
  PageHeader,
  Sidebar,
} from '@plenustech/design-system';

/** A largura da coluna: o cabeçalho e o conteúdo recebem a mesma, e por isso alinham na mesma borda. */
const LARGURA = '760px';

export function FolhaDePagina() {
  const [nome, setNome] = useState('Filial Centro');
  const [salvo, setSalvo] = useState('Filial Centro');
  const alterado = nome !== salvo;
  // Salvar e descartar desabilitam os dois botões: o foco volta ao campo, e não cai no começo da página.
  const campo = useRef<HTMLInputElement>(null);

  function concluir(valor: string) {
    setNome(valor);
    setSalvo(valor);
    campo.current?.focus();
  }

  return (
    <AppShell defaultOpen={false}>
      <Sidebar>
        <Sidebar.Rail>
          <Sidebar.RailItem current icon={<IconStructure size={20} />} label="Empresa" />
        </Sidebar.Rail>
        <Sidebar.Panel label="Empresa">
          <Sidebar.Item current icon={<IconFile size={18} />} label="Filiais" />
        </Sidebar.Panel>
      </Sidebar>
      <AppShell.Page>
        <AppShell.PageBar>
          <Breadcrumb items={[{ label: 'Empresa' }, { label: 'Filiais' }, { label: salvo }]} />
        </AppShell.PageBar>
        <AppShell.PageBody>
          <PageHeader maxWidth={LARGURA}>
            <PageHeader.Title>Dados da filial</PageHeader.Title>
            <PageHeader.Description>O nome e o endereço aparecem nos documentos emitidos por esta filial.</PageHeader.Description>
          </PageHeader>
          {/* O respiro vertical é de quem usa o Container: ele só cuida do lateral. */}
          <Container maxWidth={LARGURA} style={{ paddingBlock: 'var(--pl-space-5)' }}>
            <Card>
              <Card.Header description="Como a filial é identificada no sistema." headingLevel={2} title="Identificação" />
              <Card.Body>
                <InputText label="Nome da filial" onValueChange={setNome} ref={campo} value={nome} />
              </Card.Body>
            </Card>
          </Container>
        </AppShell.PageBody>
        <AppShell.PageFooter status={alterado ? 'Alterações não salvas' : 'Sem alterações'}>
          <Button disabled={!alterado} onClick={() => concluir(salvo)} size="sm" variant="secondary">Descartar</Button>
          <Button disabled={!alterado} onClick={() => concluir(nome)} size="sm">Salvar</Button>
        </AppShell.PageFooter>
      </AppShell.Page>
    </AppShell>
  );
}
