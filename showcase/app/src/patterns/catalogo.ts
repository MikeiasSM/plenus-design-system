import { pattern as folhaDePagina } from './paginas/FolhaDePagina';
import { pattern as painelDeFiltros } from './paginas/PainelDeFiltros';
import { pattern as barraDaTabela } from './paginas/BarraDaTabela';
import { pattern as visoesSalvas } from './paginas/VisoesSalvas';
import { pattern as salvarPorCartao } from './paginas/SalvarPorCartao';
import { pattern as blocoDeAjustes } from './paginas/BlocoDeAjustes';
import { pattern as colunaDeAcaoDeLinha } from './paginas/ColunaDeAcaoDeLinha';
import { pattern as totaisNoRodape } from './paginas/TotaisNoRodape';
import { pattern as assistente } from './paginas/Assistente';
import { pattern as vazioDaPrimeiraVez } from './paginas/VazioDaPrimeiraVez';
import { pattern as controleDoUsuario } from './paginas/ControleDoUsuario';
import { pattern as menuDeAcoesDoCabecalho } from './paginas/MenuDeAcoesDoCabecalho';
import type { Pattern } from './tipos';

export const ROTA_DOS_PATTERNS = 'patterns';
export const CAMINHO_DOS_PATTERNS = `#/${ROTA_DOS_PATTERNS}`;

/** Os patterns, na ordem em que o índice e o menu os mostram. */
export const patterns: readonly Pattern[] = [
  folhaDePagina,
  painelDeFiltros,
  barraDaTabela,
  visoesSalvas,
  salvarPorCartao,
  blocoDeAjustes,
  colunaDeAcaoDeLinha,
  totaisNoRodape,
  assistente,
  vazioDaPrimeiraVez,
  controleDoUsuario,
  menuDeAcoesDoCabecalho,
];
