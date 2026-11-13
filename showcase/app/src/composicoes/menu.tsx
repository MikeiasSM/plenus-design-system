import type { ReactNode } from 'react';
import { IconPlus } from '@plenustech/design-system';
import {
  IconBank,
  IconBoxSeam,
  IconCheck2Circle,
  IconFileEarmarkText,
  IconGear,
  IconGrid,
  IconHouse,
  IconListUl,
  IconPeople,
  IconTable,
  IconTruck,
} from '@plenustech/design-system/icons';

export const ROTA_DAS_COMPOSICOES = 'composicoes';
export const CAMINHO_DAS_COMPOSICOES = `#/${ROTA_DAS_COMPOSICOES}`;

interface EntradaDoMenu {
  icone: ReactNode;
  nome: string;
  rota: string;
}

interface GrupoDoMenu {
  itens: readonly EntradaDoMenu[];
  nome?: string;
}

export interface Modulo {
  grupos: readonly [GrupoDoMenu, ...GrupoDoMenu[]];
  icone: ReactNode;
  id: string;
  nome: string;
}

const icone = (Icone: typeof IconHouse) => <Icone size={18} />;

/** Os módulos da aplicação de exemplo e os itens do submenu de cada um. */
export const MODULOS: readonly Modulo[] = [
  {
    id: 'inicio',
    nome: 'Início',
    icone: <IconHouse size={20} />,
    grupos: [{ itens: [{ rota: 'inicio', nome: 'Tela inicial', icone: icone(IconHouse) }] }],
  },
  {
    id: 'vendas',
    nome: 'Vendas',
    icone: <IconListUl size={20} />,
    grupos: [
      {
        itens: [
          { rota: 'pedidos', nome: 'Pedidos', icone: icone(IconListUl) },
          { rota: 'pedido', nome: 'Pedido #48211', icone: icone(IconFileEarmarkText) },
          { rota: 'novo-pedido', nome: 'Novo pedido', icone: icone(IconPlus) },
        ],
      },
    ],
  },
  {
    id: 'clientes',
    nome: 'Clientes',
    icone: <IconPeople size={20} />,
    grupos: [
      {
        itens: [
          { rota: 'clientes-base', nome: 'Base de clientes', icone: icone(IconGrid) },
          { rota: 'novo-cliente', nome: 'Novo cliente', icone: icone(IconPlus) },
        ],
      },
    ],
  },
  {
    id: 'estoque',
    nome: 'Estoque',
    icone: <IconBoxSeam size={20} />,
    grupos: [
      {
        itens: [
          { rota: 'depositos', nome: 'Depósitos', icone: icone(IconTruck) },
          { rota: 'produtos', nome: 'Produtos', icone: icone(IconBoxSeam) },
        ],
      },
    ],
  },
  {
    id: 'financeiro',
    nome: 'Financeiro',
    icone: <IconBank size={20} />,
    grupos: [
      {
        itens: [
          { rota: 'conciliacao', nome: 'Conciliação', icone: icone(IconCheck2Circle) },
          { rota: 'contas', nome: 'Contas bancárias', icone: icone(IconBank) },
        ],
      },
    ],
  },
];

/** Configurações ficam no grupo fixo do pé do trilho. */
export const MODULO_DE_CONFIGURACOES: Modulo = {
  id: 'configuracoes',
  nome: 'Configurações',
  icone: <IconGear size={20} />,
  grupos: [
    { itens: [{ rota: 'configuracoes', nome: 'Visão geral', icone: icone(IconTable) }] },
    {
      nome: 'Vendas',
      itens: [{ rota: 'configuracao-anotada', nome: 'Descontos e aprovação', icone: icone(IconListUl) }],
    },
  ],
};
