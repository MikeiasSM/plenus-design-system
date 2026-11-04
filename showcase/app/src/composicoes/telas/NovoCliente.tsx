import { useState } from 'react';
import {
  Badge,
  Card,
  InputCurrency,
  InputText,
  PageHeader,
  SaveBar,
  SegmentedControl,
  Select,
  Switch,
  Textarea,
} from '@plenustech/design-system';
import { CAMINHO_DAS_COMPOSICOES } from '../menu';
import { VENDEDORES } from '../dados';
import { Anotacao, Coluna, Pagina } from '../Pagina';

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

export function NovoCliente() {
  const [cliente, setCliente] = useState<Cliente>({ ...VAZIO, razao: 'Auto Peças Boa Viagem Ltda', documento: '12.345.678/0001-95' });
  const alterado = JSON.stringify(cliente) !== JSON.stringify(VAZIO);
  const pessoaJuridica = cliente.tipo === 'PJ';

  const texto = (campo: keyof Cliente) => ({
    onValueChange: (valor: string) => setCliente({ ...cliente, [campo]: valor }),
    value: cliente[campo] as string,
  });

  return (
    <Pagina caminho={['Clientes', 'Novo cliente']}>
      <SaveBar
        discardLabel="Cancelar"
        message="Rascunho com alterações não salvas"
        onDiscard={() => setCliente(VAZIO)}
        onSave={() => setCliente(VAZIO)}
        open={alterado}
        saveLabel="Salvar cliente"
      />
      <PageHeader maxWidth="1120px">
        <PageHeader.Back href={`${CAMINHO_DAS_COMPOSICOES}/clientes-base`} label="Voltar para Base de Clientes" />
        <PageHeader.Title>Novo cliente</PageHeader.Title>
        <PageHeader.Badges>
          <Badge tone="neutral">Rascunho</Badge>
        </PageHeader.Badges>
        <PageHeader.Description>Cadastro completo, por assunto.</PageHeader.Description>
      </PageHeader>
      <Coluna className="anotado" largura={1120}>
        <Anotacao explicacao="Como o cliente aparece nos pedidos e nas notas fiscais." titulo="Identificação">
          <Card.Body>
          <div className="campos campos-2">
            <SegmentedControl
              items={[{ label: 'Jurídica', value: 'PJ' }, { label: 'Física', value: 'PF' }]}
              label="Tipo de pessoa"
              onValueChange={(tipo) => setCliente({ ...cliente, tipo })}
              value={cliente.tipo}
            />
            <InputText inputMode="numeric" label={pessoaJuridica ? 'CNPJ' : 'CPF'} required {...texto('documento')} />
            <InputText label={pessoaJuridica ? 'Razão social' : 'Nome completo'} required {...texto('razao')} />
          </div>
          </Card.Body>
        </Anotacao>
        <Anotacao explicacao="Quem recebe orçamentos, boletos e avisos de entrega." titulo="Contato">
          <Card.Body>
          <div className="campos campos-2">
            <InputText label="E-mail" type="email" {...texto('email')} />
            <InputText inputMode="tel" label="Telefone" {...texto('telefone')} />
            <InputText label="Pessoa de contato" {...texto('contato')} />
            <InputText label="Cargo" {...texto('cargo')} />
          </div>
          </Card.Body>
        </Anotacao>
        <Anotacao explicacao="Usado na entrega e na emissão da nota fiscal." titulo="Endereço">
          <Card.Body>
          <div className="campos campos-2">
            <InputText inputMode="numeric" label="CEP" {...texto('cep')} />
            <InputText label="Logradouro" {...texto('logradouro')} />
            <InputText label="Número" {...texto('numero')} />
            <InputText label="Bairro" {...texto('bairro')} />
            <InputText label="Cidade" {...texto('cidade')} />
            <Select label="UF" onValueChange={(uf) => setCliente({ ...cliente, uf })} options={opcoes(['BA', 'GO', 'MG', 'PR', 'SP'])} value={cliente.uf} />
          </div>
          </Card.Body>
        </Anotacao>
        <Anotacao explicacao="Limite, prazo e tabela de preço que valem para os próximos pedidos." titulo="Condições comerciais">
          <Card.Body>
          <div className="campos campos-2">
            <InputCurrency label="Limite de crédito" onValueChange={(limite) => setCliente({ ...cliente, limite })} value={cliente.limite} />
            <Select label="Prazo padrão" onValueChange={(prazo) => setCliente({ ...cliente, prazo })} options={opcoes(['À vista', '14 dias', '28 dias', '28/56 dias'])} value={cliente.prazo} />
            <Select label="Tabela de preço" onValueChange={(tabela) => setCliente({ ...cliente, tabela })} options={opcoes(['Varejo', 'Atacado', 'Frotista'])} value={cliente.tabela} />
            <Select label="Vendedor responsável" onValueChange={(vendedor) => setCliente({ ...cliente, vendedor })} options={opcoes(VENDEDORES)} value={cliente.vendedor} />
            <Switch
              checked={cliente.bloquear}
              hint="Recomendado"
              label="Bloquear venda com atraso"
              onCheckedChange={(bloquear) => setCliente({ ...cliente, bloquear })}
            />
          </div>
          </Card.Body>
        </Anotacao>
        <Anotacao explicacao="Anotações internas. O cliente não vê." titulo="Observações">
          <Card.Body>
          <Textarea label="Observações" {...texto('observacoes')} />
          </Card.Body>
        </Anotacao>
      </Coluna>
    </Pagina>
  );
}
