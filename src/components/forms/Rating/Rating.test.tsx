import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Rating } from './Rating';

const NOMES = ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Ótimo'];

/** O jsdom nao tem PointerEvent: sem ele, `pointerType` nao chega ao componente. */
class PointerEventDoJsdom extends MouseEvent {
  readonly pointerType: string;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? '';
  }
}

beforeAll(() => {
  vi.stubGlobal('PointerEvent', PointerEventDoJsdom);
});
afterAll(() => {
  vi.unstubAllGlobals();
});

describe('Rating', () => {
  describe('exibição', () => {
    it('is an image named by the rating, the maximum and the count', () => {
      render(<Rating readOnly value={4.5} count={128} />);

      const imagem = screen.getByRole('img', { name: '4,5 de 5 estrelas, 128 avaliações' });
      expect(imagem).toHaveTextContent('4,5');
      expect(imagem).toHaveTextContent('(128)');
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    it('rounds the drawing to the nearest half star and writes the value with one decimal', () => {
      const { container } = render(<Rating readOnly value={4.6} />);
      const fills = [...container.querySelectorAll('[data-fill]')].map((estrela) => estrela.getAttribute('data-fill'));

      expect(fills).toEqual(['full', 'full', 'full', 'full', 'half']);
      expect(screen.getByRole('img', { name: '4,6 de 5 estrelas' })).toHaveTextContent('4,6');
    });

    it('says the singular for one rating and writes an integer without decimals', () => {
      render(<Rating readOnly value={3} count={1} />);

      expect(screen.getByRole('img', { name: '3 de 5 estrelas, 1 avaliação' })).toBeInTheDocument();
    });

    it('shows "Sem avaliações" as text for a null value, without empty stars that read as zero', () => {
      const { container } = render(<Rating readOnly value={null} />);

      expect(screen.getByText('Sem avaliações')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(container.querySelector('[data-fill]')).toBeNull();
    });

    it('draws one star and the number when compact', () => {
      const { container } = render(<Rating readOnly compact value={3.9} count={48} />);

      expect(container.querySelectorAll('[data-fill]')).toHaveLength(1);
      expect(screen.getByRole('img', { name: '3,9 de 5 estrelas, 48 avaliações' })).toHaveTextContent('3,9(48)');
    });

    it('lets the product replace the built name and the texts', () => {
      render(
        <>
          <Rating readOnly value={4} aria-label="Nota média 4" />
          <Rating readOnly value={null} labels={{ noRatings: 'Ainda sem notas' }} />
        </>,
      );

      expect(screen.getByRole('img', { name: 'Nota média 4' })).toBeInTheDocument();
      expect(screen.getByText('Ainda sem notas')).toBeInTheDocument();
    });

    it('hides the written value with showValue={false}, keeping it in the name', () => {
      render(<Rating readOnly value={4} showValue={false} />);

      expect(screen.getByRole('img', { name: '4 de 5 estrelas' })).not.toHaveTextContent('4');
    });
  });

  describe('entrada', () => {
    it('is a radio group named by the label, with one native radio per star', () => {
      render(<Rating label="Atendimento" defaultValue={null} />);

      const grupo = screen.getByRole('radiogroup', { name: 'Atendimento' });
      const radios = screen.getAllByRole('radio') as HTMLInputElement[];

      expect(grupo.tagName).toBe('FIELDSET');
      expect(radios).toHaveLength(5);
      expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual(['1 estrela', '2 estrelas', '3 estrelas', '4 estrelas', '5 estrelas']);
      expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
      expect(radios.some((radio) => radio.checked)).toBe(false);
      expect(screen.getByText('Sem nota')).toBeInTheDocument();
    });

    it('adds the name of each rating to the radio and to the written value', () => {
      render(<Rating label="Atendimento" defaultValue={4} valueLabels={NOMES} />);

      expect(screen.getByRole('radio', { name: '4 estrelas, Bom' })).toBeChecked();
      expect(screen.getByText('4 de 5 · Bom')).toBeInTheDocument();
    });

    it('changes the rating on click and reports it, without controlling it', () => {
      const onValueChange = vi.fn();
      render(<Rating label="Atendimento" onValueChange={onValueChange} />);

      fireEvent.click(screen.getByRole('radio', { name: '3 estrelas' }));

      expect(onValueChange).toHaveBeenCalledWith(3);
      expect(screen.getByRole('radio', { name: '3 estrelas' })).toBeChecked();
      expect(screen.getByText('3 de 5')).toBeInTheDocument();
    });

    it('follows the controlled value', () => {
      function Controlado() {
        const [nota, setNota] = useState<number | null>(2);
        return <Rating label="Atendimento" value={nota} onValueChange={(proxima) => setNota(proxima === 4 ? 5 : proxima)} />;
      }
      render(<Controlado />);

      fireEvent.click(screen.getByRole('radio', { name: '4 estrelas' }));

      expect(screen.getByRole('radio', { name: '5 estrelas' })).toBeChecked();
      expect(screen.getByRole('radio', { name: '4 estrelas' })).not.toBeChecked();
    });

    it('takes half stars with step 0.5: two radios per star, named with the decimal', () => {
      const onValueChange = vi.fn();
      const { container } = render(<Rating label="Atendimento" step={0.5} valueLabels={NOMES} onValueChange={onValueChange} />);
      const radios = screen.getAllByRole('radio');

      expect(radios).toHaveLength(10);
      expect(radios[6]).toHaveAccessibleName('3,5 estrelas');
      expect(radios[7]).toHaveAccessibleName('4 estrelas, Bom');

      fireEvent.click(radios[6]);

      expect(onValueChange).toHaveBeenCalledWith(3.5);
      expect(screen.getByText('3,5 de 5')).toBeInTheDocument();
      expect([...container.querySelectorAll('[data-fill]')].map((estrela) => estrela.getAttribute('data-fill'))).toEqual([
        'full',
        'full',
        'full',
        'half',
        'empty',
      ]);
    });

    it('clears the rating with clearable and returns the focus to the group', () => {
      const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        callback(0);
        return 0;
      });
      const onValueChange = vi.fn();
      render(<Rating label="Atendimento" clearable defaultValue={3} onValueChange={onValueChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Limpar nota' }));

      expect(onValueChange).toHaveBeenCalledWith(null);
      expect(screen.getAllByRole('radio').some((radio) => (radio as HTMLInputElement).checked)).toBe(false);
      expect(screen.queryByRole('button', { name: 'Limpar nota' })).not.toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '1 estrela' })).toHaveFocus();
      raf.mockRestore();
    });

    it('does not show the clear button without a rating', () => {
      render(<Rating label="Atendimento" clearable />);

      expect(screen.queryByRole('button', { name: 'Limpar nota' })).not.toBeInTheDocument();
    });

    it('previews the rating under the hovering pointer and reports it with onHover', () => {
      const onHover = vi.fn();
      const { container } = render(<Rating label="Atendimento" defaultValue={1} onHover={onHover} />);

      fireEvent.pointerEnter(screen.getByRole('radio', { name: '4 estrelas' }), { pointerType: 'mouse' });

      expect(onHover).toHaveBeenLastCalledWith(4);
      expect(screen.getByText('4 de 5')).toBeInTheDocument();
      expect(container.querySelectorAll('[data-fill="full"]')).toHaveLength(4);

      fireEvent.pointerLeave(container.querySelector('[class*="stars"]')!);

      expect(onHover).toHaveBeenLastCalledWith(null);
      expect(screen.getByText('1 de 5')).toBeInTheDocument();
    });

    it('does not preview on touch', () => {
      const onHover = vi.fn();
      render(<Rating label="Atendimento" onHover={onHover} />);

      fireEvent.pointerEnter(screen.getByRole('radio', { name: '4 estrelas' }), { pointerType: 'touch' });

      expect(onHover).not.toHaveBeenCalled();
    });

    it('ties the hint and the error to the group, and marks it required and invalid', () => {
      const { rerender } = render(<Rating label="Atendimento" hint="De 1 a 5." required />);
      const grupo = screen.getByRole('radiogroup', { name: /Atendimento/ });

      expect(grupo).toHaveAccessibleDescription('De 1 a 5.');
      expect(grupo).toHaveAttribute('aria-required', 'true');
      expect(screen.getAllByRole('radio').every((radio) => (radio as HTMLInputElement).required)).toBe(true);

      rerender(<Rating label="Atendimento" error="Escolha uma nota de 1 a 5." required />);

      expect(grupo).toHaveAttribute('aria-invalid', 'true');
      expect(grupo).toHaveAccessibleDescription('Escolha uma nota de 1 a 5.');
      expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma nota de 1 a 5.');
    });

    it('disables every radio and hides the clear button', () => {
      render(<Rating label="Atendimento" defaultValue={2} clearable disabled />);

      expect(screen.getAllByRole('radio').every((radio) => (radio as HTMLInputElement).disabled)).toBe(true);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('sends the rating in the form data through the native radios', () => {
      render(
        <form data-testid="formulario">
          <Rating label="Atendimento" name="nota" defaultValue={4} />
        </form>,
      );

      expect(new FormData(screen.getByTestId('formulario') as HTMLFormElement).get('nota')).toBe('4');
    });

    it('restores the default value when the form is reset', async () => {
      render(
        <form data-testid="formulario">
          <Rating label="Atendimento" defaultValue={2} />
        </form>,
      );

      fireEvent.click(screen.getByRole('radio', { name: '5 estrelas' }));
      await act(async () => {
        (screen.getByTestId('formulario') as HTMLFormElement).reset();
      });

      expect(screen.getByRole('radio', { name: '2 estrelas' })).toBeChecked();
    });

    it('draws a custom icon in both layers, full and empty', () => {
      const { container } = render(<Rating label="Atendimento" defaultValue={2} max={3} icon={<svg data-testid="coracao" />} />);

      expect(screen.getAllByTestId('coracao')).toHaveLength(5);
      expect(container.querySelectorAll('[data-fill="full"]')).toHaveLength(2);
    });
  });

  describe('avisos em desenvolvimento', () => {
    it('clamps max between 3 and 10 and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Rating label="Atendimento" max={12} />);

      expect(screen.getAllByRole('radio')).toHaveLength(10);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`max` aceita inteiros de 3 a 10'));
      warn.mockRestore();
    });

    it('drops value names of the wrong length and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Rating label="Atendimento" valueLabels={['Ruim', 'Bom']} />);

      expect(screen.getByRole('radio', { name: '1 estrela' })).toBeInTheDocument();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`valueLabels` tem 2 nomes para 5 notas'));
      warn.mockRestore();
    });

    it('warns when a prop of the other mode is passed', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const exibicao = { readOnly: true, value: 4, clearable: true } as unknown as Parameters<typeof Rating>[0];
      render(<Rating {...exibicao} />);

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`clearable` só se aplica à entrada'));
      warn.mockRestore();
    });

    it('warns when the group has no name', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Rating />);

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Rating: grupo sem nome acessível'));
      warn.mockRestore();
    });
  });
});
