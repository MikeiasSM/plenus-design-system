import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { IconSearch } from '../../icons';
import { SegmentedControl } from './SegmentedControl';

const periodos = [
  { label: 'Dia', value: 'dia' },
  { label: 'Semana', value: 'semana' },
  { disabled: true, label: 'Mes', value: 'mes' },
];

describe('SegmentedControl', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('e um grupo de radios nomeado, com o valor inicial marcado', () => {
    render(<SegmentedControl defaultValue="semana" items={periodos} label="Periodo" />);

    expect(screen.getByRole('radiogroup', { name: 'Periodo' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Semana' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Mes' })).toBeDisabled();
  });

  it('controlado, avisa a escolha e segue o valor recebido', () => {
    const onValueChange = vi.fn();
    function Periodo() {
      const [value, setValue] = useState('dia');
      return (
        <SegmentedControl
          items={periodos}
          label="Periodo"
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
          value={value}
        />
      );
    }
    render(<Periodo />);

    fireEvent.click(screen.getByRole('radio', { name: 'Semana' }));

    expect(onValueChange).toHaveBeenCalledWith('semana');
    expect(screen.getByRole('radio', { name: 'Semana' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dia' })).not.toBeChecked();
  });

  it('so com icones, o label continua sendo o nome e aparece como dica no foco', () => {
    vi.useFakeTimers();
    render(
      <SegmentedControl
        iconOnly
        items={[
          { icon: <IconSearch />, label: 'Ver em lista', value: 'lista' },
          { icon: <IconSearch />, label: 'Ver em cartoes', value: 'cartoes' },
        ]}
        label="Visao"
      />,
    );

    act(() => {
      fireEvent.keyDown(document.body, { key: 'Tab' });
      screen.getByRole('radio', { name: 'Ver em cartoes' }).focus();
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent('Ver em cartoes');
  });

  it('envia o valor escolhido no formulario pelo name', () => {
    render(
      <form data-testid="form">
        <SegmentedControl defaultValue="dia" items={periodos} label="Periodo" name="periodo" />
      </form>,
    );

    const dados = new FormData(screen.getByTestId('form') as HTMLFormElement);
    expect(dados.get('periodo')).toBe('dia');
  });

  describe('por item', () => {
    it('soma a className ao segmento e marca o escolhido e o desabilitado', () => {
      render(
        <SegmentedControl
          defaultValue="semana"
          items={periodos.map((item) => ({ ...item, className: `seg-${item.value}` }))}
          label="Periodo"
        />,
      );

      const semana = screen.getByRole('radio', { name: 'Semana' }).closest('label');
      const dia = screen.getByRole('radio', { name: 'Dia' }).closest('label');
      const mes = screen.getByRole('radio', { name: 'Mes' }).closest('label');
      expect(semana).toHaveClass('seg-semana');
      expect(semana?.className).toMatch(/segment/);
      expect(semana).toHaveAttribute('data-selected', 'true');
      expect(dia).not.toHaveAttribute('data-selected');
      expect(mes).toHaveAttribute('data-disabled', 'true');
      expect(dia).not.toHaveAttribute('data-disabled');
    });

    it('o data-selected acompanha a escolha sem controle', () => {
      render(<SegmentedControl defaultValue="dia" items={periodos} label="Periodo" />);

      fireEvent.click(screen.getByRole('radio', { name: 'Semana' }));

      expect(screen.getByRole('radio', { name: 'Semana' }).closest('label')).toHaveAttribute('data-selected', 'true');
      expect(screen.getByRole('radio', { name: 'Dia' }).closest('label')).not.toHaveAttribute('data-selected');
    });

    it('o trailing aparece depois do rotulo e fica fora do nome', () => {
      render(
        <SegmentedControl
          items={[
            { label: 'Abertos', trailing: '12', value: 'abertos' },
            { label: 'Fechados', value: 'fechados' },
          ]}
          label="Situacao"
        />,
      );

      const radio = screen.getByRole('radio', { name: 'Abertos' });
      const trailing = screen.getByText('12');
      expect(trailing).toHaveAttribute('aria-hidden', 'true');
      expect(radio.closest('label')?.lastElementChild).toBe(trailing);
    });

    it('a description descreve o radio por aria-describedby, sem entrar no nome', () => {
      render(
        <SegmentedControl
          items={[
            { description: 'Ultimos 7 dias corridos', label: 'Semana', value: 'semana' },
            { label: 'Dia', value: 'dia' },
          ]}
          label="Periodo"
        />,
      );

      const semana = screen.getByRole('radio', { name: 'Semana' });
      expect(semana).toHaveAccessibleDescription('Ultimos 7 dias corridos');
      expect(screen.getByRole('radio', { name: 'Dia' })).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('rolagem', () => {
    function caixa(left: number, width: number) {
      return { bottom: 0, height: 0, left, right: left + width, top: 0, width, x: left, y: 0, toJSON: () => ({}) } as DOMRect;
    }

    it('traz o escolhido a vista ao montar e ao mudar, rolando so o proprio controle', () => {
      const original = HTMLElement.prototype.getBoundingClientRect;
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
        if (this.getAttribute('role') === 'radiogroup') {
          return caixa(0, 100);
        }
        const radio = this.querySelector('input');
        const controle = this.closest<HTMLElement>('[role="radiogroup"]');
        // Posicao de cada segmento no conteudo do controle, deslocada pela rolagem dele.
        const posicoes: Record<string, number> = { dia: 0, semana: 150, mes: 300 };
        return radio && controle ? caixa(posicoes[radio.value] - controle.scrollLeft, 60) : original.call(this);
      };
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 100 });

      try {
        const { rerender } = render(
          <div data-testid="ancestral">
            <SegmentedControl items={periodos.map((item) => ({ ...item, disabled: false }))} label="Periodo" value="semana" />
          </div>,
        );
        const controle = screen.getByRole('radiogroup');
        const ancestral = screen.getByTestId('ancestral');

        expect(controle.scrollLeft).toBe(110);

        rerender(
          <div data-testid="ancestral">
            <SegmentedControl items={periodos.map((item) => ({ ...item, disabled: false }))} label="Periodo" value="mes" />
          </div>,
        );
        expect(controle.scrollLeft).toBe(260);
        expect(ancestral.scrollLeft).toBe(0);
        expect(scrollIntoView).not.toHaveBeenCalled();
      } finally {
        HTMLElement.prototype.getBoundingClientRect = original;
        delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
      }
    });
  });
});

