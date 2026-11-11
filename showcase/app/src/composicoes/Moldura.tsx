import type { ReactNode } from 'react';
import { AppShell, Avatar, IconClock, IconStar, IconStructure, Sidebar, Text } from '@plenustech/design-system';
import { IconPerson, IconShieldCheck } from '@plenustech/design-system/icons';
import { CAMINHO_DAS_COMPOSICOES, MODULOS, MODULO_DE_CONFIGURACOES, type Modulo } from './menu';

const hrefDe = (rota: string) => `${CAMINHO_DAS_COMPOSICOES}/${rota}`;

function Marca() {
  return (
    <span aria-hidden="true" className="moldura-marca">
      <IconStructure size={20} />
    </span>
  );
}

function MarcaDoSubmenu() {
  return (
    <span className="moldura-marca-texto">
      <Text variant="title">Gestor</Text>
      <Text tone="tertiary" variant="micro">by Plenustech</Text>
    </span>
  );
}

function ContaDoUsuario() {
  return (
    <Sidebar.Account avatar={<Avatar name="Suporte" />} description="Roman Mecânica Ltda" name="Suporte">
      <Sidebar.Item icon={<IconStar size={18} />} label="Favoritos" />
      <Sidebar.Item icon={<IconClock size={18} />} label="Atividade recente" />
      <Sidebar.Item icon={<IconShieldCheck size={18} />} label="Administração" />
      <Sidebar.Item icon={<IconPerson size={18} />} label="Meu perfil" />
    </Sidebar.Account>
  );
}

function ItemDoModulo({ atual, modulo }: { atual: boolean; modulo: Modulo }) {
  return <Sidebar.RailItem current={atual} href={hrefDe(modulo.grupos[0].itens[0].rota)} icon={modulo.icone} label={modulo.nome} />;
}

interface MolduraProps {
  children: ReactNode;
  /** A rota do item do submenu que marca a página atual. */
  item: string;
  modulo: string;
}

/** A moldura da aplicação de exemplo: trilho de módulos, submenu e a página que vem em `children`. */
export function Moldura({ children, item, modulo }: MolduraProps) {
  const atual = [...MODULOS, MODULO_DE_CONFIGURACOES].find((candidato) => candidato.id === modulo) ?? MODULOS[0];

  return (
    <AppShell>
      <Sidebar>
        <Sidebar.Rail
          brand={<Marca />}
          footer={
            <>
              <ItemDoModulo atual={atual.id === MODULO_DE_CONFIGURACOES.id} modulo={MODULO_DE_CONFIGURACOES} />
              <Sidebar.RailAccount label="Conta: Suporte, Roman Mecânica">
                <Avatar name="Suporte" size="sm" />
              </Sidebar.RailAccount>
            </>
          }
        >
          {MODULOS.map((candidato) => (
            <ItemDoModulo atual={candidato.id === atual.id} key={candidato.id} modulo={candidato} />
          ))}
        </Sidebar.Rail>
        <Sidebar.Panel account={<ContaDoUsuario />} brand={<MarcaDoSubmenu />} label={atual.nome}>
          {atual.grupos.map((grupo) => {
            const itens = grupo.itens.map((entrada) => (
              <Sidebar.Item
                current={entrada.rota === item}
                href={hrefDe(entrada.rota)}
                icon={entrada.icone}
                key={entrada.rota}
                label={entrada.nome}
              />
            ));

            return grupo.nome ? (
              <Sidebar.Group key={grupo.nome} label={grupo.nome}>
                {itens}
              </Sidebar.Group>
            ) : (
              itens
            );
          })}
        </Sidebar.Panel>
      </Sidebar>
      {children}
    </AppShell>
  );
}
