import type { BadgeTone } from '@plenustech/design-system';

/** Dados locais das composições. São de exemplo; nenhum vem de um sistema real. */

export type SituacaoDoPedido = 'entregue' | 'separacao' | 'aprovacao' | 'atrasado';

/** O rótulo e o tom do selo de uma situação. Toda situação do Showcase se escreve assim, e `SeloDaSituacao` a desenha. */
export interface Situacao {
  rotulo: string;
  tom: BadgeTone;
}

export const SITUACOES: Record<SituacaoDoPedido, Situacao> = {
  entregue: { rotulo: 'Entregue', tom: 'success' },
  separacao: { rotulo: 'Em separação', tom: 'info' },
  aprovacao: { rotulo: 'Aguardando aprovação', tom: 'warning' },
  atrasado: { rotulo: 'Atrasado', tom: 'danger' },
};

export const CLIENTES = [
  'Auto Peças Boa Viagem Ltda',
  'Transportes Rota Sul',
  'Mecânica Irmãos Duarte',
  'Agropecuária Vale Verde',
  'Posto Estrela do Oeste',
  'Oficina do Zé Carlos',
  'Distribuidora Planalto',
  'Frota Express Logística',
  'Retífica Santa Cruz',
  'Pneus & Cia Centro',
  'Fazenda São Jorge',
  'Auto Center Aurora',
];

export const VENDEDORES = ['Ana Ribeiro', 'Rui Teixeira', 'Marcos Lima', 'Paula Nogueira'];

export interface Pedido {
  id: string;
  cliente: string;
  data: Date;
  numero: number;
  situacao: SituacaoDoPedido;
  total: number;
  vendedor: string;
}

const HOJE = new Date(2026, 10, 3);

export const diasAtras = (dias: number) => new Date(HOJE.getFullYear(), HOJE.getMonth(), HOJE.getDate() - dias);

export const ITENS_DO_PEDIDO = [
  { id: 'PF-2204', nome: 'Pastilha de freio dianteira', quantidade: 4, unitario: 189.9 },
  { id: 'DF-3318', nome: 'Disco de freio ventilado', quantidade: 2, unitario: 412 },
  { id: 'FO-1180', nome: 'Filtro de óleo', quantidade: 10, unitario: 38.5 },
  { id: 'OL-1540', nome: 'Óleo 15W40, balde de 20 L', quantidade: 3, unitario: 389 },
  { id: 'KR-0932', nome: 'Kit de reparo de cabeçote', quantidade: 1, unitario: 1260 },
];

/** O desconto que o pedido de exemplo recebe, em fração, e o teto acima do qual ele pede aprovação. */
export const DESCONTO_DO_PEDIDO = 0.05;

export const SUBTOTAL = ITENS_DO_PEDIDO.reduce((soma, item) => soma + item.quantidade * item.unitario, 0);
export const DESCONTO = Math.round(SUBTOTAL * DESCONTO_DO_PEDIDO * 100) / 100;
export const FRETE = 120;
export const TOTAL = SUBTOTAL - DESCONTO + FRETE;

function gerarPedidos(): Pedido[] {
  let semente = 11;
  const sortear = () => (semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648;

  return Array.from({ length: 48 }, (_, indice) => {
    const sorteio = sortear();
    const entregues = Math.min(0.85, 0.12 + indice * 0.03);
    const situacao: SituacaoDoPedido =
      indice === 0
        ? 'aprovacao'
        : sorteio < entregues
          ? 'entregue'
          : sorteio < entregues + 0.2
            ? 'separacao'
            : sorteio < entregues + 0.33
              ? 'aprovacao'
              : 'atrasado';
    const numero = 48211 - indice;

    return {
      id: String(numero),
      numero,
      cliente: indice === 0 ? CLIENTES[0] : CLIENTES[Math.floor(sortear() * CLIENTES.length)],
      vendedor: indice === 0 ? VENDEDORES[0] : VENDEDORES[Math.floor(sortear() * VENDEDORES.length)],
      data: diasAtras(Math.floor(indice / 2)),
      situacao,
      total: indice === 0 ? TOTAL : Math.round((480 + sortear() * 13500) * 100) / 100,
    };
  });
}

export const PEDIDOS = gerarPedidos();

export const PEDIDOS_POR_DIA = [31, 42, 38, 47, 29, 12, 8, 44, 51, 46, 58, 49, 33, 55];
export const DIAS_DO_GRAFICO = PEDIDOS_POR_DIA.map((_, indice) => String(diasAtras(13 - indice).getDate()).padStart(2, '0'));

export const PRODUTOS = [
  { id: 'PF-2204', descricao: 'Pastilha de freio dianteira', unidade: 'Jogo', preco: 189.9, estoque: 46, minimo: 20 },
  { id: 'DF-3318', descricao: 'Disco de freio ventilado', unidade: 'Un', preco: 412, estoque: 12, minimo: 16 },
  { id: 'FO-1180', descricao: 'Filtro de óleo', unidade: 'Un', preco: 38.5, estoque: 210, minimo: 80 },
  { id: 'OL-1540', descricao: 'Óleo 15W40, balde de 20 L', unidade: 'Balde', preco: 389, estoque: 31, minimo: 12 },
  { id: 'KR-0932', descricao: 'Kit de reparo de cabeçote', unidade: 'Kit', preco: 1260, estoque: 4, minimo: 6 },
  { id: 'CB-0450', descricao: 'Correia dentada 450 mm', unidade: 'Un', preco: 96.7, estoque: 58, minimo: 24 },
  { id: 'AM-7710', descricao: 'Amortecedor traseiro reforçado', unidade: 'Un', preco: 534, estoque: 9, minimo: 10 },
  { id: 'BT-6012', descricao: 'Bateria 60 Ah', unidade: 'Un', preco: 612.9, estoque: 22, minimo: 8 },
];

export const DEPOSITOS = [
  { id: 'matriz', nome: 'Matriz · Centro de distribuição', tipo: 'Principal', local: 'Santa Aurora, GO', responsavel: 'Marcos Lima', itens: 2840, ocupacao: 82 },
  { id: 'centro', nome: 'Loja Centro', tipo: 'Loja', local: 'Av. das Palmeiras, 1200', responsavel: 'Paula Nogueira', itens: 960, ocupacao: 54 },
  { id: 'rodovia', nome: 'Loja Rodovia', tipo: 'Loja', local: 'BR-242, km 5', responsavel: 'Rui Teixeira', itens: 1210, ocupacao: 67 },
  { id: 'avarias', nome: 'Depósito de avarias', tipo: 'Avarias', local: 'Matriz, galpão 2', responsavel: 'Marcos Lima', itens: 74, ocupacao: 18 },
  { id: 'transito', nome: 'Mercadoria em trânsito', tipo: 'Virtual', local: 'Sem endereço físico', responsavel: 'Ana Ribeiro', itens: 312, ocupacao: 0 },
];

export type ParDoLancamento = 'ok' | 'sugerido' | 'sem';

export const PARES_DO_LANCAMENTO: Record<ParDoLancamento, Situacao> = {
  ok: { rotulo: 'Conciliado', tom: 'success' },
  sugerido: { rotulo: 'Par sugerido', tom: 'warning' },
  sem: { rotulo: 'Sem par', tom: 'neutral' },
};

export const TIPOS_DE_DEPOSITO: Record<string, Situacao> = {
  Principal: { rotulo: 'Principal', tom: 'info' },
  Loja: { rotulo: 'Loja', tom: 'neutral' },
  Avarias: { rotulo: 'Avarias', tom: 'neutral' },
  Virtual: { rotulo: 'Virtual', tom: 'neutral' },
};

export const CONTA_ATIVA: Situacao = { rotulo: 'Ativa', tom: 'success' };

export const ESTOQUE_ABAIXO_DO_MINIMO: Situacao = { rotulo: 'Abaixo do mínimo', tom: 'danger' };

export const LANCAMENTOS: { id: string; data: Date; descricao: string; par: ParDoLancamento; referencia: string; valor: number }[] = [
  { id: '1', data: diasAtras(0), descricao: 'TED recebida · Auto Center Aurora', valor: 2840, par: 'ok', referencia: 'Pedido #48198' },
  { id: '2', data: diasAtras(0), descricao: 'Boleto compensado · Transportes Rota Sul', valor: 6210.4, par: 'sugerido', referencia: 'Pedido #48187' },
  { id: '3', data: diasAtras(1), descricao: 'Tarifa mensal de manutenção', valor: -49.9, par: 'sem', referencia: '' },
  { id: '4', data: diasAtras(1), descricao: 'Pix · Posto Estrela do Oeste', valor: 1380, par: 'sugerido', referencia: 'Pedido #48176' },
  { id: '5', data: diasAtras(2), descricao: 'Pagamento · Distribuidora Planalto', valor: -9420, par: 'ok', referencia: 'Conta a pagar #2291' },
  { id: '6', data: diasAtras(2), descricao: 'Pix · Oficina do Zé Carlos', valor: 715.5, par: 'ok', referencia: 'Pedido #48169' },
  { id: '7', data: diasAtras(3), descricao: 'Depósito em dinheiro', valor: 1500, par: 'sem', referencia: '' },
];

/** Números fictícios da Base de Clientes: os totais por estado, tipo e conceito somam os 1.984 ativos. */
export const CLIENTES_POR_ESTADO = [
  ['GO', 812], ['MT', 344], ['TO', 231], ['BA', 198], ['MS', 141], ['PA', 96], ['MG', 87], ['DF', 75],
] as const;
export const CLIENTES_POR_BAIRRO = [
  ['Centro', 214], ['Vila Nova', 133], ['Zona Rural', 118], ['Jardim América', 97], ['São José', 82], ['Bela Vista', 61],
] as const;
export const CLIENTES_POR_TIPO = [
  { label: 'Jurídica', value: 1012 },
  { label: 'Física', value: 731 },
  { label: 'Produtor Rural', value: 241 },
];
export const CLIENTES_POR_CONCEITO = [
  ['Limite e atraso', 1215], ['Somente atraso', 702], ['Venda bloqueada', 31], ['Só à vista', 22], ['Venda liberada', 14],
] as const;

export const GRUPOS_DE_CONFIGURACAO: readonly {
  nome: string;
  itens: readonly (readonly [nome: string, estado: string, alerta?: boolean])[];
}[] = [
  {
    nome: 'Empresa',
    itens: [
      ['Dados da empresa', 'Razão social, CNPJ e logotipo'],
      ['Usuários e permissões', '12 usuários, 4 perfis'],
      ['Filiais', 'Matriz e 4 lojas'],
      ['Plano e cobrança', 'Plano Gestão, renova em 12/2026'],
    ],
  },
  {
    nome: 'Vendas',
    itens: [
      ['Tabelas de preço', 'Por carteira, região ou cliente'],
      ['Descontos e aprovação', 'Até 5% sem aprovação, 2 aprovadores'],
      ['Comissões', 'Regras por vendedor e produto'],
      ['Canais de venda', 'Loja, representante, online'],
    ],
  },
  {
    nome: 'Financeiro e fiscal',
    itens: [
      ['Contas bancárias', '2 conectadas, 1 por OFX'],
      ['Formas de pagamento', 'Boleto, Pix, cartão e prazos'],
      ['Certificado digital', 'Vence em 18 dias', true],
      ['Notas fiscais', 'Série, numeração e envio por e-mail'],
    ],
  },
  {
    nome: 'Sistema',
    itens: [
      ['Integrações', 'Marketplaces, transportadoras e API'],
      ['Notificações', 'O que avisa, por e-mail ou no sistema'],
      ['Importação de dados', 'Planilhas de clientes, produtos e saldos'],
      ['Registro de auditoria', 'Quem mudou o quê, e quando'],
    ],
  },
];

export const APROVADORES = [
  { id: 'rt', nome: 'Rui Teixeira', papel: 'Gerente comercial · todas as carteiras', limite: 15 },
  { id: 'ar', nome: 'Ana Ribeiro', papel: 'Administradora · carteira Sul', limite: 10 },
];
