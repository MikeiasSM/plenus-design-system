import { useEffect, useRef, useState } from 'react';
import {
  AnnotatedSection,
  AppShell,
  Badge,
  Button,
  Card,
  Grid,
  InputCurrency,
  InputText,
  PageHeader,
  SaveStatus,
  SegmentedControl,
  Select,
  showToast,
  Switch,
  Textarea,
} from '@plenustech/design-system';
import { CAMINHO_DAS_COMPOSICOES } from '../menu';
import { VENDEDORES } from '../dados';
import { Coluna, Pagina } from '../Pagina';

interface Cliente {
  bairro: string;
  bloquear: boolean;
  cargo: string;
  cep: string;
  cidade: string;
  contato: string;
  documento: string;
  email: string;
  limite: number | null;
  logradouro: string;
  numero: string;
  observacoes: string;
  prazo: string;
  razao: string;
  tabela: string;
  telefone: string;
  tipo: string;
  uf: string;
  vendedor: string;
}

const VAZIO: Cliente = {
  tipo: 'PJ',
  documento: '',
  razao: '',
  email: '',
  telefone: '',
  contato: '',
  cargo: '',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: 'BA',
  limite: null,
  prazo: '28 dias',
  tabela: 'Varejo',
  vendedor: VENDEDORES[0],
  bloquear: true,
  observacoes: '',
};

const opcoes = (valores: readonly string[]) => valores.map((valor) => ({ label: valor, value: valor }));

type Rascunho = { estado: 'vazio' } | { estado: 'salvando' } | { estado: 'salvo'; hora: string };

const horaAgora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function NovoCliente() {
  const [cliente, setCliente] = useState<Cliente>(VAZIO);
  const [rascunho, setRascunho] = useState<Rascunho>({ estado: 'vazio' });
  const [erroDaRazao, setErroDaRazao] = useState<string>();
  const esperaDoRascunho = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pessoaJuridica = cliente.tipo === 'PJ';

  useEffect(() => () => clearTimeout(esperaDoRascunho.current), []);

  function alterar(proximo: Cliente) {
    setCliente(proximo);
    setRascunho({ estado: 'salvando' });
    clearTimeout(esperaDoRascunho.current);
    esperaDoRascunho.current = setTimeout(() => setRascunho({ estado: 'salvo', hora: horaAgora() }), 600);
  }

  const texto = (campo: keyof Cliente) => ({
    onValueChange: (valor: string) => alterar({ ...cliente, [campo]: valor }),
    value: cliente[campo] as string,
  });

  function salvarCliente() {
    if (!cliente.razao.trim()) {
      setErroDaRazao(`Informe ${pessoaJuridica ? 'a razão social' : 'o nome completo'}.`);
      return;
    }
    showToast({ title: 'Cliente salvo', description: `${cliente.razao} entrou na Base de Clientes.`, tone: 'success' });
    setErroDaRazao(undefined);
    clearTimeout(esperaDoRascunho.current);
    setCliente(VAZIO);
    setRascunho({ estado: 'vazio' });
  }

  const situacao = {
    vazio: <SaveStatus>Nenhuma alteração ainda</SaveStatus>,
    salvando: <SaveStatus status="saving">Salvando rascunho…</SaveStatus>,
    salvo: rascunho.estado === 'salvo' && <SaveStatus status="saved">Rascunho salvo às {rascunho.hora}</SaveStatus>,
  }[rascunho.estado];

  return (
    <Pagina
      caminho={['Clientes', 'Novo cliente']}
      rodape={
        <AppShell.PageFooter status={situacao}>
          <Button onClick={() => { window.location.hash = `${CAMINHO_DAS_COMPOSICOES}/clientes-base`; }} variant="secondary">
            Cancelar
          </Button>
          <Button onClick={salvarCliente} variant="primary">Salvar cliente</Button>
        </AppShell.PageFooter>
      }
    >
      <PageHeader maxWidth="1120px">
        <PageHeader.Back href={`${CAMINHO_DAS_COMPOSICOES}/clientes-base`} label="Voltar para Base de Clientes" />
        <PageHeader.Title>Novo cliente</PageHeader.Title>
        <PageHeader.Badges>
          <Badge tone="neutral">Rascunho</Badge>
        </PageHeader.Badges>
        <PageHeader.Description>Cadastro completo, por assunto. O rascunho é salvo sozinho.</PageHeader.Description>
      </PageHeader>
      <Coluna largura={1120}>
        <AnnotatedSection description="Como o cliente aparece nos pedidos e nas notas fiscais." title="Identificação">
          <Card>
            <Card.Body>
            <Grid columns={2} minColumnWidth={252}>
              <SegmentedControl
                items={[{ label: 'Jurídica', value: 'PJ' }, { label: 'Física', value: 'PF' }]}
                label="Tipo de pessoa"
                onValueChange={(tipo) => alterar({ ...cliente, tipo })}
                value={cliente.tipo}
              />
              <InputText inputMode="numeric" label={pessoaJuridica ? 'CNPJ' : 'CPF'} required {...texto('documento')} />
              <InputText error={erroDaRazao} label={pessoaJuridica ? 'Razão social' : 'Nome completo'} required {...texto('razao')} />
            </Grid>
            </Card.Body>
          </Card>
        </AnnotatedSection>
        <AnnotatedSection description="Quem recebe orçamentos, boletos e avisos de entrega." title="Contato">
          <Card>
            <Card.Body>
            <Grid columns={2} minColumnWidth={252}>
              <InputText label="E-mail" type="email" {...texto('email')} />
              <InputText inputMode="tel" label="Telefone" {...texto('telefone')} />
              <InputText label="Pessoa de contato" {...texto('contato')} />
              <InputText label="Cargo" {...texto('cargo')} />
            </Grid>
            </Card.Body>
          </Card>
        </AnnotatedSection>
        <AnnotatedSection description="Usado na entrega e na emissão da nota fiscal." title="Endereço">
          <Card>
            <Card.Body>
            <Grid columns={2} minColumnWidth={252}>
              <InputText inputMode="numeric" label="CEP" {...texto('cep')} />
              <InputText label="Logradouro" {...texto('logradouro')} />
              <InputText label="Número" {...texto('numero')} />
              <InputText label="Bairro" {...texto('bairro')} />
              <InputText label="Cidade" {...texto('cidade')} />
              <Select label="UF" onValueChange={(uf) => alterar({ ...cliente, uf })} options={opcoes(['BA', 'GO', 'MG', 'PR', 'SP'])} value={cliente.uf} />
            </Grid>
            </Card.Body>
          </Card>
        </AnnotatedSection>
        <AnnotatedSection description="Limite, prazo e tabela de preço que valem para os próximos pedidos." title="Condições comerciais">
          <Card>
            <Card.Body>
            <Grid columns={2} minColumnWidth={252}>
              <InputCurrency label="Limite de crédito" onValueChange={(limite) => alterar({ ...cliente, limite })} value={cliente.limite} />
              <Select label="Prazo padrão" onValueChange={(prazo) => alterar({ ...cliente, prazo })} options={opcoes(['À vista', '14 dias', '28 dias', '28/56 dias'])} value={cliente.prazo} />
              <Select label="Tabela de preço" onValueChange={(tabela) => alterar({ ...cliente, tabela })} options={opcoes(['Varejo', 'Atacado', 'Frotista'])} value={cliente.tabela} />
              <Select label="Vendedor responsável" onValueChange={(vendedor) => alterar({ ...cliente, vendedor })} options={opcoes(VENDEDORES)} value={cliente.vendedor} />
              <Switch
                checked={cliente.bloquear}
                hint="Recomendado"
                label="Bloquear venda com atraso"
                onCheckedChange={(bloquear) => alterar({ ...cliente, bloquear })}
              />
            </Grid>
            </Card.Body>
          </Card>
        </AnnotatedSection>
        <AnnotatedSection description="Anotações internas. O cliente não vê." title="Observações">
          <Card>
            <Card.Body>
            <Textarea label="Observações" {...texto('observacoes')} />
            </Card.Body>
          </Card>
        </AnnotatedSection>
      </Coluna>
    </Pagina>
  );
}
