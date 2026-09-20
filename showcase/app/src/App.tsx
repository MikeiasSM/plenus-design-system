import { useState, type ReactNode } from 'react';
import { Avatar, Badge, Button, CurrencyInput, Input, NumberInput, PasswordInput } from '@plenus/index';

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
          <a href="#input">Input</a>
          <a href="#password-input">PasswordInput</a>
          <a href="#currency-input">CurrencyInput</a>
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
          id="currency-input"
          name="CurrencyInput"
          api={'<CurrencyInput\n  label="Valor"\n  currency="BRL"\n  decimalScale={2}\n  onValueChange={setValor}\n/>'}
        >
          <div className="doc-subsection">
            <h3>Formatacao e estados</h3>
            <div className="input-grid">
              <CurrencyInput label="Valor inteiro" defaultValue="165789" />
              <CurrencyInput label="Valor decimal" defaultValue="165789,50" />
              <CurrencyInput label="Com ajuda" hint="A virgula determina os centavos." placeholder="0,00" />
              <CurrencyInput label="Desabilitado" defaultValue="2500,00" disabled />
            </div>
            <p className="doc-note">Durante a edicao, o campo preserva o valor bruto. Ao perder o foco, aplica R$, separador de milhares e duas casas decimais.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Campo especializado para senhas com alternancia de visibilidade, validacao configuravel e estados acessiveis."
          id="password-input"
          name="PasswordInput"
          api={'<PasswordInput\n  label="Senha"\n  minLength={8}\n  validate={validatePassword}\n  validateOnBlur\n/>'}
        >
          <div className="doc-subsection">
            <h3>Estados e comportamento</h3>
            <div className="input-grid">
              <PasswordInput label="Senha" placeholder="Digite sua senha" />
              <PasswordInput label="Nova senha" autoComplete="new-password" hint="Use uma senha segura." />
              <PasswordInput label="Com erro" error="Senha obrigatoria." maxLength={64} showCharacterCount />
              <PasswordInput label="Toggle oculto" showToggle={false} placeholder="Sem controle visual" />
            </div>
            <p className="doc-note">A senha inicia mascarada. Copia e corte sao bloqueados por padrao; colagem, autofill e gerenciadores de senha permanecem permitidos. Isso nao impede extensoes ou scripts privilegiados de acessarem o campo.</p>
          </div>
        </ComponentDoc>

        <ComponentDoc
          category="forms"
          description="Campo de texto com label, ajuda, erro, foco acessivel e tamanhos."
          id="input"
          name="Input"
          api={'<Input\n  label="Descrição"\n  maxLength={120}\n  showCharacterCount\n/>'}
        >
          <div className="doc-subsection">
            <h3>Tipos e estados</h3>
            <div className="input-grid">
              <Input label="Texto" placeholder="Nome do modulo" />
              <Input label="Com ajuda" hint="Valores em reais." placeholder="0,00" />
              <Input label="Com erro" error="Campo obrigatorio." />
              <Input label="Desabilitado" defaultValue="Somente leitura" disabled />
              <Input label="Busca compacta" size="sm" placeholder="Pesquisar" type="search" />
              <Input label="Com contador" defaultValue="Texto inicial" maxLength={80} showCharacterCount />
              <NumberInput label="Quantidade inteira" defaultValue="165789" />
              <NumberInput label="Decimal com 2 casas" decimalScale={2} defaultValue="165789,50" />
            </div>
          </div>
          <div className="doc-subsection">
            <h3>Regra decimal</h3>
            <p className="doc-note">A virgula determina os decimais. Sem virgula, o valor permanece inteiro.</p>
            <CodeBlock>{'<NumberInput label="Percentual" decimalScale={2} />'}</CodeBlock>
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
