import { useState } from 'react';
import { AppShell, Avatar, Button, IconStructure, Sidebar, Text } from '@plenustech/design-system';
import { IconBoxArrowRight, IconGear, IconPerson } from '@plenustech/design-system/icons';

/** Uma só fonte: o avatar, o nome acessível do trilho e o painel da conta saem todos daqui. */
const USUARIO = { empresa: 'Mecânica Horizonte', nome: 'Helena Prado' };

/** O destino das opções que levam a outra tela. No produto, é a rota de cada uma; aqui, a própria seção do exemplo. */
const DESTINO = '#/patterns/controle-do-usuario/exemplo';

export function ControleDoUsuario() {
  const [sessaoAtiva, setSessaoAtiva] = useState(true);

  if (!sessaoAtiva) {
    return (
      <Text as="p">
        Sessão encerrada. <Button onClick={() => setSessaoAtiva(true)} size="sm" variant="secondary">Entrar de novo</Button>
      </Text>
    );
  }

  return (
    <AppShell>
      <Sidebar>
        <Sidebar.Rail
          footer={
            // O avatar do trilho só aparece com o submenu recolhido; ele abre o submenu já na conta.
            <Sidebar.RailAccount label={`Conta: ${USUARIO.nome}, ${USUARIO.empresa}`}>
              <Avatar name={USUARIO.nome} size="sm" />
            </Sidebar.RailAccount>
          }
        >
          <Sidebar.RailItem current icon={<IconStructure size={20} />} label="Início" />
        </Sidebar.Rail>
        <Sidebar.Panel
          account={
            <Sidebar.Account avatar={<Avatar name={USUARIO.nome} />} description={USUARIO.empresa} name={USUARIO.nome}>
              <Sidebar.Item href={DESTINO} icon={<IconPerson size={18} />} label="Meu perfil" />
              <Sidebar.Item href={DESTINO} icon={<IconGear size={18} />} label="Preferências" />
              <Sidebar.Item icon={<IconBoxArrowRight size={18} />} label="Sair" onClick={() => setSessaoAtiva(false)} />
            </Sidebar.Account>
          }
          label="Início"
        >
          <Sidebar.Item current icon={<IconStructure size={18} />} label="Tela inicial" />
        </Sidebar.Panel>
      </Sidebar>
      <AppShell.Page>
        <AppShell.PageBar />
        <AppShell.PageBody>
          <div style={{ padding: 'var(--pl-space-5)' }}>
            <Text as="p">
              Olá, {USUARIO.nome}. Abra a conta no pé do submenu; com o submenu recolhido, o avatar no trilho faz o mesmo.
            </Text>
          </div>
        </AppShell.PageBody>
      </AppShell.Page>
    </AppShell>
  );
}
