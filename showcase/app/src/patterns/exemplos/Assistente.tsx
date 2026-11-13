import { useRef, useState } from 'react';
import { Alert, Button, Card, EmptyState, IconCheckCircle, InputText, Radio, RadioGroup, Stack, Steps, Text } from '@plenustech/design-system';

const ETAPAS = [
  { key: 'dados', label: 'Dados', titulo: 'Dê um nome ao projeto', explicacao: 'É assim que ele aparece na lista de projetos.' },
  { key: 'acesso', label: 'Acesso', titulo: 'Quem pode ver o projeto', explicacao: 'Dá para mudar depois, nos ajustes do projeto.' },
  { key: 'revisao', label: 'Revisão', titulo: 'Revise e conclua', explicacao: 'Confira o resumo antes de criar o projeto.' },
];

const ACESSOS = { equipe: 'Toda a equipe', convidados: 'Só convidados' };

export function Assistente() {
  const [etapa, setEtapa] = useState('dados');
  const [nome, setNome] = useState('');
  const [acesso, setAcesso] = useState<keyof typeof ACESSOS>('equipe');
  const [concluido, setConcluido] = useState(false);
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false);
  const proximo = useRef<HTMLButtonElement>(null);
  // Ao retomar o processo, o cartão volta ao lugar: o foco vai ao campo da etapa, ou ao Próximo.
  const [retomado, setRetomado] = useState(false);

  const indice = ETAPAS.findIndex((candidata) => candidata.key === etapa);
  const atual = ETAPAS[indice];
  const ultima = indice === ETAPAS.length - 1;
  const nomeValido = /\p{L}/u.test(nome);

  if (concluido || rascunhoSalvo) {
    return (
      <Card>
        <Card.Body>
          {concluido ? (
            <EmptyState
              actions={
                <Button
                  // O cartão do processo saiu: o foco vai à ação do sucesso, e não cai no começo da página.
                  autoFocus
                  onClick={() => {
                    setConcluido(false);
                    setEtapa('dados');
                    setNome('');
                    setRetomado(true);
                  }}
                  variant="secondary"
                >
                  Criar outro projeto
                </Button>
              }
              description="Ele já aparece na lista de projetos."
              icon={<IconCheckCircle />}
              title={`Projeto “${nome}” criado`}
            />
          ) : (
            <EmptyState
              actions={
                <Button
                  autoFocus
                  onClick={() => {
                    setRascunhoSalvo(false);
                    setRetomado(true);
                  }}
                >
                  Continuar de onde parei
                </Button>
              }
              description="Você volta a este ponto quando quiser."
              icon={<IconCheckCircle />}
              title="Rascunho salvo"
            />
          )}
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Body>
        {/* O indicador só mostra o ponto do processo: quem move é o Voltar e o Próximo, no rodapé. */}
        <Steps current={etapa} items={ETAPAS} label="Etapas da criação do projeto" />
      </Card.Body>
      <Card.Header description={atual.explicacao} headingLevel={2} title={atual.titulo} />
      <Card.Body>
        {etapa === 'dados' && (
          <InputText autoFocus={retomado} hint="Pelo menos uma letra." label="Nome do projeto" onValueChange={setNome} required value={nome} />
        )}
        {etapa === 'acesso' && (
          <RadioGroup label="Acesso" onValueChange={(valor) => setAcesso(valor as keyof typeof ACESSOS)} orientation="horizontal" value={acesso}>
            <Radio label={ACESSOS.equipe} value="equipe" />
            <Radio label={ACESSOS.convidados} value="convidados" />
          </RadioGroup>
        )}
        {etapa === 'revisao' && (
          <Stack>
            <Text as="p">
              {nome}, com acesso para: {ACESSOS[acesso].toLowerCase()}.
            </Text>
            <Alert tone="info">Depois de criado, o projeto aparece na lista de todos que têm acesso.</Alert>
          </Stack>
        )}
      </Card.Body>
      {/* A saída fica à esquerda; voltar e avançar, à direita, sempre no mesmo lugar. */}
      <Card.Footer start={<Button onClick={() => setRascunhoSalvo(true)} variant="ghost">Salvar e sair</Button>}>
        <Button
          disabled={indice === 0}
          onClick={() => {
            // Na primeira etapa, o Voltar desabilita: o foco passa ao Próximo, que está ao lado.
            if (indice === 1) {
              proximo.current?.focus();
            }
            setEtapa(ETAPAS[indice - 1].key);
          }}
          variant="secondary"
        >
          Voltar
        </Button>
        <Button
          disabled={etapa === 'dados' && !nomeValido}
          onClick={() => (ultima ? setConcluido(true) : setEtapa(ETAPAS[indice + 1].key))}
          autoFocus={retomado && etapa !== 'dados'}
          ref={proximo}
        >
          {ultima ? 'Criar projeto' : 'Próximo'}
        </Button>
      </Card.Footer>
    </Card>
  );
}
