import { useRef, useState, type ReactNode } from 'react';
import { CalendarDate, CalendarDateTime, Time } from '@internationalized/date';
import {
  Alert, Avatar, Badge, Button, Checkbox, InputCurrency, InputText, InputNumber, InputPassword,
  Accordion, Breadcrumb, ComboBox, Dialog, Menu, Pagination, Popover, Progress, Radio,
  Card, DatePicker, DateTimePicker, List, RadioGroup, Select, Spinner, Switch, Table, Tabs, Textarea,
  TimePicker, Tooltip, formatarData, formatarHora,
} from '@plenus/index';

const estadosBrasileiros = [
  ['ac', 'Acre'], ['al', 'Alagoas'], ['ap', 'Amapa'], ['am', 'Amazonas'],
  ['ba', 'Bahia'], ['ce', 'Ceara'], ['df', 'Distrito Federal'], ['es', 'Espirito Santo'],
  ['go', 'Goias'], ['ma', 'Maranhao'], ['mt', 'Mato Grosso'], ['ms', 'Mato Grosso do Sul'],
  ['mg', 'Minas Gerais'], ['pa', 'Para'], ['pb', 'Paraiba'], ['pr', 'Parana'],
  ['pe', 'Pernambuco'], ['pi', 'Piaui'], ['rj', 'Rio de Janeiro'], ['rn', 'Rio Grande do Norte'],
  ['rs', 'Rio Grande do Sul'], ['ro', 'Rondonia'], ['rr', 'Roraima'], ['sc', 'Santa Catarina'],
  ['sp', 'Sao Paulo'], ['se', 'Sergipe'], ['to', 'Tocantins'],
].map(([value, label]) => ({ value, label }));

const muitasLinhas = Array.from({ length: 10000 }, (_, indice) => ({
  value: String(indice),
  label: 'Registro ' + String(indice + 1).padStart(5, '0'),
}));

type OrdemTabela = { column: string; direction: 'ascending' | 'descending' };

const equipe = [
  { id: '1', nome: 'Ana Prado', email: 'ana@plenustech.com', funcao: 'Administradora', status: 'Ativo' },
  { id: '2', nome: 'Bruno Dias', email: 'bruno@plenustech.com', funcao: 'Editor', status: 'Convidado' },
  { id: '3', nome: 'Celia Nunes', email: 'celia@plenustech.com', funcao: 'Leitora', status: 'Ativo' },
  { id: '4', nome: 'Diego Alves', email: 'diego@plenustech.com', funcao: 'Editor', status: 'Convidado' },
];

const vendas = [
  { id: 'v1', pedido: '#1042', cliente: 'Comercio Aurora', progresso: 100, valor: 'R$ 12.400,00' },
  { id: 'v2', pedido: '#1043', cliente: 'Industria Belo', progresso: 60, valor: 'R$ 8.150,00' },
  { id: 'v3', pedido: '#1044', cliente: 'Transportes Cruz', progresso: 25, valor: 'R$ 3.720,00' },
];

const buttonVariants = ['primary', 'secondary', 'soft', 'ghost', 'danger'] as const;
const badgeTones = ['ok', 'warn', 'info', 'danger', 'primary', 'neutral'] as const;

function CodeBlock({ children }: { children: string }) {
  return <pre className="code-block"><code>{children}</code></pre>;
}

function ComponentDoc({
  category,
  description,
  id,
  name,
  children,
  api,
}: {
  category: string;
  description: string;
  id: string;
  name: string;
  children: ReactNode;
  api: string;
}) {
  return (
    <section className="component-doc" id={id} aria-labelledby={`${id}-title`}>
      <header className="component-doc-header">
        <div>
          <p className="component-category">{category}</p>
          <h2 id={`${id}-title`}>{name}</h2>
          <p>{description}</p>
        </div>
        <code className="component-path">src/components/{category.toLowerCase()}/{name}</code>
      </header>
      {children}
      <div className="doc-subsection">
        <h3>Exemplo de implementacao</h3>
        <CodeBlock>{api}</CodeBlock>
      </div>
    </section>
  );
}

export function App() {
  const [saved, setSaved] = useState(false);
  const [pagamento, setPagamento] = useState('pix');
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [popoverAberto, setPopoverAberto] = useState(false);
  const gatilhoPopover = useRef<HTMLButtonElement>(null);
  const [uf, setUf] = useState('sp');
  const [pagina, setPagina] = useState(5);
  const [equipeEscolhida, setEquipeEscolhida] = useState<readonly string[]>([]);
  const [ordemEquipe, setOrdemEquipe] = useState<OrdemTabela>({ column: 'nome', direction: 'ascending' });
  const [paginaEquipe, setPaginaEquipe] = useState(1);
  const [dataEscolhida, setDataEscolhida] = useState<CalendarDate | undefined>(new CalendarDate(2026, 3, 9));
  const [agendamento, setAgendamento] = useState<CalendarDateTime | undefined>();
  const equipeOrdenada = [...equipe].sort((a, b) => {
    const campo = ordemEquipe.column === 'status' ? 'status' : 'nome';
    const comparacao = a[campo].localeCompare(b[campo], 'pt-BR');
    return ordemEquipe.direction === 'ascending' ? comparacao : -comparacao;
  });

  return (
    <div className="docs-layout">
      <aside className="docs-rail">
        <div className="rail-brand">
          <span className="rail-mark">P</span>
          <div><strong>Plenustech DS</strong><small>Showcase React · v0.1.0</small></div>
        </div>
        <nav aria-label="Navegacao da documentacao">
          <p className="rail-group">Fundamentos</p>
          <a href="#overview">Visao geral</a>
          <a href="#tokens">Tokens e regras</a>
          <p className="rail-group">Acoes</p>
          <a href="#button">Button</a>
          <p className="rail-group">Formularios</p>
          <a href="#input-text">InputText</a>
          <a href="#input-password">InputPassword</a>
          <a href="#input-currency">InputCurrency</a>
          <a href="#textarea">Textarea</a>
          <a href="#datepicker">DatePicker</a>
          <a href="#select">Select</a>
          <a href="#combobox">ComboBox</a>
          <a href="#checkbox">Checkbox</a>
          <a href="#radio-group">RadioGroup</a>
          <a href="#switch">Switch</a>
          <p className="rail-group">Feedback</p>
          <a href="#alert">Alert</a>
          <a href="#progress">Progress</a>
          <a href="#spinner">Spinner</a>
          <p className="rail-group">Navegacao</p>
          <a href="#tabs">Tabs</a>
          <a href="#accordion">Accordion</a>
          <a href="#breadcrumb">Breadcrumb</a>
          <a href="#pagination">Pagination</a>
          <p className="rail-group">Overlays</p>
          <a href="#dialog">Dialog</a>
          <a href="#popover">Popover</a>
          <a href="#menu">Menu</a>
          <a href="#tooltip">Tooltip</a>
          <p className="rail-group">Data display</p>
          <a href="#list">List</a>
          <a href="#table">Table</a>
          <a href="#badge">Badge</a>
          <a href="#avatar">Avatar</a>
        </nav>
      </aside>

      <main className="docs-main">
        <header className="docs-hero" id="overview">
          <p className="eyebrow">Documentacao de componentes</p>
          <h1>Plenustech Design System</h1>
          <p>Cada componente abaixo e demonstrado com seus tipos, estados, variantes e uma implementacao funcional.</p>
        </header>

        <section className="foundation-section" id="tokens" aria-labelledby="tokens-title">
          <p className="component-category">Fundamentos</p>
          <h2 id="tokens-title">Tokens antes dos componentes</h2>
          <p>Os componentes consomem tokens semanticos. O Showcase documenta o comportamento publico, nao duplica estilos de producao.</p>
          <div className="token-strip">
            <span><i className="token-swatch primary-swatch" />Primary</span>
            <span><i className="token-swatch surface-swatch" />Surface</span>
            <span><i className="token-swatch danger-swatch" />Danger</span>
            <span><i className="token-swatch text-swatch" />Text</span>
          </div>
        </section>

        <ComponentDoc
          category="actions"
          description="Acao principal para comandos, confirmacoes e fluxos de trabalho."
          id="button"
          name="Button"
          api={'<Button variant="primary" size="md" loading={false}>\n  Salvar\n</Button>'}
        >
          <div className="doc-subsection">
            <h3>Variantes</h3>
            <div className="demo-row">
              {buttonVariants.map((variant) => <Button key={variant} variant={variant}>{variant}</Button>)}
            </div>
          </div>
          <div className="doc-subsection">
            <h3>Tamanhos e estados</h3>
            <div className="demo-row">
              <Button size="sm">Pequeno</Button>
              <Button>Medio</Button>
              <Button size="lg">Grande</Button>
              <Button disabled>Desabilitado</Button>
              <Button loading>Salvando</Button>
              <Button onClick={() => setSaved(true)}>{saved ? 'Salvo' : 'Interativo'}</Button>
            </div>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Campo monetario com edicao bruta, regra decimal brasileira e formatacao no blur."
          id="input-currency"
          name="InputCurrency"
          api={'<InputCurrency\n  label="Valor"\n  currency="BRL"\n  decimalScale={2}\n  onValueChange={setValor}\n/>'}
        >
          <div className="doc-subsection">
            <h3>Formatacao e estados</h3>
            <div className="input-grid">
              <InputCurrency label="Valor inteiro" defaultValue="165789" />
              <InputCurrency label="Valor decimal" defaultValue="165789,50" />
              <InputCurrency label="Com ajuda" hint="A virgula determina os centavos." placeholder="0,00" />
              <InputCurrency label="Desabilitado" defaultValue="2500,00" disabled />
            </div>
            <p className="doc-note">Durante a edicao, o campo preserva o valor bruto. Ao perder o foco, aplica R$, separador de milhares e duas casas decimais.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Campo especializado para senhas com alternancia de visibilidade, validacao configuravel e estados acessiveis."
          id="input-password"
          name="InputPassword"
          api={'<InputPassword\n  label="Senha"\n  minLength={8}\n  validate={validatePassword}\n  validateOnBlur\n/>'}
        >
          <div className="doc-subsection">
            <h3>Estados e comportamento</h3>
            <div className="input-grid">
              <InputPassword label="Senha" placeholder="Digite sua senha" />
              <InputPassword label="Nova senha" autoComplete="new-password" hint="Use uma senha segura." />
              <InputPassword label="Com erro" error="Senha obrigatoria." maxLength={64} />
              <InputPassword label="Toggle oculto" showToggle={false} placeholder="Sem controle visual" />
            </div>
            <p className="doc-note">A senha inicia mascarada. Copia e corte sao bloqueados por padrao; colagem, autofill e gerenciadores de senha permanecem permitidos. Isso nao impede extensoes ou scripts privilegiados de acessarem o campo.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Campo de texto com label, ajuda, erro, foco acessivel e tamanhos."
          id="input-text"
          name="InputText"
          api={'<InputText\n  label="Descrição"\n  maxLength={120}\n  showCharacterCount\n/>'}
        >
          <div className="doc-subsection">
            <h3>Tipos e estados</h3>
            <div className="input-grid">
              <InputText label="Texto" placeholder="Nome do modulo" />
              <InputText label="Com ajuda" hint="Valores em reais." placeholder="0,00" />
              <InputText label="Com erro" error="Campo obrigatorio." />
              <InputText label="Desabilitado" defaultValue="Somente leitura" disabled />
              <InputText label="Busca compacta" size="sm" placeholder="Pesquisar" type="search" />
              <InputText label="Com contador" defaultValue="Texto inicial" maxLength={80} showCharacterCount />
              <InputNumber label="Quantidade inteira" defaultValue="165789" />
              <InputNumber label="Decimal com 2 casas" decimalScale={2} defaultValue="165789,50" />
            </div>
          </div>
          <div className="doc-subsection">
            <h3>Regra decimal</h3>
            <p className="doc-note">A virgula determina os decimais. Sem virgula, o valor permanece inteiro.</p>
            <CodeBlock>{'<InputNumber label="Percentual" decimalScale={2} />'}</CodeBlock>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Entrada de texto multilinha com rotulo, ajuda, erro, contador e redimensionamento vertical."
          id="textarea"
          name="Textarea"
          api={`<Textarea
  label="Observacoes"
  rows={4}
  maxLength={240}
  showCharacterCount
/>`}
        >
          <div className="doc-subsection">
            <h3>Estados e tamanhos</h3>
            <div className="input-grid">
              <Textarea label="Observacoes" placeholder="Descreva a ocorrencia" />
              <Textarea label="Com ajuda" hint="Maximo de 240 caracteres." maxLength={240} showCharacterCount />
              <Textarea label="Com erro" error="Campo obrigatorio." />
              <Textarea label="Compacto" size="sm" rows={2} placeholder="Nota rapida" />
            </div>
            <p className="doc-note">O campo compartilha rotulo, ajuda, erro e contador com os demais campos de formulario. O redimensionamento e apenas vertical e some quando desabilitado.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Entrada de data, hora e data com hora, com selecao em calendario."
          id="datepicker"
          name="DatePicker"
          api={`<DatePicker
  label="Vencimento"
  value={data}
  onValueChange={setData}
  min={hoje}
/>`}
        >
          <div className="doc-subsection">
            <h3>Data</h3>
            <div className="demo-grid">
              <DatePicker label="Vencimento" value={dataEscolhida} onValueChange={setDataEscolhida} />
              <DatePicker label="Com ajuda" hint="Digite ou escolha no calendario." />
              <DatePicker label="Com erro" error="Informe o vencimento." />
              <DatePicker label="Desabilitado" disabled value={new CalendarDate(2026, 3, 9)} />
            </div>
            <p className="doc-note">Digite com barras, tracos, pontos ou espacos: a mascara se encarrega do resto. A seta para baixo abre o calendario; nele as setas andam por dia e semana, PageUp e PageDown trocam o mes, com Shift trocam o ano, Enter escolhe e Escape fecha devolvendo o foco. Cada dia anuncia a data por extenso.</p>
          </div>
          <div className="doc-subsection">
            <h3>Faixa permitida e dias indisponiveis</h3>
            <div className="demo-grid">
              <DatePicker
                label="A partir de hoje"
                min={new CalendarDate(2026, 3, 1)}
                max={new CalendarDate(2026, 3, 31)}
              />
              <DatePicker
                label="Sem fins de semana"
                isDateUnavailable={(data) => [0, 6].includes(data.toDate('UTC').getUTCDay())}
              />
            </div>
            <p className="doc-note">Os limites e o predicado desabilitam os dias na grade e impedem que o teclado passe deles.</p>
          </div>
          <div className="doc-subsection">
            <h3>Hora e data com hora</h3>
            <div className="demo-grid">
              <TimePicker label="Inicio" min={new Time(8, 0)} max={new Time(18, 0)} />
              <TimePicker label="Com erro" error="Informe a hora." />
            </div>
            <DateTimePicker label="Agendamento" value={agendamento} onValueChange={setAgendamento} />
            <p className="doc-note">
              {agendamento
                ? `Escolhido: ${formatarData(agendamento.toString().slice(0, 10), { formato: 'longo' })} as ${formatarHora(agendamento.toString().slice(11, 16))}`
                : 'Nada escolhido ainda.'}
            </p>
            <p className="doc-note">A data mantem a hora ja informada e a hora mantem a data; quando a data vem primeiro, a hora comeca em meia-noite. O texto acima usa os formatadores de apresentacao formatarData e formatarHora.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Selecao independente, com estado indeterminado para hierarquias de selecao."
          id="checkbox"
          name="Checkbox"
          api={`<Checkbox label="Aceito os termos" hint="Leia antes de continuar." />`}
        >
          <div className="doc-subsection">
            <h3>Estados</h3>
            <div className="input-grid">
              <Checkbox label="Aceito os termos" />
              <Checkbox label="Selecionar todos" indeterminate />
              <Checkbox label="Receber avisos" defaultChecked hint="No maximo um por semana." />
              <Checkbox label="Com erro" error="Campo obrigatorio." />
              <Checkbox label="Desabilitado" disabled defaultChecked />
            </div>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Escolha unica entre opcoes relacionadas, agrupadas com nome acessivel."
          id="radio-group"
          name="RadioGroup"
          api={`<RadioGroup label="Forma de pagamento" value={valor} onValueChange={setValor}>
  <Radio label="Pix" value="pix" />
  <Radio label="Boleto" value="boleto" />
</RadioGroup>`}
        >
          <div className="doc-subsection">
            <h3>Grupo controlado</h3>
            <div className="input-grid">
              <RadioGroup label="Forma de pagamento" value={pagamento} onValueChange={setPagamento} hint={`Selecionado: ${pagamento}`}>
                <Radio label="Pix" value="pix" />
                <Radio label="Boleto" value="boleto" />
                <Radio label="Cartao" value="cartao" />
              </RadioGroup>
              <RadioGroup label="Com erro" error="Escolha uma opcao." required>
                <Radio label="Mensal" value="mensal" />
                <Radio label="Anual" value="anual" />
              </RadioGroup>
            </div>
            <p className="doc-note">O grupo distribui o nome nativo entre as opcoes, expoe o rotulo por legend e propaga o estado desabilitado.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Alternancia imediata de uma preferencia, com semantica de switch."
          id="switch"
          name="Switch"
          api={`<Switch label="Notificacoes por e-mail" defaultChecked />`}
        >
          <div className="doc-subsection">
            <h3>Estados</h3>
            <div className="input-grid">
              <Switch label="Notificacoes por e-mail" />
              <Switch label="Modo escuro" defaultChecked hint="Acompanha a preferencia do sistema." />
              <Switch label="Sincronizacao" disabled />
            </div>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="feedback"
          description="Mensagem contextual de status, com urgencia definida pelo tom."
          id="alert"
          name="Alert"
          api={`<Alert tone="danger" title="Falha no envio">
  Tente novamente em alguns instantes.
</Alert>`}
        >
          <div className="doc-subsection">
            <h3>Tons</h3>
            <div className="input-grid">
              <Alert tone="info" title="Sincronizacao agendada">Executa todos os dias as 3h.</Alert>
              <Alert tone="success" title="Registro salvo">As alteracoes ja estao disponiveis.</Alert>
              <Alert tone="warning" title="Espaco quase esgotado">Restam 8% do armazenamento.</Alert>
              <Alert tone="danger" title="Falha no envio">Tente novamente em alguns instantes.</Alert>
            </div>
            <p className="doc-note">Aviso e erro sao anunciados de forma assertiva; informacao e sucesso, de forma educada.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="feedback"
          description="Progresso determinado ou indeterminado de uma operacao."
          id="progress"
          name="Progress"
          api={`<Progress label="Envio do arquivo" value={40} showValue />`}
        >
          <div className="doc-subsection">
            <h3>Modos e tamanhos</h3>
            <div className="input-grid">
              <Progress label="Envio do arquivo" value={40} showValue />
              <Progress label="Importacao" value={82} size="sm" showValue />
              <Progress label="Processando" />
            </div>
            <p className="doc-note">Sem valor, o componente entra em modo indeterminado e omite o valor atual da semantica.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="feedback"
          description="Indicador de carregamento, decorativo por padrao."
          id="spinner"
          name="Spinner"
          api={`<Spinner label="Carregando" size="md" />`}
        >
          <div className="doc-subsection">
            <h3>Tamanhos</h3>
            <div className="demo-row">
              <Spinner size="sm" label="Carregando pequeno" />
              <Spinner label="Carregando medio" />
              <Spinner size="lg" label="Carregando grande" />
            </div>
            <p className="doc-note">Sem rotulo, o indicador fica oculto para leitores de tela. Dentro do Button, quem anuncia o estado e o proprio botao.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="overlays"
          description="Janela modal com foco preso, retorno de foco, trava de rolagem e dispensa por Escape."
          id="dialog"
          name="Dialog"
          api={`<Dialog
  open={aberto}
  onClose={fechar}
  title="Confirmar exclusao"
  footer={<Button variant="danger">Excluir</Button>}
>
  Esta acao nao pode ser desfeita.
</Dialog>`}
        >
          <div className="doc-subsection">
            <h3>Demonstracao</h3>
            <div className="demo-row">
              <Button variant="danger" onClick={() => setDialogoAberto(true)}>Excluir modulo</Button>
            </div>
            <Dialog
              open={dialogoAberto}
              onClose={() => setDialogoAberto(false)}
              title="Confirmar exclusao"
              description="O modulo e todos os seus registros serao removidos."
              footer={
                <>
                  <Button variant="secondary" onClick={() => setDialogoAberto(false)}>Cancelar</Button>
                  <Button variant="danger" onClick={() => setDialogoAberto(false)}>Excluir</Button>
                </>
              }
            >
              Esta acao nao pode ser desfeita.
            </Dialog>
            <p className="doc-note">O foco fica preso no dialogo, retorna ao gatilho ao fechar, a rolagem do fundo trava e o restante da pagina e escondido da tecnologia assistiva. Fecha por Escape, clique fora ou botao de fechar.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="overlays"
          description="Painel ancorado a um gatilho, com inversao automatica quando falta espaco."
          id="popover"
          name="Popover"
          api={`<Popover
  open={aberto}
  onClose={fechar}
  triggerRef={gatilho}
  placement="bottom start"
  aria-label="Filtros"
>
  {conteudo}
</Popover>`}
        >
          <div className="doc-subsection">
            <h3>Demonstracao</h3>
            <div className="demo-row">
              <Button ref={gatilhoPopover} variant="secondary" onClick={() => setPopoverAberto((atual) => !atual)}>
                Filtros
              </Button>
            </div>
            <Popover
              open={popoverAberto}
              onClose={() => setPopoverAberto(false)}
              triggerRef={gatilhoPopover}
              aria-label="Filtros"
            >
              <div className="input-grid">
                <Checkbox label="Somente ativos" defaultChecked />
                <Checkbox label="Com pendencia" />
                <Button size="sm" onClick={() => setPopoverAberto(false)}>Aplicar</Button>
              </div>
            </Popover>
            <p className="doc-note">Ancora no gatilho, inverte de lado quando falta espaco e reposiciona durante a rolagem. Fecha por Escape ou clique externo, devolvendo o foco ao gatilho. Nao e modal: o restante da pagina continua acessivel.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Escolha unica a partir de uma lista, com navegacao por teclado e busca por digitacao."
          id="select"
          name="Select"
          api={`<Select
  label="Estado"
  options={estados}
  value={uf}
  onValueChange={setUf}
/>`}
        >
          <div className="doc-subsection">
            <h3>Estados</h3>
            <div className="input-grid">
              <Select
                label="Estado"
                options={[
                  { value: 'sp', label: 'Sao Paulo' },
                  { value: 'rj', label: 'Rio de Janeiro' },
                  { value: 'mg', label: 'Minas Gerais' },
                  { value: 'ex', label: 'Exterior', disabled: true },
                ]}
                value={uf}
                onValueChange={setUf}
              />
              <Select label="Com ajuda" hint="A lista responde a digitacao." options={[{ value: 'a', label: 'Anual' }, { value: 'm', label: 'Mensal' }]} />
              <Select label="Com erro" error="Escolha uma opcao." options={[{ value: 'a', label: 'Anual' }]} />
              <Select label="Desabilitado" disabled options={[{ value: 'a', label: 'Anual' }]} />
            </div>
            <p className="doc-note">Setas navegam pulando desabilitados, Home e End vao aos extremos, digitar busca pelo inicio do texto, Enter confirma e Escape fecha devolvendo o foco ao gatilho.</p>
          </div>
          <div className="doc-subsection">
            <h3>Lista longa</h3>
            <div className="input-grid">
              <Select label="Estado (27 opcoes)" options={estadosBrasileiros} defaultValue="sp" />
              <ComboBox label="Estado com filtro" options={estadosBrasileiros} placeholder="Digite para filtrar" />
            </div>
            <p className="doc-note">Com 27 registros a lista atinge o teto de altura e passa a rolar. A largura continua acompanhando o campo, e a barra de rolagem usa o estilo global definido em globals.css. Digite &quot;ma&quot; no Select para ver a busca saltar entre Maranhao e Mato Grosso.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Campo de texto que filtra uma lista enquanto se digita."
          id="combobox"
          name="ComboBox"
          api={`<ComboBox
  label="Cidade"
  options={cidades}
  onValueChange={setCidade}
/>`}
        >
          <div className="doc-subsection">
            <h3>Filtragem</h3>
            <div className="input-grid">
              <ComboBox
                label="Cidade"
                placeholder="Digite para filtrar"
                options={[
                  { value: 'sp', label: 'Sao Paulo' },
                  { value: 'rj', label: 'Rio de Janeiro' },
                  { value: 'bh', label: 'Belo Horizonte' },
                  { value: 'poa', label: 'Porto Alegre' },
                ]}
              />
              <ComboBox label="Com erro" error="Cidade obrigatoria." options={[{ value: 'sp', label: 'Sao Paulo' }]} />
            </div>
            <p className="doc-note">O foco permanece no campo e a opcao ativa e apontada por aria-activedescendant. Sem correspondencia, a lista informa o vazio em vez de sumir.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="overlays"
          description="Lista de acoes ancorada a um gatilho, com foco real nos itens."
          id="menu"
          name="Menu"
          api={`<Menu label="Acoes" items={acoes}>
  <Button variant="secondary">Acoes</Button>
</Menu>`}
        >
          <div className="doc-subsection">
            <h3>Demonstracao</h3>
            <div className="demo-row">
              <Menu
                label="Acoes do modulo"
                items={[
                  { key: 'editar', label: 'Editar' },
                  { key: 'duplicar', label: 'Duplicar' },
                  { key: 'arquivar', label: 'Arquivar', disabled: true },
                  { key: 'excluir', label: 'Excluir' },
                ]}
              >
                <Button variant="secondary">Acoes</Button>
              </Menu>
            </div>
            <p className="doc-note">Seta para baixo abre no primeiro item, seta para cima no ultimo. Tab e Escape fecham devolvendo o foco ao gatilho.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="overlays"
          description="Texto auxiliar ancorado, exibido no foco e apos atraso no ponteiro."
          id="tooltip"
          name="Tooltip"
          api={`<Tooltip content="Salva sem fechar a tela">
  <Button>Salvar</Button>
</Tooltip>`}
        >
          <div className="doc-subsection">
            <h3>Demonstracao</h3>
            <div className="demo-row">
              <Tooltip content="Salva sem fechar a tela"><Button>Salvar</Button></Tooltip>
              <Tooltip content="Descarta as alteracoes" placement="bottom"><Button variant="secondary">Cancelar</Button></Tooltip>
            </div>
            <p className="doc-note">Aparece imediatamente no foco por teclado e apos meio segundo no ponteiro. O gatilho recebe aria-describedby enquanto visivel, e Escape dispensa.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="navigation"
          description="Alternancia entre paineis irmaos, com ativacao automatica pelo teclado."
          id="tabs"
          name="Tabs"
          api={`<Tabs label="Configuracoes" items={abas} />`}
        >
          <div className="doc-subsection">
            <h3>Demonstracao</h3>
            <Tabs
              label="Configuracoes do modulo"
              items={[
                { key: 'geral', label: 'Geral', content: 'Nome, descricao e responsavel pelo modulo.' },
                { key: 'acesso', label: 'Acesso', content: 'Perfis e permissoes que enxergam este modulo.' },
                { key: 'antigo', label: 'Legado', content: 'Indisponivel', disabled: true },
                { key: 'logs', label: 'Logs', content: 'Historico de alteracoes dos ultimos 90 dias.' },
              ]}
            />
            <p className="doc-note">Setas percorrem em circulo e trocam o painel na hora, Home e End vao aos extremos, e abas desabilitadas sao puladas.</p>
          </div>
          <div className="doc-subsection">
            <h3>Orientacao vertical</h3>
            <Tabs
              orientation="vertical"
              label="Preferencias da conta"
              items={[
                { key: 'perfil', label: 'Perfil', content: 'Nome, foto e dados de contato.' },
                { key: 'notificacoes', label: 'Notificacoes', content: 'Quais avisos chegam por e-mail e quais ficam no sistema.' },
                { key: 'seguranca', label: 'Seguranca', content: 'Senha, sessoes ativas e verificacao em duas etapas.' },
                { key: 'faturamento', label: 'Faturamento', content: 'Plano contratado, notas e forma de pagamento.' },
              ]}
            />
            <p className="doc-note">A lista vira coluna ao lado do painel e as setas passam a ser cima e baixo. Vale a partir de cerca de seis secoes, ou antes se algum rotulo passar de duas palavras.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="data-display"
          description="Secoes recolhiveis, uma por vez ou varias em paralelo."
          id="accordion"
          name="Accordion"
          api={`<Accordion items={secoes} iconPosition="right" divider />`}
        >
          <div className="doc-subsection">
            <h3>Uma secao por vez</h3>
            <Accordion
              defaultExpandedKeys={['envio']}
              items={[
                { key: 'envio', label: 'Regras de envio', content: 'Prazos, transportadoras e restricoes por regiao.' },
                { key: 'pagamento', label: 'Formas de pagamento', content: 'Pix, boleto e cartao, com as regras de cada um.' },
                { key: 'suporte', label: 'Canais de suporte', content: 'Telefone, chat e e-mail, com horarios de atendimento.' },
              ]}
            />
          </div>
          <div className="doc-subsection">
            <h3>Varias em paralelo</h3>
            <Accordion
              multiple
              defaultExpandedKeys={['a', 'b']}
              items={[
                { key: 'a', label: 'Primeira', content: 'Conteudo da primeira secao.' },
                { key: 'b', label: 'Segunda', content: 'Conteudo da segunda secao.' },
                { key: 'c', label: 'Desabilitada', content: 'Indisponivel', disabled: true },
              ]}
            />
            <p className="doc-note">As setas movem o foco entre os cabecalhos, em circulo, pulando os desabilitados.</p>
          </div>
          <div className="doc-subsection">
            <h3>Icone a esquerda, sem divisor</h3>
            <Accordion
              iconPosition="left"
              divider={false}
              items={[
                { key: 'prazo', label: 'Qual o prazo de entrega?', content: 'De tres a cinco dias uteis para as capitais.' },
                { key: 'troca', label: 'Como solicitar troca?', content: 'Pelo painel do pedido, em ate sete dias do recebimento.' },
                { key: 'nota', label: 'Onde fica a nota fiscal?', content: 'Anexada ao e-mail de confirmacao e no historico do pedido.' },
              ]}
            />
            <p className="doc-note">Direita e a convencao da web; esquerda funciona quando os rotulos sao curtos e a coluna e estreita. Sem divisor o item fica compacto; com divisor, ganha regra e folga.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="navigation"
          description="Trilha ate a pagina atual, sem acoplamento a um roteador."
          id="breadcrumb"
          name="Breadcrumb"
          api={`<Breadcrumb as={Link} items={trilha} />`}
        >
          <div className="doc-subsection">
            <h3>Demonstracao</h3>
            <Breadcrumb
              items={[
                { label: 'Inicio', href: '#' },
                { label: 'Modulos', href: '#' },
                { label: 'Faturamento', href: '#' },
                { label: 'Nota 4512' },
              ]}
            />
            <p className="doc-note">O ultimo item nao vira link e recebe aria-current. A propriedade as aceita o componente de link da aplicacao, conforme ARCHITECTURE secao 11.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="navigation"
          description="Percurso entre paginas de um conjunto longo, com reticencias."
          id="pagination"
          name="Pagination"
          api={`<Pagination
  page={pagina}
  pageCount={20}
  onPageChange={setPagina}
/>`}
        >
          <div className="doc-subsection">
            <h3>Conjunto longo</h3>
            <Pagination page={pagina} pageCount={20} onPageChange={setPagina} />
            <p className="doc-note">Primeira e ultima pagina ficam sempre visiveis. Abaixo de oito paginas a reticencia some, porque nao economizaria espaco.</p>
          </div>
          <div className="doc-subsection">
            <h3>Conjunto curto</h3>
            <Pagination page={2} pageCount={5} onPageChange={() => undefined} />
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="data-display"
          description="Listagem visivel na tela, com busca e selecao opcionais."
          id="list"
          name="List"
          api={`<List items={cidades} selectionMode="multiple" onSelectionChange={setEscolhidas}>
  <List.Search placeholder="Buscar cidade" />
  <List.SelectAll />
  <List.Options height={240} />
  <List.Empty>Nenhuma cidade encontrada</List.Empty>
</List>`}
        >
          <div className="doc-subsection">
            <h3>Listagem simples com busca</h3>
            <List items={estadosBrasileiros} label="Estados">
              <List.Search placeholder="Buscar estado" />
              <List.Options height={200} />
              <List.Empty>Nenhum estado encontrado</List.Empty>
            </List>
            <p className="doc-note">Sem selecao a marcacao e de lista, nao de caixa de listagem. A busca ignora caixa e acento: digitar "goias" encontra "Goias", e "sao" encontra "Sao Paulo".</p>
          </div>
          <div className="doc-subsection">
            <h3>Selecao unica</h3>
            <List items={estadosBrasileiros} label="Estado de origem" selectionMode="single">
              <List.Search placeholder="Buscar estado" />
              <List.Options height={200} />
              <List.Empty>Nenhum estado encontrado</List.Empty>
            </List>
            <p className="doc-note">Com selecao a lista vira listbox. As setas percorrem, Home e End vao aos extremos, Enter escolhe.</p>
          </div>
          <div className="doc-subsection">
            <h3>Selecao multipla</h3>
            <List items={estadosBrasileiros} label="Estados atendidos" selectionMode="multiple">
              <List.Search placeholder="Buscar estado" />
              <List.SelectAll label="Selecionar todos os estados" />
              <List.Options height={200} />
              <List.Empty>Nenhum estado encontrado</List.Empty>
            </List>
            <p className="doc-note">A caixa de marcacao e apenas visual: quem comunica a escolha e o proprio item. Marque um estado e depois busque outro: o escolhido continua visivel no topo, para nao se perder do que ja foi marcado. Clique em um estado e depois em outro com Shift para marcar a faixa inteira; Shift com as setas faz o mesmo pelo teclado. O marcar todos fica indeterminado enquanto a escolha e parcial.</p>
          </div>
          <div className="doc-subsection">
            <h3>Volume</h3>
            <List items={muitasLinhas} label="Registros" selectionMode="multiple">
              <List.Search placeholder="Buscar registro" />
              <List.SelectAll label="Selecionar todos os registros" />
              <List.Options height={240} />
              <List.Empty>Nenhum registro encontrado</List.Empty>
            </List>
            <p className="doc-note">Dez mil registros. Apenas a faixa visivel existe no DOM, e cada item declara sua posicao e o total para o leitor de tela.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="data-display"
          description="Tabela semantica com ordenacao, selecao e densidade."
          id="table"
          name="Table"
          api={`<Card>
  <Card.Header title="Membros" description="..." badge={<Badge>12</Badge>} trailing={<Button>Convidar</Button>} />
  <Card.Body flush>
    <Table rows={membros} selectionMode="multiple" onSelectionChange={setEscolhidos}>
      <Table.Header>
        <Table.Column id="nome" sortable>Nome</Table.Column>
      </Table.Header>
      <Table.Body items={membros} empty={<span>Nenhum membro</span>}>
        {(m) => (
          <Table.Row id={m.id} label={\`Selecionar \${m.nome}\`}>
            <Table.Cell>{m.nome}</Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  </Card.Body>
  <Card.Footer><Pagination page={1} pageCount={5} onPageChange={setPagina} /></Card.Footer>
</Card>`}
        >
          <div className="doc-subsection">
            <h3>Equipe, com selecao multipla em cartao</h3>
            <Card>
              <Card.Header
                title="Membros da equipe"
                description="Gerencie quem tem acesso ao espaco de trabalho."
                badge={<Badge tone="neutral">{equipe.length}</Badge>}
                trailing={<Button size="sm">Convidar</Button>}
              />
              <Card.Body flush>
                <Table
                  rows={equipe}
                  label="Membros da equipe"
                  selectionMode="multiple"
                  onSelectionChange={setEquipeEscolhida}
                  sort={ordemEquipe}
                  onSortChange={setOrdemEquipe}
                >
                  <Table.Header>
                    <Table.Column id="nome" sortable>Nome</Table.Column>
                    <Table.Column id="funcao" help="Define o que a pessoa pode fazer">Funcao</Table.Column>
                    <Table.Column id="status" sortable>Status</Table.Column>
                    <Table.Column id="acoes" align="end" hideBelow="md">Acoes</Table.Column>
                  </Table.Header>
                  <Table.Body items={equipeOrdenada} empty={<span>Nenhum membro encontrado</span>}>
                    {(pessoa) => (
                      <Table.Row id={pessoa.id} label={`Selecionar ${pessoa.nome}`}>
                        <Table.Cell>
                          <div className="cell-person">
                            <Avatar name={pessoa.nome} size="sm" />
                            <div>
                              <b>{pessoa.nome}</b>
                              <span>{pessoa.email}</span>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>{pessoa.funcao}</Table.Cell>
                        <Table.Cell>
                          <Badge tone={pessoa.status === 'Ativo' ? 'ok' : 'warn'}>{pessoa.status}</Badge>
                        </Table.Cell>
                        <Table.Cell align="end" hideBelow="md">
                          <Menu
                            label={`Acoes de ${pessoa.nome}`}
                            items={[
                              { key: 'editar', label: 'Editar' },
                              { key: 'remover', label: 'Remover' },
                            ]}
                          >
                            <Button variant="ghost" size="sm">
                              Acoes
                            </Button>
                          </Menu>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>
              </Card.Body>
              <Card.Footer>
                <span className="doc-note">{equipeEscolhida.length} selecionados</span>
                <Pagination page={paginaEquipe} pageCount={5} onPageChange={setPaginaEquipe} />
              </Card.Footer>
            </Card>
            <p className="doc-note">Clique em uma linha e depois em outra com Shift para marcar a faixa. O cabecalho marca todas e fica indeterminado na escolha parcial. A coluna de acoes desaparece em telas estreitas.</p>
          </div>
          <div className="doc-subsection">
            <h3>Vendas, compacta com zebra e selecao unica</h3>
            <Table rows={vendas} label="Vendas" size="sm" striped divider={false} selectionMode="single">
              <Table.Header>
                <Table.Column id="pedido">Pedido</Table.Column>
                <Table.Column id="cliente">Cliente</Table.Column>
                <Table.Column id="progresso" hideBelow="sm">Entrega</Table.Column>
                <Table.Column id="valor" align="end" sortable>Valor</Table.Column>
              </Table.Header>
              <Table.Body items={vendas} empty={<span>Nenhuma venda</span>}>
                {(venda) => (
                  <Table.Row id={venda.id} label={`Selecionar ${venda.pedido}`}>
                    <Table.Cell>{venda.pedido}</Table.Cell>
                    <Table.Cell>{venda.cliente}</Table.Cell>
                    <Table.Cell hideBelow="sm">
                      <Progress value={venda.progresso} size="sm" label={`Entrega de ${venda.pedido}`} />
                    </Table.Cell>
                    <Table.Cell align="end">{venda.valor}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
            <p className="doc-note">Densidade compacta, sem divisores e com fundo alternado, que a referencia recomenda a partir de oito colunas. Na selecao unica o controle vira radio.</p>
          </div>
          <div className="doc-subsection">
            <h3>Sem registros e carregando</h3>
            <Table rows={[]} label="Arquivos vazios">
              <Table.Header>
                <Table.Column id="arquivo">Arquivo</Table.Column>
                <Table.Column id="tamanho" align="end">Tamanho</Table.Column>
              </Table.Header>
              <Table.Body items={[] as typeof vendas} empty={<span>Nenhum arquivo enviado ainda</span>}>
                {(item) => (
                  <Table.Row id={item.id}>
                    <Table.Cell>{item.pedido}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
            <Table rows={[]} label="Arquivos carregando" loading>
              <Table.Header>
                <Table.Column id="arquivo">Arquivo</Table.Column>
                <Table.Column id="tamanho" align="end">Tamanho</Table.Column>
              </Table.Header>
              <Table.Body items={[] as typeof vendas} empty={<span>Nenhum arquivo</span>}>
                {(item) => (
                  <Table.Row id={item.id}>
                    <Table.Cell>{item.pedido}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
            <p className="doc-note">O vazio ocupa a largura da tabela; o carregamento substitui o vazio e marca a tabela como ocupada.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="data-display"
          description="Indicador compacto para status, classificacao e metadados."
          id="badge"
          name="Badge"
          api={'<Badge tone="ok" dot>\n  Ativo\n</Badge>'}
        >
          <div className="doc-subsection">
            <h3>Tons semanticos</h3>
            <div className="demo-row">
              {badgeTones.map((tone) => <Badge key={tone} tone={tone} dot>{tone}</Badge>)}
            </div>
          </div>
          <div className="doc-subsection">
            <h3>Variantes</h3>
            <div className="demo-row">
              <Badge tone="ok" outline>Concluido</Badge>
              <Badge tone="danger" outline>Falhou</Badge>
              <Badge tone="neutral">Sem status</Badge>
            </div>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="data-display"
          description="Representacao de pessoa ou entidade com imagem e fallback por iniciais."
          id="avatar"
          name="Avatar"
          api={'<Avatar\n  name="Maria Costa"\n  size="md"\n  src={foto}\n/>'}
        >
          <div className="doc-subsection">
            <h3>Tamanhos e fallback</h3>
            <div className="demo-row">
              <Avatar name="Joao Silva" size="sm" />
              <Avatar name="Maria Costa" size="md" />
              <Avatar name="Rafael Alves" size="lg" />
              <Avatar name="Imagem indisponivel" src="/missing-avatar.jpg" size="md" />
            </div>
          </div>
        </ComponentDoc>
      </main>
    </div>
  );
}
