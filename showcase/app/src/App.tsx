import { useState, type ReactNode } from 'react';
import {
  Alert, Avatar, Badge, Button, Checkbox, InputCurrency, InputText, InputNumber, InputPassword,
  Progress, Radio, RadioGroup, Spinner, Switch, Textarea,
} from '@plenus/index';

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
          <a href="#checkbox">Checkbox</a>
          <a href="#radio-group">RadioGroup</a>
          <a href="#switch">Switch</a>
          <p className="rail-group">Feedback</p>
          <a href="#alert">Alert</a>
          <a href="#progress">Progress</a>
          <a href="#spinner">Spinner</a>
          <p className="rail-group">Data display</p>
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
              <InputPassword label="Com erro" error="Senha obrigatoria." maxLength={64} showCharacterCount />
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
