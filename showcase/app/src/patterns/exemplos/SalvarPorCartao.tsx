import { useEffect, useRef, useState } from 'react';
import { Button, Card, InputText, SaveStatus, Stack } from '@plenustech/design-system';

const INICIAL = { nome: 'Loja Centro', responsavel: 'Paula Nogueira' };

export function SalvarPorCartao() {
  const [salvoEm, setSalvoEm] = useState(INICIAL);
  const [valores, setValores] = useState(INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [acabouDeSalvar, setAcabouDeSalvar] = useState(false);
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Salvo ou descartado, os botões desabilitam: o foco volta ao primeiro campo, e não cai no começo da página.
  const primeiroCampo = useRef<HTMLInputElement>(null);
  const alterado = valores.nome !== salvoEm.nome || valores.responsavel !== salvoEm.responsavel;

  useEffect(() => () => clearTimeout(espera.current), []);

  // Os campos ficam desabilitados enquanto salva: o foco só volta depois que eles reabilitam.
  useEffect(() => {
    if (acabouDeSalvar) {
      primeiroCampo.current?.focus();
    }
  }, [acabouDeSalvar]);

  function alterar(parcial: Partial<typeof INICIAL>) {
    setValores({ ...valores, ...parcial });
    setAcabouDeSalvar(false);
  }

  function salvar() {
    setSalvando(true);
    // No produto, é aqui que a requisição vai; a situação segue o resultado dela.
    espera.current = setTimeout(() => {
      setSalvoEm(valores);
      setSalvando(false);
      setAcabouDeSalvar(true);
    }, 800);
  }

  return (
    <Card>
      <Card.Header description="Como a loja aparece para a equipe." headingLevel={2} title="Dados da loja" />
      <Card.Body>
        <Stack>
          <InputText disabled={salvando} label="Nome" onValueChange={(nome) => alterar({ nome })} ref={primeiroCampo} value={valores.nome} />
          <InputText disabled={salvando} label="Responsável" onValueChange={(responsavel) => alterar({ responsavel })} value={valores.responsavel} />
        </Stack>
      </Card.Body>
      <Card.Footer
        start={
          salvando ? (
            <SaveStatus status="saving">Salvando…</SaveStatus>
          ) : alterado ? (
            <SaveStatus status="dirty">Alterações não salvas</SaveStatus>
          ) : acabouDeSalvar ? (
            <SaveStatus status="saved">Alterações salvas</SaveStatus>
          ) : (
            <SaveStatus status="idle">Sem alterações</SaveStatus>
          )
        }
      >
        <Button
          disabled={!alterado || salvando}
          onClick={() => {
            setValores(salvoEm);
            primeiroCampo.current?.focus();
          }}
          size="sm"
          variant="secondary"
        >
          Descartar
        </Button>
        <Button disabled={!alterado} loading={salvando} onClick={salvar} size="sm">Salvar</Button>
      </Card.Footer>
    </Card>
  );
}
