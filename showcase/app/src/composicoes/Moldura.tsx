import type { ReactNode } from 'react';
import { AppShell, Avatar, IconClock, IconStar, IconStructure } from '@plenustech/design-system';
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
      <strong>Gestor</strong>
      <span>by Plenustech</span>
    </span>
  );
}

function ContaDoUsuario() {
  return (
    <AppShell.Account avatar={<Avatar name="Suporte" />} description="Mecânica Irmãos Duarte Ltda" name="Suporte">
      <AppShell.PanelItem icon={<IconStar size={18} />} label="Favoritos" />
      <AppShell.PanelItem icon={<IconClock size={18} />} label="Atividade recente" />
      <AppShell.PanelItem icon={<IconShieldCheck size={18} />} label="Administração" />
      <AppShell.PanelItem icon={<IconPerson size={18} />} label="Meu perfil" />
    </AppShell.Account>
  );
}

function ItemDoModulo({ atual, modulo }: { atual: boolean; modulo: Modulo }) {
  return <AppShell.RailItem current={atual} href={hrefDe(modulo.grupos[0].itens[0].rota)} icon={modulo.icone} label={modulo.nome} />;
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
      <AppShell.Navigation>
        <AppShell.Rail
          brand={<Marca />}
          footer={
            <>
              <ItemDoModulo atual={atual.id === MODULO_DE_CONFIGURACOES.id} modulo={MODULO_DE_CONFIGURACOES} />
              <AppShell.RailAccount label="Conta: Suporte, Mecânica Irmãos Duarte">
                <Avatar name="Suporte" size="sm" />
              </AppShell.RailAccount>
            </>
          }
        >
          {MODULOS.map((candidato) => (
            <ItemDoModulo atual={candidato.id === atual.id} key={candidato.id} modulo={candidato} />
          ))}
        </AppShell.Rail>
        <AppShell.Panel account={<ContaDoUsuario />} brand={<MarcaDoSubmenu />} label={atual.nome}>
          {atual.grupos.map((grupo) => {
            const itens = grupo.itens.map((entrada) => (
              <AppShell.PanelItem
                current={entrada.rota === item}
                href={hrefDe(entrada.rota)}
                icon={entrada.icone}
                key={entrada.rota}
                label={entrada.nome}
              />
            ));

            return grupo.nome ? (
              <AppShell.PanelGroup key={grupo.nome} label={grupo.nome}>
                {itens}
              </AppShell.PanelGroup>
            ) : (
              itens
            );
          })}
        </AppShell.Panel>
      </AppShell.Navigation>
      {children}
    </AppShell>
  );
}
