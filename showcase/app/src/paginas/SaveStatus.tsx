import { useEffect, useRef, useState } from 'react';
import { Button, Card, InputText, SaveStatus, type SaveStatusValue } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const SITUACOES = ['idle', 'dirty', 'saving', 'saved', 'error'] as const;

const TEXTOS: Record<SaveStatusValue, string> = {
  idle: 'Sem alterações',
  dirty: 'Alterações não salvas',
  saving: 'Salvando rascunho…',
  saved: 'Rascunho salvo às 10:42',
  error: 'Não foi possível salvar',
};

const playground = definirPlayground({
  inicial: { status: 'saving' as SaveStatusValue, texto: TEXTOS.saving },
  controles: [
    { tipo: 'opcoes', nome: 'status', opcoes: SITUACOES },
    { tipo: 'texto', nome: 'texto' },
  ],
  renderizar: (valores) => <SaveStatus status={valores.status}>{valores.texto}</SaveStatus>,
  codigo: (valores) => gerarJsx('SaveStatus', [['status', valores.status, 'idle']], valores.texto),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      { nivel: 'ok', titulo: 'Anunciada', detalhe: 'A região de status fica sempre montada: a mudança do texto é lida sem tirar o foco.' },
    ];

    if (!valores.texto.trim() && valores.status !== 'idle') {
      verificacoes.push({
        nivel: 'falha',
        titulo: 'Texto vazio',
        detalhe: 'O indicador sozinho não diz a situação a quem não o vê: escreva o texto do estado.',
      });
    }

    return verificacoes;
  },
});

function Situacoes() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {SITUACOES.map((status) => (
        <div key={status} style={{ alignItems: 'center', display: 'flex', gap: 16 }}>
          <code style={{ width: 64 }}>{status}</code>
          <SaveStatus status={status}>{TEXTOS[status]}</SaveStatus>
        </div>
      ))}
    </div>
  );
}

function Variantes() {
  return (
    <div className="subsection">
      <h3>Os cinco estados</h3>
      <Situacoes />
      <p className="note">
        <code>saving</code> mostra o indicador de progresso, <code>saved</code> um sinal de pronto no tom de sucesso e <code>error</code> um
        sinal de erro no tom de perigo. <code>dirty</code> e <code>idle</code> ficam só com o texto, em tom terciário.
      </p>
      <VerCodigo
        codigo={`<SaveStatus status="idle">Sem alterações</SaveStatus>
<SaveStatus status="dirty">Alterações não salvas</SaveStatus>
<SaveStatus status="saving">Salvando rascunho…</SaveStatus>
<SaveStatus status="saved">Rascunho salvo às 10:42</SaveStatus>
<SaveStatus status="error">Não foi possível salvar</SaveStatus>`}
      />
    </div>
  );
}

function Rascunho() {
  const [nome, setNome] = useState('');
  const [status, setStatus] = useState<SaveStatusValue>('idle');
  const [hora, setHora] = useState('');
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(espera.current), []);

  function alterar(valor: string) {
    setNome(valor);
    setStatus('saving');
    clearTimeout(espera.current);
    espera.current = setTimeout(() => {
      setHora(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setStatus('saved');
    }, 800);
  }

  const texto = { idle: 'Nenhuma alteração ainda', dirty: '', saving: 'Salvando rascunho…', saved: `Rascunho salvo às ${hora}`, error: '' }[status];

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <Card>
        <Card.Body>
          <InputText label="Nome do cliente" onValueChange={alterar} value={nome} />
        </Card.Body>
        <Card.Footer start={<SaveStatus status={status}>{texto}</SaveStatus>}>
          <Button size="sm">Salvar cliente</Button>
        </Card.Footer>
      </Card>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Rascunho salvo sozinho',
      descricao: 'Digite no campo: o texto passa por Salvando e por Salvo, no start do rodapé do cartão.',
      Previa: Rascunho,
      codigo: `<Card>
  <Card.Body>
    <InputText label="Nome do cliente" value={nome} onValueChange={alterar} />
  </Card.Body>
  <Card.Footer start={<SaveStatus status={status}>{texto}</SaveStatus>}>
    <Button size="sm">Salvar cliente</Button>
  </Card.Footer>
</Card>`,
    },
    {
      titulo: 'Alterações pendentes',
      descricao: 'Num cartão de ajustes, o texto diz se há o que salvar.',
      Previa: () => (
        <div style={{ width: '100%', maxWidth: 420 }}>
          <Card>
            <Card.Body>Desconto sem aprovação: 5%</Card.Body>
            <Card.Footer start={<SaveStatus status="dirty">Alterações não salvas</SaveStatus>}>
              <Button size="sm" variant="secondary">Descartar</Button>
              <Button size="sm">Salvar</Button>
            </Card.Footer>
          </Card>
        </div>
      ),
      codigo: `<Card.Footer start={<SaveStatus status="dirty">Alterações não salvas</SaveStatus>}>
  <Button size="sm" variant="secondary">Descartar</Button>
  <Button size="sm">Salvar</Button>
</Card.Footer>`,
    },
  ],
  faca: {
    Previa: () => <SaveStatus status="error">Não foi possível salvar. Tente de novo.</SaveStatus>,
    texto: 'Escrever o texto da situação, dizendo o que houve e, no erro, o que fazer.',
    codigo: '<SaveStatus status="error">Não foi possível salvar. Tente de novo.</SaveStatus>',
  },
  evite: {
    Previa: () => <SaveStatus status="error" />,
    texto: <>Deixar só o indicador, sem texto: quem não o vê, ou não distingue a cor, não fica sabendo da situação.</>,
    codigo: '<SaveStatus status="error" />',
  },
  Variantes,
  garantias: [
    { garantia: 'Anunciada', como: <>Uma região <code>role=&quot;status&quot;</code>, com <code>aria-live=&quot;polite&quot;</code>, sempre montada: a mudança do texto é lida.</>, teste: 'SaveStatus.test.tsx' },
    { garantia: 'Sem região dupla', como: <>Na situação do <code>AppShell.PageFooter</code>, que já é uma região de status, não cria a sua: o texto é lido uma vez.</>, teste: 'SaveStatus.test.tsx' },
    { garantia: 'Indicador por estado', como: <>Spinner em <code>saving</code>, ícone de pronto em <code>saved</code> e de erro em <code>error</code>; <code>idle</code> e <code>dirty</code> só com texto. Todos decorativos.</>, teste: 'SaveStatus.test.tsx' },
    { garantia: 'Texto e tom', como: <>Tamanho de legenda, tom terciário; o ícone leva o tom de sucesso ou de perigo.</>, teste: 'SaveStatus.test.tsx' },
    { garantia: 'Propriedades nativas', como: <>Recebe as de <code>div</code>, <code>className</code> e o ref na raiz.</>, teste: 'SaveStatus.test.tsx' },
  ],
  notaDaApi: (
    <>
      <code>SaveStatus</code> só mostra a situação: quem salva, e quando, é o produto, que também escreve o texto. Além das abaixo, aceita as
      propriedades nativas de <code>div</code> e o ref.
    </>
  ),
  api: [
    { nome: 'status', tipo: "'idle' | 'dirty' | 'saving' | 'saved' | 'error'", padrao: "'idle'", descricao: 'A situação, que escolhe o indicador ao lado do texto.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'O texto da situação, como "Rascunho salvo às 10:42".' },
  ],
};
